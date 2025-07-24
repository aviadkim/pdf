#!/usr/bin/env node

/**
 * CREATE TEST PDF
 * 
 * Creates a simple test PDF for upload testing
 */

const fs = require('fs');

// Create a minimal PDF content (this is a very basic PDF structure)
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
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF Content) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;

// Write the test PDF
fs.writeFileSync('test-upload.pdf', pdfContent);
console.log('✅ Created test-upload.pdf for testing');

// Also create a text file that looks like a PDF for testing error handling
fs.writeFileSync('fake-pdf.pdf', 'This is not a real PDF file but has .pdf extension');
console.log('✅ Created fake-pdf.pdf for error testing');

console.log('\n📄 Test files created:');
console.log('- test-upload.pdf (minimal valid PDF)');
console.log('- fake-pdf.pdf (invalid PDF for error testing)');
