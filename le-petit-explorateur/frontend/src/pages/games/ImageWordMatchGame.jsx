import React, { useState, useEffect } from 'react';
import { useProgress } from '../../contexts/ProgressContext';
import { useChalkboard } from '../../contexts/ChalkboardContext';
import apiService from '../../services/apiService';
import Loading from '../../components/common/Loading';

const ImageWordMatchGame = () => {
  const { updateProgress } = useProgress();
  const { playSound } = useChalkboard();
  
  // Game state
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState('intro'); // intro, playing, complete
  const [difficulty, setDifficulty] = useState('beginner');
  const [category, setCategory] = useState('general');
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [totalRounds, setTotalRounds] = useState(10);
  const [error, setError] = useState(null);
  
  // Available categories
  const categories = [
    { id: 'general', name: 'General' },
    { id: 'animals', name: 'Animals' },
    { id: 'food', name: 'Food & Drinks' },
    { id: 'household', name: 'Household' },
    { id: 'colors', name: 'Colors' },
    { id: 'numbers', name: 'Numbers' }
  ];

  // Load game data
  const loadGameData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiService.getImageWordMatchData(difficulty, category);
      if (!data || !data.words || !data.words.length) {
        throw new Error('Failed to load game data');
      }
      
      // Create rounds with both word-to-image and image-to-word
      const gameRounds = data.words.flatMap(word => ([
        {
          type: 'word-to-image',
          word: word.french,
          translation: word.english,
          image: word.image,
          options: generateOptions(data.words, word, 'image')
        },
        {
          type: 'image-to-word',
          word: word.french,
          translation: word.english,
          image: word.image,
          options: generateOptions(data.words, word, 'word')
        }
      ]));
      
      // Shuffle and limit rounds
      const shuffledRounds = shuffleArray(gameRounds).slice(0, totalRounds);
      setRounds(shuffledRounds);
      setLoading(false);
    } catch (err) {
      console.error('Error loading game data:', err);
      setError('Failed to load game. Please try refreshing the page.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gameState === 'playing') {
      loadGameData();
    }
  }, [gameState, difficulty, category]);

  // Helper function to get random options
  const getRandomOptions = (words, correctWord, count, timestamp) => {
    const options = [correctWord];
    const usedIndexes = new Set([words.indexOf(correctWord)]);
    
    while (options.length < count && options.length < words.length) {
      const randomIndex = (timestamp + options.length) % words.length;
      if (!usedIndexes.has(randomIndex)) {
        usedIndexes.add(randomIndex);
        options.push(words[randomIndex]);
      }
    }
    
    // Shuffle options using timestamp for consistency
    return options
      .sort((a, b) => ((a.french.charCodeAt(0) + timestamp) % 100) - ((b.french.charCodeAt(0) + timestamp) % 100));
  };

  const createWordToImageRound = (words, index, timestamp = Date.now()) => {
    // Select a random word as the correct answer, but make it deterministic based on index
    const correctIndex = (index + timestamp) % words.length;
    const correctWord = words[correctIndex];
    
    // Create image options (including the correct one)
    const imageOptions = getRandomOptions(words, correctWord, 4, timestamp + index);
    
    return {
      id: `round-${index + 1}-${timestamp}`,
      type: 'word-to-image',
      question: correctWord.french,
      questionTranslation: correctWord.english,
      options: imageOptions,
      correctOption: correctWord.id
    };
  };

  const createImageToWordRound = (words, index, timestamp = Date.now()) => {
    // Select a random word as the correct answer
    const correctIndex = (index + timestamp + 1) % words.length;
    const correctWord = words[correctIndex];
    
    // Create word options (including the correct one)
    const wordOptions = getRandomOptions(words, correctWord, 4, timestamp + index);
    
    return {
      id: `round-${index + 1}-${timestamp}`,
      type: 'image-to-word',
      question: correctWord.imageUrl,
      questionWord: correctWord.french,
      options: wordOptions.map(w => ({ id: w.id, text: w.french, translation: w.english })),
      correctOption: correctWord.id
    };
  };

  // Error display component
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => {
            setError(null);
            loadGameData();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Handle option selection
  const handleSelectOption = (optionId) => {
    // Ignore if already selected
    if (selectedOption !== null) return;
    
    setSelectedOption(optionId);
    
    const currentRoundData = rounds[currentRound];
    const isAnswerCorrect = optionId === currentRoundData.correctOption;
    
    setIsCorrect(isAnswerCorrect);
    
    if (isAnswerCorrect) {
      if (playSound) playSound('correct');
      setScore(score + 1);
    } else {
      if (playSound) playSound('incorrect');
    }
    
    // Move to next round after delay
    setTimeout(() => {
      if (currentRound < rounds.length - 1) {
        setCurrentRound(currentRound + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        completeGame();
      }
    }, 1500);
  };

  // Complete the game and update progress
  const completeGame = () => {
    updateProgress({
      type: 'COMPLETE_ACTIVITY',
      payload: {
        activity: 'imageWordMatch',
        score,
        maxScore: rounds.length
      }
    });
    
    if (playSound) playSound('success');
    setGameState('complete');
  };

  // Start the game
  const handleStartGame = () => {
    if (playSound) playSound('click');
    setGameState('playing');
  };

  // Play again
  const handlePlayAgain = () => {
    if (playSound) playSound('click');
    setGameState('intro');
  };

  // Handle difficulty change
  const handleChangeDifficulty = (e) => {
    setDifficulty(e.target.value);
  };

  // Handle category change
  const handleChangeCategory = (e) => {
    setCategory(e.target.value);
  };

  // Calculate percentage score
  const getScorePercentage = () => {
    if (rounds.length === 0) return 0;
    return Math.round((score / rounds.length) * 100);
  };

  // Loading state
  if (loading && gameState === 'playing') {
    return <Loading message="Loading game data..." size="12" />;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Image Word Match</h1>
        <p className="text-lg text-slate-600">Match French words with their corresponding images</p>
      </div>

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
              <label className="block mb-2 font-medium text-slate-700">Category:</label>
              <select 
                value={category}
                onChange={handleChangeCategory}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="game-instructions p-4 rounded-lg bg-yellow-50 border border-yellow-200 mb-6">
            <h3 className="font-bold mb-2 text-slate-800">How to Play:</h3>
            <ol className="list-decimal list-inside space-y-1 text-slate-700">
              <li>You'll be shown either a French word or an image</li>
              <li>Select the matching image or word from the options</li>
              <li>You'll get immediate feedback after each answer</li>
              <li>Try to get as many correct answers as possible</li>
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

      {gameState === 'playing' && rounds.length > 0 && (
        <div className="game-container">
          <div className="game-progress flex justify-between items-center mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <span className="font-medium text-slate-700">Round: </span>
              <span className="px-2 py-1 bg-blue-600 text-white rounded-full">
                {currentRound + 1}/{rounds.length}
              </span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Score: </span>
              <span className="px-2 py-1 bg-green-500 text-white rounded-full">
                {score}
              </span>
            </div>
          </div>
          
          <div className="game-board bg-white p-6 rounded-lg shadow-lg">
            {rounds[currentRound].type === 'word-to-image' ? (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2 text-slate-800">Which image shows: </h3>
                  <div className="text-2xl font-bold text-blue-700">{rounds[currentRound].question}</div>
                  <div className="text-sm text-slate-600">({rounds[currentRound].questionTranslation})</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {rounds[currentRound].options.map((option) => (
                    <div 
                      key={option.id}
                      onClick={() => handleSelectOption(option.id)}
                      className={`p-2 rounded-lg cursor-pointer transition-transform hover:scale-105 border-2 ${
                        selectedOption === option.id 
                          ? option.id === rounds[currentRound].correctOption
                            ? 'border-green-500 ring-2 ring-green-300'
                            : 'border-red-500 ring-2 ring-red-300'
                          : 'border-blue-200'
                      }`}
                    >
                      <div className="aspect-w-1 aspect-h-1 relative">
                        <img 
                          src={option.imageUrl} 
                          alt={option.french}
                          className="w-full h-40 object-contain rounded"
                        />
                        {selectedOption !== null && option.id === rounds[currentRound].correctOption && (
                          <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-20 rounded">
                            <div className="bg-white p-1 rounded-full">
                              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2 text-slate-800">Which word matches this image?</h3>
                  <div className="flex justify-center mb-2">
                    <img 
                      src={rounds[currentRound].question} 
                      alt="Question"
                      className="h-48 rounded-lg object-contain"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {rounds[currentRound].options.map((option) => (
                    <button 
                      key={option.id}
                      onClick={() => handleSelectOption(option.id)}
                      className={`p-4 rounded-lg font-medium text-center ${
                        selectedOption === option.id 
                          ? option.id === rounds[currentRound].correctOption
                            ? 'bg-green-100 text-green-800 border-2 border-green-500'
                            : 'bg-red-100 text-red-800 border-2 border-red-500'
                          : 'bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100'
                      }`}
                    >
                      <div className="font-bold text-lg">{option.text}</div>
                      <div className="text-sm">{option.translation}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
            
            {selectedOption !== null && (
              <div className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                <p className={`font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect ? '✓ Correct!' : '× Incorrect!'}
                </p>
                <p className="text-slate-700 mt-1">
                  {isCorrect 
                    ? 'Great job! You selected the correct match.' 
                    : `The correct answer was: ${rounds[currentRound].options.find(o => o.id === rounds[currentRound].correctOption).text}`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === 'complete' && (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2 text-slate-800">Game Complete!</h2>
          <div className="py-6">
            <div className="inline-block bg-green-100 rounded-full p-4 mb-4">
              <span role="img" aria-label="celebration" className="text-4xl">🎉</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-slate-800">Your Score: {score}/{rounds.length}</h3>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div 
                className="h-4 rounded-full bg-green-500" 
                style={{ width: `${getScorePercentage()}%` }}
              ></div>
            </div>
            
            <div className="score-assessment mb-6 text-slate-700">
              {getScorePercentage() === 100 && <p>Perfect! You're a French vocabulary master!</p>}
              {getScorePercentage() >= 80 && getScorePercentage() < 100 && <p>Outstanding! Your French vocabulary is very strong!</p>}
              {getScorePercentage() >= 60 && getScorePercentage() < 80 && <p>Good job! Keep practicing to improve.</p>}
              {getScorePercentage() < 60 && <p>Keep practicing! You'll get better with time.</p>}
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
        </div>
      )}
    </div>
  );
};

export default ImageWordMatchGame;