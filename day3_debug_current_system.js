/**
 * Day 3: Debug Current System to Find Missing ISINs
 * Add comprehensive logging to understand exactly what's happening
 */

const fs = require('fs');
const pdf = require('pdf-parse');

class CurrentSystemDebugger {
    constructor() {
        this.debugLog = [];
        this.targetMissingISINs = [
            'CH1908490000',
            'XS2993414619', 
            'XS2407295554',
            'XS2252299883'
        ];
        this.problematicISIN = 'XS2746319610';
    }

    /**
     * Debug version of the current system's extraction
     */
    async debugExtractSecuritiesPrecise(pdfBuffer) {
        console.log('🔍 DAY 3: DEBUGGING CURRENT SYSTEM EXTRACTION');
        console.log('=' * 60);
        
        try {
            const data = await pdf(pdfBuffer);
            const text = data.text;
            
            this.log('PDF parsed successfully', `${text.length} characters`);
            
            // Step 1: Find ALL ISINs in the document
            const allISINs = this.debugFindAllISINs(text);
            
            // Step 2: Debug why specific ISINs are missing
            await this.debugMissingISINs(text, allISINs);
            
            // Step 3: Debug the problematic ISIN value extraction
            await this.debugProblematicISIN(text);
            
            // Step 4: Run current extraction and compare
            const currentResults = this.runCurrentExtraction(text);
            
            return {
                success: true,
                debug_findings: this.debugLog,
                all_isins_found: allISINs,
                missing_analysis: this.analyzeMissingISINs(allISINs),
                current_extraction: currentResults,
                recommendations: this.generateRecommendations()
            };
            
        } catch (error) {
            this.log('ERROR', `Debugging failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Find ALL ISINs in the document with detailed logging
     */
    debugFindAllISINs(text) {
        this.log('STEP 1', 'Finding all ISINs in document');
        
        const isinPattern = /\\b[A-Z]{2}[A-Z0-9]{9}[0-9]\\b/g;
        const matches = [...text.matchAll(isinPattern)];
        const uniqueISINs = [...new Set(matches.map(match => match[0]))];
        
        this.log('ISIN_SEARCH', `Found ${uniqueISINs.length} unique ISINs`);
        
        // Check each target missing ISIN
        for (const targetISIN of this.targetMissingISINs) {
            const found = uniqueISINs.includes(targetISIN);
            this.log('MISSING_CHECK', `${targetISIN}: ${found ? 'FOUND' : 'NOT FOUND'}`);
            
            if (found) {
                // Find where it appears in the document
                const occurrences = this.findISINContext(text, targetISIN);
                this.log('CONTEXT', `${targetISIN} appears ${occurrences.length} times`);
                occurrences.forEach((context, i) => {
                    this.log('CONTEXT_DETAIL', `Occurrence ${i+1}: ${context.substring(0, 100)}...`);
                });
            }
        }
        
        return uniqueISINs;
    }

    /**
     * Find context around an ISIN in the document
     */
    findISINContext(text, isin) {
        const contexts = [];
        const lines = text.split('\\n');
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(isin)) {
                // Get context: 2 lines before, the line, 2 lines after
                const start = Math.max(0, i - 2);
                const end = Math.min(lines.length, i + 3);
                const context = lines.slice(start, end).join(' | ');
                contexts.push(context);
            }
        }
        
        return contexts;
    }

    /**
     * Debug why specific ISINs are missing from current extraction
     */
    async debugMissingISINs(text, allISINs) {
        this.log('STEP 2', 'Debugging missing ISINs');
        
        for (const missingISIN of this.targetMissingISINs) {
            if (allISINs.includes(missingISIN)) {
                this.log('FOUND_BUT_MISSED', `${missingISIN} is in PDF but current system misses it`);
                
                // Debug why current system misses it
                const context = this.findISINContext(text, missingISIN);
                
                for (const ctx of context) {
                    this.log('DEBUG_CONTEXT', `Analyzing: ${ctx}`);
                    
                    // Check if it passes current system filters
                    const passesFilters = this.testCurrentSystemFilters(ctx, missingISIN);
                    this.log('FILTER_TEST', `${missingISIN} passes filters: ${passesFilters}`);
                    
                    // Try to extract value from this context
                    const extractedValue = this.tryValueExtraction(ctx);
                    this.log('VALUE_EXTRACTION', `${missingISIN} value attempt: ${extractedValue || 'FAILED'}`);
                }
            } else {
                this.log('NOT_IN_PDF', `${missingISIN} not found in PDF text at all`);
            }
        }
    }

    /**
     * Test if a line would pass current system's filters
     */
    testCurrentSystemFilters(line, isin) {
        // Simulate current system's filtering logic
        
        // Check 1: Contains ISIN
        if (!line.includes(isin)) {
            this.log('FILTER_FAIL', 'Does not contain ISIN');
            return false;
        }
        
        // Check 2: Contains potential value
        const swissValuePattern = /\\d{1,3}(?:'\\d{3})*(?:\\.\\d{2})?/;
        if (!swissValuePattern.test(line)) {
            this.log('FILTER_FAIL', 'No Swiss format value found');
            return false;
        }
        
        // Check 3: Not in excluded sections
        const exclusions = ['total', 'summary', 'gesamt', 'summe'];
        const lowerLine = line.toLowerCase();
        for (const exclusion of exclusions) {
            if (lowerLine.includes(exclusion)) {
                this.log('FILTER_FAIL', `Contains exclusion word: ${exclusion}`);
                return false;
            }
        }
        
        this.log('FILTER_PASS', 'Passes all current system filters');
        return true;
    }

    /**
     * Try to extract value from a context line
     */
    tryValueExtraction(line) {
        const swissValues = line.match(/\\d{1,3}(?:'\\d{3})*(?:\\.\\d{2})?/g);
        
        if (!swissValues) return null;
        
        // Filter reasonable values (like current system does)
        const reasonableValues = swissValues
            .map(v => parseFloat(v.replace(/'/g, '')))
            .filter(v => v >= 1000 && v <= 50000000);
        
        if (reasonableValues.length === 0) return null;
        
        // Return the largest reasonable value (current system's approach)
        return Math.max(...reasonableValues);
    }

    /**
     * Debug the problematic ISIN that extracts wrong value
     */
    async debugProblematicISIN(text) {
        this.log('STEP 3', `Debugging problematic ISIN: ${this.problematicISIN}`);
        
        const contexts = this.findISINContext(text, this.problematicISIN);
        
        for (const context of contexts) {
            this.log('PROBLEMATIC_CONTEXT', context);
            
            // Extract all numbers from this context
            const allNumbers = context.match(/\\d{1,3}(?:'\\d{3})*(?:\\.\\d{2})?/g);
            this.log('ALL_NUMBERS', `Found numbers: ${allNumbers ? allNumbers.join(', ') : 'none'}`);
            
            // Test current value extraction
            const extractedValue = this.tryValueExtraction(context);
            this.log('CURRENT_EXTRACTION', `Current system would extract: ${extractedValue}`);
            
            // The correct value should be 140,000
            const correctValue = 140000;
            this.log('CORRECTION_NEEDED', `Should be: ${correctValue}, Current: ${extractedValue}`);
            
            if (extractedValue && extractedValue !== correctValue) {
                this.log('VALUE_MISALIGNMENT', 'Confirmed: value extraction is misaligned');
                
                // Try to find 140000 or 140'000.00 in the context
                const correctPattern = /140['\\s]*000/;
                const hasCorrect = correctPattern.test(context);
                this.log('CORRECT_VALUE_PRESENT', `140,000 found in context: ${hasCorrect}`);
            }
        }
    }

    /**
     * Run current extraction logic for comparison
     */
    runCurrentExtraction(text) {
        this.log('STEP 4', 'Running current system extraction for comparison');
        
        // Simplified version of current system logic
        const lines = text.split('\\n');
        const securities = [];
        
        const isinPattern = /\\b[A-Z]{2}[A-Z0-9]{9}[0-9]\\b/;
        
        for (const line of lines) {
            const isinMatch = line.match(isinPattern);
            if (isinMatch) {
                const isin = isinMatch[0];
                
                // Skip if already found
                if (securities.some(s => s.isin === isin)) continue;
                
                // Try value extraction
                const value = this.tryValueExtraction(line);
                
                if (value) {
                    securities.push({
                        isin: isin,
                        marketValue: value,
                        source: 'current_system_simulation'
                    });
                    
                    this.log('EXTRACTED', `${isin}: ${value.toLocaleString()}`);
                }
            }
        }
        
        const totalValue = securities.reduce((sum, s) => sum + s.marketValue, 0);
        const targetTotal = 19464431.45;
        const accuracy = (Math.min(totalValue, targetTotal) / targetTotal) * 100;
        
        this.log('CURRENT_RESULTS', `${securities.length} securities, ${accuracy.toFixed(2)}% accuracy`);
        
        return {
            securities: securities,
            totalValue: totalValue,
            accuracy: accuracy,
            securitiesCount: securities.length
        };
    }

    /**
     * Analyze which missing ISINs are actually findable
     */
    analyzeMissingISINs(allISINs) {
        const analysis = {
            found_in_pdf: [],
            not_in_pdf: [],
            extraction_issues: []
        };
        
        for (const missingISIN of this.targetMissingISINs) {
            if (allISINs.includes(missingISIN)) {
                analysis.found_in_pdf.push(missingISIN);
                analysis.extraction_issues.push({
                    isin: missingISIN,
                    issue: 'Found in PDF but not extracted by current system'
                });
            } else {
                analysis.not_in_pdf.push(missingISIN);
            }
        }
        
        return analysis;
    }

    /**
     * Generate recommendations based on debug findings
     */
    generateRecommendations() {
        const recommendations = [
            {
                priority: 'HIGH',
                action: 'Fix ISINs found in PDF but missed by extraction',
                details: 'Debug why filtering logic excludes valid securities'
            },
            {
                priority: 'HIGH', 
                action: 'Fix XS2746319610 value misalignment',
                details: 'Improve column detection to select correct value'
            },
            {
                priority: 'MEDIUM',
                action: 'Improve value extraction logic',
                details: 'Better heuristics for selecting correct value from multiple numbers'
            },
            {
                priority: 'LOW',
                action: 'Add comprehensive logging',
                details: 'Keep debug logging for ongoing monitoring'
            }
        ];
        
        return recommendations;
    }

    /**
     * Add entry to debug log
     */
    log(category, message) {
        const entry = `[${category}] ${message}`;
        this.debugLog.push(entry);
        console.log(entry);
    }
}

// Test the debugger
async function runDay3Debug() {
    console.log('🚀 Starting Day 3: Current System Debugging...');
    
    try {
        const systemDebugger = new CurrentSystemDebugger();
        const pdfPath = '2. Messos  - 31.03.2025.pdf';
        
        if (!fs.existsSync(pdfPath)) {
            console.log('❌ Messos PDF not found, cannot run debug');
            return;
        }
        
        const pdfBuffer = fs.readFileSync(pdfPath);
        console.log(`📄 Loaded PDF: ${pdfBuffer.length} bytes`);
        
        const results = await systemDebugger.debugExtractSecuritiesPrecise(pdfBuffer);
        
        if (results.success) {
            console.log('\\n✅ DEBUGGING COMPLETE');
            console.log(`📊 Found ${results.all_isins_found.length} total ISINs`);
            console.log(`🔍 Debug log entries: ${results.debug_findings.length}`);
            
            // Save detailed results
            fs.writeFileSync('day3_debug_results.json', JSON.stringify(results, null, 2));
            console.log('💾 Debug results saved to: day3_debug_results.json');
            
            // Show summary
            console.log('\\n📋 SUMMARY:');
            console.log(`ISINs in PDF: ${results.missing_analysis.found_in_pdf.length}`);
            console.log(`Not in PDF: ${results.missing_analysis.not_in_pdf.length}`);
            console.log(`Current extraction: ${results.current_extraction.securitiesCount} securities`);
            console.log(`Current accuracy: ${results.current_extraction.accuracy.toFixed(2)}%`);
            
            console.log('\\n🎯 NEXT: Apply fixes based on debug findings');
            
        } else {
            console.log('❌ Debugging failed:', results.error);
        }
        
    } catch (error) {
        console.error('❌ Debug test failed:', error);
    }
}

module.exports = { CurrentSystemDebugger };

// Run if called directly
if (require.main === module) {
    runDay3Debug();
}