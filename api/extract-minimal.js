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
    // Test if we can import pdf-parse
    let pdfParse;
    try {
      pdfParse = (await import('pdf-parse')).default;
    } catch (importError) {
      return res.status(500).json({
        error: 'pdf-parse import failed',
        details: importError.message
      });
    }

    // Test if we can import Anthropic
    let Anthropic;
    try {
      Anthropic = (await import('@anthropic-ai/sdk')).Anthropic;
    } catch (importError) {
      return res.status(500).json({
        error: 'Anthropic import failed',
        details: importError.message
      });
    }

    // Basic response for now
    return res.status(200).json({
      status: 'Imports successful',
      pdfParseLoaded: !!pdfParse,
      anthropicLoaded: !!Anthropic,
      hasApiKey: !!process.env.ANTHROPIC_API_KEY,
      message: 'Ready to process PDF'
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Handler failed',
      message: error.message,
      stack: error.stack
    });
  }
}