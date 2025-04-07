const NodeCache = require('node-cache');
const logger = require('../../utils/logger');

// Initialize cache with default TTL of 1 hour
const cache = new NodeCache({
  stdTTL: 3600, // 1 hour in seconds
  checkperiod: 120 // Check for expired keys every 2 minutes
});

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {boolean} Success status
 */
exports.set = async (key, value, ttl) => {
  try {
    const success = cache.set(key, value, ttl);
    if (success) {
      logger.debug(`Cache set: ${key}`);
    } else {
      logger.warn(`Failed to set cache: ${key}`);
    }
    return success;
  } catch (error) {
    logger.error(`Cache set error: ${error.message}`);
    return false;
  }
};

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {any} Cached value or undefined if not found
 */
exports.get = async (key) => {
  try {
    const value = cache.get(key);
    if (value !== undefined) {
      logger.debug(`Cache hit: ${key}`);
    } else {
      logger.debug(`Cache miss: ${key}`);
    }
    return value;
  } catch (error) {
    logger.error(`Cache get error: ${error.message}`);
    return undefined;
  }
};

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {boolean} Success status
 */
exports.delete = async (key) => {
  try {
    const count = cache.del(key);
    if (count > 0) {
      logger.debug(`Cache delete: ${key}`);
    }
    return count > 0;
  } catch (error) {
    logger.error(`Cache delete error: ${error.message}`);
    return false;
  }
};

/**
 * Check if key exists in cache
 * @param {string} key - Cache key
 * @returns {boolean} True if key exists
 */
exports.has = async (key) => {
  try {
    return cache.has(key);
  } catch (error) {
    logger.error(`Cache has error: ${error.message}`);
    return false;
  }
};

/**
 * Flush all cache
 * @returns {boolean} Success status
 */
exports.flushAll = async () => {
  try {
    cache.flushAll();
    logger.info('Cache flushed');
    return true;
  } catch (error) {
    logger.error(`Cache flush error: ${error.message}`);
    return false;
  }
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
exports.getStats = async () => {
  try {
    return {
      keys: cache.keys().length,
      hits: cache.getStats().hits,
      misses: cache.getStats().misses,
      ksize: cache.getStats().ksize,
      vsize: cache.getStats().vsize
    };
  } catch (error) {
    logger.error(`Cache stats error: ${error.message}`);
    return {
      keys: 0,
      hits: 0,
      misses: 0,
      ksize: 0,
      vsize: 0
    };
  }
};

module.exports = exports;