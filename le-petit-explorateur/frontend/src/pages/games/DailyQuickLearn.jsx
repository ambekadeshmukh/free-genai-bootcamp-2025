import React, { useState, useEffect, useContext } from 'react';
import { useAI } from '../../contexts/AIContext';
import api from '../../services/apiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DailyQuickLearn = () => {
  const { updateProgress } = useProgress();
  const { playSound } = useChalkboard();
  const { userLevel } = useAI();
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
            loadVocabularySet();
          }
        } else {
          loadVocabularySet();
        }
      } catch (error) {
        console.error('Error loading progress:', error);
        setError('Unable to load your progress. Local storage may be restricted.');
        loadVocabularySet();
      }
    };
    
    loadProgress();
  }, []);

  const loadVocabularySet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get daily lesson vocabulary
      const response = await api.get('/api/vocabulary/daily');
      setVocabularySet(response.data);
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
      setError('Unable to load today\'s vocabulary. Using fallback words instead.');
      
      // Fallback vocabulary if API fails
      const fallbackVocabulary = getFallbackVocabulary();
      setVocabularySet(fallbackVocabulary);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackVocabulary = () => {
    // Generate a fallback set based on today's date to keep it consistent
    const date = new Date();
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Rotate through different themes each day
    const themes = ['greetings', 'food', 'animals', 'household', 'travel', 'colors', 'numbers'];
    const todayTheme = themes[dayOfYear % themes.length];
    
    // Fallback vocabulary sets by theme
    const fallbackSets = {
      greetings: [
        { id: '1', french: 'Bonjour', english: 'Hello', category: 'greetings', exampleFrench: 'Bonjour, comment allez-vous?', exampleEnglish: 'Hello, how are you?' },
        { id: '2', french: 'Au revoir', english: 'Goodbye', category: 'greetings', exampleFrench: 'Au revoir et à bientôt!', exampleEnglish: 'Goodbye and see you soon!' },
        { id: '3', french: 'S\'il vous plaît', english: 'Please', category: 'expressions', exampleFrench: 'Un café, s\'il vous plaît.', exampleEnglish: 'A coffee, please.' },
        { id: '4', french: 'Merci', english: 'Thank you', category: 'expressions', exampleFrench: 'Merci beaucoup pour votre aide.', exampleEnglish: 'Thank you very much for your help.' },
        { id: '5', french: 'Excusez-moi', english: 'Excuse me', category: 'expressions', exampleFrench: 'Excusez-moi, où est la gare?', exampleEnglish: 'Excuse me, where is the train station?' },
        { id: '6', french: 'Bonsoir', english: 'Good evening', category: 'greetings', exampleFrench: 'Bonsoir, comment allez-vous?', exampleEnglish: 'Good evening, how are you?' },
        { id: '7', french: 'Enchanté', english: 'Nice to meet you', category: 'greetings', exampleFrench: 'Enchanté de faire votre connaissance.', exampleEnglish: 'Nice to meet you.' }
      ],
      food: [
        { id: '1', french: 'Pain', english: 'Bread', category: 'food', exampleFrench: 'J\'achète du pain à la boulangerie.', exampleEnglish: 'I buy bread at the bakery.' },
        { id: '2', french: 'Fromage', english: 'Cheese', category: 'food', exampleFrench: 'La France est connue pour ses fromages.', exampleEnglish: 'France is known for its cheeses.' },
        { id: '3', french: 'Pomme', english: 'Apple', category: 'food', exampleFrench: 'Je mange une pomme chaque jour.', exampleEnglish: 'I eat an apple every day.' },
        { id: '4', french: 'Eau', english: 'Water', category: 'drinks', exampleFrench: 'Je voudrais un verre d\'eau, s\'il vous plaît.', exampleEnglish: 'I would like a glass of water, please.' },
        { id: '5', french: 'Café', english: 'Coffee', category: 'drinks', exampleFrench: 'Je bois du café le matin.', exampleEnglish: 'I drink coffee in the morning.' },
        { id: '6', french: 'Vin', english: 'Wine', category: 'drinks', exampleFrench: 'Le vin rouge est populaire en France.', exampleEnglish: 'Red wine is popular in France.' },
        { id: '7', french: 'Soupe', english: 'Soup', category: 'food', exampleFrench: 'La soupe est chaude.', exampleEnglish: 'The soup is hot.' }
      ],
      animals: [
        { id: '1', french: 'Chat', english: 'Cat', category: 'animals', exampleFrench: 'Le chat dort sur le canapé.', exampleEnglish: 'The cat is sleeping on the couch.' },
        { id: '2', french: 'Chien', english: 'Dog', category: 'animals', exampleFrench: 'Mon chien aime jouer au parc.', exampleEnglish: 'My dog likes to play in the park.' },
        { id: '3', french: 'Oiseau', english: 'Bird', category: 'animals', exampleFrench: 'L\'oiseau chante dans l\'arbre.', exampleEnglish: 'The bird is singing in the tree.' },
        { id: '4', french: 'Poisson', english: 'Fish', category: 'animals', exampleFrench: 'Le poisson nage dans l\'aquarium.', exampleEnglish: 'The fish swims in the aquarium.' },
        { id: '5', french: 'Lapin', english: 'Rabbit', category: 'animals', exampleFrench: 'Le lapin mange une carotte.', exampleEnglish: 'The rabbit is eating a carrot.' },
        { id: '6', french: 'Cheval', english: 'Horse', category: 'animals', exampleFrench: 'Le cheval court dans le pré.', exampleEnglish: 'The horse is running in the meadow.' },
        { id: '7', french: 'Vache', english: 'Cow', category: 'animals', exampleFrench: 'La vache donne du lait.', exampleEnglish: 'The cow gives milk.' }
      ],
      household: [
        { id: '1', french: 'Maison', english: 'House', category: 'places', exampleFrench: 'Ma maison est près de la rivière.', exampleEnglish: 'My house is near the river.' },
        { id: '2', french: 'Table', english: 'Table', category: 'furniture', exampleFrench: 'Le livre est sur la table.', exampleEnglish: 'The book is on the table.' },
        { id: '3', french: 'Chaise', english: 'Chair', category: 'furniture', exampleFrench: 'Asseyez-vous sur la chaise, s\'il vous plaît.', exampleEnglish: 'Please sit on the chair.' },
        { id: '4', french: 'Lit', english: 'Bed', category: 'furniture', exampleFrench: 'Je dors dans mon lit.', exampleEnglish: 'I sleep in my bed.' },
        { id: '5', french: 'Fenêtre', english: 'Window', category: 'household', exampleFrench: 'Ouvrez la fenêtre, il fait chaud.', exampleEnglish: 'Open the window, it\'s hot.' },
        { id: '6', french: 'Porte', english: 'Door', category: 'household', exampleFrench: 'Fermez la porte, s\'il vous plaît.', exampleEnglish: 'Close the door, please.' },
        { id: '7', french: 'Cuisine', english: 'Kitchen', category: 'rooms', exampleFrench: 'Je prépare le dîner dans la cuisine.', exampleEnglish: 'I prepare dinner in the kitchen.' }
      ],
      travel: [
        { id: '1', french: 'Valise', english: 'Suitcase', category: 'travel', exampleFrench: 'Ma valise est prête pour le voyage.', exampleEnglish: 'My suitcase is ready for the trip.' },
        { id: '2', french: 'Passeport', english: 'Passport', category: 'travel', exampleFrench: 'N\'oubliez pas votre passeport!', exampleEnglish: 'Don\'t forget your passport!' },
        { id: '3', french: 'Train', english: 'Train', category: 'transportation', exampleFrench: 'Le train arrive à la gare.', exampleEnglish: 'The train arrives at the station.' },
        { id: '4', french: 'Avion', english: 'Airplane', category: 'transportation', exampleFrench: 'L\'avion décolle à huit heures.', exampleEnglish: 'The plane takes off at eight o\'clock.' },
        { id: '5', french: 'Hôtel', english: 'Hotel', category: 'travel', exampleFrench: 'Nous restons dans un hôtel près de la plage.', exampleEnglish: 'We\'re staying at a hotel near the beach.' },
        { id: '6', french: 'Billet', english: 'Ticket', category: 'travel', exampleFrench: 'Voici votre billet d\'avion.', exampleEnglish: 'Here is your plane ticket.' },
        { id: '7', french: 'Voyage', english: 'Trip', category: 'travel', exampleFrench: 'Bon voyage!', exampleEnglish: 'Have a good trip!' }
      ],
      colors: [
        { id: '1', french: 'Rouge', english: 'Red', category: 'colors', exampleFrench: 'J\'aime les pommes rouges.', exampleEnglish: 'I like red apples.' },
        { id: '2', french: 'Bleu', english: 'Blue', category: 'colors', exampleFrench: 'Le ciel est bleu aujourd\'hui.', exampleEnglish: 'The sky is blue today.' },
        { id: '3', french: 'Vert', english: 'Green', category: 'colors', exampleFrench: 'L\'herbe est verte.', exampleEnglish: 'The grass is green.' },
        { id: '4', french: 'Jaune', english: 'Yellow', category: 'colors', exampleFrench: 'Le soleil est jaune.', exampleEnglish: 'The sun is yellow.' },
        { id: '5', french: 'Noir', english: 'Black', category: 'colors', exampleFrench: 'Mon chat est noir.', exampleEnglish: 'My cat is black.' },
        { id: '6', french: 'Blanc', english: 'White', category: 'colors', exampleFrench: 'La neige est blanche.', exampleEnglish: 'Snow is white.' },
        { id: '7', french: 'Gris', english: 'Gray', category: 'colors', exampleFrench: 'Les nuages sont gris.', exampleEnglish: 'The clouds are gray.' }
      ],
      numbers: [
        { id: '1', french: 'Un', english: 'One', category: 'numbers', exampleFrench: 'J\'ai un frère.', exampleEnglish: 'I have one brother.' },
        { id: '2', french: 'Deux', english: 'Two', category: 'numbers', exampleFrench: 'Il y a deux livres sur la table.', exampleEnglish: 'There are two books on the table.' },
        { id: '3', french: 'Trois', english: 'Three', category: 'numbers', exampleFrench: 'J\'ai trois chats.', exampleEnglish: 'I have three cats.' },
        { id: '4', french: 'Quatre', english: 'Four', category: 'numbers', exampleFrench: 'La table a quatre pieds.', exampleEnglish: 'The table has four legs.' },
        { id: '5', french: 'Cinq', english: 'Five', category: 'numbers', exampleFrench: 'J\'ai cinq doigts sur chaque main.', exampleEnglish: 'I have five fingers on each hand.' },
        { id: '6', french: 'Dix', english: 'Ten', category: 'numbers', exampleFrench: 'Il y a dix personnes ici.', exampleEnglish: 'There are ten people here.' },
        { id: '7', french: 'Cent', english: 'Hundred', category: 'numbers', exampleFrench: 'Le livre a cent pages.', exampleEnglish: 'The book has one hundred pages.' }
      ]
    };
    
    // Get fallback vocabulary set for today's theme
    const vocab = fallbackSets[todayTheme] || fallbackSets.greetings;
    
    // Add placeholder images
    return vocab.map(item => ({
      ...item,
      imageUrl: `https://via.placeholder.com/300x200?text=${encodeURIComponent(item.french)}`
    }));
  };

  const initializeUserAnswers = (length) => {
    setUserAnswers(new Array(length).fill(null));
  };

  const handleStartLesson = () => {
    if (playSound) playSound('click');
    setCurrentStep('flashcards');
  };

  const handleFlipCard = async () => {
    if (!isFlipped && !currentWordDetails) {
      // Only fetch details when flipping to back for the first time
      await getWordDetails(vocabularySet[flashcardIndex]);
    }
    setIsFlipped(!isFlipped);
  };

  const getWordDetails = async (word) => {
    try {
      const response = await api.post('/api/ai/word-details', {
        word: word.french,
        english: word.english,
        userLevel
      });
      setCurrentWordDetails(response.data);
    } catch (error) {
      console.error('Error getting word details:', error);
    }
  };

  const handleNextFlashcard = () => {
    if (playSound) playSound('click');
    setIsFlipped(false); // Reset card to front side
    if (flashcardIndex < vocabularySet.length - 1) {
      setFlashcardIndex(flashcardIndex + 1);
    } else {
      setCurrentStep('quiz');
    }
  };

  const handlePrevFlashcard = () => {
    if (playSound) playSound('click');
    setIsFlipped(false); // Reset card to front side
    if (flashcardIndex > 0) {
      setFlashcardIndex(flashcardIndex - 1);
    }
  };

  const handleQuizAnswer = (answer) => {
    if (playSound) {
      // Play sound based on correct/incorrect
      if (answer === vocabularySet[quizIndex].french) {
        playSound('correct');
      } else {
        playSound('incorrect');
      }
    }
    
    const newAnswers = [...userAnswers];
    newAnswers[quizIndex] = answer;
    setUserAnswers(newAnswers);
    
    if (answer === vocabularySet[quizIndex].french) {
      setScore(score + 1);
    }
    
    if (quizIndex < vocabularySet.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      completeLesson();
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
        maxScore: vocabularySet.length
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
      <div 
        className="flashcard-container h-64 relative my-6 cursor-pointer" 
        onClick={handleFlipCard}
      >
        <div className={`h-full rounded-xl shadow-lg transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front side - French word */}
          <div className="absolute w-full h-full rounded-xl flex flex-col items-center justify-center p-6 backface-hidden bg-red-100 border-2 border-red-300" 
               style={{ backfaceVisibility: 'hidden', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
            <span className="text-3xl font-bold text-slate-800 mb-2">{currentWord.french}</span>
            {currentWord.category && (
              <span className="text-sm px-2 py-1 bg-red-200 rounded-full text-red-800">{currentWord.category}</span>
            )}
          </div>
          
          {/* Back side - English translation & AI-generated content */}
          <div className="absolute w-full h-full rounded-xl flex flex-col items-center justify-center p-6 backface-hidden bg-green-100 border-2 border-green-300 overflow-y-auto"
               style={{ backfaceVisibility: 'hidden', transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)' }}>
            {currentWordDetails && (
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
                {currentWordDetails.tips && (
                  <div className="text-sm">
                    <p className="font-semibold text-slate-700">Tips:</p>
                    <p className="text-xs text-slate-600">{currentWordDetails.tips}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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