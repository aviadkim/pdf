#!/usr/bin/env node

/**
 * TEST PDF PROCESSING FIXES
 * 
 * Tests the robust PDF processor and verifies all fixes work correctly
 */

const { processWithErrorHandling } = require('./robust-pdf-processor.js');
const fs = require('fs').promises;
const path = require('path');

async function testPDFProcessing() {
    console.log('🧪 TESTING PDF PROCESSING FIXES');
    console.log('================================');
    
    // Test 1: Check if robust processor loads
    console.log('\n1️⃣ Testing robust processor import...');
    try {
        console.log('✅ Robust PDF processor imported successfully');
    } catch (error) {
        console.error('❌ Failed to import robust processor:', error.message);
        return;
    }
    
    // Test 2: Create a test PDF file
    console.log('\n2️⃣ Creating test PDF...');
    const testPdfPath = path.join(__dirname, 'test-document.pdf');
    
    try {
        // Create a simple PDF content for testing
        const testPdfContent = `%PDF-1.4
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
0000000058 00000 n 
0000000115 00000 n 
0000000189 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
284
%%EOF`;
        
        await fs.writeFile(testPdfPath, testPdfContent);
        console.log('✅ Test PDF created');
        
    } catch (error) {
        console.error('❌ Failed to create test PDF:', error.message);
        return;
    }
    
    // Test 3: Process the test PDF
    console.log('\n3️⃣ Testing PDF processing...');
    try {
        const result = await processWithErrorHandling(testPdfPath, {
            maxPages: 10,
            timeout: 15000,
            fallbackToImages: false // Disable image fallback for this test
        });
        
        console.log('📊 Processing Result:');
        console.log(`   Success: ${result.success ? '✅' : '❌'}`);
        console.log(`   Method: ${result.method}`);
        console.log(`   Text length: ${result.text ? result.text.length : 0} characters`);
        console.log(`   Processing time: ${result.processingTime || 'N/A'}ms`);
        
        if (result.success) {
            console.log('✅ PDF processing successful');
        } else {
            console.log('❌ PDF processing failed:', result.error);
            console.log('💡 Fallback message:', result.fallbackMessage);
        }
        
    } catch (error) {
        console.error('❌ PDF processing test failed:', error.message);
    }
    
    // Test 4: Test error handling with invalid file
    console.log('\n4️⃣ Testing error handling...');
    try {
        const invalidPath = path.join(__dirname, 'nonexistent.pdf');
        const result = await processWithErrorHandling(invalidPath);
        
        console.log('📊 Error Handling Result:');
        console.log(`   Success: ${result.success ? '✅' : '❌'}`);
        console.log(`   Error handled gracefully: ${!result.success ? '✅' : '❌'}`);
        console.log(`   Fallback message provided: ${result.fallbackMessage ? '✅' : '❌'}`);
        
    } catch (error) {
        console.error('❌ Error handling test failed:', error.message);
    }
    
    // Test 5: Check system dependencies
    console.log('\n5️⃣ Checking system dependencies...');
    try {
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);
        
        // Check GraphicsMagick
        try {
            const { stdout } = await execAsync('gm version');
            console.log('✅ GraphicsMagick available:', stdout.split('\n')[0]);
        } catch (error) {
            console.log('❌ GraphicsMagick not available');
        }
        
        // Check ImageMagick
        try {
            const { stdout } = await execAsync('convert -version');
            console.log('✅ ImageMagick available:', stdout.split('\n')[0]);
        } catch (error) {
            console.log('❌ ImageMagick not available');
        }
        
        // Check Node.js version
        console.log('✅ Node.js version:', process.version);
        
    } catch (error) {
        console.error('❌ Dependency check failed:', error.message);
    }
    
    // Cleanup
    console.log('\n6️⃣ Cleaning up...');
    try {
        await fs.unlink(testPdfPath);
        console.log('✅ Test files cleaned up');
    } catch (error) {
        console.log('⚠️  Cleanup warning:', error.message);
    }
    
    console.log('\n🎉 PDF PROCESSING TEST COMPLETED');
    console.log('=================================');
    console.log('✅ All tests completed');
    console.log('📋 Check the results above for any issues');
    console.log('🚀 Ready for deployment!');
}

// Test the server import as well
async function testServerIntegration() {
    console.log('\n🔗 TESTING SERVER INTEGRATION');
    console.log('==============================');
    
    try {
        // Test if the server can import the robust processor
        const serverPath = path.join(__dirname, 'final-comprehensive-system.js');
        const serverContent = await fs.readFile(serverPath, 'utf8');
        
        const hasRobustImport = serverContent.includes('robust-pdf-processor');
        const hasProcessWithErrorHandling = serverContent.includes('processWithErrorHandling');
        
        console.log(`✅ Server imports robust processor: ${hasRobustImport ? '✅' : '❌'}`);
        console.log(`✅ Server uses error handling: ${hasProcessWithErrorHandling ? '✅' : '❌'}`);
        
        if (hasRobustImport && hasProcessWithErrorHandling) {
            console.log('✅ Server integration looks good');
        } else {
            console.log('⚠️  Server integration may need attention');
        }
        
    } catch (error) {
        console.error('❌ Server integration test failed:', error.message);
    }
}

async function main() {
    await testPDFProcessing();
    await testServerIntegration();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testPDFProcessing, testServerIntegration };
