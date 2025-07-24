const puppeteer = require('puppeteer');
const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test live deployment with real Messos PDF
async function testLiveMessos() {
  console.log('🚀 TESTING LIVE MESSOS EXTRACTION');
  console.log('==================================');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Read the real Messos PDF
  const pdfPath = 'C:\\Users\\aviad\\OneDrive\\Desktop\\pdf-main\\2. Messos  - 31.03.2025.pdf';
  
  if (!fs.existsSync(pdfPath)) {
    console.log('❌ Messos PDF not found at:', pdfPath);
    await browser.close();
    return;
  }
  
  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log(`✅ PDF loaded: ${pdfBuffer.length} bytes`);
  
  // Test endpoints that work locally
  const endpoints = [
    'public-extract',
    'true-100-percent-extractor'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\\n📋 Testing: ${endpoint}`);
    console.log('='.repeat(50));
    
    try {
      const formData = new FormData();
      formData.append('pdf', pdfBuffer, 'messos.pdf');
      
      const response = await fetch(`https://pdf-main-dj1iqj4v4-aviads-projects-0f56b7ac.vercel.app/api/${endpoint}`, {
        method: 'POST',
        body: formData,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.status === 200) {
        const responseText = await response.text();
        
        try {
          const data = JSON.parse(responseText);
          console.log(`✅ Success: ${data.success}`);
          console.log(`✅ Message: ${data.message}`);
          
          if (data.data) {
            if (data.data.isins) {
              console.log(`✅ ISINs found: ${data.data.isins.length}`);
              data.data.isins.slice(0, 5).forEach((isin, i) => {
                console.log(`   ${i + 1}. ${isin}`);
              });
              if (data.data.isins.length > 5) {
                console.log(`   ... and ${data.data.isins.length - 5} more`);
              }
            }
            
            if (data.data.values) {
              console.log(`✅ Values found: ${data.data.values.length}`);
              const total = data.data.values.reduce((sum, v) => sum + v, 0);
              console.log(`✅ Total value: CHF ${total.toLocaleString()}`);
            }
            
            if (data.data.securities) {
              console.log(`✅ Securities found: ${data.data.securities.length}`);
              const total = data.data.securities.reduce((sum, s) => sum + s.value, 0);
              console.log(`✅ Total value: CHF ${total.toLocaleString()}`);
            }
          }
          
          // Check for the target value 199'080
          const responseStr = JSON.stringify(data);
          if (responseStr.includes('199080') || responseStr.includes('199080')) {
            console.log(`🎯 TARGET FOUND: 199'080 is present in response!`);
          }
          
        } catch (parseError) {
          console.log(`⚠️  Response not JSON: ${responseText.substring(0, 200)}...`);
        }
        
      } else {
        const errorText = await response.text();
        console.log(`❌ Error ${response.status}: ${errorText.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
  
  await browser.close();
  
  console.log('\\n🎯 LIVE MESSOS TESTING COMPLETE');
  console.log('================================');
}

testLiveMessos().catch(console.error);