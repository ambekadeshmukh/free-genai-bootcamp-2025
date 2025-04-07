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
 * @route   POST /api/ai/generate-image
 * @desc    Generate an image for vocabulary or cultural context
 * @access  Public
 */
router.post('/generate-image', aiController.generateImage);

/**
 * @route   POST /api/ai/generate-quiz
 * @desc    Generate quiz questions
 * @access  Public
 */
router.post('/generate-quiz', aiController.generateQuizQuestions);

/**
 * @route   GET /api/ai/phrase-constructor/:level
 * @desc    Get phrase constructor data
 * @access  Public
 */
router.get('/phrase-constructor/:level', aiController.getPhraseConstructorData);

/**
 * @route   GET /api/ai/word-lineup/:level
 * @desc    Get words for Word Lineup game
 * @access  Public
 */
router.get('/word-lineup/:level', aiController.getWordLineupWords);

/**
 * @route   GET /api/ai/daily-lesson
 * @desc    Get daily lesson vocabulary
 * @access  Public
 */
router.get('/daily-lesson', aiController.getDailyLesson);

/**
 * @route   POST /api/ai/word-details
 * @desc    Get word details for flashcard AI integration
 * @access  Public
 */
router.post('/word-details', aiController.getWordDetails);

module.exports = router;