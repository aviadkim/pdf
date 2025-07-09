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
    // Expect JSON with text content (not PDF)
    const { text, filename } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // Basic pattern extraction
    const isinPattern = /[A-Z]{2}[A-Z0-9]{9}[0-9]/g;
    const isins = text.match(isinPattern) || [];
    const uniqueIsins = [...new Set(isins)];

    // Look for currency values
    const valuePattern = /(?:USD|CHF|EUR)\s*[0-9]{1,3}(?:[',.]?[0-9]{3})*/gi;
    const values = text.match(valuePattern) || [];

    // Look for client name
    const clientMatch = text.match(/(?:Beneficiario|Client|Cliente)[\s:]*([^\n]+)/i);
    const clientName = clientMatch ? clientMatch[1].trim() : 'Not found';

    // Look for total
    const totalMatch = text.match(/(?:Total|Totale|Subtotale)[\s:]*(?:USD|CHF|EUR)?\s*([0-9]{1,3}(?:[',.]?[0-9]{3})*(?:[.,][0-9]{2})?)/i);
    const totalValue = totalMatch ? totalMatch[1] : 'Not found';

    // Use Claude if available
    let claudeData = null;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const { Anthropic } = await import('@anthropic-ai/sdk');
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const prompt = \`Extract ALL financial holdings from this Swiss banking document text. Be thorough and find every security:

\${text.substring(0, 15000)}

Return JSON with complete extraction:
{
  "portfolioInfo": {
    "clientName": "string",
    "totalValue": "string",
    "currency": "string"
  },
  "holdings": [
    {
      "securityName": "string",
      "isin": "string", 
      "value": "string",
      "currency": "string"
    }
  ],
  "summary": {
    "totalHoldingsFound": number,
    "accuracy": "high"
  }
}

Extract EVERY security you can find. Swiss documents often have 40+ holdings.\`;

        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          temperature: 0,
          messages: [{ role: 'user', content: prompt }]
        });

        const responseText = response.content[0].text;
        const jsonMatch = responseText.match(/\\{[\\s\\S]*\\}/);
        if (jsonMatch) {
          claudeData = JSON.parse(jsonMatch[0]);
        }
      } catch (apiError) {
        console.error('Claude API error:', apiError);
      }
    }

    return res.status(200).json({
      success: true,
      filename: filename || 'text-input',
      method: claudeData ? 'claude-api' : 'pattern-extraction',
      extraction: {
        textLength: text.length,
        clientName: clientName,
        totalValue: totalValue,
        isinsFound: uniqueIsins.length,
        valuesFound: values.length,
        isins: uniqueIsins.slice(0, 20),
        values: values.slice(0, 15),
        claudeData: claudeData
      }
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Processing failed',
      message: error.message,
      stack: error.stack
    });
  }
}