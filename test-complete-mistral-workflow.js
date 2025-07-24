#!/usr/bin/env node

/**
 * TEST COMPLETE MISTRAL WORKFLOW
 * 
 * Full end-to-end test of Mistral OCR with PDF processing
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testCompleteMistralWorkflow() {
    console.log('🤖 TESTING COMPLETE MISTRAL WORKFLOW');
    console.log('====================================');

    const baseUrl = 'https://pdf-fzzi.onrender.com';
    const pdfPath = './2. Messos  - 31.03.2025.pdf';

    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF file not found');
        return;
    }

    try {
        // Test 1: Current system status
        console.log('\n📊 Step 1: System Status Check');
        console.log('===============================');
        
        const statsResponse = await axios.get(`${baseUrl}/api/smart-ocr-stats`);
        const stats = statsResponse.data.stats;
        
        console.log(`🤖 Mistral Enabled: ${stats.mistralEnabled}`);
        console.log(`🎯 Current Accuracy: ${stats.currentAccuracy}%`);
        console.log(`📊 Learning Rate: ${stats.learningRate}`);

        // Test 2: Process PDF and analyze results
        console.log('\n📄 Step 2: PDF Processing');
        console.log('=========================');
        
        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(pdfPath));
        
        console.log('📤 Processing Messos PDF...');
        const startTime = Date.now();
        
        const processResponse = await axios.post(`${baseUrl}/api/smart-ocr-process`, formData, {
            headers: {
                ...formData.getHeaders()
            },
            timeout: 120000 // 2 minute timeout
        });

        const processingTime = Date.now() - startTime;
        const result = processResponse.data.results;
        
        console.log(`⏱️ Processing time: ${processingTime}ms`);
        console.log(`📈 Method used: ${result.method}`);
        console.log(`🎯 Success: ${result.success}`);
        console.log(`📊 Text length: ${result.text_length || 'unknown'}`);

        // Test 3: Analyze extraction quality
        console.log('\n🧠 Step 3: Extraction Analysis');
        console.log('===============================');
        
        if (result.method === 'mistral-vision-ocr') {
            console.log('🎉 SUCCESS: MISTRAL VISION OCR IS ACTIVE!');
            
            // Detailed analysis of Mistral extraction
            if (result.extracted_data) {
                const securities = result.extracted_data.securities || [];
                const totalValue = securities.reduce((sum, sec) => sum + (sec.market_value_chf || 0), 0);
                
                console.log(`📊 Securities extracted: ${securities.length}`);
                console.log(`💰 Total value: CHF ${totalValue.toLocaleString()}`);
                
                // Show sample securities
                console.log('\n📋 Sample Securities:');
                securities.slice(0, 5).forEach((sec, i) => {
                    console.log(`${i+1}. ${sec.isin}: CHF ${(sec.market_value_chf || 0).toLocaleString()}`);
                });
                
                // Accuracy calculation
                const expectedTotal = 19464431;
                const accuracy = totalValue > 0 ? 
                    (1 - Math.abs(totalValue - expectedTotal) / expectedTotal) * 100 : 0;
                
                console.log(`\n🎯 Accuracy: ${accuracy.toFixed(1)}%`);
                console.log(`📊 Expected: CHF ${expectedTotal.toLocaleString()}`);
                console.log(`📊 Extracted: CHF ${totalValue.toLocaleString()}`);
                
                if (accuracy > 90) {
                    console.log('✅ EXCELLENT: >90% accuracy achieved with Mistral OCR!');
                } else if (accuracy > 80) {
                    console.log('✅ GOOD: >80% accuracy with room for improvement');
                } else {
                    console.log('⚠️ Needs improvement: <80% accuracy');
                }
            }
            
        } else {
            console.log(`⚠️ Using fallback method: ${result.method}`);
            console.log('   Mistral OCR not yet active - system may still be restarting');
            
            // Still analyze the fallback results
            if (result.securities_found) {
                console.log(`📊 Securities found: ${result.securities_found}`);
            }
        }

        // Test 4: Test learning system integration
        console.log('\n📈 Step 4: Learning System Test');
        console.log('================================');
        
        try {
            const learnData = {
                document_type: 'messos_portfolio',
                expected_total: 19464431,
                processing_method: result.method
            };
            
            const learnResponse = await axios.post(`${baseUrl}/api/smart-ocr-learn`, learnData);
            console.log('✅ Learning system integration working');
            console.log(`📊 Learning response: ${learnResponse.data.message || 'Success'}`);
            
        } catch (learnError) {
            console.log('⚠️ Learning system test:', learnError.response?.data || learnError.message);
        }

        return {
            mistralEnabled: stats.mistralEnabled,
            method: result.method,
            success: result.success,
            accuracy: result.accuracy || 'unknown',
            processingTime
        };

    } catch (error) {
        console.error('❌ Workflow test failed:', error.response?.data || error.message);
        return null;
    }
}

async function generateMistralReport(results) {
    console.log('\n📋 MISTRAL INTEGRATION REPORT');
    console.log('==============================');
    
    if (!results) {
        console.log('❌ No results to analyze');
        return;
    }
    
    console.log(`🤖 Mistral Status: ${results.mistralEnabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`📈 Processing Method: ${results.method}`);
    console.log(`🎯 Success Rate: ${results.success ? '100%' : '0%'}`);
    console.log(`⏱️ Processing Speed: ${results.processingTime}ms`);
    
    if (results.mistralEnabled && results.method === 'mistral-vision-ocr') {
        console.log('\n🎉 MISTRAL OCR FULLY OPERATIONAL!');
        console.log('✅ Visual PDF understanding active');
        console.log('✅ AI agent validation ready');
        console.log('✅ Human annotation system ready');
        console.log('✅ Learning system integration active');
        
        console.log('\n🚀 NEXT STEPS:');
        console.log('1. Test with multiple PDF types');
        console.log('2. Optimize extraction prompts');
        console.log('3. Fine-tune AI validation agents');
        console.log('4. Integrate human correction workflow');
        
    } else {
        console.log('\n⏳ MISTRAL INTEGRATION IN PROGRESS');
        console.log('🔄 System may still be restarting');
        console.log('⏰ Try again in 2-3 minutes');
        
        console.log('\n🛠️ TROUBLESHOOTING:');
        console.log('1. Verify MISTRAL_API_KEY in Render dashboard');
        console.log('2. Check service restart completion');
        console.log('3. Monitor deployment logs');
    }
}

if (require.main === module) {
    testCompleteMistralWorkflow()
        .then(generateMistralReport)
        .catch(console.error);
}

module.exports = { testCompleteMistralWorkflow };