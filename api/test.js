// 🧪 TEST API - Optimized for Puppeteer/Playwright
export default async function handler(req, res) {
  console.log('🧪 TEST API - Optimized for testing tools');
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('X-Test-API', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).json({ 
      message: 'Test API ready',
      methods: ['GET', 'POST', 'OPTIONS'],
      testOptimized: true
    });
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      message: 'Test API is running',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      testOptimized: true,
      endpoints: {
        health: '/api/test',
        extract: '/api/public-extract'
      }
    });
    return;
  }

  if (req.method === 'POST') {
    res.status(200).json({
      message: 'Test API POST endpoint',
      received: true,
      body: req.body,
      headers: req.headers,
      testOptimized: true
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}