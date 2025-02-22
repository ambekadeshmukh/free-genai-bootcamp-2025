# French Language Learning Assistant

An advanced learning tool that leverages RAG (Retrieval Augmented Generation) and AWS services to create an interactive French language learning experience. The system demonstrates the progression from basic LLM responses to a fully contextual learning assistant with audio capabilities.A Streamlit-based application for French language learning, featuring pronunciation practice, listening comprehension, and YouTube-based learning.

## Difficulty Level
Intermediate - Implements RAG, AWS integrations, and audio processing

## Features

### 1. Pronunciation Practice
- Text-to-speech conversion using Amazon Polly
- Choice of male/female French voices
- High-quality audio output
- Real-time audio generation

### 2. Listening Comprehension
- YouTube video transcript extraction
- Interactive Q&A generation
- Vocabulary highlighting
- Progress tracking

### 3. Learn from YouTube
- Direct YouTube video integration
- Automatic transcript extraction
- Key phrase identification
- Translation support

## Project Structure
```
listening-comp/
├── backend/
│   ├── data/
│   │   ├── questions/         # Stored learning questions
│   │   └── transcripts/       # Processed transcripts
│   │   └── __init__.py
│   │   ├── audio_generator.py    # AWS Polly integration
│   │   ├── chat.py              # Bedrock chat integration
│   │   ├── get_transcript.py    # YouTube transcript handling
│   │   └── interactive.py       # Interactive learning features
│   │   └── question_generator.py # Question generation
│   │   └── rag.py              # RAG implementation
│   │   └── structured_data.py   # Data processing
│   │   └── vector_store.py      # Vector storage
│   ├── frontend/
│   │   ├── static/
│   │   │   └── audio/           # Generated audio files
│   │   │   └── __init__.py
│   │   └── main.py             # Streamlit interface
│   ├── .gitignore
│   └── README.md
```

## Technical Components

### Backend Services
- **AWS Bedrock**: Text generation and embeddings
- **AWS Polly**: Text-to-speech for French audio
- **SQLite**: Vector and content storage
- **ChromaDB**: Vector search implementation

### Frontend
- **Streamlit**: User interface
- **Plotly**: Data visualization
- **Audio Player**: Custom audio component

### Key Features
1. **Audio Generation**
   - Male and female French voices
   - Dialogue generation
   - Question and answer audio
   - Custom pronunciation exercises

2. **Question Generation**
   - Dialogue-based questions
   - Grammar exercises
   - Vocabulary practice
   - Multi-level difficulty (A1-C1)

3. **RAG Implementation**
   - Context-aware responses
   - French language vector embeddings
   - Efficient similarity search

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd listening-comp
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up AWS credentials:
```bash
export AWS_ACCESS_KEY_ID='your-key'
export AWS_SECRET_ACCESS_KEY='your-secret'
export AWS_DEFAULT_REGION='us-east-1'
```

## Running Tests
```bash
# Run all tests
python -m unittest discover tests

# Run specific test suite
python -m unittest tests.test_audio
python -m unittest tests.test_questions
```

## Usage

1. Start the application:
```bash
streamlit run frontend/main.py
```

2. Navigate through learning stages:
- Base LLM chat
- Raw transcript analysis
- Structured learning
- RAG-enhanced responses
- Interactive exercises

3. Select practice mode:
   - Pronunciation Practice
   - Listening Comprehension
   - Learn from YouTube

4. For Pronunciation Practice:
   - Enter French text
   - Select voice gender
   - Generate and play audio

5. For Listening Comprehension:
   - Enter YouTube URL
   - Get transcript and questions
   - Practice with generated content

## Dependencies

Core dependencies from `requirements.txt`:
- streamlit==1.32.0
- pandas==2.2.0
- numpy==1.24.0
- boto3==1.34.0
- openai-whisper==20231117
- ffmpeg-python==0.2.0
- youtube-transcript-api==0.6.2
- chromadb==0.4.22
- plotly==5.18.0
- python-dotenv==1.0.0
- requests==2.31.0

## AWS Services Used
- Amazon Polly for text-to-speech
- Amazon Bedrock for chat and comprehension
- AWS SDK (boto3) for AWS integration