#!/usr/bin/env node

/**
 * TEST DEPLOYMENT VERSION
 * 
 * Check if the new enhanced scanned PDF extraction is deployed
 */

const fs = require('fs').promises;
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testDeploymentVersion() {
    console.log('🔍 TESTING DEPLOYMENT VERSION');
    console.log('=============================');
    console.log('Checking if enhanced scanned PDF extraction is deployed');
    console.log('');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Create a small test PDF to check the processing method
        console.log('📄 Testing with small PDF to check processing method...');
        
        // Read the MESSOS file
        const filePath = '2. Messos  - 31.03.2025.pdf';
        const fileBuffer = await fs.readFile(filePath);
        
        console.log(`📁 File: ${filePath}`);
        console.log(`📊 Size: ${fileBuffer.length} bytes`);
        
        // Upload to API
        const formData = new FormData();
        formData.append('pdf', fileBuffer, {
            filename: filePath,
            contentType: 'application/pdf'
        });
        
        console.log('\n📤 Uploading to check processing method...');
        
        const response = await fetch(`${baseUrl}/api/smart-ocr-process`, {
            method: 'POST',
            body: formData,
            headers: {
                ...formData.getHeaders()
            }
        });
        
        console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ HTTP Error: ${errorText}`);
            return;
        }
        
        const responseData = await response.json();
        
        console.log('\n🔍 DEPLOYMENT VERSION CHECK:');
        console.log('============================');
        
        if (responseData.results && responseData.results.ocrResults) {
            const ocrResults = responseData.results.ocrResults;
            console.log(`📑 OCR Results: ${ocrResults.length}`);
            
            // Check the processing methods used
            const methods = ocrResults.map(result => result.method);
            const uniqueMethods = [...new Set(methods)];
            
            console.log(`⚙️ Processing methods used: ${uniqueMethods.join(', ')}`);
            
            // Check if new method is being used
            const hasNewMethod = uniqueMethods.some(method => 
                method.includes('enhanced-scanned-pdf-extraction') ||
                method.includes('scanned-pdf-extraction-failed')
            );
            
            const hasOldMethod = uniqueMethods.some(method => 
                method.includes('scanned-pdf-vision-ocr-failed') ||
                method.includes('scanned-pdf-ocr-failed')
            );
            
            if (hasNewMethod) {
                console.log('✅ NEW CODE DEPLOYED: Enhanced scanned PDF extraction is active');
                
                // Check if any text was extracted
                const totalText = ocrResults.reduce((sum, result) => sum + (result.text?.length || 0), 0);
                console.log(`📝 Total text extracted: ${totalText} characters`);
                
                if (totalText > 1000) {
                    console.log('🎉 EXCELLENT: Text extraction is working!');
                } else {
                    console.log('⚠️ PARTIAL: New code deployed but text extraction needs improvement');
                }
                
            } else if (hasOldMethod) {
                console.log('❌ OLD CODE STILL ACTIVE: Deployment not updated yet');
                console.log('   - Still using old scanned PDF processing');
                console.log('   - Need to wait for deployment or force refresh');
                
            } else {
                console.log('🤔 UNKNOWN: Different processing method detected');
                console.log(`   Methods: ${uniqueMethods.join(', ')}`);
            }
            
            // Show sample results
            console.log('\n📊 SAMPLE OCR RESULTS:');
            ocrResults.slice(0, 3).forEach((result, index) => {
                console.log(`Page ${index + 1}:`);
                console.log(`   Method: ${result.method}`);
                console.log(`   Text length: ${result.text?.length || 0}`);
                console.log(`   Has patterns: ${!!result.patterns}`);
                
                if (result.patterns) {
                    console.log(`   ISINs: ${result.patterns.isins?.length || 0}`);
                    console.log(`   Currencies: ${result.patterns.currencies?.length || 0}`);
                }
                
                if (result.error) {
                    console.log(`   Error: ${result.error}`);
                }
            });
            
        } else {
            console.log('❌ NO OCR RESULTS: API response format issue');
        }
        
        // Check overall processing
        console.log('\n📊 OVERALL PROCESSING:');
        console.log('======================');
        console.log(`✅ Success: ${responseData.success}`);
        console.log(`📄 Page count: ${responseData.results?.pageCount}`);
        console.log(`📊 Accuracy: ${responseData.results?.accuracy}%`);
        console.log(`⚙️ Processing method: ${responseData.results?.processingMethod}`);
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('===================');
        
        if (responseData.results?.pageCount === 19) {
            console.log('✅ Page detection is perfect (19 pages)');
        }
        
        if (responseData.results?.ocrResults?.length === 19) {
            console.log('✅ OCR structure is correct (19 results)');
        }
        
        const hasTextExtraction = responseData.results?.ocrResults?.some(result => 
            result.text && result.text.length > 50
        );
        
        if (hasTextExtraction) {
            console.log('✅ Text extraction is working');
        } else {
            console.log('❌ Text extraction needs fixing');
            console.log('   - Check Mistral API key configuration');
            console.log('   - Verify pdf-parse is working');
            console.log('   - Test with simpler documents first');
        }
        
    } catch (error) {
        console.error('💥 Deployment version test failed:', error.message);
        console.error('📍 Error details:', error.stack);
    }
}

testDeploymentVersion();
