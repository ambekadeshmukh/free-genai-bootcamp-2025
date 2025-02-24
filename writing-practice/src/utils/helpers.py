import yaml
import os
import streamlit as st
import datetime

def load_config(config_file='config/settings.yaml'):
    """Load configuration from YAML file"""
    default_config = {
        "difficulty": "A1 (Beginner)",
        "feedback_language": "english",
        "ocr_sensitivity": 5,
        "grading_sensitivity": 0.8
    }
    
    try:
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                config = yaml.safe_load(f)
            
            # Merge with defaults to ensure all keys exist
            if config is None:
                config = default_config
            else:
                for key, value in default_config.items():
                    if key not in config:
                        config[key] = value
            
            return config
        else:
            # Create default config if it doesn't exist
            os.makedirs(os.path.dirname(config_file), exist_ok=True)
            with open(config_file, 'w') as f:
                yaml.dump(default_config, f)
            
            return default_config
    except Exception as e:
        print(f"Error loading config: {str(e)}")
        return default_config

def initialize_session_state():
    """Initialize Streamlit session state variables"""
    # Word state
    if 'current_word' not in st.session_state:
        st.session_state.current_word = None
    
    # Practice statistics
    if 'practice_count' not in st.session_state:
        st.session_state.practice_count = 0
    if 'correct_count' not in st.session_state:
        st.session_state.correct_count = 0
    if 'streak' not in st.session_state:
        st.session_state.streak = 0
    
    # History tracking
    if 'history' not in st.session_state:
        st.session_state.history = []

def format_date(timestamp):
    """Format a Unix timestamp as a human-readable date"""
    if timestamp is None:
        return "Never"
    
    dt = datetime.datetime.fromtimestamp(timestamp)
    today = datetime.datetime.now().date()
    
    if dt.date() == today:
        return f"Today at {dt.strftime('%H:%M')}"
    elif dt.date() == today - datetime.timedelta(days=1):
        return f"Yesterday at {dt.strftime('%H:%M')}"
    else:
        return dt.strftime('%Y-%m-%d %H:%M')

def format_elapsed_time(timestamp):
    """Format time elapsed since a timestamp"""
    if timestamp is None:
        return "never"
    
    now = datetime.datetime.now()
    dt = datetime.datetime.fromtimestamp(timestamp)
    delta = now - dt
    
    if delta.days > 0:
        return f"{delta.days} days ago"
    elif delta.seconds >= 3600:
        return f"{delta.seconds // 3600} hours ago"
    elif delta.seconds >= 60:
        return f"{delta.seconds // 60} minutes ago"
    else:
        return "just now"

def format_french_word(word):
    """Format a French word with proper styling"""
    accented_chars = "àâäéèêëîïôöùûüÿçÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇ"
    
    # Wrap accented characters in a span for highlighting
    formatted = ""
    for char in word:
        if char in accented_chars:
            formatted += f"<span class='accent'>{char}</span>"
        else:
            formatted += char
    
    return formatted