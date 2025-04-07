import React from 'react';
import { useProgress } from '../../contexts/ProgressContext';

const DailyGoals = () => {
  const { progress } = useProgress();
  const goals = [
    { id: 1, title: 'Complete 3 Games', target: 3, current: progress?.gamesCompleted || 0 },
    { id: 2, title: 'Learn New Words', target: 5, current: progress?.newWordsLearned || 0 },
    { id: 3, title: 'Practice Speaking', target: 1, current: progress?.speakingExercises || 0 }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Daily Goals</h2>
      <div className="space-y-4">
        {goals.map(goal => (
          <div key={goal.id} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{goal.title}</span>
              <span>{goal.current}/{goal.target}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyGoals;