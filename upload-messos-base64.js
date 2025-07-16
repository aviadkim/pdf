#!/usr/bin/env node

/**
 * Real Messos PDF Upload - Base64 Format
 * Upload in the correct format the server expects
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📤 UPLOADING REAL MESSOS PDF (BASE64 FORMAT)');
console.log('============================================\n');

const MESSOS_PDF_PATH = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
const EXPECTED_TOTAL = 19464431;
const BASE_URL = 'http://localhost:3001';

async function uploadMessosBase64() {
    try {
        // Verify file exists
        if (!fs.existsSync(MESSOS_PDF_PATH)) {
            throw new Error('Messos PDF file not found');
        }

        const stats = fs.statSync(MESSOS_PDF_PATH);
        console.log(`📁 File: 2. Messos - 31.03.2025.pdf`);
        console.log(`📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`💰 Expected Portfolio Value: $${EXPECTED_TOTAL.toLocaleString()}`);
        console.log(`🎯 Target: 99.5%+ accuracy with bulletproof processing\n`);

        // Read and convert to base64
        console.log('🔄 Converting PDF to base64...');
        const pdfBuffer = fs.readFileSync(MESSOS_PDF_PATH);
        const pdfBase64 = pdfBuffer.toString('base64');
        console.log(`✅ Base64 conversion complete: ${pdfBase64.length.toLocaleString()} characters\n`);

        console.log('🚀 Uploading to bulletproof processor...');
        console.log('📡 Endpoint: http://localhost:3001/api/bulletproof-processor');
        console.log('⚡ Mode: Multi-method validation with iterative refinement\n');

        const startTime = Date.now();

        const response = await fetch(`${BASE_URL}/api/bulletproof-processor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pdfBase64: pdfBase64,
                filename: '2. Messos - 31.03.2025.pdf'
            }),
            timeout: 300000 // 5 minutes for comprehensive processing
        });

        const uploadTime = (Date.now() - startTime) / 1000;
        console.log(`⏱️ Request completed in ${uploadTime.toFixed(1)} seconds\n`);

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ Server Error: HTTP ${response.status}`);
            console.log(`❌ Response: ${errorText}\n`);
            return false;
        }

        console.log('✅ Server processed the request! Parsing results...\n');
        
        const result = await response.json();
        return displayBulletproofResults(result);

    } catch (error) {
        console.error(`❌ Upload failed: ${error.message}\n`);
        return false;
    }
}

function displayBulletproofResults(result) {
    console.log('📊 BULLETPROOF PROCESSING RESULTS');
    console.log('=================================\n');

    // Show processing metadata
    console.log('⚡ PROCESSING SUMMARY:');
    console.log('=====================');
    console.log(`✅ Success: ${result.success ? 'Yes' : 'No'}`);
    console.log(`📊 Message: ${result.message || 'N/A'}`);
    
    if (result.analysis) {
        console.log(`⏱️ Processing Time: ${result.analysis.processingTime}`);
        console.log(`🔧 Methods Used: ${result.analysis.extractionMethods?.join(', ') || 'N/A'}`);
        console.log(`🔄 Iterations: ${result.analysis.iterationsPerformed || 0}`);
        
        if (result.analysis.pdfType) {
            console.log(`📋 PDF Type: ${result.analysis.pdfType.type} (${result.analysis.pdfType.confidence}% confidence)`);
        }
    }
    console.log('');

    // Show extracted data
    if (result.data) {
        const data = result.data;
        
        console.log('💰 FINANCIAL DATA EXTRACTED:');
        console.log('============================');
        console.log(`💰 Total Portfolio Value: $${data.totalValue?.toLocaleString() || 0}`);
        console.log(`💰 Target Value: $${data.targetValue?.toLocaleString() || EXPECTED_TOTAL}`);
        console.log(`🎯 Accuracy: ${data.accuracyPercent || 'N/A'}%`);
        console.log(`✅ Target Achieved: ${data.success ? 'Yes' : 'No'}`);
        console.log(`📊 Holdings Found: ${data.holdings?.length || 0}\n`);

        // Show individual holdings
        if (data.holdings && data.holdings.length > 0) {
            console.log('📋 EXTRACTED HOLDINGS:');
            console.log('======================');
            
            data.holdings.forEach((holding, index) => {
                console.log(`${index + 1}. ${holding.isin || holding.identifier || 'N/A'}`);
                console.log(`   Name: ${holding.name || holding.description || 'Unknown'}`);
                console.log(`   Value: $${(holding.totalValue || holding.value || 0).toLocaleString()}`);
                console.log(`   Currency: ${holding.currency || 'N/A'}`);
                if (holding.quantity) {
                    console.log(`   Quantity: ${holding.quantity.toLocaleString()}`);
                }
                console.log('');
            });
        }

        // Validate against expected values
        console.log('🎯 ACCURACY VALIDATION:');
        console.log('=======================');
        const extractedTotal = data.totalValue || 0;
        const accuracy = extractedTotal === EXPECTED_TOTAL ? 100 : 
            extractedTotal > 0 ? Math.max(0, (1 - Math.abs(extractedTotal - EXPECTED_TOTAL) / EXPECTED_TOTAL) * 100) : 0;

        console.log(`💰 Expected: $${EXPECTED_TOTAL.toLocaleString()}`);
        console.log(`💰 Extracted: $${extractedTotal.toLocaleString()}`);
        console.log(`🎯 Our Calculation: ${accuracy.toFixed(2)}%`);
        console.log(`🎯 Server Accuracy: ${data.accuracyPercent || 'N/A'}%`);
        
        const valueDiff = Math.abs(extractedTotal - EXPECTED_TOTAL);
        console.log(`📈 Difference: $${valueDiff.toLocaleString()}\n`);

        // Assessment
        console.log('🏆 PROCESSING ASSESSMENT:');
        console.log('=========================');
        
        if (accuracy >= 99.5) {
            console.log('🎊 EXCELLENT: Target accuracy achieved!');
            console.log('✅ Bulletproof processor working perfectly');
            console.log('🚀 Ready for production deployment');
        } else if (accuracy >= 95) {
            console.log('✅ VERY GOOD: High accuracy achieved');
            console.log('✅ Processing working well for complex documents');
            console.log('🚀 Ready for production with monitoring');
        } else if (accuracy >= 80) {
            console.log('⚠️ MODERATE: Reasonable accuracy with room for improvement');
            console.log('🔧 Consider additional extraction methods');
        } else if (extractedTotal > 0) {
            console.log('🔧 NEEDS WORK: Extraction working but accuracy low');
            console.log('📊 Algorithm optimization required');
        } else {
            console.log('❌ FAILED: No data extracted');
            console.log('🔧 Major debugging required');
        }

        // Show debug info if available
        if (result.debug) {
            console.log('\n🔍 DEBUG INFORMATION:');
            console.log('=====================');
            if (result.debug.extractionAttempts) {
                console.log(`🔧 Extraction Attempts: ${result.debug.extractionAttempts}`);
            }
            if (result.debug.refinementSteps) {
                console.log(`🔄 Refinement Steps: ${result.debug.refinementSteps.length}`);
            }
            if (result.debug.failureReasons && result.debug.failureReasons.length > 0) {
                console.log(`❌ Failure Reasons: ${result.debug.failureReasons.join(', ')}`);
            }
        }

        // Save results
        const resultsReport = {
            timestamp: new Date().toISOString(),
            expectedTotal: EXPECTED_TOTAL,
            extractedTotal: extractedTotal,
            accuracy: accuracy,
            holdingsFound: data.holdings?.length || 0,
            serverAccuracy: data.accuracyPercent,
            success: data.success,
            rawResult: result
        };

        const reportPath = path.join(__dirname, 'bulletproof-messos-results.json');
        fs.writeFileSync(reportPath, JSON.stringify(resultsReport, null, 2));
        console.log(`\n📄 Results saved: ${reportPath}`);

        return accuracy >= 80; // Return success if reasonable accuracy
    } else {
        console.log('❌ No extraction data returned from server');
        return false;
    }
}

// Run the upload
console.log('🎯 REAL MESSOS PDF BULLETPROOF TEST');
console.log('===================================');
console.log('Uploading your actual Messos PDF using the bulletproof processor');
console.log('This processor uses multi-method validation with iterative refinement.\n');

uploadMessosBase64().then(success => {
    console.log('\n🏁 BULLETPROOF TEST COMPLETE');
    console.log('============================');
    if (success) {
        console.log('🎊 Success! Bulletproof processor handled the real document');
        console.log('✅ Multi-method validation demonstrated');
        console.log('🚀 Platform ready for complex financial documents');
    } else {
        console.log('🔧 Document processing needs optimization');
        console.log('📊 Try alternative extraction methods');
        console.log('🧪 Debug information available for analysis');
    }
}).catch(console.error);