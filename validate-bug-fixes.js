#!/usr/bin/env node

/**
 * VALIDATE BUG FIXES AND IMPROVEMENTS
 * 
 * This script validates all the bug fixes and improvements made
 * to the Smart OCR Learning System
 */

const axios = require('axios');

class BugFixValidator {
    constructor() {
        this.baseUrl = 'https://pdf-fzzi.onrender.com';
        this.results = {
            fixes: [],
            failures: [],
            improvements: []
        };
    }

    async validateAllFixes() {
        console.log('🔍 Validating Bug Fixes and Improvements...');
        console.log('=' .repeat(50));

        await this.validateApiEndpoints();
        await this.validateErrorHandling();
        await this.validateSmartOCRSystem();
        await this.validateCompatibility();
        
        this.generateValidationReport();
    }

    async validateApiEndpoints() {
        console.log('\n🔌 Validating API Endpoints...');
        
        const endpoints = [
            { url: '/api/smart-ocr-test', expectedStatus: 200, name: 'Health Check' },
            { url: '/api/smart-ocr-stats', expectedStatus: 200, name: 'Stats Endpoint' },
            { url: '/api/smart-ocr-patterns', expectedStatus: 200, name: 'Patterns Endpoint' },
            { url: '/api/test', expectedStatus: 200, name: 'Legacy Test Endpoint' },
            { url: '/api/pdf-extract', expectedStatus: 405, name: 'PDF Extract (GET)' },
            { url: '/api/bulletproof-processor', expectedStatus: 405, name: 'Bulletproof (GET)' }
        ];

        for (const endpoint of endpoints) {
            await this.validateEndpoint(endpoint);
        }
    }

    async validateErrorHandling() {
        console.log('\n🚨 Validating Error Handling...');
        
        const errorTests = [
            { url: '/nonexistent-page', expectedStatus: 404, name: '404 Error Handling' },
            { url: '/api/nonexistent-endpoint', expectedStatus: 404, name: 'API 404 Handling' }
        ];

        for (const test of errorTests) {
            await this.validateEndpoint(test);
        }
    }

    async validateSmartOCRSystem() {
        console.log('\n🧠 Validating Smart OCR System...');
        
        try {
            const response = await axios.get(`${this.baseUrl}/api/smart-ocr-stats`);
            
            if (response.status === 200 && response.data.success) {
                this.results.fixes.push({
                    name: 'Smart OCR Stats Working',
                    status: 'FIXED',
                    details: 'Stats endpoint now returns valid JSON response'
                });
                console.log('✅ Smart OCR stats endpoint: FIXED');
            } else {
                this.results.failures.push({
                    name: 'Smart OCR Stats',
                    status: 'STILL_BROKEN',
                    details: 'Stats endpoint not returning expected format'
                });
                console.log('❌ Smart OCR stats endpoint: STILL BROKEN');
            }
        } catch (error) {
            this.results.failures.push({
                name: 'Smart OCR Stats',
                status: 'ERROR',
                details: error.message
            });
            console.log('❌ Smart OCR stats endpoint: ERROR');
        }
    }

    async validateCompatibility() {
        console.log('\n🔄 Validating Legacy Compatibility...');
        
        try {
            // Test legacy test endpoint
            const testResponse = await axios.get(`${this.baseUrl}/api/test`);
            
            if (testResponse.status === 200 && testResponse.data.compatibility === 'legacy-endpoint') {
                this.results.improvements.push({
                    name: 'Legacy API Compatibility',
                    status: 'IMPROVED',
                    details: 'Added legacy /api/test endpoint for backward compatibility'
                });
                console.log('✅ Legacy compatibility: IMPROVED');
            } else {
                this.results.failures.push({
                    name: 'Legacy Compatibility',
                    status: 'FAILED',
                    details: 'Legacy endpoints not working as expected'
                });
                console.log('❌ Legacy compatibility: FAILED');
            }
        } catch (error) {
            this.results.failures.push({
                name: 'Legacy Compatibility',
                status: 'ERROR',
                details: error.message
            });
            console.log('❌ Legacy compatibility: ERROR');
        }
    }

    async validateEndpoint(endpoint) {
        try {
            const response = await axios.get(`${this.baseUrl}${endpoint.url}`, {
                validateStatus: () => true // Don't throw on any status
            });
            
            if (response.status === endpoint.expectedStatus) {
                this.results.fixes.push({
                    name: endpoint.name,
                    status: 'FIXED',
                    details: `Endpoint returning expected status ${endpoint.expectedStatus}`
                });
                console.log(`✅ ${endpoint.name}: FIXED (${response.status})`);
            } else {
                this.results.failures.push({
                    name: endpoint.name,
                    status: 'INCORRECT_STATUS',
                    details: `Expected ${endpoint.expectedStatus}, got ${response.status}`
                });
                console.log(`❌ ${endpoint.name}: WRONG STATUS (${response.status})`);
            }
        } catch (error) {
            this.results.failures.push({
                name: endpoint.name,
                status: 'ERROR',
                details: error.message
            });
            console.log(`❌ ${endpoint.name}: ERROR`);
        }
    }

    generateValidationReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 BUG FIX VALIDATION REPORT');
        console.log('='.repeat(60));
        
        console.log(`✅ Fixes Applied: ${this.results.fixes.length}`);
        console.log(`❌ Still Broken: ${this.results.failures.length}`);
        console.log(`🚀 Improvements: ${this.results.improvements.length}`);
        
        if (this.results.fixes.length > 0) {
            console.log('\n🎉 SUCCESSFUL FIXES:');
            this.results.fixes.forEach((fix, i) => {
                console.log(`${i + 1}. ${fix.name}: ${fix.details}`);
            });
        }
        
        if (this.results.improvements.length > 0) {
            console.log('\n🚀 IMPROVEMENTS MADE:');
            this.results.improvements.forEach((improvement, i) => {
                console.log(`${i + 1}. ${improvement.name}: ${improvement.details}`);
            });
        }
        
        if (this.results.failures.length > 0) {
            console.log('\n❌ STILL NEED ATTENTION:');
            this.results.failures.forEach((failure, i) => {
                console.log(`${i + 1}. ${failure.name}: ${failure.details}`);
            });
        }
        
        const successRate = (this.results.fixes.length / (this.results.fixes.length + this.results.failures.length) * 100).toFixed(1);
        console.log(`\n📈 Bug Fix Success Rate: ${successRate}%`);
        
        if (this.results.failures.length === 0) {
            console.log('\n🎊 ALL BUGS SUCCESSFULLY FIXED! 🎊');
        } else {
            console.log('\n⚠️  Some issues still require attention.');
        }
    }
}

// Run validation
async function main() {
    const validator = new BugFixValidator();
    await validator.validateAllFixes();
}

main().catch(console.error);