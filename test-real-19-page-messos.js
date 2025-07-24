#!/usr/bin/env node

/**
 * TEST REAL 19-PAGE MESSOS PDF
 * 
 * Tests the actual 19-page MESSOS document with 35+ ISINs worth 19+ million
 */

const fs = require('fs').promises;
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testReal19PageMessos() {
    console.log('🏦 TESTING REAL 19-PAGE MESSOS PDF');
    console.log('==================================');
    console.log('File: 2. Messos  - 31.03.2025.pdf');
    console.log('Expected: 19 pages, 35+ ISINs, 19+ million value');
    console.log('');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Check file exists and get stats
        const stats = await fs.stat('2. Messos  - 31.03.2025.pdf');
        console.log(`📄 File Size: ${stats.size} bytes (${(stats.size/1024).toFixed(2)} KB)`);
        
        // Test with the real MESSOS PDF
        console.log('\n📤 Uploading Real 19-Page MESSOS PDF...');
        
        const formData = new FormData();
        const fileBuffer = await fs.readFile('2. Messos  - 31.03.2025.pdf');
        formData.append('pdf', fileBuffer, '2. Messos  - 31.03.2025.pdf');
        
        const startTime = Date.now();
        const response = await fetch(`${baseUrl}/api/smart-ocr-process`, {
            method: 'POST',
            body: formData
        });
        const endTime = Date.now();
        
        const responseData = await response.json();
        
        console.log('\n🔍 REAL MESSOS PROCESSING RESULTS:');
        console.log('==================================');
        console.log(`✅ HTTP Status: ${response.status} ${response.statusText}`);
        console.log(`✅ API Success: ${responseData.success}`);
        console.log(`✅ Processing Success: ${responseData.results?.success}`);
        console.log(`⏱️ Processing Time: ${endTime - startTime}ms`);
        console.log(`📊 Accuracy: ${responseData.results?.accuracy}%`);
        console.log(`⚙️ Processing Method: ${responseData.results?.processingMethod}`);
        console.log(`📄 Pages Detected: ${responseData.results?.pageCount}`);
        console.log(`🧠 Patterns Used: ${responseData.results?.patternsUsed}`);
        
        // Analyze OCR results
        if (responseData.results?.ocrResults) {
            console.log('\n📊 OCR RESULTS ANALYSIS:');
            console.log('========================');
            
            const ocrResults = responseData.results.ocrResults;
            console.log(`📑 OCR Results Count: ${ocrResults.length}`);
            
            let totalTextLength = 0;
            let totalISINs = 0;
            let totalCurrencies = 0;
            let totalDates = 0;
            let totalPercentages = 0;
            let totalAccounts = 0;
            
            ocrResults.forEach((result, index) => {
                console.log(`\nPage ${index + 1}:`);
                console.log(`   Method: ${result.method || 'unknown'}`);
                console.log(`   Confidence: ${result.confidence || 'unknown'}`);
                console.log(`   Text Length: ${result.text?.length || 0} characters`);
                
                if (result.text) {
                    totalTextLength += result.text.length;
                }
                
                // Check for enhanced patterns
                if (result.patterns) {
                    const patterns = result.patterns;
                    console.log(`   🎯 PATTERNS DETECTED:`);
                    console.log(`      ISINs: ${patterns.isins?.length || 0}`);
                    console.log(`      Currencies: ${patterns.currencies?.length || 0}`);
                    console.log(`      Dates: ${patterns.dates?.length || 0}`);
                    console.log(`      Percentages: ${patterns.percentages?.length || 0}`);
                    console.log(`      Accounts: ${patterns.accounts?.length || 0}`);
                    
                    totalISINs += patterns.isins?.length || 0;
                    totalCurrencies += patterns.currencies?.length || 0;
                    totalDates += patterns.dates?.length || 0;
                    totalPercentages += patterns.percentages?.length || 0;
                    totalAccounts += patterns.accounts?.length || 0;
                    
                    // Show sample ISINs
                    if (patterns.isins?.length > 0) {
                        console.log(`      Sample ISINs: ${patterns.isins.slice(0, 3).join(', ')}`);
                    }
                    if (patterns.currencies?.length > 0) {
                        console.log(`      Sample Currencies: ${patterns.currencies.slice(0, 3).join(', ')}`);
                    }
                }
            });
            
            console.log('\n🎯 TOTAL EXTRACTION SUMMARY:');
            console.log('============================');
            console.log(`📑 Total Pages Processed: ${ocrResults.length}`);
            console.log(`📝 Total Text Extracted: ${totalTextLength.toLocaleString()} characters`);
            console.log(`🏢 Total ISINs Found: ${totalISINs}`);
            console.log(`💰 Total Currency Values: ${totalCurrencies}`);
            console.log(`📅 Total Dates: ${totalDates}`);
            console.log(`📊 Total Percentages: ${totalPercentages}`);
            console.log(`🏦 Total Account Numbers: ${totalAccounts}`);
            
            // Verify against expectations
            console.log('\n✅ EXPECTATION VERIFICATION:');
            console.log('============================');
            
            if (ocrResults.length === 19) {
                console.log('✅ PAGES: 19 pages processed (MATCHES EXPECTATION)');
            } else {
                console.log(`❌ PAGES: ${ocrResults.length} pages processed (EXPECTED: 19)`);
            }
            
            if (totalISINs >= 35) {
                console.log(`✅ ISINs: ${totalISINs} ISINs found (EXCEEDS EXPECTATION of 35+)`);
            } else {
                console.log(`⚠️ ISINs: ${totalISINs} ISINs found (EXPECTED: 35+)`);
            }
            
            // Estimate portfolio value from currency amounts
            let estimatedValue = 0;
            ocrResults.forEach(result => {
                if (result.patterns?.currencies) {
                    result.patterns.currencies.forEach(currency => {
                        const match = currency.match(/[\d,]+\.?\d*/);
                        if (match) {
                            const value = parseFloat(match[0].replace(/,/g, ''));
                            if (value > 1000) { // Only count significant amounts
                                estimatedValue += value;
                            }
                        }
                    });
                }
            });
            
            console.log(`💰 Estimated Portfolio Value: ${estimatedValue.toLocaleString()}`);
            
            if (estimatedValue >= 19000000) {
                console.log('✅ VALUE: Portfolio value exceeds 19 million (MATCHES EXPECTATION)');
            } else {
                console.log(`⚠️ VALUE: Portfolio value ${estimatedValue.toLocaleString()} (EXPECTED: 19+ million)`);
            }
            
        } else {
            console.log('❌ No OCR results in response');
        }
        
        // Performance analysis
        console.log('\n⚡ PERFORMANCE ANALYSIS:');
        console.log('=======================');
        
        const processingTime = endTime - startTime;
        const fileSize = stats.size;
        const throughput = fileSize / (processingTime / 1000);
        
        console.log(`📄 File Size: ${(fileSize/1024).toFixed(2)} KB`);
        console.log(`⏱️ Processing Time: ${processingTime}ms`);
        console.log(`🚀 Throughput: ${(throughput/1024).toFixed(2)} KB/second`);
        
        if (processingTime < 30000) {
            console.log('✅ PERFORMANCE: Excellent processing speed (<30 seconds)');
        } else if (processingTime < 60000) {
            console.log('✅ PERFORMANCE: Good processing speed (<60 seconds)');
        } else {
            console.log('⚠️ PERFORMANCE: Slow processing (>60 seconds)');
        }
        
        // Final assessment
        console.log('\n🏆 FINAL ASSESSMENT:');
        console.log('====================');
        
        const pagesCorrect = responseData.results?.pageCount === 19;
        const processingSuccessful = responseData.results?.success === true;
        const accuracyGood = responseData.results?.accuracy >= 80;
        
        if (pagesCorrect && processingSuccessful && accuracyGood) {
            console.log('🎉 SUCCESS: Real 19-page MESSOS PDF processing is working excellently!');
            console.log('   - All 19 pages detected and processed');
            console.log('   - Processing completed successfully');
            console.log('   - Accuracy meets expectations');
            console.log('   - System handles large, complex financial documents');
        } else {
            console.log('⚠️ ISSUES DETECTED:');
            if (!pagesCorrect) console.log('   - Page count mismatch');
            if (!processingSuccessful) console.log('   - Processing failed');
            if (!accuracyGood) console.log('   - Accuracy below expectations');
        }
        
        // Save detailed results
        const detailedResults = {
            timestamp: new Date().toISOString(),
            file: '2. Messos  - 31.03.2025.pdf',
            fileSize: stats.size,
            processingTime: processingTime,
            response: responseData,
            analysis: {
                pagesProcessed: responseData.results?.pageCount,
                totalISINs: totalISINs,
                totalCurrencies: totalCurrencies,
                totalTextLength: totalTextLength,
                estimatedValue: estimatedValue,
                accuracy: responseData.results?.accuracy,
                processingMethod: responseData.results?.processingMethod
            }
        };
        
        await fs.writeFile(
            `real-messos-19-page-results-${Date.now()}.json`,
            JSON.stringify(detailedResults, null, 2)
        );
        
        console.log('\n📁 Detailed results saved to JSON file');
        
    } catch (error) {
        console.error('💥 Real MESSOS test failed:', error.message);
        
        if (error.code === 'ENOENT') {
            console.log('📁 File not found. Please ensure "2. Messos  - 31.03.2025.pdf" exists in the current directory.');
        }
    }
}

testReal19PageMessos();
