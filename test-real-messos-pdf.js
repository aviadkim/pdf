/**
 * Test UltraAccurate99PercentSystem with Real Messos PDF
 * Test the actual PDF document to verify extraction accuracy
 */

const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const { UltraAccurate99PercentSystem } = require('./ultra-accurate-99-percent-system.js');

async function testRealMessosPDF() {
    console.log('🎯 TESTING ULTRA 99% SYSTEM WITH REAL MESSOS PDF');
    console.log('='.repeat(60));
    
    try {
        // Initialize system
        const ultraAccurateSystem = new UltraAccurate99PercentSystem();
        await ultraAccurateSystem.initialize();
        
        // Read and parse the real Messos PDF
        console.log('📄 Reading real Messos PDF...');
        const pdfPath = 'C:\\Users\\aviad\\OneDrive\\Desktop\\pdf-main\\2. Messos  - 31.03.2025.pdf';
        const pdfBuffer = await fs.readFile(pdfPath);
        const pdfData = await pdfParse(pdfBuffer);
        const pdfText = pdfData.text;
        
        console.log(`✅ PDF parsed: ${Math.round(pdfText.length / 1000)}K characters`);
        
        // Ground truth from the real document
        const realGroundTruth = {
            portfolioTotal: 19464431,
            totalSecurities: 39, // The actual count from the document
            expectedSecurities: [
                // Key securities from the actual document
                { isin: 'XS2993414619', name: 'RBC LONDON 0% NOTES 2025', value: 97700 },
                { isin: 'XS2530201644', name: 'TORONTO DOMINION BANK NOTES', value: 199080 },
                { isin: 'XS2567543397', name: 'GS 10Y CALLABLE NOTE 2024', value: 2570405 },
                { isin: 'XS2665592833', name: 'HARP ISSUER NOTES 2023', value: 1507550 },
                { isin: 'XS2746319610', name: 'SOCIETE GENERALE 32.46% NOTES', value: 192100 },
                { isin: 'CH0244767585', name: 'UBS GROUP INC NAMEN-AKT', value: 24319 },
                { isin: 'XS2252299883', name: 'NOVUS CAPITAL STRUCTURED NOTES', value: 989800 },
                { isin: 'XS2407295554', name: 'NOVUS CAPITAL STRUCT.NOTE 2021', value: 510114 },
                { isin: 'XD0466760473', name: 'EXIGENT ENHANCED INCOME FUND', value: 26129 },
                { isin: 'XS2964611052', name: 'DEUTSCHE BANK 0% NOTES 2025', value: 1480584 }
            ]
        };
        
        // Test extraction
        console.log('🎯 Running Ultra 99% extraction...');
        const startTime = Date.now();
        
        const result = await ultraAccurateSystem.extractWith99PercentAccuracy(
            pdfText, 
            'real_messos_test'
        );
        
        const processingTime = Date.now() - startTime;
        
        // Analyze results
        const analysis = analyzeExtractionResults(result, realGroundTruth);
        
        // Display results
        console.log('\n🎯 REAL MESSOS PDF EXTRACTION RESULTS');
        console.log('='.repeat(60));
        console.log(`✅ Success: ${result.success}`);
        console.log(`📊 Accuracy: ${result.accuracy?.toFixed(2)}%`);
        console.log(`⏱️ Processing Time: ${processingTime}ms`);
        console.log(`🔢 Securities Found: ${result.securities?.length || 0}`);
        console.log(`🎯 Expected Securities: ${realGroundTruth.totalSecurities}`);
        console.log(`💵 Total Value: $${result.totalValue?.toLocaleString()}`);
        console.log(`🎯 Expected Total: $${realGroundTruth.portfolioTotal.toLocaleString()}`);
        console.log(`💰 Cost: $${result.cost?.toFixed(4) || '0.0000'}`);
        
        console.log('\n📈 ACCURACY ANALYSIS:');
        console.log(`   📊 Portfolio Total Accuracy: ${analysis.portfolioAccuracy.toFixed(2)}%`);
        console.log(`   🔢 Security Count Accuracy: ${analysis.countAccuracy.toFixed(2)}%`);
        console.log(`   ✅ Known Securities Found: ${analysis.knownSecuritiesFound}/${realGroundTruth.expectedSecurities.length}`);
        console.log(`   🎯 Known Securities Accuracy: ${analysis.knownSecuritiesAccuracy.toFixed(2)}%`);
        
        // Show some extracted securities
        if (result.securities && result.securities.length > 0) {
            console.log('\n📋 SAMPLE EXTRACTED SECURITIES:');
            result.securities.slice(0, 10).forEach((security, index) => {
                console.log(`   ${index + 1}. ${security.isin} - ${security.name}: $${security.marketValue?.toLocaleString() || security.value?.toLocaleString()}`);
            });
            
            if (result.securities.length > 10) {
                console.log(`   ... and ${result.securities.length - 10} more securities`);
            }
        }
        
        // Compare key securities
        console.log('\n🔍 KEY SECURITIES VERIFICATION:');
        realGroundTruth.expectedSecurities.forEach(expected => {
            const found = result.securities?.find(s => s.isin === expected.isin);
            if (found) {
                const valueAccuracy = Math.min(
                    (found.marketValue || found.value) / expected.value,
                    expected.value / (found.marketValue || found.value)
                ) * 100;
                console.log(`   ✅ ${expected.isin}: ${valueAccuracy.toFixed(1)}% accuracy`);
            } else {
                console.log(`   ❌ ${expected.isin}: NOT FOUND`);
            }
        });
        
        // Assessment
        const assessmentResult = assessSystemPerformance(analysis, result);
        console.log('\n🎯 SYSTEM PERFORMANCE ASSESSMENT:');
        console.log(`   📊 Overall Score: ${assessmentResult.overallScore.toFixed(1)}/100`);
        console.log(`   🏆 99% Target Achieved: ${assessmentResult.ninetyNinePercentAchieved ? 'YES' : 'NO'}`);
        console.log(`   📈 Improvement vs 85% Baseline: +${(result.accuracy - 85).toFixed(1)}%`);
        console.log(`   💡 Status: ${assessmentResult.status}`);
        
        if (assessmentResult.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            assessmentResult.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
        
        // Save detailed results
        await saveTestResults(result, analysis, assessmentResult, processingTime);
        
        return {
            success: true,
            accuracy: result.accuracy,
            securitiesFound: result.securities?.length || 0,
            expectedSecurities: realGroundTruth.totalSecurities,
            processingTime: processingTime,
            assessment: assessmentResult
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Analyze extraction results against ground truth
 */
function analyzeExtractionResults(result, groundTruth) {
    if (!result.success || !result.securities) {
        return {
            portfolioAccuracy: 0,
            countAccuracy: 0,
            knownSecuritiesFound: 0,
            knownSecuritiesAccuracy: 0
        };
    }
    
    // Portfolio total accuracy
    const portfolioAccuracy = Math.min(
        result.totalValue / groundTruth.portfolioTotal,
        groundTruth.portfolioTotal / result.totalValue
    ) * 100;
    
    // Security count accuracy
    const countAccuracy = Math.min(
        result.securities.length / groundTruth.totalSecurities,
        groundTruth.totalSecurities / result.securities.length
    ) * 100;
    
    // Known securities accuracy
    let knownSecuritiesFound = 0;
    let knownSecuritiesScore = 0;
    
    groundTruth.expectedSecurities.forEach(expected => {
        const found = result.securities.find(s => s.isin === expected.isin);
        if (found) {
            knownSecuritiesFound++;
            const valueAccuracy = Math.min(
                (found.marketValue || found.value) / expected.value,
                expected.value / (found.marketValue || found.value)
            ) * 100;
            knownSecuritiesScore += valueAccuracy;
        }
    });
    
    const knownSecuritiesAccuracy = knownSecuritiesFound > 0 
        ? knownSecuritiesScore / knownSecuritiesFound 
        : 0;
    
    return {
        portfolioAccuracy,
        countAccuracy,
        knownSecuritiesFound,
        knownSecuritiesAccuracy
    };
}

/**
 * Assess overall system performance
 */
function assessSystemPerformance(analysis, result) {
    const overallScore = (
        analysis.portfolioAccuracy * 0.4 +
        analysis.countAccuracy * 0.3 +
        analysis.knownSecuritiesAccuracy * 0.3
    );
    
    const ninetyNinePercentAchieved = overallScore >= 99;
    
    let status = 'Needs Improvement';
    let recommendations = [];
    
    if (overallScore >= 99) {
        status = '🎉 EXCELLENT - 99% Target Achieved!';
        recommendations.push('Deploy to production immediately');
        recommendations.push('Monitor performance in production');
    } else if (overallScore >= 95) {
        status = '👍 VERY GOOD - Close to 99% target';
        recommendations.push('Minor fine-tuning needed');
        recommendations.push('Enable OpenAI API for final boost');
    } else if (overallScore >= 90) {
        status = '⚠️ GOOD - Significant improvement needed';
        recommendations.push('Review Swiss number parsing');
        recommendations.push('Improve security extraction patterns');
        recommendations.push('Enable AI enhancement');
    } else {
        status = '❌ POOR - Major improvements required';
        recommendations.push('Complete system review needed');
        recommendations.push('Check PDF parsing accuracy');
        recommendations.push('Verify extraction algorithms');
    }
    
    return {
        overallScore,
        ninetyNinePercentAchieved,
        status,
        recommendations
    };
}

/**
 * Save test results to file
 */
async function saveTestResults(result, analysis, assessment, processingTime) {
    try {
        const testReport = {
            timestamp: new Date().toISOString(),
            test: 'Real Messos PDF - Ultra 99% System Test',
            processingTime: processingTime,
            result: result,
            analysis: analysis,
            assessment: assessment,
            expectedSecurities: 39,
            extractedSecurities: result.securities?.length || 0,
            accuracy: result.accuracy,
            overallScore: assessment.overallScore
        };
        
        await fs.writeFile(
            'real-messos-test-results.json',
            JSON.stringify(testReport, null, 2)
        );
        
        console.log('\n📄 Detailed results saved: real-messos-test-results.json');
        
    } catch (error) {
        console.error('⚠️ Failed to save results:', error.message);
    }
}

// Run the test
if (require.main === module) {
    testRealMessosPDF().then(result => {
        if (result.success) {
            if (result.assessment.ninetyNinePercentAchieved) {
                console.log('\n🎉 SUCCESS: 99% accuracy achieved with real PDF!');
                process.exit(0);
            } else {
                console.log(`\n⚠️ PARTIAL SUCCESS: ${result.accuracy?.toFixed(2)}% accuracy achieved`);
                console.log(`📈 Gap to 99%: ${(99 - (result.accuracy || 0)).toFixed(2)}%`);
                process.exit(0);
            }
        } else {
            console.log('\n❌ TEST FAILED');
            process.exit(1);
        }
    });
}

module.exports = { testRealMessosPDF };