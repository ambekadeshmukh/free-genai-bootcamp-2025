import React from 'react';
import { useProgress } from '../../contexts/ProgressContext';

const ProgressSummary = () => {
  const { progress } = useProgress();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Learning Progress</h2>
      <div className="space-y-4">
        <div>
          <p className="text-gray-600">Daily Progress</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${progress?.daily || 0}%` }}
            ></div>
          </div>
        </div>
        <div>
          <p className="text-gray-600">Weekly Goals</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-500 h-2.5 rounded-full" 
              style={{ width: `${progress?.weekly || 0}%` }}
            ></div>
          </div>
        </div>
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>Games Completed: {progress?.gamesCompleted || 0}</span>
          <span>Streak: {progress?.streak || 0} days</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressSummary;