import fetch from 'node-fetch';
import fs from 'fs';

async function testRealPDF() {
  console.log('🎯 TESTING REAL PDF - Full Pipeline Test\n');
  
  const pdfPath = '/mnt/c/Users/aviad/OneDrive/Desktop/2. Messos  - 31.03.2025.pdf';
  
  try {
    // Check if PDF exists
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ PDF file not found at:', pdfPath);
      console.log('Please provide the correct path to your 19-page Messos PDF\n');
      return;
    }
    
    console.log('📄 Reading PDF file...');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log(`📊 PDF Info:`);
    console.log(`  Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
    console.log(`  Base64 Length: ${pdfBase64.length} characters`);
    console.log(`  Expected Holdings: 40`);
    console.log(`  Expected Total: 19,461,320 USD\n`);
    
    console.log('🚀 Sending to Azure Simple Extract...');
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/azure-simple-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: 'Messos-31.03.2025.pdf'
      })
    });
    
    console.log(`Response Status: ${response.status}\n`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ REAL PDF EXTRACTION RESULTS:');
      console.log('=' * 60);
      console.log(`Success: ${data.success}`);
      console.log(`Method: ${data.metadata?.method}`);
      console.log(`Confidence: ${data.metadata?.confidence}%`);
      console.log(`Azure Used: ${data.metadata?.azureUsed ? 'YES' : 'NO'}`);
      console.log(`Processing Time: ${data.metadata?.processingTime}`);
      console.log(`Text Holdings: ${data.metadata?.textHoldings || 0}`);
      console.log(`Azure Holdings: ${data.metadata?.azureHoldings || 0}`);
      console.log(`Final Holdings: ${data.metadata?.finalHoldings || 0}\n`);
      
      const holdings = data.data?.holdings || [];
      console.log(`📊 HOLDINGS FOUND: ${holdings.length}/40 expected\n`);
      
      if (holdings.length > 0) {
        // Show first 10 holdings
        console.log('🔸 FIRST 10 HOLDINGS:');
        holdings.slice(0, 10).forEach((holding, idx) => {
          console.log(`${(idx + 1).toString().padStart(2)}. ${holding.securityName || 'Unknown'}`);
          console.log(`    ISIN: ${holding.isin || 'Missing'} ${validateISIN(holding.isin) ? '✅' : '❌'}`);
          console.log(`    Value: ${formatCurrency(holding.currentValue)} ${holding.currency}`);
          console.log(`    Category: ${holding.category || 'Unknown'}`);
        });
        
        if (holdings.length > 10) {
          console.log(`    ... and ${holdings.length - 10} more holdings\n`);
        } else {
          console.log('');
        }
        
        // Comprehensive Quality Analysis
        console.log('📈 COMPREHENSIVE QUALITY ANALYSIS:');
        console.log('-' * 50);
        
        const validISINs = holdings.filter(h => validateISIN(h.isin)).length;
        const usISINs = holdings.filter(h => h.isin?.startsWith('US')).length;
        const europeanISINs = holdings.filter(h => h.isin?.match(/^(XS|XD|CH|DE|FR|IT|ES)/)).length;
        const withValues = holdings.filter(h => h.currentValue > 0).length;
        const withNames = holdings.filter(h => h.securityName && h.securityName !== 'Unknown Security').length;
        
        console.log(`ISIN Quality:`);
        console.log(`  Valid ISINs: ${validISINs}/${holdings.length} (${Math.round(validISINs/holdings.length*100)}%)`);
        console.log(`  US ISINs: ${usISINs} ${usISINs === 0 ? '✅ Perfect (no hallucinations)' : '❌ Problem!'}`);
        console.log(`  European ISINs: ${europeanISINs} ${europeanISINs > 35 ? '✅ Good' : '⚠️ Low'}`);
        
        console.log(`Data Completeness:`);
        console.log(`  With Values: ${withValues}/${holdings.length} (${Math.round(withValues/holdings.length*100)}%)`);
        console.log(`  With Names: ${withNames}/${holdings.length} (${Math.round(withNames/holdings.length*100)}%)`);
        
        // ISIN Prefix Analysis
        const isinPrefixes = {};
        holdings.forEach(h => {
          if (h.isin) {
            const prefix = h.isin.substring(0, 2);
            isinPrefixes[prefix] = (isinPrefixes[prefix] || 0) + 1;
          }
        });
        
        console.log(`ISIN Prefixes:`);
        Object.entries(isinPrefixes).sort((a, b) => b[1] - a[1]).forEach(([prefix, count]) => {
          console.log(`  ${prefix}: ${count} holdings`);
        });
        
        // Portfolio Total Analysis
        const totalValue = data.data?.portfolioInfo?.portfolioTotal?.value;
        const holdingsSum = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
        
        console.log(`\nPortfolio Analysis:`);
        console.log(`  Reported Total: ${formatCurrency(totalValue || 0)} USD`);
        console.log(`  Holdings Sum: ${formatCurrency(holdingsSum)} USD`);
        
        if (totalValue) {
          const difference = Math.abs(totalValue - holdingsSum);
          const coverage = Math.min(holdingsSum / totalValue, 1) * 100;
          console.log(`  Coverage: ${coverage.toFixed(1)}% (difference: ${formatCurrency(difference)})`);
          
          if (coverage > 90) {
            console.log(`  ✅ Excellent coverage!`);
          } else if (coverage > 75) {
            console.log(`  ⚠️ Good coverage, some holdings may be missing`);
          } else {
            console.log(`  ❌ Low coverage, many holdings missing`);
          }
        }
        
        // Final Accuracy Score
        const accuracyScore = calculateAccuracyScore(holdings, totalValue, holdingsSum);
        console.log(`\n🎯 OVERALL ACCURACY SCORE: ${accuracyScore}%`);
        
        if (accuracyScore >= 95) {
          console.log('🎉 EXCELLENT! Target accuracy achieved!');
        } else if (accuracyScore >= 85) {
          console.log('✅ GOOD! Acceptable accuracy for production use.');
        } else if (accuracyScore >= 70) {
          console.log('⚠️ FAIR. Some improvements needed.');
        } else {
          console.log('❌ POOR. Significant improvements required.');
        }
        
      } else {
        console.log('❌ No holdings extracted from the PDF');
      }
      
      // Show debugging info if available
      if (data.debug) {
        console.log('\n🔍 DEBUGGING INFORMATION:');
        console.log('-' * 40);
        
        if (data.debug.textResults?.error) {
          console.log(`Text Extraction Error: ${data.debug.textResults.error}`);
        }
        
        if (data.debug.azureResults?.error) {
          console.log(`Azure Extraction Error: ${data.debug.azureResults.error}`);
        }
        
        if (data.debug.textResults?.holdings?.length > 0) {
          console.log(`Text-only found: ${data.debug.textResults.holdings.length} holdings`);
        }
        
        if (data.debug.azureResults?.holdings?.length > 0) {
          console.log(`Azure found: ${data.debug.azureResults.holdings.length} holdings`);
        }
      }
      
    } else {
      const errorData = await response.json();
      console.log('❌ EXTRACTION FAILED');
      console.log(`Error: ${errorData.error}`);
      console.log(`Details: ${errorData.details}`);
      
      if (errorData.suggestions) {
        console.log('\n💡 Suggestions:');
        errorData.suggestions.forEach(suggestion => {
          console.log(`  • ${suggestion}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ENOENT') {
      console.log('\n💡 File not found. Please check the PDF path:');
      console.log(`   ${pdfPath}`);
    }
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

function calculateAccuracyScore(holdings, totalValue, holdingsSum) {
  let score = 0;
  
  // ISIN quality (40 points)
  if (holdings.length > 0) {
    const validISINs = holdings.filter(h => validateISIN(h.isin)).length;
    const usISINs = holdings.filter(h => h.isin?.startsWith('US')).length;
    
    score += (validISINs / holdings.length) * 30; // Valid ISIN format
    score += (usISINs === 0) ? 10 : 0; // No US ISIN hallucinations
  }
  
  // Coverage (40 points)
  const expectedHoldings = 40;
  const holdingsCoverage = Math.min(holdings.length / expectedHoldings, 1);
  score += holdingsCoverage * 40;
  
  // Value accuracy (20 points)
  if (totalValue && holdingsSum > 0) {
    const valueCoverage = Math.min(holdingsSum / totalValue, 1);
    score += valueCoverage * 20;
  }
  
  return Math.round(score);
}

testRealPDF();