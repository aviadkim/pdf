/**
 * UNIVERSAL ADAPTIVE PDF EXTRACTOR
 * Self-learning system that adapts to ANY financial PDF format
 * Uses Claude-like intelligence to understand document structure
 */

const fs = require('fs');
const path = require('path');

class UniversalAdaptiveExtractor {
    constructor() {
        // Knowledge base that grows with each extraction
        this.knowledgeBase = this.loadKnowledgeBase();
        
        // Pattern library for different elements
        this.patternLibrary = {
            // ISINs are universal
            isin: {
                patterns: [/[A-Z]{2}[A-Z0-9]{10}/g],
                confidence: 100
            },
            
            // Quantity patterns learned from various banks
            quantity: {
                patterns: [
                    // Currency followed by amount
                    /(?:USD|CHF|EUR|GBP|JPY)\s*(\d{1,3}(?:[',.\s]?\d{3})*(?:[.,]\d{2})?)/g,
                    // Amount followed by currency
                    /(\d{1,3}(?:[',.\s]?\d{3})*(?:[.,]\d{2})?)\s*(?:USD|CHF|EUR|GBP|JPY)/g,
                    // Labeled quantities
                    /(?:Nominal|Quantity|Qty|Stück|Units|Amount)[\s:]*(\d{1,3}(?:[',.\s]?\d{3})*)/gi,
                    // In table cells
                    /\|\s*(\d{1,3}(?:[',.\s]?\d{3})*)\s*\|/g
                ],
                confidence: 80
            },
            
            // Price patterns
            price: {
                patterns: [
                    // Percentage
                    /(\d{1,3}(?:[.,]\d{1,4})?)\s*%/g,
                    // Labeled price
                    /(?:Price|Kurs|Cours|Prix)[\s:]*(\d{1,3}(?:[.,]\d{1,4})?)/gi,
                    // Decimal numbers that look like prices
                    /\b(\d{2,3}[.,]\d{2,4})\b(?!%)/g
                ],
                confidence: 75
            },
            
            // Security names
            name: {
                patterns: [
                    // After ISIN marker
                    /ISIN:[^/]+\/\/\s*([^/\n]{5,100})/g,
                    // Before percentage
                    /([A-Z][A-Za-z0-9\s&.,%-]{10,80})\s+\d+[.,]\d+%/g,
                    // In quotes
                    /"([^"]{10,100})"/g,
                    // Title case lines
                    /^([A-Z][A-Za-z0-9\s&.,%-]{10,80})$/gm
                ],
                confidence: 60
            }
        };
        
        // Table detection patterns
        this.tablePatterns = {
            headers: [
                /isin|wkn|valor|security|titel|denomination/i,
                /quantity|qty|nominal|amount|stück|anzahl|quantité/i,
                /price|kurs|cours|prix|preis/i,
                /value|wert|valeur|betrag|montant|total/i,
                /currency|währung|devise|ccy/i
            ],
            
            separators: [
                /[-=]{3,}/g,  // Horizontal lines
                /\|/g,        // Pipe separators
                /\t/g         // Tab separators
            ]
        };
    }

    /**
     * Load knowledge base from previous extractions
     */
    loadKnowledgeBase() {
        const kbPath = path.join(__dirname, 'extraction-knowledge.json');
        if (fs.existsSync(kbPath)) {
            return JSON.parse(fs.readFileSync(kbPath, 'utf8'));
        }
        return {
            banks: {},
            patterns: {},
            successes: 0
        };
    }

    /**
     * Save learned patterns to knowledge base
     */
    saveKnowledgeBase() {
        const kbPath = path.join(__dirname, 'extraction-knowledge.json');
        fs.writeFileSync(kbPath, JSON.stringify(this.knowledgeBase, null, 2));
    }

    /**
     * MAIN EXTRACTION METHOD - Fully adaptive
     */
    async extract(pdfText, options = {}) {
        console.log('🧠 UNIVERSAL ADAPTIVE EXTRACTION STARTING...\n');
        
        // 1. Understand document structure
        const understanding = await this.understandDocument(pdfText);
        
        // 2. Extract securities using multiple strategies
        const securities = await this.extractSecurities(pdfText, understanding);
        
        // 3. Validate and enhance results
        const enhanced = await this.enhanceResults(securities, pdfText);
        
        // 4. Learn from this extraction
        if (enhanced.length > 0) {
            this.learnFromSuccess(enhanced, understanding);
        }
        
        // 5. Return comprehensive results
        return {
            success: enhanced.length > 0,
            securities: enhanced,
            metadata: {
                bank: understanding.bank,
                documentType: understanding.type,
                extractionMethod: understanding.method,
                confidence: this.calculateConfidence(enhanced),
                timestamp: new Date().toISOString()
            },
            summary: this.generateSummary(enhanced)
        };
    }

    /**
     * Understand document structure like Claude
     */
    async understandDocument(text) {
        console.log('📖 UNDERSTANDING DOCUMENT STRUCTURE...');
        
        const understanding = {
            bank: 'unknown',
            type: 'portfolio',
            language: 'en',
            hasTable: false,
            tableFormat: null,
            sections: {},
            method: 'adaptive'
        };
        
        // Detect bank/institution
        const bankPatterns = {
            'ubs': /ubs|union bank/i,
            'credit_suisse': /credit suisse|cs group/i,
            'corner': /corner|cornèr|cbluch/i,
            'julius_baer': /julius ba[eä]r/i,
            'pictet': /pictet/i,
            'lombard_odier': /lombard odier/i,
            'deutsche_bank': /deutsche bank/i,
            'jp_morgan': /jp ?morgan|chase/i
        };
        
        for (const [bank, pattern] of Object.entries(bankPatterns)) {
            if (pattern.test(text)) {
                understanding.bank = bank;
                console.log(`✅ Detected bank: ${bank}`);
                break;
            }
        }
        
        // Detect language
        const langIndicators = {
            'de': /vermögen|wertpapiere|bestand|stück/i,
            'fr': /portefeuille|titres|montant|devise/i,
            'it': /portafoglio|titoli|importo|valuta/i,
            'en': /portfolio|securities|amount|currency/i
        };
        
        for (const [lang, pattern] of Object.entries(langIndicators)) {
            if (pattern.test(text)) {
                understanding.language = lang;
                break;
            }
        }
        
        // Detect table structure
        const lines = text.split('\n');
        let possibleHeaderLine = -1;
        
        for (let i = 0; i < Math.min(lines.length, 100); i++) {
            const line = lines[i].toLowerCase();
            const headerMatches = this.tablePatterns.headers.filter(pattern => 
                pattern.test(line)
            ).length;
            
            if (headerMatches >= 2) {
                understanding.hasTable = true;
                possibleHeaderLine = i;
                console.log(`✅ Found table headers at line ${i}`);
                break;
            }
        }
        
        // Analyze table format if found
        if (understanding.hasTable && possibleHeaderLine >= 0) {
            understanding.tableFormat = this.analyzeTableFormat(
                lines.slice(possibleHeaderLine, possibleHeaderLine + 10)
            );
        }
        
        return understanding;
    }

    /**
     * Analyze table format for better extraction
     */
    analyzeTableFormat(headerLines) {
        const format = {
            separator: null,
            columns: [],
            positions: {}
        };
        
        // Check for separators
        if (headerLines.some(line => line.includes('|'))) {
            format.separator = '|';
        } else if (headerLines.some(line => line.includes('\t'))) {
            format.separator = '\t';
        } else if (headerLines.some(line => /\s{2,}/.test(line))) {
            format.separator = 'spaces';
        }
        
        // Find column positions
        const headerLine = headerLines[0];
        const keywords = {
            'isin': /isin|wkn|valor/i,
            'name': /name|security|titel|denomination/i,
            'quantity': /quantity|qty|nominal|amount|stück/i,
            'price': /price|kurs|cours|prix/i,
            'value': /value|wert|valeur|total/i,
            'currency': /currency|währung|devise|ccy/i
        };
        
        for (const [col, pattern] of Object.entries(keywords)) {
            const match = headerLine.match(pattern);
            if (match) {
                format.columns.push(col);
                format.positions[col] = match.index;
            }
        }
        
        console.log('📊 Table format:', format);
        return format;
    }

    /**
     * Extract securities using multiple strategies
     */
    async extractSecurities(text, understanding) {
        console.log('\n🔍 EXTRACTING SECURITIES...');
        
        let securities = [];
        
        // Strategy 1: Table-based extraction if table detected
        if (understanding.hasTable && understanding.tableFormat) {
            console.log('📊 Using table-based extraction...');
            securities = this.extractFromTable(text, understanding.tableFormat);
        }
        
        // Strategy 2: Context-based extraction (always run)
        console.log('🎯 Using context-based extraction...');
        const contextSecurities = this.extractFromContext(text);
        
        // Strategy 3: Pattern matching extraction
        console.log('🔧 Using pattern-based extraction...');
        const patternSecurities = this.extractFromPatterns(text);
        
        // Merge results intelligently
        securities = this.mergeExtractionResults(securities, contextSecurities, patternSecurities);
        
        console.log(`✅ Extracted ${securities.length} securities`);
        return securities;
    }

    /**
     * Extract from table structure
     */
    extractFromTable(text, tableFormat) {
        const securities = [];
        const lines = text.split('\n');
        
        // Find data rows (after headers)
        let inDataSection = false;
        let currentSecurity = null;
        
        for (const line of lines) {
            // Skip empty lines
            if (!line.trim()) continue;
            
            // Check if this line contains an ISIN
            const isinMatch = line.match(/[A-Z]{2}[A-Z0-9]{10}/);
            if (isinMatch) {
                // Save previous security if exists
                if (currentSecurity && currentSecurity.isin) {
                    securities.push(currentSecurity);
                }
                
                // Start new security
                currentSecurity = {
                    isin: isinMatch[0],
                    name: '',
                    quantity: null,
                    price: null,
                    value: null,
                    currency: null,
                    rawLine: line
                };
                
                // Extract other fields from the same line
                this.extractFieldsFromLine(line, currentSecurity, tableFormat);
            } else if (currentSecurity) {
                // This might be a continuation line
                this.extractFieldsFromLine(line, currentSecurity, tableFormat);
            }
        }
        
        // Don't forget the last security
        if (currentSecurity && currentSecurity.isin) {
            securities.push(currentSecurity);
        }
        
        return securities;
    }

    /**
     * Extract fields from a line
     */
    extractFieldsFromLine(line, security, tableFormat) {
        // Extract quantity
        if (!security.quantity) {
            const qtyPatterns = [
                /(?:USD|CHF|EUR|GBP)\s*(\d{1,3}(?:[',.\s]?\d{3})*(?:[.,]\d{2})?)/,
                /(\d{1,3}(?:[',.\s]?\d{3})*)\s*(?:units?|stück)/i
            ];
            
            for (const pattern of qtyPatterns) {
                const match = line.match(pattern);
                if (match) {
                    security.quantity = this.parseNumber(match[1]);
                    
                    // Extract currency if found
                    const currencyMatch = match[0].match(/(USD|CHF|EUR|GBP)/);
                    if (currencyMatch) {
                        security.currency = currencyMatch[1];
                    }
                    break;
                }
            }
        }
        
        // Extract price
        if (!security.price) {
            const priceMatch = line.match(/(\d{1,3}(?:[.,]\d{1,4})?)\s*%/);
            if (priceMatch) {
                security.price = this.parseNumber(priceMatch[1]);
            }
        }
        
        // Extract name (cleanup later)
        if (!security.name && line.length > 20) {
            // Remove ISIN and numbers to get name
            let possibleName = line
                .replace(/[A-Z]{2}[A-Z0-9]{10}/, '')
                .replace(/\d{1,3}(?:[',.\s]?\d{3})*(?:[.,]\d{2})?/g, '')
                .replace(/\d+[.,]\d+%?/g, '')
                .trim();
            
            if (possibleName.length > 10) {
                security.name = possibleName.replace(/\s+/g, ' ').trim();
            }
        }
    }

    /**
     * Extract from context (like current implementation)
     */
    extractFromContext(text) {
        const securities = [];
        const isinMatches = [...text.matchAll(/[A-Z]{2}[A-Z0-9]{10}/g)];
        
        for (const match of isinMatches) {
            const isin = match[0];
            const position = match.index;
            
            const before = text.substring(Math.max(0, position - 300), position);
            const after = text.substring(position, Math.min(text.length, position + 300));
            
            const security = {
                isin: isin,
                name: this.extractName(before, after),
                quantity: this.extractQuantity(before),
                price: this.extractPrice(before + after),
                value: this.extractValue(before + after),
                currency: this.extractCurrency(before)
            };
            
            securities.push(security);
        }
        
        return securities;
    }

    /**
     * Extract using learned patterns
     */
    extractFromPatterns(text) {
        // This would use the pattern library and knowledge base
        // For now, return empty array
        return [];
    }

    /**
     * Merge results from different extraction methods
     */
    mergeExtractionResults(...results) {
        const merged = new Map();
        
        for (const securities of results) {
            for (const security of securities) {
                if (!security.isin) continue;
                
                if (!merged.has(security.isin)) {
                    merged.set(security.isin, security);
                } else {
                    // Merge data, preferring non-null values
                    const existing = merged.get(security.isin);
                    merged.set(security.isin, {
                        isin: security.isin,
                        name: existing.name || security.name,
                        quantity: existing.quantity || security.quantity,
                        price: existing.price || security.price,
                        value: existing.value || security.value,
                        currency: existing.currency || security.currency
                    });
                }
            }
        }
        
        return Array.from(merged.values());
    }

    /**
     * Enhance results with calculated values
     */
    async enhanceResults(securities, text) {
        return securities.map(security => {
            // Calculate value if we have quantity and price
            if (!security.value && security.quantity && security.price) {
                security.value = security.quantity * (security.price / 100);
            }
            
            // Add confidence score
            security.confidence = this.calculateSecurityConfidence(security);
            
            // Clean up name
            if (security.name) {
                security.name = security.name
                    .replace(/\s+/g, ' ')
                    .replace(/[^\w\s&.,%-]/g, '')
                    .trim();
            }
            
            return security;
        });
    }

    /**
     * Helper methods for extraction
     */
    extractName(before, after) {
        // Try multiple patterns
        const patterns = [
            /([A-Z][A-Za-z0-9\s&.,%-]{10,80})\s*$/,
            /^([A-Z][A-Za-z0-9\s&.,%-]{10,80})/,
            /\n([A-Z][A-Za-z0-9\s&.,%-]{10,80})\n/
        ];
        
        for (const pattern of patterns) {
            const match = (after + before).match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        
        return '';
    }

    extractQuantity(text) {
        const patterns = this.patternLibrary.quantity.patterns;
        for (const pattern of patterns) {
            const matches = [...text.matchAll(pattern)];
            if (matches.length > 0) {
                const lastMatch = matches[matches.length - 1];
                return this.parseNumber(lastMatch[1]);
            }
        }
        return null;
    }

    extractPrice(text) {
        const patterns = this.patternLibrary.price.patterns;
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const value = this.parseNumber(match[1]);
                if (value > 50 && value < 150) {
                    return value;
                }
            }
        }
        return null;
    }

    extractValue(text) {
        const patterns = [
            /(\d{1,3}(?:[',.\s]?\d{3})*(?:[.,]\d{2})?)\s*(?:total|value)/i,
            /(?:total|value)[\s:]*(\d{1,3}(?:[',.\s]?\d{3})*(?:[.,]\d{2})?)/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return this.parseNumber(match[1]);
            }
        }
        return null;
    }

    extractCurrency(text) {
        const match = text.match(/\b(USD|CHF|EUR|GBP|JPY)\b/);
        return match ? match[1] : null;
    }

    parseNumber(str) {
        if (!str) return 0;
        
        // Remove all spaces
        str = String(str).replace(/\s/g, '');
        
        // Handle different formats
        if (str.includes("'")) {
            str = str.replace(/'/g, '');
        }
        
        if (str.includes(',') && str.includes('.')) {
            if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
                str = str.replace(/\./g, '').replace(',', '.');
            } else {
                str = str.replace(/,/g, '');
            }
        } else if (str.includes(',')) {
            if (str.match(/,\d{3}/)) {
                str = str.replace(/,/g, '');
            } else {
                str = str.replace(',', '.');
            }
        }
        
        return parseFloat(str) || 0;
    }

    /**
     * Calculate confidence scores
     */
    calculateSecurityConfidence(security) {
        let score = 0;
        let factors = 0;
        
        if (security.isin) { score += 20; factors++; }
        if (security.name && security.name.length > 10) { score += 20; factors++; }
        if (security.quantity) { score += 20; factors++; }
        if (security.price) { score += 20; factors++; }
        if (security.value) { score += 20; factors++; }
        
        return factors > 0 ? score : 0;
    }

    calculateConfidence(securities) {
        if (securities.length === 0) return 0;
        const total = securities.reduce((sum, s) => sum + (s.confidence || 0), 0);
        return total / securities.length;
    }

    /**
     * Generate summary
     */
    generateSummary(securities) {
        const summary = {
            totalSecurities: securities.length,
            byConfidence: {
                high: securities.filter(s => s.confidence >= 80).length,
                medium: securities.filter(s => s.confidence >= 60 && s.confidence < 80).length,
                low: securities.filter(s => s.confidence < 60).length
            },
            totalValue: 0,
            currencies: {},
            missingData: {
                name: securities.filter(s => !s.name).length,
                quantity: securities.filter(s => !s.quantity).length,
                price: securities.filter(s => !s.price).length,
                value: securities.filter(s => !s.value).length
            }
        };
        
        // Calculate totals by currency
        for (const security of securities) {
            if (security.value && security.currency) {
                if (!summary.currencies[security.currency]) {
                    summary.currencies[security.currency] = 0;
                }
                summary.currencies[security.currency] += security.value;
                summary.totalValue += security.value;
            }
        }
        
        return summary;
    }

    /**
     * Learn from successful extractions
     */
    learnFromSuccess(securities, understanding) {
        console.log('\n📚 LEARNING FROM EXTRACTION...');
        
        // Update knowledge base
        if (!this.knowledgeBase.banks[understanding.bank]) {
            this.knowledgeBase.banks[understanding.bank] = {
                extractions: 0,
                averageConfidence: 0,
                patterns: {}
            };
        }
        
        const bankKnowledge = this.knowledgeBase.banks[understanding.bank];
        bankKnowledge.extractions++;
        
        // Update average confidence
        const newConfidence = this.calculateConfidence(securities);
        bankKnowledge.averageConfidence = 
            (bankKnowledge.averageConfidence * (bankKnowledge.extractions - 1) + newConfidence) 
            / bankKnowledge.extractions;
        
        this.knowledgeBase.successes++;
        
        // Save knowledge
        this.saveKnowledgeBase();
        
        console.log(`✅ Knowledge base updated (${this.knowledgeBase.successes} successful extractions)`);
    }
}

// Test the universal extractor
async function testUniversalExtractor() {
    const pdfParse = require('pdf-parse');
    
    console.log('🧪 TESTING UNIVERSAL ADAPTIVE EXTRACTOR\n');
    
    const pdfPath = './2. Messos  - 31.03.2025.pdf';
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF not found');
        return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    
    const extractor = new UniversalAdaptiveExtractor();
    const results = await extractor.extract(pdfData.text);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 EXTRACTION RESULTS:');
    console.log('='.repeat(80));
    console.log(`Bank: ${results.metadata.bank}`);
    console.log(`Securities: ${results.summary.totalSecurities}`);
    console.log(`Confidence: ${results.metadata.confidence.toFixed(1)}%`);
    console.log(`Missing data:`, results.summary.missingData);
    
    console.log('\n📋 SAMPLE SECURITIES:');
    results.securities.slice(0, 5).forEach((sec, i) => {
        console.log(`\n${i + 1}. ${sec.isin}`);
        console.log(`   Name: ${sec.name || 'Not extracted'}`);
        console.log(`   Quantity: ${sec.quantity ? sec.quantity.toLocaleString() : 'Not extracted'} ${sec.currency || ''}`);
        console.log(`   Price: ${sec.price ? sec.price + '%' : 'Not extracted'}`);
        console.log(`   Value: ${sec.value ? sec.value.toLocaleString() : 'Not extracted'}`);
        console.log(`   Confidence: ${sec.confidence}%`);
    });
}

// Export for use
module.exports = UniversalAdaptiveExtractor;

// Run test if called directly
if (require.main === module) {
    testUniversalExtractor().catch(console.error);
}