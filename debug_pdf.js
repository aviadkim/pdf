const fs = require('fs');
const pdf = require('pdf-parse');

async function debugPDF() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF not found');
        return;
    }
    
    console.log('📄 Reading PDF file...');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(pdfBuffer);
    const text = pdfData.text;
    const lines = text.split('\n');
    
    console.log(`📊 Total lines: ${lines.length}`);
    console.log('\nFirst 15 lines:');
    lines.slice(0, 15).forEach((line, i) => {
        console.log(`${i+1}: ${line.trim()}`);
    });
    
    console.log('\n🔍 Looking for ISINs in ENTIRE document:');
    const isinRegex = /\b([A-Z]{2}[A-Z0-9]{10})\b/;
    let isinCount = 0;
    const foundISINs = [];
    lines.forEach((line, i) => {
        const match = line.match(isinRegex);
        if (match) {
            isinCount++;
            foundISINs.push({ line: i+1, isin: match[1], content: line.trim() });
            if (isinCount <= 10) {
                console.log(`Line ${i+1}: ${match[1]} in '${line.trim()}'`);
            }
        }
    });
    
    if (isinCount > 10) {
        console.log(`... and ${isinCount - 10} more ISINs found`);
    }
    
    console.log('\n🔢 Looking for numbers:');
    const numberRegex = /\b(\d{1,3}(?:'?\d{3})*(?:\.\d{1,2})?)\b/g;
    let numberCount = 0;
    lines.slice(0, 50).forEach((line, i) => {
        const matches = [...line.matchAll(numberRegex)];
        if (matches.length > 0) {
            matches.forEach(match => {
                const value = parseFloat(match[1].replace(/[']/g, ''));
                if (value >= 100) {
                    numberCount++;
                    console.log(`Line ${i+1}: ${match[1]} (${value}) in '${line.trim()}'`);
                    if (numberCount >= 10) return;
                }
            });
        }
    });
    
    console.log(`\n📊 Total ISINs found in entire document: ${isinCount}`);
    console.log(`📊 Total numbers found in first 50 lines: ${numberCount}`);
    
    if (foundISINs.length > 0) {
        console.log('\n📍 ISIN locations:');
        console.log(`   First ISIN at line: ${foundISINs[0].line}`);
        console.log(`   Last ISIN at line: ${foundISINs[foundISINs.length-1].line}`);
    }
}

debugPDF().catch(console.error);