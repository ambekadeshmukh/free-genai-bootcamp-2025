# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci
RUN npm install -g react-scripts@5.0.1

# Copy all files
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV REACT_APP_API_URL=/api
ENV PATH=/app/node_modules/.bin:/app/node_modules/react-scripts/bin:$PATH
ENV DISABLE_ESLINT_PLUGIN=true
ENV GENERATE_SOURCEMAP=false

# Generate Tailwind config if it doesn't exist
RUN if [ ! -f tailwind.config.js ]; then npx tailwindcss init -p; fi

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]