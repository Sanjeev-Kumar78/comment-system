# Railway backend Dockerfile
FROM node:24-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl dumb-init

# Copy all backend files
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

# Expose port 8080 for backend
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# Start command - run migrations first, then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && dumb-init node dist/main.js"]
