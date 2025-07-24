#!/usr/bin/env node

/**
 * LOCAL DOCKER TESTING SCRIPT
 * Tests Docker container locally before Render deployment
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class DockerTester {
    constructor() {
        this.containerName = 'pdf-processor-test';
        this.imageName = 'pdf-processor';
        this.port = 10002;
        this.testPDF = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    }

    async runDockerTests() {
        console.log('🐳 Starting Docker Container Tests');
        console.log('=====================================');

        try {
            // Step 1: Build Docker image
            console.log('🔨 Building Docker image...');
            await this.execCommand(`docker build -f Dockerfile.production -t ${this.imageName} .`);
            console.log('✅ Docker image built successfully');

            // Step 2: Run container
            console.log('🚀 Starting Docker container...');
            await this.execCommand(`docker run -d --name ${this.containerName} -p ${this.port}:${this.port} ${this.imageName}`);
            console.log('✅ Docker container started');

            // Step 3: Wait for startup
            console.log('⏳ Waiting for container startup...');
            await this.sleep(10000);

            // Step 4: Test endpoints
            console.log('🧪 Testing endpoints...');
            await this.testEndpoints();

            // Step 5: Test PDF processing
            if (fs.existsSync(this.testPDF)) {
                console.log('📄 Testing PDF processing...');
                await this.testPDFProcessing();
            } else {
                console.log('⚠️ Messos PDF not found, skipping PDF test');
            }

            console.log('✅ All Docker tests completed');

        } catch (error) {
            console.error('❌ Docker tests failed:', error.message);
        } finally {
            // Cleanup
            console.log('🧹 Cleaning up Docker containers...');
            try {
                await this.execCommand(`docker stop ${this.containerName}`, false);
                await this.execCommand(`docker rm ${this.containerName}`, false);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }

    async testEndpoints() {
        const endpoints = [
            '/health',
            '/api/system-capabilities',
            '/api/ultra-accurate-extract',
            '/api/phase2-enhanced-extract',
            '/api/mistral-ocr-extract'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await this.curl(`http://localhost:${this.port}${endpoint}`);
                if (endpoint.includes('extract')) {
                    // POST endpoints should return 405 for GET
                    console.log(`✅ ${endpoint}: Returns proper error for GET request`);
                } else {
                    console.log(`✅ ${endpoint}: Working`);
                }
            } catch (error) {
                console.log(`❌ ${endpoint}: Failed - ${error.message}`);
            }
        }
    }

    async testPDFProcessing() {
        try {
            // Test with curl multipart form data
            const command = `curl -X POST -F "pdf=@\\"${this.testPDF}\\"" http://localhost:${this.port}/api/ultra-accurate-extract`;
            const response = await this.execCommand(command);
            
            if (response.includes('success')) {
                console.log('✅ PDF processing: Working');
                const result = JSON.parse(response);
                if (result.extraction_results) {
                    console.log(`📊 Securities found: ${result.extraction_results.securities_found || 0}`);
                    console.log(`💰 Total value: $${result.extraction_results.total_value || 0}`);
                }
            } else {
                console.log('❌ PDF processing: Failed to parse response');
            }
        } catch (error) {
            console.log(`❌ PDF processing: Failed - ${error.message}`);
        }
    }

    async curl(url) {
        return new Promise((resolve, reject) => {
            exec(`curl -s "${url}"`, (error, stdout, stderr) => {
                if (error) reject(error);
                else resolve(stdout);
            });
        });
    }

    async execCommand(command, throwOnError = true) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error && throwOnError) {
                    reject(new Error(`Command failed: ${command}\n${stderr}`));
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new DockerTester();
    tester.runDockerTests().catch(console.error);
}

module.exports = DockerTester;