"""API client utilities for the song-vocab application."""

import requests
from bs4 import BeautifulSoup
import lyricsgenius
from typing import Optional, Dict, Any, Tuple

from utils.config import Config


class GeniusClient:
    """Client for interacting with the Genius lyrics API."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the Genius API client.
        
        Args:
            api_key: Genius API key, defaults to the one in Config
        """
        self.api_key = api_key or Config.GENIUS_API_KEY
        if self.api_key:
            self.genius = lyricsgenius.Genius(self.api_key)
            # Don't print status messages
            self.genius.verbose = False
            # Remove section headers from lyrics
            self.genius.remove_section_headers = True
        else:
            self.genius = None
    
    def search_song(self, title: str, artist: Optional[str] = None) -> Dict[str, Any]:
        """Search for a song on Genius.
        
        Args:
            title: Song title
            artist: Optional artist name
            
        Returns:
            Dictionary with song information including lyrics
        """
        if self.genius:
            search_term = f"{title} {artist}" if artist else title
            try:
                song = self.genius.search_song(title=title, artist=artist)
                if song:
                    return {
                        "success": True,
                        "title": song.title,
                        "artist": song.artist,
                        "lyrics": song.lyrics,
                        "url": song.url
                    }
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        # Fallback to web scraping if Genius API is not available or failed
        return self._fallback_search(title, artist)
    
    def _fallback_search(self, title: str, artist: Optional[str] = None) -> Dict[str, Any]:
        """Fallback search method using web scraping.
        
        Args:
            title: Song title
            artist: Optional artist name
            
        Returns:
            Dictionary with song information including lyrics
        """
        search_term = f"{title} {artist} paroles" if artist else f"{title} paroles"
        search_url = f"https://www.google.com/search?q={search_term.replace(' ', '+')}"
        
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
            response = requests.get(search_url, headers=headers)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Look for common lyrics sites in search results
            lyrics_sites = ['paroles.net', 'genius.com', 'musixmatch.com', 'lyrics.com']
            
            for site in lyrics_sites:
                for link in soup.find_all('a'):
                    href = link.get('href', '')
                    if site in href and '/url?q=' in href:
                        lyrics_url = href.split('/url?q=')[1].split('&')[0]
                        lyrics_response = requests.get(lyrics_url, headers=headers)
                        lyrics_soup = BeautifulSoup(lyrics_response.text, 'html.parser')
                        
                        # Extract lyrics based on common class names in lyrics sites
                        lyrics_selectors = [
                            '.lyrics', '.Lyrics__Container', 
                            '.mxm-lyrics', '.lyricbox',
                            '.paroles', '.text-lyrics'
                        ]
                        
                        for selector in lyrics_selectors:
                            lyrics_div = lyrics_soup.select_one(selector)
                            if lyrics_div:
                                return {
                                    "success": True,
                                    "title": title,
                                    "artist": artist or "Unknown",
                                    "lyrics": lyrics_div.get_text(separator="\n").strip(),
                                    "url": lyrics_url
                                }
            
            return {"success": False, "error": "Could not find lyrics"}
        
        except Exception as e:
            return {"success": False, "error": str(e)}