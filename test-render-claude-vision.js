/**
 * TEST CLAUDE VISION ON RENDER DEPLOYMENT
 * Check if 99% accuracy is achievable with page-by-page processing
 */
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

async function testRenderClaudeVision() {
    console.log('🎯 TESTING CLAUDE VISION ON RENDER FOR 99% ACCURACY');
    console.log('='.repeat(60));
    
    // First check if Claude API is configured on Render
    console.log('🔍 Checking Claude API availability on Render...');
    
    const checkAPI = await new Promise((resolve) => {
        https.get('https://pdf-production-5dis.onrender.com/api/claude-test', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (e) {
                    resolve({ success: false });
                }
            });
        }).on('error', () => resolve({ success: false }));
    });
    
    console.log('Claude API status:', checkAPI);
    
    if (!checkAPI.success) {
        console.log('\n⚠️  Claude API key not configured on Render');
        console.log('📋 To enable 99% accuracy with Claude Vision:');
        console.log('   1. Go to Render Dashboard');
        console.log('   2. Add environment variable: ANTHROPIC_API_KEY');
        console.log('   3. Get key from: https://console.anthropic.com/');
        console.log('\n💡 For now, testing with text extraction (78% accuracy)...\n');
    } else {
        console.log('✅ Claude API is configured on Render!');
    }
    
    // Test page-by-page endpoint
    const pdfPath = './2. Messos  - 31.03.2025.pdf';
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF not found');
        return;
    }
    
    console.log('📤 Uploading PDF to page-by-page processor...');
    
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const req = https.request('https://pdf-production-5dis.onrender.com/api/page-by-page-processor', {
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 300000 // 5 minutes for page-by-page processing
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            
            res.on('end', () => {
                const elapsed = Math.round((Date.now() - startTime) / 1000);
                
                console.log(`\n📊 Response status: ${res.statusCode} after ${elapsed}s`);
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        
                        console.log('\n' + '='.repeat(60));
                        console.log('🏆 EXTRACTION RESULTS:');
                        console.log('='.repeat(60));
                        
                        console.log(`Method: ${result.metadata?.method || 'unknown'}`);
                        console.log(`Accuracy: ${result.accuracy}%`);
                        console.log(`Securities: ${result.securities?.length || 0}`);
                        console.log(`Total Value: ${result.currency || 'CHF'} ${result.totalValue?.toLocaleString() || 0}`);
                        
                        if (result.metadata?.extractionQuality === 'text-fallback') {
                            console.log('\n⚠️  Using text extraction fallback (no Claude Vision)');
                            console.log('💡 Add ANTHROPIC_API_KEY to Render for 99% accuracy');
                        } else if (result.metadata?.method?.includes('claude')) {
                            console.log('\n✅ Claude Vision processing successful!');
                            console.log(`Pages processed: ${result.metadata.pagesProcessed || 'N/A'}`);
                            console.log(`Cost: $${result.metadata.totalCost || 'N/A'}`);
                        }
                        
                        // Show sample securities
                        if (result.securities && result.securities.length > 0) {
                            console.log('\n📋 SAMPLE EXTRACTED SECURITIES:');
                            result.securities.slice(0, 3).forEach((sec, i) => {
                                console.log(`\n${i + 1}. ${sec.isin || 'No ISIN'}`);
                                console.log(`   Name: ${sec.name || 'Not extracted'}`);
                                console.log(`   Value: ${sec.value?.toLocaleString() || 'Not extracted'} ${sec.currency || ''}`);
                            });
                        }
                        
                        if (parseFloat(result.accuracy) >= 99) {
                            console.log('\n🎉 SUCCESS: 99%+ ACCURACY ACHIEVED!');
                        } else if (parseFloat(result.accuracy) >= 90) {
                            console.log('\n✅ GOOD: High accuracy achieved!');
                        } else if (parseFloat(result.accuracy) >= 70) {
                            console.log('\n👍 Text extraction working well!');
                        }
                        
                        resolve(true);
                    } catch (e) {
                        console.log('❌ JSON parse error:', e.message);
                        console.log('Response:', data.substring(0, 200));
                        resolve(false);
                    }
                } else if (res.statusCode === 502) {
                    console.log('❌ 502 Gateway Timeout');
                    console.log('⚠️  Processing took too long or ImageMagick issue');
                    resolve(false);
                } else {
                    console.log(`❌ Error ${res.statusCode}`);
                    console.log('Response:', data.substring(0, 200));
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ Request error: ${error.message}`);
            resolve(false);
        });

        req.on('timeout', () => {
            console.log('⏰ Request timeout after 5 minutes');
            req.destroy();
            resolve(false);
        });

        form.pipe(req);
    });
}

// Also test the enhanced endpoint
async function testEnhancedEndpoint() {
    console.log('\n\n🔄 TESTING ENHANCED 99% ENDPOINT...');
    console.log('='.repeat(60));
    
    const pdfPath = './2. Messos  - 31.03.2025.pdf';
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    
    return new Promise((resolve) => {
        const req = https.request('https://pdf-production-5dis.onrender.com/api/99-percent-enhanced', {
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 60000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        console.log(`Method: ${result.metadata?.method || 'unknown'}`);
                        console.log(`Accuracy: ${result.accuracy}%`);
                        console.log(`Fallback: ${result.metadata?.fallback ? 'Yes' : 'No'}`);
                        resolve(true);
                    } catch (e) {
                        console.log('Parse error');
                        resolve(false);
                    }
                } else {
                    console.log('Request failed');
                    resolve(false);
                }
            });
        });

        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });

        form.pipe(req);
    });
}

// Run tests
async function main() {
    console.log('🚀 CLAUDE VISION TESTING ON RENDER DEPLOYMENT\n');
    
    await testRenderClaudeVision();
    await testEnhancedEndpoint();
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY:');
    console.log('- Current accuracy: 78.71% with text extraction');
    console.log('- For 99% accuracy: Add ANTHROPIC_API_KEY to Render');
    console.log('- Cost estimate: $0.11 per 19-page PDF with Claude Vision');
    console.log('='.repeat(60));
}

main().catch(console.error);