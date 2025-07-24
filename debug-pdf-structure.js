#!/usr/bin/env node

/**
 * DEBUG PDF STRUCTURE
 * Find where the actual securities are located
 */

const pdfParse = require('pdf-parse');
const fs = require('fs');

async function debugPDFStructure() {
    console.log('🔍 DEBUGGING PDF STRUCTURE');
    console.log('===========================');

    const pdfPath = './2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF file not found');
        return;
    }

    try {
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfData = await pdfParse(pdfBuffer);
        const text = pdfData.text;
        const lines = text.split('\n');
        
        console.log(`📄 Total lines: ${lines.length}`);
        
        // Find all ISIN occurrences
        console.log('\n🔍 ALL ISIN OCCURRENCES:');
        console.log('========================');
        
        const isinPattern = /ISIN:\s*([A-Z]{2}[0-9A-Z]{9}[0-9])/g;
        const isinLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('ISIN:')) {
                const isinMatch = line.match(/ISIN:\s*([A-Z0-9]{12})/);
                if (isinMatch) {
                    isinLines.push({
                        lineNumber: i + 1,
                        isin: isinMatch[1],
                        line: line.trim()
                    });
                    console.log(`Line ${i + 1}: ${isinMatch[1]} - "${line.trim()}"`);
                }
            }
        }
        
        console.log(`\n📊 Found ${isinLines.length} ISIN references`);
        
        // Look for CHF values near ISINs
        console.log('\n💰 CHF VALUES NEAR ISINS:');
        console.log('==========================');
        
        for (const isinInfo of isinLines) {
            console.log(`\n🔍 Searching around ISIN ${isinInfo.isin} (line ${isinInfo.lineNumber}):`);
            
            const searchRange = 5;
            const startLine = Math.max(0, isinInfo.lineNumber - 1 - searchRange);
            const endLine = Math.min(lines.length - 1, isinInfo.lineNumber - 1 + searchRange);
            
            for (let i = startLine; i <= endLine; i++) {
                const line = lines[i].trim();
                
                // Look for CHF or numbers
                if (line.includes('CHF') || line.match(/\d{1,3}(?:'\d{3})+/)) {
                    const distance = i - (isinInfo.lineNumber - 1);
                    console.log(`  ${distance > 0 ? '+' : ''}${distance}: "${line}"`);
                }
            }
        }
        
        // Look for specific patterns in the output we got
        console.log('\n🔍 ANALYZING CURRENT OUTPUT ISSUES:');
        console.log('====================================');
        
        // Check the IBANs being detected as ISINs
        const badISINs = ['CH1908490000', 'XD0466760473'];
        for (const badISIN of badISINs) {
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(badISIN)) {
                    console.log(`❌ Bad ISIN "${badISIN}" found at line ${i + 1}: "${lines[i].trim()}"`);
                }
            }
        }
        
        // Look for the portfolio total structure
        console.log('\n🎯 PORTFOLIO TOTAL STRUCTURE:');
        console.log('==============================');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes('19\'464\'431') || line.includes('Total')) {
                console.log(`Line ${i + 1}: "${line}"`);
                
                // Show surrounding context
                if (i > 0) console.log(`  ${i}: "${lines[i-1].trim()}"`);
                if (i < lines.length - 1) console.log(`  ${i+2}: "${lines[i+1].trim()}"`);
                console.log('---');
            }
        }
        
        // Find a good example security with value
        console.log('\n📊 SAMPLE SECURITY WITH VALUE:');
        console.log('===============================');
        
        for (const isinInfo of isinLines.slice(0, 5)) { // Check first 5 ISINs
            console.log(`\n🔍 Full context for ${isinInfo.isin}:`);
            const contextRange = 10;
            const startCtx = Math.max(0, isinInfo.lineNumber - 1 - contextRange);
            const endCtx = Math.min(lines.length - 1, isinInfo.lineNumber - 1 + contextRange);
            
            for (let i = startCtx; i <= endCtx; i++) {
                const marker = i === isinInfo.lineNumber - 1 ? '>>> ' : '    ';
                console.log(`${marker}${i + 1}: "${lines[i].trim()}"`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error debugging PDF:', error);
    }
}

if (require.main === module) {
    debugPDFStructure().catch(console.error);
}

module.exports = { debugPDFStructure };