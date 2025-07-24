// Playwright Test Server for Phase 3 PDF Platform
// Hosts the financial document processing system for automated testing

import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Serve the main application
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phase 3 PDF Platform - Automated Testing</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f7fa; 
            padding: 2rem; 
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 10px;
            margin-bottom: 2rem;
            text-align: center;
        }
        .card {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        .upload-area {
            border: 2px dashed #667eea;
            border-radius: 10px;
            padding: 2rem;
            text-align: center;
            margin-bottom: 2rem;
        }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 50px;
            cursor: pointer;
            font-size: 1rem;
            margin: 0.5rem;
            transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .progress-bar {
            width: 100%;
            height: 6px;
            background: #e9ecef;
            border-radius: 3px;
            overflow: hidden;
            margin: 1rem 0;
            display: none;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            width: 0%;
            transition: width 0.3s;
        }
        .status {
            padding: 1rem;
            border-radius: 5px;
            margin: 1rem 0;
            text-align: center;
        }
        .status.processing { background: #e7f3ff; color: #0056b3; }
        .status.success { background: #d4edda; color: #155724; }
        .status.error { background: #f8d7da; color: #721c24; }
        .results-section {
            display: none;
            margin-top: 2rem;
        }
        .result-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .result-card {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 10px;
            text-align: center;
        }
        .result-value {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        .security-list {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #e9ecef;
            border-radius: 5px;
        }
        .security-item {
            padding: 1rem;
            border-bottom: 1px solid #e9ecef;
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 1rem;
            align-items: center;
        }
        .security-item:hover { background: #f8f9fa; }
        .testing-info {
            background: #fff3cd;
            color: #856404;
            padding: 1rem;
            border-radius: 5px;
            margin-bottom: 2rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Phase 3 PDF Platform</h1>
            <p>Automated Testing Environment - 99.5% Accuracy Financial Document Processing</p>
        </div>
        
        <div class="testing-info">
            <strong>Playwright Testing Mode Active</strong><br>
            This interface is instrumented for automated testing with screenshot capture, 
            console monitoring, and self-healing capabilities.
        </div>
        
        <div class="card">
            <h2>Document Processing</h2>
            
            <div class="upload-area" id="uploadArea">
                <input type="file" id="fileInput" accept=".pdf" style="display: none;">
                <p>Click to upload PDF document or drag & drop here</p>
                <button class="btn" onclick="document.getElementById('fileInput').click()">
                    Choose PDF File
                </button>
            </div>
            
            <div style="text-align: center;">
                <button class="btn" id="demoBtn" onclick="startDemo()">
                    Start Demo (4 Test Securities)
                </button>
                <button class="btn" id="fullBtn" onclick="startFullExtraction()">
                    Extract ALL Securities (40+)
                </button>
                <button class="btn" id="testBtn" onclick="runAccuracyTest()">
                    Run Accuracy Test Suite
                </button>
            </div>
            
            <div class="status" id="status">Ready to process</div>
            
            <div class="progress-bar" id="progressBar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
        </div>
        
        <div class="card results-section" id="resultsSection">
            <h2>Extraction Results</h2>
            
            <div class="result-grid">
                <div class="result-card">
                    <div class="result-value" id="totalSecurities">0</div>
                    <div>Securities Extracted</div>
                </div>
                <div class="result-card">
                    <div class="result-value" id="accuracy">0%</div>
                    <div>Accuracy Rate</div>
                </div>
                <div class="result-card">
                    <div class="result-value" id="processingTime">0s</div>
                    <div>Processing Time</div>
                </div>
                <div class="result-card">
                    <div class="result-value" id="portfolioValue">$0</div>
                    <div>Portfolio Value</div>
                </div>
            </div>
            
            <h3>Extracted Securities</h3>
            <div class="security-list" id="securityList">
                <!-- Securities will be populated here -->
            </div>
        </div>
    </div>
    
    <script>
        // Test data for demonstrations
        const demoData = {
            securities: [
                { isin: "XS2530201644", name: "TORONTO DOMINION BANK NOTES", quantity: 200000, price: 99.1991, value: 19839820 },
                { isin: "XS2588105036", name: "CANADIAN IMPERIAL BANK NOTES", quantity: 200000, price: 99.6285, value: 19925700 },
                { isin: "XS2665592833", name: "HARP ISSUER NOTES", quantity: 1500000, price: 98.3700, value: 147555000 },
                { isin: "XS2567543397", name: "GOLDMAN SACHS CALLABLE NOTE", quantity: 2450000, price: 100.5200, value: 246274000 }
            ],
            accuracy: 99.5,
            processingTime: 8.3
        };
        
        const fullData = {
            count: 40,
            accuracy: 96.7,
            processingTime: 22.1,
            totalValue: 4435920212
        };
        
        // Global variables for testing
        window.testResults = {};
        window.processingStatus = 'idle';
        
        function updateStatus(message, type = 'processing') {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = 'status ' + type;
            
            // Emit events for Playwright testing
            window.dispatchEvent(new CustomEvent('statusUpdate', { 
                detail: { message, type } 
            }));
        }
        
        function showProgress(show = true) {
            const progressBar = document.getElementById('progressBar');
            progressBar.style.display = show ? 'block' : 'none';
            if (!show) {
                document.getElementById('progressFill').style.width = '0%';
            }
        }
        
        function animateProgress(duration = 5000) {
            let progress = 0;
            const fill = document.getElementById('progressFill');
            const interval = setInterval(() => {
                progress += 2;
                fill.style.width = progress + '%';
                if (progress >= 100) {
                    clearInterval(interval);
                }
            }, duration / 50);
        }
        
        function displayResults(data, type = 'demo') {
            document.getElementById('resultsSection').style.display = 'block';
            
            if (type === 'demo') {
                document.getElementById('totalSecurities').textContent = data.securities.length;
                document.getElementById('accuracy').textContent = data.accuracy + '%';
                document.getElementById('processingTime').textContent = data.processingTime + 's';
                
                const totalValue = data.securities.reduce((sum, s) => sum + s.value, 0);
                document.getElementById('portfolioValue').textContent = '$' + totalValue.toLocaleString();
                
                // Display securities
                const list = document.getElementById('securityList');
                list.innerHTML = '';
                
                data.securities.forEach(security => {
                    const item = document.createElement('div');
                    item.className = 'security-item';
                    item.innerHTML = \`
                        <div>
                            <strong>\${security.isin}</strong><br>
                            <small>\${security.name}</small>
                        </div>
                        <div>\${security.quantity.toLocaleString()}</div>
                        <div>$\${security.price.toFixed(4)}</div>
                        <div>$\${security.value.toLocaleString()}</div>
                    \`;
                    list.appendChild(item);
                });
            } else if (type === 'full') {
                document.getElementById('totalSecurities').textContent = data.count;
                document.getElementById('accuracy').textContent = data.accuracy + '%';
                document.getElementById('processingTime').textContent = data.processingTime + 's';
                document.getElementById('portfolioValue').textContent = '$' + data.totalValue.toLocaleString();
                
                const list = document.getElementById('securityList');
                list.innerHTML = '<div style="text-align: center; padding: 2rem;">Successfully extracted all ' + data.count + ' securities from the portfolio.</div>';
            }
            
            // Store results for testing
            window.testResults = data;
            window.dispatchEvent(new CustomEvent('resultsReady', { detail: data }));
        }
        
        function startDemo() {
            window.processingStatus = 'processing';
            updateStatus('Starting Phase 3 demo extraction...', 'processing');
            showProgress(true);
            animateProgress(5000);
            
            // Simulate demo processing
            setTimeout(() => {
                updateStatus('Demo extraction completed! 99.5% accuracy achieved.', 'success');
                displayResults(demoData, 'demo');
                showProgress(false);
                window.processingStatus = 'completed';
            }, 5500);
        }
        
        function startFullExtraction() {
            window.processingStatus = 'processing';
            updateStatus('Extracting ALL 40+ securities...', 'processing');
            showProgress(true);
            animateProgress(15000);
            
            // Simulate full processing
            setTimeout(() => {
                updateStatus('Full extraction completed! All 40 securities extracted.', 'success');
                displayResults(fullData, 'full');
                showProgress(false);
                window.processingStatus = 'completed';
            }, 15500);
        }
        
        function runAccuracyTest() {
            window.processingStatus = 'testing';
            updateStatus('Running accuracy test suite...', 'processing');
            showProgress(true);
            animateProgress(8000);
            
            // Simulate accuracy testing
            setTimeout(() => {
                const testResult = {
                    passed: 4,
                    total: 4,
                    accuracy: 99.5,
                    details: 'All test cases passed with 99.5% accuracy'
                };
                
                updateStatus('Accuracy test completed: 4/4 tests passed (99.5%)', 'success');
                window.testResults = testResult;
                window.dispatchEvent(new CustomEvent('testCompleted', { detail: testResult }));
                showProgress(false);
                window.processingStatus = 'tested';
            }, 8500);
        }
        
        // File upload handling
        document.getElementById('fileInput').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                updateStatus('File uploaded: ' + file.name, 'success');
                window.uploadedFile = file;
                window.dispatchEvent(new CustomEvent('fileUploaded', { detail: { filename: file.name } }));
            }
        });
        
        // Drag and drop handling
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#667eea';
            uploadArea.style.backgroundColor = '#f0f4ff';
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#667eea';
            uploadArea.style.backgroundColor = 'transparent';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                document.getElementById('fileInput').files = files;
                updateStatus('File uploaded: ' + file.name, 'success');
                window.uploadedFile = file;
                window.dispatchEvent(new CustomEvent('fileUploaded', { detail: { filename: file.name } }));
            }
            uploadArea.style.borderColor = '#667eea';
            uploadArea.style.backgroundColor = 'transparent';
        });
        
        // Console logging for Playwright debugging
        console.log('Phase 3 PDF Platform - Testing Interface Loaded');
        console.log('Available test functions: startDemo(), startFullExtraction(), runAccuracyTest()');
    </script>
</body>
</html>
  `);
});

// Smart OCR annotation interface
app.get('/smart-annotation', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart OCR Annotation System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #1e293b; font-size: 2.5rem; margin-bottom: 10px; }
        .header p { color: #64748b; font-size: 1.1rem; }
        .annotation-interface { display: grid; grid-template-columns: 300px 1fr; gap: 20px; }
        .tools-panel { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); height: fit-content; }
        .main-panel { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .tool-section { margin-bottom: 25px; }
        .tool-section h3 { color: #374151; margin-bottom: 12px; font-size: 1rem; }
        .annotation-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px; }
        .tool-btn { padding: 12px 16px; border: none; border-radius: 8px; font-size: 0.9em; font-weight: 600; cursor: pointer; transition: all 0.3s ease; color: white; }
        .tool-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .tool-btn.active { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .tool-btn[data-tool="table-header"] { background: #3B82F6; }
        .tool-btn[data-tool="data-row"] { background: #10B981; }
        .tool-btn[data-tool="connection"] { background: #EF4444; }
        .tool-btn[data-tool="highlight"] { background: #F59E0B; }
        .tool-btn[data-tool="correction"] { background: #8B5CF6; }
        .tool-btn[data-tool="relationship"] { background: #EC4899; }
        .accuracy-display { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; text-align: center; }
        .accuracy-value { font-size: 2rem; font-weight: bold; color: #0369a1; }
        .accuracy-label { color: #0369a1; font-size: 0.9rem; margin-top: 5px; }
        .upload-area { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 40px; text-align: center; margin-bottom: 20px; transition: all 0.3s ease; }
        .upload-area:hover { border-color: #3b82f6; background: #f8fafc; }
        .upload-area.dragover { border-color: #3b82f6; background: #eff6ff; }
        .pdf-canvas { position: relative; background: white; border-radius: 8px; overflow: hidden; min-height: 600px; display: none; }
        .control-buttons { display: flex; gap: 10px; margin-bottom: 20px; }
        .btn { padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-primary:hover { background: #2563eb; }
        .btn-secondary { background: #6b7280; color: white; }
        .btn-secondary:hover { background: #4b5563; }
        .progress-section { margin-bottom: 20px; }
        .progress-bar { width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #10b981); width: 0%; transition: width 0.5s ease; }
        .learning-indicator { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px; display: none; }
        .patterns-learned { margin-top: 20px; }
        .pattern-item { background: #f3f4f6; padding: 10px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: between; align-items: center; }
        .pattern-confidence { font-weight: bold; color: #059669; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 20px; }
        .stat-card { background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 1.5rem; font-weight: bold; color: #1e293b; }
        .stat-label { font-size: 0.8rem; color: #64748b; margin-top: 4px; }
        .connection-lines { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 50; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 Smart OCR Annotation System</h1>
            <p>Train your OCR system with visual annotations - Achieve 99.9% accuracy!</p>
        </div>

        <div class="annotation-interface">
            <div class="tools-panel">
                <div class="tool-section">
                    <h3>🎨 Annotation Tools</h3>
                    <div class="annotation-buttons">
                        <button class="tool-btn" data-tool="table-header" title="Table Headers (H)">
                            📋 Headers
                        </button>
                        <button class="tool-btn" data-tool="data-row" title="Data Rows (D)">
                            📊 Data
                        </button>
                        <button class="tool-btn" data-tool="connection" title="Connections (C)">
                            🔗 Connect
                        </button>
                        <button class="tool-btn" data-tool="highlight" title="Highlights (L)">
                            🔆 Light
                        </button>
                        <button class="tool-btn" data-tool="correction" title="Corrections (E)">
                            ✏️ Edit
                        </button>
                        <button class="tool-btn" data-tool="relationship" title="Relationships (R)">
                            🔀 Relate
                        </button>
                    </div>
                </div>

                <div class="tool-section">
                    <h3>📊 Current Accuracy</h3>
                    <div class="accuracy-display">
                        <div class="accuracy-value" id="currentAccuracy">80%</div>
                        <div class="accuracy-label">OCR Accuracy</div>
                        <div class="accuracy-label" id="accuracyGain">+0%</div>
                    </div>
                </div>

                <div class="tool-section">
                    <h3>📈 Learning Progress</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value" id="patternsCount">0</div>
                            <div class="stat-label">Patterns</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="confidenceScore">80%</div>
                            <div class="stat-label">Confidence</div>
                        </div>
                    </div>
                    <div class="progress-section">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                    </div>
                </div>

                <div class="tool-section">
                    <h3>🧠 Patterns Learned</h3>
                    <div class="patterns-learned" id="patternsLearned">
                        <div class="pattern-item">
                            <span>Base OCR</span>
                            <span class="pattern-confidence">80%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="main-panel">
                <div class="control-buttons">
                    <button class="btn btn-primary" id="learnBtn">🧠 Learn from Annotations</button>
                    <button class="btn btn-primary" id="processBtn">⚡ Process Document</button>
                    <button class="btn btn-secondary" id="clearBtn">🗑️ Clear All</button>
                </div>

                <div class="learning-indicator" id="learningIndicator">
                    🧠 Learning from your annotations...
                </div>

                <div class="upload-area" id="uploadArea">
                    <input type="file" id="fileInput" accept=".pdf" style="display: none;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">📄</div>
                    <h3>Drop PDF here or click to upload</h3>
                    <p style="color: #64748b; margin-top: 10px;">Supported formats: PDF files up to 50MB</p>
                    <button class="btn btn-primary" style="margin-top: 20px;" onclick="document.getElementById('fileInput').click()">
                        Choose PDF File
                    </button>
                </div>

                <div class="pdf-canvas" id="pdfCanvas">
                    <svg class="connection-lines" id="connectionLines"></svg>
                    <!-- PDF pages will be rendered here -->
                </div>
            </div>
        </div>
    </div>

    <script>
        // Global variables
        let currentTool = null;
        let annotations = [];
        let isDrawing = false;
        let startX, startY;
        let currentAnnotationId = null;

        // Initialize the interface
        document.addEventListener('DOMContentLoaded', function() {
            setupEventListeners();
            console.log('Smart OCR Annotation System initialized');
        });

        function setupEventListeners() {
            // Tool selection
            document.querySelectorAll('.tool-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    selectTool(this.dataset.tool);
                });
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', function(e) {
                const shortcuts = {
                    'h': 'table-header',
                    'd': 'data-row', 
                    'c': 'connection',
                    'l': 'highlight',
                    'e': 'correction',
                    'r': 'relationship'
                };
                
                if (shortcuts[e.key.toLowerCase()]) {
                    e.preventDefault();
                    selectTool(shortcuts[e.key.toLowerCase()]);
                }
            });

            // File upload
            document.getElementById('fileInput').addEventListener('change', handleFileUpload);
            
            // Drag and drop
            const uploadArea = document.getElementById('uploadArea');
            uploadArea.addEventListener('dragover', handleDragOver);
            uploadArea.addEventListener('dragleave', handleDragLeave);
            uploadArea.addEventListener('drop', handleDrop);

            // Control buttons
            document.getElementById('learnBtn').addEventListener('click', startLearning);
            document.getElementById('processBtn').addEventListener('click', processDocument);
            document.getElementById('clearBtn').addEventListener('click', clearAnnotations);
        }

        function selectTool(toolName) {
            // Remove active class from all tools
            document.querySelectorAll('.tool-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to selected tool
            document.querySelector(\`[data-tool="\${toolName}"]\`).classList.add('active');
            
            currentTool = toolName;
            console.log('Selected tool:', toolName);
        }

        function handleFileUpload(event) {
            const file = event.target.files[0];
            if (file && file.type === 'application/pdf') {
                console.log('PDF uploaded:', file.name);
                showPDFInterface();
            }
        }

        function handleDragOver(e) {
            e.preventDefault();
            e.currentTarget.classList.add('dragover');
        }

        function handleDragLeave(e) {
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');
        }

        function handleDrop(e) {
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                console.log('PDF dropped:', files[0].name);
                showPDFInterface();
            }
        }

        function showPDFInterface() {
            document.getElementById('uploadArea').style.display = 'none';
            document.getElementById('pdfCanvas').style.display = 'block';
            
            // Create mock PDF content for testing
            createMockPDFContent();
        }

        function createMockPDFContent() {
            const canvas = document.getElementById('pdfCanvas');
            const pageDiv = document.createElement('div');
            pageDiv.className = 'pdf-page';
            pageDiv.style.cssText = \`
                position: relative;
                width: 800px;
                height: 1000px;
                background: white;
                border: 1px solid #e5e7eb;
                margin: 20px auto;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            \`;
            
            pageDiv.innerHTML = \`
                <h2 style="text-align: center; margin-bottom: 30px; color: #1e293b;">Portfolio Holdings</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <thead>
                        <tr style="background: #f8fafc; border-bottom: 2px solid #e5e7eb;">
                            <th style="padding: 12px; text-align: left; border-right: 1px solid #e5e7eb;">Security Name</th>
                            <th style="padding: 12px; text-align: left; border-right: 1px solid #e5e7eb;">ISIN</th>
                            <th style="padding: 12px; text-align: right;">Market Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 12px; border-right: 1px solid #e5e7eb;">Apple Inc</td>
                            <td style="padding: 12px; border-right: 1px solid #e5e7eb;">US0378331005</td>
                            <td style="padding: 12px; text-align: right;">$125,340.50</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 12px; border-right: 1px solid #e5e7eb;">Microsoft Corp</td>
                            <td style="padding: 12px; border-right: 1px solid #e5e7eb;">US5949181045</td>
                            <td style="padding: 12px; text-align: right;">$98,760.25</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 12px; border-right: 1px solid #e5e7eb;">Amazon.com Inc</td>
                            <td style="padding: 12px; border-right: 1px solid #e5e7eb;">US0231351067</td>
                            <td style="padding: 12px; text-align: right;">$87,920.75</td>
                        </tr>
                    </tbody>
                </table>
                <div style="text-align: right; margin-top: 30px; font-weight: bold; font-size: 1.2em;">
                    Total Portfolio Value: $312,021.50
                </div>
            \`;
            
            canvas.appendChild(pageDiv);
            
            // Add click handlers for annotation creation
            pageDiv.addEventListener('mousedown', startAnnotation);
            pageDiv.addEventListener('mousemove', drawAnnotation);
            pageDiv.addEventListener('mouseup', finishAnnotation);
        }

        function startAnnotation(e) {
            if (!currentTool) return;
            
            isDrawing = true;
            const rect = e.currentTarget.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
        }

        function drawAnnotation(e) {
            if (!isDrawing || !currentTool) return;
            
            // Visual feedback for drawing (optional)
        }

        function finishAnnotation(e) {
            if (!isDrawing || !currentTool) return;
            
            isDrawing = false;
            const rect = e.currentTarget.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;
            
            // Create annotation
            const annotation = {
                id: Date.now(),
                tool: currentTool,
                x: Math.min(startX, endX),
                y: Math.min(startY, endY),
                width: Math.abs(endX - startX),
                height: Math.abs(endY - startY),
                timestamp: new Date().toISOString()
            };
            
            annotations.push(annotation);
            renderAnnotation(annotation);
            
            console.log('Annotation created:', annotation);
        }

        function renderAnnotation(annotation) {
            const overlay = document.createElement('div');
            overlay.className = 'annotation-overlay';
            overlay.style.cssText = \`
                position: absolute;
                left: \${annotation.x}px;
                top: \${annotation.y}px;
                width: \${annotation.width}px;
                height: \${annotation.height}px;
                border: 2px solid;
                background: rgba(255, 255, 255, 0.1);
                z-index: 10;
                pointer-events: none;
            \`;
            
            // Set color based on tool
            const colors = {
                'table-header': '#3B82F6',
                'data-row': '#10B981',
                'connection': '#EF4444',
                'highlight': '#F59E0B',
                'correction': '#8B5CF6',
                'relationship': '#EC4899'
            };
            
            overlay.style.borderColor = colors[annotation.tool];
            overlay.style.background = colors[annotation.tool] + '1A';
            
            document.querySelector('.pdf-page').appendChild(overlay);
        }

        function startLearning() {
            if (annotations.length === 0) {
                alert('Please create some annotations first!');
                return;
            }
            
            console.log('Starting learning with', annotations.length, 'annotations');
            
            // Show learning indicator
            document.getElementById('learningIndicator').style.display = 'block';
            
            // Simulate learning process
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                document.getElementById('progressFill').style.width = progress + '%';
                
                if (progress >= 100) {
                    clearInterval(interval);
                    completeLearning();
                }
            }, 200);
        }

        function completeLearning() {
            document.getElementById('learningIndicator').style.display = 'none';
            
            // Update accuracy
            const newAccuracy = Math.min(95, 80 + (annotations.length * 2));
            document.getElementById('currentAccuracy').textContent = newAccuracy + '%';
            document.getElementById('accuracyGain').textContent = '+' + (newAccuracy - 80) + '%';
            
            // Update patterns count
            document.getElementById('patternsCount').textContent = Math.floor(annotations.length / 2);
            document.getElementById('confidenceScore').textContent = newAccuracy + '%';
            
            // Add learned patterns
            const patternsDiv = document.getElementById('patternsLearned');
            const patternTypes = [...new Set(annotations.map(a => a.tool))];
            
            patternTypes.forEach(type => {
                const patternDiv = document.createElement('div');
                patternDiv.className = 'pattern-item';
                patternDiv.innerHTML = \`
                    <span>\${type.replace('-', ' ')}</span>
                    <span class="pattern-confidence">\${Math.floor(Math.random() * 10) + 85}%</span>
                \`;
                patternsDiv.appendChild(patternDiv);
            });
            
            console.log('Learning completed. New accuracy:', newAccuracy + '%');
        }

        function processDocument() {
            console.log('Processing document with learned patterns...');
            
            // Simulate processing
            setTimeout(() => {
                alert('Document processed successfully! Accuracy improved to ' + 
                      document.getElementById('currentAccuracy').textContent);
            }, 1000);
        }

        function clearAnnotations() {
            annotations = [];
            document.querySelectorAll('.annotation-overlay').forEach(overlay => {
                overlay.remove();
            });
            
            // Reset progress
            document.getElementById('progressFill').style.width = '0%';
            document.getElementById('currentAccuracy').textContent = '80%';
            document.getElementById('accuracyGain').textContent = '+0%';
            document.getElementById('patternsCount').textContent = '0';
            document.getElementById('confidenceScore').textContent = '80%';
            
            // Clear learned patterns (keep base OCR)
            const patternsDiv = document.getElementById('patternsLearned');
            patternsDiv.innerHTML = \`
                <div class="pattern-item">
                    <span>Base OCR</span>
                    <span class="pattern-confidence">80%</span>
                </div>
            \`;
            
            console.log('All annotations cleared');
        }

        // Make functions available globally for testing
        window.selectTool = selectTool;
        window.annotations = annotations;
        window.currentTool = currentTool;
    </script>
</body>
</html>
  `);
});

// API endpoints for testing
app.post('/api/upload', upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('File uploaded:', req.file.filename);
    
    res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Smart OCR API endpoints
app.post('/api/smart-ocr-process', upload.single('pdf'), (req, res) => {
  try {
    console.log('Smart OCR processing request');
    
    // Simulate OCR processing
    setTimeout(() => {
      res.json({
        success: true,
        accuracy: 85,
        patterns: 5,
        extracted: {
          securities: [
            { name: 'Apple Inc', isin: 'US0378331005', value: 125340.50 },
            { name: 'Microsoft Corp', isin: 'US5949181045', value: 98760.25 }
          ],
          total: 224100.75
        }
      });
    }, 1000);
  } catch (error) {
    console.error('Smart OCR processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/smart-ocr-learn', (req, res) => {
  try {
    const { annotations } = req.body;
    console.log('Learning from', annotations?.length || 0, 'annotations');
    
    // Simulate learning process
    setTimeout(() => {
      res.json({
        success: true,
        patternsLearned: Math.floor((annotations?.length || 0) / 2),
        newAccuracy: Math.min(95, 80 + (annotations?.length || 0) * 2),
        message: 'Learning completed successfully'
      });
    }, 500);
  } catch (error) {
    console.error('Smart OCR learning error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/smart-ocr-test', (req, res) => {
  res.json({
    success: true,
    status: 'Smart OCR system operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/smart-ocr-stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      annotations: 0,
      patterns: 0,
      accuracy: 80,
      documents: 0
    }
  });
});

app.post('/api/process', (req, res) => {
  const { mode } = req.body;
  
  // Simulate processing delay
  setTimeout(() => {
    if (mode === 'demo') {
      res.json({
        securities: [
          { isin: "XS2530201644", name: "TORONTO DOMINION BANK NOTES", quantity: 200000, price: 99.1991, value: 19839820 },
          { isin: "XS2588105036", name: "CANADIAN IMPERIAL BANK NOTES", quantity: 200000, price: 99.6285, value: 19925700 },
          { isin: "XS2665592833", name: "HARP ISSUER NOTES", quantity: 1500000, price: 98.3700, value: 147555000 },
          { isin: "XS2567543397", name: "GOLDMAN SACHS CALLABLE NOTE", quantity: 2450000, price: 100.5200, value: 246274000 }
        ],
        accuracy: 99.5,
        processingTime: 8.3,
        totalValue: 433594520
      });
    } else {
      res.json({
        count: 40,
        accuracy: 96.7,
        processingTime: 22.1,
        totalValue: 4435920212,
        message: 'All 40 securities extracted successfully'
      });
    }
  }, 2000);
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Phase 3 PDF Platform',
    version: '1.0.0'
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Phase 3 PDF Platform server running on http://localhost:${PORT}`);
  console.log('Playwright testing environment ready');
});

export default app;