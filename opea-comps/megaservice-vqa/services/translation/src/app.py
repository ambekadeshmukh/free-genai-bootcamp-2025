from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
from typing import Dict, List, Optional, Union
import requests
from comps import MicroService, ServiceOrchestrator, ServiceType

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
TRANSLATION_MODEL = os.getenv("TRANSLATION_MODEL", "Helsinki-NLP/opus-mt-en-fr")
TRANSLATION_API_URL = os.getenv("TRANSLATION_API_URL", "https://api-inference.huggingface.co/models/" + TRANSLATION_MODEL)

app = FastAPI(title="Neural Machine Translation Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslationRequest(BaseModel):
    text: str
    source: str = "en"  # Default is English
    target: str = "fr"  # Default is French

class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source: str
    target: str
    detected_language: Optional[str] = None

class BatchTranslationRequest(BaseModel):
    texts: List[str]
    source: str = "en"
    target: str = "fr"

# Dictionary of common English-French vocabulary for educational purposes
# This will serve as a fallback when the API is unavailable
COMMON_VOCABULARY = {
    "cat": "chat",
    "dog": "chien",
    "house": "maison",
    "car": "voiture",
    "book": "livre",
    "apple": "pomme",
    "water": "eau",
    "tree": "arbre",
    "friend": "ami",
    "hello": "bonjour",
    "goodbye": "au revoir",
    "thank you": "merci",
    "please": "s'il vous plaît",
    "yes": "oui",
    "no": "non",
    "elephant": "éléphant",
    "giraffe": "girafe",
    "lion": "lion",
    "tiger": "tigre",
    "zebra": "zèbre",
}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/translate", response_model=TranslationResponse)
async def translate(request: TranslationRequest):
    """Translate text between languages"""
    try:
        # Check if it's a common vocabulary word (lowercase for matching)
        if request.source == "en" and request.target == "fr" and request.text.lower() in COMMON_VOCABULARY:
            translated = COMMON_VOCABULARY[request.text.lower()]
            # Preserve original capitalization if possible
            if request.text[0].isupper():
                translated = translated[0].upper() + translated[1:]
            
            return {
                "original_text": request.text,
                "translated_text": translated,
                "source": request.source,
                "target": request.target,
                "detected_language": None
            }
        
        # If not in common vocabulary, use the translation API
        headers = {}
        if HUGGINGFACE_API_TOKEN:
            headers["Authorization"] = f"Bearer {HUGGINGFACE_API_TOKEN}"
        
        payload = {
            "inputs": request.text,
            "options": {"wait_for_model": True}
        }
        
        response = requests.post(TRANSLATION_API_URL, headers=headers, json=payload)
        
        if response.status_code != 200:
            # Fallback to simple dictionary lookup or inform about error
            if request.text.lower() in COMMON_VOCABULARY and request.source == "en" and request.target == "fr":
                return {
                    "original_text": request.text,
                    "translated_text": COMMON_VOCABULARY[request.text.lower()],
                    "source": request.source,
                    "target": request.target,
                    "detected_language": None
                }
            else:
                raise HTTPException(status_code=response.status_code, 
                                    detail="Translation API error")
        
        try:
            result = response.json()
            
            # Handle different API response formats
            if isinstance(result, list) and len(result) > 0:
                if isinstance(result[0], dict) and "translation_text" in result[0]:
                    translated_text = result[0]["translation_text"]
                else:
                    translated_text = result[0]
            elif isinstance(result, dict) and "translation_text" in result:
                translated_text = result["translation_text"]
            else:
                translated_text = str(result)
                
            return {
                "original_text": request.text,
                "translated_text": translated_text,
                "source": request.source,
                "target": request.target,
                "detected_language": None
            }
        except Exception as e:
            logger.error(f"Error parsing translation API response: {str(e)}")
            raise HTTPException(status_code=500, detail="Error parsing translation response")
            
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")

@app.post("/api/batch-translate")
async def batch_translate(request: BatchTranslationRequest):
    """Translate multiple texts at once"""
    results = []
    for text in request.texts:
        single_request = TranslationRequest(
            text=text,
            source=request.source,
            target=request.target
        )
        try:
            result = await translate(single_request)
            results.append(result)
        except HTTPException as e:
            results.append({
                "original_text": text,
                "error": e.detail,
                "source": request.source,
                "target": request.target
            })
    
    return {"translations": results}

# Set up as a MicroService using OPEA framework
class TranslationService:
    def __init__(self, host="0.0.0.0", port=7000):
        self.host = host
        self.port = port
        self.megaservice = ServiceOrchestrator()

    def initialize(self):
        # Define this service as a microservice
        translation_service = MicroService(
            name="translation",
            host=self.host,
            port=self.port,
            endpoint="/api/translate",
            service_type=ServiceType.TRANSLATION  # Custom type
        )
        
        self.megaservice.add(translation_service)
        return self.megaservice

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7000)