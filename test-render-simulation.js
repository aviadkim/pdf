const express = require('express');const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

// Simulate the exact Render environment setup
const app = express();
app.use(cors());
app.use(express.json());

// Use the same multer configuration as our fixed server
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }
});

// Test endpoint that simulates bulletproof processor behavior
app.post('/api/test-memory-processing', upload.single('pdf'), async (req, res) => {
    try {
        console.log('📄 File received:', req.file?.originalname);
        console.log('📊 File size:', req.file?.size);
        console.log('🔧 Has buffer:', !!req.file?.buffer);
        console.log('🔧 Has path:', !!req.file?.path);
        
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                success: false,
                error: 'No PDF file or buffer provided',
                hasFile: !!req.file,
                hasBuffer: !!req.file?.buffer,
                hasPath: !!req.file?.path
            });
        }
        
        // This is what our fixed code does - use buffer directly
        const pdfBuffer = req.file.buffer;
        console.log('✅ PDF buffer size:', pdfBuffer.length);
        
        // Simulate processing
        console.log('🔄 Processing PDF buffer...');
        
        res.json({
            success: true,
            message: 'Memory storage processing works!',
            fileInfo: {
                originalName: req.file.originalname,
                size: req.file.size,
                bufferSize: pdfBuffer.length,
                hasPath: !!req.file.path
            },
            processing: {
                method: 'memory-buffer',
                status: 'success'
            }
        });
        
    } catch (error) {
        console.error('❌ Processing error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

const PORT = 3010;
app.listen(PORT, () => {
    console.log(`🧪 Test server running on port ${PORT}`);
    console.log('📡 Test endpoint: POST /api/test-memory-processing');
});

setTimeout(() => {
    console.log('🔄 Server ready for testing...');
}, 1000);