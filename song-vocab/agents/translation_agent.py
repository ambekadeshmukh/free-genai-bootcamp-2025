"""Agent for translating song lyrics."""

from typing import Dict, Any
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from utils.config import Config
from agents.lyrics_agent import SongInfo


class TranslatedLyrics(BaseModel):
    """Model for translated lyrics."""
    
    original: str = Field(..., description="The original lyrics")
    translation: str = Field(..., description="The translated lyrics")
    source_language: str = Field(..., description="The source language")
    target_language: str = Field(..., description="The target language")


class TranslationAgent:
    """Agent for translating French lyrics to English."""
    
    def __init__(self):
        """Initialize the translation agent."""
        # Create the translation prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", 
             "You are an expert translator specializing in French to English translations "
             "for song lyrics. Your translations should preserve the meaning, tone, and "
             "emotional impact of the original lyrics while making them accessible to "
             "English speakers. Maintain the structure and line breaks of the original lyrics "
             "in your translation."),
            ("user", 
             "Translate the following French song lyrics to English:\n\n{lyrics}")
        ])
        
        # Initialize the LLM
        llm = ChatOpenAI(
            api_key=Config.OPENAI_API_KEY,
            model=Config.LLM_MODEL,
            temperature=Config.TEMPERATURE
        )
        
        # Create the chain
        self.chain = LLMChain(llm=llm, prompt=prompt)
    
    def translate(self, song_info: SongInfo) -> TranslatedLyrics:
        """Translate lyrics from French to English.
        
        Args:
            song_info: SongInfo object containing the original lyrics
            
        Returns:
            TranslatedLyrics object with original and translated content
        """
        # Check if the input is empty or indicates lyrics were not found
        if not song_info.lyrics or "not found" in song_info.lyrics.lower():
            return TranslatedLyrics(
                original=song_info.lyrics,
                translation="Translation not available because lyrics were not found.",
                source_language="french",
                target_language="english"
            )
        
        # Call the chain to translate the lyrics
        result = self.chain.invoke({"lyrics": song_info.lyrics})
        translated_text = result.get("text", "")
        
        # Clean up the translation
        if "```" in translated_text:
            # Extract content from code blocks if present
            parts = translated_text.split("```")
            if len(parts) >= 2:
                translated_text = parts[1].strip()
        
        return TranslatedLyrics(
            original=song_info.lyrics,
            translation=translated_text,
            source_language="french",
            target_language="english"
        )