import React, { useState, useEffect } from 'react';
import { useProgress } from '../../contexts/ProgressContext';
import { useChalkboard } from '../../contexts/ChalkboardContext';
import axios from 'axios';
import apiService from '../../services/apiService';
import Loading from '../../components/common/Loading';

const WordLineupGame = () => {
  const { updateProgress } = useProgress();
  const { playSound } = useChalkboard();
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState('intro'); // intro, playing, complete
  const [vocabulary, setVocabulary] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [difficulty, setDifficulty] = useState('beginner');
  const [theme, setTheme] = useState('general');
  const [shuffledWords, setShuffledWords] = useState([]);
  const [shuffledImages, setShuffledImages] = useState([]);
  const [error, setError] = useState(null);
  
  // Available themes
  const themes = [
    { id: 'general', name: 'General' },
    { id: 'animals', name: 'Animals' },
    { id: 'food', name: 'Food & Drinks' },
    { id: 'travel', name: 'Travel' },
    { id: 'household', name: 'Household' }
  ];

  useEffect(() => {
    if (gameState === 'playing') {
      fetchVocabulary();
    }
  }, [gameState, difficulty, theme]);

  const fetchVocabulary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get word lineup data using API service
      const items = await apiService.getWordLineupData(difficulty, theme);
      
      // Validate response
      if (!items || items.length === 0) {
        throw new Error('No vocabulary items returned');
      }
      
      setVocabulary(items);
      prepareGame(items);
      
      // Log success
      console.log('Successfully loaded vocabulary items:', items);
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
      setError('Failed to load vocabulary. Using fallback data instead.');
      
      // Fallback vocabulary with placeholder images
      const fallbackVocabulary = getFallbackVocabulary();
      setVocabulary(fallbackVocabulary);
      prepareGame(fallbackVocabulary);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackVocabulary = () => {
    // Fallback vocabularies by theme
    const fallbacks = {
      general: [
        { id: '1', french: 'Bonjour', english: 'Hello', imageUrl: 'https://via.placeholder.com/200x200?text=Hello' },
        { id: '2', french: 'Merci', english: 'Thank you', imageUrl: 'https://via.placeholder.com/200x200?text=Thank+You' },
        { id: '3', french: 'Au revoir', english: 'Goodbye', imageUrl: 'https://via.placeholder.com/200x200?text=Goodbye' },
        { id: '4', french: 'S\'il vous plaît', english: 'Please', imageUrl: 'https://via.placeholder.com/200x200?text=Please' },
        { id: '5', french: 'Excusez-moi', english: 'Excuse me', imageUrl: 'https://via.placeholder.com/200x200?text=Excuse+Me' },
        { id: '6', french: 'Oui', english: 'Yes', imageUrl: 'https://via.placeholder.com/200x200?text=Yes' }
      ],
      animals: [
        { id: '1', french: 'Chien', english: 'Dog', imageUrl: 'https://via.placeholder.com/200x200?text=Dog' },
        { id: '2', french: 'Chat', english: 'Cat', imageUrl: 'https://via.placeholder.com/200x200?text=Cat' },
        { id: '3', french: 'Oiseau', english: 'Bird', imageUrl: 'https://via.placeholder.com/200x200?text=Bird' },
        { id: '4', french: 'Poisson', english: 'Fish', imageUrl: 'https://via.placeholder.com/200x200?text=Fish' },
        { id: '5', french: 'Lapin', english: 'Rabbit', imageUrl: 'https://via.placeholder.com/200x200?text=Rabbit' },
        { id: '6', french: 'Cheval', english: 'Horse', imageUrl: 'https://via.placeholder.com/200x200?text=Horse' }
      ],
      food: [
        { id: '1', french: 'Pain', english: 'Bread', imageUrl: 'https://via.placeholder.com/200x200?text=Bread' },
        { id: '2', french: 'Fromage', english: 'Cheese', imageUrl: 'https://via.placeholder.com/200x200?text=Cheese' },
        { id: '3', french: 'Pomme', english: 'Apple', imageUrl: 'https://via.placeholder.com/200x200?text=Apple' },
        { id: '4', french: 'Eau', english: 'Water', imageUrl: 'https://via.placeholder.com/200x200?text=Water' },
        { id: '5', french: 'Café', english: 'Coffee', imageUrl: 'https://via.placeholder.com/200x200?text=Coffee' },
        { id: '6', french: 'Vin', english: 'Wine', imageUrl: 'https://via.placeholder.com/200x200?text=Wine' }
      ],
      travel: [
        { id: '1', french: 'Avion', english: 'Airplane', imageUrl: 'https://via.placeholder.com/200x200?text=Airplane' },
        { id: '2', french: 'Voiture', english: 'Car', imageUrl: 'https://via.placeholder.com/200x200?text=Car' },
        { id: '3', french: 'Hôtel', english: 'Hotel', imageUrl: 'https://via.placeholder.com/200x200?text=Hotel' },
        { id: '4', french: 'Plage', english: 'Beach', imageUrl: 'https://via.placeholder.com/200x200?text=Beach' },
        { id: '5', french: 'Passeport', english: 'Passport', imageUrl: 'https://via.placeholder.com/200x200?text=Passport' },
        { id: '6', french: 'Valise', english: 'Suitcase', imageUrl: 'https://via.placeholder.com/200x200?text=Suitcase' }
      ],
      household: [
        { id: '1', french: 'Maison', english: 'House', imageUrl: 'https://via.placeholder.com/200x200?text=House' },
        { id: '2', french: 'Table', english: 'Table', imageUrl: 'https://via.placeholder.com/200x200?text=Table' },
        { id: '3', french: 'Chaise', english: 'Chair', imageUrl: 'https://via.placeholder.com/200x200?text=Chair' },
        { id: '4', french: 'Lit', english: 'Bed', imageUrl: 'https://via.placeholder.com/200x200?text=Bed' },
        { id: '5', french: 'Cuisine', english: 'Kitchen', imageUrl: 'https://via.placeholder.com/200x200?text=Kitchen' },
        { id: '6', french: 'Fenêtre', english: 'Window', imageUrl: 'https://via.placeholder.com/200x200?text=Window' }
      ]
    };
    
    return fallbacks[theme] || fallbacks.general;
  };

  // Create colorful SVG placeholder for vocabulary words
  const createWordPlaceholder = (word, translation) => {
    // Get color based on word's first character code
    const colors = [
      '#FFC6FF', '#FFADAD', '#FFD6A5', '#FDFFB6', 
      '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF'
    ];
    
    const colorIndex = word.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];
    
    // Create SVG with word and translation
    const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text x="100" y="85" font-family="Arial" font-size="24" text-anchor="middle" font-weight="bold" fill="#333333">${word}</text>
      <text x="100" y="115" font-family="Arial" font-size="18" text-anchor="middle" fill="#666666">${translation}</text>
    </svg>
    `;
    
    // Convert to data URL
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  };

  const prepareGame = (items) => {
    // Ensure all items have an image URL
    const itemsWithImages = items.map(item => {
      if (!item.imageUrl) {
        return {
          ...item,
          imageUrl: createWordPlaceholder(item.french, item.english)
        };
      }
      return item;
    });
    
    // Shuffle words and images separately
    const words = [...itemsWithImages].sort(() => Math.random() - 0.5);
    const images = [...itemsWithImages].sort(() => Math.random() - 0.5);
    
    setShuffledWords(words);
    setShuffledImages(images);
    setMatchedPairs([]);
    setSelectedWord(null);
    setSelectedImage(null);
    setScore(0);
    setAttempts(0);
  };

  const handleStartGame = () => {
    if (playSound) playSound('click');
    setGameState('playing');
  };

  const handleSelectWord = (word) => {
    // Don't allow selection of already matched words
    if (matchedPairs.includes(word.id)) return;
    
    if (playSound) playSound('click');
    setSelectedWord(word);
    
    // If an image is already selected, check for a match
    if (selectedImage) {
      checkForMatch(word, selectedImage);
    }
  };

  const handleSelectImage = (image) => {
    // Don't allow selection of already matched images
    if (matchedPairs.includes(image.id)) return;
    
    if (playSound) playSound('click');
    setSelectedImage(image);
    
    // If a word is already selected, check for a match
    if (selectedWord) {
      checkForMatch(selectedWord, image);
    }
  };

  const checkForMatch = (word, image) => {
    setAttempts(attempts + 1);
    
    // Check if the word and image match
    if (word.id === image.id) {
      // It's a match!
      if (playSound) playSound('correct');
      const newMatchedPairs = [...matchedPairs, word.id];
      setMatchedPairs(newMatchedPairs);
      setScore(score + 1);
      
      // Check if all pairs are matched
      if (newMatchedPairs.length === vocabulary.length) {
        // Game complete
        setTimeout(() => {
          completeGame();
        }, 1000);
      }
    } else {
      // Not a match
      if (playSound) playSound('incorrect');
    }
    
    // Reset selections after checking
    setTimeout(() => {
      setSelectedWord(null);
      setSelectedImage(null);
    }, 1000);
  };

  const completeGame = () => {
    // Update progress
    updateProgress({
      type: 'COMPLETE_ACTIVITY',
      payload: {
        activity: 'wordLineup',
        score,
        maxScore: vocabulary.length,
        attempts
      }
    });
    
    if (playSound) playSound('success');
    setGameState('complete');
  };

  const handlePlayAgain = () => {
    if (playSound) playSound('click');
    setGameState('intro');
  };

  const handleChangeDifficulty = (e) => {
    setDifficulty(e.target.value);
  };

  const handleChangeTheme = (e) => {
    setTheme(e.target.value);
  };

  // Loading state
  if (loading) {
    return <Loading message="Loading word pairs..." size="12" />;
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Word Lineup</h1>
        <p className="text-lg text-slate-600">Match French words with their images</p>
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
              <label className="block mb-2 font-medium text-slate-700">Theme:</label>
              <select 
                value={theme}
                onChange={handleChangeTheme}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {themes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="game-instructions p-4 rounded-lg bg-yellow-50 border border-yellow-200 mb-6">
            <h3 className="font-bold mb-2 text-slate-800">How to Play:</h3>
            <ol className="list-decimal list-inside space-y-1 text-slate-700">
              <li>Match each French word with its corresponding image</li>
              <li>Click on a word, then click on the matching image</li>
              <li>Complete all matches to win</li>
              <li>Try to match all pairs with the fewest attempts</li>
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

      {gameState === 'playing' && (
        <div className="game-container">
          <div className="game-stats flex justify-between items-center mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <span className="font-medium text-slate-700">Matches: </span>
              <span className="px-2 py-1 bg-blue-600 text-white rounded-full">
                {matchedPairs.length}/{vocabulary.length}
              </span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Attempts: </span>
              <span className="px-2 py-1 bg-red-500 text-white rounded-full">
                {attempts}
              </span>
            </div>
          </div>
          
          <div className="game-board grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="words-container bg-white p-4 rounded-lg shadow border border-yellow-200">
              <h3 className="text-center font-bold mb-4 text-slate-800">Words</h3>
              <div className="grid grid-cols-1 gap-3">
                {shuffledWords.map((word) => (
                  <button
                    key={word.id}
                    onClick={() => handleSelectWord(word)}
                    disabled={matchedPairs.includes(word.id)}
                    className={`p-3 rounded-lg font-medium transition-transform ${
                      matchedPairs.includes(word.id) 
                        ? 'bg-green-100 text-green-700 border border-green-300 opacity-70 cursor-not-allowed' 
                        : 'bg-red-100 text-red-700 border border-red-300 hover:scale-105 cursor-pointer'
                    } ${
                      selectedWord && selectedWord.id === word.id 
                        ? 'ring-2 ring-blue-500 ring-offset-2' 
                        : ''
                    }`}
                  >
                    {word.french}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="images-container bg-white p-4 rounded-lg shadow border border-green-200">
              <h3 className="text-center font-bold mb-4 text-slate-800">Images</h3>
              <div className="grid grid-cols-2 gap-3">
                {shuffledImages.map((image) => (
                  <div 
                    key={image.id}
                    onClick={() => handleSelectImage(image)}
                    className={`relative rounded-lg overflow-hidden cursor-pointer transition-transform ${
                      matchedPairs.includes(image.id) 
                        ? 'opacity-70 border-2 border-green-500' 
                        : 'border border-blue-300 hover:scale-105'
                    } ${
                      selectedImage && selectedImage.id === image.id 
                        ? 'ring-2 ring-blue-500 ring-offset-2' 
                        : ''
                    }`}
                  >
                    <div className="aspect-w-1 aspect-h-1">
                      <img 
                        src={image.imageUrl} 
                        alt={image.english}
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = createWordPlaceholder(image.french, image.english);
                        }}
                      />
                    </div>
                    {matchedPairs.includes(image.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <span className="text-white font-bold">{image.english}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
            <h3 className="text-2xl font-bold mb-2 text-slate-800">Your Score: {score}/{vocabulary.length}</h3>
            <p className="mb-6 text-slate-600">Completed in {attempts} attempts!</p>
            
            <div className="vocabulary-summary p-4 rounded-lg bg-blue-50 border border-blue-200 mb-6">
              <h4 className="font-bold mb-2 text-slate-800">Words You've Learned</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vocabulary.map((item) => (
                  <div key={item.id} className="flex flex-col items-center bg-white p-2 rounded shadow">
                    <img 
                      src={item.imageUrl} 
                      alt={item.english} 
                      className="w-16 h-16 object-cover rounded mb-2" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = createWordPlaceholder(item.french, item.english);
                      }}
                    />
                    <div className="text-center">
                      <p className="font-bold text-slate-800">{item.french}</p>
                      <p className="text-sm text-slate-600">{item.english}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={handlePlayAgain}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold transition transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordLineupGame;