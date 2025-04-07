FROM node:18

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Install chromadb
RUN npm install chromadb

# Copy the rest of the application
COPY . .

# Create the services directory if it doesn't exist
RUN mkdir -p src/services

# Expose the port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]