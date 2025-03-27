const axios = require('axios');
const logger = require('../../utils/logger');

// Google Imagen API configuration
const IMAGEN_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagegeneration:generateContent';
const API_KEY = process.env.GOOGLE_API_KEY;

/**
 * Generate image using Google Imagen
 * @param {Object} params - Image generation parameters
 * @param {string} params.prompt - Text prompt for image generation
 * @param {string} params.style - Style of the image (educational, cartoon, etc.)
 * @param {string} params.size - Size of the image (small, medium, large)
 * @returns {Promise<Object>} Generated image data
 */
exports.generateImage = async ({ prompt, style = 'educational', size = 'medium' }) => {
  try {
    // Enhance prompt with style guidance and educational context
    const enhancedPrompt = enhancePrompt(prompt, style);
    
    // Map size to dimensions
    const dimensions = getSizeDimensions(size);
    
    // Prepare request payload
    const payload = {
      contents: [
        {
          parts: [
            {
              text: enhancedPrompt
            }
          ]
        }
      ],
      generation_config: {
        temperature: 0.4,
        top_p: 0.95,
        top_k: 40,
        max_output_tokens: 2048,
        response_mime_type: "image/jpeg",
        ...dimensions
      }
    };
    
    // Send request to Google Imagen API
    const response = await axios.post(IMAGEN_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      }
    });
    
    // Extract image data
    const imageData = response.data.candidates[0].content.parts[0].inlineData.data;
    
    return {
      imageData: `data:image/jpeg;base64,${imageData}`,
      metadata: {
        prompt: enhancedPrompt,
        style,
        size,
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error(`Imagen image generation error: ${error.message}`);
    // Fall back to placeholder image if API fails
    return generatePlaceholderImage(prompt, style, size);
  }
};

/**
 * Generate vocabulary illustration
 * @param {Object} params - Vocabulary illustration parameters
 * @param {string} params.word - French word to illustrate
 * @param {string} params.translation - English translation
 * @param {string} params.context - Optional context for the word
 * @returns {Promise<Object>} Generated illustration
 */
exports.generateVocabularyIllustration = async ({ word, translation, context = '' }) => {
  try {
    // Create a prompt specifically for vocabulary illustrations
    const prompt = `An educational illustration of the French word "${word}" meaning "${translation}" ${context ? `in the context of ${context}` : ''}. Clear, simple, and suitable for language learning.`;
    
    // Generate image with educational style
    const result = await exports.generateImage({
      prompt,
      style: 'educational',
      size: 'medium'
    });
    
    // Add vocabulary-specific metadata
    result.metadata.vocabularyWord = word;
    result.metadata.translation = translation;
    
    return result;
  } catch (error) {
    logger.error(`Vocabulary illustration generation error: ${error.message}`);
    throw new Error(`Failed to generate vocabulary illustration: ${error.message}`);
  }
};

/**
 * Generate scene for the Object Naming Game
 * @param {Object} params - Scene generation parameters
 * @param {string} params.theme - Theme of the scene (kitchen, park, school, etc.)
 * @param {Array<string>} params.targetWords - Target vocabulary words to include
 * @param {string} params.difficulty - Difficulty level
 * @returns {Promise<Object>} Generated scene image
 */
exports.generateGameScene = async ({ theme, targetWords, difficulty }) => {
  try {
    // Create a prompt for a scene with multiple objects to name
    const prompt = `A ${difficulty} level French learning scene of a ${theme} with clearly visible objects including: ${targetWords.join(', ')}. The scene should be well-organized, colorful, and educational with distinct objects that can be easily identified.`;
    
    // Generate a larger image for the game scene
    const result = await exports.generateImage({
      prompt,
      style: 'educational',
      size: 'large'
    });
    
    // Add game-specific metadata
    result.metadata.gameType = 'ObjectNaming';
    result.metadata.theme = theme;
    result.metadata.targetWords = targetWords;
    result.metadata.difficulty = difficulty;
    
    return result;
  } catch (error) {
    logger.error(`Game scene generation error: ${error.message}`);
    throw new Error(`Failed to generate game scene: ${error.message}`);
  }
};

/**
 * Generate cultural context illustration
 * @param {Object} params - Cultural illustration parameters
 * @param {string} params.culturalElement - Cultural element to illustrate
 * @param {Array<string>} params.relatedWords - Related vocabulary words
 * @param {string} params.description - Description of the cultural element
 * @returns {Promise<Object>} Generated cultural illustration
 */
exports.generateCulturalIllustration = async ({ culturalElement, relatedWords, description }) => {
  try {
    // Create a prompt for cultural context illustration
    const prompt = `An educational illustration of ${culturalElement}, a French cultural element. ${description}. Include visual elements related to: ${relatedWords.join(', ')}. The image should clearly depict French cultural context.`;
    
    // Generate image with cultural style
    const result = await exports.generateImage({
      prompt,
      style: 'cultural',
      size: 'medium'
    });
    
    // Add cultural-specific metadata
    result.metadata.culturalElement = culturalElement;
    result.metadata.relatedWords = relatedWords;
    
    return result;
  } catch (error) {
    logger.error(`Cultural illustration generation error: ${error.message}`);
    throw new Error(`Failed to generate cultural illustration: ${error.message}`);
  }
};

/**
 * Enhance prompt with style guidance and educational context
 * @param {string} prompt - Original prompt
 * @param {string} style - Style specification
 * @returns {string} Enhanced prompt
 */
function enhancePrompt(prompt, style) {
  const styleModifiers = {
    'educational': 'Clear, simple, educational style. Suitable for language learning. High contrast and distinct elements.',
    'cartoon': 'Simple cartoon style with vibrant colors. Child-friendly and engaging. Clean lines and minimal background.',
    'cultural': 'Authentic French cultural style. Rich in cultural details and context. Realistic representation of French culture.',
    'photorealistic': 'Photorealistic style with natural lighting. Detailed and precise representation. Realistic textures and proportions.'
  };
  
  const modifier = styleModifiers[style] || styleModifiers.educational;
  
  return `${prompt} ${modifier} The image should be accessible for language learners and clearly illustrate the concept.`;
}

/**
 * Get dimensions based on size specification
 * @param {string} size - Size specification (small, medium, large)
 * @returns {Object} Width and height configuration
 */
function getSizeDimensions(size) {
  const dimensions = {
    'small': { width: 512, height: 512 },
    'medium': { width: 768, height: 512 },
    'large': { width: 1024, height: 768 }
  };
  
  return dimensions[size] || dimensions.medium;
}

/**
 * Generate a placeholder image when API fails
 * @param {string} prompt - Original prompt
 * @param {string} style - Style specification
 * @param {string} size - Size specification
 * @returns {Object} Placeholder image data
 */
function generatePlaceholderImage(prompt, style, size) {
  // In a real application, this would generate a simple placeholder
  // For now, we'll return metadata to indicate it's a placeholder
  
  return {
    imageData: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiPlBsYWNlaG9sZGVyIEltYWdlPC90ZXh0Pjwvc3ZnPg==',
    isPlaceholder: true,
    metadata: {
      prompt,
      style,
      size,
      generatedAt: new Date().toISOString(),
      error: 'Failed to generate image, using placeholder instead'
    }
  };
}

module.exports = exports;