const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const RENDER_URL = 'https://pdf-fzzi.onrender.com';
const PDF_PATH = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
const EXPECTED_TARGET = 19464431;

async function analyzeRenderResults() {
    console.log('🔍 Analyzing Render deployment results...');
    
    try {
        // Create form data
        const form = new FormData();
        form.append('pdf', fs.createReadStream(PDF_PATH));
        
        // Make the request
        const response = await axios.post(`${RENDER_URL}/api/bulletproof-processor`, form, {
            headers: {
                ...form.getHeaders(),
            },
            timeout: 120000
        });
        
        const result = response.data;
        const securities = result.securities || result.extractedData || [];
        
        console.log('\n📊 COMPLETE PORTFOLIO ANALYSIS:');
        console.log('=====================================');
        
        let totalValue = 0;
        let currencyBreakdown = {};
        let foundProblematicISIN = false;
        let problematicValue = null;
        
        console.log('All Securities:');
        securities.forEach((security, index) => {
            const value = security.value || security.amount || security.notionalAmount || 0;
            totalValue += value;
            
            if (security.currency) {
                currencyBreakdown[security.currency] = (currencyBreakdown[security.currency] || 0) + value;
            }
            
            if (security.isin === 'XS2746319610') {
                foundProblematicISIN = true;
                problematicValue = value;
            }
            
            console.log(`${index + 1}. ${security.isin} - ${security.name || 'Unknown'}`);
            console.log(`   Value: $${value.toLocaleString()} ${security.currency || 'USD'}`);
            console.log(`   Method: ${security.extractionMethod || 'Unknown'}`);
            console.log('');
        });
        
        console.log('\n💰 PORTFOLIO SUMMARY:');
        console.log('=====================================');
        console.log(`Total Securities: ${securities.length}`);
        console.log(`Total Portfolio Value: $${totalValue.toLocaleString()}`);
        console.log(`Expected Target: $${EXPECTED_TARGET.toLocaleString()}`);
        console.log(`Difference: $${Math.abs(totalValue - EXPECTED_TARGET).toLocaleString()}`);
        console.log(`Accuracy: ${((Math.min(totalValue, EXPECTED_TARGET) / Math.max(totalValue, EXPECTED_TARGET)) * 100).toFixed(2)}%`);
        
        console.log('\n💱 CURRENCY BREAKDOWN:');
        console.log('=====================================');
        Object.entries(currencyBreakdown).forEach(([currency, value]) => {
            console.log(`${currency}: $${value.toLocaleString()}`);
        });
        
        console.log('\n🔍 SPECIFIC CHECKS:');
        console.log('=====================================');
        
        if (foundProblematicISIN) {
            console.log(`✅ Found XS2746319610 with value: $${problematicValue.toLocaleString()}`);
            if (problematicValue > 10000000) {
                console.log('❌ Still showing inflated value!');
            } else {
                console.log('✅ Value appears corrected from $12M issue');
            }
        } else {
            console.log('❌ XS2746319610 not found in results');
        }
        
        // Check for any suspicious high values
        console.log('\n🚨 HIGH VALUE SECURITIES (>$1M):');
        console.log('=====================================');
        securities.forEach(security => {
            const value = security.value || security.amount || security.notionalAmount || 0;
            if (value > 1000000) {
                console.log(`${security.isin}: $${value.toLocaleString()} - ${security.name || 'Unknown'}`);
            }
        });
        
        // Check for enhancement detection
        console.log('\n🔧 ENHANCEMENT STATUS:');
        console.log('=====================================');
        console.log(`Enhanced Extraction: ${result.enhancedExtraction ? 'YES' : 'NO'}`);
        console.log(`Processing Method: ${result.processingMethod || 'Unknown'}`);
        console.log(`Accuracy Reported: ${result.accuracy || 'Not reported'}`);
        console.log(`Message: ${result.message || 'No message'}`);
        
        return {
            success: true,
            totalSecurities: securities.length,
            totalValue,
            expectedTarget: EXPECTED_TARGET,
            accuracy: ((Math.min(totalValue, EXPECTED_TARGET) / Math.max(totalValue, EXPECTED_TARGET)) * 100).toFixed(2),
            foundProblematicISIN,
            problematicValue,
            enhancedExtraction: result.enhancedExtraction || false
        };
        
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Run if called directly
if (require.main === module) {
    analyzeRenderResults()
        .then(result => {
            console.log('\n📋 FINAL ANALYSIS SUMMARY:');
            console.log('=====================================');
            console.log(JSON.stringify(result, null, 2));
        })
        .catch(console.error);
}

module.exports = analyzeRenderResults;