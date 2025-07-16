# Enhanced Dockerfile for MCP PDF OCR Processing with Browser Automation
FROM node:20-slim

# Install system dependencies for Puppeteer, Playwright, and OCR
RUN apt-get update && apt-get install -y \
    # Browser automation dependencies
    ca-certificates \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-noto-cjk \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    # OCR dependencies
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-fra \
    tesseract-ocr-deu \
    tesseract-ocr-spa \
    libtesseract-dev \
    # PDF processing
    poppler-utils \
    imagemagick \
    # Image processing
    libvips42 \
    libvips-dev \
    # Build tools
    build-essential \
    python3 \
    python3-pip \
    python3-dev \
    # Cleanup
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Install Playwright browsers
RUN npx playwright install chromium
RUN npx playwright install-deps chromium

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /tmp/mcp_processing/screenshots
RUN mkdir -p /tmp/mcp_processing/output
RUN mkdir -p /tmp/mcp_processing/pdfs
RUN mkdir -p /tmp/mcp_processing/images

# Set environment variables
ENV NODE_ENV=production
ENV MCP_MODE=enhanced
ENV PORT=10000
ENV PLAYWRIGHT_BROWSERS_PATH=/app/.playwright
ENV TESSERACT_PATH=/usr/bin/tesseract
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set permissions
RUN chmod -R 777 /tmp/mcp_processing

# Expose port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=15s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:10000/api/test || exit 1

# Start command
CMD ["node", "express-server.js"]