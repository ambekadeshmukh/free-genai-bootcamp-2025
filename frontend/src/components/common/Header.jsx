import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useChalkboard } from '../../contexts/ChalkboardContext';
import { useProgress } from '../../contexts/ProgressContext';
import SettingsModal from '../modals/SettingsModal';

const Header = () => {
  const location = useLocation();
  const { currentTheme, playSound } = useChalkboard();
  const { progress, userLevel } = useProgress();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Handle menu toggle
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    playSound('click');
  };
  
  // Handle settings modal
  const openSettings = () => {
    setIsSettingsOpen(true);
    playSound('click');
  };
  
  const closeSettings = () => {
    setIsSettingsOpen(false);
  };
  
  // Navigation links
  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/games/word-lineup', label: 'Word Lineup' },
    { path: '/games/phrase-constructor', label: 'Phrase Builder' },
    { path: '/games/listening-challenge', label: 'Listening' },
    { path: '/games/object-naming', label: 'Object Naming' },
    { path: '/games/daily-quick-learn', label: 'Daily Learn' },
    { path: '/games/pronunciation-practice', label: 'Pronunciation' },
    { path: '/cultural-context', label: 'Cultural Context' },
    { path: '/ai-language-buddy', label: 'AI Buddy' }
  ];
  
  return (
    <header className="bg-slate-900 text-white border-b-2 border-blue-400 shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo and title */}
          <Link to="/" className="flex items-center" onClick={() => playSound('click')}>
            <div className="flex items-center">
              <span className="text-3xl mr-2">🇫🇷</span>
              <h1 className="text-xl md:text-2xl font-bold text-blue-300">
                Le Petit Explorateur
              </h1>
            </div>
          </Link>
          
          {/* User level and XP (desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-sm text-blue-200">Level:</span>
              <span className="ml-1 px-2 py-1 bg-blue-800 rounded-md text-xs font-bold">
                {progress.level}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-blue-200">XP:</span>
              <span className="ml-1 px-2 py-1 bg-blue-800 rounded-md text-xs font-bold">
                {progress.xp}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-blue-200">Mode:</span>
              <span className="ml-1 px-2 py-1 bg-green-800 rounded-md text-xs font-bold capitalize">
                {userLevel}
              </span>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={toggleMenu}
              className="text-white hover:text-blue-300 focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === link.path
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-800'
                }`}
                onClick={() => playSound('click')}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={openSettings}
              className="ml-2 p-2 text-blue-100 hover:bg-blue-800 rounded-md"
              aria-label="Settings"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </nav>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-blue-700">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <span className="text-sm text-blue-200">Level:</span>
                  <span className="ml-1 px-2 py-1 bg-blue-800 rounded-md text-xs font-bold">
                    {progress.level}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-blue-200">XP:</span>
                  <span className="ml-1 px-2 py-1 bg-blue-800 rounded-md text-xs font-bold">
                    {progress.xp}
                  </span>
                </div>
              </div>
              <button
                onClick={openSettings}
                className="p-2 text-blue-100 hover:bg-blue-800 rounded-md"
                aria-label="Settings"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            <nav className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    location.pathname === link.path
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-800'
                  }`}
                  onClick={() => {
                    setIsMenuOpen(false);
                    playSound('click');
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
      
      {/* Settings Modal */}
      {isSettingsOpen && <SettingsModal onClose={closeSettings} />}
    </header>
  );
};

export default Header;