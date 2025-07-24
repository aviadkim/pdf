const fs = require('fs');
const pdf = require('pdf-parse');

async function analyzeSecurityStructure() {
  try {
    const dataBuffer = fs.readFileSync('/mnt/c/Users/aviad/OneDrive/Desktop/2. Messos  - 31.03.2025.pdf');
    const data = await pdf(dataBuffer);
    
    const lines = data.text.split('\n');
    
    console.log('=== SECURITIES STRUCTURE ANALYSIS ===');
    console.log(`Total lines: ${lines.length}`);
    
    // Find lines with ISINs and their context
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('ISIN:') && line.includes('XS')) {
        console.log('\n=== SECURITY ENTRY ===');
        console.log(`Line ${i}: ${line.trim()}`);
        
        // Check previous lines for security name
        for (let j = Math.max(0, i - 5); j < i; j++) {
          const prevLine = lines[j].trim();
          if (prevLine && !prevLine.includes('ISIN') && !prevLine.includes('Valorn') && !prevLine.includes('//')) {
            console.log(`  Prev line ${j}: ${prevLine}`);
          }
        }
        
        // Check next lines for values
        for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
          const nextLine = lines[j].trim();
          if (nextLine && (nextLine.includes('USD') || nextLine.match(/[0-9]+[\s']*[0-9]+/))) {
            console.log(`  Next line ${j}: ${nextLine}`);
          }
        }
        
        count++;
        if (count >= 5) break; // Only analyze first 5 securities
      }
    }
    
    console.log('\n=== LOOKING FOR SPECIFIC PATTERNS ===');
    
    // Look for lines that might contain security names
    const potentialSecurityNames = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 10 && 
             trimmed.length < 100 && 
             !trimmed.includes('ISIN') && 
             !trimmed.includes('Valorn') && 
             !trimmed.includes('//') &&
             !trimmed.includes('USD') &&
             !trimmed.includes('CHF') &&
             !trimmed.match(/^[0-9\s'.,]+$/);
    });
    
    console.log('\n=== POTENTIAL SECURITY NAMES ===');
    potentialSecurityNames.slice(0, 10).forEach((name, index) => {
      console.log(`${index + 1}: ${name.trim()}`);
    });
    
    console.log('\n=== VALUE PATTERNS ===');
    const valuePatterns = lines.filter(line => {
      return line.match(/[0-9]+[\s']*[0-9]{3}/) && line.includes('USD');
    });
    
    valuePatterns.slice(0, 10).forEach((pattern, index) => {
      console.log(`${index + 1}: ${pattern.trim()}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

analyzeSecurityStructure();