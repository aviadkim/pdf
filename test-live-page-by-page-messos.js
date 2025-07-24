/**
 * Test Live Page-by-Page Claude Vision with Messos PDF
 * Final test to achieve 99% accuracy
 */

const https = require('https');
const fs = require('fs');

class LivePageByPageTester {
    constructor() {
        this.renderUrl = 'https://pdf-production-5dis.onrender.com';
        this.messosPdf = './2. Messos  - 31.03.2025.pdf';
        this.expectedTotal = 19464431;
        this.expectedSecurities = 40;
    }

    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const req = https.request(url, {
                timeout: 180000, // 3 minutes for Claude Vision processing
                ...options
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve({ status: res.statusCode, data: parsed });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: data, raw: true });
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    }

    async testPageByPageClaudeVision() {
        console.log('🎯 TESTING LIVE PAGE-BY-PAGE CLAUDE VISION');
        console.log('='.repeat(70));
        console.log(`📡 URL: ${this.renderUrl}/api/page-by-page-processor`);
        console.log(`📄 PDF: ${this.messosPdf}`);
        console.log(`🎯 Expected: CHF ${this.expectedTotal.toLocaleString()}`);
        console.log(`🔢 Expected Securities: ${this.expectedSecurities}`);
        console.log('='.repeat(70));

        if (!fs.existsSync(this.messosPdf)) {
            console.log('❌ Messos PDF not found');
            return { success: false, reason: 'PDF not found' };
        }

        try {
            console.log('📤 Uploading PDF and starting Claude Vision processing...');
            console.log('⏱️  This may take 1-3 minutes (19 pages × Claude Vision API)...');
            
            const FormData = require('form-data');
            const form = new FormData();
            form.append('pdf', fs.createReadStream(this.messosPdf));

            const startTime = Date.now();
            
            const result = await new Promise((resolve, reject) => {
                const req = https.request(`${this.renderUrl}/api/page-by-page-processor`, {
                    method: 'POST',
                    headers: form.getHeaders(),
                    timeout: 180000 // 3 minutes
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => {
                        data += chunk;
                        // Show progress
                        if (chunk.toString().includes('Processing page')) {
                            process.stdout.write('.');
                        }
                    });
                    res.on('end', () => {
                        console.log('\n'); // New line after progress dots
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
                    reject(new Error('Upload timeout after 3 minutes'));
                });

                form.pipe(req);
            });

            const processingTime = Date.now() - startTime;

            console.log('📊 PROCESSING COMPLETE!');
            console.log(`⏱️  Processing time: ${(processingTime / 1000).toFixed(1)}s`);
            console.log(`📋 HTTP Status: ${result.status}`);

            if (result.status === 200 && result.data.success) {
                return this.analyzeResults(result.data, processingTime);
            } else {
                console.log('❌ PROCESSING FAILED');
                console.log(`Status: ${result.status}`);
                if (result.data.error) {
                    console.log(`Error: ${result.data.error}`);
                    console.log(`Details: ${result.data.details}`);
                }
                return { success: false, error: result.data.error || 'Unknown error' };
            }

        } catch (error) {
            console.log(`❌ REQUEST FAILED: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    analyzeResults(data, processingTime) {
        console.log('\n🎉 SUCCESS! Analyzing results...');
        console.log('='.repeat(70));

        const accuracy = parseFloat(data.accuracy);
        const totalValue = data.totalValue;
        const securities = data.securities || [];
        const method = data.metadata?.method || 'unknown';
        const cost = data.metadata?.totalCost || data.metadata?.costPerPDF || 'unknown';
        const pagesProcessed = data.metadata?.pagesProcessed || 0;

        // Basic metrics
        console.log(`📊 ACCURACY: ${accuracy}%`);
        console.log(`💵 TOTAL VALUE: CHF ${totalValue.toLocaleString()}`);
        console.log(`🎯 EXPECTED: CHF ${this.expectedTotal.toLocaleString()}`);
        console.log(`📈 DIFFERENCE: CHF ${Math.abs(totalValue - this.expectedTotal).toLocaleString()}`);
        console.log(`🔢 SECURITIES FOUND: ${securities.length}`);
        console.log(`🔧 METHOD: ${method}`);
        console.log(`💰 COST: $${cost}`);
        console.log(`📄 PAGES PROCESSED: ${pagesProcessed}`);
        console.log(`⏱️  PROCESSING TIME: ${(processingTime / 1000).toFixed(1)}s`);

        // Accuracy assessment
        const achieved99Plus = accuracy >= 99;
        const achieved95Plus = accuracy >= 95;
        
        console.log('\n🎯 ACCURACY ASSESSMENT:');
        if (achieved99Plus) {
            console.log('🏆 MISSION ACCOMPLISHED: 99%+ ACCURACY ACHIEVED!');
        } else if (achieved95Plus) {
            console.log('🎉 EXCELLENT: 95%+ accuracy achieved!');
        } else if (accuracy >= 90) {
            console.log('✅ GOOD: 90%+ accuracy achieved');
        } else {
            console.log('⚠️  Needs improvement: <90% accuracy');
        }

        // Top securities analysis
        if (securities.length > 0) {
            console.log('\n💎 TOP 5 SECURITIES FOUND:');
            const topSecurities = securities
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);
            
            topSecurities.forEach((security, index) => {
                console.log(`${index + 1}. ${security.isin} - CHF ${security.value.toLocaleString()}`);
                if (security.name) {
                    console.log(`   Name: ${security.name}`);
                }
            });
        }

        // Performance metrics
        console.log('\n⚡ PERFORMANCE METRICS:');
        console.log(`📊 Securities per second: ${(securities.length / (processingTime / 1000)).toFixed(2)}`);
        console.log(`💰 Cost per security: $${(parseFloat(cost) / securities.length).toFixed(4)}`);
        console.log(`⏱️  Average per page: ${(processingTime / pagesProcessed / 1000).toFixed(1)}s`);

        // Page-by-page analysis
        if (data.metadata?.pageResults) {
            console.log('\n📄 PAGE-BY-PAGE ANALYSIS:');
            const pageResults = data.metadata.pageResults;
            const pagesWithSecurities = pageResults.filter(p => p.securities > 0);
            
            console.log(`   Pages with securities: ${pagesWithSecurities.length}/${pageResults.length}`);
            console.log(`   Total cost breakdown: $${cost} (${pageResults.length} pages)`);
            
            if (pagesWithSecurities.length > 0) {
                console.log(`   Most productive pages:`);
                pagesWithSecurities
                    .sort((a, b) => b.securities - a.securities)
                    .slice(0, 3)
                    .forEach(page => {
                        console.log(`     Page ${page.page}: ${page.securities} securities ($${page.cost})`);
                    });
            }
        }

        console.log('\n='.repeat(70));
        console.log('🎯 FINAL VERDICT:');
        
        if (achieved99Plus) {
            console.log('✅ PERFECT: Ready for production use!');
            console.log(`💡 This system can process financial PDFs with ${accuracy}% accuracy`);
            console.log(`💰 Cost: $${cost} per PDF (~${(parseFloat(cost) * 100).toFixed(0)}¢ per 100 PDFs)`);
        } else {
            console.log(`📊 GOOD RESULT: ${accuracy}% accuracy achieved`);
            console.log('💡 Consider fine-tuning for higher accuracy if needed');
        }
        
        console.log('='.repeat(70));

        // Save detailed results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `messos-claude-vision-results-${timestamp}.json`;
        
        const fullResults = {
            ...data,
            testMetadata: {
                processingTime: processingTime / 1000,
                timestamp: new Date().toISOString(),
                expected: {
                    totalValue: this.expectedTotal,
                    securities: this.expectedSecurities
                },
                achieved99Plus: achieved99Plus,
                testUrl: `${this.renderUrl}/api/page-by-page-processor`
            }
        };
        
        fs.writeFileSync(filename, JSON.stringify(fullResults, null, 2));
        console.log(`📁 Detailed results saved to: ${filename}`);

        return {
            success: true,
            accuracy: accuracy,
            achieved99Plus: achieved99Plus,
            totalValue: totalValue,
            securities: securities.length,
            cost: cost,
            processingTime: processingTime / 1000,
            results: fullResults
        };
    }

    async run() {
        try {
            const result = await this.testPageByPageClaudeVision();
            
            if (result.success && result.achieved99Plus) {
                console.log('\n🎉🎉🎉 MISSION ACCOMPLISHED! 🎉🎉🎉');
                console.log('99%+ accuracy achieved with Claude Vision API!');
                return true;
            } else if (result.success) {
                console.log(`\n✅ Good result: ${result.accuracy}% accuracy achieved`);
                return result.accuracy >= 95;
            } else {
                console.log(`\n❌ Test failed: ${result.error}`);
                return false;
            }
            
        } catch (error) {
            console.log(`❌ Test suite failed: ${error.message}`);
            return false;
        }
    }
}

// Run the test
async function main() {
    const tester = new LivePageByPageTester();
    const success = await tester.run();
    
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = LivePageByPageTester;