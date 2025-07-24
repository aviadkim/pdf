#!/usr/bin/env node

/**
 * 🚀 RENDER DEPLOYMENT STATUS CHECKER
 * Verifies Render deployment and provides deployment instructions
 */

const https = require('https');
const { exec } = require('child_process');

console.log('🔍 RENDER DEPLOYMENT STATUS CHECK');
console.log('==================================\n');

// Check if render.yaml exists
const fs = require('fs');
const path = require('path');

const renderYamlPath = path.join(__dirname, 'render.yaml');
if (fs.existsSync(renderYamlPath)) {
    console.log('✅ render.yaml found');
    const renderConfig = fs.readFileSync(renderYamlPath, 'utf8');
    console.log('📄 Current render.yaml configuration:');
    console.log(renderConfig);
} else {
    console.log('❌ render.yaml not found');
}

// Check various possible URLs
const urlsToCheck = [
    'https://pdf-fzzi.onrender.com',
    'https://smart-ocr-learning-system.onrender.com',
    'https://pdf-fzzi.onrender.com/api/smart-ocr-test',
    'https://smart-ocr-learning-system.onrender.com/api/smart-ocr-test'
];

console.log('\n🌐 CHECKING DEPLOYMENT URLS');
console.log('============================');

urlsToCheck.forEach((url, index) => {
    setTimeout(() => {
        const req = https.get(url, { timeout: 10000 }, (res) => {
            console.log(`✅ ${url} - Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log(`   🎯 SUCCESS: Application is running at ${url}`);
            }
        });
        
        req.on('error', (err) => {
            console.log(`❌ ${url} - Error: ${err.message}`);
        });
        
        req.on('timeout', () => {
            console.log(`⏱️  ${url} - Timeout`);
        });
    }, index * 1000);
});

// Provide deployment instructions
setTimeout(() => {
    console.log('\n📋 DEPLOYMENT INSTRUCTIONS');
    console.log('===========================');
    console.log('If the smart-ocr service is not deployed:');
    console.log('');
    console.log('1. Log into Render.com dashboard');
    console.log('2. Click "New +" → "Web Service"');
    console.log('3. Connect your GitHub repository');
    console.log('4. Use these settings:');
    console.log('   - Name: smart-ocr-learning-system');
    console.log('   - Environment: Docker');
    console.log('   - Dockerfile Path: ./Dockerfile.smart-ocr');
    console.log('   - Build Command: (leave empty for Docker)');
    console.log('   - Start Command: npm start');
    console.log('5. Set environment variables:');
    console.log('   - NODE_ENV=production');
    console.log('   - PORT=10002');
    console.log('   - MISTRAL_API_KEY=your_actual_key');
    console.log('   - MISTRAL_ENDPOINT=https://api.mistral.ai/v1');
    console.log('');
    console.log('💡 The render.yaml file should auto-configure this if you use Render CLI');
}, 6000);