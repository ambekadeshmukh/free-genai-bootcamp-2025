const express = require('express');
const router = express.Router();

// Mock data for lessons if DB is not available
const mockLessons = [
  {
    id: '1',
    title: 'Basic Greetings',
    level: 'beginner',
    vocabulary: [
      { french: 'Bonjour', english: 'Hello' },
      { french: 'Au revoir', english: 'Goodbye' },
      { french: 'Merci', english: 'Thank you' },
      { french: 'S\'il vous plaît', english: 'Please' }
    ]
  },
  {
    id: '2',
    title: 'Food & Dining',
    level: 'beginner',
    vocabulary: [
      { french: 'Pain', english: 'Bread' },
      { french: 'Eau', english: 'Water' },
      { french: 'Vin', english: 'Wine' },
      { french: 'Fromage', english: 'Cheese' }
    ]
  }
];

// Get all lessons
router.get('/', (req, res) => {
  res.status(200).json(mockLessons);
});

// Get lesson by ID
router.get('/:id', (req, res) => {
  const lesson = mockLessons.find(l => l.id === req.params.id);
  
  if (!lesson) {
    return res.status(404).json({ message: 'Lesson not found' });
  }
  
  res.status(200).json(lesson);
});

// Create a new lesson
router.post('/', (req, res) => {
  // In a real app, would save to DB
  res.status(201).json({ message: 'Lesson created (mocked)' });
});

// Update a lesson
router.put('/:id', (req, res) => {
  // Fix for the error reported in logs - this route was missing a callback
  res.status(200).json({ message: 'Lesson updated (mocked)' });
});

// Delete a lesson
router.delete('/:id', (req, res) => {
  res.status(200).json({ message: 'Lesson deleted (mocked)' });
});

module.exports = router;