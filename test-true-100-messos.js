#!/usr/bin/env node

/**
 * Test True 100% Extractor with Real Messos PDF
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎯 TRUE 100% EXTRACTOR - REAL MESSOS TEST');
console.log('=========================================\n');

const MESSOS_PDF_PATH = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
const EXPECTED_TOTAL = 19464431;

async function testTrue100Extractor() {
    try {
        const pdfBuffer = fs.readFileSync(MESSOS_PDF_PATH);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        console.log('📤 Testing True 100% Extractor...');
        console.log(`📊 Target: $${EXPECTED_TOTAL.toLocaleString()}`);
        
        const response = await fetch('http://localhost:3001/api/true-100-percent-extractor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pdfBase64: pdfBase64,
                filename: '2. Messos - 31.03.2025.pdf',
                mode: 'aggressive'
            }),
            timeout: 180000
        });

        if (!response.ok) {
            console.log(`❌ Error: HTTP ${response.status}`);
            return false;
        }

        const result = await response.json();
        console.log('✅ Processing complete!\n');

        // Show results
        displayTrue100Results(result);
        return true;

    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        return false;
    }
}

function displayTrue100Results(result) {
    console.log('📊 TRUE 100% EXTRACTOR RESULTS');
    console.log('==============================\n');

    if (result.extractedData) {
        const data = result.extractedData;
        
        console.log('💰 FINANCIAL SUMMARY:');
        console.log('=====================');
        console.log(`💰 Total Value: $${data.totalValue?.toLocaleString() || 0}`);
        console.log(`📊 Securities: ${data.securities?.length || 0}`);
        console.log(`🎯 Accuracy: ${result.accuracy || 'N/A'}%`);
        console.log(`⏱️ Time: ${result.processingTime || 'N/A'}s\n`);

        if (data.securities && data.securities.length > 0) {
            console.log('📋 SECURITIES FOUND:');
            console.log('====================');
            data.securities.forEach((sec, i) => {
                console.log(`${i+1}. ${sec.isin || 'N/A'}: $${(sec.value || 0).toLocaleString()}`);
                console.log(`   ${sec.name || 'Unknown security'}`);
            });
        }

        const accuracy = data.totalValue === EXPECTED_TOTAL ? 100 :
            data.totalValue > 0 ? (1 - Math.abs(data.totalValue - EXPECTED_TOTAL) / EXPECTED_TOTAL) * 100 : 0;

        console.log(`\n🎯 Accuracy vs Expected: ${accuracy.toFixed(2)}%`);
        
        if (accuracy >= 95) {
            console.log('🏆 EXCELLENT RESULT!');
        } else if (accuracy >= 80) {
            console.log('✅ GOOD RESULT');
        } else {
            console.log('🔧 NEEDS IMPROVEMENT');
        }
    } else {
        console.log('❌ No extraction data returned');
    }
}

testTrue100Extractor();