import React from 'react';
import { useProgress } from '../../contexts/ProgressContext';

const RecentActivity = () => {
  const { recentActivities } = useProgress();
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {recentActivities?.map((activity, index) => (
          <div key={index} className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="flex-grow">{activity.description}</span>
            <span className="text-gray-500">{activity.time}</span>
          </div>
        )) || (
          <p className="text-gray-500">No recent activities</p>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;