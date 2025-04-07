/**
 * Wrapper for fetch API with error handling
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} - API response
 */
export const fetchWithTimeout = async (url, options = {}) => {
    const { timeout = 8000, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Custom error for timeout
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - backend service may be unavailable');
      }
      
      throw error;
    }
  };
  
  /**
   * API service with fallback mock data
   */
  export const apiService = {
    // Get vocabulary items with fallback
    getVocabulary: async () => {
      try {
        const response = await fetchWithTimeout('/api/ai/generate-content');
        return response.vocabulary;
      } catch (error) {
        console.error('Error fetching vocabulary:', error);
        // Return fallback data
        return [
          { id: 1, french: 'bonjour', english: 'hello', category: 'greetings' },
          { id: 2, french: 'merci', english: 'thank you', category: 'expressions' },
          { id: 3, french: 'au revoir', english: 'goodbye', category: 'greetings' }
        ];
      }
    },

    // Get user progress with fallback
    getUserProgress: async () => {
      try {
        const response = await fetchWithTimeout('/api/user/progress');
        return response.progress;
      } catch (error) {
        console.error('Error fetching user progress:', error);
        return {
          vocabulary: 0,
          grammar: 0,
          pronunciation: 0,
          overall: 0
        };
      }
    },

    // Get words for Word Lineup game
    getWordLineupWords: async (level) => {
      try {
        const response = await fetchWithTimeout(`/api/ai/word-lineup/${level}`);
        return response;
      } catch (error) {
        console.error('Error fetching Word Lineup words:', error);
        // Return fallback data based on level
        const numWords = parseInt(level) + 2;
        const fallbackWords = [
          { id: '1', french: 'chat', english: 'cat', difficulty: 1 },
          { id: '2', french: 'chien', english: 'dog', difficulty: 1 },
          { id: '3', french: 'oiseau', english: 'bird', difficulty: 2 },
          { id: '4', french: 'poisson', english: 'fish', difficulty: 2 },
          { id: '5', french: 'tortue', english: 'turtle', difficulty: 2 }
        ];
        return { words: fallbackWords.slice(0, numWords) };
      }
    },

    // Get data for Phrase Constructor game
    getPhraseConstructorData: async (level) => {
      try {
        const response = await fetchWithTimeout(`/api/ai/phrase-constructor/${level}`);
        return response;
      } catch (error) {
        console.error('Error fetching phrase constructor data:', error);
        // Return fallback data based on level
        const fallbackPhrases = [
          {
            phrase: 'Je mange une pomme',
            translation: 'I eat an apple',
            words: ['Je', 'mange', 'une', 'pomme']
          },
          {
            phrase: 'Le chat dort sur le lit',
            translation: 'The cat sleeps on the bed',
            words: ['Le', 'chat', 'dort', 'sur', 'le', 'lit']
          },
          {
            phrase: 'J\'aime la musique française',
            translation: 'I like French music',
            words: ['J\'aime', 'la', 'musique', 'française']
          },
          {
            phrase: 'Nous allons au restaurant',
            translation: 'We are going to the restaurant',
            words: ['Nous', 'allons', 'au', 'restaurant']
          },
          {
            phrase: 'Elle parle trois langues',
            translation: 'She speaks three languages',
            words: ['Elle', 'parle', 'trois', 'langues']
          }
        ];
        return fallbackPhrases[level - 1] || fallbackPhrases[0];
      }
    },

    // Get data for Listening Challenge game
    getListeningChallengeData: async (level) => {
      try {
        const response = await fetchWithTimeout(`/api/ai/listening-challenge/${level}`);
        return response;
      } catch (error) {
        console.error('Error fetching listening challenge data:', error);
        // Return fallback data based on level
        const fallbackChallenges = [
          {
            audio: 'lessons/bonjour.mp3',
            text: 'Bonjour',
            translation: 'Hello',
            options: ['Hello', 'Goodbye', 'Thank you', 'Please']
          },
          {
            audio: 'lessons/merci.mp3',
            text: 'Merci beaucoup',
            translation: 'Thank you very much',
            options: ['Thank you very much', 'You\'re welcome', 'Good morning', 'Good night']
          },
          {
            audio: 'lessons/comment-allez-vous.mp3',
            text: 'Comment allez-vous?',
            translation: 'How are you?',
            options: ['How are you?', 'What is your name?', 'Where are you going?', 'What time is it?']
          },
          {
            audio: 'lessons/au-revoir.mp3',
            text: 'Au revoir',
            translation: 'Goodbye',
            options: ['Goodbye', 'Hello', 'Please', 'Thank you']
          },
          {
            audio: 'lessons/sil-vous-plait.mp3',
            text: 'S\'il vous plaît',
            translation: 'Please',
            options: ['Please', 'Thank you', 'You\'re welcome', 'Excuse me']
          }
        ];
        return fallbackChallenges[level - 1] || fallbackChallenges[0];
      }
    },

    // Daily Quick Learn endpoints
    getDailyLesson: async () => {
      try {
        const response = await fetchWithTimeout('/api/ai/daily-lesson');
        return response.data;
      } catch (error) {
        console.error('Error fetching daily lesson:', error);
        throw error;
      }
    },

    // Pronunciation Practice endpoints
    getPronunciationWords: async () => {
      try {
        const response = await fetchWithTimeout('/api/ai/pronunciation-words');
        return response.data;
      } catch (error) {
        console.error('Error fetching pronunciation words:', error);
        throw error;
      }
    },

    analyzePronunciation: async (formData) => {
      try {
        const response = await fetchWithTimeout('/api/ai/analyze-pronunciation', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } catch (error) {
        console.error('Error analyzing pronunciation:', error);
        throw error;
      }
    }
  };

  export default apiService;