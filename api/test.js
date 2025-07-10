export default function handler(req, res) {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const keyLength = process.env.ANTHROPIC_API_KEY?.length || 0;
  const keyPreview = process.env.ANTHROPIC_API_KEY 
    ? `${process.env.ANTHROPIC_API_KEY.substring(0, 7)}...${process.env.ANTHROPIC_API_KEY.slice(-4)}`
    : 'NOT SET';

  res.status(200).json({
    status: 'API Key Test',
    apiKeySet: hasApiKey,
    keyLength: keyLength,
    keyPreview: keyPreview,
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    message: hasApiKey 
      ? '✅ API key is configured' 
      : '❌ API key is missing - please add ANTHROPIC_API_KEY in Vercel settings'
  });
}