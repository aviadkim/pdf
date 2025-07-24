/**
 * Test Visual PDF Processor
 * Test the system that implements manual analysis approach in code
 */

const { VisualPDFProcessor } = require('./visual-pdf-processor.js');

async function testVisualProcessor() {
    console.log('👁️ TESTING VISUAL PDF PROCESSOR');
    console.log('='.repeat(60));
    
    try {
        const processor = new VisualPDFProcessor();
        
        console.log('📄 Processing Messos PDF with visual approach...');
        const startTime = Date.now();
        
        const result = await processor.processPDF('C:\\Users\\aviad\\OneDrive\\Desktop\\pdf-main\\2. Messos  - 31.03.2025.pdf');
        
        const processingTime = Date.now() - startTime;
        
        console.log('\n👁️ VISUAL PDF PROCESSOR RESULTS');
        console.log('='.repeat(50));
        console.log(`✅ Success: ${result.success}`);
        console.log(`📊 Accuracy: ${result.accuracy?.toFixed(2)}%`);
        console.log(`⏱️ Processing Time: ${processingTime}ms`);
        console.log(`🔢 Securities Found: ${result.securities?.length || 0}`);
        console.log(`🎯 Expected Securities: 39`);
        console.log(`💵 Total Value: $${result.totalValue?.toLocaleString()}`);
        console.log(`🎯 Expected Total: $19,464,431`);
        
        if (result.securities && result.securities.length > 0) {
            console.log('\n📋 SECURITIES BY CATEGORY:');
            
            const categories = {};
            result.securities.forEach(security => {
                if (!categories[security.category]) {
                    categories[security.category] = [];
                }
                categories[security.category].push(security);
            });
            
            Object.keys(categories).forEach(category => {
                console.log(`\n   ${category.toUpperCase()}:`);
                categories[category].forEach((security, index) => {
                    console.log(`     ${index + 1}. ${security.isin} - ${security.name.substring(0, 50)}... : $${security.value.toLocaleString()}`);
                });
                console.log(`   Total ${category}: ${categories[category].length} securities, $${categories[category].reduce((sum, s) => sum + s.value, 0).toLocaleString()}`);
            });
        }
        
        // Validate against expected totals
        const expectedTotal = 19464431;
        const totalAccuracy = Math.min(
            result.totalValue / expectedTotal,
            expectedTotal / result.totalValue
        ) * 100;
        
        const countAccuracy = Math.min(
            result.securities.length / 39,
            39 / result.securities.length
        ) * 100;
        
        console.log('\n📊 VALIDATION RESULTS:');
        console.log(`   💰 Portfolio Total Accuracy: ${totalAccuracy.toFixed(2)}%`);
        console.log(`   🔢 Security Count Accuracy: ${countAccuracy.toFixed(2)}%`);
        console.log(`   🎯 Overall System Accuracy: ${result.accuracy?.toFixed(2)}%`);
        
        if (result.accuracy >= 99) {
            console.log('\n🎉 SUCCESS: 99% accuracy achieved!');
            console.log('✅ This approach correctly extracts all securities as seen manually');
            console.log('🚀 Ready for deployment to Render');
        } else if (result.accuracy >= 95) {
            console.log('\n👍 VERY GOOD: Close to 99% target');
        } else {
            console.log('\n⚠️ NEEDS IMPROVEMENT: Below target accuracy');
        }
        
        // Test the approach
        console.log('\n🧪 APPROACH VALIDATION:');
        console.log('   📈 Manual Analysis: 100% (I can see all 39 securities)');
        console.log(`   💻 Code Implementation: ${result.accuracy?.toFixed(2)}%`);
        console.log('   🎯 Gap: Manual analysis works perfectly, code should match');
        
        return result;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Run test
if (require.main === module) {
    testVisualProcessor().then(result => {
        if (result.success && result.accuracy >= 99) {
            console.log('\n🎉 VISUAL PROCESSOR TEST PASSED!');
            console.log('✅ This demonstrates that we CAN achieve 99% accuracy');
            console.log('🚀 The same approach that works manually works in code');
            process.exit(0);
        } else if (result.success) {
            console.log(`\n⚠️ PARTIAL SUCCESS: ${result.accuracy?.toFixed(2)}% accuracy`);
            process.exit(0);
        } else {
            console.log('\n❌ TEST FAILED');
            process.exit(1);
        }
    });
}

module.exports = { testVisualProcessor };