/**
 * Real Example Demo - How the Extraction Works
 * Shows step-by-step how the system processes a PDF
 */

const fs = require('fs');
const pdf = require('pdf-parse');

class ExtractionExampleDemo {
    constructor() {
        this.patterns = {
            isin: /\b[A-Z]{2}[A-Z0-9]{10}\b/g,
            swissAmount: /\b\d{1,3}(?:'\d{3})*(?:\.\d{2})?\b/g,
            summaryIndicators: [
                /\bTotal\s+portfolio\b/gi,
                /\bPortfolio\s+total\b/gi,
                /\bSummary\b/gi,
                /\bGrand\s+total\b/gi
            ]
        };
    }

    /**
     * Demonstrate the extraction process
     */
    async demonstrateExtraction(pdfBuffer) {
        console.log('📖 REAL EXAMPLE: HOW PDF EXTRACTION WORKS');
        console.log('========================================\n');
        
        const data = await pdf(pdfBuffer);
        const text = data.text;
        
        // Step 1: Show sample of raw text
        console.log('STEP 1: RAW PDF TEXT (first 500 chars)');
        console.log('---------------------------------------');
        console.log(text.substring(0, 500));
        console.log('...\n');
        
        // Step 2: Show how we find ISINs
        console.log('STEP 2: FINDING ISINs');
        console.log('---------------------');
        const isins = [...text.matchAll(this.patterns.isin)];
        console.log(`Found ${isins.length} ISINs in the document\n`);
        
        // Show first 3 ISINs with context
        for (let i = 0; i < Math.min(3, isins.length); i++) {
            const match = isins[i];
            const isin = match[0];
            const position = match.index;
            
            console.log(`\n📍 ISIN #${i + 1}: ${isin} at position ${position}`);
            
            // Show context around ISIN
            const contextStart = Math.max(0, position - 100);
            const contextEnd = Math.min(text.length, position + 100);
            const context = text.substring(contextStart, contextEnd);
            
            console.log('Context:');
            console.log('...' + context.replace(/\n/g, ' ') + '...');
            
            // Show how we extract value
            console.log('\nExtracting value:');
            const values = this.findValuesInContext(context, isin);
            if (values.length > 0) {
                console.log(`Found ${values.length} potential values:`);
                values.forEach(v => console.log(`  - ${v.value.toLocaleString()} (confidence: ${v.confidence})`));
                console.log(`Selected: ${values[0].value.toLocaleString()}`);
            } else {
                console.log('No values found in context');
            }
        }
        
        // Step 3: Show summary detection
        console.log('\n\nSTEP 3: DETECTING SUMMARY SECTIONS');
        console.log('-----------------------------------');
        
        for (const pattern of this.patterns.summaryIndicators) {
            const matches = [...text.matchAll(pattern)];
            if (matches.length > 0) {
                console.log(`\n📊 Found "${matches[0][0]}" at positions:`);
                matches.slice(0, 3).forEach(m => {
                    const start = Math.max(0, m.index - 50);
                    const end = Math.min(text.length, m.index + 50);
                    const context = text.substring(start, end);
                    console.log(`  Position ${m.index}: ...${context.replace(/\n/g, ' ')}...`);
                });
            }
        }
        
        // Step 4: Show duplicate prevention
        console.log('\n\nSTEP 4: DUPLICATE PREVENTION');
        console.log('-----------------------------');
        console.log('When we find a security in multiple places:');
        console.log('1. If it\'s in a holdings section → INCLUDE IT');
        console.log('2. If it\'s in a summary section → EXCLUDE IT');
        console.log('3. If value appears multiple times → TAKE ONLY ONCE');
        
        // Step 5: Show final extraction
        console.log('\n\nSTEP 5: FINAL EXTRACTION PROCESS');
        console.log('---------------------------------');
        
        const results = await this.performExtraction(text);
        
        console.log(`\n✅ EXTRACTION COMPLETE:`);
        console.log(`   Total ISINs found: ${results.totalISINs}`);
        console.log(`   Securities extracted: ${results.securities.length}`);
        console.log(`   Total value: CHF ${results.totalValue.toLocaleString()}`);
        console.log(`   Target value: CHF 19,464,431`);
        console.log(`   Accuracy: ${((results.totalValue / 19464431) * 100).toFixed(2)}%`);
        
        return results;
    }

    /**
     * Find values in context
     */
    findValuesInContext(context, isin) {
        const values = [];
        const matches = context.match(this.patterns.swissAmount) || [];
        
        for (const match of matches) {
            const value = parseFloat(match.replace(/'/g, ''));
            if (!isNaN(value) && value >= 1000 && value <= 50000000) {
                const confidence = this.calculateConfidence(context, match, isin);
                values.push({ value, confidence });
            }
        }
        
        return values.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Calculate confidence
     */
    calculateConfidence(context, valueMatch, isin) {
        let confidence = 0.5;
        
        // Position relative to ISIN
        const valueIndex = context.indexOf(valueMatch);
        const isinIndex = context.indexOf(isin);
        const distance = Math.abs(valueIndex - isinIndex);
        
        if (distance < 30) confidence += 0.3;
        else if (distance < 60) confidence += 0.2;
        else if (distance < 100) confidence += 0.1;
        
        // Context clues
        if (context.includes('CHF') || context.includes('USD')) confidence += 0.1;
        if (context.includes('Market') || context.includes('Value')) confidence += 0.1;
        
        return Math.min(1, confidence);
    }

    /**
     * Perform extraction
     */
    async performExtraction(text) {
        const allISINs = [...text.matchAll(this.patterns.isin)];
        const uniqueISINs = [...new Set(allISINs.map(m => m[0]))];
        const securities = [];
        
        for (const isin of uniqueISINs) {
            const position = text.indexOf(isin);
            const contextStart = Math.max(0, position - 300);
            const contextEnd = Math.min(text.length, position + 300);
            const context = text.substring(contextStart, contextEnd);
            
            // Skip if in summary section
            let inSummary = false;
            for (const pattern of this.patterns.summaryIndicators) {
                if (pattern.test(context)) {
                    inSummary = true;
                    break;
                }
            }
            
            if (!inSummary) {
                const values = this.findValuesInContext(context, isin);
                securities.push({
                    isin: isin,
                    value: values.length > 0 ? values[0].value : 0
                });
            }
        }
        
        const totalValue = securities.reduce((sum, s) => sum + s.value, 0);
        
        return {
            totalISINs: allISINs.length,
            uniqueISINs: uniqueISINs.length,
            securities: securities,
            totalValue: totalValue
        };
    }
}

// Run demo
async function runDemo() {
    const demo = new ExtractionExampleDemo();
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF not found');
        return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    await demo.demonstrateExtraction(pdfBuffer);
}

if (require.main === module) {
    runDemo();
}