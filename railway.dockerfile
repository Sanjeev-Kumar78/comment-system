# Railway backend Dockerfile
FROM node:24-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl dumb-init

# Copy backend files
COPY backend_comment/package*.json ./
COPY backend_comment/prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy all backend source
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

# Expose Railway's PORT (Railway sets this automatically)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:$PORT/ || exit 1

# Start command
CMD ["dumb-init", "node", "dist/main.js"]
