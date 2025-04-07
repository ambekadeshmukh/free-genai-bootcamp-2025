import React from 'react';
import PropTypes from 'prop-types';

const Loading = ({ message, size }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className={`animate-spin rounded-full h-${size} w-${size} border-b-2 border-t-2 border-blue-500 mb-4`}></div>
      <p className="text-slate-600">{message || 'Loading...'}</p>
    </div>
  );
};

Loading.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['8', '10', '12', '16'])
};

Loading.defaultProps = {
  message: 'Loading...',
  size: '12'
};

export default Loading;