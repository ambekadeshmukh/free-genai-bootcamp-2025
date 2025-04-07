import React from 'react';
import { useProgress } from '../../contexts/ProgressContext';

const LearningPathCard = () => {
  const { userLevel, currentPath } = useProgress();

  const pathStages = [
    { name: 'Basics', level: 1 },
    { name: 'Daily Conversations', level: 2 },
    { name: 'Intermediate Grammar', level: 3 },
    { name: 'Advanced Topics', level: 4 }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Learning Path</h2>
      <div className="space-y-4">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="font-medium">Current Level: {userLevel}</p>
            <p className="text-sm text-gray-600">{currentPath?.name || 'Getting Started'}</p>
          </div>
        </div>
        <div className="space-y-2">
          {pathStages.map((stage, index) => (
            <div 
              key={index}
              className={`p-2 rounded ${userLevel >= stage.level ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
            >
              {stage.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearningPathCard;