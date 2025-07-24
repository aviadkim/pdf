/**
 * TEST REAL IMPROVEMENTS
 * Test the actual deployed quality fixes
 */

const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🔧 TESTING REAL DATA QUALITY IMPROVEMENTS');
console.log('=========================================\n');

async function testRealImprovements() {
    console.log('⏱️ Waiting 45 seconds for deployment...');
    await new Promise(resolve => setTimeout(resolve, 45000));
    
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ Cannot test without PDF file');
        return;
    }
    
    console.log('🔍 Testing improved extraction quality...');
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
                    analyzeQualityImprovements(result);
                    
                    // Save results for analysis
                    const timestamp = Date.now();
                    fs.writeFileSync(`improved-test-results-${timestamp}.json`, JSON.stringify(result, null, 2));
                    console.log(`💾 Results saved: improved-test-results-${timestamp}.json`);
                    
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

function analyzeQualityImprovements(result) {
    console.log('\n📊 QUALITY ANALYSIS - BEFORE vs AFTER');
    console.log('======================================');
    
    if (!result.securities || result.securities.length === 0) {
        console.log('❌ No securities found - system broken');
        return;
    }
    
    const securities = result.securities;
    
    console.log(`📊 Total Securities: ${securities.length}`);
    console.log(`💰 Total Value: $${(result.totalValue || 0).toLocaleString()}`);
    console.log(`🎯 Accuracy: ${result.accuracy}%`);
    
    // Test 1: Value Diversity (check for repeated values)
    console.log('\n🔍 TEST 1: VALUE DIVERSITY');
    console.log('==========================');
    
    const valueGroups = {};
    securities.forEach(security => {
        const val = security.marketValue;
        if (!valueGroups[val]) valueGroups[val] = [];
        valueGroups[val].push(security);
    });
    
    const repeatedValues = Object.keys(valueGroups).filter(val => valueGroups[val].length > 2);
    
    if (repeatedValues.length === 0) {
        console.log('✅ EXCELLENT: No repeated values found');
    } else {
        console.log(`❌ STILL ISSUES: ${repeatedValues.length} repeated values:`);
        repeatedValues.forEach(val => {
            console.log(`  $${parseInt(val).toLocaleString()}: ${valueGroups[val].length} securities`);
        });
    }
    
    // Test 2: Name Quality (check for enhanced names)
    console.log('\n🔍 TEST 2: NAME QUALITY');
    console.log('=======================');
    
    let enhancedNames = 0;
    let genericNames = 0;
    let detailedNames = 0;
    
    securities.slice(0, 5).forEach((security, i) => {
        console.log(`${i + 1}. ${security.isin}: ${security.name}`);
        
        if (security.name.includes('%')) enhancedNames++;
        if (security.name.includes('STRUCTURED') || security.name.includes('NOTES') || security.name.includes('EMTN')) detailedNames++;
        if (security.name === 'GOLDMAN SACHS' || security.name === 'Unknown Security') genericNames++;
    });
    
    console.log(`\n📊 Name Quality Summary:`);
    console.log(`✅ Enhanced names (with %): ${enhancedNames}/5`);
    console.log(`✅ Detailed names (instrument type): ${detailedNames}/5`);
    console.log(`❌ Generic names: ${genericNames}/5`);
    
    // Test 3: Additional Details (currency, maturity, coupon)
    console.log('\n🔍 TEST 3: ADDITIONAL DETAILS');
    console.log('=============================');
    
    const withCurrency = securities.filter(s => s.currency && s.currency !== 'Unknown').length;
    const withMaturity = securities.filter(s => s.maturity).length;
    const withCoupon = securities.filter(s => s.coupon).length;
    
    console.log(`💱 With currency: ${withCurrency}/${securities.length} (${((withCurrency/securities.length)*100).toFixed(1)}%)`);
    console.log(`📅 With maturity: ${withMaturity}/${securities.length} (${((withMaturity/securities.length)*100).toFixed(1)}%)`);
    console.log(`💰 With coupon: ${withCoupon}/${securities.length} (${((withCoupon/securities.length)*100).toFixed(1)}%)`);
    
    // Test 4: Overall Quality Score
    console.log('\n🎯 OVERALL QUALITY ASSESSMENT');
    console.log('=============================');
    
    let qualityScore = 0;
    
    // Value diversity (30 points)
    if (repeatedValues.length === 0) qualityScore += 30;
    else if (repeatedValues.length <= 2) qualityScore += 20;
    else if (repeatedValues.length <= 5) qualityScore += 10;
    
    // Name quality (25 points)
    const nameScore = ((enhancedNames + detailedNames) / securities.length * 25);
    qualityScore += nameScore;
    
    // Additional details (25 points)
    const detailScore = ((withCurrency + withMaturity + withCoupon) / (securities.length * 3) * 25);
    qualityScore += detailScore;
    
    // Accuracy (20 points)
    const accuracyScore = (parseFloat(result.accuracy) / 100) * 20;
    qualityScore += accuracyScore;
    
    console.log(`📊 Quality Score: ${qualityScore.toFixed(1)}/100`);
    
    if (qualityScore >= 90) {
        console.log('🏆 EXCELLENT: High quality extraction!');
    } else if (qualityScore >= 75) {
        console.log('✅ GOOD: Quality improvements visible');
    } else if (qualityScore >= 60) {
        console.log('⚠️ FAIR: Some improvements, more work needed');
    } else {
        console.log('❌ POOR: Significant quality issues remain');
    }
    
    // Test 5: Show improved sample
    console.log('\n📋 SAMPLE IMPROVED SECURITIES:');
    console.log('==============================');
    
    securities.slice(0, 3).forEach((security, i) => {
        console.log(`${i + 1}. ISIN: ${security.isin}`);
        console.log(`   Name: ${security.name}`);
        console.log(`   Value: $${(security.marketValue || 0).toLocaleString()}`);
        if (security.currency && security.currency !== 'Unknown') console.log(`   Currency: ${security.currency}`);
        if (security.maturity) console.log(`   Maturity: ${security.maturity}`);
        if (security.coupon) console.log(`   Coupon: ${security.coupon}`);
        if (security.valueAdjusted) console.log(`   🔧 Value adjusted from $${(security.originalValue || 0).toLocaleString()}`);
        console.log('');
    });
}

// Run the real improvement test
testRealImprovements().then(result => {
    if (result) {
        console.log('\n🎯 IMPROVEMENT TEST COMPLETE');
        console.log('Real data quality fixes have been analyzed!');
    } else {
        console.log('\n❌ Improvement test failed - need more debugging');
    }
}).catch(error => {
    console.error('❌ Test error:', error);
});