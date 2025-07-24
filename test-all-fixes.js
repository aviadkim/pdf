#!/usr/bin/env node

/**
 * TEST ALL FIXES - Comprehensive validation of all system fixes
 * 
 * This script validates:
 * 1. Port configuration alignment
 * 2. Server route consolidation
 * 3. Enhanced precision extraction
 * 4. Playwright test compatibility
 * 5. Docker configuration readiness
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class SystemFixValidator {
    constructor() {
        this.results = {
            portConfig: false,
            serverRoutes: false,
            enhancedExtraction: false,
            playwrightTests: false,
            dockerConfig: false
        };
        this.errors = [];
    }

    async runAllTests() {
        console.log('🔧 COMPREHENSIVE SYSTEM FIX VALIDATION');
        console.log('=====================================');
        console.log('Testing all fixes applied to resolve failing tests\n');

        try {
            // Test 1: Port Configuration
            await this.testPortConfiguration();
            
            // Test 2: Server Routes
            await this.testServerRoutes();
            
            // Test 3: Enhanced Extraction
            await this.testEnhancedExtraction();
            
            // Test 4: Playwright Configuration
            await this.testPlaywrightConfiguration();
            
            // Test 5: Docker Configuration
            await this.testDockerConfiguration();
            
            // Generate final report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.errors.push(error.message);
        }
    }

    async testPortConfiguration() {
        console.log('🔌 Testing Port Configuration Alignment...');
        
        try {
            // Check playwright.config.js
            const playwrightConfig = fs.readFileSync('./playwright.config.js', 'utf8');
            const playwrightPortMatch = playwrightConfig.match(/baseURL:\s*['"]http:\/\/localhost:(\d+)['"]/);
            const playwrightPort = playwrightPortMatch ? playwrightPortMatch[1] : null;
            
            // Check playwright-server.js
            const playwrightServer = fs.readFileSync('./playwright-server.js', 'utf8');
            const serverPortMatch = playwrightServer.match(/PORT\s*=\s*process\.env\.PORT\s*\|\|\s*(\d+)/);
            const serverPort = serverPortMatch ? serverPortMatch[1] : null;
            
            // Check express-server.js
            const expressServer = fs.readFileSync('./express-server.js', 'utf8');
            const expressPortMatch = expressServer.match(/PORT\s*=\s*process\.env\.PORT\s*\|\|\s*(\d+)/);
            const expressPort = expressPortMatch ? expressPortMatch[1] : null;
            
            // Check Smart OCR test
            const smartOcrTest = fs.readFileSync('./tests/smart-ocr-playwright-tests.spec.js', 'utf8');
            const testPortMatch = smartOcrTest.match(/baseURL\s*=\s*['"]http:\/\/localhost:(\d+)['"]/);
            const testPort = testPortMatch ? testPortMatch[1] : null;
            
            console.log(`   Playwright Config: port ${playwrightPort || 'not found'}`);
            console.log(`   Playwright Server: port ${serverPort || 'not found'}`);
            console.log(`   Express Server: port ${expressPort || 'not found'}`);
            console.log(`   Smart OCR Test: port ${testPort || 'not found'}`);
            
            // Validate alignment
            if (playwrightPort === serverPort && testPort === serverPort) {
                console.log('✅ Port configuration aligned correctly');
                this.results.portConfig = true;
            } else {
                console.log('❌ Port configuration misaligned');
                this.errors.push('Port configuration not aligned across all files');
            }
            
        } catch (error) {
            console.log('❌ Port configuration test failed:', error.message);
            this.errors.push('Port configuration test failed: ' + error.message);
        }
    }

    async testServerRoutes() {
        console.log('\n🛣️ Testing Server Route Consolidation...');
        
        try {
            // Check if Smart OCR route exists in playwright-server.js
            const playwrightServer = fs.readFileSync('./playwright-server.js', 'utf8');
            const hasSmartOcrRoute = playwrightServer.includes('/smart-annotation');
            const hasSmartOcrAPI = playwrightServer.includes('/api/smart-ocr-test');
            
            console.log(`   /smart-annotation route: ${hasSmartOcrRoute ? '✅ found' : '❌ missing'}`);
            console.log(`   /api/smart-ocr-test route: ${hasSmartOcrAPI ? '✅ found' : '❌ missing'}`);
            
            if (hasSmartOcrRoute && hasSmartOcrAPI) {
                console.log('✅ Server routes consolidated correctly');
                this.results.serverRoutes = true;
            } else {
                console.log('❌ Server routes not properly consolidated');
                this.errors.push('Server routes missing in playwright-server.js');
            }
            
        } catch (error) {
            console.log('❌ Server routes test failed:', error.message);
            this.errors.push('Server routes test failed: ' + error.message);
        }
    }

    async testEnhancedExtraction() {
        console.log('\n🎯 Testing Enhanced Precision Extraction...');
        
        try {
            // Check if enhanced extraction functions exist in express-server.js
            const expressServer = fs.readFileSync('./express-server.js', 'utf8');
            const hasExtractSecuritiesPrecise = expressServer.includes('extractSecuritiesPrecise');
            const hasParseMessosSecurityLine = expressServer.includes('parseMessosSecurityLine');
            const hasApplyMessosCorrections = expressServer.includes('applyMessosCorrections');
            const hasSmartFilterSecurities = expressServer.includes('smartFilterSecurities');
            
            console.log(`   extractSecuritiesPrecise function: ${hasExtractSecuritiesPrecise ? '✅ found' : '❌ missing'}`);
            console.log(`   parseMessosSecurityLine function: ${hasParseMessosSecurityLine ? '✅ found' : '❌ missing'}`);
            console.log(`   applyMessosCorrections function: ${hasApplyMessosCorrections ? '✅ found' : '❌ missing'}`);
            console.log(`   smartFilterSecurities function: ${hasSmartFilterSecurities ? '✅ found' : '❌ missing'}`);
            
            // Check if bulletproof processor uses enhanced extraction
            const usesBulletproofProcessor = expressServer.includes('Enhanced Precision Extraction v2');
            console.log(`   Bulletproof processor updated: ${usesBulletproofProcessor ? '✅ updated' : '❌ not updated'}`);
            
            if (hasExtractSecuritiesPrecise && hasParseMessosSecurityLine && hasApplyMessosCorrections && usesBulletproofProcessor) {
                console.log('✅ Enhanced precision extraction implemented correctly');
                this.results.enhancedExtraction = true;
            } else {
                console.log('❌ Enhanced precision extraction not properly implemented');
                this.errors.push('Enhanced precision extraction functions missing or not integrated');
            }
            
        } catch (error) {
            console.log('❌ Enhanced extraction test failed:', error.message);
            this.errors.push('Enhanced extraction test failed: ' + error.message);
        }
    }

    async testPlaywrightConfiguration() {
        console.log('\n🎭 Testing Playwright Configuration...');
        
        try {
            // Check if Smart OCR test file has correct expectations
            const smartOcrTest = fs.readFileSync('./tests/smart-ocr-playwright-tests.spec.js', 'utf8');
            const hasCorrectTitle = smartOcrTest.includes('Smart OCR Annotation System');
            const hasCorrectUploadText = smartOcrTest.includes('Drop PDF here or click to upload');
            const hasCorrectPatternCount = smartOcrTest.includes('toHaveCount(1)'); // Only "Base OCR" initially
            
            console.log(`   Correct page title expectation: ${hasCorrectTitle ? '✅ found' : '❌ missing'}`);
            console.log(`   Correct upload text expectation: ${hasCorrectUploadText ? '✅ found' : '❌ missing'}`);
            console.log(`   Correct pattern count expectation: ${hasCorrectPatternCount ? '✅ found' : '❌ missing'}`);
            
            if (hasCorrectTitle && hasCorrectUploadText && hasCorrectPatternCount) {
                console.log('✅ Playwright configuration updated correctly');
                this.results.playwrightTests = true;
            } else {
                console.log('❌ Playwright configuration not properly updated');
                this.errors.push('Playwright test expectations not aligned with actual interface');
            }
            
        } catch (error) {
            console.log('❌ Playwright configuration test failed:', error.message);
            this.errors.push('Playwright configuration test failed: ' + error.message);
        }
    }

    async testDockerConfiguration() {
        console.log('\n🐳 Testing Docker Configuration...');
        
        try {
            // Check Dockerfile.smart-ocr
            const dockerFile = fs.readFileSync('./Dockerfile.smart-ocr', 'utf8');
            const hasCorrectPort = dockerFile.includes('EXPOSE 10000');
            const hasCorrectHealthCheck = dockerFile.includes('/api/smart-ocr-test');
            const hasCurl = dockerFile.includes('curl');
            
            console.log(`   Correct port exposure (10000): ${hasCorrectPort ? '✅ found' : '❌ missing'}`);
            console.log(`   Correct health check endpoint: ${hasCorrectHealthCheck ? '✅ found' : '❌ missing'}`);
            console.log(`   Curl installed for health check: ${hasCurl ? '✅ found' : '❌ missing'}`);
            
            // Check if express-server.js uses port 10000 by default
            const expressServer = fs.readFileSync('./express-server.js', 'utf8');
            const hasCorrectDefaultPort = expressServer.includes('PORT || 10000');
            console.log(`   Express server default port (10000): ${hasCorrectDefaultPort ? '✅ found' : '❌ missing'}`);
            
            if (hasCorrectPort && hasCorrectHealthCheck && hasCurl && hasCorrectDefaultPort) {
                console.log('✅ Docker configuration aligned correctly');
                this.results.dockerConfig = true;
            } else {
                console.log('❌ Docker configuration not properly aligned');
                this.errors.push('Docker configuration issues found');
            }
            
        } catch (error) {
            console.log('❌ Docker configuration test failed:', error.message);
            this.errors.push('Docker configuration test failed: ' + error.message);
        }
    }

    generateReport() {
        console.log('\n📊 COMPREHENSIVE FIX VALIDATION REPORT');
        console.log('======================================');
        
        const totalTests = Object.keys(this.results).length;
        const passedTests = Object.values(this.results).filter(result => result).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
        console.log(`❌ Tests Failed: ${failedTests}/${totalTests}`);
        
        console.log('\nDetailed Results:');
        Object.entries(this.results).forEach(([test, result]) => {
            const status = result ? '✅ PASS' : '❌ FAIL';
            const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            console.log(`   ${testName}: ${status}`);
        });
        
        if (this.errors.length > 0) {
            console.log('\n🔍 Errors Found:');
            this.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        const overallSuccess = passedTests === totalTests;
        
        console.log('\n🎯 OVERALL SYSTEM STATUS:');
        if (overallSuccess) {
            console.log('✅ ALL FIXES VALIDATED SUCCESSFULLY!');
            console.log('   • Port configurations aligned');
            console.log('   • Server routes consolidated');
            console.log('   • Enhanced extraction implemented');
            console.log('   • Playwright tests updated');
            console.log('   • Docker configuration ready');
            console.log('\n🚀 System is ready for testing and deployment!');
        } else {
            console.log('❌ SOME FIXES NEED ATTENTION');
            console.log('   Please review the failed tests above and apply necessary fixes.');
        }
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            overallSuccess: overallSuccess,
            results: this.results,
            errors: this.errors,
            passedTests: passedTests,
            totalTests: totalTests,
            successRate: ((passedTests / totalTests) * 100).toFixed(1) + '%'
        };
        
        fs.writeFileSync('./test-results/system-fix-validation-report.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Detailed report saved: test-results/system-fix-validation-report.json');
        
        return overallSuccess;
    }
}

// Run the validation
if (require.main === module) {
    const validator = new SystemFixValidator();
    validator.runAllTests()
        .then(() => {
            console.log('\n🎊 System fix validation completed!');
        })
        .catch(error => {
            console.error('💥 System fix validation failed:', error);
            process.exit(1);
        });
}

module.exports = SystemFixValidator;