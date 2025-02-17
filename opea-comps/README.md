# OPEA Microservices Implementation
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![Docker](https://img.shields.io/badge/docker-required-blue.svg)
![FastAPI](https://img.shields.io/badge/fastapi-latest-blue.svg)

This repository demonstrates how to run AI workloads in-house using OPEA (Open Protocol for Enterprise AI) components. It includes implementations of text-to-image and image-to-video services using Docker containers.

## 🚀 Features

- Text-to-Image generation using Stable Diffusion
- Image-to-Video conversion using Stable Video Diffusion
- Docker containerization
- Microservices architecture
- Health monitoring
- Base64 image/video encoding
- Comprehensive logging

## 📋 Prerequisites

- Docker and Docker Compose
- Python 3.9+
- Hugging Face Account and API Token
- ~10GB disk space for models
- Git

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/opea-services.git
cd opea-services
```

2. Set up your Hugging Face token:
```bash
export HF_TOKEN=your_hugging_face_token
```

3. Build and start services:
```bash
cd docker-compose
docker-compose up --build -d
```

## 📁 Project Structure

```
opea-services/
├── text2image/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── start.sh
│   └── opea_text2image_microservice.py
├── image2video/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── start.sh
│   └── opea_image2video_microservice.py
└── docker-compose/
    └── docker-compose.yml
```

## 🔧 Configuration

### Text-to-Image Service
- Port: 9379
- Model: Stable Diffusion 2.1
- Environment Variables:
  - `HF_TOKEN`: Hugging Face API token
  - `MODEL`: Model identifier (default: stabilityai/stable-diffusion-2-1)

### Image-to-Video Service
- Port: 9369
- Model: Stable Video Diffusion
- Environment Variables:
  - `HF_TOKEN`: Hugging Face API token

## 📝 Usage

### Text-to-Image Generation
```bash
curl http://localhost:9379/v1/text2image -X POST \
  -H "Content-Type: application/json" \
  -d '{"prompt":"An astronaut riding a green horse", "num_images_per_prompt":1}'
```

### Image-to-Video Generation
```bash
curl http://localhost:9369/v1/image2video -X POST \
  -H "Content-Type: application/json" \
  -d '{"images_path":[{"image_path":"path_to_your_image.png"}]}'
```

## 🔍 Monitoring

Check service health:
```bash
# Text-to-Image health
curl http://localhost:9379/health

# Image-to-Video health
curl http://localhost:9369/health
```

View logs:
```bash
docker-compose logs -f
```

## 🛠️ Troubleshooting

### Common Issues

1. **Services Marked as Unhealthy**
   ```bash
   docker-compose ps
   docker-compose logs
   ```

2. **Empty Responses**
   - Check if the service is running
   - Verify the HF_TOKEN is set
   - Check service logs for errors

3. **Model Loading Issues**
   ```bash
   docker-compose logs text2image
   docker-compose logs image2video
   ```

### Quick Fixes

1. Restart services:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

2. Rebuild services:
   ```bash
   docker-compose down
   docker-compose up --build -d
   ```

3. Check container status:
   ```bash
   docker ps
   ```

## 📚 API Documentation

### Text-to-Image Service

#### Generate Image
- Endpoint: `/v1/text2image`
- Method: POST
- Request Body:
  ```json
  {
    "prompt": "string",
    "num_images_per_prompt": int
  }
  ```
- Response:
  ```json
  {
    "status": "success",
    "images": ["base64_encoded_image"],
    "message": "string"
  }
  ```

### Image-to-Video Service

#### Generate Video
- Endpoint: `/v1/image2video`
- Method: POST
- Request Body:
  ```json
  {
    "images_path": [
      {
        "image_path": "string"
      }
    ]
  }
  ```
- Response:
  ```json
  {
    "status": "success",
    "frames": ["base64_encoded_frames"],
    "message": "string"
  }
  ```
