/**
 * MESSOS/CORNÈR BANCA SPECIALIZED PARSER
 * 
 * Specialized parser for Swiss banking portfolio reports from Cornèr Banca SA
 * Optimized for Messos Enterprises format and similar Swiss banking documents
 */

class MessosCornerBancaParser {
    constructor() {
        this.patterns = this.initializeSpecializedPatterns();
    }

    initializeSpecializedPatterns() {
        return {
            // Swiss banking specific patterns
            client: /([A-Z\s]+(?:ENTERPRISES|LTD|INC|AG|SA))[^0-9]*(\d+)/i,
            bank: /(Cornèr Banca SA)/i,
            swift: /Swift\s+([A-Z0-9]+)/i,
            
            // Portfolio structure patterns
            assetSections: {
                liquidity: /Liquidity and liabilities([\s\S]*?)(?=Bonds|$)/i,
                bonds: /Bonds([\s\S]*?)(?=Equities|Structured products|$)/i,
                equities: /Equities([\s\S]*?)(?=Structured products|Other assets|$)/i,
                structured: /Structured products([\s\S]*?)(?=Other assets|Expected Cash|$)/i,
                other: /Other assets([\s\S]*?)(?=Expected Cash|Glossary|$)/i
            },
            
            // Security detail patterns (Swiss format)
            securityDetails: {
                name: /([A-Z][A-Z\s&\.\-]+(?:BANK|NOTES|BOND|FUND|GROUP|INC|LTD|AG|SA)[A-Z\s\.\-0-9]*)/i,
                nominal: /([0-9,]+(?:\.[0-9]{2})?)\s*(?=\s|$)/,
                price: /(\d+\.\d+)\s*(\d+\.\d+)\s*([0-9,]+)/,
                maturity: /Maturity:\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
                coupon: /Coupon:\s*(\d{1,2}\.\d{1,2})\s*\/\/\s*([A-Za-z]+)\s*([\d.]+)%/i,
                rating: /(Moody's|S&P|Fitch):\s*([A-Z][a-z0-9]*)/i,
                performance: /([-+]?\d+\.\d{2})%\s*([-+]?\d+\.\d{2})%/
            },
            
            // Portfolio summary patterns
            summary: {
                totalAssets: /Total\s*([0-9,']+)\s*100\.00%/i,
                allocations: /([A-Za-z\s]+)\s*([0-9,']+)\s*(\d+\.\d{2})%/g,
                performance: /Performance TWR\s*([-+]?\d+\.\d{2})%/i,
                earnings: /Collected\s*([0-9,']+)/i
            },
            
            // Currency breakdown
            currencies: /Currencies\s*Value\s*Exchange Rates\s*Countervalue USD\s*Weight in %\s*([\s\S]*?)(?=Total|$)/i
        };
    }

    async parse(text, coreData) {
        try {
            console.log('🇨🇭 Applying Messos/Cornèr Banca specialized parsing...');
            
            const specializedData = {
                securities: this.enhanceSecurities(text, coreData.securities),
                portfolio: this.enhancePortfolio(text, coreData.portfolio),
                performance: this.enhancePerformance(text, coreData.performance),
                metadata: this.extractSwissBankingMetadata(text),
                assetBreakdown: this.extractDetailedAssetBreakdown(text)
            };
            
            console.log(`✅ Enhanced ${specializedData.securities.length} securities with Swiss banking details`);
            return specializedData;
            
        } catch (error) {
            console.error('❌ Messos specialized parsing failed:', error.message);
            return {};
        }
    }

    enhanceSecurities(text, coreSecurities) {
        const enhancedSecurities = [];
        
        // Extract asset sections for better context
        const assetSections = this.extractAssetSections(text);
        
        coreSecurities.forEach(security => {
            const enhanced = { ...security };
            
            // Find which section this security belongs to
            const section = this.findSecuritySection(security.isin, assetSections);
            if (section) {
                enhanced.assetClass = section.type;
                enhanced.sectionContext = section.content;
                
                // Extract detailed information from section context
                const details = this.extractSecurityDetails(security.isin, section.content);
                Object.assign(enhanced, details);
            }
            
            enhancedSecurities.push(enhanced);
        });
        
        return enhancedSecurities;
    }

    extractAssetSections(text) {
        const sections = {};
        
        for (const [sectionName, pattern] of Object.entries(this.patterns.assetSections)) {
            const match = text.match(pattern);
            if (match) {
                sections[sectionName] = {
                    type: sectionName,
                    content: match[1].trim()
                };
            }
        }
        
        return sections;
    }

    findSecuritySection(isin, sections) {
        for (const section of Object.values(sections)) {
            if (section.content.includes(isin)) {
                return section;
            }
        }
        return null;
    }

    extractSecurityDetails(isin, sectionText) {
        const details = {};
        
        // Find the specific lines for this ISIN
        const lines = sectionText.split('\n');
        let isinLineIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(isin)) {
                isinLineIndex = i;
                break;
            }
        }
        
        if (isinLineIndex === -1) return details;
        
        // Extract context around the ISIN (previous and next few lines)
        const contextLines = lines.slice(
            Math.max(0, isinLineIndex - 2),
            Math.min(lines.length, isinLineIndex + 5)
        );
        const context = contextLines.join(' ');
        
        // Extract detailed security information
        details.fullName = this.extractFullSecurityName(context);
        details.nominal = this.extractNominalValue(context);
        details.marketPrice = this.extractMarketPrice(context);
        details.marketValue = this.extractMarketValue(context);
        details.maturityDate = this.extractMaturityDate(context);
        details.couponRate = this.extractCouponRate(context);
        details.creditRating = this.extractCreditRating(context);
        details.ytdPerformance = this.extractYTDPerformance(context);
        details.marketPerformance = this.extractMarketPerformance(context);
        details.securityType = this.classifySecurityType(context);
        details.currency = this.extractCurrency(context);
        
        return details;
    }

    extractFullSecurityName(context) {
        // Enhanced name extraction for Swiss banking format
        const namePatterns = [
            /([A-Z][A-Z\s&\.\-]+(?:BANK|NOTES|BOND|FUND|GROUP|INC|LTD|AG|SA)[A-Z\s\.\-0-9]*)/i,
            /ISIN:[^A-Z]*([A-Z][A-Z\s&\.\-]{15,})/i,
            /Valorn\.[^A-Z]*([A-Z][A-Z\s&\.\-]{15,})/i
        ];
        
        for (const pattern of namePatterns) {
            const match = context.match(pattern);
            if (match && match[1]) {
                let name = match[1].trim();
                // Clean up the name
                name = name.replace(/\s+/g, ' ');
                name = name.replace(/\s*\/\/.*$/, ''); // Remove trailing comments
                if (name.length > 10 && name.length < 150) {
                    return name;
                }
            }
        }
        return null;
    }

    extractNominalValue(context) {
        // Extract nominal/quantity value
        const nominalMatch = context.match(/([0-9,]+(?:\.[0-9]{2})?)\s*(?=[A-Z]|ISIN)/);
        return nominalMatch ? nominalMatch[1] : null;
    }

    extractMarketPrice(context) {
        // Extract current market price
        const priceMatch = context.match(/(\d+\.\d{4,6})/);
        return priceMatch ? parseFloat(priceMatch[1]) : null;
    }

    extractMarketValue(context) {
        // Extract market value (usually the largest number)
        const valueMatches = [...context.matchAll(/([0-9,]+)(?!\.[0-9]{4})/g)];
        if (valueMatches.length > 0) {
            const values = valueMatches
                .map(m => parseInt(m[1].replace(/,/g, '')))
                .filter(v => v > 1000); // Filter out small numbers
            
            if (values.length > 0) {
                return Math.max(...values).toLocaleString('en-US');
            }
        }
        return null;
    }

    extractMaturityDate(context) {
        const maturityMatch = context.match(/Maturity:\s*(\d{1,2}\.\d{1,2}\.\d{4})/i);
        return maturityMatch ? maturityMatch[1] : null;
    }

    extractCouponRate(context) {
        const couponMatch = context.match(/Coupon:\s*(\d{1,2}\.\d{1,2})\s*\/\/\s*([A-Za-z]+)\s*([\d.]+)%/i);
        return couponMatch ? {
            date: couponMatch[1],
            frequency: couponMatch[2],
            rate: `${couponMatch[3]}%`
        } : null;
    }

    extractCreditRating(context) {
        const ratingMatch = context.match(/(Moody's|S&P|Fitch):\s*([A-Z][a-z0-9]*)/i);
        return ratingMatch ? `${ratingMatch[1]}: ${ratingMatch[2]}` : null;
    }

    extractYTDPerformance(context) {
        const perfMatch = context.match(/([-+]?\d+\.\d{2})%/);
        return perfMatch ? `${perfMatch[1]}%` : null;
    }

    extractMarketPerformance(context) {
        const perfMatches = [...context.matchAll(/([-+]?\d+\.\d{2})%/g)];
        return perfMatches.length > 1 ? `${perfMatches[1][1]}%` : null;
    }

    classifySecurityType(context) {
        if (/Ordinary Bonds|Zero Bonds|Structured Bonds/i.test(context)) return 'Bond';
        if (/Ordinary Stocks|Equity/i.test(context)) return 'Equity';
        if (/Fund|Certificate/i.test(context)) return 'Fund';
        if (/Structured products/i.test(context)) return 'Structured Product';
        if (/Money Market|MM secs/i.test(context)) return 'Money Market';
        return 'Unknown';
    }

    extractCurrency(context) {
        const currencyMatch = context.match(/(USD|EUR|CHF|GBP)/);
        return currencyMatch ? currencyMatch[1] : 'USD';
    }

    enhancePortfolio(text, corePortfolio) {
        const enhanced = { ...corePortfolio };
        
        // Extract precise portfolio totals
        const totalMatch = text.match(/Total\s*([0-9,']+)\s*100\.00%/);
        if (totalMatch) {
            enhanced.totalValue = parseInt(totalMatch[1].replace(/[,']/g, '')).toLocaleString('en-US');
        }
        
        // Extract detailed allocations
        enhanced.detailedAllocations = this.extractDetailedAllocations(text);
        
        // Extract currency breakdown
        enhanced.currencyBreakdown = this.extractCurrencyBreakdown(text);
        
        return enhanced;
    }

    extractDetailedAllocations(text) {
        const allocations = {};
        
        // More precise allocation extraction
        const allocationPatterns = {
            liquidity: /Liquidity\s*([0-9,']+)\s*(\d+\.\d{2})%/i,
            bonds: /Bonds\s*([0-9,']+)\s*(\d+\.\d{2})%/i,
            equities: /Equities\s*([0-9,']+)\s*(\d+\.\d{2})%/i,
            structured: /Structured products\s*([0-9,']+)\s*(\d+\.\d{2})%/i,
            other: /Other assets\s*([0-9,']+)\s*(\d+\.\d{2})%/i
        };
        
        for (const [type, pattern] of Object.entries(allocationPatterns)) {
            const match = text.match(pattern);
            if (match) {
                allocations[type] = {
                    value: parseInt(match[1].replace(/[,']/g, '')).toLocaleString('en-US'),
                    percentage: parseFloat(match[2])
                };
            }
        }
        
        return allocations;
    }

    extractCurrencyBreakdown(text) {
        const currencies = {};
        
        // Extract currency section
        const currencySection = text.match(this.patterns.currencies);
        if (currencySection) {
            const currencyText = currencySection[1];
            
            // Parse currency lines
            const currencyLines = currencyText.split('\n').filter(line => line.trim());
            currencyLines.forEach(line => {
                const match = line.match(/([A-Z]{3})\s*([0-9,']+)\s*[\d.]*\s*([0-9,']+)\s*(\d+\.\d{2})%/);
                if (match) {
                    currencies[match[1]] = {
                        localValue: parseInt(match[2].replace(/[,']/g, '')).toLocaleString('en-US'),
                        usdValue: parseInt(match[3].replace(/[,']/g, '')).toLocaleString('en-US'),
                        percentage: parseFloat(match[4])
                    };
                }
            });
        }
        
        return currencies;
    }

    enhancePerformance(text, corePerformance) {
        const enhanced = { ...corePerformance };
        
        // Extract detailed performance metrics
        const twrMatch = text.match(/Performance TWR\s*([-+]?\d+\.\d{2})%/i);
        if (twrMatch) enhanced.twr = `${twrMatch[1]}%`;
        
        const earningsMatch = text.match(/Collected\s*([0-9,']+)/i);
        if (earningsMatch) enhanced.earnings = parseInt(earningsMatch[1].replace(/[,']/g, '')).toLocaleString('en-US');
        
        const accrualsMatch = text.match(/Accruals\s*([0-9,']+)/i);
        if (accrualsMatch) enhanced.accruals = parseInt(accrualsMatch[1].replace(/[,']/g, '')).toLocaleString('en-US');
        
        return enhanced;
    }

    extractSwissBankingMetadata(text) {
        const metadata = {};
        
        // Extract Swiss banking specific information
        const clientMatch = text.match(/([A-Z\s]+(?:ENTERPRISES|LTD|INC|AG|SA))[^0-9]*(\d+)/i);
        if (clientMatch) {
            metadata.clientName = clientMatch[1].trim();
            metadata.clientNumber = clientMatch[2];
        }
        
        const bankMatch = text.match(/(Cornèr Banca SA)/i);
        if (bankMatch) metadata.bank = bankMatch[1];
        
        const swiftMatch = text.match(/Swift\s+([A-Z0-9]+)/i);
        if (swiftMatch) metadata.swiftCode = swiftMatch[1];
        
        const clearingMatch = text.match(/Clearing\s+(\d+)/i);
        if (clearingMatch) metadata.clearingNumber = clearingMatch[1];
        
        return metadata;
    }

    extractDetailedAssetBreakdown(text) {
        const breakdown = {};
        
        // Extract sub-category breakdowns
        const subCategories = {
            'Cash accounts': /Cash accounts\s*([0-9,']+)\s*(\d+\.\d{2})%/i,
            'Money Market': /Money Market\s*([0-9,']+)\s*(\d+\.\d{2})%/i,
            'Bond funds': /Bond funds[^0-9]*([0-9,']+)\s*(\d+\.\d{2})%/i,
            'Structured products (Bonds)': /Structured products \(Bonds\)\s*([0-9,']+)\s*(\d+\.\d{2})%/i,
            'Structured products (Equities)': /Structured products \(Equities\)\s*([0-9,']+)\s*(\d+\.\d{2})%/i,
            'Hedge Funds & Private Equity': /Hedge Funds & Private Equity\s*([0-9,']+)\s*(\d+\.\d{2})%/i
        };
        
        for (const [category, pattern] of Object.entries(subCategories)) {
            const match = text.match(pattern);
            if (match) {
                breakdown[category] = {
                    value: parseInt(match[1].replace(/[,']/g, '')).toLocaleString('en-US'),
                    percentage: parseFloat(match[2])
                };
            }
        }
        
        return breakdown;
    }
}

module.exports = MessosCornerBancaParser;
