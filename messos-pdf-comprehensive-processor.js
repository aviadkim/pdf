#!/usr/bin/env node

/**
 * MESSOS PDF COMPREHENSIVE PROCESSOR
 * 
 * Dedicated processor for the Messos PDF file with multiple extraction methods
 */

const fs = require('fs').promises;
const path = require('path');
const { processWithErrorHandling } = require('./robust-pdf-processor.js');

class MessosPDFProcessor {
    constructor() {
        this.messosPdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
        this.results = {
            fileInfo: {},
            extraction: {},
            financialData: {},
            securities: [],
            analysis: {}
        };
    }

    async processMessosPDF() {
        console.log('📄 MESSOS PDF COMPREHENSIVE PROCESSING');
        console.log('=======================================');
        
        try {
            // Step 1: File Analysis
            await this.analyzeFile();
            
            // Step 2: Extract Text
            await this.extractText();
            
            // Step 3: Parse Financial Data
            await this.parseFinancialData();
            
            // Step 4: Extract Securities
            await this.extractSecurities();
            
            // Step 5: Generate Analysis
            await this.generateAnalysis();
            
            // Step 6: Save Results
            await this.saveResults();
            
            return this.results;
            
        } catch (error) {
            console.error('❌ Messos PDF processing failed:', error.message);
            this.results.error = error.message;
            return this.results;
        }
    }

    async analyzeFile() {
        console.log('\n1️⃣ Analyzing PDF file...');
        
        try {
            const pdfExists = await fs.access(this.messosPdfPath).then(() => true).catch(() => false);
            if (!pdfExists) {
                throw new Error('Messos PDF file not found');
            }
            
            const stats = await fs.stat(this.messosPdfPath);
            
            this.results.fileInfo = {
                path: this.messosPdfPath,
                exists: true,
                size: stats.size,
                sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
                lastModified: stats.mtime.toISOString()
            };
            
            console.log(`✅ File found: ${this.results.fileInfo.sizeFormatted}`);
            console.log(`📅 Last modified: ${new Date(stats.mtime).toLocaleString()}`);
            
        } catch (error) {
            console.error('❌ File analysis failed:', error.message);
            this.results.fileInfo = { error: error.message };
            throw error;
        }
    }

    async extractText() {
        console.log('\n2️⃣ Extracting text from PDF...');
        
        try {
            const extractionResult = await processWithErrorHandling(this.messosPdfPath, {
                maxPages: 50,
                timeout: 60000,
                fallbackToImages: true
            });
            
            this.results.extraction = {
                success: extractionResult.success,
                method: extractionResult.method,
                text: extractionResult.text,
                textLength: extractionResult.text ? extractionResult.text.length : 0,
                processingTime: extractionResult.processingTime,
                pages: extractionResult.pages,
                fileSize: extractionResult.fileSize
            };
            
            if (extractionResult.success) {
                console.log(`✅ Text extracted successfully`);
                console.log(`📝 Method: ${extractionResult.method}`);
                console.log(`📊 Text length: ${this.results.extraction.textLength} characters`);
                console.log(`⏱️  Processing time: ${extractionResult.processingTime}ms`);
                console.log(`📄 Pages: ${extractionResult.pages}`);
            } else {
                console.log('❌ Text extraction failed:', extractionResult.error);
                this.results.extraction.error = extractionResult.error;
            }
            
        } catch (error) {
            console.error('❌ Text extraction error:', error.message);
            this.results.extraction = { error: error.message };
        }
    }

    async parseFinancialData() {
        console.log('\n3️⃣ Parsing financial data...');
        
        if (!this.results.extraction.success || !this.results.extraction.text) {
            console.log('⚠️  Skipping financial data parsing - no text available');
            return;
        }
        
        const text = this.results.extraction.text;
        
        try {
            // Extract basic financial information
            const financialData = {
                date: this.extractDate(text),
                currency: this.extractCurrency(text),
                totalValue: this.extractTotalValue(text),
                accountInfo: this.extractAccountInfo(text),
                bankInfo: this.extractBankInfo(text)
            };
            
            this.results.financialData = financialData;
            
            console.log('📊 Financial Data Extracted:');
            console.log(`   Date: ${financialData.date || 'Not found'}`);
            console.log(`   Currency: ${financialData.currency || 'Not found'}`);
            console.log(`   Total Value: ${financialData.totalValue || 'Not found'}`);
            console.log(`   Account: ${financialData.accountInfo || 'Not found'}`);
            console.log(`   Bank: ${financialData.bankInfo || 'Not found'}`);
            
        } catch (error) {
            console.error('❌ Financial data parsing error:', error.message);
            this.results.financialData = { error: error.message };
        }
    }

    async extractSecurities() {
        console.log('\n4️⃣ Extracting securities data...');
        
        if (!this.results.extraction.success || !this.results.extraction.text) {
            console.log('⚠️  Skipping securities extraction - no text available');
            return;
        }
        
        const text = this.results.extraction.text;
        
        try {
            const securities = [];
            
            // Extract ISIN codes
            const isinPattern = /([A-Z]{2}[A-Z0-9]{10})/g;
            const isinMatches = [...text.matchAll(isinPattern)];
            
            // Extract security names and values
            const lines = text.split('\n');
            
            isinMatches.forEach((match, index) => {
                const isin = match[1];
                const matchIndex = match.index;
                
                // Find the line containing this ISIN
                let lineIndex = 0;
                let charCount = 0;
                for (let i = 0; i < lines.length; i++) {
                    if (charCount + lines[i].length >= matchIndex) {
                        lineIndex = i;
                        break;
                    }
                    charCount += lines[i].length + 1; // +1 for newline
                }
                
                // Extract context around the ISIN
                const contextLines = lines.slice(Math.max(0, lineIndex - 2), lineIndex + 3);
                const context = contextLines.join(' ');
                
                // Try to extract security name and value
                const security = {
                    isin,
                    index: index + 1,
                    context: context.trim(),
                    name: this.extractSecurityName(context),
                    value: this.extractSecurityValue(context),
                    currency: this.extractCurrency(context)
                };
                
                securities.push(security);
            });
            
            this.results.securities = securities;
            
            console.log(`📈 Securities Extracted: ${securities.length}`);
            securities.forEach((security, index) => {
                console.log(`   ${index + 1}. ${security.isin}`);
                console.log(`      Name: ${security.name || 'Not identified'}`);
                console.log(`      Value: ${security.value || 'Not found'}`);
                console.log(`      Currency: ${security.currency || 'Not specified'}`);
            });
            
        } catch (error) {
            console.error('❌ Securities extraction error:', error.message);
            this.results.securities = [];
        }
    }

    async generateAnalysis() {
        console.log('\n5️⃣ Generating analysis...');
        
        try {
            const analysis = {
                extractionQuality: this.assessExtractionQuality(),
                dataCompleteness: this.assessDataCompleteness(),
                securitiesAnalysis: this.analyzeSecurities(),
                recommendations: this.generateRecommendations()
            };
            
            this.results.analysis = analysis;
            
            console.log('📋 Analysis Results:');
            console.log(`   Extraction Quality: ${analysis.extractionQuality.score}/10`);
            console.log(`   Data Completeness: ${analysis.dataCompleteness.percentage}%`);
            console.log(`   Securities Found: ${analysis.securitiesAnalysis.count}`);
            console.log(`   Recommendations: ${analysis.recommendations.length}`);
            
        } catch (error) {
            console.error('❌ Analysis generation error:', error.message);
            this.results.analysis = { error: error.message };
        }
    }

    async saveResults() {
        console.log('\n6️⃣ Saving results...');
        
        try {
            const timestamp = Date.now();
            const resultsPath = `messos-comprehensive-results-${timestamp}.json`;
            
            const fullResults = {
                timestamp: new Date().toISOString(),
                processor: 'Messos PDF Comprehensive Processor',
                ...this.results
            };
            
            await fs.writeFile(resultsPath, JSON.stringify(fullResults, null, 2));
            
            // Also save a summary CSV for securities
            if (this.results.securities && this.results.securities.length > 0) {
                const csvPath = `messos-securities-${timestamp}.csv`;
                const csvContent = this.generateSecuritiesCSV();
                await fs.writeFile(csvPath, csvContent);
                console.log(`💾 Securities CSV saved: ${csvPath}`);
            }
            
            console.log(`💾 Results saved: ${resultsPath}`);
            
            return { resultsPath, csvPath: this.results.securities.length > 0 ? `messos-securities-${timestamp}.csv` : null };
            
        } catch (error) {
            console.error('❌ Save results error:', error.message);
            throw error;
        }
    }

    // Helper methods for data extraction
    extractDate(text) {
        const patterns = [
            /(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/,
            /(\d{4}[-\.\/]\d{1,2}[-\.\/]\d{1,2})/,
            /(31\.03\.2025)/
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    extractCurrency(text) {
        const match = text.match(/(CHF|USD|EUR|GBP|JPY)/i);
        return match ? match[1].toUpperCase() : null;
    }

    extractTotalValue(text) {
        const patterns = [
            /total[:\s]*([0-9,]+\.\d{2})/i,
            /gesamt[:\s]*([0-9,]+\.\d{2})/i,
            /sum[:\s]*([0-9,]+\.\d{2})/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    extractAccountInfo(text) {
        const match = text.match(/account[:\s]*([A-Z0-9\-]+)/i);
        return match ? match[1] : null;
    }

    extractBankInfo(text) {
        const banks = ['UBS', 'Credit Suisse', 'Julius Baer', 'Pictet', 'Lombard Odier'];
        for (const bank of banks) {
            if (text.toLowerCase().includes(bank.toLowerCase())) {
                return bank;
            }
        }
        return null;
    }

    extractSecurityName(context) {
        // Try to find security name in context
        const lines = context.split(/[\n\r]+/);
        for (const line of lines) {
            if (line.length > 10 && line.length < 100 && !line.match(/^\d+/) && !line.match(/[A-Z]{2}[A-Z0-9]{10}/)) {
                return line.trim();
            }
        }
        return null;
    }

    extractSecurityValue(context) {
        const valuePattern = /([0-9,]+\.\d{2})/g;
        const matches = context.match(valuePattern);
        return matches ? matches[matches.length - 1] : null; // Return the last value found
    }

    assessExtractionQuality() {
        let score = 0;
        if (this.results.extraction.success) score += 3;
        if (this.results.extraction.textLength > 1000) score += 2;
        if (this.results.extraction.processingTime < 30000) score += 2;
        if (this.results.securities.length > 0) score += 2;
        if (this.results.financialData.date) score += 1;
        
        return { score, maxScore: 10 };
    }

    assessDataCompleteness() {
        const fields = ['date', 'currency', 'totalValue', 'accountInfo', 'bankInfo'];
        const completedFields = fields.filter(field => this.results.financialData[field]).length;
        const percentage = Math.round((completedFields / fields.length) * 100);
        
        return { percentage, completedFields, totalFields: fields.length };
    }

    analyzeSecurities() {
        return {
            count: this.results.securities.length,
            withNames: this.results.securities.filter(s => s.name).length,
            withValues: this.results.securities.filter(s => s.value).length,
            withCurrency: this.results.securities.filter(s => s.currency).length
        };
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (!this.results.extraction.success) {
            recommendations.push('Consider using alternative PDF processing methods');
        }
        
        if (this.results.securities.length === 0) {
            recommendations.push('No securities found - check PDF format and content');
        }
        
        if (!this.results.financialData.totalValue) {
            recommendations.push('Total portfolio value not found - may need manual verification');
        }
        
        if (this.results.securities.filter(s => !s.name).length > 0) {
            recommendations.push('Some securities missing names - consider enhanced name extraction');
        }
        
        return recommendations;
    }

    generateSecuritiesCSV() {
        const headers = ['Index', 'ISIN', 'Name', 'Value', 'Currency'];
        const rows = [headers.join(',')];
        
        this.results.securities.forEach((security, index) => {
            const row = [
                index + 1,
                security.isin,
                `"${security.name || 'N/A'}"`,
                security.value || 'N/A',
                security.currency || 'N/A'
            ];
            rows.push(row.join(','));
        });
        
        return rows.join('\n');
    }
}

async function main() {
    const processor = new MessosPDFProcessor();
    const results = await processor.processMessosPDF();
    
    console.log('\n🎉 MESSOS PDF PROCESSING COMPLETED!');
    console.log('====================================');
    
    if (results.extraction.success) {
        console.log(`✅ Successfully processed Messos PDF`);
        console.log(`📊 Extracted ${results.securities.length} securities`);
        console.log(`📋 Analysis score: ${results.analysis.extractionQuality.score}/10`);
    } else {
        console.log(`❌ Failed to process Messos PDF: ${results.error || 'Unknown error'}`);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { MessosPDFProcessor };
