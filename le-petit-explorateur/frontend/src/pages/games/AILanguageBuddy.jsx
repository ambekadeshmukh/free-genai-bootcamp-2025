import React, { useState, useEffect, useRef } from 'react';
import { useProgress } from '../../contexts/ProgressContext';
import { useChalkboard } from '../../contexts/ChalkboardContext';
import apiService from '../../services/apiService';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AILanguageBuddy = () => {
  const { updateProgress } = useProgress();
  const { playSound } = useChalkboard();
  
  // State variables
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userLevel, setUserLevel] = useState('beginner');
  const [conversationTopic, setConversationTopic] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showIntro, setShowIntro] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Conversation topics
  const conversationTopics = [
    { id: 'greetings', name: 'Basic Greetings', prompt: 'Teach me how to greet people in French' },
    { id: 'introduce', name: 'Introducing Yourself', prompt: 'How do I introduce myself in French?' },
    { id: 'restaurant', name: 'At the Restaurant', prompt: 'Help me practice ordering food in a French restaurant' },
    { id: 'directions', name: 'Asking for Directions', prompt: 'How do I ask for directions in French?' },
    { id: 'shopping', name: 'Shopping Conversation', prompt: 'I want to practice shopping conversation in French' },
    { id: 'weather', name: 'Talking About Weather', prompt: 'Let\'s talk about the weather in French' }
  ];

  useEffect(() => {
    // Scroll to bottom of chat when messages update
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message = inputMessage, isTopicStarter = false) => {
    if (!message.trim()) return;
    
    if (playSound) playSound('click');
    
    // Clear any previous errors
    setError(null);
    setLoading(true);
    setIsTyping(true);
    
    try {
      // Add user message to chat
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInputMessage('');
      
      // Get conversation history for context, but limit to recent messages
      const conversationHistory = isTopicStarter 
        ? [] 
        : messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
          }));
      
      // Send message to AI Buddy using the improved API service
      const response = await apiService.chatWithAI(message, userLevel, conversationHistory);
      
      if (!response || !response.response) {
        throw new Error('Invalid response from AI service');
      }
      
      // Get AI response and suggestions
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      };
      
      // Add AI response to chat
      setMessages(prevMessages => [...prevMessages, aiResponse]);
      
      // Update conversation suggestions
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }
      
      // Update progress
      updateProgress({
        type: 'LANGUAGE_BUDDY_INTERACTION',
        payload: {
          messagesSent: 1
        }
      });
    } catch (error) {
      console.error('Error sending message to AI Buddy:', error);
      setError('Sorry, I had trouble connecting to the language service. Please try again.');
    } finally {
      setIsTyping(false);
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const handleTopicSelect = (topic) => {
    setConversationTopic(topic.id);
    setShowIntro(false);
    
    // Start conversation with the selected topic
    handleSendMessage(topic.prompt, true);
  };

  const handleLevelChange = (e) => {
    setUserLevel(e.target.value);
  };

  const startNewConversation = () => {
    if (playSound) playSound('click');
    setMessages([]);
    setConversationTopic('');
    setShowIntro(true);
    setSuggestions([]);
    setError(null);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">AI Language Buddy</h1>
        <p className="text-lg text-slate-600">Practice French conversation with your AI tutor</p>
      </div>

      {error && (
        <ErrorMessage message={error} />
      )}

      {loading && showIntro && (
        <Loading message="Preparing conversation assistant..." />
      )}

      {showIntro && !loading ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-center text-slate-800">Start a Conversation</h2>
          
          <div className="mb-6">
            <label className="block mb-2 font-medium text-slate-700">Your French Level:</label>
            <select 
              value={userLevel}
              onChange={handleLevelChange}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          
          <div className="mb-6">
            <h3 className="font-bold mb-3 text-slate-800">Choose a Conversation Topic:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conversationTopics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic)}
                  className="p-4 rounded-lg text-left transition-transform hover:scale-105 bg-blue-50 border border-blue-200 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="font-bold block mb-1 text-slate-800">{topic.name}</span>
                  <span className="text-sm text-slate-600">{topic.prompt}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center p-4 rounded-lg bg-yellow-50 border border-yellow-200 mb-6">
            <div className="text-3xl mr-4" role="img" aria-label="tip">💡</div>
            <div>
              <p className="font-bold mb-1 text-slate-800">Pro Tip</p>
              <p className="text-sm text-slate-600">Your AI buddy will adapt to your level. Feel free to ask for translations or explanations if needed!</p>
            </div>
          </div>
        </div>
      ) : !showIntro && (
        <>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 mr-2">
                <span className="text-red-700 font-bold">AB</span>
              </div>
              <div>
                <h2 className="font-bold text-slate-800">AI Buddy</h2>
                <p className="text-xs text-slate-500">French Tutor</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="text-sm mr-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Level: {userLevel}</span>
              <button 
                onClick={startNewConversation}
                className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                New Topic
              </button>
            </div>
          </div>
          
          <div className="chat-container bg-white rounded-lg shadow-lg flex flex-col h-[70vh]">
            <div className="chat-messages flex-1 overflow-y-auto p-4 bg-slate-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-center text-slate-500">Start the conversation by sending a message</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div 
                    key={message.id || index} 
                    className={`mb-4 max-w-3/4 ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}
                  >
                    <div 
                      className={`p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-100 text-slate-800 rounded-br-none'
                          : 'bg-green-100 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      {message.content}
                    </div>
                    <div className="text-xs mt-1 text-slate-500">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
              {isTyping && (
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-green-100 text-slate-800 rounded-bl-none">
                    <div className="typing-indicator flex space-x-1">
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {suggestions.length > 0 && (
              <div className="suggestions-container p-2 overflow-x-auto whitespace-nowrap bg-slate-100 border-t border-slate-200">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="inline-block px-3 py-2 mr-2 bg-white border border-slate-300 rounded-full text-sm whitespace-normal hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            
            <div className="chat-input p-3 bg-white border-t border-slate-200">
              <form onSubmit={handleSubmit} className="flex items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message in French or English..."
                  className="flex-1 p-2 border border-slate-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isTyping || loading}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isTyping || loading || !inputMessage.trim()}
                >
                  {isTyping || loading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    'Send'
                  )}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AILanguageBuddy;