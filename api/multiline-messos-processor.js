// 🎯 ENHANCED MULTILINE MESSOS PROCESSOR - Real Multi-line Structure Parser
// Based on comprehensive structure analysis and improved extraction strategy

class MessosMultilineProcessor {
  constructor() {
    this.swissNumberPattern = /[\d,']+(\.[\d]{2,4})?/g;
    this.isinPattern = /[A-Z]{2}[A-Z0-9]{10}/g;
    this.currencyPattern = /\b(USD|CHF|EUR|GBP|JPY|CAD|AUD)\b/g;
    this.performancePattern = /[-+]?\d+\.\d{2}%/g;
    this.securityBoundaryPattern = /^([A-Z]{3})\s+([\d,']+(?:\.[\d]{2,4})?)\s+(.+?)\s+([\d,']+\.[\d]{4})\s+([\d,']+\.[\d]{4})\s+([-+]?\d+\.\d{2}%)\s+([-+]?\d+\.\d{2}%)\s+([\d,']+)\s+([\d,']+\.\d{2}%)/;
  }

  // Parse Swiss number format (1'000'000.50 -> 1000000.50)
  parseSwissNumber(numberStr) {
    if (!numberStr) return null;
    return parseFloat(numberStr.replace(/[,']/g, ''));
  }

  // Extract security entry from multi-line text block
  parseSecurityEntry(entryText) {
    const lines = entryText.trim().split('\n');
    if (lines.length === 0) return null;

    const security = {
      rawText: entryText,
      currency: null,
      nominalQuantity: null,
      description: null,
      isin: null,
      valorn: null,
      acquisitionPrice: null,
      currentPrice: null,
      performanceYTD: null,
      performanceTotal: null,
      marketValue: null,
      portfolioWeight: null,
      securityType: null,
      maturityDate: null,
      coupon: null,
      prc: null,
      accruals: null,
      section: null
    };

    // Parse main data line (first line) - handles the complex format
    const mainLine = lines[0];
    
    // Extract currency (first 3 letters)
    const currencyMatch = mainLine.match(/^([A-Z]{3})\s+/);
    if (currencyMatch) {
      security.currency = currencyMatch[1];
    }

    // Parse the complete main line using comprehensive pattern
    const mainLineMatch = mainLine.match(this.securityBoundaryPattern);
    if (mainLineMatch) {
      security.currency = mainLineMatch[1];
      security.nominalQuantity = this.parseSwissNumber(mainLineMatch[2]);
      security.description = mainLineMatch[3].trim();
      security.acquisitionPrice = this.parseSwissNumber(mainLineMatch[4]);
      security.currentPrice = this.parseSwissNumber(mainLineMatch[5]);
      security.performanceYTD = mainLineMatch[6];
      security.performanceTotal = mainLineMatch[7];
      security.marketValue = this.parseSwissNumber(mainLineMatch[8]);
      security.portfolioWeight = mainLineMatch[9];
    } else {
      // Fallback parsing for non-standard formats
      const parts = mainLine.split(/\s+/);
      if (parts.length >= 3) {
        security.currency = parts[0];
        security.nominalQuantity = this.parseSwissNumber(parts[1]);
        
        // Find description (text between numbers)
        const descStart = mainLine.indexOf(parts[1]) + parts[1].length;
        const descEnd = mainLine.lastIndexOf(parts[parts.length - 1]);
        if (descStart < descEnd) {
          security.description = mainLine.substring(descStart, descEnd).trim();
        }
      }
    }

    // Parse additional lines for metadata
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Extract ISIN
      const isinMatch = line.match(/ISIN:\s*([A-Z]{2}[A-Z0-9]{10})/);
      if (isinMatch) {
        security.isin = isinMatch[1];
      }

      // Extract Valorn
      const valornMatch = line.match(/Valorn\.:\s*(\d+)/);
      if (valornMatch) {
        security.valorn = valornMatch[1];
      }

      // Extract maturity date
      const maturityMatch = line.match(/Maturity:\s*(\d{2}\.\d{2}\.\d{4})/);
      if (maturityMatch) {
        security.maturityDate = maturityMatch[1];
      }

      // Extract coupon
      const couponMatch = line.match(/Coupon:.*?(\d+\.?\d*%?)/);
      if (couponMatch) {
        security.coupon = couponMatch[1];
      }

      // Extract PRC
      const prcMatch = line.match(/PRC:\s*([\d.]+)/);
      if (prcMatch) {
        security.prc = prcMatch[1];
      }

      // Extract security type
      const securityTypes = ['Ordinary Bonds', 'Zero Bonds', 'Structured Bonds', 'Ordinary Stocks', 'Bond Funds', 'Hedge Funds', 'Money market'];
      for (const type of securityTypes) {
        if (line.includes(type)) {
          security.securityType = type;
          break;
        }
      }

      // Extract accruals (numbers at end of metadata lines)
      const accrualMatch = line.match(/(\d+[,']?\d*)\s*$/);
      if (accrualMatch && line.includes('//')) {
        security.accruals = this.parseSwissNumber(accrualMatch[1]);
      }
    }

    return security;
  }

  // Extract holdings from a section of text using improved multi-line parsing
  extractHoldings(sectionText, sectionType) {
    const holdings = [];
    
    // Split by security boundaries - look for currency codes at start of line
    const securityBoundaries = sectionText.split(/(?=^[A-Z]{3}\s+[\d,']+)/gm);
    
    for (const securityBlock of securityBoundaries) {
      const trimmedBlock = securityBlock.trim();
      
      // Skip short blocks or summary lines
      if (trimmedBlock.length < 30 || 
          trimmedBlock.startsWith('Total ') || 
          trimmedBlock.startsWith('Accr') || 
          trimmedBlock.startsWith('thereof') ||
          trimmedBlock.startsWith('Page ') ||
          trimmedBlock.startsWith('Client ')) {
        continue;
      }

      const security = this.parseSecurityEntry(trimmedBlock);
      if (security && security.currency && security.marketValue && security.marketValue > 0) {
        security.section = sectionType;
        security.position = holdings.length + 1;
        holdings.push(security);
      }
    }

    return holdings;
  }

  // Extract asset allocation from summary section
  extractAssetAllocation(allocationText) {
    const allocation = [];
    const lines = allocationText.split('\n');
    
    for (const line of lines) {
      const allocationMatch = line.match(/([A-Za-z\s]+)\s+([\d,']+)\s+([\d.]+%)/);
      if (allocationMatch) {
        allocation.push({
          category: allocationMatch[1].trim(),
          value: this.parseSwissNumber(allocationMatch[2]),
          percentage: allocationMatch[3]
        });
      }
    }

    return allocation;
  }

  // Extract portfolio performance
  extractPerformance(performanceText) {
    const performance = {
      ytdPerformance: null,
      ytdPercentage: null,
      totalReturn: null
    };

    // Look for performance figures
    const performanceMatch = performanceText.match(/Performance TWR\s+([\d,']+)\s+([\d.]+%)/);
    if (performanceMatch) {
      performance.ytdPerformance = this.parseSwissNumber(performanceMatch[1]);
      performance.ytdPercentage = performanceMatch[2];
      performance.totalReturn = performanceMatch[2];
    }

    return performance;
  }

  // Main extraction method with multi-line parsing
  extractData(pdfText) {
    const extractedData = {
      portfolioInfo: {},
      holdings: [],
      assetAllocation: [],
      performance: {},
      summary: {}
    };

    // Extract portfolio info
    const clientMatch = pdfText.match(/([A-Z\s]+LTD\.)/);
    if (clientMatch) {
      extractedData.portfolioInfo.clientName = clientMatch[1];
    }

    const accountMatch = pdfText.match(/Client Number\s+(\d+)/);
    if (accountMatch) {
      extractedData.portfolioInfo.accountNumber = accountMatch[1];
    }

    const dateMatch = pdfText.match(/(\d{2}\.\d{2}\.\d{4})/);
    if (dateMatch) {
      extractedData.portfolioInfo.reportDate = dateMatch[1];
    }

    // Extract holdings by section with improved multi-line parsing
    const sections = [
      { name: 'bonds', markers: ['Bonds, Bond funds', 'Ordinary Bonds', 'Zero Bonds', 'Structured Bonds'] },
      { name: 'equities', markers: ['Equities, Equity funds', 'Ordinary Stocks'] },
      { name: 'structured_products', markers: ['Structured products'] },
      { name: 'hedge_funds', markers: ['Hedge Funds'] },
      { name: 'money_market', markers: ['Money market', 'Cash accounts'] }
    ];

    for (const section of sections) {
      for (const marker of section.markers) {
        const sectionStart = pdfText.indexOf(marker);
        if (sectionStart !== -1) {
          // Extract larger section to capture all multi-line entries
          const sectionText = pdfText.substring(sectionStart, sectionStart + 10000);
          const holdings = this.extractHoldings(sectionText, section.name);
          extractedData.holdings = extractedData.holdings.concat(holdings);
        }
      }
    }

    // Extract asset allocation
    const allocationStart = pdfText.indexOf('Asset Allocation');
    if (allocationStart !== -1) {
      const allocationText = pdfText.substring(allocationStart, allocationStart + 1000);
      extractedData.assetAllocation = this.extractAssetAllocation(allocationText);
    }

    // Extract performance
    const performanceStart = pdfText.indexOf('Performance TWR');
    if (performanceStart !== -1) {
      const performanceText = pdfText.substring(performanceStart, performanceStart + 500);
      extractedData.performance = this.extractPerformance(performanceText);
    }

    // Calculate totals
    const totalValue = extractedData.holdings.reduce((sum, holding) => sum + (holding.marketValue || 0), 0);
    extractedData.portfolioInfo.totalValue = totalValue;
    extractedData.portfolioInfo.currency = 'USD';

    // Summary
    extractedData.summary = {
      totalHoldings: extractedData.holdings.length,
      sectionsFound: [...new Set(extractedData.holdings.map(h => h.section))],
      extractionMethod: 'enhanced_multiline_parsing',
      accuracy: 'improved_multiline_structure',
      totalValue: totalValue,
      validISINs: extractedData.holdings.filter(h => h.isin).length
    };

    return extractedData;
  }
}

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed - Use POST only'
    });
  }

  const processingStartTime = Date.now();
  
  try {
    console.log('🎯 ENHANCED MULTILINE MESSOS PROCESSOR - Starting');
    
    const { pdfBase64, filename } = req.body;
    
    if (!pdfBase64) {
      return res.status(400).json({ 
        success: false, 
        error: 'No PDF data provided'
      });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    console.log(`📄 Processing with multiline parser: ${filename || 'messos-document.pdf'}`);
    
    // First get PDF text using Azure or simple PDF parsing
    let pdfText = '';
    
    // Try Azure Document Intelligence for text extraction
    const azureKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || process.env.AZURE_FORM_KEY;
    const azureEndpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || process.env.AZURE_FORM_ENDPOINT;
    
    if (azureKey && azureEndpoint) {
      try {
        const { DocumentAnalysisClient, AzureKeyCredential } = await import('@azure/ai-form-recognizer');
        
        const client = new DocumentAnalysisClient(
          azureEndpoint,
          new AzureKeyCredential(azureKey)
        );
        
        const poller = await client.beginAnalyzeDocument('prebuilt-read', pdfBuffer);
        const result = await poller.pollUntilDone();
        
        // Extract text while preserving line structure
        pdfText = result.content || '';
        console.log(`📊 Azure extracted ${pdfText.length} characters`);
        
      } catch (error) {
        console.error('Azure text extraction failed:', error);
        
        // Fallback to pdf-parse
        const pdfParse = await import('pdf-parse');
        const pdfData = await pdfParse.default(pdfBuffer);
        pdfText = pdfData.text;
      }
    } else {
      // Use pdf-parse as fallback
      const pdfParse = await import('pdf-parse');
      const pdfData = await pdfParse.default(pdfBuffer);
      pdfText = pdfData.text;
    }
    
    if (!pdfText || pdfText.length < 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'No text extracted from PDF'
      });
    }
    
    // Process with enhanced multiline parser
    const processor = new MessosMultilineProcessor();
    const extractedData = processor.extractData(pdfText);
    
    const processingTime = Date.now() - processingStartTime;
    
    console.log(`✅ Multiline extraction complete: ${extractedData.holdings.length} holdings`);
    console.log(`💰 Total value: ${extractedData.portfolioInfo.totalValue?.toLocaleString()}`);
    console.log(`📊 Sections found: ${extractedData.summary.sectionsFound.join(', ')}`);
    
    // Generate CSV with enhanced data
    const csvData = generateEnhancedCSV(extractedData.holdings, extractedData.portfolioInfo);
    
    // Return enhanced results
    res.status(200).json({
      success: true,
      message: `Successfully extracted ${extractedData.holdings.length} holdings with enhanced multiline parsing`,
      data: extractedData,
      metadata: {
        processingTime: `${processingTime}ms`,
        extractionMethod: 'enhanced_multiline_parsing',
        holdingsFound: extractedData.holdings.length,
        totalValue: extractedData.portfolioInfo.totalValue,
        filename: filename || 'messos-document.pdf',
        version: 'MULTILINE-MESSOS-PROCESSOR-V1.0'
      },
      csvData: csvData,
      downloadReady: true
    });
    
  } catch (error) {
    console.error('❌ Enhanced multiline extraction failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'PDF extraction failed',
      details: error.message,
      version: 'MULTILINE-MESSOS-PROCESSOR-V1.0'
    });
  }
}

// Generate enhanced CSV with all extracted fields
function generateEnhancedCSV(holdings, portfolioInfo) {
  const headers = [
    'Position',
    'Security Name',
    'ISIN',
    'Valorn',
    'Currency',
    'Nominal Quantity',
    'Acquisition Price',
    'Current Price',
    'Market Value',
    'Performance YTD',
    'Performance Total',
    'Portfolio Weight',
    'Security Type',
    'Maturity Date',
    'Coupon',
    'PRC',
    'Accruals',
    'Section'
  ];
  
  const csvRows = [
    '# MESSOS ENTERPRISES LTD - ENHANCED MULTILINE EXTRACTION',
    `# Generated: ${new Date().toISOString()}`,
    `# Total Holdings: ${holdings.length}`,
    `# Total Value: ${portfolioInfo.totalValue?.toLocaleString()} USD`,
    `# Extraction Method: Enhanced Multiline Parser`,
    '',
    headers.join(',')
  ];
  
  for (const holding of holdings) {
    const row = [
      holding.position || '',
      `"${(holding.description || '').replace(/"/g, '""')}"`,
      holding.isin || '',
      holding.valorn || '',
      holding.currency || '',
      holding.nominalQuantity || '',
      holding.acquisitionPrice || '',
      holding.currentPrice || '',
      holding.marketValue || '',
      holding.performanceYTD || '',
      holding.performanceTotal || '',
      holding.portfolioWeight || '',
      holding.securityType || '',
      holding.maturityDate || '',
      holding.coupon || '',
      holding.prc || '',
      holding.accruals || '',
      holding.section || ''
    ];
    csvRows.push(row.join(','));
  }
  
  return csvRows.join('\n');
}