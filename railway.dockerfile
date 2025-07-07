# Railway backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl dumb-init

# Copy all backend files at once
COPY backend_comment ./

# Install dependencies
RUN npm ci

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Change ownership
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port 3001 for backend
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/ || exit 1

# Start command
CMD ["dumb-init", "node", "dist/main.js"]
