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
    const { pdfBase64, filename, textData } = req.body;
    
    if (!pdfBase64 && !textData) {
      return res.status(400).json({ 
        error: 'No data provided',
        details: 'Please provide either pdfBase64 or textData'
      });
    }

    const startTime = Date.now();
    let extractedText = '';
    
    // If textData is provided directly, use it (for testing)
    if (textData) {
      extractedText = textData;
      console.log('Using provided text data');
    } else {
      // Try to extract from PDF
      try {
        console.log('Attempting PDF text extraction with pdf-parse...');
        const pdfParse = (await import('pdf-parse')).default;
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        const pdfData = await pdfParse(pdfBuffer);
        extractedText = pdfData.text;
        console.log(`PDF extraction successful: ${extractedText.length} characters`);
      } catch (pdfError) {
        console.log('pdf-parse failed, trying alternative extraction:', pdfError.message);
        
        // Try alternative PDF extraction method for Vercel compatibility
        try {
          extractedText = await extractPDFTextAlternative(pdfBase64);
          console.log(`Alternative PDF extraction successful: ${extractedText.length} characters`);
        } catch (altError) {
          console.log('Alternative PDF extraction also failed, using Azure only:', altError.message);
          // Fall back to Azure-only extraction
          return await processWithAzureOnly(pdfBase64, filename, res, startTime);
        }
      }
    }

    // Process with both text analysis and Azure
    const results = await processWithBothMethods(extractedText, pdfBase64, filename, startTime);
    
    return res.status(200).json(results);

  } catch (error) {
    console.error('Azure simple extraction error:', error);
    
    return res.status(500).json({
      error: 'Extraction failed',
      details: error.message,
      type: error.constructor.name
    });
  }
}

// Process with Azure Form Recognizer only
async function processWithAzureOnly(pdfBase64, filename, res, startTime) {
  console.log('Processing with Azure Form Recognizer only...');
  
  if (!pdfBase64) {
    return res.status(400).json({
      error: 'No PDF data provided for Azure processing',
      details: 'pdfBase64 is required for Azure Form Recognizer'
    });
  }
  
  try {
    const azureResults = await extractWithAzure(pdfBase64);
    const processingTime = Date.now() - startTime;
    
    return res.status(200).json({
      success: true,
      data: azureResults,
      metadata: {
        filename: filename || 'document.pdf',
        processingTime: `${processingTime}ms`,
        method: 'azure-only',
        confidence: 95,
        azureUsed: true,
        textExtraction: false
      }
    });
  } catch (azureError) {
    console.error('Azure-only processing failed:', azureError);
    
    return res.status(500).json({
      error: 'Azure extraction failed',
      details: azureError.message,
      suggestions: [
        'Check Azure credentials are configured',
        'Verify PDF is a valid document',
        'Try with a smaller PDF file'
      ]
    });
  }
}

// Process with both text analysis and Azure
async function processWithBothMethods(extractedText, pdfBase64, filename, startTime) {
  console.log('Processing with both text analysis and Azure...');
  
  const results = {
    textResults: null,
    azureResults: null,
    mergedResults: null
  };
  
  // Step 1: Text-based extraction
  try {
    console.log('Running text-based extraction...');
    results.textResults = parseSwissBankStatement(extractedText);
    console.log(`Text extraction found ${results.textResults.holdings?.length || 0} holdings`);
  } catch (textError) {
    console.error('Text extraction failed:', textError.message);
    results.textResults = { error: textError.message, holdings: [] };
  }
  
  // Step 2: Azure Form Recognizer
  let azureUsed = false;
  if (process.env.AZURE_FORM_ENDPOINT && process.env.AZURE_FORM_KEY && pdfBase64) {
    try {
      console.log('Running Azure Form Recognizer...');
      results.azureResults = await extractWithAzure(pdfBase64);
      azureUsed = true;
      console.log(`Azure extraction found ${results.azureResults.holdings?.length || 0} holdings`);
    } catch (azureError) {
      console.error('Azure extraction failed:', azureError.message);
      results.azureResults = { error: azureError.message, holdings: [] };
    }
  } else {
    const reason = !pdfBase64 ? 'No PDF data provided' : 'Credentials not configured';
    console.log(`Azure extraction skipped: ${reason}`);
    results.azureResults = { error: reason, holdings: [] };
  }
  
  // Step 3: Merge results
  results.mergedResults = mergeResults(results.textResults, results.azureResults);
  
  const processingTime = Date.now() - startTime;
  const finalHoldings = results.mergedResults.holdings || [];
  
  // Calculate confidence
  let confidence = 70; // Base confidence
  if (finalHoldings.length > 0) {
    const validISINs = finalHoldings.filter(h => validateISIN(h.isin)).length;
    const usISINs = finalHoldings.filter(h => h.isin?.startsWith('US')).length;
    
    confidence += (validISINs / finalHoldings.length) * 20; // ISIN quality
    confidence += (usISINs === 0) ? 10 : -10; // No US ISINs bonus
    confidence += azureUsed ? 15 : 0; // Azure bonus
  }
  
  return {
    success: true,
    data: results.mergedResults,
    metadata: {
      filename: filename || 'document.pdf',
      processingTime: `${processingTime}ms`,
      method: azureUsed ? 'hybrid-with-azure' : 'text-only',
      confidence: Math.min(Math.round(confidence), 100),
      azureUsed: azureUsed,
      textHoldings: results.textResults?.holdings?.length || 0,
      azureHoldings: results.azureResults?.holdings?.length || 0,
      finalHoldings: finalHoldings.length
    },
    debug: {
      textResults: results.textResults,
      azureResults: results.azureResults
    }
  };
}

// Extract with Azure Form Recognizer
async function extractWithAzure(pdfBase64) {
  const { DocumentAnalysisClient, AzureKeyCredential } = await import('@azure/ai-form-recognizer');
  
  const endpoint = process.env.AZURE_FORM_ENDPOINT;
  const apiKey = process.env.AZURE_FORM_KEY;
  
  console.log(`Connecting to Azure: ${endpoint?.substring(0, 30)}...`);
  
  const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));
  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  
  console.log(`Analyzing document with Azure (${Math.round(pdfBuffer.length / 1024)}KB)...`);
  
  const poller = await client.beginAnalyzeDocument('prebuilt-layout', pdfBuffer);
  const result = await poller.pollUntilDone();
  
  console.log(`Azure analysis complete. Found ${result.tables?.length || 0} tables`);
  
  return parseAzureResults(result);
}

// Parse Azure results
function parseAzureResults(result) {
  const holdings = [];
  const portfolioInfo = {};
  
  console.log('Parsing Azure results...');
  
  // Extract from tables
  if (result.tables && result.tables.length > 0) {
    console.log(`Processing ${result.tables.length} tables from Azure...`);
    
    for (const table of result.tables) {
      const tableHoldings = extractHoldingsFromTable(table);
      holdings.push(...tableHoldings);
      console.log(`Table extracted ${tableHoldings.length} holdings`);
    }
  }
  
  // Extract key-value pairs for portfolio info
  if (result.keyValuePairs) {
    console.log(`Processing ${result.keyValuePairs.length} key-value pairs...`);
    
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
    method: 'azure-form-recognizer',
    summary: {
      totalHoldings: holdings.length,
      extractionAccuracy: 'high'
    }
  };
}

// Extract holdings from Azure table
function extractHoldingsFromTable(table) {
  const holdings = [];
  const cells = table.cells || [];
  
  if (cells.length === 0) return holdings;
  
  console.log(`Processing table with ${cells.length} cells...`);
  
  // Try to find ISIN patterns in any cell
  for (const cell of cells) {
    const content = cell.content || '';
    const isinMatch = content.match(/([A-Z]{2}[A-Z0-9]{9}[0-9])/);
    
    if (isinMatch && validateISIN(isinMatch[1])) {
      const isin = isinMatch[1];
      console.log(`Found ISIN: ${isin}`);
      
      // Look for related cells in the same row
      const rowCells = cells.filter(c => c.rowIndex === cell.rowIndex);
      
      let securityName = '';
      let value = 0;
      
      for (const rowCell of rowCells) {
        const cellContent = rowCell.content || '';
        
        // Look for security name (improved detection)
        if (cellContent.length > 5 && cellContent !== isin && !cellContent.match(/^[\d']+$/)) {
          // Prefer longer, more descriptive names
          if (!securityName || cellContent.length > securityName.length) {
            // Skip if it looks like a number or date
            if (!cellContent.match(/^\d{2}[./]\d{2}/) && !cellContent.match(/^USD/) && !cellContent.match(/^[\d']+$/)) {
              securityName = cellContent;
            }
          }
        }
        
        // Look for USD values with improved patterns
        const valuePatterns = [
          /USD\s*([\d']+(?:\.\d+)?)/,
          /([\d']+(?:\.\d+)?)\s*USD/,
          /([\d']+)\s*(?:\d{2,3})/,  // Swiss format: 4'667'604
          /(\d{1,3}(?:'?\d{3})*(?:\.\d{2})?)/  // General number with apostrophes
        ];
        
        for (const pattern of valuePatterns) {
          const match = cellContent.match(pattern);
          if (match) {
            const valueStr = match[1];
            const parsedValue = parseSwissNumber(valueStr);
            if (parsedValue > 1000) { // Likely a real value
              value = Math.max(value, parsedValue); // Take the largest value found
            }
          }
        }
        
        // Also check adjacent cells for values
        const adjacentCells = cells.filter(c => 
          Math.abs(c.rowIndex - cell.rowIndex) <= 1 && 
          Math.abs(c.columnIndex - cell.columnIndex) <= 2
        );
        
        for (const adjCell of adjacentCells) {
          const adjContent = adjCell.content || '';
          const adjMatch = adjContent.match(/([\d']{4,})/); // Look for large numbers
          if (adjMatch) {
            const adjValue = parseSwissNumber(adjMatch[1]);
            if (adjValue > value && adjValue > 10000) {
              value = adjValue;
            }
          }
        }
      }
      
      holdings.push({
        isin: isin,
        securityName: securityName || 'Unknown Security',
        currentValue: value,
        currency: 'USD',
        category: categorizeByISIN(isin)
      });
    }
  }
  
  return holdings;
}

// Simple text-based parsing (fallback)
function parseSwissBankStatement(text) {
  console.log('Parsing Swiss bank statement text...');
  
  const holdings = [];
  const lines = text.split('\n');
  const isinPattern = /([A-Z]{2}[A-Z0-9]{9}[0-9])/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isinMatch = line.match(isinPattern);
    
    if (isinMatch && validateISIN(isinMatch[1])) {
      const isin = isinMatch[1];
      
      // Look for security name in previous lines
      let securityName = '';
      for (let j = 1; j <= 2; j++) {
        if (i - j >= 0) {
          const prevLine = lines[i - j].trim();
          if (prevLine.length > 5 && !prevLine.match(/^\d/) && !prevLine.match(isinPattern)) {
            securityName = prevLine;
            break;
          }
        }
      }
      
      // Look for value in current and next lines
      const searchText = [line, lines[i + 1] || ''].join(' ');
      const valueMatch = searchText.match(/USD\s*([\d']+(?:\.\d+)?)/);
      
      if (valueMatch) {
        holdings.push({
          isin: isin,
          securityName: securityName || 'Unknown Security',
          currentValue: parseSwissNumber(valueMatch[1]),
          currency: 'USD',
          category: categorizeByISIN(isin)
        });
      }
    }
  }
  
  // Extract portfolio info
  const clientMatch = text.match(/(?:Cliente|Client)[:\s]*([A-Z\s\.]+LTD)/i);
  const totalMatch = text.match(/(?:totale|total)[:\s]*USD\s*([\d']+)/i);
  
  return {
    holdings: holdings.sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0)),
    portfolioInfo: {
      clientName: clientMatch ? clientMatch[1].trim() : null,
      portfolioTotal: totalMatch ? {
        value: parseSwissNumber(totalMatch[1]),
        currency: 'USD'
      } : null,
      bankName: 'Cornèr Banca SA'
    },
    method: 'text-parsing'
  };
}

// Merge results from different methods
function mergeResults(textResults, azureResults) {
  const merged = {
    holdings: [],
    portfolioInfo: {},
    summary: {}
  };
  
  // Collect all holdings
  const allHoldings = [];
  
  if (textResults && textResults.holdings) {
    allHoldings.push(...textResults.holdings.map(h => ({...h, source: 'text'})));
  }
  
  if (azureResults && azureResults.holdings) {
    allHoldings.push(...azureResults.holdings.map(h => ({...h, source: 'azure'})));
  }
  
  // Remove duplicates by ISIN
  const uniqueHoldings = [];
  const seenISINs = new Set();
  
  for (const holding of allHoldings) {
    if (holding.isin && !seenISINs.has(holding.isin)) {
      seenISINs.add(holding.isin);
      uniqueHoldings.push(holding);
    }
  }
  
  merged.holdings = uniqueHoldings.sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0));
  
  // Merge portfolio info
  merged.portfolioInfo = {
    ...(textResults?.portfolioInfo || {}),
    ...(azureResults?.portfolioInfo || {})
  };
  
  merged.summary = {
    totalHoldings: merged.holdings.length,
    textHoldings: textResults?.holdings?.length || 0,
    azureHoldings: azureResults?.holdings?.length || 0,
    extractionAccuracy: 'high',
    method: 'merged-results'
  };
  
  return merged;
}

// Helper functions
function parseSwissNumber(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/'/g, '').replace(/,/g, ''));
}

function validateISIN(isin) {
  if (!isin || isin.length !== 12) return false;
  return /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin);
}

function categorizeByISIN(isin) {
  if (isin.startsWith('XS')) return 'Bonds';
  if (isin.startsWith('CH')) return 'Swiss Securities';
  if (isin.startsWith('XD')) return 'Funds';
  return 'Other';
}

// Alternative PDF text extraction for Vercel compatibility
async function extractPDFTextAlternative(pdfBase64) {
  console.log('Using alternative PDF text extraction...');
  
  // Simple fallback: try to extract basic text content
  // This is a minimal implementation that works when pdf-parse fails
  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  
  // Convert buffer to string and look for basic text patterns
  const rawString = pdfBuffer.toString('binary');
  
  // Extract basic text patterns that might contain financial data
  const textPatterns = [];
  
  // Look for ISIN patterns
  const isinMatches = rawString.match(/[A-Z]{2}[A-Z0-9]{9}[0-9]/g) || [];
  textPatterns.push(...isinMatches);
  
  // Look for USD amounts
  const usdMatches = rawString.match(/USD\s*[\d']+/g) || [];
  textPatterns.push(...usdMatches);
  
  // Look for basic text content
  const textContent = rawString.replace(/[^\x20-\x7E]/g, ' ') // Remove non-printable chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  if (textContent.length > 100) {
    return textContent;
  }
  
  // If we found patterns, construct basic text
  if (textPatterns.length > 0) {
    return textPatterns.join('\n');
  }
  
  throw new Error('No extractable text found in PDF');
}