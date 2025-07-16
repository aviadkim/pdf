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
        const { pdfBase64, testMode, textContent } = req.body;
        
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
        
        let extractedText = '';
        
        if (textContent) {
            // Direct text extraction test
            extractedText = textContent;
        } else if (pdfBase64) {
            // PDF processing
            const pdfBuffer = Buffer.from(pdfBase64, 'base64');
            const pdfData = await pdfParse(pdfBuffer);
            extractedText = pdfData.text;
        } else {
            return res.status(400).json({ 
                success: false, 
                error: 'No PDF data or text content provided' 
            });
        }
        
        // Extract securities using Swiss financial patterns
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
        
        // Extract security name (usually before ISIN) - simplified extraction
        let name = '';
        
        // Look for patterns before ISIN - simplified version
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
        
        if (!name) {
            name = '';
        }
        
        // Extract value (Swiss format with apostrophes) - prioritize market value over nominal
        const valueMatches = context.match(/(\d{1,3}(?:'\d{3})*(?:\.\d{2})?)/g);
        let value = 0;
        
        if (valueMatches) {
            // Parse all values
            const parsedValues = valueMatches.map(v => parseSwissNumber(v));
            
            // First try to find market value (typically after price info, not the nominal USD amount)
            // Look for patterns that indicate market value vs nominal value
            const nominalPattern = /(?:USD|EUR|CHF)\s*([\d']+(?:\.\d{2})?)/i;
            const nominalMatch = context.match(nominalPattern);
            const nominalValue = nominalMatch ? parseSwissNumber(nominalMatch[1]) : 0;
            
            // Filter out the nominal value and look for actual market values
            const marketValues = parsedValues.filter(v => 
                v > 10000 && // Minimum threshold
                v < 1000000000 && // Maximum threshold
                v !== nominalValue && // Exclude nominal value
                v % 1000 !== 0 // Prefer values that aren't round thousands (more likely to be market values)
            );
            
            if (marketValues.length > 0) {
                // Pick the largest market value (most likely to be the total position value)
                value = Math.max(...marketValues);
            } else {
                // Fallback to all reasonable values if no market value found
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

// Parse Swiss number format (e.g., "199'080" -> 199080)
function parseSwissNumber(swissNumber) {
    if (!swissNumber) return 0;
    return parseFloat(swissNumber.replace(/'/g, '')) || 0;
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on port ${PORT}`);
});