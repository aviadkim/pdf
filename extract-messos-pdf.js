// 🧪 Extract Messos PDF from pdf-main folder
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

console.log('📄 MESSOS PDF EXTRACTION TEST');
console.log('==============================');

async function extractMessosPDF() {
    try {
        // Check if Messos PDF exists
        const messosPath = path.join(__dirname, '2. Messos - 30.04.2025.pdf');
        
        if (!fs.existsSync(messosPath)) {
            console.log('❌ Messos PDF not found at:', messosPath);
            return;
        }

        const fileStats = fs.statSync(messosPath);
        console.log(`📁 Found Messos PDF: ${fileStats.size} bytes`);

        // Test 1: Production Enhanced Swiss Extract
        console.log('\n🏦 Test 1: Production Enhanced Swiss Extract');
        console.log('=============================================');
        
        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(messosPath));

        try {
            const startTime = Date.now();
            const response = await axios.post(
                'https://pdf-five-nu.vercel.app/api/enhanced-swiss-extract',
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                    },
                    timeout: 60000, // 60 second timeout
                }
            );

            const processingTime = Date.now() - startTime;
            
            if (response.data.success) {
                const holdings = response.data.data.individualHoldings || [];
                
                console.log('✅ EXTRACTION SUCCESSFUL!');
                console.log(`📊 Holdings Extracted: ${holdings.length}`);
                console.log(`⏱️  Processing Time: ${processingTime}ms`);
                console.log(`🎯 Expected Holdings: 42`);
                console.log(`📈 Accuracy: ${holdings.length >= 40 ? '✅ EXCELLENT' : '⚠️ NEEDS IMPROVEMENT'}`);
                
                if (response.data.metadata) {
                    console.log(`🔧 Method: ${response.data.metadata.method}`);
                    console.log(`📋 Strategy: ${response.data.metadata.strategy}`);
                    
                    if (response.data.metadata.aiMonitoring) {
                        console.log('\n🧠 AI MONITORING RESULTS:');
                        console.log(`📊 Quality Score: ${response.data.metadata.aiMonitoring.qualityScore}/100`);
                        console.log(`📈 Completeness: ${response.data.metadata.aiMonitoring.completeness}%`);
                        console.log(`🔍 Holdings Count: ${response.data.metadata.aiMonitoring.holdingsCount}`);
                        console.log(`🆔 Request ID: ${response.data.metadata.aiMonitoring.requestId}`);
                    }
                }

                // Display first 10 holdings
                console.log('\n📋 FIRST 10 HOLDINGS EXTRACTED:');
                console.log('================================');
                holdings.slice(0, 10).forEach((holding, index) => {
                    console.log(`${index + 1}. ${holding.security || 'N/A'}`);
                    console.log(`   Value: ${holding.currentValue || 'N/A'} ${holding.currency || 'CHF'}`);
                    console.log(`   ISIN: ${holding.isin || 'N/A'}`);
                    console.log('');
                });

                if (holdings.length > 10) {
                    console.log(`... and ${holdings.length - 10} more holdings`);
                }

                // Calculate total value
                const totalValue = holdings.reduce((sum, h) => {
                    const value = parseFloat(h.currentValue) || 0;
                    return sum + value;
                }, 0);

                console.log('\n💰 PORTFOLIO SUMMARY:');
                console.log('======================');
                console.log(`Total Holdings: ${holdings.length}`);
                console.log(`Total Value: ${totalValue.toLocaleString()} CHF`);
                console.log(`Average Value per Holding: ${Math.round(totalValue / holdings.length).toLocaleString()} CHF`);

                // Save results to file
                const resultsFile = `messos-extraction-results-${Date.now()}.json`;
                fs.writeFileSync(resultsFile, JSON.stringify({
                    timestamp: new Date().toISOString(),
                    filename: '2. Messos - 30.04.2025.pdf',
                    processingTime: processingTime,
                    holdingsCount: holdings.length,
                    totalValue: totalValue,
                    extractedData: response.data,
                    success: true
                }, null, 2));

                console.log(`\n💾 Results saved to: ${resultsFile}`);

            } else {
                console.log('❌ Extraction failed:', response.data.error);
            }

        } catch (apiError) {
            console.log('❌ API Error:', apiError.message);
            if (apiError.response) {
                console.log('Response status:', apiError.response.status);
                console.log('Response data:', apiError.response.data);
            }
        }

        // Test 2: Regular Upload Endpoint
        console.log('\n📤 Test 2: Regular Upload Endpoint');
        console.log('===================================');
        
        const formData2 = new FormData();
        formData2.append('pdf', fs.createReadStream(messosPath));

        try {
            const startTime2 = Date.now();
            const response2 = await axios.post(
                'https://pdf-five-nu.vercel.app/api/upload',
                formData2,
                {
                    headers: {
                        ...formData2.getHeaders(),
                    },
                    timeout: 60000,
                }
            );

            const processingTime2 = Date.now() - startTime2;
            
            if (response2.data.success) {
                const holdings2 = response2.data.data.individualHoldings || [];
                console.log('✅ Regular upload successful!');
                console.log(`📊 Holdings: ${holdings2.length}`);
                console.log(`⏱️  Time: ${processingTime2}ms`);
            } else {
                console.log('❌ Regular upload failed:', response2.data.error);
            }

        } catch (uploadError) {
            console.log('⚠️  Regular upload endpoint error:', uploadError.message);
        }

        // Test 3: Check AI Dashboard
        console.log('\n🧠 Test 3: AI Dashboard Status');
        console.log('===============================');
        
        try {
            const dashboardResponse = await axios.get(
                'https://pdf-five-nu.vercel.app/api/ai-dashboard?action=insights'
            );
            
            if (dashboardResponse.data.success) {
                const insights = dashboardResponse.data.insights;
                console.log('✅ AI Dashboard active');
                console.log(`📊 Total Processed: ${insights.summary.totalProcessed}`);
                console.log(`📈 Success Rate: ${insights.summary.successRate}%`);
                console.log(`⏱️  Avg Time: ${insights.summary.avgProcessingTime}ms`);
                console.log(`📋 Avg Holdings: ${insights.summary.avgHoldingsExtracted}`);
            }
        } catch (dashboardError) {
            console.log('⚠️  AI Dashboard check failed:', dashboardError.message);
        }

    } catch (error) {
        console.log('❌ General error:', error.message);
    }
}

// Run the extraction
console.log('🚀 Starting Messos PDF extraction...');
extractMessosPDF().then(() => {
    console.log('\n🎉 Extraction test completed!');
}).catch(error => {
    console.log('❌ Test failed:', error.message);
});
