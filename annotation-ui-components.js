/**
 * ANNOTATION UI COMPONENTS
 * Reusable UI components for the advanced annotation interface
 * 
 * Components:
 * - SecurityCard: Individual security item display and editing
 * - ConfidenceIndicator: Visual confidence level display
 * - BatchControlPanel: Batch processing controls
 * - PDFHighlight: PDF text highlighting component
 */

class AnnotationUIComponents {
    constructor() {
        this.eventHandlers = new Map();
        console.log('🎨 Annotation UI Components initialized');
    }

    // Security Card Component
    createSecurityCard(security, index, options = {}) {
        const isExpanded = options.expanded || false;
        const showActions = options.showActions !== false;
        const theme = options.theme || 'default';
        
        const confidence = security.confidence || 0;
        const confidenceClass = this.getConfidenceClass(confidence);
        const confidenceColor = this.getConfidenceColor(confidence);
        
        return `
            <div class="security-card ${theme}" data-security-id="${index}" data-confidence="${confidence}">
                <div class="security-card-header" onclick="this.parentElement.querySelector('.security-card-body').classList.toggle('expanded')">
                    <div class="security-main-info">
                        <div class="isin-code">
                            <span class="isin-label">ISIN:</span>
                            <span class="isin-value">${security.isin || 'N/A'}</span>
                            ${security.corrected ? '<span class="corrected-badge">✓</span>' : ''}
                            ${security.flagged ? '<span class="flagged-badge">🏁</span>' : ''}
                        </div>
                        <div class="security-name" title="${security.name || 'Unknown Security'}">
                            ${this.truncateText(security.name || 'Unknown Security', 40)}
                        </div>
                    </div>
                    
                    <div class="security-value-info">
                        <div class="market-value">
                            $${this.formatCurrency(security.value || 0)}
                            <span class="currency">${security.currency || 'CHF'}</span>
                        </div>
                        <div class="confidence-indicator ${confidenceClass}">
                            ${this.createConfidenceIndicator(confidence)}
                        </div>
                    </div>
                    
                    <div class="expand-indicator">
                        <svg width="16" height="16" viewBox="0 0 16 16" class="expand-arrow">
                            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none"/>
                        </svg>
                    </div>
                </div>
                
                <div class="security-card-body ${isExpanded ? 'expanded' : ''}">
                    ${this.createSecurityForm(security, index)}
                    ${showActions ? this.createActionButtons(index) : ''}
                    ${this.createMetadataSection(security)}
                </div>
            </div>
        `;
    }

    createSecurityForm(security, index) {
        return `
            <div class="security-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="isin-${index}">ISIN Code</label>
                        <input 
                            type="text" 
                            id="isin-${index}"
                            value="${security.isin || ''}" 
                            data-field="isin"
                            pattern="[A-Z]{2}[A-Z0-9]{10}"
                            placeholder="e.g., CH1234567890"
                            class="form-control"
                        />
                        <div class="field-validation" id="isin-validation-${index}"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="currency-${index}">Currency</label>
                        <select id="currency-${index}" data-field="currency" class="form-control">
                            <option value="CHF" ${security.currency === 'CHF' ? 'selected' : ''}>CHF</option>
                            <option value="USD" ${security.currency === 'USD' ? 'selected' : ''}>USD</option>
                            <option value="EUR" ${security.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                            <option value="GBP" ${security.currency === 'GBP' ? 'selected' : ''}>GBP</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="name-${index}">Security Name</label>
                    <input 
                        type="text" 
                        id="name-${index}"
                        value="${security.name || ''}" 
                        data-field="name"
                        placeholder="Enter security name"
                        class="form-control"
                    />
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="value-${index}">Market Value</label>
                        <input 
                            type="text" 
                            id="value-${index}"
                            value="${security.value || ''}" 
                            data-field="value"
                            placeholder="0.00"
                            class="form-control currency-input"
                            pattern="[0-9,'.]+"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="percentage-${index}">Portfolio %</label>
                        <input 
                            type="text" 
                            id="percentage-${index}"
                            value="${security.percentage || ''}" 
                            data-field="percentage"
                            placeholder="0.00%"
                            class="form-control"
                        />
                    </div>
                </div>
            </div>
        `;
    }

    createActionButtons(index) {
        return `
            <div class="action-buttons">
                <button 
                    class="btn btn-primary btn-correct" 
                    onclick="window.annotationInterface.correctSecurity(${index})"
                    title="Apply corrections and learn from changes"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    Apply Correction
                </button>
                
                <button 
                    class="btn btn-warning btn-flag" 
                    onclick="window.annotationInterface.flagSecurity(${index})"
                    title="Flag for manual review"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.36 6l.4 2H18v6h-3.36l-.4-2H7V6h5.36M14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6L14 4z"/>
                    </svg>
                    Flag Review
                </button>
                
                <button 
                    class="btn btn-secondary btn-duplicate" 
                    onclick="window.annotationInterface.duplicateSecurity(${index})"
                    title="Create duplicate entry"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    Duplicate
                </button>
                
                <button 
                    class="btn btn-danger btn-remove" 
                    onclick="window.annotationInterface.removeSecurity(${index})"
                    title="Remove this security"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    Remove
                </button>
            </div>
        `;
    }

    createMetadataSection(security) {
        const metadata = security.metadata || {};
        const extractionMethod = security.method || 'unknown';
        const source = security.source || 'extracted';
        
        return `
            <div class="metadata-section">
                <div class="metadata-header">
                    <h4>📊 Extraction Metadata</h4>
                    <button class="btn-toggle-metadata" onclick="this.parentElement.parentElement.classList.toggle('expanded')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </button>
                </div>
                
                <div class="metadata-content">
                    <div class="metadata-grid">
                        <div class="metadata-item">
                            <span class="label">Extraction Method:</span>
                            <span class="value method-${extractionMethod}">${extractionMethod}</span>
                        </div>
                        
                        <div class="metadata-item">
                            <span class="label">Source:</span>
                            <span class="value">${source}</span>
                        </div>
                        
                        <div class="metadata-item">
                            <span class="label">Confidence Score:</span>
                            <span class="value">${Math.round((security.confidence || 0) * 100)}%</span>
                        </div>
                        
                        <div class="metadata-item">
                            <span class="label">Validation Status:</span>
                            <span class="value validation-${security.validated ? 'passed' : 'pending'}">
                                ${security.validated ? 'Validated' : 'Pending'}
                            </span>
                        </div>
                        
                        ${security.pageNumber ? `
                        <div class="metadata-item">
                            <span class="label">Page Number:</span>
                            <span class="value">${security.pageNumber}</span>
                        </div>
                        ` : ''}
                        
                        ${security.coordinates ? `
                        <div class="metadata-item">
                            <span class="label">Position:</span>
                            <span class="value">x:${security.coordinates.x}, y:${security.coordinates.y}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Confidence Indicator Component
    createConfidenceIndicator(confidence) {
        const percentage = Math.round(confidence * 100);
        const level = this.getConfidenceLevel(confidence);
        
        return `
            <div class="confidence-indicator" data-confidence="${confidence}">
                <div class="confidence-bar">
                    <div class="confidence-fill confidence-${level}" style="width: ${percentage}%"></div>
                </div>
                <span class="confidence-text">${percentage}%</span>
            </div>
        `;
    }

    // Batch Control Panel Component
    createBatchControlPanel(stats) {
        const { total, highConfidence, lowConfidence, flagged, corrected } = stats;
        
        return `
            <div class="batch-control-panel">
                <div class="batch-header">
                    <h3>📚 Batch Processing Controls</h3>
                    <div class="batch-stats-summary">
                        ${total} securities • ${corrected} corrected • ${flagged} flagged
                    </div>
                </div>
                
                <div class="batch-stats-grid">
                    <div class="stat-card high-confidence">
                        <div class="stat-value">${highConfidence}</div>
                        <div class="stat-label">High Confidence</div>
                        <div class="stat-percentage">${Math.round((highConfidence / total) * 100)}%</div>
                    </div>
                    
                    <div class="stat-card low-confidence">
                        <div class="stat-value">${lowConfidence}</div>
                        <div class="stat-label">Need Review</div>
                        <div class="stat-percentage">${Math.round((lowConfidence / total) * 100)}%</div>
                    </div>
                    
                    <div class="stat-card flagged">
                        <div class="stat-value">${flagged}</div>
                        <div class="stat-label">Flagged</div>
                        <div class="stat-percentage">${Math.round((flagged / total) * 100)}%</div>
                    </div>
                    
                    <div class="stat-card corrected">
                        <div class="stat-value">${corrected}</div>
                        <div class="stat-label">Corrected</div>
                        <div class="stat-percentage">${Math.round((corrected / total) * 100)}%</div>
                    </div>
                </div>
                
                <div class="batch-actions">
                    <div class="action-group">
                        <h4>Quick Actions</h4>
                        <button class="btn btn-success" onclick="window.annotationInterface.approveAllHighConfidence()">
                            ✅ Approve High Confidence (${highConfidence})
                        </button>
                        <button class="btn btn-warning" onclick="window.annotationInterface.reviewLowConfidence()">
                            🔍 Review Low Confidence (${lowConfidence})
                        </button>
                        <button class="btn btn-info" onclick="window.annotationInterface.exportCorrections()">
                            📊 Export Corrections
                        </button>
                    </div>
                    
                    <div class="action-group">
                        <h4>Bulk Operations</h4>
                        <button class="btn btn-secondary" onclick="window.annotationInterface.selectAll()">
                            Select All
                        </button>
                        <button class="btn btn-secondary" onclick="window.annotationInterface.deselectAll()">
                            Deselect All
                        </button>
                        <button class="btn btn-primary" onclick="window.annotationInterface.bulkCorrect()">
                            Bulk Correct Selected
                        </button>
                    </div>
                </div>
                
                <div class="progress-section">
                    <h4>Processing Progress</h4>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.round(((corrected + flagged) / total) * 100)}%"></div>
                    </div>
                    <div class="progress-text">
                        ${corrected + flagged} of ${total} securities processed (${Math.round(((corrected + flagged) / total) * 100)}%)
                    </div>
                </div>
            </div>
        `;
    }

    // PDF Highlight Component
    createPDFHighlight(security, index, coordinates) {
        const confidence = security.confidence || 0;
        const type = this.getHighlightType(confidence);
        
        return `
            <div 
                class="pdf-highlight ${type}" 
                data-security-id="${index}"
                style="
                    left: ${coordinates.x}px;
                    top: ${coordinates.y}px;
                    width: ${coordinates.width}px;
                    height: ${coordinates.height}px;
                "
                onclick="window.annotationInterface.selectSecurity(${index})"
                title="${security.isin}: $${this.formatCurrency(security.value)} (${Math.round(confidence * 100)}% confidence)"
            >
                <div class="highlight-label">
                    ${security.isin}
                </div>
                <div class="highlight-confidence">
                    ${Math.round(confidence * 100)}%
                </div>
            </div>
        `;
    }

    // Filter and Search Component
    createFilterControls() {
        return `
            <div class="filter-controls">
                <div class="filter-header">
                    <h4>🔍 Filter & Search</h4>
                    <button class="btn-clear-filters" onclick="window.annotationInterface.clearFilters()">
                        Clear All
                    </button>
                </div>
                
                <div class="filter-row">
                    <div class="filter-group">
                        <label>Search ISIN/Name:</label>
                        <input 
                            type="text" 
                            id="search-input" 
                            placeholder="Search..."
                            onkeyup="window.annotationInterface.filterSecurities()"
                            class="form-control"
                        />
                    </div>
                    
                    <div class="filter-group">
                        <label>Confidence Level:</label>
                        <select id="confidence-filter" onchange="window.annotationInterface.filterSecurities()" class="form-control">
                            <option value="">All</option>
                            <option value="high">High (≥80%)</option>
                            <option value="medium">Medium (60-79%)</option>
                            <option value="low">Low (<60%)</option>
                        </select>
                    </div>
                </div>
                
                <div class="filter-row">
                    <div class="filter-group">
                        <label>Status:</label>
                        <select id="status-filter" onchange="window.annotationInterface.filterSecurities()" class="form-control">
                            <option value="">All</option>
                            <option value="corrected">Corrected</option>
                            <option value="flagged">Flagged</option>
                            <option value="pending">Pending Review</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Value Range:</label>
                        <select id="value-filter" onchange="window.annotationInterface.filterSecurities()" class="form-control">
                            <option value="">All Values</option>
                            <option value="high">High (>$1M)</option>
                            <option value="medium">Medium ($100K-$1M)</option>
                            <option value="low">Low (<$100K)</option>
                        </select>
                    </div>
                </div>
                
                <div class="active-filters" id="active-filters-display"></div>
            </div>
        `;
    }

    // Utility Methods
    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value || 0);
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    getConfidenceClass(confidence) {
        if (confidence >= 0.8) return 'high';
        if (confidence >= 0.6) return 'medium';
        return 'low';
    }

    getConfidenceColor(confidence) {
        if (confidence >= 0.8) return '#28a745';
        if (confidence >= 0.6) return '#ffc107';
        return '#dc3545';
    }

    getConfidenceLevel(confidence) {
        if (confidence >= 0.8) return 'high';
        if (confidence >= 0.6) return 'medium';
        return 'low';
    }

    getHighlightType(confidence) {
        if (confidence >= 0.8) return 'highlight-high';
        if (confidence >= 0.6) return 'highlight-medium';
        return 'highlight-low';
    }

    // Event Handler Management
    addEventHandler(element, event, handler) {
        const key = `${element}-${event}`;
        this.eventHandlers.set(key, handler);
        
        if (typeof document !== 'undefined') {
            const el = document.getElementById(element);
            if (el) {
                el.addEventListener(event, handler);
            }
        }
    }

    removeEventHandler(element, event) {
        const key = `${element}-${event}`;
        const handler = this.eventHandlers.get(key);
        
        if (handler && typeof document !== 'undefined') {
            const el = document.getElementById(element);
            if (el) {
                el.removeEventListener(event, handler);
            }
        }
        
        this.eventHandlers.delete(key);
    }

    // Animation and Transition Effects
    animateSecurityCard(index, animationType = 'highlight') {
        const card = document.querySelector(`[data-security-id="${index}"]`);
        if (!card) return;

        switch (animationType) {
            case 'highlight':
                card.classList.add('animate-highlight');
                setTimeout(() => card.classList.remove('animate-highlight'), 1000);
                break;
                
            case 'success':
                card.classList.add('animate-success');
                setTimeout(() => card.classList.remove('animate-success'), 1500);
                break;
                
            case 'error':
                card.classList.add('animate-error');
                setTimeout(() => card.classList.remove('animate-error'), 1500);
                break;
                
            case 'pulse':
                card.classList.add('animate-pulse');
                setTimeout(() => card.classList.remove('animate-pulse'), 2000);
                break;
        }
    }

    // Accessibility Features
    addAccessibilityFeatures() {
        return `
            <div class="accessibility-controls">
                <button class="btn-accessibility" onclick="window.annotationInterface.toggleHighContrast()">
                    🎨 High Contrast
                </button>
                <button class="btn-accessibility" onclick="window.annotationInterface.increaseFontSize()">
                    🔍 Larger Text
                </button>
                <button class="btn-accessibility" onclick="window.annotationInterface.enableKeyboardNav()">
                    ⌨️ Keyboard Navigation
                </button>
            </div>
        `;
    }
}

// CSS Styles for Components
const componentStyles = `
    .security-card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        margin-bottom: 12px;
        background: white;
        overflow: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .security-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateY(-1px);
    }

    .security-card-header {
        padding: 16px;
        background: #f8f9fa;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #e9ecef;
    }

    .security-main-info {
        flex: 1;
        min-width: 0;
    }

    .isin-code {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
    }

    .isin-label {
        font-size: 12px;
        color: #6c757d;
        font-weight: 500;
    }

    .isin-value {
        font-family: 'Courier New', monospace;
        font-weight: bold;
        color: #495057;
    }

    .corrected-badge {
        background: #28a745;
        color: white;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
    }

    .flagged-badge {
        background: #ffc107;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
    }

    .security-name {
        font-size: 14px;
        color: #6c757d;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .security-value-info {
        text-align: right;
        margin: 0 16px;
    }

    .market-value {
        font-size: 18px;
        font-weight: bold;
        color: #2c3e50;
        margin-bottom: 4px;
    }

    .currency {
        font-size: 12px;
        color: #6c757d;
        margin-left: 4px;
    }

    .confidence-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .confidence-bar {
        width: 60px;
        height: 6px;
        background: #e9ecef;
        border-radius: 3px;
        overflow: hidden;
    }

    .confidence-fill {
        height: 100%;
        transition: width 0.3s ease;
    }

    .confidence-high { background: #28a745; }
    .confidence-medium { background: #ffc107; }
    .confidence-low { background: #dc3545; }

    .confidence-text {
        font-size: 11px;
        font-weight: 500;
        color: #6c757d;
    }

    .expand-arrow {
        transition: transform 0.2s ease;
    }

    .security-card-body.expanded .expand-arrow {
        transform: rotate(180deg);
    }

    .security-card-body {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;
    }

    .security-card-body.expanded {
        max-height: 1000px;
        padding: 20px;
    }

    .security-form {
        margin-bottom: 20px;
    }

    .form-row {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
    }

    .form-group {
        flex: 1;
        min-width: 0;
    }

    .form-group label {
        display: block;
        font-weight: 500;
        margin-bottom: 6px;
        color: #495057;
        font-size: 14px;
    }

    .form-control {
        width: 100%;
        padding: 10px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.2s ease;
        box-sizing: border-box;
    }

    .form-control:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .action-buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 16px;
    }

    .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
        text-decoration: none;
    }

    .btn-primary { background: #007bff; color: white; }
    .btn-primary:hover { background: #0056b3; }

    .btn-warning { background: #ffc107; color: #000; }
    .btn-warning:hover { background: #e0a800; }

    .btn-secondary { background: #6c757d; color: white; }
    .btn-secondary:hover { background: #545b62; }

    .btn-danger { background: #dc3545; color: white; }
    .btn-danger:hover { background: #c82333; }

    .btn-success { background: #28a745; color: white; }
    .btn-success:hover { background: #1e7e34; }

    .metadata-section {
        border-top: 1px solid #e9ecef;
        padding-top: 16px;
    }

    .metadata-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .metadata-header h4 {
        margin: 0;
        font-size: 14px;
        color: #495057;
    }

    .metadata-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
    }

    .metadata-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #f1f3f4;
    }

    .metadata-item .label {
        font-size: 12px;
        color: #6c757d;
        font-weight: 500;
    }

    .metadata-item .value {
        font-size: 12px;
        color: #495057;
        font-weight: 500;
    }

    .batch-control-panel {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
    }

    .batch-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 16px;
        margin: 16px 0;
    }

    .stat-card {
        background: white;
        padding: 16px;
        border-radius: 6px;
        text-align: center;
        border: 1px solid #e9ecef;
    }

    .stat-value {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 4px;
    }

    .stat-label {
        font-size: 12px;
        color: #6c757d;
        margin-bottom: 4px;
    }

    .stat-percentage {
        font-size: 11px;
        font-weight: 500;
    }

    .high-confidence .stat-value { color: #28a745; }
    .low-confidence .stat-value { color: #dc3545; }
    .flagged .stat-value { color: #ffc107; }
    .corrected .stat-value { color: #17a2b8; }

    .pdf-highlight {
        position: absolute;
        border: 2px solid;
        border-radius: 3px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 11px;
        padding: 2px 4px;
        font-weight: 500;
    }

    .highlight-high {
        background: rgba(40, 167, 69, 0.2);
        border-color: #28a745;
        color: #155724;
    }

    .highlight-medium {
        background: rgba(255, 193, 7, 0.2);
        border-color: #ffc107;
        color: #856404;
    }

    .highlight-low {
        background: rgba(220, 53, 69, 0.2);
        border-color: #dc3545;
        color: #721c24;
    }

    .pdf-highlight:hover {
        transform: scale(1.05);
        z-index: 10;
    }

    .filter-controls {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        padding: 16px;
        margin-bottom: 16px;
    }

    .filter-row {
        display: flex;
        gap: 16px;
        margin-bottom: 12px;
    }

    .filter-group {
        flex: 1;
        min-width: 0;
    }

    .filter-group label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        color: #495057;
        margin-bottom: 4px;
    }

    .progress-bar {
        width: 100%;
        height: 8px;
        background: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #007bff, #28a745);
        transition: width 0.5s ease;
    }

    .progress-text {
        font-size: 12px;
        color: #6c757d;
        text-align: center;
    }

    /* Animation Classes */
    .animate-highlight {
        animation: highlight-pulse 1s ease-in-out;
    }

    .animate-success {
        animation: success-flash 1.5s ease-in-out;
    }

    .animate-error {
        animation: error-shake 0.5s ease-in-out;
    }

    .animate-pulse {
        animation: pulse 2s ease-in-out infinite;
    }

    @keyframes highlight-pulse {
        0% { box-shadow: 0 0 0 0 rgba(0,123,255,0.7); }
        70% { box-shadow: 0 0 0 10px rgba(0,123,255,0); }
        100% { box-shadow: 0 0 0 0 rgba(0,123,255,0); }
    }

    @keyframes success-flash {
        0%, 100% { background-color: inherit; }
        50% { background-color: rgba(40,167,69,0.1); }
    }

    @keyframes error-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .form-row {
            flex-direction: column;
            gap: 12px;
        }
        
        .action-buttons {
            flex-direction: column;
        }
        
        .batch-stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .filter-row {
            flex-direction: column;
            gap: 12px;
        }
    }
`;

module.exports = { AnnotationUIComponents, componentStyles };