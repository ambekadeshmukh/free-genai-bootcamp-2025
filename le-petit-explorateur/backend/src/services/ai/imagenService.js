const axios = require('axios');
const logger = require('../../utils/logger');
const fs = require('fs').promises;
const path = require('path');

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
    if (!API_KEY) {
      throw new Error('Google API key is not configured');
    }
    
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
      },
      timeout: 30000 // 30 second timeout
    });
    
    // Extract image data
    if (response.data && 
        response.data.candidates && 
        response.data.candidates[0] && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts[0] && 
        response.data.candidates[0].content.parts[0].inlineData && 
        response.data.candidates[0].content.parts[0].inlineData.data) {
      
      const imageData = response.data.candidates[0].content.parts[0].inlineData.data;
      
      // Check if we need to save the image to disk (for persistency)
      const imagePath = await saveImageToDisk(imageData, prompt);
      
      return {
        imageData: `data:image/jpeg;base64,${imageData}`,
        imageUrl: imagePath ? `/images/${path.basename(imagePath)}` : null,
        metadata: {
          prompt: enhancedPrompt,
          style,
          size,
          generatedAt: new Date().toISOString()
        }
      };
    } else {
      throw new Error('Invalid image data structure in response');
    }
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
    const prompt = `A clear, simple educational illustration of the French word "${word}" meaning "${translation}" ${context ? `in the context of ${context}` : ''}. Create a simple, iconic image suitable for language learning that clearly represents the word's meaning. The image should be easy to understand with clean lines and minimal background elements. Use bright, engaging colors appropriate for educational content.`;
    
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
    
    // Use a placeholder that's reliable when Google Imagen fails
    return {
      imageData: `data:image/svg+xml;base64,${getWordImagePlaceholder(word, translation)}`,
      isPlaceholder: true,
      metadata: {
        vocabularyWord: word,
        translation: translation,
        error: 'Failed to generate vocabulary illustration, using placeholder'
      }
    };
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
    const prompt = `A ${difficulty} level French learning scene of a ${theme} with clearly visible objects including: ${targetWords.join(', ')}. The scene should be well-organized, colorful, and educational with distinct objects that can be easily identified by language learners. Each object should be clearly visible and recognizable, with minimal distracting elements. The style should be clean and simple, appropriate for educational content.`;
    
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
    
    // Use a placeholder scene
    return generatePlaceholderScene(theme, targetWords, difficulty);
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
    'educational': 'Clear, simple, educational style. Suitable for language learning. High contrast and distinct elements. Avoid text labels.',
    'cartoon': 'Simple cartoon style with vibrant colors. Child-friendly and engaging. Clean lines and minimal background. Avoid text labels.',
    'cultural': 'Authentic French cultural style. Rich in cultural details and context. Realistic representation of French culture. Avoid text labels.',
    'photorealistic': 'Photorealistic style with natural lighting. Detailed and precise representation. Realistic textures and proportions. Avoid text labels.'
  };
  
  const modifier = styleModifiers[style] || styleModifiers.educational;
  
  return `${prompt} ${modifier} The image should be accessible for language learners and clearly illustrate the concept without any text labels or distracting elements.`;
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
 * Save generated image to disk for persistence
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} prompt - The prompt used to generate the image
 * @returns {Promise<string|null>} Path to saved image or null if saving failed
 */
async function saveImageToDisk(base64Data, prompt) {
  try {
    // Create hash for the prompt to use as filename
    const filename = `${Date.now()}-${prompt.substring(0, 20).replace(/[^a-z0-9]/gi, '_')}.jpg`;
    const dirPath = path.join(__dirname, '../../../public/images');
    const filePath = path.join(dirPath, filename);
    
    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });
    
    // Write file
    await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));
    
    return filePath;
  } catch (error) {
    logger.error(`Failed to save image to disk: ${error.message}`);
    return null;
  }
}

/**
 * Generate a placeholder image when API fails
 * @param {string} prompt - Original prompt
 * @param {string} style - Style specification
 * @param {string} size - Size specification
 * @returns {Object} Placeholder image data
 */
function generatePlaceholderImage(prompt, style, size) {
  // Extract key term from prompt for placeholder
  const promptWords = prompt.split(' ');
  const keyTerm = promptWords.length > 2 ? promptWords.slice(0, 3).join(' ') : prompt;
  
  // Create SVG placeholder with text
  const svgContent = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${getSizeDimensions(size).width}" height="${getSizeDimensions(size).height}" viewBox="0 0 ${getSizeDimensions(size).width} ${getSizeDimensions(size).height}">
    <rect width="100%" height="100%" fill="#f0f0f0"/>
    <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="#999999">Image: ${keyTerm}</text>
  </svg>
  `;
  
  // Convert SVG to base64
  const base64Svg = Buffer.from(svgContent).toString('base64');
  
  return {
    imageData: `data:image/svg+xml;base64,${base64Svg}`,
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

/**
 * Generate a placeholder scene for the game
 * @param {string} theme - Theme of the scene
 * @param {Array<string>} targetWords - Target vocabulary words
 * @param {string} difficulty - Difficulty level
 * @returns {Object} Placeholder scene data
 */
function generatePlaceholderScene(theme, targetWords, difficulty) {
  // Create a diagram-like placeholder with objects labeled
  const svgContent = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768" viewBox="0 0 1024 768">
    <rect width="100%" height="100%" fill="#f0f0f0"/>
    <text x="512" y="50" font-family="Arial" font-size="24" text-anchor="middle" font-weight="bold" fill="#666666">${theme.toUpperCase()} SCENE (${difficulty})</text>
    ${targetWords.map((word, index) => {
      const x = 100 + (index % 3) * 300;
      const y = 150 + Math.floor(index / 3) * 200;
      return `
        <rect x="${x - 80}" y="${y - 80}" width="160" height="160" fill="#ffffff" stroke="#cccccc" stroke-width="2"/>
        <text x="${x}" y="${y}" font-family="Arial" font-size="18" text-anchor="middle" dominant-baseline="middle" fill="#999999">${word}</text>
      `;
    }).join('')}
  </svg>
  `;
  
  // Convert SVG to base64
  const base64Svg = Buffer.from(svgContent).toString('base64');
  
  return {
    imageData: `data:image/svg+xml;base64,${base64Svg}`,
    isPlaceholder: true,
    metadata: {
      gameType: 'ObjectNaming',
      theme,
      targetWords,
      difficulty,
      generatedAt: new Date().toISOString(),
      error: 'Failed to generate game scene, using placeholder instead'
    }
  };
}

/**
 * Create a base64-encoded SVG placeholder for vocabulary words
 * @param {string} word - French word
 * @param {string} translation - English translation
 * @returns {string} Base64-encoded SVG
 */
function getWordImagePlaceholder(word, translation) {
  const colors = {
    animals: '#FFD6A5',
    food: '#CAFFBF',
    greetings: '#9BF6FF',
    places: '#BDB2FF',
    clothing: '#FFC6FF',
    household: '#FDFFB6',
    colors: '#A0C4FF',
    default: '#EFEFEF'
  };
  
  // Determine likely category from translation
  let category = 'default';
  const lowerTranslation = translation.toLowerCase();
  
  if (/cat|dog|bird|animal|fish|pet|horse|cow|pig|sheep|mouse|rabbit|duck|chicken/.test(lowerTranslation)) {
    category = 'animals';
  } else if (/bread|cheese|milk|water|food|eat|drink|apple|banana|orange|pizza|breakfast|lunch|dinner/.test(lowerTranslation)) {
    category = 'food';
  } else if (/hello|goodbye|welcome|thank|please|morning|evening|sorry|excuse/.test(lowerTranslation)) {
    category = 'greetings';
  } else if (/house|home|building|city|street|room|office|school|store|shop|market|library|park/.test(lowerTranslation)) {
    category = 'places';
  } else if (/shirt|pants|dress|hat|shoes|jacket|coat|socks|sweater|clothes/.test(lowerTranslation)) {
    category = 'clothing';
  } else if (/table|chair|bed|sofa|couch|lamp|door|window|kitchen|bathroom|living|furniture/.test(lowerTranslation)) {
    category = 'household';
  } else if (/red|blue|green|yellow|black|white|color|orange|purple|pink|brown/.test(lowerTranslation)) {
    category = 'colors';
  }
  
  // Create SVG placeholder with colored background based on category
  const bgColor = colors[category];
  const svgContent = `
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="100%" height="100%" fill="${bgColor}"/>
    <text x="200" y="180" font-family="Arial" font-size="36" text-anchor="middle" font-weight="bold" fill="#333333">${word}</text>
    <text x="200" y="230" font-family="Arial" font-size="28" text-anchor="middle" fill="#666666">${translation}</text>
  </svg>
  `;
  
  // Convert SVG to base64
  return Buffer.from(svgContent).toString('base64');
}