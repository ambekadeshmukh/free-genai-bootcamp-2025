"""Manager for orchestrating the workflow of multiple agents."""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from agents.lyrics_agent import LyricsAgent, SongInfo
from agents.translation_agent import TranslationAgent, TranslatedLyrics
from agents.vocab_agent import VocabAgent, VocabularyList


class SongAnalysisResult(BaseModel):
    """Complete result of song analysis."""
    
    song_info: SongInfo = Field(..., description="Information about the song")
    translation: TranslatedLyrics = Field(..., description="Translated lyrics")
    vocabulary: VocabularyList = Field(..., description="Extracted vocabulary")


class AgentManager:
    """Manager for orchestrating the agent workflow."""
    
    def __init__(self):
        """Initialize the agent manager and all component agents."""
        self.lyrics_agent = LyricsAgent()
        self.translation_agent = TranslationAgent()
        self.vocab_agent = VocabAgent()
    
    def process_song(
        self, song_title: str, artist_name: Optional[str] = None
    ) -> SongAnalysisResult:
        """Process a song through the complete agent workflow.
        
        Args:
            song_title: Title of the song to analyze
            artist_name: Optional artist name
            
        Returns:
            SongAnalysisResult containing all analysis data
        """
        # Step 1: Get the lyrics
        print(f"Finding lyrics for '{song_title}' by {artist_name or 'unknown artist'}...")
        song_info = self.lyrics_agent.get_lyrics(song_title, artist_name)
        
        # Step 2: Translate the lyrics
        print("Translating lyrics...")
        translation = self.translation_agent.translate(song_info)
        
        # Step 3: Extract vocabulary
        print("Extracting vocabulary...")
        vocabulary = self.vocab_agent.extract_vocabulary(song_info)
        
        # Combine results
        return SongAnalysisResult(
            song_info=song_info,
            translation=translation,
            vocabulary=vocabulary
        )