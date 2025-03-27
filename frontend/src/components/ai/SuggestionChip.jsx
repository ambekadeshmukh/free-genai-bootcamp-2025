import React from 'react';
import PropTypes from 'prop-types';

const SuggestionChip = ({ text, onClick }) => {
  return (
    <button
      className="bg-blue-700 hover:bg-blue-600 text-blue-100 px-3 py-1.5 rounded-full text-sm transition-colors"
      onClick={() => onClick(text)}
    >
      {text}
    </button>
  );
};

SuggestionChip.propTypes = {
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

export default SuggestionChip;