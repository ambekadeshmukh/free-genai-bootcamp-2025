"""Agent for retrieving song lyrics."""

from typing import Dict, Any, Optional
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.tools import tool
from pydantic import BaseModel, Field

from utils.config import Config
from utils.api_clients import GeniusClient


class SongInfo(BaseModel):
    """Model for song information."""
    
    song_title: str = Field(..., description="The title of the song")
    artist_name: Optional[str] = Field(None, description="The name of the artist")
    lyrics: str = Field(..., description="The lyrics of the song")
    url: Optional[str] = Field(None, description="URL source of the lyrics")
    language: str = Field("french", description="The language of the lyrics")


class LyricsAgent:
    """Agent for finding and retrieving song lyrics."""
    
    def __init__(self):
        """Initialize the lyrics agent."""
        # Initialize the Genius client
        self.genius_client = GeniusClient()
        
        # Define the tools
        @tool
        def search_song_lyrics(song_title: str, artist_name: Optional[str] = None) -> Dict[str, Any]:
            """Search for song lyrics based on the title and optionally the artist name.
            
            Args:
                song_title: The title of the song to search for
                artist_name: Optional name of the artist
                
            Returns:
                Dictionary with song information including lyrics
            """
            return self.genius_client.search_song(song_title, artist_name)
        
        # Create the agent prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an agent specialized in finding French song lyrics. "
                      "Your task is to find accurate lyrics for the given song title and artist. "
                      "If the artist is not provided, try to infer it or find the most popular "
                      "version of the song. Ensure the lyrics are complete and in French."),
            ("user", "{input}")
        ])
        
        # Initialize the LLM
        llm = ChatOpenAI(
            api_key=Config.OPENAI_API_KEY,
            model=Config.LLM_MODEL,
            temperature=Config.TEMPERATURE
        )
        
        # Create the agent
        agent = create_openai_tools_agent(llm, [search_song_lyrics], prompt)
        self.agent_executor = AgentExecutor(agent=agent, tools=[search_song_lyrics], verbose=True)
    
    def get_lyrics(self, song_title: str, artist_name: Optional[str] = None) -> SongInfo:
        """Get lyrics for the specified song.
        
        Args:
            song_title: The title of the song
            artist_name: Optional name of the artist
            
        Returns:
            SongInfo object with song details and lyrics
        """
        # Direct call to Genius for efficiency
        result = self.genius_client.search_song(song_title, artist_name)
        
        if result.get("success", False):
            return SongInfo(
                song_title=result.get("title", song_title),
                artist_name=result.get("artist", artist_name),
                lyrics=result.get("lyrics", ""),
                url=result.get("url", ""),
                language="french"
            )
        
        # If direct call failed, use the agent
        agent_result = self.agent_executor.invoke({
            "input": f"Find the lyrics for the French song '{song_title}'"
            f"{f' by {artist_name}' if artist_name else ''}."
        })
        
        # Extract information from the agent result
        output = agent_result.get("output", "")
        
        # If the agent couldn't find the lyrics, return with error
        if "could not find" in output.lower() or "unable to find" in output.lower():
            return SongInfo(
                song_title=song_title,
                artist_name=artist_name,
                lyrics="Lyrics not found. Please try another song or check the spelling.",
                url=None,
                language="french"
            )
        
        # Extract lyrics from the agent output
        lyrics_start = output.find("```") + 3 if "```" in output else 0
        lyrics_end = output.rfind("```") if "```" in output else len(output)
        
        lyrics = output[lyrics_start:lyrics_end].strip()
        
        if not lyrics and "```" in output:
            # Try another approach to extract lyrics
            parts = output.split("```")
            if len(parts) >= 2:
                lyrics = parts[1].strip()
        
        if not lyrics:
            # If still no lyrics, just use the whole output
            lyrics = output
        
        return SongInfo(
            song_title=song_title,
            artist_name=artist_name,
            lyrics=lyrics,
            url=None,
            language="french"
        )