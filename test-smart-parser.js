#!/usr/bin/env node

// 🧠 TEST SMART TABLE PARSER
// Test the new smart table parser with column mapping

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSmartParser() {
  console.log('🧠 TESTING SMART TABLE PARSER');
  console.log('=' * 50);

  try {
    // Load the Messos PDF
    const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    console.log(`📄 Loading PDF: ${pdfPath}`);
    
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    console.log(`✅ PDF loaded: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
    
    // Test the smart table parser
    console.log('\n🧠 TESTING SMART TABLE PARSER');
    console.log('-' * 50);
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/smart-table-parser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: 'messos-smart-parser-test.pdf'
      })
    });
    
    console.log(`📡 Response Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      console.log(`Error details: ${errorText}`);
      return;
    }
    
    const result = await response.json();
    
    console.log('\n🧠 SMART PARSER RESULTS');
    console.log('-' * 40);
    console.log(`✅ Success: ${result.success}`);
    console.log(`📊 Holdings: ${result.data?.holdings?.length || 0}`);
    
    if (result.data?.holdings?.length > 0) {
      const totalValue = result.data.totalValue || 0;
      const targetValue = result.data.targetValue || 19464431;
      const accuracy = result.data.accuracy || 0;
      
      console.log(`💰 Smart Parsed Total: $${totalValue.toLocaleString()}`);
      console.log(`🎯 Target Total: $${targetValue.toLocaleString()}`);
      console.log(`📊 Accuracy: ${(accuracy * 100).toFixed(3)}%`);
      
      // Key test cases from your screenshots
      console.log('\n🔍 KEY VALUE CHECKS (From Your Screenshots):');
      
      const torontoDominion = result.data.holdings.find(h => 
        (h.securityName || h.name || '').toLowerCase().includes('toronto dominion')
      );
      if (torontoDominion) {
        console.log(`📋 TORONTO DOMINION:`);
        console.log(`   PDF Expected: ~$199,080`);
        console.log(`   Smart Parser: $${(torontoDominion.marketValue || 0).toLocaleString()}`);
        console.log(`   ✅ Match: ${Math.abs((torontoDominion.marketValue || 0) - 199080) < 5000 ? 'YES' : 'NO'}`);
      }
      
      const harpIssuer = result.data.holdings.find(h => 
        (h.securityName || h.name || '').toLowerCase().includes('harp')
      );
      if (harpIssuer) {
        console.log(`📋 HARP ISSUER:`);
        console.log(`   PDF Expected: ~$1,507,550`);
        console.log(`   Smart Parser: $${(harpIssuer.marketValue || 0).toLocaleString()}`);
        console.log(`   ✅ Match: ${Math.abs((harpIssuer.marketValue || 0) - 1507550) < 10000 ? 'YES' : 'NO'}`);
      }
      
      // Check for UBS stock
      const ubsStock = result.data.holdings.find(h => 
        (h.securityName || h.name || '').toLowerCase().includes('ubs')
      );
      console.log(`🏦 UBS Stock: ${ubsStock ? '✅ Found' : '❌ Still Missing'}`);
      
      if (result.debug) {
        console.log('\n🔍 DEBUG INFO');
        console.log(`Tables Found: ${result.debug.tablesFound}`);
        console.log(`Bonds Table: ${result.debug.bondsTable}`);
        console.log(`Equities Table: ${result.debug.equitiesTable}`);
        console.log(`Cash Table: ${result.debug.cashTable}`);
      }
      
      if (result.metadata) {
        console.log('\n🔍 METADATA');
        console.log(`Processing Time: ${result.metadata.processingTime}`);
        console.log(`Phase 1: ${result.metadata.phase1}`);
        console.log(`Phase 2: ${result.metadata.phase2}`);
        console.log(`Phase 3: ${result.metadata.phase3}`);
      }
      
      // Show sample holdings (focus on bonds)
      console.log('\n📋 SAMPLE HOLDINGS (First 5):');
      result.data.holdings.slice(0, 5).forEach((holding, i) => {
        console.log(`${i + 1}. ${holding.securityName || holding.name || 'Unknown'}`);
        console.log(`   ISIN: ${holding.isin || 'N/A'}`);
        console.log(`   Value: $${(holding.marketValue || holding.currentValue || 0).toLocaleString()}`);
        console.log(`   Quantity: ${holding.quantity ? holding.quantity.toLocaleString() : 'N/A'}`);
        console.log(`   Source: ${holding.extractionSource || 'Unknown'}`);
      });
      
    } else {
      console.log('❌ No holdings extracted by smart parser');
    }
    
    // Summary assessment
    if (result.data?.holdings?.length > 0) {
      const accuracy = result.data.accuracy || 0;
      if (accuracy >= 0.99) {
        console.log('\n🎉 SUCCESS: Smart parser achieved 99%+ accuracy!');
      } else if (accuracy >= 0.95) {
        console.log('\n👍 GOOD: Smart parser achieved 95%+ accuracy');
      } else {
        console.log('\n⚠️ NEEDS WORK: Smart parser below 95% accuracy');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSmartParser().catch(console.error);