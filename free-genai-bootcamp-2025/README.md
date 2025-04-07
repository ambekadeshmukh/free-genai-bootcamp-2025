# Le Petit Explorateur: AI-Powered French Learning Adventure


**Le Petit Explorateur (The Little Explorer)** is an interactive web application designed to make learning French fun and accessible for complete beginners through playful, bite-sized learning experiences powered by advanced AI technologies.

Built as part of the GenAI Bootcamp 2025, this application showcases the integration of multiple AI technologies to create an engaging language learning experience.

![alt text](logo512.png)

## 🌟 Features

- **Word Lineup**: Match French words to images with visual and audio support
- **Phrase Constructor**: Build simple sentences with drag-and-drop words
- **Listening Challenge**: Practice comprehension with audio clips
- **Object Naming Game**: Learn vocabulary in context with interactive scenes
- **Daily Quick Learn**: Short, timed vocabulary lessons
- **Pronunciation Practice**: Record and compare your pronunciation
- **Cultural Context Mini-Lessons**: Learn about French culture while building vocabulary

### Advanced AI Features

- **AI Language Buddy**: Conversational practice with an AI partner adapted to your level
- **Cultural Context Generator**: Immersive cultural scenarios that teach vocabulary in context

## 🧠 AI Technology Stack

### AI Platforms
- **OpenAI GPT-4 Turbo**: Content generation, adaptive lesson planning
- **Hugging Face Transformers**: Speech recognition, pronunciation analysis
- **Google Imagen**: Visual content generation
- **ChromaDB**: Vector storage and retrieval
- **Anthropic Claude**: Advanced reasoning, personalized learning
- **Cohere**: Semantic search and embedding

### Application Architecture
- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js/Express
- **API Integration Layer**: Unified interface for all AI services
- **Progressive Web App (PWA)**: Offline functionality
- **Local Storage**: No login required, progress tracked locally

## 🚀 Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn
- API keys for the AI services:
  - OpenAI API key
  - Anthropic API key
  - Google API key
  - Hugging Face API key
  - Cohere API key

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
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_API_KEY=your_google_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
COHERE_API_KEY=your_cohere_api_key
CHROMADB_URL=http://localhost:8000
```

4. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. In a new terminal, navigate to the frontend directory:
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

## 📂 Project Structure

The project follows a modular architecture with clear separation of concerns:

- `frontend/`: React application with game components and UI
- `backend/`: Express server handling API integrations and business logic
- `docker/`: Configuration for containerization

## 🧩 AI Integration Details

### OpenAI GPT-4 Turbo
- Powers the "Phrase Constructor" with real-time grammar feedback
- Generates adaptive vocabulary sets based on user progress
- Creates contextual examples for vocabulary items
- Works with the Cultural Context Generator to create culturally relevant scenarios

### Hugging Face Transformers
- Speech-to-text for pronunciation practice
- Text-to-speech for vocabulary pronunciation
- Provides models for French language understanding
- Speech pattern analysis for feedback on accent and pronunciation

### Google Imagen
- Creates custom illustrations for vocabulary items
- Generates scene-based learning environments for the "Object Naming Game"
- Produces visual elements for cultural mini-lessons
- Develops visual cues for language learning

### Anthropic Claude
- Powers the AI Language Buddy for conversational practice
- Generates personalized learning paths based on user performance
- Provides nuanced contextual understanding of French expressions
- Creates adaptive difficulty levels across all games

### ChromaDB
- Stores vector embeddings of vocabulary and phrases
- Enables semantic search across learning content
- Tracks user progress and performance metrics
- Manages relationships between related vocabulary items

### Cohere
- Creates embeddings for vocabulary and phrases
- Powers recommendation system for related vocabulary
- Enables similarity search for vocabulary items
- Supports contextual understanding of user inputs

## 📚 Resources

- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Hugging Face Transformers Documentation](https://huggingface.co/docs/transformers/index)
- [Google Imagen API Documentation](https://cloud.google.com/vision/image-generation)
- [Cohere API Documentation](https://docs.cohere.com/)
- [ChromaDB Documentation](https://docs.trychroma.com/)
