FROM pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install OPEA GenAIComps (can be updated with a specific version)
RUN pip install --no-cache-dir git+https://github.com/opea-project/GenAIComps.git

# Copy the application code
COPY src/ ./src/

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV TRANSFORMERS_CACHE=/root/.cache/huggingface

# Expose the port
EXPOSE 6000

# Run the application
CMD ["python", "src/app.py"]