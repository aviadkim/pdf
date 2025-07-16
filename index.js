// 🚀 Render.com Production Server - MCP-Enhanced PDF Processor
// Main entry point for Render deployment

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/test', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        mcpMode: process.env.MCP_MODE || 'basic',
        playwrightAvailable: fs.existsSync('/app/.playwright') || fs.existsSync('/usr/bin/chromium-browser'),
        message: 'MCP-Enhanced PDF Processor is running on Render!'
    });
});

// Import and register API routes
async function setupRoutes() {
    try {
        // Import API modules
        const { default: realPdfExtractor } = await import('./api/real-pdf-extractor.js');
        const { default: mcpProcessor } = await import('./api/mcp-enhanced-processor.js');
        
        // Register routes
        app.use('/api/real-pdf-extractor', realPdfExtractor);
        app.use('/api/mcp-enhanced-processor', mcpProcessor);
        
        console.log('✅ API routes registered successfully');
    } catch (error) {
        console.error('❌ Error setting up routes:', error);
        
        // Fallback route
        app.use('/api/*', (req, res) => {
            res.status(503).json({
                error: 'Service temporarily unavailable',
                message: 'API modules are loading, please try again in a moment'
            });
        });
    }
}

// Main route
app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>MCP-Enhanced PDF Processor</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
            .status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .endpoint { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #007acc; }
            .method { font-weight: bold; color: #007acc; }
            pre { background: #f1f1f1; padding: 10px; border-radius: 5px; overflow-x: auto; }
            .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 MCP-Enhanced PDF Processor</h1>
            <div class="status">
                <strong>Status:</strong> Running on Render.com<br>
                <strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}<br>
                <strong>MCP Mode:</strong> ${process.env.MCP_MODE || 'basic'}<br>
                <strong>Timestamp:</strong> ${new Date().toISOString()}
            </div>
            
            <h2>🔧 API Endpoints</h2>
            
            <div class="endpoint">
                <div class="method">GET</div> <code>/api/test</code>
                <p>Health check and system status</p>
            </div>
            
            <div class="endpoint">
                <div class="method">POST</div> <code>/api/real-pdf-extractor</code>
                <p>Extract data from PDF without hardcoded values</p>
                <pre>{"pdfBase64": "...", "filename": "document.pdf"}</pre>
            </div>
            
            <div class="endpoint">
                <div class="method">POST</div> <code>/api/mcp-enhanced-processor</code>
                <p>Full MCP pipeline with Playwright/Puppeteer browser automation</p>
                <pre>{"testMode": true}</pre>
            </div>
            
            <h2>🧪 Test Commands</h2>
            <pre>
# Test health
curl ${req.protocol}://${req.get('host')}/api/test

# Test PDF extraction
curl -X POST ${req.protocol}://${req.get('host')}/api/real-pdf-extractor \\
  -H "Content-Type: application/json" \\
  -d '{"testMode": true}'

# Test MCP processor
curl -X POST ${req.protocol}://${req.get('host')}/api/mcp-enhanced-processor \\
  -H "Content-Type: application/json" \\
  -d '{"testMode": true}'
            </pre>
            
            <div class="footer">
                <p>🤖 Generated with <a href="https://claude.ai/code">Claude Code</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    res.send(html);
});

// Enhanced POST test endpoint
app.post('/api/test', async (req, res) => {
    const { testPuppeteer, testPlaywright } = req.body;
    
    let puppeteerResult = null;
    let playwrightResult = null;
    
    // Test Puppeteer if requested
    if (testPuppeteer) {
        try {
            const puppeteer = await import('puppeteer');
            const browser = await puppeteer.default.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            await browser.close();
            puppeteerResult = { status: 'success', message: 'Puppeteer working' };
        } catch (error) {
            puppeteerResult = { status: 'error', message: error.message };
        }
    }
    
    // Test Playwright if requested
    if (testPlaywright) {
        try {
            const { chromium } = await import('playwright');
            const browser = await chromium.launch({ headless: true });
            await browser.close();
            playwrightResult = { status: 'success', message: 'Playwright working' };
        } catch (error) {
            playwrightResult = { status: 'error', message: error.message };
        }
    }
    
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        mcpMode: process.env.MCP_MODE || 'basic',
        puppeteerResult,
        playwrightResult,
        message: 'Extended test complete'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Start server
async function startServer() {
    await setupRoutes();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 MCP-Enhanced PDF Processor running on port ${PORT}`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔧 MCP Mode: ${process.env.MCP_MODE || 'basic'}`);
        console.log(`📡 Health check: http://localhost:${PORT}/api/test`);
    });
}

startServer().catch(console.error);