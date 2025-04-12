# Le Petit Explorateur: AI-Powered French Learning Adventure

<div align="center">
  <img src="logo512.png" alt="Le Petit Explorateur Logo" width="150"/>
  <h3>Learn French Through Interactive AI-Powered Games</h3>
</div>

## 🌟 Overview

**Le Petit Explorateur (The Little Explorer)** is an interactive web application designed to make learning French fun and accessible for complete beginners through playful, bite-sized learning experiences powered by advanced AI technologies.

Built as part of the GenAI Bootcamp 2025, this application showcases the integration of multiple AI technologies to create an engaging language learning experience that adapts to your learning style and pace.

## 🎮 Featured Games

- **Phrase Constructor**: Build simple sentences with drag-and-drop words
- **French Hangman**: Guess French words letter by letter
- **Quiz Challenge**: Test your knowledge with a time-based quiz game
- **Daily Quick Learn**: Short, timed vocabulary lessons that track your learning streak
- **AI Language Buddy**: Practice conversation with an AI tutor adapted to your level

## 🧠 AI-Powered Features

- **Adaptive Learning**: Content and difficulty automatically adjust to your skill level using OpenAI GPT models
- **Personalized Content Generation**: AI creates unique questions, phrases, and examples for each game session
- **Interactive Conversations**: Practice speaking French with an AI language partner powered by GPT
- **Visual Learning**: AI-generated images for vocabulary words using DALL-E integration
- **Smart Fallbacks**: Intelligently degrades to offline content when API services are unavailable
- **Cultural Context**: Learn about French culture while building vocabulary

> The application is primarily powered by OpenAI's GPT and DALL-E models, with the architecture ready to integrate other AI services in future updates.

## 🚀 Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn
- OpenAI API key (required for most AI functionality)
- Other API keys (optional, enhances functionality)

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/ambekadeshmukh/free-genai-bootcamp-2025.git
cd free-genai-bootcamp-2025/le-petit-explorateur/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```
PORT=5000
OPENAI_API_KEY=your_openai_api_key   # Required for most AI features
ANTHROPIC_API_KEY=your_anthropic_api_key   # Optional: Enhanced language buddy
GOOGLE_API_KEY=your_google_api_key   # Optional: Image generation via Google Imagen
HUGGINGFACE_API_KEY=your_huggingface_api_key   # Optional: Pronunciation analysis
COHERE_API_KEY=your_cohere_api_key   # Optional: Semantic search capabilities
CHROMADB_URL=http://localhost:8000   # Optional: Vector database
```

> **Note:** The application includes fallback mechanisms if API keys are missing, but the OpenAI key is strongly recommended for the best experience.

4. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the frontend development server:
```bash
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## 🐳 Docker Deployment

You can also run the application using Docker:

```bash
cd free-genai-bootcamp-2025/le-petit-explorateur
docker-compose up -d
```

This will start both the frontend and backend services, as well as a ChromaDB instance.

## 📱 Offline Support

Le Petit Explorateur functions as a Progressive Web App (PWA) with:

- Offline vocabulary and lesson access
- Local progress tracking
- No login required (all progress saved locally)
- Fallback content for when API services are unavailable

## 🛠️ Technology Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js/Express
- **Primary AI Integration**: OpenAI GPT and DALL-E models
- **Secondary AI Frameworks**: Implementation-ready for Claude, Google Imagen, Hugging Face, and Cohere
- **Vector Database**: ChromaDB framework (optional enhancement)
- **Local Storage**: IndexedDB and browser storage for offline functionality
- **Error Handling**: Multi-level fallback system with predefined content


## 📚 Additional Resources

For more detailed information on the AI technologies used, see [TechSpecs.md](TechSpecs.md).

## Video Demo 

You can view the demo here -- 
