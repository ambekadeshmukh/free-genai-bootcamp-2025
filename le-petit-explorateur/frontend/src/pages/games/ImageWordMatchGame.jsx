import React, { useState, useEffect, useCallback } from 'react';
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
  const [category, setCategory] = useState('animals');
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [totalRounds, setTotalRounds] = useState(10);
  const [usingAIGenerated, setUsingAIGenerated] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Available categories
  const categories = [
    { id: 'animals', name: 'Animals' },
    { id: 'food', name: 'Food & Drinks' },
    { id: 'household', name: 'Household' },
    { id: 'colors', name: 'Colors' },
    { id: 'places', name: 'Places' }
  ];

  // Preloaded vocabulary sets for fallback
  const fallbackVocabulary = {
    animals: [
      { id: 'a1', french: 'chat', english: 'cat' },
      { id: 'a2', french: 'chien', english: 'dog' },
      { id: 'a3', french: 'oiseau', english: 'bird' },
      { id: 'a4', french: 'poisson', english: 'fish' },
      { id: 'a5', french: 'lapin', english: 'rabbit' },
      { id: 'a6', french: 'cheval', english: 'horse' },
      { id: 'a7', french: 'souris', english: 'mouse' },
      { id: 'a8', french: 'cochon', english: 'pig' },
      { id: 'a9', french: 'poule', english: 'hen' },
      { id: 'a10', french: 'canard', english: 'duck' }
    ],
    food: [
      { id: 'f1', french: 'pain', english: 'bread' },
      { id: 'f2', french: 'fromage', english: 'cheese' },
      { id: 'f3', french: 'pomme', english: 'apple' },
      { id: 'f4', french: 'eau', english: 'water' },
      { id: 'f5', french: 'café', english: 'coffee' },
      { id: 'f6', french: 'chocolat', english: 'chocolate' },
      { id: 'f7', french: 'banane', english: 'banana' },
      { id: 'f8', french: 'vin', english: 'wine' },
      { id: 'f9', french: 'soupe', english: 'soup' },
      { id: 'f10', french: 'poulet', english: 'chicken' }
    ],
    household: [
      { id: 'h1', french: 'table', english: 'table' },
      { id: 'h2', french: 'chaise', english: 'chair' },
      { id: 'h3', french: 'lit', english: 'bed' },
      { id: 'h4', french: 'lampe', english: 'lamp' },
      { id: 'h5', french: 'porte', english: 'door' },
      { id: 'h6', french: 'fenêtre', english: 'window' },
      { id: 'h7', french: 'tapis', english: 'rug' },
      { id: 'h8', french: 'miroir', english: 'mirror' },
      { id: 'h9', french: 'horloge', english: 'clock' },
      { id: 'h10', french: 'télévision', english: 'television' }
    ],
    colors: [
      { id: 'c1', french: 'rouge', english: 'red' },
      { id: 'c2', french: 'bleu', english: 'blue' },
      { id: 'c3', french: 'vert', english: 'green' },
      { id: 'c4', french: 'jaune', english: 'yellow' },
      { id: 'c5', french: 'noir', english: 'black' },
      { id: 'c6', french: 'blanc', english: 'white' },
      { id: 'c7', french: 'gris', english: 'gray' },
      { id: 'c8', french: 'orange', english: 'orange' },
      { id: 'c9', french: 'violet', english: 'purple' },
      { id: 'c10', french: 'rose', english: 'pink' }
    ],
    places: [
      { id: 'p1', french: 'maison', english: 'house' },
      { id: 'p2', french: 'école', english: 'school' },
      { id: 'p3', french: 'parc', english: 'park' },
      { id: 'p4', french: 'hôpital', english: 'hospital' },
      { id: 'p5', french: 'restaurant', english: 'restaurant' },
      { id: 'p6', french: 'musée', english: 'museum' },
      { id: 'p7', french: 'plage', english: 'beach' },
      { id: 'p8', french: 'gare', english: 'train station' },
      { id: 'p9', french: 'bibliothèque', english: 'library' },
      { id: 'p10', french: 'cinéma', english: 'cinema' }
    ]
  };

  // Generate placeholder image based on word - improved version
  const generatePlaceholder = useCallback((word, english) => {
    // Choose a color based on the first character of the word
    const colorMap = {
      'a': '#FFD6A5', 'b': '#FFADAD', 'c': '#CAFFBF', 'd': '#9BF6FF',
      'e': '#BDB2FF', 'f': '#FFC6FF', 'g': '#FDFFB6', 'h': '#A0C4FF',
      'i': '#FFD6A5', 'j': '#FFADAD', 'k': '#CAFFBF', 'l': '#9BF6FF',
      'm': '#BDB2FF', 'n': '#FFC6FF', 'o': '#FDFFB6', 'p': '#A0C4FF',
      'q': '#FFD6A5', 'r': '#FFADAD', 's': '#CAFFBF', 't': '#9BF6FF',
      'u': '#BDB2FF', 'v': '#FFC6FF', 'w': '#FDFFB6', 'x': '#A0C4FF',
      'y': '#BDB2FF', 'z': '#FFC6FF'
    };
    
    const firstChar = word.charAt(0).toLowerCase();
    const bgColor = colorMap[firstChar] || '#F8F9FA';
    
    // Generate different SVG shapes based on category
    let svgIcon = '';
    const lowerEnglish = english.toLowerCase();
    
    if (/cat|dog|bird|animal|fish|pet|rabbit|mouse|pig|hen|duck/.test(lowerEnglish)) {
      // Animal icon
      svgIcon = `<circle cx="125" cy="75" r="30" fill="#333333"/>
                 <path d="M90,115 C90,90 160,90 160,115 C160,150 90,150 90,115" fill="#333333"/>`;
    } else if (/bread|cheese|apple|water|coffee|food|fruit|wine|soup|chicken/.test(lowerEnglish)) {
      // Food icon
      svgIcon = `<circle cx="125" cy="80" r="35" fill="#333333"/>
                 <rect x="115" y="115" width="20" height="40" fill="#333333"/>`;
    } else if (/table|chair|bed|lamp|door|window|rug|mirror|clock|television|furniture/.test(lowerEnglish)) {
      // Household item
      svgIcon = `<rect x="75" y="60" width="100" height="80" fill="#333333"/>
                 <rect x="105" y="140" width="40" height="30" fill="#333333"/>`;
    } else if (/red|blue|green|yellow|black|white|gray|orange|purple|pink|color/.test(lowerEnglish)) {
      // Color swatch
      svgIcon = `<rect x="75" y="60" width="100" height="100" fill="#333333"/>`;
    } else {
      // Default place icon
      svgIcon = `<path d="M125,50 L175,100 L150,100 L150,150 L100,150 L100,100 L75,100 Z" fill="#333333"/>`;
    }
    
    // Create SVG with word and translation
    const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 250 250">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      ${svgIcon}
      <text x="125" y="200" font-family="Arial, sans-serif" font-size="28" text-anchor="middle" font-weight="bold" fill="#333333">${word}</text>
      <text x="125" y="225" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#666666">${english}</text>
    </svg>
    `;
    
    try {
      return `data:image/svg+xml;base64,${btoa(svgContent)}`;
    } catch (e) {
      console.error('SVG encoding error:', e);
      // Fallback to simpler SVG if encoding fails
      const simpleSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 250 250">
        <rect width="100%" height="100%" fill="${bgColor}"/>
        <text x="125" y="125" font-family="Arial, sans-serif" font-size="28" text-anchor="middle" font-weight="bold" fill="#333333">${word}</text>
      </svg>
      `;
      return `data:image/svg+xml;base64,${btoa(simpleSvg)}`;
    }
  }, []);

  // Shuffle array helper function
  const shuffleArray = useCallback((array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  // Generate options for word-to-image rounds
  const generateWordToImageOptions = useCallback((words, correctWord, count) => {
    const options = [{ 
      id: correctWord.id,
      imageUrl: correctWord.imageUrl,
      french: correctWord.french
    }];
    
    const usedIds = new Set([correctWord.id]);
    
    // Add random options
    while (options.length < count && options.length < words.length) {
      const randomIndex = Math.floor(Math.random() * words.length);
      const randomWord = words[randomIndex];
      
      if (!usedIds.has(randomWord.id)) {
        options.push({ 
          id: randomWord.id,
          imageUrl: randomWord.imageUrl,
          french: randomWord.french
        });
        usedIds.add(randomWord.id);
      }
    }
    
    return shuffleArray(options);
  }, [shuffleArray]);

  // Generate options for image-to-word rounds
  const generateImageToWordOptions = useCallback((words, correctWord, count) => {
    const options = [{ 
      id: correctWord.id,
      text: correctWord.french,
      translation: correctWord.english
    }];
    
    const usedIds = new Set([correctWord.id]);
    
    // Add random options
    while (options.length < count && options.length < words.length) {
      const randomIndex = Math.floor(Math.random() * words.length);
      const randomWord = words[randomIndex];
      
      if (!usedIds.has(randomWord.id)) {
        options.push({ 
          id: randomWord.id,
          text: randomWord.french,
          translation: randomWord.english
        });
        usedIds.add(randomWord.id);
      }
    }
    
    return shuffleArray(options);
  }, [shuffleArray]);

  // Create rounds alternating between word-to-image and image-to-word types
  const createGameRounds = useCallback((processedWords) => {
    // First shuffle the words to get random selection
    const shuffledWords = shuffleArray([...processedWords]);
    const gameRounds = [];
    const usedWords = new Set();
    
    // Take only enough words for total rounds (considering we might use each word twice)
    const wordsNeeded = Math.ceil(totalRounds / 2);
    const selectedWords = shuffledWords.slice(0, wordsNeeded);
    
    // Create rounds for each selected word
    for (let i = 0; i < selectedWords.length && gameRounds.length < totalRounds; i++) {
      const word = selectedWords[i];
      
      // Only add rounds if we haven't reached the total yet
      if (gameRounds.length < totalRounds) {
        // Add word-to-image round
        gameRounds.push({
          id: `w2i-${word.id}`,
          type: 'word-to-image',
          word: word.french,
          translation: word.english,
          correctOption: word.id,
          options: generateWordToImageOptions(processedWords, word, 4)
        });
      }
      
      // Add image-to-word round if there are enough words and we haven't reached total
      if (processedWords.length >= 4 && gameRounds.length < totalRounds) {
        gameRounds.push({
          id: `i2w-${word.id}`,
          type: 'image-to-word',
          image: word.imageUrl,
          correctOption: word.id,
          options: generateImageToWordOptions(processedWords, word, 4)
        });
      }
    }
    
    // Final shuffle of the rounds
    return shuffleArray(gameRounds);
  }, [generateWordToImageOptions, generateImageToWordOptions, shuffleArray, totalRounds]);

  // Preprocess and prepare words with images
  const processWords = useCallback(async (words) => {
    // Ensure each word has a unique ID and basic properties
    const processedWords = words.map(word => ({
      ...word,
      id: word.id || `word-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      imageUrl: word.imageUrl || null // Will be filled in the next step
    }));
    
    setLoadingProgress(10);
    
    // Process words in batches to generate or assign images
    const BATCH_SIZE = 3;
    const wordBatches = [];
    for (let i = 0; i < processedWords.length; i += BATCH_SIZE) {
      wordBatches.push(processedWords.slice(i, i + BATCH_SIZE));
    }
    
    // Process each batch
    for (let i = 0; i < wordBatches.length; i++) {
      const batch = wordBatches[i];
      await Promise.all(batch.map(async (word) => {
        if (!word.imageUrl) {
          try {
            if (usingAIGenerated) {
              // Try to get an AI-generated image
              word.imageUrl = await apiService.generateWordImage(word.french, word.english)
                .catch(() => generatePlaceholder(word.french, word.english));
            } else {
              word.imageUrl = generatePlaceholder(word.french, word.english);
            }
          } catch (err) {
            console.warn(`Failed to get image for ${word.french}, using placeholder`, err);
            word.imageUrl = generatePlaceholder(word.french, word.english);
          }
        }
      }));
      
      // Update loading progress
      const progress = Math.floor(((i + 1) / wordBatches.length) * 70) + 10;
      setLoadingProgress(progress);
    }
    
    return processedWords;
  }, [generatePlaceholder, usingAIGenerated]);

  // Load game data
  const loadGameData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingProgress(0);
      
      let words = [];
      
      // Try to get data from API first
      try {
        console.log("Attempting to fetch words from AI service...");
        setLoadingProgress(5);
        const data = await apiService.getImageWordMatchData(difficulty, category);
        
        if (data && data.words && data.words.length > 0) {
          console.log("Successfully received words from AI service:", data.words.length);
          words = data.words;
          setUsingAIGenerated(true);
        } else {
          throw new Error("No words received from API");
        }
      } catch (apiError) {
        console.error("API fetch failed, using fallback vocabulary:", apiError);
        words = fallbackVocabulary[category] || fallbackVocabulary.animals;
        setUsingAIGenerated(false);
      }
      
      setLoadingProgress(10);
      
      // Process words to ensure they have images
      const processedWords = await processWords(words);
      
      setLoadingProgress(80);
      
      // Create game rounds
      const gameRounds = createGameRounds(processedWords);
      
      setLoadingProgress(90);
      
      // Set up the game state
      setRounds(gameRounds);
      setCurrentRound(0);
      setScore(0);
      setSelectedOption(null);
      setIsCorrect(null);
      setLoadingProgress(100);
      setLoading(false);
      
    } catch (err) {
      console.error('Error loading game data:', err);
      
      // Emergency fallback
      setLoadingProgress(95);
      const words = fallbackVocabulary[category] || fallbackVocabulary.animals;
      const processedWords = words.map(word => ({
        ...word,
        imageUrl: generatePlaceholder(word.french, word.english)
      }));
      
      // Create a minimal set of rounds for emergency situation
      const emergencyRounds = [];
      for (let i = 0; i < processedWords.length && i < 5; i++) {
        const word = processedWords[i];
        emergencyRounds.push({
          id: `emergency-${i}`,
          type: i % 2 === 0 ? 'word-to-image' : 'image-to-word',
          word: word.french,
          translation: word.english,
          image: word.imageUrl,
          correctOption: word.id,
          options: i % 2 === 0 
            ? shuffleArray([word, ...processedWords.filter(w => w.id !== word.id).slice(0, 3)]).map(w => ({
                id: w.id,
                imageUrl: w.imageUrl,
                french: w.french
              }))
            : shuffleArray([word, ...processedWords.filter(w => w.id !== word.id).slice(0, 3)]).map(w => ({
                id: w.id,
                text: w.french,
                translation: w.english
              }))
        });
      }
      
      setRounds(emergencyRounds);
      setUsingAIGenerated(false);
      setLoadingProgress(100);
      setLoading(false);
    }
  }, [difficulty, category, processWords, createGameRounds, generatePlaceholder, shuffleArray]);

  // Load data when game state changes
  useEffect(() => {
    if (gameState === 'playing') {
      loadGameData();
    }
  }, [gameState, loadGameData]);

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

  // Loading state with progress
  if (loading && gameState === 'playing') {
    return (
      <div className="container mx-auto p-4 max-w-4xl text-center">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Image Word Match</h1>
        <p className="text-lg text-slate-600 mb-8">Match French words with their corresponding images</p>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Loading message={`Loading game data... ${loadingProgress}%`} size="12" />
          
          <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
            <div className="h-4 rounded-full bg-blue-500 transition-all duration-300" 
                 style={{ width: `${loadingProgress}%` }}></div>
          </div>
          
          <p className="text-sm mt-4 text-slate-500">
            {loadingProgress < 30 ? "Preparing vocabulary..." : 
             loadingProgress < 70 ? "Generating images..." : 
             "Creating game rounds..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Image Word Match</h1>
        <p className="text-lg text-slate-600">Match French words with their corresponding images</p>
        {gameState === 'playing' && (
          <div className="text-sm mt-2">
            {usingAIGenerated ? 
              <span className="text-green-600">Using AI-generated content</span> : 
              <span className="text-blue-600">Using placeholder images</span>
            }
          </div>
        )}
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
                  <div className="text-2xl font-bold text-blue-700">{rounds[currentRound].word}</div>
                  <div className="text-sm text-slate-600">({rounds[currentRound].translation})</div>
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
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = generatePlaceholder(option.french, option.english || option.french);
                          }}
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
                      src={rounds[currentRound].image} 
                      alt="Question"
                      className="h-48 rounded-lg object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        // Find correct option to get the word
                        const correctOption = rounds[currentRound].options.find(
                          opt => opt.id === rounds[currentRound].correctOption
                        );
                        if (correctOption) {
                          e.target.src = generatePlaceholder(correctOption.text, correctOption.translation);
                        } else {
                          e.target.src = generatePlaceholder("Image", "Unknown");
                        }
                      }}
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
                    : `The correct answer was: ${rounds[currentRound].options.find(o => o.id === rounds[currentRound].correctOption)?.text || 'Not available'}`}
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