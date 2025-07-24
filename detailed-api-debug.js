/**
 * DETAILED API DEBUG - Get full response from bulletproof processor
 */

const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function debugBulletproofProcessor() {
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    const endpoint = '/api/bulletproof-processor';
    
    console.log('🔍 DETAILED BULLETPROOF PROCESSOR DEBUG');
    console.log('=====================================\n');

    const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF file not found');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(pdfPath));
        
        console.log('📤 Uploading PDF and processing...');
        
        const response = await fetch(baseUrl + endpoint, {
            method: 'POST',
            body: formData,
            timeout: 60000
        });

        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            
            console.log('\n📋 FULL RESPONSE:');
            console.log('================');
            console.log(JSON.stringify(data, null, 2));
            
            console.log('\n🎯 KEY METRICS:');
            console.log('==============');
            console.log(`✅ Success: ${data.success}`);
            console.log(`📊 Securities found: ${data.securities?.length || 0}`);
            console.log(`💰 Total value: $${data.totalValue || 0}`);
            console.log(`📈 Accuracy: ${data.accuracy}%`);
            console.log(`🔧 Method: ${data.method || data.processingMethods?.[0] || 'unknown'}`);
            console.log(`⏱️ Processing time: ${data.processingTime}ms`);
            console.log(`🎯 Confidence: ${data.confidence}`);
            
            if (data.extractionMeta) {
                console.log('\n📝 EXTRACTION METADATA:');
                console.log('======================');
                console.log(`📄 Text length: ${data.extractionMeta.textLength}`);
                console.log(`🔍 ISINs detected: ${data.extractionMeta.isinsDetected}`);
                console.log(`💰 Values found: ${data.extractionMeta.valuesFound}`);
            }
            
            if (data.metadata) {
                console.log('\n🔧 PROCESSING METADATA:');
                console.log('======================');
                console.log(`🕒 Processing time: ${data.metadata.processingTime}`);
                console.log(`🎯 Target total: $${data.metadata.targetTotal}`);
                console.log(`✅ Legitimate extraction: ${data.metadata.legitimateExtraction}`);
                console.log(`🔧 Extraction method: ${data.metadata.extractionMethod}`);
            }
            
            if (data.pdfInfo) {
                console.log('\n📄 PDF INFO:');
                console.log('============');
                console.log(`📃 Pages: ${data.pdfInfo.pages}`);
                console.log(`📝 Text length: ${data.pdfInfo.textLength}`);
                console.log(`🖼️ OCR pages: ${data.pdfInfo.ocrPagesProcessed}`);
            }
            
            if (data.securities && data.securities.length > 0) {
                console.log('\n💎 SECURITIES FOUND:');
                console.log('===================');
                data.securities.forEach((sec, i) => {
                    console.log(`${i+1}. ${sec.isin}: $${sec.marketValue || sec.value || 0} (${sec.name || 'Unknown'})`);
                });
            } else {
                console.log('\n❌ NO SECURITIES FOUND - This is the problem!');
                console.log('===========================================');
                
                // Check if there's any indication of what went wrong
                if (data.error) {
                    console.log(`❌ Error: ${data.error}`);
                }
                if (data.message) {
                    console.log(`📝 Message: ${data.message}`);
                }
            }
            
        } else {
            console.log(`❌ Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log(`Response: ${text}`);
        }
        
    } catch (error) {
        console.log(`❌ Request error: ${error.message}`);
    }
}

debugBulletproofProcessor();