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
    
    // Extract text from PDF or use provided text
    if (textData) {
      extractedText = textData;
      console.log('Using provided text data');
    } else {
      try {
        console.log('Attempting PDF text extraction...');
        const pdfParse = (await import('pdf-parse')).default;
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        const pdfData = await pdfParse(pdfBuffer);
        extractedText = pdfData.text;
        console.log(`PDF extraction successful: ${extractedText.length} characters`);
      } catch (pdfError) {
        console.log('PDF extraction failed:', pdfError.message);
        return res.status(500).json({
          error: 'PDF extraction failed',
          details: pdfError.message
        });
      }
    }

    // Enhanced Swiss banking extraction
    const results = parseSwissBankingDocument(extractedText);
    
    const processingTime = Date.now() - startTime;
    
    // Calculate comprehensive accuracy metrics
    const metrics = calculateAccuracyMetrics(results);
    
    return res.status(200).json({
      success: true,
      data: results,
      metadata: {
        filename: filename || 'document.pdf',
        processingTime: `${processingTime}ms`,
        method: 'enhanced-swiss-extraction',
        confidence: Math.round(metrics.overallAccuracy),
        totalHoldings: results.holdings.length,
        withNames: metrics.withNames,
        withValues: metrics.withValues,
        validISINs: metrics.validISINs,
        nameAccuracy: Math.round(metrics.nameAccuracy),
        valueAccuracy: Math.round(metrics.valueAccuracy),
        isinAccuracy: Math.round(metrics.isinAccuracy)
      },
      qualityMetrics: metrics,
      debug: {
        textLength: extractedText.length,
        extractionMethod: 'line-by-line-context-aware',
        swissFormatSupport: true
      }
    });

  } catch (error) {
    console.error('Enhanced Swiss extraction error:', error);
    
    return res.status(500).json({
      error: 'Extraction failed',
      details: error.message,
      type: error.constructor.name
    });
  }
}

// Enhanced Swiss banking document parser based on PDF analysis
function parseSwissBankingDocument(text) {
  console.log('Starting enhanced Swiss banking extraction...');
  
  const holdings = [];
  const lines = text.split('\n').map(line => line.trim());
  
  // Enhanced ISIN pattern that captures the specific format used
  const isinPattern = /ISIN:\s*([A-Z]{2}[0-9A-Z]{10})/i;
  
  // Multiple Swiss value patterns based on document analysis
  const swissValuePatterns = [
    /USD\s*([0-9]{1,3}(?:[']\d{3})*(?:[\.,]\d{2})?)/,  // USD1'500'000
    /^([0-9]{1,3}(?:[']\d{3})+)$/,                      // 1'500'000 (standalone)
    /([0-9]{1,3}(?:[']\d{3})+)$/,                       // 737'748 (end of line)
    /([0-9]{1,3}(?:[']\d{3})*[\.,]\d{2})$/,            // 2'581.79 (decimals)
    /^([0-9]{1,3}(?:[']\d{3})*[\.,]\d{2})$/            // Exact decimal match
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isinMatch = line.match(isinPattern);
    
    if (isinMatch && validateISIN(isinMatch[1])) {
      const isin = isinMatch[1];
      console.log(`Found ISIN: ${isin} at line ${i}`);
      
      // Extract security name (1-5 lines before ISIN)
      let securityName = 'Unknown Security';
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        const candidateLine = lines[j];
        if (candidateLine && candidateLine.length > 10) {
          // Filter out technical lines and keep descriptive names
          if (!candidateLine.match(/^(Maturity|Coupon|PRC|ISIN|Valorn|USD|CHF|EUR|\d+[.,]\d+%?$)/i)) {
            // Prefer longer, more descriptive names
            if (candidateLine.length > 20 || securityName === 'Unknown Security') {
              securityName = candidateLine;
              if (candidateLine.length > 30) break; // Good enough
            }
          }
        }
      }
      
      // Extract value (1-7 lines after ISIN, based on document structure)
      let currentValue = 0;
      let valueFound = false;
      
      for (let j = i + 1; j < Math.min(lines.length, i + 8) && !valueFound; j++) {
        const valueLine = lines[j];
        
        for (const pattern of swissValuePatterns) {
          const valueMatch = valueLine.match(pattern);
          if (valueMatch) {
            const rawValue = valueMatch[1];
            const parsedValue = parseSwissNumber(rawValue);
            
            // Swiss banking values are typically > 10,000
            if (parsedValue > 10000) {
              currentValue = parsedValue;
              valueFound = true;
              console.log(`Found value: ${rawValue} = ${parsedValue} for ${isin}`);
              break;
            }
          }
        }
      }
      
      // Create holding record
      const holding = {
        isin: isin,
        securityName: securityName,
        currentValue: currentValue,
        currency: 'USD', // Default from Swiss banking documents
        category: categorizeByISIN(isin),
        source: 'enhanced-swiss-extraction',
        quality: {
          hasName: securityName !== 'Unknown Security',
          hasValue: currentValue > 0,
          nameLength: securityName.length,
          valueConfidence: currentValue > 100000 ? 'high' : currentValue > 10000 ? 'medium' : 'low'
        }
      };
      
      holdings.push(holding);
    }
  }
  
  // Extract portfolio information
  const portfolioInfo = extractPortfolioInfo(text);
  
  // Sort holdings by value (highest first)
  holdings.sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0));
  
  console.log(`Enhanced extraction completed: ${holdings.length} holdings found`);
  
  return {
    holdings: holdings,
    portfolioInfo: portfolioInfo,
    summary: {
      totalHoldings: holdings.length,
      withNames: holdings.filter(h => h.quality.hasName).length,
      withValues: holdings.filter(h => h.quality.hasValue).length,
      extractionMethod: 'enhanced-swiss-line-by-line',
      documentType: 'swiss-banking-portfolio'
    }
  };
}

// Enhanced portfolio information extraction
function extractPortfolioInfo(text) {
  const info = {
    clientName: null,
    portfolioTotal: null,
    bankName: 'Cornèr Banca SA', // Default for this document type
    accountNumber: null,
    reportDate: null
  };
  
  // Extract client name (multiple patterns)
  const clientPatterns = [
    /Cliente:\s*([A-Z\s\.]+(?:LTD|LIMITED|ENTERPRISES|INC)?)/i,
    /Client:\s*([A-Z\s\.]+(?:LTD|LIMITED|ENTERPRISES|INC)?)/i,
    /MESSOS\s+(ENTERPRISES\s+LTD)/i
  ];
  
  for (const pattern of clientPatterns) {
    const match = text.match(pattern);
    if (match) {
      info.clientName = match[1].trim();
      break;
    }
  }
  
  // Extract portfolio total (Swiss format)
  const totalPatterns = [
    /Patrimonio\s+totale:\s*USD\s*([0-9]{1,3}(?:[']\d{3})*(?:[\.,]\d{2})?)/i,
    /Total.*USD\s*([0-9]{1,3}(?:[']\d{3})*(?:[\.,]\d{2})?)/i,
    /USD\s*([0-9]{1,3}(?:[']\d{3})*(?:[\.,]\d{2})?).*total/i
  ];
  
  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match) {
      const totalValue = parseSwissNumber(match[1]);
      if (totalValue > 1000000) { // Reasonable portfolio total
        info.portfolioTotal = {
          value: totalValue,
          currency: 'USD'
        };
        break;
      }
    }
  }
  
  // Extract account number
  const accountMatch = text.match(/Conto:\s*(\d+)/i);
  if (accountMatch) {
    info.accountNumber = accountMatch[1];
  }
  
  // Extract report date
  const dateMatch = text.match(/Valutazione\s+al:\s*(\d{2}[\.\/-]\d{2}[\.\/-]\d{4})/i);
  if (dateMatch) {
    info.reportDate = dateMatch[1];
  }
  
  return info;
}

// Parse Swiss number format (apostrophes as thousands separators)
function parseSwissNumber(str) {
  if (!str) return 0;
  
  // Remove apostrophes and replace comma with dot for decimals
  const cleaned = str
    .replace(/'/g, '')           // Remove apostrophes
    .replace(/,/g, '.');         // Replace comma with dot
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Validate ISIN format
function validateISIN(isin) {
  if (!isin || isin.length !== 12) return false;
  return /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin);
}

// Categorize securities by ISIN prefix
function categorizeByISIN(isin) {
  if (!isin) return 'Unknown';
  
  const prefix = isin.substring(0, 2);
  const categories = {
    'XS': 'International Bonds',
    'XD': 'Investment Funds',
    'CH': 'Swiss Securities',
    'LU': 'Luxembourg Securities',
    'US': 'US Securities',
    'DE': 'German Securities',
    'FR': 'French Securities',
    'IT': 'Italian Securities',
    'ES': 'Spanish Securities'
  };
  
  return categories[prefix] || 'Other Securities';
}

// Calculate comprehensive accuracy metrics
function calculateAccuracyMetrics(results) {
  const holdings = results.holdings || [];
  const total = holdings.length;
  
  if (total === 0) {
    return {
      overallAccuracy: 0,
      nameAccuracy: 0,
      valueAccuracy: 0,
      isinAccuracy: 0,
      withNames: 0,
      withValues: 0,
      validISINs: 0
    };
  }
  
  const withNames = holdings.filter(h => h.quality?.hasName).length;
  const withValues = holdings.filter(h => h.quality?.hasValue).length;
  const validISINs = holdings.filter(h => validateISIN(h.isin)).length;
  
  const nameAccuracy = (withNames / total) * 100;
  const valueAccuracy = (withValues / total) * 100;
  const isinAccuracy = (validISINs / total) * 100;
  
  // Weighted overall accuracy
  const overallAccuracy = (
    (isinAccuracy * 0.4) +      // ISIN is critical (40%)
    (valueAccuracy * 0.35) +    // Values are very important (35%)
    (nameAccuracy * 0.25)       // Names are important (25%)
  );
  
  return {
    overallAccuracy,
    nameAccuracy,
    valueAccuracy,
    isinAccuracy,
    withNames,
    withValues,
    validISINs,
    totalHoldings: total,
    qualityDistribution: {
      highQuality: holdings.filter(h => h.quality?.hasName && h.quality?.hasValue).length,
      mediumQuality: holdings.filter(h => h.quality?.hasName || h.quality?.hasValue).length,
      lowQuality: holdings.filter(h => !h.quality?.hasName && !h.quality?.hasValue).length
    }
  };
}