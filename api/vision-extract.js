export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ 
        error: 'API not configured',
        details: 'ANTHROPIC_API_KEY environment variable is missing'
      });
    }

    // Parse request body
    const { imageBase64, filename } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ 
        error: 'No image data provided',
        details: 'Please provide imageBase64 in the request body'
      });
    }

    // Initialize Anthropic client
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const startTime = Date.now();

    // Create comprehensive extraction prompt
    const visionPrompt = `Analyze this financial document image and extract ALL data with 100% accuracy. This is a Swiss banking portfolio statement that contains detailed financial information.

Extract the following information:

1. **Portfolio Overview:**
   - Client/Beneficiary name
   - Bank name (likely Cornèr Banca SA)
   - Account number
   - Report date
   - Total portfolio value with currency

2. **Individual Holdings (EXTRACT EVERY SINGLE ONE):**
   - Security name (may span multiple lines)
   - ISIN code (format: XX0000000000)
   - Quantity/Units
   - Current market value
   - Currency
   - Gain/Loss if visible

3. **Asset Allocation:**
   - Categories (Bonds, Stocks, Structured Products, Liquidity, etc.)
   - Values and percentages for each category

4. **Performance Metrics:**
   - YTD performance
   - Total gains/losses
   - Performance percentages

IMPORTANT NOTES:
- Swiss number format uses apostrophes as thousand separators (e.g., 1'234'567.89)
- Security names often span multiple lines - combine them
- ISINs are always 12 characters starting with 2 letters
- This document likely contains 40+ individual holdings - extract ALL of them
- Be extremely thorough and don't miss any securities

Return the data in this exact JSON format:
{
  "portfolioInfo": {
    "clientName": "string",
    "bankName": "string",
    "accountNumber": "string",
    "reportDate": "YYYY-MM-DD",
    "portfolioTotal": {
      "value": number,
      "currency": "string"
    }
  },
  "holdings": [
    {
      "securityName": "string",
      "isin": "string",
      "quantity": number,
      "currentValue": number,
      "currency": "string",
      "gainLoss": number,
      "gainLossPercent": number
    }
  ],
  "assetAllocation": [
    {
      "category": "string",
      "value": number,
      "percentage": "string"
    }
  ],
  "performance": {
    "ytd": number,
    "ytdPercent": "string",
    "totalGainLoss": number
  },
  "summary": {
    "totalHoldings": number,
    "extractionAccuracy": "100%",
    "method": "vision-api"
  }
}

BE EXTREMELY THOROUGH. Extract EVERY security, EVERY ISIN, EVERY value you can see.`;

    // Call Claude Vision API with retry logic
    let response;
    let retries = 3;
    
    while (retries > 0) {
      try {
        response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          temperature: 0,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: visionPrompt
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
        break; // Success, exit retry loop
      } catch (error) {
        retries--;
        if (error.message?.includes('overloaded') && retries > 0) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        throw error; // Re-throw if not overloaded or no retries left
      }
    }

    const processingTime = Date.now() - startTime;
    const responseText = response.content[0].text;

    // Parse JSON from Claude's response
    let extractedData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = {
          error: 'No JSON found in response',
          rawResponse: responseText
        };
      }
    } catch (parseError) {
      extractedData = {
        error: 'JSON parsing failed',
        rawResponse: responseText,
        parseError: parseError.message
      };
    }

    return res.status(200).json({
      success: true,
      filename: filename || 'uploaded-image.png',
      data: extractedData,
      metadata: {
        processingTime: `${processingTime}ms`,
        method: 'claude-vision-api',
        model: 'claude-3-5-sonnet-20241022',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Vision extraction error:', error);
    
    // Handle specific error types
    if (error.message?.includes('overloaded')) {
      return res.status(503).json({
        error: 'Claude API temporarily unavailable',
        details: 'The AI service is currently overloaded. Please try again in a few moments.',
        type: 'API_OVERLOADED',
        retry: true
      });
    }
    
    if (error.message?.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        details: 'Too many requests. Please wait before trying again.',
        type: 'RATE_LIMITED',
        retry: true
      });
    }
    
    return res.status(500).json({
      error: 'Vision extraction failed',
      details: error.message,
      type: error.constructor.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}