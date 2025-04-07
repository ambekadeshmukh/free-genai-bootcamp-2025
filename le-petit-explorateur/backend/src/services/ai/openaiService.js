const { OpenAI } = require('openai');
const logger = require('../../utils/logger');

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate content (vocabulary, phrases, grammar, etc.)
 * @param {Object} params - Content parameters
 * @param {string} params.contentType - Type of content to generate
 * @param {string} params.theme - Theme of the content
 * @param {string} params.difficulty - Difficulty level
 * @param {number} params.count - Number of items to generate
 * @returns {Promise<Object>} Generated content
 */
exports.generateContent = async ({ contentType, theme, difficulty, count }) => {
  try {
    // Prepare system prompt based on content type
    let systemPrompt = "You are a French language education expert specializing in creating engaging learning content.";
    
    // Add content-specific instructions
    if (contentType === 'vocabulary') {
      systemPrompt += ` Generate ${count} French vocabulary words with their English translations related to the theme "${theme}". Include categories, example usage, and difficulty level.`;
    } else if (contentType === 'phrases') {
      systemPrompt += ` Create ${count} useful French phrases suitable for ${difficulty} level learners related to "${theme}". Include translations and usage context.`;
    } else if (contentType === 'grammar') {
      systemPrompt += ` Explain a ${difficulty} level French grammar concept related to "${theme}". Include examples and practice exercises.`;
    } else if (contentType === 'quiz') {
      systemPrompt += ` Create ${count} multiple-choice quiz questions about French vocabulary, grammar, or culture suitable for ${difficulty} level students.`;
    }
    
    // User prompt with detailed instructions
    const userPrompt = `Generate ${contentType} content for ${difficulty} level French learners on the theme of "${theme}". 
    Please provide ${count} items in a structured JSON format that's ready to use in a learning application.
    
    For vocabulary words, include:
    - French word
    - English translation
    - Category
    - Example sentence in French
    - Example sentence in English
    
    For phrases, include:
    - French phrase
    - English translation
    - Context/usage notes
    - Words array for the Phrase Constructor game
    
    For quiz questions, include:
    - Question text
    - Four multiple choice options
    - Correct answer
    - Brief explanation
    
    Format all responses as a JSON array.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const content = JSON.parse(response.choices[0].message.content);
    
    // Handle different response formats and ensure consistent structure
    let formattedContent;
    
    if (contentType === 'vocabulary') {
      formattedContent = Array.isArray(content.items || content.vocabulary || content.words) 
        ? (content.items || content.vocabulary || content.words)
        : (Array.isArray(content) ? content : []);
    } else if (contentType === 'phrases') {
      formattedContent = Array.isArray(content.phrases || content.items)
        ? (content.phrases || content.items)
        : (Array.isArray(content) ? content : []);
    } else if (contentType === 'quiz') {
      formattedContent = Array.isArray(content.questions || content.items)
        ? (content.questions || content.items)
        : (Array.isArray(content) ? content : []);
    } else {
      formattedContent = content;
    }
    
    // Ensure all items have an id
    if (Array.isArray(formattedContent)) {
      formattedContent = formattedContent.map((item, index) => ({
        id: item.id || `${contentType}-${index + 1}`,
        ...item
      }));
    }
    
    return formattedContent;
  } catch (error) {
    logger.error(`OpenAI content generation error: ${error.message}`);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
};

/**
 * Generate chat response for AI Language Buddy
 * @param {Object} params - Chat parameters
 * @param {string} params.message - User's message
 * @param {string} params.userLevel - User's French proficiency level
 * @param {Array} params.conversationHistory - Previous conversation history
 * @returns {Promise<Object>} AI response
 */
exports.generateChatResponse = async ({ message, userLevel, conversationHistory = [] }) => {
  // Log the request
  logger.info('Generating chat response:', { message, userLevel });
  
  try {
    // Prepare system message
    const systemMessage = `You are a friendly French language tutor. The student is at ${userLevel} level. 
      Keep your responses concise and appropriate for their level.
      Always provide responses in both French and English.`;
    
    // Format conversation history
    const messages = [
      { role: 'system', content: systemMessage },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 500
    });
    
    // Return response
    return {
      response: response.choices[0].message.content,
      suggestions: [
        "Comment dit-on... en français? (How do you say... in French?)",
        "Je ne comprends pas. (I don't understand.)",
        "Pouvez-vous répéter, s'il vous plaît? (Can you repeat, please?)"
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        userLevel,
        model: 'gpt-3.5-turbo'
      }
    };
  } catch (error) {
    logger.error(`OpenAI chat generation error: ${error.message}`, { stack: error.stack });
    throw new Error(`Failed to generate chat response: ${error.message}`);
  }
};

/**
 * Generate quiz questions for learning games
 * @param {Object} params - Quiz parameters
 * @param {string} params.category - Category of questions
 * @param {string} params.difficulty - Difficulty level
 * @param {number} params.count - Number of questions
 * @returns {Promise<Array<Object>>} Array of quiz questions
 */
exports.generateQuizQuestions = async ({ category, difficulty, count }) => {
  try {
    // Prepare system prompt based on category and difficulty
    let systemPrompt = "You are a French language education expert specializing in creating engaging quiz questions.";
    
    // Add category-specific instructions
    if (category === 'vocabulary') {
      systemPrompt += " Focus on French vocabulary, translations, and word meanings.";
    } else if (category === 'grammar') {
      systemPrompt += " Focus on French grammar rules, verb conjugations, and sentence structure.";
    } else if (category === 'expressions') {
      systemPrompt += " Focus on common French expressions, idioms, and phrases.";
    } else if (category === 'culture') {
      systemPrompt += " Focus on French culture, customs, and cultural knowledge.";
    } else {
      systemPrompt += " Create a balanced mix of questions covering vocabulary, grammar, expressions, and cultural knowledge.";
    }
    
    // Add difficulty-specific instructions
    if (difficulty === 'beginner') {
      systemPrompt += " Questions should be suitable for beginners with very basic French knowledge.";
    } else if (difficulty === 'intermediate') {
      systemPrompt += " Questions should challenge learners with intermediate French knowledge.";
    } else if (difficulty === 'advanced') {
      systemPrompt += " Questions should be challenging and sophisticated for advanced learners.";
    }
    
    // User prompt with detailed instructions
    const userPrompt = `Create ${count} multiple-choice quiz questions about French language.

Each question should have:
1. A clear question in English
2. Four possible answers (only one correct)
3. The correct answer identified
4. A brief explanation of why the answer is correct

Make sure questions are appropriate for ${difficulty} level students. Format your response as a JSON array of question objects.

Example format:
[
  {
    "id": "1",
    "text": "What is 'hello' in French?",
    "options": ["Bonjour", "Au revoir", "Merci", "S'il vous plaît"],
    "correctAnswer": "Bonjour",
    "explanation": "'Bonjour' is the French word for 'hello' or 'good day'."
  }
]`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const content = JSON.parse(response.choices[0].message.content);
    
    // Handle different response formats - might be directly an array or nested under 'questions'
    let questions = Array.isArray(content) ? content : 
                   (content.questions || []);
    
    // Validate and format questions
    questions = questions.map((q, index) => ({
      id: q.id || String(index + 1),
      text: q.text,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || `The correct answer is "${q.correctAnswer}".`
    }));
    
    return {
      questions,
      metadata: {
        generatedAt: new Date().toISOString(),
        category,
        difficulty,
        count: questions.length,
        model: "gpt-4-turbo-preview"
      }
    };
  } catch (error) {
    logger.error(`OpenAI quiz generation error: ${error.message}`);
    throw new Error(`Failed to generate quiz questions: ${error.message}`);
  }
};

/**
 * Generate cultural context for vocabulary in context
 * @param {Object} params - Cultural context parameters
 * @param {Array<string>} params.vocabulary - List of vocabulary words
 * @param {string} params.theme - Theme of the cultural context
 * @param {string} params.difficulty - Difficulty level
 * @returns {Promise<Object>} Cultural context information
 */
exports.generateCulturalContext = async ({ vocabulary, theme, difficulty }) => {
  try {
    // Prepare prompts
    const systemPrompt = `You are a French language and culture expert. Generate cultural context information that helps language learners understand how vocabulary is used in authentic French cultural contexts.`;
    
    const userPrompt = `Create an engaging cultural context explanation for ${difficulty} level French learners about the theme "${theme}" that incorporates these vocabulary words: ${vocabulary.join(', ')}.
    
    Please format your response as a JSON object with:
    1. A short title for this cultural context
    2. A brief introduction explaining the cultural significance
    3. A main explanation incorporating all vocabulary words
    4. At least 2 example phrases showing the vocabulary in use
    5. A fun fact about this aspect of French culture
    
    Use language appropriate for ${difficulty} level learners.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    // Parse and format the response
    const content = JSON.parse(response.choices[0].message.content);
    
    // Add metadata
    content.metadata = {
      generatedAt: new Date().toISOString(),
      vocabulary,
      theme,
      difficulty,
      model: "gpt-4-turbo-preview"
    };
    
    return content;
  } catch (error) {
    logger.error(`OpenAI cultural context generation error: ${error.message}`);
    throw new Error(`Failed to generate cultural context: ${error.message}`);
  }
};

module.exports = exports;