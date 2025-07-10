import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { Anthropic } from '@anthropic-ai/sdk';
import sharp from 'sharp';
import { fromPath } from 'pdf2pic';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

export const config = {
  api: {
    bodyParser: false,
    maxDuration: 60, // 60 seconds for vision processing
  },
};

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Convert PDF to images for vision API
async function convertPDFToImages(pdfPath) {
  const tempDir = os.tmpdir();
  const options = {
    density: 200, // High quality
    saveFilename: 'page',
    savePath: tempDir,
    format: 'png',
    width: 2000,
    height: 2800
  };

  try {
    const converter = fromPath(pdfPath, options);
    const result = await converter(1, { responseType: 'buffer' }); // Convert first page
    
    if (result && result.buffer) {
      // Convert to base64 for Claude API
      return result.buffer.toString('base64');
    }
    
    throw new Error('Failed to convert PDF to image');
  } catch (error) {
    console.error('PDF to image conversion error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ 
        error: 'API not configured',
        details: 'ANTHROPIC_API_KEY is missing'
      });
    }

    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: ({ name, originalFilename, mimetype }) => {
        return name === 'pdf' && mimetype === 'application/pdf';
      },
    });

    const [fields, files] = await form.parse(req);
    const pdfFile = files.pdf?.[0];

    if (!pdfFile) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const startTime = Date.now();

    // First, extract text for context
    const pdfBuffer = fs.readFileSync(pdfFile.filepath);
    const pdfData = await pdfParse(pdfBuffer);
    const pdfText = pdfData.text;

    // Convert PDF to image for vision API
    let imageBase64;
    try {
      imageBase64 = await convertPDFToImages(pdfFile.filepath);
    } catch (conversionError) {
      console.error('Image conversion failed, falling back to text-only:', conversionError);
      // Fall back to text-only extraction
    }

    // Clean up uploaded file
    fs.unlinkSync(pdfFile.filepath);

    // Prepare the prompt for Claude
    const visionPrompt = `You are analyzing a financial PDF document. Extract ALL information with 100% accuracy.

${pdfText ? `Here's the text content for reference:\n${pdfText.substring(0, 8000)}\n\n` : ''}

Please extract and structure ALL of the following information:

1. **Portfolio Information**
   - Client/Beneficiary name
   - Bank name and details
   - Account number
   - Report date
   - Portfolio total value with currency

2. **Individual Holdings** (EXTRACT EVERY SINGLE ONE)
   - Security name
   - ISIN code
   - Quantity/Units
   - Current market value
   - Currency
   - Purchase price/cost basis
   - Gain/Loss amount and percentage
   - Asset category

3. **Asset Allocation**
   - Category breakdowns (Bonds, Stocks, Liquidity, etc.)
   - Values and percentages for each category

4. **Performance Metrics**
   - YTD performance
   - Period performance
   - Total gains/losses

5. **Transaction History** (if present)
   - Buy/Sell transactions
   - Dates and amounts

Return the data in this exact JSON structure:
{
  "portfolioInfo": {
    "clientName": "",
    "bankName": "",
    "accountNumber": "",
    "reportDate": "",
    "portfolioTotal": {
      "value": 0,
      "currency": ""
    }
  },
  "holdings": [
    {
      "securityName": "",
      "isin": "",
      "quantity": 0,
      "currentValue": 0,
      "currency": "",
      "purchaseValue": 0,
      "gainLoss": 0,
      "gainLossPercent": 0,
      "category": ""
    }
  ],
  "assetAllocation": [
    {
      "category": "",
      "value": 0,
      "percentage": ""
    }
  ],
  "performance": {
    "ytd": 0,
    "ytdPercent": "",
    "periodGainLoss": 0
  },
  "extractionQuality": {
    "totalHoldingsFound": 0,
    "confidence": "high",
    "method": "vision+text"
  }
}

BE EXTREMELY THOROUGH. Extract EVERY security, EVERY ISIN, EVERY value. Do not summarize or skip any holdings.`;

    let extractedData;
    let retries = 3;
    
    while (retries > 0) {
      try {
        const messages = [{
          role: 'user',
          content: imageBase64 ? [
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
          ] : visionPrompt
        }];

        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          temperature: 0,
          messages: messages
        });

        const responseText = response.content[0].text;
        
        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
          break;
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (error) {
        if (error.message?.includes('overloaded') && retries > 1) {
          console.log(`API overloaded, retrying... (${retries - 1} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries--;
        } else {
          throw error;
        }
      }
    }

    const processingTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      data: extractedData,
      metadata: {
        filename: pdfFile.originalFilename,
        fileSize: pdfFile.size,
        processingTime: `${processingTime}ms`,
        pagesCount: pdfData.numpages,
        method: imageBase64 ? 'vision+text' : 'text-only',
        textLength: pdfText.length
      }
    });

  } catch (error) {
    console.error('Vision extraction error:', error);
    
    if (error.message?.includes('overloaded')) {
      return res.status(503).json({
        error: 'Claude API temporarily unavailable',
        details: 'The AI service is currently overloaded. Please try again.',
        type: 'API_OVERLOADED'
      });
    }
    
    return res.status(500).json({
      error: 'Vision extraction failed',
      details: error.message,
      type: error.constructor.name
    });
  }
}