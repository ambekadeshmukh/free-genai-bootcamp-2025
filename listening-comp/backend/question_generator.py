import json
import boto3
from typing import List, Dict, Any
import random
from pathlib import Path

class QuestionGenerator:
    def __init__(self):
        """Initialize the question generator"""
        self.bedrock = boto3.client('bedrock-runtime')
        self.questions_dir = Path('data/questions')
        self.questions_dir.mkdir(parents=True, exist_ok=True)

    def generate_dialogue_questions(self, dialogue: str) -> List[Dict[str, Any]]:
        """Generate questions from a dialogue"""
        prompt = f"""
        Create 3 comprehension questions based on this French dialogue:
        {dialogue}

        For each question:
        1. Write the question in French
        2. Provide an English translation
        3. Create 4 multiple-choice options in French
        4. Mark the correct answer
        5. Provide an explanation in English

        Format as JSON with structure:
        {{
            "questions": [
                {{
                    "question_fr": "...",
                    "question_en": "...",
                    "options": ["...", "...", "...", "..."],
                    "correct_index": 0,
                    "explanation": "..."
                }}
            ]
        }}
        """

        try:
            response = self.bedrock.invoke_model(
                modelId='anthropic.claude-v2',
                body=json.dumps({
                    "prompt": prompt,
                    "max_tokens_to_sample": 1000,
                    "temperature": 0.7
                })
            )
            
            return json.loads(response['body'].read())['questions']
            
        except Exception as e:
            raise Exception(f"Error generating questions: {str(e)}")

    def generate_grammar_questions(self, topic: str) -> List[Dict[str, Any]]:
        """Generate grammar-focused questions"""
        prompt = f"""
        Create 3 French grammar questions about: {topic}

        For each question:
        1. Write a sentence with a blank in French
        2. Provide 4 options that test the grammar concept
        3. Mark the correct answer
        4. Explain the grammar rule in English

        Format as JSON with the same structure as dialogue questions.
        """

        try:
            response = self.bedrock.invoke_model(
                modelId='anthropic.claude-v2',
                body=json.dumps({
                    "prompt": prompt,
                    "max_tokens_to_sample": 1000,
                    "temperature": 0.7
                })
            )
            
            return json.loads(response['body'].read())['questions']
            
        except Exception as e:
            raise Exception(f"Error generating grammar questions: {str(e)}")

    def generate_vocabulary_questions(self, context: str) -> List[Dict[str, Any]]:
        """Generate vocabulary-focused questions"""
        prompt = f"""
        Create 3 French vocabulary questions based on:
        {context}

        For each question:
        1. Select a key vocabulary word or phrase
        2. Create a question testing its meaning or usage
        3. Provide 4 multiple-choice options
        4. Include example sentences
        5. Explain the usage

        Format as JSON with the same structure.
        """

        try:
            response = self.bedrock.invoke_model(
                modelId='anthropic.claude-v2',
                body=json.dumps({
                    "prompt": prompt,
                    "max_tokens_to_sample": 1000,
                    "temperature": 0.7
                })
            )
            
            return json.loads(response['body'].read())['questions']
            
        except Exception as e:
            raise Exception(f"Error generating vocabulary questions: {str(e)}")

    def save_questions(self, questions: List[Dict[str, Any]], category: str):
        """Save generated questions to file"""
        output_file = self.questions_dir / f"{category}_questions.json"
        
        # Load existing questions if file exists
        if output_file.exists():
            with open(output_file, 'r', encoding='utf-8') as f:
                existing = json.load(f)
                questions.extend(existing)

        # Save updated questions
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)

    def load_questions(self, category: str) -> List[Dict[str, Any]]:
        """Load questions from file"""
        input_file = self.questions_dir / f"{category}_questions.json"
        
        if not input_file.exists():
            return []
            
        with open(input_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    def get_random_question(self, category: str) -> Dict[str, Any]:
        """Get a random question from a category"""
        questions = self.load_questions(category)
        if not questions:
            return None
        return random.choice(questions)