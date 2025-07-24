/**
 * GENERIC PORTFOLIO PARSER
 * 
 * Fallback parser for general portfolio documents that don't match
 * specific institution patterns. Provides baseline financial data extraction.
 */

class GenericPortfolioParser {
    constructor() {
        this.patterns = this.initializeGenericPatterns();
    }

    initializeGenericPatterns() {
        return {
            // Generic portfolio patterns
            totalValue: [
                /Total[:\s]*([0-9,]+(?:\.[0-9]{2})?)/gi,
                /Portfolio[:\s]*([0-9,]+(?:\.[0-9]{2})?)/gi,
                /Net Worth[:\s]*([0-9,]+(?:\.[0-9]{2})?)/gi,
                /Assets[:\s]*([0-9,]+(?:\.[0-9]{2})?)/gi
            ],
            
            // Generic asset allocation patterns
            allocations: {
                stocks: /(?:Stocks|Equities)[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(?([0-9.]+)%\)?/gi,
                bonds: /Bonds[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(?([0-9.]+)%\)?/gi,
                cash: /(?:Cash|Liquidity)[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(?([0-9.]+)%\)?/gi,
                funds: /(?:Funds|Mutual)[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(?([0-9.]+)%\)?/gi,
                other: /Other[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(?([0-9.]+)%\)?/gi
            },
            
            // Generic performance patterns
            performance: {
                ytd: /YTD[:\s]*([-+]?\d+(?:\.\d{1,4})?)\s*%/gi,
                oneYear: /(?:1\s*Year|Annual)[:\s]*([-+]?\d+(?:\.\d{1,4})?)\s*%/gi,
                total: /Total Return[:\s]*([-+]?\d+(?:\.\d{1,4})?)\s*%/gi
            },
            
            // Generic security patterns
            holdings: {
                symbol: /([A-Z]{1,5})\s+([A-Z][A-Za-z\s&\.]+)/g,
                shares: /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:shares|shs)/gi,
                value: /\$\s*([0-9,]+(?:\.[0-9]{2})?)/g
            }
        };
    }

    async parse(text, coreData) {
        try {
            console.log('📊 Applying generic portfolio parsing...');
            
            const specializedData = {
                securities: this.enhanceGenericSecurities(text, coreData.securities),
                portfolio: this.enhanceGenericPortfolio(text, coreData.portfolio),
                performance: this.enhanceGenericPerformance(text, coreData.performance),
                metadata: this.extractGenericMetadata(text)
            };
            
            console.log(`✅ Enhanced with generic portfolio patterns`);
            return specializedData;
            
        } catch (error) {
            console.error('❌ Generic portfolio parsing failed:', error.message);
            return {};
        }
    }

    enhanceGenericSecurities(text, coreSecurities) {
        // For generic documents, try to enhance with basic patterns
        return coreSecurities.map(security => {
            const enhanced = { ...security };
            
            // Try to find additional context around the ISIN
            const isinContext = this.findISINContext(text, security.isin);
            if (isinContext) {
                enhanced.genericName = this.extractGenericName(isinContext);
                enhanced.genericValue = this.extractGenericValue(isinContext);
                enhanced.genericType = this.classifyGenericType(isinContext);
            }
            
            return enhanced;
        });
    }

    findISINContext(text, isin) {
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(isin)) {
                // Return context lines around the ISIN
                const start = Math.max(0, i - 2);
                const end = Math.min(lines.length, i + 3);
                return lines.slice(start, end).join(' ');
            }
        }
        return null;
    }

    extractGenericName(context) {
        // Generic name extraction patterns
        const namePatterns = [
            /([A-Z][A-Za-z\s&\.\-]{10,50})/,
            /ISIN[^A-Z]*([A-Z][A-Za-z\s&\.\-]{10,50})/
        ];
        
        for (const pattern of namePatterns) {
            const match = context.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return null;
    }

    extractGenericValue(context) {
        const valueMatches = [...context.matchAll(/([0-9,]+(?:\.[0-9]{2})?)/g)];
        if (valueMatches.length > 0) {
            // Return the largest value found
            const values = valueMatches.map(m => parseFloat(m[1].replace(/,/g, '')));
            return Math.max(...values).toLocaleString('en-US');
        }
        return null;
    }

    classifyGenericType(context) {
        if (/bond|note|debt/i.test(context)) return 'Bond';
        if (/stock|equity|share/i.test(context)) return 'Equity';
        if (/fund|etf/i.test(context)) return 'Fund';
        return 'Unknown';
    }

    enhanceGenericPortfolio(text, corePortfolio) {
        const enhanced = { ...corePortfolio };
        
        // Try to extract total value with generic patterns
        for (const pattern of this.patterns.totalValue) {
            const match = text.match(pattern);
            if (match) {
                enhanced.totalValue = parseFloat(match[1].replace(/,/g, '')).toLocaleString('en-US');
                break;
            }
        }
        
        // Extract generic allocations
        enhanced.genericAllocations = this.extractGenericAllocations(text);
        
        return enhanced;
    }

    extractGenericAllocations(text) {
        const allocations = {};
        
        for (const [type, pattern] of Object.entries(this.patterns.allocations)) {
            const match = text.match(pattern);
            if (match) {
                allocations[type] = {
                    value: parseFloat(match[1].replace(/,/g, '')).toLocaleString('en-US'),
                    percentage: parseFloat(match[2] || '0')
                };
            }
        }
        
        return allocations;
    }

    enhanceGenericPerformance(text, corePerformance) {
        const enhanced = { ...corePerformance };
        
        for (const [type, pattern] of Object.entries(this.patterns.performance)) {
            const match = text.match(pattern);
            if (match) {
                enhanced[type] = `${match[1]}%`;
            }
        }
        
        return enhanced;
    }

    extractGenericMetadata(text) {
        const metadata = {};
        
        // Try to extract basic account information
        const accountMatch = text.match(/Account[:\s]*([A-Z0-9\-]+)/i);
        if (accountMatch) metadata.account = accountMatch[1];
        
        // Try to extract date
        const dateMatch = text.match(/(?:Date|As of)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i);
        if (dateMatch) metadata.date = dateMatch[1];
        
        return metadata;
    }
}

module.exports = GenericPortfolioParser;
