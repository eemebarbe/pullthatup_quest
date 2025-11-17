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
    const db = database || getDatabase();
    const roomId = generateRoomId();
    const userId = await getUserId();
    const username = await getUsername();

    // Create the room
    const roomRef = ref(db, `rooms/${roomId}`);
    await set(roomRef, {
      createdAt: serverTimestamp(),
      createdBy: userId,
    });

    // Join the room
    await joinRoom(roomId, userId, username);

    return { roomId, userId, username };
  } catch (error) {
    console.error('Error creating room:', error);
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
    const db = database || getDatabase();

    // Check if room exists
    const roomRef = ref(db, `rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);

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
