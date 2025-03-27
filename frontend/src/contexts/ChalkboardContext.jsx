import React, { createContext, useState, useContext, useEffect } from 'react';

// Create context
const ChalkboardContext = createContext();

// Custom hook to use the context
export const useChalkboard = () => useContext(ChalkboardContext);

// Provider component
export const ChalkboardProvider = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState('default');
  // Sound effects state
  const [soundEnabled, setSoundEnabled] = useState(true);
  // Animation state
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  // Font size state
  const [fontSize, setFontSize] = useState('medium');
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Load preferences from localStorage
  useEffect(() => {
    const loadPreferences = () => {
      const savedTheme = localStorage.getItem('theme');
      const savedSound = localStorage.getItem('soundEnabled');
      const savedAnimations = localStorage.getItem('animationsEnabled');
      const savedFontSize = localStorage.getItem('fontSize');
      
      if (savedTheme) setTheme(savedTheme);
      if (savedSound !== null) setSoundEnabled(savedSound === 'true');
      if (savedAnimations !== null) setAnimationsEnabled(savedAnimations === 'true');
      if (savedFontSize) setFontSize(savedFontSize);
    };
    
    loadPreferences();
  }, []);
  
  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('soundEnabled', soundEnabled.toString());
    localStorage.setItem('animationsEnabled', animationsEnabled.toString());
    localStorage.setItem('fontSize', fontSize);
  }, [theme, soundEnabled, animationsEnabled, fontSize]);
  
  // Theme settings based on theme name
  const themeSettings = {
    default: {
      backgroundColor: '#2c3e50', // Dark slate gray
      textColor: '#ecf0f1', // Off-white
      accentColor: '#e74c3c', // Red
      secondaryColor: '#3498db', // Blue
    },
    blue: {
      backgroundColor: '#1a3a5f', // Dark blue
      textColor: '#e6f0ff', // Light blue-white
      accentColor: '#f39c12', // Orange
      secondaryColor: '#2ecc71', // Green
    },
    green: {
      backgroundColor: '#1e3a2b', // Dark green
      textColor: '#e6f7e6', // Light green-white
      accentColor: '#9b59b6', // Purple
      secondaryColor: '#e67e22', // Orange
    }
  };
  
  // Font size settings
  const fontSizeSettings = {
    small: {
      bodyText: 'text-sm',
      heading: 'text-xl',
      subheading: 'text-lg'
    },
    medium: {
      bodyText: 'text-base',
      heading: 'text-2xl',
      subheading: 'text-xl'
    },
    large: {
      bodyText: 'text-lg',
      heading: 'text-3xl',
      subheading: 'text-2xl'
    }
  };
  
  // Get current theme settings
  const currentTheme = themeSettings[theme] || themeSettings.default;
  const currentFontSize = fontSizeSettings[fontSize] || fontSizeSettings.medium;
  
  // Chalk effect for text
  const applyChalkEffect = (text) => {
    return `<span class="chalk-effect">${text}</span>`;
  };
  
  // Play sound effect
  const playSound = (soundName) => {
    if (!soundEnabled) return;
    
    const sounds = {
      correct: '/sounds/correct.mp3',
      incorrect: '/sounds/incorrect.mp3',
      click: '/sounds/click.mp3',
      success: '/sounds/success.mp3',
      notification: '/sounds/notification.mp3',
    };
    
    const soundPath = sounds[soundName];
    if (soundPath) {
      const sound = new Audio(soundPath);
      sound.play().catch(err => console.error('Error playing sound:', err));
    }
  };
  
  // Show loading indicator
  const showLoading = () => {
    setIsLoading(true);
  };
  
  // Hide loading indicator
  const hideLoading = () => {
    setIsLoading(false);
  };
  
  // Value object for the context
  const value = {
    theme,
    setTheme,
    soundEnabled,
    setSoundEnabled,
    animationsEnabled,
    setAnimationsEnabled,
    fontSize,
    setFontSize,
    currentTheme,
    currentFontSize,
    applyChalkEffect,
    playSound,
    isLoading,
    showLoading,
    hideLoading
  };
  
  return (
    <ChalkboardContext.Provider value={value}>
      {children}
    </ChalkboardContext.Provider>
  );
};