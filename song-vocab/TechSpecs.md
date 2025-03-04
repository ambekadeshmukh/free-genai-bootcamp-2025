# Song-Vocab Technical Specifications

## Overview
Song-Vocab is an agentic application that analyzes French songs, translates lyrics to English, and provides vocabulary with definitions and example sentences. The system follows an agentic workflow where multiple specialized agents collaborate to process a song request.

## Agent Architecture

### Agent Workflow
1. User inputs a French song title and optional artist name
2. Lyrics Agent retrieves the original French lyrics
3. Translation Agent translates the lyrics to English
4. Vocabulary Agent extracts key vocabulary with definitions and examples
5. Results are presented to the user in a structured format

### Agents and Their Responsibilities

#### 1. Lyrics Agent
- **Purpose**: Find and retrieve accurate French song lyrics
- **Tools Used**: Genius API, web scraping fallback
- **Input**: Song title, artist name (optional)
- **Output**: Original lyrics, song metadata
- **Key Functions**:
  - Search for songs using Genius API or fallback method
  - Extract and clean lyrics text
  - Verify lyrics are in French
  - Return structured song information

#### 2. Translation Agent
- **Purpose**: Translate French lyrics to English
- **Tools Used**: LLM (OpenAI GPT model)
- **Input**: French lyrics
- **Output**: English translation
- **Key Functions**:
  - Preserve original song structure and formatting
  - Maintain artistic intent and emotional impact
  - Handle idioms and cultural references appropriately

#### 3. Vocabulary Agent
- **Purpose**: Extract key vocabulary items from lyrics
- **Tools Used**: LLM (OpenAI GPT model)
- **Input**: French lyrics
- **Output**: List of vocabulary entries
- **Key Functions**:
  - Identify important words and phrases
  - Provide part of speech, definition, example usage
  - Generate example sentences with translations
  - Ensure educational value for language learners

#### 4. Agent Manager
- **Purpose**: Orchestrate the workflow between agents
- **Input**: User request (song title, artist)
- **Output**: Combined results from all agents
- **Key Functions**:
  - Sequence agent operations
  - Handle errors and fallbacks
  - Format combined results
  - Manage communication between agents

## Technical Implementation

### Stack
- **Language**: Python 3.9+
- **Agent Framework**: LangChain
- **LLM**: OpenAI GPT-4 (via OpenAI API)
- **Frontend**: Streamlit
- **External APIs**: Genius API (optional)
- **Package Management**: pip

### Data Flow
```
User Request → Agent Manager → Lyrics Agent → Translation Agent → Vocabulary Agent → Formatted Results → User
```

### Key Libraries
- `langchain`: Agent creation and orchestration
- `openai`: LLM API access
- `streamlit`: Web interface
- `lyricsgenius`: Genius API client
- `requests`/`beautifulsoup4`: Web scraping fallback
- `pydantic`: Data validation and serialization

### API Requirements
- **OpenAI API Key**: Required for all LLM operations
- **Genius API Key**: Optional, provides better lyrics search results

## User Interfaces

### Web Interface (Streamlit)
- Input form for song title and artist
- Display sections for original lyrics and translation
- Interactive vocabulary section with expandable entries
- Download option for vocabulary as CSV

### Command Line Interface
- Basic CLI for programmatic access
- Arguments for song title and artist
- Option to launch web interface

## Performance Considerations
- **Response Time**: Expected 5-15 seconds total processing time
- **Rate Limiting**: Respects Genius API and OpenAI API rate limits
- **Caching**: Implemented for repeated song requests
- **Error Handling**: Robust fallbacks for all agent operations

## Security and Privacy
- API keys stored in environment variables, not in code
- No user data stored between sessions
- Input validation to prevent injection attacks