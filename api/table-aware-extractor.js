// 📊 TABLE-AWARE EXTRACTOR - Extract ISINs with their complete financial data
// Look ahead after each ISIN to find the structured table data with market values

import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

class TableAwareExtractor {
    constructor() {
        this.extractionMethods = ['pdfParse', 'tableStructure'];
    }

    async extractWithTableStructure(pdfBuffer, filename) {
        console.log('📊 TABLE-AWARE EXTRACTION');
        console.log('🎯 Finding ISINs and their complete financial data...');
        
        const completeData = {
            metadata: {
                filename: filename,
                extractionTime: new Date().toISOString(),
                methods: [],
                pdfSize: pdfBuffer.length
            },
            rawText: {
                fullText: '',
                lines: []
            },
            securities: [],
            tableStructure: {
                isinRecords: [],
                marketValues: [],
                contextualData: []
            }
        };

        // Extract complete text first
        await this.extractCompleteText(pdfBuffer, completeData);

        // Find ISINs with their complete financial records
        await this.extractISINWithFinancialData(completeData);

        // Parse table structure around each ISIN
        await this.parseTableStructure(completeData);

        console.log(`📊 TABLE-AWARE EXTRACTION COMPLETE`);
        console.log(`📄 Securities found: ${completeData.securities.length}`);

        return completeData;
    }

    async extractCompleteText(pdfBuffer, completeData) {
        try {
            console.log('📊 Extracting complete text...');
            const pdfData = await pdfParse(pdfBuffer);
            
            completeData.rawText.fullText = pdfData.text;
            completeData.rawText.lines = pdfData.text.split('\n').map((line, index) => ({
                lineNumber: index + 1,
                text: line.trim(),
                length: line.length
            })).filter(line => line.text.length > 0);

            completeData.metadata.methods.push('pdfParse');
            console.log(`   ✅ Text extracted: ${completeData.rawText.lines.length} lines`);
            
        } catch (error) {
            console.log(`   ❌ Text extraction failed: ${error.message}`);
        }
    }

    async extractISINWithFinancialData(completeData) {
        console.log('📊 Finding ISINs with extended context...');
        
        const fullText = completeData.rawText.fullText;
        const isinPattern = /ISIN:\s*([A-Z]{2}[A-Z0-9]{9}[0-9])/g;
        
        let match;
        const securities = [];
        
        while ((match = isinPattern.exec(fullText)) !== null) {
            const isin = match[1];
            const isinPosition = match.index;
            
            // Extract extended context (500 characters after ISIN)
            const extendedContext = fullText.substring(isinPosition, isinPosition + 500);
            
            // Look for market value patterns in this context
            const financialData = this.parseFinancialDataFromContext(isin, extendedContext, isinPosition);
            
            if (financialData) {
                securities.push(financialData);
                console.log(`   ✅ Found: ${isin} - Value: ${financialData.marketValue?.toLocaleString() || 'N/A'}`);
            }
        }
        
        completeData.securities = securities;
        completeData.metadata.methods.push('tableStructure');
        console.log(`   📊 Total securities with financial data: ${securities.length}`);
    }

    parseFinancialDataFromContext(isin, context, position) {
        // Swiss banking PDF pattern: ISIN -> Description -> Currency -> Amount -> Percentage -> Price -> ActualValue
        // Example: ISIN: XS2530201644 ... USD200'000 ... 100.200099.1991199'080
        
        const lines = context.split('\n');
        let currency = 'USD';
        let nominal = null;
        let marketValue = null;
        let percentage = null;
        let description = '';
        
        // Extract currency (usually USD, CHF)
        const currencyMatch = context.match(/\b(USD|CHF|EUR|GBP)\b/);
        if (currencyMatch) {
            currency = currencyMatch[1];
        }
        
        // Extract nominal amount (like USD200'000, USD100'000)
        const nominalPattern = new RegExp(`${currency}([\\d,']+)`, 'g');
        const nominalMatches = [...context.matchAll(nominalPattern)];
        if (nominalMatches.length > 0) {
            nominal = this.parseSwissNumber(nominalMatches[0][1]);
        }
        
        // Look for market value patterns - these appear after price data
        // Pattern: price1 price2 actualValue (like 100.200099.1991199'080)
        const marketValuePatterns = [
            // Swiss format with apostrophes: 199'080, 1'507'550
            /([0-9]{1,3}(?:'[0-9]{3})*)/g,
            // Regular format: 199080, 1507550  
            /\b([0-9]{4,})\b/g
        ];
        
        const allNumbers = [];
        for (const pattern of marketValuePatterns) {
            const matches = [...context.matchAll(pattern)];
            matches.forEach(match => {
                const parsed = this.parseSwissNumber(match[1]);
                if (parsed > 1000 && parsed < 100000000) { // Reasonable market value range
                    allNumbers.push({
                        raw: match[1],
                        parsed: parsed,
                        position: match.index
                    });
                }
            });
        }
        
        // Select the most likely market value (usually the largest reasonable number)
        if (allNumbers.length > 0) {
            // Sort by value and take the largest that's reasonable for market value
            allNumbers.sort((a, b) => b.parsed - a.parsed);
            marketValue = allNumbers[0].parsed;
        }
        
        // Extract percentage if available
        const percentageMatch = context.match(/([\d.]+)%/);
        if (percentageMatch) {
            percentage = parseFloat(percentageMatch[1]);
        }
        
        // Extract security description
        const descLines = lines.slice(1, 4); // Usually in the next few lines after ISIN
        description = descLines.join(' ').replace(/[^a-zA-Z\s]/g, ' ').trim();
        
        return {
            isin: isin,
            name: description || 'Security',
            currency: currency,
            nominalAmount: nominal,
            marketValue: marketValue,
            percentage: percentage,
            rawContext: context,
            position: position,
            dataQuality: this.assessDataQuality(isin, marketValue, nominal)
        };
    }

    parseSwissNumber(numberStr) {
        if (!numberStr) return null;
        
        try {
            // Handle Swiss format (1'234'567) and regular (1234567)
            const cleaned = numberStr.toString().replace(/'/g, '');
            const parsed = parseInt(cleaned);
            return isNaN(parsed) ? null : parsed;
        } catch {
            return null;
        }
    }

    assessDataQuality(isin, marketValue, nominal) {
        let score = 0;
        if (isin && isin.length === 12) score += 25;
        if (marketValue && marketValue > 1000) score += 25;
        if (nominal && nominal > 1000) score += 25;
        if (marketValue && nominal && Math.abs(marketValue - nominal) < nominal * 0.5) score += 25;
        
        return {
            score: score,
            quality: score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low'
        };
    }

    async parseTableStructure(completeData) {
        console.log('📊 Parsing table structure for enhanced data...');
        
        const lines = completeData.rawText.lines;
        const tableData = {
            headers: [],
            rows: [],
            bondsSections: [],
            structuredProductsSections: []
        };
        
        // Find section headers and structured data
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].text;
            
            // Identify section headers
            if (line.includes('Bonds') && line.includes('Bond funds')) {
                tableData.bondsSections.push({
                    startLine: i,
                    header: line,
                    content: this.extractSectionContent(lines, i, 50)
                });
            }
            
            if (line.includes('Structured products')) {
                tableData.structuredProductsSections.push({
                    startLine: i,
                    header: line,
                    content: this.extractSectionContent(lines, i, 50)
                });
            }
        }
        
        completeData.tableStructure = tableData;
        console.log(`   📊 Found ${tableData.bondsSections.length} bond sections, ${tableData.structuredProductsSections.length} structured product sections`);
    }

    extractSectionContent(lines, startIndex, maxLines) {
        const content = [];
        for (let i = startIndex; i < Math.min(startIndex + maxLines, lines.length); i++) {
            const line = lines[i].text;
            if (line.trim().length > 0) {
                content.push({
                    lineNumber: lines[i].lineNumber,
                    text: line
                });
            }
            
            // Stop at next major section
            if (i > startIndex && (line.includes('Total') || line.includes('Print date'))) {
                break;
            }
        }
        return content;
    }
}

// Main Handler
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const startTime = Date.now();
    console.log('\n📊 TABLE-AWARE EXTRACTOR STARTING');
    console.log('=' * 60);

    try {
        const { pdfBase64, filename, testMode } = req.body;

        if (!pdfBase64 && !testMode) {
            return res.status(400).json({ 
                success: false,
                error: 'No PDF data provided' 
            });
        }

        // Handle test mode with Messos PDF
        let pdfBuffer;
        let actualFilename;

        if (testMode) {
            const messosPdfPath = './2. Messos  - 31.03.2025.pdf';
            if (fs.existsSync(messosPdfPath)) {
                pdfBuffer = fs.readFileSync(messosPdfPath);
                actualFilename = 'Messos - 31.03.2025.pdf';
            } else {
                return res.status(400).json({
                    success: false,
                    error: 'Test PDF not found'
                });
            }
        } else {
            pdfBuffer = Buffer.from(pdfBase64, 'base64');
            actualFilename = filename;
        }

        console.log(`📄 Processing: ${actualFilename} (${Math.round(pdfBuffer.length / 1024)}KB)`);

        // Extract with table awareness
        const extractor = new TableAwareExtractor();
        const completeData = await extractor.extractWithTableStructure(pdfBuffer, actualFilename);

        const processingTime = Date.now() - startTime;
        const totalValue = completeData.securities.reduce((sum, s) => sum + (s.marketValue || 0), 0);

        console.log('\n📊 TABLE-AWARE EXTRACTION COMPLETE');
        console.log(`⏱️  Processing time: ${processingTime}ms`);
        console.log(`📄 Securities with financial data: ${completeData.securities.length}`);
        console.log(`💰 Total calculated value: $${totalValue.toLocaleString()}`);

        res.json({
            success: true,
            message: `Table-aware extraction complete: found ${completeData.securities.length} securities with financial data`,
            processingTime: processingTime,
            data: {
                securities: completeData.securities,
                totalValue: totalValue,
                securitiesCount: completeData.securities.length,
                extractionMethods: completeData.metadata.methods,
                tableStructure: completeData.tableStructure,
                dataQuality: {
                    highQuality: completeData.securities.filter(s => s.dataQuality.quality === 'high').length,
                    mediumQuality: completeData.securities.filter(s => s.dataQuality.quality === 'medium').length,
                    lowQuality: completeData.securities.filter(s => s.dataQuality.quality === 'low').length
                }
            },
            completeData: completeData
        });

    } catch (error) {
        console.error('❌ Table-aware extraction failed:', error);
        
        res.status(500).json({
            success: false,
            error: 'Table-aware extraction failed',
            details: error.message
        });
    }
}