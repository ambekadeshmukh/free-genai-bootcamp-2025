const { CohereClient } = require('cohere-ai');
const logger = require('../../utils/logger');

// Initialize Cohere client
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY
});

/**
 * Get embedding for text
 * @param {string} text - Text to get embedding for
 * @returns {Promise<Array<number>>} Embedding vector
 */
exports.getEmbedding = async (text) => {
  try {
    const response = await cohere.embed({
      texts: [text],
      model: 'embed-multilingual-v3.0',
      inputType: 'search_query'
    });
    
    return response.embeddings[0];
  } catch (error) {
    logger.error(`Cohere embedding error: ${error.message}`);
    throw new Error(`Failed to get embedding: ${error.message}`);
  }
};

/**
 * Find semantically similar content
 * @param {string} query - Query text
 * @param {Array<Object>} documents - Documents to search through
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array<Object>>} Ranked similar documents
 */
exports.findSimilarContent = async (query, documents, limit = 5) => {
  try {
    // Get embedding for query
    const queryEmbedding = await exports.getEmbedding(query);
    
    // Get embeddings for all documents
    const documentTexts = documents.map(doc => 
      doc.text || doc.content || JSON.stringify(doc).substring(0, 512)
    );
    
    const response = await cohere.embed({
      texts: documentTexts,
      model: 'embed-multilingual-v3.0',
      inputType: 'search_document'
    });
    
    const documentEmbeddings = response.embeddings;
    
    // Calculate similarity scores
    const similarities = documentEmbeddings.map(embedding => 
      calculateCosineSimilarity(queryEmbedding, embedding)
    );
    
    // Rank documents by similarity
    const rankedDocuments = documents
      .map((doc, index) => ({
        ...doc,
        similarityScore: similarities[index]
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
    
    return rankedDocuments;
  } catch (error) {
    logger.error(`Cohere similar content error: ${error.message}`);
    throw new Error(`Failed to find similar content: ${error.message}`);
  }
};

/**
 * Generate search query rewrites for semantic search
 * @param {string} query - Original search query
 * @param {string} language - Language of the query (en, fr)
 * @returns {Promise<Array<string>>} Rewritten queries
 */
exports.generateQueryRewrites = async (query, language = 'fr') => {
  try {
    const response = await cohere.rerank({
      query,
      documents: [],
      topN: 3,
      model: 'rerank-multilingual-v2.0',
      returnQueryRewrites: true
    });
    
    // Extract query rewrites
    const rewrites = response.queryRewrites || [];
    
    return rewrites;
  } catch (error) {
    logger.error(`Cohere query rewrite error: ${error.message}`);
    throw new Error(`Failed to generate query rewrites: ${error.message}`);
  }
};

/**
 * Create semantic clusters from vocabulary
 * @param {Array<Object>} vocabularyItems - Vocabulary items to cluster
 * @param {number} numClusters - Number of clusters to create
 * @returns {Promise<Object>} Clusters of vocabulary
 */
exports.createVocabularyClusters = async (vocabularyItems, numClusters = 5) => {
  try {
    // Extract French words from vocabulary items
    const words = vocabularyItems.map(item => item.french);
    
    // Get embeddings for all words
    const response = await cohere.embed({
      texts: words,
      model: 'embed-multilingual-v3.0',
      inputType: 'classification'
    });
    
    const embeddings = response.embeddings;
    
    // Perform K-means clustering
    const clusters = kMeansClustering(embeddings, numClusters);
    
    // Map cluster IDs to vocabulary items
    const result = {};
    for (let i = 0; i < vocabularyItems.length; i++) {
      const clusterId = clusters[i];
      if (!result[clusterId]) {
        result[clusterId] = [];
      }
      result[clusterId].push(vocabularyItems[i]);
    }
    
    // Generate cluster names using common themes
    const clusterNames = await generateClusterNames(result);
    
    // Format the result
    const formattedClusters = Object.entries(result).map(([clusterId, items]) => ({
      id: clusterId,
      name: clusterNames[clusterId] || `Cluster ${clusterId}`,
      items
    }));
    
    return {
      clusters: formattedClusters,
      metadata: {
        numClusters,
        totalItems: vocabularyItems.length,
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error(`Cohere clustering error: ${error.message}`);
    throw new Error(`Failed to create vocabulary clusters: ${error.message}`);
  }
};

/**
 * Calculate vocabulary similarity for recommendations
 * @param {Array<string>} knownWords - Words the user already knows
 * @param {Array<Object>} candidateWords - Candidate words for recommendation
 * @param {number} limit - Maximum number of recommendations
 * @returns {Promise<Array<Object>>} Recommended vocabulary
 */
exports.getVocabularyRecommendations = async (knownWords, candidateWords, limit = 10) => {
  try {
    if (knownWords.length === 0 || candidateWords.length === 0) {
      // If no known words, return random selection from candidates
      return shuffleArray(candidateWords).slice(0, limit);
    }
    
    // Get embeddings for known words
    const knownEmbeddings = await getEmbeddingBatch(knownWords);
    
    // Get embeddings for candidate words
    const candidateTexts = candidateWords.map(word => word.french);
    const candidateEmbeddings = await getEmbeddingBatch(candidateTexts);
    
    // Calculate average embedding for known words
    const averageKnownEmbedding = calculateAverageEmbedding(knownEmbeddings);
    
    // Calculate similarities between average known embedding and each candidate
    const similarities = candidateEmbeddings.map(embedding => 
      calculateCosineSimilarity(averageKnownEmbedding, embedding)
    );
    
    // Rank candidates by similarity
    const recommendations = candidateWords
      .map((word, index) => ({
        ...word,
        similarityScore: similarities[index]
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
    
    return recommendations;
  } catch (error) {
    logger.error(`Cohere recommendations error: ${error.message}`);
    throw new Error(`Failed to get vocabulary recommendations: ${error.message}`);
  }
};

/**
 * Get embeddings for a batch of texts
 * @param {Array<string>} texts - Texts to get embeddings for
 * @returns {Promise<Array<Array<number>>>} Array of embedding vectors
 */
async function getEmbeddingBatch(texts) {
  try {
    const response = await cohere.embed({
      texts,
      model: 'embed-multilingual-v3.0',
      inputType: 'classification'
    });
    
    return response.embeddings;
  } catch (error) {
    logger.error(`Cohere batch embedding error: ${error.message}`);
    throw new Error(`Failed to get batch embeddings: ${error.message}`);
  }
}

/**
 * Calculate average embedding from multiple embeddings
 * @param {Array<Array<number>>} embeddings - Array of embedding vectors
 * @returns {Array<number>} Average embedding vector
 */
function calculateAverageEmbedding(embeddings) {
  const dimension = embeddings[0].length;
  const average = new Array(dimension).fill(0);
  
  // Sum all embeddings
  for (const embedding of embeddings) {
    for (let i = 0; i < dimension; i++) {
      average[i] += embedding[i];
    }
  }
  
  // Divide by count to get average
  for (let i = 0; i < dimension; i++) {
    average[i] /= embeddings.length;
  }
  
  return average;
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} a - First vector
 * @param {Array<number>} b - Second vector
 * @returns {number} Cosine similarity (between -1 and 1)
 */
function calculateCosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  return dotProduct / (normA * normB);
}

/**
 * K-means clustering algorithm
 * @param {Array<Array<number>>} data - Array of data points (embeddings)
 * @param {number} k - Number of clusters
 * @param {number} maxIterations - Maximum iterations
 * @returns {Array<number>} Cluster assignments for each data point
 */
function kMeansClustering(data, k, maxIterations = 100) {
  const n = data.length;
  const dim = data[0].length;
  
  // Randomly select k data points as initial centroids
  const centroids = [];
  const usedIndices = new Set();
  
  for (let i = 0; i < k; i++) {
    let idx;
    do {
      idx = Math.floor(Math.random() * n);
    } while (usedIndices.has(idx));
    
    usedIndices.add(idx);
    centroids.push(data[idx].slice());
  }
  
  // Cluster assignments
  let clusters = new Array(n).fill(0);
  
  // Iterate until convergence or max iterations
  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign each data point to nearest centroid
    let changed = false;
    
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let newCluster = 0;
      
      for (let j = 0; j < k; j++) {
        const dist = euclideanDistance(data[i], centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          newCluster = j;
        }
      }
      
      if (clusters[i] !== newCluster) {
        clusters[i] = newCluster;
        changed = true;
      }
    }
    
    // If no assignments changed, we've converged
    if (!changed) break;
    
    // Update centroids
    const counts = new Array(k).fill(0);
    const newCentroids = Array(k).fill().map(() => new Array(dim).fill(0));
    
    for (let i = 0; i < n; i++) {
      const cluster = clusters[i];
      counts[cluster]++;
      
      for (let j = 0; j < dim; j++) {
        newCentroids[cluster][j] += data[i][j];
      }
    }
    
    // Calculate average for each centroid
    for (let i = 0; i < k; i++) {
      if (counts[i] > 0) {
        for (let j = 0; j < dim; j++) {
          centroids[i][j] = newCentroids[i][j] / counts[i];
        }
      }
    }
  }
  
  return clusters;
}

/**
 * Calculate Euclidean distance between two vectors
 * @param {Array<number>} a - First vector
 * @param {Array<number>} b - Second vector
 * @returns {number} Euclidean distance
 */
function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Generate names for vocabulary clusters
 * @param {Object} clusters - Clusters of vocabulary items
 * @returns {Promise<Object>} Cluster names
 */
async function generateClusterNames(clusters) {
  try {
    const clusterNames = {};
    
    for (const [clusterId, items] of Object.entries(clusters)) {
      // Extract words for this cluster
      const words = items.map(item => item.french).join(', ');
      
      // Generate a name using Cohere
      const response = await cohere.chat({
        message: `These French words are in the same group. Please give this group a short, descriptive name (1-3 words) in French that categorizes them:\n\n${words}`,
        model: 'command-light',
        temperature: 0.3,
        maxTokens: 10
      });
      
      // Clean up the response to get just the name
      let name = response.text.trim();
      // Remove any quotes
      name = name.replace(/["']/g, '');
      // Take only the first line
      name = name.split('\n')[0];
      // Limit to 30 characters
      name = name.substring(0, 30);
      
      clusterNames[clusterId] = name;
    }
    
    return clusterNames;
  } catch (error) {
    logger.error(`Cluster naming error: ${error.message}`);
    // Fallback to generic names
    const fallbackNames = {};
    for (const clusterId of Object.keys(clusters)) {
      fallbackNames[clusterId] = `Groupe ${clusterId}`;
    }
    return fallbackNames;
  }
}

/**
 * Shuffle array elements (Fisher-Yates algorithm)
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

module.exports = exports;