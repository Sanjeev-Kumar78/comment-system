# Multi-stage build for Railway deployment
FROM node:24-alpine AS backend-build

# Set working directory for backend
WORKDIR /app/backend

# Copy backend package files
COPY backend_comment/package*.json ./
COPY backend_comment/prisma ./prisma/

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source
COPY backend_comment ./

# Generate Prisma client
RUN npx prisma generate

# Build backend
RUN npm run build

# Frontend build stage
FROM node:24-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend_comment/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source
COPY frontend_comment ./

# Build frontend
RUN npm run build

# Production stage
FROM node:24-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy backend build
COPY --from=backend-build /app/backend/dist ./backend/
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules/
COPY --from=backend-build /app/backend/package.json ./backend/
COPY --from=backend-build /app/backend/prisma ./backend/prisma/

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./frontend/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/main.js"]
