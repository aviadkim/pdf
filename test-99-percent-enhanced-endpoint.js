/**
 * Test 99% Enhanced Endpoint (Smart Claude Vision + Text Fallback)
 * This should work even without GraphicsMagick
 */

const https = require('https');
const fs = require('fs');

async function test99PercentEnhanced() {
    console.log('🎯 TESTING 99% ENHANCED ENDPOINT (SMART FALLBACK)');
    console.log('='.repeat(70));
    console.log('📡 URL: https://pdf-production-5dis.onrender.com/api/99-percent-enhanced');
    console.log('📄 PDF: ./2. Messos  - 31.03.2025.pdf');
    console.log('🎯 Expected: CHF 19,464,431');
    console.log('💡 This endpoint uses Claude Vision if available, or enhanced text extraction');
    console.log('='.repeat(70));

    if (!fs.existsSync('./2. Messos  - 31.03.2025.pdf')) {
        console.log('❌ Messos PDF not found');
        return;
    }

    try {
        console.log('📤 Uploading PDF...');
        
        const FormData = require('form-data');
        const form = new FormData();
        form.append('pdf', fs.createReadStream('./2. Messos  - 31.03.2025.pdf'));

        const startTime = Date.now();
        
        const result = await new Promise((resolve, reject) => {
            const req = https.request('https://pdf-production-5dis.onrender.com/api/99-percent-enhanced', {
                method: 'POST',
                headers: form.getHeaders(),
                timeout: 120000 // 2 minutes
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, data: JSON.parse(data) });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: data, raw: true });
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Upload timeout'));
            });

            form.pipe(req);
        });

        const processingTime = Date.now() - startTime;

        console.log('📊 PROCESSING COMPLETE!');
        console.log(`⏱️  Processing time: ${(processingTime / 1000).toFixed(1)}s`);
        console.log(`📋 HTTP Status: ${result.status}`);

        if (result.status === 200 && result.data.success) {
            const accuracy = parseFloat(result.data.accuracy);
            const totalValue = result.data.totalValue;
            const securities = result.data.securities || [];
            const method = result.data.metadata?.method || 'unknown';
            const fallback = result.data.metadata?.fallback;
            const cost = result.data.metadata?.totalCost || '0.00';

            console.log('\n🎉 SUCCESS! Results:');
            console.log('='.repeat(50));
            console.log(`📊 ACCURACY: ${accuracy}%`);
            console.log(`💵 TOTAL VALUE: CHF ${totalValue.toLocaleString()}`);
            console.log(`🎯 EXPECTED: CHF 19,464,431`);
            console.log(`📈 DIFFERENCE: CHF ${Math.abs(totalValue - 19464431).toLocaleString()}`);
            console.log(`🔢 SECURITIES FOUND: ${securities.length}`);
            console.log(`🔧 METHOD: ${method}`);
            console.log(`🔄 FALLBACK MODE: ${fallback ? 'Yes (Text Only)' : 'No (Claude Vision)'}`);
            console.log(`💰 COST: $${cost}`);
            console.log(`⏱️  PROCESSING TIME: ${(processingTime / 1000).toFixed(1)}s`);

            // Accuracy assessment
            console.log('\n🎯 ACCURACY ASSESSMENT:');
            if (accuracy >= 99) {
                console.log('🏆 MISSION ACCOMPLISHED: 99%+ ACCURACY ACHIEVED!');
            } else if (accuracy >= 95) {
                console.log('🎉 EXCELLENT: 95%+ accuracy achieved!');
            } else if (accuracy >= 90) {
                console.log('✅ GOOD: 90%+ accuracy achieved');
            } else {
                console.log('⚠️  Needs improvement: <90% accuracy');
            }

            // Show top securities
            if (securities.length > 0) {
                console.log('\n💎 TOP 5 SECURITIES:');
                securities
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5)
                    .forEach((security, index) => {
                        console.log(`${index + 1}. ${security.isin} - CHF ${security.value.toLocaleString()}`);
                    });
            }

            // Final verdict
            console.log('\n='.repeat(70));
            console.log('🎯 FINAL VERDICT:');
            
            if (accuracy >= 99) {
                console.log('✅ PERFECT: 99%+ accuracy achieved!');
                console.log('🚀 Ready for production use with Claude Vision API!');
            } else if (accuracy >= 92) {
                console.log(`📊 EXCELLENT: ${accuracy}% accuracy achieved!`);
                console.log('💡 This exceeds the original 92.21% target');
                if (fallback) {
                    console.log('🔄 Using enhanced text extraction (no API costs)');
                } else {
                    console.log('🎯 Using Claude Vision API for maximum accuracy');
                }
            } else {
                console.log(`📊 GOOD: ${accuracy}% accuracy achieved`);
            }
            
            console.log('='.repeat(70));

            // Save results
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `99-percent-enhanced-results-${timestamp}.json`;
            fs.writeFileSync(filename, JSON.stringify(result.data, null, 2));
            console.log(`📁 Results saved to: ${filename}`);

        } else {
            console.log('❌ PROCESSING FAILED');
            console.log(`Status: ${result.status}`);
            if (result.data.error) {
                console.log(`Error: ${result.data.error}`);
                console.log(`Details: ${result.data.details}`);
            }
        }

    } catch (error) {
        console.log(`❌ REQUEST FAILED: ${error.message}`);
    }
}

test99PercentEnhanced().catch(console.error);