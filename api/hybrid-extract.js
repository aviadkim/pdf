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
    const { pdfBase64, filename } = req.body;
    
    if (!pdfBase64) {
      return res.status(400).json({ 
        error: 'No PDF data provided',
        details: 'Please provide pdfBase64 in the request body'
      });
    }

    // Import pdf-parse dynamically
    const pdfParse = (await import('pdf-parse')).default;
    
    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    
    // Extract text from PDF
    const startTime = Date.now();
    const pdfData = await pdfParse(pdfBuffer);
    const rawText = pdfData.text;
    
    // Parse holdings from text
    const extractedData = parseSwissBankStatement(rawText);
    
    // Add metadata
    extractedData.metadata = {
      filename: filename || 'document.pdf',
      pages: pdfData.numpages,
      extractionTime: `${Date.now() - startTime}ms`,
      method: 'hybrid-text-extraction',
      textLength: rawText.length
    };
    
    return res.status(200).json({
      success: true,
      data: extractedData
    });

  } catch (error) {
    console.error('Hybrid extraction error:', error);
    
    return res.status(500).json({
      error: 'Extraction failed',
      details: error.message,
      type: error.constructor.name
    });
  }
}

// Parse Swiss bank statement with high accuracy
function parseSwissBankStatement(text) {
  const result = {
    portfolioInfo: {},
    holdings: [],
    assetAllocation: [],
    summary: {}
  };
  
  // Extract portfolio info
  result.portfolioInfo = extractPortfolioInfo(text);
  
  // Extract holdings with ISINs
  result.holdings = extractHoldings(text);
  
  // Extract asset allocation
  result.assetAllocation = extractAssetAllocation(text);
  
  // Calculate summary
  result.summary = {
    totalHoldings: result.holdings.length,
    totalValue: result.holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0),
    extractionAccuracy: 'high',
    method: 'text-based-extraction'
  };
  
  return result;
}

function extractPortfolioInfo(text) {
  const info = {};
  
  // Client name
  const clientMatch = text.match(/(?:Beneficiario|Client|Cliente)[:\s]*([A-Z\s\.]+(?:LTD|LLC|SA|AG)?)/i);
  if (clientMatch) {
    info.clientName = clientMatch[1].trim();
  }
  
  // Account number
  const accountMatch = text.match(/(?:Conto|Account|Cliente n\.)[\s:]*(\d+)/i);
  if (accountMatch) {
    info.accountNumber = accountMatch[1];
  }
  
  // Report date
  const dateMatch = text.match(/(?:Valutazione al|Valuation date|Data)[:\s]*(\d{2}\.\d{2}\.\d{4})/i);
  if (dateMatch) {
    const [day, month, year] = dateMatch[1].split('.');
    info.reportDate = `${year}-${month}-${day}`;
  }
  
  // Portfolio total - handle Swiss number format
  const totalMatch = text.match(/(?:Totale|Total|Patrimonio totale)[:\s]*(?:USD\s*)?([\d']+(?:\.\d+)?)/i);
  if (totalMatch) {
    info.portfolioTotal = {
      value: parseSwissNumber(totalMatch[1]),
      currency: 'USD'
    };
  }
  
  info.bankName = 'Cornèr Banca SA';
  
  return info;
}

function extractHoldings(text) {
  const holdings = [];
  const lines = text.split('\n');
  
  // ISIN pattern - exactly 12 characters
  const isinPattern = /([A-Z]{2}[A-Z0-9]{9}[0-9])/;
  
  // Process each line looking for ISINs
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isinMatch = line.match(isinPattern);
    
    if (isinMatch && validateISIN(isinMatch[1])) {
      const isin = isinMatch[1];
      const holding = { isin };
      
      // Extract security name - look at previous lines
      let securityName = '';
      for (let j = 1; j <= 3; j++) {
        if (i - j >= 0) {
          const prevLine = lines[i - j].trim();
          if (prevLine && !prevLine.match(/^\d/) && !prevLine.match(isinPattern)) {
            securityName = prevLine + ' ' + securityName;
          }
        }
      }
      
      // Also check current line for name
      const beforeISIN = line.substring(0, line.indexOf(isin)).trim();
      if (beforeISIN) {
        securityName = (securityName + ' ' + beforeISIN).trim();
      }
      
      holding.securityName = cleanSecurityName(securityName);
      
      // Extract value - look at current and next lines
      let valueFound = false;
      const searchLines = [line, lines[i + 1] || '', lines[i + 2] || ''].join(' ');
      
      // Multiple value patterns to try
      const valuePatterns = [
        /USD\s*([\d']+(?:\.\d+)?)/,
        /([\d']+(?:\.\d+)?)\s*USD/,
        /\s([\d']+(?:\.\d+)?)\s*$/
      ];
      
      for (const pattern of valuePatterns) {
        const valueMatch = searchLines.match(pattern);
        if (valueMatch) {
          const value = parseSwissNumber(valueMatch[1]);
          if (value > 1000) { // Likely a real value, not a percentage
            holding.currentValue = value;
            holding.currency = 'USD';
            valueFound = true;
            break;
          }
        }
      }
      
      // Extract quantity if available
      const qtyMatch = searchLines.match(/(?:Quantità|Quantity|Unità)[:\s]*([\d']+(?:\.\d+)?)/i);
      if (qtyMatch) {
        holding.quantity = parseSwissNumber(qtyMatch[1]);
      }
      
      // Extract gain/loss if available
      const gainMatch = searchLines.match(/([+-]?[\d']+(?:\.\d+)?)\s*([+-]?[\d.]+%)/);
      if (gainMatch) {
        holding.gainLoss = parseSwissNumber(gainMatch[1]);
        holding.gainLossPercent = parseFloat(gainMatch[2]);
      }
      
      // Determine category based on ISIN or name
      holding.category = categorizeHolding(holding.securityName, isin);
      
      // Only add if we found a value
      if (holding.currentValue) {
        holdings.push(holding);
      }
    }
  }
  
  // Sort by value descending
  holdings.sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0));
  
  return holdings;
}

function extractAssetAllocation(text) {
  const allocation = [];
  
  // Look for asset allocation section
  const allocationSection = text.match(/(?:Asset Allocation|Ripartizione|Allocazione)[\s\S]*?(?=\n\n|\n[A-Z])/i);
  if (!allocationSection) return allocation;
  
  const sectionText = allocationSection[0];
  const lines = sectionText.split('\n');
  
  // Pattern for allocation lines
  const allocationPattern = /(Liquidity|Liquidità|Bonds|Obbligazioni|Equities|Azioni|Structured products|Prodotti strutturati|Other|Altri)[:\s]*([\d']+(?:\.\d+)?)\s*(?:USD)?\s*([\d.]+%)?/gi;
  
  let match;
  while ((match = allocationPattern.exec(sectionText)) !== null) {
    const category = normalizeCategory(match[1]);
    const value = parseSwissNumber(match[2]);
    const percentage = match[3] || '';
    
    allocation.push({
      category,
      value,
      percentage
    });
  }
  
  return allocation;
}

// Helper functions
function parseSwissNumber(str) {
  if (!str) return 0;
  // Remove Swiss thousand separators (apostrophes) and parse
  return parseFloat(str.replace(/'/g, '').replace(/,/g, ''));
}

function validateISIN(isin) {
  // Must be exactly 12 characters
  if (!isin || isin.length !== 12) return false;
  
  // First 2 must be letters (country code)
  if (!/^[A-Z]{2}/.test(isin)) return false;
  
  // Rest must be alphanumeric
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin)) return false;
  
  return true;
}

function cleanSecurityName(name) {
  if (!name) return 'Unknown Security';
  
  // Remove extra spaces and clean up
  name = name.replace(/\s+/g, ' ').trim();
  
  // Remove trailing numbers that might be values
  name = name.replace(/\s+[\d']+(?:\.\d+)?$/, '');
  
  // Remove common prefixes that aren't part of the name
  name = name.replace(/^(?:Titoli|Securities|Obbligazioni|Bonds)\s+/i, '');
  
  return name || 'Unknown Security';
}

function categorizeHolding(name, isin) {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('bond') || nameLower.includes('note') || nameLower.includes('obbligazioni')) {
    return 'Bonds';
  }
  if (nameLower.includes('structured') || nameLower.includes('strutturati')) {
    return 'Structured products';
  }
  if (nameLower.includes('fund') || nameLower.includes('etf')) {
    return 'Funds';
  }
  if (nameLower.includes('equity') || nameLower.includes('share') || nameLower.includes('azioni')) {
    return 'Equities';
  }
  
  // Default based on ISIN prefix
  if (isin.startsWith('XS')) return 'Bonds';
  if (isin.startsWith('CH')) return 'Swiss Securities';
  if (isin.startsWith('US')) return 'US Securities';
  
  return 'Other';
}

function normalizeCategory(category) {
  const categoryMap = {
    'liquidity': 'Liquidity',
    'liquidità': 'Liquidity',
    'bonds': 'Bonds',
    'obbligazioni': 'Bonds',
    'equities': 'Equities',
    'azioni': 'Equities',
    'structured products': 'Structured products',
    'prodotti strutturati': 'Structured products',
    'other': 'Other assets',
    'altri': 'Other assets'
  };
  
  return categoryMap[category.toLowerCase()] || category;
}