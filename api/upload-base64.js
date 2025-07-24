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
    // Expect JSON body with base64 PDF data
    const { pdfBase64, filename } = req.body;
    
    if (!pdfBase64) {
      return res.status(400).json({ error: 'No PDF data provided' });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    
    // Parse PDF
    const pdfData = await pdfParse(pdfBuffer);
    const pdfText = pdfData.text;

    if (!pdfText) {
      return res.status(400).json({ error: 'No text found in PDF' });
    }

    // Basic extraction
    const isinPattern = /[A-Z]{2}[A-Z0-9]{9}[0-9]/g;
    const isins = pdfText.match(isinPattern) || [];
    const uniqueIsins = [...new Set(isins)];

    // Look for total value
    const totalMatch = pdfText.match(/(?:Total|Totale|Subtotale)[\s:]*(?:USD|CHF|EUR)?\s*([0-9]{1,3}(?:[',.]?[0-9]{3})*(?:[.,][0-9]{2})?)/i);
    const totalValue = totalMatch ? totalMatch[1] : 'Not found';

    // If API key exists, use Claude
    let claudeData = null;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const prompt = `Extract all financial holdings from this Swiss bank statement. Find ALL securities with ISINs and values.

PDF Text:
${pdfText.substring(0, 12000)}

Return JSON: {"holdings": [{"name": "...", "isin": "...", "value": 0}], "total": 0}`;

        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 3000,
          temperature: 0,
          messages: [{ role: 'user', content: prompt }]
        });

        const responseText = response.content[0].text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          claudeData = JSON.parse(jsonMatch[0]);
        }
      } catch (apiError) {
        console.error('Claude API error:', apiError.message);
      }
    }

    return res.status(200).json({
      success: true,
      filename: filename || 'uploaded.pdf',
      extraction: {
        method: claudeData ? 'claude-ai' : 'basic-pattern',
        pages: pdfData.numpages,
        textLength: pdfText.length,
        isinsFound: uniqueIsins.length,
        totalValue: totalValue,
        isins: uniqueIsins.slice(0, 20),
        claudeData: claudeData,
        preview: pdfText.substring(0, 300)
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Processing failed',
      details: error.message
    });
  }
}