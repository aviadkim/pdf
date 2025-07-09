import pdfParse from 'pdf-parse';
import { Anthropic } from '@anthropic-ai/sdk';

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
    // For Vercel, we need to handle the file upload differently
    // The body should contain the file data
    if (!req.body) {
      return res.status(400).json({ error: 'No file data received' });
    }

    // Get the raw body as buffer
    const chunks = [];
    req.setEncoding('binary');
    
    await new Promise((resolve, reject) => {
      req.on('data', chunk => chunks.push(Buffer.from(chunk, 'binary')));
      req.on('end', resolve);
      req.on('error', reject);
    });

    const body = Buffer.concat(chunks);
    
    // Extract PDF from multipart data
    const boundary = req.headers['content-type'].split('boundary=')[1];
    const parts = body.toString('binary').split(`--${boundary}`);
    
    let pdfBuffer = null;
    
    for (const part of parts) {
      if (part.includes('Content-Type: application/pdf')) {
        const dataStart = part.indexOf('\r\n\r\n') + 4;
        const dataEnd = part.lastIndexOf('\r\n');
        if (dataStart > 3 && dataEnd > dataStart) {
          pdfBuffer = Buffer.from(part.substring(dataStart, dataEnd), 'binary');
          break;
        }
      }
    }

    if (!pdfBuffer) {
      return res.status(400).json({ error: 'No PDF found in request' });
    }

    // Parse PDF
    const pdfData = await pdfParse(pdfBuffer);
    const pdfText = pdfData.text;

    if (!pdfText) {
      return res.status(400).json({ error: 'No text found in PDF' });
    }

    // If no API key, return basic extraction
    if (!process.env.ANTHROPIC_API_KEY) {
      // Basic pattern extraction
      const isinPattern = /[A-Z]{2}[A-Z0-9]{9}[0-9]/g;
      const isins = pdfText.match(isinPattern) || [];
      const uniqueIsins = [...new Set(isins)];

      return res.status(200).json({
        success: true,
        method: 'basic-pattern',
        data: {
          textLength: pdfText.length,
          pages: pdfData.numpages,
          isinsFound: uniqueIsins.length,
          isins: uniqueIsins.slice(0, 10),
          preview: pdfText.substring(0, 500)
        }
      });
    }

    // Use Claude API
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `Extract financial data from this PDF text. Return JSON only:
${pdfText.substring(0, 10000)}

Format: {"holdings": [...], "total": 0}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = response.content[0].text;
    let data;
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      data = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'No JSON found' };
    } catch (e) {
      data = { rawResponse: responseText };
    }

    return res.status(200).json({
      success: true,
      method: 'claude-api',
      data: data
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Processing failed',
      details: error.message,
      stack: error.stack
    });
  }
}