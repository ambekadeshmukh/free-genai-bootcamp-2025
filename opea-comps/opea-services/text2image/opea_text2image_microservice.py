import logging
from fastapi import FastAPI, HTTPException
from diffusers import StableDiffusionPipeline
import torch
import os
import base64
from io import BytesIO
from PIL import Image

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()
pipe = None

@app.on_event("startup")
async def startup_event():
    global pipe
    logger.info("Starting text2image service...")
    try:
        model_id = os.getenv("MODEL", "stabilityai/stable-diffusion-2-1")
        hf_token = os.getenv("HF_TOKEN")
        logger.info(f"Initializing model {model_id}")
        pipe = StableDiffusionPipeline.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            use_auth_token=hf_token
        )
        device = "cuda" if torch.cuda.is_available() else "cpu"
        pipe = pipe.to(device)
        logger.info(f"Model initialized on {device}")
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        raise e

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/v1/text2image")
async def generate_image(request: dict):
    global pipe
    logger.info(f"Received request: {request}")
    try:
        if pipe is None:
            raise HTTPException(status_code=500, detail="Model not initialized")

        prompt = request.get("prompt", "")
        num_images = request.get("num_images_per_prompt", 1)
        
        logger.info(f"Generating image for prompt: {prompt}")
        images = pipe(prompt, num_images_per_prompt=num_images).images
        
        # Convert images to base64
        image_list = []
        for img in images:
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            image_list.append(img_str)
            
        return {
            "status": "success",
            "images": image_list,
            "message": f"Generated {len(images)} images successfully"
        }
    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))