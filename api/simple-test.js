export default function handler(req, res) {
  try {
    // Test basic functionality
    const result = {
      status: 'working',
      method: req.method,
      timestamp: new Date().toISOString(),
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'production'
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed',
      message: error.message,
      stack: error.stack
    });
  }
}