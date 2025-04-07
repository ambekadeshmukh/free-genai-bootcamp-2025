import React from 'react';
import { useProgress } from '../../contexts/ProgressContext';

const ProgressTracker = () => {
  const { progress } = useProgress();

  return (
    <div className="fixed bottom-4 right-4 bg-slate-700 p-3 rounded-lg shadow-lg">
      <div className="text-white text-sm">
        <p>Progress Today: {progress?.daily || 0}%</p>
      </div>
    </div>
  );
};

export default ProgressTracker;