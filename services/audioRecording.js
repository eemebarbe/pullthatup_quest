import { Audio } from 'expo-av';
import { Platform } from 'react-native';

let recording = null;
let isRecording = false;

/**
 * Request audio recording permissions
 * @returns {Promise<boolean>} True if granted
 */
export async function requestAudioPermissions() {
  try {
    console.log('Requesting audio permissions...');
    const { status } = await Audio.requestPermissionsAsync();
    console.log('Audio permission status:', status);
    return status === 'granted';
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
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    console.log('Audio mode initialized');
  } catch (error) {
    console.error('Error initializing audio mode:', error);
    throw error;
  }
}

/**
 * Start recording audio
 * @param {number} duration - Duration in milliseconds (default 10000ms = 10s)
 * @returns {Promise<{uri: string, duration: number}>} Recording info
 */
export async function startRecording(duration = 10000) {
  try {
    if (isRecording) {
      console.log('Already recording, stopping previous recording');
      await stopRecording();
    }

    console.log('Starting recording...');

    // Create and start recording
    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
      undefined,
      100 // Update interval in ms
    );

    recording = newRecording;
    isRecording = true;
    console.log('Recording started');

    // Auto-stop after duration
    const startTime = Date.now();
    setTimeout(async () => {
      if (isRecording && recording === newRecording) {
        console.log(`Auto-stopping recording after ${duration}ms`);
        await stopRecording();
      }
    }, duration);

    return {
      startTime,
      recording: newRecording,
    };
  } catch (error) {
    console.error('Error starting recording:', error);
    isRecording = false;
    recording = null;
    throw error;
  }
}

/**
 * Stop current recording
 * @returns {Promise<{uri: string, duration: number} | null>} Recording info or null
 */
export async function stopRecording() {
  try {
    if (!recording || !isRecording) {
      console.log('No active recording to stop');
      return null;
    }

    console.log('Stopping recording...');
    await recording.stopAndUnloadAsync();

    const uri = recording.getURI();
    const status = await recording.getStatusAsync();

    isRecording = false;
    const recordingInstance = recording;
    recording = null;

    console.log('Recording stopped:', { uri, duration: status.durationMillis });

    return {
      uri,
      duration: status.durationMillis,
      recording: recordingInstance,
    };
  } catch (error) {
    console.error('Error stopping recording:', error);
    isRecording = false;
    recording = null;
    throw error;
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
 * Cancel current recording without saving
 */
export async function cancelRecording() {
  try {
    if (recording && isRecording) {
      console.log('Canceling recording...');
      await recording.stopAndUnloadAsync();
      isRecording = false;
      recording = null;
      console.log('Recording canceled');
    }
  } catch (error) {
    console.error('Error canceling recording:', error);
    isRecording = false;
    recording = null;
  }
}

/**
 * Convert audio file to format suitable for Whisper API
 * For web and native platforms, we'll use the recorded file directly
 * @param {string} uri - File URI from recording
 * @returns {Promise<{uri: string, mimeType: string}>}
 */
export async function prepareAudioForWhisper(uri) {
  try {
    console.log('Preparing audio for Whisper:', uri);

    // Expo records in different formats depending on platform:
    // iOS: .caf or .m4a
    // Android: .m4a
    // Web: .webm or .mp4

    // Whisper API accepts: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm
    // So our recorded files should work directly

    let mimeType;
    if (Platform.OS === 'ios') {
      mimeType = 'audio/m4a';
    } else if (Platform.OS === 'android') {
      mimeType = 'audio/m4a';
    } else {
      mimeType = 'audio/webm';
    }

    return {
      uri,
      mimeType,
    };
  } catch (error) {
    console.error('Error preparing audio for Whisper:', error);
    throw error;
  }
}
