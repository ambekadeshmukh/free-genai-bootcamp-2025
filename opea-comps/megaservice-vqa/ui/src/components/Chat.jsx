import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const Chat = ({ sessionData, updateSession, onGenerateQuiz }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [newImage, setNewImage] = useState(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [sessionData.chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && !newImage) {
      return;
    }
    
    // Add user message to chat history
    const userMessage = {
      sender: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    updateSession({
      chatHistory: [...sessionData.chatHistory, userMessage]
    });
    
    setIsLoading(true);
    setError(null);
    
    try {
      let imageData = null;
      
      // If there's a new image, process it
      if (newImage) {
        const reader = new FileReader();
        imageData = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(newImage);
        });
      }
      
      // Send to API
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: message,
        image_data: imageData || null,
        context: {
          ...sessionData.learningContext,
          current_word: sessionData.currentWord,
          french_word: sessionData.frenchWord
        }
      });
      
      // Add bot response to chat history
      const botMessage = {
        sender: 'bot',
        content: response.data.response,
        timestamp: new Date().toISOString()
      };
      
      updateSession({
        chatHistory: [...sessionData.chatHistory, userMessage, botMessage]
      });
      
      // Clear message input and any uploaded image
      setMessage('');
      setNewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Error communicating with the tutor. Please try again.');
      
      // Add error message to chat
      const errorMessage = {
        sender: 'bot',
        content: 'Sorry, I had trouble understanding. Could you try again?',
        timestamp: new Date().toISOString()
      };
      
      updateSession({
        chatHistory: [...sessionData.chatHistory, userMessage, errorMessage]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
    }
  };
  
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>French Language Tutor</h2>
        {sessionData.frenchWord && (
          <div className="current-word">
            Currently learning: <strong>{sessionData.frenchWord}</strong> ({sessionData.currentWord})
          </div>
        )}
      </div>
      
      <div className="chat-messages">
        {/* Welcome message if no messages yet */}
        {sessionData.chatHistory.length === 0 && (
          <div className="message bot">
            <div className="message-content">
              Bonjour! I'm your French language tutor. How can I help you learn French today?
              {sessionData.frenchWord && (
                <div>
                  I see you're learning the word "{sessionData.frenchWord}" ({sessionData.currentWord}).
                  Ask me anything about it!
                </div>
              )}
            </div>
            <div className="message-time">{formatTime(new Date())}</div>
          </div>
        )}
        
        {/* Render chat history */}
        {sessionData.chatHistory.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <div className="message-content">{msg.content}</div>
            <div className="message-time">{formatTime(msg.timestamp)}</div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="message bot loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Display example sentences */}
      {sessionData.examples && sessionData.examples.length > 0 && (
        <div className="examples-container">
          <div className="examples-title">Example Sentences:</div>
          {sessionData.examples.map((example, index) => (
            <div key={index} className="example-item">
              <div className="french-text">{example.fr}</div>
              <div className="english-text">{example.en}</div>
            </div>
          ))}
        </div>
      )}
      
      {/* Input form */}
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <div className="chat-input">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button 
            type="button" 
            className="btn-upload"
            onClick={() => fileInputRef.current.click()}
            disabled={isLoading}
          >
            📷
          </button>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <button 
            type="submit" 
            disabled={isLoading || (!message.trim() && !newImage)}
          >
            Send
          </button>
        </div>
        
        {newImage && (
          <div className="image-preview">
            <span>Image attached</span>
            <button type="button" onClick={() => setNewImage(null)}>✕</button>
          </div>
        )}
      </form>
      
      {/* Action buttons */}
      <div className="chat-actions">
        {sessionData.frenchWord && (
          <button 
            className="btn btn-primary"
            onClick={onGenerateQuiz}
          >
            Practice with Quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default Chat;