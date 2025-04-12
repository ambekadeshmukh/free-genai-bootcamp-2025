# Le Petit Explorateur: Technical Specifications

This document provides detailed technical specifications for the Le Petit Explorateur application, outlining the architecture, AI integrations, data flow, and implementation details.

## 🏗️ System Architecture

### High-Level Overview

Le Petit Explorateur follows a client-server architecture with AI service integrations:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────►│ Express Backend │────►│   AI Services   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Browser Cache  │     │    ChromaDB     │     │   Vector Data   │
│   & IndexedDB   │     │                 │     │   & Embeddings  │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Core Components

- **Frontend Layer**: React application with Tailwind CSS
- **Backend Layer**: Express.js server handling API routing
- **AI Integration Layer**: Services for handling AI provider interactions
- **Data Storage Layer**: Client-side storage and ChromaDB for vectors

## 🧠 AI Technology Integration

### OpenAI GPT Integration (Primary AI Engine)

- **Status**: Core functionality, actively implemented
- **Endpoints**: `/api/ai/chat`, `/api/ai/generate-content`, `/api/ai/generate-quiz`, `/api/ai/generate-image`, `/api/ai/word-details`
- **Implementation**: Uses the OpenAI API client in `openaiService.js` with direct fallback in frontend's `apiService.js`
- **Key Features**:
  - Content generation for all games and quizzes
  - Grammar feedback for the Phrase Constructor game
  - Word details for the Daily Quick Learn flashcards
  - DALL-E image generation for vocabulary visualization
  - AI Language Buddy conversation capabilities
- **Models Used**: GPT-3.5-Turbo, GPT-4-Turbo (where specified), DALL-E 3

### Anthropic Claude Integration (Planned/Partial Implementation)

- **Status**: Framework implemented, not actively used in current version
- **Endpoints**: Defined but primarily used as fallback
- **Implementation**: API client framework in `claudeService.js`
- **Planned Features**:
  - Enhanced conversational practice in AI Language Buddy
  - Learning path creation and adaptation
  - Nuanced explanation of French expressions
  - Advanced reasoning for grammar explanations

### Hugging Face Transformers Integration (Framework Ready)

- **Status**: Framework implemented, not actively used in current version
- **Endpoints**: API framework defined in codebase
- **Implementation**: API client framework in `huggingfaceService.js`
- **Planned Features**:
  - Speech recognition for pronunciation analysis
  - Text-to-speech for vocabulary pronunciation
  - French language understanding models
  - Speech pattern analysis

### Google Imagen Integration (Framework Ready)

- **Status**: Framework implemented, DALL-E used as primary provider
- **Endpoints**: `/api/ai/generate-image` (alternative provider)
- **Implementation**: API client framework in `imagenService.js`
- **Planned Features**:
  - Alternative visual content generation
  - Higher-quality image generation for complex scenes
  - Cultural context visualizations

### Cohere Integration (Framework Ready)

- **Status**: Framework implemented, not actively used in current version
- **Endpoints**: Integrated through ChromaDB framework
- **Implementation**: API client framework in `cohereService.js`
- **Planned Features**:
  - Semantic search across learning content
  - Embeddings for vocabulary and phrases
  - Similarity detection between concepts
  - Enhanced recommendations

### Fallback Mechanisms

The application implements sophisticated fallback strategies:
- Direct OpenAI API calls from frontend when backend is unavailable
- Pre-defined vocabulary, phrases, and quiz content when AI services fail
- SVG placeholders when image generation fails
- Local storage for all user progress and learned content

## 💾 Data Storage & State Management

### Client-Side Storage

- **Implementation**: IndexedDB through `idb` wrapper in `storageService.js`
- **Stores**:
  - `progress`: User progress tracking
  - `ai`: Conversation history and AI-related data
  - `vocabulary`: Learned vocabulary
  - `offline-content`: Cached content for offline use

### Context API Implementation

Three main context providers:
- **ChalkboardContext**: UI settings, loading states, sound effects
- **ProgressContext**: User progress, streaks, vocabulary stats
- **AIContext**: AI interactions, chat history, learning paths

### Vector Storage with ChromaDB

- **Implementation**: ChromaDB client in `chromadbService.js`
- **Collections**:
  - `french_vocabulary`: Vocabulary embeddings
  - `cultural_contexts`: Cultural information vectors
  - `user_progress`: Progress tracking
  - `learning_paths`: Learning paths data

## 🔄 API Services & Data Flow

### Frontend-to-Backend Communication

- **Primary Service**: `apiService.js` handles all API calls to the backend
- **Error Handling**: Comprehensive retry logic and graceful degradation
- **Fallback Mechanism**: Direct AI provider calls when backend is unavailable

### Backend API Routes

- **AI Routes**: `/api/ai/*` - All AI-related functionality
- **Lesson Routes**: `/api/lessons/*` - Lesson content and structure
- **Progress Routes**: `/api/progress/*` - User progress tracking
- **Translation Routes**: `/api/translate/*` - Text translation services

### Fault Tolerance

- **Caching**: Extensive use of browser caching for API responses
- **Fallback Content**: Pre-built content used when API calls fail
- **Progressive Enhancement**: Core functionality works without AI services

## 🎮 Game Implementations

### Phrase Constructor Game

- **Frontend**: Drag-and-drop sentence building interface
- **Backend**: AI-generated phrases with context
- **AI Usage**: GPT for phrase generation and grammar checking

### French Hangman Game

- **Frontend**: Classic hangman implementation with French words
- **Backend**: AI-selected vocabulary with hints
- **AI Usage**: GPT for word selection and hint generation

### Quiz Challenge

- **Frontend**: Timed quiz interface with streak tracking
- **Backend**: AI-generated multiple-choice questions
- **AI Usage**: GPT for question generation and difficulty scaling

### Daily Quick Learn

- **Frontend**: Flashcard-based learning with progress tracking
- **Backend**: AI-generated vocabulary and examples
- **AI Usage**: GPT for content, DALL-E for images

### AI Language Buddy

- **Frontend**: Chat interface with suggestion chips
- **Backend**: AI conversation with personalization
- **AI Usage**: GPT for conversation, contextual understanding

## 🔧 Technical Requirements

### Minimum Client Requirements

- **Browser**: Chrome 74+, Firefox 67+, Safari 12+, Edge 79+
- **JavaScript**: ES6 support
- **Storage**: 50MB available space for offline functionality
- **Network**: Internet connection for initial load and AI features

### Server Requirements

- **Node.js**: v16+
- **Memory**: 1GB RAM minimum
- **Storage**: 500MB for application
- **API Keys**: 
  - **OpenAI API Key**: Required for most AI functionality
  - **Other API Keys**: Optional, enhances specific features

### API Usage & Quotas

- **OpenAI**: 
  - Primary service currently used
  - Uses GPT-3.5-Turbo for most queries (lower cost)
  - Uses DALL-E for image generation
  - Rate limits based on your OpenAI plan
  - Fallbacks implemented for rate limiting and errors

- **Other API Services**: 
  - Framework implemented but not actively used in current version
  - Can be activated by adding the relevant API keys
  - Would enhance specific functionality areas when implemented

## 🚀 Performance Optimizations

### Frontend Optimizations

- **Code Splitting**: React.lazy for component loading
- **Image Optimization**: SVG placeholders, progressive loading
- **Caching Strategy**: IndexedDB for large datasets, localStorage for settings

### Backend Optimizations

- **Request Pooling**: Batch similar requests for AI services
- **Content Caching**: ChromaDB for semantic caching
- **Rate Limiting**: Express rate-limiter middleware

### AI Service Optimizations

- **Prompt Engineering**: Optimized prompts for better AI responses
- **Temperature Control**: Adjusted for consistency or creativity as needed
- **Token Management**: Efficient use of token windows for cost reduction

## 🔒 Security Considerations

- **API Key Management**: Server-side only, environment variables
- **Data Privacy**: Local storage only, no user data transmitted
- **Content Filtering**: AI prompt safety guardrails
- **Input Sanitization**: Guards against injection attacks

## 🔄 Future Development Roadmap

- **Multi-language Support**: Extend to Spanish, German, Italian
- **Advanced Speech Recognition**: Real-time pronunciation feedback
- **AI-Generated Dialogues**: Interactive conversation scenarios
- **Gamification Elements**: Points, badges, achievements
- **User Accounts**: Optional cloud sync for progress

---

This technical specification is a living document and may be updated as the application evolves.
