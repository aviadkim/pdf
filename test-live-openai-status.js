const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const RENDER_URLS = [
    'https://pdf-production-5dis.onrender.com',
    'https://pdf-fzzi.onrender.com'
];

const PDF_PATH = './2. Messos  - 31.03.2025.pdf';

async function testServiceHealth(url) {
    try {
        const response = await fetch(url, { 
            method: 'GET',
            timeout: 10000 
        });
        return {
            status: response.status,
            working: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        };
    } catch (error) {
        return {
            status: 'error',
            working: false,
            error: error.message
        };
    }
}

async function testOpenAIEndpoint(baseUrl, endpoint = '/api/bulletproof-processor') {
    console.log(`\nTesting: ${baseUrl}${endpoint}`);
    console.log('-'.repeat(60));
    
    try {
        // Check if PDF file exists
        if (!fs.existsSync(PDF_PATH)) {
            console.log(`❌ PDF file not found: ${PDF_PATH}`);
            return null;
        }
        
        const form = new FormData();
        form.append('pdf', fs.createReadStream(PDF_PATH));
        
        console.log('📤 Uploading PDF...');
        const startTime = Date.now();
        
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders(),
            timeout: 60000  // 60 second timeout
        });
        
        const responseTime = Date.now() - startTime;
        console.log(`⏱️  Response time: ${responseTime}ms`);
        
        if (!response.ok) {
            console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.log(`Error details: ${errorText.substring(0, 200)}...`);
            return { error: `HTTP ${response.status}`, responseTime };
        }
        
        const result = await response.json();
        console.log('✅ Response received successfully');
        
        // Analyze for OpenAI indicators
        const analysis = analyzeOpenAIUsage(result);
        
        // Check accuracy
        const total = result.total || result.totalValue || 0;
        const expected = 19464431;
        const accuracy = total > 0 ? ((expected - Math.abs(expected - total)) / expected * 100).toFixed(2) : 0;
        
        console.log(`📊 Total extracted: $${total.toLocaleString()}`);
        console.log(`🎯 Expected: $${expected.toLocaleString()}`);
        console.log(`📈 Accuracy: ${accuracy}%`);
        console.log(`🔢 Securities found: ${result.securities?.length || 0}`);
        
        // Show OpenAI analysis
        console.log('\n🔍 OpenAI Analysis:');
        Object.entries(analysis).forEach(([key, value]) => {
            const icon = value ? '✅' : '❌';
            console.log(`   ${icon} ${key}: ${value}`);
        });
        
        return {
            url: baseUrl,
            endpoint,
            working: true,
            responseTime,
            accuracy: parseFloat(accuracy),
            total,
            securitiesCount: result.securities?.length || 0,
            openaiAnalysis: analysis,
            metadata: result.metadata || {},
            hasError: !!result.error
        };
        
    } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
        return { 
            url: baseUrl, 
            endpoint, 
            error: error.message, 
            working: false 
        };
    }
}

function analyzeOpenAIUsage(result) {
    const responseStr = JSON.stringify(result).toLowerCase();
    
    return {
        'openai_mentioned': responseStr.includes('openai') || responseStr.includes('gpt'),
        'vision_processing': responseStr.includes('vision') || responseStr.includes('image'),
        'pdf2pic_conversion': responseStr.includes('pdf2pic') || responseStr.includes('convert'),
        'confidence_scores': responseStr.includes('confidence') || responseStr.includes('score'),
        'bounding_boxes': responseStr.includes('boundingbox') || responseStr.includes('bbox'),
        'processing_method_specified': !!(result.metadata?.processingMethod || result.processingMethod),
        'debug_info_present': !!(result.debug || result.debugInfo || result.metadata?.debug),
        'image_files_mentioned': responseStr.includes('.png') || responseStr.includes('.jpg'),
        'ai_model_response': responseStr.includes('model') || responseStr.includes('api_response')
    };
}

async function comprehensiveOpenAITest() {
    console.log('🔍 COMPREHENSIVE OPENAI STATUS CHECK');
    console.log('='.repeat(60));
    console.log(`Testing PDF: ${PDF_PATH}`);
    console.log(`File size: ${fs.statSync(PDF_PATH).size} bytes`);
    
    const results = [];
    
    // Test each service
    for (const url of RENDER_URLS) {
        console.log(`\n🌐 Testing service: ${url}`);
        console.log('='.repeat(60));
        
        // First check if service is alive
        const health = await testServiceHealth(url);
        console.log(`Health check: ${health.working ? '✅ ONLINE' : '❌ OFFLINE'}`);
        
        if (!health.working) {
            console.log(`Status: ${health.status}`);
            if (health.error) console.log(`Error: ${health.error}`);
            continue;
        }
        
        // Test multiple endpoints that might use OpenAI
        const endpoints = [
            '/api/bulletproof-processor',
            '/api/visual-pdf-extract',
            '/api/ultra-99-percent',
            '/api/pdf-extract'
        ];
        
        for (const endpoint of endpoints) {
            const result = await testOpenAIEndpoint(url, endpoint);
            if (result) {
                results.push(result);
            }
            
            // Small delay between endpoint tests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Generate comprehensive report
    console.log('\n📋 COMPREHENSIVE ANALYSIS');
    console.log('='.repeat(60));
    
    const workingResults = results.filter(r => r.working);
    
    if (workingResults.length === 0) {
        console.log('❌ NO WORKING ENDPOINTS FOUND');
        console.log('\n🔧 TROUBLESHOOTING STEPS:');
        console.log('1. Check if Render services are properly deployed');
        console.log('2. Verify environment variables are set');
        console.log('3. Check service logs in Render dashboard');
        console.log('4. Ensure PDF file exists and is accessible');
        return;
    }
    
    // Find best performing endpoint
    const bestResult = workingResults.reduce((best, current) => 
        current.accuracy > best.accuracy ? current : best
    );
    
    console.log(`🏆 BEST PERFORMING ENDPOINT:`);
    console.log(`   URL: ${bestResult.url}${bestResult.endpoint}`);
    console.log(`   Accuracy: ${bestResult.accuracy}%`);
    console.log(`   Response time: ${bestResult.responseTime}ms`);
    console.log(`   Securities found: ${bestResult.securitiesCount}`);
    
    // OpenAI Status Summary
    const openaiIndicators = workingResults.map(r => r.openaiAnalysis);
    const hasAnyOpenAI = openaiIndicators.some(analysis => 
        analysis.openai_mentioned || 
        analysis.vision_processing || 
        analysis.processing_method_specified
    );
    
    console.log(`\n🤖 OPENAI STATUS: ${hasAnyOpenAI ? '✅ DETECTED' : '❌ NOT DETECTED'}`);
    
    if (hasAnyOpenAI) {
        console.log('\n✅ OpenAI indicators found:');
        const indicators = ['openai_mentioned', 'vision_processing', 'pdf2pic_conversion', 'confidence_scores'];
        indicators.forEach(indicator => {
            const hasIndicator = openaiIndicators.some(analysis => analysis[indicator]);
            if (hasIndicator) {
                console.log(`   • ${indicator.replace('_', ' ')}`);
            }
        });
    } else {
        console.log('\n❌ No OpenAI indicators found:');
        console.log('   • No OpenAI API mentions in responses');
        console.log('   • No vision processing indicators');
        console.log('   • No image conversion evidence');
        console.log('   • Likely using text-only extraction');
    }
    
    // Accuracy assessment
    console.log(`\n📊 ACCURACY ASSESSMENT:`);
    console.log(`   Current best: ${bestResult.accuracy}%`);
    console.log(`   Target: 99%`);
    console.log(`   Gap to target: ${(99 - bestResult.accuracy).toFixed(2)}%`);
    
    // Final recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (!hasAnyOpenAI) {
        console.log('1. ❌ OpenAI API is NOT properly configured');
        console.log('   → Set OPENAI_API_KEY environment variable in Render dashboard');
        console.log('   → Ensure OpenAI endpoints are implemented in express-server.js');
        console.log('   → Verify pdf2pic → OpenAI Vision pipeline is working');
        console.log('');
        console.log('2. 🎯 To reach 99% accuracy WITHOUT OpenAI:');
        console.log('   → Current text extraction is achieving ' + bestResult.accuracy + '%');
        console.log('   → This is already quite good for text-only processing');
        console.log('   → Claude Vision or Azure would be needed for 99%');
    } else {
        console.log('1. ✅ OpenAI appears to be configured');
        console.log('   → Vision processing indicators detected');
        console.log('   → May need fine-tuning for better accuracy');
    }
    
    console.log('\n3. 💰 COST vs ACCURACY ANALYSIS:');
    console.log(`   → OpenAI GPT-4 Vision: ~95-97% accuracy, moderate cost`);
    console.log(`   → Claude Vision: ~98-99% accuracy, higher cost`);
    console.log(`   → Current text-only: ${bestResult.accuracy}% accuracy, minimal cost`);
    console.log(`   → For ${bestResult.accuracy}% → 99% improvement, consider if ${(99 - bestResult.accuracy).toFixed(1)}% gain justifies API costs`);
    
    // Save detailed report
    const reportData = {
        timestamp: new Date().toISOString(),
        testResults: workingResults,
        openaiStatus: {
            detected: hasAnyOpenAI,
            configured: hasAnyOpenAI,
            workingEndpoints: workingResults.length
        },
        accuracyAnalysis: {
            current: bestResult.accuracy,
            target: 99,
            gap: 99 - bestResult.accuracy,
            bestEndpoint: `${bestResult.url}${bestResult.endpoint}`
        },
        recommendations: {
            openaiWorking: hasAnyOpenAI,
            needsConfiguration: !hasAnyOpenAI,
            canReach99WithOpenAI: false,  // OpenAI typically 95-97% on financial docs
            suggestedApproach: bestResult.accuracy > 90 ? 'Current accuracy is good, consider cost vs benefit' : 'Needs improvement'
        }
    };
    
    const reportFile = `openai-comprehensive-report-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Detailed report saved: ${reportFile}`);
    
    return reportData;
}

// Run the comprehensive test
comprehensiveOpenAITest().catch(console.error);