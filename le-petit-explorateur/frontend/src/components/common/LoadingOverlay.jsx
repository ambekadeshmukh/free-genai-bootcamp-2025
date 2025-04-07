import React from 'react';

const LoadingOverlay = ({ colors }) => {
  const defaultColors = {
    yellow: '#FFF4A3',
    red: '#FF8B8B',
    green: '#ABEBC6',
    blue: '#87CEEB',
    darkText: '#4A4A4A'
  };
  
  // Use provided colors or defaults
  const themeColors = colors || defaultColors;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="logo-container mb-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full flex items-center justify-center" 
            style={{ backgroundColor: themeColors.yellow + '80' }}>
            <div className="w-24 h-24 rounded-full" 
              style={{ 
                backgroundColor: themeColors.red + '80',
                position: 'absolute',
                top: '-10%',
                right: '-10%',
                zIndex: -1
              }}></div>
            <div className="w-24 h-24 rounded-full" 
              style={{ 
                backgroundColor: themeColors.green + '80',
                position: 'absolute',
                bottom: '-10%',
                left: '-10%',
                zIndex: -1
              }}></div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" 
              style={{ backgroundColor: themeColors.blue + '40' }}>
              <span className="text-3xl">🐝</span>
            </div>
          </div>
        </div>
      </div>
      
      <h1 className="text-3xl font-bold mb-4" style={{ color: themeColors.darkText }}>
        Le Petit Explorateur
      </h1>
      
      <div className="loading-dots flex space-x-3">
        <div className="loading-dot w-4 h-4 rounded-full" style={{ backgroundColor: themeColors.red }}></div>
        <div className="loading-dot w-4 h-4 rounded-full" style={{ backgroundColor: themeColors.yellow }}></div>
        <div className="loading-dot w-4 h-4 rounded-full" style={{ backgroundColor: themeColors.green }}></div>
        <div className="loading-dot w-4 h-4 rounded-full" style={{ backgroundColor: themeColors.blue }}></div>
      </div>
      
      <p className="mt-4 text-center" style={{ color: themeColors.darkText }}>
        Loading your French learning adventure...
      </p>
      
      <style jsx>{`
        .loading-dot {
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .loading-dot:nth-child(1) {
          animation-delay: -0.32s;
        }
        .loading-dot:nth-child(2) {
          animation-delay: -0.16s;
        }
        .loading-dot:nth-child(4) {
          animation-delay: 0.16s;
        }
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingOverlay;