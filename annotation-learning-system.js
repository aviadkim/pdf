/**
 * ANNOTATION LEARNING SYSTEM
 * When Mistral makes mistakes, humans can annotate PDFs to improve future extractions
 * Creates a feedback loop for continuous improvement
 */

const fs = require('fs').promises;
const path = require('path');

class AnnotationLearningSystem {
    constructor() {
        this.annotationDatabase = './smart-ocr-data/annotations.json';
        this.learningPatterns = './smart-ocr-data/patterns.json';
        this.corrections = './smart-ocr-data/corrections.json';
        
        console.log('🎓 Annotation Learning System Ready');
        console.log('📝 Human feedback improves AI accuracy over time');
    }

    async createAnnotationInterface(documentId, extractionResult, pdfBuffer) {
        console.log(`📝 Creating annotation interface for document ${documentId}`);
        
        const annotationData = {
            documentId: documentId,
            timestamp: new Date().toISOString(),
            extractionResult: extractionResult,
            issues: this.identifyExtractionIssues(extractionResult),
            annotationRequired: true,
            
            // What human annotator should focus on
            annotationTasks: [
                {
                    task: 'missing_securities',
                    description: 'Mark any securities that were not extracted',
                    priority: 'high'
                },
                {
                    task: 'incorrect_values',
                    description: 'Correct any wrong market values',
                    priority: 'high'
                },
                {
                    task: 'table_structure',
                    description: 'Identify table boundaries and column mappings',
                    priority: 'medium'
                },
                {
                    task: 'formatting_patterns',
                    description: 'Mark number formatting (Swiss apostrophes, etc.)',
                    priority: 'medium'
                }
            ],
            
            // Expected corrections
            expectedImprovements: {
                targetSecurities: this.estimateExpectedSecurities(extractionResult),
                confidenceTarget: 95,
                accuracyTarget: 90
            }
        };
        
        // Save annotation request
        await this.saveAnnotationRequest(annotationData);
        
        // Create visual annotation interface (HTML)
        await this.generateAnnotationHTML(annotationData, pdfBuffer);
        
        return annotationData;
    }

    identifyExtractionIssues(result) {
        const issues = [];
        
        if (result.securities.length < 20) {
            issues.push({
                type: 'incomplete_extraction',
                severity: 'high',
                description: `Only ${result.securities.length} securities found, likely missing many`,
                solution: 'Need to identify missed table sections or pages'
            });
        }
        
        if (result.accuracy < 80) {
            issues.push({
                type: 'low_accuracy',
                severity: 'high', 
                description: `${result.accuracy}% accuracy is below target`,
                solution: 'Values may be extracted from wrong columns'
            });
        }
        
        if (result.confidence < 0.8) {
            issues.push({
                type: 'low_confidence',
                severity: 'medium',
                description: 'AI is uncertain about extraction quality',
                solution: 'Document format may be non-standard'
            });
        }
        
        // Check for suspicious patterns
        const zeroValues = result.securities.filter(s => s.value === 0);
        if (zeroValues.length > 0) {
            issues.push({
                type: 'zero_values',
                severity: 'medium',
                description: `${zeroValues.length} securities have zero value`,
                solution: 'May be extracting wrong columns or parsing errors'
            });
        }
        
        return issues;
    }

    async generateAnnotationHTML(annotationData, pdfBuffer) {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Annotation Interface - ${annotationData.documentId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .split-view { display: flex; gap: 20px; }
        .pdf-viewer { flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .annotation-panel { flex: 1; background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        .issue { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .issue.high { background: #f8d7da; border-color: #f5c6cb; }
        .extracted-securities { max-height: 400px; overflow-y: auto; background: #f8f9fa; padding: 15px; margin: 10px 0; }
        .security-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
        .annotation-tools { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .btn { padding: 10px 20px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; }
        .btn-primary { background: #007bff; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-warning { background: #ffc107; color: black; }
        input, textarea { width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 3px; }
        .feedback-form { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 PDF Extraction Annotation Interface</h1>
            <p>Document ID: ${annotationData.documentId}</p>
            <p>Help improve AI accuracy by correcting extraction errors</p>
        </div>
        
        <div class="split-view">
            <div class="pdf-viewer">
                <h3>📄 Original PDF Document</h3>
                <p><em>PDF viewer would be embedded here showing the original document</em></p>
                <div style="height: 600px; background: #eee; display: flex; align-items: center; justify-content: center; border-radius: 5px;">
                    <p>PDF Viewer Component<br/>Users can see original document here</p>
                </div>
            </div>
            
            <div class="annotation-panel">
                <h3>🔍 Extraction Issues Found</h3>
                ${annotationData.issues.map(issue => `
                <div class="issue ${issue.severity}">
                    <h4>⚠️ ${issue.type}</h4>
                    <p><strong>Problem:</strong> ${issue.description}</p>
                    <p><strong>Solution:</strong> ${issue.solution}</p>
                </div>
                `).join('')}
                
                <h3>📊 Currently Extracted Securities</h3>
                <div class="extracted-securities">
                    ${annotationData.extractionResult.securities.map((sec, index) => `
                    <div class="security-row">
                        <span>${index + 1}. ${sec.isin}</span>
                        <span>CHF ${sec.value?.toLocaleString() || '0'}</span>
                    </div>
                    `).join('')}
                </div>
                
                <div class="annotation-tools">
                    <h3>🛠️ Annotation Tools</h3>
                    <button class="btn btn-primary" onclick="markMissingSecurity()">Mark Missing Security</button>
                    <button class="btn btn-warning" onclick="correctValue()">Correct Value</button>
                    <button class="btn btn-primary" onclick="identifyTableStructure()">Mark Table Structure</button>
                </div>
                
                <div class="feedback-form">
                    <h3>📝 Manual Corrections</h3>
                    <label>Add Missing ISIN:</label>
                    <input type="text" id="missingIsin" placeholder="XS1234567890">
                    
                    <label>Security Name:</label>
                    <input type="text" id="securityName" placeholder="Full security name">
                    
                    <label>Market Value (CHF):</label>
                    <input type="number" id="marketValue" placeholder="1234567">
                    
                    <button class="btn btn-success" onclick="addMissingSecurity()">Add Security</button>
                    
                    <h4>📋 Overall Feedback</h4>
                    <textarea id="generalFeedback" rows="4" placeholder="Describe any patterns or issues you noticed that could help improve future extractions..."></textarea>
                    
                    <button class="btn btn-success" onclick="submitAnnotations()">Submit All Annotations</button>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let annotations = {
            documentId: '${annotationData.documentId}',
            corrections: [],
            feedback: '',
            timestamp: new Date().toISOString()
        };
        
        function markMissingSecurity() {
            alert('Click on the PDF to mark where a missing security should be extracted from');
            // Would integrate with PDF viewer to allow clicking/marking
        }
        
        function correctValue() {
            alert('Select a security from the list to correct its value');
            // Would allow editing existing extractions
        }
        
        function identifyTableStructure() {
            alert('Draw rectangles around table headers and data areas');
            // Would allow visual table structure marking
        }
        
        function addMissingSecurity() {
            const isin = document.getElementById('missingIsin').value;
            const name = document.getElementById('securityName').value;
            const value = parseInt(document.getElementById('marketValue').value);
            
            if (isin && name && value) {
                annotations.corrections.push({
                    type: 'missing_security',
                    isin: isin,
                    name: name,
                    value: value,
                    timestamp: new Date().toISOString()
                });
                
                alert('Security added to corrections!');
                // Clear form
                document.getElementById('missingIsin').value = '';
                document.getElementById('securityName').value = '';
                document.getElementById('marketValue').value = '';
            } else {
                alert('Please fill in all fields');
            }
        }
        
        function submitAnnotations() {
            annotations.feedback = document.getElementById('generalFeedback').value;
            
            // Submit to learning system
            fetch('/api/submit-annotations', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(annotations)
            }).then(response => response.json())
              .then(data => {
                  alert('Annotations submitted! Thank you for improving the AI system.');
                  console.log('Submitted annotations:', data);
              });
        }
    </script>
</body>
</html>`;
        
        await fs.writeFile(`annotation_interface_${annotationData.documentId}.html`, html);
        console.log(`✅ Annotation interface created: annotation_interface_${annotationData.documentId}.html`);
    }

    async processHumanAnnotations(annotationData) {
        console.log('🎓 Processing human annotations for learning...');
        
        // Load existing patterns
        let patterns = {};
        try {
            patterns = JSON.parse(await fs.readFile(this.learningPatterns, 'utf8'));
        } catch (error) {
            patterns = { documentFormats: {}, extractionRules: {}, corrections: [] };
        }
        
        // Learn from corrections
        annotationData.corrections.forEach(correction => {
            if (correction.type === 'missing_security') {
                // Learn patterns from missing securities
                patterns.extractionRules.missingPatterns = patterns.extractionRules.missingPatterns || [];
                patterns.extractionRules.missingPatterns.push({
                    isin: correction.isin,
                    pattern: this.extractPattern(correction.name),
                    documentType: annotationData.documentType,
                    confidence: 0.9
                });
            }
            
            if (correction.type === 'value_correction') {
                // Learn about value extraction patterns
                patterns.extractionRules.valuePatterns = patterns.extractionRules.valuePatterns || [];
                patterns.extractionRules.valuePatterns.push({
                    originalValue: correction.originalValue,
                    correctedValue: correction.correctedValue,
                    context: correction.context,
                    documentType: annotationData.documentType
                });
            }
        });
        
        // Update learning database
        await fs.writeFile(this.learningPatterns, JSON.stringify(patterns, null, 2));
        
        // Create enhanced prompt for future extractions
        return this.generateEnhancedPrompt(patterns, annotationData.documentType);
    }

    generateEnhancedPrompt(patterns, documentType) {
        let enhancedInstructions = `ENHANCED EXTRACTION WITH HUMAN LEARNING

Based on human corrections, pay special attention to:

LEARNED PATTERNS FOR ${documentType.toUpperCase()}:
`;
        
        if (patterns.extractionRules.missingPatterns) {
            enhancedInstructions += `
PREVIOUSLY MISSED SECURITIES PATTERNS:
${patterns.extractionRules.missingPatterns.map(p => 
    `- Look for ISINs like ${p.isin} with names containing "${p.pattern}"`
).join('\n')}`;
        }
        
        if (patterns.extractionRules.valuePatterns) {
            enhancedInstructions += `
VALUE EXTRACTION CORRECTIONS:
${patterns.extractionRules.valuePatterns.map(p => 
    `- When extracting values, avoid confusing ${p.originalValue} with ${p.correctedValue}`
).join('\n')}`;
        }
        
        enhancedInstructions += `

HUMAN FEEDBACK SUMMARY:
- Double-check for securities in non-standard sections
- Be more careful with value column identification
- Look for continuation tables across multiple pages
- Pay attention to Swiss number formatting patterns

Apply these learnings to achieve higher accuracy!`;
        
        return enhancedInstructions;
    }

    extractPattern(securityName) {
        // Extract key patterns from security names that might help identify similar securities
        const patterns = [];
        
        if (securityName.includes('NOTES')) patterns.push('NOTES');
        if (securityName.includes('BOND')) patterns.push('BOND');
        if (securityName.includes('%')) patterns.push('PERCENTAGE_RATE');
        if (securityName.match(/\d{4}/)) patterns.push('YEAR_PATTERN');
        
        return patterns.join('|');
    }

    estimateExpectedSecurities(result) {
        // Estimate how many securities should be in a typical portfolio
        if (result.totalValue > 15000000) return 35;
        if (result.totalValue > 10000000) return 25;
        if (result.totalValue > 5000000) return 20;
        return 15;
    }

    async saveAnnotationRequest(data) {
        const filename = `annotation_request_${data.documentId}.json`;
        await fs.writeFile(filename, JSON.stringify(data, null, 2));
        console.log(`✅ Annotation request saved: ${filename}`);
    }

    // Express endpoint for receiving annotation submissions
    createAnnotationEndpoint() {
        return async (req, res) => {
            try {
                const annotations = req.body;
                console.log(`📝 Received annotations for document ${annotations.documentId}`);
                
                // Process the learning
                await this.processHumanAnnotations(annotations);
                
                res.json({
                    success: true,
                    message: 'Annotations processed successfully',
                    learningUpdate: 'AI system updated with your corrections',
                    impact: 'Future extractions will be more accurate'
                });
                
            } catch (error) {
                console.error('❌ Annotation processing error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to process annotations'
                });
            }
        };
    }
}

module.exports = { AnnotationLearningSystem };