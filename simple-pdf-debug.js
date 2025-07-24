#!/usr/bin/env node

/**
 * SIMPLE PDF DEBUG TOOL
 * 
 * Step-by-step debugging to identify the forEach error
 */

const fs = require('fs');
const path = require('path');

async function debugPDFProcessing() {
    console.log('🔍 Starting PDF Processing Debug...\n');
    
    try {
        // Step 1: Import the system
        console.log('📦 Step 1: Importing SmartOCRLearningSystem...');
        const SmartOCRLearningSystem = require('./smart-ocr-learning-system.js');
        console.log('✅ Import successful\n');
        
        // Step 2: Initialize the system
        console.log('🔧 Step 2: Initializing system...');
        const ocrSystem = new SmartOCRLearningSystem();
        console.log('✅ System initialized\n');
        
        // Step 3: Check if we have a test PDF
        console.log('📄 Step 3: Looking for test PDF...');
        const testPDFs = [
            '2. Messos - 31.03.2025.pdf',
            'test.pdf',
            'sample.pdf'
        ];
        
        let testPDFPath = null;
        for (const pdfName of testPDFs) {
            if (fs.existsSync(pdfName)) {
                testPDFPath = pdfName;
                break;
            }
        }
        
        if (!testPDFPath) {
            console.log('⚠️ No test PDF found. Please place a PDF file in the current directory.');
            console.log('Expected files: ' + testPDFs.join(', '));
            return;
        }
        
        console.log(`✅ Found test PDF: ${testPDFPath}\n`);
        
        // Step 4: Read the PDF file
        console.log('📖 Step 4: Reading PDF file...');
        const pdfBuffer = fs.readFileSync(testPDFPath);
        console.log(`✅ PDF loaded: ${pdfBuffer.length} bytes\n`);
        
        // Step 5: Process with detailed logging
        console.log('⚙️ Step 5: Processing PDF with detailed logging...');
        
        // Override console methods to capture all logs
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        
        const logs = [];
        
        console.log = (...args) => {
            const message = args.join(' ');
            logs.push({ type: 'LOG', message, timestamp: new Date().toISOString() });
            originalLog(...args);
        };
        
        console.warn = (...args) => {
            const message = args.join(' ');
            logs.push({ type: 'WARN', message, timestamp: new Date().toISOString() });
            originalWarn('⚠️', ...args);
        };
        
        console.error = (...args) => {
            const message = args.join(' ');
            logs.push({ type: 'ERROR', message, timestamp: new Date().toISOString() });
            originalError('❌', ...args);
        };
        
        try {
            const result = await ocrSystem.processPDF(pdfBuffer, {
                filename: testPDFPath,
                enableLearning: true,
                usePatterns: true
            });
            
            // Restore console methods
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
            
            console.log('🎉 PDF processing completed successfully!\n');
            console.log('📊 Result summary:');
            console.log(`- Accuracy: ${result.accuracy}%`);
            console.log(`- Document ID: ${result.documentId}`);
            console.log(`- Pages: ${result.pages}`);
            console.log(`- OCR Results type: ${typeof result.ocrResults}`);
            console.log(`- OCR Results is array: ${Array.isArray(result.ocrResults)}`);
            
            if (result.ocrResults) {
                console.log(`- OCR Results length: ${result.ocrResults.length || 'N/A'}`);
                console.log(`- First result: ${JSON.stringify(result.ocrResults[0] || 'N/A', null, 2)}`);
            }
            
            console.log('\n📋 Processing logs:');
            logs.forEach((log, index) => {
                console.log(`${index + 1}. [${log.type}] ${log.message}`);
            });
            
        } catch (processingError) {
            // Restore console methods
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
            
            console.log('\n💥 PDF processing failed!');
            console.log(`❌ Error: ${processingError.message}`);
            console.log(`📍 Stack: ${processingError.stack}`);
            
            console.log('\n📋 Processing logs before error:');
            logs.forEach((log, index) => {
                const prefix = log.type === 'ERROR' ? '❌' : log.type === 'WARN' ? '⚠️' : 'ℹ️';
                console.log(`${index + 1}. ${prefix} ${log.message}`);
            });
            
            // Additional analysis for forEach error
            if (processingError.message.includes('forEach is not a function')) {
                console.log('\n🔍 FOREACH ERROR ANALYSIS:');
                console.log('This error occurs when trying to call forEach on something that is not an array.');
                console.log('Common causes:');
                console.log('1. ocrResults is null or undefined');
                console.log('2. ocrResults is a string instead of an array');
                console.log('3. ocrResults is an object instead of an array');
                console.log('4. Mistral API returned unexpected format');
                console.log('5. PDF parsing failed and returned non-array data');
            }
        }
        
    } catch (error) {
        console.log('\n💥 System initialization or setup failed!');
        console.log(`❌ Error: ${error.message}`);
        console.log(`📍 Stack: ${error.stack}`);
    }
}

// Additional function to test just the problematic method
async function testGenerateSuggestedAnnotations() {
    console.log('\n🧪 Testing generateSuggestedAnnotations method...\n');
    
    try {
        const SmartOCRLearningSystem = require('./smart-ocr-learning-system.js');
        const ocrSystem = new SmartOCRLearningSystem();
        
        // Test with different input types
        const testCases = [
            { name: 'Valid array', data: [{ text: 'ISIN: XS123456789' }, { text: 'Value: 1,234,567' }] },
            { name: 'Empty array', data: [] },
            { name: 'Null', data: null },
            { name: 'Undefined', data: undefined },
            { name: 'String', data: 'ISIN: XS123456789' },
            { name: 'Object', data: { text: 'ISIN: XS123456789' } },
            { name: 'Number', data: 123 },
            { name: 'Array with invalid objects', data: [null, undefined, 'string', { noText: 'test' }] }
        ];
        
        for (const testCase of testCases) {
            console.log(`🧪 Testing: ${testCase.name}`);
            try {
                const result = ocrSystem.generateSuggestedAnnotations(testCase.data);
                console.log(`✅ Success: ${result.length} suggestions generated`);
            } catch (error) {
                console.log(`❌ Failed: ${error.message}`);
            }
            console.log('');
        }
        
    } catch (error) {
        console.log(`❌ Test setup failed: ${error.message}`);
    }
}

// Main execution
async function main() {
    console.log('🎯 PDF Processing Debug Tool\n');
    console.log('This tool will help identify the "ocrResults.forEach is not a function" error.\n');
    
    // First test the specific method
    await testGenerateSuggestedAnnotations();
    
    // Then test full PDF processing
    await debugPDFProcessing();
    
    console.log('\n🏁 Debug session complete!');
    console.log('\nNext steps:');
    console.log('1. If you see the error, check the logs above for the exact cause');
    console.log('2. The fix has been applied to handle invalid ocrResults formats');
    console.log('3. Try uploading your PDF again to the web interface');
    console.log('4. If the error persists, the logs will show exactly what data is causing the issue');
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { debugPDFProcessing, testGenerateSuggestedAnnotations };
