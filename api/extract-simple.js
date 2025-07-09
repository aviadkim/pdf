import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Simple extraction without AI - just parse the PDF structure
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

    // Simple pattern-based extraction
    const extractedData = {
      rawText: pdfText.substring(0, 5000), // First 5000 chars for debugging
      extractedInfo: {},
      holdings: [],
      patterns: {}
    };

    // Extract client info
    const clientMatch = pdfText.match(/(?:Client|Beneficiario|Nome)[\s:]*([^\n]+)/i);
    if (clientMatch) extractedData.extractedInfo.client = clientMatch[1].trim();

    // Extract bank info
    const bankMatch = pdfText.match(/(?:Bank|Banca|Banco)[\s:]*([^\n]+)/i);
    if (bankMatch) extractedData.extractedInfo.bank = bankMatch[1].trim();

    // Extract date
    const dateMatch = pdfText.match(/(?:Date|Data|Fecha)[\s:]*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i);
    if (dateMatch) extractedData.extractedInfo.date = dateMatch[1];

    // Extract total value patterns
    const totalMatches = pdfText.match(/(?:Total|Totale|Subtotal)[\s:]*[\$€CHF\s]*([0-9,.']+)/gi);
    if (totalMatches) {
      extractedData.patterns.totals = totalMatches.map(match => {
        const value = match.match(/[0-9,.']+/);
        return value ? value[0] : null;
      }).filter(Boolean);
    }

    // Extract ISIN codes
    const isinMatches = pdfText.match(/[A-Z]{2}[A-Z0-9]{9}[0-9]/g);
    if (isinMatches) {
      extractedData.patterns.isins = [...new Set(isinMatches)];
    }

    // Extract securities with ISINs
    const lines = pdfText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isinMatch = line.match(/([A-Z]{2}[A-Z0-9]{9}[0-9])/);
      
      if (isinMatch) {
        const isin = isinMatch[1];
        let securityName = '';
        let value = '';
        
        // Look for security name in previous lines
        for (let j = Math.max(0, i - 3); j < i; j++) {
          if (lines[j].trim() && !lines[j].match(/^\d+$/) && lines[j].length > 5) {
            securityName = lines[j].trim();
            break;
          }
        }
        
        // Look for value in current or next lines
        for (let j = i; j <= Math.min(lines.length - 1, i + 3); j++) {
          const valueMatch = lines[j].match(/[\$€CHF\s]*([0-9]{1,3}(?:[',.]?[0-9]{3})*(?:[.,][0-9]{2})?)/);
          if (valueMatch) {
            value = valueMatch[1];
            break;
          }
        }
        
        if (securityName || value) {
          extractedData.holdings.push({
            security: securityName,
            isin: isin,
            value: value,
            lineNumber: i
          });
        }
      }
    }

    // Count key metrics
    extractedData.summary = {
      totalHoldings: extractedData.holdings.length,
      totalISINs: extractedData.patterns.isins?.length || 0,
      textLength: pdfText.length,
      extractionMethod: 'pattern-based',
      timestamp: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      data: extractedData,
      metadata: {
        filename: pdfFile.originalFilename,
        fileSize: pdfFile.size,
        pagesCount: pdfData.numpages,
        extractedCharacters: pdfText.length
      }
    });

  } catch (error) {
    console.error('Extraction error:', error);
    return res.status(500).json({
      error: 'PDF extraction failed',
      details: error.message
    });
  }
}