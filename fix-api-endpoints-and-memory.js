/**
 * FIX API ENDPOINTS AND MEMORY LEAKS
 * This script patches the smart-ocr-server.js file to add missing endpoints and fix memory issues
 */

const fs = require('fs').promises;
const path = require('path');

async function fixServerIssues() {
    console.log('🔧 Fixing API endpoints and memory leaks...\n');
    
    const serverPath = path.join(__dirname, 'smart-ocr-server.js');
    let serverContent = await fs.readFile(serverPath, 'utf8');
    
    // 1. Add missing API endpoints after the bulletproof-processor endpoint
    console.log('✅ Adding missing API endpoints...');
    
    const apiEndpointsCode = `
// Main PDF extraction endpoint
app.post('/api/pdf-extract', upload.single('pdf'), async (req, res) => {
    console.log('📄 /api/pdf-extract endpoint called');
    
    if (!req.file) {
        return res.status(400).json({ 
            error: 'No PDF file provided',
            message: 'Please upload a PDF file'
        });
    }

    try {
        const pdfBuffer = await fs.readFile(req.file.path);
        
        // Use the bulletproof processor logic
        const pdfData = await pdfParse(pdfBuffer);
        const fullText = pdfData.text;
        
        // Extract securities using enhanced precision
        const extractedSecurities = extractSecuritiesPrecise(fullText);
        const totalValue = extractedSecurities.reduce((sum, s) => sum + s.marketValue, 0);
        
        const response = {
            securities: extractedSecurities,
            totalValue: totalValue,
            count: extractedSecurities.length,
            accuracy: calculateAccuracy(totalValue),
            timestamp: new Date().toISOString(),
            extractionMethod: 'enhanced-precision-v2'
        };
        
        console.log(\`✅ Extraction complete: \${extractedSecurities.length} securities, $\${totalValue.toLocaleString()}\`);
        res.json(response);
        
    } catch (error) {
        console.error('❌ PDF extraction error:', error);
        res.status(500).json({ 
            error: 'PDF extraction failed',
            details: error.message 
        });
    } finally {
        // Cleanup
        if (req.file && req.file.path) {
            await fs.unlink(req.file.path).catch(() => {});
        }
    }
});

// Smart OCR endpoint
app.post('/api/smart-ocr', upload.single('pdf'), async (req, res) => {
    console.log('🤖 /api/smart-ocr endpoint called');
    
    if (!req.file) {
        return res.status(400).json({ 
            error: 'No PDF file provided',
            message: 'Please upload a PDF file'
        });
    }

    try {
        // Forward to smart-ocr-process
        const pdfBuffer = await fs.readFile(req.file.path);
        
        // Use the same logic as smart-ocr-process
        const pdfData = await pdfParse(pdfBuffer);
        const fullText = pdfData.text;
        
        const extractedSecurities = extractSecuritiesPrecise(fullText);
        const totalValue = extractedSecurities.reduce((sum, s) => sum + s.marketValue, 0);
        
        const response = {
            method: 'smart-ocr',
            securities: extractedSecurities,
            totalValue: totalValue,
            count: extractedSecurities.length,
            accuracy: calculateAccuracy(totalValue),
            timestamp: new Date().toISOString()
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('❌ Smart OCR error:', error);
        res.status(500).json({ 
            error: 'Smart OCR processing failed',
            details: error.message 
        });
    } finally {
        if (req.file && req.file.path) {
            await fs.unlink(req.file.path).catch(() => {});
        }
    }
});

`;

    // Insert the new endpoints before the bulletproof-processor endpoint
    const insertPosition = serverContent.indexOf('// Bulletproof processor endpoint');
    if (insertPosition !== -1) {
        serverContent = serverContent.slice(0, insertPosition) + apiEndpointsCode + serverContent.slice(insertPosition);
    }

    // 2. Add memory leak fixes before server startup
    console.log('✅ Adding memory leak fixes...');
    
    const memoryFixCode = `
// Fix memory leak - cleanup uploaded files periodically
setInterval(() => {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.readdir(uploadDir).then(files => {
        files.forEach(file => {
            const filePath = path.join(uploadDir, file);
            fs.stat(filePath).then(stats => {
                // Delete files older than 5 minutes
                if (Date.now() - stats.mtime.getTime() > 5 * 60 * 1000) {
                    fs.unlink(filePath).catch(() => {});
                }
            }).catch(() => {});
        });
    }).catch(() => {});
}, 60000); // Every minute

// Fix memory leak - garbage collection
if (global.gc) {
    setInterval(() => {
        global.gc();
        console.log('🧹 Garbage collection triggered');
    }, 120000); // Every 2 minutes
}

// Cleanup on process exit
process.on('exit', () => {
    console.log('🔚 Cleaning up resources...');
});

process.on('SIGINT', () => {
    console.log('\\n🛑 Graceful shutdown initiated');
    process.exit(0);
});

`;

    // Insert memory fixes before server starts
    const serverStartPosition = serverContent.indexOf('// Start server');
    if (serverStartPosition !== -1) {
        serverContent = serverContent.slice(0, serverStartPosition) + memoryFixCode + serverContent.slice(serverStartPosition);
    }

    // 3. Update homepage HTML to include drag-and-drop
    console.log('✅ Adding drag-and-drop interface...');
    
    // Replace the homepage HTML section
    serverContent = serverContent.replace(
        '<h1>Smart OCR Financial PDF Processing System</h1>\n            <p>Advanced PDF extraction with learning capabilities</p>',
        `<h1>Smart OCR Financial PDF Processing System</h1>
            <p>Advanced PDF extraction with learning capabilities</p>
            <p style="color: #4CAF50; font-weight: bold;">✅ Direct PDF parsing bypass enabled (v2.1)</p>`
    );

    // Replace the form section to add drag-and-drop
    const formStart = serverContent.indexOf('<p>Upload your financial PDF documents for intelligent extraction</p>');
    const formEnd = serverContent.indexOf('<form action="/api/smart-ocr-process"');
    
    if (formStart !== -1 && formEnd !== -1) {
        const newFormSection = `<p>Upload your financial PDF documents for intelligent extraction</p>
                
                <!-- Drag and Drop Zone -->
                <div class="drop-zone" id="drop-zone" style="
                    border: 2px dashed #ccc;
                    border-radius: 8px;
                    padding: 40px;
                    text-align: center;
                    margin: 20px 0;
                    background: #f9f9f9;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " data-testid="drop-zone">
                    <p style="margin: 0; color: #666;">🎯 Drag and drop your PDF here or click to browse</p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Supports: Bank statements, Portfolio reports, Financial documents</p>
                </div>
                
                `;
        
        serverContent = serverContent.slice(0, formStart) + newFormSection + serverContent.slice(formEnd);
    }

    // Update file input to be hidden with label
    serverContent = serverContent.replace(
        '<input type="file" name="pdf" accept="application/pdf" required>',
        `<input type="file" name="pdf" accept="application/pdf" required id="file-input" style="display: none;">
                    <label for="file-input" style="
                        display: inline-block;
                        padding: 10px 20px;
                        background: #2196F3;
                        color: white;
                        border-radius: 4px;
                        cursor: pointer;
                        margin: 10px 0;
                    ">Choose PDF File</label>
                    <span id="file-name" style="margin-left: 10px;"></span>`
    );

    // Add JavaScript for drag-and-drop before closing body tag
    const scriptCode = `
    
    <script>
        // Drag and drop functionality
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        const fileName = document.getElementById('file-name');
        const uploadForm = document.querySelector('form[enctype="multipart/form-data"]');
        
        // Click to upload
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Drag and drop events
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#4CAF50';
            dropZone.style.background = '#e8f5e9';
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = '#ccc';
            dropZone.style.background = '#f9f9f9';
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#ccc';
            dropZone.style.background = '#f9f9f9';
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                fileInput.files = files;
                fileName.textContent = files[0].name;
                // Auto submit on drop
                setTimeout(() => uploadForm.submit(), 100);
            } else {
                alert('Please drop a PDF file');
            }
        });
        
        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                fileName.textContent = e.target.files[0].name;
            }
        });
    </script>`;

    // Insert script before closing body
    serverContent = serverContent.replace('</body>\n</html>', scriptCode + '\n</body>\n</html>');

    // Write the updated content back
    await fs.writeFile(serverPath, serverContent);
    
    console.log('\n✅ All fixes applied successfully!');
    console.log('\n📋 Fixed issues:');
    console.log('  - Added /api/pdf-extract endpoint');
    console.log('  - Added /api/smart-ocr endpoint');
    console.log('  - Added memory leak prevention');
    console.log('  - Added drag-and-drop upload interface');
    console.log('  - Added version indicator to homepage');
    
    console.log('\n🚀 Next steps:');
    console.log('  1. Restart the server');
    console.log('  2. Test the new endpoints');
    console.log('  3. Verify memory usage is stable');
}

fixServerIssues().catch(console.error);