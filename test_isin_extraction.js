const fs = require('fs');
const pdf = require('pdf-parse');

async function testISINExtraction() {
    console.log('🔍 Testing ISIN extraction method');
    
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF not found');
        return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(pdfBuffer);
    const text = pdfData.text;
    const lines = text.split('\n').map((line, index) => ({
        index: index,
        content: line.trim(),
        raw: line
    }));
    
    console.log(`📄 Total lines: ${lines.length}`);
    
    // Test ISIN extraction
    const isins = [];
    lines.forEach((line, index) => {
        const isinMatch = line.content.match(/\b([A-Z]{2}[A-Z0-9]{10})\b/);
        if (isinMatch) {
            isins.push({
                isin: isinMatch[1],
                lineIndex: index,
                content: line.content
            });
        }
    });
    
    console.log(`🎯 ISINs found: ${isins.length}`);
    
    if (isins.length > 0) {
        console.log('\n📋 All ISINs found:');
        isins.forEach((isin, i) => {
            console.log(`${i+1}. ${isin.isin} (line ${isin.lineIndex + 1})`);
        });
    }
    
    return isins;
}

testISINExtraction().catch(console.error);