// 🧪 Test Ultimate PDF Processor with Real Messos PDF
// Comprehensive test of the new family office system

const fs = require('fs');
const path = require('path');

async function testUltimateProcessor() {
    console.log('🧪 TESTING ULTIMATE PDF PROCESSOR');
    console.log('=================================');
    
    try {
        // Load the Messos PDF
        const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
        
        if (!fs.existsSync(pdfPath)) {
            throw new Error('Messos PDF not found');
        }
        
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        console.log('📄 PDF Loaded:');
        console.log(`   File: ${path.basename(pdfPath)}`);
        console.log(`   Size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Base64 length: ${pdfBase64.length} characters`);
        
        // Test 1: Ultimate PDF Processor (Production)
        console.log('\n🚀 Test 1: Ultimate PDF Processor (Production)');
        console.log('===============================================');
        
        const productionUrl = 'https://pdf-five-nu.vercel.app/api/ultimate-pdf-processor';
        
        const startTime = Date.now();
        
        const response = await fetch(productionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pdfBase64: pdfBase64,
                filename: '2. Messos  - 31.03.2025.pdf'
            })
        });
        
        const processingTime = Date.now() - startTime;
        
        console.log(`⏱️  Processing time: ${processingTime}ms`);
        console.log(`📊 Response status: ${response.status}`);
        console.log(`📝 Response headers:`, Object.fromEntries(response.headers));
        
        if (response.ok) {
            const result = await response.json();
            
            console.log('\n✅ SUCCESS - Ultimate Processor Results:');
            console.log('========================================');
            console.log(`📊 Holdings found: ${result.data?.holdings?.length || 0}`);
            console.log(`💰 Total value: ${result.data?.portfolioInfo?.totalValue?.toLocaleString() || 'N/A'}`);
            console.log(`🔧 Processing method: ${result.data?.portfolioInfo?.processingMethod || 'N/A'}`);
            console.log(`⏱️  Processing time: ${result.metadata?.processingTime || 'N/A'}`);
            console.log(`📄 Pages processed: ${result.metadata?.pagesProcessed || 'N/A'}`);
            console.log(`🎯 Confidence: ${result.metadata?.confidence || 0}%`);
            console.log(`🔷 Azure used: ${result.metadata?.azureUsed ? 'YES' : 'NO'}`);
            console.log(`👁️  Claude used: ${result.metadata?.claudeUsed ? 'YES' : 'NO'}`);
            
            // Show sample holdings
            if (result.data?.holdings && result.data.holdings.length > 0) {
                console.log('\n📋 Sample Holdings (first 5):');
                console.log('============================');
                result.data.holdings.slice(0, 5).forEach((holding, index) => {
                    console.log(`${index + 1}. ${holding.securityName}`);
                    console.log(`   ISIN: ${holding.isin}`);
                    console.log(`   Value: ${holding.currentValue?.toLocaleString()} ${holding.currency}`);
                    console.log(`   Source: ${holding.source || 'N/A'}`);
                    console.log('');
                });
            }
            
            // Test CSV download
            console.log('\n📥 Test 2: CSV Download');
            console.log('=======================');
            
            const csvResponse = await fetch('https://pdf-five-nu.vercel.app/api/download-csv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    holdings: result.data.holdings,
                    portfolioInfo: result.data.portfolioInfo,
                    filename: '2. Messos  - 31.03.2025.pdf'
                })
            });
            
            if (csvResponse.ok) {
                const csvData = await csvResponse.text();
                console.log(`✅ CSV generated successfully`);
                console.log(`📊 CSV size: ${csvData.length} characters`);
                console.log(`📝 CSV lines: ${csvData.split('\\n').length}`);
                
                // Save CSV for inspection
                fs.writeFileSync('messos_extraction_results.csv', csvData);
                console.log('💾 CSV saved as: messos_extraction_results.csv');
            } else {
                console.log('❌ CSV download failed:', await csvResponse.text());
            }
            
        } else {
            const errorText = await response.text();
            console.log('❌ FAILED - Ultimate Processor Error:');
            console.log('====================================');
            console.log(errorText);
        }
        
        // Test 3: Family Office Interface
        console.log('\n🏛️ Test 3: Family Office Interface');
        console.log('==================================');
        
        const interfaceResponse = await fetch('https://pdf-five-nu.vercel.app/api/family-office-upload', {
            method: 'GET'
        });
        
        if (interfaceResponse.ok) {
            const interfaceHtml = await interfaceResponse.text();
            console.log(`✅ Family Office interface loaded`);
            console.log(`📄 HTML size: ${interfaceHtml.length} characters`);
            console.log(`🔗 Interface URL: https://pdf-five-nu.vercel.app/api/family-office-upload`);
        } else {
            console.log('❌ Family Office interface failed');
        }
        
        // Final summary
        console.log('\n📊 FINAL TEST SUMMARY');
        console.log('=====================');
        console.log(`✅ Ultimate PDF Processor: ${response.ok ? 'WORKING' : 'FAILED'}`);
        console.log(`📥 CSV Download: ${csvResponse?.ok ? 'WORKING' : 'FAILED'}`);
        console.log(`🏛️ Family Office Interface: ${interfaceResponse?.ok ? 'WORKING' : 'FAILED'}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log(`🎯 Target: 42 holdings`);
            console.log(`📊 Actual: ${result.data?.holdings?.length || 0} holdings`);
            console.log(`✅ Success: ${result.data?.holdings?.length >= 30 ? 'YES' : 'NEEDS IMPROVEMENT'}`);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Add fetch polyfill for Node.js
if (!global.fetch) {
    global.fetch = require('node-fetch');
}

// Run the test
testUltimateProcessor().catch(console.error);