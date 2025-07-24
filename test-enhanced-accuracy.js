#!/usr/bin/env node

/**
 * TEST ENHANCED ACCURACY
 * 
 * Tests the enhanced accuracy improvements and pattern recognition
 */

const fs = require('fs').promises;
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testEnhancedAccuracy() {
    console.log('🎯 TESTING ENHANCED ACCURACY IMPROVEMENTS');
    console.log('=========================================');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Test with financial PDF
        console.log('\n📊 Testing Enhanced Processing...');
        
        const formData = new FormData();
        const fileBuffer = await fs.readFile('financial-test.pdf');
        formData.append('pdf', fileBuffer, 'financial-test.pdf');
        
        const startTime = Date.now();
        const response = await fetch(`${baseUrl}/api/smart-ocr-process`, {
            method: 'POST',
            body: formData
        });
        const endTime = Date.now();
        
        const responseData = await response.json();
        
        console.log('\n🔍 ENHANCED PROCESSING RESULTS:');
        console.log('===============================');
        console.log(`✅ Status: ${response.status} ${response.statusText}`);
        console.log(`✅ Success: ${responseData.success}`);
        console.log(`✅ Processing Success: ${responseData.results?.success}`);
        console.log(`📊 Accuracy: ${responseData.results?.accuracy}%`);
        console.log(`⚙️ Processing Method: ${responseData.results?.processingMethod}`);
        console.log(`⏱️ Processing Time: ${endTime - startTime}ms`);
        console.log(`📄 Pages: ${responseData.results?.pageCount}`);
        console.log(`🧠 Patterns Used: ${responseData.results?.patternsUsed}`);
        
        // Check for enhanced processing indicators
        if (responseData.results?.ocrResults) {
            console.log('\n🔍 OCR RESULTS ANALYSIS:');
            console.log('========================');
            
            responseData.results.ocrResults.forEach((result, index) => {
                console.log(`\nPage ${index + 1}:`);
                console.log(`   Method: ${result.method || 'unknown'}`);
                console.log(`   Confidence: ${result.confidence || 'unknown'}`);
                console.log(`   Text Length: ${result.text?.length || 0} characters`);
                
                // Check for enhanced features
                if (result.patterns) {
                    console.log(`   🎯 ENHANCED PATTERNS DETECTED:`);
                    console.log(`      ISINs: ${result.patterns.isins?.length || 0}`);
                    console.log(`      Currencies: ${result.patterns.currencies?.length || 0}`);
                    console.log(`      Dates: ${result.patterns.dates?.length || 0}`);
                    console.log(`      Percentages: ${result.patterns.percentages?.length || 0}`);
                    console.log(`      Accounts: ${result.patterns.accounts?.length || 0}`);
                    
                    if (result.patterns.isins?.length > 0) {
                        console.log(`      Sample ISINs: ${result.patterns.isins.slice(0, 3).join(', ')}`);
                    }
                    if (result.patterns.currencies?.length > 0) {
                        console.log(`      Sample Currencies: ${result.patterns.currencies.slice(0, 3).join(', ')}`);
                    }
                }
                
                // Check processing method
                if (result.method === 'enhanced-text-extraction') {
                    console.log(`   ✅ ENHANCED TEXT EXTRACTION ACTIVE`);
                } else if (result.method === 'mistral-ocr-enhanced') {
                    console.log(`   ✅ MISTRAL OCR ENHANCED ACTIVE`);
                } else {
                    console.log(`   ⚠️ Using basic method: ${result.method}`);
                }
            });
        }
        
        // Accuracy analysis
        console.log('\n📈 ACCURACY ANALYSIS:');
        console.log('=====================');
        
        const accuracy = responseData.results?.accuracy || 0;
        if (accuracy > 85) {
            console.log(`🎉 EXCELLENT: ${accuracy}% accuracy achieved!`);
        } else if (accuracy > 80) {
            console.log(`✅ GOOD: ${accuracy}% accuracy (baseline improved)`);
        } else {
            console.log(`⚠️ NEEDS IMPROVEMENT: ${accuracy}% accuracy`);
        }
        
        // Check for specific improvements
        const processingMethod = responseData.results?.processingMethod;
        if (processingMethod === 'enhanced-text-extraction') {
            console.log('✅ Enhanced text extraction is working');
        } else if (processingMethod === 'mistral-ocr-enhanced') {
            console.log('✅ Mistral OCR enhanced is working');
        } else {
            console.log(`⚠️ Using standard processing: ${processingMethod}`);
        }
        
        // Test with multi-page PDF
        console.log('\n📑 Testing Multi-page Enhanced Processing...');
        
        const multiFormData = new FormData();
        const multiFileBuffer = await fs.readFile('messos-realistic.pdf');
        multiFormData.append('pdf', multiFileBuffer, 'messos-realistic.pdf');
        
        const multiStartTime = Date.now();
        const multiResponse = await fetch(`${baseUrl}/api/smart-ocr-process`, {
            method: 'POST',
            body: multiFormData
        });
        const multiEndTime = Date.now();
        
        const multiResponseData = await multiResponse.json();
        
        console.log('\n🔍 MULTI-PAGE ENHANCED RESULTS:');
        console.log('===============================');
        console.log(`✅ Status: ${multiResponse.status} ${multiResponse.statusText}`);
        console.log(`✅ Success: ${multiResponseData.success}`);
        console.log(`📊 Accuracy: ${multiResponseData.results?.accuracy}%`);
        console.log(`⚙️ Processing Method: ${multiResponseData.results?.processingMethod}`);
        console.log(`⏱️ Processing Time: ${multiEndTime - multiStartTime}ms`);
        console.log(`📄 Pages: ${multiResponseData.results?.pageCount}`);
        
        // Multi-page accuracy analysis
        const multiAccuracy = multiResponseData.results?.accuracy || 0;
        if (multiAccuracy > 85) {
            console.log(`🎉 EXCELLENT MULTI-PAGE: ${multiAccuracy}% accuracy!`);
        } else if (multiAccuracy > 80) {
            console.log(`✅ GOOD MULTI-PAGE: ${multiAccuracy}% accuracy`);
        } else {
            console.log(`⚠️ MULTI-PAGE NEEDS IMPROVEMENT: ${multiAccuracy}% accuracy`);
        }
        
        // Final assessment
        console.log('\n🎯 ENHANCEMENT ASSESSMENT:');
        console.log('==========================');
        
        const avgAccuracy = (accuracy + multiAccuracy) / 2;
        console.log(`Average Accuracy: ${avgAccuracy.toFixed(1)}%`);
        
        if (avgAccuracy > 90) {
            console.log('🎉 SUCCESS: Enhanced accuracy improvements are working excellently!');
        } else if (avgAccuracy > 85) {
            console.log('✅ GOOD: Enhanced accuracy improvements are working well');
        } else if (avgAccuracy > 80) {
            console.log('⚠️ PARTIAL: Some improvements working, but more optimization needed');
        } else {
            console.log('❌ ISSUE: Enhanced accuracy improvements not yet effective');
        }
        
        // Recommendations
        console.log('\n💡 NEXT STEPS FOR 100% ACCURACY:');
        console.log('================================');
        
        if (processingMethod === 'standard') {
            console.log('1. ⚠️ Enhanced processing not activated - check deployment');
        }
        
        if (avgAccuracy < 95) {
            console.log('2. 🔧 Consider enabling Mistral OCR with API key');
            console.log('3. 📊 Implement additional pattern recognition');
            console.log('4. 🎯 Add post-processing validation');
        }
        
        if (avgAccuracy >= 95) {
            console.log('🎉 System is performing excellently! Close to 100% accuracy achieved.');
        }
        
    } catch (error) {
        console.error('💥 Enhanced accuracy test failed:', error.message);
    }
}

testEnhancedAccuracy();
