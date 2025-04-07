import React, { useState, useEffect, useRef } from 'react';
import { useProgress } from '../../contexts/ProgressContext';
import { useChalkboard } from '../../contexts/ChalkboardContext';
import apiService from '../../services/apiService';
import Loading from '../../components/common/Loading';

const QuizChallenge = () => {
  const { updateProgress } = useProgress();
  const { playSound } = useChalkboard();
  
  // Quiz state
  const [gameState, setGameState] = useState('intro'); // intro, playing, feedback, complete
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(15); // 15 seconds per question
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [streak, setStreak] = useState(0);
  const [category, setCategory] = useState('mixed');
  const [difficulty, setDifficulty] = useState('beginner');
  const [error, setError] = useState(null);
  
  // Timer reference
  const timerRef = useRef(null);
  
  // Available categories
  const categories = [
    { id: 'mixed', name: 'Mixed Topics' },
    { id: 'vocabulary', name: 'Vocabulary' },
    { id: 'grammar', name: 'Grammar' },
    { id: 'expressions', name: 'Expressions' },
    { id: 'culture', name: 'Culture' }
  ];
  
  // Load questions when game starts
  useEffect(() => {
    if (gameState === 'playing') {
      fetchQuestions();
    }
    
    return () => {
      // Clean up timer on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, category, difficulty]);
  
  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && !showFeedback && questions.length > 0) {
      // Reset timer for new questions
      if (timer === 15) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        timerRef.current = setInterval(() => {
          setTimer(prevTimer => {
            if (prevTimer <= 1) {
              clearInterval(timerRef.current);
              handleTimeUp();
              return 0;
            }
            return prevTimer - 1;
          });
        }, 1000);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, currentQuestion, showFeedback, timer, questions.length]);
  
  // Fetch questions from API
  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get quiz data from API service
      const quizData = await apiService.getQuizData(category, difficulty, 10);
      
      // Validate data
      if (!quizData || quizData.length === 0) {
        throw new Error('No quiz questions returned');
      }
      
      setQuestions(quizData);
      setCurrentQuestion(0);
      setScore(0);
      setStreak(0);
      resetTimer();
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load quiz questions. Using fallback questions instead.');
      
      // Use fallback questions
      const fallbackData = getFallbackQuizData();
      setQuestions(fallbackData);
      setCurrentQuestion(0);
      setScore(0);
      setStreak(0);
      resetTimer();
    } finally {
      setLoading(false);
    }
  };
  
  // Get fallback quiz data
  const getFallbackQuizData = () => {
    return [
      {
        id: '1',
        text: 'What is "apple" in French?',
        options: ['Pomme', 'Banane', 'Orange', 'Fraise'],
        correctAnswer: 'Pomme',
        explanation: '"Pomme" is the French word for "apple".'
      },
      {
        id: '2',
        text: 'Which greeting is used in the evening?',
        options: ['Bonjour', 'Bonsoir', 'Salut', 'Au revoir'],
        correctAnswer: 'Bonsoir',
        explanation: '"Bonsoir" means "good evening" in French.'
      },
      {
        id: '3',
        text: 'How do you say "thank you" in French?',
        options: ['S\'il vous plaît', 'Excusez-moi', 'Merci', 'Pardon'],
        correctAnswer: 'Merci',
        explanation: '"Merci" means "thank you" in French.'
      },
      {
        id: '4',
        text: 'Which is the correct translation of "I speak French"?',
        options: ['Je parle français', 'Tu parles français', 'Vous parlez français', 'Nous parlons français'],
        correctAnswer: 'Je parle français',
        explanation: '"Je parle français" means "I speak French" in French.'
      },
      {
        id: '5',
        text: 'What color is "rouge" in English?',
        options: ['Green', 'Blue', 'Red', 'Yellow'],
        correctAnswer: 'Red',
        explanation: '"Rouge" means "red" in French.'
      },
      {
        id: '6',
        text: 'Which word means "dog" in French?',
        options: ['Chat', 'Chien', 'Oiseau', 'Poisson'],
        correctAnswer: 'Chien',
        explanation: '"Chien" means "dog" in French.'
      },
      {
        id: '7',
        text: 'How do you count to three in French?',
        options: ['Un, trois, deux', 'Un, deux, trois', 'Trois, deux, un', 'Deux, un, trois'],
        correctAnswer: 'Un, deux, trois',
        explanation: 'The correct way to count to three in French is "un, deux, trois".'
      },
      {
        id: '8',
        text: 'Which means "Goodbye" in French?',
        options: ['Bonjour', 'Au revoir', 'Bonsoir', 'Bienvenue'],
        correctAnswer: 'Au revoir',
        explanation: '"Au revoir" means "goodbye" in French.'
      },
      {
        id: '9',
        text: 'What does "Excusez-moi" mean?',
        options: ['Thank you', 'Please', 'Excuse me', 'You\'re welcome'],
        correctAnswer: 'Excuse me',
        explanation: '"Excusez-moi" means "excuse me" in French.'
      },
      {
        id: '10',
        text: 'The French word for "water" is:',
        options: ['Lait', 'Vin', 'Café', 'Eau'],
        correctAnswer: 'Eau',
        explanation: '"Eau" means "water" in French.'
      }
    ];
  };
  
  // Handle time up (no answer selected)
  const handleTimeUp = () => {
    setStreak(0); // Reset streak on timeout
    if (playSound) playSound('incorrect');
    
    // Show feedback
    setShowFeedback(true);
    setIsCorrect(false);
    
    // After feedback delay, move to next question
    setTimeout(() => {
      handleNextQuestion();
    }, 2000);
  };
  
  // Handle answer selection
  const handleAnswerSelect = (answer, index) => {
    // Prevent multiple selections
    if (selectedAnswer !== null || showFeedback) return;
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setSelectedAnswer(index);
    
    // Check if answer is correct
    const currentQ = questions[currentQuestion];
    const isAnswerCorrect = answer === currentQ.correctAnswer;
    
    setIsCorrect(isAnswerCorrect);
    
    if (isAnswerCorrect) {
      // Calculate points based on time left
      const timeBonus = Math.floor(timer * 100 / 15);
      const questionPoints = 1000 + timeBonus;
      
      // Update score
      setScore(prevScore => prevScore + questionPoints);
      
      // Update streak
      setStreak(prevStreak => prevStreak + 1);
      
      // Play sound
      if (playSound) playSound('correct');
    } else {
      // Reset streak on wrong answer
      setStreak(0);
      
      // Play sound
      if (playSound) playSound('incorrect');
    }
    
    // Show feedback
    setShowFeedback(true);
    
    // After feedback delay, move to next question
    setTimeout(() => {
      handleNextQuestion();
    }, 2000);
  };
  
  // Move to next question or end game
  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      resetTimer();
    } else {
      // End of quiz
      completeGame();
    }
  };
  
  // Reset timer to full
  const resetTimer = () => {
    setTimer(15);
  };
  
  // Complete the game
  const completeGame = () => {
    // Update progress
    updateProgress({
      type: 'COMPLETE_ACTIVITY',
      payload: {
        activity: 'quizChallenge',
        score,
        maxScore: questions.length * 1000
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
  
  // Get appropriate color for each option button
  const getOptionColor = (index) => {
    const colors = ['#FF8B8B', '#87CEEB', '#ABEBC6', '#FFF4A3'];
    return colors[index % colors.length];
  };
  
  // Get appropriate result message based on score
  const getResultMessage = () => {
    const percentage = (score / (questions.length * 1000)) * 100;
    
    if (percentage >= 90) return "Fantastique! You're a French master!";
    if (percentage >= 75) return "Très bien! You have strong French knowledge!";
    if (percentage >= 60) return "Bien! You're making good progress!";
    if (percentage >= 40) return "Pas mal! Keep practicing to improve!";
    return "Continuez à pratiquer! Don't give up, keep learning!";
  };
  
  // Loading state
  if (loading) {
    return <Loading message="Loading quiz questions..." size="12" />;
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Quiz Challenge</h1>
        <p className="text-lg text-slate-600">Test your French knowledge against the clock!</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {gameState === 'intro' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-center text-slate-800">Quiz Settings</h2>
          
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
          
          <div className="quiz-instructions p-4 rounded-lg bg-yellow-50 border border-yellow-200 mb-6">
            <h3 className="font-bold mb-2 text-slate-800">How to Play:</h3>
            <ol className="list-decimal list-inside space-y-1 text-slate-700">
              <li>You'll have 15 seconds to answer each question</li>
              <li>Faster answers earn more points</li>
              <li>Build a streak of correct answers for bonus points</li>
              <li>Select the correct option from the four choices</li>
              <li>Get instant feedback after each question</li>
            </ol>
          </div>
          
          <div className="text-center">
            <button 
              onClick={handleStartGame}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold transition transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Start Quiz
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && questions.length > 0 && (
        <div className="game-container">
          <div className="game-stats flex justify-between items-center mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <span className="font-medium text-slate-700">Question: </span>
              <span className="px-2 py-1 bg-blue-600 text-white rounded-full">
                {currentQuestion + 1}/{questions.length}
              </span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Score: </span>
              <span className="px-2 py-1 bg-green-500 text-white rounded-full">
                {score}
              </span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Streak: </span>
              <span className="px-2 py-1 bg-red-500 text-white rounded-full">
                {streak}x
              </span>
            </div>
          </div>
          
          <div className="quiz-question-container bg-white rounded-lg shadow-lg p-6 mb-4">
            {/* Timer */}
            <div className="mb-4 relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ 
                  width: `${(timer/15)*100}%`,
                  backgroundColor: timer > 10 ? '#4ade80' : timer > 5 ? '#facc15' : '#ef4444'
                }}
              ></div>
            </div>
            
            {/* Question */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">{questions[currentQuestion].text}</h2>
              
              {questions[currentQuestion].imageUrl && (
                <div className="flex justify-center mb-4">
                  <img 
                    src={questions[currentQuestion].imageUrl} 
                    alt="Question"
                    className="max-h-48 rounded-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://via.placeholder.com/400x300?text=Question+Image`;
                    }}
                  />
                </div>
              )}
            </div>
            
            {/* Answer Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option, index)}
                  disabled={showFeedback}
                  className={`p-4 rounded-lg text-white font-bold transition transform ${
                    showFeedback 
                      ? (option === questions[currentQuestion].correctAnswer 
                          ? 'bg-green-500 scale-105'
                          : selectedAnswer === index 
                            ? 'bg-red-500 scale-105'
                            : 'opacity-70') 
                      : 'hover:scale-105'
                  }`}
                  style={{ 
                    backgroundColor: showFeedback 
                      ? (option === questions[currentQuestion].correctAnswer 
                          ? '#4ade80' // green
                          : selectedAnswer === index 
                            ? '#ef4444' // red
                            : getOptionColor(index)) 
                      : getOptionColor(index)
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
            
            {/* Feedback */}
            {showFeedback && (
              <div className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                <p className={`font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect ? '✓ Correct!' : '× Incorrect!'}
                </p>
                <p className="text-slate-700 mt-1">
                  {questions[currentQuestion].explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === 'complete' && (
        <div className="complete-container bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2 text-slate-800">Quiz Complete!</h2>
          
          <div className="py-6">
            <div className="inline-block bg-green-100 rounded-full p-4 mb-4">
              <span role="img" aria-label="trophy" className="text-4xl">🏆</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-slate-800">Your Score: {score}</h3>
            
            <div className="score-breakdown p-4 rounded-lg bg-blue-50 border border-blue-200 mb-6">
              <h4 className="font-bold mb-2 text-slate-800">Performance:</h4>
              <p className="text-lg text-slate-700 mb-4">{getResultMessage()}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-lg shadow">
                  <p className="text-2xl font-bold text-blue-600">{questions.length}</p>
                  <p className="text-sm text-slate-600">Total Questions</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow">
                  <p className="text-2xl font-bold text-green-600">
                    {Math.floor(score / 1000)}
                  </p>
                  <p className="text-sm text-slate-600">Correct Answers</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow">
                  <p className="text-2xl font-bold text-purple-600">{Math.floor(score / Math.max(1, Math.floor(score / 1000)))}</p>
                  <p className="text-sm text-slate-600">Avg. Points/Question</p>
                </div>
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
        </div>
      )}
    </div>
  );
};

export default QuizChallenge;