/**
 * Debug the extraction function
 */
const fs = require('fs');
const pdfParse = require('pdf-parse');

// Import the extraction function from express-server.js
const serverCode = fs.readFileSync('express-server.js', 'utf8');

// Extract just the extractSecuritiesPrecise function
const funcStart = serverCode.indexOf('function extractSecuritiesPrecise(');
const funcEnd = serverCode.indexOf('\nfunction ', funcStart + 1);
const funcCode = serverCode.substring(funcStart, funcEnd);

console.log('🔍 EXTRACTED FUNCTION LENGTH:', funcCode.length);
console.log('🔍 FUNCTION PREVIEW:', funcCode.substring(0, 300) + '...');

// Run test
async function debugExtraction() {
    const pdfBuffer = fs.readFileSync('2. Messos  - 31.03.2025.pdf');
    const pdfData = await pdfParse(pdfBuffer);
    
    console.log('\n📄 PDF DATA:');
    console.log('Text length:', pdfData.text.length);
    console.log('Contains ISIN pattern:', /[A-Z]{2}[0-9A-Z]{10}/.test(pdfData.text));
    console.log('ISIN matches:', (pdfData.text.match(/[A-Z]{2}[0-9A-Z]{10}/g) || []).length);
    
    // Test with sample ISINs
    const sampleISINs = pdfData.text.match(/[A-Z]{2}[0-9A-Z]{10}/g) || [];
    console.log('\n🔍 FIRST 5 ISINs FOUND:', sampleISINs.slice(0, 5));
}

debugExtraction().catch(console.error);