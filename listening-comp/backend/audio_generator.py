import boto3
import os
from pathlib import Path
from typing import Dict, Optional
from botocore.exceptions import BotoCoreError, ClientError

class AudioGenerator:
    def __init__(self):
        """Initialize audio generator with Amazon Polly"""
        self.client = boto3.client('polly')
        self.french_voices = {
            'female': ['Lea', 'Celine'],  # Note: 'Lea' not 'Léa'
            'male': ['Mathieu']
        }
        self.output_dir = Path('static/audio')
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_audio(self, text: str, gender: str = 'female') -> bytes:
        """
        Generate audio from text using Amazon Polly
        
        Args:
            text: Text to convert to speech
            gender: 'male' or 'female'
            
        Returns:
            Audio bytes
        """
        try:
            # Select voice based on gender
            voice_id = self.french_voices[gender.lower()][0]
            
            response = self.client.synthesize_speech(
                Text=text,
                OutputFormat='mp3',
                VoiceId=voice_id,
                LanguageCode='fr-FR'
            )
            
            if "AudioStream" in response:
                return response["AudioStream"].read()
            else:
                raise Exception("No audio stream in response")
                
        except (BotoCoreError, ClientError) as error:
            print(f"Error generating audio: {error}")
            raise error

    def generate_question_audio(self, question: str, options: list) -> Dict[str, str]:
        """Generate audio for a question and its options"""
        audio_files = {
            'question': self.generate_audio(question),
            'options': []
        }
        
        for option in options:
            audio_files['options'].append(self.generate_audio(option))
            
        return audio_files

    def clean_old_files(self, max_age_hours: int = 24):
        """Clean up old audio files"""
        import time
        current_time = time.time()
        
        for file in self.output_dir.glob('*.mp3'):
            file_age = current_time - os.path.getctime(file)
            if file_age > max_age_hours * 3600:
                os.remove(file)