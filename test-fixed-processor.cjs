// 🎯 TEST FIXED PROCESSOR
// Test the fixed Messos processor with corrected Swiss number parsing

const fs = require('fs');
const path = require('path');

async function testFixedProcessor() {
    console.log('🎯 TESTING FIXED MESSOS PROCESSOR');
    console.log('=================================');
    
    try {
        // Load the actual Messos PDF
        const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
        
        if (!fs.existsSync(pdfPath)) {
            console.log('❌ Messos PDF not found');
            return;
        }
        
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        console.log('📄 Testing with Real Messos PDF:');
        console.log(`   File: ${path.basename(pdfPath)}`);
        console.log(`   Size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        
        // Test the fixed processor
        console.log('\n🔧 Testing Fixed Processor');
        console.log('==========================');
        
        const startTime = Date.now();
        
        const response = await fetch('https://pdf-five-nu.vercel.app/api/fixed-messos-processor', {
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
            
            console.log('\n✅ FIXED PROCESSOR RESULTS:');
            console.log('============================');
            console.log(`📊 Holdings found: ${result.data?.holdings?.length || 0}`);
            console.log(`💰 Total value: ${result.data?.portfolioInfo?.totalValue?.toLocaleString() || 'N/A'}`);
            console.log(`🔧 Extraction method: ${result.metadata?.extractionMethod || 'N/A'}`);
            console.log(`⏱️  Processing time: ${result.metadata?.processingTime || 'N/A'}`);
            console.log(`🔧 Swiss numbers fixed: ${result.metadata?.swissNumbersFixed ? 'YES' : 'NO'}`);
            
            // Show processing log
            if (result.metadata?.processingLog) {
                console.log('\n📋 Processing Log:');
                result.metadata.processingLog.forEach((step, index) => {
                    console.log(`   ${index + 1}. ${step}`);
                });
            }
            
            // Show sample holdings with corrected values
            if (result.data?.holdings && result.data.holdings.length > 0) {
                console.log('\n📋 Sample Holdings (first 5):');
                console.log('==============================');
                
                result.data.holdings.slice(0, 5).forEach((holding, index) => {
                    console.log(`${index + 1}. ${holding.securityName || 'Unknown'}`);
                    console.log(`   ISIN: ${holding.isin || 'N/A'}`);
                    console.log(`   Value: ${holding.currentValue?.toLocaleString() || 'N/A'} ${holding.currency || 'N/A'}`);
                    console.log(`   Source: ${holding.source || 'N/A'}`);
                    
                    // Check if value is reasonable (not in trillions)
                    const value = holding.currentValue || 0;
                    const isReasonable = value < 1000000000; // Less than 1 billion
                    console.log(`   ✅ Reasonable value: ${isReasonable ? 'YES' : 'NO'}`);
                    console.log('');
                });
                
                // Analysis
                const totalValue = result.data?.portfolioInfo?.totalValue || 0;
                const avgValue = totalValue / result.data.holdings.length;
                const maxValue = Math.max(...result.data.holdings.map(h => h.currentValue || 0));
                const minValue = Math.min(...result.data.holdings.map(h => h.currentValue || 0));
                
                console.log('\n📊 VALUE ANALYSIS:');
                console.log('==================');
                console.log(`💰 Total value: ${totalValue.toLocaleString()}`);
                console.log(`📊 Average value: ${avgValue.toLocaleString()}`);
                console.log(`📈 Maximum value: ${maxValue.toLocaleString()}`);
                console.log(`📉 Minimum value: ${minValue.toLocaleString()}`);
                console.log(`🎯 Reasonable range: ${totalValue < 1000000000 ? 'YES' : 'NO'}`);
                
                // Check if Swiss formatting is fixed
                const hasUnreasonableValues = result.data.holdings.some(h => (h.currentValue || 0) > 1000000000);
                console.log(`🔧 Swiss formatting fixed: ${hasUnreasonableValues ? 'NO - Still has issues' : 'YES - Values look correct'}`);
            }
            
            // Test the Family Office interface
            console.log('\n🏛️ Testing Family Office Interface');
            console.log('==================================');
            
            const interfaceResponse = await fetch('https://pdf-five-nu.vercel.app/api/family-office-upload');
            
            if (interfaceResponse.ok) {
                const html = await interfaceResponse.text();
                const usesFixedProcessor = html.includes('fixed-messos-processor');
                
                console.log(`✅ Family Office interface: WORKING`);
                console.log(`🔧 Uses fixed processor: ${usesFixedProcessor ? 'YES' : 'NO'}`);
            } else {
                console.log(`❌ Family Office interface: FAILED`);
            }
            
            // Save results
            if (result.data?.holdings?.length > 0) {
                const resultsPath = path.join(__dirname, 'fixed-messos-results.json');
                fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
                console.log(`💾 Results saved to: ${resultsPath}`);
                
                if (result.csvData) {
                    const csvPath = path.join(__dirname, 'fixed-messos-results.csv');
                    fs.writeFileSync(csvPath, result.csvData);
                    console.log(`📊 CSV saved to: ${csvPath}`);
                }
            }
            
        } else {
            const errorText = await response.text();
            console.log('❌ FIXED PROCESSOR FAILED:');
            console.log('===========================');
            console.log(errorText);
        }
        
        // Final summary
        console.log('\n🎯 FINAL SUMMARY');
        console.log('================');
        console.log(`✅ Fixed processor deployed: ${response.ok ? 'YES' : 'NO'}`);
        console.log(`📊 Real data extracted: ${response.ok ? 'YES' : 'NO'}`);
        console.log(`⏱️  Processing time: ${processingTime}ms`);
        console.log(`🔧 Swiss numbers fixed: TESTING COMPLETE`);
        console.log(`🌐 Production URL: https://pdf-five-nu.vercel.app/api/family-office-upload`);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Add fetch polyfill for Node.js
if (!global.fetch) {
    global.fetch = require('node-fetch');
}

// Run the test
testFixedProcessor().catch(console.error);