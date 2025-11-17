import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { AudioRecording, AudioEncoding } from 'expo-audio-stream';
import * as FileSystem from 'expo-file-system';

let isRecording = false;
let recordingSubscription = null;
let onChunkCallback = null;

// Web-specific variables
let mediaRecorder = null;
let mediaStream = null;

/**
 * Request audio recording permissions
 * @returns {Promise<boolean>} True if granted
 */
export async function requestAudioPermissions() {
  try {
    console.log('Requesting audio permissions...');

    if (Platform.OS === 'web') {
      // For web, use navigator API
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } else {
      // For native platforms, use expo-av permissions
      const { status } = await Audio.requestPermissionsAsync();
      console.log('Audio permission status:', status);
      return status === 'granted';
    }
  } catch (error) {
    console.error('Error requesting audio permissions:', error);
    return false;
  }
}

/**
 * Initialize audio mode for recording
 */
export async function initializeAudioMode() {
  try {
    if (Platform.OS !== 'web') {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    }
    console.log('Audio mode initialized');
  } catch (error) {
    console.error('Error initializing audio mode:', error);
    throw error;
  }
}

/**
 * Start continuous recording with 10-second chunks
 * @param {Function} onChunk - Callback function (chunk) => void
 * @returns {Promise<void>}
 */
export async function startContinuousRecording(onChunk) {
  try {
    if (isRecording) {
      console.log('Already recording, stopping previous recording');
      await stopContinuousRecording();
    }

    console.log('Starting continuous recording...');
    onChunkCallback = onChunk;

    if (Platform.OS === 'web') {
      await startWebRecording();
    } else {
      await startNativeRecording();
    }

    isRecording = true;
    console.log('Continuous recording started');
  } catch (error) {
    console.error('Error starting continuous recording:', error);
    isRecording = false;
    throw error;
  }
}

/**
 * WEB: Start continuous recording with MediaRecorder
 */
async function startWebRecording() {
  const CHUNK_INTERVAL = 10000; // 10 seconds

  // Get media stream
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      sampleRate: 16000,
      echoCancellation: true,
      noiseSuppression: true,
    }
  });

  // Create MediaRecorder with optimal settings for Whisper
  const options = { mimeType: 'audio/webm;codecs=opus' };
  mediaRecorder = new MediaRecorder(mediaStream, options);

  let chunkStartTime = Date.now();

  // Handle data available events (fired every CHUNK_INTERVAL ms)
  mediaRecorder.ondataavailable = async (event) => {
    if (event.data && event.data.size > 0) {
      console.log(`Web chunk available: ${event.data.size} bytes at ${chunkStartTime}`);

      try {
        // Convert blob to file
        const blob = event.data;
        const uri = await blobToDataURI(blob);

        // Call the callback with the chunk
        if (onChunkCallback) {
          onChunkCallback({
            uri,
            startTime: chunkStartTime,
            mimeType: 'audio/webm',
            blob,
          });
        }

        // Update start time for next chunk
        chunkStartTime = Date.now();
      } catch (error) {
        console.error('Error processing web chunk:', error);
      }
    }
  };

  mediaRecorder.onerror = (event) => {
    console.error('MediaRecorder error:', event.error);
  };

  mediaRecorder.onstop = () => {
    console.log('MediaRecorder stopped');
  };

  // Start recording with timeslice (emits data every CHUNK_INTERVAL ms)
  mediaRecorder.start(CHUNK_INTERVAL);
  console.log('Web MediaRecorder started with timeslice:', CHUNK_INTERVAL);
}

/**
 * NATIVE: Start continuous recording with expo-audio-stream
 */
async function startNativeRecording() {
  const CHUNK_INTERVAL = 10000; // 10 seconds in milliseconds
  let currentChunkData = [];
  let chunkStartTime = Date.now();

  // Start recording with expo-audio-stream
  const config = {
    sampleRate: 16000, // 16kHz is optimal for Whisper
    channels: 1, // Mono
    encoding: AudioEncoding.PCM_16BIT,
    interval: 500, // Get chunks every 500ms to buffer into 10s segments
  };

  const { status } = await AudioRecording.startRecordingAsync(config);

  if (status) {
    // Subscribe to audio stream events
    recordingSubscription = AudioRecording.addAudioEventListener((event) => {
      // Buffer chunks into 10-second segments
      currentChunkData.push({
        data: event.data, // base64 PCM data
        position: event.position,
        size: event.eventDataSize,
      });

      const elapsedTime = Date.now() - chunkStartTime;

      // When we've accumulated 10 seconds of data
      if (elapsedTime >= CHUNK_INTERVAL) {
        console.log(`Native chunk ready: ${currentChunkData.length} segments, ${elapsedTime}ms`);

        // Convert accumulated PCM data to audio file
        processNativeChunk(currentChunkData, chunkStartTime)
          .then(chunkInfo => {
            if (onChunkCallback && chunkInfo) {
              onChunkCallback(chunkInfo);
            }
          })
          .catch(err => console.error('Error processing native chunk:', err));

        // Reset for next chunk
        currentChunkData = [];
        chunkStartTime = Date.now();
      }
    });
  }
}

/**
 * Helper: Convert blob to data URI for web
 */
async function blobToDataURI(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * NATIVE: Process accumulated PCM chunks into a single audio file
 * @param {Array} chunkData - Array of audio chunk objects
 * @param {number} startTime - Start timestamp
 * @returns {Promise<{uri: string, startTime: number}>}
 */
async function processNativeChunk(chunkData, startTime) {
  try {
    if (chunkData.length === 0) {
      return null;
    }

    // Combine all base64 data
    const combinedBase64 = chunkData.map(c => c.data).join('');

    // Create a temporary file
    const fileUri = `${FileSystem.cacheDirectory}audio_chunk_${startTime}.wav`;

    // Write the PCM data as WAV file
    await FileSystem.writeAsStringAsync(fileUri, combinedBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log(`Native chunk saved to: ${fileUri}`);

    return {
      uri: fileUri,
      startTime,
      mimeType: 'audio/wav',
    };
  } catch (error) {
    console.error('Error processing native chunk:', error);
    return null;
  }
}

/**
 * Stop continuous recording
 * @returns {Promise<void>}
 */
export async function stopContinuousRecording() {
  try {
    if (!isRecording) {
      console.log('No active continuous recording to stop');
      return;
    }

    console.log('Stopping continuous recording...');

    if (Platform.OS === 'web') {
      // Stop web recording
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }

      // Stop all media stream tracks
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
      }

      mediaRecorder = null;
    } else {
      // Stop native recording
      if (recordingSubscription) {
        recordingSubscription.remove();
        recordingSubscription = null;
      }

      await AudioRecording.stopRecordingAsync();
    }

    isRecording = false;
    onChunkCallback = null;

    console.log('Continuous recording stopped');
  } catch (error) {
    console.error('Error stopping continuous recording:', error);
    isRecording = false;
    recordingSubscription = null;
    onChunkCallback = null;
    mediaRecorder = null;
    mediaStream = null;
  }
}

/**
 * Get current recording status
 * @returns {boolean} True if currently recording
 */
export function getRecordingStatus() {
  return isRecording;
}

/**
 * Convert audio file to format suitable for Whisper API
 * For web and native platforms, we'll use the recorded file directly
 * @param {string} uri - File URI from recording
 * @param {string} mimeType - MIME type of the audio
 * @returns {Promise<{uri: string, mimeType: string}>}
 */
export async function prepareAudioForWhisper(uri, mimeType = 'audio/wav') {
  try {
    console.log('Preparing audio for Whisper:', { uri, mimeType });

    // Whisper API accepts: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm
    return {
      uri,
      mimeType,
    };
  } catch (error) {
    console.error('Error preparing audio for Whisper:', error);
    throw error;
  }
}

// Backwards compatibility exports (deprecated)
export async function startRecording() {
  console.warn('startRecording() is deprecated. Use startContinuousRecording() instead');
  throw new Error('Use startContinuousRecording() instead');
}

export async function stopRecording() {
  console.warn('stopRecording() is deprecated. Use stopContinuousRecording() instead');
  throw new Error('Use stopContinuousRecording() instead');
}
