"""Configuration utilities for the song-vocab application."""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Configuration class to manage application settings."""
    
    # API Keys
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    GENIUS_API_KEY = os.getenv("GENIUS_API_KEY")
    
    # Model configuration
    LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4-turbo")
    
    # Agent configuration
    MAX_TOKENS = 2000
    TEMPERATURE = 0.2
    
    @classmethod
    def validate(cls):
        """Validate that required configuration is present."""
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required. Please set it in your .env file.")
        
        return True