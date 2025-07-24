#!/usr/bin/env node

/**
 * TEST MISTRAL DIRECT API
 * 
 * Test the Mistral OCR Real API directly with the MESSOS document
 * This bypasses the Smart OCR Learning System to test Mistral directly
 */

const fs = require('fs').promises;
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testMistralDirectAPI() {
    console.log('🔑 TESTING MISTRAL DIRECT API');
    console.log('=============================');
    console.log('Testing Mistral OCR Real API directly with MESSOS');
    console.log('');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Read the MESSOS file
        const filePath = '2. Messos  - 31.03.2025.pdf';
        const fileBuffer = await fs.readFile(filePath);
        const stats = await fs.stat(filePath);
        
        console.log(`📁 File: ${filePath}`);
        console.log(`📊 Size: ${fileBuffer.length} bytes (${(stats.size/1024).toFixed(2)} KB)`);
        
        // Test the Mistral OCR Real API endpoint directly
        console.log('\n📤 Testing Mistral OCR Real API endpoint...');
        
        const formData = new FormData();
        formData.append('pdf', fileBuffer, {
            filename: filePath,
            contentType: 'application/pdf'
        });
        
        const startTime = Date.now();
        
        // Try the mistral-ocr-real-api endpoint
        const response = await fetch(`${baseUrl}/api/mistral-ocr-real-api`, {
            method: 'POST',
            body: formData,
            headers: {
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
        
        console.log('\n🔍 MISTRAL DIRECT API RESPONSE:');
        console.log('===============================');
        console.log(`✅ Success: ${responseData.success}`);
        console.log(`📄 Results exist: ${!!responseData.results}`);
        
        if (responseData.results) {
            const results = responseData.results;
            console.log(`✅ Results success: ${results.success}`);
            console.log(`📊 Accuracy: ${results.accuracy}%`);
            console.log(`⚙️ Processing method: ${results.processingMethod}`);
            console.log(`📄 Page count: ${results.pageCount}`);
            
            // Check securities
            if (results.securities) {
                console.log(`\n🏢 SECURITIES ANALYSIS:`);
                console.log(`📊 Securities count: ${results.securities.length}`);
                
                if (results.securities.length > 0) {
                    console.log('✅ EXCELLENT: Securities found!');
                    
                    // Show first few securities
                    results.securities.slice(0, 5).forEach((security, index) => {
                        console.log(`\nSecurity ${index + 1}:`);
                        console.log(`   ISIN: ${security.isin}`);
                        console.log(`   Company: ${security.company}`);
                        console.log(`   Value: ${security.value}`);
                        console.log(`   Quantity: ${security.quantity}`);
                        console.log(`   Confidence: ${security.confidence}`);
                    });
                    
                    // Calculate totals
                    const totalValue = results.securities.reduce((sum, s) => {
                        const value = parseFloat(s.value?.toString().replace(/[^\d.-]/g, '')) || 0;
                        return sum + value;
                    }, 0);
                    
                    console.log(`\n💰 PORTFOLIO TOTALS:`);
                    console.log(`📊 Total Securities: ${results.securities.length}`);
                    console.log(`💵 Total Value: ${totalValue.toLocaleString()}`);
                    
                    if (results.securities.length >= 35) {
                        console.log('🎉 MEETS EXPECTATION: 35+ securities found!');
                    } else {
                        console.log(`⚠️ BELOW EXPECTATION: ${results.securities.length} securities (expected 35+)`);
                    }
                    
                    if (totalValue >= 19000000) {
                        console.log('🎉 MEETS EXPECTATION: Portfolio value exceeds 19 million!');
                    } else {
                        console.log(`⚠️ BELOW EXPECTATION: Portfolio value ${totalValue.toLocaleString()} (expected 19+ million)`);
                    }
                    
                } else {
                    console.log('❌ NO SECURITIES: Mistral OCR not extracting financial data');
                }
            }
            
            // Check metadata
            if (results.metadata) {
                console.log(`\n📊 METADATA ANALYSIS:`);
                console.log(`📄 Markdown output length: ${results.metadata.markdownOutput?.length || 0}`);
                console.log(`📊 Tables found: ${results.metadata.tablesFound || 0}`);
                console.log(`🔍 Processing details: ${results.metadata.processingDetails || 'none'}`);
                
                if (results.metadata.markdownOutput && results.metadata.markdownOutput.length > 1000) {
                    console.log('✅ GOOD: Substantial text extracted from document');
                    
                    // Show preview of extracted text
                    const preview = results.metadata.markdownOutput.substring(0, 500).replace(/\s+/g, ' ').trim();
                    console.log(`📝 Text Preview: "${preview}..."`);
                } else {
                    console.log('❌ POOR: Little or no text extracted');
                }
            }
            
            // Check summary
            if (results.summary) {
                console.log(`\n📈 SUMMARY ANALYSIS:`);
                console.log(`📊 Accuracy: ${results.summary.accuracy}%`);
                console.log(`🎯 Confidence: ${results.summary.averageConfidence}`);
                console.log(`📄 Total pages: ${results.summary.totalPages}`);
                console.log(`🏢 Securities processed: ${results.summary.securitiesProcessed}`);
                console.log(`💰 Total value: ${results.summary.totalValue}`);
            }
        }
        
        // Final assessment
        console.log('\n🏆 MISTRAL DIRECT API ASSESSMENT:');
        console.log('==================================');
        
        const hasSecurities = responseData.results?.securities?.length > 0;
        const hasText = responseData.results?.metadata?.markdownOutput?.length > 1000;
        const processingSuccessful = responseData.results?.success === true;
        
        if (hasSecurities && hasText && processingSuccessful) {
            console.log('🎉 SUCCESS: Mistral Direct API is working excellently!');
            console.log('   ✅ Securities extraction working');
            console.log('   ✅ Text extraction working');
            console.log('   ✅ Processing successful');
            console.log('   ✅ Ready for production use');
        } else {
            console.log('⚠️ ISSUES WITH MISTRAL DIRECT API:');
            if (!hasSecurities) console.log('   - Securities extraction not working');
            if (!hasText) console.log('   - Text extraction insufficient');
            if (!processingSuccessful) console.log('   - Processing failed');
        }
        
        // Save the response
        const responseFile = `mistral-direct-api-response-${Date.now()}.json`;
        await fs.writeFile(responseFile, JSON.stringify(responseData, null, 2));
        console.log(`\n📁 Full response saved: ${responseFile}`);
        
    } catch (error) {
        console.error('💥 Mistral Direct API test failed:', error.message);
        
        if (error.message.includes('ENOTFOUND')) {
            console.log('🌐 Network error - check API endpoint');
        } else if (error.message.includes('timeout')) {
            console.log('⏱️ Request timeout - large file processing');
        } else if (error.message.includes('404')) {
            console.log('🔍 Endpoint not found - check API path');
        }
        
        console.error('📍 Full error:', error.stack);
    }
}

testMistralDirectAPI();
