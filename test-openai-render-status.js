const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const API_URL = 'https://pdf-production-5dis.onrender.com';
const PDF_PATH = './test-pdfs/Messos.pdf';

async function testEndpoint(endpoint, description) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${endpoint}`);
    console.log(`Description: ${description}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
        const form = new FormData();
        form.append('pdf', fs.createReadStream(PDF_PATH));
        
        const startTime = Date.now();
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });
        
        const responseTime = Date.now() - startTime;
        const result = await response.json();
        
        console.log(`\nStatus: ${response.status}`);
        console.log(`Response Time: ${responseTime}ms`);
        
        // Check for OpenAI indicators
        const openaiIndicators = {
            hasVisionProcessing: false,
            hasImageConversion: false,
            hasOpenAIError: false,
            hasOpenAISuccess: false,
            processingMethod: 'unknown',
            hasConfidenceScores: false,
            hasDebugInfo: false
        };
        
        // Analyze response for OpenAI usage
        const responseStr = JSON.stringify(result);
        
        // Check for vision/image processing indicators
        if (responseStr.includes('vision') || responseStr.includes('Vision') || 
            responseStr.includes('image') || responseStr.includes('Image')) {
            openaiIndicators.hasVisionProcessing = true;
        }
        
        // Check for pdf2pic or image conversion
        if (responseStr.includes('pdf2pic') || responseStr.includes('convert') || 
            responseStr.includes('png') || responseStr.includes('jpg')) {
            openaiIndicators.hasImageConversion = true;
        }
        
        // Check for OpenAI errors
        if (responseStr.includes('openai') || responseStr.includes('OpenAI') || 
            responseStr.includes('gpt-4') || responseStr.includes('GPT-4')) {
            if (responseStr.includes('error') || responseStr.includes('Error')) {
                openaiIndicators.hasOpenAIError = true;
            } else {
                openaiIndicators.hasOpenAISuccess = true;
            }
        }
        
        // Check for confidence scores (typical of AI vision)
        if (responseStr.includes('confidence') || responseStr.includes('score')) {
            openaiIndicators.hasConfidenceScores = true;
        }
        
        // Check for debug information
        if (result.debug || result.metadata || result.processingInfo) {
            openaiIndicators.hasDebugInfo = true;
        }
        
        // Determine processing method
        if (result.metadata?.processingMethod) {
            openaiIndicators.processingMethod = result.metadata.processingMethod;
        } else if (result.processingMethod) {
            openaiIndicators.processingMethod = result.processingMethod;
        }
        
        console.log('\nOpenAI Indicators:');
        console.log(JSON.stringify(openaiIndicators, null, 2));
        
        // Check accuracy
        if (result.total || result.totalValue) {
            const total = result.total || result.totalValue || 0;
            const expected = 19464431;
            const accuracy = ((expected - Math.abs(expected - total)) / expected * 100).toFixed(2);
            console.log(`\nTotal Extracted: $${total.toLocaleString()}`);
            console.log(`Expected: $${expected.toLocaleString()}`);
            console.log(`Accuracy: ${accuracy}%`);
        }
        
        // Show metadata if available
        if (result.metadata) {
            console.log('\nMetadata:');
            console.log(JSON.stringify(result.metadata, null, 2));
        }
        
        // Show any debug info
        if (result.debug || result.debugInfo) {
            console.log('\nDebug Info:');
            console.log(JSON.stringify(result.debug || result.debugInfo, null, 2));
        }
        
        // Show processing details
        if (result.processingDetails || result.extractionMethod) {
            console.log('\nProcessing Details:');
            console.log(JSON.stringify(result.processingDetails || result.extractionMethod, null, 2));
        }
        
        // Check for specific OpenAI response patterns
        if (result.securities && result.securities.length > 0) {
            const firstSecurity = result.securities[0];
            if (firstSecurity.confidence || firstSecurity.boundingBox || firstSecurity.pageNumber) {
                console.log('\n✅ Vision-based extraction detected (confidence/bounding box data)');
                openaiIndicators.hasVisionProcessing = true;
            }
        }
        
        return {
            endpoint,
            responseTime,
            openaiIndicators,
            accuracy: result.total ? ((19464431 - Math.abs(19464431 - result.total)) / 19464431 * 100).toFixed(2) : null,
            securitiesCount: result.securities?.length || 0,
            hasError: result.error || false
        };
        
    } catch (error) {
        console.error(`Error testing ${endpoint}:`, error.message);
        return {
            endpoint,
            error: error.message,
            openaiIndicators: null
        };
    }
}

async function analyzeOpenAIStatus() {
    console.log('OpenAI API Status Check on Render Production');
    console.log('URL:', API_URL);
    console.log('Testing with:', PDF_PATH);
    
    const endpoints = [
        { path: '/api/visual-pdf-extract', desc: 'Visual PDF extraction (should use OpenAI Vision)' },
        { path: '/api/ultra-99-percent', desc: 'Ultra accuracy endpoint (might use OpenAI)' },
        { path: '/api/pdf-extract', desc: 'Standard PDF extraction' },
        { path: '/api/bulletproof-processor', desc: 'Bulletproof processor' },
        { path: '/api/enhanced-accuracy', desc: 'Enhanced accuracy endpoint' }
    ];
    
    const results = [];
    
    for (const ep of endpoints) {
        const result = await testEndpoint(ep.path, ep.desc);
        results.push(result);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary analysis
    console.log('\n' + '='.repeat(60));
    console.log('OPENAI API STATUS SUMMARY');
    console.log('='.repeat(60));
    
    let openaiDetected = false;
    let visionProcessingFound = false;
    let highestAccuracy = 0;
    let bestEndpoint = '';
    
    results.forEach(r => {
        if (r.openaiIndicators) {
            if (r.openaiIndicators.hasOpenAISuccess) openaiDetected = true;
            if (r.openaiIndicators.hasVisionProcessing) visionProcessingFound = true;
            
            if (r.accuracy && parseFloat(r.accuracy) > highestAccuracy) {
                highestAccuracy = parseFloat(r.accuracy);
                bestEndpoint = r.endpoint;
            }
        }
    });
    
    console.log(`\nOpenAI API Detected: ${openaiDetected ? '✅ YES' : '❌ NO'}`);
    console.log(`Vision Processing Found: ${visionProcessingFound ? '✅ YES' : '❌ NO'}`);
    console.log(`Highest Accuracy: ${highestAccuracy}% (${bestEndpoint})`);
    
    // Check response time patterns (vision processing is typically slower)
    const avgResponseTimes = {};
    results.forEach(r => {
        if (r.responseTime) {
            avgResponseTimes[r.endpoint] = r.responseTime;
        }
    });
    
    console.log('\nResponse Times (ms):');
    Object.entries(avgResponseTimes).forEach(([ep, time]) => {
        console.log(`  ${ep}: ${time}ms ${time > 5000 ? '(slow - might indicate vision processing)' : ''}`);
    });
    
    // Final assessment
    console.log('\n' + '='.repeat(60));
    console.log('ASSESSMENT:');
    console.log('='.repeat(60));
    
    if (!openaiDetected && !visionProcessingFound) {
        console.log('❌ OpenAI API does NOT appear to be active or properly configured');
        console.log('   - No vision processing indicators found');
        console.log('   - No OpenAI-specific metadata or errors detected');
        console.log('   - All endpoints appear to use text-only extraction');
    } else {
        console.log('✅ OpenAI API appears to be partially configured');
        console.log('   - Some vision processing indicators detected');
        console.log('   - Further configuration may be needed for full functionality');
    }
    
    console.log(`\nCurrent Best Accuracy: ${highestAccuracy}%`);
    console.log(`Target Accuracy: 99%`);
    console.log(`Gap to Target: ${(99 - highestAccuracy).toFixed(2)}%`);
    
    if (highestAccuracy < 99) {
        console.log('\nTO REACH 99% ACCURACY:');
        console.log('1. OpenAI Vision API alone might achieve 95-97% on complex financial PDFs');
        console.log('2. Claude Vision API typically achieves 98-99.5% accuracy');
        console.log('3. Azure AI Document Intelligence can achieve 99%+ with proper training');
        console.log('\nRECOMMENDATION: OpenAI alone is unlikely to reach 99% on complex financial documents.');
        console.log('Consider using Claude Vision or Azure for the highest accuracy requirements.');
    }
    
    // Save detailed results
    const reportData = {
        timestamp: new Date().toISOString(),
        url: API_URL,
        openaiStatus: {
            detected: openaiDetected,
            visionProcessingFound,
            configured: openaiDetected || visionProcessingFound
        },
        accuracyAnalysis: {
            current: highestAccuracy,
            target: 99,
            gap: 99 - highestAccuracy,
            bestEndpoint
        },
        endpointResults: results,
        recommendation: highestAccuracy < 99 ? 
            'OpenAI alone insufficient for 99% target. Consider Claude/Azure.' : 
            'Current configuration meets accuracy target.'
    };
    
    fs.writeFileSync(
        `openai-status-report-${Date.now()}.json`,
        JSON.stringify(reportData, null, 2)
    );
    
    console.log('\nDetailed report saved to: openai-status-report-*.json');
}

// Run the analysis
analyzeOpenAIStatus().catch(console.error);