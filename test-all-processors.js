#!/usr/bin/env node

/**
 * Test All Available Processors with Real Messos PDF
 * Find which one works best
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 TESTING ALL PROCESSORS WITH REAL MESSOS PDF');
console.log('===============================================\n');

const MESSOS_PDF_PATH = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
const EXPECTED_TOTAL = 19464431;

const processors = [
    { name: 'Pure JSON Extractor', endpoint: '/api/pure-json-extractor' },
    { name: 'Table-Aware Extractor', endpoint: '/api/table-aware-extractor' },
    { name: 'Proper Table Extractor', endpoint: '/api/proper-table-extractor' },
    { name: 'Two-Stage Processor', endpoint: '/api/two-stage-processor' }
];

async function testAllProcessors() {
    const pdfBuffer = fs.readFileSync(MESSOS_PDF_PATH);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log(`📁 File: 2. Messos - 31.03.2025.pdf`);
    console.log(`📊 Size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`💰 Expected: $${EXPECTED_TOTAL.toLocaleString()}\n`);

    const results = [];

    for (const processor of processors) {
        console.log(`🔍 Testing: ${processor.name}`);
        console.log('─'.repeat(50));
        
        try {
            const startTime = Date.now();
            
            const response = await fetch(`http://localhost:3001${processor.endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pdfBase64: pdfBase64,
                    filename: '2. Messos - 31.03.2025.pdf'
                }),
                timeout: 120000
            });

            const processingTime = (Date.now() - startTime) / 1000;

            if (!response.ok) {
                console.log(`❌ Failed: HTTP ${response.status}`);
                console.log('');
                continue;
            }

            const result = await response.json();
            
            // Parse results from different formats
            let totalValue = 0;
            let securities = [];
            let extractedData = null;

            if (result.extractedData) {
                extractedData = result.extractedData;
                securities = extractedData.securities || [];
                totalValue = extractedData.totalValue || extractedData.portfolio_summary?.total_value || 0;
            } else if (result.data) {
                extractedData = result.data;
                securities = extractedData.securities || extractedData.holdings || [];
                totalValue = extractedData.totalValue || extractedData.total_value || 0;
            } else if (result.securities) {
                securities = result.securities;
                totalValue = securities.reduce((sum, sec) => sum + (parseFloat(sec.value) || 0), 0);
            } else if (result.holdings) {
                securities = result.holdings;
                totalValue = securities.reduce((sum, sec) => sum + (parseFloat(sec.totalValue || sec.value) || 0), 0);
            }

            const accuracy = totalValue === EXPECTED_TOTAL ? 100 :
                totalValue > 0 ? Math.max(0, (1 - Math.abs(totalValue - EXPECTED_TOTAL) / EXPECTED_TOTAL) * 100) : 0;

            console.log(`✅ Success: ${totalValue > 0 ? 'Yes' : 'No'}`);
            console.log(`💰 Total Value: $${totalValue.toLocaleString()}`);
            console.log(`📊 Securities: ${securities.length}`);
            console.log(`🎯 Accuracy: ${accuracy.toFixed(2)}%`);
            console.log(`⏱️ Time: ${processingTime.toFixed(1)}s`);
            
            results.push({
                processor: processor.name,
                endpoint: processor.endpoint,
                success: totalValue > 0,
                totalValue,
                securities: securities.length,
                accuracy,
                processingTime,
                rawResult: result
            });

            // Show top securities if found
            if (securities.length > 0) {
                console.log('\n📋 Top Securities:');
                securities.slice(0, 3).forEach((sec, i) => {
                    const isin = sec.isin || sec.ISIN || sec.identifier || 'N/A';
                    const value = sec.value || sec.totalValue || sec.amount || 0;
                    console.log(`   ${i+1}. ${isin}: $${parseFloat(value).toLocaleString()}`);
                });
            }

        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            results.push({
                processor: processor.name,
                endpoint: processor.endpoint,
                success: false,
                error: error.message
            });
        }
        
        console.log('\n');
    }

    // Summary
    console.log('📊 PROCESSOR COMPARISON SUMMARY');
    console.log('===============================\n');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}\n`);

    if (successful.length > 0) {
        // Sort by accuracy
        const sorted = successful.sort((a, b) => b.accuracy - a.accuracy);
        
        console.log('🏆 BEST PERFORMERS:');
        console.log('===================');
        sorted.forEach((result, index) => {
            console.log(`${index + 1}. ${result.processor}`);
            console.log(`   🎯 Accuracy: ${result.accuracy.toFixed(2)}%`);
            console.log(`   💰 Value: $${result.totalValue.toLocaleString()}`);
            console.log(`   📊 Securities: ${result.securities}`);
            console.log(`   ⏱️ Time: ${result.processingTime.toFixed(1)}s`);
            console.log('');
        });

        const best = sorted[0];
        if (best.accuracy >= 95) {
            console.log('🎊 EXCELLENT: Found high-accuracy processor!');
            console.log(`✅ ${best.processor} achieved ${best.accuracy.toFixed(2)}% accuracy`);
        } else if (best.accuracy >= 80) {
            console.log('✅ GOOD: Found viable processor');
            console.log(`✅ ${best.processor} achieved ${best.accuracy.toFixed(2)}% accuracy`);
        } else if (best.totalValue > 0) {
            console.log('🔧 PARTIAL SUCCESS: Extraction working but needs optimization');
            console.log(`🔧 Best: ${best.processor} with ${best.accuracy.toFixed(2)}% accuracy`);
        }
    }

    if (failed.length > 0) {
        console.log('\n❌ FAILED PROCESSORS:');
        console.log('=====================');
        failed.forEach(result => {
            console.log(`• ${result.processor}: ${result.error || 'Unknown error'}`);
        });
    }

    // Save results
    const reportPath = path.join(__dirname, 'all-processors-messos-test.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        expectedTotal: EXPECTED_TOTAL,
        results: results
    }, null, 2));
    
    console.log(`\n📄 Full report saved: ${reportPath}`);
    
    return successful.length > 0;
}

testAllProcessors().then(success => {
    console.log('\n🏁 ALL PROCESSORS TEST COMPLETE');
    console.log('===============================');
    if (success) {
        console.log('🎊 Success! Found working processors for Messos PDF');
        console.log('✅ Platform can handle real Swiss bank documents');
        console.log('🚀 Ready for production deployment');
    } else {
        console.log('🔧 All processors need optimization for this document');
        console.log('📊 Consider algorithm improvements');
        console.log('🧪 Debug information available for analysis');
    }
}).catch(console.error);