import whisper
from pathlib import Path
from typing import Dict, Optional

class SpeechToText:
    def __init__(self, model_size: str = 'base'):
        """
        Initialize speech-to-text with OpenWhisper
        Args:
            model_size: 'tiny', 'base', 'small', 'medium', or 'large'
        """
        self.model = whisper.load_model(model_size)
        self.temp_dir = Path('temp/audio')
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def transcribe_audio(self, audio_path: str, language: str = 'fr') -> Dict:
        """
        Transcribe audio file to text
        Args:
            audio_path: Path to audio file
            language: Language code (default: 'fr' for French)
        Returns:
            Dictionary containing transcription and metadata
        """
        try:
            # Transcribe audio
            result = self.model.transcribe(
                audio_path,
                language=language,
                task='transcribe'
            )
            
            return {
                'text': result['text'],
                'segments': result['segments'],
                'language': result['language']
            }

        except Exception as e:
            raise Exception(f"Error transcribing audio: {str(e)}")

    def transcribe_with_timestamps(self, audio_path: str) -> Dict:
        """Transcribe audio with word-level timestamps"""
        try:
            result = self.model.transcribe(
                audio_path,
                language='fr',
                task='transcribe',
                word_timestamps=True
            )
            
            return {
                'text': result['text'],
                'words': result['words'],
                'segments': result['segments']
            }

        except Exception as e:
            raise Exception(f"Error generating timestamps: {str(e)}")

    def clean_temp_files(self):
        """Clean up temporary audio files"""
        for file in self.temp_dir.glob('*'):
            file.unlink()