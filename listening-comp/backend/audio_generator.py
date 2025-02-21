import boto3
import json
from pathlib import Path
import os
from typing import Optional

class AudioGenerator:
    def __init__(self):
        """Initialize the audio generator with AWS Polly"""
        self.polly = boto3.client('polly')
        self.voices = {
            'female': 'Lea',  # French female voice
            'male': 'Mathieu'  # French male voice
        }
        self.output_dir = Path('static/audio')
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_audio(
        self,
        text: str,
        voice_type: str = 'female',
        output_filename: Optional[str] = None
    ) -> str:
        """
        Generate audio from text using AWS Polly
        
        Args:
            text: French text to convert to speech
            voice_type: 'male' or 'female'
            output_filename: Optional custom filename
            
        Returns:
            Path to generated audio file
        """
        try:
            # Select voice
            voice_id = self.voices.get(voice_type, self.voices['female'])
            
            # Generate speech
            response = self.polly.synthesize_speech(
                Engine='neural',
                LanguageCode='fr-FR',
                Text=text,
                OutputFormat='mp3',
                VoiceId=voice_id
            )

            # Generate filename if not provided
            if not output_filename:
                output_filename = f"audio_{hash(text)}.mp3"
            
            # Ensure .mp3 extension
            if not output_filename.endswith('.mp3'):
                output_filename += '.mp3'

            # Save audio file
            output_path = self.output_dir / output_filename
            with open(output_path, 'wb') as f:
                f.write(response['AudioStream'].read())

            return str(output_path)

        except Exception as e:
            raise Exception(f"Error generating audio: {str(e)}")

    def generate_dialogue_audio(
        self,
        dialogue: dict,
        prefix: str = "dialogue"
    ) -> dict:
        """
        Generate audio for a dialogue with multiple speakers
        
        Args:
            dialogue: Dictionary containing dialogue parts
            prefix: Prefix for audio files
            
        Returns:
            Dictionary mapping dialogue parts to audio files
        """
        audio_files = {}
        
        for i, (speaker, text) in enumerate(dialogue.items()):
            # Determine voice type based on speaker
            voice_type = 'female' if 'femme' in speaker.lower() else 'male'
            
            # Generate unique filename
            filename = f"{prefix}_{i+1}.mp3"
            
            # Generate audio
            audio_path = self.generate_audio(
                text=text,
                voice_type=voice_type,
                output_filename=filename
            )
            
            audio_files[speaker] = audio_path

        return audio_files

    def generate_question_audio(
        self,
        question: str,
        options: list,
        prefix: str = "question"
    ) -> dict:
        """
        Generate audio for a question and its options
        
        Args:
            question: Question text
            options: List of option texts
            prefix: Prefix for audio files
            
        Returns:
            Dictionary with paths to generated audio files
        """
        audio_files = {
            'question': self.generate_audio(
                text=question,
                output_filename=f"{prefix}_question.mp3"
            )
        }
        
        for i, option in enumerate(options):
            audio_files[f'option_{i+1}'] = self.generate_audio(
                text=option,
                output_filename=f"{prefix}_option_{i+1}.mp3"
            )
            
        return audio_files

    def clean_old_files(self, max_age_hours: int = 24):
        """Clean up old audio files"""
        current_time = time.time()
        
        for file in self.output_dir.glob('*.mp3'):
            file_age = current_time - os.path.getctime(file)
            if file_age > max_age_hours * 3600:
                os.remove(file)