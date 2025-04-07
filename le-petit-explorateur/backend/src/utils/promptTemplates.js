/**
 * Prompt templates for AI services
 */
exports.prompts = {
    // Content generation prompts
    content: {
      vocabulary: `Generate {{count}} French vocabulary words related to the theme of "{{theme}}" for {{difficulty}} level learners. 
      
  For each word, provide:
  1. The French word
  2. The English translation
  3. A simple example sentence in French
  4. Translation of the example sentence
  5. A pronunciation tip (if applicable)
  
  Format the response as a JSON array with objects containing fields: french, english, exampleFrench, exampleEnglish, pronunciationTip.
  
  Ensure the vocabulary is appropriate for {{difficulty}} level learners. For beginners, use simple, common words. For intermediate, include some more complex vocabulary. For advanced, include idiomatic expressions and specialized vocabulary.`,
  
      phrases: `Generate {{count}} useful French phrases related to the theme of "{{theme}}" for {{difficulty}} level learners.
  
  For each phrase, provide:
  1. The French phrase
  2. The English translation
  3. When to use this phrase (context)
  4. A pronunciation tip (if applicable)
  5. Any cultural notes (if applicable)
  
  Format the response as a JSON array with objects containing fields: french, english, context, pronunciationTip, culturalNote.
  
  Ensure the phrases are appropriate for {{difficulty}} level learners. For beginners, use simple, essential phrases. For intermediate, include more nuanced expressions. For advanced, include idiomatic expressions and formal/informal variations.`,
  
      grammar: `Explain the French grammar concept "{{grammarTopic}}" at a {{difficulty}} level.
  
  Include:
  1. A simple explanation of the concept
  2. Basic rules with examples
  3. Common exceptions or special cases
  4. Practice examples with solutions
  5. Common mistakes to avoid
  
  Format the response as a JSON object with fields: topic, explanation, rules (array), exceptions (array), practiceExamples (array), commonMistakes (array).
  
  Ensure the explanation is appropriate for {{difficulty}} level learners. Use simple language for beginners, more detailed explanations for intermediate, and comprehensive technical descriptions for advanced.`
    },
    
    // Chat system prompt
    chat: {
      system: `You are an AI French language tutor named Pierre, designed to help people learn French. You are friendly, encouraging, and patient. Your goal is to help the learner practice French conversation at their level.
  
  Current learner's proficiency: {{userLevel}}
  
  Guidelines:
  - For beginners: Use simple vocabulary, basic sentences, and provide translations for most French content. Speak slowly and clearly.
  - For intermediate: Use more complex sentences and vocabulary, provide translations only when necessary. Encourage more French usage.
  - For advanced: Speak primarily in French, use idiomatic expressions, and correct minor errors gently.
  
  Always:
  - Be encouraging and positive
  - Correct major errors gently
  - Provide cultural context when relevant
  - Adapt to the learner's level
  - Keep responses concise and focused
  
  When the learner makes a mistake, provide the correction with a brief explanation, but don't overwhelm them with grammar rules.`
    },
    
    // Cultural context prompt
    cultural: `Generate cultural context information about the following French vocabulary words: {{vocabulary}}. The theme is "{{theme}}" and the learning level is "{{difficulty}}".
  
  Include:
  1. A brief cultural explanation of how these words are used in French culture
  2. Any regional variations or specific contexts
  3. Related cultural concepts or traditions
  4. Interesting facts that would help language learners remember these words
  5. If applicable, any cultural faux pas to avoid
  
  Format the response as a JSON object with:
  - summary: A brief summary of the cultural context (1-2 sentences)
  - culturalExplanation: Detailed cultural explanation
  - regionalVariations: Any regional differences (if applicable)
  - relatedConcepts: Related cultural concepts
  - interestingFacts: 2-3 interesting facts
  - culturalTips: Tips for proper cultural usage
  
  Ensure the content is appropriate for {{difficulty}} level learners. Keep explanations simple for beginners, more detailed for intermediate, and nuanced for advanced learners.`,
    
    // Learning path prompt
    learningPath: `Based on the user's progress, goals, and available time, generate a personalized French learning path.
  
  User Progress: {{userProgress}}
  User Goals: {{userGoals}}
  Time Available Per Day (minutes): {{timeAvailable}}
  
  Create a structured learning plan with:
  1. Weekly focus areas
  2. Daily activities and time allocation
  3. Vocabulary themes to prioritize
  4. Grammar concepts to learn
  5. Practice exercises
  6. Progress milestones
  
  Format the response as a JSON object with:
  - summary: Brief overview of the learning path
  - difficulty: Overall difficulty level
  - focus: Primary focus (e.g., "conversation", "reading", "vocabulary")
  - timeRequired: Daily time commitment
  - weeks: Array of weekly plans with daily activities
  - vocabulary: Recommended vocabulary themes
  - grammar: Grammar concepts to learn
  - resources: Suggested resources or exercises
  - milestones: Progress milestones to track
  
  Ensure the learning path is realistic for the user's time constraints, builds on their current progress, and aligns with their goals.`,
    
    // Cultural insights prompt
    culturalInsights: `Generate cultural insights for the following French vocabulary words: {{vocabulary}}. The learning level is {{difficulty}}.
  
  For each word, provide:
  1. Cultural significance
  2. Common contexts where this word is used in France
  3. Any regional variations
  4. Related cultural practices or traditions
  5. Comparisons to English-speaking cultures (if applicable)
  
  Format the response as a JSON object with an array of insights, each containing:
  - word: The French word
  - culturalSignificance: Cultural importance of this word/concept
  - contexts: Common usage scenarios
  - regionalVariations: How usage varies by region (if applicable)
  - relatedPractices: Connected cultural practices
  - comparison: Comparison to English-speaking cultures
  
  Ensure the insights are appropriate for {{difficulty}} level learners. Keep explanations simple for beginners, more detailed for intermediate, and nuanced for advanced learners.`,
    
    // Contextual examples prompt
    contextualExamples: `Generate {{count}} contextual examples for the French word "{{word}}" at a {{difficulty}} level.
  
  For each example, provide:
  1. A natural sentence using the word in context
  2. English translation of the sentence
  3. The specific context or situation
  4. Any relevant cultural notes
  5. Vocabulary level (beginner, intermediate, advanced)
  
  Format the response as a JSON object with an array of examples, each containing:
  - french: The French sentence
  - english: English translation
  - context: Situation where this would be used
  - culturalNote: Any cultural information (if applicable)
  - level: Vocabulary level
  
  Ensure the examples progress from simpler to more complex usage, appropriate for {{difficulty}} level learners.`,
    
    // Feedback prompt
    feedback: `Provide constructive feedback on the following user input for a {{difficulty}} level French language exercise of type "{{exerciseType}}".
  
  User input: "{{userInput}}"
  
  Analyze the response for:
  1. Grammar errors
  2. Vocabulary usage
  3. Sentence structure
  4. Pronunciation issues (if applicable)
  5. Overall communication effectiveness
  
  Format the response as a JSON object with:
  - summary: Brief overall assessment
  - strengths: What the user did well
  - areas_for_improvement: Specific issues to work on
  - corrections: Suggested corrections
  - next_steps: Recommendations for practice
  
  The feedback should be encouraging while identifying key areas for improvement. Adjust detail level based on the user's difficulty level ({{difficulty}}).`
  };