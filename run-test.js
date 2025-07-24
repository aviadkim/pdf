// Test script to run the complete data extractor
import fs from 'fs';
import fetch from 'node-fetch';

async function runTest() {
  console.log('🧪 Running Complete Data Extractor Test...\n');
  
  try {
    // Read the PDF file
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log('📄 PDF loaded successfully');
    console.log(`📊 PDF size: ${pdfBuffer.length} bytes\n`);
    
    // Call the API
    console.log('🚀 Calling Complete Data Extractor API...\n');
    const response = await fetch('http://localhost:3010/api/complete-data-extractor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: pdfPath
      })
    });
    
    const result = await response.json();
    
    console.log('===========================================');
    console.log('📊 EXTRACTION RESULTS');
    console.log('===========================================\n');
    
    console.log(`✅ Success: ${result.success}`);
    console.log(`📝 Message: ${result.message}`);
    console.log(`🎯 Accuracy: ${result.extractedData.accuracyPercent}%`);
    console.log(`💰 Total Value: $${result.extractedData.totalValue.toLocaleString()}`);
    console.log(`🎯 Target Value: $${result.extractedData.targetValue.toLocaleString()}`);
    console.log(`📊 Securities Count: ${result.extractedData.securities.length}`);
    console.log(`🎯 Target Range: ${result.extractedData.portfolioSummary.target_securities}\n`);
    
    console.log('===========================================');
    console.log('📋 TOP 10 SECURITIES (by value)');
    console.log('===========================================\n');
    
    result.extractedData.securities.slice(0, 10).forEach((sec, i) => {
      console.log(`${i + 1}. ${sec.isin}`);
      console.log(`   Name: ${sec.name}`);
      console.log(`   Value: $${sec.value.toLocaleString()} (${sec.swissOriginal})`);
      console.log(`   Price: ${sec.price || 'N/A'}`);
      console.log(`   Currency: ${sec.currency}`);
      console.log(`   Maturity: ${sec.maturity || 'N/A'}`);
      console.log('');
    });
    
    console.log('===========================================');
    console.log('📁 OUTPUT FILES');
    console.log('===========================================\n');
    
    console.log(`CSV File: ${result.downloadFiles.csv}`);
    console.log(`JSON File: ${result.downloadFiles.json}\n`);
    
    // Read and show CSV preview
    const csvContent = fs.readFileSync(result.downloadFiles.csv, 'utf8');
    const csvLines = csvContent.split('\n').slice(0, 6);
    console.log('📄 CSV Preview (first 5 rows):');
    console.log('-------------------------------------------');
    csvLines.forEach(line => console.log(line));
    console.log('...\n');
    
    // Show JSON structure
    const jsonContent = JSON.parse(fs.readFileSync(result.downloadFiles.json, 'utf8'));
    console.log('📄 JSON Structure:');
    console.log('-------------------------------------------');
    console.log(JSON.stringify(jsonContent.summary, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
runTest();