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

// Direct API connections for when backend is down or not available
const openai = axios.create({
  baseURL: 'https://api.openai.com/v1',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY || ''}`
  }
});

// Interceptor for handling errors
api.interceptors.response.use(
  response => response,
  async error => {
    // Log detailed error info for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });
    
    // If we already retried or it's a client error (except rate limiting), reject
    if (error.config._retry || 
        (error.response && error.response.status >= 400 && 
         error.response.status < 500 && error.response.status !== 429)) {
      return Promise.reject(error);
    }
    
    // For server errors or timeouts, retry once
    if (!error.response || error.code === 'ECONNABORTED' || 
        (error.response && error.response.status >= 500)) {
      error.config._retry = true;
      await new Promise(resolve => setTimeout(resolve, 1000));
      return api(error.config);
    }
    
    return Promise.reject(error);
  }
);

const apiService = {
  /**
   * Get daily lesson vocabulary using OpenAI with date parameter
   * @param {string} userLevel - User's level (beginner, intermediate, advanced)
   * @param {string} date - Date for the lesson (YYYY-MM-DD format)
   * @returns {Promise<Array>} Daily vocabulary
   */
  async getDailyLesson(userLevel = 'beginner', date = new Date().toISOString().split('T')[0]) {
    try {
      // Try to use the backend first
      const response = await api.get('/ai/daily-lesson');
      if (response.data && (Array.isArray(response.data) || response.data.vocabulary)) {
        return Array.isArray(response.data) ? response.data : response.data.vocabulary;
      }
      
      // If backend fails, use direct OpenAI connection
      console.log("Backend daily lesson fetch failed, using direct OpenAI connection");
      const result = await openai.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a French language teacher creating daily vocabulary lessons. Respond with exactly 7 useful French vocabulary words with their English translations, examples, and categories."
          },
          {
            role: "user",
            content: `Generate 7 useful French vocabulary words for a ${userLevel}'s daily lesson dated ${date}. Each entry should have: french (the French word), english (the English translation), category, exampleFrench (example sentence in French), and exampleEnglish (translation of the example). Make sure to use the date ${date} to generate different words than other days. Format as a JSON array.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });
      
      // Parse and format the response
      const content = JSON.parse(result.data.choices[0].message.content);
      let vocabulary = Array.isArray(content) ? content : 
                     (content.words || content.vocabulary || []);
      
      // Add IDs and ensure consistent format
      const formattedVocabulary = vocabulary.map((word, index) => ({
        id: `daily-${index + 1}-${Date.now()}`,
        french: word.french,
        english: word.english,
        category: word.category || 'general',
        exampleFrench: word.exampleFrench || `${word.french} est un mot français.`,
        exampleEnglish: word.exampleEnglish || `${word.french} is a French word.`
      }));
      
      return formattedVocabulary;
    } catch (error) {
      console.error('Error getting daily lesson:', error);
      throw error;
    }
  },

  /**
   * Get phrase constructor data using AI with round parameter
   * @param {string} difficulty - Difficulty level
   * @param {string} category - Phrase category
   * @param {number} timestamp - Timestamp to ensure unique requests
   * @param {number} round - Current round number
   * @param {Array} usedPhrases - Previously used phrases
   * @returns {Promise<Object>} Phrase data
   */
  async getPhraseConstructorData(difficulty = 'beginner', category = 'greetings', timestamp = Date.now(), round = 1, usedPhrases = []) {
    try {
      // Try to get data from backend
      const response = await api.get(`/ai/phrase-constructor/${difficulty}?category=${category}&round=${round}`);
      if (response.data && (response.data.french || response.data.frenchPhrase)) {
        // Normalize response data
        const normalizedData = {
          id: `phrase-${round}-${Date.now()}`,
          french: response.data.french || response.data.frenchPhrase || '',
          english: response.data.english || response.data.englishTranslation || '',
          words: response.data.words || [],
          hint: response.data.hint || response.data.context || '',
        };
        
        // Check if this is a duplicate phrase
        if (usedPhrases.includes(normalizedData.french)) {
          throw new Error('Duplicate phrase detected, will generate new one');
        }
        
        return normalizedData;
      }
      
      // If backend fails, use direct OpenAI connection
      console.log("Backend phrase data fetch failed, using direct OpenAI connection");
      
      // Add round information to ensure we get different phrases
      const promptPrefix = round > 1 ? 
        `For round ${round}, create a NEW French phrase (different from previous rounds) ` :
        `Create a French phrase `;
      
      const result = await openai.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a French language teacher creating phrase construction exercises. Return valid JSON with exactly the fields requested."
          },
          {
            role: "user",
            content: `${promptPrefix}for ${difficulty} level learners related to the category "${category}". 
            
Already used phrases: ${usedPhrases.join(", ")}

Return a JSON object with these exact fields:
- id: a unique identifier string
- french: the complete French phrase (without punctuation marks for easier construction)
- english: the English translation
- words: an array of strings, each string being one word needed to construct the French phrase in the correct order
- hint: a short hint about the context or usage of this phrase`
          }
        ],
        temperature: 0.8, // Higher temperature for more variety
        max_tokens: 500,
        response_format: { type: "json_object" }
      });
      
      // Parse and normalize the response
      const aiResponse = JSON.parse(result.data.choices[0].message.content);
      
      const normalizedData = {
        id: aiResponse.id || `phrase-${round}-${Date.now()}`,
        french: aiResponse.french || '',
        english: aiResponse.english || '',
        words: aiResponse.words || [],
        hint: aiResponse.hint || '',
      };
      
      // Check if this is a duplicate phrase
      if (usedPhrases.includes(normalizedData.french)) {
        // Try again with a different approach
        return apiService.getPhraseConstructorData(difficulty, category, timestamp + 1000, round, usedPhrases);
      }
      
      return normalizedData;
    } catch (error) {
      console.error('Error getting phrase constructor data:', error);
      throw error;
    }
  },
  
  /**
   * Get word details using OpenAI to enhance flashcards
   * @param {string} word - French word
   * @param {string} english - English translation
   * @param {string} userLevel - User's level (beginner, intermediate, advanced)
   * @returns {Promise<Object>} Word details
   */
  async getWordDetails(word, english, userLevel = 'beginner') {
    try {
      // Try backend first
      const response = await api.post('/ai/word-details', { word, english, userLevel });
      if (response.data) {
        return response.data;
      }
      
      // If backend fails, use direct OpenAI connection
      console.log("Backend word details fetch failed, using direct OpenAI connection");
      const result = await openai.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a French language tutor. Provide detailed information about French words for students."
          },
          {
            role: "user",
            content: `Provide detailed information about the French word "${word}" (English: "${english}") for a ${userLevel} level student.\n\nFormat your response as a JSON object with these exact fields:\n- definition: a simple, clear definition\n- exampleFrench: an example sentence in French using the word\n- exampleEnglish: the English translation of the example\n- tips: a helpful tip for remembering or using the word`
          }
        ],
        temperature: 0.7,
        max_tokens: 400,
        response_format: { type: "json_object" }
      });
      
      return JSON.parse(result.data.choices[0].message.content);
    } catch (error) {
      console.error('Error getting word details:', error);
      // Return fallback details
      return {
        definition: `${english} (Basic translation)`,
        exampleFrench: `${word} est un mot français important.`,
        exampleEnglish: `${word} is an important French word.`,
        tips: `Try to use "${word}" in simple sentences to practice.`
      };
    }
  },
  
  /**
   * Generate image for vocabulary word using DALL-E with improved error handling
   * @param {string} word - French word
   * @param {string} english - English translation
   * @returns {Promise<string>} Image URL
   */
  async generateWordImage(word, english) {
    try {
      console.log(`Generating image for ${word} (${english})`);
      
      // First try to use the backend service
      try {
        const response = await api.post('/ai/generate-image', {
          word,
          english,
          language: 'french'
        }, { 
          timeout: 15000 // 15 second timeout for backend request
        });
        
        if (response.data && response.data.imageUrl) {
          console.log(`Successfully received image from backend for ${word}`);
          return response.data.imageUrl;
        }
      } catch (backendError) {
        console.warn('Backend image generation failed, trying direct OpenAI:', backendError.message);
        // Continue to OpenAI direct call
      }
      
      // Direct OpenAI call as fallback
      const response = await openai.post('/images/generations', {
        model: "dall-e-3",
        prompt: `A simple, clear educational illustration of the French word "${word}" (${english}). Create a simple, iconic image suitable for language learning that clearly represents the word's meaning. The image should be easy to understand with clean lines and minimal background elements. Use bright, engaging colors appropriate for educational content.`,
        n: 1,
        size: "1024x1024", // This is the only size supported by DALL-E 3
        quality: "standard",
        style: "natural"
      });

      if (response.data && response.data.data && response.data.data[0]) {
        console.log(`Successfully generated image for ${word}`);
        return response.data.data[0].url;
      }
      throw new Error('No image data in response');
    } catch (error) {
      console.error(`Error generating image for ${word}:`, error);
      // Try to use a stock image API as alternative
      try {
        // This is a placeholder for a stock image API call
        // You would replace this with an actual implementation
        return await apiService.getStockImage(word, english);
      } catch (stockError) {
        console.error('Stock image API failed:', stockError);
        // Generate a placeholder SVG as final fallback
        return apiService.generatePlaceholder(word, english);
      }
    }
  },

  /**
   * Try to get a stock image for a word (placeholder implementation)
   * In a real application, you would integrate with a stock photo API
   * @param {string} word - French word
   * @param {string} english - English translation
   * @returns {Promise<string>} Image URL
   */
  async getStockImage(word, english) {
    // This is a placeholder function
    // In a real implementation, you would call a stock image API
    
    // For now, just simulate an API call with a timeout
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 50% success rate
        if (Math.random() > 0.5) {
          // Reject to test the fallback
          reject(new Error('Stock image API failed'));
        } else {
          // Return a placeholder URL
          // In a real implementation, this would be a URL from the stock image API
          resolve(`https://placehold.co/400x300?text=${encodeURIComponent(english)}`);
        }
      }, 500);
    });
  },

  /**
   * Generate image word match data with categories and improved fallbacks
   * @param {string} difficulty - Difficulty level
   * @param {string} category - Word category
   * @returns {Promise<Object>} Game data
   */
  async getImageWordMatchData(difficulty = 'beginner', category = 'general') {
    try {
      // Try to get the data from backend
      const response = await api.get(`/ai/word-lineup/${difficulty}?category=${category}`, {
        timeout: 10000 // 10 second timeout
      });
      
      if (response.data && response.data.words && response.data.words.length > 0) {
        const words = response.data.words;
        
        // Process words in parallel batches for better performance
        const BATCH_SIZE = 3;
        const wordBatches = [];
        
        for (let i = 0; i < words.length; i += BATCH_SIZE) {
          wordBatches.push(words.slice(i, i + BATCH_SIZE));
        }
        
        // Process each batch
        for (let batch of wordBatches) {
          await Promise.all(batch.map(async (word) => {
            if (!word.imageUrl) {
              try {
                word.imageUrl = await apiService.generateWordImage(word.french, word.english);
              } catch (imageError) {
                console.error(`Failed to generate image for ${word.french}, using placeholder`);
                word.imageUrl = apiService.generatePlaceholder(word.french, word.english);
              }
            }
          }));
        }
        
        return { words };
      }
      
      throw new Error('Invalid or empty response from backend');
    } catch (error) {
      console.error('Error getting image word match data from backend:', error);
      
      // Generate new words with OpenAI as fallback
      try {
        console.log("Backend image word match data fetch failed, using direct OpenAI connection");
        const result = await openai.post('/chat/completions', {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a French language teaching assistant creating content for an image-word matching game."
            },
            {
              role: "user",
              content: `Generate 8 concrete, easily visualizable French vocabulary words for the category "${category}" at ${difficulty} level. For each word, provide: the French word, the English translation, and the category. Choose words that can be clearly represented by images (like animals, objects, foods, etc.). Format as a JSON array.`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: "json_object" }
        });
        
        // Process the response
        const content = JSON.parse(result.data.choices[0].message.content);
        let words = Array.isArray(content) ? content : 
                   (content.words || content.vocabulary || []);
        
        // Format with unique IDs and generate images in batches
        const formattedWords = [];
        const BATCH_SIZE = 3;
        const wordBatches = [];
        
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          formattedWords.push({
            id: `word-${i + 1}-${Date.now()}`,
            french: word.french,
            english: word.english,
            category: word.category || category
          });
        }
        
        for (let i = 0; i < formattedWords.length; i += BATCH_SIZE) {
          wordBatches.push(formattedWords.slice(i, i + BATCH_SIZE));
        }
        
        // Process each batch
        for (let batch of wordBatches) {
          await Promise.all(batch.map(async (word) => {
            try {
              word.imageUrl = await apiService.generateWordImage(word.french, word.english);
            } catch (imageError) {
              console.error(`Failed to generate image for ${word.french}, using placeholder`);
              word.imageUrl = apiService.generatePlaceholder(word.french, word.english);
            }
          }));
        }
        
        return { words: formattedWords };
      } catch (openaiError) {
        console.error('OpenAI word generation failed, using hardcoded fallback:', openaiError);
        
        // Final fallback to hardcoded category-specific vocabulary
        const fallbackVocabulary = {
          animals: [
            { id: 'a1', french: 'chat', english: 'cat' },
            { id: 'a2', french: 'chien', english: 'dog' },
            { id: 'a3', french: 'oiseau', english: 'bird' },
            { id: 'a4', french: 'poisson', english: 'fish' },
            { id: 'a5', french: 'lapin', english: 'rabbit' }
          ],
          food: [
            { id: 'f1', french: 'pain', english: 'bread' },
            { id: 'f2', french: 'fromage', english: 'cheese' },
            { id: 'f3', french: 'pomme', english: 'apple' },
            { id: 'f4', french: 'eau', english: 'water' },
            { id: 'f5', french: 'café', english: 'coffee' }
          ],
          household: [
            { id: 'h1', french: 'table', english: 'table' },
            { id: 'h2', french: 'chaise', english: 'chair' },
            { id: 'h3', french: 'lit', english: 'bed' },
            { id: 'h4', french: 'lampe', english: 'lamp' },
            { id: 'h5', french: 'porte', english: 'door' }
          ],
          colors: [
            { id: 'c1', french: 'rouge', english: 'red' },
            { id: 'c2', french: 'bleu', english: 'blue' },
            { id: 'c3', french: 'vert', english: 'green' },
            { id: 'c4', french: 'jaune', english: 'yellow' },
            { id: 'c5', french: 'noir', english: 'black' }
          ],
          places: [
            { id: 'p1', french: 'maison', english: 'house' },
            { id: 'p2', french: 'école', english: 'school' },
            { id: 'p3', french: 'parc', english: 'park' },
            { id: 'p4', french: 'hôpital', english: 'hospital' },
            { id: 'p5', french: 'restaurant', english: 'restaurant' }
          ]
        };
        
        // Use category-specific vocabulary or default to animals
        const words = fallbackVocabulary[category] || fallbackVocabulary.animals;
        
        // Add placeholder images
        for (let word of words) {
          word.imageUrl = apiService.generatePlaceholder(word.french, word.english);
        }
        
        return { words };
      }
    }
  },

  /**
   * Generate a placeholder SVG for failed image loads
   * @param {string} word - The French word
   * @param {string} english - English translation
   * @returns {string} Data URL for SVG image
   */
  generatePlaceholder(word, english) {
    // Choose a color based on the first character of the word
    const colorMap = {
      'a': '#FFD6A5', 'b': '#FFADAD', 'c': '#CAFFBF', 'd': '#9BF6FF',
      'e': '#BDB2FF', 'f': '#FFC6FF', 'g': '#FDFFB6', 'h': '#A0C4FF',
      'i': '#FFD6A5', 'j': '#FFADAD', 'k': '#CAFFBF', 'l': '#9BF6FF',
      'm': '#BDB2FF', 'n': '#FFC6FF', 'o': '#FDFFB6', 'p': '#A0C4FF',
      'q': '#FFD6A5', 'r': '#FFADAD', 's': '#CAFFBF', 't': '#9BF6FF',
      'u': '#BDB2FF', 'v': '#FFC6FF', 'w': '#FDFFB6', 'x': '#A0C4FF',
      'y': '#BDB2FF', 'z': '#FFC6FF'
    };
    
    const firstChar = word.charAt(0).toLowerCase();
    const bgColor = colorMap[firstChar] || '#F8F9FA';
    
    // Get appropriate icon based on category
    let svgIcon = '';
    const lowerEnglish = english.toLowerCase();
    
    if (/cat|dog|bird|animal|fish|pet|rabbit|mouse|pig|hen|duck/.test(lowerEnglish)) {
      // Animal icon
      svgIcon = `<circle cx="125" cy="75" r="30" fill="#333333"/>
                 <path d="M90,115 C90,90 160,90 160,115 C160,150 90,150 90,115" fill="#333333"/>`;
    } else if (/bread|cheese|apple|water|coffee|food|fruit|wine|soup|chicken/.test(lowerEnglish)) {
      // Food icon
      svgIcon = `<circle cx="125" cy="80" r="35" fill="#333333"/>
                 <rect x="115" y="115" width="20" height="40" fill="#333333"/>`;
    } else if (/table|chair|bed|lamp|door|window|rug|mirror|clock|television|furniture/.test(lowerEnglish)) {
      // Household item
      svgIcon = `<rect x="75" y="60" width="100" height="80" fill="#333333"/>
                 <rect x="105" y="140" width="40" height="30" fill="#333333"/>`;
    } else if (/red|blue|green|yellow|black|white|gray|orange|purple|pink|color/.test(lowerEnglish)) {
      // Color swatch
      svgIcon = `<rect x="75" y="60" width="100" height="100" fill="#333333"/>`;
    } else {
      // Default place icon
      svgIcon = `<path d="M125,50 L175,100 L150,100 L150,150 L100,150 L100,100 L75,100 Z" fill="#333333"/>`;
    }
    
    // Create SVG with word and translation
    const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 250 250">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      ${svgIcon}
      <text x="125" y="200" font-family="Arial, sans-serif" font-size="28" text-anchor="middle" font-weight="bold" fill="#333333">${word}</text>
      <text x="125" y="225" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#666666">${english}</text>
    </svg>
    `;
    
    try {
      return `data:image/svg+xml;base64,${btoa(svgContent)}`;
    } catch (e) {
      console.error('SVG encoding error:', e);
      // Fallback to simpler SVG if encoding fails
      const simpleSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 250 250">
        <rect width="100%" height="100%" fill="${bgColor}"/>
        <text x="125" y="125" font-family="Arial, sans-serif" font-size="28" text-anchor="middle" font-weight="bold" fill="#333333">${word}</text>
      </svg>
      `;
      return `data:image/svg+xml;base64,${btoa(simpleSvg)}`;
    }
  },

  /**
   * Get phrase constructor data using AI
   * @param {string} difficulty - Difficulty level
   * @param {string} category - Phrase category
   * @param {number} timestamp - Timestamp to ensure unique requests
   * @param {number} round - Current round number
   * @param {Array} usedPhrases - Previously used phrases
   * @returns {Promise<Object>} Phrase data
   */
  async getPhraseConstructorData(difficulty = 'beginner', category = 'greetings', timestamp = Date.now(), round = 1, usedPhrases = []) {
    try {
      // Try to get data from backend
      const response = await api.get(`/ai/phrase-constructor/${difficulty}?category=${category}&round=${round}`);
      if (response.data && (response.data.french || response.data.frenchPhrase)) {
        // Normalize response data
        const normalizedData = {
          id: `phrase-${round}-${Date.now()}`,
          french: response.data.french || response.data.frenchPhrase || '',
          english: response.data.english || response.data.englishTranslation || '',
          words: response.data.words || [],
          hint: response.data.hint || response.data.context || '',
        };
        
        // Check if this is a duplicate phrase
        if (usedPhrases.includes(normalizedData.french)) {
          throw new Error('Duplicate phrase detected, will generate new one');
        }
        
        return normalizedData;
      }
      
      // If backend fails, use direct OpenAI connection
      console.log("Backend phrase data fetch failed, using direct OpenAI connection");
      
      // Add round information to ensure we get different phrases
      const promptPrefix = round > 1 ? 
        `For round ${round}, create a NEW French phrase (different from previous rounds) ` :
        `Create a French phrase `;
      
      const result = await openai.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a French language teacher creating phrase construction exercises. Return valid JSON with exactly the fields requested."
          },
          {
            role: "user",
            content: `${promptPrefix}for ${difficulty} level learners related to the category "${category}". 
            
Already used phrases: ${usedPhrases.join(", ")}

Return a JSON object with these exact fields:
- id: a unique identifier string
- french: the complete French phrase (without punctuation marks for easier construction)
- english: the English translation
- words: an array of strings, each string being one word needed to construct the French phrase in the correct order
- hint: a short hint about the context or usage of this phrase`
          }
        ],
        temperature: 0.8, // Slightly higher temperature for more variety
        max_tokens: 500,
        response_format: { type: "json_object" }
      });
      
      // Parse and normalize the response
      const aiResponse = JSON.parse(result.data.choices[0].message.content);
      
      const normalizedData = {
        id: aiResponse.id || `phrase-${round}-${Date.now()}`,
        french: aiResponse.french || '',
        english: aiResponse.english || '',
        words: aiResponse.words || [],
        hint: aiResponse.hint || '',
      };
      
      // Check if this is a duplicate phrase
      if (usedPhrases.includes(normalizedData.french)) {
        // Try again with a different timestamp
        return apiService.getPhraseConstructorData(difficulty, category, Date.now() + 1000, round, usedPhrases);
      }
      
      return normalizedData;
    } catch (error) {
      console.error('Error getting phrase constructor data:', error);
      
      // If we got an error due to duplicate, try again with a different approach
      if (error.message && error.message.includes('Duplicate phrase')) {
        // Try a direct call to OpenAI with a stronger instruction to get a different phrase
        const categoryPrompts = {
          greetings: ["greeting someone", "saying goodbye", "introducing yourself", "welcoming someone"],
          questions: ["asking for information", "asking about time", "asking for directions", "asking about preferences"],
          food: ["ordering at a restaurant", "discussing food preferences", "talking about ingredients", "planning a meal"],
          travel: ["asking for directions", "booking accommodations", "taking public transportation", "discussing travel plans"],
          daily: ["describing daily routines", "talking about the weather", "discussing plans", "expressing opinions"]
        };
        
        // Get a varied prompt based on round number
        const categoryVariations = categoryPrompts[category] || ["basic conversation"];
        const variation = categoryVariations[round % categoryVariations.length] || category;
        
        try {
          const emergencyResult = await openai.post('/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "Create a unique French language phrase that hasn't been used before."
              },
              {
                role: "user",
                content: `Create a UNIQUE French phrase for ${difficulty} level about ${variation}. 
                Make sure it's different from: ${usedPhrases.join(", ")}
                
                Return a JSON with:
                - french: the phrase in French (no punctuation)
                - english: English translation
                - words: array of individual words
                - hint: short context hint`
              }
            ],
            temperature: 1.0, // High temperature for maximum variation
            max_tokens: 500,
            response_format: { type: "json_object" }
          });
          
          const emergencyResponse = JSON.parse(emergencyResult.data.choices[0].message.content);
          return {
            id: `phrase-emergency-${round}-${Date.now()}`,
            french: emergencyResponse.french || '',
            english: emergencyResponse.english || '',
            words: emergencyResponse.words || [],
            hint: emergencyResponse.hint || '',
          };
        } catch (emergencyError) {
          console.error('Emergency phrase generation failed:', emergencyError);
        }
      }
      
      // Last resort fallback
      const fallbackPhrases = [
        { french: "Bonjour comment allez vous", english: "Hello how are you", words: ["Bonjour", "comment", "allez", "vous"], hint: "Greeting someone formally" },
        { french: "Je voudrais un café", english: "I would like a coffee", words: ["Je", "voudrais", "un", "café"], hint: "Ordering at a café" },
        { french: "Où est la gare", english: "Where is the train station", words: ["Où", "est", "la", "gare"], hint: "Asking for directions" },
        { french: "Je m'appelle Jean", english: "My name is Jean", words: ["Je", "m'appelle", "Jean"], hint: "Introducing yourself" },
        { french: "Il fait beau aujourd'hui", english: "The weather is nice today", words: ["Il", "fait", "beau", "aujourd'hui"], hint: "Talking about weather" }
      ];
      
      // Choose a fallback phrase based on round number to ensure variation
      const fallbackIndex = (round - 1) % fallbackPhrases.length;
      return {
        id: `phrase-fallback-${round}-${Date.now()}`,
        ...fallbackPhrases[fallbackIndex]
      };
    }
  },
  
  /**
   * Get quiz challenge data using AI
   * @param {string} category - Quiz category
   * @param {string} difficulty - Difficulty level
   * @param {number} count - Number of questions
   * @param {number} timestamp - Timestamp to ensure unique requests
   * @param {Array} usedCategories - Previously used categories
   * @returns {Promise<Array>} Quiz questions
   */
  async getQuizData(category = 'mixed', difficulty = 'beginner', count = 10, timestamp = Date.now(), usedCategories = []) {
    try {
      // Try to get quiz data from backend
      const response = await api.post('/ai/generate-quiz', {
        category,
        difficulty,
        count
      });
      
      if (response.data && (response.data.questions || Array.isArray(response.data))) {
        const questions = response.data.questions || response.data;
        return questions.map((q, index) => ({
          id: q.id || `quiz-${index + 1}-${Date.now()}`,
          text: q.text || q.question || 'Question not available',
          translation: q.translation || `What does "${q.text}" mean?`,
          options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: q.correctAnswer || 0,
          explanation: q.explanation || 'Explanation not available'
        }));
      }
      
      // If backend fails, use direct OpenAI connection
      console.log("Backend quiz data fetch failed, using direct OpenAI connection");
      const result = await openai.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a French language teacher creating multiple-choice quiz questions. Format as JSON.`
          },
          {
            role: "user",
            content: `Create ${count} French language quiz questions about "${category}" for ${difficulty} level students. 

For EACH question, include:
1. text: The question in French
2. translation: The same question translated to English 
3. options: Array of 4 possible answers (make sure one is correct)
4. correctAnswer: Index of correct answer (0-3)
5. explanation: Brief explanation of the answer in English

Format your response as a JSON array of questions. Make sure the questions are diverse and appropriate for the difficulty level.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const content = JSON.parse(result.data.choices[0].message.content);
      const questions = content.questions || content;
      
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid quiz data format');
      }

      // Normalize each question
      return questions.map((q, index) => ({
        id: `quiz-${index + 1}-${Date.now()}`,
        text: q.text || 'Question not available',
        translation: q.translation || `What does "${q.text}" mean?`,
        options: Array.isArray(q.options) && q.options.length >= 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 ? q.correctAnswer : 0,
        explanation: q.explanation || 'Explanation not available'
      }));
    } catch (error) {
      console.error('Error getting quiz data:', error);
      
      // Generate emergency fallback quiz data
      const fallbackQuestions = [
        {
          id: `quiz-1-${Date.now()}`,
          text: "Comment dit-on 'hello' en français?",
          translation: "How do you say 'hello' in French?",
          options: ["bonjour", "au revoir", "merci", "s'il vous plaît"],
          correctAnswer: 0,
          explanation: "'Bonjour' means 'hello' in French."
        },
        {
          id: `quiz-2-${Date.now()}`,
          text: "Quelle est la couleur du ciel?",
          translation: "What is the color of the sky?",
          options: ["bleu", "rouge", "vert", "jaune"],
          correctAnswer: 0,
          explanation: "The sky is blue (bleu)."
        },
        {
          id: `quiz-3-${Date.now()}`,
          text: "Comment dit-on 'thank you' en français?",
          translation: "How do you say 'thank you' in French?",
          options: ["merci", "bonjour", "au revoir", "oui"],
          correctAnswer: 0,
          explanation: "'Merci' means 'thank you' in French."
        },
        {
          id: `quiz-4-${Date.now()}`,
          text: "Quelle est la capitale de la France?",
          translation: "What is the capital of France?",
          options: ["Paris", "Lyon", "Marseille", "Bordeaux"],
          correctAnswer: 0,
          explanation: "Paris is the capital of France."
        },
        {
          id: `quiz-5-${Date.now()}`,
          text: "Quel jour vient après lundi?",
          translation: "What day comes after Monday?",
          options: ["mardi", "mercredi", "jeudi", "dimanche"],
          correctAnswer: 0,
          explanation: "Tuesday (mardi) comes after Monday (lundi)."
        }
      ];
      
      // Add more questions to meet the requested count
      while (fallbackQuestions.length < count) {
        fallbackQuestions.push({
          id: `quiz-${fallbackQuestions.length + 1}-${Date.now()}`,
          text: "Quel est le mot français pour 'water'?",
          translation: "What is the French word for 'water'?",
          options: ["eau", "vin", "bière", "jus"],
          correctAnswer: 0,
          explanation: "'Eau' means 'water' in French."
        });
      }
      
      return fallbackQuestions.slice(0, count);
    }
  },
  
  /**
   * Chat with AI language buddy
   * @param {string} message - User message
   * @param {string} userLevel - User's French level
   * @param {Array} conversationHistory - Previous conversation history
   * @returns {Promise<Object>} Chat response with suggestions
   */
  async chatWithAI(message, userLevel = 'beginner', conversationHistory = []) {
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
      console.log("Backend AI chat failed, using direct OpenAI connection");
      
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
          role: msg.role,
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
        response: "Je suis désolé, mais je rencontre des difficultés techniques. Pouvons-nous essayer à nouveau? (I'm sorry, but I'm experiencing technical difficulties. Can we try again?)",
        suggestions: [
          "Comment dit-on... en français? (How do you say... in French?)",
          "Je ne comprends pas. (I don't understand.)",
          "Pouvez-vous répéter, s'il vous plaît? (Can you repeat, please?)"
        ]
      };
    }
  },
  
  /**
   * Get French words for the Hangman game with AI integration
   * @param {string} category - Word category
   * @param {string} difficulty - Difficulty level
   * @returns {Promise<Object>} Hangman word data
   */
  async getHangmanWords(category = 'animals', difficulty = 'beginner') {
    try {
      console.log(`Fetching Hangman words for category: ${category}, difficulty: ${difficulty}`);
      
      // Try to use backend first
      try {
        const response = await api.get(`/ai/hangman-words?category=${category}&difficulty=${difficulty}`);
        if (response.data && response.data.words && response.data.words.length > 0) {
          return response.data;
        }
      } catch (backendError) {
        console.warn('Backend hangman words fetch failed, trying direct OpenAI:', backendError.message);
      }
      
      // Direct OpenAI call if backend fails
      console.log("Using direct OpenAI connection for hangman words");
      
      // Create a timestamp to ensure uniqueness in requests
      const timestamp = Date.now();
      
      // Add specific requirements based on difficulty
      let wordLengthConstraint = "";
      if (difficulty === "beginner") {
        wordLengthConstraint = "Keep words simple with 3-6 letters";
      } else if (difficulty === "intermediate") {
        wordLengthConstraint = "Choose words with 5-8 letters with moderate complexity";
      } else {
        wordLengthConstraint = "Include challenging words with 7-12 letters that may include accents or hyphens";
      }
      
      const result = await openai.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You're a French language teacher generating vocabulary lists for a hangman game."
          },
          {
            role: "user",
            content: `Generate 10 French words for a Hangman game about "${category}" at ${difficulty} level. ${wordLengthConstraint}. Do not include words that are identical in English and French (like 'normal' or 'radio').

For each word provide:
1. french: The word in lowercase French
2. english: The English translation
3. hint: A helpful clue (without mentioning the word itself)

Format your response as a JSON object with a 'words' array containing these fields.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });
      
      const content = JSON.parse(result.data.choices[0].message.content);
      
      if (content && content.words && content.words.length > 0) {
        // Add timestamps to words to ensure uniqueness
        content.words = content.words.map((word, index) => ({
          ...word,
          id: `hangman-${index}-${timestamp}`
        }));
        
        return content;
      }
      
      throw new Error('Invalid response format from OpenAI');
    } catch (error) {
      console.error('Error getting hangman words:', error);
      
      // For fallback, we'll use hardcoded words in the component
      throw error;
    }
  },
};

export default apiService;