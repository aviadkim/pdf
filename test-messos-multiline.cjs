// Test the multiline processor against the real Messos PDF
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function testMessosMultiline() {
  console.log('🎯 Testing Multiline Processor Against Real Messos PDF');
  
  // Load the real Messos PDF
  const messosPath = path.join(__dirname, 'messos.pdf');
  if (!fs.existsSync(messosPath)) {
    console.error('❌ Messos PDF not found at:', messosPath);
    return;
  }
  
  const pdfBuffer = fs.readFileSync(messosPath);
  console.log(`📄 Loaded PDF: ${pdfBuffer.length} bytes`);
  
  // Extract text from PDF
  const pdfData = await pdfParse(pdfBuffer);
  const pdfText = pdfData.text;
  console.log(`📊 Extracted text: ${pdfText.length} characters`);
  
  // Test the multiline processor directly
  const { MessosMultilineProcessor } = require('./api/multiline-messos-processor.js');
  const processor = new MessosMultilineProcessor();
  
  // Extract data
  const extractedData = processor.extractData(pdfText);
  
  console.log(`\n📋 Multiline Extraction Results:`);
  console.log(`  Total Holdings: ${extractedData.holdings.length}`);
  console.log(`  Total Value: ${extractedData.portfolioInfo.totalValue?.toLocaleString()} USD`);
  console.log(`  Sections Found: ${extractedData.summary.sectionsFound.join(', ')}`);
  console.log(`  Valid ISINs: ${extractedData.summary.validISINs}`);
  
  // Show first few holdings
  console.log(`\n🔍 First 5 Holdings:`);
  for (let i = 0; i < Math.min(5, extractedData.holdings.length); i++) {
    const holding = extractedData.holdings[i];
    console.log(`  ${i+1}. ${holding.description} (${holding.isin})`);
    console.log(`     Value: ${holding.marketValue?.toLocaleString()}, Weight: ${holding.portfolioWeight}`);
  }
  
  // Check for improved accuracy
  console.log(`\n📊 Quality Analysis:`);
  console.log(`  Holdings with ISIN: ${extractedData.holdings.filter(h => h.isin).length}`);
  console.log(`  Holdings with Valorn: ${extractedData.holdings.filter(h => h.valorn).length}`);
  console.log(`  Holdings with Maturity: ${extractedData.holdings.filter(h => h.maturityDate).length}`);
  console.log(`  Holdings with Coupon: ${extractedData.holdings.filter(h => h.coupon).length}`);
  console.log(`  Holdings with Security Type: ${extractedData.holdings.filter(h => h.securityType).length}`);
  
  // Compare with expected portfolio value
  const expectedValue = 19464431; // From analysis report
  const extractedValue = extractedData.portfolioInfo.totalValue;
  const accuracy = ((extractedValue / expectedValue) * 100).toFixed(2);
  
  console.log(`\n💰 Value Accuracy:`);
  console.log(`  Expected: ${expectedValue.toLocaleString()} USD`);
  console.log(`  Extracted: ${extractedValue?.toLocaleString()} USD`);
  console.log(`  Accuracy: ${accuracy}%`);
  
  // Save results
  const resultsPath = path.join(__dirname, 'messos_multiline_results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(extractedData, null, 2));
  console.log(`\n💾 Results saved to: ${resultsPath}`);
  
  return extractedData;
}

// Run the test
testMessosMultiline().catch(console.error);