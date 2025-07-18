// Smart OCR Learning System - Express Server
const express = require('express');
const cors = require('cors');
const pdfParse = require('pdf-parse');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Import only the smart OCR components
const SmartOCRLearningSystem = require('./smart-ocr-learning-system.js');

const app = express();
const PORT = process.env.PORT || 10002;

// Configure multer for file uploads
const upload = multer({
    dest: '/tmp/uploads/',
    limits: { fileSize: 50 * 1024 * 1024 }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve annotation files
app.use('/temp_annotations', express.static('temp_annotations'));

// Initialize Smart OCR Learning System
const smartOCRSystem = new SmartOCRLearningSystem();

// Main route
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Smart OCR Learning System</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        .form-group { margin: 20px 0; }
        input[type="file"] { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; width: 100%; }
        button { background: #007bff; color: white; padding: 12px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        .success { color: green; }
        .error { color: red; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧠 Smart OCR Learning System</h1>
        <p>🎯 Achieve 100% accuracy through Mistral OCR + Human Annotation</p>
        
        <h2>🔧 PDF Processing</h2>
        <form action="/api/smart-ocr-process" method="post" enctype="multipart/form-data">
            <input type="file" name="pdf" accept=".pdf" required>
            <button type="submit">Process PDF with Smart OCR</button>
        </form>
        
        <h2>📊 System Status</h2>
        <ul>
            <li>Initial Accuracy: 80-90% (Mistral OCR)</li>
            <li>Target Accuracy: 99.9%</li>
            <li>Learning Rate: Continuous improvement</li>
        </ul>
        
        <h2>🎨 Visual Annotation</h2>
        <a href="/smart-annotation" target="_blank">
            <button type="button">Open Annotation Interface</button>
        </a>
    </div>
</body>
</html>
    `);
});

// Health check endpoint
app.get('/api/smart-ocr-test', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Smart OCR Learning System',
        version: '1.0.0',
        mistralEnabled: !!process.env.MISTRAL_API_KEY,
        endpoints: {
            process: '/api/smart-ocr-process',
            stats: '/api/smart-ocr-stats',
            patterns: '/api/smart-ocr-patterns',
            learn: '/api/smart-ocr-learn',
            annotation: '/smart-annotation'
        }
    });
});

// Get system statistics
app.get('/api/smart-ocr-stats', (req, res) => {
    const stats = smartOCRSystem.getStats();
    res.json({
        success: true,
        stats: stats
    });
});

// Get learned patterns
app.get('/api/smart-ocr-patterns', (req, res) => {
    const patterns = smartOCRSystem.getPatterns();
    res.json({
        success: true,
        patterns: patterns
    });
});

// Process PDF with Smart OCR
app.post('/api/smart-ocr-process', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No PDF file uploaded' 
            });
        }

        const pdfBuffer = await fs.readFile(req.file.path);
        const results = await smartOCRSystem.processPDF(pdfBuffer, {
            filename: req.file.originalname,
            enableLearning: req.body.enableLearning !== 'false',
            usePatterns: req.body.usePatterns !== 'false'
        });

        // Clean up uploaded file
        await fs.unlink(req.file.path);

        res.json({
            success: true,
            results: results
        });
    } catch (error) {
        console.error('Smart OCR processing error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Learn from human corrections
app.post('/api/smart-ocr-learn', async (req, res) => {
    try {
        const { corrections, patterns, documentId } = req.body;
        
        if (!corrections && !patterns) {
            return res.status(400).json({
                success: false,
                error: 'No corrections or patterns provided'
            });
        }

        const learningResult = await smartOCRSystem.learnFromCorrections({
            corrections,
            patterns,
            documentId
        });

        res.json({
            success: true,
            result: learningResult
        });
    } catch (error) {
        console.error('Learning error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Serve smart annotation interface
app.get('/smart-annotation', (req, res) => {
    res.sendFile(path.join(__dirname, 'smart-annotation-interface.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🧠 Smart OCR Learning System running on port ${PORT}`);
    console.log(`🎯 Health check: http://localhost:${PORT}/api/smart-ocr-test`);
    console.log(`🎨 Annotation interface: http://localhost:${PORT}/smart-annotation`);
    console.log(`📊 Mistral OCR: ${process.env.MISTRAL_API_KEY ? 'Enabled' : 'Disabled'}`);
});

module.exports = app;