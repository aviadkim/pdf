#!/usr/bin/env node

/**
 * Fix Smart OCR deployment by creating a hybrid approach
 * that falls back to pdf-parse when GraphicsMagick is not available
 */

const fs = require('fs').promises;
const path = require('path');

async function fixSmartOCRDeployment() {
    console.log('🔧 Fixing Smart OCR deployment for Render...');
    
    // Read the current smart-ocr-learning-system.js
    const smartOCRPath = path.join(__dirname, 'smart-ocr-learning-system.js');
    let content;
    
    try {
        content = await fs.readFile(smartOCRPath, 'utf8');
    } catch (error) {
        console.error('❌ Could not read smart-ocr-learning-system.js:', error.message);
        return;
    }
    
    // Check if already patched
    if (content.includes('// RENDER DEPLOYMENT FIX')) {
        console.log('✅ Smart OCR already patched for Render deployment');
        return;
    }
    
    // Add fallback to pdf-parse at the top
    const pdfParseImport = `const pdfParse = require('pdf-parse');
// RENDER DEPLOYMENT FIX - Fallback to pdf-parse when GraphicsMagick unavailable
`;
    
    // Insert after the existing imports
    const importIndex = content.indexOf("const FormData = require('form-data');");
    if (importIndex === -1) {
        console.error('❌ Could not find import section');
        return;
    }
    
    const insertPoint = content.indexOf('\n', importIndex) + 1;
    content = content.slice(0, insertPoint) + pdfParseImport + content.slice(insertPoint);
    
    // Find the processPDF method and add fallback logic
    const processPDFIndex = content.indexOf('async processPDF(');
    if (processPDFIndex === -1) {
        console.error('❌ Could not find processPDF method');
        return;
    }
    
    // Find the method body
    const methodStart = content.indexOf('{', processPDFIndex);
    const methodContent = `{
        try {
            console.log('🔍 Processing PDF with Smart OCR...');
            
            // RENDER DEPLOYMENT FIX: Try GraphicsMagick first, fallback to pdf-parse
            try {
                // Original GraphicsMagick approach
                const convertOptions = {
                    format: 'png',
                    out_dir: path.join(__dirname, 'temp_annotations'),
                    out_name: \`\${Date.now()}_page\`,
                    page: null
                };

                const convertInstance = pdf2pic.fromBuffer(pdfBuffer, convertOptions);
                const imageResults = await convertInstance.bulk(-1);
                
                // If we get here, GraphicsMagick works
                console.log('✅ Using GraphicsMagick for image conversion');
                return await this.processWithMistralOCR(imageResults, options);
                
            } catch (gmError) {
                console.log('⚠️ GraphicsMagick not available, falling back to pdf-parse');
                console.log('GM Error:', gmError.message);
                
                // Fallback to pdf-parse
                const pdfData = await pdfParse(pdfBuffer);
                const text = pdfData.text;
                
                console.log(\`📄 Extracted \${text.length} characters with pdf-parse\`);
                
                // Apply pattern-based extraction
                const securities = this.extractSecuritiesFromText(text);
                
                return {
                    success: true,
                    method: 'smart-ocr-fallback',
                    accuracy: this.calculateTextAccuracy(securities),
                    securities: securities,
                    text_length: text.length,
                    fallback_used: true,
                    message: 'Used pdf-parse fallback due to missing GraphicsMagick'
                };
            }
            
        } catch (error) {
            console.error('Smart OCR processing error:', error);
            throw error;
        }
    }
    
    // Add helper method for text-based extraction
    extractSecuritiesFromText(text) {
        const securities = [];
        const lines = text.split('\\n');
        
        // ISIN pattern matching
        const isinPattern = /[A-Z]{2}[0-9A-Z]{9}[0-9]/g;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const isins = line.match(isinPattern);
            
            if (isins) {
                for (const isin of isins) {
                    // Look for nearby values
                    const value = this.findNearbyValue(lines, i);
                    
                    securities.push({
                        isin: isin,
                        value: value || 0,
                        confidence: 85,
                        line_number: i + 1,
                        source_line: line.trim(),
                        method: 'text-extraction'
                    });
                }
            }
        }
        
        return securities;
    }
    
    findNearbyValue(lines, lineIndex) {
        // Search current line and nearby lines for values
        const searchRange = 2;
        const valuePattern = /(\\d{1,3}(?:'\\d{3})*|\\d+)(?:\\.\\d{2})?/g;
        
        for (let i = Math.max(0, lineIndex - searchRange); 
             i <= Math.min(lines.length - 1, lineIndex + searchRange); 
             i++) {
            const line = lines[i];
            const matches = line.match(valuePattern);
            
            if (matches) {
                for (const match of matches) {
                    const cleanValue = match.replace(/'/g, '');
                    const numValue = parseFloat(cleanValue);
                    
                    // Filter reasonable values
                    if (numValue >= 1000 && numValue <= 50000000) {
                        return numValue;
                    }
                }
            }
        }
        
        return null;
    }
    
    calculateTextAccuracy(securities) {
        if (securities.length === 0) return 0;
        
        // Base accuracy on number of securities found and confidence
        const avgConfidence = securities.reduce((sum, sec) => sum + sec.confidence, 0) / securities.length;
        const completeness = Math.min(securities.length / 20, 1) * 100;
        
        return Math.round((avgConfidence * 0.7 + completeness * 0.3));`;
    
    // Replace the method body
    const methodEnd = content.indexOf('\n    }', methodStart);
    if (methodEnd === -1) {
        console.error('❌ Could not find method end');
        return;
    }
    
    const beforeMethod = content.slice(0, methodStart);
    const afterMethod = content.slice(methodEnd + 6); // Skip past the closing brace
    
    const patchedContent = beforeMethod + methodContent + afterMethod;
    
    // Write the patched file
    try {
        await fs.writeFile(smartOCRPath, patchedContent);
        console.log('✅ Smart OCR patched with Render deployment fix');
        console.log('📋 Changes made:');
        console.log('   - Added pdf-parse fallback for GraphicsMagick');
        console.log('   - Added text-based security extraction');
        console.log('   - Added value parsing for Swiss format');
        console.log('   - Graceful degradation when GM unavailable');
        
    } catch (error) {
        console.error('❌ Could not write patched file:', error.message);
    }
}

if (require.main === module) {
    fixSmartOCRDeployment().catch(console.error);
}

module.exports = { fixSmartOCRDeployment };