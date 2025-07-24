
// Visual PDF Upload Test
const fs = require('fs');
const path = require('path');

async function visualPDFTest() {
  console.log('📸 Visual PDF Upload Test');
  
  try {
    // Load the PDF
    const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log('📄 PDF loaded for visual test');
    
    // Test the API
    const response = await fetch('https://pdf-five-nu.vercel.app/api/fixed-messos-processor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: '2. Messos  - 31.03.2025.pdf'
      })
    });
    
    const result = await response.json();
    
    console.log('\n📊 VISUAL TEST RESULTS:');
    console.log('Holdings found:', result.data?.holdings?.length || 0);
    console.log('Total value:', result.data?.portfolioInfo?.totalValue?.toLocaleString() || 'N/A');
    console.log('Processing method:', result.metadata?.extractionMethod);
    
    // Save detailed results
    fs.writeFileSync('visual-test-results.json', JSON.stringify(result, null, 2));
    console.log('✅ Results saved to visual-test-results.json');
    
    // Check if total value is around 46M or 99M
    const totalValue = result.data?.portfolioInfo?.totalValue || 0;
    if (totalValue > 90000000) {
      console.log('⚠️  WARNING: Total value is $' + totalValue.toLocaleString() + ' (seems too high)');
      console.log('Expected: Around $46 million');
    } else if (totalValue > 40000000 && totalValue < 50000000) {
      console.log('✅ Total value looks correct: $' + totalValue.toLocaleString());
    } else {
      console.log('❌ Total value seems incorrect: $' + totalValue.toLocaleString());
    }
    
  } catch (error) {
    console.error('❌ Visual test failed:', error);
  }
}

visualPDFTest();
