// Optimized Puppeteer configuration for WSL and production environments
import puppeteer from 'puppeteer';

// WSL-optimized configuration - EXACT configuration for WSL compatibility
export const WSL_PUPPETEER_CONFIG = {
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage', 
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu'
  ]
};

// Production configuration
export const PRODUCTION_PUPPETEER_CONFIG = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--memory-pressure-off'
  ],
  defaultViewport: { width: 1200, height: 800 },
  timeout: 15000
};

// Browser pool for reusing instances
class BrowserPool {
  constructor() {
    this.browsers = [];
    this.maxBrowsers = 3;
    this.currentBrowser = null;
  }

  async getBrowser() {
    // Reuse existing browser if available
    if (this.currentBrowser && this.currentBrowser.isConnected()) {
      return this.currentBrowser;
    }

    // Clean up disconnected browsers
    this.browsers = this.browsers.filter(browser => browser.isConnected());

    // Create new browser if needed
    if (this.browsers.length < this.maxBrowsers) {
      // Always use WSL config for maximum compatibility
      const browser = await puppeteer.launch(WSL_PUPPETEER_CONFIG);
      
      browser.on('disconnected', () => {
        this.browsers = this.browsers.filter(b => b !== browser);
        if (this.currentBrowser === browser) {
          this.currentBrowser = null;
        }
      });

      this.browsers.push(browser);
      this.currentBrowser = browser;
      return browser;
    }

    // Return existing browser
    this.currentBrowser = this.browsers[0];
    return this.currentBrowser;
  }

  async closeAll() {
    for (const browser of this.browsers) {
      if (browser.isConnected()) {
        await browser.close();
      }
    }
    this.browsers = [];
    this.currentBrowser = null;
  }

  async cleanup() {
    // Close browsers that have been idle
    const now = Date.now();
    for (const browser of this.browsers) {
      if (browser.isConnected() && (now - browser._lastUsed) > 300000) { // 5 minutes
        await browser.close();
      }
    }
  }
}

// Global browser pool instance
export const browserPool = new BrowserPool();

// Cleanup on process exit
process.on('exit', () => {
  browserPool.closeAll();
});

process.on('SIGINT', () => {
  browserPool.closeAll();
  process.exit(0);
});

// Enhanced PDF to images conversion
export async function convertPDFToImages(pdfBuffer, options = {}) {
  const {
    maxPages = 50,
    quality = 80,
    format = 'png',
    scale = 1.5
  } = options;

  const browser = await browserPool.getBrowser();
  const page = await browser.newPage();
  
  try {
    // Set viewport for consistent rendering
    await page.setViewport({
      width: Math.round(1200 * scale),
      height: Math.round(800 * scale),
      deviceScaleFactor: scale
    });

    // Create data URL for PDF
    const pdfBase64 = pdfBuffer.toString('base64');
    const dataUrl = `data:application/pdf;base64,${pdfBase64}`;
    
    // Navigate to PDF
    await page.goto(dataUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Wait for PDF to load
    await page.waitForTimeout(2000);

    // Get page count (simplified - would need proper PDF.js integration)
    const pageCount = Math.min(maxPages, 20); // Fallback limit
    
    const images = [];
    
    for (let i = 1; i <= pageCount; i++) {
      try {
        // Navigate to specific page if multi-page PDF
        if (i > 1) {
          await page.keyboard.press('PageDown');
          await page.waitForTimeout(1000);
        }

        // Capture page as image
        const imageBuffer = await page.screenshot({
          type: format,
          quality: format === 'jpeg' ? quality : undefined,
          fullPage: true,
          omitBackground: false
        });

        images.push({
          page: i,
          buffer: imageBuffer,
          base64: imageBuffer.toString('base64')
        });

      } catch (pageError) {
        console.error(`Error capturing page ${i}:`, pageError.message);
        break; // Stop on error
      }
    }

    return {
      success: true,
      totalPages: pageCount,
      images: images,
      metadata: {
        format,
        quality,
        scale,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('PDF to images conversion error:', error);
    throw new Error(`PDF conversion failed: ${error.message}`);
  } finally {
    await page.close();
    // Mark browser as last used
    browser._lastUsed = Date.now();
  }
}

// Periodic cleanup task
setInterval(() => {
  browserPool.cleanup().catch(console.error);
}, 600000); // Every 10 minutes