#!/usr/bin/env node

/**
 * CREATE FINANCIAL TEST PDF
 * 
 * Creates a comprehensive financial PDF for testing pattern recognition
 */

const fs = require('fs');

// Create a comprehensive financial PDF with multiple data types
const financialPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
  /Font <<
    /F1 5 0 R
  >>
>>
>>
endobj

4 0 obj
<<
/Length 850
>>
stream
BT
/F1 14 Tf
50 750 Td
(PORTFOLIO STATEMENT - SWISS BANK AG) Tj
0 -30 Td
(Date: 31.03.2024) Tj
0 -20 Td
(Account: CH93 0076 2011 6238 5295 7) Tj

0 -40 Td
(SECURITIES HOLDINGS:) Tj
0 -25 Td
(ISIN: CH0012032048  |  Roche Holding AG  |  CHF 1,234,567.89) Tj
0 -20 Td
(ISIN: US0378331005  |  Apple Inc.        |  USD 987,654.32) Tj
0 -20 Td
(ISIN: DE0007164600  |  SAP SE            |  EUR 456,789.01) Tj
0 -20 Td
(ISIN: GB0002162385  |  BP PLC            |  GBP 234,567.89) Tj

0 -40 Td
(CASH POSITIONS:) Tj
0 -25 Td
(CHF Cash Balance:     CHF 123,456.78) Tj
0 -20 Td
(USD Cash Balance:     USD 67,890.12) Tj
0 -20 Td
(EUR Cash Balance:     EUR 34,567.89) Tj

0 -40 Td
(TRANSACTION HISTORY:) Tj
0 -25 Td
(15.03.2024  BUY   ISIN: CH0012032048  100 shares  CHF 320.50) Tj
0 -20 Td
(10.03.2024  SELL  ISIN: US0378331005   50 shares  USD 175.25) Tj
0 -20 Td
(05.03.2024  DIV   ISIN: DE0007164600  Dividend    EUR 2.50) Tj

0 -40 Td
(PORTFOLIO SUMMARY:) Tj
0 -25 Td
(Total Value (CHF):   CHF 2,891,234.56) Tj
0 -20 Td
(Performance YTD:     +12.34%) Tj
0 -20 Td
(Risk Rating:         Moderate) Tj

0 -40 Td
(CONTACT: portfolio@swissbank.ch | +41 44 123 45 67) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000273 00000 n 
0000001175 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
1253
%%EOF`;

// Write the comprehensive financial test PDF
fs.writeFileSync('financial-test.pdf', financialPdfContent);
console.log('✅ Created financial-test.pdf for comprehensive testing');

console.log('\n📊 FINANCIAL TEST PDF CONTENT:');
console.log('==============================');
console.log('✅ Portfolio Statement Header');
console.log('✅ Swiss Bank Account Number');
console.log('✅ Multiple ISIN Numbers:');
console.log('   - CH0012032048 (Roche - Swiss)');
console.log('   - US0378331005 (Apple - US)');
console.log('   - DE0007164600 (SAP - German)');
console.log('   - GB0002162385 (BP - UK)');
console.log('✅ Multi-currency Values:');
console.log('   - CHF amounts with Swiss formatting');
console.log('   - USD, EUR, GBP amounts');
console.log('✅ Transaction History with dates');
console.log('✅ Portfolio Summary with percentages');
console.log('✅ Contact information');

console.log('\n🎯 EXPECTED PATTERN RECOGNITION:');
console.log('================================');
console.log('- ISIN format detection (4 different countries)');
console.log('- Swiss number formatting (1,234,567.89)');
console.log('- Multi-currency recognition');
console.log('- Date format detection (DD.MM.YYYY)');
console.log('- Financial document structure');
console.log('- Table-like data organization');
console.log('- Percentage and performance metrics');

console.log('\n🧪 This PDF should trigger:');
console.log('- Enhanced ISIN pattern recognition');
console.log('- Currency value extraction');
console.log('- Financial document classification');
console.log('- Multi-language security identification');
