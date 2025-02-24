import json
import os
import random
import requests
from src.utils.helpers import load_config

# Sample word data if API is unavailable
SAMPLE_WORDS = [
    {"french": "bonjour", "english": "hello"},
    {"french": "merci", "english": "thank you"},
    {"french": "au revoir", "english": "goodbye"},
    {"french": "s'il vous plaît", "english": "please"},
    {"french": "excusez-moi", "english": "excuse me"},
    {"french": "oui", "english": "yes"},
    {"french": "non", "english": "no"},
    {"french": "chat", "english": "cat"},
    {"french": "chien", "english": "dog"},
    {"french": "maison", "english": "house"},
    {"french": "eau", "english": "water"},
    {"french": "pain", "english": "bread"},
    {"french": "fromage", "english": "cheese"},
    {"french": "livre", "english": "book"},
    {"french": "table", "english": "table"}
]

# More comprehensive word list categorized by difficulty
WORD_LEVELS = {
    "A1 (Beginner)": [
        {"french": "bonjour", "english": "hello"},
        {"french": "merci", "english": "thank you"},
        {"french": "oui", "english": "yes"},
        {"french": "non", "english": "no"},
        {"french": "chat", "english": "cat"},
        {"french": "chien", "english": "dog"},
        {"french": "maison", "english": "house"},
        {"french": "eau", "english": "water"},
        {"french": "pain", "english": "bread"},
        {"french": "pomme", "english": "apple"}
    ],
    "A2 (Elementary)": [
        {"french": "aujourd'hui", "english": "today"},
        {"french": "demain", "english": "tomorrow"},
        {"french": "hier", "english": "yesterday"},
        {"french": "toujours", "english": "always"},
        {"french": "jamais", "english": "never"},
        {"french": "souvent", "english": "often"},
        {"french": "parfois", "english": "sometimes"},
        {"french": "travail", "english": "work"},
        {"french": "étudiant", "english": "student"},
        {"french": "vacances", "english": "vacation"}
    ],
    "B1 (Intermediate)": [
        {"french": "développement", "english": "development"},
        {"french": "environnement", "english": "environment"},
        {"french": "gouvernement", "english": "government"},
        {"french": "amélioration", "english": "improvement"},
        {"french": "technologie", "english": "technology"},
        {"french": "expérience", "english": "experience"},
        {"french": "différence", "english": "difference"},
        {"french": "possibilité", "english": "possibility"},
        {"french": "nécessaire", "english": "necessary"},
        {"french": "réalisation", "english": "achievement"}
    ],
    "B2 (Upper Intermediate)": [
        {"french": "épanouissement", "english": "fulfillment"},
        {"french": "développement durable", "english": "sustainable development"},
        {"french": "vraisemblablement", "english": "presumably"},
        {"french": "simultanément", "english": "simultaneously"},
        {"french": "caractéristique", "english": "characteristic"},
        {"french": "réchauffement climatique", "english": "global warming"},
        {"french": "représentativité", "english": "representativeness"},
        {"french": "revendication", "english": "demand/claim"},
        {"french": "paradoxalement", "english": "paradoxically"},
        {"french": "incontestablement", "english": "undeniably"}
    ]
}

def load_words_from_api():
    """Load words from API endpoint"""
    try:
        response = requests.get('http://localhost:5000/api/groups/1/raw', timeout=5)
        if response.status_code == 200:
            return response.json()
    except (requests.RequestException, json.JSONDecodeError) as e:
        print(f"API error: {str(e)}")
    
    return None

def load_words_from_file():
    """Load words from local JSON file"""
    try:
        file_path = os.path.join('config', 'words.json')
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
    except (IOError, json.JSONDecodeError) as e:
        print(f"File error: {str(e)}")
    
    return None

def get_word():
    """Get a random word based on current difficulty setting"""
    # Load config to get difficulty level
    config = load_config()
    difficulty = config.get("difficulty", "A1 (Beginner)")
    
    # Try to get words from API first
    words = load_words_from_api()
    
    # If API fails, try local file
    if words is None:
        words = load_words_from_file()
    
    # If both fail, use built-in word list based on difficulty
    if words is None:
        words = WORD_LEVELS.get(difficulty, SAMPLE_WORDS)
    
    # Select a random word
    return random.choice(words)

def get_all_words():
    """Get all words available in the system based on difficulty"""
    # Load config to get difficulty level
    config = load_config()
    difficulty = config.get("difficulty", "A1 (Beginner)")
    
    # Try API first
    words = load_words_from_api()
    
    # Then try local file
    if words is None:
        words = load_words_from_file()
    
    # Finally use built-in lists
    if words is None:
        words = {}
        # Include current level and all levels below
        difficulties = list(WORD_LEVELS.keys())
        current_level_idx = difficulties.index(difficulty) if difficulty in difficulties else 0
        
        # Include all words up to current level
        for idx in range(current_level_idx + 1):
            level = difficulties[idx]
            words[level] = WORD_LEVELS[level]
    
    return words

def get_word_by_id(word_id):
    """Get a specific word by ID"""
    all_words = get_all_words()
    flat_words = []
    
    # Flatten the word list if it's categorized
    if isinstance(all_words, dict):
        for category in all_words.values():
            flat_words.extend(category)
    else:
        flat_words = all_words
    
    # Find word by ID
    for i, word in enumerate(flat_words):
        if i == word_id:
            return word
    
    # If not found, return a random word
    return get_word()

def save_word_list(words, filepath='config/words.json'):
    """Save word list to JSON file"""
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(words, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error saving words: {str(e)}")
        return False