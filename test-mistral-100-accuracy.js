const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🔮 TESTING MISTRAL 100% ACCURACY ENDPOINT');
console.log('========================================');

async function testMistral100() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    console.log('📁 Using Messos PDF for accuracy test...');
    console.log('🎯 Target: $19,464,431 (100% accuracy)');
    console.log('📊 Current: $16,351,723 (84.01% accuracy)');
    console.log('💰 Gap to close: $3,112,708');
    
    return new Promise((resolve) => {
        const form = new FormData();
        form.append('pdf', fs.createReadStream(pdfPath));
        
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: '/api/mistral-supervised',
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 120000
        };
        
        console.log('🚀 Sending request to Render Mistral endpoint...');
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('📊 Response Status:', res.statusCode);
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        
                        console.log('\\n🎉 MISTRAL 100% RESULTS:');
                        console.log('========================');
                        console.log('📊 Securities Found:', result.securities ? result.securities.length : 0);
                        console.log('💰 Total Value: $' + (result.totalValue || 0).toLocaleString());
                        console.log('🎯 Accuracy:', result.accuracy || 0, '%');
                        console.log('⏱️ Processing Time:', result.processingTime || 0, 'ms');
                        console.log('🔮 Method:', result.metadata ? result.metadata.extractionMethod : 'unknown');
                        console.log('💵 Estimated Cost:', result.metadata ? result.metadata.estimatedCost : 'N/A');
                        
                        const accuracy = parseFloat(result.accuracy || 0);
                        const totalValue = result.totalValue || 0;
                        
                        if (accuracy >= 95) {
                            console.log('\\n🎉 SUCCESS! MISTRAL ACHIEVED 95%+ ACCURACY!');
                            console.log('✅ System now ready for production use');
                        } else if (accuracy > 84) {
                            console.log('\\n📈 IMPROVEMENT! Accuracy increased from 84.01%');
                            console.log('✅ Additional $' + (totalValue - 16351723).toLocaleString() + ' extracted');
                        } else {
                            console.log('\\n⚠️ Mistral processing might not be active');
                        }
                        
                        if (result.metadata && result.metadata.mistralAvailable === false) {
                            console.log('\\n❌ MISTRAL API KEY NOT FOUND');
                            console.log('💡 Need to configure MISTRAL_API_KEY in Render environment');
                        } else if (result.metadata && result.metadata.mistralAvailable === true) {
                            console.log('\\n✅ MISTRAL API KEY ACTIVE');
                        }
                        
                        if (result.securities && result.securities.length > 0) {
                            console.log('\\n🔝 TOP SECURITIES:');
                            result.securities.slice(0, 10).forEach((sec, i) => {
                                const corrected = sec.mistralCorrected ? ' (Mistral corrected)' : '';
                                console.log((i + 1) + '. ' + sec.isin + ': $' + sec.marketValue.toLocaleString() + corrected);
                            });
                        }
                        
                    } catch (error) {
                        console.log('❌ JSON Parse Error:', error.message);
                        console.log('Response preview:', data.substring(0, 300));
                    }
                } else {
                    console.log('❌ HTTP Error', res.statusCode);
                    console.log('Error response:', data.substring(0, 500));
                }
                
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Request Error:', error.message);
            resolve();
        });
        
        req.on('timeout', () => {
            console.log('⏱️ Request Timeout (2 minutes)');
            console.log('💡 Mistral processing may take time for complex documents');
            req.destroy();
            resolve();
        });
        
        form.pipe(req);
    });
}

testMistral100().then(() => {
    console.log('\\n🔗 Endpoint: https://pdf-fzzi.onrender.com/api/mistral-supervised');
    console.log('💡 If Mistral not active, configure MISTRAL_API_KEY in Render dashboard');
});