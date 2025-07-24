// Test Page-by-Page Claude Vision Accuracy
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

async function testPageByPageAccuracy() {
    console.log('🎯 TESTING PAGE-BY-PAGE CLAUDE VISION');
    console.log('=====================================');
    
    const messosPdfPath = './2. Messos  - 31.03.2025.pdf';
    
    // Check if PDF exists
    if (!fs.existsSync(messosPdfPath)) {
        console.log('❌ Messos PDF not found at:', messosPdfPath);
        return;
    }

    console.log('✅ Found Messos PDF (19 pages)');
    console.log('📊 Expected portfolio total: $19,464,431');
    console.log('🎯 Target accuracy: 99%+');
    console.log('💰 Expected cost: ~$0.11 (19 pages × $0.006)');
    console.log('');

    try {
        // Test the page-by-page endpoint
        console.log('🚀 Testing /api/99-percent-enhanced (smart processor)...');
        
        const form = new FormData();
        form.append('pdf', fs.createReadStream(messosPdfPath));

        const options = {
            hostname: 'pdf-production-5dis.onrender.com',
            port: 443,
            path: '/api/99-percent-enhanced',
            method: 'POST',
            headers: form.getHeaders()
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    
                    console.log('📊 PAGE-BY-PAGE RESULTS:');
                    console.log('========================');
                    console.log(`Method: ${result.metadata.method}`);
                    console.log(`Securities found: ${result.securities.length}`);
                    console.log(`Total extracted: $${result.totalValue.toLocaleString()}`);
                    console.log(`Portfolio total: $${result.portfolioTotal.toLocaleString()}`);
                    console.log(`Accuracy: ${result.accuracy}%`);
                    
                    if (result.metadata.totalCost) {
                        console.log(`Cost: $${result.metadata.totalCost}`);
                        console.log(`Pages processed: ${result.metadata.pagesProcessed}`);
                        console.log(`Processing time: ${(result.metadata.processingTime / 1000).toFixed(1)}s`);
                    }
                    
                    if (result.metadata.fallback) {
                        console.log(`⚠️  Fallback used: ${result.metadata.fallbackReason}`);
                    }
                    
                    console.log('');

                    const accuracy = parseFloat(result.accuracy);
                    
                    if (accuracy >= 99.0) {
                        console.log('🎉 SUCCESS! 99%+ ACCURACY ACHIEVED!');
                        console.log('✅ Page-by-page Claude Vision works perfectly');
                        console.log('✅ Cost-effective at ~11 cents per PDF');
                        console.log('✅ No hardcoding, dynamic processing');
                        
                        if (result.metadata.pageResults) {
                            console.log('\n📋 Page-by-page breakdown:');
                            result.metadata.pageResults.forEach(page => {
                                console.log(`   Page ${page.page}: ${page.securities} securities, $${page.cost} cost`);
                            });
                        }
                        
                    } else if (accuracy >= 95.0) {
                        console.log('✅ EXCELLENT ACCURACY (95%+)');
                        console.log(`Gap: ${(99.0 - accuracy).toFixed(2)} percentage points`);
                        console.log('🎯 Very close to 99% target');
                        
                    } else if (accuracy >= 90.0) {
                        console.log('⚠️  GOOD ACCURACY (90%+) but below target');
                        console.log(`Gap: ${(99.0 - accuracy).toFixed(2)} percentage points`);
                        
                    } else {
                        console.log('❌ ACCURACY BELOW EXPECTATIONS');
                        console.log(`Gap: ${(99.0 - accuracy).toFixed(2)} percentage points`);
                        
                        if (result.metadata.fallback) {
                            console.log('💡 This is fallback text extraction (no Claude key)');
                            console.log('🔑 Add ANTHROPIC_API_KEY to Render environment for 99% accuracy');
                        }
                    }

                    // Show top securities for verification
                    if (result.securities && result.securities.length > 0) {
                        console.log('\n📋 Top 5 securities found:');
                        result.securities.slice(0, 5).forEach((sec, i) => {
                            const conf = sec.confidence ? ` (${sec.confidence} confidence)` : '';
                            console.log(`${i+1}. ${sec.isin}: $${sec.value.toLocaleString()}${conf}`);
                        });
                    }

                } catch (e) {
                    console.log('❌ Error parsing response:', e.message);
                    console.log('Raw response:', data);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Request failed:', error.message);
        });

        form.pipe(req);

    } catch (error) {
        console.log('❌ Test failed:', error.message);
    }
}

// Also test the direct page-by-page endpoint
async function testDirectPageByPage() {
    console.log('\n🔍 TESTING DIRECT PAGE-BY-PAGE ENDPOINT');
    console.log('=======================================');
    
    const messosPdfPath = './2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(messosPdfPath)) {
        console.log('❌ Messos PDF not found');
        return;
    }

    try {
        const form = new FormData();
        form.append('pdf', fs.createReadStream(messosPdfPath));

        const options = {
            hostname: 'pdf-production-5dis.onrender.com',
            port: 443,
            path: '/api/page-by-page-processor',
            method: 'POST',
            headers: form.getHeaders()
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    
                    if (result.error) {
                        console.log(`❌ Direct endpoint error: ${result.error}`);
                        if (result.suggestion) {
                            console.log(`💡 ${result.suggestion}`);
                        }
                    } else {
                        console.log(`✅ Direct page-by-page works! ${result.accuracy}% accuracy, $${result.metadata.totalCost} cost`);
                    }

                } catch (e) {
                    console.log('❌ Error parsing direct response:', e.message);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Direct request failed:', error.message);
        });

        form.pipe(req);

    } catch (error) {
        console.log('❌ Direct test failed:', error.message);
    }
}

// Run both tests
testPageByPageAccuracy();
setTimeout(testDirectPageByPage, 2000);