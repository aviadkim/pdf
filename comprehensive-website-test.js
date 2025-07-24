/**
 * COMPREHENSIVE WEBSITE TEST
 * Test all functionality and measure current performance
 */

const fs = require('fs');
const FormData = require('form-data');
const https = require('https');

console.log('🚀 COMPREHENSIVE WEBSITE TESTING');
console.log('=================================\n');

async function testAPI() {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        const pdfPath = '2. Messos  - 31.03.2025.pdf';
        
        if (!fs.existsSync(pdfPath)) {
            console.log('⚠️ Test PDF not found - skipping API test');
            resolve({ skipped: true });
            return;
        }
        
        console.log('📄 Testing with Messos PDF...');
        form.append('pdf', fs.createReadStream(pdfPath));
        
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: '/api/pdf-extract',
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 30000
        };
        
        const startTime = Date.now();
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const processingTime = Date.now() - startTime;
                
                try {
                    const result = JSON.parse(data);
                    
                    console.log('✅ API TEST RESULTS:');
                    console.log(`📊 Securities: ${result.securities?.length || 0}`);
                    console.log(`💰 Total Value: $${(result.totalValue || 0).toLocaleString()}`);
                    console.log(`⏱️ Processing Time: ${processingTime}ms`);
                    console.log(`🎯 Accuracy: ${result.accuracy || 'Unknown'}%`);
                    console.log(`🔧 Method: ${result.metadata?.extractionMethod || 'Unknown'}`);
                    
                    resolve({
                        success: true,
                        securities: result.securities?.length || 0,
                        totalValue: result.totalValue || 0,
                        processingTime: processingTime,
                        accuracy: result.accuracy,
                        data: result
                    });
                    
                } catch (error) {
                    console.log('❌ Invalid JSON response');
                    console.log('Response:', data.substring(0, 500));
                    resolve({ success: false, error: 'Invalid JSON' });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Request failed: ${error.message}`);
            resolve({ success: false, error: error.message });
        });
        
        req.on('timeout', () => {
            console.log('⏱️ Request timeout');
            req.destroy();
            resolve({ success: false, error: 'Timeout' });
        });
        
        form.pipe(req);
    });
}

async function analyzePerformance(testResult) {
    console.log('\n📈 PERFORMANCE ANALYSIS');
    console.log('========================');
    
    if (!testResult.success) {
        console.log('❌ Cannot analyze - test failed');
        return;
    }
    
    const { securities, totalValue, processingTime, accuracy } = testResult;
    
    // Performance metrics
    console.log('⚡ SPEED ANALYSIS:');
    console.log(`Processing Time: ${processingTime}ms`);
    if (processingTime < 500) console.log('🏆 EXCELLENT - Sub-500ms processing!');
    else if (processingTime < 1000) console.log('✅ GOOD - Sub-1s processing');
    else if (processingTime < 2000) console.log('⚠️ ACCEPTABLE - Under 2s');
    else console.log('🐌 NEEDS IMPROVEMENT - Over 2s');
    
    console.log('\n🎯 ACCURACY ANALYSIS:');
    const expectedValue = 19464431; // Known Messos total
    const accuracyScore = ((1 - Math.abs(totalValue - expectedValue) / expectedValue) * 100);
    console.log(`Expected: $${expectedValue.toLocaleString()}`);
    console.log(`Extracted: $${totalValue.toLocaleString()}`);
    console.log(`Calculated Accuracy: ${accuracyScore.toFixed(2)}%`);
    
    if (accuracyScore >= 95) console.log('🏆 EXCELLENT accuracy!');
    else if (accuracyScore >= 90) console.log('✅ GOOD accuracy');
    else if (accuracyScore >= 80) console.log('⚠️ ACCEPTABLE accuracy');
    else console.log('❌ NEEDS IMPROVEMENT');
    
    console.log('\n📊 COMPLETENESS ANALYSIS:');
    console.log(`Securities found: ${securities}`);
    if (securities >= 35) console.log('🏆 EXCELLENT coverage!');
    else if (securities >= 30) console.log('✅ GOOD coverage');
    else if (securities >= 25) console.log('⚠️ ACCEPTABLE coverage');
    else console.log('❌ LOW coverage - needs improvement');
    
    return {
        speedGrade: processingTime < 500 ? 'A+' : processingTime < 1000 ? 'A' : processingTime < 2000 ? 'B' : 'C',
        accuracyGrade: accuracyScore >= 95 ? 'A+' : accuracyScore >= 90 ? 'A' : accuracyScore >= 80 ? 'B' : 'C',
        completenessGrade: securities >= 35 ? 'A+' : securities >= 30 ? 'A' : securities >= 25 ? 'B' : 'C',
        overallScore: accuracyScore
    };
}

async function identifyImprovements(performance, testResult) {
    console.log('\n🔧 IMPROVEMENT OPPORTUNITIES');
    console.log('=============================');
    
    const improvements = [];
    
    // Speed improvements
    if (performance?.speedGrade !== 'A+') {
        improvements.push({
            area: 'Processing Speed',
            current: `${testResult.processingTime}ms`,
            target: '<500ms',
            actions: [
                'Implement parallel extraction pipelines',
                'Add PDF page caching',
                'Optimize regex patterns',
                'Use streaming processing'
            ]
        });
    }
    
    // Accuracy improvements  
    if (performance?.accuracyGrade !== 'A+') {
        improvements.push({
            area: 'Extraction Accuracy',
            current: `${performance.overallScore.toFixed(1)}%`,
            target: '99%+',
            actions: [
                'Implement Claude Vision integration',
                'Add advanced table structure detection',
                'Enhance value validation algorithms',
                'Add machine learning corrections'
            ]
        });
    }
    
    // UI/UX improvements
    improvements.push({
        area: 'User Experience',
        current: 'Basic upload interface',
        target: 'Modern, interactive experience',
        actions: [
            'Real-time processing visualization',
            'Drag & drop with previews',
            'Interactive results dashboard',
            'Batch processing capabilities'
        ]
    });
    
    improvements.forEach((imp, i) => {
        console.log(`\n${i + 1}. ${imp.area.toUpperCase()}`);
        console.log(`Current: ${imp.current}`);
        console.log(`Target: ${imp.target}`);
        console.log('Actions:');
        imp.actions.forEach(action => console.log(`  • ${action}`));
    });
    
    return improvements;
}

async function runComprehensiveTest() {
    try {
        // Test API
        const testResult = await testAPI();
        
        if (testResult.skipped) {
            console.log('⚠️ API test skipped - no test PDF');
            return;
        }
        
        // Analyze performance
        const performance = await analyzePerformance(testResult);
        
        // Identify improvements
        const improvements = await identifyImprovements(performance, testResult);
        
        console.log('\n📊 OVERALL ASSESSMENT');
        console.log('=====================');
        if (performance) {
            console.log(`Speed Grade: ${performance.speedGrade}`);
            console.log(`Accuracy Grade: ${performance.accuracyGrade}`);  
            console.log(`Completeness Grade: ${performance.completenessGrade}`);
            
            const avgGrade = [performance.speedGrade, performance.accuracyGrade, performance.completenessGrade]
                .map(g => g === 'A+' ? 4 : g === 'A' ? 3 : g === 'B' ? 2 : 1)
                .reduce((a, b) => a + b) / 3;
            
            console.log(`Overall Grade: ${avgGrade >= 3.5 ? 'A+' : avgGrade >= 2.5 ? 'A' : avgGrade >= 1.5 ? 'B' : 'C'}`);
        }
        
        console.log('\n🚀 NEXT STEPS: Implement dramatic improvements!');
        
        return { testResult, performance, improvements };
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return null;
    }
}

runComprehensiveTest().then(result => {
    if (result) {
        console.log('\n✅ Comprehensive testing complete - ready for improvements!');
    }
}).catch(console.error);