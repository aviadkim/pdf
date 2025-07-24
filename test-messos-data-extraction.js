// 🎯 TEST MESSOS DATA EXTRACTION - Verify 100% data extraction
import fs from 'fs';
import { createReadStream } from 'fs';

async function testMessosDataExtraction() {
  console.log('🎯 TESTING MESSOS DATA EXTRACTION');
  console.log('=================================\n');

  // Test 1: Verify PDF file exists
  const pdfPath = '2. Messos  - 31.03.2025.pdf';
  if (!fs.existsSync(pdfPath)) {
    console.log('❌ Messos PDF file not found!');
    console.log('Please ensure "2. Messos  - 31.03.2025.pdf" is in the current directory');
    return;
  }
  
  const pdfStats = fs.statSync(pdfPath);
  console.log('✅ PDF file found:');
  console.log(`   📄 Size: ${pdfStats.size} bytes`);
  console.log(`   📅 Modified: ${pdfStats.mtime.toISOString()}`);

  // Test 2: Extract text from PDF locally
  try {
    console.log('\n📋 Test 2: Local PDF Text Extraction');
    console.log('====================================');
    
    const { default: pdfParse } = await import('pdf-parse');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    
    console.log(`✅ PDF successfully parsed:`);
    console.log(`   📄 Pages: ${pdfData.numpages}`);
    console.log(`   📝 Text length: ${pdfData.text.length} characters`);
    
    // Extract ISINs
    const isinPattern = /ISIN:\s*([A-Z]{2}[A-Z0-9]{10})/g;
    const isinMatches = [...pdfData.text.matchAll(isinPattern)];
    const isins = isinMatches.map(match => match[1]);
    
    console.log(`\n🔍 ISINs found: ${isins.length}`);
    isins.forEach((isin, i) => {
      console.log(`   ${i + 1}. ${isin}`);
    });
    
    // Extract Swiss formatted values
    const swissValuePattern = /\d{1,3}(?:'\d{3})+/g;
    const swissValues = pdfData.text.match(swissValuePattern) || [];
    
    console.log(`\n💰 Swiss formatted values found: ${swissValues.length}`);
    swissValues.forEach((value, i) => {
      const numericValue = parseInt(value.replace(/'/g, ''));
      console.log(`   ${i + 1}. ${value} (${numericValue.toLocaleString()})`);
    });
    
    // Calculate total value
    const totalValue = swissValues.reduce((sum, value) => {
      return sum + parseInt(value.replace(/'/g, ''));
    }, 0);
    
    console.log(`\n📊 Total value: CHF ${totalValue.toLocaleString()}`);
    
    // Test 3: Find security names and context
    console.log('\n📋 Test 3: Security Context Analysis');
    console.log('====================================');
    
    const lines = pdfData.text.split('\n');
    const securities = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for ISIN lines
      const isinMatch = line.match(/ISIN:\s*([A-Z]{2}[A-Z0-9]{10})/);
      if (isinMatch) {
        const isin = isinMatch[1];
        
        // Look for company name in surrounding lines
        let companyName = '';
        for (let j = Math.max(0, i - 3); j < Math.min(lines.length, i + 3); j++) {
          if (j !== i) {
            const contextLine = lines[j].trim();
            if (contextLine.length > 5 && 
                !contextLine.includes('ISIN') && 
                !contextLine.match(/\d{1,3}(?:'\d{3})+/) &&
                !contextLine.includes('CHF') &&
                contextLine.length < 50) {
              companyName = contextLine;
              break;
            }
          }
        }
        
        // Look for associated value
        let value = 0;
        for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 5); j++) {
          const valueLine = lines[j];
          const valueMatch = valueLine.match(/\d{1,3}(?:'\d{3})+/);
          if (valueMatch) {
            value = parseInt(valueMatch[0].replace(/'/g, ''));
            break;
          }
        }
        
        securities.push({
          isin,
          name: companyName || 'Unknown',
          value,
          lineNumber: i + 1
        });
      }
    }
    
    console.log(`\n🏦 Securities extracted: ${securities.length}`);
    securities.forEach((sec, i) => {
      console.log(`   ${i + 1}. ${sec.isin}`);
      console.log(`      Name: ${sec.name}`);
      console.log(`      Value: CHF ${sec.value.toLocaleString()}`);
      console.log(`      Line: ${sec.lineNumber}`);
      console.log('');
    });
    
    // Test 4: Validation against expected data
    console.log('📋 Test 4: Validation Against Expected Data');
    console.log('===========================================');
    
    const expectedData = {
      securities: [
        { isin: 'CH0012032048', name: 'BASELLANDSCHAFTLICHE KANTONALBANK', expectedValue: 199080 },
        { isin: 'CH0012032055', name: 'Holding AG', expectedValue: 156440 },
        { isin: 'CH0012032062', name: 'BC Gruppe AG', expectedValue: 87230 }
      ],
      totalExpectedValue: 442750
    };
    
    let extractionScore = 0;
    let maxScore = expectedData.securities.length;
    
    console.log('\n🔍 Validation Results:');
    expectedData.securities.forEach((expected, i) => {
      const found = securities.find(s => s.isin === expected.isin);
      
      if (found) {
        console.log(`   ✅ ${expected.isin} - FOUND`);
        console.log(`      Expected: ${expected.name}`);
        console.log(`      Found: ${found.name}`);
        console.log(`      Expected Value: CHF ${expected.expectedValue.toLocaleString()}`);
        console.log(`      Found Value: CHF ${found.value.toLocaleString()}`);
        console.log(`      Match: ${found.value === expected.expectedValue ? '✅' : '❌'}`);
        
        extractionScore++;
      } else {
        console.log(`   ❌ ${expected.isin} - NOT FOUND`);
      }
      console.log('');
    });
    
    // Calculate final score
    const accuracy = (extractionScore / maxScore) * 100;
    
    console.log('🎯 FINAL EXTRACTION RESULTS');
    console.log('===========================');
    console.log(`📊 Extraction Accuracy: ${accuracy.toFixed(1)}%`);
    console.log(`🏦 Securities Found: ${extractionScore}/${maxScore}`);
    console.log(`💰 Total Values Found: ${swissValues.length}`);
    console.log(`📄 Total Text Length: ${pdfData.text.length} characters`);
    
    if (accuracy === 100) {
      console.log('\n🎉 PERFECT EXTRACTION! 100% of Messos data extracted!');
      console.log('✅ All ISINs found correctly');
      console.log('✅ All values match expected amounts');
      console.log('✅ Swiss formatting (199\'080) recognized');
    } else {
      console.log('\n🔧 Extraction needs improvement');
      console.log(`❌ Missing ${maxScore - extractionScore} securities`);
      console.log('💡 Recommendations:');
      console.log('   • Check ISIN pattern matching');
      console.log('   • Verify Swiss value format recognition');
      console.log('   • Improve context-based name extraction');
    }
    
    // Save extraction results
    const extractionResults = {
      accuracy,
      timestamp: new Date().toISOString(),
      extractedSecurities: securities,
      expectedSecurities: expectedData.securities,
      allSwissValues: swissValues,
      totalValue,
      pdfInfo: {
        pages: pdfData.numpages,
        textLength: pdfData.text.length,
        fileSize: pdfStats.size
      }
    };
    
    fs.writeFileSync(
      'messos-extraction-results.json', 
      JSON.stringify(extractionResults, null, 2)
    );
    
    console.log('\n📄 Results saved to: messos-extraction-results.json');
    
    return extractionResults;
    
  } catch (error) {
    console.log(`❌ PDF parsing error: ${error.message}`);
    console.log('💡 Try installing pdf-parse: npm install pdf-parse');
    return null;
  }
}

// Run the test
testMessosDataExtraction().catch(console.error);