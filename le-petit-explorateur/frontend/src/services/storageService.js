/**
 * LocalStorage Service
 * Handles storing and retrieving data from browser localStorage.
 * Uses indexedDB for larger data structures.
 */
import { openDB } from 'idb';

// Database name and version
const DB_NAME = 'le-petit-explorateur-db';
const DB_VERSION = 1;

// Initialize IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress');
      }
      
      if (!db.objectStoreNames.contains('ai')) {
        db.createObjectStore('ai');
      }
      
      if (!db.objectStoreNames.contains('vocabulary')) {
        db.createObjectStore('vocabulary');
      }
      
      if (!db.objectStoreNames.contains('offline-content')) {
        db.createObjectStore('offline-content');
      }
    }
  });
};

/**
 * Initialize localStorage with default values if first visit
 * @returns {Promise<boolean>} True if this is the first visit
 */
export const initializeLocalStorage = async () => {
  const isFirstVisit = localStorage.getItem('initialized') !== 'true';
  
  if (isFirstVisit) {
    // Set initialization flag
    localStorage.setItem('initialized', 'true');
    localStorage.setItem('firstVisitDate', new Date().toISOString());
    
    // Set default preferences
    localStorage.setItem('theme', 'default');
    localStorage.setItem('soundEnabled', 'true');
    localStorage.setItem('animationsEnabled', 'true');
    localStorage.setItem('fontSize', 'medium');
    
    // Initialize IndexedDB
    await initDB();
  }
  
  return isFirstVisit;
};

/**
 * Save user progress
 * @param {string} userId - User ID
 * @param {Object} data - Progress data
 */
export const saveProgress = async (userId, data) => {
  try {
    const db = await initDB();
    await db.put('progress', data, userId);
    return true;
  } catch (error) {
    console.error('Error saving progress:', error);
    return false;
  }
};

/**
 * Get user progress
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Progress data
 */
export const getProgress = async (userId) => {
  try {
    const db = await initDB();
    return await db.get('progress', userId);
  } catch (error) {
    console.error('Error getting progress:', error);
    return null;
  }
};

/**
 * Save AI data
 * @param {string} userId - User ID
 * @param {Object} data - AI data
 */
export const saveAI = async (userId, data) => {
  try {
    const db = await initDB();
    await db.put('ai', data, userId);
    return true;
  } catch (error) {
    console.error('Error saving AI data:', error);
    return false;
  }
};

/**
 * Get AI data
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} AI data
 */
export const getAI = async (userId) => {
  try {
    const db = await initDB();
    return await db.get('ai', userId);
  } catch (error) {
    console.error('Error getting AI data:', error);
    return null;
  }
};

/**
 * Save vocabulary data
 * @param {string} key - Vocabulary key
 * @param {Object} data - Vocabulary data
 */
export const saveVocabulary = async (key, data) => {
  try {
    const db = await initDB();
    await db.put('vocabulary', data, key);
    return true;
  } catch (error) {
    console.error('Error saving vocabulary:', error);
    return false;
  }
};

/**
 * Get vocabulary data
 * @param {string} key - Vocabulary key
 * @returns {Promise<Object|null>} Vocabulary data
 */
export const getVocabulary = async (key) => {
  try {
    const db = await initDB();
    return await db.get('vocabulary', key);
  } catch (error) {
    console.error('Error getting vocabulary:', error);
    return null;
  }
};

/**
 * Get all vocabulary keys
 * @returns {Promise<Array<string>>} Array of vocabulary keys
 */
export const getAllVocabularyKeys = async () => {
  try {
    const db = await initDB();
    return await db.getAllKeys('vocabulary');
  } catch (error) {
    console.error('Error getting vocabulary keys:', error);
    return [];
  }
};

/**
 * Save offline content
 * @param {string} key - Content key
 * @param {Object} data - Content data
 */
export const saveOfflineContent = async (key, data) => {
  try {
    const db = await initDB();
    await db.put('offline-content', data, key);
    return true;
  } catch (error) {
    console.error('Error saving offline content:', error);
    return false;
  }
};

/**
 * Get offline content
 * @param {string} key - Content key
 * @returns {Promise<Object|null>} Content data
 */
export const getOfflineContent = async (key) => {
  try {
    const db = await initDB();
    return await db.get('offline-content', key);
  } catch (error) {
    console.error('Error getting offline content:', error);
    return null;
  }
};

/**
 * Clear all data for a user
 * @param {string} userId - User ID
 */
export const clearUserData = async (userId) => {
  try {
    const db = await initDB();
    await db.delete('progress', userId);
    await db.delete('ai', userId);
    
    // Clear localStorage items
    localStorage.removeItem(`dailyGoals_${userId}`);
    
    return true;
  } catch (error) {
    console.error('Error clearing user data:', error);
    return false;
  }
};