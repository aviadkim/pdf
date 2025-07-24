// Debug why extraction is returning 0 holdings
const fs = require('fs');
const path = require('path');

async function debugExtractionIssue() {
  console.log('🔍 Debugging Extraction Issue');
  
  try {
    // Load the real Messos PDF
    const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log(`📄 PDF size: ${pdfBuffer.length} bytes`);
    console.log(`📄 Base64 size: ${pdfBase64.length} chars`);
    
    // Test fixed processor directly
    console.log('\n🔧 Testing Fixed Processor:');
    const fixedResponse = await fetch('https://pdf-five-nu.vercel.app/api/fixed-messos-processor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: '2. Messos  - 31.03.2025.pdf'
      })
    });
    
    if (fixedResponse.ok) {
      const result = await fixedResponse.json();
      console.log('✅ Fixed processor response:');
      console.log(`  Success: ${result.success}`);
      console.log(`  Holdings: ${result.data?.holdings?.length || 0}`);
      console.log(`  Total value: ${result.data?.portfolioInfo?.totalValue?.toLocaleString() || 'N/A'}`);
      console.log(`  Method: ${result.metadata?.extractionMethod}`);
      console.log(`  Processing time: ${result.metadata?.processingTime}`);
      console.log(`  Processing log: ${JSON.stringify(result.metadata?.processingLog || [], null, 2)}`);
      
      if (result.data?.holdings?.length > 0) {
        console.log('\n📊 First holding:');
        console.log(JSON.stringify(result.data.holdings[0], null, 2));
      } else {
        console.log('\n❌ NO HOLDINGS FOUND!');
        console.log('Full response:');
        console.log(JSON.stringify(result, null, 2));
      }
    } else {
      console.log(`❌ Fixed processor failed: ${fixedResponse.status}`);
      const errorText = await fixedResponse.text();
      console.log('Error:', errorText.substring(0, 500));
    }
    
    // Test multiline processor
    console.log('\n🧠 Testing Multiline Processor:');
    try {
      const multilineResponse = await fetch('https://pdf-five-nu.vercel.app/api/multiline-messos-processor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64: pdfBase64,
          filename: '2. Messos  - 31.03.2025.pdf'
        })
      });
      
      if (multilineResponse.ok) {
        const result = await multilineResponse.json();
        console.log('✅ Multiline processor response:');
        console.log(`  Success: ${result.success}`);
        console.log(`  Holdings: ${result.data?.holdings?.length || 0}`);
        console.log(`  Total value: ${result.data?.portfolioInfo?.totalValue?.toLocaleString() || 'N/A'}`);
        console.log(`  Method: ${result.metadata?.extractionMethod}`);
        
        if (result.data?.holdings?.length > 0) {
          console.log('\n📊 First holding:');
          console.log(JSON.stringify(result.data.holdings[0], null, 2));
        }
      } else {
        console.log(`❌ Multiline processor failed: ${multilineResponse.status}`);
        const errorText = await multilineResponse.text();
        console.log('Error:', errorText.substring(0, 500));
      }
    } catch (multilineError) {
      console.log('❌ Multiline processor error:', multilineError.message);
    }
    
    // Compare with known working results
    console.log('\n📋 Expected Results (from memory):');
    console.log('  Holdings: 40');
    console.log('  Total value: $99,897,584');
    console.log('  Method: Azure Form Recognizer');
    
    // Test with smaller sample to see if size is the issue
    console.log('\n🧪 Testing with truncated base64:');
    const truncatedBase64 = pdfBase64.substring(0, 100000); // 100KB sample
    
    const sampleResponse = await fetch('https://pdf-five-nu.vercel.app/api/fixed-messos-processor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: truncatedBase64,
        filename: 'sample.pdf'
      })
    });
    
    if (sampleResponse.ok) {
      const sampleResult = await sampleResponse.json();
      console.log(`  Sample result holdings: ${sampleResult.data?.holdings?.length || 0}`);
      console.log(`  Sample processing method: ${sampleResult.metadata?.extractionMethod}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugExtractionIssue();