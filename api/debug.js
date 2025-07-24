import { Anthropic } from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  try {
    // Test 1: Check environment
    const envCheck = {
      hasApiKey: !!process.env.ANTHROPIC_API_KEY,
      keyLength: process.env.ANTHROPIC_API_KEY?.length,
      nodeVersion: process.version,
      platform: process.platform
    };

    // Test 2: Try to initialize Anthropic
    let anthropicCheck = { initialized: false, error: null };
    try {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      anthropicCheck.initialized = true;
      
      // Test 3: Try a simple API call
      try {
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 100,
          messages: [{ role: 'user', content: 'Say "API working"' }]
        });
        anthropicCheck.apiCall = 'success';
        anthropicCheck.response = response.content[0].text;
      } catch (apiError) {
        anthropicCheck.apiCall = 'failed';
        anthropicCheck.apiError = apiError.message;
      }
    } catch (initError) {
      anthropicCheck.error = initError.message;
    }

    res.status(200).json({
      status: 'Debug Information',
      environment: envCheck,
      anthropic: anthropicCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Debug endpoint error',
      message: error.message,
      type: error.constructor.name
    });
  }
}