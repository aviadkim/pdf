/**
 * TEST IMPROVED ACCURACY
 * Test the enhanced extraction system with the MESSOS PDF
 */

const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs').promises;

class AccuracyTester {
    constructor() {
        this.baseUrl = 'https://pdf-fzzi.onrender.com';
        this.pdfPath = '2. Messos  - 31.03.2025.pdf';
        this.previousResults = null;
        this.newResults = null;
    }

    async testImprovedAccuracy() {
        console.log('🧪 TESTING IMPROVED ACCURACY SYSTEM');
        console.log('===================================\n');
        
        // Load previous results for comparison
        try {
            const prevData = await fs.readFile('messos-test-results.json', 'utf8');
            this.previousResults = JSON.parse(prevData);
            console.log('📋 Loaded previous results for comparison');
        } catch (error) {
            console.log('⚠️ No previous results found, running fresh test');
        }
        
        // Test with improved system
        console.log('🔧 Testing with improved extraction system...');
        await this.testWithImprovedSystem();
        
        // Compare results
        if (this.previousResults && this.newResults) {
            console.log('\n📊 COMPARISON ANALYSIS');
            console.log('=====================');
            this.compareResults();
        }
        
        // Analyze quality improvements
        if (this.newResults) {
            console.log('\n🔍 QUALITY ANALYSIS');
            console.log('===================');
            this.analyzeQuality();
        }
        
        // Save new results
        if (this.newResults) {
            await this.saveResults();
        }
    }

    async testWithImprovedSystem() {
        try {
            const pdfBuffer = await fs.readFile(this.pdfPath);
            console.log(`📄 Processing: ${this.pdfPath} (${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
            
            const formData = new FormData();
            formData.append('pdf', pdfBuffer, this.pdfPath);
            
            const startTime = Date.now();
            const response = await fetch(`${this.baseUrl}/api/bulletproof-processor`, {
                method: 'POST',
                body: formData,
                headers: formData.getHeaders(),
                timeout: 30000
            });
            
            const processingTime = Date.now() - startTime;
            
            if (response.ok) {
                const data = await response.json();
                this.newResults = {
                    ...data,
                    processingTime: processingTime,
                    testDate: new Date().toISOString()
                };
                
                console.log(`✅ Processing completed in ${(processingTime/1000).toFixed(1)}s`);
                console.log(`📊 Found ${data.securities?.length || 0} securities`);
                console.log(`💰 Total value: $${data.totalValue?.toLocaleString() || 'N/A'}`);
                console.log(`🎯 Reported accuracy: ${data.accuracy || 'N/A'}`);
                
            } else {
                console.log(`❌ API call failed: ${response.status} ${response.statusText}`);
            }
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        }
    }

    compareResults() {
        const prev = this.previousResults.extractedData || this.previousResults;
        const curr = this.newResults;
        
        console.log('Metric                    | Previous | Improved | Change');
        console.log('--------------------------|----------|----------|--------');
        console.log(`Securities Found          | ${prev.securities?.length || 0}        | ${curr.securities?.length || 0}        | ${this.calculateChange(prev.securities?.length || 0, curr.securities?.length || 0)}`);
        console.log(`Total Value (USD)         | $${(prev.totalValue || 0).toLocaleString().padEnd(7)} | $${(curr.totalValue || 0).toLocaleString().padEnd(7)} | ${this.calculateChange(prev.totalValue || 0, curr.totalValue || 0)}`);
        console.log(`Processing Time           | ${((prev.processingTime || 0)/1000).toFixed(1)}s     | ${((curr.processingTime || 0)/1000).toFixed(1)}s     | ${this.calculateChange(prev.processingTime || 0, curr.processingTime || 0)}`);
        
        // Analyze individual securities
        const prevSecurities = prev.securities || [];
        const currSecurities = curr.securities || [];
        
        console.log('\n🔍 SECURITY COMPARISON (First 10):');
        console.log('===================================');
        console.log('ISIN           | Previous Name                | Improved Name                   | Confidence');
        console.log('---------------|------------------------------|----------------------------------|------------');
        
        for (let i = 0; i < Math.min(10, Math.max(prevSecurities.length, currSecurities.length)); i++) {
            const prevSec = prevSecurities[i] || {};
            const currSec = currSecurities[i] || {};
            
            const isin = (currSec.isin || prevSec.isin || 'N/A').padEnd(13);
            const prevName = (prevSec.name || 'N/A').substring(0, 28).padEnd(28);
            const currName = (currSec.name || 'N/A').substring(0, 32).padEnd(32);
            const confidence = currSec.confidence ? `${currSec.confidence}%`.padStart(10) : 'N/A'.padStart(10);
            
            console.log(`${isin} | ${prevName} | ${currName} | ${confidence}`);
        }
    }

    calculateChange(oldValue, newValue) {
        if (oldValue === 0) return newValue > 0 ? '+∞%' : '0%';
        const change = ((newValue - oldValue) / oldValue * 100).toFixed(1);
        return change > 0 ? `+${change}%` : `${change}%`;
    }

    analyzeQuality() {
        const securities = this.newResults.securities || [];
        
        if (securities.length === 0) {
            console.log('❌ No securities to analyze');
            return;
        }
        
        // Name quality analysis
        const nameQualities = {
            good: securities.filter(s => 
                s.name && 
                !s.name.includes('Price to be verified') &&
                !s.name.includes('PRC:') &&
                !s.name.includes('UNKNOWN_SECURITY') &&
                !/^\d+\.\d+/.test(s.name)
            ).length,
            poor: securities.filter(s => 
                !s.name || 
                s.name.includes('Price to be verified') ||
                s.name.includes('PRC:') ||
                s.name.includes('UNKNOWN_SECURITY') ||
                /^\d+\.\d+/.test(s.name)
            ).length
        };
        
        // Value quality analysis
        const valueQualities = {
            reasonable: securities.filter(s => 
                s.marketValue >= 50000 && s.marketValue <= 10000000
            ).length,
            suspicious: securities.filter(s => 
                s.marketValue < 50000 || s.marketValue > 10000000
            ).length
        };
        
        // Confidence analysis
        const avgConfidence = securities.reduce((sum, s) => sum + (s.confidence || 0), 0) / securities.length;
        const highConfidence = securities.filter(s => (s.confidence || 0) >= 80).length;
        const lowConfidence = securities.filter(s => (s.confidence || 0) < 50).length;
        
        console.log(`📊 QUALITY METRICS:`);
        console.log(`   Names:       ${nameQualities.good}/${securities.length} good (${(nameQualities.good/securities.length*100).toFixed(1)}%)`);
        console.log(`   Values:      ${valueQualities.reasonable}/${securities.length} reasonable (${(valueQualities.reasonable/securities.length*100).toFixed(1)}%)`);
        console.log(`   Confidence:  ${avgConfidence.toFixed(1)}% average`);
        console.log(`   High Conf:   ${highConfidence}/${securities.length} securities ≥80% confidence`);
        console.log(`   Low Conf:    ${lowConfidence}/${securities.length} securities <50% confidence`);
        
        console.log('\n🎯 SAMPLE IMPROVED EXTRACTIONS:');
        console.log('================================');
        
        // Show best extractions (highest confidence)
        const bestExtractions = securities
            .filter(s => (s.confidence || 0) >= 70)
            .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
            .slice(0, 5);
            
        if (bestExtractions.length > 0) {
            console.log('Top quality extractions:');
            bestExtractions.forEach((sec, i) => {
                console.log(`  ${i+1}. ${sec.isin}: "${sec.name}" - $${sec.marketValue?.toLocaleString()} (${sec.confidence}% confidence)`);
            });
        }
        
        // Show problematic extractions (lowest confidence)
        const problematicExtractions = securities
            .filter(s => (s.confidence || 0) < 50)
            .sort((a, b) => (a.confidence || 0) - (b.confidence || 0))
            .slice(0, 3);
            
        if (problematicExtractions.length > 0) {
            console.log('\nLow confidence extractions (need review):');
            problematicExtractions.forEach((sec, i) => {
                console.log(`  ${i+1}. ${sec.isin}: "${sec.name}" - $${sec.marketValue?.toLocaleString()} (${sec.confidence}% confidence)`);
            });
        }
    }

    async saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await fs.writeFile(
            `improved-accuracy-results-${timestamp}.json`,
            JSON.stringify(this.newResults, null, 2)
        );
        
        console.log('\n💾 Results saved to:', `improved-accuracy-results-${timestamp}.json`);
    }
}

async function testImprovements() {
    const tester = new AccuracyTester();
    try {
        await tester.testImprovedAccuracy();
    } catch (error) {
        console.error('❌ Testing failed:', error);
    }
}

testImprovements();