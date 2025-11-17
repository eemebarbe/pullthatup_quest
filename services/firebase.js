import { initializeApp, getApps } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp,
  remove,
  get,
  push,
} from 'firebase/database';
import { firebaseConfig } from '../firebase.config';
import { generateRoomId } from '../utils/roomId';
import { getUserId, getUsername } from '../utils/userId';

let app;
let database;

/**
 * Initialize Firebase
 */
export function initializeFirebase() {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      database = getDatabase(app);
      console.log('Firebase initialized successfully');
    } else {
      app = getApps()[0];
      database = getDatabase(app);
    }
    return { app, database };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

/**
 * Create a new room
 * @returns {Promise<{roomId: string, userId: string, username: string}>}
 */
export async function createRoom() {
  try {
    console.log('createRoom: Starting...');
    const db = database || getDatabase();
    console.log('createRoom: Database instance obtained');

    const roomId = generateRoomId();
    console.log('createRoom: Generated room ID:', roomId);

    const userId = await getUserId();
    console.log('createRoom: Got user ID:', userId);

    const username = await getUsername();
    console.log('createRoom: Got username:', username);

    // Create the room
    const roomRef = ref(db, `rooms/${roomId}`);
    console.log('createRoom: Creating room reference...');

    await set(roomRef, {
      createdAt: serverTimestamp(),
      createdBy: userId,
    });
    console.log('createRoom: Room created in database');

    // Join the room
    console.log('createRoom: Joining room...');
    await joinRoom(roomId, userId, username);
    console.log('createRoom: Successfully joined room');

    return { roomId, userId, username };
  } catch (error) {
    console.error('Error creating room:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

/**
 * Join an existing room
 * @param {string} roomId - The room ID to join
 * @param {string} userId - The user's ID
 * @param {string} username - The user's name
 * @returns {Promise<void>}
 */
export async function joinRoom(roomId, userId, username) {
  try {
    console.log('joinRoom: Starting...', { roomId, userId, username });
    const db = database || getDatabase();

    // Check if room exists
    const roomRef = ref(db, `rooms/${roomId}`);
    console.log('joinRoom: Checking if room exists...');
    const roomSnapshot = await get(roomRef);
    console.log('joinRoom: Room exists?', roomSnapshot.exists());

    if (!roomSnapshot.exists()) {
      throw new Error('Room does not exist');
    }

    // Add user to room's presence
    const userPresenceRef = ref(db, `rooms/${roomId}/users/${userId}`);

    await set(userPresenceRef, {
      username,
      joinedAt: serverTimestamp(),
      online: true,
    });

    // Set up automatic removal on disconnect
    onDisconnect(userPresenceRef).remove();

    console.log(`User ${username} joined room ${roomId}`);
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
}

/**
 * Leave a room
 * @param {string} roomId - The room ID to leave
 * @param {string} userId - The user's ID
 * @returns {Promise<void>}
 */
export async function leaveRoom(roomId, userId) {
  try {
    const db = database || getDatabase();
    const userPresenceRef = ref(db, `rooms/${roomId}/users/${userId}`);

    await remove(userPresenceRef);
    console.log(`User ${userId} left room ${roomId}`);
  } catch (error) {
    console.error('Error leaving room:', error);
    throw error;
  }
}

/**
 * Subscribe to room users updates
 * @param {string} roomId - The room ID to monitor
 * @param {Function} callback - Callback function that receives users array
 * @returns {Function} Unsubscribe function
 */
export function subscribeToRoomUsers(roomId, callback) {
  try {
    const db = database || getDatabase();
    const usersRef = ref(db, `rooms/${roomId}/users`);

    const unsubscribe = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      const users = [];

      if (usersData) {
        Object.entries(usersData).forEach(([userId, userData]) => {
          users.push({
            id: userId,
            ...userData,
          });
        });
      }

      callback(users);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to room users:', error);
    throw error;
  }
}

/**
 * Check if a room exists
 * @param {string} roomId - The room ID to check
 * @returns {Promise<boolean>}
 */
export async function roomExists(roomId) {
  try {
    const db = database || getDatabase();
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    return snapshot.exists();
  } catch (error) {
    console.error('Error checking if room exists:', error);
    return false;
  }
}

/**
 * Add a conversation segment to a room
 * @param {string} roomId - The room ID
 * @param {string} userId - The user's ID
 * @param {string} username - The user's name
 * @param {string} text - Transcribed text
 * @param {number} startTimestamp - When the segment began (milliseconds)
 * @returns {Promise<string>} The segment ID
 */
export async function addConversationSegment(roomId, userId, username, text, startTimestamp) {
  try {
    console.log('Adding conversation segment:', { roomId, userId, text });
    const db = database || getDatabase();

    // Create a new segment with push (auto-generated key)
    const conversationRef = ref(db, `rooms/${roomId}/conversation`);
    const newSegmentRef = await push(conversationRef);

    const segment = {
      userId,
      username,
      text,
      startTimestamp,
      createdAt: serverTimestamp(),
    };

    await set(newSegmentRef, segment);
    console.log('Conversation segment added:', newSegmentRef.key);

    return newSegmentRef.key;
  } catch (error) {
    console.error('Error adding conversation segment:', error);
    throw error;
  }
}

/**
 * Subscribe to conversation updates
 * @param {string} roomId - The room ID to monitor
 * @param {Function} callback - Callback function that receives conversation segments array
 * @returns {Function} Unsubscribe function
 */
export function subscribeToConversation(roomId, callback) {
  try {
    console.log('Subscribing to conversation for room:', roomId);
    const db = database || getDatabase();
    const conversationRef = ref(db, `rooms/${roomId}/conversation`);

    const unsubscribe = onValue(conversationRef, (snapshot) => {
      const conversationData = snapshot.val();
      const segments = [];

      if (conversationData) {
        Object.entries(conversationData).forEach(([segmentId, segmentData]) => {
          segments.push({
            id: segmentId,
            ...segmentData,
          });
        });

        // Sort by startTimestamp (oldest first)
        segments.sort((a, b) => a.startTimestamp - b.startTimestamp);
      }

      console.log(`Conversation updated: ${segments.length} segments`);
      callback(segments);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to conversation:', error);
    throw error;
  }
}
