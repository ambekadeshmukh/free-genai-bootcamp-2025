import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// Use the public logo192.png instead of logo.svg from assets
const logoPath = `${process.env.PUBLIC_URL}/logo192.png`;

const Header = () => {
  const location = useLocation();
  
  // Navigation items - simplified to only what's needed

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/games/image-word-match', label: 'Image Word Match' }, // Changed from Word Lineup
  { path: '/games/phrase-constructor', label: 'Phrase Builder' },
  { path: '/games/daily-quick-learn', label: 'Daily Learn' },
  { path: '/games/quiz-challenge', label: 'Quiz Challenge' },
  { path: '/ai-language-buddy', label: 'AI Buddy' }
];
  
  return (
    <header className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-yellow-300 flex items-center justify-center">
              <img src={logoPath} alt="Le Petit Explorateur" className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-sm font-semibold text-blue-300">FR</span>
                <span className="text-lg font-bold">Le Petit Explorateur</span>
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-blue-700 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;