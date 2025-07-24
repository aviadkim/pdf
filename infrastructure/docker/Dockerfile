# Phase 3 PDF Platform - Production Docker Container
# Multi-stage build for optimized production deployment

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    python3 \
    py3-pip \
    gcc \
    g++ \
    make \
    && rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S phase3 -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=phase3:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=phase3:nodejs /app/package*.json ./
COPY --from=builder --chown=phase3:nodejs /app/core ./core
COPY --from=builder --chown=phase3:nodejs /app/api ./api
COPY --from=builder --chown=phase3:nodejs /app/public ./public
COPY --from=builder --chown=phase3:nodejs /app/playwright-server.js ./

# Install Python dependencies for PDF processing
RUN pip3 install --no-cache-dir \
    pdfplumber==0.10.3 \
    PyPDF2==3.0.1 \
    scikit-learn==1.3.2 \
    numpy==1.24.3 \
    pandas==2.0.3

# Switch to non-root user
USER phase3

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

# Start application
CMD ["node", "playwright-server.js"]