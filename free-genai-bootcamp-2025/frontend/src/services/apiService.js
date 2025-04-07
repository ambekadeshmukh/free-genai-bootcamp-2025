/**
 * API Service
 * Handles communication with the backend API.
 */
import axios from 'axios';
import { getOfflineContent, saveOfflineContent } from './storageService';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add retry logic for failed requests
api.interceptors.response.use(null, async (error) => {
  // Check if error is due to network issues
  if (!error.response && error.message.includes('Network Error')) {
    // Check if we have offline content for this request
    try {
      const requestKey = `${error.config.method}_${error.config.url}`;
      const offlineContent = await getOfflineContent(requestKey);
      
      if (offlineContent) {
        console.log('Using offline content for:', requestKey);
        return Promise.resolve({
          data: offlineContent,
          status: 200,
          statusText: 'OK (Offline)',
          headers: {},
          config: error.config,
          isOffline: true
        });
      }
    } catch (offlineError) {
      console.error('Error retrieving offline content:', offlineError);
    }
  }
  
  // Continue with the error
  return Promise.reject(error);
});

/**
 * Chat with AI Language Buddy
 * @param {string} message - User message
 * @param {string} userLevel - User's French proficiency level
 * @param {Array} conversationHistory - Previous conversation history
 * @returns {Promise<Object>} AI response
 */
const chatWithAI = async (message, userLevel, conversationHistory) => {
  try {
    const response = await api.post('/ai/chat', {
      message,
      userLevel,
      conversationHistory
    });
    
    return response.data;
  } catch (error) {
    console.error('Chat API error:', error);
    throw new Error('Failed to chat with AI: ' + error.message);
  }
};

/**
 * Generate content (vocabulary, phrases, grammar, etc.)
 * @param {string} contentType - Type of content to generate
 * @param {string} theme - Theme for the content
 * @param {string} difficulty - Difficulty level
 * @param {number} count - Number of items to generate
 * @returns {Promise<Object>} Generated content
 */
const generateContent = async (contentType, theme, difficulty, count) => {
  try {
    const requestKey = `content_${contentType}_${theme}_${difficulty}_${count}`;
    
    // Check offline cache first
    const cachedContent = await getOfflineContent(requestKey);
    if (cachedContent) {
      return cachedContent;
    }
    
    const response = await api.post('/ai/generate-content', {
      contentType,
      theme,
      difficulty,
      count
    });
    
    // Save response for offline use
    await saveOfflineContent(requestKey, response.data);
    
    return response.data;
  } catch (error) {
    console.error('Content generation API error:', error);
    throw new Error('Failed to generate content: ' + error.message);
  }
};

/**
 * Analyze pronunciation
 * @param {Blob} audioData - Audio recording of user's pronunciation
 * @param {string} text - Expected text
 * @returns {Promise<Object>} Pronunciation analysis
 */
const analyzePronunciation = async (audioData, text) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('audioData', audioData);
    formData.append('text', text);
    
    const response = await api.post('/ai/analyze-pronunciation', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Pronunciation analysis API error:', error);
    throw new Error('Failed to analyze pronunciation: ' + error.message);
  }
};

/**
 * Generate an image for vocabulary or cultural context
 * @param {string} prompt - Image generation prompt
 * @param {string} style - Style specification
 * @param {string} size - Size specification
 * @returns {Promise<Object>} Generated image data
 */
const generateImage = async (prompt, style = 'educational', size = 'medium') => {
  try {
    const requestKey = `image_${prompt.substring(0, 50)}_${style}_${size}`;
    
    // Check offline cache first
    const cachedContent = await getOfflineContent(requestKey);
    if (cachedContent) {
      return cachedContent;
    }
    
    const response = await api.post('/ai/generate-image', {
      prompt,
      style,
      size
    });
    
    // Save response for offline use
    await saveOfflineContent(requestKey, response.data);
    
    return response.data;
  } catch (error) {
    console.error('Image generation API error:', error);
    throw new Error('Failed to generate image: ' + error.message);
  }
};

/**
 * Generate game scene for Object Naming Game
 * @param {string} theme - Theme of the scene
 * @param {Array<string>} targetWords - Target vocabulary words
 * @param {string} difficulty - Difficulty level
 * @returns {Promise<Object>} Generated scene image
 */
const generateGameScene = async (theme, targetWords, difficulty) => {
  try {
    const requestKey = `scene_${theme}_${targetWords.join('_')}_${difficulty}`;
    
    // Check offline cache first
    const cachedContent = await getOfflineContent(requestKey);
    if (cachedContent) {
      return cachedContent;
    }
    
    const response = await api.post('/ai/generate-image', {
      prompt: `A ${difficulty} level French learning scene of a ${theme} with clearly visible objects including: ${targetWords.join(', ')}. Educational style.`,
      style: 'educational',
      size: 'large'
    });
    
    // Save response for offline use
    await saveOfflineContent(requestKey, response.data);
    
    return response.data;
  } catch (error) {
    console.error('Game scene generation API error:', error);
    throw new Error('Failed to generate game scene: ' + error.message);
  }
};

/**
 * Generate personalized learning path
 * @param {Object} userProgress - User's progress data
 * @param {Object} userGoals - User's learning goals
 * @param {number} timeAvailable - User's available time per day (minutes)
 * @returns {Promise<Object>} Personalized learning path
 */
const generateLearningPath = async (userProgress, userGoals, timeAvailable) => {
  try {
    const response = await api.post('/ai/learning-path', {
      userProgress,
      userGoals,
      timeAvailable
    });
    
    return response.data;
  } catch (error) {
    console.error('Learning path API error:', error);
    throw new Error('Failed to generate learning path: ' + error.message);
  }
};

/**
 * Generate cultural context for vocabulary learning
 * @param {Array<string>} vocabulary - List of vocabulary words
 * @param {string} theme - Theme of the vocabulary
 * @param {string} difficulty - Difficulty level
 * @returns {Promise<Object>} Cultural context information
 */
const generateCulturalContext = async (vocabulary, theme, difficulty) => {
  try {
    const requestKey = `cultural_${vocabulary.join('_')}_${theme}_${difficulty}`;
    
    // Check offline cache first
    const cachedContent = await getOfflineContent(requestKey);
    if (cachedContent) {
      return cachedContent;
    }
    
    const response = await api.post('/ai/cultural-context', {
      vocabulary,
      theme,
      difficulty
    });
    
    // Save response for offline use
    await saveOfflineContent(requestKey, response.data);
    
    return response.data;
  } catch (error) {
    console.error('Cultural context API error:', error);
    throw new Error('Failed to generate cultural context: ' + error.message);
  }
};

/**
 * Convert text to speech
 * @param {string} text - Text to convert to speech
 * @param {string} voice - Voice style ('male', 'female', etc.)
 * @returns {Promise<string>} Audio data URL
 */
const textToSpeech = async (text, voice = 'female') => {
  try {
    const requestKey = `tts_${text.substring(0, 50)}_${voice}`;
    
    // Check offline cache first
    const cachedContent = await getOfflineContent(requestKey);
    if (cachedContent) {
      return cachedContent.audioData;
    }
    
    const response = await api.post('/ai/text-to-speech', {
      text,
      voice
    });
    
    // Save response for offline use
    await saveOfflineContent(requestKey, response.data);
    
    return response.data.audioData;
  } catch (error) {
    console.error('Text-to-speech API error:', error);
    throw new Error('Failed to convert text to speech: ' + error.message);
  }
};

/**
 * Translate text
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code (e.g., 'en', 'fr')
 * @param {string} targetLang - Target language code (e.g., 'en', 'fr')
 * @returns {Promise<string>} Translated text
 */
const translateText = async (text, sourceLang, targetLang) => {
  try {
    const requestKey = `translate_${text.substring(0, 50)}_${sourceLang}_${targetLang}`;
    
    // Check offline cache first
    const cachedContent = await getOfflineContent(requestKey);
    if (cachedContent) {
      return cachedContent.translation;
    }
    
    const response = await api.post('/ai/translate', {
      text,
      sourceLang,
      targetLang
    });
    
    // Save response for offline use
    await saveOfflineContent(requestKey, response.data);
    
    return response.data.translation;
  } catch (error) {
    console.error('Translation API error:', error);
    throw new Error('Failed to translate text: ' + error.message);
  }
};

// Export API methods
export default {
  chatWithAI,
  generateContent,
  analyzePronunciation,
  generateImage,
  generateGameScene,
  generateLearningPath,
  generateCulturalContext,
  textToSpeech,
  translateText
};