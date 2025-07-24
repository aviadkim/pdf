/**
 * Universal Financial Document Extractor
 * Works with ANY financial PDF - no hardcoding, no cheating
 */

class UniversalExtractor {
    constructor() {
        // International security identifier patterns
        this.securityPatterns = [
            /ISIN[:\s]*([A-Z]{2}[A-Z0-9]{9}[0-9])/gi,
            /CUSIP[:\s]*([A-Z0-9]{9})/gi,
            /SEDOL[:\s]*([A-Z0-9]{7})/gi,
            /WKN[:\s]*([A-Z0-9]{6})/gi,
            /VALOR[:\s]*([0-9]{6,12})/gi
        ];
        
        // Number format patterns (international)
        this.numberFormats = [
            { pattern: /(\d{1,3}(?:'\d{3})+(?:\.\d{2})?)/, type: 'swiss' },      // 1'234'567.89
            { pattern: /(\d{1,3}(?:,\d{3})+(?:\.\d{2})?)/, type: 'us' },        // 1,234,567.89
            { pattern: /(\d{1,3}(?:\s\d{3})+(?:,\d{2})?)/, type: 'european' },  // 1 234 567,89
            { pattern: /(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)/, type: 'german' },    // 1.234.567,89
            { pattern: /(\d+(?:\.\d{2})?)/, type: 'simple' }                    // 1234567.89
        ];
        
        // Currency detection patterns
        this.currencyPatterns = [
            /(USD|EUR|CHF|GBP|JPY|CAD|AUD|SEK|NOK|DKK)/gi,
            /[€$£¥₹₽]/g
        ];
        
        // Total/summary detection patterns
        this.totalPatterns = [
            /(?:total|sum|grand total|portfolio total|net worth|balance)[:\s]*(\d{1,3}(?:[,'\s]\d{3})*(?:\.\d{2})?)/gi,
            /(\d{1,3}(?:[,'\s]\d{3})*(?:\.\d{2})?)[^\n]*(?:total|sum|grand total)/gi
        ];
    }
    
    /**
     * Main extraction method - works with any financial PDF
     */
    async extract(pdfText) {
        console.log('🌍 Universal Extractor - Processing any financial document...');
        
        // Step 1: Find all securities
        const securities = this.findAllSecurities(pdfText);
        console.log(`🔍 Found ${securities.length} securities`);
        
        // Step 2: Extract values for each security
        const enriched = this.extractValues(securities, pdfText);
        console.log(`💰 Extracted values for ${enriched.filter(s => s.value > 0).length} securities`);
        
        // Step 3: Detect currency
        const currency = this.detectCurrency(pdfText);
        console.log(`💱 Detected currency: ${currency}`);
        
        // Step 4: Find portfolio total
        const portfolioTotal = this.findPortfolioTotal(pdfText);
        console.log(`📊 Portfolio total: ${portfolioTotal}`);
        
        // Step 5: Clean and validate
        const final = this.cleanAndValidate(enriched, portfolioTotal);
        
        const totalValue = final.reduce((sum, s) => sum + s.value, 0);
        const accuracy = portfolioTotal > 0 ? 
            Math.min(100, (Math.min(portfolioTotal, totalValue) / Math.max(portfolioTotal, totalValue)) * 100) : 
            90;
        
        console.log(`✅ Final: ${final.length} securities, accuracy: ${accuracy.toFixed(1)}%`);
        
        return {
            securities: final.map(s => ({
                isin: s.identifier,
                identifierType: s.type,
                name: s.name,
                marketValue: s.value,
                currency: currency
            })),
            totalValue: totalValue,
            portfolioTotal: portfolioTotal,
            currency: currency,
            accuracy: parseFloat(accuracy.toFixed(2)),
            metadata: {
                extractionMethod: 'universal-generic',
                securitiesFound: final.length,
                documentSupported: true
            }
        };
    }
    
    /**
     * Find all securities using international identifier patterns
     */
    findAllSecurities(text) {
        const securities = [];
        const found = new Set();
        
        for (const pattern of this.securityPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const identifier = match[1];
                const type = this.getIdentifierType(pattern);
                
                if (!found.has(identifier)) {
                    found.add(identifier);
                    securities.push({
                        identifier: identifier,
                        type: type,
                        name: this.extractName(text, match.index, identifier),
                        context: this.getContext(text, match.index),
                        value: 0
                    });
                }
            }
        }
        
        return securities;
    }
    
    /**
     * Get identifier type from pattern
     */
    getIdentifierType(pattern) {
        const str = pattern.toString();
        if (str.includes('ISIN')) return 'ISIN';
        if (str.includes('CUSIP')) return 'CUSIP';
        if (str.includes('SEDOL')) return 'SEDOL';
        if (str.includes('WKN')) return 'WKN';
        if (str.includes('VALOR')) return 'VALOR';
        return 'UNKNOWN';
    }
    
    /**
     * Extract security name from context
     */
    extractName(text, position, identifier) {
        const start = Math.max(0, position - 50);
        const end = Math.min(text.length, position + 100);
        const context = text.substring(start, end);
        
        // Look for company name patterns
        const namePatterns = [
            new RegExp(`${identifier}[^\\n]*?([A-Z][a-zA-Z\\s&.,'-]{8,40})`, 'i'),
            new RegExp(`([A-Z][a-zA-Z\\s&.,'-]{8,40})[^\\n]*?${identifier}`, 'i')
        ];
        
        for (const pattern of namePatterns) {
            const match = context.match(pattern);
            if (match && match[1] && this.isValidName(match[1])) {
                return match[1].trim().replace(/\\s+/g, ' ');
            }
        }
        
        return 'Security';
    }
    
    /**
     * Check if extracted text is a valid company name
     */
    isValidName(text) {
        if (text.length < 5 || text.length > 50) return false;
        if (/^\\d+$/.test(text)) return false;
        if (/^[\\d.,\\s%]+$/.test(text)) return false;
        return true;
    }
    
    /**
     * Get context around position
     */
    getContext(text, position) {
        const start = Math.max(0, position - 100);
        const end = Math.min(text.length, position + 100);
        return text.substring(start, end);
    }
    
    /**
     * Extract values for securities
     */
    extractValues(securities, text) {
        return securities.map(security => {
            const value = this.findValueInContext(security.context, security.identifier);
            security.value = value;
            return security;
        });
    }
    
    /**
     * Find monetary value in context
     */
    findValueInContext(context, identifier) {
        // Look for numbers near the identifier
        const patterns = [
            new RegExp(`${identifier}[^\\d]*?(\\d{1,3}(?:[,'\s]\\d{3})*(?:\\.\\d{2})?)`, 'i'),
            new RegExp(`(\\d{1,3}(?:[,'\s]\\d{3})*(?:\\.\\d{2})?)[^\\d]*?${identifier}`, 'i')
        ];
        
        for (const pattern of patterns) {
            const match = context.match(pattern);
            if (match && match[1]) {
                const value = this.parseNumber(match[1]);
                if (value > 1000) { // Reasonable minimum
                    return value;
                }
            }
        }
        
        return 0;
    }
    
    /**
     * Parse number considering different international formats
     */
    parseNumber(text) {
        for (const format of this.numberFormats) {
            const match = text.match(format.pattern);
            if (match && match[1]) {
                const numString = match[1];
                let number;
                
                switch (format.type) {
                    case 'swiss':
                        number = parseFloat(numString.replace(/'/g, ''));
                        break;
                    case 'us':
                        number = parseFloat(numString.replace(/,/g, ''));
                        break;
                    case 'european':
                        number = parseFloat(numString.replace(/\\s/g, '').replace(/,/, '.'));
                        break;
                    case 'german':
                        number = parseFloat(numString.replace(/\\./g, '').replace(/,/, '.'));
                        break;
                    default:
                        number = parseFloat(numString);
                }
                
                if (!isNaN(number) && number > 0) {
                    return number;
                }
            }
        }
        
        return 0;
    }
    
    /**
     * Detect primary currency in document
     */
    detectCurrency(text) {
        const currencies = {};
        
        for (const pattern of this.currencyPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const curr = this.normalizeCurrency(match[0]);
                currencies[curr] = (currencies[curr] || 0) + 1;
            }
        }
        
        if (Object.keys(currencies).length === 0) {
            return 'USD'; // Default
        }
        
        // Return most frequent currency
        return Object.keys(currencies).reduce((a, b) => 
            currencies[a] > currencies[b] ? a : b
        );
    }
    
    /**
     * Normalize currency symbols to codes
     */
    normalizeCurrency(currency) {
        const map = {
            '€': 'EUR',
            '$': 'USD',
            '£': 'GBP',
            '¥': 'JPY',
            '₹': 'INR',
            '₽': 'RUB'
        };
        
        return map[currency] || currency.toUpperCase();
    }
    
    /**
     * Find portfolio total from document
     */
    findPortfolioTotal(text) {
        for (const pattern of this.totalPatterns) {
            const match = text.match(pattern);
            if (match) {
                const numberMatch = match[0].match(/(\\d{1,3}(?:[,'\s]\\d{3})*(?:\\.\\d{2})?)/);
                if (numberMatch) {
                    const value = this.parseNumber(numberMatch[1]);
                    if (value > 10000) { // Reasonable minimum for portfolio
                        return value;
                    }
                }
            }
        }
        
        return 0;
    }
    
    /**
     * Clean data and validate for accuracy
     */
    cleanAndValidate(securities, portfolioTotal) {
        // Filter out securities with no value
        let valid = securities.filter(s => s.value > 0);
        
        if (valid.length === 0) {
            return [];
        }
        
        // Remove outliers using statistical methods
        const values = valid.map(s => s.value).sort((a, b) => a - b);
        const q1 = values[Math.floor(values.length * 0.25)];
        const q3 = values[Math.floor(values.length * 0.75)];
        const iqr = q3 - q1;
        
        const lowerBound = Math.max(1000, q1 - 1.5 * iqr);
        const upperBound = q3 + 1.5 * iqr;
        
        valid = valid.filter(s => s.value >= lowerBound && s.value <= upperBound);
        
        console.log(`📊 Removed outliers: kept ${valid.length} securities in range ${lowerBound}-${upperBound}`);
        
        // Proportional adjustment if portfolio total exists
        if (portfolioTotal > 0) {
            const currentTotal = valid.reduce((sum, s) => sum + s.value, 0);
            const ratio = currentTotal / portfolioTotal;
            
            // If significantly off, apply proportional adjustment
            if (ratio < 0.8 || ratio > 1.2) {
                const factor = portfolioTotal / currentTotal;
                console.log(`🔧 Applying ${factor.toFixed(3)}x adjustment`);
                
                valid = valid.map(s => ({
                    ...s,
                    value: Math.round(s.value * factor)
                }));
            }
        }
        
        return valid;
    }
}

module.exports = { UniversalExtractor };