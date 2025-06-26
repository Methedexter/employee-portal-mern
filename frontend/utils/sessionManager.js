// frontend/utils/sessionManager.js
// This module handles storing and retrieving user session data from sessionStorage.

const USER_SESSION_KEY = 'currentUser';

/**
 * Stores the user's role and data in session storage.
 * @param {string} role - The role of the logged-in user ('employee' or 'admin').
 * @param {object} userData - The user's data object.
 */
export const setSession = (role, userData) => {
    try {
        const sessionData = { role, user: userData };
        sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionData));
        console.log(`Session set for role: ${role}, userId: ${userData.userId}`);
    } catch (error) {
        console.error('Error setting session storage:', error);
    }
};

/**
 * Retrieves the logged-in user's role from session storage.
 * @returns {string|null} The user's role ('employee' or 'admin') or null if no session.
 */
export const getUserRole = () => {
    try {
        const sessionData = sessionStorage.getItem(USER_SESSION_KEY);
        if (sessionData) {
            const parsedData = JSON.parse(sessionData);
            return parsedData.role;
        }
    } catch (error) {
        console.error('Error getting user role from session storage:', error);
    }
    return null;
};

/**
 * Retrieves the logged-in user's data object from session storage.
 * @returns {object|null} The user data object or null if no session.
 */
export const getLoggedInUser = () => {
    try {
        const sessionData = sessionStorage.getItem(USER_SESSION_KEY);
        if (sessionData) {
            const parsedData = JSON.parse(sessionData);
            return parsedData.user;
        }
    } catch (error) {
        console.error('Error getting logged-in user from session storage:', error);
    }
    return null;
};

/**
 * Clears all user session data from session storage.
 */
export const clearSession = () => {
    try {
        sessionStorage.removeItem(USER_SESSION_KEY);
        console.log('Session cleared.');
    } catch (error) {
        console.error('Error clearing session storage:', error);
    }
};

/**
 * Checks if a user is currently logged in.
 * @returns {boolean} True if a user session exists, false otherwise.
 */
export const isLoggedIn = () => {
    return sessionStorage.getItem(USER_SESSION_KEY) !== null;
};
