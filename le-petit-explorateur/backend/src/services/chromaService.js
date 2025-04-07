/**
 * ChromaDB Service
 * Handles integration with ChromaDB for vector storage and retrieval
 */

const { ChromaClient } = require('chromadb');

// Initialize ChromaDB client with configuration from environment variables
const CHROMADB_URL = process.env.CHROMADB_URL || 'http://chromadb:8000';
let client;

try {
  client = new ChromaClient({ path: CHROMADB_URL });
} catch (error) {
  console.error('Error initializing ChromaDB client:', error.message);
  // Create a mock client for graceful fallback
  client = {
    listCollections: async () => [],
    getCollection: async () => mockCollection,
    createCollection: async () => mockCollection
  };
}

// Mock collection for fallback when ChromaDB is unavailable
const mockCollection = {
  add: async () => ({ success: true }),
  get: async () => ({ ids: [], embeddings: [], documents: [], metadatas: [] }),
  query: async () => ({ ids: [], distances: [], embeddings: [], documents: [], metadatas: [] }),
  delete: async () => ({ success: true }),
  count: async () => 0
};

/**
 * Get or create a collection in ChromaDB
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<Object>} - The ChromaDB collection
 */
const getOrCreateCollection = async (collectionName) => {
  try {
    // Try to get the collection if it exists
    const collections = await client.listCollections();
    const exists = collections.some(c => c.name === collectionName);
    
    if (exists) {
      return await client.getCollection({ name: collectionName });
    } else {
      return await client.createCollection({ name: collectionName });
    }
  } catch (error) {
    console.error(`Error getting/creating collection ${collectionName}:`, error.message);
    // Return mock collection if there's an error
    return mockCollection;
  }
};

/**
 * Add documents to a collection with optional embeddings and metadata
 * @param {string} collectionName - Name of the collection
 * @param {Array<string>} documents - Array of document texts
 * @param {Array<Array<number>>} embeddings - Optional array of embedding vectors
 * @param {Array<Object>} metadatas - Optional array of metadata objects
 * @param {Array<string>} ids - Optional array of document IDs
 * @returns {Promise<Object>} - Result of the add operation
 */
const addDocuments = async (collectionName, documents, embeddings = null, metadatas = null, ids = null) => {
  try {
    const collection = await getOrCreateCollection(collectionName);
    
    if (!ids) {
      ids = documents.map((_, i) => `doc_${Date.now()}_${i}`);
    }
    
    return await collection.add({
      documents,
      embeddings,
      metadatas,
      ids
    });
  } catch (error) {
    console.error(`Error adding documents to ${collectionName}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Query a collection for similar documents
 * @param {string} collectionName - Name of the collection
 * @param {Array<string>} queryTexts - Array of query texts
 * @param {number} nResults - Maximum number of results to return
 * @param {Object} where - Optional where filter
 * @returns {Promise<Object>} - Query results
 */
const queryCollection = async (collectionName, queryTexts, nResults = 10, where = null) => {
  try {
    const collection = await getOrCreateCollection(collectionName);
    
    const queryParams = {
      queryTexts,
      nResults
    };
    
    if (where) {
      queryParams.where = where;
    }
    
    return await collection.query(queryParams);
  } catch (error) {
    console.error(`Error querying collection ${collectionName}:`, error.message);
    return { ids: [], distances: [], documents: [] };
  }
};

/**
 * Get documents by IDs
 * @param {string} collectionName - Name of the collection
 * @param {Array<string>} ids - Array of document IDs
 * @returns {Promise<Object>} - Documents matching the IDs
 */
const getDocuments = async (collectionName, ids) => {
  try {
    const collection = await getOrCreateCollection(collectionName);
    return await collection.get({ ids });
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error.message);
    return { ids: [], embeddings: [], documents: [], metadatas: [] };
  }
};

/**
 * Delete documents by IDs
 * @param {string} collectionName - Name of the collection
 * @param {Array<string>} ids - Array of document IDs
 * @returns {Promise<Object>} - Result of the delete operation
 */
const deleteDocuments = async (collectionName, ids) => {
  try {
    const collection = await getOrCreateCollection(collectionName);
    return await collection.delete({ ids });
  } catch (error) {
    console.error(`Error deleting documents from ${collectionName}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getOrCreateCollection,
  addDocuments,
  queryCollection,
  getDocuments,
  deleteDocuments
};