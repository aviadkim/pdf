/**
 * Test the working bulletproof-processor endpoint to get current accuracy
 */

const fs = require('fs');
const FormData = require('form-data');
const https = require('https');

async function testWorkingEndpoint() {
    console.log('🚀 TESTING WORKING BULLETPROOF-PROCESSOR ENDPOINT');
    console.log('='.repeat(60));
    
    try {
        // Check if Messos PDF exists
        const pdfPath = '2. Messos  - 31.03.2025.pdf';
        if (!fs.existsSync(pdfPath)) {
            console.log('⚠️ Messos PDF not found');
            return;
        }
        
        console.log('📄 Loading Messos PDF...');
        const pdfBuffer = fs.readFileSync(pdfPath);
        console.log(`📊 PDF Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
        
        // Create form data
        const form = new FormData();
        form.append('pdf', pdfBuffer, {
            filename: 'messos-test.pdf',
            contentType: 'application/pdf'
        });
        
        console.log('🤖 Testing Bulletproof Processor...');
        const startTime = Date.now();
        
        // Make request to working endpoint
        const response = await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'pdf-fzzi.onrender.com',
                port: 443,
                path: '/api/bulletproof-processor',
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
        
        console.log('\\n📊 BULLETPROOF PROCESSOR RESULTS');
        console.log('='.repeat(50));
        console.log(`✅ Success: ${result.success}`);
        console.log(`🔧 Method: ${result.method}`);
        console.log(`📊 Accuracy: ${result.accuracy}%`);
        console.log(`🔢 Securities Found: ${result.securities_found}`);
        console.log(`💵 Total Value: $${result.total_value?.toLocaleString() || 'N/A'}`);
        console.log(`⏱️ Processing Time: ${result.processing_time}ms`);
        
        // Accuracy analysis
        console.log('\\n📈 ACCURACY ANALYSIS');
        console.log('-'.repeat(40));
        const expectedTotal = 19464431;
        const expectedCount = 39;
        
        if (result.total_value && result.securities_found) {
            const totalAccuracy = Math.min(result.total_value / expectedTotal, expectedTotal / result.total_value) * 100;
            const countAccuracy = Math.min(result.securities_found / expectedCount, expectedCount / result.securities_found) * 100;
            
            console.log(`💰 Portfolio Total Accuracy: ${totalAccuracy.toFixed(2)}%`);
            console.log(`🔢 Security Count Accuracy: ${countAccuracy.toFixed(2)}%`);
            console.log(`🎯 Overall System Accuracy: ${result.accuracy}%`);
            
            // Show sample securities
            if (result.securities && result.securities.length > 0) {
                console.log('\\n📋 SAMPLE SECURITIES');
                console.log('-'.repeat(30));
                result.securities.slice(0, 5).forEach((security, index) => {
                    console.log(`${index + 1}. ${security.isin}: $${security.market_value?.toLocaleString() || 'N/A'} (${security.category})`);
                });
                if (result.securities.length > 5) {
                    console.log(`   ... and ${result.securities.length - 5} more`);
                }
            }
        }
        
        console.log('\\n🎯 CHATGPT API STATUS');
        console.log('-'.repeat(40));
        console.log('ℹ️ Current system uses enhanced text extraction');
        console.log('🔧 Multi-agent system needs PDF buffer fix');
        console.log('💡 Working accuracy shows system potential');
        
        return {
            success: result.success,
            accuracy: result.accuracy,
            securitiesFound: result.securities_found,
            totalValue: result.total_value,
            workingSystem: true
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Run if called directly
if (require.main === module) {
    testWorkingEndpoint().then(result => {
        if (result.success && result.accuracy >= 90) {
            console.log('\\n🎉 SUCCESS: Working system shows excellent accuracy!');
            console.log('🔧 Multi-agent system just needs buffer format fix');
            process.exit(0);
        } else {
            console.log('\\n🔧 System working but needs optimization');
            process.exit(1);
        }
    }).catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testWorkingEndpoint };