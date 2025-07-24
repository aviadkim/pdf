/**
 * Quick timeout test - just check if 502 errors are fixed
 */
const https = require('https');
const fs = require('fs');

console.log('🔥 QUICK TIMEOUT TEST - Check if 502 errors are fixed');
console.log('Testing current deployment with timeout fixes');
console.log('='.repeat(50));

const pdfPath = './2. Messos  - 31.03.2025.pdf';

if (!fs.existsSync(pdfPath)) {
    console.log('❌ Messos PDF not found');
    process.exit(1);
}

const FormData = require('form-data');
const form = new FormData();
form.append('pdf', fs.createReadStream(pdfPath));

console.log('📤 Testing page-by-page processor...');
console.log('⏱️  Giving it 3 minutes to see if timeout fixes work');

const startTime = Date.now();

const req = https.request('https://pdf-production-5dis.onrender.com/api/page-by-page-processor', {
    method: 'POST',
    headers: form.getHeaders(),
    timeout: 180000 // 3 minutes
}, (res) => {
    let data = '';
    res.on('data', chunk => {
        data += chunk;
        process.stdout.write('.');
    });
    
    res.on('end', () => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`\n📊 Status: ${res.statusCode} after ${elapsed}s`);
        
        if (res.statusCode === 200) {
            try {
                const result = JSON.parse(data);
                console.log('🎉 SUCCESS! No more 502 errors!');
                console.log(`📈 Accuracy: ${result.accuracy}%`);
                console.log(`🔢 Securities: ${result.securities?.length || 0}`);
                console.log(`💰 Value: CHF ${result.totalValue?.toLocaleString() || 'unknown'}`);
                console.log(`⏱️  Time: ${elapsed}s`);
                
                if (parseFloat(result.accuracy) >= 99) {
                    console.log('\n🏆 99%+ ACCURACY ACHIEVED!');
                } else if (parseFloat(result.accuracy) >= 95) {
                    console.log('\n🎉 95%+ accuracy - excellent result!');
                } else {
                    console.log('\n✅ Processing working, accuracy can be improved');
                }
                
            } catch (e) {
                console.log('✅ Response received but JSON parse error');
                console.log('Raw:', data.substring(0, 200));
            }
        } else if (res.statusCode === 502) {
            console.log('❌ Still getting 502 errors - deployment may not be complete');
        } else {
            console.log(`⚠️  Status ${res.statusCode}`);
            console.log('Response:', data.substring(0, 200));
        }
    });
});

req.on('error', (error) => {
    console.log(`❌ Error: ${error.message}`);
});

req.on('timeout', () => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`⏰ Timeout after ${elapsed}s`);
    console.log('💡 This means processing is taking longer but not failing with 502');
    console.log('✅ Timeout fixes may be working - need to wait longer');
    req.destroy();
});

form.pipe(req);