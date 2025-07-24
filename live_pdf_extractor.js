/**
 * Live PDF Extractor - NO HARDCODED VALUES
 * This is the real, dynamic extraction system
 */

const fs = require('fs');
const pdf = require('pdf-parse');

class LivePDFExtractor {
    constructor() {
        // NO hardcoded values - pure dynamic extraction
        this.isinPattern = /\b[A-Z]{2}[A-Z0-9]{10}\b/g;
        this.swissNumberPattern = /\d{1,3}(?:'\d{3})*(?:\.\d{2})?/g;
        this.standardNumberPattern = /\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g;
    }

    /**
     * Extract securities from PDF without any hardcoded values
     */
    async extractSecurities(pdfBuffer) {
        console.log('🔍 LIVE PDF EXTRACTION - NO HARDCODED VALUES');
        console.log('=' * 50);
        
        try {
            const data = await pdf(pdfBuffer);
            const fullText = data.text;
            
            console.log(`📄 PDF text length: ${fullText.length} characters`);
            
            // Step 1: Find all ISINs dynamically
            const isins = this.findISINs(fullText);
            console.log(`📋 Found ${isins.length} ISINs: ${isins.join(', ')}`);
            
            // Step 2: Extract values for each ISIN
            const securities = [];
            for (const isin of isins) {
                const security = this.extractSecurityData(isin, fullText);
                if (security) {
                    securities.push(security);
                    console.log(`✅ ${isin}: ${security.marketValue ? security.marketValue.toLocaleString() : 'NO VALUE'} CHF`);
                }
            }
            
            // Step 3: Calculate total
            const totalValue = securities.reduce((sum, s) => sum + (s.marketValue || 0), 0);
            
            console.log(`\n📊 LIVE EXTRACTION RESULTS:`);
            console.log(`   Securities processed: ${securities.length}`);
            console.log(`   Total value: CHF ${totalValue.toLocaleString()}`);
            
            return {
                success: true,
                securities: securities,
                totalValue: totalValue,
                method: 'live_dynamic_extraction'
            };
            
        } catch (error) {
            console.error('❌ Live extraction failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Find all ISINs in the text
     */
    findISINs(text) {
        const matches = text.match(this.isinPattern) || [];
        return [...new Set(matches)]; // Remove duplicates
    }

    /**
     * Extract security data for a specific ISIN
     */
    extractSecurityData(isin, fullText) {
        // Find the context around this ISIN
        const isinIndex = fullText.indexOf(isin);
        if (isinIndex === -1) return null;

        // Extract surrounding context (500 chars before and after)
        const contextStart = Math.max(0, isinIndex - 500);
        const contextEnd = Math.min(fullText.length, isinIndex + 500);
        const context = fullText.substring(contextStart, contextEnd);

        // Extract name (text before ISIN)
        const name = this.extractName(context, isin);

        // Extract value from context
        const value = this.extractValue(context, isin);

        return {
            isin: isin,
            name: name,
            marketValue: value,
            context: context.substring(0, 100) + '...',
            extractionMethod: 'live_dynamic'
        };
    }

    /**
     * Extract security name
     */
    extractName(context, isin) {
        const isinIndex = context.indexOf(isin);
        if (isinIndex === -1) return 'Unknown';

        const beforeISIN = context.substring(0, isinIndex);
        
        // Look for company/bond name patterns
        const namePatterns = [
            /([A-Z][A-Z\s&.,-]+(?:BANK|CORP|INC|LTD|SA|AG|NOTES|BONDS))/i,
            /([A-Z][A-Z\s&.,-]{10,50})/i
        ];

        for (const pattern of namePatterns) {
            const matches = beforeISIN.match(pattern);
            if (matches) {
                return matches[1].trim().substring(0, 50);
            }
        }

        // Fallback: last meaningful text
        const words = beforeISIN.split(/\s+/).filter(w => w.length > 2);
        return words.slice(-5).join(' ').substring(0, 50);
    }

    /**
     * Extract market value from context
     */
    extractValue(context, isin) {
        const candidates = [];

        // Method 1: Swiss format numbers (1'234'567.89)
        const swissMatches = context.match(this.swissNumberPattern) || [];
        for (const match of swissMatches) {
            const value = parseFloat(match.replace(/'/g, ''));
            if (!isNaN(value) && value >= 1000 && value <= 50000000) {
                candidates.push(value);
            }
        }

        // Method 2: Standard format numbers (1,234,567.89)
        const standardMatches = context.match(this.standardNumberPattern) || [];
        for (const match of standardMatches) {
            const value = parseFloat(match.replace(/,/g, ''));
            if (!isNaN(value) && value >= 1000 && value <= 50000000) {
                candidates.push(value);
            }
        }

        // Method 3: Look for contextual patterns
        const contextPatterns = [
            /(?:Value|Amount|Total|Market|Price)[\s:]*(\d+['.,]\d+)/gi,
            /(\d+['.,]\d+)[\s]*(?:CHF|USD|EUR)/gi,
            /Countervalue[\s]*USD[\s]*(\d+['.,]\d+)/gi
        ];

        for (const pattern of contextPatterns) {
            const matches = context.match(pattern) || [];
            for (const match of matches) {
                const numbers = match.match(/\d+['.,]\d+/g) || [];
                for (const num of numbers) {
                    const value = parseFloat(num.replace(/[',]/g, ''));
                    if (!isNaN(value) && value >= 1000 && value <= 50000000) {
                        candidates.push(value);
                    }
                }
            }
        }

        // Select best candidate
        if (candidates.length === 0) return null;
        if (candidates.length === 1) return candidates[0];

        // Use the largest reasonable value (often market value)
        const sorted = candidates.sort((a, b) => b - a);
        return sorted[0];
    }

    /**
     * Process any PDF file
     */
    async processPDF(pdfPath) {
        if (!fs.existsSync(pdfPath)) {
            console.log(`❌ PDF file not found: ${pdfPath}`);
            return { success: false, error: 'File not found' };
        }

        console.log(`🔄 Processing PDF: ${pdfPath}`);
        const pdfBuffer = fs.readFileSync(pdfPath);
        
        const results = await this.extractSecurities(pdfBuffer);
        
        if (results.success) {
            // Save results with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const resultsFile = `live_extraction_${timestamp}.json`;
            fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
            console.log(`💾 Results saved to: ${resultsFile}`);
        }
        
        return results;
    }
}

// Test with any PDF
async function testLiveExtraction() {
    console.log('🚀 LIVE PDF EXTRACTION TEST');
    console.log('This is the REAL system - no hardcoded values!');
    console.log('=' * 60);
    
    const extractor = new LivePDFExtractor();
    
    // Test with Messos PDF
    const messosPDF = '2. Messos  - 31.03.2025.pdf';
    if (fs.existsSync(messosPDF)) {
        console.log('\n📄 Testing with Messos PDF:');
        const results = await extractor.processPDF(messosPDF);
        
        if (results.success) {
            console.log(`\n🎯 LIVE RESULTS:`);
            console.log(`   Securities found: ${results.securities.length}`);
            console.log(`   Total value: CHF ${results.totalValue.toLocaleString()}`);
            console.log(`   Method: ${results.method}`);
            
            // Show some examples
            console.log(`\n💰 Sample securities extracted:`);
            results.securities.slice(0, 5).forEach(sec => {
                console.log(`   ${sec.isin}: ${sec.marketValue ? sec.marketValue.toLocaleString() : 'NO VALUE'} CHF - ${sec.name}`);
            });
        }
    } else {
        console.log(`❌ Messos PDF not found for testing`);
    }
    
    console.log('\n📋 READY FOR ANY PDF:');
    console.log('   To test with your PDF, place it in this directory and run:');
    console.log('   node live_pdf_extractor.js your-pdf-file.pdf');
}

// Command line usage
if (require.main === module) {
    const pdfFile = process.argv[2];
    
    if (pdfFile) {
        // Process specific PDF file
        const extractor = new LivePDFExtractor();
        extractor.processPDF(pdfFile).then(results => {
            if (results.success) {
                console.log('\n✅ SUCCESS: PDF processed successfully!');
                console.log(`Securities found: ${results.securities.length}`);
                console.log(`Total value: CHF ${results.totalValue.toLocaleString()}`);
            } else {
                console.log('\n❌ FAILED: PDF processing failed');
                console.log(`Error: ${results.error}`);
            }
        });
    } else {
        // Run test
        testLiveExtraction();
    }
}

module.exports = { LivePDFExtractor };