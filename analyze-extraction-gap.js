/**
 * ANALYZE EXTRACTION GAP
 * Find the exact $3.8M difference between current extraction and target
 */

const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🔍 ANALYZING $3.8M EXTRACTION GAP');
console.log('==================================\n');

async function analyzeGap() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF file not found');
        return;
    }
    
    console.log('📊 Current Total: $15,683,309');
    console.log('🎯 Target Total: $19,464,431');
    console.log('❌ Missing: $3,781,122\n');
    
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    
    const options = {
        hostname: 'pdf-fzzi.onrender.com',
        path: '/api/pdf-extract',
        method: 'POST',
        headers: form.getHeaders(),
        timeout: 60000
    };
    
    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    
                    console.log('🔍 ANALYZING CONTEXT FOR SWISS FORMAT VALUES:');
                    console.log('============================================\n');
                    
                    if (result.securities) {
                        let potentialCorrections = [];
                        
                        result.securities.forEach(security => {
                            const context = security.context || '';
                            
                            // Find all Swiss format numbers in context
                            const swissNumbers = context.match(/\d{1,3}(?:'\d{3})+(?:\.\d{2})?/g) || [];
                            
                            if (swissNumbers.length > 0) {
                                console.log(`\n📌 ${security.isin}:`);
                                console.log(`   Current extraction: $${(security.marketValue || 0).toLocaleString()}`);
                                console.log(`   Swiss numbers found: ${swissNumbers.join(', ')}`);
                                
                                // Convert Swiss numbers to regular numbers
                                const parsedNumbers = swissNumbers.map(num => {
                                    return parseFloat(num.replace(/'/g, ''));
                                }).filter(n => n > 1000 && n < 50000000);
                                
                                if (parsedNumbers.length > 0) {
                                    // Find the most likely market value
                                    // Usually it's not the largest (which might be nominal)
                                    // but a reasonable value in the middle range
                                    const sortedNumbers = parsedNumbers.sort((a, b) => a - b);
                                    let likelyValue = sortedNumbers[0];
                                    
                                    // If current value is too round (like 1,600,000), 
                                    // the real value is likely a Swiss format number
                                    if (security.marketValue % 100000 === 0 && security.marketValue > 500000) {
                                        // Look for a smaller, more precise value
                                        for (let num of sortedNumbers) {
                                            if (num < security.marketValue / 2) {
                                                likelyValue = num;
                                                break;
                                            }
                                        }
                                    }
                                    
                                    console.log(`   💡 Likely real value: $${likelyValue.toLocaleString()}`);
                                    console.log(`   📊 Difference: $${(security.marketValue - likelyValue).toLocaleString()}`);
                                    
                                    potentialCorrections.push({
                                        isin: security.isin,
                                        currentValue: security.marketValue,
                                        likelyValue: likelyValue,
                                        difference: security.marketValue - likelyValue
                                    });
                                }
                            }
                        });
                        
                        // Calculate potential new total
                        console.log('\n📊 CORRECTION SUMMARY:');
                        console.log('======================');
                        
                        const totalDifference = potentialCorrections.reduce((sum, corr) => sum + corr.difference, 0);
                        const correctedTotal = result.totalValue - totalDifference;
                        
                        console.log(`Current total: $${result.totalValue.toLocaleString()}`);
                        console.log(`Total corrections: -$${totalDifference.toLocaleString()}`);
                        console.log(`Corrected total: $${correctedTotal.toLocaleString()}`);
                        console.log(`Target total: $19,464,431`);
                        console.log(`New accuracy: ${((Math.min(correctedTotal, 19464431) / Math.max(correctedTotal, 19464431)) * 100).toFixed(2)}%`);
                        
                        // Show top corrections needed
                        console.log('\n🔧 TOP CORRECTIONS NEEDED:');
                        potentialCorrections
                            .sort((a, b) => b.difference - a.difference)
                            .slice(0, 10)
                            .forEach((corr, i) => {
                                console.log(`${i + 1}. ${corr.isin}: $${corr.currentValue.toLocaleString()} → $${corr.likelyValue.toLocaleString()} (save $${corr.difference.toLocaleString()})`);
                            });
                    }
                    
                    resolve(result);
                    
                } catch (error) {
                    console.log('❌ Error:', error.message);
                    resolve(null);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Request failed: ${error.message}`);
            resolve(null);
        });
        
        form.pipe(req);
    });
}

analyzeGap().then(() => {
    console.log('\n✅ Analysis complete!');
    console.log('\n💡 SOLUTION: Update extraction to use Swiss format values instead of nominal values');
}).catch(error => {
    console.error('❌ Error:', error);
});