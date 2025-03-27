import React, { createContext, useState, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getProgress, saveProgress } from '../services/storageService';
import { useChalkboard } from './ChalkboardContext';

// Create context
const ProgressContext = createContext();

// Custom hook to use the context
export const useProgress = () => useContext(ProgressContext);

// Provider component
export const ProgressProvider = ({ children }) => {
  const { playSound } = useChalkboard();
  
  // User ID (anonymous)
  const [userId, setUserId] = useState(null);
  
  // User level
  const [userLevel, setUserLevel] = useState('beginner');
  
  // Progress data
  const [progress, setProgress] = useState({
    xp: 0,
    level: 1,
    streak: 0,
    lastActivity: null,
    vocabularyLearned: [],
    lessonsCompleted: [],
    achievements: []
  });
  
  // Daily goals
  const [dailyGoals, setDailyGoals] = useState({
    xpTarget: 100,
    wordsTarget: 5,
    minutesTarget: 10,
    xpEarned: 0,
    wordsLearned: 0,
    minutesSpent: 0
  });
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize user ID and load progress
  useEffect(() => {
    const initializeUser = async () => {
      // Get or create user ID
      let storedUserId = localStorage.getItem('userId');
      if (!storedUserId) {
        storedUserId = uuidv4();
        localStorage.setItem('userId', storedUserId);
      }
      setUserId(storedUserId);
      
      // Load progress data
      const savedProgress = await getProgress(storedUserId);
      if (savedProgress) {
        setProgress(savedProgress.progress);
        setUserLevel(savedProgress.userLevel);
        
        // Update streak if needed
        const today = new Date().toDateString();
        const lastActivity = savedProgress.progress.lastActivity;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();
        
        if (lastActivity !== today) {
          if (lastActivity === yesterdayString) {
            // Continued streak
            updateStreak(savedProgress.progress.streak + 1);
          } else if (lastActivity && lastActivity !== today) {
            // Streak broken
            updateStreak(0);
          }
        }
      }
      
      // Load daily goals
      const storedDailyGoals = localStorage.getItem(`dailyGoals_${storedUserId}`);
      if (storedDailyGoals) {
        const parsedGoals = JSON.parse(storedDailyGoals);
        
        // Check if goals are from today
        const today = new Date().toDateString();
        if (parsedGoals.date === today) {
          setDailyGoals(parsedGoals);
        } else {
          // Reset daily goals for new day
          const newDailyGoals = {
            ...dailyGoals,
            xpEarned: 0,
            wordsLearned: 0,
            minutesSpent: 0,
            date: today
          };
          setDailyGoals(newDailyGoals);
          localStorage.setItem(`dailyGoals_${storedUserId}`, JSON.stringify(newDailyGoals));
        }
      } else {
        // Initialize daily goals
        const newDailyGoals = {
          ...dailyGoals,
          date: new Date().toDateString()
        };
        setDailyGoals(newDailyGoals);
        localStorage.setItem(`dailyGoals_${storedUserId}`, JSON.stringify(newDailyGoals));
      }
      
      setIsLoading(false);
    };
    
    initializeUser();
  }, []);
  
  // Save progress changes
  useEffect(() => {
    if (userId && !isLoading) {
      saveProgress(userId, { progress, userLevel });
      localStorage.setItem(`dailyGoals_${userId}`, JSON.stringify(dailyGoals));
    }
  }, [progress, userLevel, dailyGoals, userId, isLoading]);
  
  // Add XP points
  const addXP = (points) => {
    setProgress(prev => {
      // Calculate new XP and level
      const newXP = prev.xp + points;
      let newLevel = prev.level;
      
      // Level up thresholds (each level requires more XP)
      const xpForNextLevel = newLevel * 100;
      
      // Check if user leveled up
      let leveledUp = false;
      if (newXP >= prev.level * 100) {
        newLevel = Math.floor(newXP / 100) + 1;
        leveledUp = true;
        playSound('success');
      }
      
      // Update daily goals
      setDailyGoals(prev => ({
        ...prev,
        xpEarned: prev.xpEarned + points
      }));
      
      // If leveled up, add achievement
      let newAchievements = [...prev.achievements];
      if (leveledUp) {
        newAchievements.push({
          id: uuidv4(),
          type: 'level_up',
          name: `Reached Level ${newLevel}`,
          date: new Date().toISOString(),
          icon: 'level-up'
        });
      }
      
      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        lastActivity: new Date().toDateString(),
        achievements: newAchievements
      };
    });
  };
  
  // Add learned vocabulary
  const addVocabulary = (word, translation) => {
    setProgress(prev => {
      // Check if word already exists
      if (prev.vocabularyLearned.some(item => item.word === word)) {
        return prev;
      }
      
      // Add new vocabulary
      const newVocabulary = [
        ...prev.vocabularyLearned,
        {
          id: uuidv4(),
          word,
          translation,
          dateAdded: new Date().toISOString(),
          mastery: 1, // Initial mastery level (1-5)
          repetitions: 0
        }
      ];
      
      // Update daily goals
      setDailyGoals(prev => ({
        ...prev,
        wordsLearned: prev.wordsLearned + 1
      }));
      
      // Check for achievements
      let newAchievements = [...prev.achievements];
      const vocabularyCount = newVocabulary.length;
      
      // Vocabulary milestones
      const milestones = [10, 25, 50, 100, 200, 500];
      for (const milestone of milestones) {
        if (vocabularyCount === milestone && 
            !prev.achievements.some(a => a.name === `Learned ${milestone} Words`)) {
          newAchievements.push({
            id: uuidv4(),
            type: 'vocabulary',
            name: `Learned ${milestone} Words`,
            date: new Date().toISOString(),
            icon: 'book'
          });
          playSound('success');
          break;
        }
      }
      
      return {
        ...prev,
        vocabularyLearned: newVocabulary,
        achievements: newAchievements,
        lastActivity: new Date().toDateString()
      };
    });
  };
  
  // Complete lesson
  const completeLesson = (lessonType, lessonName, score, duration) => {
    setProgress(prev => {
      // Add completed lesson
      const newLessonsCompleted = [
        ...prev.lessonsCompleted,
        {
          id: uuidv4(),
          type: lessonType,
          name: lessonName,
          score,
          duration, // in seconds
          date: new Date().toISOString()
        }
      ];
      
      // Update minutes spent
      const minutesSpent = Math.floor(duration / 60);
      setDailyGoals(prev => ({
        ...prev,
        minutesSpent: prev.minutesSpent + minutesSpent
      }));
      
      // Check for achievements
      let newAchievements = [...prev.achievements];
      const lessonCount = newLessonsCompleted.length;
      
      // Lesson milestones
      const milestones = [5, 10, 25, 50, 100];
      for (const milestone of milestones) {
        if (lessonCount === milestone && 
            !prev.achievements.some(a => a.name === `Completed ${milestone} Lessons`)) {
          newAchievements.push({
            id: uuidv4(),
            type: 'lesson',
            name: `Completed ${milestone} Lessons`,
            date: new Date().toISOString(),
            icon: 'trophy'
          });
          playSound('success');
          break;
        }
      }
      
      // Check for streak achievements
      const streakMilestones = [3, 7, 14, 30, 60, 90];
      for (const milestone of streakMilestones) {
        if (prev.streak === milestone && 
            !prev.achievements.some(a => a.name === `${milestone}-Day Streak`)) {
          newAchievements.push({
            id: uuidv4(),
            type: 'streak',
            name: `${milestone}-Day Streak`,
            date: new Date().toISOString(),
            icon: 'fire'
          });
          playSound('success');
          break;
        }
      }
      
      return {
        ...prev,
        lessonsCompleted: newLessonsCompleted,
        achievements: newAchievements,
        lastActivity: new Date().toDateString()
      };
    });
  };
  
  // Update streak
  const updateStreak = (newStreak) => {
    setProgress(prev => ({
      ...prev,
      streak: newStreak,
      lastActivity: new Date().toDateString()
    }));
  };
  
  // Update user level
  const updateUserLevel = (level) => {
    setUserLevel(level);
  };
  
  // Update vocabulary mastery
  const updateVocabularyMastery = (wordId, masteryChange) => {
    setProgress(prev => {
      const updatedVocabulary = prev.vocabularyLearned.map(item => {
        if (item.id === wordId) {
          // Calculate new mastery level (clamped between 1-5)
          const newMastery = Math.max(1, Math.min(5, item.mastery + masteryChange));
          return {
            ...item,
            mastery: newMastery,
            repetitions: item.repetitions + 1,
            lastPracticed: new Date().toISOString()
          };
        }
        return item;
      });
      
      return {
        ...prev,
        vocabularyLearned: updatedVocabulary,
        lastActivity: new Date().toDateString()
      };
    });
  };
  
  // Set daily goals
  const setDailyGoalTargets = (xp, words, minutes) => {
    setDailyGoals(prev => ({
      ...prev,
      xpTarget: xp,
      wordsTarget: words,
      minutesTarget: minutes
    }));
  };
  
  // Reset progress (for testing)
  const resetProgress = () => {
    const defaultProgress = {
      xp: 0,
      level: 1,
      streak: 0,
      lastActivity: new Date().toDateString(),
      vocabularyLearned: [],
      lessonsCompleted: [],
      achievements: []
    };
    
    const defaultDailyGoals = {
      xpTarget: 100,
      wordsTarget: 5,
      minutesTarget: 10,
      xpEarned: 0,
      wordsLearned: 0,
      minutesSpent: 0,
      date: new Date().toDateString()
    };
    
    setProgress(defaultProgress);
    setDailyGoals(defaultDailyGoals);
    setUserLevel('beginner');
    
    saveProgress(userId, { progress: defaultProgress, userLevel: 'beginner' });
    localStorage.setItem(`dailyGoals_${userId}`, JSON.stringify(defaultDailyGoals));
  };
  
  // Value object for the context
  const value = {
    userId,
    progress,
    userLevel,
    dailyGoals,
    isLoading,
    addXP,
    addVocabulary,
    completeLesson,
    updateStreak,
    updateUserLevel,
    updateVocabularyMastery,
    setDailyGoalTargets,
    resetProgress
  };
  
  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};