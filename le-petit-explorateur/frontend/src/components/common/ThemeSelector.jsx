import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useChalkboard } from '../../contexts/ChalkboardContext';

const ThemeSelector = ({ themes, selectedTheme, onSelectTheme }) => {
  const { playSound } = useChalkboard();
  const [isOpen, setIsOpen] = useState(false);
  
  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    playSound('click');
  };
  
  // Handle theme selection
  const handleSelect = (theme) => {
    onSelectTheme(theme);
    setIsOpen(false);
  };
  
  // Get theme display name
  const getDisplayName = (theme) => {
    return theme.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 flex justify-between items-center"
      >
        <span>{getDisplayName(selectedTheme)}</span>
        <svg
          className={`w-5 h-5 transform ${isOpen ? 'rotate-180' : ''}`}
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
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <ul>
            {themes.map((theme) => (
              <li key={theme}>
                <button
                  onClick={() => handleSelect(theme)}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-700 ${
                    selectedTheme === theme ? 'bg-blue-700 text-white' : 'text-blue-100'
                  }`}
                >
                  {getDisplayName(theme)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

ThemeSelector.propTypes = {
  themes: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedTheme: PropTypes.string.isRequired,
  onSelectTheme: PropTypes.func.isRequired
};

export default ThemeSelector;