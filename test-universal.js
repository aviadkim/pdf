#!/usr/bin/env node

// 🌍 TEST UNIVERSAL PROCESSOR - Future of Financial Document Processing

import fs from 'fs';
import fetch from 'node-fetch';

async function testUniversalProcessor() {
  console.log('🌍 TESTING UNIVERSAL PROCESSOR');
  console.log('==============================');
  console.log('🚀 The Future: Claude Code Terminal-level understanding for ALL financial documents\n');
  
  try {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ PDF file not found');
      return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log(`📄 Loaded PDF: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
    console.log('🎯 Testing Universal Multi-Institution Processor...\n');
    
    const startTime = Date.now();
    
    console.log('🎯 STEP 1: Institution Detection & Format Recognition');
    console.log('🔍 Should detect: Corner Bank, Messos format, Swiss structure');
    console.log('🔍 Expected: 90%+ confidence in institution identification\n');
    
    console.log('🎯 STEP 2: Adaptive Processing Engine Selection');
    console.log('🔍 Should select: Multi-Row Swiss Banking Strategy');
    console.log('🔍 Expected: Optimal engine combination for detected format\n');
    
    console.log('🎯 STEP 3: Multi-Engine Extraction with Confidence Scoring');
    console.log('🔍 Should use: Azure OCR + Spatial Analysis + Pattern Recognition');
    console.log('🔍 Expected: High confidence extraction results\n');
    
    console.log('🎯 STEP 4: Intelligent Fusion & Validation');
    console.log('🔍 Should validate: Against known patterns and market data');
    console.log('🔍 Expected: Error detection and correction\n');
    
    console.log('🎯 STEP 5: Real-time Learning & Adaptation');
    console.log('🔍 Should adapt: Based on document structure and user feedback');
    console.log('🔍 Expected: Continuous improvement capability\n');
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/universal-processor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: 'messos-universal-test.pdf'
      })
    });
    
    const processingTime = Date.now() - startTime;
    
    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
      return;
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.log(`❌ Processing failed: ${result.error}`);
      console.log(`Details: ${result.details}`);
      return;
    }
    
    console.log('🎉 UNIVERSAL PROCESSOR RESULTS:');
    console.log('===============================\n');
    
    const holdings = result.data?.holdings || [];
    const totalValue = result.data?.totalValue || 0;
    const accuracy = result.data?.accuracy || 0;
    const validation = result.validation || {};
    const intelligence = result.intelligence || {};
    const debug = result.debug || {};
    
    console.log(`✅ Institution Detected: ${intelligence.institution} (${intelligence.confidence}% confidence)`);
    console.log(`📋 Format Recognized: ${intelligence.format}`);
    console.log(`⚡ Processing Strategy: ${intelligence.processingStrategy}`);
    console.log(`🔧 Engines Used: ${intelligence.enginesUsed?.join(', ') || 'N/A'}`);
    console.log(`🤖 AI-Powered: ${result.metadata?.aiPowered ? 'YES' : 'NO'}`);
    console.log(`📚 Adaptive Learning: ${result.metadata?.adaptiveLearning ? 'ACTIVE' : 'INACTIVE'}`);
    console.log(`🏢 Enterprise Grade: ${result.metadata?.enterpriseGrade ? 'YES' : 'NO'}`);
    console.log(`📊 Securities Extracted: ${holdings.length}`);
    console.log(`💰 Total Value: $${totalValue.toLocaleString()}`);
    console.log(`📈 Accuracy: ${(accuracy * 100).toFixed(3)}%`);
    console.log(`🏆 Quality Grade: ${validation.qualityGrade || 'Unknown'}`);
    console.log(`⏱️ Processing Time: ${processingTime}ms\n`);
    
    // Show intelligence analysis
    console.log('🧠 INTELLIGENCE ANALYSIS:');
    if (debug.institutionAnalysis) {
      console.log(`   Institution Detection: ${debug.institutionAnalysis.institution}`);
      console.log(`   Format: ${debug.institutionAnalysis.format}`);
      console.log(`   Confidence: ${debug.institutionAnalysis.confidence}%`);
      console.log(`   Currency Format: ${debug.institutionAnalysis.currencyFormat}`);
      console.log(`   Document Structure: ${debug.institutionAnalysis.documentStructure}`);
    }
    console.log('');
    
    // Show processing strategy
    if (debug.processingStrategy) {
      console.log('⚡ PROCESSING STRATEGY:');
      console.log(`   Strategy: ${debug.processingStrategy.name}`);
      console.log(`   Engines: ${debug.processingStrategy.engines?.join(', ')}`);
      console.log(`   Specializations: ${debug.processingStrategy.specializations?.join(', ')}`);
    }
    console.log('');
    
    // Show processing steps
    if (debug.processingSteps && debug.processingSteps.length > 0) {
      console.log('🔄 PROCESSING STEPS:');
      debug.processingSteps.forEach(step => console.log(`   ${step}`));
      console.log('');
    }
    
    // Future capabilities preview
    console.log('🚀 FUTURE CAPABILITIES PREVIEW:');
    console.log('   🏦 Multi-Institution Support: Corner Bank ✅, UBS ⏳, Credit Suisse ⏳');
    console.log('   🌍 Multi-Language: English ✅, German ⏳, French ⏳, Italian ⏳');
    console.log('   📊 Document Types: Portfolio ✅, Statements ⏳, Trade Confirms ⏳');
    console.log('   🤖 AI Engines: Azure ✅, Claude Vision ⏳, Custom ML ⏳');
    console.log('   📚 Learning: Pattern Recognition ⏳, User Feedback ⏳');
    console.log('   🔗 Integrations: Yahoo Finance ⏳, Bloomberg ⏳, Portfolio Systems ⏳');
    console.log('');
    
    console.log('🎯 UNIVERSAL ASSESSMENT:');
    
    if (accuracy >= 0.999) {
      console.log('🏆 ACHIEVEMENT UNLOCKED: Universal 100% Accuracy!');
      console.log('✅ Ready for enterprise deployment across all institutions!');
    } else if (accuracy >= 0.99) {
      console.log('🥇 EXCELLENT: 99%+ accuracy - nearly universal!');
    } else if (accuracy >= 0.95) {
      console.log('🥈 GREAT: 95%+ accuracy - strong universal performance!');
    } else if (accuracy >= 0.85) {
      console.log('🥉 GOOD: 85%+ accuracy - solid universal foundation!');
    } else {
      console.log('📈 DEVELOPING: Building universal capabilities...');
    }
    
    console.log(`\\n🚀 Universal Processor ${validation.qualityGrade} Grade!`);
    console.log(`Next-generation financial document intelligence: ${holdings.length} securities`);
    console.log('🌟 Vision: Matching Claude Code terminal understanding for ALL financial documents');
    
  } catch (error) {
    console.error('❌ Universal processor test failed:', error.message);
  }
}

testUniversalProcessor().catch(console.error);