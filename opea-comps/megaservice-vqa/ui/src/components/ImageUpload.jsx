import React, { useState, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const ImageUpload = ({ onWordDetected }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous errors
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Check if file is an image
      if (!file.type.match('image.*')) {
        setError('Please drop an image file');
        return;
      }
      
      setSelectedImage(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous errors
      setError(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleIdentify = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert image to base64 for sending
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        
        // Send to API
        const response = await axios.post(`${API_BASE_URL}/api/identify`, {
          image_data: base64Image
        });
        
        // Add image data to the response for context
        const result = {
          ...response.data,
          imageData: base64Image
        };
        
        // Pass result to parent component
        onWordDetected(result);
      };
      reader.readAsDataURL(selectedImage);
      
    } catch (err) {
      console.error('Error identifying image:', err);
      setError('Error identifying the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="image-upload-container">
      <h2>Upload an Image to Learn French</h2>
      <p>Take a photo or upload an image of an object to learn its French name and usage</p>
      
      {!imagePreview ? (
        <div 
          className="upload-area"
          onClick={handleUploadClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <span className="upload-icon">📷</span>
          <p className="upload-text">
            Click to upload or drag & drop an image here
          </p>
          <p className="upload-text-small">
            Supports JPG, PNG
          </p>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div className="upload-preview">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="preview-image"
          />
          
          <div className="action-buttons">
            <button 
              className="btn btn-secondary"
              onClick={handleClearImage}
              disabled={isLoading}
            >
              Clear
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleIdentify}
              disabled={isLoading}
            >
              {isLoading ? 'Identifying...' : 'Identify Object'}
            </button>
          </div>
        </div>
      )}
      
      {isLoading && <div className="loading-spinner"></div>}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="instructions">
        <h3>How it works:</h3>
        <ol>
          <li>Upload a clear image of a single object</li>
          <li>Our AI will identify the object and translate it to French</li>
          <li>Learn the French word and example sentences</li>
          <li>Chat with our AI tutor to practice your French</li>
          <li>Test your knowledge with fun quizzes</li>
        </ol>
      </div>
    </div>
  );
};

export default ImageUpload;