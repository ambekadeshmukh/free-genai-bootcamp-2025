import boto3
import json
from typing import List, Dict, Any
import random

class InteractiveLearning:
    def __init__(self):
        """Initialize the interactive learning system"""
        self.bedrock = boto3.client(
            service_name='bedrock-runtime',
            region_name='us-east-1'
        )

    def generate_exercise(self, content: str, exercise_type: str) -> Dict[str, Any]:
        """Generate interactive exercise based on content"""
        try:
            if exercise_type == "grammar":
                return self._generate_grammar_exercise(content)
            elif exercise_type == "vocabulary":
                return self._generate_vocabulary_exercise(content)
            elif exercise_type == "pronunciation":
                return self._generate_pronunciation_exercise(content)
            elif exercise_type == "listening":
                return self._generate_listening_exercise(content)
            else:
                raise ValueError(f"Unsupported exercise type: {exercise_type}")
                
        except Exception as e:
            raise Exception(f"Error generating exercise: {str(e)}")

    def _generate_grammar_exercise(self, content: str) -> Dict[str, Any]:
        """Generate grammar exercise"""
        prompt = f"""
        Create a French grammar exercise based on this content:
        {content}
        
        Include:
        1. A sentence with a blank
        2. Four multiple-choice options
        3. The correct answer
        4. An explanation
        
        Format the response as JSON with keys:
        - question
        - options (list)
        - correct_answer
        - explanation
        """
        
        response = self.bedrock.invoke_model(
            modelId='anthropic.claude-v2',
            body=json.dumps({
                "prompt": prompt,
                "max_tokens_to_sample": 500,
                "temperature": 0.7
            })
        )
        
        return json.loads(response['body'].read())

    def _generate_vocabulary_exercise(self, content: str) -> Dict[str, Any]:
        """Generate vocabulary exercise"""
        prompt = f"""
        Create a French vocabulary exercise based on this content:
        {content}
        
        Include:
        1. A French word or phrase
        2. Four possible English translations
        3. The correct translation
        4. Example usage
        
        Format as JSON with keys:
        - word
        - options (list)
        - correct_answer
        - example_usage
        """
        
        response = self.bedrock.invoke_model(
            modelId='anthropic.claude-v2',
            body=json.dumps({
                "prompt": prompt,
                "max_tokens_to_sample": 500,
                "temperature": 0.7
            })
        )
        
        return json.loads(response['body'].read())

    def _generate_pronunciation_exercise(self, content: str) -> Dict[str, Any]:
        """Generate pronunciation exercise"""
        prompt = f"""
        Create a French pronunciation exercise based on this content:
        {content}
        
        Include:
        1. A French phrase to pronounce
        2. Phonetic transcription
        3. Common pronunciation pitfalls
        4. Practice tips
        
        Format as JSON with keys:
        - phrase
        - phonetics
        - pitfalls
        - tips
        """
        
        response = self.bedrock.invoke_model(
            modelId='anthropic.claude-v2',
            body=json.dumps({
                "prompt": prompt,
                "max_tokens_to_sample": 500,
                "temperature": 0.7
            })
        )
        
        return json.loads(response['body'].read())

    def _generate_listening_exercise(self, content: str) -> Dict[str, Any]:
        """Generate listening comprehension exercise"""
        prompt = f"""
        Create a French listening exercise based on this content:
        {content}
        
        Include:
        1. A French audio script
        2. Comprehension questions
        3. Multiple choice answers
        4. Correct answers with explanations
        
        Format as JSON with keys:
        - script
        - questions (list)
        - options (list of lists)
        - correct_answers
        - explanations
        """
        
        response = self.bedrock.invoke_model(
            modelId='anthropic.claude-v2',
            body=json.dumps({
                "prompt": prompt,
                "max_tokens_to_sample": 500,
                "temperature": 0.7
            })
        )
        
        return json.loads(response['body'].read())

    def evaluate_response(self, exercise: Dict[str, Any], user_response: str) -> Dict[str, Any]:
        """Evaluate user's response to an exercise"""
        try:
            prompt = f"""
            Evaluate this French language response:
            Exercise: {json.dumps(exercise)}
            User's response: {user_response}
            
            Provide:
            1. Correctness (true/false)
            2. Detailed feedback
            3. Improvement suggestions
            4. Additional practice tips
            
            Format as JSON with keys:
            - correct
            - feedback
            - suggestions
            - practice_tips
            """
            
            response = self.bedrock.invoke_model(
                modelId='anthropic.claude-v2',
                body=json.dumps({
                    "prompt": prompt,
                    "max_tokens_to_sample": 500,
                    "temperature": 0.7
                })
            )
            
            return json.loads(response['body'].read())
            
        except Exception as e:
            raise Exception(f"Error evaluating response: {str(e)}")

    def get_progress_metrics(self, user_responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate learning progress metrics"""
        try:
            total_exercises = len(user_responses)
            correct_responses = sum(1 for r in user_responses if r.get('correct', False))
            
            # Calculate metrics by exercise type
            metrics_by_type = {}
            for response in user_responses:
                exercise_type = response.get('exercise_type', 'unknown')
                if exercise_type not in metrics_by_type:
                    metrics_by_type[exercise_type] = {
                        'total': 0,
                        'correct': 0
                    }
                
                metrics_by_type[exercise_type]['total'] += 1
                if response.get('correct', False):
                    metrics_by_type[exercise_type]['correct'] += 1
            
            # Calculate percentages
            for exercise_type in metrics_by_type:
                total = metrics_by_type[exercise_type]['total']
                correct = metrics_by_type[exercise_type]['correct']
                metrics_by_type[exercise_type]['percentage'] = (correct / total * 100) if total > 0 else 0
            
            return {
                'total_exercises': total_exercises,
                'correct_responses': correct_responses,
                'overall_percentage': (correct_responses / total_exercises * 100) if total_exercises > 0 else 0,
                'metrics_by_type': metrics_by_type
            }
            
        except Exception as e:
            raise Exception(f"Error calculating progress metrics: {str(e)}")