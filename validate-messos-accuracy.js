#!/usr/bin/env node

/**
 * Messos Accuracy Validation Test
 * Quick validation against known values
 */

import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎯 MESSOS ACCURACY VALIDATION');
console.log('============================\n');

const MESSOS_PDF_PATH = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
const EXPECTED_TOTAL = 19464431;
const BASE_URL = 'http://localhost:3001';

async function validateAccuracy() {
    try {
        console.log('📄 Testing with True 100% Extractor...');
        
        // Test with the True 100% Extractor (most reliable)
        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(MESSOS_PDF_PATH));
        formData.append('mode', 'full');
        formData.append('validate', 'true');

        const startTime = Date.now();
        const response = await fetch(`${BASE_URL}/api/true-100-percent-extractor`, {
            method: 'POST',
            body: formData,
            timeout: 60000
        });

        const processingTime = (Date.now() - startTime) / 1000;

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`⏱️ Processing time: ${processingTime.toFixed(1)}s`);

        // Extract portfolio value
        let extractedTotal = 0;
        let securities = [];

        if (result.securities) {
            securities = result.securities;
            extractedTotal = securities.reduce((sum, sec) => sum + (parseFloat(sec.value) || 0), 0);
        } else if (result.extractedData?.portfolio_summary?.total_value) {
            extractedTotal = result.extractedData.portfolio_summary.total_value;
            securities = result.extractedData.securities || [];
        } else if (result.portfolio_summary?.total_value) {
            extractedTotal = result.portfolio_summary.total_value;
            securities = result.securities || [];
        }

        console.log('\n📊 EXTRACTION RESULTS:');
        console.log('======================');
        console.log(`💰 Expected Total: $${EXPECTED_TOTAL.toLocaleString()}`);
        console.log(`💰 Extracted Total: $${extractedTotal.toLocaleString()}`);
        console.log(`📋 Securities Found: ${securities.length}`);

        // Calculate accuracy
        const accuracy = extractedTotal === EXPECTED_TOTAL ? 100 : 
            Math.max(0, (1 - Math.abs(extractedTotal - EXPECTED_TOTAL) / EXPECTED_TOTAL) * 100);

        console.log(`🎯 Accuracy: ${accuracy.toFixed(2)}%`);

        const valueDifference = Math.abs(extractedTotal - EXPECTED_TOTAL);
        console.log(`📈 Value Difference: $${valueDifference.toLocaleString()}`);

        // Validation results
        console.log('\n✅ VALIDATION RESULTS:');
        console.log('======================');
        
        if (accuracy === 100) {
            console.log('🏆 PERFECT ACCURACY ACHIEVED!');
            console.log('✅ Extracted value matches expected exactly');
            console.log('✅ MCP-enhanced platform working perfectly');
        } else if (accuracy >= 99) {
            console.log('🎯 EXCELLENT ACCURACY ACHIEVED!');
            console.log(`✅ ${accuracy.toFixed(2)}% accuracy exceeds 99% target`);
            console.log('✅ MCP-enhanced platform performing exceptionally');
        } else if (accuracy >= 95) {
            console.log('✅ GOOD ACCURACY ACHIEVED!');
            console.log(`✅ ${accuracy.toFixed(2)}% accuracy is acceptable`);
            console.log('🔧 Minor optimizations possible');
        } else {
            console.log('⚠️ ACCURACY NEEDS IMPROVEMENT');
            console.log(`📊 ${accuracy.toFixed(2)}% accuracy below target`);
            console.log('🔧 Extraction algorithm requires optimization');
        }

        // Check for specific ISINs
        if (securities.length > 0) {
            console.log('\n📋 SECURITIES ANALYSIS:');
            console.log('=======================');
            
            const expectedISINs = [
                'XS2530201644',  // TORONTO DOMINION BANK
                'XS2588105036',  // CANADIAN IMPERIAL BANK
                'XS2665592833',  // HARP ISSUER
                'XS2567543397',  // GOLDMAN SACHS
                'XS2278869916',
                'XS2824054402',
                'XS2110079534'
            ];

            const foundISINs = securities.map(s => s.isin || s.ISIN || '').filter(isin => isin.length > 0);
            const matchedISINs = foundISINs.filter(isin => expectedISINs.includes(isin));

            console.log(`📊 ISINs Expected: ${expectedISINs.length}`);
            console.log(`📊 ISINs Found: ${foundISINs.length}`);
            console.log(`✅ ISINs Matched: ${matchedISINs.length}`);

            if (matchedISINs.length > 0) {
                console.log('\n🎯 Matched ISINs:');
                matchedISINs.forEach(isin => {
                    const security = securities.find(s => (s.isin || s.ISIN) === isin);
                    console.log(`   ✅ ${isin}: $${(security?.value || 0).toLocaleString()}`);
                });
            }
        }

        // Save validation report
        const validationReport = {
            timestamp: new Date().toISOString(),
            expectedTotal: EXPECTED_TOTAL,
            extractedTotal,
            accuracy,
            valueDifference,
            securities: securities.length,
            processingTime,
            status: accuracy >= 99 ? 'EXCELLENT' : accuracy >= 95 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
        };

        const reportPath = path.join(__dirname, 'messos-accuracy-validation.json');
        fs.writeFileSync(reportPath, JSON.stringify(validationReport, null, 2));
        console.log(`\n📄 Validation report saved: ${reportPath}`);

        return validationReport;

    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        return { error: error.message, status: 'FAILED' };
    }
}

// Run validation
validateAccuracy().then(result => {
    console.log('\n🎊 MESSOS VALIDATION COMPLETE');
    console.log('=============================');
    
    if (result.status === 'EXCELLENT') {
        console.log('🏆 Platform ready for production deployment!');
        console.log('✅ MCP-enhanced accuracy exceeds targets');
        console.log('🚀 Ready for $600K+ MRR trajectory');
    } else if (result.status === 'GOOD') {
        console.log('✅ Platform performs well, minor optimizations possible');
        console.log('🚀 Ready for production with monitoring');
    } else {
        console.log('🔧 Platform requires optimization before deployment');
        console.log('📊 Review extraction algorithms');
    }
}).catch(console.error);