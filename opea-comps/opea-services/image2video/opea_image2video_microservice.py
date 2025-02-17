import logging
from fastapi import FastAPI, HTTPException
from diffusers import StableVideoDiffusionPipeline
import torch
import os
import base64
from io import BytesIO
import requests
from PIL import Image

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()
pipe = None

@app.on_event("startup")
async def startup_event():
    global pipe
    logger.info("Starting image2video service...")
    try:
        hf_token = os.getenv("HF_TOKEN")
        logger.info("Initializing SVD model")
        pipe = StableVideoDiffusionPipeline.from_pretrained(
            "stabilityai/stable-video-diffusion-img2vid",
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

@app.post("/v1/image2video")
async def generate_video(request: dict):
    global pipe
    logger.info(f"Received request: {request}")
    try:
        if pipe is None:
            raise HTTPException(status_code=500, detail="Model not initialized")

        image_paths = request.get("images_path", [])
        if not image_paths:
            raise HTTPException(status_code=400, detail="No image paths provided")
        
        # Load the first image
        image_path = image_paths[0]["image_path"]
        logger.info(f"Loading image from: {image_path}")
        
        # Handle both URLs and base64 images
        if image_path.startswith('http'):
            response = requests.get(image_path)
            image = Image.open(BytesIO(response.content))
        else:
            # Assume it's base64
            try:
                image_data = base64.b64decode(image_path)
                image = Image.open(BytesIO(image_data))
            except:
                raise HTTPException(status_code=400, detail="Invalid image data")

        logger.info("Generating video")
        video_frames = pipe(image, num_frames=16).frames
        
        # Convert frames to base64
        frame_list = []
        for frame in video_frames:
            buffered = BytesIO()
            frame.save(buffered, format="PNG")
            frame_str = base64.b64encode(buffered.getvalue()).decode()
            frame_list.append(frame_str)
            
        return {
            "status": "success",
            "frames": frame_list,
            "message": f"Generated video with {len(frame_list)} frames"
        }
    except Exception as e:
        logger.error(f"Error generating video: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))