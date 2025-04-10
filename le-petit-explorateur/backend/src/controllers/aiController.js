const { OpenAI } = require('openai');
const axios = require('axios');
const logger = require('../utils/logger');
const openaiService = require('../services/ai/openaiService');

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1', // Ensure we're using the correct base URL
});

// Initialize fallback data for when API calls fail
const fallbackVocabulary = require('../data/fallbackVocabulary');
const fallbackPhrases = require('../data/fallbackPhrases');
const fallbackQuizzes = require('../data/fallbackQuizzes');

// Verify API key is available
const verifyApiKey = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }
};

const aiController = {
  /**
   * @desc    Chat with AI Language Buddy
   * @route   POST /api/ai/chat
   */
  chatWithAI: async (req, res) => {
    try {
      verifyApiKey();
      const { message, history = [], userLevel = 'beginner' } = req.body;

      logger.info('Starting chat with AI', { userLevel, messageLength: message.length });

      // Format chat history for OpenAI
      const formattedHistory = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Prepare messages array with system prompt and history
      const messages = [
        {
          role: 'system',
          content: `You are a friendly French language tutor. Communicate with the user at a ${userLevel} level. If the user writes in English, respond in both French and English. If they write in French, gently correct any mistakes and respond in French with English translation.`
        },
        ...formattedHistory,
        { role: 'user', content: message }
      ];
      
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 500
      });
      
      // Generate suggested responses
      const suggestionPrompt = `Based on this conversation about learning French, generate 3 follow-up phrases that a ${userLevel} French learner might want to say next. Provide these in French with English translations in parentheses.`;
      
      // Make a second API call for suggestions
      const suggestionResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          ...messages,
          { role: 'assistant', content: response.choices[0].message.content },
          { role: 'user', content: suggestionPrompt }
        ],
        temperature: 0.7,
        max_tokens: 250
      });

      // Extract response and suggestions
      const aiResponse = response.choices[0].message.content;
      const suggestions = suggestionResponse.choices[0].message.content
        .split('\n')
        .filter(line => line.trim())
        .slice(0, 3);

      logger.info('Successfully generated AI response and suggestions');

      res.json({
        response: aiResponse,
        suggestions
      });

    } catch (error) {
      logger.error('AI chat error:', {
        error: error.message,
        stack: error.stack,
        apiKeyConfigured: !!process.env.OPENAI_API_KEY
      });
      
      res.status(500).json({
        error: 'Failed to generate AI response',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * @desc    Generate content (vocabulary, phrases, grammar, etc.)
   * @route   POST /api/ai/generate-content
   */
  generateContent: async (req, res) => {
    try {
      verifyApiKey();
      const { contentType, level = 'beginner', topic, count = 5 } = req.body;

      logger.info('Generating content:', { contentType, level, topic, count });

      // Create prompt based on content type
      let prompt = '';
      switch (contentType) {
        case 'vocabulary':
          prompt = `Generate ${count} French vocabulary words about "${topic}" suitable for ${level} level learners. For each word, include: French word, English translation, example sentence in French, and example sentence translation in English. Format each entry as: 1. [French Word] - [English Translation]\nExample: [French Sentence]\nTranslation: [English Sentence]`;
          break;
        case 'phrases':
          prompt = `Generate ${count} useful French phrases about "${topic}" suitable for ${level} level learners. For each phrase, include: French phrase, English translation, and when to use it. Format each entry as: 1. [French Phrase] - [English Translation]\nUsage: [When to use it]`;
          break;
        case 'grammar':
          prompt = `Explain ${count} important French grammar concepts about "${topic}" suitable for ${level} level learners. For each concept, provide explanation, examples, and common mistakes to avoid. Format each entry as: 1. [Grammar Concept]\nExplanation: [Clear explanation]\nExamples: [2-3 examples]\nCommon Mistakes: [What to avoid]`;
          break;
        default:
          throw new Error('Invalid content type');
      }

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable French language teacher. Provide clear, structured responses.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      // Process and format the response
      const content = response.choices[0].message.content;

      logger.info('Successfully generated content');

      res.status(200).json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Generate content error:', {
        error: error.message,
        stack: error.stack,
        contentType: req.body.contentType
      });
      
      res.status(500).json({
        error: 'Failed to generate content',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * @desc    Generate an image for vocabulary or cultural context
   * @route   POST /api/ai/generate-image
   */
  generateImage: async (req, res) => {
    try {
      verifyApiKey();
      const { prompt } = req.body;
      
      // Generate image using OpenAI
      const imageUrl = await openaiService.generateImage(prompt);
      
      if (!imageUrl) {
        throw new Error('Failed to generate image');
      }
      
      res.status(200).json({
        success: true,
        imageUrl,
        metadata: {
          prompt,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Image generation error:', {
        error: error.message,
        stack: error.stack,
        prompt: req.body.prompt
      });
      
      // Return a placeholder image
      res.status(200).json({
        success: false,
        imageUrl: `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(req.body.prompt || 'Image')}`,
        isPlaceholder: true,
        metadata: {
          prompt: req.body.prompt,
          error: error.message,
          generatedAt: new Date().toISOString()
        }
      });
    }
  },

  /**
   * @desc    Generate quiz questions
   * @route   POST /api/ai/generate-quiz
   */
  generateQuizQuestions: async (req, res) => {
    try {
      verifyApiKey();
      const { topic, level = 'beginner', count = 5 } = req.body;

      const prompt = `Generate ${count} multiple-choice French language quiz questions about "${topic}" suitable for ${level} level learners. For each question, provide:
      1. Question in French
      2. Question translation in English
      3. Four possible answers (A, B, C, D)
      4. Correct answer
      5. Explanation of why it's correct
      
      Format your response as JSON with these fields:
      {
        "question": "French question",
        "translation": "English translation",
        "answers": ["A", "B", "C", "D"],
        "correct": "Correct answer",
        "explanation": "Explanation of why it's correct"
      }`;

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are a French language teacher creating quiz questions. Format the response clearly.' 
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      logger.info('Successfully generated quiz questions');

      res.status(200).json({
        success: true,
        data: response.choices[0].message.content
      });
    } catch (error) {
      logger.error('Generate quiz error:', {
        error: error.message,
        stack: error.stack,
        topic: req.body.topic
      });
      
      res.status(500).json({
        error: 'Failed to generate quiz questions',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * @desc    Get phrase constructor data
   * @route   GET /api/ai/phrase-constructor/:level
   */
  getPhraseConstructorData: async (req, res) => {
    try {
      verifyApiKey();
      const { level } = req.params;
      const category = req.query.category || 'greetings';
      
      // Generate phrase using OpenAI
      const promptContent = `Create a French phrase suitable for ${level || 'beginner'} level learners related to ${category || 'greetings'}.
                            The phrase should be practical and useful.
                            Format the response as a JSON object with:
                            {
                              "french": "The French phrase",
                              "english": "The English translation",
                              "words": ["Array", "of", "individual", "French", "words"],
                              "hint": "A hint about usage context"
                            }`;
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are a French language teaching assistant creating content for a phrase building exercise.' 
          },
          { 
            role: 'user', 
            content: promptContent 
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });
      
      // Parse the response
      const data = JSON.parse(response.choices[0].message.content);
      
      // Add ID if missing
      data.id = data.id || `phrase-${Date.now()}`;
      
      logger.info('Successfully generated phrase constructor data');

      res.status(200).json(data);
    } catch (error) {
      logger.error('Phrase constructor data error:', {
        error: error.message,
        stack: error.stack,
        level: req.params.level
      });
      
      // Return fallback phrase
      const fallbackPhrase = fallbackPhrases[req.query.category || 'greetings'][0] || {
        id: '1',
        french: 'Bonjour comment allez-vous',
        english: 'Hello how are you',
        words: ['Bonjour', 'comment', 'allez', 'vous'],
        hint: 'A common greeting'
      };
      
      res.status(200).json(fallbackPhrase);
    }
  },

  /**
   * @desc    Get words for Word Lineup game
   * @route   GET /api/ai/word-lineup/:level
   */
  getWordLineupWords: async (req, res) => {
    try {
      verifyApiKey();
      const { level } = req.params;
      const theme = req.query.theme || 'animals';
      const count = parseInt(level) + 4; // More words for higher levels
      
      // Generate vocabulary using OpenAI
      const promptContent = `Generate ${count} French vocabulary words related to "${theme}" for ${level || 'beginner'} level learners.
                            Include common, everyday words that would be useful to learn.
                            Format as JSON array with:
                            {
                              "id": "1",
                              "french": "French word",
                              "english": "English translation",
                              "category": "${theme}"
                            }`;
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are a French language teaching assistant creating vocabulary for a matching game.' 
          },
          { 
            role: 'user', 
            content: promptContent 
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });
      
      // Parse the response
      let data = JSON.parse(response.choices[0].message.content);
      
      // Get the array of words (handle different formats)
      let words = data.words || data.vocabulary || data;
      if (!Array.isArray(words)) {
        words = [words];
      }
      
      // Generate images for each word
      const wordsWithImages = await Promise.all(words.map(async (word, index) => {
        try {
          // Add ID if missing
          const wordWithId = {
            ...word,
            id: word.id || `word-${index + 1}`
          };
          
          // Generate image using OpenAI DALL-E
          const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: `A clear, simple illustration of the French word "${word.french}" (${word.english}). Educational style, suitable for language learning.`,
            n: 1,
            size: "256x256"
          });
          
          // Get image URL from response
          const imageUrl = imageResponse.data[0].url;
          
          // Download image and convert to base64
          const imageDataResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          const imageData = Buffer.from(imageDataResponse.data).toString('base64');
          
          return {
            ...wordWithId,
            imageUrl: `data:image/png;base64,${imageData}`
          };
        } catch (error) {
          logger.error(`Error generating image for ${word.french}: ${error.message}`);
          
          // Return word with placeholder image
          return {
            ...word,
            id: word.id || `word-${index + 1}`,
            imageUrl: `https://via.placeholder.com/256x256?text=${encodeURIComponent(word.french)}`
          };
        }
      }));
      
      logger.info('Successfully generated word lineup words');

      res.status(200).json({ words: wordsWithImages });
    } catch (error) {
      logger.error('Word lineup data error:', {
        error: error.message,
        stack: error.stack,
        level: req.params.level
      });
      
      // Return fallback words with placeholder images
      const fallbackWords = fallbackVocabulary[req.query.theme || 'animals'] || fallbackVocabulary.general;
      const wordsWithPlaceholders = fallbackWords.slice(0, 6).map((word, index) => ({
        ...word,
        imageUrl: `https://via.placeholder.com/256x256?text=${encodeURIComponent(word.french)}`
      }));
      
      res.status(200).json({ words: wordsWithPlaceholders });
    }
  },

  /**
   * @desc    Get daily lesson vocabulary
   * @route   GET /api/ai/daily-lesson
   */
  getDailyLesson: async (req, res) => {
    try {
      verifyApiKey();
      // Use current date for consistent daily words
      const today = new Date().toISOString().split('T')[0];
      
      // Generate vocabulary using OpenAI
      const promptContent = `Generate 7 French vocabulary words for beginners for their daily lesson on ${today}.
                            Include a mix of categories (greetings, food, animals, etc.) that would be useful for beginners.
                            Format as JSON array with:
                            {
                              "id": "1",
                              "french": "French word",
                              "english": "English translation",
                              "category": "category",
                              "exampleFrench": "Example sentence in French",
                              "exampleEnglish": "Example sentence in English"
                            }`;
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are a French language teaching assistant creating a daily vocabulary lesson.' 
          },
          { 
            role: 'user', 
            content: promptContent 
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });
      
      // Parse the response
      let data = JSON.parse(response.choices[0].message.content);
      
      // Get the array of words (handle different formats)
      let words = data.words || data.vocabulary || data;
      if (!Array.isArray(words)) {
        words = [words];
      }
      
      // Ensure all words have IDs
      const wordsWithIds = words.map((word, index) => ({
        ...word,
        id: word.id || `daily-${index + 1}`
      }));
      
      logger.info('Successfully generated daily lesson vocabulary');

      res.status(200).json(wordsWithIds);
    } catch (error) {
      logger.error('Daily lesson error:', {
        error: error.message,
        stack: error.stack
      });
      
      // Return fallback vocabulary based on day of week
      const dayOfWeek = new Date().getDay();
      const themes = Object.keys(fallbackVocabulary);
      const theme = themes[dayOfWeek % themes.length];
      
      const fallbackWords = fallbackVocabulary[theme] || fallbackVocabulary.general;
      
      res.status(200).json(fallbackWords);
    }
  },

  /**
   * @desc    Get word details for flashcard AI integration
   * @route   POST /api/ai/word-details
   */
  getWordDetails: async (req, res) => {
    try {
      verifyApiKey();
      // Check if API key is configured
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured');
      }

      const { word, english, userLevel = 'beginner' } = req.body;

      const prompt = `As a French language tutor, provide detailed information about the French word "${word}" (English: "${english}") for a ${userLevel} level student.
      Include:
      1. A clear definition in simple terms
      2. An example sentence using the word (provide both French and English)
      3. Any helpful tips for remembering or using the word correctly
      
      Format your response as JSON with these fields:
      {
        "definition": "simple definition here",
        "exampleFrench": "example sentence in French",
        "exampleEnglish": "example sentence in English",
        "tips": "helpful tips here"
      }`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful French language tutor. Respond only with the requested JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      // Parse the JSON response
      const wordDetails = JSON.parse(response.choices[0].message.content);

      logger.info('Successfully generated word details');

      res.json(wordDetails);

    } catch (error) {
      logger.error('Word details error:', {
        error: error.message,
        stack: error.stack,
        apiKeyConfigured: !!process.env.OPENAI_API_KEY
      });

      // Return a fallback response
      res.json({
        definition: `${req.body.english} (Basic translation)`,
        exampleFrench: "Je ne peux pas générer d'exemple pour le moment.",
        exampleEnglish: "I cannot generate an example at the moment.",
        tips: "Try using this word in simple sentences to practice."
      });
    }
  },

  // Helper function to extract suggestions from text
  extractSuggestions: (text) => {
    // Try to find numbered or bulleted suggestions
    const suggestionRegex = /[\d\-\*\.]+\s*["']?(.+?)["']?\s*(?:\((.+?)\))?/g;
    const matches = [...text.matchAll(suggestionRegex)];
    
    if (matches.length >= 3) {
      return matches.slice(0, 3).map(match => {
        const french = match[1].trim();
        const english = match[2] ? match[2].trim() : '';
        return english ? `${french} (${english})` : french;
      });
    }
    
    // Fallback to splitting by newlines if regex doesn't work
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length >= 3) {
      return lines.slice(0, 3).map(line => line.trim());
    }
    
    // Final fallback
    return [
      "Comment dit-on... en français? (How do you say... in French?)",
      "Je ne comprends pas. (I don't understand.)",
      "Pouvez-vous répéter, s'il vous plaît? (Can you repeat, please?)"
    ];
  }
};

module.exports = aiController;