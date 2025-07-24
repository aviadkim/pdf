#!/usr/bin/env node

/**
 * TEST REALISTIC PDF API
 * 
 * Tests the larger, more realistic PDF to identify potential issues
 */

const fs = require('fs').promises;
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testRealisticPDF() {
    console.log('🏦 TESTING REALISTIC MESSOS PDF');
    console.log('===============================');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Check file size first
        const stats = await fs.stat('messos-realistic.pdf');
        console.log(`📄 File size: ${stats.size} bytes (${(stats.size/1024).toFixed(2)} KB)`);
        
        if (stats.size > 50 * 1024 * 1024) {
            console.log('⚠️ WARNING: File exceeds 50MB limit');
        }
        
        // Upload the realistic PDF
        console.log('📤 Uploading realistic MESSOS PDF...');
        const formData = new FormData();
        
        const fileBuffer = await fs.readFile('messos-realistic.pdf');
        formData.append('pdf', fileBuffer, 'messos-realistic.pdf');
        
        const startTime = Date.now();
        const response = await fetch(`${baseUrl}/api/smart-ocr-process`, {
            method: 'POST',
            body: formData
        });
        const endTime = Date.now();
        
        console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
        console.log(`⏱️ Processing Time: ${endTime - startTime}ms`);
        
        const responseData = await response.json();
        
        console.log('\n📊 REALISTIC PDF PROCESSING RESULTS:');
        console.log('====================================');
        console.log(`✅ Success: ${responseData.success}`);
        console.log(`✅ Processing Success: ${responseData.results.success}`);
        
        if (responseData.results.success) {
            console.log(`📄 Document ID: ${responseData.results.documentId}`);
            console.log(`📊 Pages Processed: ${responseData.results.pageCount}`);
            console.log(`📑 Pages Array Length: ${responseData.results.pages ? responseData.results.pages.length : 'N/A'}`);
            console.log(`🎯 Accuracy: ${responseData.results.accuracy}%`);
            console.log(`🧠 Patterns Used: ${responseData.results.patternsUsed}`);
            console.log(`⚙️ Processing Method: ${responseData.results.processingMethod}`);
            
            // Check OCR results
            if (responseData.results.ocrResults && responseData.results.ocrResults.length > 0) {
                console.log('\n🔍 OCR RESULTS ANALYSIS:');
                console.log('========================');
                
                responseData.results.ocrResults.forEach((ocrResult, index) => {
                    console.log(`\n📄 Page ${index + 1}:`);
                    console.log(`   Text Length: ${ocrResult.text_length || ocrResult.textLength || 'N/A'} characters`);
                    console.log(`   Method: ${ocrResult.method}`);
                    console.log(`   Securities: ${ocrResult.securities ? ocrResult.securities.length : 'N/A'}`);
                    
                    if (ocrResult.text) {
                        const text = ocrResult.text;
                        
                        // Analyze for financial patterns
                        const isinMatches = text.match(/[A-Z]{2}[A-Z0-9]{9}[0-9]/g) || [];
                        const currencyMatches = text.match(/(CHF|USD|EUR|GBP)\s*[\d,]+\.?\d*/g) || [];
                        const dateMatches = text.match(/\d{2}\.\d{2}\.\d{4}/g) || [];
                        
                        console.log(`   ISIN Numbers: ${isinMatches.length}`);
                        console.log(`   Currency Values: ${currencyMatches.length}`);
                        console.log(`   Dates: ${dateMatches.length}`);
                        
                        // Show first few ISINs found
                        if (isinMatches.length > 0) {
                            console.log(`   First ISINs: ${isinMatches.slice(0, 3).join(', ')}`);
                        }
                        
                        // Show text sample
                        console.log(`   Text Sample: "${text.substring(0, 100)}..."`);
                    }
                });
            }
            
            // Check pages array structure
            if (responseData.results.pages) {
                console.log('\n📑 PAGES ARRAY ANALYSIS:');
                console.log('========================');
                console.log(`Pages Array Length: ${responseData.results.pages.length}`);
                
                responseData.results.pages.forEach((page, index) => {
                    console.log(`\nPage ${index + 1}:`);
                    console.log(`   Page Number: ${page.page}`);
                    console.log(`   Method: ${page.method}`);
                    console.log(`   Has Base64: ${!!page.base64}`);
                    console.log(`   Has Text: ${!!page.text}`);
                    console.log(`   Is Fallback: ${page.fallback}`);
                    
                    if (page.base64) {
                        console.log(`   Base64 Length: ${page.base64.length} characters`);
                        console.log(`   Base64 Type: ${page.base64.substring(0, 30)}...`);
                    }
                });
            }
            
        } else {
            console.log(`❌ Processing Failed: ${responseData.results.error}`);
            console.log(`❌ Error Type: ${responseData.results.errorType}`);
        }
        
        // Save detailed results
        await fs.writeFile('realistic-pdf-results.json', JSON.stringify(responseData, null, 2));
        console.log('\n💾 Detailed results saved to realistic-pdf-results.json');
        
        // Performance analysis
        console.log('\n📊 PERFORMANCE ANALYSIS:');
        console.log('========================');
        console.log(`File Size: ${stats.size} bytes`);
        console.log(`Processing Time: ${endTime - startTime}ms`);
        console.log(`Throughput: ${(stats.size / (endTime - startTime) * 1000).toFixed(2)} bytes/second`);
        
        if (endTime - startTime > 10000) {
            console.log('⚠️ WARNING: Processing took longer than 10 seconds');
        }
        
        if (endTime - startTime > 30000) {
            console.log('❌ ERROR: Processing timeout likely');
        }
        
        console.log('\n🎯 POTENTIAL ISSUES DETECTED:');
        console.log('=============================');
        
        if (responseData.results.pageCount !== responseData.results.pages?.length) {
            console.log(`⚠️ Page count mismatch: Expected ${responseData.results.pageCount}, got ${responseData.results.pages?.length} pages`);
        }
        
        if (responseData.results.processingMethod === 'text-extraction-fallback') {
            console.log('⚠️ Using fallback method - GraphicsMagick may not be working');
        }
        
        if (endTime - startTime > 5000) {
            console.log('⚠️ Slow processing - may timeout with larger files');
        }
        
        console.log('\n🏁 REALISTIC PDF TEST COMPLETE!');
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        console.error('📍 Stack:', error.stack);
        
        if (error.code === 'ECONNRESET') {
            console.log('🔍 Connection reset - likely timeout or server overload');
        }
        
        if (error.code === 'ENOTFOUND') {
            console.log('🔍 DNS resolution failed - check internet connection');
        }
        
        if (error.message.includes('timeout')) {
            console.log('🔍 Request timeout - file may be too large or processing too slow');
        }
    }
}

testRealisticPDF();
