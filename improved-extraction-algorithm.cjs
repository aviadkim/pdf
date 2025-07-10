const fs = require('fs');
const pdf = require('pdf-parse');

function improvedSwissExtraction(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const securities = [];
  
  console.log('=== IMPROVED SWISS EXTRACTION ALGORITHM ===');
  console.log(`Processing ${lines.length} lines...`);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Find ISIN lines
    if (line.includes('ISIN:') && line.match(/ISIN:\s*([A-Z]{2}[0-9A-Z]{10})/)) {
      const isinMatch = line.match(/ISIN:\s*([A-Z]{2}[0-9A-Z]{10})/);
      const isin = isinMatch[1];
      
      // Look for security name in previous lines (1-5 lines before)
      let securityName = '';
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        const prevLine = lines[j];
        if (prevLine && 
            prevLine.length > 10 && 
            prevLine.length < 150 && 
            !prevLine.includes('ISIN') && 
            !prevLine.includes('Valorn') && 
            !prevLine.includes('//') &&
            !prevLine.includes('Maturity') &&
            !prevLine.includes('Coupon') &&
            !prevLine.includes('PRC:') &&
            !prevLine.match(/^[0-9\s'.,%-]+$/) &&
            !prevLine.includes('USD') &&
            !prevLine.includes('CHF')) {
          securityName = prevLine;
          break;
        }
      }
      
      // Look for value in next lines (1-7 lines after)
      let value = '';
      let currency = '';
      
      for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
        const nextLine = lines[j];
        
        // Pattern 1: USD followed by number
        const usdMatch = nextLine.match(/USD\s*([0-9]{1,3}(?:[']\d{3})*(?:[\.,]\d{2})?)/);
        if (usdMatch) {
          value = usdMatch[1];
          currency = 'USD';
          break;
        }
        
        // Pattern 2: Standalone number (Swiss format)
        const swissNumberMatch = nextLine.match(/^([0-9]{1,3}(?:[']\d{3})+)$/);
        if (swissNumberMatch) {
          value = swissNumberMatch[1];
          currency = 'USD'; // Default for this document
          break;
        }
        
        // Pattern 3: Number at end of line
        const endNumberMatch = nextLine.match(/([0-9]{1,3}(?:[']\d{3})+)$/);
        if (endNumberMatch && !nextLine.includes('%') && !nextLine.includes('PRC')) {
          value = endNumberMatch[1];
          currency = 'USD';
          break;
        }
      }
      
      // Store the security
      const security = {
        isin,
        securityName: securityName || 'NAME_NOT_FOUND',
        value: value || 'VALUE_NOT_FOUND',
        currency,
        lineNumber: i
      };
      
      securities.push(security);
      
      console.log(`Found security ${securities.length}: ${isin} - ${securityName ? securityName.substring(0, 50) : 'NO_NAME'} - ${value || 'NO_VALUE'}`);
    }
  }
  
  // Calculate statistics
  const totalSecurities = securities.length;
  const securitiesWithNames = securities.filter(s => s.securityName !== 'NAME_NOT_FOUND').length;
  const securitiesWithValues = securities.filter(s => s.value !== 'VALUE_NOT_FOUND').length;
  
  const nameAccuracy = (securitiesWithNames / totalSecurities * 100).toFixed(1);
  const valueAccuracy = (securitiesWithValues / totalSecurities * 100).toFixed(1);
  const overallAccuracy = ((securitiesWithNames + securitiesWithValues) / (totalSecurities * 2) * 100).toFixed(1);
  
  console.log(`\n=== EXTRACTION RESULTS ===`);
  console.log(`Total securities found: ${totalSecurities}`);
  console.log(`Securities with names: ${securitiesWithNames} (${nameAccuracy}%)`);
  console.log(`Securities with values: ${securitiesWithValues} (${valueAccuracy}%)`);
  console.log(`Overall accuracy: ${overallAccuracy}%`);
  
  return {
    securities,
    statistics: {
      totalSecurities,
      securitiesWithNames,
      securitiesWithValues,
      nameAccuracy: parseFloat(nameAccuracy),
      valueAccuracy: parseFloat(valueAccuracy),
      overallAccuracy: parseFloat(overallAccuracy)
    }
  };
}

// Test the improved extraction
async function testImprovedExtraction() {
  try {
    const dataBuffer = fs.readFileSync('/mnt/c/Users/aviad/OneDrive/Desktop/2. Messos  - 31.03.2025.pdf');
    const data = await pdf(dataBuffer);
    
    const result = improvedSwissExtraction(data.text);
    
    console.log(`\n=== FIRST 10 EXTRACTED SECURITIES ===`);
    result.securities.slice(0, 10).forEach((security, index) => {
      console.log(`\n${index + 1}. ISIN: ${security.isin}`);
      console.log(`   Name: ${security.securityName}`);
      console.log(`   Value: ${security.value} ${security.currency}`);
    });
    
    // Save results for comparison
    const outputFile = '/mnt/c/Users/aviad/OneDrive/Desktop/finance-ai-main/claude-pdf-vercel/improved-extraction-results.json';
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`\nResults saved to: ${outputFile}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testImprovedExtraction();