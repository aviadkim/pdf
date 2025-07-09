import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { Anthropic } from '@anthropic-ai/sdk';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize Anthropic with error handling
let anthropic;
try {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set');
  } else {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
} catch (error) {
  console.error('Failed to initialize Anthropic:', error);
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
    // Check if API key is configured
    if (!anthropic) {
      return res.status(500).json({ 
        error: 'API not configured',
        details: 'ANTHROPIC_API_KEY is missing. Please add it in Vercel Environment Variables.',
        help: 'Go to Vercel Dashboard > Settings > Environment Variables'
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

    // Parse PDF
    const pdfBuffer = fs.readFileSync(pdfFile.filepath);
    const pdfData = await pdfParse(pdfBuffer);
    
    // Clean up
    fs.unlinkSync(pdfFile.filepath);

    const pdfText = pdfData.text;
    if (!pdfText?.trim()) {
      return res.status(400).json({ error: 'No text found in PDF' });
    }

    // Claude analysis
    const extractionPrompt = \`
Analyze this financial PDF and extract ALL data with 100% accuracy:

1. **Portfolio Info**: Client name, bank, account number, report date, total value
2. **Holdings**: Security names, ISIN codes, quantities, values, currencies
3. **Asset Allocation**: Categories with values and percentages
4. **Performance**: YTD performance, gains/losses
5. **Transactions**: Any buy/sell activity

PDF Content:
\${pdfText}

Return structured JSON with all extracted data:
{
  "portfolioInfo": {
    "clientName": "string",
    "bankName": "string",
    "accountNumber": "string", 
    "reportDate": "YYYY-MM-DD",
    "totalValue": number,
    "currency": "string"
  },
  "holdings": [
    {
      "security": "string",
      "isin": "string",
      "quantity": number,
      "currentValue": number,
      "currency": "string",
      "marketPrice": number,
      "gainLoss": number
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
    "ytdPerformance": number,
    "ytdPercentage": "string",
    "totalGainLoss": number
  },
  "summary": {
    "totalHoldings": number,
    "accuracy": "100%"
  }
}

Extract EVERY piece of financial data. Be thorough and accurate.
\`;

    const startTime = Date.now();
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0,
      messages: [{ role: 'user', content: extractionPrompt }],
    });

    const processingTime = Date.now() - startTime;
    const extractedText = response.content[0].text;

    // Parse JSON from Claude's response
    let extractedData;
    try {
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      extractedData = {
        rawExtraction: extractedText,
        error: 'Failed to parse JSON',
        processingTime: \`\${processingTime}ms\`,
      };
    }

    return res.status(200).json({
      success: true,
      data: extractedData,
      metadata: {
        filename: pdfFile.originalFilename,
        fileSize: pdfFile.size,
        processingTime: \`\${processingTime}ms\`,
        extractedCharacters: pdfText.length,
        model: 'claude-3-5-sonnet-20241022'
      },
    });

  } catch (error) {
    console.error('Extraction error:', error);
    return res.status(500).json({
      error: 'PDF extraction failed',
      details: error.message,
    });
  }
}