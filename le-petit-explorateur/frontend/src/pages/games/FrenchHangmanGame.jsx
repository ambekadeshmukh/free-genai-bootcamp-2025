import React, { useState, useEffect, useCallback } from 'react';
import { useProgress } from '../../contexts/ProgressContext';
import { useChalkboard } from '../../contexts/ChalkboardContext';
import apiService from '../../services/apiService';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';

const FrenchHangmanGame = () => {
  const { updateProgress } = useProgress();
  const { playSound } = useChalkboard();
  
  // Game state
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState('intro'); // intro, playing, complete
  const [difficulty, setDifficulty] = useState('beginner');
  const [category, setCategory] = useState('animals');
  const [currentWord, setCurrentWord] = useState('');
  const [currentHint, setCurrentHint] = useState('');
  const [currentTranslation, setCurrentTranslation] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [words, setWords] = useState([]);
  const [error, setError] = useState(null);
  const [completedWords, setCompletedWords] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [usingAIGenerated, setUsingAIGenerated] = useState(true);
  const [isLoadingNextWord, setIsLoadingNextWord] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  
  // Constants
  const MAX_WRONG_GUESSES = 6;
  
  // Available categories
  const categories = [
    { id: 'animals', name: 'Animals' },
    { id: 'food', name: 'Food & Drinks' },
    { id: 'household', name: 'Household Items' },
    { id: 'travel', name: 'Travel' },
    { id: 'professions', name: 'Professions' },
    { id: 'nature', name: 'Nature' },
    { id: 'technology', name: 'Technology' }
  ];

  // Advanced French vocabulary by category for fallback
  const fallbackVocabulary = {
    animals: [
      { french: 'renard', english: 'fox', hint: 'A clever animal with a bushy tail' },
      { french: 'écureuil', english: 'squirrel', hint: 'Small rodent that collects nuts' },
      { french: 'hibou', english: 'owl', hint: 'Nocturnal bird known for wisdom' },
      { french: 'hérisson', english: 'hedgehog', hint: 'Small animal with spines' },
      { french: 'autruche', english: 'ostrich', hint: 'Large flightless bird' },
      { french: 'loutre', english: 'otter', hint: 'Playful water mammal' },
      { french: 'chauve-souris', english: 'bat', hint: 'Flying mammal active at night' },
      { french: 'baleine', english: 'whale', hint: 'Largest marine mammal' }
    ],
    food: [
      { french: 'framboise', english: 'raspberry', hint: 'Small red berry' },
      { french: 'aubergine', english: 'eggplant', hint: 'Purple vegetable' },
      { french: 'courgette', english: 'zucchini', hint: 'Green summer squash' },
      { french: 'champignon', english: 'mushroom', hint: 'Fungi used in cooking' },
      { french: 'croissant', english: 'croissant', hint: 'Crescent-shaped pastry' },
      { french: 'pamplemousse', english: 'grapefruit', hint: 'Large citrus fruit' },
      { french: 'pâtisserie', english: 'pastry', hint: 'Sweet baked goods' },
      { french: 'ratatouille', english: 'ratatouille', hint: 'Vegetable stew from Provence' }
    ],
    household: [
      { french: 'aspirateur', english: 'vacuum cleaner', hint: 'Cleans floors' },
      { french: 'bibliothèque', english: 'bookshelf', hint: 'Stores books' },
      { french: 'couverture', english: 'blanket', hint: 'Keeps you warm' },
      { french: 'portemanteau', english: 'coat rack', hint: 'Holds outerwear' },
      { french: 'chandelier', english: 'chandelier', hint: 'Hanging light fixture' },
      { french: 'poubelle', english: 'trash can', hint: 'Collects waste' },
      { french: 'paillasson', english: 'doormat', hint: 'Wipe your feet on it' },
      { french: 'télécommande', english: 'remote control', hint: 'Controls devices from a distance' }
    ],
    travel: [
      { french: 'passeport', english: 'passport', hint: 'Travel document' },
      { french: 'valise', english: 'suitcase', hint: 'Holds clothes when traveling' },
      { french: 'billets', english: 'tickets', hint: 'Needed for transportation' },
      { french: 'itinéraire', english: 'itinerary', hint: 'Travel plan' },
      { french: 'croisière', english: 'cruise', hint: 'Vacation on a ship' },
      { french: 'escale', english: 'stopover', hint: 'Brief stop during a journey' },
      { french: 'souvenirs', english: 'souvenirs', hint: 'Items to remember a trip' },
      { french: 'auberge', english: 'inn', hint: 'Small hotel' }
    ],
    professions: [
      { french: 'boulanger', english: 'baker', hint: 'Makes bread' },
      { french: 'pharmacien', english: 'pharmacist', hint: 'Dispenses medication' },
      { french: 'plombier', english: 'plumber', hint: 'Fixes water pipes' },
      { french: 'informaticien', english: 'IT specialist', hint: 'Works with computers' },
      { french: 'architecte', english: 'architect', hint: 'Designs buildings' },
      { french: 'électricien', english: 'electrician', hint: 'Works with electrical systems' },
      { french: 'pompier', english: 'firefighter', hint: 'Extinguishes fires' },
      { french: 'vétérinaire', english: 'veterinarian', hint: 'Animal doctor' }
    ],
    nature: [
      { french: 'montagne', english: 'mountain', hint: 'Large natural elevation' },
      { french: 'ruisseau', english: 'stream', hint: 'Small flowing water' },
      { french: 'feuillage', english: 'foliage', hint: 'Leaves collectively' },
      { french: 'brouillard', english: 'fog', hint: 'Low clouds reducing visibility' },
      { french: 'cascade', english: 'waterfall', hint: 'Water falling from a height' },
      { french: 'bourgeon', english: 'bud', hint: 'New plant growth' },
      { french: 'avalanche', english: 'avalanche', hint: 'Mass of snow sliding down a mountain' },
      { french: 'crépuscule', english: 'twilight', hint: 'Light before sunset or after dawn' }
    ],
    technology: [
      { french: 'logiciel', english: 'software', hint: 'Computer programs' },
      { french: 'imprimante', english: 'printer', hint: 'Makes paper copies' },
      { french: 'clavier', english: 'keyboard', hint: 'For typing on a computer' },
      { french: 'téléchargement', english: 'download', hint: 'Getting files from the internet' },
      { french: 'réseaux', english: 'networks', hint: 'Connected systems' },
      { french: 'navigateur', english: 'browser', hint: 'Program for viewing websites' },
      { french: 'algorithme', english: 'algorithm', hint: 'Step-by-step procedure' },
      { french: 'périphérique', english: 'peripheral device', hint: 'External computer hardware' }
    ]
  };

  // Load words from API or fallback when game starts
  useEffect(() => {
    if (gameState === 'playing' && words.length === 0) {
      fetchWords();
    }
  }, [gameState]);

  // Start new round when needed
  useEffect(() => {
    if (gameState === 'playing' && words.length > 0 && !currentWord) {
      startNewRound();
    }
  }, [gameState, words, currentWord]);

  // Fetch words from API with better category and difficulty handling
  const fetchWords = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Make a specific request for hangman words
      const response = await apiService.getHangmanWords(category, difficulty);
      
      if (response && response.words && response.words.length > 0) {
        console.log("Successfully loaded words:", response.words.length);
        setWords(response.words);
        setUsingAIGenerated(true);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error('Error fetching words:', err);
      
      // Fall back to our expanded vocabulary
      const fallbackWords = fallbackVocabulary[category] || fallbackVocabulary.animals;
      setWords(fallbackWords);
      setUsingAIGenerated(false);
      setError('Using offline vocabulary. Connect to the internet for AI-generated words.');
    } finally {
      setLoading(false);
    }
  };

  // Start a new round with a new word
  const startNewRound = () => {
    setIsLoadingNextWord(true);

    // Get a word that hasn't been used yet
    const availableWords = words.filter(word => !completedWords.includes(word.french));
    
    if (availableWords.length === 0) {
      // If all words have been used, cycle back through them
      setCompletedWords([]);
      const newWord = words[0];
      setCurrentWord(newWord.french.toLowerCase());
      setCurrentHint(newWord.hint);
      setCurrentTranslation(newWord.english);
    } else {
      // Get a random word from available words
      const randomIndex = Math.floor(Math.random() * availableWords.length);
      const newWord = availableWords[randomIndex];
      setCurrentWord(newWord.french.toLowerCase());
      setCurrentHint(newWord.hint);
      setCurrentTranslation(newWord.english);
    }
    
    // Reset game state for the new round
    setGuessedLetters([]);
    setWrongGuesses(0);
    setShowHint(false);
    setIsLoadingNextWord(false);
  };

  // Handle letter guessing
  const handleLetterGuess = (letter) => {
    // Ignore if letter already guessed or game over
    if (guessedLetters.includes(letter) || isGameOver()) {
      return;
    }
    
    // Add to guessed letters
    setGuessedLetters(prev => [...prev, letter]);
    
    // Check if letter is in the word
    if (!currentWord.includes(letter)) {
      // Wrong guess
      setWrongGuesses(prev => prev + 1);
      if (playSound) playSound('incorrect');
    } else {
      // Correct guess
      if (playSound) playSound('correct');
      
      // Check if word is complete after this guess
      const newGuessedLetters = [...guessedLetters, letter];
      const isWordComplete = [...currentWord].every(letter => 
        newGuessedLetters.includes(letter) || letter === '-' || letter === ' '
      );
      
      if (isWordComplete) {
        handleWordComplete();
      }
    }
  };

  // Handle when a word is completed
  const handleWordComplete = () => {
    // Add to completed words
    setCompletedWords(prev => [...prev, currentWord]);
    
    // Update score based on wrong guesses
    const wordScore = MAX_WRONG_GUESSES - wrongGuesses;
    setScore(prev => prev + wordScore);
    
    if (playSound) playSound('success');
    
    // Check if all rounds completed
    if (round >= totalRounds) {
      completeGame();
    } else {
      // Move to next round after delay
      setTimeout(() => {
        setRound(prev => prev + 1);
        setCurrentWord('');
      }, 1500);
    }
  };

  // Check if game is over (too many wrong guesses)
  const isGameOver = () => {
    if (wrongGuesses >= MAX_WRONG_GUESSES) {
      return true;
    }
    
    // Check if word is complete
    return [...currentWord].every(letter => 
      guessedLetters.includes(letter) || letter === '-' || letter === ' '
    );
  };

  // Complete the game
  const completeGame = () => {
    // Calculate final score as percentage
    const maxPossibleScore = totalRounds * MAX_WRONG_GUESSES;
    const scorePercentage = Math.round((score / maxPossibleScore) * 100);
    
    // Set game over message based on score
    if (scorePercentage >= 90) {
      setGameOverMessage("Fantastique! You're a French vocabulary master!");
    } else if (scorePercentage >= 70) {
      setGameOverMessage("Très bien! Your French vocabulary is impressive!");
    } else if (scorePercentage >= 50) {
      setGameOverMessage("Bien! You're making good progress with French words!");
    } else {
      setGameOverMessage("Continuez à pratiquer! Keep practicing, you'll improve!");
    }
    
    // Update progress
    updateProgress({
      type: 'COMPLETE_ACTIVITY',
      payload: {
        activity: 'frenchHangman',
        score,
        maxScore: maxPossibleScore
      }
    });
    
    if (playSound) playSound('success');
    setGameState('complete');
  };

  // Get displayed word with guessed letters revealed
  const getDisplayedWord = () => {
    if (!currentWord) return '';
    
    return [...currentWord].map(letter => {
      if (guessedLetters.includes(letter) || letter === '-' || letter === ' ') {
        return letter;
      }
      return '_';
    }).join(' ');
  };

  // Handle hint toggle
  const toggleHint = () => {
    setShowHint(!showHint);
    if (!showHint && playSound) playSound('click');
  };

  // Start the game
  const handleStartGame = () => {
    if (playSound) playSound('click');
    setGameState('playing');
    setRound(1);
    setScore(0);
    setCompletedWords([]);
    setWords([]);
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

  // Render hangman figure based on wrong guesses
  const renderHangman = () => {
    // Define SVG parts for each stage
    const parts = [
      // Head (first wrong guess)
      <circle key="head" cx="50" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="2" />,
      // Body (second wrong guess)
      <line key="body" x1="50" y1="40" x2="50" y2="70" stroke="currentColor" strokeWidth="2" />,
      // Left arm (third wrong guess)
      <line key="leftArm" x1="50" y1="50" x2="30" y2="60" stroke="currentColor" strokeWidth="2" />,
      // Right arm (fourth wrong guess)
      <line key="rightArm" x1="50" y1="50" x2="70" y2="60" stroke="currentColor" strokeWidth="2" />,
      // Left leg (fifth wrong guess)
      <line key="leftLeg" x1="50" y1="70" x2="30" y2="90" stroke="currentColor" strokeWidth="2" />,
      // Right leg (sixth wrong guess)
      <line key="rightLeg" x1="50" y1="70" x2="70" y2="90" stroke="currentColor" strokeWidth="2" />
    ];
    
    // Only display parts based on number of wrong guesses
    const visibleParts = parts.slice(0, wrongGuesses);
    
    return (
      <div className="hangman-figure w-full max-h-60 flex justify-center">
        <svg width="120" height="120" viewBox="0 0 100 100" className="text-slate-700">
          {/* Gallows - always present */}
          <line x1="10" y1="95" x2="90" y2="95" stroke="currentColor" strokeWidth="2" />
          <line x1="25" y1="95" x2="25" y2="10" stroke="currentColor" strokeWidth="2" />
          <line x1="25" y1="10" x2="50" y2="10" stroke="currentColor" strokeWidth="2" />
          <line x1="50" y1="10" x2="50" y2="20" stroke="currentColor" strokeWidth="2" />
          
          {/* Hangman parts that appear with wrong guesses */}
          {visibleParts}
        </svg>
      </div>
    );
  };

  // Keyboard component
  const Keyboard = () => {
    // French alphabet with special characters
    const alphabet = 'abcdefghijklmnopqrstuvwxyzàâäæçéèêëîïôœùûüÿ-'.split('');
    
    return (
      <div className="keyboard-container pt-4">
        <div className="flex flex-wrap justify-center">
          {alphabet.map(letter => (
            <button
              key={letter}
              onClick={() => handleLetterGuess(letter)}
              disabled={guessedLetters.includes(letter) || isGameOver()}
              className={`m-1 w-8 h-10 sm:w-9 text-sm font-medium rounded focus:outline-none transition-colors ${
                guessedLetters.includes(letter)
                  ? currentWord.includes(letter)
                    ? 'bg-green-100 text-green-800 border border-green-400'
                    : 'bg-red-100 text-red-800 border border-red-400'
                  : 'bg-gray-100 hover:bg-blue-100 text-gray-800 hover:text-blue-800 border border-gray-300'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading && gameState === 'playing' && words.length === 0) {
    return <Loading message="Loading French vocabulary..." size="12" />;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">French Hangman</h1>
        <p className="text-lg text-slate-600">Guess French words letter by letter before the hangman is complete!</p>
        {gameState === 'playing' && (
          <div className="text-sm mt-2">
            {usingAIGenerated ? 
              <span className="text-green-600">Using AI-generated vocabulary</span> : 
              <span className="text-blue-600">Using offline vocabulary</span>
            }
          </div>
        )}
      </div>

      {error && (
        <ErrorMessage message={error} />
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
              <li>A French word will be hidden, shown as underscores</li>
              <li>Guess letters to reveal the word</li>
              <li>Each incorrect guess adds to the hangman drawing</li>
              <li>Guess the word before the hangman drawing is complete</li>
              <li>Use the hint button if you're stuck</li>
              <li>Complete {totalRounds} words to finish the game</li>
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

      {gameState === 'playing' && currentWord && (
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
            <div>
              <span className="font-medium text-slate-700">Guesses Left: </span>
              <span className={`px-2 py-1 rounded-full text-white ${wrongGuesses >= MAX_WRONG_GUESSES-2 ? 'bg-red-500' : 'bg-blue-500'}`}>
                {MAX_WRONG_GUESSES - wrongGuesses}
              </span>
            </div>
          </div>
          
          <div className="game-board bg-white p-6 rounded-lg shadow-lg">
            {isLoadingNextWord ? (
              <div className="text-center py-8">
                <Loading message="Loading next word..." size="10" />
              </div>
            ) : (
              <>
                {/* Hangman figure */}
                {renderHangman()}
                
                {/* Word to guess */}
                <div className="word-container my-8 text-center">
                  <p className="text-2xl font-mono tracking-wider font-bold text-slate-800">
                    {getDisplayedWord()}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {currentWord ? `Guess this ${currentWord.length}-letter French word!` : ''}
                  </p>
                  
                  {/* Show translation if game over */}
                  {isGameOver() && (
                    <div className={`mt-2 text-lg ${wrongGuesses >= MAX_WRONG_GUESSES ? 'text-red-600' : 'text-green-600'}`}>
                      {wrongGuesses >= MAX_WRONG_GUESSES ? 
                        `The word was: ${currentWord} (${currentTranslation})` : 
                        `Correct! ${currentWord} = ${currentTranslation}`}
                    </div>
                  )}
                </div>
                
                {/* Hint */}
                <div className="hint-container mb-4 text-center">
                  <button
                    onClick={toggleHint}
                    className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium hover:bg-yellow-200 transition-colors"
                  >
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                  </button>
                  
                  {showHint && (
                    <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-slate-700">{currentHint}</p>
                    </div>
                  )}
                </div>
                
                {/* Game status message */}
                {isGameOver() && (
                  <div className={`game-status text-center mb-4 p-3 rounded-lg ${
                    wrongGuesses >= MAX_WRONG_GUESSES ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    <p className="font-bold">
                      {wrongGuesses >= MAX_WRONG_GUESSES ? 
                        'Game Over! Too many wrong guesses.' : 
                        'Excellent! You guessed the word!'}
                    </p>
                    
                    {round < totalRounds ? (
                      <p className="mt-1">Next word coming up...</p>
                    ) : (
                      <p className="mt-1">That was the final word!</p>
                    )}
                  </div>
                )}
                
                {/* Keyboard */}
                {!isGameOver() && <Keyboard />}
                
                {/* Next button if game over for current word */}
                {isGameOver() && round < totalRounds && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => {
                        setCurrentWord('');
                        if (playSound) playSound('click');
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold transition transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      Next Word
                    </button>
                  </div>
                )}
                
                {/* Complete game button if all rounds done */}
                {isGameOver() && round >= totalRounds && (
                  <div className="text-center mt-4">
                    <button
                      onClick={completeGame}
                      className="px-6 py-2 bg-green-600 text-white rounded-full font-bold transition transform hover:scale-105 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                    >
                      Complete Game
                    </button>
                  </div>
                )}
              </>
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
            
            <h3 className="text-2xl font-bold mb-2 text-slate-800">Your Score: {score}</h3>
            <p className="mb-4 text-lg text-slate-700">{gameOverMessage}</p>
            
            <div className="vocabulary-summary p-4 rounded-lg mb-6 bg-blue-50 border border-blue-200">
              <h4 className="font-bold mb-2 text-slate-800">Words You Learned:</h4>
              <ul className="space-y-2">
                {completedWords.map((word, index) => {
                  const wordInfo = words.find(w => w.french.toLowerCase() === word);
                  return (
                    <li key={index} className="flex justify-between p-2 rounded bg-white">
                      <span className="font-medium text-slate-800">{word}</span>
                      <span className="text-slate-600">{wordInfo ? wordInfo.english : ''}</span>
                    </li>
                  );
                })}
              </ul>
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

export default FrenchHangmanGame;