/**
 * INTELLIGENT PDF EXTRACTOR - Adaptive to any financial PDF format
 * Uses multiple strategies to understand document structure like Claude
 */

class IntelligentPDFExtractor {
    constructor() {
        // Known patterns for different banks/formats
        this.knownFormats = {
            'messos': {
                name: 'Messos/Corner Bank Format',
                indicators: ['Swift CBLUCH2280A', 'Cornèr Banca', 'MESSOS ENTERPRISES'],
                patterns: {
                    isin: /[A-Z]{2}[A-Z0-9]{10}/g,
                    quantity: /(?:USD|CHF|EUR)\s*(\d{1,3}(?:'?\d{3})*(?:\.\d{2})?)/g,
                    price: /(\d{1,3}(?:\.\d{2,4})?)\s*%/g,
                    swissNumber: /(\d{1,3}(?:'\d{3})+(?:\.\d{2})?)/g
                }
            },
            'ubs': {
                name: 'UBS Format',
                indicators: ['UBS', 'Union Bank of Switzerland'],
                patterns: {
                    isin: /[A-Z]{2}[A-Z0-9]{10}/g,
                    quantity: /(?:Qty|Nominal|Amount)[\s:]*(\d[\d,.']*)/gi,
                    price: /(?:Price|Kurs)[\s:]*(\d[\d,.']*)/gi
                }
            },
            'credit_suisse': {
                name: 'Credit Suisse Format',
                indicators: ['Credit Suisse', 'CS Group'],
                patterns: {
                    isin: /[A-Z]{2}[A-Z0-9]{10}/g,
                    quantity: /(?:Stück|Units|Nominal)[\s:]*(\d[\d,.']*)/gi,
                    price: /(?:Kurs|Course|Price)[\s:]*(\d[\d,.']*)/gi
                }
            }
        };
        
        // Learning patterns from successful extractions
        this.learnedPatterns = [];
    }

    /**
     * STEP 1: Detect document format automatically
     */
    detectFormat(text) {
        console.log('🔍 DETECTING DOCUMENT FORMAT...');
        
        for (const [key, format] of Object.entries(this.knownFormats)) {
            const matchCount = format.indicators.filter(indicator => 
                text.toLowerCase().includes(indicator.toLowerCase())
            ).length;
            
            if (matchCount > 0) {
                console.log(`✅ Detected format: ${format.name}`);
                return key;
            }
        }
        
        console.log('❓ Unknown format - will use adaptive extraction');
        return 'unknown';
    }

    /**
     * STEP 2: Find document structure intelligently
     */
    analyzeDocumentStructure(text) {
        console.log('\n📊 ANALYZING DOCUMENT STRUCTURE...');
        
        const structure = {
            hasTable: false,
            tableIndicators: [],
            valuePatterns: [],
            currencySymbols: [],
            numberFormats: [],
            sections: {}
        };
        
        // Detect table structure
        const tableKeywords = ['nominal', 'quantity', 'price', 'value', 'total', 'währung', 'kurs', 'betrag'];
        tableKeywords.forEach(keyword => {
            if (text.toLowerCase().includes(keyword)) {
                structure.tableIndicators.push(keyword);
                structure.hasTable = true;
            }
        });
        
        // Detect currency patterns
        const currencies = ['USD', 'CHF', 'EUR', 'GBP', 'JPY'];
        currencies.forEach(currency => {
            if (text.includes(currency)) {
                structure.currencySymbols.push(currency);
            }
        });
        
        // Detect number formats
        if (text.match(/\d{1,3}'\d{3}/)) {
            structure.numberFormats.push('swiss'); // 1'234'567
        }
        if (text.match(/\d{1,3},\d{3}/)) {
            structure.numberFormats.push('comma'); // 1,234,567
        }
        if (text.match(/\d{1,3}\.\d{3},\d{2}/)) {
            structure.numberFormats.push('european'); // 1.234.567,89
        }
        
        // Find sections (Portfolio, Summary, etc.)
        const sectionPatterns = [
            /portfolio|holdings|positions/i,
            /summary|zusammenfassung|résumé/i,
            /bonds|obligations|anleihen/i,
            /equities|actions|aktien/i,
            /cash|liquidität|liquidités/i
        ];
        
        sectionPatterns.forEach((pattern, index) => {
            const match = text.match(pattern);
            if (match) {
                structure.sections[match[0].toLowerCase()] = match.index;
            }
        });
        
        console.log('📋 Document structure:', structure);
        return structure;
    }

    /**
     * STEP 3: Extract securities with context understanding
     */
    extractWithContext(text, format = 'unknown') {
        console.log('\n🎯 EXTRACTING WITH CONTEXT UNDERSTANDING...');
        
        const securities = [];
        const lines = text.split(/\n+/);
        
        // Find all ISINs first
        const isinPattern = /[A-Z]{2}[A-Z0-9]{10}/g;
        const isinMatches = [...text.matchAll(isinPattern)];
        
        console.log(`Found ${isinMatches.length} ISINs`);
        
        isinMatches.forEach(match => {
            const isin = match[0];
            const position = match.index;
            
            // Get surrounding context (like I do when analyzing)
            const contextBefore = text.substring(Math.max(0, position - 500), position);
            const contextAfter = text.substring(position, Math.min(text.length, position + 500));
            
            // Extract components based on context
            const security = this.extractSecurityFromContext(isin, contextBefore, contextAfter, format);
            
            if (security) {
                securities.push(security);
            }
        });
        
        return securities;
    }

    /**
     * STEP 4: Extract individual security details from context
     */
    extractSecurityFromContext(isin, before, after, format) {
        const security = {
            isin: isin,
            name: '',
            quantity: null,
            price: null,
            value: null,
            currency: null,
            confidence: 0
        };
        
        // Extract quantity (looking backwards from ISIN)
        const quantityPatterns = [
            /(?:USD|CHF|EUR|GBP)\s*(\d{1,3}(?:[',.]?\d{3})*(?:[.,]\d{2})?)/g,
            /(\d{1,3}(?:[',.]?\d{3})*)\s*(?:units?|stück|pcs)/gi,
            /(?:nominal|quantity|qty)[\s:]*(\d{1,3}(?:[',.]?\d{3})*)/gi
        ];
        
        let bestQuantity = null;
        let highestConfidence = 0;
        
        quantityPatterns.forEach(pattern => {
            const matches = [...before.matchAll(pattern)];
            if (matches.length > 0) {
                const lastMatch = matches[matches.length - 1];
                const value = this.parseNumber(lastMatch[1]);
                
                // Confidence based on proximity to ISIN
                const distance = before.length - lastMatch.index;
                const confidence = Math.max(0, 100 - distance);
                
                if (confidence > highestConfidence) {
                    bestQuantity = value;
                    highestConfidence = confidence;
                    
                    // Extract currency if present
                    const currencyMatch = lastMatch[0].match(/(USD|CHF|EUR|GBP)/);
                    if (currencyMatch) {
                        security.currency = currencyMatch[1];
                    }
                }
            }
        });
        
        security.quantity = bestQuantity;
        
        // Extract price (looking in both directions)
        const pricePatterns = [
            /(\d{1,3}(?:[.,]\d{2,4})?)\s*%/g,
            /(?:price|kurs|cours)[\s:]*(\d{1,3}(?:[.,]\d{2,4})?)/gi,
            /(\d{2,3}[.,]\d{2,4})\s*(?!%)/g  // Prices like 99.54
        ];
        
        const fullContext = before + after;
        pricePatterns.forEach(pattern => {
            const matches = [...fullContext.matchAll(pattern)];
            matches.forEach(match => {
                const value = this.parseNumber(match[1]);
                if (value > 50 && value <= 150) { // Reasonable price range
                    security.price = value;
                }
            });
        });
        
        // Extract name (looking after ISIN)
        const namePatterns = [
            /ISIN:[^/]+\/\/\s*([^/\n]+)/,  // After ISIN marker
            /\n([A-Z][A-Za-z0-9\s&.,%-]+)(?:\n|$)/,  // Next line after ISIN
            /([A-Z][A-Za-z\s&.-]{10,50})\s*$/  // Before ISIN
        ];
        
        namePatterns.forEach(pattern => {
            const match = (pattern.test(after) ? after : before).match(pattern);
            if (match && !security.name) {
                security.name = match[1].trim().replace(/\s+/g, ' ');
            }
        });
        
        // Extract total value if available
        const valuePatterns = [
            /(\d{1,3}(?:[',.]?\d{3})*(?:[.,]\d{2})?)\s*(?:total|value|betrag|montant)/gi,
            /(?:total|value|betrag|montant)[\s:]*(\d{1,3}(?:[',.]?\d{3})*(?:[.,]\d{2})?)/gi
        ];
        
        valuePatterns.forEach(pattern => {
            const match = fullContext.match(pattern);
            if (match) {
                security.value = this.parseNumber(match[1]);
            }
        });
        
        // Calculate value if we have quantity and price but no value
        if (!security.value && security.quantity && security.price) {
            security.value = security.quantity * (security.price / 100);
        }
        
        // Set confidence score
        let confidenceFactors = 0;
        if (security.quantity) confidenceFactors++;
        if (security.price) confidenceFactors++;
        if (security.name && security.name !== '') confidenceFactors++;
        if (security.value) confidenceFactors++;
        if (security.currency) confidenceFactors++;
        
        security.confidence = (confidenceFactors / 5) * 100;
        
        return security;
    }

    /**
     * STEP 5: Parse numbers in various formats
     */
    parseNumber(str) {
        if (!str) return 0;
        
        // Remove spaces
        str = str.replace(/\s/g, '');
        
        // Swiss format: 1'234'567.89 or 1'234'567,89
        if (str.includes("'")) {
            str = str.replace(/'/g, '');
        }
        
        // European format: 1.234.567,89
        if (str.includes('.') && str.includes(',') && str.lastIndexOf(',') > str.lastIndexOf('.')) {
            str = str.replace(/\./g, '').replace(',', '.');
        }
        
        // US format: 1,234,567.89
        else if (str.includes(',') && str.includes('.') && str.lastIndexOf('.') > str.lastIndexOf(',')) {
            str = str.replace(/,/g, '');
        }
        
        // Just commas: 1,234,567
        else if (str.includes(',') && !str.includes('.')) {
            str = str.replace(/,/g, '');
        }
        
        return parseFloat(str) || 0;
    }

    /**
     * STEP 6: Learn from successful extractions
     */
    learnFromExtraction(securities, format) {
        if (securities.length > 0 && format === 'unknown') {
            console.log('📚 LEARNING FROM SUCCESSFUL EXTRACTION...');
            
            // Store successful patterns for future use
            const pattern = {
                timestamp: new Date(),
                securitiesFound: securities.length,
                averageConfidence: securities.reduce((sum, s) => sum + s.confidence, 0) / securities.length,
                format: 'learned_' + Date.now()
            };
            
            this.learnedPatterns.push(pattern);
        }
    }

    /**
     * MAIN EXTRACTION METHOD - Adaptive to any PDF
     */
    async extractFromPDF(pdfText) {
        console.log('🤖 INTELLIGENT PDF EXTRACTION STARTING...\n');
        
        // 1. Detect format
        const format = this.detectFormat(pdfText);
        
        // 2. Analyze structure
        const structure = this.analyzeDocumentStructure(pdfText);
        
        // 3. Extract with context
        const securities = this.extractWithContext(pdfText, format);
        
        // 4. Learn from extraction
        this.learnFromExtraction(securities, format);
        
        // 5. Return enhanced results
        return {
            format: format,
            structure: structure,
            securities: securities,
            summary: {
                totalSecurities: securities.length,
                totalValue: securities.reduce((sum, s) => sum + (s.value || 0), 0),
                averageConfidence: securities.length > 0 
                    ? securities.reduce((sum, s) => sum + s.confidence, 0) / securities.length 
                    : 0,
                currencies: [...new Set(securities.map(s => s.currency).filter(c => c))]
            }
        };
    }
}

// Test with Messos PDF
async function testIntelligentExtraction() {
    const fs = require('fs');
    const pdfParse = require('pdf-parse');
    
    console.log('🧪 TESTING INTELLIGENT EXTRACTION\n');
    
    const pdfPath = './2. Messos  - 31.03.2025.pdf';
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF not found');
        return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    
    const extractor = new IntelligentPDFExtractor();
    const results = await extractor.extractFromPDF(pdfData.text);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 EXTRACTION RESULTS:');
    console.log('='.repeat(80));
    console.log(`Format detected: ${results.format}`);
    console.log(`Securities found: ${results.summary.totalSecurities}`);
    console.log(`Average confidence: ${results.summary.averageConfidence.toFixed(1)}%`);
    console.log(`Currencies: ${results.summary.currencies.join(', ')}`);
    
    console.log('\n📋 FIRST 5 SECURITIES WITH FULL DETAILS:');
    results.securities.slice(0, 5).forEach((sec, i) => {
        console.log(`\n${i + 1}. ${sec.isin}`);
        console.log(`   Name: ${sec.name || 'Not extracted'}`);
        console.log(`   Quantity: ${sec.quantity ? sec.quantity.toLocaleString() : 'Not extracted'}`);
        console.log(`   Price: ${sec.price ? sec.price + '%' : 'Not extracted'}`);
        console.log(`   Value: ${sec.value ? sec.value.toLocaleString() : 'Not extracted'}`);
        console.log(`   Currency: ${sec.currency || 'Not detected'}`);
        console.log(`   Confidence: ${sec.confidence}%`);
    });
}

// Export for use in express server
module.exports = IntelligentPDFExtractor;

// Run test if called directly
if (require.main === module) {
    testIntelligentExtraction().catch(console.error);
}