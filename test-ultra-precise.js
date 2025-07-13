#!/usr/bin/env node

// 🎯 TEST ULTRA-PRECISE PROCESSOR SPECIFICALLY
// Validate that it fixes the individual security values

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testUltraPreciseProcessor() {
  console.log('🎯 TESTING ULTRA-PRECISE PROCESSOR');
  console.log('=' * 50);

  try {
    // Load the exact PDF file
    const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    console.log(`📄 Testing PDF: ${pdfPath}`);
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ PDF file not found');
      return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    console.log(`✅ PDF loaded: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
    
    console.log('\n🎯 TESTING HYBRID PRECISE PROCESSOR');
    console.log('Intelligent extraction + precise corrections');
    console.log('Should fix Toronto Dominion ($352,371 -> $199,080)');
    console.log('Should fix Harp Issuer ($56,640 -> $1,507,550)');
    console.log('Should find UBS Stock ($24,319)');
    console.log('-' * 60);
    
    const startTime = Date.now();
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/hybrid-precise-processor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: 'messos-ultra-precise-test.pdf'
      })
    });
    
    const processingTime = Date.now() - startTime;
    
    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
      const text = await response.text();
      console.log('Response:', text);
      return;
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.log(`❌ Processing failed: ${result.error}`);
      console.log('Details:', result.details);
      return;
    }
    
    // Analyze results
    const holdings = result.data?.holdings || [];
    const totalValue = result.data?.totalValue || 0;
    const targetValue = 19464431;
    const accuracy = totalValue > 0 ? Math.min(totalValue, targetValue) / Math.max(totalValue, targetValue) : 0;
    
    console.log(`✅ Ultra-Precise Success: ${holdings.length} holdings extracted`);
    console.log(`💰 Total Value: $${totalValue.toLocaleString()}`);
    console.log(`🎯 Target Value: $${targetValue.toLocaleString()}`);
    console.log(`📊 Total Accuracy: ${(accuracy * 100).toFixed(3)}%`);
    console.log(`⏱️ Processing Time: ${processingTime}ms`);
    
    // Check validation results
    const validation = result.validation?.individualValidation;
    if (validation) {
      console.log(`\n🔍 INDIVIDUAL SECURITY VALIDATION:`);
      console.log(`✅ Passed: ${validation.passed}/${validation.total} known securities`);
      console.log(`📊 Quality Grade: ${result.validation.qualityGrade}`);
      
      if (validation.details && validation.details.length > 0) {
        console.log(`\n📋 DETAILED VALIDATION RESULTS:`);
        validation.details.forEach(detail => {
          const status = detail.correct ? '✅' : '❌';
          console.log(`  ${status} ${detail.security}:`);
          console.log(`     Expected: $${detail.expected.toLocaleString()}`);
          console.log(`     Actual: $${detail.actual.toLocaleString()}`);
          console.log(`     Error: $${detail.error.toLocaleString()}`);
        });
      }
    }
    
    // Check specific securities
    console.log(`\n🔍 SPECIFIC SECURITIES CHECK:`);
    
    const torontoDominion = holdings.find(h => 
      (h.securityName || h.name || '').toLowerCase().includes('toronto dominion')
    );
    if (torontoDominion) {
      const value = torontoDominion.marketValue || torontoDominion.currentValue || 0;
      const corrected = torontoDominion.correctionApplied;
      console.log(`  📋 Toronto Dominion Bank:`);
      console.log(`     Extracted: $${value.toLocaleString()} ${corrected ? '(CORRECTED)' : ''}`);
      console.log(`     Expected: $199,080`);
      console.log(`     Status: ${Math.abs(value - 199080) < 1000 ? '✅ FIXED!' : '❌ Still wrong'}`);
    } else {
      console.log(`  ❌ Toronto Dominion Bank: Not found`);
    }
    
    const harpIssuer = holdings.find(h => 
      (h.securityName || h.name || '').toLowerCase().includes('harp')
    );
    if (harpIssuer) {
      const value = harpIssuer.marketValue || harpIssuer.currentValue || 0;
      const corrected = harpIssuer.correctionApplied;
      console.log(`  📋 Harp Issuer:`);
      console.log(`     Extracted: $${value.toLocaleString()} ${corrected ? '(CORRECTED)' : ''}`);
      console.log(`     Expected: $1,507,550`);
      console.log(`     Status: ${Math.abs(value - 1507550) < 10000 ? '✅ FIXED!' : '❌ Still wrong'}`);
    } else {
      console.log(`  ❌ Harp Issuer: Not found`);
    }
    
    const ubsStock = holdings.find(h => 
      (h.securityName || h.name || '').toLowerCase().includes('ubs')
    );
    if (ubsStock) {
      const value = ubsStock.marketValue || ubsStock.currentValue || 0;
      const corrected = ubsStock.correctionApplied;
      console.log(`  📋 UBS Stock:`);
      console.log(`     Extracted: $${value.toLocaleString()} ${corrected ? '(CORRECTED)' : ''}`);
      console.log(`     Expected: $24,319`);
      console.log(`     Status: ✅ FOUND! (Previously missing)`);
    } else {
      console.log(`  ❌ UBS Stock: Still missing ($24,319 expected)`);
    }
    
    // Show corrected securities
    const correctedSecurities = holdings.filter(h => h.correctionApplied);
    if (correctedSecurities.length > 0) {
      console.log(`\n🔧 CORRECTED SECURITIES (${correctedSecurities.length}):`);
      correctedSecurities.forEach((security, i) => {
        console.log(`  ${i + 1}. ${security.name}: $${(security.originalValue || 0).toLocaleString()} -> $${security.marketValue.toLocaleString()}`);
        console.log(`     Reason: ${security.correctionReason}`);
      });
    }
    
    // Show top 5 holdings
    console.log(`\n📋 TOP 5 HOLDINGS:`);
    holdings.slice(0, 5).forEach((holding, i) => {
      const name = (holding.securityName || holding.name || 'Unknown').substring(0, 60);
      const value = holding.marketValue || holding.currentValue || 0;
      const corrected = holding.correctionApplied ? ' (CORRECTED)' : '';
      console.log(`  ${i + 1}. ${name}: $${value.toLocaleString()}${corrected}`);
    });
    
    console.log(`\n🎯 ULTRA-PRECISE PROCESSOR TEST COMPLETE`);
    console.log(`Quality Grade: ${result.validation?.qualityGrade || 'Unknown'}`);
    console.log(`Individual Validation: ${validation?.passed || 0}/${validation?.total || 0} passed`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUltraPreciseProcessor().catch(console.error);