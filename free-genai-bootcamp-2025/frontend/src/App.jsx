import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChalkboardProvider } from './contexts/ChalkboardContext';
import { ProgressProvider } from './contexts/ProgressContext';
import { AIProvider } from './contexts/AIContext';

// Pages
import HomePage from './pages/HomePage';
import WordLineupGame from './pages/games/WordLineupGame';
import PhraseConstructorGame from './pages/games/PhraseConstructorGame';
import ListeningChallengeGame from './pages/games/ListeningChallengeGame';
import ObjectNamingGame from './pages/games/ObjectNamingGame';
import DailyQuickLearn from './pages/games/DailyQuickLearn';
import PronunciationPractice from './pages/games/PronunciationPractice';
import CulturalContextPage from './pages/CulturalContextPage';
import AILanguageBuddy from './pages/AILanguageBuddy';

// Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import LoadingOverlay from './components/common/LoadingOverlay';
import ProgressTracker from './components/common/ProgressTracker';
import WelcomeModal from './components/modals/WelcomeModal';

// Services
import { initializeLocalStorage } from './services/storageService';

// Main App Component
function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  
  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      // Initialize local storage with default values if first visit
      const isFirstVisit = await initializeLocalStorage();
      setShowWelcome(isFirstVisit);
      
      // Simulate loading time for assets
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    };
    
    initializeApp();
  }, []);
  
  // Handle welcome modal close
  const handleWelcomeClose = () => {
    setShowWelcome(false);
  };
  
  if (isLoading) {
    return <LoadingOverlay />;
  }
  
  return (
    <Router>
      <ChalkboardProvider>
        <ProgressProvider>
          <AIProvider>
            <div className="flex flex-col min-h-screen bg-slate-900">
              <Header />
              
              <main className="flex-grow flex items-center justify-center p-4">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/games/word-lineup" element={<WordLineupGame />} />
                  <Route path="/games/phrase-constructor" element={<PhraseConstructorGame />} />
                  <Route path="/games/listening-challenge" element={<ListeningChallengeGame />} />
                  <Route path="/games/object-naming" element={<ObjectNamingGame />} />
                  <Route path="/games/daily-quick-learn" element={<DailyQuickLearn />} />
                  <Route path="/games/pronunciation-practice" element={<PronunciationPractice />} />
                  <Route path="/cultural-context" element={<CulturalContextPage />} />
                  <Route path="/ai-language-buddy" element={<AILanguageBuddy />} />
                </Routes>
              </main>
              
              <ProgressTracker />
              <Footer />
              
              {showWelcome && (
                <WelcomeModal onClose={handleWelcomeClose} />
              )}
            </div>
          </AIProvider>
        </ProgressProvider>
      </ChalkboardProvider>
    </Router>
  );
}

export default App;