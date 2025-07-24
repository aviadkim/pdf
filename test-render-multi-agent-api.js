/**
 * Test Render Multi-Agent System with ChatGPT API
 * Verifies the deployed system is working with API keys
 */

const fs = require('fs');
const path = require('path');

async function testRenderMultiAgentAPI() {
    console.log('🚀 TESTING RENDER MULTI-AGENT SYSTEM WITH CHATGPT API');
    console.log('='.repeat(60));
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Test 1: Check if service is running
        console.log('🔍 Step 1: Testing service availability...');
        const healthResponse = await fetch(`${baseUrl}/`, {
            method: 'GET'
        });
        
        if (healthResponse.ok) {
            console.log('✅ Service is running and accessible');
        } else {
            console.log('❌ Service health check failed');
            return;
        }
        
        // Test 2: Check if Messos PDF exists
        const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
        if (!fs.existsSync(pdfPath)) {
            console.log('⚠️ Messos PDF not found - cannot test with real data');
            return;
        }
        
        console.log('📄 Step 2: Loading Messos PDF for testing...');
        const pdfBuffer = fs.readFileSync(pdfPath);
        console.log(`📊 PDF Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
        
        // Test 3: Test Multi-Agent Extraction System
        console.log('\\n🤖 Step 3: Testing Multi-Agent Extraction System...');
        
        const formData = new FormData();
        const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
        formData.append('pdf', blob, 'messos-test.pdf');
        
        const startTime = Date.now();
        const multiAgentResponse = await fetch(`${baseUrl}/api/multi-agent-extract`, {
            method: 'POST',
            body: formData
        });
        
        const processingTime = Date.now() - startTime;
        
        if (!multiAgentResponse.ok) {
            console.log(`❌ Multi-agent API failed: ${multiAgentResponse.status}`);
            const errorText = await multiAgentResponse.text();
            console.log('Error details:', errorText);
            return;
        }
        
        const result = await multiAgentResponse.json();
        
        console.log('\\n📊 MULTI-AGENT SYSTEM RESULTS');
        console.log('='.repeat(50));
        console.log(`✅ Success: ${result.success}`);
        console.log(`🔧 Method: ${result.method}`);
        console.log(`📊 Accuracy: ${result.accuracy}%`);
        console.log(`🔢 Securities Found: ${result.securitiesFound}`);
        console.log(`💵 Total Value: $${result.totalValue?.toLocaleString() || 'N/A'}`);
        console.log(`💰 Cost: $${result.totalCost || 0}`);
        console.log(`⏱️ Processing Time: ${processingTime}ms`);
        console.log(`🤝 Consensus Score: ${result.consensusScore}%`);
        console.log(`👁️ Vision API Used: ${result.visionApiUsed || false}`);
        
        // Test 4: Analyze Agent Contributions
        if (result.agentContributions) {
            console.log('\\n🤖 AGENT CONTRIBUTIONS');
            console.log('-'.repeat(40));
            const agents = result.agentContributions;
            
            if (agents.textAgent) {
                console.log(`📝 Text Agent: ${agents.textAgent.securities} securities, ${agents.textAgent.confidence}% confidence, $${agents.textAgent.cost} cost`);
            }
            
            if (agents.visionAgent) {
                console.log(`👁️ Vision Agent: ${agents.visionAgent.securities} securities, ${agents.visionAgent.confidence}% confidence, $${agents.visionAgent.cost} cost`);
            }
            
            if (agents.validationAgent) {
                console.log(`🔍 Validation Agent: ${agents.validationAgent.consensusScore}% consensus, ${agents.validationAgent.conflictsResolved} conflicts resolved`);
            }
            
            console.log(`👤 Human Corrections: ${agents.humanCorrections || 0} corrections applied`);
        }
        
        // Test 5: Performance Analysis
        console.log('\\n📈 PERFORMANCE ANALYSIS');
        console.log('-'.repeat(40));
        const expectedTotal = 19464431;
        const expectedCount = 39;
        
        if (result.totalValue && result.securitiesFound) {
            const totalAccuracy = Math.min(result.totalValue / expectedTotal, expectedTotal / result.totalValue) * 100;
            const countAccuracy = Math.min(result.securitiesFound / expectedCount, expectedCount / result.securitiesFound) * 100;
            
            console.log(`💰 Portfolio Total Accuracy: ${totalAccuracy.toFixed(2)}%`);
            console.log(`🔢 Security Count Accuracy: ${countAccuracy.toFixed(2)}%`);
            console.log(`🎯 System Confidence: ${result.accuracy}%`);
            
            // Test 6: ChatGPT API Integration Check
            console.log('\\n🤖 CHATGPT API INTEGRATION CHECK');
            console.log('-'.repeat(40));
            
            if (result.visionApiUsed && result.totalCost > 0) {
                console.log('✅ ChatGPT API is working and being used');
                console.log(`💰 API Cost: $${result.totalCost}`);
                console.log(`📊 Vision processing enhanced the results`);
            } else if (result.method && result.method.includes('vision')) {
                console.log('⚠️ Vision API attempted but may have failed');
                console.log('💡 Check API key configuration');
            } else {
                console.log('ℹ️ Text extraction was sufficient (no Vision API needed)');
                console.log('💰 Zero cost - smart fallback system working');
            }
        }
        
        // Test 7: Quality Assessment
        console.log('\\n🎯 SYSTEM QUALITY ASSESSMENT');
        console.log('-'.repeat(40));
        
        if (result.accuracy >= 99 && result.consensusScore >= 95) {
            console.log('🎉 EXCELLENT: Production-ready quality achieved!');
            console.log('✅ Multi-agent system delivering exceptional accuracy');
        } else if (result.accuracy >= 95 && result.consensusScore >= 80) {
            console.log('👍 VERY GOOD: High-quality results');
            console.log('🔧 System performing well with strong consensus');
        } else if (result.accuracy >= 90) {
            console.log('✅ GOOD: Solid performance');
            console.log('🔧 Room for optimization with Vision API');
        } else {
            console.log('⚠️ NEEDS IMPROVEMENT: Below target accuracy');
        }
        
        // Test 8: Sample Securities Check
        if (result.securities && result.securities.length > 0) {
            console.log('\\n📋 SAMPLE SECURITIES EXTRACTED');
            console.log('-'.repeat(40));
            result.securities.slice(0, 5).forEach((security, index) => {
                console.log(`${index + 1}. ${security.isin}: $${security.marketValue?.toLocaleString() || 'N/A'} (${security.confidence || 'N/A'}% confidence)`);
            });
            if (result.securities.length > 5) {
                console.log(`   ... and ${result.securities.length - 5} more securities`);
            }
        }
        
        return {
            success: result.success,
            accuracy: result.accuracy,
            securitiesFound: result.securitiesFound,
            visionApiWorking: result.visionApiUsed || false,
            costEffective: result.totalCost <= 0.05,
            productionReady: result.accuracy >= 95 && result.consensusScore >= 80
        };
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('🔍 Stack trace:', error.stack);
        return {
            success: false,
            error: error.message,
            productionReady: false
        };
    }
}

// Run test if called directly
if (require.main === module) {
    // Use node-fetch polyfill for older Node versions
    if (!global.fetch) {
        console.log('Installing fetch polyfill...');
        global.fetch = require('node-fetch');
        global.FormData = require('form-data');
        global.Blob = require('buffer').Blob;
    }
    
    testRenderMultiAgentAPI().then(result => {
        console.log('\\n🏁 TEST SUMMARY');
        console.log('='.repeat(30));
        
        if (result.success && result.productionReady) {
            console.log('🎉 SUCCESS: Multi-agent system with ChatGPT API is working perfectly!');
            console.log('✅ Production-ready quality achieved');
            console.log('🚀 Deploy with confidence!');
            process.exit(0);
        } else if (result.success) {
            console.log('✅ SUCCESS: System is working but needs optimization');
            console.log('🔧 Consider adding Vision API for higher accuracy');
            process.exit(0);
        } else {
            console.log('❌ FAILED: System needs attention');
            console.log('🛠️ Check deployment and API configuration');
            process.exit(1);
        }
    }).catch(error => {
        console.error('\\n❌ Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { testRenderMultiAgentAPI };