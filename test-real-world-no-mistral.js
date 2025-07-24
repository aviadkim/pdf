#!/usr/bin/env node

/**
 * REAL-WORLD TESTING WITHOUT MISTRAL
 * 
 * Tests the OCR system with text extraction fallback (no Mistral API required)
 * This tests the core PDF processing pipeline with the real MESSOS document
 */

const SmartOCRLearningSystem = require('./smart-ocr-learning-system');
const fs = require('fs').promises;

async function testRealWorldNoMistral() {
    console.log('🌍 REAL-WORLD TESTING (NO MISTRAL API)');
    console.log('======================================');
    console.log('Testing core PDF processing with text extraction fallback');
    console.log('');

    try {
        // Initialize OCR system
        const ocrSystem = new SmartOCRLearningSystem();
        
        // Check if file exists
        const filePath = '2. Messos  - 31.03.2025.pdf';
        const stats = await fs.stat(filePath);
        
        console.log(`📁 File: ${filePath}`);
        console.log(`📊 Size: ${stats.size} bytes (${(stats.size/1024).toFixed(2)} KB)`);
        
        // Read the PDF file
        const pdfBuffer = await fs.readFile(filePath);
        console.log(`✅ PDF loaded: ${pdfBuffer.length} bytes`);
        
        // Test the convertPDFToImages function directly
        console.log('\n🔄 Testing PDF to Images conversion...');
        const images = await ocrSystem.convertPDFToImages(pdfBuffer);
        
        console.log('\n📊 IMAGE CONVERSION RESULTS:');
        console.log('============================');
        console.log(`📑 Images/Pages: ${images.length}`);
        
        if (images.length === 19) {
            console.log('✅ PAGES: 19 pages detected (CORRECT)');
        } else {
            console.log(`❌ PAGES: ${images.length} pages detected (EXPECTED: 19)`);
        }
        
        // Analyze each page
        let totalText = 0;
        let totalISINs = 0;
        let totalCurrencies = 0;
        let pagesWithText = 0;
        
        images.forEach((image, index) => {
            console.log(`\nPage ${index + 1}:`);
            console.log(`   Method: ${image.method}`);
            console.log(`   Has Base64: ${!!image.base64}`);
            console.log(`   Has Text: ${!!image.text}`);
            console.log(`   Text Length: ${image.text?.length || 0}`);
            
            if (image.text && image.text.length > 0) {
                pagesWithText++;
                totalText += image.text.length;
                
                // Test pattern recognition on this page
                const patterns = ocrSystem.detectFinancialPatterns(image.text);
                const isins = patterns.isins?.length || 0;
                const currencies = patterns.currencies?.length || 0;
                
                console.log(`   ISINs Found: ${isins}`);
                console.log(`   Currencies Found: ${currencies}`);
                
                totalISINs += isins;
                totalCurrencies += currencies;
                
                // Show samples
                if (isins > 0) {
                    console.log(`   Sample ISINs: ${patterns.isins.slice(0, 2).join(', ')}`);
                }
                if (currencies > 0) {
                    console.log(`   Sample Currencies: ${patterns.currencies.slice(0, 2).join(', ')}`);
                }
                
                // Show first 200 characters of text
                if (image.text.length > 0) {
                    const preview = image.text.substring(0, 200).replace(/\s+/g, ' ').trim();
                    console.log(`   Text Preview: "${preview}..."`);
                }
            }
        });
        
        console.log('\n🎯 EXTRACTION SUMMARY:');
        console.log('======================');
        console.log(`📑 Total Pages: ${images.length}`);
        console.log(`📝 Pages with Text: ${pagesWithText}`);
        console.log(`📊 Total Text: ${totalText.toLocaleString()} characters`);
        console.log(`🏢 Total ISINs: ${totalISINs}`);
        console.log(`💰 Total Currencies: ${totalCurrencies}`);
        
        // Validation against expectations
        console.log('\n✅ VALIDATION RESULTS:');
        console.log('======================');
        
        const results = {
            pagesCorrect: images.length === 19,
            textExtracted: totalText > 0,
            isinsFound: totalISINs > 0,
            currenciesFound: totalCurrencies > 0,
            pipelineWorking: pagesWithText > 0
        };
        
        if (results.pagesCorrect) {
            console.log('✅ PAGES: 19 pages detected (MATCHES EXPECTATION)');
        } else {
            console.log(`❌ PAGES: ${images.length} pages detected (EXPECTED: 19)`);
        }
        
        if (results.textExtracted) {
            console.log(`✅ TEXT EXTRACTION: ${totalText} characters extracted (WORKING)`);
        } else {
            console.log('❌ TEXT EXTRACTION: No text extracted (FAILED)');
        }
        
        if (results.isinsFound) {
            console.log(`✅ ISIN DETECTION: ${totalISINs} ISINs found (WORKING)`);
            if (totalISINs >= 35) {
                console.log('🎉 ISIN COUNT: Meets expectation (35+)');
            } else {
                console.log(`⚠️ ISIN COUNT: ${totalISINs} found (EXPECTED: 35+)`);
            }
        } else {
            console.log('❌ ISIN DETECTION: No ISINs found (FAILED)');
        }
        
        if (results.currenciesFound) {
            console.log(`✅ CURRENCY DETECTION: ${totalCurrencies} currencies found (WORKING)`);
        } else {
            console.log('❌ CURRENCY DETECTION: No currencies found (FAILED)');
        }
        
        if (results.pipelineWorking) {
            console.log(`✅ OCR PIPELINE: ${pagesWithText}/${images.length} pages processed (WORKING)`);
        } else {
            console.log('❌ OCR PIPELINE: No pages processed (FAILED)');
        }
        
        // Performance analysis
        console.log('\n⚡ PERFORMANCE ANALYSIS:');
        console.log('=======================');
        
        const avgTextPerPage = totalText / images.length;
        const textExtractionRate = (pagesWithText / images.length) * 100;
        
        console.log(`📊 Average Text per Page: ${avgTextPerPage.toFixed(0)} characters`);
        console.log(`📈 Text Extraction Rate: ${textExtractionRate.toFixed(1)}%`);
        
        if (textExtractionRate >= 90) {
            console.log('✅ EXTRACTION RATE: Excellent (90%+)');
        } else if (textExtractionRate >= 70) {
            console.log('✅ EXTRACTION RATE: Good (70%+)');
        } else {
            console.log('⚠️ EXTRACTION RATE: Needs improvement (<70%)');
        }
        
        // Final assessment
        console.log('\n🏆 FINAL ASSESSMENT:');
        console.log('====================');
        
        const criticalIssues = [];
        const warnings = [];
        
        if (!results.pagesCorrect) criticalIssues.push('Page detection failed');
        if (!results.textExtracted) criticalIssues.push('Text extraction failed');
        if (!results.pipelineWorking) criticalIssues.push('OCR pipeline failed');
        
        if (!results.isinsFound) warnings.push('No ISINs detected');
        if (!results.currenciesFound) warnings.push('No currencies detected');
        if (totalISINs < 35) warnings.push(`Low ISIN count: ${totalISINs} vs 35+ expected`);
        
        if (criticalIssues.length === 0) {
            console.log('🎉 SUCCESS: Core PDF processing pipeline is working!');
            console.log('   - 19 pages detected correctly');
            console.log('   - Text extraction is functional');
            console.log('   - Pattern recognition is working');
            
            if (warnings.length > 0) {
                console.log('\n⚠️ OPTIMIZATION OPPORTUNITIES:');
                warnings.forEach((warning, index) => {
                    console.log(`   ${index + 1}. ${warning}`);
                });
            }
        } else {
            console.log('❌ CRITICAL ISSUES FOUND:');
            criticalIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }
        
        // Save results
        const detailedResults = {
            timestamp: new Date().toISOString(),
            file: filePath,
            fileSize: stats.size,
            results: results,
            summary: {
                totalPages: images.length,
                pagesWithText: pagesWithText,
                totalText: totalText,
                totalISINs: totalISINs,
                totalCurrencies: totalCurrencies,
                textExtractionRate: textExtractionRate
            },
            criticalIssues: criticalIssues,
            warnings: warnings,
            images: images.map(img => ({
                page: img.page,
                method: img.method,
                hasText: !!img.text,
                textLength: img.text?.length || 0,
                hasBase64: !!img.base64
            }))
        };
        
        const reportFile = `real-world-no-mistral-results-${Date.now()}.json`;
        await fs.writeFile(reportFile, JSON.stringify(detailedResults, null, 2));
        console.log(`\n📁 Detailed results saved: ${reportFile}`);
        
        // Next steps
        console.log('\n🚀 NEXT STEPS:');
        console.log('==============');
        
        if (criticalIssues.length === 0) {
            console.log('1. ✅ Core pipeline is working - ready for Mistral OCR integration');
            console.log('2. 🔑 Add Mistral API key to enable enhanced OCR processing');
            console.log('3. 🎯 Test with Mistral OCR for improved accuracy');
            console.log('4. 🚀 Deploy to production with confidence');
        } else {
            console.log('1. 🔧 Fix critical issues identified above');
            console.log('2. 🧪 Re-test with real documents');
            console.log('3. 🎯 Optimize text extraction pipeline');
        }
        
    } catch (error) {
        console.error('💥 Real-world testing failed:', error.message);
        console.error('📍 Error details:', error.stack);
    }
}

testRealWorldNoMistral();
