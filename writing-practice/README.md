# French Writing Practice App

A Streamlit application for practicing French handwriting and getting instant feedback.

## Features

- Practice writing French words and get instant feedback
- OCR technology to analyze handwritten French
- Progressive learning with difficulty levels
- Track your progress and performance statistics
- Support for accented characters

## Installation

### Requirements

- Python 3.8+
- Tesseract OCR with French language support

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/french-writing-practice.git
cd french-writing-practice
```

2. Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Install Tesseract OCR with French language support:
```bash
# On Ubuntu/Debian
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-fra

# On macOS
brew install tesseract tesseract-lang

# On Windows
# Download and install from: https://github.com/UB-Mannheim/tesseract/wiki
```

## Usage

Run the application:
```bash
streamlit run main.py
```

The application will be available at http://localhost:8501

## Project Structure

```
french-writing-practice/
├── .streamlit/
│   └── config.toml
├── config/
│   ├── prompts.yaml
│   └── settings.yaml
├── data/
│   └── user_progress.json
├── logs/
├── src/
│   ├── backend/
│   │   ├── data/
│   │   ├── grading/
│   │   └── ocr/
│   ├── frontend/
│   │   ├── components/
│   │   └── pages/
│   └── utils/
├── static/
│   ├── css/
│   └── images/
├── tests/
├── .gitignore
├── main.py
├── README.md
└── requirements.txt
```

## Development

### Running Tests

```bash
pytest
```

### Adding New Words

Add new words to the `config/words.json` file or connect to an external API by modifying the `src/backend/data/word_manager.py` file.



## Acknowledgements

- [Streamlit](https://streamlit.io/)
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- [Python-tesseract](https://github.com/madmaze/python-tesseract)