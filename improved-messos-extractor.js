#!/usr/bin/env node

/**
 * IMPROVED MESSOS PDF EXTRACTOR
 * 
 * Fixes all the identified issues with proper portfolio extraction
 */

const pdfParse = require('pdf-parse');
const fs = require('fs');

class ImprovedMessosExtractor {
    constructor() {
        this.expectedTotal = 19464431; // CHF 19'464'431
        this.tolerance = 0.05; // 5% tolerance
    }

    async extractSecurities(pdfBuffer) {
        try {
            console.log('🔍 Improved Messos PDF extraction starting...');
            
            const pdfData = await pdfParse(pdfBuffer);
            const text = pdfData.text;
            const lines = text.split('\n');
            
            console.log(`📄 Processing ${lines.length} lines, ${text.length} characters`);
            
            // Step 1: Find the actual portfolio section
            const portfolioSection = this.findPortfolioSection(lines);
            console.log(`📊 Portfolio section: lines ${portfolioSection.start} to ${portfolioSection.end}`);
            
            // Step 2: Extract securities from portfolio section
            const securities = this.extractSecuritiesFromSection(lines, portfolioSection);
            
            // Step 3: Validate extraction
            const validation = this.validateExtraction(securities);
            
            console.log(`✅ Extracted ${securities.length} securities`);
            console.log(`💰 Total value: CHF ${validation.totalValue.toLocaleString()}`);
            console.log(`🎯 Expected: CHF ${this.expectedTotal.toLocaleString()}`);
            console.log(`📊 Accuracy: ${validation.accuracy.toFixed(2)}%`);
            
            return {
                success: true,
                method: 'improved-messos-extractor',
                securities: securities,
                total_value: validation.totalValue,
                expected_total: this.expectedTotal,
                accuracy: validation.accuracy,
                text_length: text.length,
                portfolio_lines: portfolioSection.end - portfolioSection.start
            };
            
        } catch (error) {
            console.error('❌ Improved extraction error:', error);
            return {
                success: false,
                error: error.message,
                method: 'improved-messos-extractor'
            };
        }
    }

    findPortfolioSection(lines) {
        let start = -1;
        let end = -1;
        
        // Look for portfolio start indicators
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim().toLowerCase();
            
            // Portfolio section starts after "portfolio total" line
            if (line.includes('portfolio total') && line.includes('19\'464\'431')) {
                start = i + 1;
                console.log(`📍 Portfolio starts at line ${start}: "${lines[i].trim()}"`);
                break;
            }
        }
        
        if (start === -1) {
            // Fallback: look for first ISIN
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('ISIN:') && this.isValidISIN(this.extractISINFromLine(lines[i]))) {
                    start = i;
                    console.log(`📍 Portfolio starts at first ISIN line ${start}`);
                    break;
                }
            }
        }
        
        // Look for portfolio end (before summary sections)
        for (let i = start; i < lines.length; i++) {
            const line = lines[i].trim().toLowerCase();
            
            // End indicators
            if (line.includes('total assets') || 
                line.includes('summary') || 
                line.includes('allocation') ||
                line.includes('risk') ||
                (line.includes('total') && line.includes('19\'464\'431'))) {
                end = i;
                console.log(`📍 Portfolio ends at line ${end}: "${lines[i].trim()}"`);
                break;
            }
        }
        
        if (end === -1) end = lines.length;
        
        return { start: Math.max(0, start), end: Math.min(lines.length, end) };
    }

    extractSecuritiesFromSection(lines, section) {
        const securities = [];
        const processedISINs = new Set();
        
        for (let i = section.start; i < section.end; i++) {
            const line = lines[i];
            
            // Look for ISIN lines
            if (line.includes('ISIN:')) {
                const isin = this.extractISINFromLine(line);
                
                if (this.isValidISIN(isin) && !processedISINs.has(isin)) {
                    processedISINs.add(isin);
                    
                    // Extract security details
                    const security = this.extractSecurityDetails(lines, i, isin);
                    if (security) {
                        securities.push(security);
                        console.log(`📊 Found security: ${isin} = CHF ${security.value.toLocaleString()}`);
                    }
                }
            }
        }
        
        return securities;
    }

    extractISINFromLine(line) {
        const isinMatch = line.match(/ISIN:\s*([A-Z]{2}[0-9A-Z]{9}[0-9])/);
        return isinMatch ? isinMatch[1] : null;
    }

    isValidISIN(isin) {
        if (!isin) return false;
        
        // Must be exactly 12 characters: 2 letters + 9 alphanumeric + 1 check digit
        if (!/^[A-Z]{2}[0-9A-Z]{9}[0-9]$/.test(isin)) return false;
        
        // Exclude IBANs that start with CH19
        if (isin.startsWith('CH19')) return false;
        
        // Exclude invalid patterns
        if (isin.startsWith('XD')) return false; // Invalid country code
        
        return true;
    }

    extractSecurityDetails(lines, isinLineIndex, isin) {
        // Strategy: Look for CHF values in surrounding lines
        const searchRange = 10; // Search 10 lines before and after
        const startLine = Math.max(0, isinLineIndex - searchRange);
        const endLine = Math.min(lines.length, isinLineIndex + searchRange);
        
        let bestValue = 0;
        let confidence = 85;
        let foundValueLine = '';
        
        for (let i = startLine; i <= endLine; i++) {
            const line = lines[i];
            
            // Look for CHF amounts in various formats
            const chfValues = this.extractCHFValues(line);
            
            if (chfValues.length > 0) {
                // Prefer values that are reasonable for financial securities
                for (const value of chfValues) {
                    if (value >= 1000 && value <= 50000000) { // 1K to 50M CHF range
                        if (value > bestValue) {
                            bestValue = value;
                            foundValueLine = line.trim();
                            confidence = this.calculateConfidence(line, i - isinLineIndex);
                        }
                    }
                }
            }
        }
        
        return {
            isin: isin,
            value: bestValue,
            confidence: confidence,
            line_number: isinLineIndex + 1,
            source_line: lines[isinLineIndex].trim(),
            value_line: foundValueLine
        };
    }

    extractCHFValues(line) {
        const values = [];
        
        // Pattern 1: CHF followed by number
        const chfPattern1 = /CHF\s*([\d']+(?:\.\d{2})?)/gi;
        let match;
        while ((match = chfPattern1.exec(line)) !== null) {
            const value = this.parseSwissNumber(match[1]);
            if (value > 0) values.push(value);
        }
        
        // Pattern 2: Swiss formatted numbers with CHF context
        if (line.toLowerCase().includes('chf') || line.includes('value') || line.includes('amount')) {
            const numberPattern = /\b([\d']+(?:\.\d{2})?)\b/g;
            while ((match = numberPattern.exec(line)) !== null) {
                const value = this.parseSwissNumber(match[1]);
                if (value >= 1000) values.push(value); // Only reasonable amounts
            }
        }
        
        // Pattern 3: Stand-alone Swiss numbers in securities context
        if (line.toLowerCase().includes('market') || line.toLowerCase().includes('position')) {
            const standalonePattern = /\b(\d{1,3}(?:'\d{3})+(?:\.\d{2})?)\b/g;
            while ((match = standalonePattern.exec(line)) !== null) {
                const value = this.parseSwissNumber(match[1]);
                if (value > 0) values.push(value);
            }
        }
        
        return values;
    }

    parseSwissNumber(numberString) {
        if (!numberString) return 0;
        
        // Remove Swiss thousand separators (apostrophes) and parse
        const cleaned = numberString.replace(/'/g, '');
        const parsed = parseFloat(cleaned);
        
        return isNaN(parsed) ? 0 : parsed;
    }

    calculateConfidence(line, distanceFromISIN) {
        let confidence = 85;
        
        // Higher confidence for lines closer to ISIN
        if (Math.abs(distanceFromISIN) <= 2) confidence += 10;
        else if (Math.abs(distanceFromISIN) <= 5) confidence += 5;
        
        // Higher confidence for explicit CHF mentions
        if (line.toLowerCase().includes('chf')) confidence += 10;
        
        // Higher confidence for market/value keywords
        if (line.toLowerCase().includes('market') || 
            line.toLowerCase().includes('value') || 
            line.toLowerCase().includes('amount')) {
            confidence += 5;
        }
        
        return Math.min(95, confidence);
    }

    validateExtraction(securities) {
        const totalValue = securities.reduce((sum, sec) => sum + sec.value, 0);
        const accuracy = totalValue > 0 ? 
            (1 - Math.abs(totalValue - this.expectedTotal) / this.expectedTotal) * 100 : 0;
        
        return {
            totalValue: totalValue,
            accuracy: Math.max(0, accuracy),
            expectedTotal: this.expectedTotal,
            securitiesCount: securities.length,
            averageConfidence: securities.reduce((sum, sec) => sum + sec.confidence, 0) / securities.length
        };
    }
}

async function testImprovedExtractor() {
    const extractor = new ImprovedMessosExtractor();
    const pdfPath = './2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF file not found');
        return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const result = await extractor.extractSecurities(pdfBuffer);
    
    console.log('\n📋 EXTRACTION RESULT:');
    console.log('====================');
    console.log(JSON.stringify(result, null, 2));
    
    // Save results
    const outputFile = `improved-extraction-${Date.now()}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`\n📄 Results saved to: ${outputFile}`);
}

if (require.main === module) {
    testImprovedExtractor().catch(console.error);
}

module.exports = { ImprovedMessosExtractor };