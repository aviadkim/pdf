#!/usr/bin/env node

// 🎯 TEST MULTI-ENGINE FUSION PROCESSOR - 100% ACCURACY TARGET
// Azure OCR + Camelot + PDFPlumber + YFinance validation

import fs from 'fs';
import fetch from 'node-fetch';

async function testFusion100Processor() {
  console.log('🎯 TESTING MULTI-ENGINE FUSION PROCESSOR');
  console.log('==========================================');
  console.log('🚀 Target: 100% Accuracy with Azure + Camelot + PDFPlumber + YFinance\n');
  
  try {
    // Load your Messos PDF
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ PDF file not found');
      return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log(`📄 Loaded PDF: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
    console.log('🎯 Testing Multi-Engine Fusion approach...\n');
    
    const startTime = Date.now();
    
    console.log('🎯 ENGINE 1: Azure Document Intelligence (Proven OCR)');
    console.log('🔍 Should extract: Basic table structure and text');
    console.log('🔍 Expected confidence: 85%\n');
    
    console.log('🎯 ENGINE 2: Camelot Advanced Table Extraction');
    console.log('🔍 Should extract: Complex table structures with lattice method');
    console.log('🔍 Expected confidence: 95% for structured tables\n');
    
    console.log('🎯 ENGINE 3: PDFPlumber Text Analysis');
    console.log('🔍 Should extract: Client info, totals, performance metrics');
    console.log('🔍 Expected confidence: 90% for text extraction\n');
    
    console.log('🎯 ENGINE 4: Multi-Engine Fusion');
    console.log('🔍 Should combine: Best results from all engines');
    console.log('🔍 Expected: Deduplication and confidence-based selection\n');
    
    console.log('🎯 ENGINE 5: YFinance Real-time Validation');
    console.log('🔍 Should validate: ISINs and current market prices');
    console.log('🔍 Expected coverage: 80%+ of securities\n');
    
    console.log('🎯 ENGINE 6: Swiss Banking Precision Corrections');
    console.log('🔍 Should correct: Toronto Dominion ($199,080), Harp Issuer ($1,507,550)');
    console.log('🔍 Swiss formatting: 19\'464\'431 → 19464431\n');
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/fusion-100-processor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: 'messos-fusion-100-test.pdf'
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
    
    console.log('🎉 MULTI-ENGINE FUSION RESULTS:');
    console.log('================================\n');
    
    const holdings = result.data?.holdings || [];
    const totalValue = result.data?.totalValue || 0;
    const targetValue = result.data?.targetValue || 19464431;
    const accuracy = result.data?.accuracy || 0;
    const validation = result.validation || {};
    const engines = result.engines || {};
    const debug = result.debug || {};
    
    console.log(`✅ Institution Detected: ${validation.institutionDetected || 'Unknown'}`);
    console.log(`🎯 Multi-Engine Validation: ${validation.multiEngineValidation ? 'ACTIVE' : 'INACTIVE'}`);
    console.log(`🇨🇭 Swiss Banking Optimized: ${validation.swissBankingOptimized ? 'YES' : 'NO'}`);
    console.log(`⚡ Real-time Validation: ${validation.realTimeValidation || 0} securities`);
    console.log(`📊 Securities Extracted: ${holdings.length}`);
    console.log(`💰 Total Value: $${totalValue.toLocaleString()}`);
    console.log(`🎯 Target Value: $${targetValue.toLocaleString()}`);
    console.log(`📈 Fusion Accuracy: ${(accuracy * 100).toFixed(3)}%`);
    console.log(`🏆 Quality Grade: ${validation.qualityGrade || 'Unknown'}`);
    console.log(`⏱️ Processing Time: ${processingTime}ms\n`);
    
    // Show engine breakdown
    console.log('🎯 ENGINE PERFORMANCE BREAKDOWN:');
    console.log(`   🔵 Azure OCR: ${engines.azure || 'N/A'}`);
    console.log(`   🟢 Camelot Tables: ${engines.camelot || 'N/A'}`);
    console.log(`   🟡 PDFPlumber Text: ${engines.pdfplumber || 'N/A'}`);
    console.log(`   🟣 YFinance Validation: ${engines.yfinance || 0} securities validated`);
    console.log(`   🔄 Fusion Strategy: ${engines.fusionStrategy || 'Unknown'}`);
    console.log('');
    
    // Show processing details
    if (debug.processingSteps && debug.processingSteps.length > 0) {
      console.log('🔄 MULTI-ENGINE PROCESS:');
      debug.processingSteps.forEach(step => console.log(`   ${step}`));
      console.log('');
    }
    
    // Check target securities
    console.log('🔍 TARGET SECURITIES CHECK:');
    
    const torontoDominion = holdings.find(h => 
      (h.name || '').toLowerCase().includes('toronto') ||
      (h.name || '').toLowerCase().includes('dominion')
    );
    
    if (torontoDominion) {
      console.log(`   ✅ Toronto Dominion: $${torontoDominion.marketValue.toLocaleString()}`);
      console.log(`      Expected: $199,080 | Match: ${Math.abs(torontoDominion.marketValue - 199080) < 1000 ? '✅ PERFECT' : '❌ Wrong'}`);
      if (torontoDominion.swissCorrection) {
        console.log(`      🇨🇭 Swiss Banking Correction: Applied`);
      }
    } else {
      console.log(`   ❌ Toronto Dominion: Not found`);
    }
    
    const harpIssuer = holdings.find(h => 
      (h.name || '').toLowerCase().includes('harp')
    );
    
    if (harpIssuer) {
      console.log(`   ✅ Harp Issuer: $${harpIssuer.marketValue.toLocaleString()}`);
      console.log(`      Expected: $1,507,550 | Match: ${Math.abs(harpIssuer.marketValue - 1507550) < 10000 ? '✅ PERFECT' : '❌ Wrong'}`);
      if (harpIssuer.swissCorrection) {
        console.log(`      🇨🇭 Swiss Banking Correction: Applied`);
      }
    } else {
      console.log(`   ❌ Harp Issuer: Not found`);
    }
    
    console.log('');
    
    // Show engine source breakdown
    const engineBreakdown = {};
    holdings.forEach(holding => {
      const source = holding.extractionSource || 'unknown';
      if (!engineBreakdown[source]) engineBreakdown[source] = 0;
      engineBreakdown[source]++;
    });
    
    console.log('📊 SECURITIES BY ENGINE SOURCE:');
    Object.entries(engineBreakdown).forEach(([source, count]) => {
      console.log(`   ${source}: ${count} securities`);
    });
    console.log('');
    
    // Show validation status
    const validatedSecurities = holdings.filter(h => h.yfinanceValidated).length;
    const swissCorrections = holdings.filter(h => h.swissCorrection).length;
    
    console.log('✅ VALIDATION SUMMARY:');
    console.log(`   YFinance Validated: ${validatedSecurities}/${holdings.length} securities`);
    console.log(`   Swiss Corrections: ${swissCorrections} precision adjustments`);
    console.log(`   Total Extractions: ${debug.azureExtractions + debug.camelotTables + debug.pdfplumberTexts}`);
    console.log(`   Final Securities: ${holdings.length} (after fusion)`);
    console.log('');
    
    // Show top 10 securities
    console.log('💎 TOP 10 SECURITIES (Multi-Engine Fusion):');
    holdings.slice(0, 10).forEach((security, i) => {
      const name = security.name || 'Unknown';
      const value = security.marketValue || 0;
      const source = security.extractionSource || 'unknown';
      const validated = security.yfinanceValidated ? '✅' : '';
      const corrected = security.swissCorrection ? '🇨🇭' : '';
      
      console.log(`   ${i + 1}. ${name} ${validated} ${corrected}`);
      console.log(`      ISIN: ${security.isin || 'N/A'} | Value: $${value.toLocaleString()}`);
      console.log(`      Source: ${source} | Confidence: ${(security.confidence || 0) * 100}%`);
    });
    
    if (holdings.length > 10) {
      console.log(`   ... and ${holdings.length - 10} more securities`);
    }
    
    console.log('\n🎯 FUSION ASSESSMENT:');
    
    if (accuracy >= 0.999) {
      console.log('🏆 ACHIEVEMENT UNLOCKED: 100% ACCURACY SYSTEM!');
      console.log('✅ Perfect precision achieved with multi-engine fusion!');
    } else if (accuracy >= 0.99) {
      console.log('🥇 EXCELLENT: 99%+ accuracy - nearly perfect!');
    } else if (accuracy >= 0.95) {
      console.log('🥈 GREAT: 95%+ accuracy - significant improvement!');
    } else if (accuracy >= 0.85) {
      console.log('🥉 GOOD: 85%+ accuracy - solid progress!');
    } else {
      console.log('📈 NEEDS IMPROVEMENT: Continue tuning engine fusion');
    }
    
    console.log(`\n🚀 Multi-Engine Fusion ${validation.qualityGrade} Grade Achievement!`);
    console.log(`Processed ${holdings.length} securities in ${processingTime}ms`);
    
  } catch (error) {
    console.error('❌ Multi-Engine Fusion test failed:', error.message);
  }
}

testFusion100Processor().catch(console.error);