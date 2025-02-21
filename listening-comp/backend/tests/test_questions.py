import unittest
from pathlib import Path
import json
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.question_generator import QuestionGenerator

class TestQuestionGenerator(unittest.TestCase):
    def setUp(self):
        """Set up test environment"""
        self.question_gen = QuestionGenerator()
        self.test_dir = Path('test_questions')
        self.test_dir.mkdir(exist_ok=True)
        
        self.sample_dialogue = """
        Client: Bonjour, je voudrais réserver une table pour ce soir.
        Serveur: Bonsoir, pour combien de personnes?
        Client: Pour quatre personnes, s'il vous plaît.
        Serveur: D'accord, à quelle heure souhaitez-vous venir?
        Client: Vers 20 heures, c'est possible?
        Serveur: Oui, parfait. Au nom de?
        Client: C'est au nom de Martin.
        """

    def test_dialogue_question_generation(self):
        """Test generating questions from dialogue"""
        questions = self.question_gen.generate_dialogue_questions(self.sample_dialogue)
        
        self.assertIsInstance(questions, list)
        self.assertTrue(len(questions) > 0)
        
        for question in questions:
            self.assertIn('question_fr', question)
            self.assertIn('question_en', question)
            self.assertIn('options', question)
            self.assertIsInstance(question['options'], list)
            self.assertIn('correct_answer', question)
            self.assertIn('explanation', question)

    def test_grammar_question_generation(self):
        """Test generating grammar questions"""
        grammar_topics = ['passé composé', 'imparfait', 'articles']
        
        for topic in grammar_topics:
            questions = self.question_gen.generate_grammar_questions(topic)
            self.assertIsInstance(questions, list)
            self.assertTrue(len(questions) > 0)
            
            for question in questions:
                self.assertIn('grammar_point', question)
                self.assertEqual(question['grammar_point'], topic)

    def test_vocabulary_question_generation(self):
        """Test generating vocabulary questions"""
        context = "Au restaurant"
        questions = self.question_gen.generate_vocabulary_questions(context)
        
        self.assertIsInstance(questions, list)
        self.assertTrue(len(questions) > 0)
        
        for question in questions:
            self.assertIn('vocabulary_domain', question)
            self.assertEqual(question['vocabulary_domain'], context)

    def test_question_storage(self):
        """Test storing and retrieving questions"""
        questions = self.question_gen.generate_dialogue_questions(self.sample_dialogue)
        
        # Test saving
        save_path = self.test_dir / 'test_questions.json'
        self.question_gen.save_questions(questions, str(save_path))
        self.assertTrue(save_path.exists())
        
        # Test loading
        loaded_questions = self.question_gen.load_questions(str(save_path))
        self.assertEqual(len(questions), len(loaded_questions))
        
        # Compare content
        self.assertEqual(
            json.dumps(questions, sort_keys=True),
            json.dumps(loaded_questions, sort_keys=True)
        )

    def test_difficulty_levels(self):
        """Test question generation at different difficulty levels"""
        levels = ['A1', 'A2', 'B1', 'B2']
        
        for level in levels:
            questions = self.question_gen.generate_dialogue_questions(
                self.sample_dialogue,
                difficulty=level
            )
            
            for question in questions:
                self.assertIn('difficulty', question)
                self.assertEqual(question['difficulty'], level)

    def test_error_handling(self):
        """Test error handling for invalid inputs"""
        with self.assertRaises(ValueError):
            self.question_gen.generate_dialogue_questions("")
            
        with self.assertRaises(ValueError):
            self.question_gen.generate_grammar_questions("")
            
        with self.assertRaises(FileNotFoundError):
            self.question_gen.load_questions("nonexistent_file.json")

    def tearDown(self):
        """Clean up test files"""
        import shutil
        shutil.rmtree(self.test_dir, ignore_errors=True)

if __name__ == '__main__':
    unittest.main()