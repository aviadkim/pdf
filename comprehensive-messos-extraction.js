// 🎯 Comprehensive Messos PDF Extraction Analysis
import fetch from 'node-fetch';
import fs from 'fs';

async function comprehensiveMessosExtraction() {
  console.log('🎯 COMPREHENSIVE MESSOS PDF EXTRACTION');
  console.log('=====================================');
  
  const PDF_PATH = '/mnt/c/Users/aviad/OneDrive/Desktop/pdf-main/2. Messos  - 31.03.2025.pdf';
  const TARGET_VALUE = 19464431;
  const EXPECTED_SECURITIES = [
    { isin: 'XS2567543397', expectedValue: 10202418.06, name: 'GS 10Y CALLABLE NOTE 2024-18.06.2034' },
    { isin: 'XS2665592833', expectedValue: 1507550, name: 'HARP ISSUER PLC 23-28 6.375%' },
    { isin: 'CH0024899483', expectedValue: 18995, name: 'UBS AG REGISTERED SHARES' }
  ];
  
  try {
    // Load PDF
    console.log(`📄 Loading Messos PDF: ${PDF_PATH}`);
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    const pdfBase64 = pdfBuffer.toString('base64');
    console.log(`📊 PDF Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
    console.log(`🎯 Target Total: $${TARGET_VALUE.toLocaleString()}`);
    console.log(`📋 Expected Key Securities: ${EXPECTED_SECURITIES.length}`);
    console.log('');
    
    // Test both processors for comparison
    const processors = [
      { name: 'Two-Stage Processor', url: 'http://localhost:3001/api/two-stage-processor' },
      { name: 'Bulletproof Processor', url: 'http://localhost:3001/api/bulletproof-processor' }
    ];
    
    const results = [];
    
    for (const processor of processors) {
      console.log(`🔧 Testing: ${processor.name}`);
      console.log('='.repeat(80));
      
      const startTime = Date.now();
      
      try {
        const response = await fetch(processor.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pdfBase64: pdfBase64,
            filename: '2. Messos - 31.03.2025.pdf'
          })
        });
        
        const responseTime = Date.now() - startTime;
        const result = await response.json();
        
        if (response.ok && result.success) {
          const analysis = analyzeExtractionResults(result, TARGET_VALUE, EXPECTED_SECURITIES);
          
          console.log(`✅ Status: SUCCESS (${responseTime}ms)`);
          console.log(`📊 Securities Found: ${analysis.securitiesFound}`);
          console.log(`💰 Total Value: $${analysis.totalValue.toLocaleString()}`);
          console.log(`📈 Accuracy: ${analysis.accuracyPercent}%`);
          console.log(`🎯 Key Securities Found: ${analysis.keySecuritiesFound}/${EXPECTED_SECURITIES.length}`);
          
          results.push({
            processor: processor.name,
            responseTime: responseTime,
            analysis: analysis,
            rawResult: result
          });
          
          // Show detailed breakdown
          console.log('\n📋 SECURITIES BREAKDOWN:');
          analysis.securitiesByValue.slice(0, 15).forEach((security, idx) => {
            const status = analysis.keySecurities.find(k => k.isin === security.isin) ? '🎯' : '  ';
            const accuracy = analysis.keySecurities.find(k => k.isin === security.isin)?.accuracy || '';
            console.log(`${status}${(idx + 1).toString().padStart(2)}. ${security.name.substring(0, 35).padEnd(35)} ${security.isin} $${security.value.toLocaleString().padStart(12)} ${accuracy}`);
          });
          
          if (analysis.missedSecurities.length > 0) {
            console.log('\n❌ MISSED KEY SECURITIES:');
            analysis.missedSecurities.forEach(missed => {
              console.log(`   • ${missed.isin} - ${missed.name} ($${missed.expectedValue.toLocaleString()})`);
            });
          }
          
        } else {
          console.log(`❌ Status: FAILED (${responseTime}ms)`);
          console.log(`Error: ${result.error || 'Unknown error'}`);
        }
        
      } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
      }
      
      console.log('\n');
    }
    
    // COMPREHENSIVE COMPARISON
    console.log('📊 COMPREHENSIVE COMPARISON ANALYSIS');
    console.log('='.repeat(80));
    
    if (results.length >= 2) {
      const twoStage = results.find(r => r.processor.includes('Two-Stage'));
      const bulletproof = results.find(r => r.processor.includes('Bulletproof'));
      
      if (twoStage && bulletproof) {
        console.log('🔍 HEAD-TO-HEAD COMPARISON:');
        console.log('');
        
        console.log('METRIC                    TWO-STAGE        BULLETPROOF      WINNER');
        console.log('-'.repeat(70));
        
        const metrics = [
          ['Securities Found', twoStage.analysis.securitiesFound, bulletproof.analysis.securitiesFound],
          ['Total Value', `$${twoStage.analysis.totalValue.toLocaleString()}`, `$${bulletproof.analysis.totalValue.toLocaleString()}`],
          ['Accuracy %', `${twoStage.analysis.accuracyPercent}%`, `${bulletproof.analysis.accuracyPercent}%`],
          ['Key Securities', `${twoStage.analysis.keySecuritiesFound}/3`, `${bulletproof.analysis.keySecuritiesFound}/3`],
          ['Processing Time', `${twoStage.responseTime}ms`, `${bulletproof.responseTime}ms`],
          ['Success Rate', twoStage.analysis.success ? 'PASS' : 'FAIL', bulletproof.analysis.success ? 'PASS' : 'FAIL']
        ];
        
        metrics.forEach(([metric, twoStageVal, bulletproofVal]) => {
          let winner = 'TIE';
          
          if (metric === 'Securities Found') {
            winner = parseInt(twoStageVal) > parseInt(bulletproofVal) ? 'TWO-STAGE' : 'BULLETPROOF';
          } else if (metric === 'Accuracy %') {
            const twoStageNum = parseFloat(twoStageVal);
            const bulletproofNum = parseFloat(bulletproofVal);
            winner = twoStageNum > bulletproofNum ? 'TWO-STAGE' : 'BULLETPROOF';
          } else if (metric === 'Processing Time') {
            const twoStageTime = parseInt(twoStageVal);
            const bulletproofTime = parseInt(bulletproofVal);
            winner = twoStageTime < bulletproofTime ? 'TWO-STAGE' : 'BULLETPROOF';
          }
          
          console.log(`${metric.padEnd(25)} ${twoStageVal.toString().padEnd(16)} ${bulletproofVal.toString().padEnd(16)} ${winner}`);
        });
        
        console.log('');
        
        // Overall assessment
        const twoStageScore = calculateOverallScore(twoStage.analysis);
        const bulletproofScore = calculateOverallScore(bulletproof.analysis);
        
        console.log('🏆 OVERALL ASSESSMENT:');
        console.log(`Two-Stage Score: ${twoStageScore}/100`);
        console.log(`Bulletproof Score: ${bulletproofScore}/100`);
        console.log(`Winner: ${twoStageScore > bulletproofScore ? 'TWO-STAGE PROCESSOR' : 'BULLETPROOF PROCESSOR'}`);
      }
    }
    
    // DETAILED DATA ANALYSIS
    if (results.length > 0) {
      const bestResult = results.reduce((best, current) => 
        current.analysis.securitiesFound > best.analysis.securitiesFound ? current : best
      );
      
      console.log('\n🔬 DETAILED DATA ANALYSIS (Best Result)');
      console.log('='.repeat(80));
      console.log(`Processor: ${bestResult.processor}`);
      console.log(`Securities Extracted: ${bestResult.analysis.securitiesFound}`);
      console.log('');
      
      // Show all securities with detailed info
      console.log('📋 ALL EXTRACTED SECURITIES:');
      console.log('Pos  ISIN           Security Name                    Value         Status');
      console.log('-'.repeat(80));
      
      bestResult.analysis.securitiesByValue.forEach((security, idx) => {
        const keyMatch = EXPECTED_SECURITIES.find(e => e.isin === security.isin);
        const status = keyMatch ? `✅ Expected` : '📄 Additional';
        
        console.log(`${(idx + 1).toString().padStart(3)}  ${security.isin.padEnd(14)} ${security.name.substring(0, 30).padEnd(30)} $${security.value.toLocaleString().padStart(10)} ${status}`);
      });
      
      // Summary statistics
      console.log('\n📊 EXTRACTION STATISTICS:');
      const stats = calculateExtractionStats(bestResult.analysis);
      Object.entries(stats).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Comprehensive extraction failed:', error);
  }
}

// 📊 Analyze extraction results
function analyzeExtractionResults(result, targetValue, expectedSecurities) {
  const holdings = result.data?.holdings || [];
  const totalValue = holdings.reduce((sum, h) => sum + (h.totalValue || h.marketValue || 0), 0);
  const accuracy = Math.min(totalValue, targetValue) / Math.max(totalValue, targetValue);
  
  // Check which key securities were found
  const foundSecurities = [];
  const missedSecurities = [];
  
  expectedSecurities.forEach(expected => {
    const found = holdings.find(h => h.isin === expected.isin);
    if (found) {
      const valueAccuracy = Math.min(found.totalValue || found.marketValue || 0, expected.expectedValue) / 
                           Math.max(found.totalValue || found.marketValue || 0, expected.expectedValue);
      foundSecurities.push({
        ...expected,
        found: found,
        accuracy: `${(valueAccuracy * 100).toFixed(1)}%`
      });
    } else {
      missedSecurities.push(expected);
    }
  });
  
  return {
    securitiesFound: holdings.length,
    totalValue: totalValue,
    targetValue: targetValue,
    accuracy: accuracy,
    accuracyPercent: (accuracy * 100).toFixed(2),
    success: accuracy >= 0.99,
    keySecuritiesFound: foundSecurities.length,
    keySecurities: foundSecurities,
    missedSecurities: missedSecurities,
    securitiesByValue: holdings
      .map(h => ({
        isin: h.isin,
        name: h.securityName || h.name || 'Unknown',
        value: h.totalValue || h.marketValue || 0
      }))
      .sort((a, b) => b.value - a.value)
  };
}

// 📊 Calculate overall score
function calculateOverallScore(analysis) {
  let score = 0;
  
  // Securities found (40 points)
  score += Math.min(40, (analysis.securitiesFound / 25) * 40);
  
  // Accuracy (30 points)
  score += analysis.accuracy * 30;
  
  // Key securities found (20 points)
  score += (analysis.keySecuritiesFound / 3) * 20;
  
  // Success criteria (10 points)
  score += analysis.success ? 10 : 0;
  
  return Math.round(score);
}

// 📊 Calculate extraction statistics
function calculateExtractionStats(analysis) {
  return {
    'Total Securities': analysis.securitiesFound,
    'Target Achievement': `${analysis.accuracyPercent}%`,
    'Key Securities Found': `${analysis.keySecuritiesFound}/3`,
    'Largest Position': `$${analysis.securitiesByValue[0]?.value.toLocaleString() || '0'}`,
    'Smallest Position': `$${analysis.securitiesByValue[analysis.securitiesByValue.length - 1]?.value.toLocaleString() || '0'}`,
    'Average Position Size': `$${Math.round(analysis.totalValue / analysis.securitiesFound).toLocaleString()}`,
    'Success Status': analysis.success ? '✅ Target Met' : '⚠️ Target Not Met'
  };
}

// Stub implementations for missing methods
async function patternBasedExtraction(pdfBuffer) {
  return { holdings: [], confidence: 0, method: 'pattern-based-extraction' };
}

async function azureDocumentIntelligence(pdfBuffer) {
  return { holdings: [], confidence: 0, method: 'azure-document-intelligence' };
}

async function hybridReconstruction(pdfBuffer) {
  return { holdings: [], confidence: 0, method: 'hybrid-reconstruction' };
}

// Run the comprehensive analysis
comprehensiveMessosExtraction().catch(console.error);