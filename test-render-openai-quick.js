const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Multiple URLs to test
const TEST_URLS = [
    'https://pdf-fzzi.onrender.com',  // From previous tests
    'https://pdf-production-5dis.onrender.com',
    'https://pdf-main.onrender.com'
];

const PDF_PATH = './test-pdfs/Messos.pdf';

async function quickTest(baseUrl) {
    console.log(`\nTesting: ${baseUrl}`);
    console.log('='.repeat(50));
    
    try {
        // First check if server is alive
        const healthCheck = await fetch(`${baseUrl}/health`, { timeout: 5000 });
        if (!healthCheck.ok) {
            console.log(`❌ Server not responding: ${healthCheck.status}`);
            return null;
        }
        
        console.log('✅ Server is alive');
        
        // Test the main endpoint
        const form = new FormData();
        form.append('pdf', fs.createReadStream(PDF_PATH));
        
        const startTime = Date.now();
        const response = await fetch(`${baseUrl}/api/bulletproof-processor`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders(),
            timeout: 30000
        });
        
        const responseTime = Date.now() - startTime;
        
        if (!response.ok) {
            console.log(`❌ API Error: ${response.status}`);
            return null;
        }
        
        const result = await response.json();
        console.log(`Response Time: ${responseTime}ms`);
        
        // Quick OpenAI check
        const responseStr = JSON.stringify(result);
        const hasOpenAI = responseStr.toLowerCase().includes('openai') || 
                         responseStr.toLowerCase().includes('gpt-4') ||
                         responseStr.toLowerCase().includes('vision');
        
        console.log(`OpenAI indicators: ${hasOpenAI ? '✅ Found' : '❌ None'}`);
        
        // Accuracy check
        const total = result.total || result.totalValue || 0;
        const expected = 19464431;
        const accuracy = total > 0 ? ((expected - Math.abs(expected - total)) / expected * 100).toFixed(2) : 0;
        
        console.log(`Extracted: $${total.toLocaleString()}`);
        console.log(`Expected: $${expected.toLocaleString()}`);
        console.log(`Accuracy: ${accuracy}%`);
        
        // Check processing method
        if (result.metadata?.processingMethod) {
            console.log(`Processing Method: ${result.metadata.processingMethod}`);
        }
        
        return {
            url: baseUrl,
            working: true,
            accuracy: parseFloat(accuracy),
            hasOpenAI,
            responseTime,
            total
        };
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return null;
    }
}

async function testAllUrls() {
    console.log('Quick OpenAI Status Check - Testing Multiple URLs');
    console.log('=' * 60);
    
    const results = [];
    
    for (const url of TEST_URLS) {
        const result = await quickTest(url);
        if (result) results.push(result);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    
    if (results.length === 0) {
        console.log('❌ No working deployments found');
        return;
    }
    
    const workingDeployment = results.find(r => r.accuracy > 50) || results[0];
    
    console.log(`\n✅ Working deployment: ${workingDeployment.url}`);
    console.log(`   Accuracy: ${workingDeployment.accuracy}%`);
    console.log(`   OpenAI detected: ${workingDeployment.hasOpenAI ? 'YES' : 'NO'}`);
    console.log(`   Response time: ${workingDeployment.responseTime}ms`);
    
    // Final assessment
    console.log('\n' + '='.repeat(60));
    console.log('OPENAI STATUS ASSESSMENT:');
    console.log('='.repeat(60));
    
    if (!workingDeployment.hasOpenAI) {
        console.log('❌ OpenAI API is NOT active in current deployment');
        console.log('   - Environment variables may not be set');
        console.log('   - OpenAI endpoints are not being used');
        console.log('   - System is using text-only extraction');
        
        console.log('\n🔧 TO ACTIVATE OPENAI:');
        console.log('   1. Set OPENAI_API_KEY environment variable in Render');
        console.log('   2. Ensure /api/visual-pdf-extract endpoint exists');
        console.log('   3. Verify pdf2pic → OpenAI Vision pipeline is working');
        console.log('   4. Test with /api/visual-pdf-extract specifically');
    } else {
        console.log('✅ OpenAI API appears to be configured');
        console.log('   - OpenAI indicators found in responses');
        console.log('   - Vision processing may be active');
    }
    
    console.log(`\n📊 ACCURACY ANALYSIS:`);
    console.log(`   Current: ${workingDeployment.accuracy}%`);
    console.log(`   Target: 99%`);
    console.log(`   Gap: ${(99 - workingDeployment.accuracy).toFixed(2)}%`);
    
    if (workingDeployment.accuracy < 99) {
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('   1. OpenAI GPT-4 Vision typically achieves 95-97% on financial PDFs');
        console.log('   2. For 99% accuracy, you likely need Claude Vision or Azure');
        console.log('   3. Current text-based extraction is already quite good');
        console.log('   4. Consider cost vs. accuracy trade-off');
    }
    
    return workingDeployment;
}

testAllUrls().catch(console.error);