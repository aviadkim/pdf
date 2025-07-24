#!/usr/bin/env node

/**
 * ANALYZE PDF EXTRACTION ISSUES
 * 
 * Analyzes the current extraction problems and creates a better solution
 */

const pdfParse = require('pdf-parse');
const fs = require('fs');

async function analyzePDFExtractionIssues() {
    console.log('🔍 ANALYZING PDF EXTRACTION ISSUES');
    console.log('===================================');

    const pdfPath = './2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF file not found');
        return;
    }

    try {
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfData = await pdfParse(pdfBuffer);
        const text = pdfData.text;
        
        console.log(`📄 Total text length: ${text.length} characters`);
        
        // Split into lines for analysis
        const lines = text.split('\n');
        console.log(`📋 Total lines: ${lines.length}`);
        
        // Look for the portfolio section
        console.log('\n🔍 ANALYZING PORTFOLIO STRUCTURE');
        console.log('================================');
        
        let portfolioStart = -1;
        let portfolioEnd = -1;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Look for portfolio section start
            if (line.includes('Portefeuille') || line.includes('Portfolio') || line.includes('Wertschriften')) {
                console.log(`📍 Found portfolio section at line ${i + 1}: "${line}"`);
                if (portfolioStart === -1) portfolioStart = i;
            }
            
            // Look for portfolio total/summary
            if (line.includes('Total') && line.includes('CHF') && line.match(/[\d']+/)) {
                console.log(`💰 Found total at line ${i + 1}: "${line}"`);
                portfolioEnd = i;
            }
        }
        
        console.log(`\n📊 Portfolio section: lines ${portfolioStart + 1} to ${portfolioEnd + 1}`);
        
        // Analyze ISIN patterns
        console.log('\n🔍 ANALYZING ISIN PATTERNS');
        console.log('==========================');
        
        const isinPattern = /[A-Z]{2}[0-9A-Z]{9}[0-9]/g;
        const ibanPattern = /CH\d{19}/g;
        
        let validISINs = new Set();
        let invalidISINs = new Set();
        let ibans = new Set();
        
        for (let i = portfolioStart; i < portfolioEnd && i < lines.length; i++) {
            const line = lines[i];
            
            // Find ISINs
            const isinMatches = line.match(isinPattern);
            if (isinMatches) {
                for (const isin of isinMatches) {
                    // Validate ISIN format more strictly
                    if (isin.match(/^[A-Z]{2}[0-9]{9}[0-9]$/) && !isin.startsWith('CH19')) {
                        validISINs.add(isin);
                        console.log(`✅ Valid ISIN found: ${isin} at line ${i + 1}`);
                    } else {
                        invalidISINs.add(isin);
                        console.log(`❌ Invalid ISIN: ${isin} at line ${i + 1}`);
                    }
                }
            }
            
            // Find IBANs (often confused with ISINs)
            const ibanMatches = line.match(ibanPattern);
            if (ibanMatches) {
                for (const iban of ibanMatches) {
                    ibans.add(iban);
                    console.log(`🏦 IBAN (not ISIN): ${iban} at line ${i + 1}`);
                }
            }
        }
        
        console.log(`\n📊 ISIN Analysis:`);
        console.log(`✅ Valid ISINs found: ${validISINs.size}`);
        console.log(`❌ Invalid ISINs found: ${invalidISINs.size}`);
        console.log(`🏦 IBANs found: ${ibans.size}`);
        
        // Analyze value patterns
        console.log('\n💰 ANALYZING VALUE PATTERNS');
        console.log('============================');
        
        const swissNumberPattern = /\b\d{1,3}(?:'\d{3})*(?:\.\d{2})?\b/g;
        const chfPattern = /CHF\s*([\d']+(?:\.\d{2})?)/g;
        
        let values = [];
        
        for (let i = portfolioStart; i < portfolioEnd && i < lines.length; i++) {
            const line = lines[i];
            
            // Look for CHF amounts
            const chfMatches = line.match(chfPattern);
            if (chfMatches) {
                console.log(`💰 CHF amount found at line ${i + 1}: "${line.trim()}"`);
                for (const match of chfMatches) {
                    const value = match.replace(/CHF\s*/, '').replace(/'/g, '');
                    values.push(parseFloat(value));
                }
            }
            
            // Look for Swiss formatted numbers
            const numberMatches = line.match(swissNumberPattern);
            if (numberMatches && line.includes('CHF')) {
                console.log(`🔢 Swiss number with CHF at line ${i + 1}: "${line.trim()}"`);
            }
        }
        
        console.log(`\n📊 Values found: ${values.length}`);
        if (values.length > 0) {
            const total = values.reduce((sum, val) => sum + val, 0);
            console.log(`💰 Total extracted: CHF ${total.toLocaleString()}`);
            console.log(`📈 Average value: CHF ${(total / values.length).toLocaleString()}`);
            console.log(`📊 Value range: CHF ${Math.min(...values).toLocaleString()} - CHF ${Math.max(...values).toLocaleString()}`);
        }
        
        // Look for the expected portfolio total
        console.log('\n🎯 LOOKING FOR PORTFOLIO TOTAL');
        console.log('==============================');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes('19\'464\'431') || line.includes('19,464,431') || line.includes('19464431')) {
                console.log(`🎯 Found expected total at line ${i + 1}: "${line}"`);
            }
        }
        
        // Sample some portfolio lines
        console.log('\n📋 SAMPLE PORTFOLIO LINES');
        console.log('==========================');
        
        if (portfolioStart >= 0 && portfolioEnd > portfolioStart) {
            const sampleLines = Math.min(10, portfolioEnd - portfolioStart);
            for (let i = 0; i < sampleLines; i++) {
                const lineIndex = portfolioStart + Math.floor(i * (portfolioEnd - portfolioStart) / sampleLines);
                if (lineIndex < lines.length) {
                    console.log(`Line ${lineIndex + 1}: "${lines[lineIndex].trim()}"`);
                }
            }
        }
        
        // Analysis summary
        console.log('\n📋 ISSUES IDENTIFIED');
        console.log('=====================');
        console.log('❌ 1. IBAN (CH1908490000...) detected as ISIN');
        console.log('❌ 2. Missing CHF market values for most securities');
        console.log('❌ 3. Invalid ISIN format (XD0466760473) accepted');
        console.log('❌ 4. Portfolio section boundaries not properly detected');
        console.log('❌ 5. Swiss number format parsing incomplete');
        
        console.log('\n💡 RECOMMENDED FIXES');
        console.log('====================');
        console.log('✅ 1. Exclude IBANs from ISIN detection');
        console.log('✅ 2. Better portfolio section detection');
        console.log('✅ 3. Improved CHF value extraction');
        console.log('✅ 4. Stricter ISIN validation');
        console.log('✅ 5. Context-aware value matching');
        
    } catch (error) {
        console.error('❌ Error analyzing PDF:', error);
    }
}

if (require.main === module) {
    analyzePDFExtractionIssues().catch(console.error);
}

module.exports = { analyzePDFExtractionIssues };