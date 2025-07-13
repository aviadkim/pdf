#!/usr/bin/env node

// 🚀 TEST CURRENT BEST PROCESSOR
// Test the highest performing processor we have

import fs from 'fs';
import fetch from 'node-fetch';

async function testCurrentBest() {
  console.log('🚀 TESTING CURRENT BEST PROCESSOR (Hybrid)');
  console.log('============================================\n');
  
  try {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ PDF file not found');
      return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log(`📄 Loaded PDF: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
    console.log('🎯 Testing hybrid-precise-processor (current best)...\n');
    
    const startTime = Date.now();
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/hybrid-precise-processor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: 'messos-current-best-test.pdf'
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
      return;
    }
    
    console.log('🎉 CURRENT BEST RESULTS:');
    console.log('========================\n');
    
    const holdings = result.data?.holdings || [];
    const totalValue = result.data?.totalValue || 0;
    const accuracy = result.data?.accuracy || 0;
    const validation = result.validation || {};
    
    console.log(`📊 Securities Found: ${holdings.length}`);
    console.log(`💰 Total Value: $${totalValue.toLocaleString()}`);
    console.log(`🎯 Accuracy: ${(accuracy * 100).toFixed(2)}%`);
    console.log(`🏆 Quality Grade: ${validation.qualityGrade || 'Unknown'}`);
    console.log(`⏱️ Processing Time: ${processingTime}ms\n`);
    
    // Check target securities
    console.log('🔍 TARGET SECURITIES CHECK:');
    
    const torontoDominion = holdings.find(h => 
      (h.name || '').toLowerCase().includes('toronto') ||
      (h.name || '').toLowerCase().includes('dominion')
    );
    
    if (torontoDominion) {
      console.log(`   ✅ Toronto Dominion: $${torontoDominion.marketValue.toLocaleString()}`);
      console.log(`      Expected: $199,080 | Match: ${Math.abs(torontoDominion.marketValue - 199080) < 1000 ? '✅ PERFECT' : '❌ Wrong'}`);
    } else {
      console.log(`   ❌ Toronto Dominion: Not found`);
    }
    
    const harpIssuer = holdings.find(h => 
      (h.name || '').toLowerCase().includes('harp')
    );
    
    if (harpIssuer) {
      console.log(`   ✅ Harp Issuer: $${harpIssuer.marketValue.toLocaleString()}`);
      console.log(`      Expected: $1,507,550 | Match: ${Math.abs(harpIssuer.marketValue - 1507550) < 10000 ? '✅ PERFECT' : '❌ Wrong'}`);
    } else {
      console.log(`   ❌ Harp Issuer: Not found`);
    }
    
    console.log('\n💎 TOP 10 SECURITIES:');
    holdings.slice(0, 10).forEach((security, i) => {
      const name = security.name || 'Unknown';
      const value = security.marketValue || 0;
      console.log(`   ${i + 1}. ${name}: $${value.toLocaleString()}`);
    });
    
    console.log(`\n🎯 CURRENT BEST: ${validation.qualityGrade} grade with ${(accuracy * 100).toFixed(2)}% accuracy`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCurrentBest().catch(console.error);