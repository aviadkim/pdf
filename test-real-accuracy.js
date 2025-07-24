/**
 * REAL ACCURACY TESTING - No Exaggeration
 * Tests the actual accuracy against known correct values
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class RealAccuracyTester {
    constructor() {
        this.knownCorrectValues = {
            'messos_march_2025': {
                expectedTotal: 19464431, // $19.4M - known correct total
                expectedSecurities: 40,   // Known number of securities
                expectedISINs: [
                    'XS2252299883', 'XS2381723902', 'XS2746319610', 
                    'XS2407295554', 'CH1908490000'
                    // Add all 40 known ISINs here
                ],
                tolerance: 0.01 // 1% tolerance for rounding
            }
        };
        
        this.testResults = [];
        this.baseURL = 'https://pdf-production-5dis.onrender.com';
    }

    /**
     * BRUTAL HONESTY TEST - Tests all endpoints against known correct values
     */
    async testRealAccuracy() {
        console.log('🎯 STARTING REAL ACCURACY TEST (NO EXAGGERATION)');
        console.log('================================================');
        
        const pdfPath = '2. Messos  - 31.03.2025.pdf';
        const knownData = this.knownCorrectValues.messos_march_2025;
        
        if (!fs.existsSync(pdfPath)) {
            throw new Error(`PDF file not found: ${pdfPath}`);
        }

        // Test all available endpoints
        const endpoints = [
            '/api/extract',
            '/api/ultra-99-percent', 
            '/api/visual-pdf-extract',
            '/api/bulletproof-processor',
            '/api/phase2-enhanced'
        ];

        const results = [];

        for (const endpoint of endpoints) {
            console.log(`\n🧪 Testing ${endpoint}...`);
            
            try {
                const result = await this.testEndpoint(endpoint, pdfPath);
                const accuracy = this.calculateRealAccuracy(result, knownData);
                
                results.push({
                    endpoint,
                    ...result,
                    realAccuracy: accuracy,
                    status: 'success'
                });

                console.log(`   📊 Real Accuracy: ${accuracy.overall.toFixed(2)}%`);
                console.log(`   💰 Value Accuracy: ${accuracy.valueAccuracy.toFixed(2)}%`);
                console.log(`   🔢 Security Count: ${result.securities?.length || 0}/${knownData.expectedSecurities}`);
                
            } catch (error) {
                console.log(`   ❌ Failed: ${error.message}`);
                results.push({
                    endpoint,
                    error: error.message,
                    realAccuracy: { overall: 0 },
                    status: 'failed'
                });
            }
        }

        // Find the ACTUAL best performer
        const bestResult = results
            .filter(r => r.status === 'success')
            .sort((a, b) => b.realAccuracy.overall - a.realAccuracy.overall)[0];

        console.log('\n🏆 REAL ACCURACY RESULTS:');
        console.log('==========================');
        
        results.forEach(result => {
            const status = result.status === 'success' ? '✅' : '❌';
            const accuracy = result.realAccuracy?.overall || 0;
            console.log(`${status} ${result.endpoint}: ${accuracy.toFixed(2)}% accuracy`);
        });

        if (bestResult) {
            console.log(`\n🎯 BEST ACTUAL PERFORMANCE:`);
            console.log(`   Endpoint: ${bestResult.endpoint}`);
            console.log(`   Real Accuracy: ${bestResult.realAccuracy.overall.toFixed(2)}%`);
            console.log(`   Value Extracted: $${bestResult.totalValue?.toLocaleString() || 'unknown'}`);
            console.log(`   Expected Value: $${knownData.expectedTotal.toLocaleString()}`);
            console.log(`   Securities Found: ${bestResult.securities?.length || 0}/${knownData.expectedSecurities}`);
            
            // Honesty check
            if (bestResult.realAccuracy.overall < 99.0) {
                console.log(`\n⚠️  HONESTY CHECK: System does NOT achieve 99% accuracy`);
                console.log(`   Gap to 99%: ${(99 - bestResult.realAccuracy.overall).toFixed(2)} percentage points`);
                console.log(`   Recommendation: Hybrid system with AI supervision needed`);
            } else {
                console.log(`\n🎉 TRUE 99%+ ACCURACY ACHIEVED!`);
            }
        }

        // Save detailed results
        await this.saveDetailedResults(results);
        return results;
    }

    /**
     * Test individual endpoint with PDF
     */
    async testEndpoint(endpoint, pdfPath) {
        const formData = new FormData();
        const pdfBuffer = fs.readFileSync(pdfPath);
        
        // Create a proper File object from buffer
        const file = new File([pdfBuffer], path.basename(pdfPath), { 
            type: 'application/pdf' 
        });
        formData.append('pdf', file);

        const response = await axios.post(`${this.baseURL}${endpoint}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000 // 60 second timeout
        });

        return response.data;
    }

    /**
     * Calculate REAL accuracy against known correct values
     */
    calculateRealAccuracy(result, knownData) {
        const extractedTotal = result.totalValue || result.total || 0;
        const extractedCount = result.securities?.length || 0;
        
        // Value accuracy
        const valueAccuracy = Math.min(100, (extractedTotal / knownData.expectedTotal) * 100);
        
        // Security count accuracy  
        const countAccuracy = Math.min(100, (extractedCount / knownData.expectedSecurities) * 100);
        
        // ISIN detection accuracy (if ISINs are provided)
        let isinAccuracy = 100;
        if (result.securities && knownData.expectedISINs) {
            const foundISINs = result.securities.map(s => s.isin).filter(Boolean);
            const matchedISINs = foundISINs.filter(isin => 
                knownData.expectedISINs.includes(isin)
            );
            isinAccuracy = (matchedISINs.length / knownData.expectedISINs.length) * 100;
        }

        // Overall accuracy (weighted average)
        const overall = (valueAccuracy * 0.5) + (countAccuracy * 0.3) + (isinAccuracy * 0.2);

        return {
            overall: Math.min(100, overall),
            valueAccuracy,
            countAccuracy, 
            isinAccuracy,
            extractedTotal,
            expectedTotal: knownData.expectedTotal,
            extractedCount,
            expectedCount: knownData.expectedSecurities
        };
    }

    /**
     * Save detailed test results
     */
    async saveDetailedResults(results) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `real-accuracy-test-${timestamp}.json`;
        
        const report = {
            testDate: new Date().toISOString(),
            testType: 'real_accuracy_no_exaggeration',
            knownCorrectValues: this.knownCorrectValues,
            results: results,
            summary: {
                bestAccuracy: Math.max(...results.map(r => r.realAccuracy?.overall || 0)),
                averageAccuracy: results.reduce((sum, r) => sum + (r.realAccuracy?.overall || 0), 0) / results.length,
                successfulEndpoints: results.filter(r => r.status === 'success').length,
                totalEndpoints: results.length
            }
        };

        fs.writeFileSync(filename, JSON.stringify(report, null, 2));
        console.log(`\n📁 Detailed results saved to: ${filename}`);
        
        return report;
    }

    /**
     * Continuous accuracy monitoring
     */
    async monitorAccuracy(intervalMinutes = 60) {
        console.log(`🔄 Starting continuous accuracy monitoring (every ${intervalMinutes} minutes)`);
        
        const runTest = async () => {
            try {
                const results = await this.testRealAccuracy();
                const bestAccuracy = Math.max(...results.map(r => r.realAccuracy?.overall || 0));
                
                if (bestAccuracy < 99.0) {
                    console.log(`⚠️  ACCURACY ALERT: System below 99% (${bestAccuracy.toFixed(2)}%)`);
                }
            } catch (error) {
                console.error('❌ Monitoring test failed:', error);
            }
        };

        // Run initial test
        await runTest();

        // Schedule regular tests
        setInterval(runTest, intervalMinutes * 60 * 1000);
    }
}

// Export for use in other modules
module.exports = { RealAccuracyTester };

// Run standalone test if called directly
if (require.main === module) {
    const tester = new RealAccuracyTester();
    tester.testRealAccuracy()
        .then(() => console.log('✅ Real accuracy test completed'))
        .catch(error => console.error('❌ Test failed:', error));
}