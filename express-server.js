// Express server for PDF processing
const express = require('express');
const cors = require('cors');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/test', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Express server is working on Render!',
        environment: process.env.NODE_ENV || 'development',
        pdfParseAvailable: !!pdfParse
    });
});

// PDF extraction endpoint
app.post('/api/pdf-extract', async (req, res) => {
    try {
        const { pdfBase64, testMode } = req.body;
        
        if (testMode) {
            // Return test data for now
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
        
        if (!pdfBase64) {
            return res.status(400).json({ 
                success: false, 
                error: 'No PDF data provided' 
            });
        }
        
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        const pdfData = await pdfParse(pdfBuffer);
        
        // Extract securities using Swiss financial patterns
        const securities = extractSecurities(pdfData.text);
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
                pages: pdfData.numpages,
                textLength: pdfData.text.length
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
        message: 'MCP-Enhanced PDF Processor',
        status: 'running',
        endpoints: ['/api/test', '/api/pdf-extract'],
        timestamp: new Date().toISOString()
    });
});

// Swiss financial data extraction function
function extractSecurities(text) {
    const securities = [];
    
    // ISIN pattern matching
    const isinRegex = /ISIN[:\s]*([A-Z]{2}[A-Z0-9]{9}[0-9])/g;
    let match;
    
    while ((match = isinRegex.exec(text)) !== null) {
        const isin = match[1];
        const position = match.index;
        
        // Extract context around ISIN
        const contextStart = Math.max(0, position - 500);
        const contextEnd = Math.min(text.length, position + 500);
        const context = text.substring(contextStart, contextEnd);
        
        // Extract security name (usually before ISIN)
        const nameMatch = context.match(/([A-Z\s&]+)\s*ISIN/);
        const name = nameMatch ? nameMatch[1].trim() : 'Unknown Security';
        
        // Extract value (Swiss format with apostrophes)
        const valueMatches = context.match(/(\d{1,3}(?:'\d{3})*(?:\.\d{2})?)/g);
        let value = 0;
        
        if (valueMatches) {
            // Find the largest value (likely the total)
            const values = valueMatches.map(v => parseSwissNumber(v)).filter(v => v > 1000);
            value = Math.max(...values, 0);
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

// Parse Swiss number format (e.g., "199'080" -> 199080)
function parseSwissNumber(swissNumber) {
    if (!swissNumber) return 0;
    return parseFloat(swissNumber.replace(/'/g, '')) || 0;
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on port ${PORT}`);
});