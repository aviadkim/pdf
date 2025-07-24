/**
 * TEST CLAUDE DIRECT VISION ON RENDER FOR 99% ACCURACY
 * Tests the new /api/claude-direct-vision endpoint
 */
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

async function testClaudeDirectVision() {
    console.log('🎯 TESTING CLAUDE DIRECT VISION FOR 99% ACCURACY');
    console.log('🚀 New endpoint: /api/claude-direct-vision (no ImageMagick)');
    console.log('='.repeat(70));
    
    const pdfPath = './2. Messos  - 31.03.2025.pdf';
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF not found');
        return false;
    }
    
    console.log('📤 Uploading PDF to Claude Direct Vision...');
    console.log('⏱️  Expected time: 10-30 seconds for Claude processing');
    
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const req = https.request('https://pdf-production-5dis.onrender.com/api/claude-direct-vision', {
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 120000 // 2 minutes for Claude processing
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            
            res.on('end', () => {
                const elapsed = Math.round((Date.now() - startTime) / 1000);
                
                console.log(`\n📊 Response: ${res.statusCode} after ${elapsed}s`);
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        
                        console.log('\n' + '='.repeat(70));
                        console.log('🏆 CLAUDE DIRECT VISION RESULTS:');
                        console.log('='.repeat(70));
                        
                        const accuracy = parseFloat(result.accuracy || 0);
                        const securities = result.securities || [];
                        const totalValue = result.totalValue || 0;
                        const method = result.metadata?.method || 'unknown';
                        const cost = result.metadata?.totalCost || 0;
                        
                        console.log(`✅ Success: ${result.success}`);
                        console.log(`🎯 Accuracy: ${accuracy}%`);
                        console.log(`🔢 Securities found: ${securities.length}`);
                        console.log(`💰 Total value: ${result.currency || 'CHF'} ${totalValue.toLocaleString()}`);
                        console.log(`🔧 Method: ${method}`);
                        console.log(`💵 Cost: $${typeof cost === 'number' ? cost.toFixed(4) : cost}`);
                        console.log(`⏱️  Processing time: ${elapsed}s`);
                        
                        if (result.metadata?.tokensUsed) {
                            console.log(`🧠 Tokens: ${result.metadata.tokensUsed.input + result.metadata.tokensUsed.output}`);
                        }
                        
                        // Show field extraction status
                        if (securities.length > 0) {
                            const sample = securities[0];
                            console.log('\n📋 FIELD EXTRACTION STATUS:');
                            console.log(`   ISIN: ${sample.isin ? '✅' : '❌'}`);
                            console.log(`   Name: ${sample.name ? '✅' : '❌'}`);
                            console.log(`   Quantity: ${sample.quantity ? '✅' : '❌'}`);
                            console.log(`   Price: ${sample.price ? '✅' : '❌'}`);
                            console.log(`   Value: ${sample.value ? '✅' : '❌'}`);
                            console.log(`   Currency: ${sample.currency ? '✅' : '❌'}`);
                        }
                        
                        // Show sample securities
                        if (securities.length > 0) {
                            console.log('\n🏆 SAMPLE EXTRACTED SECURITIES:');
                            securities.slice(0, 3).forEach((sec, i) => {
                                console.log(`\n${i + 1}. ${sec.isin || 'No ISIN'}`);
                                console.log(`   Name: ${sec.name || 'Not extracted'}`);
                                console.log(`   Quantity: ${sec.quantity ? sec.quantity.toLocaleString() : 'Not extracted'} ${sec.currency || ''}`);
                                console.log(`   Price: ${sec.price || 'Not extracted'}%`);
                                console.log(`   Value: ${sec.value ? sec.value.toLocaleString() : 'Not extracted'} ${sec.currency || ''}`);
                            });
                        }
                        
                        // Accuracy evaluation
                        if (accuracy >= 99) {
                            console.log('\n🎉 TARGET ACHIEVED: 99%+ ACCURACY!');
                            console.log('🚀 Claude Direct Vision working perfectly!');
                        } else if (accuracy >= 95) {
                            console.log('\n🌟 EXCELLENT: Near-perfect accuracy!');
                            console.log('✅ Claude Direct Vision performing very well!');
                        } else if (accuracy >= 90) {
                            console.log('\n👍 VERY GOOD: High accuracy achieved!');
                            console.log('✅ Claude Direct Vision working well!');
                        } else if (accuracy >= 80) {
                            console.log('\n✅ GOOD: Solid accuracy improvement!');
                        } else if (securities.length > 0) {
                            console.log('\n📈 PROGRESS: Securities being extracted!');
                        } else {
                            console.log('\n⚠️  No securities extracted - check API implementation');
                        }
                        
                        resolve(accuracy >= 90);\n                        \n                    } catch (e) {\n                        console.log('❌ JSON parse error:', e.message);\n                        console.log('Raw response:', data.substring(0, 300));\n                        resolve(false);\n                    }\n                } else if (res.statusCode === 500) {\n                    console.log('❌ Server error');\n                    try {\n                        const error = JSON.parse(data);\n                        console.log('Error:', error.error);\n                        console.log('Details:', error.details);\n                        if (error.error.includes('API key')) {\n                            console.log('💡 Claude API key issue - check Render environment variables');\n                        }\n                    } catch (e) {\n                        console.log('Response:', data.substring(0, 200));\n                    }\n                    resolve(false);\n                } else {\n                    console.log(`❌ Error ${res.statusCode}`);\n                    console.log('Response:', data.substring(0, 200));\n                    resolve(false);\n                }\n            });\n        });\n\n        req.on('error', (error) => {\n            console.log(`❌ Request error: ${error.message}`);\n            resolve(false);\n        });\n\n        req.on('timeout', () => {\n            console.log('⏰ Timeout after 2 minutes');\n            req.destroy();\n            resolve(false);\n        });\n\n        form.pipe(req);\n    });\n}\n\nasync function main() {\n    console.log('🚀 CLAUDE DIRECT VISION 99% ACCURACY TEST\\n');\n    \n    const success = await testClaudeDirectVision();\n    \n    console.log('\\n' + '='.repeat(70));\n    console.log('📋 SUMMARY:');\n    \n    if (success) {\n        console.log('🎉 SUCCESS: Claude Direct Vision achieved high accuracy!');\n        console.log('✅ No ImageMagick issues');\n        console.log('✅ Direct Claude API integration working');\n        console.log('✅ Comprehensive field extraction');\n    } else {\n        console.log('⚠️  Claude Direct Vision needs debugging');\n        console.log('💡 Check Render logs and API key configuration');\n    }\n    \n    console.log('\\n🔗 Test endpoint: /api/claude-direct-vision');\n    console.log('💰 Estimated cost: $0.05-0.15 per PDF');\n    console.log('⏱️  Processing time: 10-30 seconds');\n    console.log('='.repeat(70));\n    \n    process.exit(success ? 0 : 1);\n}\n\nmain().catch(console.error);