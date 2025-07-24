#!/usr/bin/env node

/**
 * ANALYZE EXTRACTED DATA
 * 
 * Show exactly what data is being extracted from MESSOS
 * Check for duplicates, accuracy, and real financial information
 */

const fs = require('fs').promises;
const FormData = require('form-data');
const fetch = require('node-fetch');

async function analyzeExtractedData() {
    console.log('🔍 ANALYZING EXTRACTED DATA FROM MESSOS');
    console.log('======================================');
    console.log('Investigating what data is actually being extracted');
    console.log('');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Read the MESSOS file
        const filePath = '2. Messos  - 31.03.2025.pdf';
        const fileBuffer = await fs.readFile(filePath);
        
        console.log(`📁 File: ${filePath}`);
        console.log(`📊 Size: ${fileBuffer.length} bytes`);
        
        // Upload to API
        const formData = new FormData();
        formData.append('pdf', fileBuffer, {
            filename: filePath,
            contentType: 'application/pdf'
        });
        
        console.log('\n📤 Uploading MESSOS for detailed analysis...');
        
        const response = await fetch(`${baseUrl}/api/smart-ocr-process`, {
            method: 'POST',
            body: formData,
            headers: {
                ...formData.getHeaders()
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ HTTP Error: ${errorText}`);
            return;
        }
        
        const responseData = await response.json();
        
        console.log('\n📊 DETAILED DATA ANALYSIS:');
        console.log('==========================');
        
        if (responseData.results && responseData.results.ocrResults) {
            const ocrResults = responseData.results.ocrResults;
            
            // Collect all ISINs and check for duplicates
            const allISINs = [];
            const allCurrencies = [];
            const allCompanies = [];
            const pageData = [];
            
            console.log(`📑 Analyzing ${ocrResults.length} pages...`);
            
            ocrResults.forEach((result, index) => {
                const pageNum = index + 1;
                console.log(`\n📄 PAGE ${pageNum} ANALYSIS:`);
                console.log(`   Method: ${result.method}`);
                console.log(`   Text Length: ${result.text?.length || 0} characters`);
                
                if (result.patterns) {
                    const pageISINs = result.patterns.isins || [];
                    const pageCurrencies = result.patterns.currencies || [];
                    
                    console.log(`   ISINs on page: ${pageISINs.length}`);
                    console.log(`   Currencies on page: ${pageCurrencies.length}`);
                    
                    // Show first few ISINs from this page
                    if (pageISINs.length > 0) {
                        console.log(`   Sample ISINs: ${pageISINs.slice(0, 3).join(', ')}`);
                        allISINs.push(...pageISINs);
                    }
                    
                    // Show first few currencies from this page
                    if (pageCurrencies.length > 0) {
                        console.log(`   Sample Currencies: ${pageCurrencies.slice(0, 3).join(', ')}`);
                        allCurrencies.push(...pageCurrencies);
                    }
                    
                    pageData.push({
                        page: pageNum,
                        isins: pageISINs,
                        currencies: pageCurrencies,
                        textLength: result.text?.length || 0
                    });
                }
                
                // Show text preview to understand what's being extracted
                if (result.text && result.text.length > 100) {
                    const preview = result.text.substring(0, 500).replace(/\s+/g, ' ').trim();
                    console.log(`   📝 Text Preview: "${preview}..."`);
                }
            });
            
            // Analyze duplicates and unique data
            console.log('\n🔍 DUPLICATE ANALYSIS:');
            console.log('======================');
            
            const uniqueISINs = [...new Set(allISINs)];
            const uniqueCurrencies = [...new Set(allCurrencies)];
            
            console.log(`📊 Total ISINs found: ${allISINs.length}`);
            console.log(`🎯 Unique ISINs: ${uniqueISINs.length}`);
            console.log(`📊 Total Currencies found: ${allCurrencies.length}`);
            console.log(`🎯 Unique Currencies: ${uniqueCurrencies.length}`);
            
            if (allISINs.length > uniqueISINs.length) {
                const duplicates = allISINs.length - uniqueISINs.length;
                console.log(`⚠️ DUPLICATES DETECTED: ${duplicates} duplicate ISINs found`);
                console.log(`   This suggests data is being repeated across pages`);
            }
            
            // Show actual unique ISINs
            console.log('\n🏢 UNIQUE ISINs EXTRACTED:');
            console.log('==========================');
            uniqueISINs.slice(0, 10).forEach((isin, index) => {
                console.log(`${index + 1}. ${isin}`);
            });
            
            if (uniqueISINs.length > 10) {
                console.log(`... and ${uniqueISINs.length - 10} more ISINs`);
            }
            
            // Show actual unique currencies
            console.log('\n💰 UNIQUE CURRENCY VALUES:');
            console.log('===========================');
            uniqueCurrencies.slice(0, 10).forEach((currency, index) => {
                console.log(`${index + 1}. ${currency}`);
            });
            
            if (uniqueCurrencies.length > 10) {
                console.log(`... and ${uniqueCurrencies.length - 10} more currency values`);
            }
            
            // Calculate estimated portfolio value
            let totalValue = 0;
            uniqueCurrencies.forEach(currency => {
                const match = currency.match(/[\d,.']+/);
                if (match) {
                    const value = parseFloat(match[0].replace(/[,']/g, ''));
                    if (value > 1000) { // Only count significant amounts
                        totalValue += value;
                    }
                }
            });
            
            console.log('\n💵 PORTFOLIO VALUE ANALYSIS:');
            console.log('============================');
            console.log(`💰 Estimated Total Value: ${totalValue.toLocaleString()}`);
            
            if (totalValue >= 19000000) {
                console.log('✅ VALUE: Meets expectation (19+ million)');
            } else {
                console.log(`⚠️ VALUE: ${totalValue.toLocaleString()} (Expected: 19+ million)`);
            }
            
            // Check for data quality issues
            console.log('\n🔍 DATA QUALITY ANALYSIS:');
            console.log('=========================');
            
            // Check if same text is repeated across pages
            const textLengths = pageData.map(p => p.textLength);
            const uniqueTextLengths = [...new Set(textLengths)];
            
            if (uniqueTextLengths.length === 1 && textLengths.length > 1) {
                console.log('❌ ISSUE: All pages have identical text length');
                console.log('   This suggests the same content is being repeated');
                console.log('   The system may be processing the entire PDF for each page');
            } else {
                console.log('✅ GOOD: Pages have different text lengths');
                console.log(`   Text lengths: ${textLengths.slice(0, 5).join(', ')}...`);
            }
            
            // Check ISIN validity
            const validISINs = uniqueISINs.filter(isin => {
                return /^[A-Z]{2}[A-Z0-9]{10}$/.test(isin);
            });
            
            console.log(`🎯 Valid ISIN format: ${validISINs.length}/${uniqueISINs.length}`);
            
            if (validISINs.length < uniqueISINs.length) {
                console.log('⚠️ Some ISINs may be false positives');
                const invalidISINs = uniqueISINs.filter(isin => !/^[A-Z]{2}[A-Z0-9]{10}$/.test(isin));
                console.log(`   Invalid ISINs: ${invalidISINs.slice(0, 3).join(', ')}`);
            }
            
        } else {
            console.log('❌ No OCR results to analyze');
        }
        
        // Final assessment
        console.log('\n🏆 FINAL ASSESSMENT:');
        console.log('====================');
        
        const actualUniqueISINs = uniqueISINs.length;
        const expectedISINs = 40; // Based on user's statement
        
        if (actualUniqueISINs >= 35 && actualUniqueISINs <= 50) {
            console.log(`✅ ISIN COUNT: ${actualUniqueISINs} ISINs (reasonable for MESSOS)`);
        } else if (actualUniqueISINs > 50) {
            console.log(`⚠️ ISIN COUNT: ${actualUniqueISINs} ISINs (may include false positives)`);
        } else {
            console.log(`❌ ISIN COUNT: ${actualUniqueISINs} ISINs (below expectation)`);
        }
        
        // Save detailed analysis
        const analysisData = {
            timestamp: new Date().toISOString(),
            file: filePath,
            summary: {
                totalPages: ocrResults.length,
                totalISINs: allISINs.length,
                uniqueISINs: uniqueISINs.length,
                totalCurrencies: allCurrencies.length,
                uniqueCurrencies: uniqueCurrencies.length,
                estimatedValue: totalValue
            },
            uniqueISINs: uniqueISINs,
            uniqueCurrencies: uniqueCurrencies,
            pageData: pageData
        };
        
        const analysisFile = `messos-data-analysis-${Date.now()}.json`;
        await fs.writeFile(analysisFile, JSON.stringify(analysisData, null, 2));
        console.log(`\n📁 Detailed analysis saved: ${analysisFile}`);
        
    } catch (error) {
        console.error('💥 Data analysis failed:', error.message);
        console.error('📍 Error details:', error.stack);
    }
}

analyzeExtractedData();
