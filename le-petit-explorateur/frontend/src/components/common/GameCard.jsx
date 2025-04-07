import React from 'react';
import { Link } from 'react-router-dom';

const GameCard = ({ title, description, path, icon, bgColor = 'bg-blue-600' }) => {
  return (
    <Link to={path} className="block">
      <div className={`${bgColor} rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow`}>
        <div className="flex items-center mb-4">
          {icon && <span className="text-2xl mr-3">{icon}</span>}
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <p className="text-gray-100">{description}</p>
      </div>
    </Link>
  );
};

export default GameCard;