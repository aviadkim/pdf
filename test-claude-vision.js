const fs = require('fs');
const path = require('path');

async function testClaudeVisionWithPDF() {
    try {
        console.log('📄 Testing Claude Vision with PDF...');
        
        const { ClaudeVisionProcessor } = require('./claude-vision-processor.js');
        const processor = new ClaudeVisionProcessor();
        
        // Load the Messos PDF
        const pdfPath = '2. Messos  - 31.03.2025.pdf';
        if (!fs.existsSync(pdfPath)) {
            console.log('❌ PDF file not found:', pdfPath);
            return;
        }
        
        const pdfBuffer = fs.readFileSync(pdfPath);
        console.log('✅ PDF loaded:', pdfBuffer.length, 'bytes');
        
        console.log('🔄 Processing PDF with Claude Vision...');
        const startTime = Date.now();
        
        const result = await processor.processPDFWithVision(pdfBuffer);
        
        const processingTime = Date.now() - startTime;
        console.log('⏱️ Processing completed in', processingTime, 'ms');
        
        console.log('📊 Claude Vision result:');
        console.log('Success:', result.success);
        console.log('Securities found:', result.securities?.length || 0);
        console.log('Total value:', result.totalValue);
        console.log('Accuracy:', result.accuracy);
        console.log('Error:', result.error);
        
        if (result.metadata) {
            console.log('📈 Metadata:');
            console.log('- Method:', result.metadata.method);
            console.log('- Model:', result.metadata.model);
            console.log('- Pages processed:', result.metadata.pagesProcessed);
            console.log('- Cost analysis:', result.metadata.costAnalysis);
        }
        
    } catch (error) {
        console.error('❌ Claude Vision PDF test error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Also test the hybrid processor with PDF
async function testHybridWithPDF() {
    try {
        console.log('\n🚀 Testing Hybrid Processor with PDF...');
        
        const { HybridExtractionFixed } = require('./hybrid-extraction-fixed.js');
        const processor = new HybridExtractionFixed();
        
        const pdfPath = '2. Messos  - 31.03.2025.pdf';
        if (!fs.existsSync(pdfPath)) {
            console.log('❌ PDF file not found:', pdfPath);
            return;
        }
        
        const pdfBuffer = fs.readFileSync(pdfPath);
        console.log('✅ PDF loaded:', pdfBuffer.length, 'bytes');
        
        console.log('🔄 Processing with Fixed Hybrid Extraction...');
        const startTime = Date.now();
        
        const result = await processor.extractWithHybridApproach(pdfBuffer);
        
        const processingTime = Date.now() - startTime;
        console.log('⏱️ Processing completed in', processingTime, 'ms');
        
        console.log('📊 Hybrid extraction result:');
        console.log('Success:', result.success);
        console.log('Method:', result.method);
        console.log('Securities found:', result.securities?.length || 0);
        console.log('Total value:', result.totalValue?.toLocaleString());
        console.log('Accuracy:', result.accuracy + '%');
        
        if (result.metadata) {
            console.log('📈 Metadata:');
            console.log('- Base extraction securities:', result.metadata.baseExtraction?.securities);
            console.log('- Enhancement method:', result.metadata.enhancement?.method);
            console.log('- Total cost:', '$' + result.metadata.costAnalysis?.total);
        }
        
        // Show first few securities
        if (result.securities && result.securities.length > 0) {
            console.log('\n🔍 First 3 securities found:');
            result.securities.slice(0, 3).forEach((sec, i) => {
                console.log(`${i+1}. ${sec.isin}: ${sec.name}`);
                console.log(`   Value: $${sec.marketValue.toLocaleString()} (${sec.confidence})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Hybrid extraction test error:', error.message);
        console.error('Stack:', error.stack);
    }
}

async function runTests() {
    await testClaudeVisionWithPDF();
    await testHybridWithPDF();
}

runTests();