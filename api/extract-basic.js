import pdfParse from 'pdf-parse';
import { Anthropic } from '@anthropic-ai/sdk';
import { setSecurityHeaders, validatePDFInput, sanitizeOutput, createErrorResponse, checkRateLimit } from '../lib/security.js';

export default async function handler(req, res) {
  // Always set JSON content type first
  res.setHeader('Content-Type', 'application/json');
  
  // Security headers and CORS
  const origin = req.headers.origin;
  setSecurityHeaders(res, origin);
  
  // Rate limiting
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

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
    
    // Handle different request types
    let pdfBuffer = null;
    
    // Check if it's a JSON request with base64 data
    if (req.headers['content-type']?.includes('application/json')) {
      try {
        const jsonData = JSON.parse(body.toString());
        if (jsonData.pdfBase64) {
          pdfBuffer = Buffer.from(jsonData.pdfBase64, 'base64');
        }
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON data' });
      }
    } 
    // Handle multipart form data
    else if (req.headers['content-type']?.includes('multipart/form-data')) {
      try {
        const boundary = req.headers['content-type'].split('boundary=')[1];
        if (!boundary) {
          return res.status(400).json({ error: 'Missing boundary in multipart data' });
        }
        
        const parts = body.toString('binary').split(`--${boundary}`);
        
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
      } catch (e) {
        return res.status(400).json({ error: 'Failed to parse multipart data' });
      }
    } else {
      return res.status(400).json({ error: 'Unsupported content type' });
    }

    if (!pdfBuffer) {
      return res.status(400).json({ error: 'No PDF found in request' });
    }

    // Validate PDF input
    const validationErrors = validatePDFInput(pdfBuffer, 'uploaded.pdf');
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid file',
        details: validationErrors
      });
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
      data: sanitizeOutput(data)
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json(
      createErrorResponse(error, process.env.NODE_ENV === 'development')
    );
  }
}