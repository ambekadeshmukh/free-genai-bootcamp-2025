import unittest
from pathlib import Path
from audio_generator import AudioGenerator

class TestAudioGenerator(unittest.TestCase):
    def setUp(self):
        """Set up test environment"""
        self.audio_gen = AudioGenerator()
        self.test_text = "Bonjour, comment allez-vous?"

    def test_audio_generation(self):
        """Test basic audio generation"""
        output_path = self.audio_gen.generate_audio(
            text=self.test_text,
            output_filename="test_audio.mp3"
        )
        self.assertTrue(Path(output_path).exists())
        self.assertTrue(output_path.endswith('.mp3'))

    def test_dialogue_audio(self):
        """Test dialogue audio generation"""
        dialogue = {
            "homme": "Bonjour, madame",
            "femme": "Bonjour, monsieur"
        }
        audio_files = self.audio_gen.generate_dialogue_audio(
            dialogue=dialogue,
            prefix="test_dialogue"
        )
        self.assertEqual(len(audio_files), 2)
        for path in audio_files.values():
            self.assertTrue(Path(path).exists())

    def test_question_audio(self):
        """Test question audio generation"""
        question = "Quelle heure est-il?"
        options = [
            "Il est midi",
            "Il est trois heures",
            "Il est sept heures",
            "Il est minuit"
        ]
        audio_files = self.audio_gen.generate_question_audio(
            question=question,
            options=options,
            prefix="test_question"
        )
        self.assertEqual(len(audio_files), 5)  # question + 4 options
        for path in audio_files.values():
            self.assertTrue(Path(path).exists())

    def test_voice_selection(self):
        """Test voice type selection"""
        male_audio = self.audio_gen.generate_audio(
            text=self.test_text,
            voice_type='male',
            output_filename="test_male.mp3"
        )
        female_audio = self.audio_gen.generate_audio(
            text=self.test_text,
            voice_type='female',
            output_filename="test_female.mp3"
        )
        
        self.assertNotEqual(male_audio, female_audio)
        self.assertTrue(Path(male_audio).exists())
        self.assertTrue(Path(female_audio).exists())

    def test_file_cleanup(self):
        """Test old file cleanup"""
        # Generate test file
        test_path = self.audio_gen.generate_audio(
            text=self.test_text,
            output_filename="cleanup_test.mp3"
        )
        
        # Verify file exists
        self.assertTrue(Path(test_path).exists())
        
        # Run cleanup
        self.audio_gen.clean_old_files(max_age_hours=0)
        
        # Verify file was removed
        self.assertFalse(Path(test_path).exists())

    def tearDown(self):
        """Clean up test files"""
        for file in Path(self.audio_gen.output_dir).glob('test_*.mp3'):
            file.unlink(missing_ok=True)

if __name__ == '__main__':
    unittest.main()