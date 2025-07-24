/**
 * ADVANCED ANNOTATION INTERFACE
 * Enhanced PDF annotation system with side-by-side view and batch correction
 * 
 * Features:
 * - PDF.js integration for document viewing
 * - Real-time annotation highlighting
 * - Batch correction workflow
 * - Expert collaboration tools
 */

const fs = require('fs').promises;
const path = require('path');

class AdvancedAnnotationInterface {
    constructor(options = {}) {
        this.documentContainer = options.documentContainer || 'pdf-viewer';
        this.annotationContainer = options.annotationContainer || 'annotation-panel';
        this.pdfDocument = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.annotations = new Map();
        this.extractedData = null;
        this.batchMode = false;
        this.collaborationMode = options.collaborationMode || false;
        
        console.log('🎨 Advanced Annotation Interface initialized');
    }

    async initializePDFViewer(pdfBuffer, extractedData) {
        console.log('📄 Initializing PDF viewer with advanced features...');
        
        this.extractedData = extractedData;
        
        // Initialize PDF.js (would be loaded via CDN in browser)
        const pdfjsLib = typeof window !== 'undefined' ? window.pdfjsLib : null;
        
        if (!pdfjsLib && typeof window !== 'undefined') {
            console.log('📦 Loading PDF.js library...');
            await this.loadPDFjs();
        }
        
        const loadingTask = pdfjsLib?.getDocument({data: pdfBuffer});
        this.pdfDocument = await loadingTask?.promise;
        this.totalPages = this.pdfDocument?.numPages || 1;
        
        await this.renderInterface();
        await this.highlightExtractedData();
        
        console.log(`✅ PDF viewer initialized: ${this.totalPages} pages`);
    }

    async loadPDFjs() {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://mozilla.github.io/pdf.js/build/pdf.min.js';
            script.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
                    'https://mozilla.github.io/pdf.js/build/pdf.worker.min.js';
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    async renderInterface() {
        const interfaceHTML = `
            <div class="advanced-annotation-container">
                <!-- PDF Viewer Section -->
                <div class="pdf-viewer-section">
                    <div class="pdf-controls">
                        <button id="prev-page" onclick="window.annotationInterface.previousPage()">
                            ◀ Previous
                        </button>
                        <span id="page-info">Page ${this.currentPage} of ${this.totalPages}</span>
                        <button id="next-page" onclick="window.annotationInterface.nextPage()">
                            Next ▶
                        </button>
                        <div class="zoom-controls">
                            <button onclick="window.annotationInterface.zoomOut()">Zoom -</button>
                            <span id="zoom-level">100%</span>
                            <button onclick="window.annotationInterface.zoomIn()">Zoom +</button>
                        </div>
                    </div>
                    <div class="pdf-canvas-container">
                        <canvas id="pdf-canvas"></canvas>
                        <div id="annotation-overlay"></div>
                    </div>
                </div>

                <!-- Annotation Panel Section -->
                <div class="annotation-panel-section">
                    <div class="panel-header">
                        <h3>📝 Extraction Results</h3>
                        <div class="panel-controls">
                            <button id="batch-mode-toggle" onclick="window.annotationInterface.toggleBatchMode()">
                                ${this.batchMode ? '📄 Single Mode' : '📚 Batch Mode'}
                            </button>
                            <button id="save-annotations" onclick="window.annotationInterface.saveAnnotations()">
                                💾 Save Changes
                            </button>
                        </div>
                    </div>

                    <div class="accuracy-summary">
                        <div class="metric">
                            <span class="label">Overall Accuracy:</span>
                            <span class="value accuracy-${this.getAccuracyClass()}">${this.extractedData?.accuracy || 0}%</span>
                        </div>
                        <div class="metric">
                            <span class="label">Securities Found:</span>
                            <span class="value">${this.extractedData?.securities?.length || 0}</span>
                        </div>
                        <div class="metric">
                            <span class="label">Total Value:</span>
                            <span class="value">$${this.formatCurrency(this.extractedData?.total || 0)}</span>
                        </div>
                    </div>

                    <div class="extraction-results">
                        ${this.renderExtractionResults()}
                    </div>

                    ${this.batchMode ? this.renderBatchControls() : ''}
                </div>
            </div>

            <style>
                .advanced-annotation-container {
                    display: flex;
                    height: 100vh;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                .pdf-viewer-section {
                    flex: 1;
                    border-right: 2px solid #e0e0e0;
                    display: flex;
                    flex-direction: column;
                }

                .pdf-controls {
                    padding: 15px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e0e0e0;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    justify-content: space-between;
                }

                .pdf-controls button {
                    padding: 8px 16px;
                    border: 1px solid #007bff;
                    background: #007bff;
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .pdf-controls button:hover {
                    background: #0056b3;
                }

                .zoom-controls {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .pdf-canvas-container {
                    flex: 1;
                    position: relative;
                    overflow: auto;
                    background: #f0f0f0;
                }

                #pdf-canvas {
                    display: block;
                    margin: 20px auto;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }

                #annotation-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    pointer-events: none;
                }

                .annotation-panel-section {
                    width: 400px;
                    display: flex;
                    flex-direction: column;
                    background: white;
                }

                .panel-header {
                    padding: 20px;
                    background: #2c3e50;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .panel-controls button {
                    padding: 8px 12px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-left: 5px;
                    font-size: 12px;
                }

                .accuracy-summary {
                    padding: 15px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e0e0e0;
                }

                .metric {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }

                .metric .label {
                    font-weight: 500;
                    color: #555;
                }

                .accuracy-excellent { color: #28a745; font-weight: bold; }
                .accuracy-good { color: #ffc107; font-weight: bold; }
                .accuracy-poor { color: #dc3545; font-weight: bold; }

                .extraction-results {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px;
                }

                .security-item {
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    margin-bottom: 10px;
                    overflow: hidden;
                    transition: all 0.2s;
                }

                .security-item:hover {
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .security-header {
                    background: #f8f9fa;
                    padding: 12px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .security-details {
                    padding: 15px;
                    display: none;
                }

                .security-details.expanded {
                    display: block;
                }

                .field-group {
                    margin-bottom: 15px;
                }

                .field-group label {
                    display: block;
                    font-weight: 500;
                    margin-bottom: 5px;
                    color: #333;
                }

                .field-group input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .correction-buttons {
                    display: flex;
                    gap: 10px;
                    margin-top: 10px;
                }

                .btn-correct {
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }

                .btn-flag {
                    background: #ffc107;
                    color: #000;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }

                .highlight-overlay {
                    position: absolute;
                    background: rgba(255, 235, 59, 0.3);
                    border: 2px solid #FFC107;
                    pointer-events: auto;
                    cursor: pointer;
                    border-radius: 2px;
                }

                .highlight-overlay:hover {
                    background: rgba(255, 193, 7, 0.5);
                }

                .batch-controls {
                    padding: 15px;
                    background: #e3f2fd;
                    border-top: 1px solid #bbdefb;
                }

                .batch-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 10px;
                }

                .batch-actions button {
                    flex: 1;
                    padding: 10px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                }

                .btn-approve-all {
                    background: #4caf50;
                    color: white;
                }

                .btn-review-errors {
                    background: #ff9800;
                    color: white;
                }

                @media (max-width: 1200px) {
                    .advanced-annotation-container {
                        flex-direction: column;
                    }
                    
                    .annotation-panel-section {
                        width: 100%;
                        max-height: 400px;
                    }
                }
            </style>
        `;

        // Insert into DOM if running in browser
        if (typeof document !== 'undefined') {
            const container = document.getElementById(this.documentContainer) || document.body;
            container.innerHTML = interfaceHTML;
            
            // Make interface globally accessible
            window.annotationInterface = this;
        }

        return interfaceHTML;
    }

    renderExtractionResults() {
        if (!this.extractedData?.securities) return '<p>No securities data available</p>';

        return this.extractedData.securities.map((security, index) => `
            <div class="security-item" data-security-id="${index}">
                <div class="security-header" onclick="this.parentElement.querySelector('.security-details').classList.toggle('expanded')">
                    <div>
                        <strong>${security.isin || 'N/A'}</strong>
                        <br>
                        <small style="color: #666;">${security.name || 'Unknown Security'}</small>
                    </div>
                    <div>
                        <span style="font-weight: bold; color: #2c3e50;">
                            $${this.formatCurrency(security.value || 0)}
                        </span>
                        <br>
                        <small style="color: ${this.getConfidenceColor(security.confidence)};">
                            ${Math.round((security.confidence || 0) * 100)}% confidence
                        </small>
                    </div>
                </div>
                <div class="security-details">
                    <div class="field-group">
                        <label>ISIN Code:</label>
                        <input type="text" value="${security.isin || ''}" data-field="isin" />
                    </div>
                    <div class="field-group">
                        <label>Security Name:</label>
                        <input type="text" value="${security.name || ''}" data-field="name" />
                    </div>
                    <div class="field-group">
                        <label>Market Value:</label>
                        <input type="text" value="${security.value || ''}" data-field="value" />
                    </div>
                    <div class="field-group">
                        <label>Currency:</label>
                        <input type="text" value="${security.currency || 'CHF'}" data-field="currency" />
                    </div>
                    <div class="correction-buttons">
                        <button class="btn-correct" onclick="window.annotationInterface.correctSecurity(${index})">
                            ✏️ Apply Correction
                        </button>
                        <button class="btn-flag" onclick="window.annotationInterface.flagSecurity(${index})">
                            🏁 Flag for Review
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderBatchControls() {
        const errorCount = this.extractedData?.securities?.filter(s => (s.confidence || 0) < 0.8).length || 0;
        
        return `
            <div class="batch-controls">
                <h4>📚 Batch Processing Mode</h4>
                <p>Review and process multiple corrections simultaneously</p>
                <div class="batch-stats">
                    <div class="metric">
                        <span class="label">Low Confidence Items:</span>
                        <span class="value" style="color: #dc3545;">${errorCount}</span>
                    </div>
                    <div class="metric">
                        <span class="label">Pending Corrections:</span>
                        <span class="value" id="pending-corrections">0</span>
                    </div>
                </div>
                <div class="batch-actions">
                    <button class="btn-approve-all" onclick="window.annotationInterface.approveAll()">
                        ✅ Approve All High Confidence
                    </button>
                    <button class="btn-review-errors" onclick="window.annotationInterface.reviewErrors()">
                        🔍 Review Low Confidence
                    </button>
                </div>
            </div>
        `;
    }

    async highlightExtractedData() {
        if (!this.extractedData?.securities) return;

        console.log('🎯 Highlighting extracted data on PDF...');
        
        // This would integrate with PDF.js to highlight text positions
        // For now, we'll simulate the highlighting
        await this.renderPage(this.currentPage);
        
        // Add highlights for each security found
        this.extractedData.securities.forEach((security, index) => {
            this.addHighlight(security, index);
        });
    }

    async renderPage(pageNumber) {
        if (!this.pdfDocument) return;

        const page = await this.pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({scale: 1.5});
        
        const canvas = document.getElementById('pdf-canvas');
        if (!canvas) return;

        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;
        console.log(`📄 Rendered page ${pageNumber}`);
    }

    addHighlight(security, index) {
        // Simulate adding highlight overlay (would use actual text coordinates in real implementation)
        const overlay = document.getElementById('annotation-overlay');
        if (!overlay) return;

        const highlight = document.createElement('div');
        highlight.className = 'highlight-overlay';
        highlight.style.left = `${Math.random() * 400 + 100}px`;
        highlight.style.top = `${Math.random() * 300 + 100}px`;
        highlight.style.width = '200px';
        highlight.style.height = '20px';
        
        highlight.onclick = () => this.selectSecurity(index);
        highlight.title = `${security.isin}: $${this.formatCurrency(security.value)}`;
        
        overlay.appendChild(highlight);
    }

    // Navigation methods
    async nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            await this.renderPage(this.currentPage);
            this.updatePageInfo();
        }
    }

    async previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            await this.renderPage(this.currentPage);
            this.updatePageInfo();
        }
    }

    updatePageInfo() {
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        }
    }

    zoomIn() {
        console.log('🔍 Zooming in...');
        // Implement zoom functionality
    }

    zoomOut() {
        console.log('🔍 Zooming out...');
        // Implement zoom functionality
    }

    // Annotation methods
    selectSecurity(index) {
        console.log(`🎯 Selected security ${index}`);
        
        // Expand the security details
        const securityItem = document.querySelector(`[data-security-id="${index}"]`);
        if (securityItem) {
            const details = securityItem.querySelector('.security-details');
            details.classList.add('expanded');
            securityItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    correctSecurity(index) {
        console.log(`✏️ Correcting security ${index}`);
        
        const securityItem = document.querySelector(`[data-security-id="${index}"]`);
        if (!securityItem) return;

        const inputs = securityItem.querySelectorAll('input[data-field]');
        const corrections = {};
        
        inputs.forEach(input => {
            const field = input.getAttribute('data-field');
            const value = input.value.trim();
            if (value) {
                corrections[field] = value;
            }
        });

        // Apply correction to data
        const security = this.extractedData.securities[index];
        Object.assign(security, corrections);
        
        // Mark as corrected
        security.corrected = true;
        security.confidence = 1.0;
        
        // Store annotation
        this.annotations.set(index, {
            type: 'correction',
            originalData: { ...security },
            corrections: corrections,
            timestamp: new Date().toISOString(),
            user: 'current_user' // Would get from auth system
        });

        // Update UI
        securityItem.style.borderColor = '#28a745';
        securityItem.style.backgroundColor = '#f8fff9';
        
        console.log(`✅ Applied corrections:`, corrections);
        this.updatePendingCount();
    }

    flagSecurity(index) {
        console.log(`🏁 Flagging security ${index} for review`);
        
        const security = this.extractedData.securities[index];
        security.flagged = true;
        
        this.annotations.set(index, {
            type: 'flag',
            reason: 'Requires manual review',
            timestamp: new Date().toISOString(),
            user: 'current_user'
        });

        const securityItem = document.querySelector(`[data-security-id="${index}"]`);
        if (securityItem) {
            securityItem.style.borderColor = '#ffc107';
            securityItem.style.backgroundColor = '#fffdf5';
        }

        this.updatePendingCount();
    }

    toggleBatchMode() {
        this.batchMode = !this.batchMode;
        console.log(`📚 Batch mode: ${this.batchMode ? 'ON' : 'OFF'}`);
        
        const button = document.getElementById('batch-mode-toggle');
        if (button) {
            button.textContent = this.batchMode ? '📄 Single Mode' : '📚 Batch Mode';
        }
        
        // Re-render interface with batch controls
        this.renderInterface();
    }

    approveAll() {
        console.log('✅ Approving all high confidence items...');
        
        this.extractedData.securities.forEach((security, index) => {
            if ((security.confidence || 0) >= 0.8 && !security.corrected && !security.flagged) {
                security.approved = true;
                this.annotations.set(index, {
                    type: 'approval',
                    timestamp: new Date().toISOString(),
                    user: 'current_user'
                });
            }
        });
        
        this.updatePendingCount();
        console.log('✅ Bulk approval completed');
    }

    reviewErrors() {
        console.log('🔍 Reviewing low confidence items...');
        
        const lowConfidenceItems = this.extractedData.securities
            .map((security, index) => ({ security, index }))
            .filter(({ security }) => (security.confidence || 0) < 0.8);
        
        // Scroll to first low confidence item
        if (lowConfidenceItems.length > 0) {
            this.selectSecurity(lowConfidenceItems[0].index);
        }
        
        console.log(`🔍 Found ${lowConfidenceItems.length} items needing review`);
    }

    updatePendingCount() {
        const pendingElement = document.getElementById('pending-corrections');
        if (pendingElement) {
            pendingElement.textContent = this.annotations.size.toString();
        }
    }

    async saveAnnotations() {
        console.log('💾 Saving annotations and corrections...');
        
        const annotationData = {
            documentId: this.extractedData.documentId || 'unknown',
            timestamp: new Date().toISOString(),
            totalAnnotations: this.annotations.size,
            annotations: Array.from(this.annotations.entries()).map(([index, annotation]) => ({
                securityIndex: index,
                ...annotation
            })),
            updatedData: this.extractedData
        };

        try {
            // Save to learning system
            const response = await fetch('/api/smart-ocr-learn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    corrections: annotationData.annotations.filter(a => a.type === 'correction'),
                    documentId: annotationData.documentId,
                    metadata: {
                        source: 'advanced_annotation_interface',
                        totalSecurities: this.extractedData.securities.length,
                        correctionCount: annotationData.totalAnnotations
                    }
                })
            });

            if (response.ok) {
                console.log('✅ Annotations saved successfully');
                
                // Visual feedback
                const saveButton = document.getElementById('save-annotations');
                if (saveButton) {
                    const originalText = saveButton.textContent;
                    saveButton.textContent = '✅ Saved!';
                    saveButton.style.background = '#28a745';
                    
                    setTimeout(() => {
                        saveButton.textContent = originalText;
                        saveButton.style.background = '';
                    }, 2000);
                }
            } else {
                console.error('❌ Failed to save annotations');
            }
        } catch (error) {
            console.error('❌ Error saving annotations:', error);
        }
    }

    // Utility methods
    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value || 0);
    }

    getAccuracyClass() {
        const accuracy = this.extractedData?.accuracy || 0;
        if (accuracy >= 90) return 'excellent';
        if (accuracy >= 70) return 'good';
        return 'poor';
    }

    getConfidenceColor(confidence) {
        const conf = confidence || 0;
        if (conf >= 0.8) return '#28a745';
        if (conf >= 0.6) return '#ffc107';
        return '#dc3545';
    }

    // Export functionality
    async exportAnnotations() {
        const annotationData = {
            documentId: this.extractedData.documentId || 'unknown',
            exportTime: new Date().toISOString(),
            annotations: Array.from(this.annotations.entries()),
            summary: {
                totalSecurities: this.extractedData.securities.length,
                correctedItems: Array.from(this.annotations.values()).filter(a => a.type === 'correction').length,
                flaggedItems: Array.from(this.annotations.values()).filter(a => a.type === 'flag').length,
                approvedItems: Array.from(this.annotations.values()).filter(a => a.type === 'approval').length
            }
        };

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `annotations_${timestamp}.json`;
        
        if (typeof document !== 'undefined') {
            const blob = new Blob([JSON.stringify(annotationData, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        console.log(`📁 Annotations exported to ${filename}`);
        return annotationData;
    }
}

module.exports = { AdvancedAnnotationInterface };