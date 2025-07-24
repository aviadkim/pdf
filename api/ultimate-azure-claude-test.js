// ULTIMATE TEST: Direct Azure + Claude API testing with force debug
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const startTime = Date.now();
  
  // FORCE CHECK ALL POSSIBLE ENVIRONMENT VARIABLE NAMES
  const envDebug = {
    // Check all possible Azure key names
    AZURE_DOCUMENT_INTELLIGENCE_KEY: !!process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY,
    AZURE_FORM_KEY: !!process.env.AZURE_FORM_KEY,
    AZURE_AI_KEY: !!process.env.AZURE_AI_KEY,
    AZURE_KEY: !!process.env.AZURE_KEY,
    
    // Check all possible Azure endpoint names
    AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: !!process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
    AZURE_FORM_ENDPOINT: !!process.env.AZURE_FORM_ENDPOINT,
    AZURE_AI_ENDPOINT: !!process.env.AZURE_AI_ENDPOINT,
    AZURE_ENDPOINT: !!process.env.AZURE_ENDPOINT,
    
    // Check Claude key
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    CLAUDE_API_KEY: !!process.env.CLAUDE_API_KEY,
    
    // Get actual values (first 10 chars only for security)
    azureKeyValue: process.env.AZURE_FORM_KEY ? process.env.AZURE_FORM_KEY.substring(0, 10) + '...' : 'MISSING',
    azureEndpointValue: process.env.AZURE_FORM_ENDPOINT || 'MISSING',
    claudeKeyValue: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...' : 'MISSING'
  };
  
  // FORCE TRY AZURE WITH EXACT VARIABLE NAMES FROM DEBUG
  const azureKey = process.env.AZURE_FORM_KEY;
  const azureEndpoint = process.env.AZURE_FORM_ENDPOINT;
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  
  let testResults = {
    envDebug: envDebug,
    azureAttempt: null,
    claudeAttempt: null,
    error: null
  };
  
  // Test Azure if keys present
  if (azureKey && azureEndpoint) {
    try {
      console.log('🔷 FORCING Azure Document Intelligence test...');
      
      // Import Azure SDK
      const { DocumentAnalysisClient, AzureKeyCredential } = await import('@azure/ai-form-recognizer');
      
      const client = new DocumentAnalysisClient(
        azureEndpoint,
        new AzureKeyCredential(azureKey)
      );
      
      // Test with a simple PDF buffer
      const testPdfBuffer = Buffer.from(req.body?.pdfBase64 || 'dGVzdA==', 'base64');
      
      // Try to analyze (this will test if credentials work)
      const poller = await client.beginAnalyzeDocument('prebuilt-layout', testPdfBuffer);
      const result = await poller.pollUntilDone();
      
      testResults.azureAttempt = {
        success: true,
        tables: result.tables?.length || 0,
        pages: result.pages?.length || 0,
        content: result.content?.substring(0, 100) || 'No content'
      };
      
      console.log('✅ Azure test successful!');
      
    } catch (error) {
      testResults.azureAttempt = {
        success: false,
        error: error.message,
        stack: error.stack?.substring(0, 200)
      };
      console.log('❌ Azure test failed:', error.message);
    }
  }
  
  // Test Claude if key present
  if (claudeKey) {
    try {
      console.log('👁️ FORCING Claude Vision test...');
      
      const { Anthropic } = await import('@anthropic-ai/sdk');
      
      const anthropic = new Anthropic({
        apiKey: claudeKey,
      });
      
      // Simple test message
      const message = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 100,
        messages: [{
          role: "user",
          content: "Test message - respond with just 'Claude API working'"
        }]
      });
      
      testResults.claudeAttempt = {
        success: true,
        response: message.content[0].text
      };
      
      console.log('✅ Claude test successful!');
      
    } catch (error) {
      testResults.claudeAttempt = {
        success: false,
        error: error.message
      };
      console.log('❌ Claude test failed:', error.message);
    }
  }
  
  const processingTime = Date.now() - startTime;
  
  res.status(200).json({
    status: 'ULTIMATE API TEST',
    timestamp: new Date().toISOString(),
    processingTime: `${processingTime}ms`,
    results: testResults,
    nextSteps: {
      azureReady: !!(azureKey && azureEndpoint),
      claudeReady: !!claudeKey,
      canExtractPDF: !!(testResults.azureAttempt?.success || testResults.claudeAttempt?.success)
    }
  });
}