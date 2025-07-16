// 🌐 PUBLIC API - NO AUTHENTICATION REQUIRED
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import formidable from 'formidable';
import fs from 'fs';

// Fixed import for pdf-parse
let pdfParse;
try {
  pdfParse = (await import('pdf-parse')).default;
} catch (error) {
  console.error('PDF-parse import error:', error);
  // Fallback for CommonJS
  pdfParse = require('pdf-parse');
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('🌐 PUBLIC API - Processing request without authentication');
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent, X-Requested-With');
  res.setHeader('X-API-Version', '2.0');
  res.setHeader('X-No-Auth-Required', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['POST', 'OPTIONS'],
      noAuthRequired: true
    });
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: ({ name, originalFilename, mimetype }) => {
        return name === 'pdf' && mimetype === 'application/pdf';
      },
    });

    const [fields, files] = await form.parse(req);
    const pdfFile = files.pdf?.[0];

    if (!pdfFile) {
      return res.status(400).json({ 
        error: 'No PDF file uploaded',
        noAuthRequired: true,
        help: 'Please upload a PDF file using the "pdf" field'
      });
    }

    const pdfBuffer = fs.readFileSync(pdfFile.filepath);
    const pdfData = await pdfParse(pdfBuffer);
    
    fs.unlinkSync(pdfFile.filepath);

    const pdfText = pdfData.text;
    if (!pdfText?.trim()) {
      return res.status(400).json({ 
        error: 'No text found in PDF',
        noAuthRequired: true
      });
    }

    console.log('🚀 Starting processing...');
    const startTime = Date.now();
    
    // Simple processing for public API
    const lines = pdfText.split('\n');
    const isins = [];
    const values = [];
    
    // Find ISINs
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isinMatch = line.match(/ISIN:\s*([A-Z]{2}[A-Z0-9]{10})/);
      if (isinMatch) {
        isins.push(isinMatch[1]);
      }
    }
    
    // Find Swiss formatted values
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const swissMatches = line.match(/\d{1,3}(?:'\d{3})+/g);
      if (swissMatches) {
        swissMatches.forEach(swissValue => {
          const numericValue = parseInt(swissValue.replace(/'/g, ''));
          if (numericValue >= 50000 && numericValue <= 50000000) {
            values.push(numericValue);
          }
        });
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    return res.status(200).json({
      success: true,
      message: `Public API processing: ${isins.length} ISINs, ${values.length} values found`,
      noAuthRequired: true,
      publicAPI: true,
      data: {
        isins: isins,
        values: values,
        totalValue: values.reduce((sum, v) => sum + v, 0),
        processingTime: `${processingTime}ms`
      },
      metadata: {
        filename: pdfFile.originalFilename,
        fileSize: pdfFile.size,
        textLength: pdfText.length,
        apiVersion: '2.0-public'
      }
    });

  } catch (error) {
    console.error('Public API error:', error);
    
    return res.status(500).json({
      error: 'PDF processing failed',
      details: error.message,
      noAuthRequired: true,
      publicAPI: true,
      timestamp: new Date().toISOString()
    });
  }
}