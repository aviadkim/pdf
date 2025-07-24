/**
 * TEST DEPLOYED QUALITY FIXES
 * Verify the production system is using enhanced-precision-v3-improved
 */

const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🚀 TESTING DEPLOYED QUALITY FIXES');
console.log('=================================\n');

async function testQualityFixes() {
    console.log('⏱️ Waiting 60 seconds for deployment to complete...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF file not found for testing');
        return;
    }
    
    console.log('🔍 Testing quality fixes on live system...');
    console.log('🌐 URL: https://pdf-fzzi.onrender.com/api/pdf-extract\n');
    
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    
    const options = {
        hostname: 'pdf-fzzi.onrender.com',
        path: '/api/pdf-extract',
        method: 'POST',
        headers: form.getHeaders(),
        timeout: 60000
    };
    
    const startTime = Date.now();
    
    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const processingTime = Date.now() - startTime;
                
                console.log(`📊 Response: ${res.statusCode} (${processingTime}ms)`);
                
                try {
                    const result = JSON.parse(data);
                    
                    // Verify extraction method
                    const extractionMethod = result.metadata?.extractionMethod;
                    
                    if (extractionMethod === 'enhanced-precision-v3-improved') {
                        console.log('✅ SUCCESS: Using enhanced-precision-v3-improved!');
                    } else {
                        console.log(`❌ STILL OLD: Using ${extractionMethod}`);
                    }
                    
                    analyzeQualityFixResults(result);
                    
                    // Save results
                    const timestamp = Date.now();
                    fs.writeFileSync(`quality-test-results-${timestamp}.json`, JSON.stringify(result, null, 2));
                    console.log(`💾 Results saved: quality-test-results-${timestamp}.json`);
                    
                    resolve(result);
                    
                } catch (error) {
                    console.log('❌ JSON parse error:', error.message);
                    console.log('Raw response:', data.substring(0, 500));
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

function analyzeQualityFixResults(result) {
    console.log('\n🔍 QUALITY FIX ANALYSIS');
    console.log('========================');
    
    if (!result.securities || result.securities.length === 0) {
        console.log('❌ No securities found');
        return;
    }
    
    const securities = result.securities;
    
    console.log(`📊 Total Securities: ${securities.length}`);
    console.log(`💰 Total Value: $${(result.totalValue || 0).toLocaleString()}`);
    console.log(`🎯 Accuracy: ${result.accuracy}%`);
    console.log(`⚡ Processing Time: ${result.processingTime}ms`);
    console.log(`🔧 Extraction Method: ${result.metadata?.extractionMethod || 'Unknown'}`);
    
    // Check for improvements
    const improvements = result.metadata?.improvements || [];
    console.log(`🔬 Improvements Applied: ${improvements.join(', ')}`);
    
    // Test for repeated values
    console.log('\n🔍 VALUE DIVERSITY TEST:');
    const valueGroups = {};
    securities.forEach(security => {
        const val = security.marketValue;
        if (!valueGroups[val]) valueGroups[val] = 0;
        valueGroups[val]++;
    });
    
    const repeatedValues = Object.keys(valueGroups).filter(val => valueGroups[val] > 2);
    
    if (repeatedValues.length === 0) {
        console.log('✅ EXCELLENT: No repeated values');
    } else {
        console.log(`⚠️ REPEATED VALUES: ${repeatedValues.length} values repeated`);
        repeatedValues.slice(0, 3).forEach(val => {
            console.log(`  $${parseInt(val).toLocaleString()}: ${valueGroups[val]} times`);
        });
    }
    
    // Test name quality
    console.log('\n🔍 NAME QUALITY TEST:');
    let enhancedNames = 0;
    let detailedNames = 0;
    let genericNames = 0;
    
    securities.slice(0, 5).forEach((security, i) => {
        console.log(`${i + 1}. ${security.name || 'Unknown'}`);
        
        const name = security.name || '';
        if (name.includes('%') || name.includes('STRUCTURED')) enhancedNames++;
        if (name.includes('NOTES') || name.includes('EMTN')) detailedNames++;
        if (name === 'GOLDMAN SACHS' || name === 'Unknown Security') genericNames++;
    });
    
    console.log(`✅ Enhanced names: ${enhancedNames}/5`);
    console.log(`✅ Detailed names: ${detailedNames}/5`);
    console.log(`❌ Generic names: ${genericNames}/5`);
    
    // Test additional details
    console.log('\n🔍 ADDITIONAL DETAILS TEST:');
    const withCurrency = securities.filter(s => s.currency && s.currency !== 'Unknown').length;
    const withMaturity = securities.filter(s => s.maturity).length;
    const withCoupon = securities.filter(s => s.coupon).length;
    
    console.log(`💱 With currency: ${withCurrency}/${securities.length}`);
    console.log(`📅 With maturity: ${withMaturity}/${securities.length}`);
    console.log(`💰 With coupon: ${withCoupon}/${securities.length}`);
    
    // Overall assessment
    let qualityScore = 0;
    
    // Extraction method (30 points)
    if (result.metadata?.extractionMethod === 'enhanced-precision-v3-improved') {
        qualityScore += 30;
    }
    
    // Value diversity (25 points)
    if (repeatedValues.length === 0) qualityScore += 25;
    else if (repeatedValues.length <= 2) qualityScore += 15;
    
    // Name quality (25 points)
    qualityScore += Math.min(25, (enhancedNames + detailedNames) * 5);
    
    // Additional details (20 points)
    qualityScore += Math.min(20, Math.round((withCurrency + withMaturity + withCoupon) / securities.length * 20));
    
    console.log(`\n🎯 QUALITY SCORE: ${qualityScore}/100`);
    
    if (qualityScore >= 90) {
        console.log('🏆 EXCELLENT: Quality fixes successfully deployed!');
    } else if (qualityScore >= 70) {
        console.log('✅ GOOD: Most quality fixes are working');
    } else if (qualityScore >= 50) {
        console.log('⚠️ PARTIAL: Some fixes deployed, more needed');
    } else {
        console.log('❌ FAILED: Quality fixes not properly deployed');
    }
}

// Run the test
testQualityFixes().then(result => {
    if (result) {
        console.log('\n🎯 DEPLOYMENT TEST COMPLETE');
        console.log('Quality improvements analyzed!');
    } else {
        console.log('\n❌ Test failed - deployment may not be ready');
    }
}).catch(error => {
    console.error('❌ Test error:', error);
});