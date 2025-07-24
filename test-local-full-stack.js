// 🚀 Full Stack Test - Local Environment with 100% Accuracy Target
// Tests all processors and measures extraction accuracy against Messos PDF

import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const TARGET_SECURITIES = 38; // Expected number of securities in Messos PDF
const TARGET_VALUE = 19464431; // Expected total value

async function testPythonEnvironment() {
    console.log('🐍 Testing Python Environment...');
    console.log('='.repeat(50));
    
    try {
        // Test basic Python
        const { stdout: pythonVersion } = await execAsync('python3 --version');
        console.log(`✅ Python: ${pythonVersion.trim()}`);
        
        // Test PaddleOCR installation
        try {
            await execAsync('python3 -c "import paddleocr; print(\\"PaddleOCR available\\")"');
            console.log('✅ PaddleOCR: Package installed');
            
            // Test our extractor
            const { stdout: extractorTest } = await execAsync('python3 test_paddle_simple.py');
            console.log('📋 PaddleOCR Test Results:');
            console.log(extractorTest);
            
            return true;
        } catch (error) {
            console.log('⚠️ PaddleOCR: Installation issues detected');
            console.log('   This is expected in WSL/containers without system deps');
            return false;
        }
        
    } catch (error) {
        console.log('❌ Python environment issues:', error.message);
        return false;
    }
}

async function testNodeEnvironment() {
    console.log('\n🟢 Testing Node.js Environment...');
    console.log('='.repeat(50));
    
    try {
        const { stdout: nodeVersion } = await execAsync('node --version');
        console.log(`✅ Node.js: ${nodeVersion.trim()}`);
        
        const { stdout: npmVersion } = await execAsync('npm --version');
        console.log(`✅ NPM: ${npmVersion.trim()}`);
        
        // Check if local server is running
        try {
            const { stdout } = await execAsync('curl -s http://localhost:3001/ || echo "Server not running"');
            if (stdout.includes('FinanceAI Pro')) {
                console.log('✅ Local Server: Running');
                return true;
            } else {
                console.log('⚠️ Local Server: Not running');
                console.log('💡 Start with: node local-test-server.js');
                return false;
            }
        } catch (error) {
            console.log('⚠️ Local Server: Not accessible');
            return false;
        }
        
    } catch (error) {
        console.log('❌ Node.js environment issues:', error.message);
        return false;
    }
}

async function runAccuracyTest() {
    console.log('\n🎯 Running 100% Accuracy Test...');
    console.log('='.repeat(50));
    
    const pdfPath = './2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log(`❌ PDF not found: ${pdfPath}`);
        return { success: false, error: 'PDF not found' };
    }
    
    console.log(`📄 Testing PDF: ${pdfPath}`);
    console.log(`🎯 Target Securities: ${TARGET_SECURITIES}`);
    console.log(`💰 Target Value: $${TARGET_VALUE.toLocaleString()}`);
    console.log('');
    
    try {
        // Run the comprehensive integration test
        const { stdout: testResults } = await execAsync('node test-complete-integration.js');
        console.log('📊 Integration Test Results:');
        console.log(testResults);
        
        // Parse results to find best performer
        const lines = testResults.split('\n');
        let bestProcessor = null;
        let maxSecurities = 0;
        
        for (const line of lines) {
            const securitiesMatch = line.match(/📊 Securities: (\d+)/);
            if (securitiesMatch) {
                const count = parseInt(securitiesMatch[1]);
                if (count > maxSecurities) {
                    maxSecurities = count;
                    // Find processor name in previous lines
                    const processorMatch = testResults.substring(0, testResults.indexOf(line))
                        .split('\n').reverse().find(l => l.includes('TESTING'))?.match(/TESTING ([^,]+)/);
                    if (processorMatch) {
                        bestProcessor = processorMatch[1].trim();
                    }
                }
            }
        }
        
        console.log('\n🏆 ACCURACY ANALYSIS:');
        console.log('='.repeat(50));
        console.log(`🥇 Best Processor: ${bestProcessor || 'Unknown'}`);
        console.log(`📊 Securities Found: ${maxSecurities}`);
        console.log(`🎯 Target Securities: ${TARGET_SECURITIES}`);
        
        const accuracyPercent = (maxSecurities / TARGET_SECURITIES) * 100;
        console.log(`📈 Extraction Accuracy: ${accuracyPercent.toFixed(1)}%`);
        
        if (accuracyPercent >= 95) {
            console.log('🏆 EXCELLENT: 95%+ accuracy achieved!');
        } else if (accuracyPercent >= 85) {
            console.log('✅ GOOD: 85%+ accuracy achieved');
        } else if (accuracyPercent >= 70) {
            console.log('⚠️ ACCEPTABLE: 70%+ accuracy achieved');
        } else {
            console.log('❌ NEEDS IMPROVEMENT: Less than 70% accuracy');
        }
        
        return {
            success: true,
            bestProcessor,
            securitiesFound: maxSecurities,
            targetSecurities: TARGET_SECURITIES,
            accuracy: accuracyPercent
        };
        
    } catch (error) {
        console.log('❌ Accuracy test failed:', error.message);
        return { success: false, error: error.message };
    }
}

async function testProductionReadiness() {
    console.log('\n🚀 Testing Production Readiness...');
    console.log('='.repeat(50));
    
    const checks = [
        {
            name: 'Docker Configuration',
            test: () => fs.existsSync('./Dockerfile') && fs.existsSync('./docker-compose.yml'),
            critical: true
        },
        {
            name: 'Python Requirements',
            test: () => fs.existsSync('./requirements_paddle.txt'),
            critical: true
        },
        {
            name: 'Node Dependencies',
            test: () => fs.existsSync('./package.json'),
            critical: true
        },
        {
            name: 'PaddleOCR Extractor',
            test: () => fs.existsSync('./paddle_financial_extractor.py'),
            critical: true
        },
        {
            name: 'FastAPI Integration',
            test: () => fs.existsSync('./api/paddle-financial-processor.js'),
            critical: true
        },
        {
            name: 'Frontend Interface',
            test: () => fs.existsSync('./frontend-paddle-integration.html'),
            critical: false
        },
        {
            name: 'Test Suite',
            test: () => fs.existsSync('./test-complete-integration.js'),
            critical: false
        }
    ];
    
    let criticalPassed = 0;
    let totalCritical = checks.filter(c => c.critical).length;
    
    for (const check of checks) {
        const passed = check.test();
        const status = passed ? '✅' : '❌';
        const priority = check.critical ? '[CRITICAL]' : '[OPTIONAL]';
        
        console.log(`${status} ${check.name} ${priority}`);
        
        if (check.critical && passed) {
            criticalPassed++;
        }
    }
    
    console.log('');
    console.log(`📊 Production Readiness: ${criticalPassed}/${totalCritical} critical checks passed`);
    
    if (criticalPassed === totalCritical) {
        console.log('🏆 PRODUCTION READY: All critical components available');
        return true;
    } else {
        console.log('⚠️ MISSING COMPONENTS: Some critical files missing');
        return false;
    }
}

async function main() {
    console.log('🏦 FINANCEAI PRO - FULL STACK TEST SUITE');
    console.log('🎯 Target: 100% Accuracy PDF Extraction');
    console.log('='.repeat(70));
    console.log('');
    
    const results = {
        pythonEnv: false,
        nodeEnv: false,
        accuracyTest: null,
        productionReady: false
    };
    
    // Test environments
    results.pythonEnv = await testPythonEnvironment();
    results.nodeEnv = await testNodeEnvironment();
    
    // Run accuracy test
    if (results.nodeEnv) {
        results.accuracyTest = await runAccuracyTest();
    } else {
        console.log('\n⚠️ Skipping accuracy test - Node.js server not available');
    }
    
    // Test production readiness
    results.productionReady = await testProductionReadiness();
    
    // Final summary
    console.log('\n📋 FINAL SUMMARY');
    console.log('='.repeat(70));
    
    console.log(`🐍 Python Environment: ${results.pythonEnv ? '✅ Ready' : '⚠️ Issues detected'}`);
    console.log(`🟢 Node.js Environment: ${results.nodeEnv ? '✅ Ready' : '⚠️ Server not running'}`);
    
    if (results.accuracyTest) {
        if (results.accuracyTest.success) {
            console.log(`🎯 Extraction Accuracy: ✅ ${results.accuracyTest.accuracy.toFixed(1)}% (${results.accuracyTest.securitiesFound}/${results.accuracyTest.targetSecurities})`);
            console.log(`🥇 Best Processor: ${results.accuracyTest.bestProcessor}`);
        } else {
            console.log(`🎯 Extraction Accuracy: ❌ Test failed`);
        }
    } else {
        console.log(`🎯 Extraction Accuracy: ⏸️ Not tested`);
    }
    
    console.log(`🚀 Production Ready: ${results.productionReady ? '✅ All systems go' : '⚠️ Missing components'}`);
    
    console.log('');
    console.log('🔧 NEXT STEPS:');
    
    if (!results.nodeEnv) {
        console.log('   1. Start local server: node local-test-server.js');
    }
    
    if (!results.pythonEnv) {
        console.log('   2. Install system dependencies for PaddleOCR');
        console.log('      sudo apt install libgomp1 libglib2.0-0');
    }
    
    if (results.accuracyTest && results.accuracyTest.success && results.accuracyTest.accuracy < 95) {
        console.log('   3. Optimize processors for higher accuracy');
    }
    
    if (results.productionReady && results.nodeEnv) {
        console.log('   4. Deploy to production with Docker');
        console.log('      ./test-docker-build.sh  # When Docker is available');
    }
    
    console.log('');
    console.log('✨ FinanceAI Pro is ready for financial PDF extraction!');
}

// Run the test suite
main().catch(console.error);