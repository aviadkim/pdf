const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const RENDER_URL = 'https://pdf-fzzi.onrender.com';
const PDF_PATH = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
const EXPECTED_TOTAL_SECURITIES = 40;
const EXPECTED_VALUE = 19464431;
const PROBLEMATIC_ISIN = 'XS2746319610';

async function runFinalDeploymentTest() {
    console.log('🚀 FINAL RENDER DEPLOYMENT TEST');
    console.log('=====================================');
    console.log('Target URL:', RENDER_URL);
    console.log('Expected:', EXPECTED_TOTAL_SECURITIES, 'securities totaling $' + EXPECTED_VALUE.toLocaleString());
    console.log('');
    
    const testResults = {
        homepage: null,
        standardProcessor: null,
        multiAgentProcessor: null,
        recommendations: []
    };
    
    // Test 1: Home Page
    console.log('1. 🏠 Testing Home Page');
    console.log('==============================');
    
    try {
        const response = await axios.get(RENDER_URL, { timeout: 15000 });
        const isExpectedInterface = response.data.includes('Multi-Agent') && response.data.includes('form');
        
        testResults.homepage = {
            status: response.status,
            content: response.data.substring(0, 100) + '...',
            isExpectedInterface: isExpectedInterface,
            contentLength: response.data.length
        };
        
        if (isExpectedInterface) {
            console.log('✅ Multi-agent interface detected');
        } else {
            console.log('❌ Shows placeholder content:', response.data.trim());
            testResults.recommendations.push('Fix home page to show multi-agent interface');
        }
        
    } catch (error) {
        console.log('❌ Home page test failed:', error.message);
        testResults.homepage = { error: error.message };
    }
    
    console.log('');
    
    // Test 2: Standard Processor
    console.log('2. 🔧 Testing Standard Processor');
    console.log('==============================');
    
    try {
        if (!fs.existsSync(PDF_PATH)) {
            throw new Error('PDF file not found');
        }
        
        const form = new FormData();
        form.append('pdf', fs.createReadStream(PDF_PATH));
        
        const startTime = Date.now();
        const response = await axios.post(`${RENDER_URL}/api/bulletproof-processor`, form, {
            headers: form.getHeaders(),
            timeout: 120000
        });
        const processingTime = Date.now() - startTime;
        
        const result = response.data;
        const securities = result.securities || [];
        const problematicSecurity = securities.find(s => s.isin === PROBLEMATIC_ISIN);
        
        testResults.standardProcessor = {
            success: true,
            processingTime: processingTime,
            totalSecurities: securities.length,
            expectedSecurities: EXPECTED_TOTAL_SECURITIES,
            foundProblematicISIN: !!problematicSecurity,
            problematicValue: problematicSecurity ? (problematicSecurity.notionalAmount || problematicSecurity.amount || problematicSecurity.value) : null,
            accuracy: ((securities.length / EXPECTED_TOTAL_SECURITIES) * 100).toFixed(1),
            enhancedExtraction: result.metadata?.enhancedExtraction || false
        };
        
        console.log(`✅ Standard processor working`);
        console.log(`📊 Found ${securities.length}/${EXPECTED_TOTAL_SECURITIES} securities (${testResults.standardProcessor.accuracy}%)`);
        console.log(`⏱️  Processing time: ${(processingTime/1000).toFixed(2)}s`);
        
        if (problematicSecurity) {
            const value = problematicSecurity.notionalAmount || problematicSecurity.amount || problematicSecurity.value;
            console.log(`🔍 Problematic ISIN ${PROBLEMATIC_ISIN}: ${value}`);
            
            const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
            if (numValue && numValue === 140000) {
                console.log('✅ Problematic value correctly fixed to $140,000');
            } else {
                console.log(`⚠️  Unexpected value: ${numValue}`);
            }
        }
        
        if (securities.length < EXPECTED_TOTAL_SECURITIES) {
            testResults.recommendations.push(`Standard processor found ${securities.length}/${EXPECTED_TOTAL_SECURITIES} securities - multi-agent should improve this`);
        }
        
    } catch (error) {
        console.log('❌ Standard processor failed:', error.message);
        testResults.standardProcessor = { error: error.message };
        testResults.recommendations.push('Fix standard processor endpoint');
    }
    
    console.log('');
    
    // Test 3: Multi-Agent Processor
    console.log('3. 🤖 Testing Multi-Agent Processor');
    console.log('==============================');
    
    try {
        if (!fs.existsSync(PDF_PATH)) {
            throw new Error('PDF file not found');
        }
        
        const form = new FormData();
        form.append('pdf', fs.createReadStream(PDF_PATH));
        form.append('enableLLM', 'true');
        
        const startTime = Date.now();
        const response = await axios.post(`${RENDER_URL}/api/complete-processor`, form, {
            headers: form.getHeaders(),
            timeout: 120000
        });
        const processingTime = Date.now() - startTime;
        
        const result = response.data;
        const securities = result.securities || [];
        
        testResults.multiAgentProcessor = {
            success: true,
            processingTime: processingTime,
            totalSecurities: securities.length,
            expectedSecurities: EXPECTED_TOTAL_SECURITIES,
            accuracy: ((securities.length / EXPECTED_TOTAL_SECURITIES) * 100).toFixed(1),
            llmEnhanced: result.metadata?.llmEnhanced || false,
            multiAgent: true
        };
        
        console.log(`✅ Multi-agent processor working`);
        console.log(`📊 Found ${securities.length}/${EXPECTED_TOTAL_SECURITIES} securities (${testResults.multiAgentProcessor.accuracy}%)`);
        console.log(`⏱️  Processing time: ${(processingTime/1000).toFixed(2)}s`);
        console.log(`🧠 LLM Enhanced: ${result.metadata?.llmEnhanced || false}`);
        
        if (securities.length === EXPECTED_TOTAL_SECURITIES) {
            console.log('🎯 Perfect accuracy - found all expected securities!');
        } else if (securities.length > testResults.standardProcessor?.totalSecurities) {
            console.log(`📈 Improvement over standard: +${securities.length - testResults.standardProcessor.totalSecurities} securities`);
        } else {
            console.log('⚠️  No improvement over standard processor');
        }
        
    } catch (error) {
        console.log('❌ Multi-agent processor failed:', error.message);
        testResults.multiAgentProcessor = { error: error.message };
        
        if (error.response?.status === 404) {
            testResults.recommendations.push('Add missing CompleteFinancialParser import to express-server.js');
        } else {
            testResults.recommendations.push('Fix multi-agent processor endpoint');
        }
    }
    
    console.log('');
    
    // Summary
    console.log('🏁 FINAL SUMMARY');
    console.log('==============================');
    
    const homePageWorking = testResults.homepage?.isExpectedInterface;
    const standardWorking = testResults.standardProcessor?.success;
    const multiAgentWorking = testResults.multiAgentProcessor?.success;
    
    console.log(`Home Page Interface: ${homePageWorking ? '✅' : '❌'}`);
    console.log(`Standard Processor: ${standardWorking ? '✅' : '❌'}`);
    console.log(`Multi-Agent Processor: ${multiAgentWorking ? '✅' : '❌'}`);
    
    if (standardWorking && multiAgentWorking) {
        console.log('\n🎯 COMPARISON RESULTS:');
        const standardCount = testResults.standardProcessor.totalSecurities;
        const multiAgentCount = testResults.multiAgentProcessor.totalSecurities;
        
        console.log(`Standard: ${standardCount} securities`);
        console.log(`Multi-Agent: ${multiAgentCount} securities`);
        
        if (multiAgentCount > standardCount) {
            console.log(`✅ Multi-agent found ${multiAgentCount - standardCount} more securities`);
        } else if (multiAgentCount === standardCount) {
            console.log('⚖️  Same number of securities found');
        } else {
            console.log(`❌ Multi-agent found ${standardCount - multiAgentCount} fewer securities`);
        }
    }
    
    console.log('\n🔧 RECOMMENDATIONS:');
    if (testResults.recommendations.length === 0) {
        console.log('✅ No issues found - deployment is fully functional');
    } else {
        testResults.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
    }
    
    console.log('\n🔗 ACCESS URLS:');
    console.log(`Home Page: ${RENDER_URL}`);
    console.log(`Standard API: ${RENDER_URL}/api/bulletproof-processor`);
    console.log(`Multi-Agent API: ${RENDER_URL}/api/complete-processor`);
    
    return testResults;
}

if (require.main === module) {
    runFinalDeploymentTest().catch(console.error);
}

module.exports = { runFinalDeploymentTest };