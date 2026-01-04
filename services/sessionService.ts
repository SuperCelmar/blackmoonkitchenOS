/**
 * Session Management Service
 * 
 * Manages browser-based session IDs for unauthenticated users.
 * Session IDs are stored in localStorage and persist across browser sessions.
 */

const SESSION_STORAGE_KEY = 'restaurant_session_id';

/**
 * Generates a UUID v4 string
 */
function generateUUID(): string {
  // Simple UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets or creates a session ID from localStorage.
 * If no session ID exists, generates a new one and stores it.
 * 
 * @returns The session ID string
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering: return a temporary ID
    // This shouldn't happen in normal usage
    return generateUUID();
  }

  try {
    let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    
    if (!sessionId) {
      // Generate new session ID
      sessionId = generateUUID();
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    
    return sessionId;
  } catch (error) {
    // localStorage might be disabled or unavailable
    // Generate a temporary session ID (won't persist)
    console.warn('localStorage unavailable, using temporary session ID:', error);
    return generateUUID();
  }
}

/**
 * Gets the current session ID without creating a new one.
 * 
 * @returns The session ID string, or null if none exists
 */
export function getSessionId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn('localStorage unavailable:', error);
    return null;
  }
}

/**
 * Clears the session ID from localStorage.
 * Useful for testing or when a user wants to start fresh.
 */
export function clearSessionId(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear session ID:', error);
  }
}

