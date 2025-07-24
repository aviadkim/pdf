/**
 * Test current deployed accuracy with multi-agent system
 */

const fs = require('fs');
const FormData = require('form-data');
const https = require('https');

async function testCurrentAccuracy() {
    console.log('🚀 TESTING CURRENT DEPLOYED MULTI-AGENT SYSTEM');
    console.log('='.repeat(60));
    
    try {
        // Check if Messos PDF exists
        const pdfPath = '2. Messos  - 31.03.2025.pdf';
        if (!fs.existsSync(pdfPath)) {
            console.log('⚠️ Messos PDF not found - cannot test with real data');
            return;
        }
        
        console.log('📄 Loading Messos PDF for testing...');
        const pdfBuffer = fs.readFileSync(pdfPath);
        console.log(`📊 PDF Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
        
        // Create form data
        const form = new FormData();
        form.append('pdf', pdfBuffer, {
            filename: 'messos-test.pdf',
            contentType: 'application/pdf'
        });
        
        console.log('🤖 Testing Multi-Agent Extraction...');
        const startTime = Date.now();
        
        // Make request to multi-agent endpoint
        const response = await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'pdf-fzzi.onrender.com',
                port: 443,
                path: '/api/multi-agent-extract',
                method: 'POST',
                headers: form.getHeaders()
            }, resolve);
            
            req.on('error', reject);
            form.pipe(req);
        });
        
        const processingTime = Date.now() - startTime;
        
        // Read response
        let body = '';
        response.on('data', chunk => body += chunk);
        
        await new Promise(resolve => response.on('end', resolve));
        
        console.log(`📊 Response Status: ${response.statusCode}`);
        console.log(`⏱️ Processing Time: ${processingTime}ms`);
        
        if (response.statusCode !== 200) {
            console.log('❌ Request failed');
            console.log('Response:', body);
            return;
        }
        
        const result = JSON.parse(body);
        
        console.log('\\n📊 MULTI-AGENT SYSTEM RESULTS');
        console.log('='.repeat(50));
        console.log(`✅ Success: ${result.success}`);
        console.log(`🔧 Method: ${result.method}`);
        console.log(`📊 Accuracy: ${result.accuracy}%`);
        console.log(`🔢 Securities Found: ${result.securitiesFound}`);
        console.log(`💵 Total Value: $${result.totalValue?.toLocaleString() || 'N/A'}`);
        console.log(`💰 Cost: $${result.totalCost || 0}`);
        console.log(`🤝 Consensus Score: ${result.consensusScore}%`);
        console.log(`👁️ Vision API Used: ${result.visionApiUsed || false}`);
        
        // Agent contributions
        if (result.agentContributions) {
            console.log('\\n🤖 AGENT CONTRIBUTIONS');
            console.log('-'.repeat(40));
            const agents = result.agentContributions;
            
            if (agents.textAgent) {
                console.log(`📝 Text Agent: ${agents.textAgent.securities} securities, ${agents.textAgent.confidence}% confidence`);
            }
            
            if (agents.visionAgent) {
                console.log(`👁️ Vision Agent: ${agents.visionAgent.securities} securities, ${agents.visionAgent.confidence}% confidence`);
            }
            
            if (agents.validationAgent) {
                console.log(`🔍 Validation Agent: ${agents.validationAgent.consensusScore}% consensus`);
            }
        }
        
        // Accuracy analysis
        console.log('\\n📈 ACCURACY ANALYSIS');
        console.log('-'.repeat(40));
        const expectedTotal = 19464431;
        const expectedCount = 39;
        
        if (result.totalValue && result.securitiesFound) {
            const totalAccuracy = Math.min(result.totalValue / expectedTotal, expectedTotal / result.totalValue) * 100;
            const countAccuracy = Math.min(result.securitiesFound / expectedCount, expectedCount / result.securitiesFound) * 100;
            
            console.log(`💰 Portfolio Total Accuracy: ${totalAccuracy.toFixed(2)}%`);
            console.log(`🔢 Security Count Accuracy: ${countAccuracy.toFixed(2)}%`);
            console.log(`🎯 Overall System Accuracy: ${result.accuracy}%`);
            
            // Show sample securities
            if (result.securities && result.securities.length > 0) {
                console.log('\\n📋 SAMPLE SECURITIES');
                console.log('-'.repeat(30));
                result.securities.slice(0, 5).forEach((security, index) => {
                    console.log(`${index + 1}. ${security.isin}: $${security.marketValue?.toLocaleString() || 'N/A'}`);
                });
                if (result.securities.length > 5) {
                    console.log(`   ... and ${result.securities.length - 5} more`);
                }
            }
        }
        
        console.log('\\n🎯 SYSTEM ASSESSMENT');
        console.log('-'.repeat(40));
        
        if (result.accuracy >= 95) {
            console.log('🎉 EXCELLENT: Production-ready accuracy achieved!');
        } else if (result.accuracy >= 90) {
            console.log('✅ VERY GOOD: Strong performance, ready for production');
        } else {
            console.log('🔧 GOOD: Solid foundation, Vision API will improve accuracy');
        }
        
        return {
            success: result.success,
            accuracy: result.accuracy,
            securitiesFound: result.securitiesFound,
            visionApiUsed: result.visionApiUsed || false,
            totalValue: result.totalValue
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Run if called directly
if (require.main === module) {
    testCurrentAccuracy().then(result => {
        if (result.success && result.accuracy >= 90) {
            console.log('\\n🎉 SUCCESS: Multi-agent system is working with good accuracy!');
            process.exit(0);
        } else {
            console.log('\\n🔧 System needs optimization or API keys for better accuracy');
            process.exit(1);
        }
    }).catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testCurrentAccuracy };