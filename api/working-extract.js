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
    // Expect JSON with base64 PDF data
    const { pdfBase64, filename } = req.body;
    
    if (!pdfBase64) {
      return res.status(400).json({ error: 'No PDF data provided' });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    
    // Try to extract text using pdf2json (more reliable for Vercel)
    let extractedText = '';
    try {
      const PDFParser = (await import('pdf2json')).default;
      
      // Create a promise-based wrapper for pdf2json
      const parsePDF = () => {
        return new Promise((resolve, reject) => {
          const pdfParser = new PDFParser(null, 1);
          
          pdfParser.on('pdfParser_dataError', reject);
          pdfParser.on('pdfParser_dataReady', (pdfData) => {
            // Extract text from pdf2json data
            let text = '';
            if (pdfData.Pages) {
              pdfData.Pages.forEach(page => {
                if (page.Texts) {
                  page.Texts.forEach(textItem => {
                    if (textItem.R) {
                      textItem.R.forEach(run => {
                        if (run.T) {
                          text += decodeURIComponent(run.T) + ' ';
                        }
                      });
                    }
                  });
                  text += '\\n';
                }
              });
            }
            resolve(text);
          });
          
          pdfParser.parseBuffer(pdfBuffer);
        });
      };
      
      extractedText = await parsePDF();
    } catch (pdfError) {
      return res.status(500).json({
        error: 'PDF parsing failed',
        details: pdfError.message
      });
    }

    if (!extractedText) {
      return res.status(400).json({ error: 'No text found in PDF' });
    }

    // Basic pattern extraction
    const isinPattern = /[A-Z]{2}[A-Z0-9]{9}[0-9]/g;
    const isins = extractedText.match(isinPattern) || [];
    const uniqueIsins = [...new Set(isins)];

    // Look for values
    const valuePattern = /(?:USD|CHF|EUR)\\s*[0-9]{1,3}(?:[',.]?[0-9]{3})*/gi;
    const values = extractedText.match(valuePattern) || [];

    // Use Claude if available
    let claudeData = null;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const { Anthropic } = await import('@anthropic-ai/sdk');
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const prompt = \`Extract financial holdings from this Swiss banking PDF text:

\${extractedText.substring(0, 10000)}

Return JSON with all securities: {"holdings": [{"name": "...", "isin": "...", "value": "..."}], "total": "..."}\`;

        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 3000,
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
      filename: filename || 'uploaded.pdf',
      method: claudeData ? 'claude-api' : 'pattern-extraction',
      extraction: {
        textLength: extractedText.length,
        isinsFound: uniqueIsins.length,
        valuesFound: values.length,
        isins: uniqueIsins.slice(0, 15),
        values: values.slice(0, 10),
        claudeData: claudeData,
        textPreview: extractedText.substring(0, 500)
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