/**
 * WEB ANNOTATION INTERFACE
 * 
 * Interactive web interface for clients to correct extraction errors
 * and contribute to global learning system
 */

const express = require('express');
const multer = require('multer');
const { SmartLearningCostReductionSystem } = require('./smart-learning-cost-reduction-system');

class WebAnnotationInterface {
    constructor() {
        this.app = express();
        this.smartSystem = new SmartLearningCostReductionSystem();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // File upload configuration
        const upload = multer({ dest: 'uploads/' });
        this.upload = upload;
    }

    setupRoutes() {
        // Main processing endpoint
        this.app.post('/api/process-document', this.upload.single('pdf'), async (req, res) => {
            try {
                const clientId = req.body.clientId || 'anonymous';
                const filePath = req.file.path;
                
                console.log(`📄 Processing document for client: ${clientId}`);
                
                const result = await this.smartSystem.processFinancialDocument(filePath, clientId);
                
                res.json({
                    success: result.success,
                    data: result.financialData,
                    method: result.method,
                    costIncurred: result.costIncurred,
                    processingTime: result.processingTime,
                    learningOpportunity: result.learningOpportunity,
                    documentId: `doc_${Date.now()}`
                });
                
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Annotation submission endpoint
        this.app.post('/api/submit-annotation', async (req, res) => {
            try {
                const { clientId, annotation } = req.body;
                
                console.log(`📝 Annotation received from client: ${clientId}`);
                
                const result = await this.smartSystem.processClientAnnotation(clientId, annotation);
                
                res.json(result);
                
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Cost analytics endpoint
        this.app.get('/api/cost-analytics', async (req, res) => {
            try {
                const analytics = await this.smartSystem.getCostAnalytics();
                res.json(analytics);
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Main interface page
        this.app.get('/', (req, res) => {
            res.send(this.generateMainInterface());
        });

        // Annotation interface page
        this.app.get('/annotate/:documentId', (req, res) => {
            res.send(this.generateAnnotationInterface(req.params.documentId));
        });
    }

    generateMainInterface() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Financial Document Processor</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .cost-display { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745; }
        .upload-area { border: 2px dashed #ccc; padding: 40px; text-align: center; border-radius: 10px; margin-bottom: 20px; }
        .upload-area.dragover { border-color: #007bff; background: #f8f9ff; }
        .results { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-top: 20px; }
        .security-item { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; }
        .error-field { background: #ffe6e6; border: 1px solid #ff9999; }
        .correct-field { background: #e6ffe6; border: 1px solid #99ff99; }
        .annotation-btn { background: #ffc107; color: #000; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-left: 10px; }
        .annotation-btn:hover { background: #e0a800; }
        .cost-savings { color: #28a745; font-weight: bold; }
        .cost-incurred { color: #dc3545; font-weight: bold; }
        .learning-badge { background: #17a2b8; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Smart Financial Document Processor</h1>
        <p>Upload financial documents and get intelligent extraction with cost optimization</p>
    </div>

    <div class="cost-display">
        <h3>💰 Cost Optimization Status</h3>
        <div id="cost-analytics">
            <p>📊 Loading cost analytics...</p>
        </div>
    </div>

    <div class="upload-area" id="upload-area">
        <h3>📄 Upload Financial Document</h3>
        <p>Drag and drop a PDF file here, or click to select</p>
        <input type="file" id="file-input" accept=".pdf" style="display: none;">
        <button onclick="document.getElementById('file-input').click()">Choose File</button>
        <br><br>
        <label>Client ID: <input type="text" id="client-id" placeholder="Enter your client ID" value="demo-client"></label>
    </div>

    <div id="processing-status" style="display: none;">
        <h3>⏳ Processing Document...</h3>
        <div id="processing-details"></div>
    </div>

    <div id="results" class="results" style="display: none;">
        <h3>📊 Extraction Results</h3>
        <div id="results-content"></div>
    </div>

    <script>
        let currentDocumentData = null;

        // Load cost analytics on page load
        loadCostAnalytics();

        // File upload handling
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');

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
                processFile(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                processFile(e.target.files[0]);
            }
        });

        async function processFile(file) {
            const clientId = document.getElementById('client-id').value || 'anonymous';
            
            document.getElementById('processing-status').style.display = 'block';
            document.getElementById('results').style.display = 'none';
            
            updateProcessingStatus('📄 Uploading file...');
            
            const formData = new FormData();
            formData.append('pdf', file);
            formData.append('clientId', clientId);

            try {
                updateProcessingStatus('🧠 Analyzing with learned patterns...');
                
                const response = await fetch('/api/process-document', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.success) {
                    currentDocumentData = result;
                    displayResults(result);
                    loadCostAnalytics(); // Refresh cost analytics
                } else {
                    updateProcessingStatus('❌ Processing failed: ' + result.error);
                }
                
            } catch (error) {
                updateProcessingStatus('❌ Error: ' + error.message);
            }
        }

        function updateProcessingStatus(message) {
            document.getElementById('processing-details').innerHTML = '<p>' + message + '</p>';
        }

        function displayResults(result) {
            document.getElementById('processing-status').style.display = 'none';
            document.getElementById('results').style.display = 'block';
            
            const costDisplay = result.costIncurred === 0 ? 
                '<span class="cost-savings">FREE (Pattern-based)</span>' : 
                '<span class="cost-incurred">$' + result.costIncurred.toFixed(2) + ' (Mistral API)</span>';
            
            const learningBadge = result.learningOpportunity ? 
                '<span class="learning-badge">Learning Opportunity</span>' : 
                '<span class="learning-badge" style="background: #28a745;">Learned Pattern Used</span>';

            let html = \`
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4>📊 Processing Summary</h4>
                    <p><strong>Method:</strong> \${result.method}</p>
                    <p><strong>Cost:</strong> \${costDisplay}</p>
                    <p><strong>Processing Time:</strong> \${result.processingTime}ms</p>
                    <p><strong>Status:</strong> \${learningBadge}</p>
                </div>
                
                <h4>💰 Securities Extracted (\${result.data.securities.length})</h4>
            \`;

            result.data.securities.forEach((security, index) => {
                const hasIssues = !security.name || security.name === 'Ordinary Bonds' || !security.marketValue;
                const fieldClass = hasIssues ? 'error-field' : 'correct-field';
                
                html += \`
                    <div class="security-item">
                        <strong>ISIN:</strong> \${security.isin}
                        <button class="annotation-btn" onclick="annotateField('\${security.isin}', 'isin')">✏️</button>
                        <br>
                        <strong>Name:</strong> 
                        <span class="\${!security.name || security.name === 'Ordinary Bonds' ? 'error-field' : 'correct-field'}" style="padding: 2px 5px; border-radius: 3px;">
                            \${security.name || 'Not extracted'}
                        </span>
                        <button class="annotation-btn" onclick="annotateField('\${security.isin}', 'name')">✏️ Correct</button>
                        <br>
                        <strong>Value:</strong> 
                        <span class="\${!security.marketValue ? 'error-field' : 'correct-field'}" style="padding: 2px 5px; border-radius: 3px;">
                            $\${security.marketValue?.toLocaleString() || 'Not extracted'}
                        </span>
                        <button class="annotation-btn" onclick="annotateField('\${security.isin}', 'value')">✏️ Correct</button>
                        <br>
                        <strong>Currency:</strong> \${security.currency || 'USD'}
                        <strong>Type:</strong> \${security.type || 'Bond'}
                    </div>
                \`;
            });

            html += \`
                <h4>💼 Portfolio Summary</h4>
                <div class="security-item">
                    <strong>Total Value:</strong> $\${result.data.portfolio.totalValue?.toLocaleString() || 'Not extracted'}
                    <button class="annotation-btn" onclick="annotateField('portfolio', 'totalValue')">✏️ Correct</button>
                    <br>
                    <strong>Currency:</strong> \${result.data.portfolio.currency || 'USD'}
                    <br>
                    <strong>Valuation Date:</strong> \${result.data.portfolio.valuationDate || 'Not extracted'}
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 8px;">
                    <h4>🧠 Help Improve the System</h4>
                    <p>Your corrections help make the system smarter for all users and reduce costs over time!</p>
                    <button onclick="showBatchAnnotation()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        📝 Review & Correct Multiple Items
                    </button>
                </div>
            \`;

            document.getElementById('results-content').innerHTML = html;
        }

        async function loadCostAnalytics() {
            try {
                const response = await fetch('/api/cost-analytics');
                const analytics = await response.json();
                
                const html = \`
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <strong>📊 Total Documents:</strong> \${analytics.totalDocuments}
                        </div>
                        <div>
                            <strong>🆓 Free Processing:</strong> \${analytics.freeProcessing} (\${analytics.savingsPercentage.toFixed(1)}%)
                        </div>
                        <div>
                            <strong>💰 Total Cost:</strong> $\${analytics.totalCost.toFixed(2)}
                        </div>
                        <div>
                            <strong>💚 Cost Savings:</strong> $\${analytics.costSavings.toFixed(2)}
                        </div>
                        <div>
                            <strong>📈 Avg Cost:</strong> $\${analytics.averageCost.toFixed(3)}
                        </div>
                    </div>
                    <div style="margin-top: 10px; padding: 10px; background: #d4edda; border-radius: 5px;">
                        <strong>🎯 System Learning:</strong> As more clients use and correct the system, costs decrease for everyone!
                    </div>
                \`;
                
                document.getElementById('cost-analytics').innerHTML = html;
                
            } catch (error) {
                console.error('Failed to load cost analytics:', error);
            }
        }

        function annotateField(securityIsin, fieldType) {
            // Open annotation modal
            const modal = createAnnotationModal(securityIsin, fieldType);
            document.body.appendChild(modal);
        }

        function createAnnotationModal(securityIsin, fieldType) {
            const modal = document.createElement('div');
            modal.style.cssText = \`
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(0,0,0,0.5); display: flex; align-items: center; 
                justify-content: center; z-index: 1000;
            \`;
            
            const security = currentDocumentData.data.securities.find(s => s.isin === securityIsin);
            const currentValue = fieldType === 'name' ? security?.name : 
                                fieldType === 'value' ? security?.marketValue : 
                                security?.[fieldType];
            
            modal.innerHTML = \`
                <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%;">
                    <h3>✏️ Correct \${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}</h3>
                    <p><strong>Security:</strong> \${securityIsin}</p>
                    
                    <div style="margin: 15px 0;">
                        <label><strong>Current Value:</strong></label>
                        <input type="text" value="\${currentValue || 'Not extracted'}" readonly 
                               style="width: 100%; padding: 8px; background: #ffe6e6; border: 1px solid #ff9999; border-radius: 4px;">
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <label><strong>Corrected Value:</strong></label>
                        <input type="text" id="corrected-value" placeholder="Enter correct value" 
                               style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <label><strong>Confidence:</strong></label>
                        <select id="confidence" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                            <option value="1.0">100% - Certain</option>
                            <option value="0.9">90% - Very Confident</option>
                            <option value="0.8">80% - Confident</option>
                        </select>
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <label><strong>Notes:</strong></label>
                        <textarea id="notes" placeholder="Why was this correction needed?" 
                                  style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; height: 60px;"></textarea>
                    </div>
                    
                    <div style="text-align: right; margin-top: 20px;">
                        <button onclick="this.closest('div').parentElement.remove()" 
                                style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px; cursor: pointer;">
                            Cancel
                        </button>
                        <button onclick="submitAnnotation('\${securityIsin}', '\${fieldType}', this)" 
                                style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            ✅ Submit Correction
                        </button>
                    </div>
                </div>
            \`;
            
            return modal;
        }

        async function submitAnnotation(securityIsin, fieldType, button) {
            const modal = button.closest('div').parentElement;
            const correctedValue = modal.querySelector('#corrected-value').value;
            const confidence = parseFloat(modal.querySelector('#confidence').value);
            const notes = modal.querySelector('#notes').value;
            
            if (!correctedValue.trim()) {
                alert('Please enter a corrected value');
                return;
            }
            
            const annotation = {
                type: fieldType + '_correction',
                securityISIN: securityIsin,
                fieldType: fieldType,
                originalValue: currentDocumentData.data.securities.find(s => s.isin === securityIsin)?.[fieldType],
                correctedData: {},
                confidence: confidence,
                userFeedback: notes,
                timestamp: new Date().toISOString()
            };
            
            annotation.correctedData[fieldType] = fieldType === 'value' ? parseFloat(correctedValue) : correctedValue;
            
            try {
                button.textContent = '⏳ Submitting...';
                button.disabled = true;
                
                const response = await fetch('/api/submit-annotation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientId: document.getElementById('client-id').value || 'anonymous',
                        annotation: annotation
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Correction submitted successfully! This will help improve the system for all users.');
                    modal.remove();
                    
                    // Update the display
                    const security = currentDocumentData.data.securities.find(s => s.isin === securityIsin);
                    if (security) {
                        security[fieldType] = annotation.correctedData[fieldType];
                        displayResults(currentDocumentData);
                    }
                } else {
                    alert('❌ Failed to submit correction: ' + result.error);
                    button.textContent = '✅ Submit Correction';
                    button.disabled = false;
                }
                
            } catch (error) {
                alert('❌ Error submitting correction: ' + error.message);
                button.textContent = '✅ Submit Correction';
                button.disabled = false;
            }
        }

        function showBatchAnnotation() {
            alert('🚧 Batch annotation interface coming soon! For now, please use individual correction buttons.');
        }
    </script>
</body>
</html>
        `;
    }

    generateAnnotationInterface(documentId) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Annotation - ${documentId}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .annotation-interface { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .pdf-viewer { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        .annotation-panel { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        .security-section { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .highlight { background: yellow; cursor: pointer; }
        .error-highlight { background: #ffcccc; cursor: pointer; }
        .correct-highlight { background: #ccffcc; }
    </style>
</head>
<body>
    <h1>📝 Document Annotation Interface</h1>
    <p>Document ID: ${documentId}</p>
    
    <div class="annotation-interface">
        <div class="pdf-viewer">
            <h3>📄 PDF Content</h3>
            <div id="pdf-content">
                <!-- PDF content will be loaded here -->
                <p>Loading PDF content...</p>
            </div>
        </div>
        
        <div class="annotation-panel">
            <h3>✏️ Annotations</h3>
            <div id="annotation-list">
                <!-- Annotations will be listed here -->
                <p>No annotations yet. Click on highlighted text to add annotations.</p>
            </div>
        </div>
    </div>
    
    <script>
        // Annotation interface JavaScript will be added here
        console.log('Annotation interface loaded for document:', '${documentId}');
    </script>
</body>
</html>
        `;
    }

    start(port = 3000) {
        this.app.listen(port, () => {
            console.log(`🌐 Web Annotation Interface running on http://localhost:${port}`);
            console.log(`📝 Annotation interface: http://localhost:${port}/annotate/demo`);
        });
    }
}

module.exports = { WebAnnotationInterface };
