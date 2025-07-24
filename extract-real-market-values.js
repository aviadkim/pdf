/**
 * EXTRACT REAL MARKET VALUES
 * Fix the valuation extraction to get actual market values from Swiss format
 */

const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('💰 EXTRACTING REAL MARKET VALUES');
console.log('=================================\n');

async function extractRealValues() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF file not found');
        return;
    }
    
    console.log('🌐 Testing: https://pdf-fzzi.onrender.com/api/pdf-extract');
    
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
                console.log(`📊 Status: ${res.statusCode}`);
                
                try {
                    const result = JSON.parse(data);
                    
                    console.log(`📊 Total Securities: ${result.securities?.length || 0}`);
                    console.log(`💰 Current Total: $${(result.totalValue || 0).toLocaleString()}`);
                    console.log(`🎯 Target Total: $19,464,431`);
                    console.log(`📈 Current Accuracy: ${result.accuracy}%`);
                    
                    console.log('\n🔍 ANALYZING MARKET VALUE EXTRACTION:');
                    console.log('=====================================');
                    
                    if (result.securities) {
                        // Look at top 10 securities and their context to find real values
                        result.securities.slice(0, 10).forEach((security, i) => {
                            console.log(`\\n${i + 1}. ISIN: ${security.isin}`);
                            console.log(`   Current Value: $${(security.marketValue || 0).toLocaleString()}`);
                            console.log(`   Context: ${security.context?.substring(0, 150) || 'No context'}...`);
                            
                            // Try to extract real Swiss format values from context
                            const context = security.context || '';
                            const swissMatches = context.match(/\\d{1,3}(?:'\\d{3})*(?:\\.\\d{2})?/g);
                            
                            if (swissMatches) {
                                console.log(`   🔍 Swiss format numbers found: ${swissMatches.join(', ')}`);
                                
                                // Find the likely market value (usually the largest reasonable number)
                                const potentialValues = swissMatches
                                    .map(match => parseFloat(match.replace(/'/g, '')))
                                    .filter(val => val > 1000 && val < 50000000) // Reasonable range
                                    .sort((a, b) => b - a);
                                    
                                if (potentialValues.length > 0) {
                                    console.log(`   💡 Likely real value: $${potentialValues[0].toLocaleString()}`);
                                    console.log(`   ⚠️ Difference: $${(potentialValues[0] - (security.marketValue || 0)).toLocaleString()}`);
                                }
                            }
                        });
                        
                        console.log('\\n🎯 VALUE EXTRACTION ANALYSIS:');
                        console.log('==============================');
                        
                        // Calculate total if we used Swiss format parsing
                        let correctedTotal = 0;
                        let correctedCount = 0;
                        
                        result.securities.forEach(security => {
                            const context = security.context || '';
                            const swissMatches = context.match(/\\d{1,3}(?:'\\d{3})*(?:\\.\\d{2})?/g);
                            
                            if (swissMatches) {
                                const potentialValues = swissMatches
                                    .map(match => parseFloat(match.replace(/'/g, '')))
                                    .filter(val => val > 1000 && val < 50000000);
                                    
                                if (potentialValues.length > 0) {
                                    correctedTotal += potentialValues[0];
                                    correctedCount++;
                                }
                            }
                        });
                        
                        console.log(`💰 Corrected Total (Swiss parsing): $${correctedTotal.toLocaleString()}`);
                        console.log(`🎯 Target Total: $19,464,431`);
                        console.log(`📈 Corrected Accuracy: ${((Math.min(correctedTotal, 19464431) / Math.max(correctedTotal, 19464431)) * 100).toFixed(2)}%`);
                        console.log(`🔧 Securities with corrected values: ${correctedCount}/${result.securities.length}`);
                        
                        if (correctedTotal > 18000000) {
                            console.log('\\n✅ SOLUTION IDENTIFIED: Swiss number format parsing needed!');
                        } else {
                            console.log('\\n❌ Additional investigation needed');
                        }
                    }
                    
                    resolve(result);
                    
                } catch (error) {
                    console.log('❌ JSON parse error:', error.message);
                    console.log('Raw response preview:', data.substring(0, 200));
                    resolve(null);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Request failed: ${error.message}`);
            resolve(null);
        });
        
        req.on('timeout', () => {
            console.log('⏱️ Request timeout');
            req.destroy();
            resolve(null);
        });
        
        form.pipe(req);
    });
}

extractRealValues().then(result => {
    console.log('\\n🎯 REAL VALUE EXTRACTION ANALYSIS COMPLETE');
}).catch(error => {
    console.error('❌ Test error:', error);
});