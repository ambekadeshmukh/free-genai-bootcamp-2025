FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install OPEA GenAIComps
RUN pip install --no-cache-dir git+https://github.com/opea-project/GenAIComps.git

# Copy the application code
COPY src/ ./src/

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV TRANSFORMERS_CACHE=/root/.cache/huggingface

# Expose the port
EXPOSE 7000

# Run the application
CMD ["python", "src/app.py"]