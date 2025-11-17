import OpenAI from 'openai';
import { Platform } from 'react-native';
import { openaiConfig } from '../openai.config';
import * as FileSystem from 'expo-file-system';

let openai = null;

/**
 * Initialize OpenAI client
 */
function initializeOpenAI() {
  if (!openai) {
    if (!openaiConfig.apiKey || openaiConfig.apiKey === 'YOUR_OPENAI_API_KEY') {
      throw new Error('OpenAI API key not configured. Please update openai.config.js');
    }
    openai = new OpenAI({
      apiKey: openaiConfig.apiKey,
      dangerouslyAllowBrowser: Platform.OS === 'web', // Allow browser usage for web platform
    });
    console.log('OpenAI client initialized');
  }
  return openai;
}

/**
 * Convert audio file URI to File/Blob for Whisper API
 * @param {string} uri - Audio file URI
 * @param {string} mimeType - MIME type of audio file
 * @returns {Promise<File|Blob>}
 */
async function uriToFileBlob(uri, mimeType) {
  try {
    if (Platform.OS === 'web') {
      // On web, fetch the blob
      const response = await fetch(uri);
      const blob = await response.blob();
      // Create a File object with proper name
      const file = new File([blob], 'audio.webm', { type: mimeType });
      return file;
    } else {
      // On native, read the file as base64 and convert to blob
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to blob
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Create File from Blob
      const file = new File([blob], 'audio.m4a', { type: mimeType });
      return file;
    }
  } catch (error) {
    console.error('Error converting URI to File/Blob:', error);
    throw error;
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 * @param {string} audioUri - URI of the audio file
 * @param {string} mimeType - MIME type of the audio file
 * @param {object} options - Additional options
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribeAudio(audioUri, mimeType, options = {}) {
  try {
    console.log('Transcribing audio...', { audioUri, mimeType });

    const client = initializeOpenAI();

    // Convert URI to File/Blob
    const audioFile = await uriToFileBlob(audioUri, mimeType);
    console.log('Audio file prepared for Whisper:', audioFile);

    // Call Whisper API
    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: options.language || 'en', // Optional: specify language
      prompt: options.prompt || undefined, // Optional: provide context
      response_format: 'json',
      temperature: 0.2, // Lower temperature for more consistent transcriptions
    });

    console.log('Transcription result:', transcription.text);
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    if (error.message?.includes('API key')) {
      throw new Error('Invalid OpenAI API key. Please check your openai.config.js');
    }
    throw error;
  }
}

/**
 * Transcribe audio with automatic language detection
 * @param {string} audioUri - URI of the audio file
 * @param {string} mimeType - MIME type of the audio file
 * @returns {Promise<{text: string, language?: string}>}
 */
export async function transcribeAudioAuto(audioUri, mimeType) {
  try {
    const client = initializeOpenAI();
    const audioFile = await uriToFileBlob(audioUri, mimeType);

    // Use verbose_json to get language info
    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      temperature: 0.2,
    });

    console.log('Transcription with language:', {
      text: transcription.text,
      language: transcription.language,
    });

    return {
      text: transcription.text,
      language: transcription.language,
    };
  } catch (error) {
    console.error('Error in auto transcription:', error);
    throw error;
  }
}
