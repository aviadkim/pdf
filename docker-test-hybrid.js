/**
 * Docker Environment Test for Enhanced Hybrid Learning System
 * Tests the system in containerized environment
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class DockerHybridTester {
    constructor() {
        this.testResults = {
            dockerBuild: false,
            containerStart: false,
            apiEndpoints: false,
            hybridExtraction: false,
            annotationInterface: false,
            learningStats: false
        };
    }
    
    /**
     * Run comprehensive Docker tests
     */
    async runDockerTests() {
        console.log('🐳 Starting Docker Environment Tests for Hybrid Learning System');
        console.log('='.repeat(70));
        
        try {
            // Test 1: Build Docker image
            await this.testDockerBuild();
            
            // Test 2: Start container
            await this.testContainerStart();
            
            // Test 3: Test API endpoints
            await this.testAPIEndpoints();
            
            // Test 4: Test hybrid extraction
            await this.testHybridExtraction();
            
            // Test 5: Test annotation interface
            await this.testAnnotationInterface();
            
            // Test 6: Test learning stats
            await this.testLearningStats();
            
            // Display results
            this.displayDockerTestResults();
            
        } catch (error) {
            console.error('❌ Docker test suite failed:', error.message);
        }
    }
    
    /**
     * Test Docker image build
     */
    async testDockerBuild() {
        console.log('\n🔨 Test 1: Docker Image Build');
        console.log('-'.repeat(40));
        
        try {
            // Check if Docker is available
            const dockerVersion = await this.runCommand('docker --version');
            console.log(`🐳 Docker available: ${dockerVersion.stdout.trim()}`);
            
            // Build the image
            console.log('📦 Building Docker image...');
            const buildResult = await this.runCommand('docker build -t pdf-hybrid-test .');
            
            if (buildResult.stdout.includes('Successfully built') || buildResult.stdout.includes('Successfully tagged')) {
                console.log('✅ Docker build: PASSED');
                this.testResults.dockerBuild = true;
            } else {
                console.log('❌ Docker build: FAILED');
                console.log('Build output:', buildResult.stdout);
                console.log('Build errors:', buildResult.stderr);
            }
            
        } catch (error) {
            console.log(`❌ Docker build: FAILED - ${error.message}`);
        }
    }
    
    /**
     * Test container startup
     */
    async testContainerStart() {
        console.log('\n🚀 Test 2: Container Startup');
        console.log('-'.repeat(40));
        
        if (!this.testResults.dockerBuild) {
            console.log('⏭️ Skipping container start (build failed)');
            return;
        }
        
        try {
            // Start container in detached mode
            console.log('🌟 Starting container...');
            const startResult = await this.runCommand('docker run -d -p 10003:10002 --name pdf-hybrid-test pdf-hybrid-test');
            
            if (startResult.stdout.trim()) {
                console.log('✅ Container started with ID:', startResult.stdout.trim().substring(0, 12));
                this.testResults.containerStart = true;
                
                // Wait for container to be ready
                console.log('⏳ Waiting for container to be ready...');
                await this.sleep(5000);
                
                // Check container status
                const statusResult = await this.runCommand('docker ps --filter name=pdf-hybrid-test');
                if (statusResult.stdout.includes('pdf-hybrid-test')) {
                    console.log('✅ Container is running');
                } else {
                    console.log('❌ Container not running properly');
                    this.testResults.containerStart = false;
                }
            } else {
                console.log('❌ Container start: FAILED');
            }
            
        } catch (error) {
            console.log(`❌ Container start: FAILED - ${error.message}`);
        }
    }
    
    /**
     * Test API endpoints
     */
    async testAPIEndpoints() {
        console.log('\n🌐 Test 3: API Endpoints');
        console.log('-'.repeat(40));
        
        if (!this.testResults.containerStart) {
            console.log('⏭️ Skipping API tests (container not running)');
            return;
        }
        
        try {
            const baseUrl = 'http://localhost:10003';
            const endpoints = [
                '/',
                '/api/learning-stats',
                '/api/smart-ocr-test'
            ];
            
            let successCount = 0;
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(`${baseUrl}${endpoint}`, {
                        timeout: 5000
                    });
                    
                    if (response.ok) {
                        console.log(`✅ ${endpoint}: ${response.status}`);
                        successCount++;
                    } else {
                        console.log(`❌ ${endpoint}: ${response.status}`);
                    }
                } catch (error) {
                    console.log(`❌ ${endpoint}: Connection failed`);
                }
            }
            
            if (successCount === endpoints.length) {
                console.log('✅ API endpoints: PASSED');
                this.testResults.apiEndpoints = true;
            } else {
                console.log(`⚠️ API endpoints: PARTIAL (${successCount}/${endpoints.length})`);
            }
            
        } catch (error) {
            console.log(`❌ API endpoints: FAILED - ${error.message}`);
        }
    }
    
    /**
     * Test hybrid extraction
     */
    async testHybridExtraction() {
        console.log('\n🧠 Test 4: Hybrid Extraction');
        console.log('-'.repeat(40));
        
        if (!this.testResults.apiEndpoints) {
            console.log('⏭️ Skipping hybrid extraction test (API not available)');
            return;
        }
        
        try {
            // Create a test PDF file (mock)
            const testData = new FormData();
            testData.append('file', new Blob(['Test PDF content']), 'test.pdf');
            testData.append('documentId', 'docker_test_123');
            
            const response = await fetch('http://localhost:10003/api/hybrid-extract', {
                method: 'POST',
                body: testData,
                timeout: 10000
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.extraction) {
                    console.log('✅ Hybrid extraction: PASSED');
                    console.log(`   - System: ${result.system}`);
                    console.log(`   - Method: ${result.extraction.method}`);
                    console.log(`   - Accuracy: ${result.extraction.accuracy}%`);
                    this.testResults.hybridExtraction = true;
                } else {
                    console.log('❌ Hybrid extraction: Invalid response format');
                }
            } else {
                console.log(`❌ Hybrid extraction: HTTP ${response.status}`);
            }
            
        } catch (error) {
            console.log(`❌ Hybrid extraction: FAILED - ${error.message}`);
        }
    }
    
    /**
     * Test annotation interface
     */
    async testAnnotationInterface() {
        console.log('\n📝 Test 5: Annotation Interface');
        console.log('-'.repeat(40));
        
        if (!this.testResults.apiEndpoints) {
            console.log('⏭️ Skipping annotation interface test (API not available)');
            return;
        }
        
        try {
            // Test annotation template endpoint
            const templateResponse = await fetch('http://localhost:10003/api/annotation-template/docker_test_123', {
                timeout: 5000
            });
            
            if (templateResponse.ok) {
                const template = await templateResponse.json();
                if (template.success && template.template) {
                    console.log('✅ Annotation template: PASSED');
                    
                    // Test annotation interface page
                    const interfaceResponse = await fetch('http://localhost:10003/api/annotation-interface/docker_test_123', {
                        timeout: 5000
                    });
                    
                    if (interfaceResponse.ok) {
                        const html = await interfaceResponse.text();
                        if (html.includes('Human Annotation Interface')) {
                            console.log('✅ Annotation interface: PASSED');
                            this.testResults.annotationInterface = true;
                        } else {
                            console.log('❌ Annotation interface: Invalid HTML');
                        }
                    } else {
                        console.log(`❌ Annotation interface: HTTP ${interfaceResponse.status}`);
                    }
                } else {
                    console.log('❌ Annotation template: Invalid response format');
                }
            } else {
                console.log(`❌ Annotation template: HTTP ${templateResponse.status}`);
            }
            
        } catch (error) {
            console.log(`❌ Annotation interface: FAILED - ${error.message}`);
        }
    }
    
    /**
     * Test learning stats
     */
    async testLearningStats() {
        console.log('\n📊 Test 6: Learning Statistics');
        console.log('-'.repeat(40));
        
        if (!this.testResults.apiEndpoints) {
            console.log('⏭️ Skipping learning stats test (API not available)');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:10003/api/learning-stats', {
                timeout: 5000
            });
            
            if (response.ok) {
                const stats = await response.json();
                if (stats.success && stats.stats && stats.systemInfo) {
                    console.log('✅ Learning statistics: PASSED');
                    console.log(`   - System: ${stats.systemInfo.type}`);
                    console.log(`   - Version: ${stats.systemInfo.version}`);
                    console.log(`   - Base extractions: ${stats.stats.baseExtractions}`);
                    console.log(`   - AI enhancements: ${stats.stats.aiEnhancements}`);
                    console.log(`   - Learning patterns: ${stats.stats.learningPatternsCount}`);
                    this.testResults.learningStats = true;
                } else {
                    console.log('❌ Learning statistics: Invalid response format');
                }
            } else {
                console.log(`❌ Learning statistics: HTTP ${response.status}`);
            }
            
        } catch (error) {
            console.log(`❌ Learning statistics: FAILED - ${error.message}`);
        }
    }
    
    /**
     * Display Docker test results
     */
    displayDockerTestResults() {
        console.log('\n' + '='.repeat(70));
        console.log('🏆 DOCKER ENVIRONMENT TEST RESULTS');
        console.log('='.repeat(70));
        
        const tests = Object.keys(this.testResults);
        const passed = tests.filter(test => this.testResults[test]).length;
        const total = tests.length;
        const successRate = (passed / total * 100).toFixed(1);
        
        console.log(`📊 Tests Run: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${total - passed}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        
        console.log('\n📋 Detailed Results:');
        tests.forEach(test => {
            const status = this.testResults[test] ? '✅' : '❌';
            const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
            console.log(`   ${status} ${testName}`);
        });
        
        if (passed === total) {
            console.log('\n🚀 ALL DOCKER TESTS PASSED! System is ready for production deployment.');
        } else if (successRate >= 80) {
            console.log('\n⚠️  Most Docker tests passed. Some issues may need attention.');
        } else {
            console.log('\n❌ Multiple Docker test failures. System needs debugging.');
        }
        
        // Cleanup
        this.cleanup();
    }
    
    /**
     * Cleanup Docker resources
     */
    async cleanup() {
        console.log('\n🧹 Cleaning up Docker resources...');
        
        try {
            // Stop container
            await this.runCommand('docker stop pdf-hybrid-test', { ignoreError: true });
            
            // Remove container
            await this.runCommand('docker rm pdf-hybrid-test', { ignoreError: true });
            
            // Remove image
            await this.runCommand('docker rmi pdf-hybrid-test', { ignoreError: true });
            
            console.log('✅ Cleanup completed');
            
        } catch (error) {
            console.log('⚠️ Cleanup had some issues:', error.message);
        }
    }
    
    /**
     * Run a shell command and return result
     */
    runCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, { shell: true });
            let stdout = '';
            let stderr = '';
            
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            child.on('close', (code) => {
                if (code === 0 || options.ignoreError) {
                    resolve({ stdout, stderr, code });
                } else {
                    reject(new Error(`Command failed with code ${code}: ${stderr}`));
                }
            });
        });
    }
    
    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Polyfill for fetch and FormData in Node.js
async function initializePolyfills() {
    if (typeof fetch === 'undefined') {
        try {
            const { default: fetch, FormData } = await import('node-fetch');
            global.fetch = fetch;
            global.FormData = FormData;
            global.Blob = class Blob {
                constructor(parts, options = {}) {
                    this.parts = parts;
                    this.type = options.type || '';
                }
            };
        } catch (error) {
            console.log('⚠️ fetch polyfill not available, some tests may fail');
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    initializePolyfills().then(() => {
        const tester = new DockerHybridTester();
        tester.runDockerTests().catch(error => {
            console.error('❌ Docker test runner failed:', error.message);
            process.exit(1);
        });
    });
}

module.exports = { DockerHybridTester };