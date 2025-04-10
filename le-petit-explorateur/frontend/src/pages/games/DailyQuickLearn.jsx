import React, { useState, useEffect } from 'react';
import { useProgress } from '../../contexts/ProgressContext';
import { useChalkboard } from '../../contexts/ChalkboardContext';
import { useAI } from '../../contexts/AIContext';
import apiService from '../../services/apiService';
import Loading from '../../components/common/Loading';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DailyQuickLearn = () => {
  const { updateProgress } = useProgress();
  const { playSound } = useChalkboard();
  const { userLevel } = useAI();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState('intro'); // intro, flashcards, quiz, complete, completed
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [vocabularySet, setVocabularySet] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [lastCompletionDate, setLastCompletionDate] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState(null);
  const [currentWordDetails, setCurrentWordDetails] = useState(null);
  const [isLoadingWordDetails, setIsLoadingWordDetails] = useState(false);

  useEffect(() => {
    const loadDailyLesson = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First try to get from backend
        const response = await apiService.getDailyLesson(userLevel);
        if (response && response.vocabulary) {
          setVocabularySet(response.vocabulary);
        } else {
          // If backend fails, use fallback data
          const fallbackData = await apiService.getFallbackDailyLesson();
          setVocabularySet(fallbackData.vocabulary);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading daily lesson:', err);
        setError('Failed to load lesson. Please try refreshing the page.');
        setLoading(false);
      }
    };

    loadDailyLesson();
  }, [userLevel]);

  useEffect(() => {
    // Load user progress from localStorage
    const loadProgress = () => {
      try {
        const storedProgress = localStorage.getItem('dailyQuickLearnProgress');
        if (storedProgress) {
          const progress = JSON.parse(storedProgress);
          setDailyStreak(progress.streak || 0);
          setLastCompletionDate(progress.lastCompletionDate);
          
          // Check if the user has completed today's lesson
          const today = new Date().toDateString();
          if (progress.lastCompletionDate === today) {
            // If already completed today, show a message
            setVocabularySet(progress.lastVocabularySet || []);
            setCurrentStep('completed');
          } else {
            // Otherwise, load new vocabulary
            // loadVocabularySet();
          }
        } else {
          // loadVocabularySet();
        }
      } catch (error) {
        console.error('Error loading progress:', error);
        setError('Unable to load your progress. Local storage may be restricted.');
        // loadVocabularySet();
      }
    };
    
    loadProgress();
  }, []);

  const loadVocabularySet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get daily lesson vocabulary using improved API service
      const vocabulary = await apiService.getDailyLesson();
      
      console.log('Loaded vocabulary:', vocabulary);
      setVocabularySet(vocabulary);
      
      // Initialize user answers array
      initializeUserAnswers(vocabulary.length);
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
      setError('Unable to load today\'s vocabulary. Using fallback words instead.');
    } finally {
      setLoading(false);
    }
  };

  const initializeUserAnswers = (length) => {
    setUserAnswers(new Array(length).fill(null));
  };

  const handleStartLesson = () => {
    if (playSound) playSound('click');
    setCurrentStep('flashcards');
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const getWordDetails = async (word) => {
    try {
      setIsLoadingWordDetails(true);
      const response = await apiService.getWordDetails(
        word.french, 
        word.english, 
        userLevel
      );
      setCurrentWordDetails(response);
    } catch (error) {
      console.error('Error getting word details:', error);
      // Set basic fallback details if API fails
      setCurrentWordDetails({
        definition: word.english,
        exampleFrench: word.exampleFrench || `Exemple: ${word.french}.`,
        exampleEnglish: word.exampleEnglish || `Example: ${word.english}.`,
        tips: `Remember that "${word.french}" means "${word.english}" in French.`
      });
    } finally {
      setIsLoadingWordDetails(false);
    }
  };

  const handleNextFlashcard = () => {
    setIsFlipped(false); // Reset flip state
    if (flashcardIndex < vocabularySet.length - 1) {
      setFlashcardIndex(flashcardIndex + 1);
    } else {
      // Move to quiz after going through all flashcards
      setCurrentStep('quiz');
      // Initialize quiz
      setQuizIndex(0);
      setScore(0);
    }
  };

  const handlePrevFlashcard = () => {
    setIsFlipped(false); // Reset flip state
    if (flashcardIndex > 0) {
      setFlashcardIndex(flashcardIndex - 1);
    }
  };

  const handleQuizAnswer = (answer) => {
    // Play sound based on correct/incorrect
    if (playSound) {
      if (answer === vocabularySet[quizIndex].french) {
        playSound('correct');
      } else {
        playSound('incorrect');
      }
    }
    
    // Update user answers
    const newAnswers = [...userAnswers];
    newAnswers[quizIndex] = answer;
    setUserAnswers(newAnswers);
    
    // Update score if answer is correct
    if (answer === vocabularySet[quizIndex].french) {
      setScore(score + 1);
    }
    
    // Go to next question or complete the lesson
    if (quizIndex < vocabularySet.length - 1) {
      setTimeout(() => setQuizIndex(quizIndex + 1), 800);
    } else {
      setTimeout(() => completeLesson(), 800);
    }
  };

  const completeLesson = () => {
    const today = new Date().toDateString();
    let newStreak = dailyStreak;
    
    // Update streak logic
    if (!lastCompletionDate) {
      // First time completing
      newStreak = 1;
    } else {
      const lastDate = new Date(lastCompletionDate);
      const currentDate = new Date(today);
      
      // Calculate the difference in days
      const diffTime = currentDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day
        newStreak = dailyStreak + 1;
      } else if (diffDays > 1) {
        // Streak broken
        newStreak = 1;
      }
      // If same day, keep streak the same
    }
    
    setDailyStreak(newStreak);
    
    // Save progress
    try {
      const progress = {
        streak: newStreak,
        lastCompletionDate: today,
        lastVocabularySet: vocabularySet
      };
      
      localStorage.setItem('dailyQuickLearnProgress', JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress:', error);
      setError('Unable to save your progress. Your browser may have restricted storage.');
    }
    
    // Update app-wide progress
    updateProgress({
      type: 'COMPLETE_ACTIVITY',
      payload: {
        activity: 'dailyQuickLearn',
        score: score,
        maxScore: vocabularySet.length,
        newWordsLearned: vocabularySet.length
      }
    });
    
    if (playSound) playSound('success');
    setCurrentStep('complete');
  };

  const handleRestartLesson = () => {
    if (playSound) playSound('click');
    setFlashcardIndex(0);
    setQuizIndex(0);
    setScore(0);
    setIsFlipped(false);
    setCurrentWordDetails(null);
    initializeUserAnswers(vocabularySet.length);
    setCurrentStep('intro');
  };
  
  // Generate quiz options
  const generateQuizOptions = (currentIndex) => {
    const correctAnswer = vocabularySet[currentIndex].french;
    let options = [correctAnswer];
    
    // Add 3 more options from the vocabulary set
    while (options.length < 4 && options.length < vocabularySet.length) {
      const randomIndex = Math.floor(Math.random() * vocabularySet.length);
      const randomOption = vocabularySet[randomIndex].french;
      
      if (!options.includes(randomOption)) {
        options.push(randomOption);
      }
    }
    
    // If we still need more options (for small vocab sets), add some common French words
    const commonFrenchWords = ['bonjour', 'merci', 'oui', 'non', 'salut', 'au revoir', 'chat', 'chien', 'maison', 'voiture'];
    while (options.length < 4) {
      const randomWord = commonFrenchWords[Math.floor(Math.random() * commonFrenchWords.length)];
      if (!options.includes(randomWord)) {
        options.push(randomWord);
      }
    }
    
    // Shuffle options
    return options.sort(() => 0.5 - Math.random());
  };
  
  // Calculate percentage score
  const getScorePercentage = () => {
    if (vocabularySet.length === 0) return 0;
    return Math.round((score / vocabularySet.length) * 100);
  };

  const renderFlashcard = () => {
    if (!vocabularySet || vocabularySet.length === 0 || flashcardIndex >= vocabularySet.length) {
      return <div>No vocabulary available</div>;
    }

    const currentWord = vocabularySet[flashcardIndex];
    
    return (
      <div className="flex flex-col items-center">
        <div 
          className="flashcard-container h-64 relative my-6 cursor-pointer" 
          onClick={handleFlipCard}
        >
          <div className={`h-full rounded-xl shadow-lg transition-transform duration-700 transform ${isFlipped ? 'rotate-y-180' : ''}`} 
               style={{ transformStyle: 'preserve-3d' }}>
            {/* Front side - French word */}
            <div className="absolute w-full h-full rounded-xl flex flex-col items-center justify-center p-6 bg-red-100 border-2 border-red-300" 
                 style={{ backfaceVisibility: 'hidden' }}>
              <span className="text-3xl font-bold text-slate-800 mb-2">{currentWord.french}</span>
              {currentWord.category && (
                <span className="text-sm px-2 py-1 bg-red-200 rounded-full text-red-800">{currentWord.category}</span>
              )}
            </div>
            
            {/* Back side - English translation & AI-generated content */}
            <div className="absolute w-full h-full rounded-xl flex flex-col items-center justify-center p-6 bg-green-100 border-2 border-green-300 overflow-y-auto"
                 style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <span className="text-xl font-bold text-slate-800 mb-2">{currentWord.english}</span>
              
              {isLoadingWordDetails ? (
                <div className="mt-2 flex justify-center">
                  <LoadingSpinner size="md" color="blue" />
                </div>
              ) : currentWordDetails ? (
                <div className="mt-2 text-center space-y-3">
                  <div className="text-sm">
                    <p className="font-semibold text-slate-700">Definition:</p>
                    <p className="italic text-slate-600">{currentWordDetails.definition}</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-700">Example:</p>
                    <p className="italic text-slate-600">{currentWordDetails.exampleFrench}</p>
                    <p className="text-xs text-slate-500">{currentWordDetails.exampleEnglish}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {/* Manual flip button */}
        <button
          onClick={handleFlipCard}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {isFlipped ? 'Show French' : 'Show English'}
        </button>
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return <Loading message="Loading today's lesson..." size="12" />;
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Daily Quick Learn</h1>
        <div className="flex justify-center items-center space-x-2">
          <span className="text-lg text-slate-600">Streak: </span>
          <span className="flex items-center justify-center w-8 h-8 rounded-full font-bold bg-red-500 text-white">{dailyStreak}</span>
          <span className="text-lg text-slate-600"> days</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {currentStep === 'intro' && (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-4 text-slate-800">Today's Lesson</h2>
          <p className="mb-6 text-slate-600">Learn {vocabularySet.length} new French words in this quick lesson!</p>
          <button 
            onClick={handleStartLesson}
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold transition transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Start Lesson
          </button>
        </div>
      )}

      {currentStep === 'flashcards' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">Flashcards</h2>
            <span className="px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
              {flashcardIndex + 1}/{vocabularySet.length}
            </span>
          </div>

          {renderFlashcard()}

          <p className="text-center mb-6 text-sm text-slate-500">Tap the card to flip</p>

          <div className="flex justify-between">
            <button 
              onClick={handlePrevFlashcard}
              disabled={flashcardIndex === 0}
              className={`px-4 py-2 rounded-full font-bold ${
                flashcardIndex === 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
              }`}
            >
              Previous
            </button>
            <button 
              onClick={handleNextFlashcard}
              className="px-4 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              {flashcardIndex < vocabularySet.length - 1 ? 'Next' : 'Start Quiz'}
            </button>
          </div>
        </div>
      )}

      {currentStep === 'quiz' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">Quick Quiz</h2>
            <span className="px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
              {quizIndex + 1}/{vocabularySet.length}
            </span>
          </div>

          <div className="quiz-question py-6">
            <p className="text-lg mb-2 text-slate-700">What is the French word for:</p>
            <h3 className="text-2xl font-bold mb-6 text-slate-800">{vocabularySet[quizIndex].english}?</h3>
            
            <div className="grid grid-cols-1 gap-3">
              {generateQuizOptions(quizIndex).map((option, index) => (
                <button 
                  key={index}
                  onClick={() => handleQuizAnswer(option)}
                  className="py-3 px-4 rounded-lg text-lg font-medium transition-transform hover:scale-102 bg-yellow-50 border border-yellow-300 text-slate-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentStep === 'complete' && (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2 text-slate-800">Lesson Complete!</h2>
          <div className="py-6">
            <div className="inline-block bg-green-100 rounded-full p-4 mb-4">
              <span role="img" aria-label="celebration" className="text-4xl">🎉</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-slate-800">Your Score: {score}/{vocabularySet.length}</h3>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div 
                className="h-4 rounded-full bg-green-500" 
                style={{ width: `${getScorePercentage()}%` }}
              ></div>
            </div>
            <p className="mb-6 text-slate-600">Keep up the great work! Come back tomorrow for new words.</p>
          </div>
          <div className="vocabulary-summary p-4 rounded-lg mb-6 bg-blue-50 border border-blue-200">
            <h4 className="font-bold mb-2 text-slate-800">Today's Vocabulary</h4>
            <ul className="space-y-2">
              {vocabularySet.map((item, index) => (
                <li key={index} className="flex justify-between p-2 rounded bg-white">
                  <span className="font-medium text-slate-800">{item.french}</span>
                  <span className="text-slate-600">{item.english}</span>
                </li>
              ))}
            </ul>
          </div>
          <button 
            onClick={handleRestartLesson}
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold transition transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Review Again
          </button>
        </div>
      )}

      {currentStep === 'completed' && (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2 text-slate-800">You've Completed Today's Lesson!</h2>
          <div className="py-6">
            <div className="inline-block bg-blue-100 rounded-full p-4 mb-4">
              <span role="img" aria-label="check" className="text-4xl">✅</span>
            </div>
            <p className="mb-6 text-slate-600">You've already completed your daily lesson. Come back tomorrow for new words!</p>
            
            <div className="vocabulary-summary p-4 rounded-lg mb-6 bg-blue-50 border border-blue-200">
              <h4 className="font-bold mb-2 text-slate-800">Today's Vocabulary</h4>
              <ul className="space-y-2">
                {vocabularySet.map((item, index) => (
                  <li key={index} className="flex justify-between p-2 rounded bg-white">
                    <span className="font-medium text-slate-800">{item.french}</span>
                    <span className="text-slate-600">{item.english}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <button 
              onClick={handleRestartLesson}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold transition transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Review Again
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
};

export default DailyQuickLearn;
