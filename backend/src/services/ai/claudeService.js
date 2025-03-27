const { Anthropic } = require('@anthropic-ai/sdk');
const { prompts } = require('../../utils/promptTemplates');
const logger = require('../../utils/logger');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
    
    // Format conversation history for Claude
    const formattedHistory = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Combine system prompt, history, and current message
    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: message }
    ];
    
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      system: systemPrompt
    });
    
    // Process and format the response
    const result = {
      response: response.content[0].text,
      suggestions: generateFollowUpSuggestions(userLevel, response.content[0].text),
      metadata: {
        generatedAt: new Date().toISOString(),
        userLevel,
        model: 'claude-3-sonnet-20240229'
      }
    };
    
    return result;
  } catch (error) {
    logger.error(`Claude chat generation error: ${error.message}`);
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
    
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      messages: [
        {
          role: 'user',
          content: promptContent
        }
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: 'json' }
    });
    
    // Parse the JSON response
    const learningPath = JSON.parse(response.content[0].text);
    
    // Add metadata
    learningPath.metadata = {
      generatedAt: new Date().toISOString(),
      model: 'claude-3-opus-20240229'
    };
    
    return learningPath;
  } catch (error) {
    logger.error(`Claude learning path generation error: ${error.message}`);
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
    
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json' }
    });
    
    // Parse the JSON response
    const insights = JSON.parse(response.content[0].text);
    
    // Add metadata
    insights.metadata = {
      generatedAt: new Date().toISOString(),
      vocabulary,
      difficulty,
      model: 'claude-3-sonnet-20240229'
    };
    
    return insights;
  } catch (error) {
    logger.error(`Claude cultural insights generation error: ${error.message}`);
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
    
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json' }
    });
    
    // Parse the JSON response
    const examples = JSON.parse(response.content[0].text);
    
    // Add metadata
    examples.metadata = {
      generatedAt: new Date().toISOString(),
      word,
      difficulty,
      count,
      model: 'claude-3-sonnet-20240229'
    };
    
    return examples;
  } catch (error) {
    logger.error(`Claude contextual examples generation error: ${error.message}`);
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