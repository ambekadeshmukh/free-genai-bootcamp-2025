import React, { useState, useEffect } from 'react';
import { useProgress } from '../../contexts/ProgressContext';
import { useChalkboard } from '../../contexts/ChalkboardContext';
import apiService from '../../services/apiService';
import Loading from '../../components/common/Loading';

const PhraseConstructorGame = () => {
  const { updateProgress } = useProgress();
  const { playSound } = useChalkboard();
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState('intro'); // intro, playing, feedback, complete
  const [difficulty, setDifficulty] = useState('beginner');
  const [sentenceCategory, setSentenceCategory] = useState('greetings');
  const [currentSentence, setCurrentSentence] = useState(null);
  const [wordBank, setWordBank] = useState([]);
  const [constructedSentence, setConstructedSentence] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  
  // Sentence categories
  const categories = [
    { id: 'greetings', name: 'Greetings' },
    { id: 'introductions', name: 'Introductions' },
    { id: 'questions', name: 'Questions' },
    { id: 'daily', name: 'Daily Activities' },
    { id: 'travel', name: 'Travel' },
    { id: 'food', name: 'Food & Dining' }
  ];

  useEffect(() => {
    if (gameState === 'playing') {
      fetchSentence();
    }
  }, [gameState, round, difficulty, sentenceCategory]);

  const fetchSentence = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Request multiple sentences (instead of just one)
      const sentenceData = await apiService.generateContent('phrases', sentenceCategory, difficulty, totalRounds);
      
      if (Array.isArray(sentenceData) && sentenceData.length > 0) {
        // Get the sentence for the current round
        const currentSentenceData = sentenceData[round - 1] || sentenceData[0];
        processSentence(currentSentenceData);
      } else {
        throw new Error('Invalid sentence data format');
      }
    } catch (error) {
      console.error('Error fetching sentence:', error);
      setError('Failed to load sentence. Using fallback data instead.');
      
      // Use fallback sentence if API fails
      processSentence(getFallbackSentence());
    }
  };

  const processSentence = (sentenceData) => {
    // Ensure proper sentence format
    const processedSentence = {
      french: sentenceData.french || '',
      english: sentenceData.english || '',
      hint: sentenceData.hint || '',
    };
    
    // Ensure words array exists
    let words = sentenceData.words || [];
    
    // If words array is not provided, split the sentence
    if (words.length === 0) {
      words = processedSentence.french
        .trim()
        .replace(/[.,!?;:]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 0);
    }
    
    // Create word objects
    const wordObjects = words.map((word, index) => ({
      id: `word-${index}`,
      text: word,
      originalIndex: index
    }));
    
    // Set current sentence with word objects
    setCurrentSentence({
      ...processedSentence,
      words: wordObjects
    });
    
    // Shuffle words for the word bank
    const shuffledWords = [...wordObjects].sort(() => Math.random() - 0.5);
    
    setWordBank(shuffledWords);
    setConstructedSentence([]);
    setFeedback(null);
    setLoading(false);
  };

  const getFallbackSentence = () => {
    // Fallback sentences by category and difficulty
    const fallbacks = {
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
      introductions: {
        beginner: { 
          french: 'Je m\'appelle Jean', 
          english: 'My name is Jean', 
          words: ['Je', 'm\'appelle', 'Jean'], 
          hint: 'Introducing yourself' 
        },
        intermediate: { 
          french: 'Permettez-moi de me présenter', 
          english: 'Allow me to introduce myself', 
          words: ['Permettez', 'moi', 'de', 'me', 'présenter'], 
          hint: 'Formal self-introduction' 
        },
        advanced: { 
          french: 'Je suis ravi de faire votre connaissance', 
          english: 'I am delighted to make your acquaintance', 
          words: ['Je', 'suis', 'ravi', 'de', 'faire', 'votre', 'connaissance'], 
          hint: 'Formal introduction' 
        }
      },
      questions: {
        beginner: { 
          french: 'Où est la bibliothèque', 
          english: 'Where is the library', 
          words: ['Où', 'est', 'la', 'bibliothèque'], 
          hint: 'Asking for a location' 
        },
        intermediate: { 
          french: 'Pourriez-vous m\'aider s\'il vous plaît', 
          english: 'Could you help me please', 
          words: ['Pourriez', 'vous', 'm\'aider', 's\'il', 'vous', 'plaît'], 
          hint: 'Asking for assistance politely' 
        },
        advanced: { 
          french: 'Comment expliquez-vous ce phénomène', 
          english: 'How do you explain this phenomenon', 
          words: ['Comment', 'expliquez', 'vous', 'ce', 'phénomène'], 
          hint: 'Asking for an explanation' 
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
          french: 'Je dois aller au travail maintenant', 
          english: 'I have to go to work now', 
          words: ['Je', 'dois', 'aller', 'au', 'travail', 'maintenant'], 
          hint: 'Daily commute' 
        },
        advanced: { 
          french: 'Après le dîner je lis un livre', 
          english: 'After dinner I read a book', 
          words: ['Après', 'le', 'dîner', 'je', 'lis', 'un', 'livre'], 
          hint: 'Evening routine' 
        }
      },
      travel: {
        beginner: { 
          french: 'Je vais à Paris demain', 
          english: 'I am going to Paris tomorrow', 
          words: ['Je', 'vais', 'à', 'Paris', 'demain'], 
          hint: 'Travel plans' 
        },
        intermediate: { 
          french: 'Nous prenons l\'avion à huit heures', 
          english: 'We are taking the plane at eight o\'clock', 
          words: ['Nous', 'prenons', 'l\'avion', 'à', 'huit', 'heures'], 
          hint: 'Transportation' 
        },
        advanced: { 
          french: 'Il faut réserver une chambre d\'hôtel', 
          english: 'We need to book a hotel room', 
          words: ['Il', 'faut', 'réserver', 'une', 'chambre', 'd\'hôtel'], 
          hint: 'Travel accommodation' 
        }
      },
      food: {
        beginner: { 
          french: 'J\'aime le fromage français', 
          english: 'I like French cheese', 
          words: ['J\'aime', 'le', 'fromage', 'français'], 
          hint: 'Food preference' 
        },
        intermediate: { 
          french: 'Je voudrais une table pour deux', 
          english: 'I would like a table for two', 
          words: ['Je', 'voudrais', 'une', 'table', 'pour', 'deux'], 
          hint: 'Restaurant booking' 
        },
        advanced: { 
          french: 'Ce vin se marie bien avec le poisson', 
          english: 'This wine pairs well with fish', 
          words: ['Ce', 'vin', 'se', 'marie', 'bien', 'avec', 'le', 'poisson'], 
          hint: 'Food and wine pairing' 
        }
      }
    };
    
    // Default to greetings if category doesn't exist
    const categoryFallbacks = fallbacks[sentenceCategory] || fallbacks.greetings;
    
    // Default to beginner if difficulty doesn't exist
    return categoryFallbacks[difficulty] || categoryFallbacks.beginner;
  };

  const handleWordClick = (word, source) => {
    if (playSound) playSound('click');
    
    if (source === 'bank') {
      // Move from word bank to construction area
      setWordBank(wordBank.filter(w => w.id !== word.id));
      setConstructedSentence([...constructedSentence, word]);
    } else {
      // Move from construction area back to word bank
      setConstructedSentence(constructedSentence.filter(w => w.id !== word.id));
      setWordBank([...wordBank, word]);
    }
  };

  const checkForMatch = () => {
    // Create the constructed sentence from word objects
    const constructedText = constructedSentence.map(word => word.text).join(' ');
    
    // Normalize both texts for comparison (remove punctuation, lowercase, and normalize hyphens)
    const normalizeText = (text) => {
      return text.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const normalizedConstructed = normalizeText(constructedText);
    const normalizedExpected = normalizeText(currentSentence.french);
    
    // Check if they match
    const isCorrect = normalizedConstructed === normalizedExpected;
    
    if (isCorrect) {
      // Handle correct match
      setScore(prevScore => prevScore + 1);
      setFeedback({
        type: 'success',
        message: 'Excellent! Your sentence is correct!'
      });
      playSound('success');
      
      // Move to next round if available
      if (round < totalRounds) {
        setTimeout(() => {
          setRound(prevRound => prevRound + 1);
          fetchSentence();
        }, 1500);
      } else {
        setGameState('completed');
      }
    } else {
      // Handle incorrect match
      setFeedback({
        type: 'error',
        message: 'Not quite right. Try again!'
      });
      playSound('error');
    }
  };

  const handleCheckSentence = () => {
    if (playSound) playSound('click');
    setAttempts(attempts + 1);
    checkForMatch();
  };

  const handleNextRound = () => {
    if (playSound) playSound('click');
    
    if (round < totalRounds) {
      setRound(round + 1);
      setGameState('playing');
    } else {
      completeGame();
    }
  };

  const completeGame = () => {
    if (playSound) playSound('success');
    
    // Update progress
    updateProgress({
      type: 'COMPLETE_ACTIVITY',
      payload: {
        activity: 'phraseConstructor',
        score,
        maxScore: totalRounds
      }
    });
    
    setGameState('complete');
  };

  const handleStartGame = () => {
    if (playSound) playSound('click');
    setRound(1);
    setScore(0);
    setGameState('playing');
  };

  const handlePlayAgain = () => {
    if (playSound) playSound('click');
    setGameState('intro');
  };

  const handleChangeDifficulty = (e) => {
    setDifficulty(e.target.value);
  };

  const handleChangeCategory = (e) => {
    setSentenceCategory(e.target.value);
  };

  // Loading state
  if (loading && gameState === 'playing') {
    return <Loading message="Loading sentence..." size="12" />;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Phrase Constructor</h1>
        <p className="text-lg text-slate-600">Build French sentences by arranging words in the correct order</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {gameState === 'intro' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-center text-slate-800">Game Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 font-medium text-slate-700">Difficulty Level:</label>
              <select 
                value={difficulty}
                onChange={handleChangeDifficulty}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2 font-medium text-slate-700">Sentence Category:</label>
              <select 
                value={sentenceCategory}
                onChange={handleChangeCategory}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="game-instructions p-4 rounded-lg bg-yellow-50 border border-yellow-200 mb-6">
            <h3 className="font-bold mb-2 text-slate-800">How to Play:</h3>
            <ol className="list-decimal list-inside space-y-1 text-slate-700">
              <li>You'll be given a set of French words in random order</li>
              <li>Arrange the words to form a correct French sentence</li>
              <li>Click on words to move them between the word bank and your sentence</li>
              <li>Complete {totalRounds} rounds to finish the game</li>
            </ol>
          </div>
          
          <div className="text-center">
            <button 
              onClick={handleStartGame}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold transition transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && currentSentence && (
        <div className="game-container">
          <div className="game-progress flex justify-between items-center mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <span className="font-medium text-slate-700">Round: </span>
              <span className="px-2 py-1 bg-blue-600 text-white rounded-full">
                {round}/{totalRounds}
              </span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Score: </span>
              <span className="px-2 py-1 bg-green-500 text-white rounded-full">
                {score}
              </span>
            </div>
          </div>
          
          <div className="sentence-info bg-white p-4 rounded-lg shadow mb-6 border border-yellow-200">
            <div className="english-translation text-center mb-3">
              <span className="font-medium text-slate-700">Translate: </span>
              <span className="text-lg font-bold text-slate-800">{currentSentence.english}</span>
            </div>
            {currentSentence.hint && (
              <div className="hint text-center text-sm">
                <span className="italic text-slate-600">Hint: {currentSentence.hint}</span>
              </div>
            )}
          </div>
          
          <div className="construction-area bg-white p-4 rounded-lg shadow mb-6 min-h-24 flex flex-wrap items-center border-2 border-dashed border-blue-300">
            {constructedSentence.length > 0 ? (
              constructedSentence.map((word, index) => (
                <div 
                  key={word.id} 
                  onClick={() => handleWordClick(word, 'construction')}
                  className="m-1 px-3 py-2 rounded-lg font-medium transition-transform hover:scale-105 cursor-pointer bg-blue-100 text-blue-800 border border-blue-300"
                >
                  {word.text}
                </div>
              ))
            ) : (
              <div className="w-full text-center text-slate-400">Click words below to build your sentence</div>
            )}
          </div>
          
          <div className="word-bank bg-white p-4 rounded-lg shadow mb-6 border border-green-200">
            <h3 className="font-bold mb-4 text-center text-slate-800">Word Bank</h3>
            <div className="flex flex-wrap justify-center">
              {wordBank.map((word) => (
                <div 
                  key={word.id} 
                  onClick={() => handleWordClick(word, 'bank')}
                  className="m-1 px-3 py-2 rounded-lg font-medium transition-transform hover:scale-105 cursor-pointer bg-green-100 text-green-800 border border-green-300"
                >
                  {word.text}
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center">
            <button 
              onClick={handleCheckSentence}
              disabled={constructedSentence.length !== currentSentence.words.length}
              className={`px-6 py-3 rounded-full font-bold text-white transition-transform ${
                constructedSentence.length !== currentSentence.words.length
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
              }`}
            >
              Check Sentence
            </button>
          </div>
        </div>
      )}

      {gameState === 'feedback' && (
        <div className="feedback-container bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-center text-slate-800">
            {feedback?.isCorrect ? '✓ Excellent!' : '× Nice Try!'}
          </h2>
          
          <div className="feedback-content mb-6">
            <p className="text-center text-lg mb-4 font-medium" style={{ color: feedback?.isCorrect ? '#22c55e' : '#ef4444' }}>
              {feedback?.summary}
            </p>
            
            <div className="correct-sentence p-4 rounded-lg mb-4 bg-green-50 border border-green-200">
              <h3 className="font-bold mb-2 text-slate-800">Correct Sentence:</h3>
              <p className="text-lg text-slate-700">{currentSentence.french}</p>
              <p className="text-sm text-slate-500 mt-1">{currentSentence.english}</p>
            </div>
            
            {!feedback?.isCorrect && feedback?.corrections && feedback.corrections.length > 0 && (
              <div className="your-sentence p-4 rounded-lg bg-red-50 border border-red-200">
                <h3 className="font-bold mb-2 text-slate-800">Your Sentence:</h3>
                <p className="text-lg text-slate-700">{feedback.corrections[0].actual}</p>
                
                {feedback.corrections[0].explanation && (
                  <div className="mt-2">
                    <p className="text-sm text-slate-600">{feedback.corrections[0].explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="text-center">
            <button 
              onClick={handleNextRound}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold transition transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              {round < totalRounds ? 'Next Sentence' : 'See Results'}
            </button>
          </div>
        </div>
      )}

      {gameState === 'complete' && (
        <div className="complete-container bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2 text-slate-800">Game Complete!</h2>
          
          <div className="py-6">
            <div className="inline-block bg-green-100 rounded-full p-4 mb-4">
              <span role="img" aria-label="celebration" className="text-4xl">🎉</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-slate-800">Your Score: {score}/{totalRounds}</h3>
            
            <div className="score-assessment mb-6 text-slate-700">
              {score === totalRounds && <p>Perfect! You're a French sentence master!</p>}
              {score >= totalRounds * 0.7 && score < totalRounds && <p>Great job! You're getting very good at French sentences.</p>}
              {score >= totalRounds * 0.4 && score < totalRounds * 0.7 && <p>Good effort! Keep practicing to improve your French.</p>}
              {score < totalRounds * 0.4 && <p>Keep practicing! French sentence structure takes time to learn.</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={handlePlayAgain}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold transition transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Play Again
            </button>
            
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 rounded-full font-bold transition transform hover:scale-105 bg-white text-slate-800 border-2 border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhraseConstructorGame;