// src/services/apiService.js
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

// Direct API connections for when backend is down or not working
const openai = axios.create({
  baseURL: 'https://api.openai.com/v1',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY || ''}`
  }
});

const huggingface = axios.create({
  baseURL: 'https://api-inference.huggingface.co/models',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.REACT_APP_HUGGINGFACE_API_KEY || ''}`
  }
});

const cohere = axios.create({
  baseURL: 'https://api.cohere.ai/v1',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.REACT_APP_COHERE_API_KEY || ''}`
  }
});

// Add interceptor for error handling and retries
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    console.error('API Error Details:', {
      endpoint: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    if (
      originalRequest._retry || 
      (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429)
    ) {
      return Promise.reject(error);
    }
    
    if (
      !error.response || 
      error.code === 'ECONNABORTED' || 
      (error.response && error.response.status >= 500)
    ) {
      originalRequest._retry = true;
      await new Promise(resolve => setTimeout(resolve, 2000));
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

/**
 * API Service for Le Petit Explorateur
 */
const apiService = {
  /**
   * Get daily lesson vocabulary using OpenAI
   * @returns {Promise<Array>} Daily vocabulary
   */
  getDailyLesson: async () => {
    try {
      // Try to use the backend first
      const response = await api.get('/ai/daily-lesson');
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      // If backend fails, use direct OpenAI connection
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const result = await openai.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a French language teacher creating daily vocabulary lessons. Respond with exactly 7 French vocabulary words with their English translations, examples, and categories."
          },
          {
            role: "user",
            content: `Generate 7 useful French vocabulary words for a beginner's daily lesson dated ${today}. Each entry should have the French word, English translation, category, and example sentence in both French and English. Format as JSON array.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });
      
      // Parse and format the response
      const content = JSON.parse(result.data.choices[0].message.content);
      const vocabulary = content.words || content.vocabulary || [];
      
      // Add IDs and placeholder images
      const vocabularyWithIds = vocabulary.map((word, index) => ({
        ...word,
        id: `daily-${index + 1}`,
        imageUrl: generateWordPlaceholder(word.french, word.english)
      }));
      
      return vocabularyWithIds;
    } catch (error) {
      console.error('Error getting daily lesson:', error);
      return getFallbackDailyLesson();
    }
  },
  
  /**
   * Get word details using OpenAI to enhance flashcards
   * @param {string} word - French word
   * @param {string} english - English translation
   * @param {string} userLevel - User's level
   * @returns {Promise<Object>} Word details
   */
  getWordDetails: async (word, english, userLevel = 'beginner') => {
    try {
      // Try backend first
      const response = await api.post('/ai/word-details', { word, english, userLevel });
      if (response.data) {
        return response.data;
      }
      
      // If backend fails, use direct OpenAI connection
      const result = await openai.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a French language tutor. Provide detailed information about French words for students."
          },
          {
            role: "user",
            content: `Provide detailed information about the French word "${word}" (English: "${english}") for a ${userLevel} level student. Include: 1) A clear definition in simple terms, 2) An example sentence using the word (provide both French and English), 3) Any helpful tips for remembering or using the word correctly. Format your response as JSON.`
          }
        ],
        temperature: 0.7,
        max_tokens: 400,
        response_format: { type: "json_object" }
      });
      
      const details = JSON.parse(result.data.choices[0].message.content);
      return details;
    } catch (error) {
      console.error('Error getting word details:', error);
      // Return fallback details
      return {
        definition: english,
        exampleFrench: `C'est un exemple avec le mot "${word}".`,
        exampleEnglish: `This is an example with the word "${word}".`,
        tips: `Remember that "${word}" means "${english}" in French.`
      };
    }
  },
  
  /**
   * Generate image word match data with categories
   * @param {string} difficulty - Difficulty level
   * @param {string} category - Word category
   * @returns {Promise<Object>} Game data
   */
  getImageWordMatchData: async (difficulty = 'beginner', category = 'general') => {
    try {
      // Try to get the data from backend
      const response = await api.get(`/ai/word-lineup/${difficulty}?category=${category}`);
      if (response.data && response.data.words) {
        // Add images to existing words if they don't have them
        const wordsWithImages = await Promise.all(response.data.words.map(async word => ({
          ...word,
          imageUrl: word.imageUrl || await generateWordImage(word.french, word.english) || generateWordPlaceholder(word.french, word.english, Date.now())
        })));
        return { words: wordsWithImages };
      }
      
      // Generate new words with OpenAI if backend fails
      const result = await openai.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a French language teaching assistant creating content for an image-word matching game."
          },
          {
            role: "user",
            content: `Generate 10 unique French vocabulary words with their English translations for the category "${category}" at ${difficulty} level. Choose simple, concrete nouns that can be easily represented by images. For each word, provide: the French word, the English translation, and a category. Format as JSON array.`
          }
        ],
        temperature: 0.8,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });
      
      // Process the response
      const content = JSON.parse(result.data.choices[0].message.content);
      const words = content.words || content;
      
      // Format with unique IDs and generate images
      const formattedWords = await Promise.all(words.map(async (word, index) => {
        const imageUrl = await generateWordImage(word.french, word.english);
        return {
          id: `word-${index + 1}-${Date.now()}`,
          french: word.french,
          english: word.english,
          category: word.category || category,
          imageUrl: imageUrl || generateWordPlaceholder(word.french, word.english, Date.now())
        };
      }));
      
      return { words: formattedWords };
    } catch (error) {
      console.error('Error getting image word match data:', error);
      return getFallbackImageWordMatchData(difficulty, category);
    }
  },
  
  /**
   * Get phrase constructor data using AI
   * @param {string} difficulty - Difficulty level
   * @param {string} category - Phrase category
   * @returns {Promise<Object>} Phrase data
   */
  getPhraseConstructorData: async (difficulty = 'beginner', category = 'greetings') => {
    try {
      // Try to get data from backend
      const response = await api.get(`/ai/phrase-constructor/${difficulty}?category=${category}`);
      if (response.data) {
        // Normalize response data
        const normalizedData = {
          frenchPhrase: response.data.frenchPhrase || response.data.french || '',
          englishTranslation: response.data.englishTranslation || response.data.english || '',
          words: response.data.words || [],
          hint: response.data.hint || response.data.context || '',
          id: `phrase-${Date.now()}`
        };
        
        // Validate required fields
        if (!normalizedData.frenchPhrase || !normalizedData.englishTranslation || !normalizedData.words.length) {
          throw new Error('Invalid phrase data format');
        }
        
        return normalizedData;
      }
      
      // If backend fails, use direct OpenAI connection
      const result = await openai.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a French language teacher creating phrase construction exercises. Return only valid JSON."
          },
          {
            role: "user",
            content: `Create a French phrase for ${difficulty} level learners related to the category "${category}". Return a JSON object with these exact keys: frenchPhrase (string), englishTranslation (string), words (array of strings), hint (string). The words array should contain all words needed to construct the French phrase in the correct order.`
          }
        ],
        temperature: 0.7,
        max_tokens: 400,
        response_format: { type: "json_object" }
      });
      
      // Parse and normalize the response
      const aiResponse = JSON.parse(result.data.choices[0].message.content);
      const normalizedData = {
        frenchPhrase: aiResponse.frenchPhrase,
        englishTranslation: aiResponse.englishTranslation,
        words: aiResponse.words,
        hint: aiResponse.hint,
        id: `phrase-${Date.now()}`
      };
      
      // Validate required fields
      if (!normalizedData.frenchPhrase || !normalizedData.englishTranslation || !normalizedData.words.length) {
        throw new Error('Invalid AI response format');
      }
      
      return normalizedData;
    } catch (error) {
      console.error('Error getting phrase constructor data:', error);
      return getFallbackPhraseData(difficulty, category);
    }
  },
  
  /**
   * Get quiz challenge data using AI
   * @param {string} category - Quiz category
   * @param {string} difficulty - Difficulty level
   * @param {number} count - Number of questions
   * @returns {Promise<Array>} Quiz questions
   */
  getQuizData: async (category = 'mixed', difficulty = 'beginner', count = 10) => {
    try {
      // Try to get quiz data from backend
      const response = await api.post('/ai/generate-quiz', {
        category,
        difficulty,
        count
      });
      
      if (response.data && response.data.questions) {
        return response.data.questions;
      }
      
      // If backend fails, use direct OpenAI connection
      const result = await openai.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a French language teacher creating multiple-choice quiz questions. Format each question with:
1. text: The question in French
2. options: Array of 4 possible answers in French
3. correctAnswer: Index of correct answer (0-3)
4. explanation: Brief explanation in English
Return as a JSON object with a 'questions' array.`
          },
          {
            role: "user",
            content: `Create ${count} French language quiz questions about "${category}" for ${difficulty} level students. 
Example format:
{
  "questions": [
    {
      "text": "Quelle est la couleur du ciel?",
      "options": ["bleu", "rouge", "vert", "jaune"],
      "correctAnswer": 0,
      "explanation": "The sky is blue (bleu)"
    }
  ]
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const content = JSON.parse(result.data.choices[0].message.content);
      if (!content.questions || !Array.isArray(content.questions)) {
        throw new Error('Invalid quiz data format');
      }

      // Validate and format each question
      return content.questions.map((q, index) => ({
        id: `quiz-${index + 1}-${Date.now()}`,
        text: q.text || 'Question not available',
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 ? q.correctAnswer : 0,
        explanation: q.explanation || 'Explanation not available'
      }));
    } catch (error) {
      console.error('Error getting quiz data:', error);
      // Return fallback questions if API fails
      return getFallbackQuizData(category, difficulty, count);
    }
  },
  
  /**
   * Chat with AI language buddy
   * @param {string} message - User message
   * @param {string} userLevel - User's French level
   * @param {Array} conversationHistory - Previous conversation history
   * @returns {Promise<Object>} Chat response with suggestions
   */
  chatWithAI: async (message, userLevel = 'beginner', conversationHistory = []) => {
    try {
      // Try to use backend first
      const response = await api.post('/ai/chat', {
        message,
        userLevel,
        history: conversationHistory
      });
      
      if (response.data && response.data.response) {
        return response.data;
      }
      
      // If backend fails, use direct OpenAI connection
      
      // Format conversation history for OpenAI
      const messages = [
        {
          role: "system",
          content: `You are a friendly French language tutor. Communicate with the user at a ${userLevel} level. If the user writes in English, respond in both French and English. If they write in French, gently correct any mistakes and respond in French with English translation.`
        }
      ];
      
      // Add conversation history
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
      
      // Add current message
      messages.push({
        role: "user",
        content: message
      });
      
      // Get AI response
      const result = await openai.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.7,
        max_tokens: 500
      });
      
      const aiResponse = result.data.choices[0].message.content;
      
      // Get suggestions in a second call
      const suggestionPrompt = `Based on this conversation about learning French, generate 3 follow-up phrases that a ${userLevel} French learner might want to say next. Provide these in French with English translations in parentheses.`;
      
      const suggestionMessages = [
        ...messages,
        { role: "assistant", content: aiResponse },
        { role: "user", content: suggestionPrompt }
      ];
      
      const suggestionResult = await openai.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: suggestionMessages,
        temperature: 0.7,
        max_tokens: 250
      });
      
      const suggestionContent = suggestionResult.data.choices[0].message.content;
      const suggestions = suggestionContent
        .split('\n')
        .filter(line => line.trim())
        .slice(0, 3);
      
      return {
        response: aiResponse,
        suggestions
      };
    } catch (error) {
      console.error('Error in AI chat:', error);
      return {
        response: getFallbackChatResponse(message, userLevel),
        suggestions: [
          "Comment dit-on... en français? (How do you say... in French?)",
          "Je ne comprends pas. (I don't understand.)",
          "Pouvez-vous répéter, s'il vous plaît? (Can you repeat, please?)"
        ]
      };
    }
  }
};

// Generate image for a word using DALL-E
async function generateWordImage(word, english) {
  try {
    const response = await openai.post('/images/generations', {
      model: "dall-e-3",
      prompt: `A simple, clear illustration of the French word "${word}" (${english})`,
      n: 1,
      size: "1024x1024",  // Using the supported size for DALL-E 3
      quality: "standard",
      style: "natural"
    });

    if (response.data && response.data.data && response.data.data[0]) {
      return response.data.data[0].url;
    }
    throw new Error('No image generated');
  } catch (error) {
    console.error(`Error generating image for ${word}:`, error);
    return generateWordPlaceholder(word, english, Date.now());
  }
}

/**
 * Generate word placeholder SVG
 * @param {string} word - French word
 * @param {string} translation - English translation
 * @param {number} timestamp - Timestamp for unique SVG
 * @returns {string} SVG data URL
 */
function generateWordPlaceholder(word, translation, timestamp) {
  // Colors based on first character for consistency
  const colors = [
    '#FFC6FF', '#FFADAD', '#FFD6A5', '#FDFFB6', 
    '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF'
  ];
  
  const colorIndex = word.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  
  // Create SVG with word and translation
  const svgContent = `
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="100%" height="100%" fill="${bgColor}"/>
    <text x="100" y="85" font-family="Arial" font-size="24" text-anchor="middle" font-weight="bold" fill="#333333">${word}</text>
    <text x="100" y="115" font-family="Arial" font-size="18" text-anchor="middle" fill="#666666">${translation}</text>
  </svg>
  `;
  
  // Convert to data URL
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
}

// Fallback functions for when API calls fail
function getFallbackDailyLesson() {
  const date = new Date();
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  
  const themes = ['greetings', 'food', 'animals', 'household', 'travel', 'colors', 'numbers'];
  const theme = themes[dayOfYear % themes.length];
  
  const fallbackVocabSets = {
    greetings: [
      { id: '1', french: 'Bonjour', english: 'Hello', category: 'greetings', exampleFrench: 'Bonjour, comment allez-vous?', exampleEnglish: 'Hello, how are you?' },
      { id: '2', french: 'Salut', english: 'Hi', category: 'greetings', exampleFrench: 'Salut, ça va?', exampleEnglish: 'Hi, how\'s it going?' },
      { id: '3', french: 'Au revoir', english: 'Goodbye', category: 'greetings', exampleFrench: 'Au revoir et à bientôt!', exampleEnglish: 'Goodbye and see you soon!' },
      { id: '4', french: 'Bonsoir', english: 'Good evening', category: 'greetings', exampleFrench: 'Bonsoir, comment s\'est passée votre journée?', exampleEnglish: 'Good evening, how was your day?' },
      { id: '5', french: 'Enchanté', english: 'Nice to meet you', category: 'greetings', exampleFrench: 'Enchanté de faire votre connaissance.', exampleEnglish: 'Nice to meet you.' },
      { id: '6', french: 'À plus tard', english: 'See you later', category: 'greetings', exampleFrench: 'À plus tard, mon ami!', exampleEnglish: 'See you later, my friend!' },
      { id: '7', french: 'Bienvenue', english: 'Welcome', category: 'greetings', exampleFrench: 'Bienvenue à Paris!', exampleEnglish: 'Welcome to Paris!' }
    ],
    // More fallback sets here
    // ...
  };
  
  // Get vocabulary for today's theme
  let vocabulary = fallbackVocabSets[theme] || fallbackVocabSets.greetings;
  
  // Add placeholder images
  return vocabulary.map(item => ({
    ...item,
    imageUrl: generateWordPlaceholder(item.french, item.english)
  }));
}

function getFallbackPhraseData(difficulty, category) {
  const fallbackPhrases = {
    greetings: {
      beginner: { 
        id: 'g1',
        french: 'Bonjour comment allez-vous', 
        english: 'Hello how are you', 
        words: ['Bonjour', 'comment', 'allez', 'vous'], 
        hint: 'A common greeting' 
      },
      intermediate: { 
        id: 'g2',
        french: 'Enchanté de faire votre connaissance', 
        english: 'Pleased to meet you', 
        words: ['Enchanté', 'de', 'faire', 'votre', 'connaissance'], 
        hint: 'When meeting someone new' 
      },
      advanced: { 
        id: 'g3',
        french: 'Je vous souhaite une excellente journée', 
        english: 'I wish you an excellent day', 
        words: ['Je', 'vous', 'souhaite', 'une', 'excellente', 'journée'], 
        hint: 'A polite farewell' 
      }
    },
    // More fallback phrases here
    // ...
  };
  
  // Return appropriate phrase based on category and difficulty
  const categoryPhrases = fallbackPhrases[category] || fallbackPhrases.greetings;
  return categoryPhrases[difficulty] || categoryPhrases.beginner;
}

function getFallbackImageWordMatchData(difficulty, category) {
  const fallbackData = {
    animals: [
      { id: '1', french: 'Chat', english: 'Cat', category: 'animals' },
      { id: '2', french: 'Chien', english: 'Dog', category: 'animals' },
      { id: '3', french: 'Oiseau', english: 'Bird', category: 'animals' },
      { id: '4', french: 'Poisson', english: 'Fish', category: 'animals' },
      { id: '5', french: 'Lapin', english: 'Rabbit', category: 'animals' },
      { id: '6', french: 'Cheval', english: 'Horse', category: 'animals' },
      { id: '7', french: 'Vache', english: 'Cow', category: 'animals' },
      { id: '8', french: 'Canard', english: 'Duck', category: 'animals' }
    ],
    // More categories here
    // ...
  };
  
  const words = fallbackData[category] || fallbackData.animals;
  
  // Add placeholder images
  return { 
    words: words.map(word => ({
      ...word,
      imageUrl: generateWordPlaceholder(word.french, word.english)
    }))
  };
}

function getFallbackQuizData(category, difficulty, count) {
  const fallbackQuestions = [
    {
      id: `quiz-1-${Date.now()}`,
      text: "Comment dit-on 'hello' en français?",
      options: ["bonjour", "au revoir", "merci", "s'il vous plaît"],
      correctAnswer: 0,
      explanation: "'Bonjour' means 'hello' in French"
    },
    {
      id: `quiz-2-${Date.now()}`,
      text: "Quelle est la couleur du ciel?",
      options: ["bleu", "rouge", "vert", "jaune"],
      correctAnswer: 0,
      explanation: "The sky is blue (bleu)"
    },
    // Add more fallback questions...
  ];

  return fallbackQuestions.slice(0, count);
}

function getFallbackChatResponse(message, userLevel) {
  const lowerMessage = message.toLowerCase();
  
  if (/\b(hello|hi|bon[jn]our|salut)\b/.test(lowerMessage)) {
    return "Bonjour ! (Hello!) Je suis votre professeur de français. Comment puis-je vous aider aujourd'hui ? (I am your French teacher. How can I help you today?)";
  }
  
  // Default response based on user level
  const defaultResponses = {
    beginner: "Je comprends que vous apprenez le français. Essayons de pratiquer avec des phrases simples. (I understand you're learning French. Let's practice with simple sentences.) Pouvez-vous me dire ce que vous aimez faire ? (Can you tell me what you like to do?)",
    intermediate: "Continuons à pratiquer votre français. Avez-vous des questions sur la grammaire ou le vocabulaire ? (Let's continue practicing your French. Do you have questions about grammar or vocabulary?)",
    advanced: "Votre français s'améliore ! Parlons de sujets plus complexes. Quels sont vos intérêts ? (Your French is improving! Let's talk about more complex topics. What are your interests?)"
  };
  
  return defaultResponses[userLevel] || defaultResponses.beginner;
}

export default apiService;