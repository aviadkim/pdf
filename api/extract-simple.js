// Simple PDF extraction endpoint with proper error handling
export default async function handler(req, res) {
  // Always set JSON content type first
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['POST']
    });
  }

  try {
    // Simple response for testing
    const result = {
      success: true,
      method: 'simple-extraction',
      data: {
        holdings: [
          {
            position: 1,
            securityName: 'Test Security (Simple Mode)',
            isin: 'TEST00000001',
            currentValue: 100000,
            currency: 'USD',
            category: 'Demo'
          }
        ],
        portfolioInfo: {
          portfolioTotal: { value: 100000, currency: 'USD' },
          clientName: 'Test Client',
          extractionMethod: 'simple-pattern-matching'
        }
      },
      metadata: {
        processingTime: '500ms',
        confidence: 60,
        timestamp: new Date().toISOString()
      }
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('Simple extraction error:', error);
    
    // Always return JSON, never HTML
    return res.status(500).json({
      success: false,
      error: 'Processing failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}