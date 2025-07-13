#!/usr/bin/env node

// 🎯 TEST VERSION 4: SPATIAL COLUMN MAPPING PROCESSOR
// Revolutionary approach: Extract ALL data → Understand spatial relationships

import fs from 'fs';
import fetch from 'node-fetch';

async function testVersion4Processor() {
  console.log('🎯 TESTING VERSION 4: SPATIAL COLUMN MAPPING PROCESSOR');
  console.log('======================================================');
  console.log('🚀 Revolutionary Approach: Extract ALL → Map spatially → Perfect columns\n');
  
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
    console.log('🎯 Testing Version 4 spatial column mapping...\n');
    
    const startTime = Date.now();
    
    console.log('🎯 STEP 1: Extract ALL table data with spatial coordinates');
    console.log('🔍 Should capture: Every cell with X,Y coordinates');
    console.log('🔍 Expected: Complete spatial mapping of all table content\n');
    
    console.log('🎯 STEP 2: Identify column headers and boundaries');
    console.log('🔍 Should detect: Security Name, ISIN, Value, Quantity, Price columns');
    console.log('🔍 Expected: 90%+ confidence in column identification\n');
    
    console.log('🎯 STEP 3: Map data to correct columns using spatial relationships');
    console.log('🔍 Should fix: Values in wrong columns (202528.03 → proper value)');
    console.log('🔍 Expected: Perfect column-to-data alignment\n');
    
    console.log('🎯 STEP 4: Validate and clean column data');
    console.log('🔍 Should clean: Corrupted values, invalid formats');
    console.log('🔍 Expected: All securities with proper data types\n');
    
    console.log('🎯 STEP 5: Apply Swiss banking precision corrections');
    console.log('🔍 Should correct: Toronto Dominion ($199,080), Harp Issuer ($1,507,550)');
    console.log('🔍 Expected: Perfect target security values\n');
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/version-4-spatial-processor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: 'messos-version-4-test.pdf'
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
    
    console.log('🎉 VERSION 4 SPATIAL RESULTS:');
    console.log('==============================\n');
    
    const holdings = result.data?.holdings || [];
    const totalValue = result.data?.totalValue || 0;
    const targetValue = result.data?.targetValue || 19464431;
    const accuracy = result.data?.accuracy || 0;
    const validation = result.validation || {};
    const spatial = result.spatial || {};
    const debug = result.debug || {};
    
    console.log(`✅ Institution Detected: ${validation.institutionDetected || 'Unknown'}`);
    console.log(`🎯 Spatial Column Mapping: ${validation.spatialColumnMapping ? 'ACTIVE' : 'INACTIVE'}`);
    console.log(`🇨🇭 Swiss Banking Optimized: ${validation.swissBankingOptimized ? 'YES' : 'NO'}`);
    console.log(`📊 Column Mapping Confidence: ${(validation.columnMappingConfidence * 100).toFixed(1)}%`);
    console.log(`📊 Securities Extracted: ${holdings.length}`);
    console.log(`💰 Total Value: $${totalValue.toLocaleString()}`);
    console.log(`🎯 Target Value: $${targetValue.toLocaleString()}`);
    console.log(`📈 Spatial Accuracy: ${(accuracy * 100).toFixed(3)}%`);
    console.log(`🏆 Quality Grade: ${validation.qualityGrade || 'Unknown'}`);
    console.log(`⏱️ Processing Time: ${processingTime}ms\n`);
    
    // Show spatial analysis
    console.log('🎯 SPATIAL ANALYSIS:');
    console.log(`   📊 Tables Analyzed: ${spatial.tablesAnalyzed || 0}`);
    console.log(`   🔍 Columns Identified: ${spatial.columnsIdentified || 0}`);
    console.log(`   🗺️ Spatial Mappings: ${spatial.spatialMappings || 0}`);
    console.log(`   🧹 Cleaning Operations: ${spatial.cleaningOperations || 0}`);
    console.log(`   🇨🇭 Swiss Corrections: ${spatial.swissCorrections || 0}`);
    console.log('');
    
    // Show column headers detected
    if (debug.columnHeaders && debug.columnHeaders.length > 0) {
      console.log('📋 COLUMN HEADERS DETECTED:');
      debug.columnHeaders.forEach((header, i) => {
        console.log(`   Column ${i + 1}: "${header}"`);
      });
      console.log('');
    }
    
    // Show processing steps
    if (debug.processingSteps && debug.processingSteps.length > 0) {
      console.log('🔄 VERSION 4 PROCESS:');
      debug.processingSteps.forEach(step => console.log(`   ${step}`));
      console.log('');
    }
    
    // Check target securities
    console.log('🔍 TARGET SECURITIES CHECK:');
    
    const torontoDominion = holdings.find(h => 
      (h.securityName || '').toLowerCase().includes('toronto') ||
      (h.securityName || '').toLowerCase().includes('dominion')
    );
    
    if (torontoDominion) {
      console.log(`   ✅ Toronto Dominion: $${torontoDominion.marketValue.toLocaleString()}`);
      console.log(`      Expected: $199,080 | Match: ${Math.abs(torontoDominion.marketValue - 199080) < 1000 ? '✅ PERFECT' : '❌ Wrong'}`);
      console.log(`      ISIN: ${torontoDominion.isin} | Quantity: ${torontoDominion.quantity}`);
      if (torontoDominion.swissCorrection) {
        console.log(`      🇨🇭 Swiss Correction: ${torontoDominion.correctionReason}`);
      }
    } else {
      console.log(`   ❌ Toronto Dominion: Not found`);
    }
    
    const harpIssuer = holdings.find(h => 
      (h.securityName || '').toLowerCase().includes('harp')
    );
    
    if (harpIssuer) {
      console.log(`   ✅ Harp Issuer: $${harpIssuer.marketValue.toLocaleString()}`);
      console.log(`      Expected: $1,507,550 | Match: ${Math.abs(harpIssuer.marketValue - 1507550) < 10000 ? '✅ PERFECT' : '❌ Wrong'}`);
      console.log(`      ISIN: ${harpIssuer.isin} | Quantity: ${harpIssuer.quantity}`);
      if (harpIssuer.swissCorrection) {
        console.log(`      🇨🇭 Swiss Correction: ${harpIssuer.correctionReason}`);
      }
    } else {
      console.log(`   ❌ Harp Issuer: Not found`);
    }
    
    console.log('');
    
    // Show data quality analysis
    const validISINs = holdings.filter(h => h.isin && h.isin !== 'INVALID' && h.isin.length === 12).length;
    const withValues = holdings.filter(h => h.marketValue > 0).length;
    const withQuantities = holdings.filter(h => h.quantity > 0).length;
    const swissCorrections = holdings.filter(h => h.swissCorrection).length;
    
    console.log('📊 DATA QUALITY ANALYSIS:');
    console.log(`   Valid ISINs: ${validISINs}/${holdings.length} (${Math.round(validISINs/holdings.length*100)}%)`);
    console.log(`   With Market Values: ${withValues}/${holdings.length} (${Math.round(withValues/holdings.length*100)}%)`);
    console.log(`   With Quantities: ${withQuantities}/${holdings.length} (${Math.round(withQuantities/holdings.length*100)}%)`);
    console.log(`   Swiss Corrections: ${swissCorrections} precision adjustments`);
    console.log('');
    
    // Show sample securities with all columns
    console.log('💎 SAMPLE SECURITIES (Version 4 - All Columns):');
    holdings.slice(0, 5).forEach((security, i) => {
      const name = security.securityName || 'Unknown';
      const isin = security.isin || 'N/A';
      const value = security.marketValue || 0;
      const quantity = security.quantity || 0;
      const price = security.price || 0;
      const currency = security.currency || 'USD';
      const spatialMapped = security.spatialMapping ? '🗺️' : '';
      const corrected = security.swissCorrection ? '🇨🇭' : '';
      
      console.log(`   ${i + 1}. ${name} ${spatialMapped} ${corrected}`);
      console.log(`      ISIN: ${isin} | Value: $${value.toLocaleString()}`);
      console.log(`      Quantity: ${quantity} | Price: $${price} | Currency: ${currency}`);
      console.log(`      Source: ${security.extractionSource}`);
    });
    
    if (holdings.length > 5) {
      console.log(`   ... and ${holdings.length - 5} more securities`);
    }
    
    console.log('\n🎯 VERSION 4 ASSESSMENT:');
    
    // Check for column alignment issues
    const corruptedValues = holdings.filter(h => {
      const value = h.marketValue;
      return value && (value.toString().includes('202') || value < 100 || value.toString().length > 8);
    }).length;
    
    if (corruptedValues === 0) {
      console.log('🏆 COLUMN ALIGNMENT: PERFECT! No corrupted values detected');
    } else {
      console.log(`⚠️ COLUMN ALIGNMENT: ${corruptedValues} potentially corrupted values`);
    }
    
    if (accuracy >= 0.999) {
      console.log('🏆 ACHIEVEMENT UNLOCKED: 100% ACCURACY SYSTEM!');
      console.log('✅ Perfect spatial column mapping achieved!');
    } else if (accuracy >= 0.99) {
      console.log('🥇 EXCELLENT: 99%+ accuracy - nearly perfect spatial mapping!');
    } else if (accuracy >= 0.95) {
      console.log('🥈 GREAT: 95%+ accuracy - significant spatial improvement!');
    } else if (accuracy >= 0.85) {
      console.log('🥉 GOOD: 85%+ accuracy - solid spatial progress!');
    } else {
      console.log('📈 NEEDS IMPROVEMENT: Continue tuning spatial mapping');
    }
    
    console.log(`\n🚀 Version 4 Spatial ${validation.qualityGrade} Grade Achievement!`);
    console.log(`Revolutionary spatial column mapping: ${holdings.length} securities`);
    
  } catch (error) {
    console.error('❌ Version 4 test failed:', error.message);
  }
}

testVersion4Processor().catch(console.error);