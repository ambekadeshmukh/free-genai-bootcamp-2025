const axios = require('axios');
const FormData = require('form-data');
const logger = require('../../utils/logger');

// Hugging Face API endpoint
const HF_API_URL = 'https://api-inference.huggingface.co/models';
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

// Configure API headers
const headers = {
  'Authorization': `Bearer ${HF_API_KEY}`,
  'Content-Type': 'application/json'
};

/**
 * Analyze pronunciation using Hugging Face models
 * @param {Buffer} audioData - Audio data buffer
 * @param {string} text - Expected text for comparison
 * @returns {Promise<Object>} Pronunciation analysis results
 */
exports.analyzePronunciation = async (audioData, text) => {
  try {
    // Step 1: Convert audio to text using ASR model
    const recognizedText = await speechToText(audioData);
    
    // Step 2: Compare recognized text with expected text
    const comparisonResult = compareTexts(recognizedText, text);
    
    // Step 3: Analyze pronunciation quality
    const pronunciationQuality = analyzePronunciationQuality(recognizedText, text);
    
    return {
      recognizedText,
      expectedText: text,
      accuracy: comparisonResult.accuracy,
      errorDetails: comparisonResult.errorDetails,
      pronunciationQuality,
      feedback: generatePronunciationFeedback(comparisonResult, pronunciationQuality)
    };
  } catch (error) {
    logger.error(`Pronunciation analysis error: ${error.message}`);
    throw new Error(`Failed to analyze pronunciation: ${error.message}`);
  }
};

/**
 * Translate text between languages
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code (e.g., 'en', 'fr')
 * @param {string} targetLang - Target language code (e.g., 'en', 'fr')
 * @returns {Promise<string>} Translated text
 */
exports.translateText = async (text, sourceLang, targetLang) => {
  try {
    // Select appropriate model based on language pair
    const modelId = getTranslationModel(sourceLang, targetLang);
    
    const response = await axios.post(
      `${HF_API_URL}/${modelId}`,
      { inputs: text },
      { headers }
    );
    
    // Extract translation from response
    const translation = response.data[0].translation_text || response.data[0].generated_text;
    
    return translation;
  } catch (error) {
    logger.error(`Translation error: ${error.message}`);
    throw new Error(`Failed to translate text: ${error.message}`);
  }
};

/**
 * Convert text to speech
 * @param {string} text - Text to convert to speech
 * @param {string} voice - Voice style ('male', 'female', etc.)
 * @returns {Promise<Buffer>} Audio data buffer
 */
exports.textToSpeech = async (text, voice = 'female') => {
  try {
    // Select appropriate TTS model based on voice preference
    const modelId = getTtsModel(voice);
    
    const response = await axios.post(
      `${HF_API_URL}/${modelId}`,
      { inputs: text },
      { 
        headers,
        responseType: 'arraybuffer'
      }
    );
    
    return Buffer.from(response.data);
  } catch (error) {
    logger.error(`Text-to-speech error: ${error.message}`);
    throw new Error(`Failed to convert text to speech: ${error.message}`);
  }
};

/**
 * Get French word embeddings for semantic analysis
 * @param {string} word - French word
 * @returns {Promise<Array<number>>} Word embedding vector
 */
exports.getWordEmbedding = async (word) => {
  try {
    const modelId = 'camembert-base';
    
    const response = await axios.post(
      `${HF_API_URL}/${modelId}`,
      { inputs: word },
      { headers }
    );
    
    // Extract embedding (average of token embeddings)
    const embedding = response.data[0].layers[0].values;
    
    return embedding;
  } catch (error) {
    logger.error(`Word embedding error: ${error.message}`);
    throw new Error(`Failed to get word embedding: ${error.message}`);
  }
};

/**
 * Convert speech to text using ASR
 * @param {Buffer} audioData - Audio data buffer
 * @returns {Promise<string>} Transcribed text
 */
async function speechToText(audioData) {
  try {
    // Use Wav2Vec2 model fine-tuned for French
    const modelId = 'facebook/wav2vec2-large-xlsr-53-french';
    
    // Create form data with audio file
    const formData = new FormData();
    formData.append('file', audioData, {
      filename: 'audio.wav',
      contentType: 'audio/wav'
    });
    
    const response = await axios.post(
      `${HF_API_URL}/${modelId}`,
      formData,
      { 
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${HF_API_KEY}`
        }
      }
    );
    
    return response.data.text;
  } catch (error) {
    logger.error(`Speech to text error: ${error.message}`);
    throw new Error(`Failed to transcribe speech: ${error.message}`);
  }
}

/**
 * Compare recognized text with expected text
 * @param {string} recognized - Recognized text from ASR
 * @param {string} expected - Expected text
 * @returns {Object} Comparison results with accuracy and error details
 */
function compareTexts(recognized, expected) {
  // Normalize texts (lowercase, remove punctuation)
  const normalizedRecognized = recognized.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
  const normalizedExpected = expected.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalizedRecognized, normalizedExpected);
  
  // Calculate accuracy as percentage
  const maxLength = Math.max(normalizedRecognized.length, normalizedExpected.length);
  const accuracy = Math.max(0, ((maxLength - distance) / maxLength) * 100);
  
  // Identify specific word errors
  const recognizedWords = normalizedRecognized.split(/\s+/);
  const expectedWords = normalizedExpected.split(/\s+/);
  
  const wordErrors = [];
  for (let i = 0; i < expectedWords.length; i++) {
    if (i >= recognizedWords.length || recognizedWords[i] !== expectedWords[i]) {
      wordErrors.push({
        expected: expectedWords[i],
        recognized: i < recognizedWords.length ? recognizedWords[i] : '(missing)'
      });
    }
  }
  
  return {
    accuracy,
    errorDetails: {
      levenshteinDistance: distance,
      wordErrors
    }
  };
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Levenshtein distance
 */
function levenshteinDistance(a, b) {
  const matrix = [];
  
  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill in the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Analyze pronunciation quality based on text comparison
 * @param {string} recognized - Recognized text from ASR
 * @param {string} expected - Expected text
 * @returns {Object} Pronunciation quality metrics
 */
function analyzePronunciationQuality(recognized, expected) {
  // This is a simplified version - in a real app, you'd use more sophisticated analysis
  const { accuracy } = compareTexts(recognized, expected);
  
  let level;
  if (accuracy >= 90) {
    level = 'excellent';
  } else if (accuracy >= 75) {
    level = 'good';
  } else if (accuracy >= 60) {
    level = 'fair';
  } else {
    level = 'needs improvement';
  }
  
  return {
    level,
    score: Math.round(accuracy)
  };
}

/**
 * Generate feedback for pronunciation based on analysis
 * @param {Object} comparison - Text comparison results
 * @param {Object} quality - Pronunciation quality assessment
 * @returns {Object} Feedback with encouragement and improvement suggestions
 */
function generatePronunciationFeedback(comparison, quality) {
  const encouragement = [
    "Excellent pronunciation! Keep it up!",
    "Great job! Your French accent is coming along nicely.",
    "Good effort! Let's work on a few specific sounds.",
    "Nice try! With practice, you'll improve quickly."
  ];
  
  // Select encouragement based on quality level
  let encouragementIndex;
  if (quality.level === 'excellent') encouragementIndex = 0;
  else if (quality.level === 'good') encouragementIndex = 1;
  else if (quality.level === 'fair') encouragementIndex = 2;
  else encouragementIndex = 3;
  
  // Generate specific suggestions based on error patterns
  const suggestions = [];
  const commonErrors = identifyCommonErrors(comparison.errorDetails.wordErrors);
  
  for (const error of commonErrors) {
    switch (error.type) {
      case 'nasal':
        suggestions.push("Practice the French nasal sounds like 'an', 'en', 'in', 'on'.");
        break;
      case 'r':
        suggestions.push("Practice the French 'r' sound, which is different from English.");
        break;
      case 'u':
        suggestions.push("Focus on the French 'u' sound, which is pronounced with rounded lips.");
        break;
      case 'vowel':
        suggestions.push(`Pay attention to the vowel sound in '${error.word}'.`);
        break;
      default:
        suggestions.push(`Try practicing the word '${error.word}' again.`);
    }
  }
  
  return {
    message: encouragement[encouragementIndex],
    suggestions: suggestions.slice(0, 3) // Limit to top 3 suggestions
  };
}

/**
 * Identify common pronunciation error patterns
 * @param {Array} wordErrors - List of word errors
 * @returns {Array} Common error patterns
 */
function identifyCommonErrors(wordErrors) {
  // This is a simplified version - in a real app, you'd have more sophisticated pattern recognition
  const errors = [];
  
  for (const error of wordErrors) {
    if (/[aeiou]n/.test(error.expected)) {
      errors.push({ type: 'nasal', word: error.expected });
    } else if (/r/.test(error.expected)) {
      errors.push({ type: 'r', word: error.expected });
    } else if (/u/.test(error.expected)) {
      errors.push({ type: 'u', word: error.expected });
    } else {
      errors.push({ type: 'vowel', word: error.expected });
    }
  }
  
  return errors;
}

/**
 * Get appropriate translation model based on language pair
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {string} Model ID
 */
function getTranslationModel(sourceLang, targetLang) {
  // Map of language pairs to appropriate models
  const modelMap = {
    'en-fr': 'Helsinki-NLP/opus-mt-en-fr',
    'fr-en': 'Helsinki-NLP/opus-mt-fr-en',
    // Add more language pairs as needed
  };
  
  const langPair = `${sourceLang}-${targetLang}`;
  return modelMap[langPair] || 'facebook/nllb-200-distilled-600M'; // Fallback to multilingual model
}

/**
 * Get appropriate TTS model based on voice preference
 * @param {string} voice - Voice preference
 * @returns {string} Model ID
 */
function getTtsModel(voice) {
  // Map voice preferences to appropriate models
  const modelMap = {
    'male': 'facebook/mms-tts-fra',
    'female': 'espnet/kan-bayashi_ljspeech_vits',
    'child': 'facebook/mms-tts-fra',
    // Add more voice options as needed
  };
  
  return modelMap[voice] || 'espnet/kan-bayashi_ljspeech_vits'; // Default to female voice
}

module.exports = exports;