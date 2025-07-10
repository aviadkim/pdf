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
    const { pdfBase64, filename, useAzure = true } = req.body;
    
    if (!pdfBase64) {
      return res.status(400).json({ 
        error: 'No PDF data provided',
        details: 'Please provide pdfBase64 in the request body'
      });
    }

    const startTime = Date.now();
    const results = {
      textExtraction: null,
      azureExtraction: null,
      mergedResults: null,
      confidence: 0,
      method: 'unknown'
    };

    // Step 1: Text-based extraction (always run)
    console.log('Starting text-based extraction...');
    try {
      const textResults = await extractWithPdfParse(pdfBase64);
      results.textExtraction = textResults;
      results.confidence = 80;
      results.method = 'text-only';
      console.log(`Text extraction found ${textResults.holdings?.length || 0} holdings`);
    } catch (textError) {
      console.error('Text extraction failed:', textError.message);
      results.textExtraction = { error: textError.message, holdings: [] };
    }

    // Step 2: Azure Form Recognizer (if available and requested)
    if (useAzure && process.env.AZURE_FORM_ENDPOINT && process.env.AZURE_FORM_KEY) {
      console.log('Starting Azure Form Recognizer extraction...');
      try {
        const azureResults = await extractWithAzure(pdfBase64);
        results.azureExtraction = azureResults;
        results.confidence = 95;
        results.method = 'azure-enhanced';
        console.log(`Azure extraction found ${azureResults.holdings?.length || 0} holdings`);
      } catch (azureError) {
        console.error('Azure extraction failed:', azureError.message);
        results.azureExtraction = { error: azureError.message, holdings: [] };
      }
    } else {
      console.log('Azure extraction skipped - credentials not available or not requested');
    }

    // Step 3: Merge and validate results
    results.mergedResults = mergeExtractionResults(
      results.textExtraction, 
      results.azureExtraction
    );

    // Step 4: Final validation and confidence scoring
    const finalResults = validateAndScore(results.mergedResults);
    results.confidence = finalResults.confidence;

    const processingTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      data: finalResults.data,
      metadata: {
        filename: filename || 'document.pdf',
        processingTime: `${processingTime}ms`,
        method: results.method,
        confidence: results.confidence,
        textHoldings: results.textExtraction?.holdings?.length || 0,
        azureHoldings: results.azureExtraction?.holdings?.length || 0,
        finalHoldings: finalResults.data?.holdings?.length || 0,
        azureUsed: !!results.azureExtraction && !results.azureExtraction.error
      },
      debug: process.env.NODE_ENV === 'development' ? {
        textResults: results.textExtraction,
        azureResults: results.azureExtraction
      } : undefined
    });

  } catch (error) {
    console.error('Azure hybrid extraction error:', error);
    
    return res.status(500).json({
      error: 'Extraction failed',
      details: error.message,
      type: error.constructor.name
    });
  }
}

// Text-based extraction using pdf-parse
async function extractWithPdfParse(pdfBase64) {
  const pdfParse = (await import('pdf-parse')).default;
  
  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  const pdfData = await pdfParse(pdfBuffer);
  
  return parseSwissBankStatement(pdfData.text);
}

// Azure Form Recognizer extraction
async function extractWithAzure(pdfBase64) {
  const { DocumentAnalysisClient, AzureKeyCredential } = await import('@azure/ai-form-recognizer');
  
  const endpoint = process.env.AZURE_FORM_ENDPOINT;
  const apiKey = process.env.AZURE_FORM_KEY;
  
  const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));
  
  // Convert base64 to buffer
  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  
  // Analyze with prebuilt-layout model for tables
  const poller = await client.beginAnalyzeDocument('prebuilt-layout', pdfBuffer);
  const result = await poller.pollUntilDone();
  
  return parseAzureResults(result);
}

// Parse Azure Form Recognizer results
function parseAzureResults(result) {
  const holdings = [];
  const portfolioInfo = {};
  
  // Extract tables
  if (result.tables) {
    for (const table of result.tables) {
      const tableHoldings = extractHoldingsFromAzureTable(table);
      holdings.push(...tableHoldings);
    }
  }
  
  // Extract key-value pairs
  if (result.keyValuePairs) {
    for (const kv of result.keyValuePairs) {
      if (kv.key && kv.value) {
        const key = kv.key.content.toLowerCase();
        const value = kv.value.content;
        
        if (key.includes('cliente') || key.includes('client')) {
          portfolioInfo.clientName = value;
        } else if (key.includes('total') || key.includes('patrimonio')) {
          const totalMatch = value.match(/([\d']+(?:\.\d+)?)/);
          if (totalMatch) {
            portfolioInfo.portfolioTotal = {
              value: parseSwissNumber(totalMatch[1]),
              currency: 'USD'
            };
          }
        }
      }
    }
  }
  
  return {
    holdings: holdings,
    portfolioInfo: portfolioInfo,
    method: 'azure-form-recognizer'
  };
}

// Extract holdings from Azure table
function extractHoldingsFromAzureTable(table) {
  const holdings = [];
  
  // Get table headers
  const headers = [];
  const cells = table.cells || [];
  
  // Find header row
  const headerCells = cells.filter(cell => cell.rowIndex === 0);
  headerCells.sort((a, b) => a.columnIndex - b.columnIndex);
  
  for (const cell of headerCells) {
    headers.push(cell.content.toLowerCase());
  }
  
  // Find column indices
  const isinCol = headers.findIndex(h => h.includes('isin'));
  const nameCol = headers.findIndex(h => h.includes('security') || h.includes('name') || h.includes('titolo'));
  const valueCol = headers.findIndex(h => h.includes('value') || h.includes('valore') || h.includes('usd'));
  
  if (isinCol === -1) return holdings; // No ISIN column found
  
  // Process data rows
  const maxRow = Math.max(...cells.map(c => c.rowIndex));
  
  for (let rowIndex = 1; rowIndex <= maxRow; rowIndex++) {
    const rowCells = cells.filter(cell => cell.rowIndex === rowIndex);
    rowCells.sort((a, b) => a.columnIndex - b.columnIndex);
    
    const isinCell = rowCells[isinCol];
    if (!isinCell) continue;
    
    const isin = isinCell.content.trim();
    if (!validateISIN(isin)) continue;
    
    const holding = { isin };
    
    if (nameCol >= 0 && rowCells[nameCol]) {
      holding.securityName = cleanSecurityName(rowCells[nameCol].content);
    }
    
    if (valueCol >= 0 && rowCells[valueCol]) {
      const valueText = rowCells[valueCol].content;
      const valueMatch = valueText.match(/([\d']+(?:\.\d+)?)/);
      if (valueMatch) {
        holding.currentValue = parseSwissNumber(valueMatch[1]);
        holding.currency = 'USD';
      }
    }
    
    holding.category = categorizeHolding(holding.securityName || '', isin);
    
    if (holding.currentValue) {
      holdings.push(holding);
    }
  }
  
  return holdings;
}

// Merge results from text and Azure extraction
function mergeExtractionResults(textResults, azureResults) {
  const merged = {
    holdings: [],
    portfolioInfo: {},
    assetAllocation: [],
    summary: {}
  };
  
  // Start with text results as base
  if (textResults && !textResults.error) {
    merged.holdings = [...(textResults.holdings || [])];
    merged.portfolioInfo = { ...(textResults.portfolioInfo || {}) };
    merged.assetAllocation = [...(textResults.assetAllocation || [])];
  }
  
  // Enhance with Azure results
  if (azureResults && !azureResults.error) {
    // Merge holdings (avoid duplicates by ISIN)
    const existingISINs = new Set(merged.holdings.map(h => h.isin));
    
    for (const azureHolding of azureResults.holdings || []) {
      if (!existingISINs.has(azureHolding.isin)) {
        merged.holdings.push(azureHolding);
      } else {
        // Update existing holding with Azure data if it has more complete info
        const existingIndex = merged.holdings.findIndex(h => h.isin === azureHolding.isin);
        if (existingIndex >= 0) {
          const existing = merged.holdings[existingIndex];
          merged.holdings[existingIndex] = {
            ...existing,
            ...azureHolding,
            // Keep the better security name
            securityName: azureHolding.securityName?.length > existing.securityName?.length 
              ? azureHolding.securityName : existing.securityName
          };
        }
      }
    }
    
    // Enhance portfolio info
    if (azureResults.portfolioInfo) {
      merged.portfolioInfo = {
        ...merged.portfolioInfo,
        ...azureResults.portfolioInfo
      };
    }
  }
  
  // Sort holdings by value
  merged.holdings.sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0));
  
  return merged;
}

// Validate and score final results
function validateAndScore(results) {
  let confidence = 60; // Base confidence
  
  const holdings = results.holdings || [];
  
  // Check ISIN quality
  const validISINs = holdings.filter(h => validateISIN(h.isin)).length;
  const isinScore = holdings.length > 0 ? (validISINs / holdings.length) * 100 : 0;
  confidence += Math.min(isinScore * 0.3, 30); // Up to 30 points for ISIN quality
  
  // Check for US ISINs (should be 0 for European portfolios)
  const usISINs = holdings.filter(h => h.isin?.startsWith('US')).length;
  if (usISINs === 0 && holdings.length > 0) {
    confidence += 10; // Bonus for no suspicious US ISINs
  }
  
  // Check value completeness
  const withValues = holdings.filter(h => h.currentValue > 0).length;
  const valueScore = holdings.length > 0 ? (withValues / holdings.length) * 100 : 0;
  confidence += Math.min(valueScore * 0.2, 20); // Up to 20 points for value completeness
  
  // Check portfolio total
  if (results.portfolioInfo?.portfolioTotal?.value > 0) {
    confidence += 10; // Bonus for portfolio total
  }
  
  // Cap confidence at 100
  confidence = Math.min(confidence, 100);
  
  // Update summary
  results.summary = {
    totalHoldings: holdings.length,
    validISINs: validISINs,
    usISINs: usISINs,
    holdingsWithValues: withValues,
    isinAccuracy: Math.round(isinScore),
    valueCompleteness: Math.round(valueScore),
    extractionAccuracy: 'high',
    method: 'azure-hybrid-extraction'
  };
  
  return {
    data: results,
    confidence: Math.round(confidence)
  };
}

// Helper functions (same as hybrid-extract.js)
function parseSwissBankStatement(text) {
  // Implementation from hybrid-extract.js
  const result = {
    portfolioInfo: {},
    holdings: [],
    assetAllocation: [],
    summary: {}
  };
  
  result.portfolioInfo = extractPortfolioInfo(text);
  result.holdings = extractHoldings(text);
  result.assetAllocation = extractAssetAllocation(text);
  
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
  
  const clientMatch = text.match(/(?:Beneficiario|Client|Cliente)[:\s]*([A-Z\s\.]+(?:LTD|LLC|SA|AG)?)/i);
  if (clientMatch) info.clientName = clientMatch[1].trim();
  
  const accountMatch = text.match(/(?:Conto|Account|Cliente n\.)[\s:]*(\d+)/i);
  if (accountMatch) info.accountNumber = accountMatch[1];
  
  const dateMatch = text.match(/(?:Valutazione al|Valuation date|Data)[:\s]*(\d{2}\.\d{2}\.\d{4})/i);
  if (dateMatch) {
    const [day, month, year] = dateMatch[1].split('.');
    info.reportDate = `${year}-${month}-${day}`;
  }
  
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
  const isinPattern = /([A-Z]{2}[A-Z0-9]{9}[0-9])/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isinMatch = line.match(isinPattern);
    
    if (isinMatch && validateISIN(isinMatch[1])) {
      const isin = isinMatch[1];
      const holding = { isin };
      
      // Extract security name
      let securityName = '';
      for (let j = 1; j <= 3; j++) {
        if (i - j >= 0) {
          const prevLine = lines[i - j].trim();
          if (prevLine && !prevLine.match(/^\d/) && !prevLine.match(isinPattern)) {
            securityName = prevLine + ' ' + securityName;
          }
        }
      }
      
      const beforeISIN = line.substring(0, line.indexOf(isin)).trim();
      if (beforeISIN) securityName = (securityName + ' ' + beforeISIN).trim();
      
      holding.securityName = cleanSecurityName(securityName);
      
      // Extract value
      const searchLines = [line, lines[i + 1] || '', lines[i + 2] || ''].join(' ');
      const valuePatterns = [
        /USD\s*([\d']+(?:\.\d+)?)/,
        /([\d']+(?:\.\d+)?)\s*USD/,
        /\s([\d']+(?:\.\d+)?)\s*$/
      ];
      
      for (const pattern of valuePatterns) {
        const valueMatch = searchLines.match(pattern);
        if (valueMatch) {
          const value = parseSwissNumber(valueMatch[1]);
          if (value > 1000) {
            holding.currentValue = value;
            holding.currency = 'USD';
            break;
          }
        }
      }
      
      holding.category = categorizeHolding(holding.securityName, isin);
      
      if (holding.currentValue) {
        holdings.push(holding);
      }
    }
  }
  
  holdings.sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0));
  return holdings;
}

function extractAssetAllocation(text) {
  // Implementation from hybrid-extract.js
  return [];
}

function parseSwissNumber(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/'/g, '').replace(/,/g, ''));
}

function validateISIN(isin) {
  if (!isin || isin.length !== 12) return false;
  if (!/^[A-Z]{2}/.test(isin)) return false;
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin)) return false;
  return true;
}

function cleanSecurityName(name) {
  if (!name) return 'Unknown Security';
  name = name.replace(/\s+/g, ' ').trim();
  name = name.replace(/\s+[\d']+(?:\.\d+)?$/, '');
  name = name.replace(/^(?:Titoli|Securities|Obbligazioni|Bonds)\s+/i, '');
  return name || 'Unknown Security';
}

function categorizeHolding(name, isin) {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('bond') || nameLower.includes('note')) return 'Bonds';
  if (nameLower.includes('structured')) return 'Structured products';
  if (nameLower.includes('fund') || nameLower.includes('etf')) return 'Funds';
  if (nameLower.includes('equity') || nameLower.includes('share')) return 'Equities';
  
  if (isin.startsWith('XS')) return 'Bonds';
  if (isin.startsWith('CH')) return 'Swiss Securities';
  if (isin.startsWith('US')) return 'US Securities';
  
  return 'Other';
}