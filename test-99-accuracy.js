// Test 99% accuracy target with Claude Vision on pdf-production
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function test99PercentAccuracy() {
    const baseUrl = 'https://pdf-production-5dis.onrender.com';
    const expectedTotal = 19464431; // Expected $19.4M from Messos PDF
    const targetAccuracy = 99.0; // 99% accuracy target
    
    console.log('🎯 TESTING 99% ACCURACY TARGET');
    console.log('===============================');
    console.log('Target:', `$${expectedTotal.toLocaleString()}`);
    console.log('Accuracy Goal: 99%+');
    console.log('Service:', baseUrl);
    console.log('');
    
    // Use the actual Messos PDF file
    const pdfPath = './2. Messos  - 31.03.2025.pdf';
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ Messos PDF not found');
        return;
    }
    
    console.log('📁 Found Messos PDF');
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log('📏 File size:', (pdfBuffer.length / 1024).toFixed(1) + 'KB');
    console.log('');
    
    // Test all available extraction methods
    const methods = [
        { endpoint: '/api/claude-vision-extract', name: 'Claude Vision (Primary)' },
        { endpoint: '/api/hybrid-extract-fixed', name: 'Hybrid Fixed (Fallback)' },
        { endpoint: '/api/bulletproof-processor', name: 'Enhanced Precision (Current Best)' }
    ];
    
    const results = [];
    
    for (const method of methods) {
        console.log(`🔬 Testing: ${method.name}`);
        console.log('-'.repeat(40));
        
        try {
            const formData = new FormData();
            formData.append('pdf', pdfBuffer, 'messos.pdf');
            
            const startTime = Date.now();
            const response = await fetch(`${baseUrl}${method.endpoint}`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
                continue;
            }
            
            const result = await response.json();
            const processingTime = Date.now() - startTime;
            
            const extractedTotal = result.totalValue || 0;
            const accuracy = ((1 - Math.abs(extractedTotal - expectedTotal) / expectedTotal) * 100);
            const isSuccess = accuracy >= targetAccuracy;
            
            console.log('📊 Results:');
            console.log(`  Extracted: $${extractedTotal.toLocaleString()}`);
            console.log(`  Expected:  $${expectedTotal.toLocaleString()}`);
            console.log(`  Accuracy:  ${accuracy.toFixed(2)}% ${isSuccess ? '✅' : '❌'}`);
            console.log(`  Securities: ${result.securities?.length || 0}`);
            console.log(`  Time: ${processingTime}ms`);
            
            if (result.metadata?.costAnalysis) {
                console.log(`  Cost: $${result.metadata.costAnalysis.totalCost || 0}`);
            }
            
            results.push({
                method: method.name,
                endpoint: method.endpoint,
                accuracy: accuracy,
                extractedTotal: extractedTotal,
                securities: result.securities?.length || 0,
                processingTime: processingTime,
                cost: result.metadata?.costAnalysis?.totalCost || 0,
                success: isSuccess
            });
            
            console.log('');
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            console.log('');
        }
    }
    
    // Summary
    console.log('🏆 FINAL RESULTS');
    console.log('================');
    
    const bestResult = results.reduce((best, current) => 
        current.accuracy > best.accuracy ? current : best, 
        { accuracy: 0 }
    );
    
    if (bestResult.accuracy >= targetAccuracy) {
        console.log(`🎉 SUCCESS! 99% accuracy achieved!`);
        console.log(`Best method: ${bestResult.method}`);
        console.log(`Accuracy: ${bestResult.accuracy.toFixed(2)}%`);
        console.log(`Cost per PDF: $${bestResult.cost}`);
    } else {
        console.log(`⚠️  Best accuracy: ${bestResult.accuracy.toFixed(2)}%`);
        console.log(`Gap to 99%: ${(targetAccuracy - bestResult.accuracy).toFixed(2)}%`);
        console.log(`Best method: ${bestResult.method}`);
    }
    
    console.log('\n📋 All Results:');
    results.forEach(r => {
        console.log(`  ${r.method}: ${r.accuracy.toFixed(2)}% (${r.securities} securities)`);
    });
    
    return results;
}

test99PercentAccuracy().catch(console.error);