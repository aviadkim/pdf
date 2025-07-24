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

    const { imageBase64, filename, imageInfo } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ 
        error: 'No image data provided',
        details: 'Please provide imageBase64 in the request body'
      });
    }

    // Check image size and provide feedback
    const imageSizeKB = Math.round((imageBase64.length * 0.75) / 1024);
    const imageSizeMB = Math.round(imageSizeKB / 1024 * 100) / 100;
    
    // Claude's vision API has limits - roughly 5MB for images
    if (imageSizeMB > 5) {
      return res.status(413).json({
        error: 'Image too large',
        details: `Image size: ${imageSizeMB}MB. Maximum supported: 5MB.`,
        suggestions: [
          'Try reducing the PDF scale in the conversion',
          'Process fewer pages at once',
          'Use lower quality image conversion'
        ],
        imageSize: {
          sizeKB: imageSizeKB,
          sizeMB: imageSizeMB,
          base64Length: imageBase64.length
        }
      });
    }

    // Initialize Anthropic client
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const startTime = Date.now();

    // Enhanced extraction prompt for multi-page documents
    const visionPrompt = `Analyze this complete financial document image (${imageInfo?.totalPages || 'multiple'} pages stacked vertically). This is a Swiss banking portfolio statement from Cornèr Banca SA.

CRITICAL INSTRUCTIONS:
1. This image contains ALL pages of the PDF stacked vertically
2. Scroll through the ENTIRE image from top to bottom
3. Extract EVERY single security/holding you can find
4. Don't stop at the first page - analyze the complete document

EXTRACT ALL OF THE FOLLOWING:

1. **Portfolio Overview:**
   - Client/Beneficiary name
   - Bank name (Cornèr Banca SA)
   - Account number
   - Report date
   - Total portfolio value with currency

2. **Individual Holdings (EXTRACT EVERY SINGLE ONE):**
   - Security name (combine multi-line names)
   - ISIN code (12 characters: XX0000000000)
   - Quantity/Units
   - Current market value
   - Currency (USD/CHF/EUR)
   - Gain/Loss if visible
   - Category (Bonds, Stocks, Structured Products, etc.)

3. **Asset Allocation:**
   - All categories with values and percentages
   - Liquidity, Bonds, Stocks, Structured Products, etc.

4. **Performance Metrics:**
   - YTD performance
   - Total gains/losses
   - Performance percentages

IMPORTANT NOTES:
- Swiss format: 1'234'567.89 (apostrophe thousands separator)
- Multi-line security names: combine them properly
- This document likely has 40+ holdings across all pages
- Look for sections like "Holdings", "Positions", "Securities"
- Check both summary tables and detailed listings

Return JSON in this exact format:
{
  "portfolioInfo": {
    "clientName": "string",
    "bankName": "Cornèr Banca SA",
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
      "gainLossPercent": number,
      "category": "string"
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
    "pagesProcessed": ${imageInfo?.totalPages || 'unknown'},
    "extractionAccuracy": "high",
    "method": "multi-page-vision"
  }
}

BE EXTREMELY THOROUGH. This is a complete multi-page document - extract EVERYTHING.`;

    // Call Claude Vision API with enhanced error handling
    let response;
    let retries = 2;
    
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
        break; // Success
      } catch (error) {
        retries--;
        
        // Handle specific errors
        if (error.message?.includes('overloaded') && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }
        
        if (error.message?.includes('too large') || error.message?.includes('size')) {
          return res.status(413).json({
            error: 'Image too large for Claude API',
            details: error.message,
            imageSize: {
              sizeKB: imageSizeKB,
              sizeMB: imageSizeMB
            },
            suggestions: [
              'Reduce PDF conversion scale',
              'Process fewer pages at once',
              'Try compressing the image'
            ]
          });
        }
        
        throw error;
      }
    }

    const processingTime = Date.now() - startTime;
    const responseText = response.content[0].text;

    // Parse JSON with better error handling
    let extractedData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, try to extract key information from text
        extractedData = {
          error: 'No structured JSON found',
          rawResponse: responseText,
          quickAnalysis: extractQuickInfo(responseText)
        };
      }
    } catch (parseError) {
      extractedData = {
        error: 'JSON parsing failed',
        rawResponse: responseText,
        parseError: parseError.message,
        quickAnalysis: extractQuickInfo(responseText)
      };
    }

    return res.status(200).json({
      success: true,
      filename: filename || 'multi-page-pdf',
      data: extractedData,
      metadata: {
        processingTime: `${processingTime}ms`,
        method: 'smart-multi-page-vision',
        model: 'claude-3-5-sonnet-20241022',
        imageSize: {
          sizeKB: imageSizeKB,
          sizeMB: imageSizeMB
        },
        pagesProcessed: imageInfo?.totalPages || 'unknown',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Smart vision extraction error:', error);
    
    // Enhanced error handling
    if (error.message?.includes('Request Entity Too Large')) {
      return res.status(413).json({
        error: 'Request too large',
        details: 'The PDF image is too large for processing. Try reducing the scale or processing fewer pages.',
        type: 'REQUEST_TOO_LARGE'
      });
    }
    
    if (error.message?.includes('overloaded')) {
      return res.status(503).json({
        error: 'Claude API temporarily unavailable',
        details: 'The AI service is currently overloaded. Please try again in a few moments.',
        type: 'API_OVERLOADED',
        retry: true
      });
    }
    
    return res.status(500).json({
      error: 'Smart vision extraction failed',
      details: error.message,
      type: error.constructor.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Helper function to extract quick info from text response
function extractQuickInfo(text) {
  const info = {};
  
  // Extract ISINs
  const isinMatches = text.match(/[A-Z]{2}[A-Z0-9]{9}[0-9]/g);
  if (isinMatches) {
    info.isinsFound = [...new Set(isinMatches)].length;
    info.sampleIsins = [...new Set(isinMatches)].slice(0, 5);
  }
  
  // Extract currency values
  const valueMatches = text.match(/(?:USD|CHF|EUR)\s*[0-9]{1,3}(?:[',.]?[0-9]{3})*/gi);
  if (valueMatches) {
    info.valuesFound = valueMatches.length;
    info.sampleValues = valueMatches.slice(0, 5);
  }
  
  // Extract client name
  const clientMatch = text.match(/(?:Beneficiario|Client|Cliente)[\s:]*([^\n.]+)/i);
  if (clientMatch) {
    info.clientName = clientMatch[1].trim();
  }
  
  return info;
}