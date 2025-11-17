/**
 * Generate a random 6-character room ID
 * Uses uppercase letters and numbers (excluding easily confused characters like 0, O, I, 1)
 * @returns {string} 6-character room ID
 */
export function generateRoomId() {
  // Characters that are easy to read and distinguish
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let roomId = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    roomId += chars[randomIndex];
  }

  return roomId;
}

/**
 * Validate a room ID format
 * @param {string} roomId - The room ID to validate
 * @returns {boolean} True if valid format
 */
export function isValidRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') {
    return false;
  }

  // Must be exactly 6 characters, uppercase letters and numbers
  const validPattern = /^[A-Z0-9]{6}$/;
  return validPattern.test(roomId);
}
