import re
from typing import List, Dict, Any
import pandas as pd
import json

class DataStructurer:
    def __init__(self):
        """Initialize the data structurer"""
        self.grammar_patterns = {
            'verb_conjugation': r'\b(?:je|tu|il|elle|nous|vous|ils|elles)\s+\w+(?:e|es|e|ons|ez|ent)\b',
            'articles': r'\b(?:le|la|les|un|une|des)\s+\w+\b',
            'prepositions': r'\b(?:à|de|dans|sur|sous|avec|sans|pour|par|en)\s+\w+\b'
        }

    def structure_transcript(self, transcript: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Convert raw transcript into structured format"""
        try:
            structured_data = {
                'segments': self._create_segments(transcript),
                'vocabulary': self._extract_vocabulary(transcript),
                'grammar_patterns': self._identify_grammar_patterns(transcript),
                'metadata': self._generate_metadata(transcript)
            }
            return structured_data
        except Exception as e:
            raise Exception(f"Error structuring transcript: {str(e)}")

    def _create_segments(self, transcript: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create learning segments from transcript"""
        segments = []
        current_segment = {
            'text': '',
            'start_time': 0,
            'duration': 0,
            'type': 'dialogue'  # or 'narrative' or 'instruction'
        }
        
        for entry in transcript:
            # Check if we should start a new segment
            if len(current_segment['text'].split()) >= 50:  # New segment every ~50 words
                segments.append(current_segment)
                current_segment = {
                    'text': '',
                    'start_time': entry['start'],
                    'duration': 0,
                    'type': 'dialogue'
                }
            
            # Add text to current segment
            if current_segment['text']:
                current_segment['text'] += ' '
            current_segment['text'] += entry['text']
            current_segment['duration'] += entry['duration']
        
        # Add final segment
        if current_segment['text']:
            segments.append(current_segment)
        
        return segments

    def _extract_vocabulary(self, transcript: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Extract vocabulary items from transcript"""
        # Combine all text
        full_text = ' '.join(entry['text'] for entry in transcript)
        
        # Extract different types of vocabulary
        vocabulary = {
            'nouns': self._extract_nouns(full_text),
            'verbs': self._extract_verbs(full_text),
            'adjectives': self._extract_adjectives(full_text),
            'expressions': self._extract_expressions(full_text)
        }
        
        return vocabulary

    def _identify_grammar_patterns(self, transcript: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Identify grammar patterns in transcript"""
        full_text = ' '.join(entry['text'] for entry in transcript)
        
        patterns = {}
        for pattern_name, pattern in self.grammar_patterns.items():
            matches = re.findall(pattern, full_text, re.IGNORECASE)
            patterns[pattern_name] = list(set(matches))  # Remove duplicates
        
        return patterns

    def _generate_metadata(self, transcript: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate metadata about the transcript"""
        full_text = ' '.join(entry['text'] for entry in transcript)
        
        metadata = {
            'total_duration': sum(entry['duration'] for entry in transcript),
            'word_count': len(full_text.split()),
            'difficulty_score': self._calculate_difficulty(full_text),
            'topics': self._identify_topics(full_text),
            'language_level': self._estimate_language_level(full_text)
        }
        
        return metadata

    def _extract_nouns(self, text: str) -> List[str]:
        """Extract nouns from text"""
        # Simple pattern for nouns (words following articles)
        pattern = r'\b(?:le|la|les|un|une|des)\s+(\w+)\b'
        return list(set(re.findall(pattern, text, re.IGNORECASE)))

    def _extract_verbs(self, text: str) -> List[str]:
        """Extract verbs from text"""
        # Simple pattern for verbs (words following pronouns)
        pattern = r'\b(?:je|tu|il|elle|nous|vous|ils|elles)\s+(\w+)\b'
        return list(set(re.findall(pattern, text, re.IGNORECASE)))

    def _extract_adjectives(self, text: str) -> List[str]:
        """Extract adjectives from text"""
        # Simple pattern for adjectives (words following être)
        pattern = r'\bêtre\s+(\w+)\b'
        return list(set(re.findall(pattern, text, re.IGNORECASE)))

    def _extract_expressions(self, text: str) -> List[str]:
        """Extract common expressions from text"""
        # Common French expressions
        expressions = [
            r'c\'est-à-dire',
            r'n\'est-ce pas',
            r'tout à fait',
            r'bien sûr',
            r'il y a'
        ]
        
        found_expressions = []
        for expr in expressions:
            if re.search(expr, text, re.IGNORECASE):
                found_expressions.append(expr)
        
        return found_expressions

    def _calculate_difficulty(self, text: str) -> float:
        """Calculate difficulty score of text"""
        # Simple difficulty calculation based on:
        # - Word length
        # - Sentence length
        # - Presence of complex grammar
        
        words = text.split()
        sentences = re.split(r'[.!?]+', text)
        
        avg_word_length = sum(len(word) for word in words) / len(words)
        avg_sentence_length = len(words) / len(sentences)
        
        # Count complex grammar patterns
        complex_patterns = sum(1 for pattern in self.grammar_patterns.values() 
                             if re.search(pattern, text, re.IGNORECASE))
        
        # Calculate score (1-5 scale)
        difficulty = (
            (avg_word_length / 10) +  # Longer words increase difficulty
            (avg_sentence_length / 20) +  # Longer sentences increase difficulty
            (complex_patterns / 10)  # More complex grammar increases difficulty
        )
        
        return min(5, max(1, difficulty))  # Ensure score is between 1-5

    def _identify_topics(self, text: str) -> List[str]:
        """Identify topics discussed in text"""
        # Simple topic identification based on keyword frequency
        topics = {
            'travel': ['voyage', 'train', 'hôtel', 'visiter'],
            'food': ['manger', 'restaurant', 'cuisine', 'repas'],
            'work': ['travail', 'bureau', 'emploi', 'réunion'],
            'education': ['école', 'étudier', 'professeur', 'cours']
        }
        
        found_topics = []
        for topic, keywords in topics.items():
            if any(keyword in text.lower() for keyword in keywords):
                found_topics.append(topic)
        
        return found_topics

    def _estimate_language_level(self, text: str) -> str:
        """Estimate CEFR language level of text"""
        # Simplified CEFR level estimation based on:
        # - Vocabulary complexity
        # - Grammar complexity
        # - Text length
        
        difficulty_score = self._calculate_difficulty(text)
        
        if difficulty_score < 2:
            return 'A1'
        elif difficulty_score < 3:
            return 'A2'
        elif difficulty_score < 4:
            return 'B1'
        elif difficulty_score < 4.5:
            return 'B2'
        else:
            return 'C1'

    def export_to_json(self, structured_data: Dict[str, Any], file_path: str):
        """Export structured data to JSON file"""
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(structured_data, f, ensure_ascii=False, indent=2)

    def export_to_csv(self, structured_data: Dict[str, Any], file_path: str):
        """Export structured data to CSV file"""
        # Convert nested structure to flat format
        flat_data = []
        for segment in structured_data['segments']:
            flat_data.append({
                'text': segment['text'],
                'start_time': segment['start_time'],
                'duration': segment['duration'],
                'type': segment['type']
            })
        
        df = pd.DataFrame(flat_data)
        df.to_csv(file_path, index=False, encoding='utf-8')