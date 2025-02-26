from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import os
import io
import logging
from typing import Optional, Dict, Any
from PIL import Image
import torch
from transformers import AutoProcessor, AutoModelForCausalLM
import requests
from comps import MicroService, ServiceOrchestrator, ServiceType

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
MODEL_ID = os.getenv("LVM_MODEL_ID", "llava-hf/llava-v1.6-mistral-7b-hf")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

app = FastAPI(title="VisualQnA Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the LLaVA model
try:
    processor = AutoProcessor.from_pretrained(MODEL_ID)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID, 
        torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
        device_map="auto"
    )
    logger.info(f"Loaded model {MODEL_ID} on {DEVICE}")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    raise

class VQARequest(BaseModel):
    image_data: str  # Base64 encoded image
    question: str
    context: Optional[Dict[str, Any]] = None
    language: str = "english"

class VQAResponse(BaseModel):
    answer: str
    confidence: Optional[float] = None
    detected_objects: Optional[list] = None

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/vqa", response_model=VQAResponse)
async def process_vqa(request: VQARequest):
    """Process Visual Question and Answer requests"""
    try:
        # Decode base64 image
        try:
            image_bytes = base64.b64decode(request.image_data.split(",")[1] 
                                          if "," in request.image_data 
                                          else request.image_data)
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
        
        # Process the question based on language
        if request.language.lower() != "english":
            question = f"Answer in {request.language}. {request.question}"
        else:
            question = request.question
            
        # For French learning context, enhance the prompting
        if request.context and request.context.get("learning_french"):
            if "what is this" in request.question.lower():
                question = "Identify this object. Provide its name in English."
            elif "translate" in request.question.lower():
                # The translation will be handled by the translation service
                pass
        
        # Prepare inputs for the model
        inputs = processor(text=question, images=image, return_tensors="pt")
        inputs = {k: v.to(model.device) for k, v in inputs.items()}
        
        # Generate response
        with torch.no_grad():
            generated_ids = model.generate(
                **inputs,
                max_new_tokens=256,
                do_sample=False
            )
        
        # Decode the response
        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        answer = generated_text.split(question)[-1].strip()
        
        return {
            "answer": answer,
            "confidence": None,  # Model doesn't provide confidence scores
            "detected_objects": None  # Could implement object detection separately
        }
    
    except Exception as e:
        logger.error(f"Error processing VQA request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"VQA processing error: {str(e)}")

# Optional: Set up as a MicroService using OPEA framework
class VisualQnAService:
    def __init__(self, host="0.0.0.0", port=6000):
        self.host = host
        self.port = port
        self.megaservice = ServiceOrchestrator()

    def initialize(self):
        # Define this service as a microservice
        vqa_service = MicroService(
            name="vqa",
            host=self.host,
            port=self.port,
            endpoint="/api/vqa",
            service_type=ServiceType.VISION  # Custom type for VQA
        )
        
        self.megaservice.add(vqa_service)
        
        # Could connect to other services here if needed
        # self.megaservice.flow_to(vqa_service, other_service)
        
        return self.megaservice

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6000)