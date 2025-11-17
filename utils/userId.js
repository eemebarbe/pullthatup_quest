import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = '@pullthatup_user_id';
const USER_NAME_KEY = '@pullthatup_user_name';

/**
 * Generate a unique user ID
 * @returns {string} Unique user ID
 */
function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a random username
 * @returns {string} Random username
 */
function generateRandomUsername() {
  const adjectives = ['Happy', 'Clever', 'Swift', 'Brave', 'Calm', 'Bright', 'Cool', 'Epic', 'Mega', 'Super'];
  const nouns = ['Panda', 'Tiger', 'Eagle', 'Dragon', 'Phoenix', 'Wolf', 'Bear', 'Hawk', 'Lion', 'Falcon'];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);

  return `${adjective}${noun}${number}`;
}

/**
 * Get or create a user ID
 * @returns {Promise<string>} User ID
 */
export async function getUserId() {
  try {
    let userId = await AsyncStorage.getItem(USER_ID_KEY);

    if (!userId) {
      userId = generateUserId();
      await AsyncStorage.setItem(USER_ID_KEY, userId);
    }

    return userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    // Fallback to temporary ID if storage fails
    return generateUserId();
  }
}

/**
 * Get or create a username
 * @returns {Promise<string>} Username
 */
export async function getUsername() {
  try {
    let username = await AsyncStorage.getItem(USER_NAME_KEY);

    if (!username) {
      username = generateRandomUsername();
      await AsyncStorage.setItem(USER_NAME_KEY, username);
    }

    return username;
  } catch (error) {
    console.error('Error getting username:', error);
    return generateRandomUsername();
  }
}

/**
 * Set a custom username
 * @param {string} username - The username to set
 * @returns {Promise<void>}
 */
export async function setUsername(username) {
  try {
    await AsyncStorage.setItem(USER_NAME_KEY, username);
  } catch (error) {
    console.error('Error setting username:', error);
  }
}

/**
 * Clear user data (for testing)
 * @returns {Promise<void>}
 */
export async function clearUserData() {
  try {
    await AsyncStorage.multiRemove([USER_ID_KEY, USER_NAME_KEY]);
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
}
