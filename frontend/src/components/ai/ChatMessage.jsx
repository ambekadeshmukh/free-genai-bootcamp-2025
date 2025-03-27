import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useChalkboard } from '../../contexts/ChalkboardContext';
import apiService from '../../services/apiService';

const ChatMessage = ({
  message,
  autoTranslate,
  onSpeakClick,
  isAudioPlaying,
  userLevel
}) => {
  const { currentFontSize } = useChalkboard();
  const [translation, setTranslation] = useState('');
  const [showTranslation, setShowTranslation] = useState(autoTranslate);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const isAI = message.role === 'assistant';
  
  // Format timestamp
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Auto-translate AI messages for beginners
  useEffect(() => {
    const translateMessage = async () => {
      // Only translate AI messages and only if translation is enabled or user is beginner
      if (isAI && (autoTranslate || userLevel === 'beginner') && !translation) {
        try {
          setIsTranslating(true);
          const sourceLang = 'fr';
          const targetLang = 'en';
          const translated = await apiService.translateText(message.content, sourceLang, targetLang);
          setTranslation(translated);
        } catch (error) {
          console.error('Translation error:', error);
          setTranslation('Translation failed');
        } finally {
          setIsTranslating(false);
        }
      }
    };
    
    translateMessage();
  }, [isAI, message.content, autoTranslate, userLevel, translation]);
  
  // Update showTranslation when autoTranslate changes
  useEffect(() => {
    setShowTranslation(autoTranslate);
  }, [autoTranslate]);
  
  // Handle manual translation for user messages
  const handleTranslateClick = async () => {
    if (translation) {
      // Toggle translation visibility if we already have it
      setShowTranslation(!showTranslation);
    } else {
      // Translate the message
      try {
        setIsTranslating(true);
        
        // Detect language and translate accordingly
        const containsFrench = /[àáâäæçèéêëìíîïòóôöùúûüÿ]/i.test(message.content);
        const sourceLang = containsFrench ? 'fr' : 'en';
        const targetLang = containsFrench ? 'en' : 'fr';
        
        const translated = await apiService.translateText(message.content, sourceLang, targetLang);
        setTranslation(translated);
        setShowTranslation(true);
      } catch (error) {
        console.error('Translation error:', error);
        setTranslation('Translation failed');
        setShowTranslation(true);
      } finally {
        setIsTranslating(false);
      }
    }
  };
  
  return (
    <div className={`mb-4 ${isAI ? 'pr-12' : 'pl-12'}`}>
      <div className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
        <div
          className={`rounded-lg p-3 max-w-[85%] ${
            isAI ? 'bg-blue-900 text-white' : 'bg-blue-600 text-white'
          }`}
        >
          <div className={`${currentFontSize.bodyText}`}>
            {message.content}
          </div>
          
          {/* Translation */}
          {translation && showTranslation && (
            <div className="mt-2 pt-2 border-t border-gray-600 text-blue-200 text-sm">
              {translation}
            </div>
          )}
          
          {/* Message actions */}
          <div className="mt-2 flex justify-between items-center text-xs text-blue-300">
            <span>{formattedTime}</span>
            <div className="flex space-x-2">
              {/* Translation button */}
              <button
                onClick={handleTranslateClick}
                disabled={isTranslating}
                className={`p-1 rounded hover:bg-blue-800 ${
                  isTranslating ? 'opacity-50 cursor-wait' : ''
                }`}
                title={showTranslation ? 'Hide translation' : 'Show translation'}
              >
                {isTranslating ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                )}
              </button>
              
              {/* Text-to-speech button */}
              {onSpeakClick && (
                <button
                  onClick={() => onSpeakClick(message.content, isAI)}
                  disabled={isAudioPlaying}
                  className={`p-1 rounded hover:bg-blue-800 ${
                    isAudioPlaying ? 'opacity-50 cursor-wait' : ''
                  }`}
                  title="Listen"
                >
                  {isAudioPlaying ? (
                    <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ChatMessage.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired
  }).isRequired,
  autoTranslate: PropTypes.bool,
  onSpeakClick: PropTypes.func,
  isAudioPlaying: PropTypes.bool,
  userLevel: PropTypes.string
};

ChatMessage.defaultProps = {
  autoTranslate: false,
  onSpeakClick: null,
  isAudioPlaying: false,
  userLevel: 'beginner'
};

export default ChatMessage;