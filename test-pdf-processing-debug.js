#!/usr/bin/env node

/**
 * Debug PDF Processing Issues
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function debugPDFProcessing() {
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    const pdfPath = './2. Messos  - 31.03.2025.pdf';

    console.log('🔍 Debug PDF Processing Issues');
    console.log('===============================');

    // Check if PDF exists
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF file not found:', pdfPath);
        return;
    }

    console.log('✅ PDF file found:', pdfPath);
    const stats = fs.statSync(pdfPath);
    console.log(`📄 PDF size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    try {
        // Test PDF processing endpoint
        console.log('\n🧪 Testing /api/smart-ocr-process...');
        
        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(pdfPath));

        const response = await axios.post(`${baseUrl}/api/smart-ocr-process`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 30000
        });

        console.log('✅ PDF Processing successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('❌ PDF Processing failed');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }

    // Test if the issue is the deployment not updating
    try {
        console.log('\n🔍 Testing system status...');
        const statsResponse = await axios.get(`${baseUrl}/api/smart-ocr-stats`);
        console.log('Stats:', JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
        console.log('❌ Stats error:', error.message);
    }
}

if (require.main === module) {
    debugPDFProcessing().catch(console.error);
}

module.exports = { debugPDFProcessing };