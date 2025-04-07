import React from 'react';
import { Link } from 'react-router-dom';
// Use the public logo192.png instead of logo.svg from assets
const logoPath = `${process.env.PUBLIC_URL}/logo192.png`;

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div className="flex flex-col">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-300 flex items-center justify-center mr-2">
                <img src={logoPath} alt="Le Petit Explorateur" className="w-8 h-8" />
              </div>
              <span className="text-lg font-bold">Le Petit Explorateur</span>
            </div>
            <p className="text-sm text-gray-400">
              Your interactive journey to learning French through fun and engaging activities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/games/daily-quick-learn" className="text-gray-400 hover:text-white transition-colors">
                  Daily Practice
                </Link>
              </li>
              <li>
                <Link to="/ai-language-buddy" className="text-gray-400 hover:text-white transition-colors">
                  AI Tutor
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://github.com/ambekadeshmukh/free-genai-bootcamp-2025" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            &copy; {currentYear} Le Petit Explorateur. All rights reserved.
          </div>
          <div className="px-3 py-1 bg-slate-800 rounded-full text-sm text-gray-400">
            Progress Today: 0%
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;