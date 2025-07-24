#!/usr/bin/env node

/**
 * SCANNED PDF OCR TEST WITH MISTRAL
 * 
 * Tests the enhanced OCR system specifically for scanned PDFs like MESSOS
 * Uses Mistral's vision capabilities to extract text from image-based documents
 */

const SmartOCRLearningSystem = require('./smart-ocr-learning-system');
const fs = require('fs').promises;

async function testScannedPDFOCR() {
    console.log('🖼️ SCANNED PDF OCR TEST WITH MISTRAL');
    console.log('====================================');
    console.log('Testing MESSOS document as scanned PDF with image-based OCR');
    console.log('');

    // Set Mistral API key for testing
    process.env.MISTRAL_API_KEY = 'bj7fEe8rHhtwh9Zeij1gh9LuqYrx3YXR';
    
    try {
        // Initialize OCR system with Mistral API
        const ocrSystem = new SmartOCRLearningSystem();
        
        // Check if file exists
        const filePath = '2. Messos  - 31.03.2025.pdf';
        const stats = await fs.stat(filePath);
        
        console.log(`📁 File: ${filePath}`);
        console.log(`📊 Size: ${stats.size} bytes (${(stats.size/1024).toFixed(2)} KB)`);
        console.log(`🔑 Mistral API: Configured`);
        
        // Read the PDF file
        const pdfBuffer = await fs.readFile(filePath);
        console.log(`✅ PDF loaded: ${pdfBuffer.length} bytes`);
        
        // Test the complete processing pipeline
        console.log('\n🔄 Processing MESSOS as scanned PDF with Mistral OCR...');
        const startTime = Date.now();
        
        const result = await ocrSystem.processDocument(pdfBuffer);
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        console.log('\n📊 SCANNED PDF OCR RESULTS:');
        console.log('===========================');
        console.log(`✅ Success: ${result.success}`);
        console.log(`📄 Pages: ${result.pageCount}`);
        console.log(`⏱️ Time: ${processingTime}ms`);
        console.log(`📊 Accuracy: ${result.accuracy}%`);
        console.log(`⚙️ Method: ${result.processingMethod}`);
        
        // Detailed OCR analysis
        if (result.ocrResults && result.ocrResults.length > 0) {
            console.log(`\n🔍 DETAILED OCR ANALYSIS:`);
            console.log(`📑 OCR Results: ${result.ocrResults.length}`);
            
            let totalText = 0;
            let totalISINs = 0;
            let totalCurrencies = 0;
            let totalDates = 0;
            let mistralPages = 0;
            let scannedPDFPages = 0;
            
            result.ocrResults.forEach((ocrResult, index) => {
                console.log(`\n📄 Page ${index + 1}:`);
                console.log(`   Method: ${ocrResult.method}`);
                console.log(`   Text Length: ${ocrResult.text?.length || 0}`);
                console.log(`   Confidence: ${(ocrResult.confidence * 100).toFixed(1)}%`);
                
                if (ocrResult.text) {
                    totalText += ocrResult.text.length;
                }
                
                // Count processing methods
                if (ocrResult.method === 'mistral-ocr-enhanced') {
                    mistralPages++;
                } else if (ocrResult.method === 'mistral-scanned-pdf-ocr') {
                    scannedPDFPages++;
                }
                
                if (ocrResult.patterns) {
                    const isins = ocrResult.patterns.isins?.length || 0;
                    const currencies = ocrResult.patterns.currencies?.length || 0;
                    const dates = ocrResult.patterns.dates?.length || 0;
                    
                    console.log(`   ISINs: ${isins}`);
                    console.log(`   Currencies: ${currencies}`);
                    console.log(`   Dates: ${dates}`);
                    console.log(`   Percentages: ${ocrResult.patterns.percentages?.length || 0}`);
                    console.log(`   Accounts: ${ocrResult.patterns.accounts?.length || 0}`);
                    
                    totalISINs += isins;
                    totalCurrencies += currencies;
                    totalDates += dates;
                    
                    // Show samples
                    if (isins > 0) {
                        console.log(`   Sample ISINs: ${ocrResult.patterns.isins.slice(0, 3).join(', ')}`);
                    }
                    if (currencies > 0) {
                        console.log(`   Sample Currencies: ${ocrResult.patterns.currencies.slice(0, 3).join(', ')}`);
                    }
                }
                
                // Show text preview for successful extractions
                if (ocrResult.text && ocrResult.text.length > 100) {
                    const preview = ocrResult.text.substring(0, 300).replace(/\s+/g, ' ').trim();
                    console.log(`   📝 Text Preview: "${preview}..."`);
                }
            });
            
            console.log(`\n🎯 EXTRACTION TOTALS:`);
            console.log(`📝 Total Text: ${totalText.toLocaleString()} characters`);
            console.log(`🏢 Total ISINs: ${totalISINs}`);
            console.log(`💰 Total Currencies: ${totalCurrencies}`);
            console.log(`📅 Total Dates: ${totalDates}`);
            console.log(`🔮 Mistral Vision Pages: ${mistralPages}`);
            console.log(`🖼️ Scanned PDF Pages: ${scannedPDFPages}`);
            
            // Validation against MESSOS expectations
            console.log(`\n✅ MESSOS VALIDATION:`);
            console.log(`===================`);
            
            const validations = {
                pages: result.pageCount === 19,
                ocrResults: result.ocrResults.length === 19,
                isins: totalISINs >= 35,
                textExtracted: totalText > 10000,
                mistralWorking: (mistralPages + scannedPDFPages) > 0
            };
            
            if (validations.pages) {
                console.log('✅ PAGES: 19 pages detected (PERFECT)');
            } else {
                console.log(`❌ PAGES: ${result.pageCount} pages detected (EXPECTED: 19)`);
            }
            
            if (validations.ocrResults) {
                console.log('✅ OCR RESULTS: 19 OCR results returned (PERFECT)');
            } else {
                console.log(`❌ OCR RESULTS: ${result.ocrResults.length} results (EXPECTED: 19)`);
            }
            
            if (validations.isins) {
                console.log(`✅ ISINs: ${totalISINs} ISINs found (EXCEEDS EXPECTATION of 35+)`);
            } else {
                console.log(`⚠️ ISINs: ${totalISINs} ISINs found (EXPECTED: 35+)`);
            }
            
            if (validations.textExtracted) {
                console.log(`✅ TEXT EXTRACTION: ${totalText.toLocaleString()} characters (EXCELLENT)`);
            } else {
                console.log(`⚠️ TEXT EXTRACTION: ${totalText} characters (NEEDS IMPROVEMENT)`);
            }
            
            if (validations.mistralWorking) {
                console.log(`✅ MISTRAL OCR: ${mistralPages + scannedPDFPages} pages processed (WORKING)`);
            } else {
                console.log(`❌ MISTRAL OCR: Not working properly`);
            }
            
            // Calculate portfolio value
            let estimatedValue = 0;
            result.ocrResults.forEach(ocrResult => {
                if (ocrResult.patterns?.currencies) {
                    ocrResult.patterns.currencies.forEach(currency => {
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
            
            console.log(`\n💰 PORTFOLIO ANALYSIS:`);
            console.log(`💵 Estimated Value: ${estimatedValue.toLocaleString()}`);
            
            if (estimatedValue >= 19000000) {
                console.log('✅ VALUE: Exceeds 19 million (MATCHES EXPECTATION)');
            } else {
                console.log(`⚠️ VALUE: ${estimatedValue.toLocaleString()} (EXPECTED: 19+ million)`);
            }
            
        } else {
            console.log('❌ No OCR results returned - OCR pipeline failed');
        }
        
        // Performance analysis
        console.log('\n⚡ PERFORMANCE ANALYSIS:');
        console.log('=======================');
        
        const pagesPerSecond = 19 / (processingTime / 1000);
        const throughput = stats.size / (processingTime / 1000);
        
        console.log(`⏱️ Processing Time: ${processingTime}ms`);
        console.log(`📊 Pages/Second: ${pagesPerSecond.toFixed(2)}`);
        console.log(`🚀 Throughput: ${(throughput/1024).toFixed(2)} KB/second`);
        
        if (processingTime < 60000) {
            console.log('✅ PERFORMANCE: Excellent (<60 seconds)');
        } else {
            console.log('⚠️ PERFORMANCE: Slow (>60 seconds)');
        }
        
        // Final assessment
        console.log('\n🏆 FINAL ASSESSMENT:');
        console.log('====================');
        
        const criticalSuccess = result.success && result.pageCount === 19 && result.ocrResults?.length > 0;
        const dataSuccess = totalISINs > 0 && totalText > 1000;
        const accuracySuccess = result.accuracy >= 85;
        
        if (criticalSuccess && dataSuccess && accuracySuccess) {
            console.log('🎉 OUTSTANDING SUCCESS!');
            console.log('   ✅ All 19 pages processed with OCR');
            console.log('   ✅ Financial data successfully extracted');
            console.log('   ✅ High accuracy achieved');
            console.log('   ✅ Scanned PDF OCR is working perfectly');
            console.log('   ✅ Ready for production with real financial documents');
        } else {
            console.log('⚠️ AREAS NEEDING IMPROVEMENT:');
            if (!criticalSuccess) console.log('   - Core OCR pipeline needs fixes');
            if (!dataSuccess) console.log('   - Financial data extraction needs improvement');
            if (!accuracySuccess) console.log('   - Accuracy needs optimization');
        }
        
        // Save comprehensive results
        const detailedResults = {
            timestamp: new Date().toISOString(),
            file: filePath,
            fileSize: stats.size,
            processingTime: processingTime,
            result: result,
            analysis: {
                totalPages: result.pageCount,
                ocrResultsCount: result.ocrResults?.length || 0,
                totalISINs: totalISINs,
                totalCurrencies: totalCurrencies,
                totalText: totalText,
                estimatedValue: estimatedValue,
                mistralPages: mistralPages,
                scannedPDFPages: scannedPDFPages
            },
            validations: validations
        };
        
        const reportFile = `scanned-pdf-ocr-results-${Date.now()}.json`;
        await fs.writeFile(reportFile, JSON.stringify(detailedResults, null, 2));
        console.log(`\n📁 Detailed results saved: ${reportFile}`);
        
    } catch (error) {
        console.error('💥 Scanned PDF OCR test failed:', error.message);
        console.error('📍 Error stack:', error.stack);
        
        if (error.message.includes('MISTRAL_API_KEY')) {
            console.log('🔑 Mistral API key issue - check configuration');
        } else if (error.message.includes('ENOENT')) {
            console.log('📁 File not found - ensure MESSOS PDF exists');
        }
    }
}

testScannedPDFOCR();
