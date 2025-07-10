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
    const { data, format = 'csv', filename = 'portfolio-export' } = req.body;
    
    if (!data || !data.holdings) {
      return res.status(400).json({ 
        error: 'No data provided',
        details: 'Please provide extraction data with holdings'
      });
    }

    const exportData = generateExportData(data);
    
    if (format === 'csv') {
      const csv = generateCSV(exportData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.status(200).send(csv);
      
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.status(200).json(exportData);
      
    } else if (format === 'excel') {
      // For Excel format, return structured data that can be processed client-side
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({
        format: 'excel-data',
        data: exportData,
        instructions: 'Use this structured data to generate Excel file client-side'
      });
    }
    
    return res.status(400).json({ error: 'Unsupported format. Use: csv, json, or excel' });

  } catch (error) {
    console.error('Export error:', error);
    
    return res.status(500).json({
      error: 'Export failed',
      details: error.message
    });
  }
}

function generateExportData(data) {
  const { holdings = [], portfolioInfo = {} } = data;
  
  // Portfolio summary
  const summary = {
    exportDate: new Date().toISOString(),
    portfolioTotal: portfolioInfo.portfolioTotal?.value || 0,
    currency: portfolioInfo.portfolioTotal?.currency || 'USD',
    clientName: portfolioInfo.clientName || '',
    bankName: portfolioInfo.bankName || '',
    totalHoldings: holdings.length,
    extractionMethod: data.method || 'unknown'
  };
  
  // Holdings data with calculated fields
  const processedHoldings = holdings.map((holding, index) => {
    const value = holding.currentValue || 0;
    const totalValue = summary.portfolioTotal || 1;
    const percentage = totalValue > 0 ? (value / totalValue * 100).toFixed(2) : '0.00';
    
    return {
      position: index + 1,
      securityName: holding.securityName || 'Unknown Security',
      isin: holding.isin || '',
      currentValue: value,
      currency: holding.currency || 'USD',
      percentage: parseFloat(percentage),
      category: holding.category || 'Other',
      quantity: holding.quantity || '',
      source: holding.source || 'extracted'
    };
  });
  
  // Asset allocation summary
  const categories = {};
  processedHoldings.forEach(holding => {
    const cat = holding.category;
    if (!categories[cat]) {
      categories[cat] = { count: 0, value: 0 };
    }
    categories[cat].count++;
    categories[cat].value += holding.currentValue;
  });
  
  const assetAllocation = Object.entries(categories).map(([category, data]) => ({
    category,
    holdings: data.count,
    value: data.value,
    percentage: summary.portfolioTotal > 0 ? (data.value / summary.portfolioTotal * 100).toFixed(2) : '0.00'
  })).sort((a, b) => b.value - a.value);
  
  return {
    summary,
    holdings: processedHoldings,
    assetAllocation,
    metadata: {
      exportedAt: new Date().toISOString(),
      totalRecords: processedHoldings.length,
      validISINs: processedHoldings.filter(h => h.isin && h.isin.length === 12).length,
      withValues: processedHoldings.filter(h => h.currentValue > 0).length
    }
  };
}

function generateCSV(exportData) {
  const { summary, holdings, assetAllocation } = exportData;
  
  let csv = '';
  
  // Portfolio Summary Section
  csv += 'PORTFOLIO SUMMARY\n';
  csv += `Export Date,${summary.exportDate}\n`;
  csv += `Client Name,${summary.clientName}\n`;
  csv += `Bank Name,${summary.bankName}\n`;
  csv += `Portfolio Total,${formatNumber(summary.portfolioTotal)}\n`;
  csv += `Currency,${summary.currency}\n`;
  csv += `Total Holdings,${summary.totalHoldings}\n`;
  csv += `Extraction Method,${summary.extractionMethod}\n`;
  csv += '\n';
  
  // Holdings Section
  csv += 'HOLDINGS DETAILS\n';
  csv += 'Position,Security Name,ISIN,Current Value,Currency,Percentage,Category,Quantity,Source\n';
  
  holdings.forEach(holding => {
    csv += `${holding.position},`;
    csv += `"${holding.securityName}",`;
    csv += `${holding.isin},`;
    csv += `${formatNumber(holding.currentValue)},`;
    csv += `${holding.currency},`;
    csv += `${holding.percentage}%,`;
    csv += `${holding.category},`;
    csv += `${holding.quantity},`;
    csv += `${holding.source}\n`;
  });
  
  csv += '\n';
  
  // Asset Allocation Section
  csv += 'ASSET ALLOCATION\n';
  csv += 'Category,Holdings Count,Total Value,Percentage\n';
  
  assetAllocation.forEach(allocation => {
    csv += `${allocation.category},`;
    csv += `${allocation.holdings},`;
    csv += `${formatNumber(allocation.value)},`;
    csv += `${allocation.percentage}%\n`;
  });
  
  return csv;
}

function formatNumber(num) {
  if (!num || isNaN(num)) return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}