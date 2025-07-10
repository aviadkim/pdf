import fetch from 'node-fetch';

async function testAzureFinal() {
  console.log('🚀 FINAL AZURE TEST - Testing Azure Simple Extract\n');
  
  // Sample financial data that matches your PDF structure
  const sampleData = `CORNÈR BANCA SA
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

SWISS BANK NOTES 2025-2030
CH0244767585
USD 2'447'675.00

EMERALD BAY NOTES 17.09.2029
XS2714429128
USD 446'210.00`;

  try {
    console.log('Testing Azure Simple Extract with text data...');
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/azure-simple-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        textData: sampleData, // Using text data directly to test parsing
        filename: 'test-messos-sample.pdf'
      })
    });
    
    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('\n✅ AZURE SIMPLE EXTRACT RESULTS:');
      console.log('=' * 50);
      console.log(`Success: ${data.success}`);
      console.log(`Method: ${data.metadata?.method}`);
      console.log(`Confidence: ${data.metadata?.confidence}%`);
      console.log(`Azure Used: ${data.metadata?.azureUsed ? 'YES' : 'NO'}`);
      console.log(`Processing Time: ${data.metadata?.processingTime}`);
      
      const holdings = data.data?.holdings || [];
      console.log(`\nHoldings Found: ${holdings.length}`);
      
      if (holdings.length > 0) {
        console.log('\n📊 EXTRACTED HOLDINGS:');
        holdings.forEach((holding, idx) => {
          console.log(`${idx + 1}. ${holding.securityName}`);
          console.log(`   ISIN: ${holding.isin} ${validateISIN(holding.isin) ? '✅' : '❌'}`);
          console.log(`   Value: ${formatCurrency(holding.currentValue)} ${holding.currency}`);
          console.log(`   Category: ${holding.category}`);
          console.log(`   Source: ${holding.source || 'merged'}`);
        });
        
        // Quality Analysis
        const validISINs = holdings.filter(h => validateISIN(h.isin)).length;
        const usISINs = holdings.filter(h => h.isin?.startsWith('US')).length;
        const withValues = holdings.filter(h => h.currentValue > 0).length;
        const isinPrefixes = [...new Set(holdings.map(h => h.isin?.substring(0, 2)).filter(Boolean))];
        
        console.log('\n📈 QUALITY ANALYSIS:');
        console.log(`Valid ISINs: ${validISINs}/${holdings.length} (${Math.round(validISINs/holdings.length*100)}%)`);
        console.log(`US ISINs: ${usISINs} ${usISINs === 0 ? '✅ Perfect' : '❌ Problem'}`);
        console.log(`With Values: ${withValues}/${holdings.length} (${Math.round(withValues/holdings.length*100)}%)`);
        console.log(`ISIN Prefixes: ${isinPrefixes.join(', ')}`);
        
        // Portfolio Total
        const totalValue = data.data?.portfolioInfo?.portfolioTotal?.value;
        if (totalValue) {
          console.log(`\nPortfolio Total: ${formatCurrency(totalValue)} USD`);
          
          const holdingsSum = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
          const difference = Math.abs(totalValue - holdingsSum);
          const accuracy = ((Math.min(totalValue, holdingsSum) / Math.max(totalValue, holdingsSum)) * 100).toFixed(1);
          console.log(`Holdings Sum: ${formatCurrency(holdingsSum)} USD`);
          console.log(`Accuracy: ${accuracy}% (difference: ${formatCurrency(difference)})`);
        }
        
        // Compare with expected results
        console.log('\n🎯 COMPARISON WITH EXPECTED:');
        const expectedHoldings = 6; // We have 6 holdings in sample
        const expectedISINs = ['XD0466760473', 'XS1700087403', 'XS2754416860', 'XS2519287468', 'CH0244767585', 'XS2714429128'];
        
        console.log(`Expected Holdings: ${expectedHoldings}, Found: ${holdings.length} ${holdings.length >= expectedHoldings ? '✅' : '❌'}`);
        
        const foundISINs = holdings.map(h => h.isin);
        const missingISINs = expectedISINs.filter(isin => !foundISINs.includes(isin));
        const extraISINs = foundISINs.filter(isin => !expectedISINs.includes(isin));
        
        if (missingISINs.length === 0) {
          console.log('ISIN Coverage: ✅ All expected ISINs found');
        } else {
          console.log(`Missing ISINs: ${missingISINs.join(', ')} ❌`);
        }
        
        if (extraISINs.length > 0) {
          console.log(`Extra ISINs: ${extraISINs.join(', ')} (bonus!)`);
        }
        
      } else {
        console.log('❌ No holdings found');
      }
      
      if (data.debug) {
        console.log('\n🔍 DEBUG INFO:');
        console.log(`Text Holdings: ${data.debug.textResults?.holdings?.length || 0}`);
        console.log(`Azure Holdings: ${data.debug.azureResults?.holdings?.length || 0}`);
        
        if (data.debug.textResults?.error) {
          console.log(`Text Error: ${data.debug.textResults.error}`);
        }
        if (data.debug.azureResults?.error) {
          console.log(`Azure Error: ${data.debug.azureResults.error}`);
        }
      }
      
    } else {
      const errorData = await response.json();
      console.log('❌ Test failed');
      console.log('Error:', errorData.error);
      console.log('Details:', errorData.details);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

function validateISIN(isin) {
  if (!isin || isin.length !== 12) return false;
  return /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin);
}

function formatCurrency(value) {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('en-US').format(value);
}

testAzureFinal();