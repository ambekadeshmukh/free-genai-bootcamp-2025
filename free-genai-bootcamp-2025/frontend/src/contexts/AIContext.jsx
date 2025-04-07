import React, { createContext, useState, useContext, useEffect } from 'react';
import { useProgress } from './ProgressContext';
import { useChalkboard } from './ChalkboardContext';
import { getAI, saveAI } from '../services/storageService';
import apiService from '../services/apiService';

// Create context
const AIContext = createContext();

// Custom hook to use the context
export const useAI = () => useContext(AIContext);

// Provider component
export const AIProvider = ({ children }) => {
  const { userId, userLevel } = useProgress();
  const { showLoading, hideLoading } = useChalkboard();
  
  // Chat history state
  const [chatHistory, setChatHistory] = useState([]);
  
  // Learning path state
  const [learningPath, setLearningPath] = useState(null);
  
  // Cultural context state
  const [culturalContext, setCulturalContext] = useState([]);
  
  // Loading states
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isLoadingPath, setIsLoadingPath] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  
  // Error states
  const [chatError, setChatError] = useState(null);
  const [pathError, setPathError] = useState(null);
  const [contextError, setContextError] = useState(null);
  
  // Load AI data
  useEffect(() => {
    const loadAIData = async () => {
      if (!userId) return;
      
      const aiData = await getAI(userId);
      if (aiData) {
        setChatHistory(aiData.chatHistory || []);
        setLearningPath(aiData.learningPath || null);
        setCulturalContext(aiData.culturalContext || []);
      }
    };
    
    loadAIData();
  }, [userId]);
  
  // Save AI data when it changes
  useEffect(() => {
    if (!userId) return;
    
    const aiData = {
      chatHistory,
      learningPath,
      culturalContext
    };
    
    saveAI(userId, aiData);
  }, [userId, chatHistory, learningPath, culturalContext]);
  
  // Send chat message to AI
  const sendChatMessage = async (message) => {
    try {
      setIsLoadingChat(true);
      setChatError(null);
      showLoading();
      
      // Add user message to history
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      
      const updatedHistory = [...chatHistory, userMessage];
      setChatHistory(updatedHistory);
      
      // Prepare conversation history for API
      const conversationHistory = updatedHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Send to API
      const response = await apiService.chatWithAI(message, userLevel, conversationHistory);
      
      // Add AI response to history
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        suggestions: response.suggestions,
        timestamp: new Date().toISOString()
      };
      
      setChatHistory([...updatedHistory, aiMessage]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      setChatError('Failed to communicate with AI. Please try again.');
    } finally {
      setIsLoadingChat(false);
      hideLoading();
    }
  };
  
  // Clear chat history
  const clearChatHistory = () => {
    setChatHistory([]);
  };
  
  // Generate learning path
  const generateLearningPath = async (userGoals, timeAvailable) => {
    try {
      setIsLoadingPath(true);
      setPathError(null);
      showLoading();
      
      // Get user progress data
      const userProgress = {
        userId,
        level: userLevel,
        vocabCount: 0, // Get from progress context in real implementation
        completedLessons: 0 // Get from progress context in real implementation
      };
      
      // Send to API
      const response = await apiService.generateLearningPath(userProgress, userGoals, timeAvailable);
      
      setLearningPath(response);
      return response;
    } catch (error) {
      console.error('Error generating learning path:', error);
      setPathError('Failed to generate learning path. Please try again.');
      return null;
    } finally {
      setIsLoadingPath(false);
      hideLoading();
    }
  };
  
  // Generate cultural context
  const generateCulturalContext = async (vocabulary, theme, difficulty = userLevel) => {
    try {
      setIsLoadingContext(true);
      setContextError(null);
      showLoading();
      
      // Send to API
      const response = await apiService.generateCulturalContext(vocabulary, theme, difficulty);
      
      // Add to cultural context collection
      const newContext = {
        id: Date.now().toString(),
        vocabulary,
        theme,
        difficulty,
        text: response.text,
        image: response.image,
        timestamp: new Date().toISOString()
      };
      
      setCulturalContext([...culturalContext, newContext]);
      return newContext;
    } catch (error) {
      console.error('Error generating cultural context:', error);
      setContextError('Failed to generate cultural context. Please try again.');
      return null;
    } finally {
      setIsLoadingContext(false);
      hideLoading();
    }
  };
  
  // Generate vocabulary
  const generateVocabulary = async (theme, difficulty = userLevel, count = 10) => {
    try {
      showLoading();
      
      // Send to API
      const response = await apiService.generateContent('vocabulary', theme, difficulty, count);
      
      return response;
    } catch (error) {
      console.error('Error generating vocabulary:', error);
      return null;
    } finally {
      hideLoading();
    }
  };
  
  // Generate phrases
  const generatePhrases = async (theme, difficulty = userLevel, count = 5) => {
    try {
      showLoading();
      
      // Send to API
      const response = await apiService.generateContent('phrases', theme, difficulty, count);
      
      return response;
    } catch (error) {
      console.error('Error generating phrases:', error);
      return null;
    } finally {
      hideLoading();
    }
  };
  
  // Generate grammar explanation
  const generateGrammarExplanation = async (grammarTopic, difficulty = userLevel) => {
    try {
      showLoading();
      
      // Send to API
      const response = await apiService.generateContent('grammar', grammarTopic, difficulty, 1);
      
      return response;
    } catch (error) {
      console.error('Error generating grammar explanation:', error);
      return null;
    } finally {
      hideLoading();
    }
  };
  
  // Generate game scene
  const generateGameScene = async (theme, targetWords, difficulty = userLevel) => {
    try {
      showLoading();
      
      // Send to API
      const response = await apiService.generateGameScene(theme, targetWords, difficulty);
      
      return response;
    } catch (error) {
      console.error('Error generating game scene:', error);
      return null;
    } finally {
      hideLoading();
    }
  };
  
  // Value object for the context
  const value = {
    chatHistory,
    learningPath,
    culturalContext,
    isLoadingChat,
    isLoadingPath,
    isLoadingContext,
    chatError,
    pathError,
    contextError,
    sendChatMessage,
    clearChatHistory,
    generateLearningPath,
    generateCulturalContext,
    generateVocabulary,
    generatePhrases,
    generateGrammarExplanation,
    generateGameScene
  };
  
  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};