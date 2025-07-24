/**
 * LIVE DEMO WEB SERVER
 * Creates a web interface to demonstrate the PDF extraction system
 * Run this and open http://localhost:3000 to see the live demo
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { DemoRealTest } = require('./demo_real_test');

const app = express();
const port = process.env.PORT || 8080;

// Configure multer for file uploads
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Main demo page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'demo.html'));
});

// API endpoint for PDF processing
app.post('/api/process-pdf', upload.single('pdf'), async (req, res) => {
    try {
        console.log('📄 Processing PDF upload...');
        
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No PDF file uploaded' 
            });
        }

        // Process the uploaded PDF
        const demo = new DemoRealTest();
        const results = await demo.runCompleteDemo(req.file.path);
        
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        if (results) {
            res.json({
                success: true,
                data: {
                    totalSecurities: results.securities.length,
                    totalValue: results.summary.totalValue,
                    accuracy: Math.round(results.summary.accuracy * 100) / 100,
                    averageConfidence: Math.round(results.summary.averageConfidence * 100),
                    securities: results.securities.map(s => ({
                        isin: s.isin,
                        value: s.value,
                        confidence: Math.round(s.confidence * 100),
                        method: s.method,
                        reasoning: s.reasoning
                    }))
                },
                metadata: {
                    processingTime: Date.now() - req.startTime,
                    method: 'intelligent_extraction_system',
                    version: '1.0.0'
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to process PDF'
            });
        }
    } catch (error) {
        console.error('❌ Processing error:', error);
        
        // Clean up uploaded file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Demo with Messos PDF endpoint
app.post('/api/demo-messos', async (req, res) => {
    try {
        console.log('🎯 Running Messos demo...');
        req.startTime = Date.now();
        
        const demo = new DemoRealTest();
        const pdfPath = '2. Messos  - 31.03.2025.pdf';
        
        if (!fs.existsSync(pdfPath)) {
            return res.status(404).json({
                success: false,
                error: 'Messos PDF file not found'
            });
        }
        
        const results = await demo.runCompleteDemo(pdfPath);
        
        if (results) {
            res.json({
                success: true,
                data: {
                    totalSecurities: results.securities.length,
                    totalValue: results.summary.totalValue,
                    accuracy: Math.round(results.summary.accuracy * 100) / 100,
                    averageConfidence: Math.round(results.summary.averageConfidence * 100),
                    securities: results.securities.map(s => ({
                        isin: s.isin,
                        value: s.value,
                        confidence: Math.round(s.confidence * 100),
                        method: s.method,
                        reasoning: s.reasoning,
                        foundAt: s.foundAt
                    }))
                },
                metadata: {
                    processingTime: Date.now() - req.startTime,
                    method: 'intelligent_extraction_system',
                    version: '1.0.0',
                    fileName: 'Messos - 31.03.2025.pdf'
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to process Messos PDF'
            });
        }
    } catch (error) {
        console.error('❌ Demo error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(port, () => {
    console.log('🌐 LIVE DEMO SERVER STARTING');
    console.log('============================');
    console.log(`🚀 Server running at: http://localhost:${port}`);
    console.log('📱 Open your browser and navigate to the URL above');
    console.log('🎯 Ready for live PDF extraction demo!');
    console.log('');
    console.log('Features available:');
    console.log('✅ Upload any PDF file');
    console.log('✅ Demo with Messos PDF');
    console.log('✅ Real-time processing');
    console.log('✅ Interactive results display');
    console.log('✅ Complete transparency');
});