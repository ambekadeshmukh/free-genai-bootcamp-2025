from groq import Groq
import json
import os
from typing import List, Dict
from .prompts import VOCAB_GENERATION_PROMPT

class GroqClient:
    def __init__(self):
        self.client = Groq(
            api_key=os.getenv("GROQ_API_KEY")
        )
        self.model = "mixtral-8x7b-32768"

    def generate_vocabulary(self, theme: str, num_words: int) -> List[Dict]:
        """
        Generate vocabulary based on theme using Groq LLM
        """
        prompt = f"""Generate {num_words} vocabulary words related to {theme} in the following JSON format:
        [{{
            "french": "word in French",
            "english": "English translation",
            "pronunciation": "IPA pronunciation",
            "parts": [{{
                "type": "part of speech",
                "gender": "grammatical gender if applicable"
            }}]
        }}]
        """
        
        try:
            completion = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="mixtral-8x7b-32768",
                temperature=0.3,
                max_tokens=1000
            )
            
            # Extract and parse the JSON response
            response_text = completion.choices[0].message.content
            vocab_data = json.loads(response_text)
            return vocab_data
            
        except Exception as e:
            raise Exception(f"Failed to generate vocabulary: {str(e)}")

    def validate_response(self, vocab_data: List[Dict]) -> bool:
        """
        Validate the structure of the generated vocabulary
        """
        required_keys = {"french", "pronunciation", "english", "parts"}
        
        for item in vocab_data:
            if not all(key in item for key in required_keys):
                return False
            
            if not isinstance(item["parts"], list) or not item["parts"]:
                return False
                
        return True