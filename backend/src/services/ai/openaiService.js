const { OpenAI } = require('openai');
const { prompts } = require('../../utils/promptTemplates');
const logger = require('../../utils/logger');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate content using GPT-4 Turbo
 * @param {Object} params - Content generation parameters
 * @param {string} params.contentType - Type of content (vocabulary, phrases, sentences)
 * @param {string} params.theme - Theme of the content
 * @param {string} params.difficulty - Difficulty level (beginner, intermediate, advanced)
 * @param {number} params.count - Number of items to generate
 * @returns {Promise<Object>} Generated content
 */
exports.generateContent = async ({ contentType, theme, difficulty, count }) => {
  try {
    const promptTemplate = prompts.content[contentType];
    
    if (!promptTemplate) {
      throw new Error(`Unknown content type: ${contentType}`);
    }
    
    const prompt = promptTemplate
      .replace('{{theme}}', theme)
      .replace('{{difficulty}}', difficulty)
      .replace('{{count}}', count);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a French language education expert specializing in creating engaging educational content for language learners."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const content = JSON.parse(response.choices[0].message.content);
    
    // Add metadata
    content.metadata = {
      generatedAt: new Date().toISOString(),
      contentType,
      theme,
      difficulty,
      model: "gpt-4-turbo"
    };
    
    return content;
  } catch (error) {
    logger.error(`OpenAI content generation error: ${error.message}`);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
};

/**
 * Generate cultural context for vocabulary learning
 * @param {Object} params - Cultural context parameters
 * @param {Array<string>} params.vocabulary - List of vocabulary words
 * @param {string} params.theme - Theme of the vocabulary
 * @param {string} params.difficulty - Difficulty level
 * @returns {Promise<Object>} Cultural context information
 */
exports.generateCulturalContext = async ({ vocabulary, theme, difficulty }) => {
  try {
    const prompt = prompts.cultural
      .replace('{{vocabulary}}', vocabulary.join(', '))
      .replace('{{theme}}', theme)
      .replace('{{difficulty}}', difficulty);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a French cultural expert who can explain cultural contexts behind French vocabulary and expressions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const context = JSON.parse(response.choices[0].message.content);
    
    // Add metadata
    context.metadata = {
      generatedAt: new Date().toISOString(),
      theme,
      difficulty,
      vocabulary,
      model: "gpt-4-turbo"
    };
    
    return context;
  } catch (error) {
    logger.error(`OpenAI cultural context generation error: ${error.message}`);
    throw new Error(`Failed to generate cultural context: ${error.message}`);
  }
};

/**
 * Generate grammar explanation
 * @param {Object} params - Grammar explanation parameters
 * @param {string} params.grammarTopic - Grammar topic to explain
 * @param {string} params.difficulty - Difficulty level
 * @returns {Promise<Object>} Grammar explanation
 */
exports.generateGrammarExplanation = async ({ grammarTopic, difficulty }) => {
  try {
    const prompt = prompts.grammar
      .replace('{{grammarTopic}}', grammarTopic)
      .replace('{{difficulty}}', difficulty);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a French language teacher specializing in explaining grammar concepts clearly and simply."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const explanation = JSON.parse(response.choices[0].message.content);
    
    // Add metadata
    explanation.metadata = {
      generatedAt: new Date().toISOString(),
      grammarTopic,
      difficulty,
      model: "gpt-4-turbo"
    };
    
    return explanation;
  } catch (error) {
    logger.error(`OpenAI grammar explanation error: ${error.message}`);
    throw new Error(`Failed to generate grammar explanation: ${error.message}`);
  }
};

/**
 * Generate feedback on user input
 * @param {Object} params - Feedback parameters
 * @param {string} params.userInput - User's input text
 * @param {string} params.exerciseType - Type of exercise
 * @param {string} params.difficulty - Difficulty level
 * @returns {Promise<Object>} Feedback on user's input
 */
exports.generateFeedback = async ({ userInput, exerciseType, difficulty }) => {
  try {
    const prompt = prompts.feedback
      .replace('{{userInput}}', userInput)
      .replace('{{exerciseType}}', exerciseType)
      .replace('{{difficulty}}', difficulty);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a supportive French language teacher providing constructive feedback to language learners."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const feedback = JSON.parse(response.choices[0].message.content);
    
    // Add metadata
    feedback.metadata = {
      generatedAt: new Date().toISOString(),
      exerciseType,
      difficulty,
      model: "gpt-4-turbo"
    };
    
    return feedback;
  } catch (error) {
    logger.error(`OpenAI feedback generation error: ${error.message}`);
    throw new Error(`Failed to generate feedback: ${error.message}`);
  }
};

/**
 * Generate chat response for the AI Language Buddy
 * @param {Object} params - Chat parameters
 * @param {string} params.message - User's message
 * @param {string} params.userLevel - User's French proficiency level
 * @param {Array} params.conversationHistory - Previous conversation history
 * @returns {Promise<Object>} AI response
 */
exports.generateChatResponse = async ({ message, userLevel, conversationHistory = [] }) => {
  try {
    // Construct system prompt based on user level
    const systemPrompt = prompts.chat.system
      .replace('{{userLevel}}', userLevel);
    
    // Format conversation history for OpenAI
    const formattedHistory = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Create messages array with system prompt and history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: message }
    ];
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });
    
    // Process and format the response
    const result = {
      response: response.choices[0].message.content,
      suggestions: generateFollowUpSuggestions(userLevel, response.choices[0].message.content),
      metadata: {
        generatedAt: new Date().toISOString(),
        userLevel,
        model: "gpt-4-turbo"
      }
    };
    
    return result;
  } catch (error) {
    logger.error(`OpenAI chat generation error: ${error.message}`);
    throw new Error(`Failed to generate chat response: ${error.message}`);
  }
};

/**
 * Generate personalized learning path
 * @param {Object} params - Learning path parameters
 * @param {Object} params.userProgress - User's progress data
 * @param {Object} params.userGoals - User's learning goals
 * @param {number} params.timeAvailable - User's available time per day (minutes)
 * @returns {Promise<Object>} Personalized learning path
 */
exports.generateLearningPath = async ({ userProgress, userGoals, timeAvailable }) => {
  try {
    // Prepare the prompt with user data
    const promptContent = prompts.learningPath
      .replace('{{userProgress}}', JSON.stringify(userProgress))
      .replace('{{userGoals}}', JSON.stringify(userGoals))
      .replace('{{timeAvailable}}', timeAvailable);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: 'user',
          content: promptContent
        }
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });
    
    // Parse the JSON response
    const learningPath = JSON.parse(response.choices[0].message.content);
    
    // Add metadata
    learningPath.metadata = {
      generatedAt: new Date().toISOString(),
      model: 'gpt-4-turbo'
    };
    
    return learningPath;
  } catch (error) {
    logger.error(`OpenAI learning path generation error: ${error.message}`);
    throw new Error(`Failed to generate learning path: ${error.message}`);
  }
};

/**
 * Generate cultural insights for vocabulary in context
 * @param {Object} params - Cultural insights parameters
 * @param {Array<string>} params.vocabulary - List of vocabulary words
 * @param {string} params.difficulty - Difficulty level
 * @returns {Promise<Object>} Cultural insights
 */
exports.generateCulturalInsights = async ({ vocabulary, difficulty }) => {
  try {
    const prompt = prompts.culturalInsights
      .replace('{{vocabulary}}', vocabulary.join(', '))
      .replace('{{difficulty}}', difficulty);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });
    
    // Parse the JSON response
    const insights = JSON.parse(response.choices[0].message.content);
    
    // Add metadata
    insights.metadata = {
      generatedAt: new Date().toISOString(),
      vocabulary,
      difficulty,
      model: 'gpt-4-turbo'
    };
    
    return insights;
  } catch (error) {
    logger.error(`OpenAI cultural insights generation error: ${error.message}`);
    throw new Error(`Failed to generate cultural insights: ${error.message}`);
  }
};

/**
 * Generate contextual examples for vocabulary
 * @param {Object} params - Contextual examples parameters
 * @param {string} params.word - Vocabulary word
 * @param {string} params.difficulty - Difficulty level
 * @param {number} params.count - Number of examples to generate
 * @returns {Promise<Object>} Contextual examples
 */
exports.generateContextualExamples = async ({ word, difficulty, count }) => {
  try {
    const prompt = prompts.contextualExamples
      .replace('{{word}}', word)
      .replace('{{difficulty}}', difficulty)
      .replace('{{count}}', count);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });
    
    // Parse the JSON response
    const examples = JSON.parse(response.choices[0].message.content);
    
    // Add metadata
    examples.metadata = {
      generatedAt: new Date().toISOString(),
      word,
      difficulty,
      count,
      model: 'gpt-4-turbo'
    };
    
    return examples;
  } catch (error) {
    logger.error(`OpenAI contextual examples generation error: ${error.message}`);
    throw new Error(`Failed to generate contextual examples: ${error.message}`);
  }
};

/**
 * Helper function to generate follow-up suggestions based on AI response
 * @param {string} userLevel - User's French proficiency level
 * @param {string} aiResponse - AI's response text
 * @returns {Array<string>} List of follow-up suggestions
 */
function generateFollowUpSuggestions(userLevel, aiResponse) {
  // Extract potential topics from the response
  const topics = extractTopics(aiResponse);
  
  // Generate appropriate follow-up questions based on user level
  let suggestions = [];
  
  if (userLevel === 'beginner') {
    suggestions = [
      'Comment dit-on... en français ? (How do you say... in French?)',
      'Pouvez-vous répéter, s\'il vous plaît ? (Can you repeat, please?)',
      'Pouvez-vous parler plus lentement ? (Can you speak more slowly?)'
    ];
  } else if (userLevel === 'intermediate') {
    suggestions = [
      'Pouvez-vous m\'expliquer davantage ? (Can you explain more?)',
      'Comment utilise-t-on ce mot dans une phrase ? (How do you use this word in a sentence?)',
      'Quelle est la différence entre... et... ? (What\'s the difference between... and...?)'
    ];
  } else if (userLevel === 'advanced') {
    suggestions = [
      'Pourriez-vous élaborer sur ce sujet ? (Could you elaborate on this topic?)',
      'Connaissez-vous des expressions idiomatiques liées à ce sujet ? (Do you know any idiomatic expressions related to this topic?)',
      'Comment les Français perçoivent-ils cela ? (How do the French perceive this?)'
    ];
  }
  
  return suggestions;
}

/**
 * Extract potential topics from AI response for follow-up suggestions
 * @param {string} text - AI response text
 * @returns {Array<string>} Extracted topics
 */
function extractTopics(text) {
  // Simple extraction of potential nouns and key phrases
  // In a real implementation, this would be more sophisticated
  const words = text.split(/\s+/);
  const topics = words.filter(word => 
    word.length > 4 && 
    !word.match(/^(le|la|les|un|une|des|et|ou|mais|donc|car|ni|que|qui|quoi|comment|pourquoi|est-ce)$/i)
  );
  
  return [...new Set(topics)].slice(0, 5);
}

module.exports = exports;