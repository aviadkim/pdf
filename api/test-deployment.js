// Simple test deployment endpoint
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    success: true,
    message: 'Ultimate PDF Processor deployment test',
    timestamp: new Date().toISOString(),
    endpoints: {
      ultimateProcessor: '/api/ultimate-pdf-processor',
      familyOffice: '/api/family-office-upload',
      csvDownload: '/api/download-csv'
    }
  });
}