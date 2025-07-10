import fetch from 'node-fetch';
import fs from 'fs';

async function testHybridExtraction() {
  console.log('🧪 Testing Hybrid PDF Extraction\n');
  
  // Test 1: Check if hybrid endpoint is working
  console.log('1. Testing hybrid-extract endpoint...');
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/hybrid-extract', {
      method: 'OPTIONS'
    });
    console.log('✅ Hybrid extract endpoint accessible');
    console.log('Status:', response.status);
  } catch (error) {
    console.error('❌ Hybrid extract endpoint failed:', error.message);
    return;
  }
  
  // Test 2: Test with sample PDF text data
  console.log('\n2. Testing with sample financial text...');
  
  // Create a simple PDF-like text structure for testing
  const samplePDFText = `
CORNÈR BANCA SA
Portfolio Statement

Cliente: MESSOS ENTERPRISES LTD.
Conto: 366223
Valutazione al: 30.04.2025
Patrimonio totale: USD 19'461'320.00

EXIGENT ENHANCED INCOME FUND LTD SHS A SERIES
XD0466760473                                USD 4'667'604.00

NATIXIS STRUC.NOTES 
XS1700087403                                USD 3'987'713.00

GOLDMAN SACHS 6% NOTES
XS2754416860                                USD 3'009'852.00

CARGILL NOTES 2024-2029
XS2519287468                                USD 2'450'000.00

Asset Allocation:
Liquidity:              USD   168'206     0.86%
Bonds:                  USD 12'385'094   63.64%
Structured products:    USD  6'857'714   35.24%
  `;
  
  // Convert sample text to base64 (simulating PDF extraction)
  const textBuffer = Buffer.from(samplePDFText, 'utf8');
  const base64Text = textBuffer.toString('base64');
  
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/hybrid-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pdfBase64: base64Text,
        filename: 'test-sample.pdf'
      })
    });
    
    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Hybrid extraction successful!');
      
      // Analyze results
      const holdings = data.data?.holdings || [];
      const portfolioInfo = data.data?.portfolioInfo || {};
      
      console.log('\n📊 Extraction Results:');
      console.log(`Total Holdings Found: ${holdings.length}`);
      console.log(`Portfolio Total: ${portfolioInfo.portfolioTotal?.value} ${portfolioInfo.portfolioTotal?.currency}`);
      console.log(`Client Name: ${portfolioInfo.clientName}`);
      console.log(`Processing Time: ${data.data?.metadata?.extractionTime}`);
      
      if (holdings.length > 0) {
        console.log('\n🎯 Sample Holdings:');
        holdings.slice(0, 3).forEach((holding, idx) => {
          console.log(`${idx + 1}. ${holding.securityName}`);
          console.log(`   ISIN: ${holding.isin} (${holding.isin?.startsWith('US') ? '❌ US' : '✅ Non-US'})`);
          console.log(`   Value: ${holding.currentValue} ${holding.currency}`);
          console.log(`   Category: ${holding.category}`);
        });
      }
      
      // Check for quality metrics
      const usISINs = holdings.filter(h => h.isin?.startsWith('US')).length;
      const validISINs = holdings.filter(h => h.isin?.length === 12).length;
      const withValues = holdings.filter(h => h.currentValue > 0).length;
      
      console.log('\n📈 Quality Metrics:');
      console.log(`Valid ISINs (12 chars): ${validISINs}/${holdings.length} (${Math.round(validISINs/holdings.length*100)}%)`);
      console.log(`US ISINs (should be 0): ${usISINs} ${usISINs === 0 ? '✅' : '❌'}`);
      console.log(`Holdings with values: ${withValues}/${holdings.length} (${Math.round(withValues/holdings.length*100)}%)`);
      
      return data;
      
    } else {
      const errorData = await response.json();
      console.log('❌ Hybrid extraction failed');
      console.log('Error:', errorData.error);
      console.log('Details:', errorData.details);
    }
  } catch (error) {
    console.error('❌ Hybrid extraction test error:', error.message);
  }
  
  // Test 3: Check hybrid upload interface
  console.log('\n3. Testing hybrid upload interface...');
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/hybrid-upload');
    console.log('Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Hybrid upload interface accessible');
      const html = await response.text();
      console.log('Contains hybrid features:', html.includes('95%+ Accuracy'));
      console.log('Contains comparison:', html.includes('method-comparison'));
    } else {
      console.log('❌ Hybrid upload interface not accessible');
    }
  } catch (error) {
    console.error('❌ Hybrid upload interface test error:', error.message);
  }
}

testHybridExtraction();