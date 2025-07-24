export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check if Azure environment variables are loaded
    const azureEndpoint = process.env.AZURE_FORM_ENDPOINT;
    const azureKey = process.env.AZURE_FORM_KEY;
    
    const result = {
      timestamp: new Date().toISOString(),
      environmentVariables: {
        AZURE_FORM_ENDPOINT: {
          exists: !!azureEndpoint,
          value: azureEndpoint ? `${azureEndpoint.substring(0, 20)}...` : null,
          length: azureEndpoint ? azureEndpoint.length : 0
        },
        AZURE_FORM_KEY: {
          exists: !!azureKey,
          value: azureKey ? `${azureKey.substring(0, 8)}...` : null,
          length: azureKey ? azureKey.length : 0
        }
      },
      allEnvKeys: Object.keys(process.env).filter(key => 
        key.includes('AZURE') || key.includes('FORM')
      ),
      vercelInfo: {
        region: process.env.VERCEL_REGION || 'unknown',
        env: process.env.VERCEL_ENV || 'unknown'
      }
    };
    
    // Check if variables are properly formatted
    let status = 'success';
    let message = 'Azure configuration looks good!';
    
    if (!azureEndpoint || !azureKey) {
      status = 'missing_variables';
      message = 'Azure environment variables not found';
    } else if (!azureEndpoint.startsWith('https://')) {
      status = 'invalid_endpoint';
      message = 'Azure endpoint should start with https://';
    } else if (azureKey.length < 20) {
      status = 'invalid_key';
      message = 'Azure key seems too short';
    }
    
    return res.status(200).json({
      status,
      message,
      ...result
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}