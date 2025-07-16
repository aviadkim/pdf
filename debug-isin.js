// Debug ISIN extraction
import fs from 'fs';
import pdf from 'pdf-parse';

async function debugISIN() {
  console.log('🔍 Debugging ISIN extraction...');
  
  // Read the PDF
  const pdfBuffer = fs.readFileSync('2. Messos  - 31.03.2025.pdf');
  const pdfData = await pdf(pdfBuffer);
  const text = pdfData.text;
  
  console.log(`📄 Text length: ${text.length}`);
  
  // Look for ISIN patterns
  const isinPattern = /ISIN:\s*([A-Z]{2}[A-Z0-9]{10})/g;
  const matches = [...text.matchAll(isinPattern)];
  
  console.log(`🔍 Found ${matches.length} ISIN matches:`);
  
  matches.forEach((match, i) => {
    console.log(`   ${i + 1}. ${match[1]} at position ${match.index}`);
  });
  
  // Check lines around ISINs
  const lines = text.split('\n');
  console.log(`📄 Total lines: ${lines.length}`);
  
  console.log('\n🔍 Looking for ISINs in lines...');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('ISIN:')) {
      console.log(`\n📍 Line ${i + 1}: ${line.trim()}`);
      
      // Show next 10 lines
      for (let j = 1; j <= 10; j++) {
        if (i + j < lines.length) {
          const nextLine = lines[i + j];
          console.log(`   +${j}: ${nextLine.trim()}`);
          
          // Check for Swiss values
          const swissMatch = nextLine.match(/\d{1,3}(?:'\d{3})+/g);
          if (swissMatch) {
            console.log(`      🎯 Swiss value found: ${swissMatch.join(', ')}`);
          }
        }
      }
    }
  }
}

debugISIN().catch(console.error);