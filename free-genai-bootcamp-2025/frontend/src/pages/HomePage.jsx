import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useChalkboard } from '../contexts/ChalkboardContext';
import { useProgress } from '../contexts/ProgressContext';
import GameCard from '../components/common/GameCard';
import ProgressSummary from '../components/dashboard/ProgressSummary';
import DailyGoals from '../components/dashboard/DailyGoals';
import RecentActivity from '../components/dashboard/RecentActivity';
import LearningPathCard from '../components/dashboard/LearningPathCard';
import VocabularySection from '../components/dashboard/VocabularySection';

const HomePage = () => {
  const { currentTheme, currentFontSize, playSound } = useChalkboard();
  const { progress, userLevel } = useProgress();
  const [greeting, setGreeting] = useState('');
  
  // Generate greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    let newGreeting = '';
    
    if (hour < 12) {
      newGreeting = 'Bonjour! Good morning';
    } else if (hour < 18) {
      newGreeting = 'Bon après-midi! Good afternoon';
    } else {
      newGreeting = 'Bonsoir! Good evening';
    }
    
    setGreeting(newGreeting);
  }, []);
  
  // Game list with details
  const games = [
    {
      id: 'word-lineup',
      title: 'Word Lineup',
      description: 'Match French words with their meanings',
      path: '/games/word-lineup',
      icon: '🔤',
      bgColor: 'bg-blue-600',
      level: 'beginner'
    },
    {
      id: 'phrase-constructor',
      title: 'Phrase Builder',
      description: 'Create sentences by arranging words',
      path: '/games/phrase-constructor',
      icon: '📝',
      bgColor: 'bg-green-600',
      level: 'beginner'
    },
    {
      id: 'listening-challenge',
      title: 'Listening Challenge',
      description: 'Test your listening comprehension',
      path: '/games/listening-challenge',
      icon: '👂',
      bgColor: 'bg-yellow-600',
      level: 'intermediate'
    },
    {
      id: 'object-naming',
      title: 'Object Naming',
      description: 'Learn vocabulary in context',
      path: '/games/object-naming',
      icon: '🖼️',
      bgColor: 'bg-purple-600',
      level: 'beginner'
    },
    {
      id: 'daily-quick-learn',
      title: 'Daily Quick Learn',
      description: 'Quick daily lessons to keep your streak',
      path: '/games/daily-quick-learn',
      icon: '📅',
      bgColor: 'bg-red-600',
      level: 'all'
    },
    {
      id: 'pronunciation-practice',
      title: 'Pronunciation Practice',
      description: 'Improve your French accent',
      path: '/games/pronunciation-practice',
      icon: '🗣️',
      bgColor: 'bg-indigo-600',
      level: 'intermediate'
    }
  ];
  
  // Features list
  const features = [
    {
      id: 'ai-language-buddy',
      title: 'AI Language Buddy',
      description: 'Chat with an AI tutor in French',
      path: '/ai-language-buddy',
      icon: '🤖',
      bgColor: 'bg-teal-600',
      level: 'all'
    },
    {
      id: 'cultural-context',
      title: 'Cultural Context',
      description: 'Learn about French culture',
      path: '/cultural-context',
      icon: '🗼',
      bgColor: 'bg-pink-600',
      level: 'all'
    }
  ];
  
  // Filter games based on user level
  const filteredGames = games.filter(
    game => game.level === 'all' || game.level === userLevel || 
    (userLevel === 'advanced' && (game.level === 'beginner' || game.level === 'intermediate'))
  );
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 text-center">
        <h1 className={`${currentFontSize.heading} font-bold text-white mb-2`}>
          {greeting}!
        </h1>
        <p className={`${currentFontSize.bodyText} text-blue-200`}>
          Continue your French learning adventure
        </p>
        
        {/* Streak banner */}
        {progress.streak > 0 && (
          <div className="mt-4 p-3 bg-orange-600 bg-opacity-90 rounded-lg inline-block">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🔥</span>
              <span className="font-bold text-white">
                {progress.streak} day{progress.streak !== 1 ? 's' : ''} streak!
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Progress and goals */}
        <div className="md:col-span-1 space-y-6">
          <ProgressSummary />
          <DailyGoals />
          <RecentActivity />
        </div>
        
        {/* Right column: Games and features */}
        <div className="md:col-span-2 space-y-8">
          {/* Continue learning section */}
          <section>
            <h2 className={`${currentFontSize.subheading} font-bold text-white mb-4`}>
              Continue Learning
            </h2>
            <LearningPathCard />
          </section>
          
          {/* Games section */}
          <section>
            <h2 className={`${currentFontSize.subheading} font-bold text-white mb-4`}>
              Learning Games
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGames.map(game => (
                <GameCard
                  key={game.id}
                  title={game.title}
                  description={game.description}
                  path={game.path}
                  icon={game.icon}
                  bgColor={game.bgColor}
                />
              ))}
            </div>
          </section>
          
          {/* Features section */}
          <section>
            <h2 className={`${currentFontSize.subheading} font-bold text-white mb-4`}>
              Special Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map(feature => (
                <GameCard
                  key={feature.id}
                  title={feature.title}
                  description={feature.description}
                  path={feature.path}
                  icon={feature.icon}
                  bgColor={feature.bgColor}
                />
              ))}
            </div>
          </section>
          
          {/* Vocabulary practice */}
          <section>
            <h2 className={`${currentFontSize.subheading} font-bold text-white mb-4`}>
              Vocabulary Practice
            </h2>
            <VocabularySection />
          </section>
        </div>
      </div>
    </div>
  );
};

export default HomePage;