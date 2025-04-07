const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

/**
 * @route   POST /api/ai/chat
 * @desc    Chat with AI Language Buddy
 * @access  Public
 */
router.post('/chat', aiController.chatWithAI);

/**
 * @route   POST /api/ai/generate-content
 * @desc    Generate content (vocabulary, phrases, etc.)
 * @access  Public
 */
router.post('/generate-content', aiController.generateContent);

/**
 * @route   POST /api/ai/analyze-pronunciation
 * @desc    Analyze user's pronunciation
 * @access  Public
 */
router.post('/analyze-pronunciation', aiController.analyzePronunciation);

/**
 * @route   POST /api/ai/generate-image
 * @desc    Generate an image for vocabulary or cultural context
 * @access  Public
 */
router.post('/generate-image', aiController.generateImage);

/**
 * @route   POST /api/ai/translate
 * @desc    Translate text between French and English
 * @access  Public
 */
router.post('/translate', aiController.translateText);

/**
 * @route   POST /api/ai/text-to-speech
 * @desc    Convert text to speech for pronunciation examples
 * @access  Public
 */
router.post('/text-to-speech', aiController.textToSpeech);

/**
 * @route   POST /api/ai/cultural-context
 * @desc    Generate cultural context for vocabulary learning
 * @access  Public
 */
router.post('/cultural-context', aiController.generateCulturalContext);

/**
 * @route   POST /api/ai/learning-path
 * @desc    Generate personalized learning path
 * @access  Public
 */
router.post('/learning-path', aiController.generateLearningPath);

module.exports = router;