// Comprehensive MCP Enhanced PDF OCR Testing Suite
const fs = require('fs');
const path = require('path');

async function testMCPFeatures() {
    console.log('🚀 Testing MCP-Enhanced PDF OCR Features');
    console.log('========================================\n');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    // Test 1: Health Check with MCP Features
    console.log('📊 Test 1: Health Check with MCP Features');
    try {
        const response = await fetch(`${baseUrl}/api/test`);
        const result = await response.json();
        
        console.log('✅ Health Check Result:');
        console.log(`   Status: ${result.status}`);
        console.log(`   Message: ${result.message}`);
        console.log(`   Features:`, result.features);
        console.log(`   MCP Mode: ${result.features?.mcpMode || 'N/A'}`);
        console.log(`   OCR Worker: ${result.features?.ocrWorker ? '✅' : '❌'}`);
        console.log(`   Browser Pool: ${result.features?.browserPool ? '✅' : '❌'}`);
        console.log('');
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
    }
    
    // Test 2: Enhanced PDF Extraction (Test Mode)
    console.log('📊 Test 2: Enhanced PDF Extraction (Test Mode)');
    try {
        const response = await fetch(`${baseUrl}/api/pdf-extract-enhanced`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testMode: true })
        });
        
        const result = await response.json();
        
        console.log('✅ Enhanced PDF Extraction Test Mode:');
        console.log(`   Success: ${result.success}`);
        console.log(`   Processing Methods: ${result.extractedData?.processingMethods?.join(', ') || 'N/A'}`);
        console.log(`   Confidence: ${result.extractedData?.confidence || 'N/A'}`);
        console.log(`   Securities Found: ${result.extractedData?.securities?.length || 0}`);
        
        if (result.extractedData?.securities?.length > 0) {
            const security = result.extractedData.securities[0];
            console.log(`   Sample Security: ${security.isin} - ${security.name} - ${security.currency} ${security.value.toLocaleString()}`);
            console.log(`   Extraction Method: ${security.extractionMethod || 'N/A'}`);
        }
        console.log('');
    } catch (error) {
        console.error('❌ Enhanced PDF extraction test failed:', error.message);
    }
    
    // Test 3: PDF to Images Conversion
    console.log('📊 Test 3: PDF to Images Conversion');
    try {
        // Use a simple PDF for testing
        const testPdfContent = `
        %PDF-1.4
        1 0 obj
        <<
        /Type /Catalog
        /Pages 2 0 R
        >>
        endobj
        
        2 0 obj
        <<
        /Type /Pages
        /Kids [3 0 R]
        /Count 1
        >>
        endobj
        
        3 0 obj
        <<
        /Type /Page
        /Parent 2 0 R
        /MediaBox [0 0 612 792]
        /Contents 4 0 R
        >>
        endobj
        
        4 0 obj
        <<
        /Length 44
        >>
        stream
        BT
        /F1 12 Tf
        100 700 Td
        (Test PDF Content) Tj
        ET
        endstream
        endobj
        
        xref
        0 5
        0000000000 65535 f 
        0000000009 00000 n 
        0000000074 00000 n 
        0000000120 00000 n 
        0000000179 00000 n 
        trailer
        <<
        /Size 5
        /Root 1 0 R
        >>
        startxref
        274
        %%EOF
        `;
        
        const testBase64 = Buffer.from(testPdfContent).toString('base64');
        
        const response = await fetch(`${baseUrl}/api/pdf-to-images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                pdfBase64: testBase64,
                options: { maxPages: 1, quality: 60 }
            })
        });
        
        const result = await response.json();
        
        console.log('✅ PDF to Images Conversion:');
        console.log(`   Success: ${result.success}`);
        console.log(`   Total Pages: ${result.totalPages || 0}`);
        console.log(`   Images Generated: ${result.images?.length || 0}`);
        
        if (result.images?.length > 0) {
            const image = result.images[0];
            console.log(`   Sample Image: Page ${image.page}, Format: ${image.format}`);
            console.log(`   Dimensions: ${image.width}x${image.height}`);
            console.log(`   Base64 Length: ${image.base64?.length || 0} characters`);
        }
        console.log('');
    } catch (error) {
        console.error('❌ PDF to images conversion failed:', error.message);
    }
    
    // Test 4: Screenshot Capture
    console.log('📊 Test 4: Screenshot Capture');
    try {
        const response = await fetch(`${baseUrl}/api/capture-screenshot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                url: 'https://example.com',
                options: { width: 1200, height: 800, fullPage: false }
            })
        });
        
        const result = await response.json();
        
        console.log('✅ Screenshot Capture:');
        console.log(`   Success: ${result.success}`);
        console.log(`   URL: ${result.url || 'N/A'}`);
        console.log(`   Dimensions: ${result.dimensions?.width || 'N/A'}x${result.dimensions?.height || 'N/A'}`);
        console.log(`   Screenshot Size: ${result.screenshot?.length || 0} characters`);
        console.log('');
    } catch (error) {
        console.error('❌ Screenshot capture failed:', error.message);
    }
    
    // Test 5: Real PDF Processing with Messos PDF
    console.log('📊 Test 5: Real PDF Processing with Messos PDF');
    try {
        // Check if Messos PDF exists
        const messosPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
        if (fs.existsSync(messosPath)) {
            const pdfBuffer = fs.readFileSync(messosPath);
            const pdfBase64 = pdfBuffer.toString('base64');
            
            console.log(`   PDF Size: ${pdfBuffer.length} bytes`);
            console.log(`   Base64 Size: ${pdfBase64.length} characters`);
            
            // Test enhanced extraction
            const response = await fetch(`${baseUrl}/api/pdf-extract-enhanced`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    pdfBase64: pdfBase64,
                    useOCR: true
                })
            });
            
            const result = await response.json();
            
            console.log('✅ Real PDF Processing Result:');
            console.log(`   Success: ${result.success}`);
            console.log(`   Processing Methods: ${result.extractedData?.processingMethods?.join(', ') || 'N/A'}`);
            console.log(`   Securities Found: ${result.extractedData?.securities?.length || 0}`);
            console.log(`   Total Value: $${result.extractedData?.totalValue?.toLocaleString() || 'N/A'}`);
            console.log(`   Confidence: ${(result.extractedData?.confidence * 100).toFixed(1) || 'N/A'}%`);
            console.log(`   PDF Pages: ${result.pdfInfo?.pages || 'N/A'}`);
            console.log(`   OCR Pages Processed: ${result.pdfInfo?.ocrPagesProcessed || 0}`);
            
            // Show first few securities
            if (result.extractedData?.securities?.length > 0) {
                console.log('\\n   Sample Securities:');
                result.extractedData.securities.slice(0, 3).forEach((security, index) => {
                    console.log(`   ${index + 1}. ${security.isin} - ${security.name || 'N/A'} - ${security.currency} ${security.value?.toLocaleString() || 'N/A'}`);
                    console.log(`      Method: ${security.extractionMethod || 'N/A'}`);
                });
            }
            
            // Check for XS2530201644 specifically
            const targetSecurity = result.extractedData?.securities?.find(s => s.isin === 'XS2530201644');
            if (targetSecurity) {
                console.log(`\\n   🎯 Target Security (XS2530201644):`);
                console.log(`      Name: ${targetSecurity.name || 'N/A'}`);
                console.log(`      Value: ${targetSecurity.currency} ${targetSecurity.value?.toLocaleString() || 'N/A'}`);
                console.log(`      Expected: USD 199,080`);
                console.log(`      Accuracy: ${targetSecurity.value === 199080 ? '✅ CORRECT' : '❌ INCORRECT'}`);
                console.log(`      Method: ${targetSecurity.extractionMethod || 'N/A'}`);
            }
            
        } else {
            console.log('   ⚠️ Messos PDF not found, skipping real PDF test');
        }
        console.log('');
    } catch (error) {
        console.error('❌ Real PDF processing failed:', error.message);
    }
    
    // Test 6: Legacy API Compatibility
    console.log('📊 Test 6: Legacy API Compatibility');
    try {
        const response = await fetch(`${baseUrl}/api/pdf-extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testMode: true })
        });
        
        const result = await response.json();
        
        console.log('✅ Legacy API Compatibility:');
        console.log(`   Success: ${result.success}`);
        console.log(`   Securities Found: ${result.extractedData?.securities?.length || 0}`);
        console.log(`   Total Value: $${result.extractedData?.totalValue?.toLocaleString() || 'N/A'}`);
        console.log(`   Confidence: ${result.extractedData?.confidence || 'N/A'}`);
        console.log('');
    } catch (error) {
        console.error('❌ Legacy API test failed:', error.message);
    }
    
    // Test 7: API Root Endpoint
    console.log('📊 Test 7: API Root Endpoint');
    try {
        const response = await fetch(`${baseUrl}/`);
        const result = await response.json();
        
        console.log('✅ API Root Endpoint:');
        console.log(`   Message: ${result.message}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Endpoints: ${result.endpoints?.length || 0} available`);
        console.log(`   Features: ${result.features?.length || 0} available`);
        console.log(`   Available Endpoints: ${result.endpoints?.join(', ') || 'N/A'}`);
        console.log('');
    } catch (error) {
        console.error('❌ API root endpoint test failed:', error.message);
    }
    
    console.log('🎉 MCP Enhanced PDF OCR Testing Complete!');
    console.log('=========================================');
}

// Run tests
testMCPFeatures().catch(console.error);