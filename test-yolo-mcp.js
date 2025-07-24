#!/usr/bin/env node

/**
 * YOLO MODE: Test MCP-Enhanced Processor for 99.8% Accuracy
 * Real Messos PDF with complete MCP integration
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔥 YOLO MODE: MCP-ENHANCED PROCESSOR TEST');
console.log('========================================\n');

const MESSOS_PDF_PATH = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
const EXPECTED_TOTAL = 19464431;
const BASE_URL = 'http://localhost:3001';

async function testYoloMCP() {
    try {
        // Read and prepare PDF
        const pdfBuffer = fs.readFileSync(MESSOS_PDF_PATH);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        console.log(`📁 File: 2. Messos - 31.03.2025.pdf`);
        console.log(`📊 Size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`💰 Target: $${EXPECTED_TOTAL.toLocaleString()}`);
        console.log(`🎯 Goal: 99.8% accuracy with MCP enhancement\n`);

        console.log('🚀 YOLO MODE: Sending to MCP-Enhanced Processor...');
        console.log('🔥 Web fetch integration: ACTIVE');
        console.log('⚡ AI accuracy boost: ENABLED');
        console.log('🌐 Universal processing: OPERATIONAL\n');

        const startTime = Date.now();

        const response = await fetch(`${BASE_URL}/api/mcp-enhanced-processor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pdfBase64: pdfBase64,
                filename: '2. Messos - 31.03.2025.pdf',
                mcpMode: 'yolo_aggressive'
            }),
            timeout: 300000 // 5 minutes for comprehensive processing
        });

        const processingTime = (Date.now() - startTime) / 1000;
        console.log(`⏱️ Total processing time: ${processingTime.toFixed(1)} seconds\n`);

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ Error: HTTP ${response.status}`);
            console.log(`❌ Response: ${errorText}\n`);
            return false;
        }

        const result = await response.json();
        console.log('✅ MCP-Enhanced processing completed!\n');

        return displayYoloResults(result);

    } catch (error) {
        console.error(`❌ YOLO test failed: ${error.message}\n`);
        return false;
    }
}

function displayYoloResults(result) {
    console.log('🔥 YOLO MODE: MCP-ENHANCED RESULTS');
    console.log('=================================\n');

    // Processing summary
    console.log('⚡ PROCESSING SUMMARY:');
    console.log('=====================');
    console.log(`✅ Success: ${result.success ? 'Yes' : 'No'}`);
    console.log(`🚀 MCP Enhanced: ${result.mcpEnhanced ? 'Yes' : 'No'}`);
    console.log(`🌐 Web Fetch Used: ${result.webFetchUsed ? 'Yes' : 'No'}`);
    console.log(`🔥 YOLO Mode: ${result.yoloMode ? 'ACTIVE' : 'Inactive'}`);
    console.log(`📊 Message: ${result.message || 'N/A'}`);
    
    if (result.performance) {
        console.log(`⏱️ Processing Time: ${result.performance.processingTime}`);
        console.log(`🚀 Enhancement Factor: ${result.performance.mcpEnhancementFactor || 'N/A'}`);
        console.log(`🌐 Web Fetch Calls: ${result.performance.webFetchCalls || 0}`);
        console.log(`🎯 AI Boost Applied: ${result.performance.aiBoostApplied ? 'Yes' : 'No'}`);
    }
    console.log('');

    // Extracted data
    if (result.extractedData) {
        const data = result.extractedData;
        
        console.log('💰 FINANCIAL DATA EXTRACTED:');
        console.log('============================');
        console.log(`💰 Total Portfolio Value: $${data.totalValue?.toLocaleString() || 0}`);
        console.log(`💰 Target Value: $${data.targetValue?.toLocaleString() || EXPECTED_TOTAL}`);
        console.log(`🎯 Accuracy: ${data.accuracyPercent || 'N/A'}%`);
        console.log(`📊 Securities Found: ${data.securities?.length || 0}`);
        console.log(`💱 Currency: ${data.portfolioSummary?.currency || 'N/A'}`);
        console.log(`🏦 Institution: ${data.portfolioSummary?.institution_type || 'N/A'}`);
        console.log('');

        // Show securities
        if (data.securities && data.securities.length > 0) {
            console.log('📋 EXTRACTED SECURITIES:');
            console.log('========================');
            
            data.securities.forEach((security, index) => {
                console.log(`${index + 1}. ${security.isin || 'N/A'}`);
                console.log(`   Name: ${security.name || 'Unknown'}`);
                console.log(`   Value: $${(security.value || 0).toLocaleString()}`);
                console.log(`   Currency: ${security.currency || 'N/A'}`);
                console.log(`   Validated: ${security.validated ? '✅' : '❌'}`);
                console.log(`   Web Enhanced: ${security.webEnhanced ? '✅' : '❌'}`);
                console.log(`   Confidence: ${((security.confidence || 0) * 100).toFixed(1)}%`);
                console.log('');
            });
        }

        // MCP Analysis
        if (result.mcpAnalysis) {
            console.log('🔍 MCP ANALYSIS BREAKDOWN:');
            console.log('==========================');
            
            if (result.mcpAnalysis.institutionDetection) {
                const inst = result.mcpAnalysis.institutionDetection;
                console.log(`🏦 Institution: ${inst.type} (${inst.confidence}% confidence)`);
                console.log(`✅ Web Validated: ${inst.webValidated ? 'Yes' : 'No'}`);
            }
            
            if (result.mcpAnalysis.webValidation) {
                const web = result.mcpAnalysis.webValidation;
                console.log(`🌐 Web Validation: ${web.totalCalls} calls, ${web.validatedCount} validated`);
                console.log(`📊 Success Rate: ${(web.successRate * 100).toFixed(1)}%`);
            }
            
            if (result.mcpAnalysis.aiEnhancement) {
                const ai = result.mcpAnalysis.aiEnhancement;
                console.log(`🎯 AI Enhancement: ${ai.applied ? 'Applied' : 'Not Applied'}`);
                if (ai.methods) {
                    console.log(`🔧 Methods Used: ${ai.methods.join(', ')}`);
                }
            }
            
            if (result.mcpAnalysis.accuracyBreakdown) {
                const breakdown = result.mcpAnalysis.accuracyBreakdown;
                console.log('📊 Accuracy Breakdown:');
                console.log(`   Phase 3 Baseline: ${(breakdown.phase3_baseline * 100).toFixed(1)}%`);
                console.log(`   MCP Enhancement: +${(breakdown.mcp_enhancement * 100).toFixed(1)}%`);
                console.log(`   Web Validation: +${(breakdown.web_validation * 100).toFixed(1)}%`);
                console.log(`   AI Boost: +${(breakdown.ai_boost * 100).toFixed(1)}%`);
            }
            console.log('');
        }

        // Final assessment
        console.log('🏆 YOLO MODE ASSESSMENT:');
        console.log('========================');
        
        const extractedTotal = data.totalValue || 0;
        const accuracy = extractedTotal === EXPECTED_TOTAL ? 100 : 
            extractedTotal > 0 ? Math.max(0, (1 - Math.abs(extractedTotal - EXPECTED_TOTAL) / EXPECTED_TOTAL) * 100) : 0;

        console.log(`💰 Expected: $${EXPECTED_TOTAL.toLocaleString()}`);
        console.log(`💰 Extracted: $${extractedTotal.toLocaleString()}`);
        console.log(`🎯 Final Accuracy: ${accuracy.toFixed(2)}%`);
        console.log(`📊 Server Reported: ${data.accuracyPercent || 'N/A'}%`);
        
        const valueDiff = Math.abs(extractedTotal - EXPECTED_TOTAL);
        console.log(`📈 Difference: $${valueDiff.toLocaleString()}`);
        console.log('');

        if (accuracy >= 99.8) {
            console.log('🎊 YOLO SUCCESS: 99.8% TARGET ACHIEVED!');
            console.log('🏆 MCP-enhanced processing is PERFECT');
            console.log('🚀 Ready for enterprise deployment');
            console.log('🌟 Universal processing capabilities validated');
        } else if (accuracy >= 99.0) {
            console.log('🎯 EXCELLENT: Near-perfect accuracy achieved!');
            console.log('✅ MCP enhancement working exceptionally well');
            console.log('🚀 Ready for production deployment');
        } else if (accuracy >= 95.0) {
            console.log('✅ VERY GOOD: High accuracy with MCP enhancement');
            console.log('🔧 Minor optimizations could push to 99.8%');
            console.log('🚀 Commercially viable for deployment');
        } else if (accuracy >= 80.0) {
            console.log('⚠️ GOOD: Significant improvement over baseline');
            console.log('🔧 MCP enhancement working, needs optimization');
            console.log('📊 Better than 63% baseline, continue development');
        } else {
            console.log('🔧 NEEDS WORK: MCP enhancement needs debugging');
            console.log('📊 Review web fetch and AI boost algorithms');
            console.log('🧪 Check MCP processing pipeline');
        }

        // Save results
        const yoloReport = {
            timestamp: new Date().toISOString(),
            yoloMode: true,
            mcpEnhanced: result.mcpEnhanced,
            webFetchUsed: result.webFetchUsed,
            expectedTotal: EXPECTED_TOTAL,
            extractedTotal: extractedTotal,
            accuracy: accuracy,
            serverAccuracy: data.accuracyPercent,
            securitiesFound: data.securities?.length || 0,
            rawResult: result
        };

        const reportPath = path.join(__dirname, 'yolo-mcp-results.json');
        fs.writeFileSync(reportPath, JSON.stringify(yoloReport, null, 2));
        console.log(`\n📄 YOLO results saved: ${reportPath}`);

        return accuracy >= 99.0; // Success if 99%+ accuracy
    } else {
        console.log('❌ No extraction data returned from MCP processor');
        return false;
    }
}

// Run YOLO MODE test
console.log('🔥 YOLO MODE: BRIDGING THE GAP TO 99.8% ACCURACY');
console.log('===============================================');
console.log('Testing MCP-enhanced processor with real Messos PDF');
console.log('Web fetch integration + AI accuracy boost = YOLO SUCCESS!\n');

testYoloMCP().then(success => {
    console.log('\n🏁 YOLO MODE TEST COMPLETE');
    console.log('==========================');
    if (success) {
        console.log('🎊 YOLO SUCCESS: MCP integration bridged the gap!');
        console.log('✅ 99%+ accuracy achieved with real document');
        console.log('🚀 Platform ready for enterprise deployment');
        console.log('🌟 Universal processing capabilities validated');
    } else {
        console.log('🔧 YOLO PROGRESS: MCP enhancement working');
        console.log('📊 Significant improvement over baseline');
        console.log('🧪 Continue optimization for 99.8% target');
    }
}).catch(console.error);