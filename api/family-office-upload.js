// 🏛️ Family Office Upload Interface - Ultimate PDF Processing
// Complete back-office solution for financial document processing

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    // Return the upload interface
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(getFamilyOfficeInterface());
  } else if (req.method === 'POST') {
    // Set JSON content type for POST requests
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Handle file upload and processing
    try {
      const { pdfBase64, filename } = req.body;
      
      if (!pdfBase64) {
        return res.status(400).json({
          error: 'No PDF data provided',
          required: 'pdfBase64 field with base64 encoded PDF'
        });
      }
      
      console.log('🏛️ Family Office Upload:', filename);
      
      // Try enhanced multiline processor first, fallback to fixed processor
      let processResponse;
      try {
        processResponse = await fetch(`${req.headers.origin || 'https://pdf-five-nu.vercel.app'}/api/multiline-messos-processor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pdfBase64, filename })
        });
        
        if (!processResponse.ok) {
          throw new Error('Multiline processor not available');
        }
      } catch (error) {
        console.log('Falling back to fixed processor:', error.message);
        processResponse = await fetch(`${req.headers.origin || 'https://pdf-five-nu.vercel.app'}/api/fixed-messos-processor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pdfBase64, filename })
        });
      }
      
      const processResult = await processResponse.json();
      
      res.status(200).json(processResult);
      
    } catch (error) {
      console.error('❌ Family Office upload failed:', error);
      res.status(500).json({
        error: 'Upload processing failed',
        details: error.message
      });
    }
  } else {
    res.status(405).json({
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST']
    });
  }
}

function getFamilyOfficeInterface() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Family Office Back Office - PDF Document Processor</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            color: white;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
        }
        
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .upload-section {
            background: white;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .upload-area {
            border: 3px dashed #e0e0e0;
            border-radius: 10px;
            padding: 60px 20px;
            text-align: center;
            background: #fafafa;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .upload-area:hover {
            border-color: #2a5298;
            background: #f0f8ff;
        }
        
        .upload-area.dragover {
            border-color: #2a5298;
            background: #e8f4fd;
        }
        
        .upload-icon {
            font-size: 4em;
            margin-bottom: 20px;
            color: #2a5298;
        }
        
        .upload-text {
            font-size: 1.3em;
            margin-bottom: 15px;
            color: #555;
        }
        
        .upload-subtext {
            color: #888;
            font-size: 0.9em;
        }
        
        .file-input {
            display: none;
        }
        
        .btn {
            background: #2a5298;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1.1em;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 10px;
        }
        
        .btn:hover {
            background: #1e3c72;
            transform: translateY(-2px);
        }
        
        .btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        
        .processing {
            display: none;
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 15px;
            margin: 20px 0;
        }
        
        .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #2a5298;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .results {
            display: none;
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin: 20px 0;
        }
        
        .results-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
        }
        
        .results-title {
            font-size: 1.8em;
            color: #2a5298;
        }
        
        .results-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        
        .summary-value {
            font-size: 2em;
            font-weight: bold;
            color: #2a5298;
            margin-bottom: 5px;
        }
        
        .summary-label {
            color: #666;
            font-size: 0.9em;
        }
        
        .holdings-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .holdings-table th,
        .holdings-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        
        .holdings-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #2a5298;
        }
        
        .holdings-table tr:hover {
            background: #f8f9fa;
        }
        
        .download-buttons {
            display: flex;
            gap: 15px;
            margin-top: 30px;
            justify-content: center;
        }
        
        .btn-success {
            background: #28a745;
        }
        
        .btn-success:hover {
            background: #218838;
        }
        
        .btn-info {
            background: #17a2b8;
        }
        
        .btn-info:hover {
            background: #138496;
        }
        
        .error {
            background: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #ffeaa7;
            margin: 20px 0;
        }
        
        .success {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #c3e6cb;
            margin: 20px 0;
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        
        .feature-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            color: white;
        }
        
        .feature-icon {
            font-size: 3em;
            margin-bottom: 20px;
        }
        
        .feature-title {
            font-size: 1.3em;
            margin-bottom: 15px;
        }
        
        .feature-description {
            opacity: 0.9;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏛️ Family Office Back Office</h1>
            <p>Professional PDF Document Processing for Financial Holdings</p>
        </div>
        
        <div class="upload-section">
            <div class="upload-area" id="uploadArea">
                <div class="upload-icon">📄</div>
                <div class="upload-text">Drop your PDF document here or click to upload</div>
                <div class="upload-subtext">Supports Swiss banking statements, portfolio reports, and financial documents</div>
                <input type="file" id="fileInput" class="file-input" accept=".pdf" />
                <button class="btn" onclick="document.getElementById('fileInput').click()">
                    Select PDF File
                </button>
            </div>
        </div>
        
        <div class="processing" id="processing">
            <div class="spinner"></div>
            <h3>Processing your document...</h3>
            <p>Converting PDF to images, extracting data with Azure AI and Claude Vision</p>
            <p id="processingStatus">Initializing...</p>
        </div>
        
        <div class="results" id="results">
            <div class="results-header">
                <h2 class="results-title">📊 Extraction Results</h2>
                <div class="download-buttons">
                    <button class="btn btn-success" onclick="downloadCSV()">
                        📥 Download CSV
                    </button>
                    <button class="btn btn-info" onclick="downloadJSON()">
                        📄 Download JSON
                    </button>
                </div>
            </div>
            
            <div class="results-summary" id="resultsSummary">
                <!-- Summary cards will be populated here -->
            </div>
            
            <div style="overflow-x: auto;">
                <table class="holdings-table" id="holdingsTable">
                    <thead>
                        <tr>
                            <th>Position</th>
                            <th>Security Name</th>
                            <th>ISIN</th>
                            <th>Current Value</th>
                            <th>Currency</th>
                            <th>Category</th>
                            <th>Source</th>
                        </tr>
                    </thead>
                    <tbody id="holdingsTableBody">
                        <!-- Holdings will be populated here -->
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="feature-grid">
            <div class="feature-card">
                <div class="feature-icon">🔍</div>
                <div class="feature-title">Advanced AI Extraction</div>
                <div class="feature-description">
                    Uses Azure Form Recognizer and Claude Vision to extract holdings with maximum accuracy
                </div>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">📊</div>
                <div class="feature-title">Comprehensive Analysis</div>
                <div class="feature-description">
                    Extracts 40+ holdings from complex financial documents with portfolio analysis
                </div>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">💾</div>
                <div class="feature-title">Export Ready</div>
                <div class="feature-description">
                    Download results in CSV format for database import and further analysis
                </div>
            </div>
        </div>
    </div>

    <script>
        let extractionResults = null;
        let currentFilename = null;
        
        // File upload handling
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const processing = document.getElementById('processing');
        const results = document.getElementById('results');
        const processingStatus = document.getElementById('processingStatus');
        
        // Drag and drop events
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
                handleFileUpload(files[0]);
            }
        });
        
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
        
        async function handleFileUpload(file) {
            if (file.type !== 'application/pdf') {
                alert('Please upload a PDF file');
                return;
            }
            
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                alert('File size must be less than 50MB');
                return;
            }
            
            currentFilename = file.name;
            
            // Show processing
            processing.style.display = 'block';
            results.style.display = 'none';
            processingStatus.textContent = 'Converting PDF to base64...';
            
            try {
                // Convert to base64
                const base64 = await fileToBase64(file);
                
                processingStatus.textContent = 'Sending to AI processing engine...';
                
                // Send directly to fixed processor (proven working version)
                const response = await fetch('/api/fixed-messos-processor', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        pdfBase64: base64,
                        filename: file.name
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    extractionResults = result;
                    displayResults(result);
                } else {
                    throw new Error(result.error || 'Processing failed');
                }
                
            } catch (error) {
                console.error('Upload error:', error);
                processing.style.display = 'none';
                alert('Processing failed: ' + error.message);
            }
        }
        
        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
            });
        }
        
        function displayResults(result) {
            processing.style.display = 'none';
            results.style.display = 'block';
            
            const { data, metadata } = result;
            
            // Update summary
            const summaryHtml = \`
                <div class="summary-card">
                    <div class="summary-value">\${data.holdings.length}</div>
                    <div class="summary-label">Holdings Found</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">\${data.portfolioInfo.totalValue?.toLocaleString() || 'N/A'}</div>
                    <div class="summary-label">Total Value (USD)</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">\${metadata.processingTime}</div>
                    <div class="summary-label">Processing Time</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">\${metadata.confidence}%</div>
                    <div class="summary-label">Confidence</div>
                </div>
            \`;
            
            document.getElementById('resultsSummary').innerHTML = summaryHtml;
            
            // Update holdings table
            const tbody = document.getElementById('holdingsTableBody');
            tbody.innerHTML = '';
            
            data.holdings.forEach(holding => {
                const row = document.createElement('tr');
                row.innerHTML = \`
                    <td>\${holding.position}</td>
                    <td>\${holding.securityName}</td>
                    <td>\${holding.isin}</td>
                    <td>\${holding.currentValue?.toLocaleString() || 'N/A'}</td>
                    <td>\${holding.currency}</td>
                    <td>\${holding.category}</td>
                    <td>\${holding.source || 'N/A'}</td>
                \`;
                tbody.appendChild(row);
            });
        }
        
        async function downloadCSV() {
            if (!extractionResults) {
                alert('No data to download');
                return;
            }
            
            try {
                const response = await fetch('/api/download-csv', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        holdings: extractionResults.data.holdings,
                        portfolioInfo: extractionResults.data.portfolioInfo,
                        filename: currentFilename
                    })
                });
                
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = response.headers.get('Content-Disposition')
                        ?.split('filename=')[1]
                        ?.replace(/"/g, '') || 'portfolio_holdings.csv';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } else {
                    throw new Error('Download failed');
                }
            } catch (error) {
                console.error('Download error:', error);
                alert('Download failed: ' + error.message);
            }
        }
        
        function downloadJSON() {
            if (!extractionResults) {
                alert('No data to download');
                return;
            }
            
            const dataStr = JSON.stringify(extractionResults, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`\${currentFilename || 'portfolio'}_extraction_results.json\`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    </script>
</body>
</html>
`;
}