# 🎈 French Language Vocabulary Generator

A Streamlit application that generates vocabulary lists for language learning using Groq LLM.

## Features

- Generate vocabulary lists for multiple languages (French, Spanish, German, Italian)
- Customizable number of words (5-20 words)
- Thematic category-based generation
- Includes:
  - Word in target language
  - English translation
  - IPA pronunciation
  - Part of speech
  - Grammatical gender (where applicable)
- Export vocabulary lists as JSON
- Clean and intuitive user interface

### How to run it on your own machine

1. Install the requirements

   ```
   $ pip install -r requirements.txt
   ```

2. Run the app

   ```
   $ streamlit run streamlit_app.py
   ```


## 🎯 Business Goal

This tool addresses the need to efficiently populate our language learning application with vocabulary content. Instead of manual entry, it provides:

- Automated vocabulary generation using LLM
- JSON export functionality for easy system integration
- Import capabilities for existing vocabulary sets
- Streamlined interface for content team usage

## 🛠️ Technical Stack

- **Framework**: Streamlit
- **LLM Integration**: Groq API
- **Data Format**: JSON
- **Language**: Python 3.8+
- **Validation**: Pydantic

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- Groq API key
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/french-vocab-generator.git
cd french-vocab-generator
```

2. Set up virtual environment
```bash
python -m venv venv
source venv/bin/activate  # For Windows: venv\Scripts\activate
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Set up environment variables
```bash
# Create .env file
cp .env.example .env

# Add your Groq API key to .env
GROQ_API_KEY=your_api_key_here
```

### Running the Application

```bash
streamlit run src/app.py
```

Visit `http://localhost:8501` in your browser to access the application.

## 📝 Usage

### Generating Vocabulary

1. Select "Generate Vocabulary" mode
2. Enter a thematic category (e.g., "Food", "Travel", "Business")
3. Adjust the number of words to generate
4. Click "Generate"
5. Review and export the results

### Importing/Exporting

- **Export**: Download generated vocabulary as JSON
- **Import**: Upload existing vocabulary JSON files for validation and viewing

### JSON Structure

```json
[
  {
    "french": "la boulangerie",
    "pronunciation": "/bulɑ̃ʒʁi/",
    "english": "bakery",
    "parts": [
      {
        "type": "noun",
        "gender": "feminine"
      }
    ]
  }
]
```

## 🗂️ Project Structure

```
language-vocab-generator/
├── README.md
├── requirements.txt
├── .env
├── .gitignore
├── src/
│   ├── app.py                  # Main Streamlit application
│   ├── config.py              # Configuration settings
│   ├── llm/
│   │   ├── groq_client.py     # Groq LLM implementation
│   │   └── prompts.py         # LLM prompts
│   ├── utils/
│   │   ├── file_handlers.py   # JSON import/export
│   │   └── validators.py      # Input validation
│   └── tests/
└── data/
    └── samples/              # Sample vocabulary files
```

## 🧪 Testing

Run the test suite:
```bash
pytest src/tests/
```



## 🔍 Troubleshooting

Common issues and solutions:

- **API Key Issues**: Ensure your Groq API key is correctly set in the `.env` file
- **Import Errors**: Check that your JSON follows the required structure
- **Generation Timeout**: Try reducing the number of words requested

