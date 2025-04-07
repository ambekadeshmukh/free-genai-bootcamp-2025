import React, { createContext, useState, useContext, useEffect } from 'react';

// Create context
const ChalkboardContext = createContext();

// Custom hook to use the context
export const useChalkboard = () => useContext(ChalkboardContext);

// Provider component
export const ChalkboardProvider = ({ children }) => {
  // State for theme and font size
  const [currentTheme, setCurrentTheme] = useState('light');
  const [currentFontSizeKey, setCurrentFontSizeKey] = useState('medium');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Font size configurations
  const fontSizes = {
    small: {
      heading: 'text-xl',
      subheading: 'text-lg',
      bodyText: 'text-sm',
      caption: 'text-xs'
    },
    medium: {
      heading: 'text-2xl',
      subheading: 'text-xl',
      bodyText: 'text-base',
      caption: 'text-sm'
    },
    large: {
      heading: 'text-3xl',
      subheading: 'text-2xl',
      bodyText: 'text-lg',
      caption: 'text-base'
    }
  };
  
  // Current font size
  const currentFontSize = fontSizes[currentFontSizeKey];
  
  // Sound effects
  const sounds = {
    click: '/sounds/click.wav',
    correct: '/sounds/correct.wav',
    incorrect: '/sounds/incorrect.wav',
    success: '/sounds/success.wav',
    notification: '/sounds/notification.wav'
  };
  
  // Load settings from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem('chalkboardTheme');
    const storedFontSize = localStorage.getItem('chalkboardFontSize');
    const storedSound = localStorage.getItem('chalkboardSound');
    
    if (storedTheme) {
      setCurrentTheme(storedTheme);
    }
    
    if (storedFontSize) {
      setCurrentFontSizeKey(storedFontSize);
    }
    
    if (storedSound !== null) {
      setSoundEnabled(storedSound === 'true');
    }
  }, []);
  
  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('chalkboardTheme', currentTheme);
    localStorage.setItem('chalkboardFontSize', currentFontSizeKey);
    localStorage.setItem('chalkboardSound', soundEnabled.toString());
  }, [currentTheme, currentFontSizeKey, soundEnabled]);
  
  // Theme setter
  const setTheme = (theme) => {
    setCurrentTheme(theme);
  };
  
  // Font size setter
  const setFontSize = (size) => {
    setCurrentFontSizeKey(size);
  };
  
  // Loading state handlers
  const showLoading = () => {
    setIsLoading(true);
  };
  
  const hideLoading = () => {
    setIsLoading(false);
  };
  
  // Play sound effect
  const playSound = (soundName) => {
    if (!soundEnabled) return;
    
    const soundUrl = sounds[soundName];
    if (!soundUrl) return;
    
    const audio = new Audio(soundUrl);
    audio.play().catch(error => {
      console.error('Error playing sound:', error);
    });
  };
  
  // Value object for the context
  const value = {
    currentTheme,
    setTheme,
    currentFontSize,
    setFontSize,
    soundEnabled,
    setSoundEnabled,
    isLoading,
    showLoading,
    hideLoading,
    playSound
  };
  
  return (
    <ChalkboardContext.Provider value={value}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-center mt-2">Loading...</p>
          </div>
        </div>
      )}
    </ChalkboardContext.Provider>
  );
};