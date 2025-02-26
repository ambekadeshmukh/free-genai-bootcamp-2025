from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import logging
import random
from typing import List, Dict, Any, Optional
import requests
from comps import MicroService, ServiceOrchestrator, ServiceType

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
LLM_API_URL = os.getenv("LLM_API_URL", "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2")

app = FastAPI(title="French Language Generation Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load French example sentences and vocabulary
FRENCH_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "french_vocabulary.json")

try:
    with open(FRENCH_DATA_PATH, "r", encoding="utf-8") as f:
        FRENCH_DATA = json.load(f)
except FileNotFoundError:
    # Create a basic structure if file doesn't exist
    logger.warning(f"French vocabulary file not found at {FRENCH_DATA_PATH}. Creating basic structure.")
    FRENCH_DATA = {
        "vocabulary": {
            "animals": {
                "elephant": {
                    "translation": "éléphant",
                    "examples": [
                        {"fr": "L'éléphant est un animal très intelligent.", 
                         "en": "The elephant is a very intelligent animal."},
                        {"fr": "J'ai vu un éléphant au zoo.", 
                         "en": "I saw an elephant at the zoo."},
                        {"fr": "Les éléphants ont une excellente mémoire.", 
                         "en": "Elephants have an excellent memory."}
                    ]
                },
                "cat": {
                    "translation": "chat",
                    "examples": [
                        {"fr": "Mon chat s'appelle Minou.", 
                         "en": "My cat's name is Minou."},
                        {"fr": "Le chat dort sur le canapé.", 
                         "en": "The cat is sleeping on the couch."},
                        {"fr": "J'aime jouer avec mon chat.", 
                         "en": "I like playing with my cat."}
                    ]
                }
            },
            "food": {
                "apple": {
                    "translation": "pomme",
                    "examples": [
                        {"fr": "J'ai mangé une pomme ce matin.", 
                         "en": "I ate an apple this morning."},
                        {"fr": "Les pommes rouges sont délicieuses.", 
                         "en": "Red apples are delicious."},
                        {"fr": "Je préfère les pommes vertes.", 
                         "en": "I prefer green apples."}
                    ]
                }
            }
        }
    }
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(FRENCH_DATA_PATH), exist_ok=True)
    
    # Save the basic structure
    with open(FRENCH_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(FRENCH_DATA, f, ensure_ascii=False, indent=2)

class ExamplesRequest(BaseModel):
    word: str
    count: int = 3
    difficulty: str = "beginner"

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class QuizRequest(BaseModel):
    word: str
    difficulty: str = "beginner"

class ProcessResponseRequest(BaseModel):
    text: str
    context: Optional[Dict[str, Any]] = None

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/examples")
async def get_examples(request: ExamplesRequest):
    """Get example sentences for a French word"""
    # First, try to find the word in our local vocabulary
    word_lower = request.word.lower()
    
    # Search through all categories
    examples = []
    found = False
    
    for category, words in FRENCH_DATA["vocabulary"].items():
        if word_lower in words:
            found = True
            # Get examples from our data
            examples = words[word_lower]["examples"][:request.count]
            break
    
    # If not found in our vocabulary, generate examples using LLM
    if not found:
        try:
            prompt = f"""Generate {request.count} example sentences in French using the word '{request.word}'. 
            For each sentence, also provide an English translation.
            Format the response as a JSON array of objects with 'fr' and 'en' keys.
            Make the sentences appropriate for {request.difficulty} level French learners."""
            
            headers = {}
            if HUGGINGFACE_API_TOKEN:
                headers["Authorization"] = f"Bearer {HUGGINGFACE_API_TOKEN}"
            
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 512,
                    "temperature": 0.7,
                    "return_full_text": False
                }
            }
            
            response = requests.post(LLM_API_URL, headers=headers, json=payload)
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    # Extract the generated text
                    if isinstance(result, list):
                        generated_text = result[0].get("generated_text", "")
                    else:
                        generated_text = result.get("generated_text", "")
                    
                    # Try to parse JSON from the generated text
                    # Find JSON array in the text
                    start_idx = generated_text.find('[')
                    end_idx = generated_text.rfind(']') + 1
                    
                    if start_idx >= 0 and end_idx > start_idx:
                        json_str = generated_text[start_idx:end_idx]
                        examples = json.loads(json_str)
                    else:
                        # Fallback to simple parsing
                        examples = []
                        lines = generated_text.strip().split('\n')
                        for i in range(0, len(lines), 2):
                            if i+1 < len(lines):
                                examples.append({
                                    "fr": lines[i].strip(),
                                    "en": lines[i+1].strip()
                                })
                    
                    # Store in our vocabulary for future use
                    # Find appropriate category or create new
                    category = "other"
                    new_entry = {
                        word_lower: {
                            "translation": request.word,  # Use as is since we don't know
                            "examples": examples
                        }
                    }
                    
                    if "vocabulary" not in FRENCH_DATA:
                        FRENCH_DATA["vocabulary"] = {}
                    
                    if category not in FRENCH_DATA["vocabulary"]:
                        FRENCH_DATA["vocabulary"][category] = {}
                    
                    FRENCH_DATA["vocabulary"][category].update(new_entry)
                    
                    # Save updated vocabulary
                    with open(FRENCH_DATA_PATH, "w", encoding="utf-8") as f:
                        json.dump(FRENCH_DATA, f, ensure_ascii=False, indent=2)
                        
                except Exception as e:
                    logger.error(f"Error parsing LLM response: {str(e)}")
                    # Create some basic examples as fallback
                    examples = [
                        {"fr": f"Voici un exemple avec '{request.word}'.", 
                         "en": f"Here is an example with '{request.word}'."},
                        {"fr": f"J'utilise le mot '{request.word}' dans cette phrase.", 
                         "en": f"I am using the word '{request.word}' in this sentence."}
                    ]
            else:
                logger.warning(f"LLM API error: {response.status_code}")
                # Create some basic examples as fallback
                examples = [
                    {"fr": f"Exemple avec '{request.word}'.", 
                     "en": f"Example with '{request.word}'."}
                ]
        except Exception as e:
            logger.error(f"Error generating examples: {str(e)}")
            # Create a basic example as fallback
            examples = [
                {"fr": f"Exemple avec '{request.word}'.", 
                 "en": f"Example with '{request.word}'."}
            ]
    
    return {"examples": examples}

@app.post("/api/chat")
async def process_chat(request: ChatRequest):
    """Process chat messages for language learning"""
    try:
        # Format a prompt for the language model
        prompt = f"""You are a helpful French language tutor for beginners. 
        Respond to the following message with helpful information about French language.
        If the user asks about a French word, provide its meaning, pronunciation tips, and usage examples.
        If appropriate, include both the French response and its English translation.
        
        User message: {request.message}"""
        
        headers = {}
        if HUGGINGFACE_API_TOKEN:
            headers["Authorization"] = f"Bearer {HUGGINGFACE_API_TOKEN}"
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 512,
                "temperature": 0.7,
                "return_full_text": False
            }
        }
        
        response = requests.post(LLM_API_URL, headers=headers, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            # Extract the generated text
            if isinstance(result, list):
                generated_text = result[0].get("generated_text", "")
            else:
                generated_text = result.get("generated_text", "")
            
            return {"response": generated_text}
        else:
            # Fallback responses for common French learning questions
            message_lower = request.message.lower()
            if "hello" in message_lower or "hi" in message_lower:
                return {"response": "Bonjour! (Hello!) How can I help you with learning French today?"}
            elif "how are you" in message_lower:
                return {"response": "Je vais bien, merci! (I'm doing well, thank you!) How about you?"}
            elif "thank you" in message_lower:
                return {"response": "De rien! (You're welcome!) Happy to help with your French learning."}
            else:
                return {"response": "I'm having trouble connecting to my language service. Can you try asking something simpler about French?"}
    
    except Exception as e:
        logger.error(f"Error processing chat: {str(e)}")
        return {"response": "Désolé (Sorry), I'm having trouble processing your request. Can you try again?"}

@app.post("/api/process_response")
async def process_response(request: ProcessResponseRequest):
    """Process a response to include French learning elements"""
    try:
        context = request.context or {}
        text = request.text
        
        # If not in a French learning context, return as is
        if not context.get("learning_french", False):
            return {"response": text}
        
        # Process for French learning
        prompt = f"""Enhance this text for a French language learner:
        "{text}"
        
        1. Identify any objects or concepts mentioned.
        2. Add their French translations in parentheses.
        3. Create 1-2 simple example sentences in French using these words.
        4. Include English translations for those sentences.
        5. Keep your response friendly and educational.
        """
        
        headers = {}
        if HUGGINGFACE_API_TOKEN:
            headers["Authorization"] = f"Bearer {HUGGINGFACE_API_TOKEN}"
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 512,
                "temperature": 0.7,
                "return_full_text": False
            }
        }
        
        response = requests.post(LLM_API_URL, headers=headers, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            # Extract the generated text
            if isinstance(result, list):
                generated_text = result[0].get("generated_text", "")
            else:
                generated_text = result.get("generated_text", "")
            
            return {"response": generated_text}
        else:
            # Fallback enhancement
            return {"response": text}
    
    except Exception as e:
        logger.error(f"Error processing response: {str(e)}")
        return {"response": request.text}  # Return original text on error

@app.post("/api/quiz")
async def generate_quiz(request: QuizRequest):
    """Generate a quiz based on French vocabulary"""
    try:
        word_lower = request.word.lower()
        difficulty = request.difficulty.lower()
        
        # Find the word in our vocabulary if possible
        french_word = None
        for category, words in FRENCH_DATA["vocabulary"].items():
            if word_lower in words:
                french_word = words[word_lower]["translation"]
                break
        
        if not french_word:
            french_word = word_lower  # Fallback
        
        # Generate a quiz prompt based on difficulty
        prompt = f"""Create a fun, interactive French language quiz about the word '{french_word}' for {difficulty} level learners.
        Include:
        1. Multiple choice questions
        2. Fill-in-the-blank exercises
        3. Picture description scenario (using the word)
        4. Pronunciation tips
        
        Format as JSON with 'questions' array, where each question has 'text', 'options', 'correct_answer', and 'explanation' fields.
        """
        
        headers = {}
        if HUGGINGFACE_API_TOKEN:
            headers["Authorization"] = f"Bearer {HUGGINGFACE_API_TOKEN}"
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 1024,
                "temperature": 0.7,
                "return_full_text": False
            }
        }
        
        response = requests.post(LLM_API_URL, headers=headers, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            # Extract the generated text
            if isinstance(result, list):
                generated_text = result[0].get("generated_text", "")
            else:
                generated_text = result.get("generated_text", "")
            
            # Try to extract JSON
            try:
                # Find JSON in response
                start_idx = generated_text.find('{')
                end_idx = generated_text.rfind('}') + 1
                
                if start_idx >= 0 and end_idx > start_idx:
                    json_str = generated_text[start_idx:end_idx]
                    quiz_data = json.loads(json_str)
                    return quiz_data
                else:
                    raise ValueError("No valid JSON found")
            except Exception as e:
                logger.error(f"Error parsing quiz JSON: {str(e)}")
                # Create fallback quiz
                fallback_quiz = {
                    "questions": [
                        {
                            "text": f"What is the English translation of '{french_word}'?",
                            "options": [
                                word_lower, 
                                "apple" if word_lower != "apple" else "orange",
                                "house" if word_lower != "house" else "building",
                                "dog" if word_lower != "dog" else "cat"
                            ],
                            "correct_answer": word_lower,
                            "explanation": f"'{french_word}' in French translates to '{word_lower}' in English."
                        },
                        {
                            "text": f"Fill in the blank: ___ est le mot français pour '{word_lower}'.",
                            "options": [
                                french_word,
                                "Le maison",
                                "La table",
                                "Une voiture"
                            ],
                            "correct_answer": french_word,
                            "explanation": f"The correct answer is '{french_word}'."
                        }
                    ]
                }
                return fallback_quiz
        else:
            # Create a basic fallback quiz
            fallback_quiz = {
                "questions": [
                    {
                        "text": f"What is the English translation of '{french_word}'?",
                        "options": [
                            word_lower, 
                            "apple" if word_lower != "apple" else "orange",
                            "house" if word_lower != "house" else "building",
                            "dog" if word_lower != "dog" else "cat"
                        ],
                        "correct_answer": word_lower,
                        "explanation": f"'{french_word}' in French translates to '{word_lower}' in English."
                    }
                ]
            }
            return fallback_quiz
            
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        return {
            "questions": [
                {
                    "text": "Sorry, I'm having trouble generating a quiz right now. Please try again later.",
                    "options": ["OK"],
                    "correct_answer": "OK",
                    "explanation": "Technical difficulties"
                }
            ]
        }

# Set up as a MicroService using OPEA framework
class LanguageGenerationService:
    def __init__(self, host="0.0.0.0", port=8000):
        self.host = host
        self.port = port
        self.megaservice = ServiceOrchestrator()

    def initialize(self):
        # Define this service as a microservice
        language_service = MicroService(
            name="language_generation",
            host=self.host,
            port=self.port,
            endpoint="/api/examples",
            service_type=ServiceType.NLP  # Custom type
        )
        
        self.megaservice.add(language_service)
        return self.megaservice

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)