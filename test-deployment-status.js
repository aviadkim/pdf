#!/usr/bin/env node

/**
 * TEST DEPLOYMENT STATUS
 * 
 * Tests if the multi-page fix has been deployed by checking for new logging
 */

const fs = require('fs').promises;
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testDeploymentStatus() {
    console.log('🚀 TESTING DEPLOYMENT STATUS');
    console.log('============================');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // First, test a simple endpoint to see if the server is responding
        console.log('📡 Testing server responsiveness...');
        const healthResponse = await fetch(`${baseUrl}/api/smart-ocr-test`);
        console.log(`Health check: ${healthResponse.status} ${healthResponse.statusText}`);
        
        // Test with our multi-page PDF
        console.log('\n📤 Testing multi-page PDF processing...');
        const formData = new FormData();
        
        const fileBuffer = await fs.readFile('messos-realistic.pdf');
        formData.append('pdf', fileBuffer, 'messos-realistic.pdf');
        
        const response = await fetch(`${baseUrl}/api/smart-ocr-process`, {
            method: 'POST',
            body: formData
        });
        
        const responseData = await response.json();
        
        console.log('\n🔍 DEPLOYMENT STATUS ANALYSIS:');
        console.log('==============================');
        
        // Check if we have the new multi-page processing
        if (responseData.results && responseData.results.ocrResults) {
            const ocrResult = responseData.results.ocrResults[0];
            
            // Look for new properties that indicate the fix is deployed
            const hasNewProperties = ocrResult.totalPages !== undefined;
            const hasMultiPageProcessing = responseData.results.pageCount > 1 || responseData.results.pages?.length > 1;
            
            console.log(`✅ Response received: ${responseData.success}`);
            console.log(`📊 Page count: ${responseData.results.pageCount}`);
            console.log(`📑 Pages array length: ${responseData.results.pages?.length}`);
            console.log(`🔧 Has new properties: ${hasNewProperties}`);
            console.log(`📄 Multi-page processing: ${hasMultiPageProcessing}`);
            
            if (hasNewProperties) {
                console.log('🎉 NEW FIX DETECTED: totalPages property found');
                console.log(`   Total pages: ${ocrResult.totalPages}`);
            }
            
            if (hasMultiPageProcessing) {
                console.log('🎉 MULTI-PAGE PROCESSING WORKING!');
            } else {
                console.log('⚠️ Still processing as single page');
            }
            
            // Check for new logging patterns in the response
            if (ocrResult.method === 'pdf-parse' && ocrResult.totalPages) {
                console.log('✅ NEW CODE DEPLOYED: Enhanced pdf-parse processing detected');
            } else {
                console.log('❌ OLD CODE STILL RUNNING: Basic pdf-parse processing');
            }
            
        } else {
            console.log('❌ No OCR results in response');
        }
        
        // Test with a simple PDF to see if single-page still works
        console.log('\n📄 Testing single-page PDF for regression...');
        const simpleFormData = new FormData();
        const simpleBuffer = await fs.readFile('valid-test.pdf');
        simpleFormData.append('pdf', simpleBuffer, 'valid-test.pdf');
        
        const simpleResponse = await fetch(`${baseUrl}/api/smart-ocr-process`, {
            method: 'POST',
            body: simpleFormData
        });
        
        const simpleData = await simpleResponse.json();
        
        if (simpleData.success && simpleData.results.success) {
            console.log('✅ Single-page processing still works');
        } else {
            console.log('❌ Single-page processing broken');
            console.log(`Error: ${simpleData.results?.error}`);
        }
        
        console.log('\n🎯 DEPLOYMENT STATUS SUMMARY:');
        console.log('=============================');
        
        const isNewCodeDeployed = responseData.results?.ocrResults?.[0]?.totalPages !== undefined;
        const isMultiPageWorking = responseData.results?.pageCount > 1;
        
        if (isNewCodeDeployed && isMultiPageWorking) {
            console.log('🎉 SUCCESS: New multi-page fix is deployed and working!');
        } else if (isNewCodeDeployed) {
            console.log('⚠️ PARTIAL: New code deployed but multi-page not working yet');
        } else {
            console.log('❌ PENDING: Old code still running, deployment not complete');
            console.log('   This is normal for Render deployments which can take 2-5 minutes');
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        
        if (error.code === 'ECONNRESET' || error.message.includes('timeout')) {
            console.log('🔄 Server might be restarting for deployment');
        }
    }
}

testDeploymentStatus();
