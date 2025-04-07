import axios from 'axios';

// API base URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increase timeout for AI operations
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptor for error handling and retries
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Log detailed error information
    console.error('API Error Details:', {
      endpoint: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    // Don't retry if we've already retried or if it's a 4xx error (except 429)
    if (
      originalRequest._retry || 
      (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429)
    ) {
      return Promise.reject(error);
    }
    
    // Allow one retry for network errors, timeouts, and 5xx server errors
    if (
      !error.response || 
      error.code === 'ECONNABORTED' || 
      (error.response && error.response.status >= 500)
    ) {
      originalRequest._retry = true;
      
      // Wait 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

// Enable detailed request logging
api.interceptors.request.use(request => {
  console.log('Starting API Request:', {
    url: request.url,
    method: request.method,
    data: request.data
  });
  return request;
});

/**
 * API Service for Le Petit Explorateur
 */
const apiService = {
  /**
   * Chat with AI language buddy
   * @param {string} message - User message
   * @param {string} userLevel - User's French level
   * @param {Array} conversationHistory - Previous messages
   * @returns {Promise<Object>} Chat response
   */
  chatWithAI: async (message, userLevel, conversationHistory = []) => {
    try {
      console.log('Sending chat message to AI:', { message, userLevel });
      
      // Ensure we're sending a properly formatted request
      const payload = {
        message,
        userLevel,
        conversationHistory: conversationHistory.slice(-10) // Limit history size
      };
      
      const response = await api.post('/ai/chat', payload);
      
      if (response.data && response.data.response) {
        console.log('Received AI chat response');
        return response.data;
      } else {
        throw new Error('Invalid response format from AI chat API');
      }
    } catch (error) {
      console.error('Error in AI chat:', error);
      
      // Return a fallback response
      return {
        response: getFallbackChatResponse(message, userLevel),
        suggestions: [
          "Comment dit-on... en français? (How do you say... in French?)",
          "Je ne comprends pas. (I don't understand.)",
          "Pouvez-vous répéter, s'il vous plaît? (Can you repeat, please?)"
        ]
      };
    }
  },
  
  /**
   * Generate content (vocabulary, phrases, etc.)
   * @param {string} contentType - Type of content
   * @param {string} theme - Theme for the content
   * @param {string} difficulty - Difficulty level
   * @param {number} count - Number of items
   * @returns {Promise<Array>} Generated content
   */
  generateContent: async (contentType, theme, difficulty, count) => {
    try {
      const response = await api.post('/ai/generate-content', {
        contentType,
        theme,
        difficulty,
        count
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error generating ${contentType}:`, error);
      
      // Return fallback content based on the requested type
      return getFallbackContent(contentType, theme, difficulty, count);
    }
  },
  
  /**
   * Generate image for vocabulary or scene
   * @param {string} prompt - Image generation prompt
   * @param {string} style - Style of the image
   * @param {string} size - Size of the image
   * @returns {Promise<Object>} Generated image data
   */
  generateImage: async (prompt, style = 'educational', size = 'medium') => {
    try {
      const response = await api.post('/ai/generate-image', {
        prompt,
        style,
        size
      });
      
      return response.data;
    } catch (error) {
      console.error('Error generating image:', error);
      
      // Return a fallback image (placeholder)
      return {
        imageData: `https://via.placeholder.com/400x300?text=${encodeURIComponent(prompt)}`,
        isPlaceholder: true
      };
    }
  },
  
  /**
   * Generate vocabulary illustrations
   * @param {string} word - French word
   * @param {string} translation - English translation
   * @param {string} context - Optional context
   * @returns {Promise<Object>} Illustration data
   */
  generateVocabularyIllustration: async (word, translation, context = '') => {
    try {
      const response = await api.post('/ai/generate-image', {
        prompt: `Illustration of the French word "${word}" (${translation})`,
        style: 'educational',
        size: 'medium'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error generating vocabulary illustration:', error);
      
      // Return a colorful placeholder based on the word category
      return {
        imageData: getWordPlaceholder(word, translation),
        isPlaceholder: true
      };
    }
  },
  
  /**
   * Generate game scene with multiple target objects
   * @param {string} theme - Scene theme
   * @param {Array<string>} targetWords - Words to include in scene
   * @param {string} difficulty - Difficulty level
   * @returns {Promise<Object>} Generated scene data
   */
  generateGameScene: async (theme, targetWords, difficulty) => {
    try {
      const response = await api.post('/ai/generate-image', {
        prompt: `A ${difficulty} level French learning scene of a ${theme} with clearly visible objects including: ${targetWords.join(', ')}`,
        style: 'educational',
        size: 'large'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error generating game scene:', error);
      
      // Return placeholder scene
      return {
        imageData: `https://via.placeholder.com/800x600?text=${encodeURIComponent(`${theme} Scene with ${targetWords.join(', ')}`)}`,
        isPlaceholder: true
      };
    }
  },
  
  /**
   * Get word lineup game data
   * @param {string} difficulty - Difficulty level
   * @param {string} theme - Theme for words
   * @returns {Promise<Array>} Word lineup game data
   */
  getWordLineupData: async (difficulty, theme) => {
    try {
      const vocabData = await apiService.generateContent('vocabulary', theme, difficulty, 6);
      
      // Request images for each vocabulary item
      const wordsWithImages = await Promise.all(vocabData.map(async (item) => {
        try {
          const imageData = await apiService.generateVocabularyIllustration(
            item.french,
            item.english,
            item.context || ''
          );
          
          return {
            ...item,
            imageUrl: imageData.imageData
          };
        } catch (error) {
          console.error(`Error getting image for ${item.french}:`, error);
          
          // Use placeholder if image generation fails
          return {
            ...item,
            imageUrl: `https://via.placeholder.com/400x300?text=${encodeURIComponent(item.french)}`
          };
        }
      }));
      
      return wordsWithImages;
    } catch (error) {
      console.error('Error getting word lineup data:', error);
      
      // Return fallback word lineup data
      return getFallbackWordLineupData(theme, difficulty);
    }
  },
  
  /**
   * Get phrase constructor game data
   * @param {string} difficulty - Difficulty level
   * @param {string} category - Phrase category
   * @returns {Promise<Object>} Phrase constructor data
   */
  getPhraseConstructorData: async (difficulty, category) => {
    try {
      const phrasesData = await apiService.generateContent('phrases', category, difficulty, 1);
      
      // Ensure the format is correct
      if (Array.isArray(phrasesData) && phrasesData.length > 0) {
        const phraseData = phrasesData[0];
        
        // Ensure words array exists
        if (!phraseData.words || !Array.isArray(phraseData.words)) {
          phraseData.words = phraseData.french.split(/\s+/);
        }
        
        return phraseData;
      } else {
        throw new Error('Invalid phrase data format');
      }
    } catch (error) {
      console.error('Error getting phrase constructor data:', error);
      
      // Return fallback phrase data
      return getFallbackPhraseData(difficulty, category);
    }
  },
  
  /**
   * Get quiz challenge data
   * @param {string} category - Quiz category
   * @param {string} difficulty - Difficulty level
   * @param {number} count - Number of questions
   * @returns {Promise<Array>} Quiz questions
   */
  getQuizData: async (category, difficulty, count = 10) => {
    try {
      const response = await api.post('/ai/generate-quiz', {
        category,
        difficulty,
        count
      });
      
      return response.data.questions;
    } catch (error) {
      console.error('Error getting quiz data:', error);
      
      // Return fallback quiz data
      return getFallbackQuizData(category, difficulty, count);
    }
  },
  
  /**
   * Get daily lesson vocabulary
   * @returns {Promise<Array>} Daily vocabulary
   */
  getDailyLesson: async () => {
    try {
      // Use the current date as theme seed for consistency
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const response = await apiService.generateContent('vocabulary', today, 'beginner', 7);
      
      // Add images for each vocabulary item
      const wordsWithImages = await Promise.all(response.map(async (item) => {
        try {
          const imageData = await apiService.generateVocabularyIllustration(
            item.french,
            item.english
          );
          
          return {
            ...item,
            imageUrl: imageData.imageData
          };
        } catch (error) {
          console.error(`Error getting image for ${item.french}:`, error);
          
          return {
            ...item,
            imageUrl: `https://via.placeholder.com/400x300?text=${encodeURIComponent(item.french)}`
          };
        }
      }));
      
      return wordsWithImages;
    } catch (error) {
      console.error('Error getting daily lesson:', error);
      
      // Return fallback daily vocabulary
      return getFallbackDailyLesson();
    }
  }
};

/**
 * Helper function to get a fallback chat response
 * @param {string} message - User message
 * @param {string} userLevel - User's French level
 * @returns {string} Fallback response
 */
function getFallbackChatResponse(message, userLevel) {
  // Simple message detection logic
  const lowerMessage = message.toLowerCase();
  
  if (/\b(hello|hi|bon[jn]our|salut)\b/.test(lowerMessage)) {
    return "Bonjour ! (Hello!) Je suis votre professeur de français. Comment puis-je vous aider aujourd'hui ? (I am your French teacher. How can I help you today?)";
  }
  
  if (/\b(how are|comment|ca va|ça va)\b/.test(lowerMessage)) {
    return "Je vais bien, merci ! (I'm doing well, thank you!) Et vous ? (And you?)";
  }
  
  if (/\b(help|aidez|aide|assist)\b/.test(lowerMessage)) {
    return "Je suis là pour vous aider à apprendre le français. (I'm here to help you learn French.) Vous pouvez me poser des questions sur le vocabulaire, la grammaire, ou demander des traductions. (You can ask me questions about vocabulary, grammar, or request translations.)";
  }
  
  if (/\b(merci|thank|thanks)\b/.test(lowerMessage)) {
    return "De rien ! (You're welcome!) C'est un plaisir de vous aider. (It's a pleasure to help you.)";
  }
  
  if (/\b(introduc|present|je m'appelle|my name)\b/.test(lowerMessage)) {
    return "Pour vous présenter en français, vous pouvez dire: \"Je m'appelle [votre nom].\" (To introduce yourself in French, you can say: \"My name is [your name].\") ou \"Enchanté(e) de faire votre connaissance.\" (\"Pleased to meet you.\")";
  }
  
  // Default responses by level
  const defaultResponses = {
    beginner: "Je comprends que vous apprenez le français. Essayons de pratiquer avec des phrases simples. (I understand you're learning French. Let's practice with simple sentences.) Pouvez-vous me dire ce que vous aimez faire ? (Can you tell me what you like to do?)",
    intermediate: "Continuons à pratiquer votre français. Avez-vous des questions sur la grammaire ou le vocabulaire ? (Let's continue practicing your French. Do you have questions about grammar or vocabulary?)",
    advanced: "Votre français s'améliore ! Parlons de sujets plus complexes. Quels sont vos intérêts ? (Your French is improving! Let's talk about more complex topics. What are your interests?)"
  };
  
  return defaultResponses[userLevel] || defaultResponses.beginner;
}

/**
 * Get fallback content for various content types
 * @param {string} contentType - Type of content
 * @param {string} theme - Theme for the content
 * @param {string} difficulty - Difficulty level
 * @param {number} count - Number of items
 * @returns {Array} Fallback content
 */
function getFallbackContent(contentType, theme, difficulty, count) {
  if (contentType === 'vocabulary') {
    // Return fallback vocabulary based on theme
    const fallbackVocabSets = {
      greetings: [
        { id: '1', french: 'Bonjour', english: 'Hello', category: 'greetings', exampleFrench: 'Bonjour, comment allez-vous?', exampleEnglish: 'Hello, how are you?' },
        { id: '2', french: 'Salut', english: 'Hi', category: 'greetings', exampleFrench: 'Salut, ça va?', exampleEnglish: 'Hi, how\'s it going?' },
        { id: '3', french: 'Au revoir', english: 'Goodbye', category: 'greetings', exampleFrench: 'Au revoir et à bientôt!', exampleEnglish: 'Goodbye and see you soon!' },
        { id: '4', french: 'Bonsoir', english: 'Good evening', category: 'greetings', exampleFrench: 'Bonsoir, comment s\'est passée votre journée?', exampleEnglish: 'Good evening, how was your day?' },
        { id: '5', french: 'Enchanté', english: 'Nice to meet you', category: 'greetings', exampleFrench: 'Enchanté de faire votre connaissance.', exampleEnglish: 'Nice to meet you.' },
        { id: '6', french: 'À plus tard', english: 'See you later', category: 'greetings', exampleFrench: 'À plus tard, mon ami!', exampleEnglish: 'See you later, my friend!' }
      ],
      food: [
        { id: '1', french: 'Pain', english: 'Bread', category: 'food', exampleFrench: 'J\'achète du pain à la boulangerie.', exampleEnglish: 'I buy bread at the bakery.' },
        { id: '2', french: 'Fromage', english: 'Cheese', category: 'food', exampleFrench: 'La France est connue pour ses fromages.', exampleEnglish: 'France is known for its cheeses.' },
        { id: '3', french: 'Pomme', english: 'Apple', category: 'food', exampleFrench: 'Je mange une pomme chaque jour.', exampleEnglish: 'I eat an apple every day.' },
        { id: '4', french: 'Eau', english: 'Water', category: 'food', exampleFrench: 'Je voudrais un verre d\'eau, s\'il vous plaît.', exampleEnglish: 'I would like a glass of water, please.' },
        { id: '5', french: 'Café', english: 'Coffee', category: 'food', exampleFrench: 'Je bois du café le matin.', exampleEnglish: 'I drink coffee in the morning.' },
        { id: '6', french: 'Vin', english: 'Wine', category: 'food', exampleFrench: 'Le vin rouge est populaire en France.', exampleEnglish: 'Red wine is popular in France.' }
      ],
      animals: [
        { id: '1', french: 'Chat', english: 'Cat', category: 'animals', exampleFrench: 'Le chat dort sur le canapé.', exampleEnglish: 'The cat is sleeping on the couch.' },
        { id: '2', french: 'Chien', english: 'Dog', category: 'animals', exampleFrench: 'Mon chien aime jouer au parc.', exampleEnglish: 'My dog likes to play in the park.' },
        { id: '3', french: 'Oiseau', english: 'Bird', category: 'animals', exampleFrench: 'L\'oiseau chante dans l\'arbre.', exampleEnglish: 'The bird is singing in the tree.' },
        { id: '4', french: 'Lapin', english: 'Rabbit', category: 'animals', exampleFrench: 'Le lapin mange une carotte.', exampleEnglish: 'The rabbit is eating a carrot.' },
        { id: '5', french: 'Poisson', english: 'Fish', category: 'animals', exampleFrench: 'Le poisson nage dans l\'aquarium.', exampleEnglish: 'The fish is swimming in the aquarium.' },
        { id: '6', french: 'Cheval', english: 'Horse', category: 'animals', exampleFrench: 'Le cheval court dans le pré.', exampleEnglish: 'The horse is running in the meadow.' }
      ],
      household: [
        { id: '1', french: 'Maison', english: 'House', category: 'household', exampleFrench: 'Ma maison est près de la rivière.', exampleEnglish: 'My house is near the river.' },
        { id: '2', french: 'Table', english: 'Table', category: 'household', exampleFrench: 'Le livre est sur la table.', exampleEnglish: 'The book is on the table.' },
        { id: '3', french: 'Chaise', english: 'Chair', category: 'household', exampleFrench: 'Asseyez-vous sur la chaise, s\'il vous plaît.', exampleEnglish: 'Please sit on the chair.' },
        { id: '4', french: 'Lit', english: 'Bed', category: 'household', exampleFrench: 'Je dors dans mon lit.', exampleEnglish: 'I sleep in my bed.' },
        { id: '5', french: 'Fenêtre', english: 'Window', category: 'household', exampleFrench: 'Ouvrez la fenêtre, il fait chaud.', exampleEnglish: 'Open the window, it\'s hot.' },
        { id: '6', french: 'Porte', english: 'Door', category: 'household', exampleFrench: 'Fermez la porte, s\'il vous plaît.', exampleEnglish: 'Close the door, please.' }
      ],
      travel: [
        { id: '1', french: 'Valise', english: 'Suitcase', category: 'travel', exampleFrench: 'Ma valise est prête pour le voyage.', exampleEnglish: 'My suitcase is ready for the trip.' },
        { id: '2', french: 'Passeport', english: 'Passport', category: 'travel', exampleFrench: 'N\'oubliez pas votre passeport!', exampleEnglish: 'Don\'t forget your passport!' },
        { id: '3', french: 'Train', english: 'Train', category: 'travel', exampleFrench: 'Le train arrive à la gare.', exampleEnglish: 'The train arrives at the station.' },
        { id: '4', french: 'Avion', english: 'Airplane', category: 'travel', exampleFrench: 'L\'avion décolle à huit heures.', exampleEnglish: 'The plane takes off at eight o\'clock.' },
        { id: '5', french: 'Hôtel', english: 'Hotel', category: 'travel', exampleFrench: 'Nous restons dans un hôtel près de la plage.', exampleEnglish: 'We\'re staying at a hotel near the beach.' },
        { id: '6', french: 'Billet', english: 'Ticket', category: 'travel', exampleFrench: 'Voici votre billet d\'avion.', exampleEnglish: 'Here is your plane ticket.' }
      ]
    };
    
    // Get vocabulary for the requested theme or use default
    let vocabulary = fallbackVocabSets[theme] || fallbackVocabSets.greetings;
    
    // Adjust difficulty
    if (difficulty === 'intermediate') {
      vocabulary = vocabulary.map(item => ({
        ...item,
        exampleFrench: item.exampleFrench.replace('Je', 'Nous').replace('Ma', 'Notre'),
        exampleEnglish: item.exampleEnglish.replace('I', 'We').replace('My', 'Our')
      }));
    } else if (difficulty === 'advanced') {
      vocabulary = vocabulary.map(item => ({
        ...item,
        exampleFrench: `Il est important de savoir que "${item.french}" est un mot essentiel en français.`,
        exampleEnglish: `It's important to know that "${item.french}" is an essential word in French.`
      }));
    }
    
    // Return the requested number of items
    return vocabulary.slice(0, count);
  } else if (contentType === 'phrases') {
    // Return fallback phrases based on theme
    const fallbackPhrases = {
      greetings: [
        { id: '1', french: 'Bonjour comment allez-vous', english: 'Hello how are you', words: ['Bonjour', 'comment', 'allez', 'vous'], hint: 'A common greeting' },
        { id: '2', french: 'Je m\'appelle Jean', english: 'My name is Jean', words: ['Je', 'm\'appelle', 'Jean'], hint: 'Introducing yourself' },
        { id: '3', french: 'Enchanté de faire votre connaissance', english: 'Pleased to meet you', words: ['Enchanté', 'de', 'faire', 'votre', 'connaissance'], hint: 'When meeting someone new' }
      ],
      questions: [
        { id: '1', french: 'Où est la bibliothèque', english: 'Where is the library', words: ['Où', 'est', 'la', 'bibliothèque'], hint: 'Asking for a location' },
        { id: '2', french: 'Quelle heure est-il', english: 'What time is it', words: ['Quelle', 'heure', 'est', 'il'], hint: 'Asking about time' },
        { id: '3', french: 'Combien coûte ce livre', english: 'How much does this book cost', words: ['Combien', 'coûte', 'ce', 'livre'], hint: 'Asking about price' }
      ],
      daily: [
        { id: '1', french: 'Je mange mon petit déjeuner', english: 'I eat my breakfast', words: ['Je', 'mange', 'mon', 'petit', 'déjeuner'], hint: 'Morning routine' },
        { id: '2', french: 'Nous allons au travail', english: 'We go to work', words: ['Nous', 'allons', 'au', 'travail'], hint: 'Daily commute' },
        { id: '3', french: 'Il fait beau aujourd\'hui', english: 'The weather is nice today', words: ['Il', 'fait', 'beau', 'aujourd\'hui'], hint: 'Talking about weather' }
      ],
      travel: [
        { id: '1', french: 'Je voudrais un billet', english: 'I would like a ticket', words: ['Je', 'voudrais', 'un', 'billet'], hint: 'At the ticket counter' },
        { id: '2', french: 'Où est la gare', english: 'Where is the train station', words: ['Où', 'est', 'la', 'gare'], hint: 'Finding your way' },
        { id: '3', french: 'L\'avion est en retard', english: 'The plane is delayed', words: ['L\'avion', 'est', 'en', 'retard'], hint: 'Travel problems' }
      ],
      food: [
        { id: '1', french: 'Je voudrais une table pour deux', english: 'I would like a table for two', words: ['Je', 'voudrais', 'une', 'table', 'pour', 'deux'], hint: 'At a restaurant' },
        { id: '2', french: 'L\'addition s\'il vous plaît', english: 'The bill please', words: ['L\'addition', 's\'il', 'vous', 'plaît'], hint: 'Paying at a restaurant' },
        { id: '3', french: 'C\'est délicieux', english: 'It\'s delicious', words: ['C\'est', 'délicieux'], hint: 'Complimenting food' }
      ]
    };
    
    // Get phrases for the requested theme or use default
    const phrases = fallbackPhrases[theme] || fallbackPhrases.greetings;
    
    // Adjust difficulty if needed
    if (difficulty === 'intermediate' || difficulty === 'advanced') {
      // Return a more complex phrase for higher difficulty levels
      return phrases.find(phrase => phrase.words.length >= 4) || phrases[0];
    }
    
    // Return the first phrase for beginners
    return phrases[0];
  } else if (contentType === 'quiz') {
    // Return fallback quiz questions based on category
    return getFallbackQuizData(category, difficulty, count);
  }
  
  // Default fallback for unknown content types
  return [];
}

/**
 * Get fallback word lineup data
 * @param {string} theme - Theme for words
 * @param {string} difficulty - Difficulty level
 * @returns {Array} Word lineup game data
 */
function getFallbackWordLineupData(theme, difficulty) {
  // Base fallback data by theme
  const fallbackData = {
    animals: [
      { id: '1', french: 'Chat', english: 'Cat', imageUrl: 'https://via.placeholder.com/200x200?text=Chat' },
      { id: '2', french: 'Chien', english: 'Dog', imageUrl: 'https://via.placeholder.com/200x200?text=Chien' },
      { id: '3', french: 'Oiseau', english: 'Bird', imageUrl: 'https://via.placeholder.com/200x200?text=Oiseau' },
      { id: '4', french: 'Poisson', english: 'Fish', imageUrl: 'https://via.placeholder.com/200x200?text=Poisson' },
      { id: '5', french: 'Lapin', english: 'Rabbit', imageUrl: 'https://via.placeholder.com/200x200?text=Lapin' },
      { id: '6', french: 'Cheval', english: 'Horse', imageUrl: 'https://via.placeholder.com/200x200?text=Cheval' }
    ],
    food: [
      { id: '1', french: 'Pain', english: 'Bread', imageUrl: 'https://via.placeholder.com/200x200?text=Pain' },
      { id: '2', french: 'Fromage', english: 'Cheese', imageUrl: 'https://via.placeholder.com/200x200?text=Fromage' },
      { id: '3', french: 'Pomme', english: 'Apple', imageUrl: 'https://via.placeholder.com/200x200?text=Pomme' },
      { id: '4', french: 'Eau', english: 'Water', imageUrl: 'https://via.placeholder.com/200x200?text=Eau' },
      { id: '5', french: 'Café', english: 'Coffee', imageUrl: 'https://via.placeholder.com/200x200?text=Café' },
      { id: '6', french: 'Vin', english: 'Wine', imageUrl: 'https://via.placeholder.com/200x200?text=Vin' }
    ],
    household: [
      { id: '1', french: 'Maison', english: 'House', imageUrl: 'https://via.placeholder.com/200x200?text=Maison' },
      { id: '2', french: 'Table', english: 'Table', imageUrl: 'https://via.placeholder.com/200x200?text=Table' },
      { id: '3', french: 'Chaise', english: 'Chair', imageUrl: 'https://via.placeholder.com/200x200?text=Chaise' },
      { id: '4', french: 'Lit', english: 'Bed', imageUrl: 'https://via.placeholder.com/200x200?text=Lit' },
      { id: '5', french: 'Fenêtre', english: 'Window', imageUrl: 'https://via.placeholder.com/200x200?text=Fenêtre' },
      { id: '6', french: 'Porte', english: 'Door', imageUrl: 'https://via.placeholder.com/200x200?text=Porte' }
    ],
    travel: [
      { id: '1', french: 'Avion', english: 'Airplane', imageUrl: 'https://via.placeholder.com/200x200?text=Avion' },
      { id: '2', french: 'Train', english: 'Train', imageUrl: 'https://via.placeholder.com/200x200?text=Train' },
      { id: '3', french: 'Voiture', english: 'Car', imageUrl: 'https://via.placeholder.com/200x200?text=Voiture' },
      { id: '4', french: 'Hôtel', english: 'Hotel', imageUrl: 'https://via.placeholder.com/200x200?text=Hôtel' },
      { id: '5', french: 'Plage', english: 'Beach', imageUrl: 'https://via.placeholder.com/200x200?text=Plage' },
      { id: '6', french: 'Valise', english: 'Suitcase', imageUrl: 'https://via.placeholder.com/200x200?text=Valise' }
    ],
    general: [
      { id: '1', french: 'Bonjour', english: 'Hello', imageUrl: 'https://via.placeholder.com/200x200?text=Bonjour' },
      { id: '2', french: 'Merci', english: 'Thank you', imageUrl: 'https://via.placeholder.com/200x200?text=Merci' },
      { id: '3', french: 'Oui', english: 'Yes', imageUrl: 'https://via.placeholder.com/200x200?text=Oui' },
      { id: '4', french: 'Non', english: 'No', imageUrl: 'https://via.placeholder.com/200x200?text=Non' },
      { id: '5', french: 'Au revoir', english: 'Goodbye', imageUrl: 'https://via.placeholder.com/200x200?text=Au+revoir' },
      { id: '6', french: 'S\'il vous plaît', english: 'Please', imageUrl: 'https://via.placeholder.com/200x200?text=S%27il+vous+plaît' }
    ]
  };
  
  // Return data for the requested theme or use general
  return fallbackData[theme] || fallbackData.general;
}

/**
 * Get fallback phrase constructor data
 * @param {string} difficulty - Difficulty level
 * @param {string} category - Phrase category
 * @returns {Object} Phrase data
 */
function getFallbackPhraseData(difficulty, category) {
  // Phrases by category and difficulty
  const fallbackPhrases = {
    greetings: {
      beginner: { 
        french: 'Bonjour comment allez-vous', 
        english: 'Hello how are you', 
        words: ['Bonjour', 'comment', 'allez', 'vous'], 
        hint: 'A common greeting' 
      },
      intermediate: { 
        french: 'Enchanté de faire votre connaissance', 
        english: 'Pleased to meet you', 
        words: ['Enchanté', 'de', 'faire', 'votre', 'connaissance'], 
        hint: 'When meeting someone new' 
      },
      advanced: { 
        french: 'Je vous souhaite une excellente journée', 
        english: 'I wish you an excellent day', 
        words: ['Je', 'vous', 'souhaite', 'une', 'excellente', 'journée'], 
        hint: 'A polite farewell' 
      }
    },
    questions: {
      beginner: { 
        french: 'Quelle heure est-il', 
        english: 'What time is it', 
        words: ['Quelle', 'heure', 'est', 'il'], 
        hint: 'Asking about time' 
      },
      intermediate: { 
        french: 'Pourriez-vous me dire où se trouve la gare', 
        english: 'Could you tell me where the train station is', 
        words: ['Pourriez', 'vous', 'me', 'dire', 'où', 'se', 'trouve', 'la', 'gare'], 
        hint: 'Asking for directions' 
      },
      advanced: { 
        french: 'Savez-vous quand le prochain train arrivera', 
        english: 'Do you know when the next train will arrive', 
        words: ['Savez', 'vous', 'quand', 'le', 'prochain', 'train', 'arrivera'], 
        hint: 'Asking about train schedule' 
      }
    },
    daily: {
      beginner: { 
        french: 'Je mange mon petit déjeuner', 
        english: 'I eat my breakfast', 
        words: ['Je', 'mange', 'mon', 'petit', 'déjeuner'], 
        hint: 'Morning routine' 
      },
      intermediate: { 
        french: 'Nous allons faire des courses au supermarché', 
        english: 'We are going shopping at the supermarket', 
        words: ['Nous', 'allons', 'faire', 'des', 'courses', 'au', 'supermarché'], 
        hint: 'Shopping activity' 
      },
      advanced: { 
        french: 'Après avoir fini mon travail je rentrerai chez moi', 
        english: 'After finishing my work I will return home', 
        words: ['Après', 'avoir', 'fini', 'mon', 'travail', 'je', 'rentrerai', 'chez', 'moi'], 
        hint: 'End of workday' 
      }
    },
    food: {
      beginner: { 
        french: 'Je voudrais une tasse de café', 
        english: 'I would like a cup of coffee', 
        words: ['Je', 'voudrais', 'une', 'tasse', 'de', 'café'], 
        hint: 'Ordering a drink' 
      },
      intermediate: { 
        french: 'Ce plat est délicieux et bien présenté', 
        english: 'This dish is delicious and well presented', 
        words: ['Ce', 'plat', 'est', 'délicieux', 'et', 'bien', 'présenté'], 
        hint: 'Complimenting food' 
      },
      advanced: { 
        french: 'Pourriez-vous nous recommander un bon vin rouge', 
        english: 'Could you recommend us a good red wine', 
        words: ['Pourriez', 'vous', 'nous', 'recommander', 'un', 'bon', 'vin', 'rouge'], 
        hint: 'Asking for a recommendation' 
      }
    }
  };
  
  // Get phrase for the requested category (or default to greetings)
  const categoryPhrases = fallbackPhrases[category] || fallbackPhrases.greetings;
  
  // Get phrase for the requested difficulty (or default to beginner)
  return categoryPhrases[difficulty] || categoryPhrases.beginner;
}

/**
 * Get fallback quiz data
 * @param {string} category - Quiz category
 * @param {string} difficulty - Difficulty level
 * @param {number} count - Number of questions
 * @returns {Array} Quiz questions
 */
function getFallbackQuizData(category, difficulty, count) {
  // Base quiz questions
  const fallbackQuestions = [
    {
      id: '1',
      text: 'What is "apple" in French?',
      options: ['Pomme', 'Banane', 'Orange', 'Fraise'],
      correctAnswer: 'Pomme',
      explanation: '"Pomme" is the French word for "apple".'
    },
    {
      id: '2',
      text: 'Which greeting is used in the evening?',
      options: ['Bonjour', 'Bonsoir', 'Salut', 'Au revoir'],
      correctAnswer: 'Bonsoir',
      explanation: '"Bonsoir" means "good evening" in French.'
    },
    {
      id: '3',
      text: 'How do you say "thank you" in French?',
      options: ['S\'il vous plaît', 'Excusez-moi', 'Merci', 'Pardon'],
      correctAnswer: 'Merci',
      explanation: '"Merci" means "thank you" in French.'
    },
    {
      id: '4',
      text: 'Which is the correct translation of "I speak French"?',
      options: ['Je parle français', 'Tu parles français', 'Vous parlez français', 'Nous parlons français'],
      correctAnswer: 'Je parle français',
      explanation: '"Je parle français" means "I speak French" in French.'
    },
    {
      id: '5',
      text: 'What color is "rouge" in English?',
      options: ['Green', 'Blue', 'Red', 'Yellow'],
      correctAnswer: 'Red',
      explanation: '"Rouge" means "red" in French.'
    },
    {
      id: '6',
      text: 'Which word means "dog" in French?',
      options: ['Chat', 'Chien', 'Oiseau', 'Poisson'],
      correctAnswer: 'Chien',
      explanation: '"Chien" means "dog" in French.'
    },
    {
      id: '7',
      text: 'How do you count to three in French?',
      options: ['Un, trois, deux', 'Un, deux, trois', 'Trois, deux, un', 'Deux, un, trois'],
      correctAnswer: 'Un, deux, trois',
      explanation: 'The correct way to count to three in French is "un, deux, trois".'
    },
    {
      id: '8',
      text: 'Which means "Goodbye" in French?',
      options: ['Bonjour', 'Au revoir', 'Bonsoir', 'Bienvenue'],
      correctAnswer: 'Au revoir',
      explanation: '"Au revoir" means "goodbye" in French.'
    },
    {
      id: '9',
      text: 'What does "Excusez-moi" mean?',
      options: ['Thank you', 'Please', 'Excuse me', 'You\'re welcome'],
      correctAnswer: 'Excuse me',
      explanation: '"Excusez-moi" means "excuse me" in French.'
    },
    {
      id: '10',
      text: 'The French word for "water" is:',
      options: ['Lait', 'Vin', 'Café', 'Eau'],
      correctAnswer: 'Eau',
      explanation: '"Eau" means "water" in French.'
    }
  ];
  
  // Add more questions for specific categories
  const categoryQuestions = {
    grammar: [
      {
        id: '11',
        text: 'Which is the correct feminine form of "petit"?',
        options: ['Petite', 'Petits', 'Petites', 'Petit'],
        correctAnswer: 'Petite',
        explanation: 'The feminine form of "petit" is "petite".'
      },
      {
        id: '12',
        text: 'Which verb conjugation is correct for "je" (I)?',
        options: ['Je parles', 'Je parle', 'Je parlez', 'Je parlons'],
        correctAnswer: 'Je parle',
        explanation: 'The correct conjugation for "je" is "Je parle" (I speak).'
      }
    ],
    vocabulary: [
      {
        id: '13',
        text: 'What is the French word for "book"?',
        options: ['Livre', 'Cahier', 'Stylo', 'Crayon'],
        correctAnswer: 'Livre',
        explanation: '"Livre" means "book" in French.'
      },
      {
        id: '14',
        text: 'What does "voiture" mean in English?',
        options: ['House', 'Bicycle', 'Car', 'Boat'],
        correctAnswer: 'Car',
        explanation: '"Voiture" means "car" in French.'
      }
    ],
    expressions: [
      {
        id: '15',
        text: 'What does "Il pleut des cordes" literally mean?',
        options: ['It\'s raining cats and dogs', 'It\'s raining ropes', 'It\'s very windy', 'It\'s a beautiful day'],
        correctAnswer: 'It\'s raining ropes',
        explanation: '"Il pleut des cordes" literally means "It\'s raining ropes" but is equivalent to the English expression "It\'s raining cats and dogs".'
      },
      {
        id: '16',
        text: 'What is the meaning of "Avoir le cafard"?',
        options: ['To have a cockroach', 'To be hungry', 'To be feeling blue/down', 'To be busy'],
        correctAnswer: 'To be feeling blue/down',
        explanation: '"Avoir le cafard" literally means "to have the cockroach" but actually means "to be feeling blue or down".'
      }
    ],
    culture: [
      {
        id: '17',
        text: 'What is "la bise"?',
        options: ['A type of bread', 'A greeting kiss on the cheek', 'A dance', 'A French song'],
        correctAnswer: 'A greeting kiss on the cheek',
        explanation: '"La bise" refers to the traditional French greeting of kissing on the cheeks.'
      },
      {
        id: '18',
        text: 'What is France\'s national motto?',
        options: ['Liberté, Égalité, Fraternité', 'Vive la France', 'En Garde', 'C\'est la vie'],
        correctAnswer: 'Liberté, Égalité, Fraternité',
        explanation: 'France\'s national motto is "Liberté, Égalité, Fraternité" which means "Liberty, Equality, Fraternity".'
      }
    ]
  };
  
  // Combine base questions with category-specific questions
  let allQuestions = [...fallbackQuestions];
  if (category && category !== 'mixed' && categoryQuestions[category]) {
    allQuestions = [...categoryQuestions[category], ...fallbackQuestions];
  }
  
  // Return the requested number of questions
  return allQuestions.slice(0, count);
}

/**
 * Get fallback daily lesson vocabulary
 * @returns {Array} Daily vocabulary
 */
function getFallbackDailyLesson() {
  // Generate a consistent set based on the day of year
  const date = new Date();
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  
  // Daily themes that rotate
  const themes = ['greetings', 'food', 'animals', 'household', 'travel', 'colors', 'numbers'];
  const theme = themes[dayOfYear % themes.length];
  
  // Get vocabulary for the theme
  const vocabulary = getFallbackContent('vocabulary', theme, 'beginner', 7);
  
  // Add placeholder images
  return vocabulary.map(item => ({
    ...item,
    imageUrl: `https://via.placeholder.com/400x300?text=${encodeURIComponent(item.french)}`
  }));
}

/**
 * Get a colorful placeholder for vocabulary words
 * @param {string} word - French word
 * @param {string} translation - English translation
 * @returns {string} Data URL for placeholder image
 */
function getWordPlaceholder(word, translation) {
  // Create a colorful SVG placeholder based on the first letter
  const colors = [
    '#FFC6FF', '#FFADAD', '#FFD6A5', '#FDFFB6', 
    '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF'
  ];
  
  const colorIndex = word.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  
  // Create SVG
  const svgContent = `
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="100%" height="100%" fill="${bgColor}"/>
    <text x="200" y="180" font-family="Arial" font-size="36" text-anchor="middle" font-weight="bold" fill="#333333">${word}</text>
    <text x="200" y="230" font-family="Arial" font-size="28" text-anchor="middle" fill="#666666">${translation}</text>
  </svg>
  `;
  
  // Convert to data URL
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
}

export default apiService;