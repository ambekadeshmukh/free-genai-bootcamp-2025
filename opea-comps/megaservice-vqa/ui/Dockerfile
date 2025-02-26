# Create the new Dockerfile
$content = @'
# Build stage
FROM node:16-alpine as build

WORKDIR /app

# Copy package.json only (no package-lock.json reference)
COPY package.json ./

# Use npm install instead of npm ci
RUN npm install

# Copy source files
COPY . .

# Set API URL from build arg
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
'@

# Write the content to the Dockerfile
$content | Out-File -FilePath ui/Dockerfile -Encoding utf8