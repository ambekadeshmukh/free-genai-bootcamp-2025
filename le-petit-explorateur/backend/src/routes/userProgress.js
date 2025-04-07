const express = require('express');
const router = express.Router();

// Get user progress
router.get('/', (req, res) => {
  // Mock user progress data
  res.json({
    success: true,
    data: {
      level: 'beginner',
      streak: 0,
      completedLessons: [],
      points: 0
    }
  });
});

// Update user progress
router.post('/', (req, res) => {
  const { level, completedLessons, points } = req.body;
  
  // Mock update response
  res.json({
    success: true,
    message: 'Progress updated successfully',
    data: {
      level: level || 'beginner',
      streak: 1,
      completedLessons: completedLessons || [],
      points: points || 0
    }
  });
});

module.exports = router;