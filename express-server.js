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
        
        res.json({
            success: true,
            message: 'PDF parsed successfully',
            pdfInfo: {
                pages: pdfData.numpages,
                textLength: pdfData.text.length,
                extractedText: pdfData.text.substring(0, 500) + '...'
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on port ${PORT}`);
});