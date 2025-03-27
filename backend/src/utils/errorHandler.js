const logger = require('./logger');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Handle API errors in controllers
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 */
const handleError = (res, error) => {
  // Check if it's our custom ApiError
  if (error instanceof ApiError) {
    return res.status(error.status).json({
      error: {
        message: error.message,
        status: error.status,
        details: error.details
      }
    });
  }
  
  // External API errors (like from OpenAI, Claude, etc.)
  if (error.response && error.response.data) {
    // Handle service-specific errors
    const serviceError = mapServiceError(error);
    
    logger.error(`External API Error: ${error.message}`, {
      status: serviceError.status,
      service: serviceError.service,
      details: serviceError.details
    });
    
    return res.status(serviceError.status).json({
      error: {
        message: serviceError.message,
        status: serviceError.status,
        service: serviceError.service
      }
    });
  }
  
  // Default error handler
  logger.error(`Unhandled error: ${error.message}`);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      status: 500
    }
  });
};

/**
 * Maps external service errors to our API format
 * @param {Error} error - Error from external service
 * @returns {Object} Mapped error
 */
const mapServiceError = (error) => {
  // Default values
  let mapped = {
    message: 'External service error',
    status: 500,
    service: 'unknown',
    details: null
  };
  
  // Try to extract more specific information
  if (error.response && error.response.data) {
    const data = error.response.data;
    
    // OpenAI error format
    if (data.error && data.error.message) {
      mapped.message = data.error.message;
      mapped.status = error.response.status || 500;
      mapped.service = 'openai';
      mapped.details = data.error;
    }
    // Claude error format
    else if (data.type && data.message) {
      mapped.message = data.message;
      mapped.status = error.response.status || 500;
      mapped.service = 'anthropic';
      mapped.details = data;
    }
    // Hugging Face error format
    else if (data.error) {
      mapped.message = typeof data.error === 'string' ? data.error : 'Hugging Face API error';
      mapped.status = error.response.status || 500;
      mapped.service = 'huggingface';
      mapped.details = data;
    }
    // Cohere error format
    else if (data.message) {
      mapped.message = data.message;
      mapped.status = error.response.status || 500;
      mapped.service = 'cohere';
      mapped.details = data;
    }
    // Google API error format
    else if (data.error && data.error.message && data.error.status) {
      mapped.message = data.error.message;
      mapped.status = error.response.status || 500;
      mapped.service = 'google';
      mapped.details = data.error;
    }
  }
  
  // Handle rate limiting specifically
  if (error.response && error.response.status === 429) {
    mapped.message = 'Rate limit exceeded. Please try again later.';
    mapped.status = 429;
  }
  
  return mapped;
};

// Create specific error handlers for common cases
const notFound = (message = 'Resource not found') => new ApiError(message, 404);
const badRequest = (message = 'Bad request', details = null) => new ApiError(message, 400, details);
const unauthorized = (message = 'Unauthorized') => new ApiError(message, 401);
const forbidden = (message = 'Forbidden') => new ApiError(message, 403);
const rateLimit = (message = 'Rate limit exceeded') => new ApiError(message, 429);
const serverError = (message = 'Internal server error', details = null) => new ApiError(message, 500, details);

module.exports = {
  ApiError,
  handleError,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  rateLimit,
  serverError
};