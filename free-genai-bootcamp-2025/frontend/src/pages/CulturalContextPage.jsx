import React, { useState, useEffect } from 'react';
import { useAI } from '../contexts/AIContext';
import { useProgress } from '../contexts/ProgressContext';
import { useChalkboard } from '../contexts/ChalkboardContext';
import CulturalCard from '../components/culture/CulturalCard';
import ThemeSelector from '../components/common/ThemeSelector';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CulturalContextPage = () => {
  const { generateCulturalContext, culturalContext, isLoadingContext, contextError } = useAI();
  const { userLevel, addXP } = useProgress();
  const { currentTheme, currentFontSize, playSound } = useChalkboard();
  
  // State for form inputs
  const [selectedTheme, setSelectedTheme] = useState('daily life');
  const [selectedVocabulary, setSelectedVocabulary] = useState('');
  const [vocabularyList, setVocabularyList] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Cultural themes
  const culturalThemes = [
    'daily life',
    'food and dining',
    'holidays and celebrations',
    'arts and entertainment',
    'education',
    'transportation',
    'shopping',
    'family',
    'work and business',
    'travel and tourism',
    'history',
    'sports and leisure'
  ];
  
  // Suggested vocabulary for each theme
  const suggestedVocabulary = {
    'daily life': ['bonjour', 'merci', 'au revoir', 'maison', 'dormir'],
    'food and dining': ['restaurant', 'café', 'pain', 'fromage', 'vin'],
    'holidays and celebrations': ['Noël', 'anniversaire', 'fête', 'cadeau'],
    'arts and entertainment': ['cinéma', 'théâtre', 'musique', 'peinture'],
    'education': ['école', 'université', 'étudiant', 'professeur'],
    'transportation': ['voiture', 'train', 'avion', 'métro', 'bus'],
    'shopping': ['magasin', 'acheter', 'prix', 'vêtements'],
    'family': ['famille', 'parent', 'enfant', 'frère', 'sœur'],
    'work and business': ['travail', 'bureau', 'entreprise', 'réunion'],
    'travel and tourism': ['vacances', 'hôtel', 'passeport', 'visite'],
    'history': ['histoire', 'guerre', 'révolution', 'monument'],
    'sports and leisure': ['sport', 'football', 'tennis', 'loisir', 'jeu']
  };
  
  // Update suggested vocabulary when theme changes
  useEffect(() => {
    setVocabularyList(suggestedVocabulary[selectedTheme] || []);
  }, [selectedTheme]);
  
  // Handle theme change
  const handleThemeChange = (theme) => {
    setSelectedTheme(theme);
    playSound('click');
  };
  
  // Handle vocabulary input
  const handleVocabularyChange = (e) => {
    setSelectedVocabulary(e.target.value);
  };
  
  // Add vocabulary to list
  const handleAddVocabulary = () => {
    if (selectedVocabulary.trim() && !vocabularyList.includes(selectedVocabulary.trim())) {
      setVocabularyList([...vocabularyList, selectedVocabulary.trim()]);
      setSelectedVocabulary('');
      playSound('click');
    }
  };
  
  // Remove vocabulary from list
  const handleRemoveVocabulary = (vocab) => {
    setVocabularyList(vocabularyList.filter(v => v !== vocab));
    playSound('click');
  };
  
  // Handle generate button click
  const handleGenerate = async () => {
    if (vocabularyList.length === 0) {
      alert('Please add at least one vocabulary word');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      await generateCulturalContext(vocabularyList, selectedTheme, userLevel);
      
      // Award XP for generating cultural context
      addXP(10);
      
      playSound('success');
    } catch (error) {
      console.error('Error generating cultural context:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6 text-center">
        <h1 className={`${currentFontSize.heading} font-bold text-white mb-2`}>
          Cultural Context Explorer
        </h1>
        <p className={`${currentFontSize.bodyText} text-blue-200 max-w-2xl mx-auto`}>
          Discover the cultural nuances behind French vocabulary. Learn how words are used in
          authentic French contexts.
        </p>
      </div>
      
      {/* Generation controls */}
      <div className="bg-slate-800 rounded-lg shadow-lg p-4 mb-8">
        <h2 className={`${currentFontSize.subheading} font-bold text-white mb-4`}>
          Generate New Cultural Context
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme selection */}
          <div>
            <label className="block text-blue-200 mb-2">Select a Theme</label>
            <ThemeSelector
              themes={culturalThemes}
              selectedTheme={selectedTheme}
              onSelectTheme={handleThemeChange}
            />
          </div>
          
          {/* Vocabulary input */}
          <div>
            <label className="block text-blue-200 mb-2">Add Vocabulary Words</label>
            <div className="flex">
              <input
                type="text"
                value={selectedVocabulary}
                onChange={handleVocabularyChange}
                placeholder="Enter a French word"
                className="flex-grow bg-slate-700 text-white rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddVocabulary}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg px-4 py-2"
              >
                Add
              </button>
            </div>
          </div>
        </div>
        
        {/* Vocabulary chips */}
        <div className="mt-4">
          <label className="block text-blue-200 mb-2">Selected Vocabulary</label>
          <div className="flex flex-wrap gap-2">
            {vocabularyList.length === 0 ? (
              <p className="text-slate-400 text-sm italic">
                No vocabulary selected. Add words or choose a theme for suggestions.
              </p>
            ) : (
              vocabularyList.map((vocab) => (
                <div
                  key={vocab}
                  className="bg-blue-700 text-white px-3 py-1 rounded-full text-sm flex items-center"
                >
                  <span>{vocab}</span>
                  <button
                    onClick={() => handleRemoveVocabulary(vocab)}
                    className="ml-2 text-blue-200 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Generate button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || vocabularyList.length === 0}
            className={`bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center ${
              isGenerating || vocabularyList.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Generate Context
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {contextError && (
        <div className="bg-red-700 text-white p-4 rounded-lg mb-6">
          <p>{contextError}</p>
        </div>
      )}
      
      {/* Cultural context cards */}
      <div className="grid grid-cols-1 gap-8">
        {isLoadingContext ? (
          <div className="flex justify-center items-center p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : culturalContext.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">🗼</div>
            <h3 className="text-xl font-bold text-white mb-2">No Cultural Contexts Yet</h3>
            <p className="text-blue-200 mb-4">
              Generate your first cultural context by selecting a theme and vocabulary above.
            </p>
          </div>
        ) : (
          culturalContext
            .slice()
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map((context) => (
              <CulturalCard key={context.id} context={context} />
            ))
        )}
      </div>
    </div>
  );
};

export default CulturalContextPage;