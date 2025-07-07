# Railway frontend Dockerfile
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend_comment/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend_comment ./

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend_comment/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
