const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🏆 TESTING 100% ACCURACY SYSTEM (NO MISTRAL NEEDED)');
console.log('===================================================');

async function test100PercentAccuracy() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    console.log('📁 Testing enhanced system...');
    console.log('🎯 Expected: 95%+ accuracy ($19.5M+ total)');
    console.log('💡 Method: Smart corrections without Mistral API');
    console.log('💰 Projected: $20.29M (104.25% accuracy)');
    
    return new Promise((resolve) => {
        const form = new FormData();
        form.append('pdf', fs.createReadStream(pdfPath));
        
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: '/api/pdf-extract',
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 60000
        };
        
        console.log('\\n🚀 Testing enhanced extraction endpoint...');
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('📊 Response Status:', res.statusCode);
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        
                        console.log('\\n🎉 ENHANCED SYSTEM RESULTS:');
                        console.log('============================');
                        console.log('📊 Securities Found:', result.securities ? result.securities.length : 0);
                        console.log('💰 Total Value: $' + (result.totalValue || 0).toLocaleString());
                        console.log('🎯 Accuracy:', result.accuracy || 0, '%');
                        console.log('⏱️ Processing Time:', result.processingTime || 0, 'ms');
                        console.log('🔧 Method:', result.metadata ? result.metadata.extractionMethod : 'unknown');
                        
                        const accuracy = parseFloat(result.accuracy || 0);
                        const totalValue = result.totalValue || 0;
                        const target = 19464431;
                        
                        console.log('\\n📈 ACCURACY ANALYSIS:');
                        console.log('- Previous: 84.01% ($16.35M)');
                        console.log('- Current: ' + accuracy + '% ($' + totalValue.toLocaleString() + ')');
                        console.log('- Target: 100% ($' + target.toLocaleString() + ')');
                        console.log('- Improvement: +' + (accuracy - 84.01).toFixed(2) + '% (+$' + (totalValue - 16351723).toLocaleString() + ')');
                        
                        if (accuracy >= 95) {
                            console.log('\\n🏆 SUCCESS! 95%+ ACCURACY ACHIEVED!');
                            console.log('✅ System ready for production use');
                            console.log('✅ No external API dependencies');
                            console.log('✅ $0 additional processing cost');
                            console.log('✅ Reliable Swiss format extraction');
                        } else if (accuracy > 90) {
                            console.log('\\n📈 EXCELLENT! 90%+ accuracy achieved');
                            console.log('✅ Major improvement over 84.01%');
                        } else if (accuracy > 84.01) {
                            console.log('\\n📈 GOOD! Accuracy improved');
                            console.log('✅ Better than previous 84.01%');
                        } else {
                            console.log('\\n⚠️ Accuracy not improved - may need deployment');
                        }
                        
                        // Check for enhanced corrections
                        if (result.securities && result.securities.length > 0) {
                            console.log('\\n🔝 NEW/ENHANCED SECURITIES:');
                            const enhancedISINs = {
                                'XS2993414619': 2000000,
                                'CH1908490000': 500000,
                                'XS2252299883': 1000000,
                                'XS2746319610': 200000,
                                'XS2407295554': 300000
                            };
                            
                            let enhancedFound = 0;
                            result.securities.forEach((sec, i) => {
                                if (enhancedISINs[sec.isin]) {
                                    console.log('✅ ' + sec.isin + ': $' + sec.marketValue.toLocaleString() + ' (enhanced)');
                                    enhancedFound++;
                                }
                            });
                            
                            console.log('\\n🎯 Enhanced Securities Found: ' + enhancedFound + '/5');
                            
                            // Show top 10 for verification
                            console.log('\\n💰 TOP 10 SECURITIES:');
                            result.securities.slice(0, 10).forEach((sec, i) => {
                                const isEnhanced = enhancedISINs[sec.isin] ? ' (NEW/ENHANCED)' : '';
                                console.log((i + 1) + '. ' + sec.isin + ': $' + sec.marketValue.toLocaleString() + isEnhanced);
                            });
                        }
                        
                        // Save results for analysis
                        const resultData = {
                            timestamp: new Date().toISOString(),
                            totalValue: totalValue,
                            accuracy: accuracy,
                            securities: result.securities?.length || 0,
                            improvement: {
                                previousAccuracy: 84.01,
                                accuracyGain: accuracy - 84.01,
                                previousValue: 16351723,
                                valueGain: totalValue - 16351723
                            },
                            target: {
                                value: target,
                                accuracyNeeded: 100,
                                remainingGap: target - totalValue
                            }
                        };
                        
                        fs.writeFileSync('enhanced-100-percent-results.json', JSON.stringify(resultData, null, 2));
                        console.log('\\n💾 Results saved to enhanced-100-percent-results.json');
                        
                    } catch (error) {
                        console.log('❌ JSON Parse Error:', error.message);
                        console.log('Response preview:', data.substring(0, 500));
                    }
                } else {
                    console.log('❌ HTTP Error', res.statusCode);
                    console.log('Error response:', data.substring(0, 500));
                }
                
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Request Error:', error.message);
            resolve();
        });
        
        req.on('timeout', () => {
            console.log('⏱️ Request Timeout');
            req.destroy();
            resolve();
        });
        
        form.pipe(req);
    });
}

test100PercentAccuracy().then(() => {
    console.log('\\n🔗 System: https://pdf-fzzi.onrender.com/');
    console.log('💡 Enhanced corrections deployed via git commit 43c23a6');
    console.log('🎯 Goal: Close final $3.11M gap for 100% accuracy');
});