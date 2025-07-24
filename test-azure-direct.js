import fetch from 'node-fetch';

async function testAzureDirectly() {
  console.log('🔷 Testing Azure Hybrid Extraction Directly\n');
  
  // Create a realistic sample PDF text that mimics real extraction
  const sampleFinancialText = `
CORNÈR BANCA SA
Portfolio Statement

Cliente: MESSOS ENTERPRISES LTD.
Conto: 366223
Valutazione al: 30.04.2025
Patrimonio totale: USD 19'461'320.00

EXIGENT ENHANCED INCOME FUND LTD SHS A SERIES
XD0466760473
USD 4'667'604.00

NATIXIS STRUC.NOTES 20.06.2026
XS1700087403
USD 3'987'713.00

GOLDMAN SACHS 6% NOTES 17.01.2030
XS2754416860
USD 3'009'852.00

CARGILL NOTES 2024-2029 5.125%
XS2519287468
USD 2'450'000.00
  `;
  
  // Convert to base64 (simulating PDF extraction)
  const textBuffer = Buffer.from(sampleFinancialText, 'utf8');
  const base64Text = textBuffer.toString('base64');
  
  try {
    console.log('Testing with Azure enabled...');
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/azure-hybrid-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pdfBase64: base64Text,
        filename: 'test-messos.pdf',
        useAzure: true
      })
    });
    
    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('\n✅ Azure Hybrid Test Results:');
      console.log(`Success: ${data.success}`);
      console.log(`Method: ${data.metadata?.method}`);
      console.log(`Confidence: ${data.metadata?.confidence}%`);
      console.log(`Azure Used: ${data.metadata?.azureUsed ? 'YES' : 'NO'}`);
      console.log(`Processing Time: ${data.metadata?.processingTime}`);
      
      const holdings = data.data?.holdings || [];
      console.log(`Holdings Found: ${holdings.length}`);
      
      if (holdings.length > 0) {
        console.log('\n📊 Sample Holdings:');
        holdings.slice(0, 3).forEach((h, idx) => {
          console.log(`${idx + 1}. ${h.securityName}`);
          console.log(`   ISIN: ${h.isin} ${h.isin?.startsWith('US') ? '❌' : '✅'}`);
          console.log(`   Value: ${h.currentValue} ${h.currency}`);
        });
        
        // Quality analysis
        const validISINs = holdings.filter(h => h.isin?.length === 12).length;
        const usISINs = holdings.filter(h => h.isin?.startsWith('US')).length;
        const withValues = holdings.filter(h => h.currentValue > 0).length;
        
        console.log('\n📈 Quality Metrics:');
        console.log(`Valid ISINs: ${validISINs}/${holdings.length} (${Math.round(validISINs/holdings.length*100)}%)`);
        console.log(`US ISINs: ${usISINs} ${usISINs === 0 ? '✅ Good' : '❌ Bad'}`);
        console.log(`With Values: ${withValues}/${holdings.length} (${Math.round(withValues/holdings.length*100)}%)`);
      }
      
      if (data.debug) {
        console.log('\n🔍 Debug Info:');
        console.log(`Text Extraction: ${data.debug.textResults?.holdings?.length || 0} holdings`);
        console.log(`Azure Extraction: ${data.debug.azureResults?.holdings?.length || 0} holdings`);
      }
      
    } else {
      const errorData = await response.json();
      console.log('❌ Azure test failed');
      console.log('Error:', errorData.error);
      console.log('Details:', errorData.details);
      
      if (errorData.error?.includes('pdf-parse')) {
        console.log('\n💡 Diagnosis: pdf-parse dependency issue on Vercel');
        console.log('Solution: Need to fix the text extraction method');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testAzureDirectly();