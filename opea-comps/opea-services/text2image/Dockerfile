FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir accelerate requests pillow

# Copy service files
COPY . .

# Ensure the script is executable
RUN chmod +x start.sh

# Expose the port
EXPOSE 9379

CMD ["./start.sh"]