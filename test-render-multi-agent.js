const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const RENDER_URL = 'https://pdf-fzzi.onrender.com';
const PDF_PATH = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
const EXPECTED_TARGET = 19464431; // Expected $19,464,431
const PROBLEMATIC_ISIN = 'XS2746319610';

async function testHomePageUI() {
    console.log('🏠 Testing Home Page UI...');
    console.log('=====================================');
    
    try {
        const response = await axios.get(RENDER_URL, {
            timeout: 30000
        });
        
        console.log('✅ Home page accessible');
        console.log('📊 Response status:', response.status);
        
        // Basic HTML content analysis (without DOM parsing)
        const htmlContent = response.data;
        console.log('📰 HTML content length:', htmlContent.length);
        
        // Check for key UI elements using string matching
        const hasUploadForm = htmlContent.includes('<form') || htmlContent.includes('form');
        const hasFileInput = htmlContent.includes('type="file"') || htmlContent.includes('file');
        const hasMultiAgentReferences = htmlContent.toLowerCase().includes('multi-agent') || 
                                       htmlContent.toLowerCase().includes('complete processor') ||
                                       htmlContent.toLowerCase().includes('multi agent');
        
        console.log(`✅ Upload form elements: ${hasUploadForm ? '✅' : '❌'}`);
        console.log(`✅ File input elements: ${hasFileInput ? '✅' : '❌'}`);
        console.log(`✅ Multi-agent references: ${hasMultiAgentReferences ? '✅' : '❌'}`);
        
        // Check for title
        const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : 'No title found';
        console.log('📰 Page title:', title);
        
        // Check for h1 heading
        const h1Match = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        const h1 = h1Match ? h1Match[1] : 'No h1 found';
        console.log('📰 Main heading:', h1);
        
        // Check for endpoint references
        const htmlContentLower = htmlContent.toLowerCase();
        const hasStandardEndpoint = htmlContentLower.includes('bulletproof-processor');
        const hasCompleteEndpoint = htmlContentLower.includes('complete-processor');
        
        console.log(`📍 Standard endpoint reference: ${hasStandardEndpoint ? '✅' : '❌'}`);
        console.log(`📍 Complete endpoint reference: ${hasCompleteEndpoint ? '✅' : '❌'}`);
        
        return {
            success: true,
            hasUploadForm,
            hasFileInput,
            hasMultiAgentReferences,
            hasStandardEndpoint,
            hasCompleteEndpoint,
            title,
            h1
        };
        
    } catch (error) {
        console.error('❌ Home page test failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

async function testEndpoint(endpointPath, endpointName) {
    console.log(`\n🔍 Testing ${endpointName} (${endpointPath})`);
    console.log('=====================================');
    
    try {
        // Check if PDF file exists
        if (!fs.existsSync(PDF_PATH)) {
            throw new Error(`PDF file not found at: ${PDF_PATH}`);
        }
        
        console.log('✅ PDF file found, size:', fs.statSync(PDF_PATH).size, 'bytes');
        
        // Create form data
        const form = new FormData();
        form.append('pdf', fs.createReadStream(PDF_PATH));
        
        console.log(`📤 Uploading PDF to ${endpointPath}...`);
        
        const startTime = Date.now();
        
        // Make the request
        const response = await axios.post(`${RENDER_URL}${endpointPath}`, form, {
            headers: {
                ...form.getHeaders(),
            },
            timeout: 120000 // 2 minutes timeout
        });
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        console.log(`⏱️  Processing time: ${processingTime}ms (${(processingTime/1000).toFixed(2)}s)`);
        console.log('📊 Response status:', response.status);
        
        const result = response.data;
        
        // Analyze the response
        const analysis = analyzeExtractionResults(result, endpointName);
        
        return {
            success: true,
            endpoint: endpointPath,
            name: endpointName,
            processingTime,
            ...analysis
        };
        
    } catch (error) {
        console.error(`❌ ${endpointName} test failed:`, error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('🚨 Connection refused - server might be down');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('🚨 Request timed out - server might be overloaded');
        }
        
        return {
            success: false,
            endpoint: endpointPath,
            name: endpointName,
            error: error.message
        };
    }
}

function analyzeExtractionResults(result, endpointName) {
    console.log(`\n📋 ${endpointName} ANALYSIS:`);
    console.log('=====================================');
    
    // Check metadata
    const metadata = result.metadata || {};
    
    if (metadata.enhancedExtraction) {
        console.log('✅ Enhanced extraction: ENABLED');
        console.log('🔧 Enhancement type:', metadata.enhancementType || 'Unknown');
    } else {
        console.log('❌ Enhanced extraction: NOT DETECTED');
    }
    
    if (metadata.processingMethod) {
        console.log('🔍 Processing method:', metadata.processingMethod);
    }
    
    if (metadata.accuracy) {
        console.log('🎯 Accuracy:', metadata.accuracy + '%');
    }
    
    // Check for multi-agent specific metadata
    if (metadata.multiAgent) {
        console.log('🤖 Multi-agent processing: ENABLED');
        console.log('👥 Agents used:', metadata.agentsUsed || 'Unknown');
    } else {
        console.log('🤖 Multi-agent processing: NOT DETECTED');
    }
    
    // Analyze extracted data
    const dataArray = result.securities || result.extractedData || [];
    let foundProblematicISIN = false;
    let problematicValue = null;
    let validEntries = 0;
    
    if (dataArray.length > 0) {
        console.log(`\n📊 EXTRACTION RESULTS:`);
        console.log(`Total entries: ${dataArray.length}`);
        
        dataArray.forEach((item, index) => {
            if (item.isin === PROBLEMATIC_ISIN) {
                foundProblematicISIN = true;
                problematicValue = item.notionalAmount || item.amount || item.value;
                console.log(`⚠️  Found problematic ISIN ${PROBLEMATIC_ISIN}:`);
                console.log(`    Value: ${problematicValue}`);
                
                // Check if the inflated value is fixed
                const numericValue = typeof problematicValue === 'number' ? 
                    problematicValue : 
                    parseFloat(String(problematicValue).replace(/[^0-9.-]/g, ''));
                
                if (numericValue > 10000000) { // > $10M
                    console.log(`❌ Still showing inflated value: $${numericValue.toLocaleString()}`);
                } else {
                    console.log(`✅ Value appears corrected: $${numericValue.toLocaleString()}`);
                }
            }
            
            // Count valid entries
            if (item.isin && (item.notionalAmount || item.amount || item.value)) {
                validEntries++;
            }
        });
        
        console.log(`Valid entries: ${validEntries}`);
        console.log(`Completion rate: ${((validEntries/dataArray.length)*100).toFixed(1)}%`);
        
        // Show sample data (first 3 entries)
        console.log('\n📋 SAMPLE DATA (first 3 entries):');
        dataArray.slice(0, 3).forEach((item, index) => {
            console.log(`Entry ${index + 1}:`);
            console.log(`  ISIN: ${item.isin || 'N/A'}`);
            console.log(`  Security: ${item.securityName || item.name || 'N/A'}`);
            console.log(`  Amount: ${item.notionalAmount || item.amount || item.value || 'N/A'}`);
            console.log(`  Currency: ${item.currency || 'N/A'}`);
            console.log('');
        });
    } else {
        console.log('❌ No extracted data found in response');
    }
    
    // Check for errors
    if (result.errors && result.errors.length > 0) {
        console.log('\n⚠️  ERRORS DETECTED:');
        result.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error}`);
        });
    }
    
    return {
        totalEntries: dataArray.length,
        validEntries,
        completionRate: dataArray.length > 0 ? ((validEntries/dataArray.length)*100).toFixed(1) : 0,
        foundProblematicISIN,
        problematicValue,
        enhancedExtraction: metadata.enhancedExtraction || false,
        multiAgent: metadata.multiAgent || false,
        accuracy: metadata.accuracy || null,
        processingMethod: metadata.processingMethod || null,
        errors: result.errors || []
    };
}

function compareResults(standardResult, completeResult) {
    console.log('\n🔍 COMPARISON ANALYSIS');
    console.log('=====================================');
    
    if (!standardResult.success || !completeResult.success) {
        console.log('❌ Cannot compare - one or both endpoints failed');
        return;
    }
    
    console.log(`📊 Entry Count:`);
    console.log(`   Standard: ${standardResult.totalEntries}`);
    console.log(`   Complete: ${completeResult.totalEntries}`);
    
    if (completeResult.totalEntries > standardResult.totalEntries) {
        console.log(`✅ Multi-agent found ${completeResult.totalEntries - standardResult.totalEntries} more entries`);
    } else if (completeResult.totalEntries < standardResult.totalEntries) {
        console.log(`❌ Multi-agent found ${standardResult.totalEntries - completeResult.totalEntries} fewer entries`);
    } else {
        console.log(`⚖️  Same number of entries found`);
    }
    
    console.log(`\n🎯 Accuracy:`);
    console.log(`   Standard: ${standardResult.accuracy || 'N/A'}%`);
    console.log(`   Complete: ${completeResult.accuracy || 'N/A'}%`);
    
    console.log(`\n⏱️  Processing Time:`);
    console.log(`   Standard: ${(standardResult.processingTime/1000).toFixed(2)}s`);
    console.log(`   Complete: ${(completeResult.processingTime/1000).toFixed(2)}s`);
    
    if (completeResult.processingTime > standardResult.processingTime) {
        const timeDiff = completeResult.processingTime - standardResult.processingTime;
        console.log(`⏳ Multi-agent took ${(timeDiff/1000).toFixed(2)}s longer`);
    } else {
        const timeDiff = standardResult.processingTime - completeResult.processingTime;
        console.log(`⚡ Multi-agent was ${(timeDiff/1000).toFixed(2)}s faster`);
    }
    
    console.log(`\n🔧 Features:`);
    console.log(`   Standard Enhanced: ${standardResult.enhancedExtraction ? '✅' : '❌'}`);
    console.log(`   Complete Multi-Agent: ${completeResult.multiAgent ? '✅' : '❌'}`);
    
    console.log(`\n💯 Completion Rate:`);
    console.log(`   Standard: ${standardResult.completionRate}%`);
    console.log(`   Complete: ${completeResult.completionRate}%`);
    
    // Overall assessment
    let improvements = 0;
    let regressions = 0;
    
    if (completeResult.totalEntries > standardResult.totalEntries) improvements++;
    if (completeResult.accuracy > standardResult.accuracy) improvements++;
    if (completeResult.completionRate > standardResult.completionRate) improvements++;
    
    if (completeResult.totalEntries < standardResult.totalEntries) regressions++;
    if (completeResult.accuracy < standardResult.accuracy) regressions++;
    if (completeResult.completionRate < standardResult.completionRate) regressions++;
    
    console.log(`\n📈 OVERALL ASSESSMENT:`);
    if (improvements > regressions) {
        console.log('✅ Multi-agent system shows improvements');
    } else if (regressions > improvements) {
        console.log('❌ Multi-agent system shows regressions');
    } else {
        console.log('⚖️  Multi-agent system shows mixed results');
    }
    
    console.log(`   Improvements: ${improvements}`);
    console.log(`   Regressions: ${regressions}`);
}

async function runCompleteTest() {
    console.log('🚀 RENDER DEPLOYMENT MULTI-AGENT TEST');
    console.log('=====================================');
    console.log('Target URL:', RENDER_URL);
    console.log('Test PDF:', PDF_PATH);
    console.log('');
    
    // Test 1: Home page UI
    const uiResult = await testHomePageUI();
    
    // Test 2: Standard endpoint
    const standardResult = await testEndpoint('/api/bulletproof-processor', 'Standard Processor');
    
    // Test 3: Complete endpoint
    const completeResult = await testEndpoint('/api/complete-processor', 'Complete Multi-Agent Processor');
    
    // Test 4: Compare results
    if (standardResult.success && completeResult.success) {
        compareResults(standardResult, completeResult);
    }
    
    // Final summary
    console.log('\n🏁 FINAL SUMMARY');
    console.log('=====================================');
    console.log(`Home Page UI: ${uiResult.success ? '✅' : '❌'}`);
    console.log(`Standard Endpoint: ${standardResult.success ? '✅' : '❌'}`);
    console.log(`Complete Endpoint: ${completeResult.success ? '✅' : '❌'}`);
    
    if (uiResult.success) {
        console.log(`\n🎨 UI Features:`);
        console.log(`   Upload Form: ${uiResult.hasUploadForm ? '✅' : '❌'}`);
        console.log(`   File Input: ${uiResult.hasFileInput ? '✅' : '❌'}`);
        console.log(`   Multi-Agent References: ${uiResult.hasMultiAgentReferences ? '✅' : '❌'}`);
        console.log(`   Standard Endpoint Ref: ${uiResult.hasStandardEndpoint ? '✅' : '❌'}`);
        console.log(`   Complete Endpoint Ref: ${uiResult.hasCompleteEndpoint ? '✅' : '❌'}`);
        console.log(`   Title: ${uiResult.title}`);
        console.log(`   Main Heading: ${uiResult.h1}`);
    }
    
    console.log('\n🔗 Access URLs:');
    console.log(`   Home Page: ${RENDER_URL}`);
    console.log(`   Standard API: ${RENDER_URL}/api/bulletproof-processor`);
    console.log(`   Complete API: ${RENDER_URL}/api/complete-processor`);
    
    return {
        uiResult,
        standardResult,
        completeResult,
        timestamp: new Date().toISOString()
    };
}

// Run if called directly
if (require.main === module) {
    runCompleteTest().catch(console.error);
}

module.exports = { runCompleteTest, testHomePageUI, testEndpoint, compareResults };