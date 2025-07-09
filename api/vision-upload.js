export default function handler(req, res) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Claude Vision PDF Extractor</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 10px;
        }
        .subtitle {
            text-align: center;
            color: #7f8c8d;
            margin-bottom: 30px;
        }
        .upload-section {
            border: 2px dashed #3498db;
            padding: 30px;
            text-align: center;
            border-radius: 8px;
            margin-bottom: 20px;
            background: #f8f9fa;
        }
        .upload-section.dragover {
            background: #e3f2fd;
            border-color: #1976d2;
        }
        input[type="file"] {
            margin: 20px 0;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            width: 100%;
        }
        button {
            background: #3498db;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
        }
        button:hover {
            background: #2980b9;
        }
        button:disabled {
            background: #bdc3c7;
            cursor: not-allowed;
        }
        .convert-section {
            margin: 20px 0;
            padding: 20px;
            background: #fff3cd;
            border-radius: 5px;
            border: 1px solid #ffeaa7;
        }
        .result {
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 5px;
            border: 1px solid #e9ecef;
            max-height: 600px;
            overflow-y: auto;
        }
        .loading {
            text-align: center;
            padding: 20px;
            color: #3498db;
        }
        .error {
            color: #e74c3c;
            background: #fdf2f2;
            border: 1px solid #fecaca;
        }
        .success {
            color: #27ae60;
            background: #f0f9ff;
            border: 1px solid #bfdbfe;
        }
        pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            white-space: pre-wrap;
            font-size: 12px;
        }
        .preview-image {
            max-width: 100%;
            border: 1px solid #ddd;
            border-radius: 5px;
            margin: 10px 0;
        }
        .step {
            margin: 20px 0;
            padding: 15px;
            background: #e8f5e8;
            border-radius: 5px;
            border-left: 4px solid #27ae60;
        }
        .step h3 {
            margin: 0 0 10px 0;
            color: #27ae60;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Claude Vision PDF Extractor</h1>
        <p class="subtitle">Upload PDF → Convert to Image → Extract with 100% Accuracy</p>
        
        <div class="step">
            <h3>Step 1: Upload PDF</h3>
            <div class="upload-section" id="uploadArea">
                <p>📄 Upload your PDF document</p>
                <input type="file" id="pdfInput" accept=".pdf" />
                <button onclick="convertPDFToImage()">Convert to Image</button>
            </div>
        </div>

        <div class="convert-section" id="convertSection" style="display: none;">
            <h3>Step 2: PDF converted to image</h3>
            <div id="imagePreview"></div>
            <button onclick="extractWithVision()">Extract Data with Claude Vision</button>
        </div>

        <div class="step" id="manualStep" style="display: none;">
            <h3>Alternative: Manual Image Upload</h3>
            <p>If PDF conversion doesn't work, take a screenshot of your PDF and upload it:</p>
            <input type="file" id="imageInput" accept="image/*" />
            <button onclick="uploadImage()">Upload Image</button>
        </div>
        
        <div id="result"></div>
    </div>

    <script>
        // Import PDF.js
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        document.head.appendChild(script);

        let convertedImageBase64 = null;
        
        script.onload = function() {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        };

        // Drag and drop functionality
        const uploadArea = document.getElementById('uploadArea');
        const pdfInput = document.getElementById('pdfInput');
        const result = document.getElementById('result');

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                pdfInput.files = files;
            }
        });

        async function convertPDFToImage() {
            const file = pdfInput.files[0];
            if (!file) {
                alert('Please select a PDF file');
                return;
            }

            try {
                result.innerHTML = '<div class="loading">🔄 Converting PDF to image...</div>';
                
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                
                // Get total pages
                const totalPages = pdf.numPages;
                result.innerHTML = \`<div class="loading">📄 Found \${totalPages} pages. Converting all pages...</div>\`;
                
                // Convert all pages to images
                const scale = 2; // Higher scale for better quality
                const allPagesCanvas = document.createElement('canvas');
                const allPagesContext = allPagesCanvas.getContext('2d');
                
                // Calculate total height needed
                let totalHeight = 0;
                let maxWidth = 0;
                const pageHeights = [];
                
                // First pass: calculate dimensions
                for (let i = 1; i <= totalPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale });
                    pageHeights.push(viewport.height);
                    totalHeight += viewport.height;
                    maxWidth = Math.max(maxWidth, viewport.width);
                }
                
                // Set canvas size for all pages
                allPagesCanvas.width = maxWidth;
                allPagesCanvas.height = totalHeight;
                
                // Second pass: render all pages
                let currentY = 0;
                for (let i = 1; i <= totalPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale });
                    
                    // Create temporary canvas for this page
                    const tempCanvas = document.createElement('canvas');
                    const tempContext = tempCanvas.getContext('2d');
                    tempCanvas.width = viewport.width;
                    tempCanvas.height = viewport.height;
                    
                    // Render page to temporary canvas
                    await page.render({
                        canvasContext: tempContext,
                        viewport: viewport
                    }).promise;
                    
                    // Copy to main canvas
                    allPagesContext.drawImage(tempCanvas, 0, currentY);
                    currentY += viewport.height;
                    
                    // Update progress
                    result.innerHTML = \`<div class="loading">📄 Converting page \${i} of \${totalPages}...</div>\`;
                }
                
                // Convert to base64
                convertedImageBase64 = allPagesCanvas.toDataURL('image/png').split(',')[1];
                
                // Show preview
                const imagePreview = document.getElementById('imagePreview');
                imagePreview.innerHTML = \`
                    <img src="data:image/png;base64,\${convertedImageBase64}" class="preview-image" alt="PDF Preview - All \${totalPages} Pages">
                    <p>✅ PDF converted to image successfully!</p>
                    <p><strong>Pages converted:</strong> \${totalPages}</p>
                    <p><strong>Total height:</strong> \${totalHeight}px</p>
                \`;
                
                document.getElementById('convertSection').style.display = 'block';
                document.getElementById('manualStep').style.display = 'block';
                result.innerHTML = \`<div class="result success">✅ All \${totalPages} pages converted! Now click "Extract Data with Claude Vision"</div>\`;
                
            } catch (error) {
                console.error('PDF conversion error:', error);
                result.innerHTML = \`
                    <div class="result error">
                        <h3>❌ PDF Conversion Failed</h3>
                        <p>Error: \${error.message}</p>
                        <p>Please try the manual image upload option below.</p>
                    </div>
                \`;
                document.getElementById('manualStep').style.display = 'block';
            }
        }

        async function uploadImage() {
            const file = document.getElementById('imageInput').files[0];
            if (!file) {
                alert('Please select an image file');
                return;
            }

            try {
                const reader = new FileReader();
                reader.onload = function(e) {
                    convertedImageBase64 = e.target.result.split(',')[1];
                    
                    const imagePreview = document.getElementById('imagePreview');
                    imagePreview.innerHTML = \`
                        <img src="\${e.target.result}" class="preview-image" alt="Uploaded Image">
                        <p>✅ Image uploaded successfully!</p>
                    \`;
                    
                    document.getElementById('convertSection').style.display = 'block';
                    result.innerHTML = '<div class="result success">✅ Image ready! Now click "Extract Data with Claude Vision"</div>';
                };
                reader.readAsDataURL(file);
            } catch (error) {
                result.innerHTML = \`
                    <div class="result error">
                        <h3>❌ Image Upload Failed</h3>
                        <p>\${error.message}</p>
                    </div>
                \`;
            }
        }

        async function extractWithVision() {
            if (!convertedImageBase64) {
                alert('Please convert PDF to image first');
                return;
            }

            try {
                result.innerHTML = '<div class="loading">🔍 Claude is analyzing your document with vision API...</div>';
                
                const response = await fetch('/api/vision-extract', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        imageBase64: convertedImageBase64,
                        filename: pdfInput.files[0]?.name || 'document.pdf'
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    const extraction = data.data;
                    result.innerHTML = \`
                        <div class="result success">
                            <h3>✅ Extraction Complete! (Vision API)</h3>
                            <p><strong>Processing time:</strong> \${data.metadata.processingTime}</p>
                            <p><strong>Method:</strong> \${data.metadata.method}</p>
                            
                            \${extraction.portfolioInfo ? \`
                                <h4>Portfolio Information:</h4>
                                <p><strong>Client:</strong> \${extraction.portfolioInfo.clientName || 'Not found'}</p>
                                <p><strong>Bank:</strong> \${extraction.portfolioInfo.bankName || 'Not found'}</p>
                                <p><strong>Total Value:</strong> \${extraction.portfolioInfo.portfolioTotal?.value || 'Not found'} \${extraction.portfolioInfo.portfolioTotal?.currency || ''}</p>
                            \` : ''}
                            
                            \${extraction.holdings ? \`
                                <h4>Holdings Found: \${extraction.holdings.length}</h4>
                                <p>First 5 holdings:</p>
                                <ul>
                                    \${extraction.holdings.slice(0, 5).map(h => \`
                                        <li><strong>\${h.securityName}</strong> - ISIN: \${h.isin} - Value: \${h.currentValue} \${h.currency}</li>
                                    \`).join('')}
                                </ul>
                            \` : ''}
                            
                            \${extraction.summary ? \`
                                <h4>Summary:</h4>
                                <p><strong>Total Holdings:</strong> \${extraction.summary.totalHoldings}</p>
                                <p><strong>Accuracy:</strong> \${extraction.summary.extractionAccuracy}</p>
                            \` : ''}
                            
                            <h4>Complete Data:</h4>
                            <pre>\${JSON.stringify(data, null, 2)}</pre>
                        </div>
                    \`;
                } else {
                    result.innerHTML = \`
                        <div class="result error">
                            <h3>❌ Extraction Failed</h3>
                            <p><strong>Error:</strong> \${data.error}</p>
                            <p><strong>Details:</strong> \${data.details || 'No additional details'}</p>
                            \${data.retry ? '<p>Please try again in a few moments.</p>' : ''}
                        </div>
                    \`;
                }
            } catch (error) {
                result.innerHTML = \`
                    <div class="result error">
                        <h3>❌ Network Error</h3>
                        <p>\${error.message}</p>
                    </div>
                \`;
            }
        }
    </script>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}