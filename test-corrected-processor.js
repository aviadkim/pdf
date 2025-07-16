#!/usr/bin/env node

/**
 * TEST CORRECTED MCP PROCESSOR
 * Test the corrected processor that handles Swiss formatting
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🇨🇭 TESTING CORRECTED MCP PROCESSOR');
console.log('==================================\n');

const MESSOS_PDF_PATH = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
const EXPECTED_TOTAL = 19464431;
const EXPECTED_TORONTO = 199080;
const EXPECTED_CANADIAN = 200288;

async function testCorrectedProcessor() {
    try {
        // Import corrected processor
        const { default: correctedProcessor } = await import('./api/corrected-mcp-processor.js');
        
        // Read PDF
        const pdfBuffer = fs.readFileSync(MESSOS_PDF_PATH);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        console.log(`📁 File: 2. Messos - 31.03.2025.pdf`);
        console.log(`📊 Size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`💰 Target Total: $${EXPECTED_TOTAL.toLocaleString()}`);
        console.log(`🎯 Expected Toronto: $${EXPECTED_TORONTO.toLocaleString()}`);
        console.log(`🎯 Expected Canadian: $${EXPECTED_CANADIAN.toLocaleString()}`);
        console.log(`🇨🇭 Swiss Format: Using apostrophes (199'080, 200'288)\n`);

        // Create mock request/response
        const mockReq = {
            method: 'POST',
            body: {
                pdfBase64: pdfBase64,
                filename: '2. Messos - 31.03.2025.pdf'
            }
        };

        const mockRes = {
            statusCode: 200,
            headers: {},
            body: null,
            setHeader: function(name, value) {
                this.headers[name] = value;
            },
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.body = data;
                return this;
            },
            end: function() {
                return this;
            }
        };

        console.log('🇨🇭 CORRECTED PROCESSOR: Testing Swiss formatting extraction...');
        console.log('🎯 Real values: Toronto 199\'080, Canadian 200\'288');
        console.log('🔍 Parsing apostrophes as thousands separators\n');

        const startTime = Date.now();
        
        // Run the corrected processor
        await correctedProcessor(mockReq, mockRes);
        
        const processingTime = (Date.now() - startTime) / 1000;
        console.log(`⏱️ Processing completed in ${processingTime.toFixed(1)} seconds\n`);

        if (mockRes.statusCode === 200 && mockRes.body) {
            return analyzeResults(mockRes.body);
        } else {
            console.log(`❌ Processing failed: Status ${mockRes.statusCode}`);
            console.log(`❌ Response: ${JSON.stringify(mockRes.body, null, 2)}`);
            return false;
        }

    } catch (error) {
        console.error(`❌ Corrected processor test failed: ${error.message}`);
        return false;
    }
}

function analyzeResults(result) {
    console.log('🇨🇭 CORRECTED PROCESSOR RESULTS');
    console.log('===============================\n');

    // Processing summary
    console.log('📊 PROCESSING SUMMARY:');
    console.log('=====================');
    console.log(`✅ Success: ${result.success ? 'Yes' : 'No'}`);
    console.log(`🇨🇭 Swiss Processing: ${result.realSwissValues ? 'Yes' : 'No'}`);
    console.log(`🔧 Corrected Mode: ${result.correctedProcessing ? 'Yes' : 'No'}`);
    console.log(`📊 Message: ${result.message || 'N/A'}`);
    console.log('');

    // Check for real values found
    if (result.realValuesFound) {
        console.log('🎯 REAL VALUES EXTRACTED:');
        console.log('=========================');
        console.log(`✅ Toronto Dominion: $${result.realValuesFound.torontoDominion?.toLocaleString() || 'Not found'}`);
        console.log(`✅ Canadian Imperial: $${result.realValuesFound.canadianImperial?.toLocaleString() || 'Not found'}`);
        console.log(`🇨🇭 Formatting: ${result.realValuesFound.formattingUsed || 'N/A'}`);
        console.log('');

        // Validate against expected values
        console.log('🔍 VALIDATION AGAINST EXPECTED:');
        console.log('===============================');
        
        const torontoFound = result.realValuesFound.torontoDominion;
        const canadianFound = result.realValuesFound.canadianImperial;
        
        if (torontoFound === EXPECTED_TORONTO) {
            console.log(`✅ Toronto Dominion: PERFECT MATCH! $${torontoFound.toLocaleString()}`);
        } else {
            console.log(`❌ Toronto Dominion: Expected $${EXPECTED_TORONTO.toLocaleString()}, Got $${torontoFound?.toLocaleString() || 'N/A'}`);
        }
        
        if (canadianFound === EXPECTED_CANADIAN) {
            console.log(`✅ Canadian Imperial: PERFECT MATCH! $${canadianFound.toLocaleString()}`);
        } else {
            console.log(`❌ Canadian Imperial: Expected $${EXPECTED_CANADIAN.toLocaleString()}, Got $${canadianFound?.toLocaleString() || 'N/A'}`);
        }
        console.log('');
    }

    // Extracted data analysis
    if (result.extractedData) {
        const data = result.extractedData;
        
        console.log('💰 PORTFOLIO DATA:');
        console.log('==================');
        console.log(`💰 Total Value: $${data.totalValue?.toLocaleString() || 0}`);
        console.log(`💰 Target Value: $${data.targetValue?.toLocaleString() || EXPECTED_TOTAL}`);
        console.log(`🎯 Accuracy: ${data.accuracyPercent || 'N/A'}%`);
        console.log(`📊 Securities: ${data.securities?.length || 0}`);
        console.log(`💱 Currency: ${data.portfolioSummary?.currency || 'N/A'}`);
        console.log(`🏦 Institution: ${data.portfolioSummary?.institution_type || 'N/A'}`);
        console.log(`🇨🇭 Formatting: ${data.portfolioSummary?.formatting || 'N/A'}`);
        console.log('');

        // Show securities with focus on real values
        if (data.securities && data.securities.length > 0) {
            console.log('📋 SECURITIES ANALYSIS:');
            console.log('=======================');
            
            data.securities.forEach((security, index) => {
                console.log(`${index + 1}. ${security.isin || 'N/A'}`);
                console.log(`   Name: ${security.name || 'Unknown'}`);
                console.log(`   Value: $${(security.value || 0).toLocaleString()}`);
                console.log(`   Real Value: ${security.realValue ? 'Yes' : 'No'}`);
                console.log(`   Swiss Formatted: ${security.swissFormatted ? 'Yes' : 'No'}`);
                console.log(`   Confidence: ${((security.confidence || 0) * 100).toFixed(1)}%`);
                
                // Special validation for known ISINs
                if (security.isin === 'XS2530201644') {
                    if (security.value === EXPECTED_TORONTO) {
                        console.log(`   🎯 TORONTO VALIDATION: PERFECT!`);
                    } else {
                        console.log(`   ❌ TORONTO VALIDATION: Expected $${EXPECTED_TORONTO.toLocaleString()}, Got $${security.value?.toLocaleString()}`);
                    }
                }
                
                if (security.isin === 'XS2588105036') {
                    if (security.value === EXPECTED_CANADIAN) {
                        console.log(`   🎯 CANADIAN VALIDATION: PERFECT!`);
                    } else {
                        console.log(`   ❌ CANADIAN VALIDATION: Expected $${EXPECTED_CANADIAN.toLocaleString()}, Got $${security.value?.toLocaleString()}`);
                    }
                }
                
                console.log('');
            });
        }

        // Final assessment
        console.log('🏆 FINAL ASSESSMENT:');
        console.log('====================');
        
        const extractedTotal = data.totalValue || 0;
        const accuracy = data.accuracy || 0;
        
        console.log(`💰 Expected Total: $${EXPECTED_TOTAL.toLocaleString()}`);
        console.log(`💰 Extracted Total: $${extractedTotal.toLocaleString()}`);
        console.log(`🎯 Accuracy: ${(accuracy * 100).toFixed(2)}%`);
        console.log(`📈 Difference: $${Math.abs(extractedTotal - EXPECTED_TOTAL).toLocaleString()}`);
        console.log('');

        // Check if we got the real values right
        const realValuesCorrect = result.realValuesFound && 
            result.realValuesFound.torontoDominion === EXPECTED_TORONTO &&
            result.realValuesFound.canadianImperial === EXPECTED_CANADIAN;

        if (realValuesCorrect) {
            console.log('🎊 SWISS FORMATTING SUCCESS!');
            console.log('✅ Real values extracted correctly');
            console.log('🇨🇭 Apostrophe parsing working perfectly');
            console.log('🎯 Toronto: 199\'080 → $199,080');
            console.log('🎯 Canadian: 200\'288 → $200,288');
        } else {
            console.log('🔧 SWISS FORMATTING NEEDS WORK');
            console.log('❌ Real values not extracted correctly');
            console.log('🇨🇭 Apostrophe parsing needs debugging');
        }

        return realValuesCorrect;
    } else {
        console.log('❌ No extraction data returned');
        return false;
    }
}

// Run test
testCorrectedProcessor().then(success => {
    console.log('\n🏁 CORRECTED PROCESSOR TEST COMPLETE');
    console.log('====================================');
    if (success) {
        console.log('🎊 SUCCESS: Swiss formatting handled correctly!');
        console.log('✅ Real values extracted: Toronto $199,080, Canadian $200,288');
        console.log('🇨🇭 Apostrophe parsing working perfectly');
        console.log('🎯 Ready to build complete portfolio extraction');
    } else {
        console.log('🔧 NEEDS WORK: Swiss formatting extraction needs debugging');
        console.log('❌ Real values not extracted correctly');
        console.log('🇨🇭 Review apostrophe parsing logic');
    }
}).catch(console.error);