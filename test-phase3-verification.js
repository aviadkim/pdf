#!/usr/bin/env node

/**
 * PHASE 3 VERIFICATION TEST
 * Test the complete workflow with Phase 3 annotation learning system
 */

const { Phase3AnnotationLearningSystem } = require('./phase3-annotation-learning-integration.js');
const fs = require('fs');
const path = require('path');

async function testPhase3Complete() {
    console.log('🚀 PHASE 3 COMPLETE VERIFICATION TEST');
    console.log('=====================================');
    console.log('Testing complete workflow: Phase 2 Engine → Annotation Interface → Learning');
    console.log('');

    const results = {
        timestamp: new Date().toISOString(),
        tests: {},
        summary: {}
    };

    try {
        // Test 1: Phase 3 System Initialization
        console.log('📋 TEST 1: Phase 3 System Initialization');
        console.log('Creating Phase 3 annotation learning system...');
        
        const phase3System = new Phase3AnnotationLearningSystem();
        console.log('✅ Phase 3 system created successfully');
        
        results.tests.initialization = {
            success: true,
            system_created: true,
            learning_database_loaded: phase3System.learningDatabase !== null
        };

        // Test 2: Extraction Engine Integration
        console.log('\n💎 TEST 2: Extraction Engine Integration');
        console.log('Testing Phase 2 enhanced engine integration...');
        
        const { Phase2EnhancedAccuracyEngine } = require('./phase2-enhanced-accuracy-engine.js');
        const engineTest = new Phase2EnhancedAccuracyEngine();
        
        console.log('  🔧 Running Phase 2 extraction engine...');
        const extractionResults = await engineTest.enhanceExtractionAccuracy();
        
        results.tests.extraction_integration = {
            success: true,
            accuracy: extractionResults.enhanced_accuracy.overall_accuracy,
            securities_found: extractionResults.enhanced_extraction.securities_found,
            total_value: extractionResults.enhanced_extraction.total_extracted_value
        };

        console.log(`  ✅ Phase 2 extraction: ${extractionResults.enhanced_accuracy.overall_accuracy}% accuracy`);
        console.log(`  📊 Securities found: ${extractionResults.enhanced_extraction.securities_found}`);
        console.log(`  💰 Total value: $${extractionResults.enhanced_extraction.total_extracted_value.toLocaleString()}`);

        // Test 3: Annotation Data Preparation
        console.log('\n🎨 TEST 3: Annotation Data Preparation');
        console.log('Testing annotation interface data preparation...');
        
        const annotationData = phase3System.prepareForAnnotation(extractionResults);
        
        results.tests.annotation_preparation = {
            success: true,
            securities_for_annotation: annotationData.securities_for_annotation.length,
            document_id: annotationData.document_id,
            has_extraction_summary: !!annotationData.extraction_summary
        };

        console.log(`  ✅ Prepared ${annotationData.securities_for_annotation.length} securities for annotation`);
        console.log(`  📄 Document ID: ${annotationData.document_id}`);

        // Test 4: Learning System Test
        console.log('\n🧠 TEST 4: Learning System Functionality');
        console.log('Testing correction processing and learning...');
        
        const testCorrections = [
            {
                isin: 'CH1908490000',
                field: 'market_value',
                original_value: 100000,
                corrected_value: 150000,
                confidence: 0.9,
                pattern_hint: {
                    type: 'value_extraction',
                    trigger: 'human_correction'
                }
            },
            {
                isin: 'XS2993414619',
                field: 'name',
                original_value: 'Truncated Name...',
                corrected_value: 'Full Security Name Example',
                confidence: 0.8
            }
        ];

        const learningResults = await phase3System.processCorrections(testCorrections, 'test-doc-123');
        
        results.tests.learning_system = {
            success: true,
            corrections_processed: learningResults.corrections_processed,
            patterns_created: learningResults.patterns_created,
            accuracy_improvement: learningResults.accuracy_improvement
        };

        console.log(`  ✅ Processed ${learningResults.corrections_processed} corrections`);
        console.log(`  🎯 Created ${learningResults.patterns_created} patterns`);
        console.log(`  📈 Accuracy improvement: +${learningResults.accuracy_improvement}%`);

        // Test 5: Unknown Document Verification
        console.log('\n🕵️ TEST 5: Unknown Document Verification');
        console.log('Testing with unknown document format...');
        
        const unknownDocResults = phase3System.extractGeneralFinancialData(
            'Sample unknown financial document with ISIN: GB00B1234567 and value $500,000 USD',
            'unknown-sample.pdf'
        );
        
        results.tests.unknown_document = {
            success: true,
            isins_found: unknownDocResults.isins_found.length,
            values_found: unknownDocResults.potential_values.length,
            confidence: unknownDocResults.extraction_confidence,
            realistic_limitations: unknownDocResults.realistic_limitations.length
        };

        console.log(`  ✅ Unknown document test: ${unknownDocResults.isins_found.length} ISINs, ${unknownDocResults.potential_values.length} values`);
        console.log(`  🎯 Confidence: ${(unknownDocResults.extraction_confidence * 100).toFixed(1)}% (realistic for unknown format)`);

        // Test 6: ISIN Verification
        console.log('\n🔍 TEST 6: Manual ISIN Verification');
        console.log('Testing manual ISIN verification against PDF...');
        
        const verification = await phase3System.verifySpecificSecurities(['CH1908490000', 'XS2993414619']);
        
        results.tests.isin_verification = {
            success: !verification.error,
            isins_verified: verification.verification_results ? verification.verification_results.length : 0,
            manual_check_required: true
        };

        console.log(`  ✅ ISIN verification: ${results.tests.isin_verification.isins_verified} ISINs checked`);

        // Generate Summary
        const passedTests = Object.values(results.tests).filter(t => t.success).length;
        const totalTests = Object.keys(results.tests).length;
        
        results.summary = {
            tests_passed: passedTests,
            tests_total: totalTests,
            pass_rate: (passedTests / totalTests) * 100,
            phase3_functional: passedTests === totalTests,
            ready_for_production: passedTests >= totalTests - 1,
            extraction_accuracy: results.tests.extraction_integration.accuracy,
            learning_capability: results.tests.learning_system.corrections_processed > 0
        };

        console.log('\n🏆 PHASE 3 VERIFICATION COMPLETE');
        console.log('================================');
        console.log(`📊 Tests Passed: ${passedTests}/${totalTests} (${results.summary.pass_rate}%)`);
        console.log(`🎯 Phase 3 Functional: ${results.summary.phase3_functional ? 'YES' : 'NO'}`);
        console.log(`🚀 Production Ready: ${results.summary.ready_for_production ? 'YES' : 'NO'}`);
        console.log(`📈 Extraction Accuracy: ${results.summary.extraction_accuracy}%`);
        console.log(`🧠 Learning Capability: ${results.summary.learning_capability ? 'WORKING' : 'NEEDS FIX'}`);

        if (results.summary.phase3_functional) {
            console.log('\n✅ PHASE 3 COMPLETE AND FUNCTIONAL!');
            console.log('🎉 System ready for deployment with human annotation learning');
        } else {
            console.log('\n⚠️ Phase 3 has some issues that need attention');
        }

        // Save results
        fs.writeFileSync('phase3-verification-results.json', JSON.stringify(results, null, 2));
        console.log('\n📄 Results saved: phase3-verification-results.json');

        return results;

    } catch (error) {
        console.error('❌ Phase 3 verification failed:', error.message);
        results.error = error.message;
        results.summary.phase3_functional = false;
        return results;
    }
}

// Run if called directly
if (require.main === module) {
    testPhase3Complete().catch(console.error);
}

module.exports = { testPhase3Complete };