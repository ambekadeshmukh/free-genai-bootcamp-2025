# French Learning VisualQnA - OPEA MegaService Project

A fun and interactive French language learning application that uses the OPEA MegaService architecture to recognize objects in images, teach French vocabulary, and help beginners practice through conversations and quizzes.

## Project Overview

This application allows users to:

1. Upload images of objects
2. Get the French translation for the object in the image
3. Learn example sentences with the word in French (with English translations)
4. Ask follow-up questions about the vocabulary, grammar, or usage
5. Take quizzes to test their knowledge

## Architecture

The project is built using the OPEA MegaService architecture, a modular microservice approach that composes multiple components:

- **Gateway Service**: Coordinates communication between all services
- **VisualQnA Service**: Processes images and identifies objects using LLaVA-NeXT models
- **Translation Service**: Handles translation between English and French
- **Language Generation Service**: Creates example sentences and educational content
- **Frontend UI**: A React-based user interface for interaction

![Architecture Diagram](./architecture-diagram.png)

## Getting Started

### Prerequisites

- Docker and Docker Compose
- (Optional) NVIDIA GPU with CUDA support
- (Optional) HuggingFace API token for improved model access

### Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/french-learning-vqa.git
   cd french-learning-vqa
   ```

2. Set up environment variables:
   ```bash
   # Edit the environment variables if needed
   nano set_env.sh
   
   # Apply the environment variables
   source set_env.sh
   ```

3. Build and start the services:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   Open your browser and navigate to `http://localhost:3000`

### Using Specific Hardware

#### For Intel Gaudi

To deploy on Intel Gaudi processors:

```bash
cd docker_compose/intel/hpu/gaudi/
source set_env.sh
docker-compose up -d
```

#### For Intel Xeon

To deploy on Intel Xeon processors:

```bash
cd docker_compose/intel/cpu/xeon/
source set_env.sh
docker-compose up -d
```

## How to Use the Application

1. **Image Upload**:
   - Click on the "Upload Image" tab
   - Upload or take a photo of an object
   - The system will identify the object and translate it to French

2. **Chat Interface**:
   - Ask questions about the identified object in French
   - Get example sentences and usage tips
   - Upload additional images during the conversation

3. **Quiz Mode**:
   - Test your knowledge with automatically generated quizzes
   - Different difficulty levels for beginners to advanced learners
   - Get immediate feedback and explanations

## Project Structure

```
french-learning-vqa/
├── docker_compose/          # Docker compose configurations for different hardware
├── services/                # Backend microservices
│   ├── gateway/             # API Gateway service
│   ├── vqa/                 # Visual Question Answering service
│   ├── translation/         # Neural Machine Translation service
│   └── language_generation/ # Language Generation service
├── ui/                      # Frontend React application
├── assets/                  # Images and other assets
├── README.md                # This file
├── docker-compose.yaml      # Main Docker Compose configuration
└── set_env.sh               # Environment setup script
```

## Technology Stack

- **Backend**: FastAPI, Python, Transformers, PyTorch
- **Frontend**: React, JavaScript, CSS
- **Models**: LLaVA-NeXT for image understanding, Neural Machine Translation models
- **Deployment**: Docker, Docker Compose
- **Architecture**: OPEA MegaService framework

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## Acknowledgments

- Based on the OPEA MegaService framework
- Uses LLaVA-NeXT for image understanding
- Developed for the GenAI Bootcamp project