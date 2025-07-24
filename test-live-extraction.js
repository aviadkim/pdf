// 🚀 Live Extraction Test - Test SuperClaude YOLO on Messos PDF
import fs from 'fs';
import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3001';
const PDF_PATH = './2. Messos  - 31.03.2025.pdf';

async function testLiveExtraction() {
    console.log('🏦 LIVE EXTRACTION TEST');
    console.log('🎯 Testing SuperClaude YOLO on Messos PDF');
    console.log('='.repeat(60));
    
    try {
        // Check if PDF exists
        if (!fs.existsSync(PDF_PATH)) {
            console.error(`❌ PDF not found: ${PDF_PATH}`);
            return;
        }
        
        console.log(`📄 Loading PDF: ${PDF_PATH}`);
        const pdfBuffer = fs.readFileSync(PDF_PATH);
        const pdfBase64 = pdfBuffer.toString('base64');
        console.log(`📊 PDF Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
        
        console.log('\n🚀 Testing SuperClaude YOLO processor...');
        const startTime = Date.now();
        
        const response = await fetch(`${SERVER_URL}/api/superclaude-yolo-ultimate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pdfBase64: pdfBase64,
                filename: '2. Messos - 31.03.2025.pdf'
            })
        });
        
        const processingTime = Date.now() - startTime;
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('✅ EXTRACTION SUCCESSFUL!');
            console.log(`⏱️  Processing Time: ${processingTime}ms`);
            console.log(`💰 Total Value: $${result.data?.totalValue?.toLocaleString() || 'N/A'}`);
            console.log(`📊 Securities Found: ${result.data?.holdings?.length || 0}`);
            
            // Show first 5 securities as sample
            if (result.data?.holdings && result.data.holdings.length > 0) {
                console.log('\n📋 SAMPLE SECURITIES (First 5):');
                console.log('-'.repeat(80));
                
                result.data.holdings.slice(0, 5).forEach((security, index) => {
                    console.log(`${index + 1}. ${security.name || 'N/A'}`);
                    console.log(`   ISIN: ${security.isin || 'N/A'}`);
                    console.log(`   Value: $${security.marketValue?.toLocaleString() || 'N/A'}`);
                    console.log(`   Currency: ${security.currency || 'N/A'}`);
                    console.log('');
                });
                
                console.log(`... and ${result.data.holdings.length - 5} more securities`);
            }
            
            // Show accuracy analysis
            const targetSecurities = 38;
            const foundSecurities = result.data?.holdings?.length || 0;
            const accuracy = (foundSecurities / targetSecurities) * 100;
            
            console.log('\n🎯 ACCURACY ANALYSIS:');
            console.log('-'.repeat(60));
            console.log(`📊 Securities Found: ${foundSecurities}`);
            console.log(`🎯 Target Securities: ${targetSecurities}`);
            console.log(`📈 Extraction Accuracy: ${accuracy.toFixed(1)}%`);
            
            if (accuracy >= 85) {
                console.log('🏆 EXCELLENT: High accuracy achieved!');
            } else if (accuracy >= 70) {
                console.log('✅ GOOD: Reasonable extraction rate');
            } else {
                console.log('⚠️ PARTIAL: Room for improvement');
            }
            
        } else {
            console.log('❌ EXTRACTION FAILED');
            console.log(`Error: ${result.error}`);
            if (result.details) {
                console.log(`Details: ${result.details}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testLiveExtraction();