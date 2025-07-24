const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'https://pdf-production-5dis.onrender.com';
const PDF_PATH = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
const EXPECTED_TOTAL = 19464431; // Target total from PDF: $19,464,431

console.log('🔬 COMPREHENSIVE PDF EXTRACTION SERVICE TEST');
console.log('='.repeat(60));
console.log(`📍 Testing service: ${BASE_URL}`);
console.log(`📄 Using PDF: ${PDF_PATH}`);
console.log(`🎯 Expected total: $${EXPECTED_TOTAL.toLocaleString()}`);
console.log('');

async function testEndpoint(endpoint, method = 'GET', data = null) {
    const startTime = Date.now();
    console.log(`📡 Testing ${method} ${endpoint}...`);
    
    try {
        let options = {
            method: method,
            headers: {
                'User-Agent': 'PDF-Extraction-Test/1.0'
            }
        };

        if (data) {
            const FormData = require('form-data');
            const form = new FormData();
            
            if (fs.existsSync(PDF_PATH)) {
                form.append('pdf', fs.createReadStream(PDF_PATH));
            } else {
                throw new Error('PDF file not found');
            }
            
            options.body = form;
            options.headers = {
                ...options.headers,
                ...form.getHeaders()
            };
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const responseTime = Date.now() - startTime;
        
        let responseData;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        return {
            status: response.status,
            responseTime,
            data: responseData,
            contentType,
            success: response.ok
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        return {
            status: 0,
            responseTime,
            error: error.message,
            success: false
        };
    }
}

function analyzeExtraction(result) {
    console.log('📊 EXTRACTION ANALYSIS:');
    
    if (!result.success) {
        console.log(`❌ Request failed: ${result.error || result.status}`);
        return;
    }

    try {
        let data = result.data;
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        // Look for various total fields
        const possibleTotals = [
            data.totalValue,
            data.total,
            data.portfolioTotal,
            data.extracted_total,
            data.totalPortfolioValue
        ];

        let extractedTotal = null;
        for (const total of possibleTotals) {
            if (total && typeof total === 'number') {
                extractedTotal = total;
                break;
            }
        }

        if (extractedTotal) {
            const accuracy = ((extractedTotal / EXPECTED_TOTAL) * 100);
            const difference = Math.abs(extractedTotal - EXPECTED_TOTAL);
            
            console.log(`💰 Extracted Total: $${extractedTotal.toLocaleString()}`);
            console.log(`🎯 Expected Total: $${EXPECTED_TOTAL.toLocaleString()}`);
            console.log(`📈 Accuracy: ${accuracy.toFixed(2)}%`);
            console.log(`📊 Difference: $${difference.toLocaleString()}`);
            
            if (accuracy >= 99) {
                console.log('✅ EXCELLENT: 99%+ accuracy achieved!');
            } else if (accuracy >= 90) {
                console.log('✅ GOOD: 90%+ accuracy achieved');
            } else if (accuracy >= 70) {
                console.log('⚠️ FAIR: 70%+ accuracy');
            } else {
                console.log('❌ POOR: <70% accuracy');
            }
        }

        // Count securities if available
        const securities = data.securities || data.holdings || data.positions || [];
        if (Array.isArray(securities)) {
            console.log(`🔢 Securities found: ${securities.length}`);
            
            // Expected securities from the PDF
            const expectedSecurities = 40; // Approximate from PDF analysis
            if (securities.length >= expectedSecurities * 0.9) {
                console.log('✅ Good security detection');
            } else {
                console.log('⚠️ Some securities may be missing');
            }
        }

        // Check response structure
        console.log(`📋 Response structure: ${Object.keys(data).join(', ')}`);
        
    } catch (error) {
        console.log(`❌ Analysis error: ${error.message}`);
    }
}

function printResults(endpoint, result) {
    console.log(`\n📊 RESULTS for ${endpoint}:`);
    console.log(`Status: ${result.success ? '✅' : '❌'} ${result.status}`);
    console.log(`Response Time: ${result.responseTime}ms`);
    console.log(`Content-Type: ${result.contentType || 'N/A'}`);
    
    if (result.success && endpoint.includes('api/')) {
        analyzeExtraction(result);
    } else if (!result.success) {
        console.log(`Error: ${result.error || 'Request failed'}`);
    }
    
    console.log('-'.repeat(50));
}

async function runComprehensiveTests() {
    console.log('🚀 Starting comprehensive tests...\n');

    // Test 1: System capabilities
    console.log('🔧 TEST 1: System Capabilities');
    const capabilitiesResult = await testEndpoint('/api/system-capabilities');
    printResults('/api/system-capabilities', capabilitiesResult);

    // Test 2: Root endpoint
    console.log('🏠 TEST 2: Root Endpoint');
    const rootResult = await testEndpoint('/');
    printResults('/', rootResult);

    // Test 3: Available extraction endpoints based on capabilities
    const extractionEndpoints = [
        '/api/ultra-accurate-extract',
        '/api/phase2-enhanced-extract', 
        '/api/bulletproof-processor',
        '/api/extract',
        '/api/pdf-extract'
    ];

    console.log('📄 TESTING PDF EXTRACTION ENDPOINTS:');
    
    for (const endpoint of extractionEndpoints) {
        console.log(`\n🧪 TEST: ${endpoint}`);
        const result = await testEndpoint(endpoint, 'POST', true);
        printResults(endpoint, result);
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Test 4: Performance analysis
    console.log('\n⚡ PERFORMANCE SUMMARY:');
    // This would be filled in by the actual test results above
    
    console.log('\n🎉 COMPREHENSIVE TEST COMPLETE!');
}

// Run the tests
if (require.main === module) {
    runComprehensiveTests().catch(console.error);
}

module.exports = { testEndpoint, analyzeExtraction };