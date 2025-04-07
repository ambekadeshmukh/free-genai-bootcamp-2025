// src/middleware/cors.js
/**
 * CORS middleware to allow cross-origin requests
 */
const corsMiddleware = (req, res, next) => {
    // Allow requests from the frontend domain
    res.header('Access-Control-Allow-Origin', '*');
    
    // Allow common HTTP methods
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    // Allow common headers
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    return next();
  };
  
  module.exports = corsMiddleware;