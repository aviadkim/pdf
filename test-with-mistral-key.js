#!/usr/bin/env node

/**
 * TEST WITH MISTRAL API KEY
 * 
 * Tests the real 19-page MESSOS document with actual Mistral OCR
 * This will show the true capabilities of the system
 */

const fs = require('fs').promises;
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testWithMistralKey() {
    console.log('🔑 TESTING WITH MISTRAL API KEY');
    console.log('===============================');
    console.log('Testing real 19-page MESSOS document with enhanced OCR');
    console.log('');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Check file exists
        const filePath = '2. Messos  - 31.03.2025.pdf';
        const stats = await fs.stat(filePath);
        
        console.log(`📁 File: ${filePath}`);
        console.log(`📊 Size: ${stats.size} bytes (${(stats.size/1024).toFixed(2)} KB)`);
        
        // Test with the real MESSOS PDF
        console.log('\n📤 Uploading Real 19-Page MESSOS PDF with Mistral OCR...');
        
        const formData = new FormData();
        const fileBuffer = await fs.readFile(filePath);
        formData.append('pdf', fileBuffer, filePath);
        
        const startTime = Date.now();
        const response = await fetch(`${baseUrl}/api/smart-ocr-process`, {
            method: 'POST',
            body: formData,
            headers: {
                // Add any additional headers if needed
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
        
        console.log('\n🔍 MISTRAL OCR RESULTS:');
        console.log('=======================');
        console.log(`✅ API Success: ${responseData.success}`);
        console.log(`✅ Processing Success: ${responseData.results?.success}`);
        console.log(`📊 Accuracy: ${responseData.results?.accuracy}%`);
        console.log(`⚙️ Processing Method: ${responseData.results?.processingMethod}`);
        console.log(`📄 Pages Detected: ${responseData.results?.pageCount}`);
        console.log(`🧠 Patterns Used: ${responseData.results?.patternsUsed}`);
        
        // Detailed OCR analysis
        if (responseData.results?.ocrResults) {
            const ocrResults = responseData.results.ocrResults;
            console.log(`\n📊 OCR RESULTS ANALYSIS:`);
            console.log(`📑 OCR Results Count: ${ocrResults.length}`);
            
            let totalTextLength = 0;
            let totalISINs = 0;
            let totalCurrencies = 0;
            let totalDates = 0;
            let mistralPages = 0;
            let enhancedPages = 0;
            
            ocrResults.forEach((result, index) => {
                console.log(`\n📄 Page ${index + 1}:`);
                console.log(`   Method: ${result.method || 'unknown'}`);
                console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
                console.log(`   Text Length: ${result.text?.length || 0} characters`);
                
                if (result.text) {
                    totalTextLength += result.text.length;
                }
                
                // Count processing methods
                if (result.method === 'mistral-ocr-enhanced') {
                    mistralPages++;
                } else if (result.method === 'enhanced-text-extraction') {
                    enhancedPages++;
                }
                
                // Analyze patterns
                if (result.patterns) {
                    const patterns = result.patterns;
                    const isins = patterns.isins?.length || 0;
                    const currencies = patterns.currencies?.length || 0;
                    const dates = patterns.dates?.length || 0;
                    
                    console.log(`   🎯 PATTERNS:`);
                    console.log(`      ISINs: ${isins}`);
                    console.log(`      Currencies: ${currencies}`);
                    console.log(`      Dates: ${dates}`);
                    console.log(`      Percentages: ${patterns.percentages?.length || 0}`);
                    console.log(`      Accounts: ${patterns.accounts?.length || 0}`);
                    
                    totalISINs += isins;
                    totalCurrencies += currencies;
                    totalDates += dates;
                    
                    // Show samples
                    if (isins > 0) {
                        console.log(`      Sample ISINs: ${patterns.isins.slice(0, 3).join(', ')}`);
                    }
                    if (currencies > 0) {
                        console.log(`      Sample Currencies: ${patterns.currencies.slice(0, 3).join(', ')}`);
                    }
                }
                
                // Show text preview
                if (result.text && result.text.length > 100) {
                    const preview = result.text.substring(0, 200).replace(/\s+/g, ' ').trim();
                    console.log(`   📝 Text Preview: "${preview}..."`);
                }
            });
            
            console.log('\n🎯 COMPREHENSIVE ANALYSIS:');
            console.log('==========================');
            console.log(`📑 Total Pages Processed: ${ocrResults.length}`);
            console.log(`📝 Total Text Extracted: ${totalTextLength.toLocaleString()} characters`);
            console.log(`🏢 Total ISINs Found: ${totalISINs}`);
            console.log(`💰 Total Currency Values: ${totalCurrencies}`);
            console.log(`📅 Total Dates: ${totalDates}`);
            console.log(`🔮 Mistral OCR Pages: ${mistralPages}`);
            console.log(`⚡ Enhanced Text Pages: ${enhancedPages}`);
            
            // Calculate averages
            const avgTextPerPage = totalTextLength / ocrResults.length;
            const avgISINsPerPage = totalISINs / ocrResults.length;
            const avgCurrenciesPerPage = totalCurrencies / ocrResults.length;
            
            console.log(`\n📊 AVERAGES:`);
            console.log(`📝 Text per Page: ${avgTextPerPage.toFixed(0)} characters`);
            console.log(`🏢 ISINs per Page: ${avgISINsPerPage.toFixed(1)}`);
            console.log(`💰 Currencies per Page: ${avgCurrenciesPerPage.toFixed(1)}`);
            
            // Validation against expectations
            console.log('\n✅ EXPECTATION VALIDATION:');
            console.log('==========================');
            
            const validations = {
                pages: ocrResults.length === 19,
                isins: totalISINs >= 35,
                processing: ocrResults.length > 0,
                textExtraction: totalTextLength > 10000,
                mistralWorking: mistralPages > 0
            };
            
            if (validations.pages) {
                console.log('✅ PAGES: 19 pages processed (PERFECT MATCH)');
            } else {
                console.log(`❌ PAGES: ${ocrResults.length} pages processed (EXPECTED: 19)`);
            }
            
            if (validations.isins) {
                console.log(`✅ ISINs: ${totalISINs} ISINs found (EXCEEDS EXPECTATION of 35+)`);
            } else {
                console.log(`⚠️ ISINs: ${totalISINs} ISINs found (EXPECTED: 35+, may need optimization)`);
            }
            
            if (validations.textExtraction) {
                console.log(`✅ TEXT EXTRACTION: ${totalTextLength.toLocaleString()} characters (EXCELLENT)`);
            } else {
                console.log(`⚠️ TEXT EXTRACTION: ${totalTextLength} characters (LOW)`);
            }
            
            if (validations.mistralWorking) {
                console.log(`✅ MISTRAL OCR: ${mistralPages} pages processed with Mistral (WORKING)`);
            } else {
                console.log(`⚠️ MISTRAL OCR: Using fallback methods (API key may not be active)`);
            }
            
            // Estimate portfolio value
            let estimatedValue = 0;
            ocrResults.forEach(result => {
                if (result.patterns?.currencies) {
                    result.patterns.currencies.forEach(currency => {
                        const match = currency.match(/[\d,]+\.?\d*/);
                        if (match) {
                            const value = parseFloat(match[0].replace(/,/g, ''));
                            if (value > 1000) {
                                estimatedValue += value;
                            }
                        }
                    });
                }
            });
            
            console.log(`\n💰 PORTFOLIO VALUE ANALYSIS:`);
            console.log(`💵 Estimated Total Value: ${estimatedValue.toLocaleString()}`);
            
            if (estimatedValue >= 19000000) {
                console.log('✅ VALUE: Portfolio value exceeds 19 million (MATCHES EXPECTATION)');
            } else {
                console.log(`⚠️ VALUE: Portfolio value ${estimatedValue.toLocaleString()} (EXPECTED: 19+ million)`);
                console.log('   Note: May need better currency extraction or value aggregation');
            }
            
        } else {
            console.log('❌ No OCR results in response');
        }
        
        // Performance analysis
        console.log('\n⚡ PERFORMANCE METRICS:');
        console.log('======================');
        
        const processingTime = endTime - startTime;
        const fileSize = stats.size;
        const throughput = fileSize / (processingTime / 1000);
        const pagesPerSecond = 19 / (processingTime / 1000);
        
        console.log(`📄 File Size: ${(fileSize/1024).toFixed(2)} KB`);
        console.log(`⏱️ Processing Time: ${processingTime}ms`);
        console.log(`🚀 Throughput: ${(throughput/1024).toFixed(2)} KB/second`);
        console.log(`📊 Pages/Second: ${pagesPerSecond.toFixed(2)} pages/second`);
        
        if (processingTime < 30000) {
            console.log('✅ PERFORMANCE: Excellent (<30 seconds)');
        } else if (processingTime < 60000) {
            console.log('✅ PERFORMANCE: Good (<60 seconds)');
        } else {
            console.log('⚠️ PERFORMANCE: Slow (>60 seconds)');
        }
        
        // Final assessment
        console.log('\n🏆 FINAL ASSESSMENT:');
        console.log('====================');
        
        const accuracy = responseData.results?.accuracy || 0;
        const pagesCorrect = responseData.results?.pageCount === 19;
        const processingSuccessful = responseData.results?.success === true;
        
        if (pagesCorrect && processingSuccessful && accuracy >= 85) {
            console.log('🎉 OUTSTANDING SUCCESS!');
            console.log('   ✅ All 19 pages processed correctly');
            console.log('   ✅ High accuracy achieved');
            console.log('   ✅ Real financial data extracted');
            console.log('   ✅ System ready for production use');
            
            if (accuracy >= 95) {
                console.log('   🏆 EXCEPTIONAL: 95%+ accuracy achieved!');
            }
        } else {
            console.log('⚠️ AREAS FOR IMPROVEMENT:');
            if (!pagesCorrect) console.log('   - Page processing needs optimization');
            if (!processingSuccessful) console.log('   - Processing pipeline needs fixes');
            if (accuracy < 85) console.log('   - Accuracy needs improvement');
        }
        
        // Save comprehensive results
        const detailedResults = {
            timestamp: new Date().toISOString(),
            file: filePath,
            fileSize: stats.size,
            processingTime: processingTime,
            response: responseData,
            analysis: {
                totalPages: responseData.results?.pageCount,
                ocrResultsCount: responseData.results?.ocrResults?.length,
                totalISINs: totalISINs,
                totalCurrencies: totalCurrencies,
                totalTextLength: totalTextLength,
                estimatedValue: estimatedValue,
                accuracy: accuracy,
                processingMethod: responseData.results?.processingMethod,
                mistralPages: mistralPages,
                enhancedPages: enhancedPages
            }
        };
        
        const reportFile = `mistral-ocr-test-results-${Date.now()}.json`;
        await fs.writeFile(reportFile, JSON.stringify(detailedResults, null, 2));
        console.log(`\n📁 Comprehensive results saved: ${reportFile}`);
        
    } catch (error) {
        console.error('💥 Mistral OCR test failed:', error.message);
        
        if (error.code === 'ENOENT') {
            console.log('📁 File not found. Please ensure "2. Messos  - 31.03.2025.pdf" exists.');
        } else if (error.message.includes('timeout')) {
            console.log('⏱️ Request timeout - large file processing may take time');
        } else if (error.message.includes('API')) {
            console.log('🔑 API issue - check Mistral API key configuration');
        }
    }
}

testWithMistralKey();
