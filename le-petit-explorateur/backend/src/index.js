require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const path = require('path');

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Allow all origins if not specified
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(limiter);

// Trust proxy for rate limiting behind nginx
app.set('trust proxy', 1);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    time: new Date().toISOString()
  });
});

// Import routes
const lessonRoutes = require('./routes/lessons');
const userProgressRoutes = require('./routes/userProgress');
const translationRoutes = require('./routes/translations');
const aiRoutes = require('./routes/aiRoutes');

// Use routes
app.use('/api/lessons', lessonRoutes);
app.use('/api/progress', userProgressRoutes);
app.use('/api/translate', translationRoutes);
app.use('/api/ai', aiRoutes);

// Simple vocabulary fallback API for frontend testing
app.get('/api/vocabulary', (req, res) => {
  res.status(200).json([
    { id: '1', french: 'Bonjour', english: 'Hello', category: 'greetings' },
    { id: '2', french: 'Au revoir', english: 'Goodbye', category: 'greetings' },
    { id: '3', french: 'Merci', english: 'Thank you', category: 'expressions' },
    { id: '4', french: 'S\'il vous plaît', english: 'Please', category: 'expressions' },
    { id: '5', french: 'Chat', english: 'Cat', category: 'animals' },
    { id: '6', french: 'Chien', english: 'Dog', category: 'animals' },
    { id: '7', french: 'Un', english: 'One', category: 'numbers' },
    { id: '8', french: 'Deux', english: 'Two', category: 'numbers' }
  ]);
});

// Basic error handler for API requests
app.use('/api/*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Health check available at: http://localhost:${PORT}/api/health`);
});