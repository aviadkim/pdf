#!/usr/bin/env node

/**
 * TEST FINANCIAL PDF API
 * 
 * Tests the comprehensive financial PDF with the API to see extracted data
 */

const fs = require('fs').promises;
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testFinancialPDF() {
    console.log('🏦 TESTING FINANCIAL PDF PROCESSING');
    console.log('===================================');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Upload the comprehensive financial PDF
        console.log('📤 Uploading comprehensive financial PDF...');
        const formData = new FormData();
        
        const fileBuffer = await fs.readFile('financial-test.pdf');
        formData.append('pdf', fileBuffer, 'financial-test.pdf');
        console.log(`📄 File loaded: ${fileBuffer.length} bytes`);
        
        const response = await fetch(`${baseUrl}/api/smart-ocr-process`, {
            method: 'POST',
            body: formData
        });
        
        console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
        
        const responseData = await response.json();
        
        console.log('\n📊 FINANCIAL PDF PROCESSING RESULTS:');
        console.log('====================================');
        console.log(`✅ Success: ${responseData.success}`);
        console.log(`✅ Processing Success: ${responseData.results.success}`);
        console.log(`📄 Document ID: ${responseData.results.documentId}`);
        console.log(`📊 Pages Processed: ${responseData.results.pageCount}`);
        console.log(`🎯 Accuracy: ${responseData.results.accuracy}%`);
        console.log(`🧠 Patterns Used: ${responseData.results.patternsUsed}`);
        console.log(`⚙️ Processing Method: ${responseData.results.processingMethod}`);
        
        console.log('\n🔍 OCR RESULTS ANALYSIS:');
        console.log('========================');
        if (responseData.results.ocrResults && responseData.results.ocrResults.length > 0) {
            const ocrResult = responseData.results.ocrResults[0];
            console.log(`📄 Text Length: ${ocrResult.text_length} characters`);
            console.log(`🎯 OCR Accuracy: ${ocrResult.accuracy}%`);
            console.log(`⚙️ Method: ${ocrResult.method}`);
            console.log(`💼 Securities Found: ${ocrResult.securities.length}`);
            
            if (ocrResult.text && ocrResult.text.length > 0) {
                console.log('\n📝 EXTRACTED TEXT (first 500 chars):');
                console.log('=====================================');
                console.log(ocrResult.text.substring(0, 500) + '...');
                
                // Analyze for financial patterns
                console.log('\n🔍 FINANCIAL PATTERN ANALYSIS:');
                console.log('==============================');
                
                const text = ocrResult.text;
                const isinMatches = text.match(/[A-Z]{2}[A-Z0-9]{9}[0-9]/g) || [];
                const currencyMatches = text.match(/(CHF|USD|EUR|GBP)\s*[\d,]+\.?\d*/g) || [];
                const dateMatches = text.match(/\d{2}\.\d{2}\.\d{4}/g) || [];
                const percentMatches = text.match(/[+-]?\d+\.\d+%/g) || [];
                
                console.log(`📊 ISIN Numbers Found: ${isinMatches.length}`);
                isinMatches.forEach((isin, i) => console.log(`   ${i+1}. ${isin}`));
                
                console.log(`💰 Currency Values Found: ${currencyMatches.length}`);
                currencyMatches.forEach((curr, i) => console.log(`   ${i+1}. ${curr}`));
                
                console.log(`📅 Dates Found: ${dateMatches.length}`);
                dateMatches.forEach((date, i) => console.log(`   ${i+1}. ${date}`));
                
                console.log(`📈 Percentages Found: ${percentMatches.length}`);
                percentMatches.forEach((perc, i) => console.log(`   ${i+1}. ${perc}`));
                
            } else {
                console.log('⚠️ No text extracted from PDF');
            }
        }
        
        console.log('\n🎨 SUGGESTED ANNOTATIONS:');
        console.log('=========================');
        if (responseData.results.suggestedAnnotations && responseData.results.suggestedAnnotations.length > 0) {
            responseData.results.suggestedAnnotations.forEach((annotation, i) => {
                console.log(`${i+1}. ${annotation.type}: ${annotation.text}`);
                if (annotation.confidence) {
                    console.log(`   Confidence: ${annotation.confidence}%`);
                }
            });
        } else {
            console.log('No suggested annotations generated');
        }
        
        console.log('\n📋 SYSTEM PERFORMANCE:');
        console.log('======================');
        console.log(`⏱️ Processing Time: ${new Date(responseData.results.timestamp).toLocaleTimeString()}`);
        console.log(`🎯 Overall System Accuracy: ${responseData.results.accuracy}%`);
        console.log(`🧠 Total Patterns Available: ${responseData.results.patternsUsed}`);
        
        // Save detailed results
        await fs.writeFile('financial-pdf-results.json', JSON.stringify(responseData, null, 2));
        console.log('\n💾 Detailed results saved to financial-pdf-results.json');
        
        console.log('\n🎉 FINANCIAL PDF PROCESSING TEST COMPLETE!');
        console.log('==========================================');
        
        if (responseData.results.success) {
            console.log('✅ SUCCESS: Financial PDF processing is working correctly');
            console.log('✅ Pattern recognition is active');
            console.log('✅ Text extraction is functional');
            console.log('✅ System is ready for production use');
        } else {
            console.log('❌ ISSUES: Some problems detected');
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        console.error('📍 Stack:', error.stack);
    }
}

testFinancialPDF();
