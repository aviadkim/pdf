/**
 * ROBUST PDF PROCESSOR
 * 
 * Handles PDF processing with multiple fallback methods:
 * 1. pdf-parse with error handling
 * 2. pdf2pic for image conversion
 * 3. Alternative text extraction methods
 * 4. Graceful error handling for corrupted PDFs
 */

const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const pdf2pic = require('pdf2pic');
const path = require('path');

class RobustPDFProcessor {
    constructor(options = {}) {
        this.options = {
            maxPages: options.maxPages || 50,
            timeout: options.timeout || 30000,
            fallbackToImages: options.fallbackToImages !== false,
            ...options
        };
        
        console.log('🔧 ROBUST PDF PROCESSOR INITIALIZED');
        console.log('===================================');
        console.log(`📄 Max pages: ${this.options.maxPages}`);
        console.log(`⏱️  Timeout: ${this.options.timeout}ms`);
        console.log(`🖼️  Image fallback: ${this.options.fallbackToImages ? 'Enabled' : 'Disabled'}`);
    }

    async processPDF(filePath) {
        console.log(`\n📄 Processing PDF: ${path.basename(filePath)}`);
        console.log('=====================================');
        
        try {
            // Get file info
            const stats = await fs.stat(filePath);
            console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            
            // Try multiple extraction methods
            const results = await this.tryMultipleExtractionMethods(filePath);
            
            return {
                success: true,
                method: results.method,
                text: results.text,
                pages: results.pages || 1,
                fileSize: stats.size,
                processingTime: results.processingTime,
                metadata: results.metadata || {}
            };
            
        } catch (error) {
            console.error('❌ PDF processing failed:', error.message);
            
            return {
                success: false,
                error: error.message,
                method: 'failed',
                text: '',
                fallbackMessage: 'PDF processing failed. Please try a different PDF file or contact support.'
            };
        }
    }

    async tryMultipleExtractionMethods(filePath) {
        const methods = [
            { name: 'pdf-parse-safe', fn: () => this.safePdfParse(filePath) },
            { name: 'pdf-parse-minimal', fn: () => this.minimalPdfParse(filePath) },
            { name: 'pdf2pic-ocr', fn: () => this.pdf2picExtraction(filePath) }
        ];

        for (const method of methods) {
            try {
                console.log(`🔄 Trying method: ${method.name}`);
                const startTime = Date.now();
                
                const result = await Promise.race([
                    method.fn(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), this.options.timeout)
                    )
                ]);
                
                const processingTime = Date.now() - startTime;
                console.log(`✅ Success with ${method.name} (${processingTime}ms)`);
                
                return {
                    method: method.name,
                    text: result.text,
                    pages: result.pages,
                    processingTime,
                    metadata: result.metadata
                };
                
            } catch (error) {
                console.log(`❌ ${method.name} failed: ${error.message}`);
                continue;
            }
        }
        
        throw new Error('All PDF extraction methods failed');
    }

    async safePdfParse(filePath) {
        console.log('   📖 Using safe pdf-parse...');
        
        const buffer = await fs.readFile(filePath);
        
        // Safe options to handle problematic PDFs
        const options = {
            max: this.options.maxPages,
            version: 'v1.10.100',
            normalizeWhitespace: true,
            disableCombineTextItems: false
        };
        
        const data = await pdfParse(buffer, options);
        
        return {
            text: data.text || '',
            pages: data.numpages || 1,
            metadata: {
                info: data.info || {},
                version: data.version || 'unknown'
            }
        };
    }

    async minimalPdfParse(filePath) {
        console.log('   📖 Using minimal pdf-parse...');
        
        const buffer = await fs.readFile(filePath);
        
        // Minimal options for problematic PDFs
        const options = {
            max: Math.min(this.options.maxPages, 10), // Limit to 10 pages
            normalizeWhitespace: false,
            disableCombineTextItems: true
        };
        
        const data = await pdfParse(buffer, options);
        
        return {
            text: data.text || '',
            pages: data.numpages || 1,
            metadata: { method: 'minimal' }
        };
    }

    async pdf2picExtraction(filePath) {
        console.log('   🖼️  Using pdf2pic conversion...');
        
        if (!this.options.fallbackToImages) {
            throw new Error('Image fallback disabled');
        }
        
        // Check if GraphicsMagick is available
        try {
            const { exec } = require('child_process');
            await new Promise((resolve, reject) => {
                exec('gm version', (error) => {
                    if (error) reject(new Error('GraphicsMagick not available'));
                    else resolve();
                });
            });
        } catch (error) {
            throw new Error('GraphicsMagick not available for image conversion');
        }
        
        const convert = pdf2pic.fromPath(filePath, {
            density: 100,
            saveFilename: "page",
            savePath: "/tmp",
            format: "png",
            width: 600,
            height: 800
        });
        
        // Convert first few pages to images
        const maxPages = Math.min(this.options.maxPages, 5);
        const results = await convert.bulk(1, maxPages);
        
        // For now, return a placeholder text
        // In a full implementation, you'd use OCR on the images
        return {
            text: `[PDF converted to ${results.length} images - OCR processing would be applied here]`,
            pages: results.length,
            metadata: { 
                method: 'pdf2pic',
                images: results.length,
                note: 'OCR processing needed for text extraction'
            }
        };
    }

    async validatePDF(filePath) {
        try {
            const buffer = await fs.readFile(filePath);
            
            // Check PDF header
            const header = buffer.slice(0, 8).toString();
            if (!header.startsWith('%PDF-')) {
                throw new Error('Invalid PDF file format');
            }
            
            // Check file size
            if (buffer.length > 50 * 1024 * 1024) { // 50MB limit
                throw new Error('PDF file too large (max 50MB)');
            }
            
            return true;
            
        } catch (error) {
            throw new Error(`PDF validation failed: ${error.message}`);
        }
    }
}

// Enhanced error handling wrapper
async function processWithErrorHandling(filePath, options = {}) {
    const processor = new RobustPDFProcessor(options);
    
    try {
        // Validate PDF first
        await processor.validatePDF(filePath);
        
        // Process PDF
        const result = await processor.processPDF(filePath);
        
        return result;
        
    } catch (error) {
        console.error('🚨 PDF processing error:', error.message);
        
        return {
            success: false,
            error: error.message,
            method: 'error-handler',
            text: '',
            fallbackMessage: 'Unable to process this PDF. Please try a different file or contact support.',
            troubleshooting: {
                commonCauses: [
                    'PDF file is corrupted or password-protected',
                    'PDF contains complex graphics or non-standard encoding',
                    'File size exceeds processing limits',
                    'Missing system dependencies (GraphicsMagick/ImageMagick)'
                ],
                suggestions: [
                    'Try a different PDF file',
                    'Ensure PDF is not password-protected',
                    'Check file size is under 50MB',
                    'Contact support if issue persists'
                ]
            }
        };
    }
}

module.exports = {
    RobustPDFProcessor,
    processWithErrorHandling
};
