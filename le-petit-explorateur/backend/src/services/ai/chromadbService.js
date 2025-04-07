const { ChromaClient } = require('chromadb');
const logger = require('../../utils/logger');
const cohereService = require('./cohereService');

// Initialize ChromaDB client
const chromaClient = new ChromaClient({
  path: process.env.CHROMADB_URL || 'http://localhost:8000'
});

// Collection names
const COLLECTIONS = {
  VOCABULARY: 'french_vocabulary',
  CULTURAL: 'cultural_contexts',
  USER_PROGRESS: 'user_progress',
  LEARNING_PATHS: 'learning_paths'
};

/**
 * Initialize ChromaDB collections
 */
async function initializeCollections() {
  try {
    // Get list of existing collections
    const collections = await chromaClient.listCollections();
    const collectionNames = collections.map(c => c.name);
    
    // Create collections if they don't exist
    for (const collection of Object.values(COLLECTIONS)) {
      if (!collectionNames.includes(collection)) {
        await chromaClient.createCollection({ name: collection });
        logger.info(`Created ChromaDB collection: ${collection}`);
      }
    }
  } catch (error) {
    logger.error(`Failed to initialize ChromaDB collections: ${error.message}`);
  }
}

// Initialize collections when service starts
initializeCollections().catch(err => {
  logger.error(`ChromaDB initialization error: ${err.message}`);
});

/**
 * Store vocabulary with embeddings
 * @param {Array<Object>} vocabularyItems - Array of vocabulary items
 * @returns {Promise<void>}
 */
exports.storeVocabulary = async (vocabularyItems) => {
  try {
    const collection = await chromaClient.getCollection({ name: COLLECTIONS.VOCABULARY });
    
    // Process each vocabulary item
    for (const item of vocabularyItems) {
      // Get embedding from Cohere
      const embedding = await cohereService.getEmbedding(item.french);
      
      // Prepare metadata
      const metadata = {
        french: item.french,
        english: item.english,
        category: item.category || '',
        difficulty: item.difficulty || 'beginner',
        createdAt: new Date().toISOString()
      };
      
      // Add to ChromaDB
      await collection.add({
        ids: [`vocab_${item.french}`],
        embeddings: [embedding],
        metadatas: [metadata],
        documents: [JSON.stringify(item)]
      });
    }
    
    logger.info(`Stored ${vocabularyItems.length} vocabulary items in ChromaDB`);
  } catch (error) {
    logger.error(`ChromaDB vocabulary storage error: ${error.message}`);
    throw new Error(`Failed to store vocabulary: ${error.message}`);
  }
};

/**
 * Search for vocabulary by semantic similarity
 * @param {string} query - Search query
 * @param {Object} filters - Optional filters (category, difficulty)
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array<Object>>} Matching vocabulary items
 */
exports.searchVocabulary = async (query, filters = {}, limit = 10) => {
  try {
    const collection = await chromaClient.getCollection({ name: COLLECTIONS.VOCABULARY });
    
    // Get embedding for query
    const queryEmbedding = await cohereService.getEmbedding(query);
    
    // Convert filters to ChromaDB format
    let whereClause = {};
    if (filters.category) whereClause.category = filters.category;
    if (filters.difficulty) whereClause.difficulty = filters.difficulty;
    
    // Search in ChromaDB
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      whereDocument: Object.keys(whereClause).length > 0 ? whereClause : undefined
    });
    
    // Process results
    const vocabularyItems = results.documents[0].map((doc, index) => {
      const item = JSON.parse(doc);
      // Add distance/similarity score
      item.similarity = results.distances[0][index];
      return item;
    });
    
    return vocabularyItems;
  } catch (error) {
    logger.error(`ChromaDB vocabulary search error: ${error.message}`);
    throw new Error(`Failed to search vocabulary: ${error.message}`);
  }
};

/**
 * Store content for future retrieval
 * @param {Object} content - Content to store
 * @param {Object} metadata - Metadata for the content
 * @returns {Promise<void>}
 */
exports.storeContent = async (content, metadata) => {
  try {
    // Choose collection based on content type
    const collectionName = metadata.contentType === 'cultural'
      ? COLLECTIONS.CULTURAL
      : COLLECTIONS.VOCABULARY;
    
    const collection = await chromaClient.getCollection({ name: collectionName });
    
    // Get embedding for content summary or key phrase
    const contentSummary = content.summary || content.title || JSON.stringify(content).substring(0, 100);
    const embedding = await cohereService.getEmbedding(contentSummary);
    
    // Generate a unique ID
    const id = `content_${metadata.contentType}_${Date.now()}`;
    
    // Add to ChromaDB
    await collection.add({
      ids: [id],
      embeddings: [embedding],
      metadatas: [{ ...metadata, createdAt: new Date().toISOString() }],
      documents: [JSON.stringify(content)]
    });
    
    logger.info(`Stored content in ChromaDB with ID: ${id}`);
    return id;
  } catch (error) {
    logger.error(`ChromaDB content storage error: ${error.message}`);
    throw new Error(`Failed to store content: ${error.message}`);
  }
};

/**
 * Store user's learning path
 * @param {Object} learningPath - Learning path data
 * @param {string} userId - User identifier (or anonymous ID)
 * @returns {Promise<void>}
 */
exports.storeLearningPath = async (learningPath, userId) => {
  try {
    const collection = await chromaClient.getCollection({ name: COLLECTIONS.LEARNING_PATHS });
    
    // Create embedding for the learning path
    const pathSummary = `${learningPath.difficulty} ${learningPath.focus} ${learningPath.goals?.join(' ')}`;
    const embedding = await cohereService.getEmbedding(pathSummary);
    
    // Generate ID
    const id = `path_${userId}_${Date.now()}`;
    
    // Add to ChromaDB
    await collection.add({
      ids: [id],
      embeddings: [embedding],
      metadatas: [{
        userId,
        difficulty: learningPath.difficulty,
        focus: learningPath.focus,
        createdAt: new Date().toISOString()
      }],
      documents: [JSON.stringify(learningPath)]
    });
    
    logger.info(`Stored learning path for user: ${userId}`);
    return id;
  } catch (error) {
    logger.error(`ChromaDB learning path storage error: ${error.message}`);
    throw new Error(`Failed to store learning path: ${error.message}`);
  }
};

/**
 * Update user progress
 * @param {string} userId - User identifier (or anonymous ID)
 * @param {Object} progress - Progress data
 * @returns {Promise<void>}
 */
exports.updateUserProgress = async (userId, progress) => {
  try {
    const collection = await chromaClient.getCollection({ name: COLLECTIONS.USER_PROGRESS });
    
    // Check if user progress exists
    const existingProgress = await collection.get({
      where: { userId: userId }
    });
    
    if (existingProgress.ids.length > 0) {
      // Update existing progress
      await collection.update({
        ids: [existingProgress.ids[0]],
        metadatas: [{
          userId,
          lastUpdated: new Date().toISOString()
        }],
        documents: [JSON.stringify(progress)]
      });
    } else {
      // Create new progress entry
      // Create a simple embedding (not semantically meaningful for progress)
      const embedding = await cohereService.getEmbedding(userId);
      
      await collection.add({
        ids: [`progress_${userId}`],
        embeddings: [embedding],
        metadatas: [{
          userId,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }],
        documents: [JSON.stringify(progress)]
      });
    }
    
    logger.info(`Updated progress for user: ${userId}`);
  } catch (error) {
    logger.error(`ChromaDB progress update error: ${error.message}`);
    throw new Error(`Failed to update user progress: ${error.message}`);
  }
};

/**
 * Get user progress
 * @param {string} userId - User identifier (or anonymous ID)
 * @returns {Promise<Object>} User progress data
 */
exports.getUserProgress = async (userId) => {
  try {
    const collection = await chromaClient.getCollection({ name: COLLECTIONS.USER_PROGRESS });
    
    // Get user progress
    const result = await collection.get({
      where: { userId: userId }
    });
    
    if (result.ids.length === 0) {
      // No progress found, return empty progress
      return {
        userId,
        completedLessons: [],
        vocabulary: {
          learned: [],
          practicing: []
        },
        level: 'beginner'
      };
    }
    
    // Parse progress data
    return JSON.parse(result.documents[0]);
  } catch (error) {
    logger.error(`ChromaDB get progress error: ${error.message}`);
    throw new Error(`Failed to get user progress: ${error.message}`);
  }
};

/**
 * Get similar vocabulary words
 * @param {string} word - French word to find similar words for
 * @param {number} limit - Maximum number of similar words
 * @returns {Promise<Array<Object>>} Similar vocabulary items
 */
exports.getSimilarVocabulary = async (word, limit = 5) => {
  try {
    const collection = await chromaClient.getCollection({ name: COLLECTIONS.VOCABULARY });
    
    // Get embedding for word
    const embedding = await cohereService.getEmbedding(word);
    
    // Search in ChromaDB
    const results = await collection.query({
      queryEmbeddings: [embedding],
      nResults: limit + 1 // +1 because the word itself might be included
    });
    
    // Process results and filter out the original word
    const similarItems = results.documents[0]
      .map((doc, index) => {
        const item = JSON.parse(doc);
        item.similarity = results.distances[0][index];
        return item;
      })
      .filter(item => item.french.toLowerCase() !== word.toLowerCase())
      .slice(0, limit);
    
    return similarItems;
  } catch (error) {
    logger.error(`ChromaDB similar vocabulary error: ${error.message}`);
    throw new Error(`Failed to get similar vocabulary: ${error.message}`);
  }
};

module.exports = exports;