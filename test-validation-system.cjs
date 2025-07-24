// Test the comprehensive validation system
const fs = require('fs');
const path = require('path');

async function testValidationSystem() {
  console.log('🧪 Testing Comprehensive Validation System');
  
  try {
    // Load the real Messos PDF
    const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log(`📄 PDF loaded: ${pdfBuffer.length} bytes`);
    
    // Test the intelligent processor
    console.log('\n🧠 Testing INTELLIGENT PROCESSOR with VALIDATION:');
    const response = await fetch('https://pdf-five-nu.vercel.app/api/intelligent-messos-processor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: '2. Messos  - 31.03.2025.pdf'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      console.log('\n✅ INTELLIGENT PROCESSOR WITH VALIDATION RESULTS:');
      console.log(`📊 Holdings Found: ${result.data?.holdings?.length || 0}`);
      console.log(`💰 Total Value: $${(result.data?.portfolioInfo?.totalValue || 0).toLocaleString()}`);
      console.log(`⏱️ Processing Time: ${result.metadata?.processingTime}`);
      console.log(`🎓 Data Quality Grade: ${result.validation?.dataQualityGrade}`);
      console.log(`🎯 Overall Confidence: ${((result.validation?.overallConfidence || 0) * 100).toFixed(1)}%`);
      console.log(`👨‍💼 Human Review Required: ${result.validation?.humanReviewRequired ? 'Yes' : 'No'}`);
      
      // Validation breakdown
      console.log('\n🏦 Swiss Banking Validation:');
      console.log(`  Grade: ${result.validation?.swissBankingValidation?.grade}`);
      console.log(`  Confidence: ${((result.validation?.swissBankingValidation?.confidence || 0) * 100).toFixed(1)}%`);
      console.log(`  Checks: ${result.validation?.swissBankingValidation?.checksPerformed}`);
      console.log(`  Critical Issues: ${result.validation?.swissBankingValidation?.criticalIssues}`);
      console.log(`  Warnings: ${result.validation?.swissBankingValidation?.warnings}`);
      console.log(`  Corrections: ${result.validation?.swissBankingValidation?.corrections}`);
      
      console.log('\n⚖️ Cross-Validation:');
      console.log(`  Data Quality: ${result.validation?.crossValidation?.dataQuality}`);
      console.log(`  Confidence: ${((result.validation?.crossValidation?.confidence || 0) * 100).toFixed(1)}%`);
      console.log(`  Checks: ${result.validation?.crossValidation?.totalChecks}/${result.validation?.crossValidation?.passedChecks} passed`);
      console.log(`  Critical Issues: ${result.validation?.crossValidation?.criticalIssues}`);
      console.log(`  Warnings: ${result.validation?.crossValidation?.warnings}`);
      console.log(`  Corrections: ${result.validation?.crossValidation?.corrections}`);
      
      // Show issues and corrections
      if (result.validation?.allIssues?.length > 0) {
        console.log('\n🚨 Critical Issues Found:');
        result.validation.allIssues.slice(0, 5).forEach((issue, i) => {
          console.log(`  ${i+1}. ${issue.description}`);
          console.log(`     Expected: ${issue.expected}, Found: ${issue.actual}`);
        });
      }
      
      if (result.validation?.allWarnings?.length > 0) {
        console.log('\n⚠️ Warnings:');
        result.validation.allWarnings.slice(0, 5).forEach((warning, i) => {
          console.log(`  ${i+1}. ${warning.description}`);
        });
      }
      
      if (result.validation?.allCorrections?.length > 0) {
        console.log('\n🔧 Corrections Applied:');
        result.validation.allCorrections.slice(0, 5).forEach((correction, i) => {
          console.log(`  ${i+1}. ${correction.description}`);
          console.log(`     ${correction.oldValue} -> ${correction.newValue}`);
        });
      }
      
      // Quality assurance metrics
      if (result.metadata?.qualityAssurance) {
        console.log('\n📈 Quality Assurance:');
        console.log(`  Data Integrity Score: ${(result.metadata.qualityAssurance.dataIntegrityScore * 100).toFixed(1)}%`);
        console.log(`  Extraction Accuracy: ${(result.metadata.qualityAssurance.extractionAccuracy * 100).toFixed(1)}%`);
        if (result.metadata.qualityAssurance.recommendedActions?.length > 0) {
          console.log(`  Recommended Actions:`);
          result.metadata.qualityAssurance.recommendedActions.forEach((action, i) => {
            console.log(`    ${i+1}. ${action}`);
          });
        }
      }
      
      // Check if the $99M vs $46M issue is resolved
      const totalValue = result.data?.portfolioInfo?.totalValue || 0;
      
      console.log('\n🎯 VALUE VALIDATION CHECK:');
      if (totalValue > 90000000) {
        console.log('❌ ISSUE STILL EXISTS: Total value > $90M (likely nominal values)');
        console.log(`   Current: $${totalValue.toLocaleString()}`);
        console.log(`   Expected: ~$40-60M (market values)`);
      } else if (totalValue > 40000000 && totalValue < 60000000) {
        console.log('✅ VALUE ISSUE RESOLVED: Total in expected range');
        console.log(`   Current: $${totalValue.toLocaleString()}`);
        console.log(`   Range: $40-60M ✅`);
      } else {
        console.log('⚠️ VALUE NEEDS REVIEW: Outside expected range');
        console.log(`   Current: $${totalValue.toLocaleString()}`);
        console.log(`   Expected: ~$40-60M`);
      }
      
      // Show sample validated holdings
      if (result.data?.holdings?.length > 0) {
        console.log('\n📋 Sample Validated Holdings:');
        for (let i = 0; i < Math.min(3, result.data.holdings.length); i++) {
          const holding = result.data.holdings[i];
          console.log(`  ${i+1}. ${holding.securityName?.substring(0, 50)}...`);
          console.log(`     ISIN: ${holding.isin}, Value: $${holding.currentValue?.toLocaleString()}`);
          console.log(`     Source: ${holding.source}`);
          if (holding.validationFlags?.length > 0) {
            console.log(`     Flags: ${holding.validationFlags.join(', ')}`);
          }
        }
      }
      
      // Save detailed validation results
      fs.writeFileSync('validation-system-results.json', JSON.stringify(result, null, 2));
      console.log('\n💾 Results saved to validation-system-results.json');
      
      return {
        success: true,
        grade: result.validation?.dataQualityGrade,
        confidence: result.validation?.overallConfidence,
        totalValue: totalValue,
        valueIssueResolved: totalValue > 40000000 && totalValue < 60000000,
        holdingsCount: result.data?.holdings?.length || 0,
        humanReviewRequired: result.validation?.humanReviewRequired
      };
      
    } else {
      console.log(`❌ Intelligent processor failed: ${response.status}`);
      const errorText = await response.text();
      console.log('Error:', errorText.substring(0, 500));
      
      return {
        success: false,
        error: 'API call failed',
        status: response.status
      };
    }
    
  } catch (error) {
    console.error('❌ Validation test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test individual validators (simulate)
async function testIndividualValidators() {
  console.log('\n🧪 Testing Individual Validators (Simulated)');
  
  // Simulate problematic data like the FinanceAI example
  const testData = {
    data: {
      holdings: [
        {
          position: 1,
          securityName: "APPLE INC COMMON STOCK",
          isin: "US0378331005",
          currentValue: 7350000,  // Correct market value
          nominalQuantity: 100000000,  // ❌ Wrong: OCR error (should be 49,000)
          currentPrice: 150.00,
          currency: "USD",
          category: "Securities"
        },
        {
          position: 2,
          securityName: "MICROSOFT CORPORATION",
          isin: "US5949181045", 
          currentValue: 5200000,
          nominalQuantity: 200000,  // This one is correct
          currentPrice: 260.00,
          currency: "USD",
          category: "Securities"
        }
      ],
      portfolioInfo: {
        totalValue: 12550000,
        currency: "USD",
        clientName: "TEST CLIENT"
      }
    }
  };
  
  console.log('📊 Test Data:');
  console.log(`  AAPL: 100,000,000 shares × $150 = $15B (but market value shows $7.35M)`);
  console.log(`  Expected correction: $7.35M ÷ $150 = 49,000 shares`);
  
  // Simulate Swiss Banking Validator
  console.log('\n🏦 Swiss Banking Validator (Simulated):');
  
  // Check for value inconsistencies
  const aaplHolding = testData.data.holdings[0];
  const calculatedValue = aaplHolding.nominalQuantity * aaplHolding.currentPrice;
  const reportedValue = aaplHolding.currentValue;
  
  if (Math.abs(calculatedValue - reportedValue) > reportedValue * 0.01) {
    console.log('🚨 CRITICAL ISSUE DETECTED:');
    console.log(`   Calculated: ${aaplHolding.nominalQuantity.toLocaleString()} × $${aaplHolding.currentPrice} = $${calculatedValue.toLocaleString()}`);
    console.log(`   Reported: $${reportedValue.toLocaleString()}`);
    
    // Auto-correction
    const correctedQuantity = Math.round(reportedValue / aaplHolding.currentPrice);
    console.log('🔧 AUTO-CORRECTION APPLIED:');
    console.log(`   Corrected quantity: $${reportedValue.toLocaleString()} ÷ $${aaplHolding.currentPrice} = ${correctedQuantity.toLocaleString()} shares`);
    console.log(`   Original: 100,000,000 shares -> Corrected: ${correctedQuantity.toLocaleString()} shares ✅`);
  }
  
  console.log('\n⚖️ Cross-Validator (Simulated):');
  
  // Check portfolio total
  const calculatedTotal = testData.data.holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const reportedTotal = testData.data.portfolioInfo.totalValue;
  
  if (Math.abs(calculatedTotal - reportedTotal) < reportedTotal * 0.01) {
    console.log('✅ Portfolio total validation passed');
    console.log(`   Sum of holdings: $${calculatedTotal.toLocaleString()}`);
    console.log(`   Reported total: $${reportedTotal.toLocaleString()}`);
  }
  
  console.log('\n📊 Validation Summary (Simulated):');
  console.log('   Overall Grade: A');
  console.log('   Confidence: 95%');
  console.log('   Critical Issues: 1 (auto-corrected)');
  console.log('   Human Review: Not Required');
  console.log('   Data Quality: Excellent (after corrections)');
}

// Run all tests
async function runAllValidationTests() {
  console.log('🚀 COMPREHENSIVE VALIDATION SYSTEM TEST');
  console.log('=' * 50);
  
  // Test individual validators first
  await testIndividualValidators();
  
  // Test the full system
  const result = await testValidationSystem();
  
  console.log('\n🎯 FINAL VALIDATION TEST RESULT:');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log('\n✅ VALIDATION SYSTEM STATUS:');
    console.log(`   Grade: ${result.grade}`);
    console.log(`   Confidence: ${((result.confidence || 0) * 100).toFixed(1)}%`);
    console.log(`   Value Issue Resolved: ${result.valueIssueResolved ? 'Yes' : 'No'}`);
    console.log(`   Holdings Extracted: ${result.holdingsCount}`);
    console.log(`   Human Review: ${result.humanReviewRequired ? 'Required' : 'Not Required'}`);
    
    if (result.valueIssueResolved) {
      console.log('\n🎉 SUCCESS: $99M vs $46M issue RESOLVED!');
    } else {
      console.log('\n❌ ISSUE: Value correction still needed');
    }
  } else {
    console.log('\n❌ VALIDATION SYSTEM NEEDS MORE WORK');
  }
}

// Run the tests
runAllValidationTests().catch(console.error);