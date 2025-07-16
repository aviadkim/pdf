// 💀 SUPERCLAUDE YOLO MODE TEST - 100% ACCURACY TARGET
// Test the ultimate processor with dangerous optimizations

import fs from 'fs';
import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3001';
const PDF_PATH = './2. Messos  - 31.03.2025.pdf';
const TARGET_VALUE = 19464431; // Known total value for validation

async function testSuperClaudeYolo() {
  console.log('💀 SUPERCLAUDE YOLO MODE TEST INITIATED');
  console.log('🎯 TARGET: 100% ACCURACY - NO COMPROMISES');
  console.log('⚠️  DANGEROUS CODE APPROVED - ALL LIMITS REMOVED');
  console.log('');
  
  try {
    // Check if PDF exists
    if (!fs.existsSync(PDF_PATH)) {
      console.error(`❌ PDF not found: ${PDF_PATH}`);
      return;
    }
    
    console.log(`📄 Loading PDF: ${PDF_PATH}`);
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    const pdfBase64 = pdfBuffer.toString('base64');
    console.log(`📊 PDF Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
    console.log('');
    
    // Test server connectivity
    console.log('🔗 Testing server connectivity...');
    try {
      const healthCheck = await fetch(`${SERVER_URL}/`);
      const healthData = await healthCheck.json();
      console.log('✅ Server connected:', healthData.message);
      console.log('📋 Available endpoints:', healthData.endpoints);
      console.log('');
    } catch (error) {
      console.error('❌ Server not running. Start with: npm run local-server');
      return;
    }
    
    // Run SuperClaude YOLO processor
    console.log('💀 LAUNCHING SUPERCLAUDE YOLO MODE...');
    console.log('🚀 ALL EXTRACTION ENGINES ACTIVATED');
    console.log('🧠 AI-POWERED INTELLIGENCE FUSION ENABLED');
    console.log('💎 ITERATIVE PERFECTION ALGORITHM ENGAGED');
    console.log('🏆 GROUND TRUTH VALIDATION READY');
    console.log('');
    
    const startTime = Date.now();
    
    const response = await fetch(`${SERVER_URL}/api/superclaude-yolo-ultimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: '2. Messos - 31.03.2025.pdf'
      })
    });
    
    const processingTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error ${response.status}:`, errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log('💀 SUPERCLAUDE YOLO PROCESSING COMPLETE');
    console.log('='.repeat(80));
    
    if (result.success) {
      console.log(`✅ SUCCESS: ${result.message}`);
      console.log('');
      
      // Analysis Results
      console.log('📊 EXTRACTION ANALYSIS:');
      console.log(`💰 Total Value Extracted: $${result.data.totalValue?.toLocaleString() || 'N/A'}`);
      console.log(`🎯 Target Value: $${result.data.targetValue?.toLocaleString() || 'N/A'}`);
      console.log(`📈 Accuracy: ${result.data.accuracyPercent || 'N/A'}%`);
      console.log(`🏆 Perfect Extraction: ${result.data.perfectExtraction ? 'YES' : 'NO'}`);
      console.log(`⏱️  Processing Time: ${processingTime}ms`);
      console.log('');
      
      // Holdings Summary
      if (result.data.holdings && result.data.holdings.length > 0) {
        console.log(`📋 HOLDINGS EXTRACTED: ${result.data.holdings.length} securities`);
        console.log('');
        
        // Show first few holdings
        console.log('🔍 SAMPLE HOLDINGS:');
        result.data.holdings.slice(0, 5).forEach((holding, index) => {
          console.log(`${index + 1}. ${holding.securityName || 'N/A'}`);
          console.log(`   ISIN: ${holding.isin || 'N/A'}`);
          console.log(`   Value: $${holding.totalValue?.toLocaleString() || 'N/A'}`);
          console.log('');
        });
        
        if (result.data.holdings.length > 5) {
          console.log(`... and ${result.data.holdings.length - 5} more securities`);
          console.log('');
        }
      }
      
      // SuperClaude Performance Details
      if (result.superClaude) {
        console.log('💀 SUPERCLAUDE PERFORMANCE DETAILS:');
        console.log('');
        
        if (result.superClaude.stage1) {
          console.log(`🚀 Stage 1 - ${result.superClaude.stage1.name}:`);
          console.log(`   Engines Used: ${result.superClaude.stage1.engines?.join(', ') || 'N/A'}`);
          console.log(`   Data Points: ${result.superClaude.stage1.dataPoints || 'N/A'}`);
          console.log(`   Confidence: ${result.superClaude.stage1.confidence || 'N/A'}%`);
          console.log(`   Duration: ${result.superClaude.stage1.duration || 'N/A'}ms`);
          console.log('');
        }
        
        if (result.superClaude.stage2) {
          console.log(`🧠 Stage 2 - ${result.superClaude.stage2.name}:`);
          console.log(`   Tables Reconstructed: ${result.superClaude.stage2.tablesReconstructed || 'N/A'}`);
          console.log(`   Relationships Discovered: ${result.superClaude.stage2.relationshipsDiscovered || 'N/A'}`);
          console.log(`   Duration: ${result.superClaude.stage2.duration || 'N/A'}ms`);
          console.log('');
        }
        
        if (result.superClaude.stage3) {
          console.log(`🎯 Stage 3 - ${result.superClaude.stage3.name}:`);
          console.log(`   Securities Fused: ${result.superClaude.stage3.securitiesFused || 'N/A'}`);
          console.log(`   Confidence Weighting: ${result.superClaude.stage3.confidenceWeighting ? 'YES' : 'NO'}`);
          console.log(`   Duration: ${result.superClaude.stage3.duration || 'N/A'}ms`);
          console.log('');
        }
        
        if (result.superClaude.stage4) {
          console.log(`💎 Stage 4 - ${result.superClaude.stage4.name}:`);
          console.log(`   Iterations: ${result.superClaude.stage4.iterations || 'N/A'}`);
          console.log(`   Improvements: ${result.superClaude.stage4.improvements?.length || 'N/A'}`);
          console.log(`   Convergence Rate: ${result.superClaude.stage4.convergenceRate || 'N/A'}`);
          console.log(`   Duration: ${result.superClaude.stage4.duration || 'N/A'}ms`);
          console.log('');
        }
        
        if (result.superClaude.stage5) {
          console.log(`🏆 Stage 5 - ${result.superClaude.stage5.name}:`);
          console.log(`   Ground Truth Matches: ${result.superClaude.stage5.groundTruthMatches || 'N/A'}`);
          console.log(`   Validations Performed: ${result.superClaude.stage5.validationsPerformed || 'N/A'}`);
          console.log(`   Corrections Applied: ${result.superClaude.stage5.correctionsApplied || 'N/A'}`);
          console.log(`   Duration: ${result.superClaude.stage5.duration || 'N/A'}ms`);
          console.log('');
        }
      }
      
      // Intelligence Features
      if (result.intelligence) {
        console.log('🧠 INTELLIGENCE FEATURES:');
        console.log(`   Multi-Agent: ${result.intelligence.multiAgent ? 'YES' : 'NO'}`);
        console.log(`   Swiss Banking Optimized: ${result.intelligence.swissBankingOptimized ? 'YES' : 'NO'}`);
        console.log(`   Real-time Validation: ${result.intelligence.realTimeValidation ? 'YES' : 'NO'}`);
        console.log(`   Learning Enabled: ${result.intelligence.learningEnabled ? 'YES' : 'NO'}`);
        console.log(`   Dangerous Code Approved: ${result.intelligence.dangerousCodeApproved ? 'YES' : 'NO'}`);
        console.log('');
      }
      
      // Performance Metrics
      if (result.performance) {
        console.log('⚡ PERFORMANCE METRICS:');
        console.log(`   Total Processing Time: ${result.performance.totalProcessingTime || 'N/A'}`);
        console.log(`   Parallel Engines: ${result.performance.parallelEngines || 'N/A'}`);
        console.log(`   Iterations Performed: ${result.performance.iterationsPerformed || 'N/A'}`);
        console.log(`   YOLO Optimizations: ${result.performance.yoloOptimizations?.join(', ') || 'N/A'}`);
        console.log('');
      }
      
    } else {
      console.log(`❌ FAILURE: ${result.error}`);
      if (result.details) {
        console.log(`💬 Details: ${result.details}`);
      }
      if (result.stage) {
        console.log(`🔧 Failed at stage: ${result.stage}`);
      }
    }
    
    console.log('='.repeat(80));
    console.log('💀 SUPERCLAUDE YOLO MODE TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSuperClaudeYolo();