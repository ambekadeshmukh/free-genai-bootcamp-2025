import boto3
import os
from pathlib import Path
from typing import Dict, Optional

class AudioGenerator:
    def __init__(self):
        """Initialize audio generator with Amazon Polly"""
        self.polly = boto3.client('polly')
        self.voices = {
            'male': 'Mathieu',    # French male voice
            'female': 'Léa'       # French female voice
        }
        self.output_dir = Path('static/audio')
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_audio(self, text: str, voice_type: str = 'female') -> str:
        """
        Generate audio using Amazon Polly
        Args:
            text: Text to convert to speech
            voice_type: 'male' or 'female'
        Returns:
            Path to the generated audio file
        """
        try:
            # Select voice
            voice_id = self.voices.get(voice_type, self.voices['female'])
            
            # Generate speech using Polly
            response = self.polly.synthesize_speech(
                Engine='neural',
                LanguageCode='fr-FR',
                Text=text,
                OutputFormat='mp3',
                VoiceId=voice_id
            )

            # Save the audio file
            output_filename = f"audio_{hash(text)}.mp3"
            output_path = self.output_dir / output_filename
            
            with open(output_path, 'wb') as f:
                f.write(response['AudioStream'].read())

            return str(output_path)

        except Exception as e:
            raise Exception(f"Error generating audio: {str(e)}")

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