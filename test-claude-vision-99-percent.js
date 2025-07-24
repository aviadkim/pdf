/**
 * TEST CLAUDE VISION API FOR 99% ACCURACY
 * This will use page-by-page Claude Vision processing
 */
const fs = require('fs');
const path = require('path');

async function testClaudeVision() {
    console.log('🎯 TESTING CLAUDE VISION FOR 99% ACCURACY');
    console.log('='.repeat(60));
    
    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.log('\n❌ ANTHROPIC_API_KEY not set!');
        console.log('\n📋 To test Claude Vision locally, run:');
        console.log('   Windows: set ANTHROPIC_API_KEY=your-api-key-here');
        console.log('   Mac/Linux: export ANTHROPIC_API_KEY=your-api-key-here');
        console.log('\n💡 Or we can test on Render if you add the key there.');
        console.log('\n🔑 Get your API key from: https://console.anthropic.com/');
        return;
    }
    
    console.log('✅ Claude API key found');
    
    // Check if ImageMagick is available
    const { execSync } = require('child_process');
    try {
        execSync('convert -version', { stdio: 'pipe' });
        console.log('✅ ImageMagick available');
    } catch (e) {
        console.log('⚠️  ImageMagick not found - installing...');
        // Try to install ImageMagick on Windows
        try {
            execSync('choco install imagemagick -y', { stdio: 'inherit' });
        } catch (e2) {
            console.log('❌ Could not install ImageMagick automatically');
            console.log('   Please install from: https://imagemagick.org/script/download.php');
            return;
        }
    }
    
    // Load the page-by-page processor
    try {
        const PageByPageClaudeProcessor = require('./page-by-page-claude-processor');
        console.log('✅ Page-by-page processor loaded');
        
        // Test with Messos PDF
        const pdfPath = './2. Messos  - 31.03.2025.pdf';
        if (!fs.existsSync(pdfPath)) {
            console.log('❌ Messos PDF not found');
            return;
        }
        
        const pdfBuffer = fs.readFileSync(pdfPath);
        console.log(`📄 PDF loaded: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        
        // Process with Claude Vision
        console.log('\n🚀 STARTING CLAUDE VISION PROCESSING...');
        console.log('⏱️  This will take 30-60 seconds for maximum accuracy\n');
        
        const processor = new PageByPageClaudeProcessor(apiKey);
        const startTime = Date.now();
        
        const result = await processor.processPDFPageByPage(pdfBuffer);
        
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 CLAUDE VISION RESULTS:');
        console.log('='.repeat(60));
        
        if (result.success) {
            console.log(`✅ SUCCESS!`);
            console.log(`🎯 Accuracy: ${result.accuracy}%`);
            console.log(`🔢 Securities found: ${result.securities.length}`);
            console.log(`💰 Total value: ${result.currency} ${result.totalValue.toLocaleString()}`);
            console.log(`⏱️  Processing time: ${elapsed}s`);
            console.log(`💵 Cost: $${result.metadata.totalCost.toFixed(4)}`);
            console.log(`📄 Pages processed: ${result.metadata.pagesProcessed}`);
            console.log(`🧠 Tokens used: ${result.metadata.tokensUsed.input + result.metadata.tokensUsed.output}`);
            
            console.log('\n📋 EXTRACTED FIELDS:');
            const sampleSec = result.securities[0];
            if (sampleSec) {
                console.log('✅ ISIN: ' + (sampleSec.isin ? 'Yes' : 'No'));
                console.log('✅ Name: ' + (sampleSec.name ? 'Yes' : 'No'));
                console.log('✅ Quantity: ' + (sampleSec.quantity ? 'Yes' : 'No'));
                console.log('✅ Price: ' + (sampleSec.price ? 'Yes' : 'No'));
                console.log('✅ Value: ' + (sampleSec.value ? 'Yes' : 'No'));
                console.log('✅ Currency: ' + (sampleSec.currency ? 'Yes' : 'No'));
            }
            
            console.log('\n🏆 SAMPLE SECURITIES WITH FULL DETAILS:');
            result.securities.slice(0, 3).forEach((sec, i) => {
                console.log(`\n${i + 1}. ${sec.isin}`);
                console.log(`   Name: ${sec.name}`);
                console.log(`   Quantity: ${sec.quantity ? sec.quantity.toLocaleString() : 'N/A'} ${sec.currency || ''}`);
                console.log(`   Price: ${sec.price || 'N/A'}%`);
                console.log(`   Value: ${sec.value ? sec.value.toLocaleString() : 'N/A'} ${sec.currency || ''}`);
            });
            
            if (result.accuracy >= 99) {
                console.log('\n🎉 TARGET ACHIEVED: 99%+ ACCURACY!');
            } else if (result.accuracy >= 95) {
                console.log('\n✅ EXCELLENT: Near-perfect accuracy!');
            } else if (result.accuracy >= 90) {
                console.log('\n👍 VERY GOOD: High accuracy achieved!');
            }
            
            // Save results for analysis
            const outputPath = `claude-vision-results-${Date.now()}.json`;
            fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
            console.log(`\n💾 Full results saved to: ${outputPath}`);
            
        } else {
            console.log('❌ Processing failed:', result.error);
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('\n💡 Make sure ImageMagick is properly installed');
        console.log('   and the API key is valid.');
    }
}

// Run the test
testClaudeVision().catch(console.error);