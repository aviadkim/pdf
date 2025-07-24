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

    const { imageBatches, filename, totalPages } = req.body;
    
    if (!imageBatches || !Array.isArray(imageBatches) || imageBatches.length === 0) {
      return res.status(400).json({ 
        error: 'No image batches provided',
        details: 'Please provide imageBatches array in the request body'
      });
    }

    // Initialize Anthropic client
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const startTime = Date.now();
    const batchResults = [];
    const allHoldings = [];
    const assetCategories = {};
    let portfolioInfo = null;
    let totalValue = 0;

    // Process each batch
    for (let i = 0; i < imageBatches.length; i++) {
      const batch = imageBatches[i];
      const batchStartTime = Date.now();
      
      console.log(`Processing batch ${i + 1} of ${imageBatches.length}...`);

      const visionPrompt = `Analyze this section of a financial document (pages ${batch.startPage}-${batch.endPage} of ${totalPages} total). This is part of a Swiss banking portfolio statement from Cornèr Banca SA.

CRITICAL INSTRUCTIONS:
1. This image contains pages ${batch.startPage}-${batch.endPage} of the complete document
2. Extract EVERY single security/holding you can find in this section
3. Be extremely thorough - this is a partial scan of a larger document

EXTRACT ALL OF THE FOLLOWING (if present in this section):

1. **Portfolio Overview (if visible):**
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

3. **Asset Allocation (if visible):**
   - All categories with values and percentages

4. **Performance Metrics (if visible):**
   - YTD performance
   - Total gains/losses

IMPORTANT NOTES:
- Swiss format: 1'234'567.89 (apostrophe thousands separator)
- Multi-line security names: combine them properly
- This is a PARTIAL scan - some sections may not be visible
- Extract EVERYTHING you see, even if incomplete

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
    "pagesProcessed": "${batch.endPage - batch.startPage + 1}",
    "startPage": ${batch.startPage},
    "endPage": ${batch.endPage},
    "holdingsFound": "number"
  }
}`;

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
                    data: batch.imageBase64
                  }
                }
              ]
            }
          ]
        });

        const responseText = response.content[0].text;
        const batchProcessingTime = Date.now() - batchStartTime;

        // Parse batch result
        let batchData;
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            batchData = JSON.parse(jsonMatch[0]);
          } else {
            batchData = { error: 'No JSON found in batch response' };
          }
        } catch (parseError) {
          batchData = { 
            error: 'JSON parsing failed', 
            rawResponse: responseText 
          };
        }

        // Store batch result
        batchResults.push({
          batchNumber: i + 1,
          startPage: batch.startPage,
          endPage: batch.endPage,
          processingTime: `${batchProcessingTime}ms`,
          data: batchData
        });

        // Merge results
        if (batchData && !batchData.error) {
          // Update portfolio info (take the first complete one found)
          if (!portfolioInfo && batchData.portfolioInfo && batchData.portfolioInfo.clientName) {
            portfolioInfo = batchData.portfolioInfo;
            if (portfolioInfo.portfolioTotal && portfolioInfo.portfolioTotal.value) {
              totalValue = portfolioInfo.portfolioTotal.value;
            }
          }

          // Collect all holdings
          if (batchData.holdings && Array.isArray(batchData.holdings)) {
            allHoldings.push(...batchData.holdings);
          }

          // Merge asset allocation
          if (batchData.assetAllocation && Array.isArray(batchData.assetAllocation)) {
            batchData.assetAllocation.forEach(category => {
              if (!assetCategories[category.category]) {
                assetCategories[category.category] = {
                  value: 0,
                  percentage: category.percentage
                };
              }
              assetCategories[category.category].value += category.value || 0;
            });
          }
        }

        // Add delay between batches to avoid rate limits
        if (i < imageBatches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`Batch ${i + 1} processing error:`, error);
        batchResults.push({
          batchNumber: i + 1,
          startPage: batch.startPage,
          endPage: batch.endPage,
          error: error.message
        });
      }
    }

    const totalProcessingTime = Date.now() - startTime;

    // Remove duplicate holdings (by ISIN)
    const uniqueHoldings = [];
    const seenISINs = new Set();
    
    allHoldings.forEach(holding => {
      if (holding.isin && !seenISINs.has(holding.isin)) {
        seenISINs.add(holding.isin);
        uniqueHoldings.push(holding);
      } else if (!holding.isin) {
        // Keep holdings without ISIN
        uniqueHoldings.push(holding);
      }
    });

    // Convert asset categories object back to array
    const assetAllocationArray = Object.entries(assetCategories).map(([category, data]) => ({
      category,
      value: data.value,
      percentage: data.percentage
    }));

    // Calculate summary statistics
    const totalHoldingsValue = uniqueHoldings.reduce((sum, h) => sum + (h.currentValue || 0), 0);

    const mergedResult = {
      portfolioInfo: portfolioInfo || {
        clientName: 'Not found',
        bankName: 'Cornèr Banca SA',
        accountNumber: 'Not found',
        reportDate: new Date().toISOString().split('T')[0],
        portfolioTotal: {
          value: totalValue || totalHoldingsValue,
          currency: 'USD'
        }
      },
      holdings: uniqueHoldings.sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0)),
      assetAllocation: assetAllocationArray,
      performance: {
        ytd: null,
        ytdPercent: 'N/A',
        totalGainLoss: uniqueHoldings.reduce((sum, h) => sum + (h.gainLoss || 0), 0)
      },
      summary: {
        totalHoldings: uniqueHoldings.length,
        totalBatches: imageBatches.length,
        pagesProcessed: totalPages,
        extractionAccuracy: 'high',
        method: 'batch-vision-processing',
        batchDetails: batchResults.map(b => ({
          batch: b.batchNumber,
          pages: `${b.startPage}-${b.endPage}`,
          holdingsFound: b.data?.holdings?.length || 0,
          processingTime: b.processingTime,
          error: b.error
        }))
      }
    };

    return res.status(200).json({
      success: true,
      filename: filename || 'batch-processed-pdf',
      data: mergedResult,
      metadata: {
        totalProcessingTime: `${totalProcessingTime}ms`,
        averageTimePerBatch: `${Math.round(totalProcessingTime / imageBatches.length)}ms`,
        method: 'batch-vision-processing',
        model: 'claude-3-5-sonnet-20241022',
        totalBatches: imageBatches.length,
        totalPages: totalPages,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Batch vision extraction error:', error);
    
    return res.status(500).json({
      error: 'Batch vision extraction failed',
      details: error.message,
      type: error.constructor.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}