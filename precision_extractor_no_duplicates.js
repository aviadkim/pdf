/**
 * Precision PDF Extractor - No Duplicate Counting
 * Detects and excludes summary sections to achieve accurate extraction
 */

const fs = require('fs');
const pdf = require('pdf-parse');

class PrecisionExtractorNoDuplicates {
    constructor() {
        this.debugMode = true;
        
        // Patterns for financial documents
        this.patterns = {
            isin: /\b[A-Z]{2}[A-Z0-9]{10}\b/g,
            swissAmount: /\b\d{1,3}(?:'\d{3})*(?:\.\d{2})?\b/g,
            currency: /\b(CHF|USD|EUR)\b/g,
            
            // Summary section indicators
            summaryIndicators: [
                /\bTotal\s+(?:portfolio|assets|securities)\b/gi,
                /\bSummary\b/gi,
                /\bGrand\s+total\b/gi,
                /\bPortfolio\s+total\b/gi,
                /\bOverall\s+total\b/gi,
                /\bSubtotal\b/gi,
                /\bAggregate\b/gi,
                /\bPerformance\s+summary\b/gi
            ],
            
            // Section headers
            sectionHeaders: {
                bonds: /\b(?:Bonds|Bond funds|Convertible bonds)\b/gi,
                equities: /\b(?:Equities|Stocks|Shares)\b/gi,
                structured: /\b(?:Structured products)\b/gi,
                liquidity: /\b(?:Liquidity|Cash|Money market)\b/gi,
                other: /\b(?:Other assets|Alternative investments)\b/gi
            }
        };
        
        // Track sections to avoid duplicates
        this.sections = {
            holdings: [],  // Actual security holdings
            summaries: []  // Summary/total sections
        };
    }

    /**
     * Main extraction method with duplicate prevention
     */
    async extractWithoutDuplicates(pdfBuffer) {
        console.log('🎯 PRECISION EXTRACTION - NO DUPLICATES');
        console.log('Detecting and excluding summary sections');
        console.log('=' * 60);
        
        try {
            const data = await pdf(pdfBuffer);
            const fullText = data.text;
            
            console.log(`📄 Document length: ${fullText.length} characters`);
            
            // Step 1: Analyze document structure
            const documentStructure = this.analyzeDocumentStructure(fullText);
            console.log(`📊 Document structure analyzed`);
            
            // Step 2: Extract securities only from holdings sections
            const securities = this.extractSecuritiesFromHoldings(fullText, documentStructure);
            console.log(`💰 Securities extracted: ${securities.length}`);
            
            // Step 3: Calculate totals
            const results = this.calculateResults(securities);
            
            return {
                success: true,
                method: 'precision_no_duplicates',
                securities: securities,
                results: results,
                structure: documentStructure
            };
            
        } catch (error) {
            console.error('❌ Extraction failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Analyze document structure to separate holdings from summaries
     */
    analyzeDocumentStructure(text) {
        console.log('🔍 Analyzing document structure...');
        
        // Find all section boundaries
        const sections = this.detectSections(text);
        
        // Classify sections as holdings or summaries
        const classifiedSections = this.classifySections(text, sections);
        
        console.log(`   Holdings sections: ${classifiedSections.holdings.length}`);
        console.log(`   Summary sections: ${classifiedSections.summaries.length}`);
        
        return classifiedSections;
    }

    /**
     * Detect all sections in the document
     */
    detectSections(text) {
        const sections = [];
        
        // Find section headers
        for (const [type, pattern] of Object.entries(this.patterns.sectionHeaders)) {
            const matches = [...text.matchAll(pattern)];
            for (const match of matches) {
                sections.push({
                    type: type,
                    name: match[0],
                    start: match.index,
                    end: null  // Will be determined later
                });
            }
        }
        
        // Sort by position
        sections.sort((a, b) => a.start - b.start);
        
        // Determine section boundaries
        for (let i = 0; i < sections.length; i++) {
            if (i < sections.length - 1) {
                sections[i].end = sections[i + 1].start;
            } else {
                sections[i].end = text.length;
            }
        }
        
        return sections;
    }

    /**
     * Classify sections as holdings or summaries
     */
    classifySections(text, sections) {
        const holdings = [];
        const summaries = [];
        
        for (const section of sections) {
            const sectionText = text.substring(section.start, section.end);
            
            // Check if this is a summary section
            let isSummary = false;
            for (const pattern of this.patterns.summaryIndicators) {
                if (pattern.test(sectionText)) {
                    isSummary = true;
                    break;
                }
            }
            
            // Additional checks for summary sections
            if (!isSummary) {
                // Check if section has ISINs (holdings have ISINs, summaries usually don't)
                const isinCount = (sectionText.match(this.patterns.isin) || []).length;
                
                // If very few or no ISINs, might be a summary
                if (isinCount < 2) {
                    // Check for total/summary keywords in first 200 chars
                    const sectionStart = sectionText.substring(0, 200);
                    if (/total|summary|aggregate|overall/i.test(sectionStart)) {
                        isSummary = true;
                    }
                }
            }
            
            if (isSummary) {
                summaries.push(section);
                console.log(`   📊 Summary section: ${section.name} at position ${section.start}`);
            } else {
                holdings.push(section);
                console.log(`   💼 Holdings section: ${section.name} at position ${section.start}`);
            }
        }
        
        return { holdings, summaries };
    }

    /**
     * Extract securities only from holdings sections
     */
    extractSecuritiesFromHoldings(text, structure) {
        console.log('🔍 Extracting securities from holdings sections only...');
        
        const securities = [];
        const processedISINs = new Set();
        
        // Process only holdings sections
        for (const section of structure.holdings) {
            const sectionText = text.substring(section.start, section.end);
            const sectionSecurities = this.extractSecuritiesFromSection(sectionText, section);
            
            // Add securities, avoiding duplicates
            for (const security of sectionSecurities) {
                if (!processedISINs.has(security.isin)) {
                    processedISINs.add(security.isin);
                    securities.push(security);
                    console.log(`   ✅ ${security.isin}: ${security.marketValue ? security.marketValue.toLocaleString() : 'NO VALUE'} CHF (${section.type})`);
                }
            }
        }
        
        // Also check for securities outside defined sections
        const remainingSecurities = this.extractSecuritiesOutsideSections(text, structure);
        for (const security of remainingSecurities) {
            if (!processedISINs.has(security.isin)) {
                processedISINs.add(security.isin);
                securities.push(security);
                console.log(`   ✅ ${security.isin}: ${security.marketValue ? security.marketValue.toLocaleString() : 'NO VALUE'} CHF (unclassified)`);
            }
        }
        
        return securities;
    }

    /**
     * Extract securities from a specific section
     */
    extractSecuritiesFromSection(sectionText, sectionInfo) {
        const securities = [];
        
        // Find all ISINs in section
        const isinMatches = [...sectionText.matchAll(this.patterns.isin)];
        
        for (const match of isinMatches) {
            const isin = match[0];
            const position = match.index;
            
            // Extract context around ISIN
            const contextStart = Math.max(0, position - 300);
            const contextEnd = Math.min(sectionText.length, position + 300);
            const context = sectionText.substring(contextStart, contextEnd);
            
            // Extract security data
            const security = this.extractSecurityData(isin, context, sectionInfo.type);
            if (security) {
                securities.push(security);
            }
        }
        
        return securities;
    }

    /**
     * Extract securities that might be outside defined sections
     */
    extractSecuritiesOutsideSections(text, structure) {
        const securities = [];
        
        // Create a set of positions covered by sections
        const coveredPositions = new Set();
        for (const section of [...structure.holdings, ...structure.summaries]) {
            for (let i = section.start; i < section.end; i++) {
                coveredPositions.add(i);
            }
        }
        
        // Find ISINs outside sections
        const allISINs = [...text.matchAll(this.patterns.isin)];
        
        for (const match of allISINs) {
            if (!coveredPositions.has(match.index)) {
                const isin = match[0];
                const contextStart = Math.max(0, match.index - 300);
                const contextEnd = Math.min(text.length, match.index + 300);
                const context = text.substring(contextStart, contextEnd);
                
                // Only include if not in a summary context
                if (!this.isInSummaryContext(context)) {
                    const security = this.extractSecurityData(isin, context, 'unclassified');
                    if (security) {
                        securities.push(security);
                    }
                }
            }
        }
        
        return securities;
    }

    /**
     * Check if context indicates a summary section
     */
    isInSummaryContext(context) {
        for (const pattern of this.patterns.summaryIndicators) {
            if (pattern.test(context)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Extract security data
     */
    extractSecurityData(isin, context, sectionType) {
        // Extract name
        const name = this.extractSecurityName(context, isin);
        
        // Extract value using smart extraction
        const value = this.extractMarketValueSmart(context, isin);
        
        // Extract currency
        const currency = this.extractCurrency(context);
        
        return {
            isin: isin,
            name: name,
            marketValue: value,
            currency: currency,
            section: sectionType,
            context: context.substring(0, 100) + '...'
        };
    }

    /**
     * Smart market value extraction avoiding duplicates
     */
    extractMarketValueSmart(context, isin) {
        const candidates = [];
        
        // Swiss format numbers
        const swissMatches = context.match(this.patterns.swissAmount) || [];
        for (const match of swissMatches) {
            const value = parseFloat(match.replace(/'/g, ''));
            if (!isNaN(value) && value >= 1000 && value <= 50000000) {
                // Calculate position relative to ISIN
                const matchIndex = context.indexOf(match);
                const isinIndex = context.indexOf(isin);
                const distance = Math.abs(matchIndex - isinIndex);
                
                candidates.push({
                    value: value,
                    distance: distance,
                    confidence: this.calculateConfidence(context, match, isin, distance)
                });
            }
        }
        
        if (candidates.length === 0) return null;
        
        // Sort by confidence and distance
        candidates.sort((a, b) => {
            if (Math.abs(a.confidence - b.confidence) > 0.1) {
                return b.confidence - a.confidence;
            }
            return a.distance - b.distance;
        });
        
        // Return best candidate
        return candidates[0].value;
    }

    /**
     * Calculate confidence score
     */
    calculateConfidence(context, valueMatch, isin, distance) {
        let confidence = 0.5;
        
        // Distance penalty
        if (distance < 50) confidence += 0.3;
        else if (distance < 100) confidence += 0.2;
        else if (distance < 200) confidence += 0.1;
        
        // Context clues
        if (context.includes('Market') || context.includes('Value')) confidence += 0.2;
        if (context.includes('CHF') || context.includes('USD')) confidence += 0.1;
        
        // Negative indicators
        if (context.includes('Total') || context.includes('Summary')) confidence -= 0.3;
        if (context.includes('%') || context.includes('percent')) confidence -= 0.2;
        
        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * Extract security name
     */
    extractSecurityName(context, isin) {
        const isinIndex = context.indexOf(isin);
        if (isinIndex === -1) return 'Unknown';

        const beforeISIN = context.substring(0, isinIndex);
        const words = beforeISIN.split(/\s+/).filter(w => w.length > 2);
        
        return words.slice(-5).join(' ').substring(0, 50) || 'Unknown';
    }

    /**
     * Extract currency
     */
    extractCurrency(context) {
        const match = context.match(this.patterns.currency);
        return match ? match[0] : 'CHF';
    }

    /**
     * Calculate results
     */
    calculateResults(securities) {
        const totalValue = securities.reduce((sum, s) => sum + (s.marketValue || 0), 0);
        const securitiesWithValues = securities.filter(s => s.marketValue);
        
        console.log(`\n📊 EXTRACTION RESULTS:`);
        console.log(`   Total securities: ${securities.length}`);
        console.log(`   Securities with values: ${securitiesWithValues.length}`);
        console.log(`   Total value: CHF ${totalValue.toLocaleString()}`);
        
        // Group by section
        const bySection = {};
        for (const security of securities) {
            if (!bySection[security.section]) {
                bySection[security.section] = {
                    count: 0,
                    value: 0
                };
            }
            bySection[security.section].count++;
            bySection[security.section].value += security.marketValue || 0;
        }
        
        console.log(`\n📊 BY SECTION:`);
        for (const [section, data] of Object.entries(bySection)) {
            console.log(`   ${section}: ${data.count} securities, CHF ${data.value.toLocaleString()}`);
        }
        
        return {
            totalValue: totalValue,
            totalSecurities: securities.length,
            securitiesWithValues: securitiesWithValues.length,
            bySection: bySection
        };
    }
}

// Test the extractor
async function testPrecisionExtractor() {
    console.log('🚀 TESTING PRECISION EXTRACTOR - NO DUPLICATES');
    console.log('This version detects and excludes summary sections');
    console.log('=' * 70);
    
    const extractor = new PrecisionExtractorNoDuplicates();
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF not found');
        return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const results = await extractor.extractWithoutDuplicates(pdfBuffer);
    
    if (results.success) {
        console.log('\n✅ EXTRACTION SUCCESS!');
        
        // Save results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsFile = `precision_no_duplicates_${timestamp}.json`;
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        console.log(`💾 Results saved to: ${resultsFile}`);
        
        // Show sample securities
        console.log('\n💰 Sample extracted securities:');
        results.securities.slice(0, 5).forEach(sec => {
            console.log(`   ${sec.isin}: ${sec.marketValue ? sec.marketValue.toLocaleString() : 'NO VALUE'} ${sec.currency} - ${sec.name} [${sec.section}]`);
        });
        
    } else {
        console.log('❌ Extraction failed:', results.error);
    }
}

module.exports = { PrecisionExtractorNoDuplicates };

// Run test
if (require.main === module) {
    testPrecisionExtractor();
}