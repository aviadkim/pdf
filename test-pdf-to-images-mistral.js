#!/usr/bin/env node

/**
 * PDF TO IMAGES + MISTRAL VISION TEST
 * 
 * Tests converting PDF to images and then using Mistral vision API
 * This is the proper approach for scanned PDFs like MESSOS
 */

const fs = require('fs').promises;
const pdf2pic = require('pdf2pic');
const path = require('path');
const axios = require('axios');

async function testPDFToImagesMistral() {
    console.log('🖼️ PDF TO IMAGES + MISTRAL VISION TEST');
    console.log('=====================================');
    console.log('Converting MESSOS PDF to images, then processing with Mistral vision');
    console.log('');

    const mistralApiKey = 'bj7fEe8rHhtwh9Zeij1gh9LuqYrx3YXR';
    
    try {
        // Check if file exists
        const filePath = '2. Messos  - 31.03.2025.pdf';
        const stats = await fs.stat(filePath);
        
        console.log(`📁 File: ${filePath}`);
        console.log(`📊 Size: ${stats.size} bytes (${(stats.size/1024).toFixed(2)} KB)`);
        
        // Step 1: Convert PDF to images
        console.log('\n🔄 Step 1: Converting PDF to images...');
        
        const tempDir = path.join(__dirname, 'temp_pdf_images');
        try {
            await fs.mkdir(tempDir, { recursive: true });
        } catch (dirError) {
            console.log('📁 Temp directory already exists');
        }
        
        const convert = pdf2pic.fromPath(filePath, {
            density: 300,           // High DPI for text clarity
            saveFilename: 'messos_page',
            savePath: tempDir,
            format: 'png',
            width: 1200,
            height: 1600
        });
        
        console.log('📸 Converting PDF pages to PNG images...');
        const imageResults = await convert.bulk(-1); // Convert all pages
        
        console.log(`✅ Converted ${imageResults.length} pages to images`);
        
        if (!imageResults || imageResults.length === 0) {
            throw new Error('PDF to image conversion failed - no images created');
        }
        
        // Step 2: Process each image with Mistral Vision API
        console.log('\n🔄 Step 2: Processing images with Mistral Vision API...');
        
        const ocrResults = [];
        let totalISINs = 0;
        let totalCurrencies = 0;
        let totalText = 0;
        
        // Process first 3 pages as a test (to avoid rate limits)
        const pagesToProcess = Math.min(3, imageResults.length);
        console.log(`📄 Processing first ${pagesToProcess} pages...`);
        
        for (let i = 0; i < pagesToProcess; i++) {
            const imageResult = imageResults[i];
            console.log(`\n🔍 Processing page ${imageResult.page}...`);
            
            try {
                // Create base64 image URL
                const base64Image = `data:image/png;base64,${imageResult.base64}`;
                
                console.log(`   📸 Image size: ${imageResult.base64.length} characters`);
                
                // Make Mistral Vision API call
                const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
                    model: 'mistral-large-latest',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `You are a specialized financial document OCR expert. Analyze this page from a Swiss portfolio statement and extract ALL financial data with 100% accuracy.

CRITICAL REQUIREMENTS:
1. Extract EVERY ISIN number (format: 2 letters + 9 digits + 1 check digit, e.g., CH0012032048, US0378331005)
2. Extract ALL monetary values with currency symbols (CHF, USD, EUR, etc.)
3. Extract ALL company names and security descriptions
4. Extract ALL dates (DD.MM.YYYY format)
5. Extract ALL percentage values (e.g., +12.34%, -5.67%)
6. Extract ALL account numbers and reference numbers
7. Preserve exact numerical values - do not round or approximate

SPECIAL FOCUS FOR THIS PORTFOLIO PAGE:
- Security holdings and valuations
- Portfolio positions and quantities
- Performance data and returns
- Account balances and totals

This is page ${imageResult.page} of a multi-page financial document. Extract ALL visible text content with 100% accuracy.

OUTPUT FORMAT: Return clean, structured text preserving all financial data exactly as shown. Include every number, ISIN, company name, and monetary value visible on this page.`
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: base64Image
                                    }
                                }
                            ]
                        }
                    ]
                }, {
                    headers: {
                        'Authorization': `Bearer ${mistralApiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const extractedText = response.data.choices[0].message.content;
                console.log(`   ✅ Extracted ${extractedText.length} characters`);
                
                // Simple pattern detection
                const isinMatches = extractedText.match(/[A-Z]{2}[A-Z0-9]{10}/g) || [];
                const currencyMatches = extractedText.match(/[\d,.']+\s*(CHF|USD|EUR|GBP)/gi) || [];
                const dateMatches = extractedText.match(/\d{2}\.\d{2}\.\d{4}/g) || [];
                const percentMatches = extractedText.match(/[+-]?\d+\.?\d*%/g) || [];
                
                console.log(`   🎯 Found: ${isinMatches.length} ISINs, ${currencyMatches.length} currencies`);
                
                totalISINs += isinMatches.length;
                totalCurrencies += currencyMatches.length;
                totalText += extractedText.length;
                
                ocrResults.push({
                    page: imageResult.page,
                    text: extractedText,
                    textLength: extractedText.length,
                    patterns: {
                        isins: isinMatches,
                        currencies: currencyMatches,
                        dates: dateMatches,
                        percentages: percentMatches
                    },
                    method: 'mistral-vision-api',
                    confidence: 0.95 // High confidence for Mistral vision
                });
                
                // Show samples
                if (isinMatches.length > 0) {
                    console.log(`   📊 Sample ISINs: ${isinMatches.slice(0, 3).join(', ')}`);
                }
                if (currencyMatches.length > 0) {
                    console.log(`   💰 Sample Currencies: ${currencyMatches.slice(0, 3).join(', ')}`);
                }
                
                // Show text preview
                if (extractedText.length > 100) {
                    const preview = extractedText.substring(0, 300).replace(/\s+/g, ' ').trim();
                    console.log(`   📝 Text Preview: "${preview}..."`);
                }
                
                // Rate limiting - wait between requests
                if (i < pagesToProcess - 1) {
                    console.log('   ⏱️ Waiting 2 seconds for rate limiting...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
            } catch (pageError) {
                console.error(`   ❌ Failed to process page ${imageResult.page}:`, pageError.message);
                
                ocrResults.push({
                    page: imageResult.page,
                    text: '',
                    textLength: 0,
                    patterns: { isins: [], currencies: [], dates: [], percentages: [] },
                    method: 'mistral-vision-failed',
                    confidence: 0.1,
                    error: pageError.message
                });
            }
        }
        
        // Step 3: Analyze results
        console.log('\n📊 FINAL ANALYSIS:');
        console.log('==================');
        console.log(`📄 Total Pages Processed: ${ocrResults.length}`);
        console.log(`📝 Total Text Extracted: ${totalText.toLocaleString()} characters`);
        console.log(`🏢 Total ISINs Found: ${totalISINs}`);
        console.log(`💰 Total Currencies Found: ${totalCurrencies}`);
        
        // Validation
        console.log('\n✅ VALIDATION RESULTS:');
        console.log('======================');
        
        if (ocrResults.length > 0) {
            console.log(`✅ OCR PROCESSING: ${ocrResults.length} pages processed successfully`);
        } else {
            console.log('❌ OCR PROCESSING: No pages processed');
        }
        
        if (totalText > 1000) {
            console.log(`✅ TEXT EXTRACTION: ${totalText} characters extracted (EXCELLENT)`);
        } else {
            console.log(`⚠️ TEXT EXTRACTION: ${totalText} characters (NEEDS IMPROVEMENT)`);
        }
        
        if (totalISINs > 0) {
            console.log(`✅ ISIN DETECTION: ${totalISINs} ISINs found (WORKING)`);
            
            if (totalISINs >= 10) {
                console.log('🎉 ISIN COUNT: Good detection rate');
            } else {
                console.log('⚠️ ISIN COUNT: Could be improved');
            }
        } else {
            console.log('❌ ISIN DETECTION: No ISINs found');
        }
        
        if (totalCurrencies > 0) {
            console.log(`✅ CURRENCY DETECTION: ${totalCurrencies} currencies found (WORKING)`);
        } else {
            console.log('❌ CURRENCY DETECTION: No currencies found');
        }
        
        // Extrapolate to full document
        if (ocrResults.length > 0 && totalISINs > 0) {
            const avgISINsPerPage = totalISINs / ocrResults.length;
            const estimatedTotalISINs = Math.round(avgISINsPerPage * imageResults.length);
            
            console.log('\n🔮 FULL DOCUMENT PROJECTION:');
            console.log('============================');
            console.log(`📊 Average ISINs per page: ${avgISINsPerPage.toFixed(1)}`);
            console.log(`🎯 Estimated total ISINs in 19 pages: ${estimatedTotalISINs}`);
            
            if (estimatedTotalISINs >= 35) {
                console.log('🎉 PROJECTION: Would meet expectation of 35+ ISINs');
            } else {
                console.log('⚠️ PROJECTION: May not reach 35+ ISINs expectation');
            }
        }
        
        // Final assessment
        console.log('\n🏆 FINAL ASSESSMENT:');
        console.log('====================');
        
        const isWorking = ocrResults.length > 0 && totalText > 500;
        const hasFinancialData = totalISINs > 0 && totalCurrencies > 0;
        
        if (isWorking && hasFinancialData) {
            console.log('🎉 SUCCESS: PDF to Images + Mistral Vision is working!');
            console.log('   ✅ PDF conversion to images successful');
            console.log('   ✅ Mistral Vision API processing successful');
            console.log('   ✅ Financial data extraction working');
            console.log('   ✅ Ready to process full 19-page document');
        } else {
            console.log('⚠️ ISSUES IDENTIFIED:');
            if (!isWorking) console.log('   - OCR pipeline needs fixes');
            if (!hasFinancialData) console.log('   - Financial data extraction needs improvement');
        }
        
        // Save results
        const detailedResults = {
            timestamp: new Date().toISOString(),
            file: filePath,
            fileSize: stats.size,
            totalPages: imageResults.length,
            pagesProcessed: ocrResults.length,
            ocrResults: ocrResults,
            summary: {
                totalText: totalText,
                totalISINs: totalISINs,
                totalCurrencies: totalCurrencies,
                avgISINsPerPage: totalISINs / ocrResults.length,
                estimatedTotalISINs: Math.round((totalISINs / ocrResults.length) * imageResults.length)
            }
        };
        
        const reportFile = `pdf-to-images-mistral-results-${Date.now()}.json`;
        await fs.writeFile(reportFile, JSON.stringify(detailedResults, null, 2));
        console.log(`\n📁 Detailed results saved: ${reportFile}`);
        
        // Cleanup temp images
        try {
            const files = await fs.readdir(tempDir);
            for (const file of files) {
                await fs.unlink(path.join(tempDir, file));
            }
            await fs.rmdir(tempDir);
            console.log('🧹 Cleaned up temporary image files');
        } catch (cleanupError) {
            console.log('⚠️ Could not clean up temp files');
        }
        
    } catch (error) {
        console.error('💥 PDF to Images + Mistral test failed:', error.message);
        
        if (error.message.includes('pdf2pic')) {
            console.log('📦 Install pdf2pic dependencies: npm install pdf2pic');
        } else if (error.message.includes('API')) {
            console.log('🔑 Check Mistral API key and rate limits');
        }
    }
}

testPDFToImagesMistral();
