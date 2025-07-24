import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { Anthropic } from '@anthropic-ai/sdk';

export const config = {
  api: {
    bodyParser: false,
    maxDuration: 30,
  },
};

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Advanced extraction prompt that mimics Claude's understanding
const createAdvancedPrompt = (pdfText) => `You are a financial document expert analyzing a Swiss bank portfolio statement. Your task is to extract ALL data with the same precision as if you were viewing the actual document.

TEXT CONTENT:
${pdfText}

EXTRACTION REQUIREMENTS:

1. **Portfolio Overview**
   - Find and extract the client name (look for "Beneficiario", "Client", variations)
   - Bank name (Cornèr Banca SA or similar)
   - Account/Portfolio number
   - Statement date (format: DD.MM.YYYY or DD/MM/YYYY)
   - Base currency and total portfolio value

2. **Holdings Extraction** (CRITICAL - Extract EVERY single one)
   Look for patterns like:
   - Security name (often multi-line, before ISIN)
   - ISIN code (format: XX0000000000)
   - Quantity/Units (look for "Quantità", "Quantity", "Units")
   - Current value (look for numbers with currency symbols or codes)
   - Purchase value/cost basis
   - Gain/Loss (absolute and percentage)
   
   Common patterns in Swiss statements:
   - Values use apostrophe as thousand separator: 1'234'567.89
   - Percentages shown as: +12.34% or -5.67%
   - Multi-line security names are common

3. **Asset Categories**
   Extract allocation by category:
   - Liquidity/Cash ("Liquidità")
   - Bonds ("Obbligazioni")
   - Stocks/Equities ("Azioni")
   - Structured Products ("Prodotti strutturati")
   - Alternative Investments

4. **Performance Metrics**
   - YTD performance
   - Period returns
   - Total unrealized gains/losses

IMPORTANT PARSING RULES:
- Swiss number format: 19'461'320.00 = 19461320.00
- When security names span multiple lines, combine them
- ISINs are ALWAYS 12 characters starting with 2 letters
- Values immediately after ISINs are usually quantities
- Larger values (millions) are portfolio values, not quantities

Return a JSON with this EXACT structure, ensuring all numeric values are properly parsed:

{
  "portfolioInfo": {
    "clientName": "Extract exact name",
    "bankName": "Cornèr Banca SA or as found",
    "accountNumber": "As found in document",
    "reportDate": "YYYY-MM-DD format",
    "portfolioTotal": {
      "value": 19461320, // Parse Swiss format correctly
      "currency": "USD"
    }
  },
  "holdings": [
    {
      "securityName": "Full security name, combine if multi-line",
      "isin": "XX0000000000",
      "quantity": 1234.56,
      "currentValue": 1234567.89,
      "currency": "USD",
      "purchaseValue": 1000000.00,
      "gainLoss": 234567.89,
      "gainLossPercent": 23.46,
      "category": "Bonds/Stocks/etc"
    }
    // ... ALL holdings, don't skip any
  ],
  "assetAllocation": [
    {
      "category": "Category name",
      "value": 1234567.89,
      "percentage": "12.34%"
    }
  ],
  "performance": {
    "ytd": 1.51,
    "ytdPercent": "1.51%",
    "totalGainLoss": 290195.01
  },
  "extractionQuality": {
    "totalHoldingsFound": 40, // Actual count
    "confidence": "high",
    "method": "advanced-text-analysis"
  }
}

BE EXTREMELY THOROUGH. This document likely contains 40+ holdings. Extract EVERY SINGLE ONE.`;

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
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ 
        error: 'API not configured',
        details: 'ANTHROPIC_API_KEY is missing'
      });
    }

    const form = formidable({
      maxFileSize: 10 * 1024 * 1024,
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

    // Extract text from PDF
    const pdfBuffer = fs.readFileSync(pdfFile.filepath);
    const pdfData = await pdfParse(pdfBuffer);
    fs.unlinkSync(pdfFile.filepath);

    const pdfText = pdfData.text;
    if (!pdfText?.trim()) {
      return res.status(400).json({ error: 'No text content found in PDF' });
    }

    // Use advanced prompt with retry logic
    let extractedData;
    let retries = 3;
    let lastError;
    
    while (retries > 0) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          temperature: 0,
          messages: [{
            role: 'user',
            content: createAdvancedPrompt(pdfText)
          }]
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
        lastError = error;
        if (error.message?.includes('overloaded') && retries > 1) {
          console.log(`API overloaded, retrying... (${retries - 1} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries--;
        } else {
          throw error;
        }
      }
    }

    if (!extractedData) {
      throw lastError || new Error('Failed to extract data');
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
        textLength: pdfText.length,
        method: 'advanced-text-analysis'
      }
    });

  } catch (error) {
    console.error('Advanced extraction error:', error);
    
    if (error.message?.includes('overloaded')) {
      return res.status(503).json({
        error: 'Claude API temporarily unavailable',
        details: 'The AI service is currently overloaded. Please try again.',
        type: 'API_OVERLOADED'
      });
    }
    
    return res.status(500).json({
      error: 'Advanced extraction failed',
      details: error.message,
      type: error.constructor.name
    });
  }
}