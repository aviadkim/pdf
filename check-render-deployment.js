// Check Render Deployment Status and Force Update
const axios = require('axios');
const fs = require('fs');

const RENDER_URL = 'https://pdf-fzzi.onrender.com';
const LOCAL_URL = 'http://localhost:10001';

async function checkDeploymentStatus() {
    console.log('🔍 CHECKING RENDER DEPLOYMENT STATUS');
    console.log('=====================================');
    
    try {
        // Check if Render is responding
        console.log('📡 Testing Render connectivity...');
        const renderResponse = await axios.get(RENDER_URL, { timeout: 10000 });
        console.log('✅ Render is accessible');
        
        // Check local server
        console.log('📡 Testing local server...');
        try {
            const localResponse = await axios.get(LOCAL_URL, { timeout: 5000 });
            console.log('✅ Local server is running');
        } catch (error) {
            console.log('❌ Local server is not running');
        }
        
        // Compare versions by checking response content
        const renderContent = renderResponse.data;
        
        // Check if new features are deployed
        const hasMultiAgent = renderContent.includes('Multi-Agent Processing');
        const hasUltimateFeatures = renderContent.includes('100% accuracy') || renderContent.includes('Ultimate');
        
        console.log('🔍 Feature Detection:');
        console.log(`  Multi-Agent Processing: ${hasMultiAgent ? '✅' : '❌'}`);
        console.log(`  Ultimate Features: ${hasUltimateFeatures ? '✅' : '❌'}`);
        
        if (!hasUltimateFeatures) {
            console.log('⚠️  Render appears to be running old version');
            console.log('📦 Latest code may not be deployed');
        }
        
        // Check endpoints
        console.log('\n🔍 ENDPOINT AVAILABILITY CHECK');
        console.log('==============================');
        
        const endpoints = [
            '/api/bulletproof-processor',
            '/api/complete-processor'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(RENDER_URL + endpoint, { timeout: 5000 });
                console.log(`✅ ${endpoint}: Available`);
            } catch (error) {
                if (error.response && error.response.status === 405) {
                    console.log(`✅ ${endpoint}: Available (Method Not Allowed - expected for POST)`);
                } else {
                    console.log(`❌ ${endpoint}: Not available (${error.message})`);
                }
            }
        }
        
        return {
            renderAccessible: true,
            hasMultiAgent,
            hasUltimateFeatures,
            needsDeployment: !hasUltimateFeatures
        };
        
    } catch (error) {
        console.error('❌ Render deployment check failed:', error.message);
        return {
            renderAccessible: false,
            error: error.message,
            needsDeployment: true
        };
    }
}

async function generateDeploymentInstructions() {
    console.log('\n🚀 MANUAL DEPLOYMENT INSTRUCTIONS');
    console.log('==================================');
    
    const instructions = [
        '1. 📱 Go to Render Dashboard (https://dashboard.render.com)',
        '2. 🔍 Find your PDF service (pdf-fzzi)',
        '3. 📋 Click on the service name',
        '4. 🔄 Click "Manual Deploy" button',
        '5. 🎯 Select "Deploy latest commit"',
        '6. ⏳ Wait for deployment to complete (5-10 minutes)',
        '7. ✅ Test the deployment with the test suite'
    ];
    
    instructions.forEach(instruction => console.log(instruction));
    
    console.log('\n🔧 AUTO-DEPLOYMENT SETUP');
    console.log('=========================');
    
    const autoDeploySteps = [
        '1. 🔗 In Render Dashboard, go to service settings',
        '2. 🔄 Enable "Auto-Deploy" option',
        '3. 📍 Set branch to "main"',
        '4. 🔗 Connect to GitHub repository',
        '5. 🎯 Set build command: "npm install"',
        '6. 🚀 Set start command: "node express-server.js"',
        '7. ✅ Save settings'
    ];
    
    autoDeploySteps.forEach(step => console.log(step));
}

async function waitForDeployment() {
    console.log('\n⏳ WAITING FOR DEPLOYMENT...');
    console.log('============================');
    
    const maxWaitTime = 600000; // 10 minutes
    const checkInterval = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        try {
            const response = await axios.get(RENDER_URL);
            const content = response.data;
            
            if (content.includes('Ultimate') || content.includes('100% accuracy')) {
                console.log('✅ NEW VERSION DEPLOYED!');
                return true;
            }
            
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            console.log(`⏳ Still waiting... (${elapsed}s elapsed)`);
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            
        } catch (error) {
            console.log('❌ Error checking deployment:', error.message);
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
    }
    
    console.log('⏰ Deployment wait timeout');
    return false;
}

async function main() {
    console.log('🎯 RENDER DEPLOYMENT DIAGNOSTIC TOOL');
    console.log('====================================');
    
    const status = await checkDeploymentStatus();
    
    if (status.needsDeployment) {
        console.log('\n❗ DEPLOYMENT REQUIRED');
        await generateDeploymentInstructions();
        
        // Ask if user wants to wait for deployment
        console.log('\n💡 After triggering manual deployment, run this script again to verify');
        console.log('   Or wait and this script will monitor for changes...');
        
        const deployed = await waitForDeployment();
        
        if (deployed) {
            console.log('\n🎉 DEPLOYMENT SUCCESSFUL!');
            console.log('Run the test suite again to verify accuracy improvements');
        } else {
            console.log('\n⚠️  Deployment not detected within timeout');
            console.log('Check Render dashboard for deployment status');
        }
    } else {
        console.log('\n✅ DEPLOYMENT APPEARS UP TO DATE');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { checkDeploymentStatus, waitForDeployment };