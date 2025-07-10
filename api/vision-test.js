export default async function handler(req, res) {
  try {
    // Test the vision extraction endpoint with a simple test
    if (req.method === 'GET') {
      return res.status(200).json({
        status: 'Vision API Test Ready',
        message: 'POST to this endpoint with imageBase64 to test vision extraction',
        hasApiKey: !!process.env.ANTHROPIC_API_KEY,
        requirements: {
          method: 'POST',
          body: {
            imageBase64: 'base64-encoded-image-data',
            filename: 'optional-filename.pdf'
          }
        }
      });
    }

    if (req.method === 'POST') {
      const { imageBase64, filename } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: 'No imageBase64 provided' });
      }

      // Basic validation
      if (!imageBase64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        return res.status(400).json({ error: 'Invalid base64 format' });
      }

      // Test Anthropic import
      const { Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      // Simple test call
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe what you see in this image in detail.'
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: imageBase64
                }
              }
            ]
          }
        ]
      });

      return res.status(200).json({
        success: true,
        filename: filename || 'test-image',
        response: response.content[0].text,
        metadata: {
          method: 'vision-api-test',
          timestamp: new Date().toISOString()
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Vision test error:', error);
    return res.status(500).json({
      error: 'Vision test failed',
      details: error.message,
      type: error.constructor.name
    });
  }
}