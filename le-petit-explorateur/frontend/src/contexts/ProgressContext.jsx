import React, { createContext, useState, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getProgress, saveProgress } from '../services/storageService';

// Create context
const ProgressContext = createContext();

// Custom hook to use the context
export const useProgress = () => useContext(ProgressContext);

// Provider component
export const ProgressProvider = ({ children }) => {
  // User ID state
  const [userId, setUserId] = useState(null);
  
  // Progress state
  const [progress, setProgress] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    streak: 0,
    gamesCompleted: 0,
    newWordsLearned: 0,
    speakingExercises: 0,
    activities: {}
  });
  
  // User level state
  const [userLevel, setUserLevel] = useState('beginner');
  
  // Current learning path
  const [currentPath, setCurrentPath] = useState({
    name: 'Getting Started',
    focus: 'Essential Vocabulary',
    goals: ['Basic Greetings', 'Simple Phrases', 'Numbers 1-10']
  });
  
  // Vocabulary stats
  const [vocabularyStats, setVocabularyStats] = useState({
    wordsLearned: 0,
    mastered: 0,
    reviewing: 0,
    streak: 0
  });
  
  // Recent activities
  const [recentActivities, setRecentActivities] = useState([]);
  
  // Initialize user ID on first load
  useEffect(() => {
    // Check for existing user ID in localStorage
    const storedUserId = localStorage.getItem('userId');
    
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      // Generate new user ID
      const newUserId = uuidv4();
      setUserId(newUserId);
      localStorage.setItem('userId', newUserId);
    }
    
    // Load progress from localStorage
    const storedProgress = localStorage.getItem('userProgress');
    if (storedProgress) {
      setProgress(JSON.parse(storedProgress));
    }
    
    // Load vocabulary stats from localStorage
    const storedVocabStats = localStorage.getItem('vocabularyStats');
    if (storedVocabStats) {
      setVocabularyStats(JSON.parse(storedVocabStats));
    }
    
    // Load recent activities from localStorage
    const storedActivities = localStorage.getItem('recentActivities');
    if (storedActivities) {
      setRecentActivities(JSON.parse(storedActivities));
    }
    
    // Determine user level based on progress
    calculateUserLevel();
  }, []);
  
  // Save progress when it changes
  useEffect(() => {
    if (userId) {
      localStorage.setItem('userProgress', JSON.stringify(progress));
    }
  }, [userId, progress]);
  
  // Save vocabulary stats when they change
  useEffect(() => {
    if (userId) {
      localStorage.setItem('vocabularyStats', JSON.stringify(vocabularyStats));
    }
  }, [userId, vocabularyStats]);
  
  // Save recent activities when they change
  useEffect(() => {
    if (userId) {
      localStorage.setItem('recentActivities', JSON.stringify(recentActivities));
    }
  }, [userId, recentActivities]);
  
  // Calculate user level based on various metrics
  const calculateUserLevel = () => {
    const totalProgress = progress.daily + progress.weekly + progress.monthly;
    const gamesCompleted = progress.gamesCompleted;
    const wordsLearned = vocabularyStats.wordsLearned;
    
    if (wordsLearned >= 200 || gamesCompleted >= 50 || totalProgress >= 250) {
      setUserLevel('advanced');
    } else if (wordsLearned >= 100 || gamesCompleted >= 25 || totalProgress >= 150) {
      setUserLevel('intermediate');
    } else {
      setUserLevel('beginner');
    }
  };
  
  // Update progress
  const updateProgress = (action) => {
    switch (action.type) {
      case 'COMPLETE_ACTIVITY': {
        const { activity, score, maxScore } = action.payload;
        const timestamp = new Date().toISOString();
        
        // Update activities record
        const updatedActivities = {
          ...progress.activities,
          [activity]: {
            ...(progress.activities[activity] || {}),
            lastCompleted: timestamp,
            timesCompleted: (progress.activities[activity]?.timesCompleted || 0) + 1,
            bestScore: Math.max(score, progress.activities[activity]?.bestScore || 0)
          }
        };
        
        // Calculate percentage score
        const percentageScore = maxScore ? Math.round((score / maxScore) * 100) : 100;
        
        // Add to recent activities
        const newActivity = {
          id: uuidv4(),
          type: activity,
          description: getActivityDescription(activity, percentageScore),
          time: formatTime(new Date()),
          timestamp
        };
        
        const updatedRecentActivities = [newActivity, ...recentActivities.slice(0, 9)];
        setRecentActivities(updatedRecentActivities);
        
        // Update progress metrics
        const updatedProgress = {
          ...progress,
          gamesCompleted: progress.gamesCompleted + 1,
          daily: Math.min(100, progress.daily + 20),
          weekly: Math.min(100, progress.weekly + 10),
          activities: updatedActivities
        };
        
        // Special case for different game types
        if (activity === 'dailyQuickLearn') {
          updatedProgress.newWordsLearned = progress.newWordsLearned + 5;
          updatedProgress.streak = progress.streak + 1;
          
          // Update vocabulary stats
          setVocabularyStats({
            ...vocabularyStats,
            wordsLearned: vocabularyStats.wordsLearned + 5,
            mastered: vocabularyStats.mastered + Math.floor(percentageScore / 20),
            streak: vocabularyStats.streak + 1
          });
        } else if (activity === 'wordLineup') {
          updatedProgress.newWordsLearned = progress.newWordsLearned + 6;
          
          // Update vocabulary stats
          setVocabularyStats({
            ...vocabularyStats,
            wordsLearned: vocabularyStats.wordsLearned + 6,
            reviewing: vocabularyStats.reviewing + 6
          });
        } else if (activity === 'phraseConstructor') {
          // Focus on grammar more than vocabulary
          updatedProgress.newWordsLearned = progress.newWordsLearned + 2;
        } else if (activity === 'quizChallenge') {
          // Update based on quiz performance
          const wordsLearned = Math.floor(percentageScore / 20);
          updatedProgress.newWordsLearned = progress.newWordsLearned + wordsLearned;
          
          // Update vocabulary stats
          setVocabularyStats({
            ...vocabularyStats,
            wordsLearned: vocabularyStats.wordsLearned + wordsLearned,
            mastered: Math.min(
              vocabularyStats.wordsLearned,
              vocabularyStats.mastered + Math.floor(percentageScore / 25)
            )
          });
        }
        
        setProgress(updatedProgress);
        calculateUserLevel();
        return updatedProgress;
      }
      
      case 'ADD_VOCABULARY': {
        const { french, english } = action.payload;
        
        // Update vocabulary stats
        const updatedStats = {
          ...vocabularyStats,
          wordsLearned: vocabularyStats.wordsLearned + 1,
          reviewing: vocabularyStats.reviewing + 1
        };
        
        setVocabularyStats(updatedStats);
        
        // Update general progress
        const updatedProgress = {
          ...progress,
          newWordsLearned: progress.newWordsLearned + 1,
          daily: Math.min(100, progress.daily + 5)
        };
        
        setProgress(updatedProgress);
        
        // Add to recent activities
        const newActivity = {
          id: uuidv4(),
          type: 'vocabulary',
          description: `Learned new word: ${french} (${english})`,
          time: formatTime(new Date()),
          timestamp: new Date().toISOString()
        };
        
        const updatedRecentActivities = [newActivity, ...recentActivities.slice(0, 9)];
        setRecentActivities(updatedRecentActivities);
        
        return updatedProgress;
      }
      
      case 'UPDATE_LEARNING_PATH': {
        const { path } = action.payload;
        setCurrentPath(path);
        return path;
      }
      
      default:
        return progress;
    }
  };
  
  // Add vocabulary word
  const addVocabulary = (french, english) => {
    updateProgress({
      type: 'ADD_VOCABULARY',
      payload: { french, english }
    });
  };
  
  // Format time for display (e.g., "5m ago", "2h ago")
  const formatTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };
  
  // Get description for activity
  const getActivityDescription = (activity, score) => {
    switch (activity) {
      case 'dailyQuickLearn':
        return `Completed daily lesson with ${score}% score`;
      case 'wordLineup':
        return `Matched ${score}% of words in Word Lineup`;
      case 'phraseConstructor':
        return `Built ${score}% of phrases correctly`;
      case 'quizChallenge':
        return `Scored ${score} points in Quiz Challenge`;
      case 'aiLanguageBuddy':
        return 'Practiced conversation with AI Buddy';
      default:
        return `Completed ${activity} activity`;
    }
  };
  
  // Value object for the context
  const value = {
    userId,
    progress,
    userLevel,
    currentPath,
    vocabularyStats,
    recentActivities,
    updateProgress,
    addVocabulary
  };
  
  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};