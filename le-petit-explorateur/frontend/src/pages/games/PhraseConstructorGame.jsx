import React, { useState, useEffect } from 'react';
import { useProgress } from '../../contexts/ProgressContext';
import { useChalkboard } from '../../contexts/ChalkboardContext';
import apiService from '../../services/apiService';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';

const PhraseConstructorGame = () => {
  const { updateProgress } = useProgress();
  const { playSound } = useChalkboard();
  
  // Game state
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState('intro'); // intro, playing, feedback, complete
  const [difficulty, setDifficulty] = useState('beginner');
  const [sentenceCategory, setSentenceCategory] = useState('greetings');
  const [currentSentence, setCurrentSentence] = useState(null);
  const [completedSentences, setCompletedSentences] = useState([]);
  const [wordBank, setWordBank] = useState([]);
  const [constructedSentence, setConstructedSentence] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  
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
  }, [gameState, round]);

  const fetchSentence = async () => {
    setLoading(true);
    setError(null);
    setIsCheckingAnswer(false);
    setFeedback(null);
    
    try {
      console.log(`Fetching sentence for round ${round}/${totalRounds}, category: ${sentenceCategory}, difficulty: ${difficulty}`);
      
      // Generate a unique timestamp for this request
      const timestamp = Date.now() + round * 1000;
      
      // Request a phrase with current round and round-specific prompt to ensure variety
      const sentenceData = await apiService.getPhraseConstructorData(
        difficulty, 
        sentenceCategory,
        timestamp,
        round, // Pass the current round number
        completedSentences // Pass already used sentences
      );
      
      console.log('Received sentence data:', sentenceData);
      
      // Check if we got a valid response
      if (!sentenceData || !sentenceData.french || !sentenceData.words || sentenceData.words.length === 0) {
        throw new Error('Invalid sentence data received');
      }
      
      // Ensure the sentence is not already used
      if (completedSentences.includes(sentenceData.french)) {
        console.warn('This sentence was already used, trying to get another one...');
        
        // Try with a different category
        const categories = ['greetings', 'questions', 'travel', 'food', 'daily'];
        const newCategory = categories[(categories.indexOf(sentenceCategory) + round) % categories.length];
        
        // Use a different timestamp
        const newSentenceData = await apiService.getPhraseConstructorData(
          difficulty,
          newCategory,
          timestamp + 5000,
          round,
          completedSentences
        );
        
        processSentence(newSentenceData);
      } else {
        processSentence(sentenceData);
      }
    } catch (error) {
      console.error('Error fetching sentence:', error);
      setError('Failed to load sentence. Please try again or select a different category.');
      setLoading(false);
    }
  };

  const processSentence = (sentenceData) => {
    console.log('Processing sentence:', sentenceData);
    
    // Ensure word objects have unique IDs
    const wordObjects = sentenceData.words.map((word, index) => ({
      id: `word-${index}-${Date.now()}`, // Ensure unique IDs
      text: word,
      originalIndex: index
    }));
    
    // Set current sentence with word objects
    setCurrentSentence({
      id: sentenceData.id || `sentence-${round}-${Date.now()}`,
      french: sentenceData.french,
      english: sentenceData.english,
      hint: sentenceData.hint,
      words: wordObjects
    });
    
    // Shuffle words for the word bank
    const shuffledWords = [...wordObjects].sort(() => Math.random() - 0.5);
    
    setWordBank(shuffledWords);
    setConstructedSentence([]);
    setFeedback(null);
    setLoading(false);
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
    setIsCheckingAnswer(true);
    
    // Check if constructed sentence has the same number of words as original
    if (constructedSentence.length !== currentSentence.words.length) {
      setFeedback({
        type: 'error',
        message: 'Your sentence is not complete. Use all the words.',
        isCorrect: false
      });
      setIsCheckingAnswer(false);
      return;
    }
    
    // Compare original word order with constructed order
    const originalOrder = currentSentence.words.map(word => word.text);
    const constructedOrder = constructedSentence.map(word => word.text);
    
    console.log('Checking sentence match:');
    console.log('Original:', originalOrder);
    console.log('Constructed:', constructedOrder);
    
    // Check if the constructed sentence matches the original
    const isCorrect = JSON.stringify(originalOrder) === JSON.stringify(constructedOrder);
    
    if (isCorrect) {
      // Handle correct match
      setScore(prevScore => prevScore + 1);
      setFeedback({
        type: 'success',
        message: 'Excellent! Your sentence is correct!',
        isCorrect: true,
        summary: 'Parfait! Your order is correct.'
      });
      
      // Add sentence to completed list
      setCompletedSentences([...completedSentences, currentSentence.french]);
      
      if (playSound) playSound('success');
      
      // Move to next round after a short delay
      setTimeout(() => {
        if (round < totalRounds) {
          setRound(prevRound => prevRound + 1);
        } else {
          completeGame();
        }
      }, 2000);
    } else {
      // Handle incorrect match
      setAttempts(attempts + 1);
      
      // Provide more helpful feedback
      let errorFeedback = 'The word order is not correct yet.';
      
      // If this is the second attempt, give a more specific hint
      if (attempts > 0) {
        // Find the first incorrect word position
        for (let i = 0; i < originalOrder.length; i++) {
          if (i >= constructedOrder.length || originalOrder[i] !== constructedOrder[i]) {
            const correctStart = originalOrder.slice(0, i + 1).join(' ');
            errorFeedback = `The beginning should be: "${correctStart}..."`;
            break;
          }
        }
      }
      
      // If it's the third attempt, give even more help
      if (attempts > 1) {
        errorFeedback = `The correct order is: "${originalOrder.join(' ')}"`;
      }
      
      setFeedback({
        type: 'error',
        message: 'Not quite right. Try again!',
        isCorrect: false,
        summary: errorFeedback
      });
      
      if (playSound) playSound('incorrect');
    }
    
    setIsCheckingAnswer(false);
  };

  const handleCheckSentence = () => {
    if (playSound) playSound('click');
    checkForMatch();
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
    setCompletedSentences([]);
    setAttempts(0);
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
          
          <div className="construction-area bg-white p-4 rounded-lg shadow mb-6 min-h-24 flex flex-wrap items-center justify-center border-2 border-dashed border-blue-300">
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
          
          {feedback && (
            <div className={`feedback-container p-4 rounded-lg mb-4 ${feedback.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
              <p className={`font-bold ${feedback.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {feedback.summary}
              </p>
              {feedback.isCorrect ? (
                <p className="text-green-700 mt-1">
                  Correct sentence: "{currentSentence.french}"
                </p>
              ) : (
                <p className="text-red-700 mt-1">
                  Keep trying! You'll get it right.
                </p>
              )}
            </div>
          )}
          
          <div className="text-center">
            <button 
              onClick={handleCheckSentence}
              disabled={constructedSentence.length !== currentSentence.words.length || isCheckingAnswer}
              className={`px-6 py-3 rounded-full font-bold text-white transition-transform ${
                constructedSentence.length !== currentSentence.words.length || isCheckingAnswer
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
              }`}
            >
              {isCheckingAnswer ? 'Checking...' : 'Check Sentence'}
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