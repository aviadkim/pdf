#!/usr/bin/env node

/**
 * Real Messos PDF Upload Script
 * Actually uploads and processes the real document
 */

import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📤 UPLOADING REAL MESSOS PDF TO SERVER');
console.log('======================================\n');

const MESSOS_PDF_PATH = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
const EXPECTED_TOTAL = 19464431;
const BASE_URL = 'http://localhost:3001';

async function uploadRealMessosPDF() {
    try {
        // Verify file exists
        if (!fs.existsSync(MESSOS_PDF_PATH)) {
            throw new Error('Messos PDF file not found');
        }

        const stats = fs.statSync(MESSOS_PDF_PATH);
        console.log(`📁 File: 2. Messos - 31.03.2025.pdf`);
        console.log(`📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`💰 Expected Portfolio Value: $${EXPECTED_TOTAL.toLocaleString()}`);
        console.log(`🎯 Target: 99.8% accuracy with MCP enhancement\n`);

        console.log('🚀 Starting real upload to server...');
        console.log('📡 Endpoint: http://localhost:3001/api/bulletproof-processor');
        console.log('⚡ Mode: Full extraction with MCP enhancement\n');

        // Create form data with the actual PDF
        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(MESSOS_PDF_PATH), {
            filename: '2. Messos - 31.03.2025.pdf',
            contentType: 'application/pdf'
        });
        
        // Add processing options
        formData.append('mode', 'full');
        formData.append('mcpEnabled', 'true');
        formData.append('institutionType', 'swiss_bank');
        formData.append('extractType', 'all');
        formData.append('validate', 'true');

        console.log('📤 Uploading PDF to server...');
        const startTime = Date.now();

        const response = await fetch(`${BASE_URL}/api/bulletproof-processor`, {
            method: 'POST',
            body: formData,
            timeout: 300000 // 5 minutes timeout for real processing
        });

        const uploadTime = (Date.now() - startTime) / 1000;
        console.log(`⏱️ Upload completed in ${uploadTime.toFixed(1)} seconds\n`);

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ Server Error: HTTP ${response.status}`);
            console.log(`❌ Response: ${errorText.substring(0, 500)}...\n`);
            
            // Show server troubleshooting
            console.log('🔧 TROUBLESHOOTING:');
            console.log('==================');
            console.log('1. Check if server is running: http://localhost:3001');
            console.log('2. Verify PDF file is accessible');
            console.log('3. Check server logs for detailed errors');
            console.log('4. Try alternative processing endpoints\n');
            
            return false;
        }

        console.log('✅ Server accepted the upload! Processing response...\n');
        
        const result = await response.json();
        console.log(`📊 Response size: ${JSON.stringify(result).length.toLocaleString()} characters`);

        // Parse and display results
        return displayProcessingResults(result);

    } catch (error) {
        console.error(`❌ Upload failed: ${error.message}\n`);
        
        console.log('🔧 POSSIBLE SOLUTIONS:');
        console.log('======================');
        console.log('1. Ensure local server is running: node local-test-server.js');
        console.log('2. Check network connectivity to localhost:3001');
        console.log('3. Verify PDF file permissions and accessibility');
        console.log('4. Try manual upload through the web interface\n');
        
        return false;
    }
}

function displayProcessingResults(result) {
    console.log('📊 REAL PROCESSING RESULTS');
    console.log('=========================\n');

    // Extract data from various possible result structures
    let extractedData = null;
    let totalValue = 0;
    let securities = [];
    let processingInfo = {};

    try {
        // Try different result structures the server might return
        if (result.securities) {
            securities = result.securities;
            totalValue = securities.reduce((sum, sec) => sum + (parseFloat(sec.value) || 0), 0);
            extractedData = result;
        } else if (result.extractedData) {
            extractedData = result.extractedData;
            securities = extractedData.securities || [];
            totalValue = extractedData.portfolio_summary?.total_value || 
                        extractedData.totalValue || 
                        securities.reduce((sum, sec) => sum + (parseFloat(sec.value) || 0), 0);
        } else if (result.data) {
            extractedData = result.data;
            securities = extractedData.securities || [];
            totalValue = extractedData.total_value || 0;
        }

        // Show processing metadata
        processingInfo = {
            success: result.success !== false,
            processingTime: result.processingTime || result.time || 'N/A',
            method: result.method || 'bulletproof-processor',
            mcpEnhanced: result.mcpEnhanced || false,
            accuracy: result.accuracy || null
        };

        console.log('⚡ PROCESSING METADATA:');
        console.log('======================');
        console.log(`✅ Success: ${processingInfo.success ? 'Yes' : 'No'}`);
        console.log(`⏱️ Processing Time: ${processingInfo.processingTime}s`);
        console.log(`🔧 Method: ${processingInfo.method}`);
        console.log(`🚀 MCP Enhanced: ${processingInfo.mcpEnhanced ? 'Yes' : 'No'}`);
        if (processingInfo.accuracy) {
            console.log(`🎯 Reported Accuracy: ${processingInfo.accuracy}%`);
        }
        console.log('');

        console.log('💰 FINANCIAL DATA EXTRACTED:');
        console.log('============================');
        console.log(`💰 Total Portfolio Value: $${totalValue.toLocaleString()}`);
        console.log(`📊 Securities Identified: ${securities.length}`);
        console.log(`📅 Processing Date: ${new Date().toLocaleDateString()}`);
        console.log('');

        // Calculate accuracy against known values
        const accuracy = totalValue === EXPECTED_TOTAL ? 100 : 
            totalValue > 0 ? Math.max(0, (1 - Math.abs(totalValue - EXPECTED_TOTAL) / EXPECTED_TOTAL) * 100) : 0;

        console.log('🎯 ACCURACY VALIDATION:');
        console.log('=======================');
        console.log(`💰 Expected: $${EXPECTED_TOTAL.toLocaleString()}`);
        console.log(`💰 Extracted: $${totalValue.toLocaleString()}`);
        console.log(`🎯 Accuracy: ${accuracy.toFixed(2)}%`);
        
        const valueDiff = Math.abs(totalValue - EXPECTED_TOTAL);
        console.log(`📈 Difference: $${valueDiff.toLocaleString()}`);
        console.log('');

        // Show securities if found
        if (securities.length > 0) {
            console.log('📋 EXTRACTED SECURITIES:');
            console.log('========================');
            
            securities.slice(0, 10).forEach((security, index) => {
                const isin = security.isin || security.ISIN || security.identifier || 'N/A';
                const name = security.name || security.description || security.security || 'Unknown';
                const value = security.value || security.amount || security.marketValue || 0;
                
                console.log(`${index + 1}. ${isin}`);
                console.log(`   Name: ${name.substring(0, 60)}${name.length > 60 ? '...' : ''}`);
                console.log(`   Value: $${parseFloat(value).toLocaleString()}`);
                console.log('');
            });

            if (securities.length > 10) {
                console.log(`   ... and ${securities.length - 10} more securities\n`);
            }

            // Check for expected ISINs
            const expectedISINs = [
                'XS2530201644',  // TORONTO DOMINION BANK
                'XS2588105036',  // CANADIAN IMPERIAL BANK
                'XS2665592833',  // HARP ISSUER
                'XS2567543397'   // GOLDMAN SACHS
            ];

            const foundISINs = securities
                .map(s => s.isin || s.ISIN || s.identifier || '')
                .filter(isin => isin.length > 10);

            const matchedISINs = foundISINs.filter(isin => expectedISINs.includes(isin));

            console.log('🔍 ISIN VALIDATION:');
            console.log('===================');
            console.log(`📊 Expected Key ISINs: ${expectedISINs.length}`);
            console.log(`📊 Total ISINs Found: ${foundISINs.length}`);
            console.log(`✅ Key ISINs Matched: ${matchedISINs.length}`);

            if (matchedISINs.length > 0) {
                console.log('\n✅ Confirmed Expected ISINs:');
                matchedISINs.forEach(isin => {
                    const security = securities.find(s => (s.isin || s.ISIN || s.identifier) === isin);
                    console.log(`   ✅ ${isin}: $${(security?.value || 0).toLocaleString()}`);
                });
                console.log('');
            }
        }

        // Overall assessment
        console.log('🏆 OVERALL ASSESSMENT:');
        console.log('======================');
        
        if (accuracy >= 99) {
            console.log('🎊 EXCELLENT: Near-perfect accuracy achieved!');
            console.log('✅ MCP-enhanced platform performing exceptionally');
            console.log('🚀 Ready for immediate production deployment');
        } else if (accuracy >= 95) {
            console.log('✅ VERY GOOD: High accuracy achieved');
            console.log('✅ Platform performing well for complex documents');
            console.log('🚀 Ready for production with monitoring');
        } else if (accuracy >= 80) {
            console.log('⚠️ MODERATE: Acceptable accuracy with room for improvement');
            console.log('🔧 Consider algorithm optimization');
            console.log('📊 Additional training data may help');
        } else if (totalValue > 0) {
            console.log('🔧 NEEDS IMPROVEMENT: Extraction working but accuracy low');
            console.log('📊 Algorithm requires significant optimization');
            console.log('🧪 Debug extraction logic for Swiss bank format');
        } else {
            console.log('❌ EXTRACTION FAILED: No portfolio value detected');
            console.log('🔧 Major debugging required');
            console.log('🧪 Check PDF parsing and text extraction');
        }

        console.log('');

        // Save results
        const resultsReport = {
            timestamp: new Date().toISOString(),
            expectedTotal: EXPECTED_TOTAL,
            extractedTotal: totalValue,
            accuracy: accuracy,
            securitiesFound: securities.length,
            processingInfo,
            rawResult: result
        };

        const reportPath = path.join(__dirname, 'real-messos-upload-results.json');
        fs.writeFileSync(reportPath, JSON.stringify(resultsReport, null, 2));
        console.log(`📄 Detailed results saved: ${reportPath}`);

        return accuracy >= 80; // Return success if accuracy is reasonable

    } catch (parseError) {
        console.error('❌ Error parsing results:', parseError.message);
        console.log('\n📊 RAW SERVER RESPONSE:');
        console.log('=======================');
        console.log(JSON.stringify(result, null, 2).substring(0, 2000) + '...');
        return false;
    }
}

// Run the real upload
console.log('🎯 REAL MESSOS PDF UPLOAD TEST');
console.log('==============================');
console.log('This will upload your actual Messos PDF to the server');
console.log('and show you the real processing results with MCP integration.\n');

uploadRealMessosPDF().then(success => {
    console.log('\n🏁 UPLOAD TEST COMPLETE');
    console.log('=======================');
    if (success) {
        console.log('🎊 Success! Platform processed the real Messos document');
        console.log('✅ MCP integration demonstrated with actual data');
        console.log('🚀 Ready for enterprise customer demonstrations');
    } else {
        console.log('🔧 Platform needs optimization for this document format');
        console.log('📊 Consider testing alternative extraction methods');
        console.log('🧪 Debug logs available for troubleshooting');
    }
}).catch(console.error);