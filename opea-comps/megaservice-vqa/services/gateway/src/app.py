from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import logging
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables for service connections
VQA_SERVICE_URL = os.getenv("VQA_SERVICE_URL", "http://vqa-service:6000")
TRANSLATION_SERVICE_URL = os.getenv("TRANSLATION_SERVICE_URL", "http://translation-service:7000")
LANGUAGE_GEN_SERVICE_URL = os.getenv("LANGUAGE_GEN_SERVICE_URL", "http://language-gen-service:8000")

app = FastAPI(title="French Learning Gateway Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageUploadRequest(BaseModel):
    image_data: str  # Base64 encoded image

class ChatRequest(BaseModel):
    message: str
    image_data: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class QuizRequest(BaseModel):
    word: str
    difficulty: str = "beginner"

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/identify")
async def identify_image(request: ImageUploadRequest):
    """Identify object in image and return French translation with examples"""
    try:
        # Send request to VQA service
        async with httpx.AsyncClient() as client:
            vqa_response = await client.post(
                f"{VQA_SERVICE_URL}/api/vqa", 
                json={"image_data": request.image_data, "question": "What is this object?"}
            )
            
            if vqa_response.status_code != 200:
                raise HTTPException(status_code=vqa_response.status_code, detail="VQA service error")
            
            vqa_result = vqa_response.json()
            object_name = vqa_result["answer"]
            
            # Get translation and examples
            translation_response = await client.post(
                f"{TRANSLATION_SERVICE_URL}/api/translate",
                json={"text": object_name, "source": "en", "target": "fr"}
            )
            
            if translation_response.status_code != 200:
                raise HTTPException(status_code=translation_response.status_code, 
                                    detail="Translation service error")
            
            translation_result = translation_response.json()
            
            # Get example sentences
            examples_response = await client.post(
                f"{LANGUAGE_GEN_SERVICE_URL}/api/examples",
                json={"word": translation_result["translated_text"], "count": 3}
            )
            
            if examples_response.status_code != 200:
                raise HTTPException(status_code=examples_response.status_code,
                                    detail="Language generation service error")
            
            examples_result = examples_response.json()
            
            # Combine all results
            return {
                "object": object_name,
                "french_word": translation_result["translated_text"],
                "examples": examples_result["examples"]
            }
    
    except httpx.RequestError as e:
        logger.error(f"Error communicating with services: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Service communication error: {str(e)}")

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Process chat messages with or without image context"""
    try:
        # Prepare the context for processing
        context = request.context or {}
        
        async with httpx.AsyncClient() as client:
            # If image is present, first process with VQA
            if request.image_data:
                vqa_response = await client.post(
                    f"{VQA_SERVICE_URL}/api/vqa",
                    json={"image_data": request.image_data, "question": request.message}
                )
                
                if vqa_response.status_code != 200:
                    raise HTTPException(status_code=vqa_response.status_code, detail="VQA service error")
                
                vqa_result = vqa_response.json()
                answer = vqa_result["answer"]
                
                # Get any French terms in the response translated
                translation_response = await client.post(
                    f"{LANGUAGE_GEN_SERVICE_URL}/api/process_response",
                    json={"text": answer, "context": context}
                )
                
                if translation_response.status_code != 200:
                    return {"response": answer}  # Fall back to original answer if processing fails
                
                return translation_response.json()
            
            # No image, process as language learning query
            lang_response = await client.post(
                f"{LANGUAGE_GEN_SERVICE_URL}/api/chat",
                json={"message": request.message, "context": context}
            )
            
            if lang_response.status_code != 200:
                raise HTTPException(status_code=lang_response.status_code, 
                                    detail="Language service error")
            
            return lang_response.json()
    
    except httpx.RequestError as e:
        logger.error(f"Error communicating with services: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Service communication error: {str(e)}")

@app.post("/api/quiz")
async def generate_quiz(request: QuizRequest):
    """Generate quiz questions based on vocabulary"""
    try:
        async with httpx.AsyncClient() as client:
            quiz_response = await client.post(
                f"{LANGUAGE_GEN_SERVICE_URL}/api/quiz",
                json={"word": request.word, "difficulty": request.difficulty}
            )
            
            if quiz_response.status_code != 200:
                raise HTTPException(status_code=quiz_response.status_code, 
                                   detail="Quiz generation error")
            
            return quiz_response.json()
    
    except httpx.RequestError as e:
        logger.error(f"Error generating quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Quiz generation error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)