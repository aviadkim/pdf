// Test with a real PDF file
const fs = require('fs');
const path = require('path');

async function testRealPdf() {
  console.log('🔍 Testing with Real PDF');
  
  // Check if messos.pdf exists
  const messosPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
  if (!fs.existsSync(messosPath)) {
    console.log('❌ Messos PDF not found, testing with dummy data');
    return;
  }
  
  try {
    // Load the PDF
    const pdfBuffer = fs.readFileSync(messosPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log(`📄 PDF loaded: ${pdfBuffer.length} bytes`);
    console.log(`📄 Base64 length: ${pdfBase64.length} chars`);
    
    // Test the upload
    const response = await fetch('https://pdf-five-nu.vercel.app/api/family-office-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: 'messos.pdf'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response content-type:', response.headers.get('content-type'));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS!');
      console.log('Holdings found:', result.data?.holdings?.length || 0);
      console.log('Total value:', result.data?.portfolioInfo?.totalValue?.toLocaleString() || 'N/A');
      console.log('Processing method:', result.metadata?.extractionMethod || 'N/A');
      console.log('Processing time:', result.metadata?.processingTime || 'N/A');
      
      // Show first few holdings
      if (result.data?.holdings?.length > 0) {
        console.log('\n📊 First few holdings:');
        for (let i = 0; i < Math.min(3, result.data.holdings.length); i++) {
          const holding = result.data.holdings[i];
          console.log(`  ${i+1}. ${holding.securityName} (${holding.isin}) - ${holding.currentValue?.toLocaleString()}`);
        }
      }
    } else {
      const error = await response.text();
      console.log('❌ Error:', error.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRealPdf();