// Debug Claude Vision endpoint
async function debugClaudeVision() {
    const baseUrl = 'https://pdf-production-5dis.onrender.com';
    
    console.log('🔍 Debugging Claude Vision on pdf-production...\n');
    
    // Test 1: Check Claude API connection
    try {
        const claudeRes = await fetch(`${baseUrl}/api/claude-test`);
        const claudeData = await claudeRes.json();
        console.log('🤖 Claude API Status:');
        console.log('  Connected:', claudeData.success ? '✅' : '❌');
        console.log('  Model:', claudeData.model);
        console.log('');
    } catch (e) {
        console.log('❌ Claude test error:', e.message);
    }
    
    // Test 2: Simple Claude Vision test
    console.log('📸 Testing Claude Vision with small file...');
    const testPdf = Buffer.from('%PDF-1.4\ntest', 'utf8');
    
    try {
        const formData = new FormData();
        const blob = new Blob([testPdf], { type: 'application/pdf' });
        formData.append('pdf', blob, 'test.pdf');
        
        const response = await fetch(`${baseUrl}/api/claude-vision-extract`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        console.log('Response:', JSON.stringify(result, null, 2));
        
        if (result.metadata?.costAnalysis) {
            console.log('\n💰 Cost Analysis:');
            console.log('  Per PDF:', '$' + result.metadata.costAnalysis.totalCost);
            console.log('  Per 100 PDFs:', '$' + result.metadata.costAnalysis.estimatedMonthly.per100PDFs);
        }
        
    } catch (e) {
        console.log('❌ Vision test error:', e.message);
    }
}

debugClaudeVision();