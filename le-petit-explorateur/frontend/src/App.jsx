import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChalkboardProvider } from './contexts/ChalkboardContext';
import { ProgressProvider } from './contexts/ProgressContext';
import { AIProvider } from './contexts/AIContext';

// Pages
import HomePage from './pages/HomePage';
import ImageWordMatchGame from './pages/games/ImageWordMatchGame';
import PhraseConstructorGame from './pages/games/PhraseConstructorGame';
import DailyQuickLearn from './pages/games/DailyQuickLearn';
import AILanguageBuddy from './pages/games/AILanguageBuddy';
import QuizChallenge from './pages/games/QuizChallenge';

// Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import LoadingOverlay from './components/common/LoadingOverlay';
import ProgressTracker from './components/common/ProgressTracker';
import WelcomeModal from './components/modals/WelcomeModal';

// Services
import { initializeLocalStorage } from './services/storageService';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Theme colors from logo
  const colors = {
    yellow: '#FFF4A3',
    red: '#FF8B8B',
    green: '#ABEBC6',
    blue: '#87CEEB',
    darkText: '#4A4A4A'
  };
  
  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      const isFirstVisit = await initializeLocalStorage();
      setShowWelcome(isFirstVisit);
      
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    };
    
    initializeApp();
    
    // Apply theme colors to root element
    document.documentElement.style.setProperty('--color-yellow', colors.yellow);
    document.documentElement.style.setProperty('--color-red', colors.red);
    document.documentElement.style.setProperty('--color-green', colors.green);
    document.documentElement.style.setProperty('--color-blue', colors.blue);
    document.documentElement.style.setProperty('--color-dark-text', colors.darkText);
  }, []);
  
  // Handle welcome modal close
  const handleWelcomeClose = () => {
    setShowWelcome(false);
  };
  
  if (isLoading) {
    return <LoadingOverlay colors={colors} />;
  }
  
  return (
    <Router>
      <ChalkboardProvider>
        <ProgressProvider>
          <AIProvider>
            <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
              <Header colors={colors} />
              
              <main className="flex-grow flex items-center justify-center p-4">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/games/image-word-match" element={<ImageWordMatchGame />} />
                  <Route path="/games/phrase-constructor" element={<PhraseConstructorGame />} />
                  <Route path="/games/daily-quick-learn" element={<DailyQuickLearn />} />
                  <Route path="/games/quiz-challenge" element={<QuizChallenge />} />
                  <Route path="/ai-language-buddy" element={<AILanguageBuddy />} />
                </Routes>
              </main>
              <ProgressTracker colors={colors} />
              <Footer colors={colors} />
              
              {showWelcome && (
                <WelcomeModal onClose={handleWelcomeClose} colors={colors} />
              )}
            </div>
          </AIProvider>
        </ProgressProvider>
      </ChalkboardProvider>
    </Router>
  );
}

export default App;