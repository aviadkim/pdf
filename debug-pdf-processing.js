#!/usr/bin/env node

/**
 * DEBUG PDF PROCESSING
 * 
 * Real-time debugging tool to trace PDF processing step by step
 * Helps identify where the "ocrResults.forEach is not a function" error occurs
 */

const express = require('express');
const multer = require('multer');
const WebSocket = require('ws');

class PDFProcessingDebugger {
    constructor() {
        this.app = express();
        this.setupWebSocket();
        this.setupRoutes();
        this.setupMiddleware();
        this.debugLogs = [];
    }

    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: 8081 });
        
        this.wss.on('connection', (ws) => {
            console.log('🔍 Debug client connected');
            
            // Send existing logs to new client
            this.debugLogs.forEach(log => {
                this.sendDebugMessage(ws, log);
            });
            
            ws.on('close', () => {
                console.log('🔍 Debug client disconnected');
            });
        });
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // File upload configuration
        const storage = multer.memoryStorage();
        this.upload = multer({ 
            storage: storage,
            limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
        });
    }

    setupRoutes() {
        // Debug dashboard
        this.app.get('/debug', (req, res) => {
            res.send(this.generateDebugDashboard());
        });

        // Debug PDF processing endpoint
        this.app.post('/debug-pdf-process', this.upload.single('pdf'), async (req, res) => {
            try {
                this.log('🔍 DEBUG: PDF upload received');
                this.log(`📄 File info: ${req.file ? req.file.originalname : 'No file'}, Size: ${req.file ? req.file.size : 0} bytes`);
                
                if (!req.file) {
                    this.log('❌ ERROR: No file uploaded');
                    return res.status(400).json({
                        success: false,
                        error: 'No file uploaded',
                        debugInfo: 'File upload failed - no file received'
                    });
                }

                // Step-by-step debugging
                const result = await this.debugPDFProcessing(req.file);
                
                res.json({
                    success: true,
                    result: result,
                    debugLogs: this.debugLogs.slice(-20) // Last 20 logs
                });

            } catch (error) {
                this.log(`❌ CRITICAL ERROR: ${error.message}`);
                this.log(`📍 Stack trace: ${error.stack}`);
                
                res.status(500).json({
                    success: false,
                    error: error.message,
                    debugInfo: error.stack,
                    debugLogs: this.debugLogs.slice(-20)
                });
            }
        });

        // Get debug logs
        this.app.get('/debug-logs', (req, res) => {
            res.json({
                success: true,
                logs: this.debugLogs,
                timestamp: new Date().toISOString()
            });
        });

        // Clear debug logs
        this.app.post('/debug-clear', (req, res) => {
            this.debugLogs = [];
            this.broadcast('LOGS_CLEARED', { message: 'Debug logs cleared' });
            res.json({ success: true });
        });
    }

    async debugPDFProcessing(file) {
        this.log('🚀 Starting PDF processing debug...');
        
        try {
            // Step 1: Import the SmartOCRSystem
            this.log('📦 Step 1: Importing SmartOCRSystem...');
            const SmartOCRLearningSystem = require('./smart-ocr-learning-system');
            this.log('✅ SmartOCRSystem imported successfully');

            // Step 2: Initialize the system
            this.log('🔧 Step 2: Initializing SmartOCRSystem...');
            const ocrSystem = new SmartOCRLearningSystem();
            this.log('✅ SmartOCRSystem initialized');

            // Step 3: Check file buffer
            this.log('📄 Step 3: Checking file buffer...');
            this.log(`Buffer length: ${file.buffer.length} bytes`);
            this.log(`Buffer type: ${typeof file.buffer}`);
            this.log(`Is Buffer: ${Buffer.isBuffer(file.buffer)}`);

            // Step 4: Call processPDF with detailed logging
            this.log('⚙️ Step 4: Calling processPDF method...');
            
            // Wrap the processPDF method to add debugging
            const originalProcessPDF = ocrSystem.processPDF.bind(ocrSystem);
            ocrSystem.processPDF = async (buffer) => {
                this.log('🔍 Inside processPDF method');
                this.log(`Received buffer: ${buffer ? buffer.length : 'null'} bytes`);
                
                try {
                    const result = await originalProcessPDF(buffer);
                    this.log('✅ processPDF completed successfully');
                    this.log(`Result type: ${typeof result}`);
                    this.log(`Result keys: ${result ? Object.keys(result) : 'null'}`);
                    return result;
                } catch (error) {
                    this.log(`❌ processPDF failed: ${error.message}`);
                    this.log(`Error stack: ${error.stack}`);
                    throw error;
                }
            };

            // Step 5: Process the PDF
            this.log('📊 Step 5: Processing PDF...');
            const result = await ocrSystem.processPDF(file.buffer);
            
            this.log('🎉 PDF processing completed successfully!');
            this.log(`Final result: ${JSON.stringify(result, null, 2)}`);
            
            return result;

        } catch (error) {
            this.log(`💥 Processing failed at: ${error.message}`);
            
            // Additional debugging for the specific forEach error
            if (error.message.includes('forEach is not a function')) {
                this.log('🔍 FOREACH ERROR DETECTED - Analyzing...');
                this.log('This error occurs when trying to call forEach on something that is not an array');
                this.log('Likely causes:');
                this.log('1. ocrResults is null or undefined');
                this.log('2. ocrResults is a string instead of an array');
                this.log('3. ocrResults is an object instead of an array');
                this.log('4. Mistral API returned unexpected format');
            }
            
            throw error;
        }
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp: timestamp,
            message: message,
            id: Date.now() + Math.random()
        };
        
        this.debugLogs.push(logEntry);
        console.log(`[${timestamp}] ${message}`);
        
        // Broadcast to connected clients
        this.broadcast('DEBUG_LOG', logEntry);
        
        // Keep only last 1000 logs
        if (this.debugLogs.length > 1000) {
            this.debugLogs = this.debugLogs.slice(-1000);
        }
    }

    broadcast(type, data) {
        const message = JSON.stringify({
            type: type,
            data: data,
            timestamp: new Date().toISOString()
        });

        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    sendDebugMessage(client, logEntry) {
        if (client.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: 'DEBUG_LOG',
                data: logEntry,
                timestamp: new Date().toISOString()
            });
            client.send(message);
        }
    }

    generateDebugDashboard() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>PDF Processing Debugger</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Courier New', monospace;
            background: #1a1a1a;
            color: #00ff00;
            padding: 20px;
        }
        
        .header {
            background: #333;
            color: #00ff00;
            padding: 20px;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 20px;
            border: 2px solid #00ff00;
        }
        
        .upload-section {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            border: 1px solid #555;
        }
        
        .upload-area {
            border: 2px dashed #00ff00;
            padding: 40px;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 20px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .upload-area:hover {
            background: #333;
        }
        
        .upload-area.dragover {
            background: #004400;
            border-color: #00aa00;
        }
        
        input[type="file"] {
            display: none;
        }
        
        .btn {
            background: #00aa00;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            margin: 5px;
        }
        
        .btn:hover {
            background: #00cc00;
        }
        
        .btn:disabled {
            background: #666;
            cursor: not-allowed;
        }
        
        .logs-section {
            background: #2a2a2a;
            border-radius: 10px;
            border: 1px solid #555;
            height: 500px;
            display: flex;
            flex-direction: column;
        }
        
        .logs-header {
            background: #333;
            padding: 15px;
            border-bottom: 1px solid #555;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logs-content {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            font-size: 12px;
            line-height: 1.4;
        }
        
        .log-entry {
            margin: 5px 0;
            padding: 5px;
            border-left: 3px solid #00ff00;
            padding-left: 10px;
        }
        
        .log-entry.error {
            border-left-color: #ff0000;
            color: #ff6666;
        }
        
        .log-entry.success {
            border-left-color: #00aa00;
            color: #66ff66;
        }
        
        .log-entry.info {
            border-left-color: #0088ff;
            color: #6666ff;
        }
        
        .log-timestamp {
            color: #888;
            font-size: 10px;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-connected { background: #00ff00; }
        .status-disconnected { background: #ff0000; }
        
        .result-section {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            border: 1px solid #555;
            display: none;
        }
        
        .result-content {
            background: #1a1a1a;
            padding: 15px;
            border-radius: 5px;
            white-space: pre-wrap;
            font-size: 12px;
            max-height: 300px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 PDF Processing Debugger</h1>
        <p>Real-time debugging for Smart OCR PDF processing</p>
        <p><span class="status-indicator status-disconnected" id="connection-status"></span>WebSocket: <span id="connection-text">Connecting...</span></p>
    </div>
    
    <div class="upload-section">
        <h2>📄 Upload PDF for Debug Processing</h2>
        <div class="upload-area" id="upload-area">
            <p>Click here or drag & drop a PDF file</p>
            <p style="font-size: 12px; color: #888; margin-top: 10px;">Max file size: 10MB</p>
        </div>
        <input type="file" id="file-input" accept=".pdf">
        <div>
            <button class="btn" id="process-btn" disabled>🚀 Debug Process PDF</button>
            <button class="btn" id="clear-logs-btn">🧹 Clear Logs</button>
        </div>
        <div id="file-info" style="margin-top: 10px; color: #888;"></div>
    </div>
    
    <div class="logs-section">
        <div class="logs-header">
            <h3>📋 Real-time Debug Logs</h3>
            <div>
                <span id="log-count">0 logs</span>
                <button class="btn" id="auto-scroll-btn">📜 Auto-scroll: ON</button>
            </div>
        </div>
        <div class="logs-content" id="logs-content">
            <div class="log-entry info">
                <div class="log-timestamp">System initialized</div>
                <div>🔍 PDF Processing Debugger ready</div>
            </div>
        </div>
    </div>
    
    <div class="result-section" id="result-section">
        <h3>📊 Processing Result</h3>
        <div class="result-content" id="result-content"></div>
    </div>
    
    <script>
        class PDFDebugger {
            constructor() {
                this.ws = null;
                this.autoScroll = true;
                this.logCount = 0;
                this.selectedFile = null;
                
                this.setupWebSocket();
                this.setupEventListeners();
            }
            
            setupWebSocket() {
                try {
                    this.ws = new WebSocket('ws://localhost:8081');
                    
                    this.ws.onopen = () => {
                        this.updateConnectionStatus(true);
                        this.addLog('✅ Connected to debug server', 'success');
                    };
                    
                    this.ws.onmessage = (event) => {
                        const data = JSON.parse(event.data);
                        this.handleWebSocketMessage(data);
                    };
                    
                    this.ws.onclose = () => {
                        this.updateConnectionStatus(false);
                        this.addLog('❌ Disconnected from debug server', 'error');
                        setTimeout(() => this.setupWebSocket(), 5000);
                    };
                    
                    this.ws.onerror = (error) => {
                        this.addLog('🔌 WebSocket error: ' + error, 'error');
                    };
                    
                } catch (error) {
                    this.addLog('❌ Failed to connect to debug server', 'error');
                }
            }
            
            setupEventListeners() {
                const uploadArea = document.getElementById('upload-area');
                const fileInput = document.getElementById('file-input');
                const processBtn = document.getElementById('process-btn');
                const clearLogsBtn = document.getElementById('clear-logs-btn');
                const autoScrollBtn = document.getElementById('auto-scroll-btn');
                
                // File upload
                uploadArea.addEventListener('click', () => fileInput.click());
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
                    if (files.length > 0) {
                        this.handleFileSelect(files[0]);
                    }
                });
                
                fileInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) {
                        this.handleFileSelect(e.target.files[0]);
                    }
                });
                
                processBtn.addEventListener('click', () => this.processPDF());
                clearLogsBtn.addEventListener('click', () => this.clearLogs());
                autoScrollBtn.addEventListener('click', () => this.toggleAutoScroll());
            }
            
            handleFileSelect(file) {
                this.selectedFile = file;
                document.getElementById('file-info').textContent = 
                    \`Selected: \${file.name} (\${(file.size / 1024 / 1024).toFixed(2)} MB)\`;
                document.getElementById('process-btn').disabled = false;
                this.addLog(\`📄 File selected: \${file.name}\`, 'info');
            }
            
            async processPDF() {
                if (!this.selectedFile) return;
                
                const processBtn = document.getElementById('process-btn');
                processBtn.disabled = true;
                processBtn.textContent = '⏳ Processing...';
                
                try {
                    const formData = new FormData();
                    formData.append('pdf', this.selectedFile);
                    
                    this.addLog('🚀 Starting PDF debug processing...', 'info');
                    
                    const response = await fetch('/debug-pdf-process', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        this.addLog('🎉 Processing completed successfully!', 'success');
                        this.showResult(result.result);
                    } else {
                        this.addLog(\`❌ Processing failed: \${result.error}\`, 'error');
                        if (result.debugInfo) {
                            this.addLog(\`🔍 Debug info: \${result.debugInfo}\`, 'error');
                        }
                    }
                    
                } catch (error) {
                    this.addLog(\`💥 Request failed: \${error.message}\`, 'error');
                } finally {
                    processBtn.disabled = false;
                    processBtn.textContent = '🚀 Debug Process PDF';
                }
            }
            
            handleWebSocketMessage(data) {
                switch (data.type) {
                    case 'DEBUG_LOG':
                        this.addLog(data.data.message, this.getLogType(data.data.message));
                        break;
                    case 'LOGS_CLEARED':
                        this.clearLogsDisplay();
                        break;
                }
            }
            
            addLog(message, type = 'info') {
                const logsContent = document.getElementById('logs-content');
                const logEntry = document.createElement('div');
                logEntry.className = \`log-entry \${type}\`;
                
                const timestamp = new Date().toLocaleTimeString();
                logEntry.innerHTML = \`
                    <div class="log-timestamp">\${timestamp}</div>
                    <div>\${message}</div>
                \`;
                
                logsContent.appendChild(logEntry);
                this.logCount++;
                document.getElementById('log-count').textContent = \`\${this.logCount} logs\`;
                
                if (this.autoScroll) {
                    logsContent.scrollTop = logsContent.scrollHeight;
                }
            }
            
            getLogType(message) {
                if (message.includes('❌') || message.includes('ERROR') || message.includes('failed')) {
                    return 'error';
                } else if (message.includes('✅') || message.includes('SUCCESS') || message.includes('completed')) {
                    return 'success';
                } else {
                    return 'info';
                }
            }
            
            updateConnectionStatus(connected) {
                const indicator = document.getElementById('connection-status');
                const text = document.getElementById('connection-text');
                
                if (connected) {
                    indicator.className = 'status-indicator status-connected';
                    text.textContent = 'Connected';
                } else {
                    indicator.className = 'status-indicator status-disconnected';
                    text.textContent = 'Disconnected';
                }
            }
            
            clearLogs() {
                fetch('/debug-clear', { method: 'POST' });
            }
            
            clearLogsDisplay() {
                document.getElementById('logs-content').innerHTML = '';
                this.logCount = 0;
                document.getElementById('log-count').textContent = '0 logs';
            }
            
            toggleAutoScroll() {
                this.autoScroll = !this.autoScroll;
                const btn = document.getElementById('auto-scroll-btn');
                btn.textContent = \`📜 Auto-scroll: \${this.autoScroll ? 'ON' : 'OFF'}\`;
            }
            
            showResult(result) {
                const resultSection = document.getElementById('result-section');
                const resultContent = document.getElementById('result-content');
                
                resultContent.textContent = JSON.stringify(result, null, 2);
                resultSection.style.display = 'block';
            }
        }
        
        // Initialize debugger when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new PDFDebugger();
        });
    </script>
</body>
</html>
        `;
    }

    start(port = 3003) {
        this.app.listen(port, () => {
            console.log(`🔍 PDF Processing Debugger running on port ${port}`);
            console.log(`🌐 Debug dashboard: http://localhost:${port}/debug`);
            console.log(`🔌 WebSocket server: ws://localhost:8081`);
            console.log('');
            console.log('📋 Instructions:');
            console.log('1. Open http://localhost:3003/debug in your browser');
            console.log('2. Upload the same PDF that caused the error');
            console.log('3. Watch the real-time logs to see exactly where it fails');
            console.log('');
        });
    }
}

// Start debugger if run directly
if (require.main === module) {
    const pdfDebugger = new PDFProcessingDebugger();
    pdfDebugger.start();
}

module.exports = { PDFProcessingDebugger };
