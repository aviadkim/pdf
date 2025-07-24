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

    const { imageBase64, startPage, endPage, batchNumber, totalBatches, filename, totalPages } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ 
        error: 'No image data provided',
        details: 'Please provide imageBase64 in the request body'
      });
    }

    // Check image size for this single batch
    const imageSizeKB = Math.round((imageBase64.length * 0.75) / 1024);
    const imageSizeMB = Math.round(imageSizeKB / 1024 * 100) / 100;
    
    // Single batch should be under 5MB
    if (imageSizeMB > 5) {
      return res.status(413).json({
        error: 'Single batch too large',
        details: `Batch ${batchNumber} size: ${imageSizeMB}MB. Maximum supported: 5MB per batch.`,
        suggestions: [
          'Reduce pages per batch (currently processing 5 pages)',
          'Use lower quality conversion (currently using 3x scale)',
          'Split this batch further'
        ],
        batchInfo: {
          batchNumber,
          startPage,
          endPage,
          sizeKB: imageSizeKB,
          sizeMB: imageSizeMB
        }
      });
    }

    // Initialize Anthropic client
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const startTime = Date.now();

    const visionPrompt = `Analyze this section of a financial document (pages ${startPage}-${endPage} of ${totalPages} total). This is part ${batchNumber} of ${totalBatches} from a Swiss banking portfolio statement from Cornèr Banca SA.

CRITICAL INSTRUCTIONS:
1. This image contains pages ${startPage}-${endPage} of the complete document
2. Extract EVERY single security/holding you can find in this section
3. Be extremely thorough - this is batch ${batchNumber} of ${totalBatches}

EXTRACT ALL OF THE FOLLOWING (if present in this section):

1. **Portfolio Overview (if visible in this batch):**
   - Client/Beneficiary name
   - Bank name (Cornèr Banca SA)
   - Account number
   - Report date
   - Total portfolio value with currency

2. **Individual Holdings (EXTRACT EVERY SINGLE ONE in this section):**
   - Security name (combine multi-line names)
   - ISIN code (12 characters: XX0000000000)
   - Quantity/Units
   - Current market value
   - Currency (USD/CHF/EUR)
   - Gain/Loss if visible
   - Category (Bonds, Stocks, Structured Products, etc.)

3. **Asset Allocation (if visible in this batch):**
   - All categories with values and percentages

4. **Performance Metrics (if visible in this batch):**
   - YTD performance
   - Total gains/losses

IMPORTANT NOTES:
- Swiss format: 1'234'567.89 (apostrophe thousands separator)
- Multi-line security names: combine them properly
- This is batch ${batchNumber} of ${totalBatches} - extract EVERYTHING visible
- Some sections may not be in this batch - that's OK

Return JSON in this exact format:
{
  "portfolioInfo": {
    "clientName": "string or null",
    "bankName": "string or null",
    "accountNumber": "string or null",
    "reportDate": "YYYY-MM-DD or null",
    "portfolioTotal": {
      "value": number or null,
      "currency": "string or null"
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
  "batchInfo": {
    "batchNumber": ${batchNumber},
    "totalBatches": ${totalBatches},
    "pagesProcessed": "${endPage - startPage + 1}",
    "startPage": ${startPage},
    "endPage": ${endPage},
    "holdingsFound": "number"
  }
}

BE EXTREMELY THOROUGH. Extract EVERYTHING you see in this batch.`;

    try {
      const response = await anthropic.messages.create({
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

      const processingTime = Date.now() - startTime;
      const responseText = response.content[0].text;

      // Parse JSON with better error handling
      let extractedData;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          extractedData = {
            error: 'No JSON found in batch response',
            rawResponse: responseText.substring(0, 500) + '...'
          };
        }
      } catch (parseError) {
        extractedData = {
          error: 'JSON parsing failed',
          rawResponse: responseText.substring(0, 500) + '...',
          parseError: parseError.message
        };
      }

      return res.status(200).json({
        success: true,
        batchNumber: batchNumber,
        filename: filename || 'single-batch-pdf',
        data: extractedData,
        metadata: {
          processingTime: `${processingTime}ms`,
          method: 'single-batch-vision',
          model: 'claude-3-5-sonnet-20241022',
          batchInfo: {
            batchNumber,
            totalBatches,
            startPage,
            endPage,
            pagesInBatch: endPage - startPage + 1
          },
          imageSize: {
            sizeKB: imageSizeKB,
            sizeMB: imageSizeMB
          },
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error(`Single batch ${batchNumber} processing error:`, error);
      
      // Handle specific errors
      if (error.message?.includes('overloaded')) {
        return res.status(503).json({
          error: 'Claude API temporarily unavailable',
          details: 'The AI service is currently overloaded. Please try again in a few moments.',
          batchNumber,
          retry: true
        });
      }
      
      if (error.message?.includes('too large') || error.message?.includes('size')) {
        return res.status(413).json({
          error: 'Batch image too large for Claude API',
          details: error.message,
          batchNumber,
          imageSize: {
            sizeKB: imageSizeKB,
            sizeMB: imageSizeMB
          }
        });
      }
      
      throw error;
    }

  } catch (error) {
    console.error('Single batch extraction error:', error);
    
    return res.status(500).json({
      error: 'Single batch extraction failed',
      details: error.message,
      batchNumber: req.body.batchNumber || 'unknown',
      type: error.constructor.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}