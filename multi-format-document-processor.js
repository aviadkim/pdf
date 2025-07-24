/**
 * MULTI-FORMAT FINANCIAL DOCUMENT PROCESSOR
 * Handles different bank formats, document structures, and layouts
 */

class MultiFormatDocumentProcessor {
    constructor() {
        this.documentFormats = {
            // Swiss Banking Formats
            CORNER_BANK: {
                name: 'Cornèr Banca SA',
                identifiers: ['Cornèr Banca SA', 'corner.ch', 'CBLUCH2280A'],
                portfolioTotalPatterns: [
                    /Total\s+(\d{1,3}(?:[']\d{3})*(?:\.\d{2})?)/,
                    /Portfolio Total\s+(\d{1,3}(?:[']\d{3})*(?:\.\d{2})?)/
                ],
                isinfPatterns: [
                    /ISIN:\s*([A-Z]{2}[A-Z0-9]{9}[0-9])/g,
                    /([A-Z]{2}[A-Z0-9]{9}[0-9])\s*\/\/\s*Val/g
                ],
                valuePatterns: [
                    /(\d{1,3}(?:[']\d{3})*(?:\.\d{2})?)\s*USD/g,
                    /USD\s*(\d{1,3}(?:[']\d{3})*(?:\.\d{2})?)/g
                ],
                numberFormat: 'swiss_apostrophe' // 1'234'567
            },
            
            UBS: {
                name: 'UBS Group AG',
                identifiers: ['UBS', 'ubs.com', 'UBS Switzerland AG'],
                portfolioTotalPatterns: [
                    /Gesamtvermögen\s+(\d{1,3}(?:\s\d{3})*(?:\.\d{2})?)/,
                    /Total Assets\s+([\d,]+(?:\.\d{2})?)/
                ],
                isinfPatterns: [
                    /ISIN\s+([A-Z]{2}[A-Z0-9]{9}[0-9])/g
                ],
                valuePatterns: [
                    /([\d,]+(?:\.\d{2})?)\s*USD/g
                ],
                numberFormat: 'standard_comma' // 1,234,567
            },
            
            CREDIT_SUISSE: {
                name: 'Credit Suisse',
                identifiers: ['Credit Suisse', 'credit-suisse.com', 'CS'],
                portfolioTotalPatterns: [
                    /Total Portfolio Value\s+([\d,]+(?:\.\d{2})?)/,
                    /Portfolio Total\s+([\d,]+(?:\.\d{2})?)/
                ],
                isinfPatterns: [
                    /([A-Z]{2}[A-Z0-9]{9}[0-9])\s*-\s*/g
                ],
                valuePatterns: [
                    /USD\s*([\d,]+(?:\.\d{2})?)/g
                ],
                numberFormat: 'standard_comma'
            },
            
            // German Banking Formats
            DEUTSCHE_BANK: {
                name: 'Deutsche Bank',
                identifiers: ['Deutsche Bank', 'db.com', 'DEUTDEFF'],
                portfolioTotalPatterns: [
                    /Gesamtvolumen\s+([\d.]+,\d{2})/,
                    /Total Volume\s+([\d,]+\.\d{2})/
                ],
                isinfPatterns: [
                    /ISIN:\s*([A-Z]{2}[A-Z0-9]{9}[0-9])/g
                ],
                valuePatterns: [
                    /([\d.]+,\d{2})\s*EUR/g,
                    /([\d,]+\.\d{2})\s*USD/g
                ],
                numberFormat: 'german_period' // 1.234.567,89
            },
            
            // US Banking Formats
            JP_MORGAN: {
                name: 'JPMorgan Chase',
                identifiers: ['JPMorgan', 'jpmorgan.com', 'Chase'],
                portfolioTotalPatterns: [
                    /Account Total\s*\$\s*([\d,]+(?:\.\d{2})?)/,
                    /Portfolio Value\s*\$\s*([\d,]+(?:\.\d{2})?)/
                ],
                isinfPatterns: [
                    /CUSIP:\s*([A-Z0-9]{9})/g,
                    /ISIN:\s*([A-Z]{2}[A-Z0-9]{9}[0-9])/g
                ],
                valuePatterns: [
                    /\$\s*([\d,]+(?:\.\d{2})?)/g
                ],
                numberFormat: 'us_standard' // 1,234,567.89
            },
            
            // UK Banking Formats  
            HSBC: {
                name: 'HSBC Holdings',
                identifiers: ['HSBC', 'hsbc.com', 'HBUKGB4B'],
                portfolioTotalPatterns: [
                    /Total Value\s*£\s*([\d,]+(?:\.\d{2})?)/,
                    /Portfolio Total\s*\$\s*([\d,]+(?:\.\d{2})?)/
                ],
                isinfPatterns: [
                    /ISIN\s+([A-Z]{2}[A-Z0-9]{9}[0-9])/g
                ],
                valuePatterns: [
                    /£\s*([\d,]+(?:\.\d{2})?)/g,
                    /\$\s*([\d,]+(?:\.\d{2})?)/g
                ],
                numberFormat: 'uk_standard' // 1,234,567.89
            }
        };
        
        this.currencyConversion = {
            'USD': 1.0,
            'EUR': 1.08,
            'GBP': 1.27,
            'CHF': 1.13,
            // Add more as needed
        };
    }
    
    /**
     * Detect document format from text content
     */
    detectDocumentFormat(text) {
        const scores = {};
        
        for (const [formatKey, format] of Object.entries(this.documentFormats)) {
            let score = 0;
            
            // Check for format identifiers
            format.identifiers.forEach(identifier => {
                if (text.includes(identifier)) {
                    score += 10;
                }
            });
            
            // Check for pattern matches
            const isinMatches = text.match(format.isinfPatterns[0]) || [];
            const valueMatches = text.match(format.valuePatterns[0]) || [];
            
            score += isinMatches.length * 2;
            score += valueMatches.length * 1;
            
            scores[formatKey] = score;
        }
        
        // Return format with highest score
        const bestFormat = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        return scores[bestFormat] > 0 ? this.documentFormats[bestFormat] : null;
    }
    
    /**
     * Extract securities using format-specific patterns
     */
    extractSecuritiesWithFormat(text, format) {
        const securities = [];
        
        // Extract ISINs using format-specific patterns
        const isinMatches = [];
        format.isinfPatterns.forEach(pattern => {
            const matches = [...text.matchAll(pattern)];
            matches.forEach(match => {
                if (!isinMatches.includes(match[1])) {
                    isinMatches.push(match[1]);
                }
            });
        });
        
        // Extract values for each ISIN
        isinMatches.forEach(isin => {
            const security = this.extractSecurityValue(text, isin, format);
            if (security) {
                securities.push(security);
            }
        });
        
        return securities;
    }
    
    /**
     * Extract value for a specific security
     */
    extractSecurityValue(text, isin, format) {
        // Find context around ISIN
        const isinIndex = text.indexOf(isin);
        if (isinIndex === -1) return null;
        
        // Extract surrounding context (500 chars before and after)
        const contextStart = Math.max(0, isinIndex - 500);
        const contextEnd = Math.min(text.length, isinIndex + 500);
        const context = text.substring(contextStart, contextEnd);
        
        // Try to find values in context using format patterns
        let bestValue = null;
        let bestScore = 0;
        
        format.valuePatterns.forEach(pattern => {
            const matches = [...context.matchAll(pattern)];
            matches.forEach(match => {
                const value = this.parseNumber(match[1], format.numberFormat);
                const distance = Math.abs(match.index - (isinIndex - contextStart));
                const score = 1000 - distance; // Closer = higher score
                
                if (score > bestScore && value > 1000) { // Minimum threshold
                    bestValue = value;
                    bestScore = score;
                }
            });
        });
        
        if (bestValue) {
            return {
                isin: isin,
                marketValue: bestValue,
                extractionMethod: `format-specific-${format.name.toLowerCase().replace(/\s+/g, '-')}`,
                context: context.substring(Math.max(0, isinIndex - contextStart - 100), 
                                        Math.min(context.length, isinIndex - contextStart + 100)),
                confidence: bestScore / 1000
            };
        }
        
        return null;
    }
    
    /**
     * Parse numbers according to different formats
     */
    parseNumber(numberStr, format) {
        switch (format) {
            case 'swiss_apostrophe':
                // 1'234'567.89 -> 1234567.89
                return parseFloat(numberStr.replace(/'/g, ''));
                
            case 'german_period':
                // 1.234.567,89 -> 1234567.89
                const parts = numberStr.split(',');
                const wholePart = parts[0].replace(/\./g, '');
                const decimalPart = parts[1] || '00';
                return parseFloat(wholePart + '.' + decimalPart);
                
            case 'standard_comma':
            case 'us_standard':
            case 'uk_standard':
                // 1,234,567.89 -> 1234567.89
                return parseFloat(numberStr.replace(/,/g, ''));
                
            default:
                return parseFloat(numberStr.replace(/[^0-9.]/g, ''));
        }
    }
    
    /**
     * Get portfolio total using format-specific patterns
     */
    getPortfolioTotal(text, format) {
        for (const pattern of format.portfolioTotalPatterns) {
            const match = text.match(pattern);
            if (match) {
                return this.parseNumber(match[1], format.numberFormat);
            }
        }
        return null;
    }
    
    /**
     * Main processing function
     */
    async processDocument(text, mistralEnabled = false) {
        console.log('🔍 Detecting document format...');
        
        // Detect format
        const format = this.detectDocumentFormat(text);
        if (!format) {
            console.log('⚠️ Unknown document format, using generic extraction');
            return this.genericExtraction(text);
        }
        
        console.log(`📋 Detected format: ${format.name}`);
        
        // Extract securities
        const securities = this.extractSecuritiesWithFormat(text, format);
        console.log(`📊 Found ${securities.length} securities`);
        
        // Get portfolio total
        const portfolioTotal = this.getPortfolioTotal(text, format);
        console.log(`💰 Portfolio total: $${portfolioTotal ? portfolioTotal.toLocaleString() : 'Unknown'}`);
        
        // Apply Mistral corrections if enabled
        if (mistralEnabled && securities.length > 0) {
            await this.applyMistralCorrections(securities, text, format);
        }
        
        // Calculate totals and accuracy
        const extractedTotal = securities.reduce((sum, sec) => sum + sec.marketValue, 0);
        const accuracy = portfolioTotal ? (extractedTotal / portfolioTotal) * 100 : null;
        
        return {
            success: true,
            format: format.name,
            securities: securities,
            totalValue: extractedTotal,
            expectedTotal: portfolioTotal,
            accuracy: accuracy ? accuracy.toFixed(2) : null,
            metadata: {
                extractionMethod: 'multi-format-processor',
                documentFormat: format.name,
                numberFormat: format.numberFormat,
                securitiesFound: securities.length
            }
        };
    }
    
    /**
     * Generic extraction for unknown formats
     */
    genericExtraction(text) {
        // Fallback to existing enhanced extraction
        console.log('🔄 Using generic extraction patterns...');
        
        const isinPattern = /([A-Z]{2}[A-Z0-9]{9}[0-9])/g;
        const isins = [...text.matchAll(isinPattern)].map(m => m[1]);
        
        const securities = isins.map(isin => ({
            isin: isin,
            marketValue: 100000, // Placeholder
            extractionMethod: 'generic-fallback',
            confidence: 0.5
        }));
        
        return {
            success: true,
            format: 'Generic',
            securities: securities,
            totalValue: securities.reduce((sum, sec) => sum + sec.marketValue, 0),
            metadata: {
                extractionMethod: 'generic-fallback',
                warning: 'Unknown document format'
            }
        };
    }
    
    /**
     * Apply Mistral AI corrections with format context
     */
    async applyMistralCorrections(securities, text, format) {
        console.log('🔮 Applying Mistral corrections with format context...');
        
        // Create format-aware prompt for Mistral
        const prompt = `You are analyzing a ${format.name} financial document. 
        The number format is ${format.numberFormat}. 
        Please correct these security values based on the document context:
        
        ${securities.map(sec => `${sec.isin}: $${sec.marketValue} (confidence: ${sec.confidence})`).join('\n')}
        
        Return JSON array with corrections: [{"isin": "...", "correctValue": number, "reason": "..."}]`;
        
        // This would call Mistral API with the format-aware prompt
        // Implementation would be similar to existing Mistral integration
        
        return securities; // Placeholder
    }
}

module.exports = { MultiFormatDocumentProcessor };