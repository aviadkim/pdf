#!/usr/bin/env node

/**
 * TEST REAL MESSOS API
 * 
 * Test the API with the actual MESSOS document to get full extraction
 */

const fs = require('fs').promises;
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testRealMessosAPI() {
    console.log('📄 TESTING REAL MESSOS API');
    console.log('==========================');
    console.log('Testing API with actual 19-page MESSOS document');
    console.log('');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Read the actual MESSOS file
        const filePath = '2. Messos  - 31.03.2025.pdf';
        const fileBuffer = await fs.readFile(filePath);
        const stats = await fs.stat(filePath);
        
        console.log(`📁 File: ${filePath}`);
        console.log(`📊 Size: ${fileBuffer.length} bytes (${(stats.size/1024).toFixed(2)} KB)`);
        console.log(`🔍 Buffer type: ${Buffer.isBuffer(fileBuffer) ? 'Buffer' : typeof fileBuffer}`);
        
        // Upload the real MESSOS file
        console.log('\n📤 Uploading REAL MESSOS document...');
        
        const formData = new FormData();
        formData.append('pdf', fileBuffer, {
            filename: filePath,
            contentType: 'application/pdf'
        });
        
        console.log('📋 FormData created with PDF buffer');
        
        const startTime = Date.now();
        const response = await fetch(`${baseUrl}/api/smart-ocr-process`, {
            method: 'POST',
            body: formData,
            headers: {
                // Let FormData set the Content-Type with boundary
                ...formData.getHeaders()
            }
        });
        const endTime = Date.now();
        
        console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
        console.log(`⏱️ Processing Time: ${endTime - startTime}ms`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ HTTP Error: ${errorText}`);
            return;
        }
        
        const responseData = await response.json();
        
        console.log('\n📊 REAL MESSOS API RESPONSE:');
        console.log('============================');
        console.log(`✅ Success: ${responseData.success}`);
        console.log(`📄 Results exist: ${!!responseData.results}`);
        
        if (responseData.results) {
            const results = responseData.results;
            console.log(`✅ Results success: ${results.success}`);
            console.log(`📊 Accuracy: ${results.accuracy}%`);
            console.log(`⚙️ Processing method: ${results.processingMethod}`);
            console.log(`📄 Page count: ${results.pageCount}`);
            console.log(`🧠 Patterns used: ${results.patternsUsed}`);
            
            // Check pages
            if (results.pages) {
                console.log(`\n📑 PAGES ANALYSIS:`);
                console.log(`📄 Pages array length: ${results.pages.length}`);
                
                if (results.pages.length === 19) {
                    console.log('✅ CORRECT: 19 pages detected (matches MESSOS)');
                } else {
                    console.log(`❌ WRONG: ${results.pages.length} pages (expected 19)`);
                }
                
                // Analyze first few pages
                results.pages.slice(0, 3).forEach((page, index) => {
                    console.log(`\nPage ${index + 1}:`);
                    console.log(`   Method: ${page.method}`);
                    console.log(`   Has text: ${!!page.text}`);
                    console.log(`   Text length: ${page.text?.length || 0}`);
                    console.log(`   Has base64: ${!!page.base64}`);
                    console.log(`   Base64 length: ${page.base64?.length || 0}`);
                    
                    if (page.text && page.text.length > 0) {
                        const preview = page.text.substring(0, 200).replace(/\s+/g, ' ').trim();
                        console.log(`   Text preview: "${preview}..."`);
                    }
                });
            }
            
            // Check OCR results
            if (results.ocrResults) {
                console.log(`\n🔍 OCR RESULTS ANALYSIS:`);
                console.log(`📑 OCR results length: ${results.ocrResults.length}`);
                
                if (results.ocrResults.length === 19) {
                    console.log('✅ CORRECT: 19 OCR results (matches MESSOS)');
                } else {
                    console.log(`❌ WRONG: ${results.ocrResults.length} OCR results (expected 19)`);
                }
                
                let totalText = 0;
                let totalISINs = 0;
                let totalCurrencies = 0;
                let mistralPages = 0;
                
                results.ocrResults.forEach((ocrResult, index) => {
                    console.log(`\nOCR Result ${index + 1}:`);
                    console.log(`   Method: ${ocrResult.method}`);
                    console.log(`   Success: ${ocrResult.success}`);
                    console.log(`   Text length: ${ocrResult.text?.length || 0}`);
                    console.log(`   Securities: ${ocrResult.securities?.length || 0}`);
                    
                    if (ocrResult.text) {
                        totalText += ocrResult.text.length;
                    }
                    
                    if (ocrResult.method?.includes('mistral')) {
                        mistralPages++;
                    }
                    
                    if (ocrResult.securities && ocrResult.securities.length > 0) {
                        totalISINs += ocrResult.securities.length;
                        console.log(`   Sample securities: ${ocrResult.securities.slice(0, 2).map(s => s.isin || s.company).join(', ')}`);
                    }
                    
                    // Look for patterns in text
                    if (ocrResult.text) {
                        const isinMatches = ocrResult.text.match(/[A-Z]{2}[A-Z0-9]{10}/g) || [];
                        const currencyMatches = ocrResult.text.match(/[\d,.']+\s*(CHF|USD|EUR)/gi) || [];
                        
                        totalISINs += isinMatches.length;
                        totalCurrencies += currencyMatches.length;
                        
                        if (isinMatches.length > 0) {
                            console.log(`   ISINs in text: ${isinMatches.slice(0, 3).join(', ')}`);
                        }
                        if (currencyMatches.length > 0) {
                            console.log(`   Currencies in text: ${currencyMatches.slice(0, 3).join(', ')}`);
                        }
                    }
                });
                
                console.log(`\n🎯 EXTRACTION TOTALS:`);
                console.log(`📝 Total text: ${totalText.toLocaleString()} characters`);
                console.log(`🏢 Total ISINs: ${totalISINs}`);
                console.log(`💰 Total currencies: ${totalCurrencies}`);
                console.log(`🔮 Mistral pages: ${mistralPages}`);
            }
            
            // Check securities directly
            if (results.securities) {
                console.log(`\n🏢 SECURITIES ANALYSIS:`);
                console.log(`📊 Securities count: ${results.securities.length}`);
                
                if (results.securities.length >= 35) {
                    console.log('✅ EXCELLENT: Securities count meets expectation (35+)');
                } else {
                    console.log(`⚠️ LOW: ${results.securities.length} securities (expected 35+)`);
                }
                
                // Show sample securities
                results.securities.slice(0, 5).forEach((security, index) => {
                    console.log(`Security ${index + 1}:`);
                    console.log(`   ISIN: ${security.isin}`);
                    console.log(`   Company: ${security.company}`);
                    console.log(`   Value: ${security.value}`);
                    console.log(`   Quantity: ${security.quantity}`);
                });
            }
        }
        
        // Final validation
        console.log('\n✅ MESSOS VALIDATION:');
        console.log('=====================');
        
        const pageCountCorrect = responseData.results?.pageCount === 19;
        const hasOCRResults = responseData.results?.ocrResults?.length > 0;
        const hasSecurities = responseData.results?.securities?.length > 0;
        const processingSuccessful = responseData.results?.success === true;
        
        if (pageCountCorrect) {
            console.log('✅ PAGE COUNT: 19 pages (PERFECT)');
        } else {
            console.log(`❌ PAGE COUNT: ${responseData.results?.pageCount} (EXPECTED: 19)`);
        }
        
        if (hasOCRResults) {
            console.log('✅ OCR RESULTS: Present');
        } else {
            console.log('❌ OCR RESULTS: Missing');
        }
        
        if (hasSecurities) {
            console.log('✅ SECURITIES: Present');
        } else {
            console.log('❌ SECURITIES: Missing');
        }
        
        if (processingSuccessful) {
            console.log('✅ PROCESSING: Successful');
        } else {
            console.log('❌ PROCESSING: Failed');
        }
        
        // Overall assessment
        if (pageCountCorrect && hasOCRResults && processingSuccessful) {
            console.log('\n🎉 SUCCESS: Real MESSOS processing is working!');
            
            if (hasSecurities) {
                console.log('🏆 EXCELLENT: Financial data extraction is working!');
            } else {
                console.log('⚠️ PARTIAL: Need to improve financial data extraction');
            }
        } else {
            console.log('\n❌ ISSUES: Real MESSOS processing needs fixes');
        }
        
        // Save the response for analysis
        const responseFile = `real-messos-api-response-${Date.now()}.json`;
        await fs.writeFile(responseFile, JSON.stringify(responseData, null, 2));
        console.log(`\n📁 Full response saved: ${responseFile}`);
        
    } catch (error) {
        console.error('💥 Real MESSOS API test failed:', error.message);
        
        if (error.code === 'ENOENT') {
            console.log('📁 MESSOS file not found - check file path');
        } else if (error.message.includes('fetch')) {
            console.log('🌐 Network error - check API endpoint');
        } else if (error.message.includes('timeout')) {
            console.log('⏱️ Request timeout - large file processing');
        }
        
        console.error('📍 Full error:', error.stack);
    }
}

testRealMessosAPI();
