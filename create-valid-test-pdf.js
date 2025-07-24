#!/usr/bin/env node

/**
 * CREATE VALID TEST PDF
 * 
 * Creates a properly formatted test PDF for upload testing
 */

const fs = require('fs');

// Create a more complete and valid PDF structure
const pdfContent = `%PDF-1.4
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
/Length 120
>>
stream
BT
/F1 12 Tf
50 750 Td
(Financial Portfolio Statement) Tj
0 -20 Td
(ISIN: CH0012032048) Tj
0 -20 Td
(Value: 1,234,567.89 CHF) Tj
0 -20 Td
(Date: 2024-03-31) Tj
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
0000000445 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
523
%%EOF`;

// Write the test PDF
fs.writeFileSync('valid-test.pdf', pdfContent);
console.log('✅ Created valid-test.pdf for testing');

// Also create a simple text file for comparison
const textContent = `Financial Portfolio Statement
ISIN: CH0012032048
Value: 1,234,567.89 CHF
Date: 2024-03-31`;

fs.writeFileSync('test-content.txt', textContent);
console.log('✅ Created test-content.txt for comparison');

console.log('\n📄 Test files created:');
console.log('- valid-test.pdf (properly formatted PDF with financial content)');
console.log('- test-content.txt (text version for comparison)');
console.log('\nContent includes:');
console.log('- Financial portfolio statement');
console.log('- ISIN number (Swiss format)');
console.log('- Swiss currency value');
console.log('- Date format');
console.log('\nThis should trigger the pattern recognition for:');
console.log('- ISIN detection');
console.log('- Swiss number format');
console.log('- Financial document structure');
