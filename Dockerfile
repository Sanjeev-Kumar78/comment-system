# Multi-stage build for Railway deployment
FROM node:24-alpine AS backend-build

# Set working directory for backend
WORKDIR /app/backend

# Copy backend package files
COPY backend_comment/package*.json ./

# Install backend dependencies (including dev dependencies for build)
RUN npm ci

# Copy backend prisma
COPY backend_comment/prisma ./prisma/

# Copy backend source
COPY backend_comment/src ./src/
COPY backend_comment/tsconfig*.json ./
COPY backend_comment/nest-cli.json ./

# Generate Prisma client
RUN npx prisma generate

# Simple single-stage build for Railway
FROM node:24-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache dumb-init curl

# Copy backend files
COPY backend_comment/package*.json ./
COPY backend_comment/prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy backend source
COPY backend_comment ./

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Change ownership
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/ || exit 1

# Start command
CMD ["dumb-init", "node", "dist/main.js"]
