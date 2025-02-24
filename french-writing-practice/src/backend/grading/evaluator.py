from difflib import SequenceMatcher
import re
import unicodedata
from src.backend.grading.feedback import generate_feedback
from src.utils.helpers import load_config

class Evaluator:
    def __init__(self):
        # Load configuration
        config = load_config()
        self.sensitivity = config.get("grading_sensitivity", 0.8)
        self.feedback_language = config.get("feedback_language", "english")
        
        # French accent mappings for accent-insensitive comparison
        self.accent_mappings = {
            'à': 'a', 'á': 'a', 'â': 'a', 'ä': 'a',
            'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
            'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
            'ò': 'o', 'ó': 'o', 'ô': 'o', 'ö': 'o',
            'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
            'ÿ': 'y', 'ç': 'c'
        }
    
    def normalize_text(self, text):
        """Normalize text for comparison"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove extra spaces
        text = ' '.join(text.split())
        
        # Remove punctuation except apostrophes
        text = re.sub(r'[^\w\s\']', '', text)
        
        return text
    
    def remove_accents(self, text):
        """Remove accents for accent-insensitive comparison"""
        return ''.join(self.accent_mappings.get(c, c) for c in text)
    
    def calculate_similarity(self, text1, text2):
        """Calculate similarity ratio between two texts"""
        return SequenceMatcher(None, text1, text2).ratio()
    
    def check_accents(self, submitted, expected):
        """Check for accent mistakes"""
        # Normalize case and whitespace
        submitted = self.normalize_text(submitted)
        expected = self.normalize_text(expected)
        
        # If they're the same with accents, no accent mistakes
        if submitted == expected:
            return []
        
        # If they're the same without accents, there are accent mistakes
        if self.remove_accents(submitted) == self.remove_accents(expected):
            mistakes = []
            for i, (s, e) in enumerate(zip(submitted, expected)):
                if s != e and self.remove_accents(s) == self.remove_accents(e):
                    mistakes.append({
                        "position": i,
                        "submitted": s,
                        "expected": e
                    })
            return mistakes
        
        # Otherwise, there are other mistakes
        return []
    
    def evaluate(self, submitted_text, expected_text):
        """Evaluate the submission and grade it"""
        # Normalize for comparison
        norm_submitted = self.normalize_text(submitted_text)
        norm_expected = self.normalize_text(expected_text)
        
        # Direct comparison
        exact_match = norm_submitted == norm_expected
        
        # Check accent mistakes
        accent_mistakes = self.check_accents(submitted_text, expected_text)
        
        # Calculate similarity
        similarity = self.calculate_similarity(norm_submitted, norm_expected)
        
        # Calculate similarity without accents
        no_accent_similarity = self.calculate_similarity(
            self.remove_accents(norm_submitted),
            self.remove_accents(norm_expected)
        )
        
        # Determine if it's correct based on similarity thresholds
        if exact_match:
            correctness = True
        elif no_accent_similarity > 0.95 and accent_mistakes:
            # Close enough but with accent mistakes
            correctness = False
        elif similarity >= self.sensitivity:
            correctness = True
        else:
            correctness = False
        
        # Prepare evaluation result
        result = {
            "correct": correctness,
            "exact_match": exact_match,
            "similarity": similarity,
            "no_accent_similarity": no_accent_similarity,
            "accent_mistakes": accent_mistakes,
            "submitted": submitted_text,
            "expected": expected_text
        }
        
        return result

def grade_submission(submitted_text, expected_text):
    """Public API for grading submissions"""
    evaluator = Evaluator()
    evaluation = evaluator.evaluate(submitted_text, expected_text)
    
    # Generate feedback based on evaluation
    feedback = generate_feedback(evaluation)
    
    # Return simplified result for the UI
    return {
        "correct": evaluation["correct"],
        "feedback": feedback,
        "similarity": evaluation["similarity"]
    }