#!/usr/bin/env node

/**
 * Test Express Server Imports
 * Verify all required modules can be imported without errors
 */

console.log('🧪 Testing Express Server Imports...\n');

const tests = [
    {
        name: 'Basic Node Modules',
        test: () => {
            require('express');
            require('cors');
            require('pdf-parse');
            require('multer');
            require('path');
            require('fs').promises;
            console.log('✅ Basic modules imported successfully');
        }
    },
    {
        name: 'Ultra-Accurate Extraction Engine',
        test: () => {
            const { UltraAccurateExtractionEngine } = require('./ultra-accurate-extraction-engine.js');
            const engine = new UltraAccurateExtractionEngine();
            console.log('✅ UltraAccurateExtractionEngine imported and instantiated');
        }
    },
    {
        name: 'Phase2 Enhanced Accuracy Engine',
        test: () => {
            const { Phase2EnhancedAccuracyEngine } = require('./phase2-enhanced-accuracy-engine.js');
            const engine = new Phase2EnhancedAccuracyEngine();
            console.log('✅ Phase2EnhancedAccuracyEngine imported and instantiated');
        }
    },
    {
        name: 'Phase3 Annotation Learning System',
        test: () => {
            const { Phase3AnnotationLearningSystem } = require('./phase3-annotation-learning-integration.js');
            const system = new Phase3AnnotationLearningSystem();
            console.log('✅ Phase3AnnotationLearningSystem imported and instantiated');
        }
    },
    {
        name: 'Mistral OCR Processor',
        test: () => {
            const { MistralOCR } = require('./mistral-ocr-processor.js');
            const ocr = new MistralOCR();
            console.log('✅ MistralOCR imported and instantiated');
        }
    },
    {
        name: 'Smart OCR Learning System',
        test: () => {
            const SmartOCRLearningSystem = require('./smart-ocr-learning-system.js');
            const system = new SmartOCRLearningSystem();
            console.log('✅ SmartOCRLearningSystem imported and instantiated');
        }
    }
];

async function runTests() {
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            console.log(`🔍 Testing: ${test.name}`);
            test.test();
            passed++;
        } catch (error) {
            console.log(`❌ FAILED: ${test.name}`);
            console.log(`   Error: ${error.message}`);
            console.log(`   Stack: ${error.stack.split('\n')[1]?.trim()}`);
            failed++;
        }
        console.log('');
    }
    
    console.log('='.repeat(50));
    console.log('📊 Import Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 All imports working! Server should start successfully.');
    } else {
        console.log('\n⚠️  Import issues detected. This may prevent server startup on Render.');
        console.log('\n💡 Solutions:');
        console.log('1. Check if all required files are committed to git');
        console.log('2. Verify file permissions and paths');
        console.log('3. Check for circular dependencies');
        console.log('4. Ensure proper module.exports syntax');
    }
}

runTests().catch(console.error);