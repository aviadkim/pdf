// Enhanced Express server with MCP PDF OCR Processing
const express = require('express');
const cors = require('cors');
const pdfParse = require('pdf-parse');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { createWorker } = require('tesseract.js');
const pdf2pic = require('pdf2pic');
const puppeteer = require('puppeteer');
const { playwright } = require('playwright');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 10000;

// Configure multer for file uploads
const upload = multer({
    dest: '/tmp/mcp_processing/uploads/',
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Global variables for OCR worker and browser
let ocrWorker = null;
let browserPool = [];

// Initialize OCR worker
async function initializeOCR() {
    try {
        ocrWorker = await createWorker('eng');
        await ocrWorker.setParameters({
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,\'/:- ',
            tessedit_pageseg_mode: '3'
        });
        console.log('✅ OCR worker initialized successfully');
    } catch (error) {
        console.error('❌ OCR worker initialization failed:', error);
    }
}

// Initialize browser pool
async function initializeBrowser() {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--memory-pressure-off',
                '--no-first-run',
                '--no-zygote',
                '--single-process'
            ]
        });
        browserPool.push(browser);
        console.log('✅ Browser pool initialized successfully');
    } catch (error) {
        console.error('❌ Browser initialization failed:', error);
    }
}

// Initialize services
initializeOCR();
initializeBrowser();

// Health check endpoint
app.get('/api/test', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'MCP-Enhanced PDF OCR Server running!',
        environment: process.env.NODE_ENV || 'development',
        features: {
            pdfParse: !!pdfParse,
            ocrWorker: !!ocrWorker,
            browserPool: browserPool.length > 0,
            tesseract: process.env.TESSERACT_PATH || 'system',
            mcpMode: process.env.MCP_MODE || 'enhanced'
        }
    });
});

// Enhanced PDF extraction endpoint with OCR
app.post('/api/pdf-extract-enhanced', upload.single('pdf'), async (req, res) => {
    try {
        const { pdfBase64, testMode, useOCR = true } = req.body;
        
        if (testMode) {
            return res.json({
                success: true,
                message: 'MCP PDF OCR extraction working',
                testMode: true,
                extractedData: {
                    securities: [
                        {
                            isin: 'XS2530201644',
                            name: 'TORONTO DOMINION BANK NOTES',
                            value: 199080,
                            currency: 'USD',
                            extractionMethod: 'OCR+TextParsing'
                        }
                    ],
                    totalValue: 199080,
                    processingMethods: ['text-extraction', 'ocr-analysis'],
                    confidence: 0.95
                }
            });
        }

        let pdfBuffer;
        if (req.file) {
            pdfBuffer = await fs.readFile(req.file.path);
        } else if (pdfBase64) {
            pdfBuffer = Buffer.from(pdfBase64, 'base64');
        } else {
            return res.status(400).json({ 
                success: false, 
                error: 'No PDF data provided' 
            });
        }

        // Text extraction using pdf-parse
        const textExtraction = await pdfParse(pdfBuffer);
        const textSecurities = extractSecurities(textExtraction.text);

        let ocrSecurities = [];
        let processingMethods = ['text-extraction'];

        // OCR processing if requested
        if (useOCR && ocrWorker) {
            try {
                const ocrResults = await processWithOCR(pdfBuffer);
                ocrSecurities = ocrResults.securities;
                processingMethods.push('ocr-analysis');
            } catch (ocrError) {
                console.error('OCR processing error:', ocrError);
            }
        }

        // Combine and deduplicate results
        const combinedSecurities = combineSecurities(textSecurities, ocrSecurities);
        const totalValue = combinedSecurities.reduce((sum, s) => sum + (s.value || 0), 0);

        // Cleanup uploaded file
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }

        res.json({
            success: true,
            message: 'Enhanced PDF extraction completed',
            extractedData: {
                securities: combinedSecurities,
                totalValue: totalValue,
                processingMethods: processingMethods,
                confidence: calculateConfidence(combinedSecurities, processingMethods)
            },
            pdfInfo: {
                pages: textExtraction.numpages,
                textLength: textExtraction.text.length,
                ocrPagesProcessed: ocrSecurities.length > 0 ? textExtraction.numpages : 0
            }
        });

    } catch (error) {
        console.error('Enhanced PDF extraction error:', error);
        res.status(500).json({
            success: false,
            error: 'Enhanced PDF extraction failed',
            details: error.message
        });
    }
});

// OCR processing function
async function processWithOCR(pdfBuffer) {
    const tempDir = '/tmp/mcp_processing/images';
    const pdfPath = '/tmp/mcp_processing/temp.pdf';
    
    // Save PDF temporarily
    await fs.writeFile(pdfPath, pdfBuffer);
    
    // Convert PDF to images
    const convert = pdf2pic.fromPath(pdfPath, {
        density: 300,
        saveFilename: 'page',
        savePath: tempDir,
        format: 'png',
        width: 2000,
        height: 2000
    });
    
    const results = await convert.bulk(-1);
    const securities = [];
    
    // Process each page with OCR
    for (const result of results) {
        try {
            const { data: { text } } = await ocrWorker.recognize(result.path);
            const pageSecurities = extractSecurities(text);
            securities.push(...pageSecurities);
            
            // Cleanup image file
            await fs.unlink(result.path).catch(console.error);
        } catch (ocrError) {
            console.error('OCR page processing error:', ocrError);
        }
    }
    
    // Cleanup PDF file
    await fs.unlink(pdfPath).catch(console.error);
    
    return { securities };
}

// PDF to images conversion endpoint
app.post('/api/pdf-to-images', upload.single('pdf'), async (req, res) => {
    try {
        const { pdfBase64, options = {} } = req.body;
        const { maxPages = 10, quality = 80, format = 'png' } = options;
        
        let pdfBuffer;
        if (req.file) {
            pdfBuffer = await fs.readFile(req.file.path);
        } else if (pdfBase64) {
            pdfBuffer = Buffer.from(pdfBase64, 'base64');
        } else {
            return res.status(400).json({ 
                success: false, 
                error: 'No PDF data provided' 
            });
        }

        const tempDir = '/tmp/mcp_processing/screenshots';
        const pdfPath = '/tmp/mcp_processing/temp-conversion.pdf';
        
        // Save PDF temporarily
        await fs.writeFile(pdfPath, pdfBuffer);
        
        // Convert PDF to images
        const convert = pdf2pic.fromPath(pdfPath, {
            density: 300,
            saveFilename: 'screenshot',
            savePath: tempDir,
            format: format,
            width: 2000,
            height: 2000
        });
        
        const results = await convert.bulk(maxPages);
        const images = [];
        
        // Process and encode images
        for (const result of results) {
            try {
                const imageBuffer = await fs.readFile(result.path);
                const optimizedBuffer = await sharp(imageBuffer)
                    .jpeg({ quality: quality })
                    .toBuffer();
                
                images.push({
                    page: result.page,
                    base64: optimizedBuffer.toString('base64'),
                    format: 'jpeg',
                    width: result.width,
                    height: result.height
                });
                
                // Cleanup image file
                await fs.unlink(result.path).catch(console.error);
            } catch (imageError) {
                console.error('Image processing error:', imageError);
            }
        }
        
        // Cleanup PDF file
        await fs.unlink(pdfPath).catch(console.error);
        
        // Cleanup uploaded file
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }

        res.json({
            success: true,
            message: 'PDF converted to images successfully',
            images: images,
            totalPages: images.length
        });

    } catch (error) {
        console.error('PDF to images conversion error:', error);
        res.status(500).json({
            success: false,
            error: 'PDF to images conversion failed',
            details: error.message
        });
    }
});

// Screenshot capture endpoint
app.post('/api/capture-screenshot', async (req, res) => {
    try {
        const { url, options = {} } = req.body;
        const { width = 1920, height = 1080, fullPage = true } = options;
        
        if (!url) {
            return res.status(400).json({ 
                success: false, 
                error: 'No URL provided' 
            });
        }

        if (browserPool.length === 0) {
            return res.status(500).json({ 
                success: false, 
                error: 'Browser not available' 
            });
        }

        const browser = browserPool[0];
        const page = await browser.newPage();
        
        await page.setViewport({ width, height });
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        const screenshot = await page.screenshot({ 
            fullPage: fullPage,
            type: 'png'
        });
        
        await page.close();

        res.json({
            success: true,
            message: 'Screenshot captured successfully',
            screenshot: screenshot.toString('base64'),
            url: url,
            dimensions: { width, height }
        });

    } catch (error) {
        console.error('Screenshot capture error:', error);
        res.status(500).json({
            success: false,
            error: 'Screenshot capture failed',
            details: error.message
        });
    }
});

// Legacy PDF extraction endpoint (for backwards compatibility)
app.post('/api/pdf-extract', async (req, res) => {
    try {
        const { pdfBase64, testMode, textContent } = req.body;
        
        if (testMode) {
            return res.json({
                success: true,
                message: 'PDF extraction working',
                testMode: true,
                extractedData: {
                    securities: [
                        {
                            isin: 'XS2530201644',
                            name: 'TORONTO DOMINION BANK NOTES',
                            value: 199080,
                            currency: 'USD'
                        }
                    ],
                    totalValue: 199080
                }
            });
        }
        
        let extractedText = '';
        
        if (textContent) {
            extractedText = textContent;
        } else if (pdfBase64) {
            const pdfBuffer = Buffer.from(pdfBase64, 'base64');
            const pdfData = await pdfParse(pdfBuffer);
            extractedText = pdfData.text;
        } else {
            return res.status(400).json({ 
                success: false, 
                error: 'No PDF data or text content provided' 
            });
        }
        
        const securities = extractSecurities(extractedText);
        const totalValue = securities.reduce((sum, s) => sum + (s.value || 0), 0);
        
        res.json({
            success: true,
            message: 'PDF parsed successfully',
            extractedData: {
                securities: securities,
                totalValue: totalValue,
                confidence: securities.length > 0 ? 0.85 : 0.1
            },
            pdfInfo: {
                textLength: extractedText.length,
                extractionMethod: textContent ? 'direct' : 'pdf-parse'
            }
        });
        
    } catch (error) {
        console.error('PDF extraction error:', error);
        res.status(500).json({
            success: false,
            error: 'PDF extraction failed',
            details: error.message
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'MCP-Enhanced PDF OCR Processor',
        status: 'running',
        endpoints: [
            '/api/test',
            '/api/pdf-extract',
            '/api/pdf-extract-enhanced',
            '/api/pdf-to-images',
            '/api/capture-screenshot'
        ],
        features: [
            'Text extraction from PDFs',
            'OCR processing with Tesseract',
            'PDF to images conversion',
            'Browser automation screenshots',
            'Swiss financial data parsing',
            'MCP integration ready'
        ],
        timestamp: new Date().toISOString()
    });
});

// Swiss financial data extraction function (enhanced)
function extractSecurities(text) {
    const securities = [];
    const isinRegex = /ISIN[:\s]*([A-Z]{2}[A-Z0-9]{9}[0-9])/g;
    let match;
    
    while ((match = isinRegex.exec(text)) !== null) {
        const isin = match[1];
        const position = match.index;
        
        // Extract context around ISIN - optimized window
        const contextStart = Math.max(0, position - 300);
        const contextEnd = Math.min(text.length, position + 300);
        const context = text.substring(contextStart, contextEnd);
        
        // Extract security name
        let name = '';
        const namePatterns = [
            /([A-Z][A-Z\s&,.-]+(?:NOTES?|BONDS?|BANK|CORP|LIMITED|LTD|INC|AG|SA|PLC|FUND|TRUST|FINANCIAL|CAPITAL|TREASURY|GOVERNMENT|MUNICIPAL|CORPORATE))\s*ISIN/i,
            /([A-Z][A-Z\s&,.'-]+)\s*ISIN/i
        ];
        
        for (const pattern of namePatterns) {
            const match = context.match(pattern);
            if (match && match[1]) {
                name = match[1].trim();
                break;
            }
        }
        
        // Extract value - prioritize Swiss format numbers
        const swissMatches = context.match(/(\d{1,3}(?:'\d{3})+)/g);
        const valueMatches = context.match(/(\d{1,3}(?:'\d{3})*(?:\.\d{2})?)/g);
        let value = 0;
        
        // Combine Swiss format matches with regular matches
        let allMatches = [];
        if (swissMatches) {
            allMatches = [...swissMatches];
        }
        if (valueMatches) {
            const swissValues = swissMatches ? swissMatches.map(v => parseSwissNumber(v)) : [];
            valueMatches.forEach(v => {
                const parsed = parseSwissNumber(v);
                if (!swissValues.includes(parsed)) {
                    allMatches.push(v);
                }
            });
        }
        
        if (allMatches.length > 0) {
            const parsedValues = allMatches.map(v => parseSwissNumber(v));
            
            // Find nominal value
            const nominalPattern = /(?:USD|EUR|CHF)\s*([\d']+(?:\.\d{2})?)/i;
            const nominalMatch = context.match(nominalPattern);
            const nominalValue = nominalMatch ? parseSwissNumber(nominalMatch[1]) : 0;
            
            // Filter for market values
            const marketValues = parsedValues.filter(v => 
                v > 10000 && 
                v < 1000000000 && 
                v !== nominalValue && 
                v % 1000 !== 0
            );
            
            if (marketValues.length > 0) {
                value = Math.max(...marketValues);
            } else {
                const reasonableValues = parsedValues.filter(v => v > 1000 && v < 1000000000);
                value = reasonableValues.length > 0 ? Math.max(...reasonableValues) : 0;
            }
        }
        
        // Extract currency
        const currencyMatch = context.match(/\b(USD|EUR|CHF|GBP)\b/);
        const currency = currencyMatch ? currencyMatch[1] : 'USD';
        
        securities.push({
            isin: isin,
            name: name,
            value: value,
            currency: currency
        });
    }
    
    return securities;
}

// Combine securities from different extraction methods
function combineSecurities(textSecurities, ocrSecurities) {
    const securityMap = new Map();
    
    // Add text-based securities
    textSecurities.forEach(security => {
        securityMap.set(security.isin, {
            ...security,
            extractionMethod: 'text-parsing'
        });
    });
    
    // Add or update with OCR-based securities
    ocrSecurities.forEach(security => {
        const existing = securityMap.get(security.isin);
        if (existing) {
            // Prefer more accurate value or higher confidence
            if (security.value > existing.value || !existing.value) {
                securityMap.set(security.isin, {
                    ...existing,
                    ...security,
                    extractionMethod: 'text-parsing+ocr'
                });
            }
        } else {
            securityMap.set(security.isin, {
                ...security,
                extractionMethod: 'ocr'
            });
        }
    });
    
    return Array.from(securityMap.values());
}

// Calculate confidence score
function calculateConfidence(securities, processingMethods) {
    let baseConfidence = 0.5;
    
    if (processingMethods.includes('text-extraction')) {
        baseConfidence += 0.3;
    }
    
    if (processingMethods.includes('ocr-analysis')) {
        baseConfidence += 0.2;
    }
    
    if (securities.length > 0) {
        baseConfidence += 0.1;
    }
    
    return Math.min(baseConfidence, 1.0);
}

// Parse Swiss number format
function parseSwissNumber(swissNumber) {
    if (!swissNumber) return 0;
    return parseFloat(swissNumber.replace(/'/g, '')) || 0;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    
    if (ocrWorker) {
        await ocrWorker.terminate();
    }
    
    for (const browser of browserPool) {
        await browser.close();
    }
    
    process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MCP-Enhanced PDF OCR Server running on port ${PORT}`);
    console.log(`📊 Features: PDF parsing, OCR, Browser automation, Swiss financial data`);
    console.log(`🔧 Mode: ${process.env.MCP_MODE || 'enhanced'}`);
});