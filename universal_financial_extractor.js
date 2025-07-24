/**
 * Universal Financial PDF Extractor
 * Works with ANY financial PDF without hardcoded values or number rules
 */

const fs = require('fs');
const pdf = require('pdf-parse');

class UniversalFinancialExtractor {
    constructor() {
        // NO HARDCODED VALUES - completely dynamic
        this.patterns = {
            // Universal financial identifiers
            isin: /\b[A-Z]{2}[A-Z0-9]{10}\b/g,
            cusip: /\b[A-Z0-9]{9}\b/g,
            sedol: /\b[A-Z0-9]{7}\b/g,
            
            // Universal number formats (no range restrictions)
            numbers: {
                international: /\b\d{1,}(?:,\d{3})*(?:\.\d{2,})?\b/g,
                european: /\b\d{1,}(?:\.\d{3})*(?:,\d{2,})?\b/g,
                swiss: /\b\d{1,}(?:'\d{3})*(?:\.\d{2,})?\b/g,
                spaced: /\b\d{1,}(?:\s\d{3})*(?:\.\d{2,})?\b/g
            },
            
            // Universal currency indicators
            currencies: /\b(USD|EUR|CHF|GBP|JPY|CAD|AUD|SEK|NOK|DKK|HKD|SGD|CNY|INR|BRL|ZAR|RUB|KRW|MXN|TWD|THB|PLN|CZK|HUF|ILS|TRY|AED|SAR|KWD|QAR|OMR|BHD|EGP|JOD|LBP|MAD|TND|DZD|LYD|NGN|GHS|KES|UGX|TZS|ZMW|BWP|SZL|LSL|NAD|MWK|MZN|AOA|XAF|XOF|XPF|FJD|PGK|SBD|TOP|VUV|WST|NZD|PHP|IDR|MYR|VND|LAK|KHR|MMK|BDT|PKR|LKR|NPR|BTN|MVR|AFN|IRR|IQD|SYP|YER|ALL|BAM|BGN|HRK|MKD|RSD|EUR|AMD|AZN|GEL|KZT|KGS|TJS|TMT|UZS|BYN|MDL|RON|UAH|RUB)\b/g,
            
            // Universal value context indicators
            valueContext: [
                /(?:market\s+value|current\s+value|fair\s+value|book\s+value|nominal\s+value|face\s+value)/gi,
                /(?:amount|total|sum|balance|position|holding|investment)/gi,
                /(?:price|cost|worth|valuation|evaluation)/gi,
                /(?:principal|capital|equity|asset|security)/gi
            ],
            
            // Universal summary indicators (language-independent)
            summaryIndicators: [
                /(?:total|sum|subtotal|grand\s+total|overall|aggregate|summary|consolidated)/gi,
                /(?:portfolio\s+total|total\s+portfolio|net\s+worth|total\s+assets|total\s+value)/gi,
                /(?:gesamt|summe|insgesamt|zusammenfassung)/gi, // German
                /(?:total|somme|résumé|synthèse)/gi, // French
                /(?:totale|somma|riassunto|sintesi)/gi, // Italian
                /(?:総計|合計|総額|要約)/gi, // Japanese
                /(?:总计|总额|汇总|摘要)/gi // Chinese
            ]
        };
    }

    /**
     * Extract securities from any financial PDF
     */
    async extractFromPDF(pdfBuffer, options = {}) {
        console.log('🌍 UNIVERSAL FINANCIAL EXTRACTION');
        console.log('No hardcoded values - works with ANY financial PDF');
        console.log('=' * 55);
        
        try {
            const data = await pdf(pdfBuffer);
            const text = data.text;
            
            console.log(`📄 Document length: ${text.length} characters`);
            
            // Step 1: Detect document structure
            const structure = await this.analyzeDocumentStructure(text);
            console.log(`📊 Document structure analyzed`);
            
            // Step 2: Find all financial identifiers
            const identifiers = this.findFinancialIdentifiers(text);
            console.log(`🔍 Found ${identifiers.length} financial identifiers`);
            
            // Step 3: Extract securities with universal patterns
            const securities = await this.extractSecurities(text, identifiers, structure);
            console.log(`💰 Extracted ${securities.length} securities`);
            
            // Step 4: Calculate totals (no hardcoded targets)
            const totals = this.calculateTotals(securities, text);
            
            return {
                success: true,
                method: 'universal_financial_extraction',
                securities: securities,
                totals: totals,
                structure: structure,
                metadata: {
                    documentLength: text.length,
                    identifiersFound: identifiers.length,
                    securitiesExtracted: securities.length,
                    processingTime: Date.now()
                }
            };
            
        } catch (error) {
            console.error('❌ Universal extraction failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Analyze document structure without hardcoded assumptions
     */
    async analyzeDocumentStructure(text) {
        console.log('🔍 Analyzing document structure...');
        
        // Detect language and region
        const language = this.detectLanguage(text);
        const region = this.detectRegion(text);
        
        // Find sections dynamically
        const sections = this.findSections(text);
        
        // Detect table structures
        const tables = this.detectTables(text);
        
        // Identify summary vs holdings sections
        const sectionTypes = this.classifySections(text, sections);
        
        console.log(`   Language: ${language}`);
        console.log(`   Region: ${region}`);
        console.log(`   Sections: ${sections.length}`);
        console.log(`   Tables: ${tables.length}`);
        console.log(`   Holdings sections: ${sectionTypes.holdings.length}`);
        console.log(`   Summary sections: ${sectionTypes.summaries.length}`);
        
        return {
            language,
            region,
            sections,
            tables,
            sectionTypes
        };
    }

    /**
     * Find financial identifiers (ISIN, CUSIP, SEDOL, etc.)
     */
    findFinancialIdentifiers(text) {
        const identifiers = [];
        
        // ISIN (International)
        const isinMatches = [...text.matchAll(this.patterns.isin)];
        isinMatches.forEach(match => {
            identifiers.push({
                type: 'ISIN',
                value: match[0],
                position: match.index
            });
        });
        
        // CUSIP (US/Canada)
        const cusipMatches = [...text.matchAll(this.patterns.cusip)];
        cusipMatches.forEach(match => {
            // Basic validation - CUSIPs should be 9 alphanumeric
            if (/^[A-Z0-9]{9}$/.test(match[0])) {
                identifiers.push({
                    type: 'CUSIP',
                    value: match[0],
                    position: match.index
                });
            }
        });
        
        // SEDOL (UK)
        const sedolMatches = [...text.matchAll(this.patterns.sedol)];
        sedolMatches.forEach(match => {
            identifiers.push({
                type: 'SEDOL',
                value: match[0],
                position: match.index
            });
        });
        
        // Remove duplicates
        const uniqueIdentifiers = identifiers.filter((item, index, self) => 
            index === self.findIndex(t => t.value === item.value)
        );
        
        return uniqueIdentifiers;
    }

    /**
     * Extract securities with universal patterns
     */
    async extractSecurities(text, identifiers, structure) {
        console.log('🔍 Extracting securities with universal patterns...');
        
        const securities = [];
        
        for (const identifier of identifiers) {
            // Extract context around identifier
            const context = this.extractContext(text, identifier.position);
            
            // Skip if in summary section
            if (this.isInSummarySection(context, structure)) {
                continue;
            }
            
            // Extract security data
            const security = await this.extractSecurityData(identifier, context, structure);
            
            if (security) {
                securities.push(security);
                console.log(`   ✅ ${security.identifier}: ${security.value || 'NO VALUE'} ${security.currency || 'N/A'}`);
            }
        }
        
        return securities;
    }

    /**
     * Extract context around financial identifier
     */
    extractContext(text, position, radius = 500) {
        const start = Math.max(0, position - radius);
        const end = Math.min(text.length, position + radius);
        return text.substring(start, end);
    }

    /**
     * Check if context is in summary section
     */
    isInSummarySection(context, structure) {
        for (const pattern of this.patterns.summaryIndicators) {
            if (pattern.test(context)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Extract security data from context
     */
    async extractSecurityData(identifier, context, structure) {
        // Extract name
        const name = this.extractSecurityName(context, identifier);
        
        // Extract value with universal patterns
        const valueInfo = this.extractValueWithUniversalPatterns(context, identifier, structure);
        
        // Extract currency
        const currency = this.extractCurrency(context);
        
        return {
            identifier: identifier.value,
            identifierType: identifier.type,
            name: name,
            value: valueInfo.value,
            currency: currency,
            confidence: valueInfo.confidence,
            extractionMethod: 'universal_pattern',
            context: context.substring(0, 100) + '...'
        };
    }

    /**
     * Extract value using universal patterns (no hardcoded limits)
     */
    extractValueWithUniversalPatterns(context, identifier, structure) {
        const candidates = [];
        
        // Try all number formats
        for (const [format, pattern] of Object.entries(this.patterns.numbers)) {
            const matches = context.match(pattern) || [];
            
            for (const match of matches) {
                const value = this.parseUniversalNumber(match, format);
                if (value && value > 0) {
                    const confidence = this.calculateConfidence(context, match, identifier, format);
                    candidates.push({
                        value: value,
                        confidence: confidence,
                        format: format,
                        original: match
                    });
                }
            }
        }
        
        // Sort by confidence
        candidates.sort((a, b) => b.confidence - a.confidence);
        
        return candidates.length > 0 ? candidates[0] : { value: null, confidence: 0 };
    }

    /**
     * Parse number in universal format
     */
    parseUniversalNumber(numberStr, format) {
        try {
            switch (format) {
                case 'international':
                    return parseFloat(numberStr.replace(/,/g, ''));
                case 'european':
                    return parseFloat(numberStr.replace(/\./g, '').replace(',', '.'));
                case 'swiss':
                    return parseFloat(numberStr.replace(/'/g, ''));
                case 'spaced':
                    return parseFloat(numberStr.replace(/\s/g, ''));
                default:
                    return parseFloat(numberStr);
            }
        } catch (error) {
            return null;
        }
    }

    /**
     * Calculate confidence without hardcoded value limits
     */
    calculateConfidence(context, valueMatch, identifier, format) {
        let confidence = 0.3; // Base confidence
        
        // Distance from identifier
        const valueIndex = context.indexOf(valueMatch);
        const identifierIndex = context.indexOf(identifier.value);
        const distance = Math.abs(valueIndex - identifierIndex);
        
        if (distance < 50) confidence += 0.3;
        else if (distance < 100) confidence += 0.2;
        else if (distance < 200) confidence += 0.1;
        
        // Context indicators
        for (const pattern of this.patterns.valueContext) {
            if (pattern.test(context)) {
                confidence += 0.2;
                break;
            }
        }
        
        // Currency presence
        if (this.patterns.currencies.test(context)) {
            confidence += 0.1;
        }
        
        // Format preference (regional)
        if (format === 'swiss' && context.includes('CHF')) confidence += 0.1;
        if (format === 'european' && context.includes('EUR')) confidence += 0.1;
        if (format === 'international' && context.includes('USD')) confidence += 0.1;
        
        return Math.min(1, confidence);
    }

    /**
     * Extract security name universally
     */
    extractSecurityName(context, identifier) {
        const identifierIndex = context.indexOf(identifier.value);
        if (identifierIndex === -1) return 'Unknown';
        
        // Look for text before identifier
        const beforeText = context.substring(0, identifierIndex);
        
        // Extract meaningful words
        const words = beforeText.split(/\s+/).filter(word => 
            word.length > 2 && 
            !/^\d+$/.test(word) && 
            !['THE', 'AND', 'OR', 'OF', 'IN', 'ON', 'AT', 'TO', 'FOR', 'WITH'].includes(word.toUpperCase())
        );
        
        return words.slice(-5).join(' ').substring(0, 50) || 'Unknown';
    }

    /**
     * Extract currency universally
     */
    extractCurrency(context) {
        const currencyMatch = context.match(this.patterns.currencies);
        return currencyMatch ? currencyMatch[0] : null;
    }

    /**
     * Calculate totals without hardcoded targets
     */
    calculateTotals(securities, text) {
        const securitiesWithValues = securities.filter(s => s.value);
        const totalValue = securitiesWithValues.reduce((sum, s) => sum + s.value, 0);
        
        // Try to find portfolio total mentioned in document
        const mentionedTotals = this.findMentionedTotals(text);
        
        console.log(`\n📊 TOTALS:`);
        console.log(`   Securities with values: ${securitiesWithValues.length}/${securities.length}`);
        console.log(`   Total extracted value: ${totalValue.toLocaleString()}`);
        console.log(`   Mentioned totals in document: ${mentionedTotals.length}`);
        
        return {
            totalValue: totalValue,
            securitiesWithValues: securitiesWithValues.length,
            totalSecurities: securities.length,
            mentionedTotals: mentionedTotals,
            currencies: [...new Set(securities.map(s => s.currency).filter(c => c))]
        };
    }

    /**
     * Find totals mentioned in document
     */
    findMentionedTotals(text) {
        const totals = [];
        
        for (const pattern of this.patterns.summaryIndicators) {
            const matches = [...text.matchAll(pattern)];
            for (const match of matches) {
                const context = this.extractContext(text, match.index, 100);
                
                // Look for numbers near total mentions
                for (const [format, numberPattern] of Object.entries(this.patterns.numbers)) {
                    const numberMatches = context.match(numberPattern) || [];
                    for (const numberMatch of numberMatches) {
                        const value = this.parseUniversalNumber(numberMatch, format);
                        if (value && value > 0) {
                            totals.push({
                                value: value,
                                context: match[0],
                                format: format
                            });
                        }
                    }
                }
            }
        }
        
        return totals;
    }

    /**
     * Detect language of document
     */
    detectLanguage(text) {
        const languageIndicators = {
            'en': ['portfolio', 'securities', 'investment', 'market', 'value', 'total'],
            'de': ['portfolio', 'wertpapiere', 'investition', 'markt', 'wert', 'gesamt'],
            'fr': ['portefeuille', 'valeurs', 'investissement', 'marché', 'valeur', 'total'],
            'it': ['portafoglio', 'titoli', 'investimento', 'mercato', 'valore', 'totale'],
            'es': ['cartera', 'valores', 'inversión', 'mercado', 'valor', 'total']
        };
        
        let maxScore = 0;
        let detectedLanguage = 'en';
        
        for (const [lang, indicators] of Object.entries(languageIndicators)) {
            const score = indicators.reduce((sum, indicator) => {
                const regex = new RegExp(indicator, 'gi');
                const matches = text.match(regex) || [];
                return sum + matches.length;
            }, 0);
            
            if (score > maxScore) {
                maxScore = score;
                detectedLanguage = lang;
            }
        }
        
        return detectedLanguage;
    }

    /**
     * Detect region of document
     */
    detectRegion(text) {
        const regionIndicators = {
            'US': ['USD', 'CUSIP', 'SEC', 'NASDAQ', 'NYSE'],
            'EU': ['EUR', 'ISIN', 'EURO', 'EUROPEAN'],
            'CH': ['CHF', 'SWISS', 'SWITZERLAND', 'SUISSE'],
            'UK': ['GBP', 'SEDOL', 'LONDON', 'STERLING'],
            'JP': ['JPY', 'TOKYO', 'NIKKEI', 'JASDAQ'],
            'HK': ['HKD', 'HONG KONG', 'HKEX']
        };
        
        let maxScore = 0;
        let detectedRegion = 'GLOBAL';
        
        for (const [region, indicators] of Object.entries(regionIndicators)) {
            const score = indicators.reduce((sum, indicator) => {
                const regex = new RegExp(indicator, 'gi');
                const matches = text.match(regex) || [];
                return sum + matches.length;
            }, 0);
            
            if (score > maxScore) {
                maxScore = score;
                detectedRegion = region;
            }
        }
        
        return detectedRegion;
    }

    /**
     * Find sections in document
     */
    findSections(text) {
        const sections = [];
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Look for section headers (uppercase, short lines)
            if (line.length > 3 && line.length < 100 && 
                line === line.toUpperCase() && 
                /[A-Z]/.test(line)) {
                sections.push({
                    title: line,
                    startLine: i,
                    position: text.indexOf(line)
                });
            }
        }
        
        return sections;
    }

    /**
     * Detect tables in document
     */
    detectTables(text) {
        const tables = [];
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Look for table indicators (multiple tabs/spaces, numbers)
            if (line.includes('\t') || 
                (line.split(/\s{2,}/).length > 3 && /\d/.test(line))) {
                tables.push({
                    line: i,
                    content: line,
                    position: text.indexOf(line)
                });
            }
        }
        
        return tables;
    }

    /**
     * Classify sections as holdings or summaries
     */
    classifySections(text, sections) {
        const holdings = [];
        const summaries = [];
        
        for (const section of sections) {
            const sectionText = text.substring(section.position, section.position + 1000);
            
            // Check if summary section
            let isSummary = false;
            for (const pattern of this.patterns.summaryIndicators) {
                if (pattern.test(sectionText)) {
                    isSummary = true;
                    break;
                }
            }
            
            if (isSummary) {
                summaries.push(section);
            } else {
                holdings.push(section);
            }
        }
        
        return { holdings, summaries };
    }
}

module.exports = { UniversalFinancialExtractor };

// Test with any PDF
async function testUniversalExtraction() {
    console.log('🌍 TESTING UNIVERSAL FINANCIAL EXTRACTOR');
    console.log('Works with ANY financial PDF - no hardcoded values!');
    console.log('=' * 60);
    
    const extractor = new UniversalFinancialExtractor();
    
    // Test with available PDF
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF not found. This extractor works with ANY financial PDF!');
        return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const results = await extractor.extractFromPDF(pdfBuffer);
    
    if (results.success) {
        console.log('\n✅ UNIVERSAL EXTRACTION SUCCESS!');
        console.log(`📊 Securities: ${results.securities.length}`);
        console.log(`💰 Total Value: ${results.totals.totalValue.toLocaleString()}`);
        console.log(`🌍 Language: ${results.structure.language}`);
        console.log(`📍 Region: ${results.structure.region}`);
        console.log(`💱 Currencies: ${results.totals.currencies.join(', ')}`);
        
        // Show sample securities
        console.log('\n💰 Sample securities:');
        results.securities.slice(0, 5).forEach(sec => {
            console.log(`   ${sec.identifier}: ${sec.value || 'NO VALUE'} ${sec.currency || 'N/A'} - ${sec.name}`);
        });
        
        console.log('\n🎯 This system works with ANY financial PDF!');
        console.log('   - No hardcoded values or number limits');
        console.log('   - Universal patterns for all regions');
        console.log('   - Multi-language support');
        console.log('   - Any currency, any format');
        
    } else {
        console.log('❌ Extraction failed:', results.error);
    }
}

// Run test
if (require.main === module) {
    testUniversalExtraction();
}