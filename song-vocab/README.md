# Song-Vocab

An agentic application that analyzes French songs, translates lyrics, and provides vocabulary with meanings and example sentences.

## Features

- Search and retrieve lyrics for French songs
- Translate lyrics from French to English
- Extract key French vocabulary from the lyrics
- Provide definitions and example sentences for vocabulary
- Interactive web interface using Streamlit

## Setup

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/free-genai-bootcamp-2025.git
   cd song-vocab
   ```

2. Create a virtual environment and install dependencies:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Create a `.env` file based on `.env.example` and add your API keys:
   ```
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. Run the application:
   ```
   streamlit run web/app.py
   ```

## API Keys Needed

- OpenAI API key for the LLM agents
- (Optional) Genius API key for better lyrics search

## Usage

1. Enter the name of a French song and artist in the web interface
2. The agent will search for and display the original lyrics
3. The lyrics will be translated to English
4. Key French vocabulary will be extracted with definitions and examples

## Project Structure

- `agents/`: Contains the agent implementations
- `utils/`: Utility functions and configuration
- `web/`: Streamlit web application
