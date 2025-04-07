import React from 'react';
import { useProgress } from '../../contexts/ProgressContext';

const VocabularySection = () => {
  const { vocabularyStats } = useProgress();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Vocabulary Progress</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-3xl font-bold text-blue-600">
            {vocabularyStats?.wordsLearned || 0}
          </p>
          <p className="text-sm text-gray-600">Words Learned</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-3xl font-bold text-green-600">
            {vocabularyStats?.mastered || 0}
          </p>
          <p className="text-sm text-gray-600">Words Mastered</p>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <p className="text-3xl font-bold text-yellow-600">
            {vocabularyStats?.reviewing || 0}
          </p>
          <p className="text-sm text-gray-600">Under Review</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-3xl font-bold text-purple-600">
            {vocabularyStats?.streak || 0}
          </p>
          <p className="text-sm text-gray-600">Day Streak</p>
        </div>
      </div>
    </div>
  );
};

export default VocabularySection;