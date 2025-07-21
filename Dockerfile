# Multi-stage build for AutoJobr
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S autojobr -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=autojobr:nodejs /app/dist ./dist
COPY --from=builder --chown=autojobr:nodejs /app/server ./server
COPY --from=builder --chown=autojobr:nodejs /app/shared ./shared
COPY --from=builder --chown=autojobr:nodejs /app/client ./client

# Create uploads directory
RUN mkdir -p /app/uploads && \
    chown -R autojobr:nodejs /app/uploads

# Switch to non-root user
USER autojobr

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/index.js"]