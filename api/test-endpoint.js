// Test endpoint to verify JSON response handling
export default async function handler(req, res) {
  // Critical: Set JSON content type FIRST
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const testResponse = {
      success: true,
      message: 'API is working correctly',
      method: req.method,
      timestamp: new Date().toISOString(),
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']?.substring(0, 50)
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        hasAzureKey: !!process.env.AZURE_FORM_KEY
      },
      features: {
        securityEnabled: true,
        performanceCaching: true,
        inputValidation: true,
        errorHandling: true
      }
    };

    // Test different response scenarios
    if (req.query.test === 'error') {
      return res.status(500).json({
        success: false,
        error: 'Test error response',
        code: 'TEST_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    if (req.query.test === 'large') {
      // Test with larger response
      testResponse.largeData = Array(100).fill(0).map((_, i) => ({
        id: i,
        name: `Test Item ${i}`,
        value: Math.random() * 1000
      }));
    }

    return res.status(200).json(testResponse);

  } catch (error) {
    console.error('Test endpoint error:', error);
    
    // Ensure we always return JSON, never HTML
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Test endpoint failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
}