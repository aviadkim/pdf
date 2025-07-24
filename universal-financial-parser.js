/**
 * UNIVERSAL FINANCIAL DOCUMENT PARSER
 * 
 * Modular system for parsing financial documents with:
 * - Core pattern recognition for securities, currencies, dates, performance
 * - Document type detection and routing
 * - Specialized parsers for different institutions
 * - Learning system for continuous improvement
 */

const fs = require('fs').promises;
const path = require('path');

class UniversalFinancialParser {
    constructor() {
        this.documentParsers = new Map();
        this.learningData = new Map();
        this.patterns = this.initializePatterns();
        this.registerDefaultParsers();
    }

    initializePatterns() {
        return {
            // Security identifiers (global standards)
            isin: /\b([A-Z]{2}[A-Z0-9]{10})\b/g,
            cusip: /\b([A-Z0-9]{9})\b/g,
            
            // Currency patterns (major currencies)
            currency: {
                usd: /\$\s*([0-9,]+(?:\.[0-9]{2})?)|([0-9,]+(?:\.[0-9]{2})?)\s*USD/gi,
                eur: /€\s*([0-9,]+(?:\.[0-9]{2})?)|([0-9,]+(?:\.[0-9]{2})?)\s*EUR/gi,
                chf: /CHF\s*([0-9,]+(?:\.[0-9]{2})?)|([0-9,]+(?:\.[0-9]{2})?)\s*CHF/gi,
                gbp: /£\s*([0-9,]+(?:\.[0-9]{2})?)|([0-9,]+(?:\.[0-9]{2})?)\s*GBP/gi,
                generic: /([0-9,]+(?:\.[0-9]{2})?)/g
            },
            
            // Date patterns (multiple formats)
            dates: {
                ddmmyyyy: /(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})/g,
                yyyymmdd: /(\d{4})[-\.\/](\d{1,2})[-\.\/](\d{1,2})/g,
                monthYear: /(\d{1,2})\.(\d{4})/g,
                maturity: /Maturity:\s*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/gi
            },
            
            // Performance metrics
            performance: {
                percentage: /([-+]?\d+(?:\.\d{1,4})?)\s*%/g,
                ytd: /YTD[:\s]*([-+]?\d+(?:\.\d{1,4})?)\s*%/gi,
                annual: /Annual[:\s]*([-+]?\d+(?:\.\d{1,4})?)\s*%/gi,
                twr: /TWR[:\s]*([-+]?\d+(?:\.\d{1,4})?)\s*%/gi
            },
            
            // Financial terms
            terms: {
                coupon: /Coupon[:\s]*([-+]?\d+(?:\.\d{1,4})?)\s*%/gi,
                yield: /Yield[:\s]*([-+]?\d+(?:\.\d{1,4})?)\s*%/gi,
                ytm: /YTM[:\s]*([-+]?\d+(?:\.\d{1,4})?)\s*%/gi,
                rating: /(Moody's|S&P|Fitch)[:\s]*([A-Z][a-z0-9]*)/gi
            },
            
            // Portfolio allocation
            allocation: {
                bonds: /Bonds[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(([0-9.]+)%\)/gi,
                equities: /Equities[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(([0-9.]+)%\)/gi,
                structured: /Structured\s+products[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(([0-9.]+)%\)/gi,
                liquidity: /Liquidity[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(([0-9.]+)%\)/gi
            }
        };
    }

    registerDefaultParsers() {
        // Register specialized parsers
        this.registerParser('messos-corner-banca', require('./parsers/messos-corner-banca-parser'));
        this.registerParser('generic-portfolio', require('./parsers/generic-portfolio-parser'));
    }

    registerParser(type, parserClass) {
        this.documentParsers.set(type, parserClass);
    }

    async parseDocument(text, options = {}) {
        try {
            console.log('🔍 Starting universal financial document parsing...');
            
            // Step 1: Detect document type
            const documentType = this.detectDocumentType(text);
            console.log(`📋 Detected document type: ${documentType}`);
            
            // Step 2: Extract core financial patterns
            const coreData = this.extractCoreFinancialData(text);
            console.log(`💰 Extracted ${coreData.securities.length} securities and core financial data`);
            
            // Step 3: Use specialized parser if available
            let specializedData = {};
            if (this.documentParsers.has(documentType)) {
                const SpecializedParser = this.documentParsers.get(documentType);
                const parser = new SpecializedParser();
                specializedData = await parser.parse(text, coreData);
                console.log(`🎯 Applied specialized ${documentType} parser`);
            }
            
            // Step 4: Merge and validate data
            const mergedData = this.mergeFinancialData(coreData, specializedData);
            
            // Step 5: Apply learning improvements
            const enhancedData = this.applyLearningImprovements(mergedData, options);
            
            const result = {
                success: true,
                documentType,
                extractedData: enhancedData,
                processingTime: Date.now() - (options.startTime || Date.now()),
                confidence: this.calculateConfidence(enhancedData),
                suggestions: this.generateSuggestions(enhancedData)
            };
            
            console.log(`✅ Universal parsing completed with ${result.confidence}% confidence`);
            return result;
            
        } catch (error) {
            console.error('❌ Universal financial parsing failed:', error.message);
            return {
                success: false,
                error: error.message,
                fallbackData: this.extractCoreFinancialData(text)
            };
        }
    }

    detectDocumentType(text) {
        const detectionPatterns = {
            'messos-corner-banca': [
                /Cornèr Banca SA/i,
                /MESSOS ENTERPRISES/i,
                /Valuation as of/i,
                /Swift CBLUCH2280A/i
            ],
            'ubs-portfolio': [
                /UBS Switzerland AG/i,
                /Portfolio Report/i,
                /UBS Group/i
            ],
            'credit-suisse': [
                /Credit Suisse/i,
                /CS Portfolio/i,
                /Investment Report/i
            ],
            'generic-portfolio': [
                /Portfolio/i,
                /Asset Allocation/i,
                /Performance/i,
                /Holdings/i
            ],
            'bank-statement': [
                /Statement/i,
                /Account Balance/i,
                /Transaction/i
            ]
        };

        for (const [type, patterns] of Object.entries(detectionPatterns)) {
            const matches = patterns.filter(pattern => pattern.test(text)).length;
            if (matches >= 2) {
                return type;
            }
        }

        return 'generic-financial';
    }

    extractCoreFinancialData(text) {
        const data = {
            securities: this.extractSecurities(text),
            portfolio: this.extractPortfolioData(text),
            performance: this.extractPerformanceData(text),
            currencies: this.extractCurrencyData(text),
            dates: this.extractDates(text),
            metadata: this.extractMetadata(text)
        };

        return data;
    }

    extractSecurities(text) {
        const securities = [];
        const lines = text.split('\n');

        // Find ISIN codes and extract surrounding context
        const isinRegex = /\b([A-Z]{2}[A-Z0-9]{10})\b/g;
        const isinMatches = [...text.matchAll(isinRegex)];

        isinMatches.forEach((match, index) => {
            const isin = match[1];
            const matchIndex = match.index;

            // Find the line containing this ISIN
            let lineIndex = this.findLineIndex(lines, matchIndex);

            // Extract context (3 lines before and after)
            const contextLines = lines.slice(
                Math.max(0, lineIndex - 3),
                Math.min(lines.length, lineIndex + 4)
            );
            const context = contextLines.join(' ').trim();

            const security = {
                isin,
                index: index + 1,
                context,
                name: this.extractSecurityName(context),
                value: this.extractSecurityValue(context),
                currency: this.extractSecurityCurrency(context),
                yield: this.extractYield(context),
                maturity: this.extractMaturity(context),
                rating: this.extractRating(context),
                performance: this.extractSecurityPerformance(context),
                coupon: this.extractCoupon(context),
                type: this.classifySecurityType(context)
            };

            securities.push(security);
        });

        return securities;
    }

    extractPortfolioData(text) {
        const portfolio = {
            totalValue: this.extractTotalValue(text),
            allocations: this.extractAllocations(text),
            currency: this.extractBaseCurrency(text),
            valuationDate: this.extractValuationDate(text),
            accountInfo: this.extractAccountInfo(text)
        };
        
        return portfolio;
    }

    extractPerformanceData(text) {
        const performance = {
            ytd: this.extractYTDPerformance(text),
            annual: this.extractAnnualPerformance(text),
            twr: this.extractTWR(text),
            earnings: this.extractEarnings(text)
        };
        
        return performance;
    }

    // Helper methods for specific data extraction
    findLineIndex(lines, charIndex) {
        let currentIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (currentIndex + lines[i].length >= charIndex) {
                return i;
            }
            currentIndex += lines[i].length + 1; // +1 for newline
        }
        return lines.length - 1;
    }

    extractSecurityName(context) {
        // Look for security names in various formats
        const namePatterns = [
            /([A-Z][A-Z\s&\.\-]+(?:BANK|NOTES|BOND|FUND|GROUP|INC|LTD|AG|SA)[A-Z\s\.\-]*)/i,
            /ISIN:\s*[A-Z0-9]+[^A-Z]*([A-Z][A-Z\s&\.\-]{10,})/i,
            /Valorn\.[^A-Z]*([A-Z][A-Z\s&\.\-]{10,})/i
        ];
        
        for (const pattern of namePatterns) {
            const match = context.match(pattern);
            if (match && match[1] && match[1].length > 10 && match[1].length < 100) {
                return match[1].trim();
            }
        }
        
        return null;
    }

    extractSecurityValue(context) {
        // Extract monetary values with better precision
        const valuePatterns = [
            /([0-9,]+\.[0-9]{2})\s*(?:USD|EUR|CHF|GBP)/gi,
            /(?:USD|EUR|CHF|GBP)\s*([0-9,]+\.[0-9]{2})/gi,
            /([0-9,]+\.[0-9]{2})(?!\s*%)/g
        ];

        for (const pattern of valuePatterns) {
            try {
                const matches = [...context.matchAll(pattern)];
                if (matches.length > 0) {
                    // Return the largest value found (likely the market value)
                    const values = matches.map(m => parseFloat(m[1].replace(/,/g, '')));
                    return Math.max(...values).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                }
            } catch (error) {
                // Skip this pattern if it causes issues
                continue;
            }
        }

        return null;
    }

    extractSecurityCurrency(context) {
        const currencyMatch = context.match(/(USD|EUR|CHF|GBP)/i);
        return currencyMatch ? currencyMatch[1].toUpperCase() : null;
    }

    extractYield(context) {
        const yieldMatch = context.match(/(?:Yield|YTM)[:\s]*([-+]?\d+(?:\.\d{1,4})?)\s*%/i);
        return yieldMatch ? `${yieldMatch[1]}%` : null;
    }

    extractMaturity(context) {
        const maturityMatch = context.match(/Maturity[:\s]*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i);
        return maturityMatch ? maturityMatch[1] : null;
    }

    extractRating(context) {
        const ratingMatch = context.match(/(Moody's|S&P|Fitch)[:\s]*([A-Z][a-z0-9]*)/i);
        return ratingMatch ? `${ratingMatch[1]}: ${ratingMatch[2]}` : null;
    }

    extractSecurityPerformance(context) {
        const perfMatch = context.match(/([-+]?\d+(?:\.\d{1,4})?)\s*%/);
        return perfMatch ? `${perfMatch[1]}%` : null;
    }

    extractCoupon(context) {
        const couponMatch = context.match(/Coupon[:\s]*([-+]?\d+(?:\.\d{1,4})?)\s*%/i);
        return couponMatch ? `${couponMatch[1]}%` : null;
    }

    classifySecurityType(context) {
        if (/bond|notes/i.test(context)) return 'Bond';
        if (/equity|stock|shares/i.test(context)) return 'Equity';
        if (/fund/i.test(context)) return 'Fund';
        if (/structured/i.test(context)) return 'Structured Product';
        return 'Unknown';
    }

    extractTotalValue(text) {
        const totalPatterns = [
            /Total[:\s]*([0-9,]+(?:\.[0-9]{2})?)/gi,
            /Portfolio Total[:\s]*([0-9,]+(?:\.[0-9]{2})?)/gi,
            /Total assets[:\s]*([0-9,]+(?:\.[0-9]{2})?)/gi
        ];

        for (const pattern of totalPatterns) {
            const match = text.match(pattern);
            if (match) {
                return parseFloat(match[1].replace(/,/g, '')).toLocaleString('en-US');
            }
        }
        return null;
    }

    extractAllocations(text) {
        const allocations = {};

        // Extract asset allocations with values and percentages
        const allocationPatterns = {
            bonds: /Bonds[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(([0-9.]+)%\)/gi,
            equities: /Equities[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(([0-9.]+)%\)/gi,
            structured: /Structured\s+products[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(([0-9.]+)%\)/gi,
            liquidity: /Liquidity[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(([0-9.]+)%\)/gi,
            other: /Other\s+assets[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(([0-9.]+)%\)/gi
        };

        for (const [type, pattern] of Object.entries(allocationPatterns)) {
            const match = text.match(pattern);
            if (match) {
                allocations[type] = {
                    value: parseFloat(match[1].replace(/,/g, '')).toLocaleString('en-US'),
                    percentage: parseFloat(match[2])
                };
            }
        }

        return allocations;
    }

    extractBaseCurrency(text) {
        const currencyMatch = text.match(/Valuation currency[:\s]*([A-Z]{3})/i) ||
                             text.match(/Base currency[:\s]*([A-Z]{3})/i) ||
                             text.match(/Currency[:\s]*([A-Z]{3})/i);
        return currencyMatch ? currencyMatch[1] : 'USD';
    }

    extractValuationDate(text) {
        const dateMatch = text.match(/Valuation as of[:\s]*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i) ||
                          text.match(/as of[:\s]*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i);
        return dateMatch ? dateMatch[1] : null;
    }

    extractAccountInfo(text) {
        const accountMatch = text.match(/Client Number[:\s]*([0-9]+)/i) ||
                            text.match(/Account[:\s]*([A-Z0-9\-]+)/i);
        return accountMatch ? accountMatch[1] : null;
    }

    extractYTDPerformance(text) {
        const ytdMatch = text.match(/YTD[^%]*?([-+]?\d+(?:\.\d{1,4})?)\s*%/i) ||
                        text.match(/Performance[^%]*?([-+]?\d+(?:\.\d{1,4})?)\s*%/i);
        return ytdMatch ? `${ytdMatch[1]}%` : null;
    }

    extractAnnualPerformance(text) {
        const annualMatch = text.match(/Performance 2024[^%]*?([-+]?\d+(?:\.\d{1,4})?)\s*%/i) ||
                           text.match(/Annual[^%]*?([-+]?\d+(?:\.\d{1,4})?)\s*%/i);
        return annualMatch ? `${annualMatch[1]}%` : null;
    }

    extractTWR(text) {
        const twrMatch = text.match(/TWR[^%]*?([-+]?\d+(?:\.\d{1,4})?)\s*%/i);
        return twrMatch ? `${twrMatch[1]}%` : null;
    }

    extractEarnings(text) {
        const earningsMatch = text.match(/Earnings[:\s]*([0-9,]+(?:\.[0-9]{2})?)/i) ||
                             text.match(/Collected[:\s]*([0-9,]+(?:\.[0-9]{2})?)/i);
        return earningsMatch ? parseFloat(earningsMatch[1].replace(/,/g, '')).toLocaleString('en-US') : null;
    }

    extractCurrencyData(text) {
        const currencies = {};
        const currencyPatterns = {
            USD: /USD[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(([0-9.]+)%\)/gi,
            EUR: /EUR[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(([0-9.]+)%\)/gi,
            CHF: /CHF[:\s]*([0-9,]+(?:\.[0-9]{2})?)[^%]*\(([0-9.]+)%\)/gi
        };

        for (const [currency, pattern] of Object.entries(currencyPatterns)) {
            const match = text.match(pattern);
            if (match) {
                currencies[currency] = {
                    value: parseFloat(match[1].replace(/,/g, '')).toLocaleString('en-US'),
                    percentage: parseFloat(match[2])
                };
            }
        }

        return currencies;
    }

    extractDates(text) {
        const dates = {};

        // Extract various important dates
        const datePatterns = {
            valuation: /Valuation as of[:\s]*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i,
            print: /Print date[:\s]*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i,
            period: /Period[:\s]*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})[^0-9]*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i
        };

        for (const [type, pattern] of Object.entries(datePatterns)) {
            const match = text.match(pattern);
            if (match) {
                dates[type] = type === 'period' ? [match[1], match[2]] : match[1];
            }
        }

        return dates;
    }

    extractMetadata(text) {
        const metadata = {};

        // Extract bank/institution information
        const bankMatch = text.match(/([\w\s]+Bank[a-zA-Z\s]*|[\w\s]+Banca[a-zA-Z\s]*)/i);
        if (bankMatch) metadata.institution = bankMatch[1].trim();

        // Extract client information
        const clientMatch = text.match(/([A-Z\s]+(?:LTD|INC|AG|SA|ENTERPRISES))/i);
        if (clientMatch) metadata.client = clientMatch[1].trim();

        // Extract risk profile
        const riskMatch = text.match(/Risk Profile[:\s]*([A-Za-z\-]+)/i);
        if (riskMatch) metadata.riskProfile = riskMatch[1];

        return metadata;
    }

    mergeFinancialData(coreData, specializedData) {
        // Merge core and specialized data, with specialized taking precedence
        const merged = { ...coreData };

        if (specializedData.securities) {
            // Enhance securities with specialized data
            merged.securities = merged.securities.map(security => {
                const specialized = specializedData.securities.find(s => s.isin === security.isin);
                return specialized ? { ...security, ...specialized } : security;
            });
        }

        if (specializedData.portfolio) {
            merged.portfolio = { ...merged.portfolio, ...specializedData.portfolio };
        }

        if (specializedData.performance) {
            merged.performance = { ...merged.performance, ...specializedData.performance };
        }

        return merged;
    }

    applyLearningImprovements(data, options) {
        // Apply any learned improvements from previous annotations
        if (options.learningData) {
            // Apply learned patterns and corrections
            // This will be enhanced as the learning system develops
        }

        return data;
    }

    calculateConfidence(data) {
        let score = 0;
        let maxScore = 0;

        // Portfolio data confidence
        if (data.portfolio.totalValue) score += 20;
        if (data.portfolio.valuationDate) score += 10;
        if (Object.keys(data.portfolio.allocations).length > 0) score += 20;
        maxScore += 50;

        // Securities confidence
        const securitiesWithNames = data.securities.filter(s => s.name).length;
        const securitiesWithValues = data.securities.filter(s => s.value).length;
        score += (securitiesWithNames / data.securities.length) * 25;
        score += (securitiesWithValues / data.securities.length) * 25;
        maxScore += 50;

        return Math.round((score / maxScore) * 100);
    }

    generateSuggestions(data) {
        const suggestions = [];

        // Check for missing data and suggest improvements
        const securitiesWithoutNames = data.securities.filter(s => !s.name).length;
        if (securitiesWithoutNames > 0) {
            suggestions.push({
                type: 'missing_data',
                field: 'Security Names',
                count: securitiesWithoutNames,
                suggestion: 'Consider using annotation tools to mark security names for improved extraction'
            });
        }

        const securitiesWithoutValues = data.securities.filter(s => !s.value).length;
        if (securitiesWithoutValues > 0) {
            suggestions.push({
                type: 'missing_data',
                field: 'Security Values',
                count: securitiesWithoutValues,
                suggestion: 'Mark security values in the document to improve parsing accuracy'
            });
        }

        if (!data.portfolio.totalValue) {
            suggestions.push({
                type: 'missing_data',
                field: 'Portfolio Total',
                suggestion: 'Total portfolio value not found - please verify document format'
            });
        }

        return suggestions;
    }
}

module.exports = { UniversalFinancialParser };
