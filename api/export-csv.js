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
    const { data, filename = 'portfolio-export' } = req.body;
    
    if (!data || !data.holdings) {
      return res.status(400).json({ 
        error: 'No data provided',
        details: 'Please provide extraction data with holdings'
      });
    }

    // Create CSV content
    const csvRows = [];
    
    // Add header
    csvRows.push([
      'Security Name',
      'ISIN',
      'Quantity',
      'Current Value',
      'Currency',
      'Gain/Loss',
      'Gain/Loss %',
      'Category',
      'Weight %'
    ].join(','));

    // Calculate total portfolio value for weight calculation
    const totalValue = data.portfolioInfo?.portfolioTotal?.value || 
      data.holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);

    // Add holdings data
    data.holdings.forEach(holding => {
      const weight = totalValue > 0 ? ((holding.currentValue || 0) / totalValue * 100).toFixed(2) : '0.00';
      
      csvRows.push([
        `"${(holding.securityName || '').replace(/"/g, '""')}"`,
        holding.isin || '',
        holding.quantity || '0',
        holding.currentValue || '0',
        holding.currency || 'USD',
        holding.gainLoss || '0',
        holding.gainLossPercent || '0',
        `"${(holding.category || '').replace(/"/g, '""')}"`,
        weight
      ].join(','));
    });

    // Add summary section
    csvRows.push(''); // Empty row
    csvRows.push('PORTFOLIO SUMMARY');
    csvRows.push(`Client Name,${data.portfolioInfo?.clientName || 'N/A'}`);
    csvRows.push(`Bank,${data.portfolioInfo?.bankName || 'N/A'}`);
    csvRows.push(`Account Number,${data.portfolioInfo?.accountNumber || 'N/A'}`);
    csvRows.push(`Report Date,${data.portfolioInfo?.reportDate || 'N/A'}`);
    csvRows.push(`Total Portfolio Value,${totalValue} ${data.portfolioInfo?.portfolioTotal?.currency || 'USD'}`);
    csvRows.push(`Total Holdings,${data.holdings.length}`);

    // Add asset allocation section
    if (data.assetAllocation && data.assetAllocation.length > 0) {
      csvRows.push(''); // Empty row
      csvRows.push('ASSET ALLOCATION');
      csvRows.push('Category,Value,Percentage');
      data.assetAllocation.forEach(category => {
        csvRows.push([
          `"${category.category}"`,
          category.value || '0',
          category.percentage || '0%'
        ].join(','));
      });
    }

    // Add performance section if available
    if (data.performance) {
      csvRows.push(''); // Empty row
      csvRows.push('PERFORMANCE');
      csvRows.push(`YTD Performance,${data.performance.ytdPercent || 'N/A'}`);
      csvRows.push(`Total Gain/Loss,${data.performance.totalGainLoss || '0'}`);
    }

    // Convert to CSV string
    const csvContent = csvRows.join('\n');

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    
    return res.status(200).send(csvContent);

  } catch (error) {
    console.error('CSV export error:', error);
    
    return res.status(500).json({
      error: 'CSV export failed',
      details: error.message,
      type: error.constructor.name
    });
  }
}