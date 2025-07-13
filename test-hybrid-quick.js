#!/usr/bin/env node

// Quick test of hybrid-precise processor

import fs from 'fs';
import fetch from 'node-fetch';

async function testHybridProcessor() {
  console.log('🎯 TESTING HYBRID PRECISE PROCESSOR');
  console.log('===================================');
  
  try {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ PDF file not found');
      return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log(`📄 Loaded PDF: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
    console.log('🎯 Testing Hybrid Precise Processor...\\n');
    
    const startTime = Date.now();
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/hybrid-precise-processor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: 'messos-hybrid-test.pdf'
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
    
    const holdings = result.data?.holdings || [];
    const totalValue = result.data?.totalValue || 0;
    const accuracy = result.data?.accuracy || 0;
    const validation = result.validation || {};
    
    console.log('🎉 HYBRID PRECISE RESULTS:');
    console.log(`✅ Securities Extracted: ${holdings.length}`);
    console.log(`💰 Total Value: $${totalValue.toLocaleString()}`);
    console.log(`📊 Accuracy: ${(accuracy * 100).toFixed(3)}%`);
    console.log(`🏆 Quality Grade: ${validation.qualityGrade || 'Unknown'}`);
    console.log(`⏱️ Processing Time: ${processingTime}ms\\n`);
    
    // Check target securities
    const torontoDominion = holdings.find(h => 
      (h.securityName || '').toLowerCase().includes('toronto') ||
      (h.securityName || '').toLowerCase().includes('dominion')
    );
    
    if (torontoDominion) {
      console.log(`✅ Toronto Dominion: $${torontoDominion.marketValue.toLocaleString()}`);
    } else {
      console.log(`❌ Toronto Dominion: Not found`);
    }
    
    const harpIssuer = holdings.find(h => 
      (h.securityName || '').toLowerCase().includes('harp')
    );
    
    if (harpIssuer) {
      console.log(`✅ Harp Issuer: $${harpIssuer.marketValue.toLocaleString()}`);
    } else {
      console.log(`❌ Harp Issuer: Not found`);
    }
    
    console.log(`\\n🚀 Hybrid Precise ${validation.qualityGrade} Grade Achievement!`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testHybridProcessor().catch(console.error);