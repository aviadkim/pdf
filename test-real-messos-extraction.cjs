// 🎯 TEST REAL MESSOS EXTRACTION
// Test the actual extraction of data from the Messos PDF

const fs = require('fs');
const path = require('path');

async function testRealMessosExtraction() {
    console.log('🎯 TESTING REAL MESSOS EXTRACTION');
    console.log('=================================');
    
    try {
        // Load the actual Messos PDF
        const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
        
        if (!fs.existsSync(pdfPath)) {
            console.log('❌ Messos PDF not found at:', pdfPath);
            return;
        }
        
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        console.log('📄 PDF Loaded:');
        console.log(`   File: ${path.basename(pdfPath)}`);
        console.log(`   Size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Base64 length: ${pdfBase64.length} characters`);
        
        // First, let's test locally with a simple text extraction
        console.log('\n📋 Step 1: Basic PDF Analysis');
        console.log('=============================');
        
        try {
            // Try to extract some basic info
            const pdfHeader = pdfBuffer.toString('ascii', 0, 100);
            console.log('📄 PDF Header:', pdfHeader.substring(0, 50));
            
            // Check for common strings
            const pdfText = pdfBuffer.toString('ascii');
            const hasMessos = pdfText.includes('MESSOS') || pdfText.includes('Messos');
            const hasISIN = pdfText.match(/[A-Z]{2}[A-Z0-9]{10}/);
            const hasUSD = pdfText.includes('USD');
            
            console.log(`📊 Contains 'MESSOS': ${hasMessos ? 'YES' : 'NO'}`);
            console.log(`📊 Contains ISIN codes: ${hasISIN ? 'YES' : 'NO'}`);
            console.log(`📊 Contains USD: ${hasUSD ? 'YES' : 'NO'}`);
            
        } catch (error) {
            console.log('⚠️ Basic analysis failed:', error.message);
        }
        
        // Test the production endpoint
        console.log('\n🚀 Step 2: Production Endpoint Test');
        console.log('===================================');
        
        const startTime = Date.now();
        
        const response = await fetch('https://pdf-five-nu.vercel.app/api/real-messos-extractor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pdfBase64: pdfBase64,
                filename: '2. Messos  - 31.03.2025.pdf'
            })
        });
        
        const processingTime = Date.now() - startTime;
        
        console.log(`⏱️  Processing time: ${processingTime}ms`);
        console.log(`📊 Response status: ${response.status}`);
        
        if (response.ok) {
            const result = await response.json();
            
            console.log('\n✅ REAL EXTRACTION RESULTS:');
            console.log('============================');
            console.log(`📊 Holdings found: ${result.data?.holdings?.length || 0}`);
            console.log(`💰 Total value: ${result.data?.portfolioInfo?.totalValue?.toLocaleString() || 'N/A'}`);
            console.log(`🔧 Extraction method: ${result.metadata?.extractionMethod || 'N/A'}`);
            console.log(`⏱️  Processing time: ${result.metadata?.processingTime || 'N/A'}`);
            console.log(`📋 Processing log: ${result.metadata?.processingLog?.length || 0} steps`);
            
            // Show processing log
            if (result.metadata?.processingLog) {
                console.log('\n📋 Processing Log:');
                result.metadata.processingLog.forEach((step, index) => {
                    console.log(`   ${index + 1}. ${step}`);
                });
            }
            
            // Show sample holdings
            if (result.data?.holdings && result.data.holdings.length > 0) {
                console.log('\n📋 Sample Holdings (first 10):');
                console.log('==============================');
                
                result.data.holdings.slice(0, 10).forEach((holding, index) => {
                    console.log(`${index + 1}. ${holding.securityName || 'Unknown'}`);
                    console.log(`   ISIN: ${holding.isin || 'N/A'}`);
                    console.log(`   Value: ${holding.currentValue?.toLocaleString() || 'N/A'} ${holding.currency || 'N/A'}`);
                    console.log(`   Source: ${holding.source || 'N/A'}`);
                    console.log('');
                });
                
                // Check for real vs mock data
                const realDataIndicators = result.data.holdings.some(h => 
                    h.source === 'Azure' || 
                    h.source === 'Claude Vision' || 
                    h.extractedFrom === 'Real PDF'
                );
                
                console.log(`🎯 Real data detected: ${realDataIndicators ? 'YES' : 'NO'}`);
                
                if (!realDataIndicators) {
                    console.log('⚠️  Still getting mock/demo data instead of real extraction');
                }
            }
            
            // Save results for analysis
            const resultsPath = path.join(__dirname, 'real-messos-extraction-results.json');
            fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
            console.log(`💾 Results saved to: ${resultsPath}`);
            
            // Test CSV download
            console.log('\n📥 Step 3: CSV Download Test');
            console.log('============================');
            
            if (result.csvData) {
                const csvPath = path.join(__dirname, 'real-messos-extraction.csv');
                fs.writeFileSync(csvPath, result.csvData);
                console.log(`💾 CSV saved to: ${csvPath}`);
                console.log(`📊 CSV size: ${result.csvData.length} characters`);
                console.log(`📝 CSV lines: ${result.csvData.split('\\n').length}`);
            }
            
        } else {
            const errorText = await response.text();
            console.log('❌ EXTRACTION FAILED:');
            console.log('=====================');
            console.log(errorText);
        }
        
        // Compare with existing results
        console.log('\n📊 Step 4: Comparison Analysis');
        console.log('==============================');
        
        try {
            const existingPath = path.join(__dirname, 'messos-march-extraction-results.json');
            if (fs.existsSync(existingPath)) {
                const existingData = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
                console.log(`📋 Existing results: ${existingData.individualHoldings?.length || 0} holdings`);
                console.log(`💰 Existing total: ${existingData.portfolioTotal?.value?.toLocaleString() || 'N/A'}`);
                
                if (response.ok) {
                    const result = await response.json();
                    const newCount = result.data?.holdings?.length || 0;
                    const existingCount = existingData.individualHoldings?.length || 0;
                    
                    console.log(`📊 New extraction: ${newCount} holdings`);
                    console.log(`📊 Difference: ${newCount - existingCount} holdings`);
                    console.log(`✅ Improvement: ${newCount >= existingCount ? 'YES' : 'NO'}`);
                }
            }
        } catch (error) {
            console.log('⚠️ Comparison failed:', error.message);
        }
        
        // Final summary
        console.log('\n🎯 FINAL ANALYSIS');
        console.log('=================');
        console.log(`✅ PDF loaded and processed: ${response.ok ? 'YES' : 'NO'}`);
        console.log(`📊 Real data extracted: ${response.ok ? 'NEEDS VERIFICATION' : 'NO'}`);
        console.log(`⏱️  Processing time: ${processingTime}ms`);
        console.log(`📋 Next steps: ${response.ok ? 'Verify extraction quality' : 'Debug extraction issues'}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Add fetch polyfill for Node.js
if (!global.fetch) {
    global.fetch = require('node-fetch');
}

// Run the test
testRealMessosExtraction().catch(console.error);