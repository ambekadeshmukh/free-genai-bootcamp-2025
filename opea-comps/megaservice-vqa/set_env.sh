#!/bin/bash

# Common Environment Variables
export DOCKER_REGISTRY="local"
export TAG="latest"

# Service Host Configuration
export host_ip=$(hostname -I | awk '{print $1}')
export API_BASE_URL="http://${host_ip}:5000"

# Port Configuration
export GATEWAY_PORT=5000
export UI_PORT=3000

# Model Configuration
export LVM_MODEL_ID="llava-hf/llava-v1.6-mistral-7b-hf"
export TRANSLATION_MODEL="Helsinki-NLP/opus-mt-en-fr"
export LLM_API_URL="https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"

# Resource Configuration
# Uncomment and set the appropriate value based on your hardware
# For GPU
export DEVICE="cuda"  # Use "cpu" for CPU-only environments

# HuggingFace API Token (Optional)
# Uncomment and set your token if you have one
# export HUGGINGFACE_API_TOKEN="your_token_here"

# Proxy settings (if needed)
# export http_proxy="http://proxy-server:port"
# export https_proxy="http://proxy-server:port"
# export no_proxy="localhost,127.0.0.1"

# Intel-specific settings (for Gaudi or Xeon deployments)
# Uncomment the appropriate section

# For Intel Gaudi
# export DEVICE="hpu"
# export GAUDI_VISIBLE_DEVICES=0
# export HABANA_VISIBLE_DEVICES=0

# For Intel Xeon
# export DEVICE="cpu"
# export OMP_NUM_THREADS=16
# export OPENBLAS_NUM_THREADS=16

echo "Environment variables set successfully!"
echo "API Base URL: $API_BASE_URL"
echo "Model: $LVM_MODEL_ID"
echo "Device: $DEVICE"