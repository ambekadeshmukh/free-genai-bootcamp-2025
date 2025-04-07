import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useChalkboard } from '../../contexts/ChalkboardContext';
import { useProgress } from '../../contexts/ProgressContext';
import apiService from '../../services/apiService';

const CulturalCard = ({ context }) => {
  const { currentFontSize, playSound } = useChalkboard();
  const { addVocabulary } = useProgress();
  
  const [expanded, setExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Format date
  const formattedDate = new Date(context.timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  // Toggle expanded state
  const toggleExpand = () => {
    setExpanded(!expanded);
    playSound('click');
  };
  
  // Handle text-to-speech
  const handleSpeak = async (text) => {
    try {
      setIsPlaying(true);
      const audioData = await apiService.textToSpeech(text, 'female');
      const audio = new Audio(audioData);
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing TTS:', error);
      setIsPlaying(false);
    }
  };
  
  // Handle saving vocabulary
  const handleSaveVocabulary = (word) => {
    // Get English translation from context
    const wordInfo = context.text.contextDetails.vocabulary.find(v => v.french === word);
    if (wordInfo) {
      addVocabulary(word, wordInfo.english);
      playSound('notification');
    }
  };
  
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-900 p-4 flex justify-between items-center">
        <div>
          <h3 className={`${currentFontSize.subheading} font-bold text-white`}>
            {context.theme.charAt(0).toUpperCase() + context.theme.slice(1)}
          </h3>
          <p className="text-blue-200 text-sm">
            {context.vocabulary.join(', ')}
          </p>
        </div>
        <div className="text-blue-200 text-sm">{formattedDate}</div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Image */}
        {context.image && (
          <div className="mb-4">
            <img
              src={context.image.imageData}
              alt={context.theme}
              className="w-full rounded-lg"
            />
          </div>
        )}
        
        {/* Summary */}
        <div className="mb-4">
          <h4 className="text-white font-bold mb-2">Summary</h4>
          <p className="text-blue-100">{context.text.summary}</p>
        </div>
        
        {/* Cultural Explanation */}
        <div className="mb-4">
          <h4 className="text-white font-bold mb-2">Cultural Context</h4>
          <p className="text-blue-100">{context.text.culturalExplanation}</p>
        </div>
        
        {/* Vocabulary */}
        <div className="mb-4">
          <h4 className="text-white font-bold mb-2">Vocabulary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {context.text.contextDetails.vocabulary.map((word) => (
              <div key={word.french} className="bg-slate-700 p-3 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <span className="text-white font-bold">{word.french}</span>
                    <span className="text-blue-300 ml-2">— {word.english}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSpeak(word.french)}
                      disabled={isPlaying}
                      className="text-blue-300 hover:text-white"
                      title="Listen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleSaveVocabulary(word.french)}
                      className="text-blue-300 hover:text-white"
                      title="Save to vocabulary"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                {word.example && (
                  <p className="text-blue-200 text-sm mt-2">
                    "{word.example}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Expandable content */}
        <div>
          <button
            onClick={toggleExpand}
            className="flex items-center text-blue-300 hover:text-white"
          >
            <span className="mr-2">{expanded ? 'Show less' : 'Show more details'}</span>
            <svg
              className={`w-5 h-5 transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          
          {expanded && (
            <div className="mt-4 border-t border-slate-600 pt-4">
              {/* Regional Variations */}
              {context.text.regionalVariations && (
                <div className="mb-4">
                  <h4 className="text-white font-bold mb-2">Regional Variations</h4>
                  <p className="text-blue-100">{context.text.regionalVariations}</p>
                </div>
              )}
              
              {/* Related Concepts */}
              {context.text.relatedConcepts && (
                <div className="mb-4">
                  <h4 className="text-white font-bold mb-2">Related Cultural Concepts</h4>
                  <p className="text-blue-100">{context.text.relatedConcepts}</p>
                </div>
              )}
              
              {/* Interesting Facts */}
              {context.text.interestingFacts && (
                <div className="mb-4">
                  <h4 className="text-white font-bold mb-2">Interesting Facts</h4>
                  <p className="text-blue-100">{context.text.interestingFacts}</p>
                </div>
              )}
              
              {/* Cultural Tips */}
              {context.text.culturalTips && (
                <div className="mb-4">
                  <h4 className="text-white font-bold mb-2">Cultural Tips</h4>
                  <p className="text-blue-100">{context.text.culturalTips}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

CulturalCard.propTypes = {
  context: PropTypes.shape({
    id: PropTypes.string.isRequired,
    vocabulary: PropTypes.arrayOf(PropTypes.string).isRequired,
    theme: PropTypes.string.isRequired,
    difficulty: PropTypes.string.isRequired,
    text: PropTypes.object.isRequired,
    image: PropTypes.object,
    timestamp: PropTypes.string.isRequired
  }).isRequired
};

export default CulturalCard;