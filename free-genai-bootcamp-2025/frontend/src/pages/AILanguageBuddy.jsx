import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '../contexts/AIContext';
import { useProgress } from '../contexts/ProgressContext';
import { useChalkboard } from '../contexts/ChalkboardContext';
import ChatMessage from '../components/ai/ChatMessage';
import SuggestionChip from '../components/ai/SuggestionChip';
import apiService from '../services/apiService';

const AILanguageBuddy = () => {
  const { chatHistory, isLoadingChat, chatError, sendChatMessage, clearChatHistory } = useAI();
  const { userLevel, addXP } = useProgress();
  const { currentTheme, currentFontSize, playSound } = useChalkboard();
  
  const [message, setMessage] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(userLevel === 'beginner');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);
  
  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoadingChat) return;
    
    // Send message to AI
    await sendChatMessage(message);
    
    // Award XP for chat interaction
    addXP(5);
    
    // Clear input
    setMessage('');
    
    // Play sound
    playSound('notification');
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
    inputRef.current?.focus();
    playSound('click');
  };
  
  // Text-to-speech for AI messages
  const speakMessage = async (text, isAIMessage = true) => {
    try {
      setAudioPlaying(true);
      
      // For AI messages, use French voice. For user messages, use appropriate language
      const voice = isAIMessage ? 'female' : (text.match(/[àáâäæçèéêëìíîïòóôöùúûüÿ]/i) ? 'female' : 'male');
      
      // Get audio from API
      const audioData = await apiService.textToSpeech(text, voice);
      
      // Play audio
      const audio = new Audio(audioData);
      
      audio.onended = () => {
        setAudioPlaying(false);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing TTS:', error);
      setAudioPlaying(false);
    }
  };
  
// Get language buddy personality based on user level
const getBuddyPersonality = () => {
  switch (userLevel) {
    case 'beginner':
      return {
        name: 'Beka', // You can keep or change the name
        description: 'Patient teacher who speaks slowly and uses simple French with translations'
      };
    case 'intermediate':
      return {
        name: 'Sophie', // You can keep or change the name
        description: 'Encouraging tutor who uses natural French with occasional help in English'
      };
    case 'advanced':
      return {
        name: 'Marcel', // You can keep or change the name
        description: 'Native speaker who converses naturally in French about varied topics'
      };
    default:
      return {
        name: 'Beka',
        description: 'Patient teacher who speaks slowly and uses simple French with translations'
      };
  }
};
  
  const buddy = getBuddyPersonality();
  
  // Get the last AI message's suggestions
  const getLastSuggestions = () => {
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      const msg = chatHistory[i];
      if (msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0) {
        return msg.suggestions;
      }
    }
    return [];
  };
  
  const suggestions = getLastSuggestions();
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-blue-700 rounded-full p-2 mr-3">
              <span className="text-2xl">🇫🇷</span>
            </div>
            <div>
              <h1 className={`${currentFontSize.heading} font-bold text-white`}>
                AI Language Buddy
              </h1>
              <p className="text-blue-200 text-sm">
                Chat with {buddy.name}, your {userLevel} level French tutor
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              className={`p-2 rounded-full ${ttsEnabled ? 'bg-green-600' : 'bg-slate-600'}`}
              onClick={() => {
                setTtsEnabled(!ttsEnabled);
                playSound('click');
              }}
              aria-label={ttsEnabled ? 'Disable text-to-speech' : 'Enable text-to-speech'}
              title={ttsEnabled ? 'Disable text-to-speech' : 'Enable text-to-speech'}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d={ttsEnabled 
                    ? "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" 
                    : "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"} 
                />
                {!ttsEnabled && (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                )}
              </svg>
            </button>
            <button
              className={`p-2 rounded-full ${autoTranslate ? 'bg-green-600' : 'bg-slate-600'}`}
              onClick={() => {
                setAutoTranslate(!autoTranslate);
                playSound('click');
              }}
              aria-label={autoTranslate ? 'Disable auto-translation' : 'Enable auto-translation'}
              title={autoTranslate ? 'Disable auto-translation' : 'Enable auto-translation'}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" 
                />
              </svg>
            </button>
            <button
              className="p-2 bg-red-600 rounded-full hover:bg-red-700"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear the chat history?')) {
                  clearChatHistory();
                  playSound('click');
                }
              }}
              aria-label="Clear chat history"
              title="Clear chat history"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Chat messages */}
        <div className="bg-slate-700 p-4 h-96 overflow-y-auto">
          {chatHistory.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">👋</div>
              <p className="text-blue-200 mb-2">Welcome to your French conversation practice!</p>
              <p className="text-blue-300 text-sm">
                Start chatting with {buddy.name} to practice your French.
                {userLevel === 'beginner' && " Don't worry, translations are provided!"}
              </p>
            </div>
          ) : (
            chatHistory.map(msg => (
              <ChatMessage
                key={msg.id}
                message={msg}
                autoTranslate={autoTranslate}
                onSpeakClick={ttsEnabled ? speakMessage : null}
                isAudioPlaying={audioPlaying}
                userLevel={userLevel}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Suggested responses */}
        {suggestions.length > 0 && (
          <div className="bg-slate-800 p-3 flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <SuggestionChip
                key={index}
                text={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
              />
            ))}
          </div>
        )}
        
        {/* Error message */}
        {chatError && (
          <div className="bg-red-700 p-2 text-white text-sm text-center">
            {chatError}
          </div>
        )}
        
        {/* Input area */}
        <div className="bg-slate-900 p-4">
          <form onSubmit={handleSubmit} className="flex items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Type your message in ${userLevel === 'beginner' ? 'English or French' : 'French'}...`}
              className="flex-grow bg-slate-700 text-white rounded-l-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoadingChat}
              ref={inputRef}
            />
            <button
              type="submit"
              className={`bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg px-6 py-3 ${
                isLoadingChat ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoadingChat}
            >
              {isLoadingChat ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              )}
            </button>
          </form>
          <p className="text-slate-400 text-xs mt-2">
            {userLevel === 'beginner'
              ? 'Tip: Type in English or simple French. You’ll get translations to help you learn.'
              : userLevel === 'intermediate'
              ? 'Tip: Try to write in French as much as possible. Ask for help if needed.'
              : 'Tip: Challenge yourself with complex French sentences and idioms!'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AILanguageBuddy;