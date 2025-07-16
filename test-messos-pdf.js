// Test with actual Messos PDF
const fs = require('fs');
const path = require('path');

async function testMessosPDF() {
    try {
        console.log('🚀 Testing with actual Messos PDF...\n');
        
        // Read the PDF file
        const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        console.log(`PDF file size: ${pdfBuffer.length} bytes`);
        console.log(`Base64 size: ${pdfBase64.length} characters\n`);
        
        const response = await fetch('https://pdf-fzzi.onrender.com/api/pdf-extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pdfBase64: pdfBase64
            })
        });
        
        const result = await response.json();
        console.log('Messos PDF Extraction Result:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success && result.extractedData) {
            console.log('\n📊 Summary:');
            console.log(`Securities found: ${result.extractedData.securities.length}`);
            console.log(`Total value: $${result.extractedData.totalValue.toLocaleString()}`);
            console.log(`Confidence: ${(result.extractedData.confidence * 100).toFixed(1)}%`);
            
            result.extractedData.securities.forEach((security, index) => {
                console.log(`\n${index + 1}. ${security.name}`);
                console.log(`   ISIN: ${security.isin}`);
                console.log(`   Value: ${security.currency} ${security.value.toLocaleString()}`);
            });
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run test
testMessosPDF();