/**
 * Health check script for Docker/Render deployment
 */

const http = require('http');

const options = {
    hostname: 'localhost',
    port: process.env.PORT || 10000,
    path: '/health',
    method: 'GET',
    timeout: 3000
};

const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const health = JSON.parse(data);
            if (health.status === 'healthy') {
                console.log('✅ Health check passed');
                process.exit(0);
            } else {
                console.log('❌ Health check failed - unhealthy status');
                process.exit(1);
            }
        } catch (error) {
            console.log('❌ Health check failed - invalid response');
            process.exit(1);
        }
    });
});

req.on('error', (error) => {
    console.log(`❌ Health check failed - ${error.message}`);
    process.exit(1);
});

req.on('timeout', () => {
    console.log('❌ Health check failed - timeout');
    req.destroy();
    process.exit(1);
});

req.setTimeout(3000);
req.end();