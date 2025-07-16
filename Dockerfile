# 🐳 FinanceAI Pro - Production Docker Container
# Complete PaddleOCR environment with all system dependencies

FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies for PaddleOCR and PDF processing
RUN apt-get update && apt-get install -y \
    # PaddleOCR system dependencies
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libfontconfig1 \
    libxss1 \
    libgconf-2-4 \
    # PDF processing dependencies
    poppler-utils \
    # Node.js for FastAPI server
    curl \
    # Build tools
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Copy Python requirements and install
COPY requirements_paddle.txt .
RUN pip install --no-cache-dir -r requirements_paddle.txt

# Copy Node.js dependencies and install
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Create directories for processing
RUN mkdir -p /tmp/paddle_processing/output

# Set environment variables for optimal performance
ENV OMP_NUM_THREADS=2
ENV OPENBLAS_NUM_THREADS=2
ENV PYTHONPATH=/app
ENV NODE_ENV=production

# Expose ports
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/ || exit 1

# Start the application
CMD ["node", "local-test-server.js"]