import { Buffer } from 'buffer';
import pdfParse from 'pdf-parse';
import { Anthropic } from '@anthropic-ai/sdk';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper to parse multipart form data manually
async function parseFormData(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  
  // Extract boundary from content-type
  const contentType = req.headers['content-type'];
  const boundary = contentType.split('boundary=')[1];
  
  // Simple extraction of PDF data
  const parts = buffer.toString('binary').split(`--${boundary}`);
  
  for (const part of parts) {
    if (part.includes('Content-Type: application/pdf')) {
      // Find where the actual PDF data starts (after double newline)
      const dataStart = part.indexOf('\r\n\r\n') + 4;
      const dataEnd = part.lastIndexOf('\r\n');
      
      if (dataStart > 3 && dataEnd > dataStart) {
        const pdfData = Buffer.from(part.substring(dataStart, dataEnd), 'binary');
        return pdfData;
      }
    }
  }
  
  throw new Error('No PDF found in upload');
}

export default async function handler(req, res) {
  // Enable CORS
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

    // Parse the uploaded PDF
    let pdfBuffer;
    try {
      pdfBuffer = await parseFormData(req);
    } catch (parseError) {
      return res.status(400).json({ 
        error: 'Failed to parse upload',
        details: parseError.message 
      });
    }

    const startTime = Date.now();

    // Extract text from PDF
    const pdfData = await pdfParse(pdfBuffer);
    const pdfText = pdfData.text;
    
    if (!pdfText?.trim()) {
      return res.status(400).json({ error: 'No text content found in PDF' });
    }

    // Create extraction prompt
    const extractionPrompt = \`Analyze this Swiss bank portfolio PDF and extract ALL financial data:

DOCUMENT TEXT:
\${pdfText.substring(0, 15000)}

Extract and return in this JSON format:
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
      "currency": "string"
    }
  ],
  "assetAllocation": [
    {
      "category": "string",
      "value": number,
      "percentage": "string"
    }
  ],
  "summary": {
    "totalHoldingsFound": number,
    "extractionMethod": "claude-api"
  }
}

Remember:
- Swiss numbers use apostrophes: 19'461'320.00
- Extract ALL holdings (likely 40+)
- Multi-line security names should be combined
- ISINs are 12 characters starting with 2 letters\`;

    // Call Claude API with retry
    let extractedData;
    let retries = 3;
    
    while (retries > 0) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          temperature: 0,
          messages: [{
            role: 'user',
            content: extractionPrompt
          }]
        });

        const responseText = response.content[0].text;
        
        // Extract JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
          break;
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (error) {
        if (error.message?.includes('overloaded') && retries > 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries--;
        } else {
          throw error;
        }
      }
    }

    if (!extractedData) {
      throw new Error('Failed to extract data after retries');
    }

    const processingTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      data: extractedData,
      metadata: {
        processingTime: \`\${processingTime}ms\`,
        pagesCount: pdfData.numpages,
        textLength: pdfText.length,
        method: 'fixed-extraction'
      }
    });

  } catch (error) {
    console.error('Extraction error:', error);
    
    if (error.message?.includes('overloaded')) {
      return res.status(503).json({
        error: 'Claude API temporarily unavailable',
        details: 'The AI service is currently overloaded. Please try again.',
        type: 'API_OVERLOADED'
      });
    }
    
    return res.status(500).json({
      error: 'Extraction failed',
      details: error.message,
      type: error.constructor.name
    });
  }
}