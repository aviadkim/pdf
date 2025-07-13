#!/usr/bin/env node
/**
 * ENHANCED MESSOS PROCESSOR TEST
 * Tests the new enhanced processor with the real Messos PDF
 * Validates Swiss banking document processing accuracy
 */

import fs from 'fs';
import fetch from 'node-fetch';

// Configuration
const MESSOS_PDF_PATH = './2. Messos  - 31.03.2025.pdf';
const API_ENDPOINT = 'http://localhost:3000/api/enhanced-messos-processor';
const PRODUCTION_ENDPOINT = 'https://pdf-five-nu.vercel.app/api/enhanced-messos-processor';

// Expected values for validation
const EXPECTED_RESULTS = {
  totalValue: 19464431,
  knownSecurities: [
    { isin: 'XS2567543397', expectedValue: 10202418.06, name: 'GS 10Y CALLABLE NOTE' },
    { isin: 'CH0024899483', expectedValue: 18995, name: 'UBS AG REGISTERED' },
    { isin: 'XS2665592833', expectedValue: 1507550, name: 'HARP ISSUER' },
    { isin: 'XS2754416860', expectedValue: 1623825, name: 'LUMINIS' },
    { isin: 'XS2110079584', expectedValue: 1154255, name: 'CITIGROUP GLOBAL' }
  ],
  minimumSecurities: 20,
  tolerancePercent: 5
};

class EnhancedMessosTest {
  constructor() {
    this.results = {
      processingTime: 0,
      accuracy: 0,
      qualityGrade: 'F',
      securitiesFound: 0,
      knownSecuritiesMatched: 0,
      errors: [],
      details: {}
    };
  }

  async runTest() {
    console.log('🚀 ENHANCED MESSOS PROCESSOR TEST');
    console.log('=' * 50);
    console.log(`📄 Testing with: ${MESSOS_PDF_PATH}`);
    console.log(`🎯 Expected Total: $${EXPECTED_RESULTS.totalValue.toLocaleString()}`);
    console.log(`📊 Expected Securities: ${EXPECTED_RESULTS.minimumSecurities}+`);
    console.log('');

    try {
      // Step 1: Load and prepare PDF
      console.log('📥 STEP 1: Loading Messos PDF...');
      const pdfBuffer = await this.loadPDF();
      const pdfBase64 = pdfBuffer.toString('base64');
      console.log(`✅ PDF loaded: ${Math.round(pdfBuffer.length / 1024)}KB`);

      // Step 2: Test Enhanced Processor
      console.log('\n🧠 STEP 2: Testing Enhanced Processor...');
      const testResult = await this.testEnhancedProcessor(pdfBase64);
      
      // Step 3: Validate Results
      console.log('\n✅ STEP 3: Validating Results...');
      const validation = await this.validateResults(testResult);
      
      // Step 4: Performance Analysis
      console.log('\n📊 STEP 4: Performance Analysis...');
      const performance = await this.analyzePerformance(testResult, validation);
      
      // Step 5: Generate Report
      console.log('\n📋 STEP 5: Generating Report...');
      await this.generateReport(testResult, validation, performance);
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      this.results.errors.push(error.message);
      return this.results;
    }
  }

  async loadPDF() {
    try {
      if (!fs.existsSync(MESSOS_PDF_PATH)) {
        throw new Error(`PDF not found: ${MESSOS_PDF_PATH}`);
      }
      
      const stats = fs.statSync(MESSOS_PDF_PATH);
      console.log(`📄 File size: ${Math.round(stats.size / 1024)}KB`);
      
      if (stats.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('PDF file too large (>50MB)');
      }
      
      return fs.readFileSync(MESSOS_PDF_PATH);
      
    } catch (error) {
      throw new Error(`Failed to load PDF: ${error.message}`);
    }
  }

  async testEnhancedProcessor(pdfBase64) {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Calling Enhanced Messos Processor...');
      
      // Try local first, then production
      let response;
      let endpoint = API_ENDPOINT;
      
      try {
        response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfBase64: pdfBase64,
            filename: 'messos-march-2025.pdf'
          }),
          timeout: 60000 // 60 seconds
        });
      } catch (localError) {
        console.log('⚠️ Local endpoint unavailable, trying production...');
        endpoint = PRODUCTION_ENDPOINT;
        response = await fetch(PRODUCTION_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfBase64: pdfBase64,
            filename: 'messos-march-2025.pdf'
          }),
          timeout: 60000
        });
      }

      this.results.processingTime = Date.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      console.log(`✅ Processing completed in ${this.results.processingTime}ms`);
      console.log(`🌐 Endpoint used: ${endpoint}`);
      
      if (!result.success) {
        throw new Error(`Processing failed: ${result.error}`);
      }

      return result;
      
    } catch (error) {
      throw new Error(`Enhanced processor test failed: ${error.message}`);
    }
  }

  async validateResults(testResult) {
    console.log('🔍 Validating extraction results...');
    
    const holdings = testResult.data?.holdings || [];
    const totalValue = testResult.data?.totalValue || 0;
    const accuracy = testResult.data?.accuracy || 0;
    
    console.log(`📊 Securities found: ${holdings.length}`);
    console.log(`💰 Total value: $${totalValue.toLocaleString()}`);
    console.log(`🎯 Accuracy: ${(accuracy * 100).toFixed(2)}%`);

    const validation = {
      securitiesCount: holdings.length,
      totalValue: totalValue,
      accuracy: accuracy,
      knownSecuritiesFound: 0,
      knownSecuritiesCorrect: 0,
      missingSecurities: [],
      incorrectValues: [],
      qualityScore: 0
    };

    // Validate known securities
    console.log('\n🔍 Validating known securities:');
    EXPECTED_RESULTS.knownSecurities.forEach(expected => {
      const found = holdings.find(h => h.isin === expected.isin);
      
      if (found) {
        validation.knownSecuritiesFound++;
        const valueDiff = Math.abs(found.marketValue - expected.expectedValue);
        const tolerance = expected.expectedValue * (EXPECTED_RESULTS.tolerancePercent / 100);
        
        if (valueDiff <= tolerance) {
          validation.knownSecuritiesCorrect++;
          console.log(`✅ ${expected.isin}: $${found.marketValue.toLocaleString()} (expected: $${expected.expectedValue.toLocaleString()})`);
        } else {
          validation.incorrectValues.push({
            isin: expected.isin,
            found: found.marketValue,
            expected: expected.expectedValue,
            difference: valueDiff
          });
          console.log(`❌ ${expected.isin}: $${found.marketValue.toLocaleString()} (expected: $${expected.expectedValue.toLocaleString()}, diff: $${valueDiff.toLocaleString()})`);
        }
      } else {
        validation.missingSecurities.push(expected);
        console.log(`❌ ${expected.isin}: NOT FOUND (expected: $${expected.expectedValue.toLocaleString()})`);
      }
    });

    // Calculate quality score
    validation.qualityScore = this.calculateQualityScore(validation);
    
    console.log(`\n📊 Known securities found: ${validation.knownSecuritiesFound}/${EXPECTED_RESULTS.knownSecurities.length}`);
    console.log(`✅ Known securities correct: ${validation.knownSecuritiesCorrect}/${EXPECTED_RESULTS.knownSecurities.length}`);
    console.log(`🏆 Quality score: ${validation.qualityScore}/100`);

    this.results.accuracy = accuracy;
    this.results.securitiesFound = holdings.length;
    this.results.knownSecuritiesMatched = validation.knownSecuritiesCorrect;
    this.results.qualityGrade = testResult.validation?.qualityGrade || 'F';

    return validation;
  }

  calculateQualityScore(validation) {
    let score = 0;
    
    // Accuracy component (40 points)
    score += validation.accuracy * 40;
    
    // Securities count (20 points)
    const countScore = Math.min(1, validation.securitiesCount / EXPECTED_RESULTS.minimumSecurities);
    score += countScore * 20;
    
    // Known securities accuracy (30 points)
    const knownScore = validation.knownSecuritiesCorrect / EXPECTED_RESULTS.knownSecurities.length;
    score += knownScore * 30;
    
    // Missing securities penalty (10 points)
    const missingPenalty = validation.missingSecurities.length * 2;
    score += Math.max(0, 10 - missingPenalty);
    
    return Math.round(score);
  }

  async analyzePerformance(testResult, validation) {
    console.log('⚡ Analyzing performance metrics...');
    
    const performance = {
      processingTime: this.results.processingTime,
      memoryUsage: testResult.performance?.memoryUsage || {},
      stages: testResult.performance?.stages || {},
      confidenceScore: testResult.performance?.confidenceScore || 0,
      extractionMethods: testResult.debug?.extractionMethods || [],
      corrections: testResult.debug?.corrections || []
    };

    console.log(`⏱️ Total processing time: ${performance.processingTime}ms`);
    console.log(`🧠 Confidence score: ${performance.confidenceScore}%`);
    console.log(`🔧 Corrections applied: ${performance.corrections.length}`);
    console.log(`📊 Extraction methods: ${performance.extractionMethods.join(', ')}`);

    // Performance benchmarks
    const benchmarks = {
      processingTime: performance.processingTime < 30000 ? 'EXCELLENT' : 
                     performance.processingTime < 60000 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
      accuracy: validation.accuracy > 0.95 ? 'EXCELLENT' :
               validation.accuracy > 0.85 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
      completeness: validation.securitiesCount >= EXPECTED_RESULTS.minimumSecurities ? 'EXCELLENT' :
                   validation.securitiesCount >= EXPECTED_RESULTS.minimumSecurities * 0.8 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
    };

    console.log(`\n📈 Performance Benchmarks:`);
    console.log(`   Processing Time: ${benchmarks.processingTime}`);
    console.log(`   Accuracy: ${benchmarks.accuracy}`);
    console.log(`   Completeness: ${benchmarks.completeness}`);

    performance.benchmarks = benchmarks;
    return performance;
  }

  async generateReport(testResult, validation, performance) {
    console.log('📋 Generating comprehensive test report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      testConfiguration: {
        pdfFile: MESSOS_PDF_PATH,
        expectedTotal: EXPECTED_RESULTS.totalValue,
        tolerancePercent: EXPECTED_RESULTS.tolerancePercent
      },
      results: {
        success: testResult.success,
        processingTime: performance.processingTime,
        totalValue: testResult.data?.totalValue || 0,
        accuracy: validation.accuracy,
        qualityGrade: this.results.qualityGrade,
        qualityScore: validation.qualityScore
      },
      securities: {
        found: validation.securitiesCount,
        expected: EXPECTED_RESULTS.minimumSecurities,
        knownSecuritiesMatched: validation.knownSecuritiesCorrect,
        missingSecurities: validation.missingSecurities.length,
        incorrectValues: validation.incorrectValues.length
      },
      performance: {
        benchmarks: performance.benchmarks,
        confidenceScore: performance.confidenceScore,
        corrections: performance.corrections.length,
        extractionMethods: performance.extractionMethods
      },
      validation: {
        knownSecurities: validation.knownSecuritiesFound,
        correctValues: validation.knownSecuritiesCorrect,
        missingISINs: validation.missingSecurities.map(s => s.isin),
        incorrectISINs: validation.incorrectValues.map(s => s.isin)
      },
      recommendations: this.generateRecommendations(validation, performance)
    };

    // Save report
    const reportPath = `./enhanced-messos-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Report saved: ${reportPath}`);
    
    // Print summary
    this.printTestSummary(report);
    
    this.results.details = report;
    return report;
  }

  generateRecommendations(validation, performance) {
    const recommendations = [];
    
    if (validation.accuracy < 0.9) {
      recommendations.push('Improve table recognition algorithm for better value extraction');
    }
    
    if (validation.securitiesCount < EXPECTED_RESULTS.minimumSecurities) {
      recommendations.push('Enhance security detection patterns to capture all holdings');
    }
    
    if (validation.knownSecuritiesCorrect < EXPECTED_RESULTS.knownSecurities.length * 0.8) {
      recommendations.push('Review Swiss number parsing and currency conversion logic');
    }
    
    if (performance.processingTime > 45000) {
      recommendations.push('Optimize processing pipeline for better performance');
    }
    
    if (validation.missingSecurities.length > 2) {
      recommendations.push('Investigate multi-page processing and complex table structures');
    }
    
    return recommendations;
  }

  printTestSummary(report) {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 ENHANCED MESSOS PROCESSOR TEST SUMMARY');
    console.log('═'.repeat(60));
    
    console.log(`🎯 Overall Success: ${report.results.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`⏱️ Processing Time: ${report.results.processingTime}ms`);
    console.log(`💰 Total Value: $${report.results.totalValue.toLocaleString()}`);
    console.log(`🎯 Target Value: $${report.testConfiguration.expectedTotal.toLocaleString()}`);
    console.log(`📊 Accuracy: ${(report.results.accuracy * 100).toFixed(2)}%`);
    console.log(`🏆 Quality Grade: ${report.results.qualityGrade}`);
    console.log(`📈 Quality Score: ${report.results.qualityScore}/100`);
    
    console.log(`\n📋 Securities Analysis:`);
    console.log(`   Found: ${report.securities.found}`);
    console.log(`   Expected: ${report.securities.expected}+`);
    console.log(`   Known Securities Matched: ${report.securities.knownSecuritiesMatched}/${EXPECTED_RESULTS.knownSecurities.length}`);
    console.log(`   Missing Securities: ${report.securities.missingSecurities}`);
    console.log(`   Incorrect Values: ${report.securities.incorrectValues}`);
    
    console.log(`\n⚡ Performance:`);
    console.log(`   Processing: ${performance.benchmarks.processingTime}`);
    console.log(`   Accuracy: ${performance.benchmarks.accuracy}`);
    console.log(`   Completeness: ${performance.benchmarks.completeness}`);
    
    if (report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      report.recommendations.forEach((rec, idx) => {
        console.log(`   ${idx + 1}. ${rec}`);
      });
    }
    
    console.log('\n' + '═'.repeat(60));
    
    // Final verdict
    const overallGrade = this.calculateOverallGrade(report);
    console.log(`🎯 FINAL VERDICT: ${overallGrade.grade} - ${overallGrade.message}`);
    console.log('═'.repeat(60));
  }

  calculateOverallGrade(report) {
    const score = report.results.qualityScore;
    
    if (score >= 90) {
      return { grade: 'A+', message: 'EXCELLENT - Production ready' };
    } else if (score >= 85) {
      return { grade: 'A', message: 'VERY GOOD - Minor improvements needed' };
    } else if (score >= 80) {
      return { grade: 'B+', message: 'GOOD - Some optimization required' };
    } else if (score >= 75) {
      return { grade: 'B', message: 'ACCEPTABLE - Significant improvements needed' };
    } else if (score >= 70) {
      return { grade: 'C+', message: 'NEEDS WORK - Major improvements required' };
    } else {
      return { grade: 'C-', message: 'POOR - Extensive rework needed' };
    }
  }
}

// Run the test
const test = new EnhancedMessosTest();
test.runTest().then(results => {
  const exitCode = results.qualityGrade === 'F' || results.errors.length > 0 ? 1 : 0;
  process.exit(exitCode);
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});