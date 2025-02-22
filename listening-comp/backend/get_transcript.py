from youtube_transcript_api import YouTubeTranscriptApi
from typing import List, Dict, Optional
import re

class YouTubeTranscriptDownloader:
    def __init__(self):
        """Initialize the YouTube transcript downloader"""
        self.supported_languages = ['fr', 'en']  # French and English support

    def extract_video_id(self, url: str) -> str:
        """Extract video ID from YouTube URL"""
        video_id = None
        if 'v=' in url:
            video_id = url.split('v=')[1]
        elif 'youtu.be/' in url:
            video_id = url.split('youtu.be/')[1]
        
        if video_id and '&' in video_id:
            video_id = video_id.split('&')[0]
            
        if not video_id:
            raise ValueError("Could not extract video ID from URL")
            
        return video_id

    def get_transcript(self, url: str, target_language: str = 'fr') -> Optional[List[Dict]]:
        """Get transcript from YouTube video"""
        try:
            video_id = self.extract_video_id(url)
            
            # Try to get transcript in target language
            try:
                transcript = YouTubeTranscriptApi.get_transcript(
                    video_id, 
                    languages=[target_language]
                )
                return transcript
            except:
                # If target language not available, try English and translate
                if target_language != 'en':
                    transcript = YouTubeTranscriptApi.get_transcript(
                        video_id,
                        languages=['en']
                    )
                    # Note: In production, you would translate here using AWS Translate
                    return transcript
                raise

        except Exception as e:
            raise Exception(f"Error getting transcript: {str(e)}")

    def validate_transcript(self, transcript: List[Dict]) -> bool:
        """Validate transcript format and content"""
        if not transcript:
            return False
            
        required_keys = {'text', 'start', 'duration'}
        
        for entry in transcript:
            if not all(key in entry for key in required_keys):
                return False
            
            if not isinstance(entry['text'], str):
                return False
                
            if not isinstance(entry['start'], (int, float)):
                return False
                
            if not isinstance(entry['duration'], (int, float)):
                return False
                
        return True

    def clean_transcript(self, transcript: List[Dict]) -> List[Dict]:
        """Clean and normalize transcript text"""
        cleaned = []
        for entry in transcript:
            text = entry['text']
            
            # Remove multiple spaces
            text = re.sub(r'\s+', ' ', text)
            
            # Remove special characters but keep French accents
            text = re.sub(r'[^\w\s\'\-àâäçéèêëîïôöùûüÿ]', '', text)
            
            # Strip whitespace
            text = text.strip()
            
            if text:  # Only add non-empty entries
                cleaned.append({
                    'text': text,
                    'start': entry['start'],
                    'duration': entry['duration']
                })
                
        return cleaned

    def get_transcript_segments(self, transcript: List[Dict], segment_duration: float = 30.0) -> List[Dict]:
        """Group transcript entries into larger segments"""
        segments = []
        current_segment = {
            'text': '',
            'start': 0,
            'duration': 0
        }
        
        for entry in transcript:
            if current_segment['duration'] + entry['duration'] <= segment_duration:
                if current_segment['text']:
                    current_segment['text'] += ' '
                current_segment['text'] += entry['text']
                current_segment['duration'] += entry['duration']
            else:
                if current_segment['text']:
                    segments.append(current_segment)
                current_segment = {
                    'text': entry['text'],
                    'start': entry['start'],
                    'duration': entry['duration']
                }
                
        if current_segment['text']:
            segments.append(current_segment)
            
        return segments

def get_youtube_transcript(video_url: str) -> Optional[str]:
    """
    Get transcript from a YouTube video URL
    
    Args:
        video_url: YouTube video URL or ID
        
    Returns:
        Combined transcript text or None if failed
    """
    try:
        # Extract video ID from URL
        if "youtube.com" in video_url:
            video_id = video_url.split("v=")[1].split("&")[0]
        elif "youtu.be" in video_url:
            video_id = video_url.split("/")[-1]
        else:
            video_id = video_url

        # Get transcript
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        
        # Combine all text
        full_transcript = " ".join([entry['text'] for entry in transcript_list])
        
        return full_transcript
        
    except Exception as e:
        print(f"Error getting transcript: {str(e)}")
        return None

def get_transcript_segments(video_url: str) -> Optional[List[Dict]]:
    """
    Get transcript with timestamps from a YouTube video
    
    Args:
        video_url: YouTube video URL or ID
        
    Returns:
        List of transcript segments with timestamps or None if failed
    """
    try:
        # Extract video ID from URL
        if "youtube.com" in video_url:
            video_id = video_url.split("v=")[1].split("&")[0]
        elif "youtu.be" in video_url:
            video_id = video_url.split("/")[-1]
        else:
            video_id = video_url

        # Get transcript
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        return transcript_list
        
    except Exception as e:
        print(f"Error getting transcript segments: {str(e)}")
        return None