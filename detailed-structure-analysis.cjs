const fs = require('fs');
const pdf = require('pdf-parse');

async function detailedStructureAnalysis() {
  try {
    const dataBuffer = fs.readFileSync('/mnt/c/Users/aviad/OneDrive/Desktop/2. Messos  - 31.03.2025.pdf');
    const data = await pdf(dataBuffer);
    
    const lines = data.text.split('\n');
    
    console.log('=== DETAILED STRUCTURE ANALYSIS ===');
    
    // Extract key information for each security
    const securities = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('ISIN:') && line.includes('XS')) {
        // Extract ISIN
        const isinMatch = line.match(/ISIN:\s*([A-Z]{2}[0-9A-Z]{10})/);
        if (isinMatch) {
          const isin = isinMatch[1];
          
          // Look for security name in previous lines
          let securityName = '';
          for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
            const prevLine = lines[j].trim();
            if (prevLine && 
                prevLine.length > 10 && 
                !prevLine.includes('ISIN') && 
                !prevLine.includes('Valorn') && 
                !prevLine.includes('//') &&
                !prevLine.includes('USD') &&
                !prevLine.includes('CHF') &&
                !prevLine.match(/^[0-9\s'.,%-]+$/)) {
              securityName = prevLine;
              break;
            }
          }
          
          // Look for value in next lines
          let value = '';
          for (let j = i + 1; j < Math.min(lines.length, i + 10); j++) {
            const nextLine = lines[j].trim();
            if (nextLine.includes('USD') && nextLine.match(/[0-9]+[\s']*[0-9]{3}/)) {
              const valueMatch = nextLine.match(/USD([0-9]+[\s']*[0-9]{3}[0-9]*)/);
              if (valueMatch) {
                value = valueMatch[1];
                break;
              }
            }
          }
          
          securities.push({
            isin,
            securityName,
            value,
            lineNumber: i
          });
        }
      }
    }
    
    console.log(`\n=== EXTRACTED SECURITIES (${securities.length} found) ===`);
    
    securities.forEach((security, index) => {
      console.log(`\n${index + 1}. ISIN: ${security.isin}`);
      console.log(`   Name: ${security.securityName || 'NOT FOUND'}`);
      console.log(`   Value: ${security.value || 'NOT FOUND'}`);
      console.log(`   Line: ${security.lineNumber}`);
    });
    
    // Check for specific patterns around known ISINs
    console.log('\n=== DETAILED ANALYSIS FOR SPECIFIC ENTRIES ===');
    
    const testISINs = ['XS2993414619', 'XS2530201644', 'XS2588105036'];
    
    testISINs.forEach(testISIN => {
      const security = securities.find(s => s.isin === testISIN);
      if (security) {
        console.log(`\n--- Analysis for ${testISIN} ---`);
        const startLine = Math.max(0, security.lineNumber - 10);
        const endLine = Math.min(lines.length, security.lineNumber + 10);
        
        for (let i = startLine; i <= endLine; i++) {
          const marker = i === security.lineNumber ? '>>> ' : '    ';
          console.log(`${marker}${i}: ${lines[i].trim()}`);
        }
      }
    });
    
    // Check if we can find the specific security names we expect
    console.log('\n=== SEARCHING FOR EXPECTED SECURITY NAMES ===');
    
    const expectedNames = [
      'CANADIAN IMPERIAL BANK OF COMMERCE',
      'HARP ISSUER',
      'GOLDMAN SACHS',
      'NATIXIS',
      'EXIGENT ENHANCED INCOME FUND'
    ];
    
    expectedNames.forEach(name => {
      const found = lines.find(line => line.includes(name));
      if (found) {
        console.log(`Found "${name}": ${found.trim()}`);
      } else {
        console.log(`NOT FOUND: "${name}"`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

detailedStructureAnalysis();