// Debug environment variables endpoint
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const envCheck = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    hasAzureKey: !!process.env.AZURE_FORM_KEY,
    hasAzureEndpoint: !!process.env.AZURE_FORM_ENDPOINT,
    hasClaudeKey: !!process.env.ANTHROPIC_API_KEY,
    azureKeyPrefix: process.env.AZURE_FORM_KEY ? process.env.AZURE_FORM_KEY.substring(0, 8) + '...' : 'missing',
    azureEndpoint: process.env.AZURE_FORM_ENDPOINT || 'missing',
    claudeKeyPrefix: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 8) + '...' : 'missing',
    vercelRegion: process.env.VERCEL_REGION || 'unknown',
    allReady: !!(process.env.AZURE_FORM_KEY && process.env.AZURE_FORM_ENDPOINT && process.env.ANTHROPIC_API_KEY)
  };
  
  res.status(200).json({
    status: 'Environment Debug',
    ready: envCheck.allReady,
    environment: envCheck
  });
}