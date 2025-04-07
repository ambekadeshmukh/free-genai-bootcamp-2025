const express = require('express');
const router = express.Router();

// Mock translation endpoint for development
router.post('/', (req, res) => {
  const { text, targetLanguage = 'fr' } = req.body;
  
  // Return mock translation
  res.json({
    success: true,
    translation: text,
    language: targetLanguage,
    note: 'This is a mock translation endpoint'
  });
});

module.exports = router;