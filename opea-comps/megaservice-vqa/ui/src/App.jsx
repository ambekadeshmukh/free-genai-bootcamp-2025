import React, { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import Chat from './components/Chat';
import Quiz from './components/Quiz';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [sessionData, setSessionData] = useState({
    currentWord: '',
    frenchWord: '',
    examples: [],
    imageData: null,
    chatHistory: [],
    learningContext: {
      learning_french: true,
      level: 'beginner'
    }
  });

  // Function to update session data
  const updateSession = (newData) => {
    setSessionData(prev => ({
      ...prev,
      ...newData
    }));
  };

  // Function to handle word detection from image
  const handleWordDetected = (data) => {
    updateSession({
      currentWord: data.object,
      frenchWord: data.french_word,
      examples: data.examples,
      imageData: data.imageData // Keep the image data for context
    });
    
    // Add to chat history
    const newMessage = {
      sender: 'bot',
      content: `The object in your image is "${data.object}" which in French is "${data.french_word}".`,
      timestamp: new Date().toISOString()
    };
    
    updateSession(prev => ({
      chatHistory: [...prev.chatHistory, newMessage]
    }));
    
    // Switch to chat tab automatically
    setActiveTab('chat');
  };

  // Generate quiz for current word
  const handleGenerateQuiz = () => {
    if (sessionData.frenchWord) {
      setActiveTab('quiz');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🇫🇷 French Learning Adventure</h1>
        <p>Upload images, chat in French, take quizzes, and learn together!</p>
      </header>
      
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <span className="tab-icon">📷</span> Upload Image
        </button>
        <button 
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <span className="tab-icon">💬</span> Chat
        </button>
        <button 
          className={`tab-button ${activeTab === 'quiz' ? 'active' : ''}`}
          onClick={() => setActiveTab('quiz')}
          disabled={!sessionData.frenchWord}
        >
          <span className="tab-icon">🎮</span> Quiz
        </button>
      </div>
      
      <main className="content-area">
        {activeTab === 'upload' && (
          <ImageUpload onWordDetected={handleWordDetected} />
        )}
        
        {activeTab === 'chat' && (
          <Chat 
            sessionData={sessionData}
            updateSession={updateSession}
            onGenerateQuiz={handleGenerateQuiz}
          />
        )}
        
        {activeTab === 'quiz' && (
          <Quiz 
            word={sessionData.frenchWord}
            englishWord={sessionData.currentWord} 
            difficulty={sessionData.learningContext.level}
            updateSession={updateSession}
          />
        )}
      </main>
      
      <footer className="app-footer">
        <p>Created with ❤️ using OPEA MegaService for GenAI Bootcamp</p>
      </footer>
    </div>
  );
}

export default App;