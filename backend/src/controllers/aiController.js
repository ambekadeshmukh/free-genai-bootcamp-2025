const openaiService = require('../services/ai/openaiService');
const claudeService = require('../services/ai/claudeService');
const imagenService = require('../services/ai/imagenService');
const huggingfaceService = require('../services/ai/huggingfaceService');
const cohereService = require('../services/ai/cohereService');
const chromadbService = require('../services/ai/chromadbService');
const cacheService = require('../services/cache/cacheService');
const { handleError } = require('../utils/errorHandler');

/**
 * Chat with AI Language Buddy
 */
exports.chatWithAI = async (req, res) => {
  try {
    const { message, userLevel, conversationHistory } = req.body;
    
    // Try to get from cache first
    const cacheKey = `chat_${message}_${userLevel}`;
    const cachedResponse = await cacheService.get(cacheKey);
    
    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    }
    
    // Use OpenAI instead of Claude for conversations
    const response = await openaiService.generateChatResponse({
      message,
      userLevel,
      conversationHistory
    });
    
    // Cache the response
    await cacheService.set(cacheKey, response, 3600); // 1 hour cache
    
    res.status(200).json(response);
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Generate content (vocabulary, phrases, etc.)
 */
exports.generateContent = async (req, res) => {
  try {
    const { contentType, theme, difficulty, count } = req.body;
    
    // Try to get from cache first
    const cacheKey = `content_${contentType}_${theme}_${difficulty}_${count}`;
    const cachedResponse = await cacheService.get(cacheKey);
    
    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    }
    
    // Use GPT-4 Turbo for content generation
    const content = await openaiService.generateContent({
      contentType,
      theme,
      difficulty,
      count
    });
    
    // Store in vector database for future retrieval
    await chromadbService.storeContent(content, {
      contentType,
      theme,
      difficulty
    });
    
    // Cache the response
    await cacheService.set(cacheKey, content, 86400); // 24 hours cache
    
    res.status(200).json(content);
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Analyze user's pronunciation
 */
exports.analyzePronunciation = async (req, res) => {
  try {
    const { audioData, text } = req.body;
    
    // Use Hugging Face for speech recognition and analysis
    const analysis = await huggingfaceService.analyzePronunciation(audioData, text);
    
    res.status(200).json(analysis);
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Generate an image for vocabulary or cultural context
 */
exports.generateImage = async (req, res) => {
  try {
    const { prompt, style, size } = req.body;
    
    // Try to get from cache first
    const cacheKey = `image_${prompt.substring(0, 50)}_${style}_${size}`;
    const cachedResponse = await cacheService.get(cacheKey);
    
    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    }
    
    // Use Google Imagen for image generation
    const image = await imagenService.generateImage({
      prompt,
      style,
      size
    });
    
    // Cache the response
    await cacheService.set(cacheKey, image, 604800); // 7 days cache
    
    res.status(200).json(image);
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Translate text between French and English
 */
exports.translateText = async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    
    // Use Hugging Face for translation
    const translation = await huggingfaceService.translateText(text, sourceLang, targetLang);
    
    res.status(200).json({ translation });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Convert text to speech for pronunciation examples
 */
exports.textToSpeech = async (req, res) => {
  try {
    const { text, voice } = req.body;
    
    // Try to get from cache first
    const cacheKey = `tts_${text.substring(0, 50)}_${voice}`;
    const cachedResponse = await cacheService.get(cacheKey);
    
    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    }
    
    // Use Hugging Face for text-to-speech
    const audioData = await huggingfaceService.textToSpeech(text, voice);
    
    // Cache the response
    await cacheService.set(cacheKey, audioData, 604800); // 7 days cache
    
    res.status(200).json({ audioData });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Generate cultural context for vocabulary learning
 */
exports.generateCulturalContext = async (req, res) => {
  try {
    const { vocabulary, theme, difficulty } = req.body;
    
    // Try to get from cache first
    const cacheKey = `cultural_${vocabulary.join('_')}_${theme}_${difficulty}`;
    const cachedResponse = await cacheService.get(cacheKey);
    
    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    }
    
    // Use GPT-4 Turbo for cultural context
    const contextText = await openaiService.generateCulturalContext({
      vocabulary,
      theme,
      difficulty
    });
    
    // Use Google Imagen for visual representation
    const contextImage = await imagenService.generateImage({
      prompt: `A scene depicting ${contextText.summary}. French cultural scene, educational, clear, detailed.`,
      style: 'educational',
      size: 'medium'
    });
    
    const response = {
      text: contextText,
      image: contextImage
    };
    
    // Cache the response
    await cacheService.set(cacheKey, response, 604800); // 7 days cache
    
    res.status(200).json(response);
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Generate personalized learning path
 */
exports.generateLearningPath = async (req, res) => {
  try {
    const { userProgress, userGoals, timeAvailable } = req.body;
    
    // Use OpenAI instead of Claude for learning path generation
    const learningPath = await openaiService.generateLearningPath({
      userProgress,
      userGoals,
      timeAvailable
    });
    
    // Store user's learning path in the database for tracking
    await chromadbService.storeLearningPath(learningPath, userProgress.userId);
    
    res.status(200).json(learningPath);
  } catch (error) {
    handleError(res, error);
  }
};