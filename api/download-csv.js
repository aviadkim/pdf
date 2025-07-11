// 📊 CSV Download Endpoint for Family Office Back Office
// Converts extracted holdings data to downloadable CSV format

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed - Use POST',
      allowedMethods: ['POST']
    });
  }

  try {
    console.log('📊 CSV Download Request');
    
    const { holdings, portfolioInfo, filename } = req.body;
    
    if (!holdings || !Array.isArray(holdings)) {
      return res.status(400).json({ 
        error: 'Invalid holdings data',
        expected: 'Array of holdings objects'
      });
    }
    
    // Generate comprehensive CSV
    const csvData = generateComprehensiveCSV(holdings, portfolioInfo);
    
    // Set headers for file download
    const downloadFilename = `${filename || 'portfolio'}_holdings_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send CSV data
    res.status(200).send(csvData);
    
    console.log(`✅ CSV download complete: ${downloadFilename}`);
    
  } catch (error) {
    console.error('❌ CSV download failed:', error);
    
    res.status(500).json({
      error: 'CSV generation failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function generateComprehensiveCSV(holdings, portfolioInfo) {
  const timestamp = new Date().toISOString();
  const date = new Date().toLocaleDateString();
  
  // CSV Headers
  const headers = [
    'Position',
    'Security Name',
    'ISIN Code',
    'Current Value',
    'Currency',
    'Category',
    'Page Number',
    'Extraction Source',
    'Confidence %',
    'Market Value USD',
    'Percentage of Portfolio',
    'Asset Class',
    'Region',
    'Extraction Date'
  ];
  
  // Calculate portfolio total
  const portfolioTotal = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
  
  // CSV Content
  const csvRows = [];
  
  // Add portfolio summary header
  csvRows.push('# FAMILY OFFICE PORTFOLIO HOLDINGS REPORT');
  csvRows.push(`# Generated: ${date}`);
  csvRows.push(`# Client: ${portfolioInfo?.clientName || 'Family Office Client'}`);
  csvRows.push(`# Total Portfolio Value: ${portfolioTotal.toLocaleString()} USD`);
  csvRows.push(`# Total Holdings: ${holdings.length}`);
  csvRows.push('');
  
  // Add column headers
  csvRows.push(headers.join(','));
  
  // Add holdings data
  holdings.forEach((holding, index) => {
    const marketValueUSD = convertToUSD(holding.currentValue || 0, holding.currency || 'USD');
    const portfolioPercent = portfolioTotal > 0 ? ((marketValueUSD / portfolioTotal) * 100).toFixed(2) : '0.00';
    const assetClass = determineAssetClass(holding.securityName, holding.category);
    const region = determineRegion(holding.isin);
    
    const row = [
      holding.position || index + 1,
      `"${(holding.securityName || 'Unknown Security').replace(/"/g, '""')}"`,
      holding.isin || '',
      holding.currentValue || 0,
      holding.currency || 'USD',
      holding.category || 'Securities',
      holding.pageNumber || 1,
      holding.source || 'Unknown',
      holding.confidence || 0,
      marketValueUSD,
      `${portfolioPercent}%`,
      assetClass,
      region,
      timestamp
    ];
    
    csvRows.push(row.join(','));
  });
  
  // Add portfolio summary footer
  csvRows.push('');
  csvRows.push('# PORTFOLIO SUMMARY');
  csvRows.push(`Total Holdings Count,${holdings.length}`);
  csvRows.push(`Total Portfolio Value,${portfolioTotal.toLocaleString()}`);
  csvRows.push(`Average Holding Value,${(portfolioTotal / holdings.length).toLocaleString()}`);
  csvRows.push(`Extraction Date,${timestamp}`);
  
  // Add asset class breakdown
  const assetClassBreakdown = {};
  holdings.forEach(holding => {
    const assetClass = determineAssetClass(holding.securityName, holding.category);
    const value = convertToUSD(holding.currentValue || 0, holding.currency || 'USD');
    assetClassBreakdown[assetClass] = (assetClassBreakdown[assetClass] || 0) + value;
  });
  
  csvRows.push('');
  csvRows.push('# ASSET CLASS BREAKDOWN');
  for (const [assetClass, value] of Object.entries(assetClassBreakdown)) {
    const percentage = ((value / portfolioTotal) * 100).toFixed(2);
    csvRows.push(`${assetClass},${value.toLocaleString()},${percentage}%`);
  }
  
  return csvRows.join('\n');
}

// Helper function to convert currencies to USD (simplified)
function convertToUSD(value, currency) {
  const exchangeRates = {
    'USD': 1.0,
    'EUR': 1.08,
    'CHF': 1.12,
    'GBP': 1.25,
    'JPY': 0.007
  };
  
  return value * (exchangeRates[currency] || 1.0);
}

// Helper function to determine asset class
function determineAssetClass(securityName, category) {
  const name = (securityName || '').toLowerCase();
  const cat = (category || '').toLowerCase();
  
  if (name.includes('bond') || cat.includes('bond')) return 'Fixed Income';
  if (name.includes('fund') || name.includes('etf')) return 'Mutual Funds';
  if (name.includes('equity') || name.includes('stock')) return 'Equity';
  if (name.includes('cash') || name.includes('money market')) return 'Cash';
  if (name.includes('commodity') || name.includes('gold')) return 'Commodities';
  if (name.includes('reit')) return 'Real Estate';
  
  return 'Securities';
}

// Helper function to determine region based on ISIN
function determineRegion(isin) {
  if (!isin || isin.length < 2) return 'Unknown';
  
  const countryCode = isin.substring(0, 2);
  
  const regions = {
    'US': 'North America',
    'CA': 'North America',
    'CH': 'Europe',
    'DE': 'Europe',
    'FR': 'Europe',
    'GB': 'Europe',
    'IT': 'Europe',
    'NL': 'Europe',
    'XS': 'Europe', // Euroclear
    'JP': 'Asia Pacific',
    'HK': 'Asia Pacific',
    'SG': 'Asia Pacific',
    'AU': 'Asia Pacific'
  };
  
  return regions[countryCode] || 'Other';
}