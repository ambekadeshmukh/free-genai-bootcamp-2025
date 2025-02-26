import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const Quiz = ({ word, englishWord, difficulty, updateSession }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadQuiz();
  }, [word, difficulty]);

  const loadQuiz = async () => {
    setIsLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentQuestion(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizCompleted(false);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/quiz`, {
        word: word,
        difficulty: difficulty
      });
      
      setQuestions(response.data.questions || []);
    } catch (err) {
      console.error('Error loading quiz:', err);
      setError('Failed to load quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (optionIndex) => {
    if (isAnswered) return;
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    
    const currentQ = questions[currentQuestion];
    if (currentQ.options[optionIndex] === currentQ.correct_answer) {
      setScore(prevScore => prevScore + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prevQuestion => prevQuestion + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizCompleted(false);
    
    // Shuffle questions for a new attempt
    setQuestions(prevQuestions => [...prevQuestions].sort(() => Math.random() - 0.5));
  };

  const getScoreMessage = () => {
    const percentage = (score / questions.length) * 100;
    
    if (percentage >= 90) return "Fantastique! You're a French language superstar!";
    if (percentage >= 70) return "Très bien! You're making excellent progress!";
    if (percentage >= 50) return "Bien! Keep practicing to improve your French.";
    return "Continuez à pratiquer! Keep practicing, you'll get better!";
  };

  // Create a fun animation for celebration
  const celebrateCorrectAnswer = () => {
    const correctOption = document.querySelector('.option-item.correct');
    if (correctOption) {
      correctOption.classList.add('celebrate');
      setTimeout(() => {
        correctOption.classList.remove('celebrate');
      }, 1000);
    }
  };

  useEffect(() => {
    if (isAnswered && questions[currentQuestion]?.options[selectedOption] === questions[currentQuestion]?.correct_answer) {
      celebrateCorrectAnswer();
    }
  }, [isAnswered, selectedOption, currentQuestion, questions]);

  if (isLoading) {
    return (
      <div className="quiz-loading">
        <div className="loading-spinner"></div>
        <p>Preparing your French quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-error">
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadQuiz}>Try Again</button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="quiz-empty">
        <p>No quiz questions available. Please try a different word.</p>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="quiz-results">
        <h2>Quiz Completed!</h2>
        <div className="results-score">{score} / {questions.length}</div>
        <p className="results-message">{getScoreMessage()}</p>
        
        <div className="learn-more">
          <h3>Keep Learning "{word}"</h3>
          <p>Continue practicing to master this and other French words!</p>
        </div>
        
        <div className="results-actions">
          <button 
            className="btn btn-secondary"
            onClick={handleRestartQuiz}
          >
            Try Again
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            New Word
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  
  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h2>Test Your French</h2>
        <span className="word-highlight">{word}</span>
        <p>Complete the quiz to practice your French vocabulary</p>
      </div>
      
      <div className="quiz-progress">
        <span>Question {currentQuestion + 1} of {questions.length}</span>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
          ></div>
        </div>
        <span>Score: {score}</span>
      </div>
      
      <div className="quiz-question">
        <p className="question-text">{currentQ.text}</p>
        
        <ul className="options-list">
          {currentQ.options.map((option, index) => (
            <li 
              key={index}
              className={`option-item ${
                isAnswered 
                  ? option === currentQ.correct_answer
                    ? 'correct'
                    : selectedOption === index && option !== currentQ.correct_answer
                      ? 'incorrect'
                      : selectedOption === index
                        ? 'selected'
                        : ''
                  : selectedOption === index
                    ? 'selected'
                    : ''
              }`}
              onClick={() => handleOptionSelect(index)}
            >
              {option}
            </li>
          ))}
        </ul>
        
        {isAnswered && (
          <div className="explanation">
            <p>{currentQ.explanation}</p>
          </div>
        )}
      </div>
      
      {isAnswered && (
        <div className="quiz-actions">
          <button 
            className="btn btn-primary"
            onClick={handleNextQuestion}
          >
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Quiz;