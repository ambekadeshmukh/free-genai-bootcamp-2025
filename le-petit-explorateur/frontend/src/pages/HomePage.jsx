import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../contexts/ProgressContext';
import { useChalkboard } from '../contexts/ChalkboardContext';

const HomePage = () => {
  const { progress, userLevel } = useProgress();
  const { playSound } = useChalkboard();
  const [streak, setStreak] = useState(0);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  
  // Theme colors from your logo
  const colors = {
    yellow: '#FFF4A3',
    red: '#FF8B8B',
    green: '#ABEBC6',
    blue: '#87CEEB',
    darkText: '#4A4A4A'
  };

  useEffect(() => {
    // Check if first visit
    const visitCheck = localStorage.getItem('hasVisitedBefore');
    if (!visitCheck) {
      setIsFirstVisit(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
    
    // Load progress data
    const loadProgress = () => {
      // Get streak from localStorage
      const storedProgress = localStorage.getItem('dailyQuickLearnProgress');
      if (storedProgress) {
        const progressData = JSON.parse(storedProgress);
        setStreak(progressData.streak || 0);
      }
    };
    
    loadProgress();
  }, [progress]);

  const dismissFirstVisit = () => {
    setIsFirstVisit(false);
    playSound('click');
  };

  // Format today's date in French style
  const getTodaysDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    
    // Convert to French date format (capitalize first letter)
    const frenchDate = today.toLocaleDateString('fr-FR', options);
    return frenchDate.charAt(0).toUpperCase() + frenchDate.slice(1);
  };

  // Featured learning path based on user level
  const getFeaturedPath = () => {
    const paths = {
      beginner: {
        title: 'French Essentials',
        description: 'Master basic greetings, introductions, and everyday phrases',
        activities: ['dailyQuickLearn', 'frenchHangman', 'phraseConstructor', 'quizChallenge']
      },
      intermediate: {
        title: 'Conversation Builder',
        description: 'Develop your conversational skills with more complex sentences',
        activities: ['phraseConstructor', 'aiLanguageBuddy', 'quizChallenge', 'dailyQuickLearn']
      },
      advanced: {
        title: 'Cultural Immersion',
        description: 'Deepen your understanding of French language and culture',
        activities: ['aiLanguageBuddy', 'quizChallenge', 'frenchHangman', 'dailyQuickLearn']
      }
    };
    
    return paths[userLevel] || paths.beginner;
  };

  const featuredPath = getFeaturedPath();
  
  // Handle click on activity cards
  const handleActivityClick = () => {
    playSound('click');
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {isFirstVisit && (
        <div className="welcome-banner mb-8 p-6 rounded-lg shadow-lg text-center relative" style={{ backgroundColor: colors.yellow + '60' }}>
          <button 
            onClick={dismissFirstVisit}
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            aria-label="Close welcome message"
          >
            &times;
          </button>
          <h2 className="text-2xl font-bold mb-2" style={{ color: colors.darkText }}>Bienvenue à Le Petit Explorateur!</h2>
          <p className="mb-4">Your fun journey to learn French starts here. Complete daily lessons to build your streak!</p>
          <Link 
            to="/games/daily-quick-learn"
            className="inline-block px-6 py-3 rounded-full font-bold text-white transition-transform hover:scale-105"
            style={{ backgroundColor: colors.red }}
            onClick={() => playSound('click')}
          >
            Start Your First Lesson
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="md:col-span-2">
          <div className="welcome-section p-6 rounded-lg shadow-lg h-full flex flex-col" style={{ backgroundColor: colors.blue + '40' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-1" style={{ color: colors.darkText }}>Bon {getTimeOfDay()}!</h1>
                <p className="text-sm">{getTodaysDate()}</p>
              </div>
              <div className="flex items-center">
                <span className="text-sm mr-2">Streak:</span>
                <span className="flex items-center justify-center w-8 h-8 rounded-full font-bold" style={{ backgroundColor: colors.red, color: 'white' }}>{streak}</span>
              </div>
            </div>
            
            <p className="mb-6">Continue your French learning adventure</p>
            
            <div className="learning-path p-4 rounded-lg mb-auto" style={{ backgroundColor: 'white' }}>
              <h2 className="font-bold mb-2">Your Learning Path: {featuredPath.title}</h2>
              <p className="text-sm mb-4">{featuredPath.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {featuredPath.activities.map((activity, index) => {
                  const activityInfo = getActivityInfo(activity);
                  return (
                    <Link 
                      key={index}
                      to={activityInfo.path}
                      className="p-3 rounded-lg text-center transition-transform hover:scale-105"
                      style={{ 
                        backgroundColor: activityInfo.color, 
                        color: activity === 'imageWordMatch' ? 'white' : colors.darkText
                      }}
                      onClick={handleActivityClick}
                    >
                      <span className="block text-2xl mb-1">{activityInfo.icon}</span>
                      <span className="font-medium">{activityInfo.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        <div className="daily-challenge p-6 rounded-lg shadow-lg flex flex-col" style={{ backgroundColor: colors.red + '40' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: colors.darkText }}>Daily Challenge</h2>
          <div className="bg-white p-4 rounded-lg mb-4 flex-1">
            <div className="text-center mb-4">
              <span className="text-4xl block mb-2">🎯</span>
              <h3 className="font-bold">Word of the Day</h3>
            </div>
            <div className="word-of-day p-3 rounded-lg mb-3 text-center" style={{ backgroundColor: colors.yellow + '60' }}>
              <p className="font-bold text-lg">{getDailyWord().french}</p>
              <p>{getDailyWord().english}</p>
            </div>
            <p className="text-sm text-center italic">"{getDailyWord().example}"</p>
          </div>
          <Link 
            to="/games/daily-quick-learn"
            className="block w-full py-3 rounded-full font-bold text-white text-center transition-transform hover:scale-105"
            style={{ backgroundColor: colors.green }}
            onClick={handleActivityClick}
          >
            Start Daily Lesson
          </Link>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-4" style={{ color: colors.darkText }}>Learning Activities</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <ActivityCard 
          title="Daily Quick Learn"
          description="Quick, daily vocabulary lessons to build your streak"
          icon="📚"
          link="/games/daily-quick-learn"
          backgroundColor={colors.yellow + '60'}
          onClick={handleActivityClick}
        />
        <ActivityCard 
          title="French Hangman"
          description="Guess French words letter by letter before you run out of chances"
          icon="�"
          link="/games/french-hangman"
          backgroundColor={colors.blue + '60'}
          onClick={handleActivityClick}
        />
        <ActivityCard 
          title="Phrase Constructor"
          description="Build French sentences by arranging words in order"
          icon="🔡"
          link="/games/phrase-constructor"
          backgroundColor={colors.green + '60'}
          onClick={handleActivityClick}
        />
        <ActivityCard 
          title="Quiz Challenge"
          description="Test your French knowledge in a fast-paced quiz game"
          icon="🎮"
          link="/games/quiz-challenge"
          backgroundColor={colors.red + '60'}
          onClick={handleActivityClick}
        />
      </div>
      
      <h2 className="text-2xl font-bold mb-4" style={{ color: colors.darkText }}>Advanced Learning</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActivityCard 
          title="AI Language Buddy"
          description="Practice conversation with an AI tutor adapted to your level"
          icon="💬"
          link="/ai-language-buddy"
          backgroundColor={colors.red + '60'}
          onClick={handleActivityClick}
        />
      </div>
      
      {/* Learning progress section */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4" style={{ color: colors.darkText }}>Your Progress</h2>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.yellow + '40' }}>
              <p className="text-3xl font-bold" style={{ color: colors.darkText }}>{progress?.streak || 0}</p>
              <p className="text-sm">Day Streak</p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.green + '40' }}>
              <p className="text-3xl font-bold" style={{ color: colors.darkText }}>{progress?.gamesCompleted || 0}</p>
              <p className="text-sm">Activities Completed</p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.blue + '40' }}>
              <p className="text-3xl font-bold" style={{ color: colors.darkText }}>{progress?.newWordsLearned || 0}</p>
              <p className="text-sm">Words Learned</p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.red + '40' }}>
              <p className="text-3xl font-bold" style={{ color: colors.darkText }}>{userLevel === 'beginner' ? 1 : userLevel === 'intermediate' ? 2 : 3}</p>
              <p className="text-sm">Current Level</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium">Daily Progress</p>
                <p className="text-sm">{progress?.daily || 0}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full" 
                  style={{ width: `${progress?.daily || 0}%`, backgroundColor: colors.blue }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium">Weekly Goals</p>
                <p className="text-sm">{progress?.weekly || 0}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full" 
                  style={{ width: `${progress?.weekly || 0}%`, backgroundColor: colors.green }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for activity cards
function ActivityCard({ title, description, icon, link, backgroundColor, onClick }) {
  return (
    <Link 
      to={link}
      className="block p-5 rounded-lg shadow-md transition-transform hover:scale-105"
      style={{ backgroundColor }}
      onClick={onClick}
    >
      <div className="flex items-start">
        <div className="text-2xl mr-3">{icon}</div>
        <div>
          <h3 className="font-bold mb-1">{title}</h3>
          <p className="text-sm">{description}</p>
        </div>
      </div>
    </Link>
  );
}

// Helper function to get time of day greeting
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'matin';
  if (hour < 18) return 'après-midi';
  return 'soir';
}

// Helper function to get activity info
function getActivityInfo(activity) {
  const activities = {
    dailyQuickLearn: {
      name: 'Daily Quick Learn',
      path: '/games/daily-quick-learn',
      icon: '📚',
      color: '#FFF4A3' + '60'
    },
    frenchHangman: {
      name: 'French Hangman',
      path: '/games/french-hangman',
      icon: '�',
      color: '#87CEEB' + '60'
    },
    phraseConstructor: {
      name: 'Phrase Constructor',
      path: '/games/phrase-constructor',
      icon: '🔡',
      color: '#ABEBC6' + '60'
    },
    quizChallenge: {
      name: 'Quiz Challenge',
      path: '/games/quiz-challenge',
      icon: '🎮',
      color: '#FF8B8B' + '60'
    },
    aiLanguageBuddy: {
      name: 'AI Language Buddy',
      path: '/ai-language-buddy',
      icon: '💬',
      color: '#FF8B8B' + '60'
    }
  };
  
  return activities[activity] || activities.dailyQuickLearn;
}

// Helper function to get word of the day
function getDailyWord() {
  // Get a consistent word for the day based on the date
  const date = new Date();
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  
  const words = [
    { french: 'Bonjour', english: 'Hello', example: 'Bonjour, comment allez-vous?' },
    { french: 'Merci', english: 'Thank you', example: 'Merci beaucoup pour votre aide.' },
    { french: 'S\'il vous plaît', english: 'Please', example: 'Un café, s\'il vous plaît.' },
    { french: 'Enchanté', english: 'Nice to meet you', example: 'Enchanté de faire votre connaissance.' },
    { french: 'Boulangerie', english: 'Bakery', example: 'J\'achète du pain à la boulangerie.' },
    { french: 'Fenêtre', english: 'Window', example: 'Ouvrez la fenêtre, s\'il vous plaît.' },
    { french: 'Jardin', english: 'Garden', example: 'Les fleurs dans le jardin sont belles.' },
    { french: 'Vélo', english: 'Bicycle', example: 'Je vais au travail à vélo.' },
    { french: 'Voyage', english: 'Travel/Trip', example: 'Bon voyage!' },
    { french: 'Cuisine', english: 'Kitchen/Cooking', example: 'La cuisine française est délicieuse.' },
    { french: 'Ordinateur', english: 'Computer', example: 'Je travaille sur mon ordinateur.' },
    { french: 'Parapluie', english: 'Umbrella', example: 'J\'ai besoin d\'un parapluie car il pleut.' },
    { french: 'Librairie', english: 'Bookstore', example: 'J\'achète des livres à la librairie.' },
    { french: 'Bibliothèque', english: 'Library', example: 'Je vais étudier à la bibliothèque.' },
    { french: 'Printemps', english: 'Spring', example: 'Le printemps est ma saison préférée.' }
  ];
  
  return words[dayOfYear % words.length];
}

export default HomePage;