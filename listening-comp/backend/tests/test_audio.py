import unittest
from pathlib import Path
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.audio_generator import AudioGenerator

class TestAudioGenerator(unittest.TestCase):
    def setUp(self):
        """Set up test environment"""
        self.audio_gen = AudioGenerator()
        self.test_texts = {
            'simple': "Bonjour, comment allez-vous?",
            'dialogue': {
                'question': "Où est la bibliothèque?",
                'response': "C'est au deuxième étage."
            }
        }
        self.test_dir = Path('test_audio')
        self.test_dir.mkdir(exist_ok=True)

    def test_audio_generation(self):
        """Test basic audio generation"""
        output_path = self.audio_gen.generate_audio(
            text=self.test_texts['simple'],
            voice_type='female',
            output_filename=str(self.test_dir / "test_basic.mp3")
        )
        self.assertTrue(Path(output_path).exists())

    def test_dialogue_generation(self):
        """Test dialogue audio generation"""
        dialogue = {
            'speaker1': "Bonjour, je voudrais un café.",
            'speaker2': "Bien sûr, ce sera tout?"
        }
        outputs = self.audio_gen.generate_dialogue_audio(
            dialogue=dialogue,
            output_dir=self.test_dir
        )
        for path in outputs.values():
            self.assertTrue(Path(path).exists())

    def test_question_audio(self):
        """Test question and answer audio generation"""
        question = "Quelle heure est-il?"
        options = ["Il est midi", "Il est trois heures", "Il est sept heures"]
        
        outputs = self.audio_gen.generate_question_audio(
            question=question,
            options=options,
            output_dir=self.test_dir
        )
        
        self.assertIn('question', outputs)
        self.assertEqual(len(outputs['options']), len(options))
        for path in outputs['options']:
            self.assertTrue(Path(path).exists())

    def test_voice_selection(self):
        """Test different voice types"""
        text = "Bonjour tout le monde"
        
        male_output = self.audio_gen.generate_audio(
            text=text,
            voice_type='male',
            output_filename=str(self.test_dir / "male_test.mp3")
        )
        
        female_output = self.audio_gen.generate_audio(
            text=text,
            voice_type='female',
            output_filename=str(self.test_dir / "female_test.mp3")
        )
        
        self.assertNotEqual(male_output, female_output)

    def test_error_handling(self):
        """Test error handling for invalid inputs"""
        with self.assertRaises(ValueError):
            self.audio_gen.generate_audio("", voice_type='female')
            
        with self.assertRaises(ValueError):
            self.audio_gen.generate_audio(
                self.test_texts['simple'],
                voice_type='invalid_voice'
            )

    def tearDown(self):
        """Clean up test files"""
        import shutil
        shutil.rmtree(self.test_dir, ignore_errors=True)

if __name__ == '__main__':
    unittest.main()