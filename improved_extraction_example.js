// Improved Messos PDF Extraction Strategy
// Based on comprehensive structure analysis

class MessosExtractor {
  constructor() {
    this.swissNumberPattern = /[\d,']+(\.[\d]{2,4})?/g;
    this.isinPattern = /[A-Z]{2}[A-Z0-9]{10}/g;
    this.currencyPattern = /\b(USD|CHF|EUR|GBP|JPY|CAD|AUD)\b/g;
    this.performancePattern = /[-+]?\d+\.\d{2}%/g;
  }

  // Parse Swiss number format (1'000'000.50 -> 1000000.50)
  parseSwissNumber(numberStr) {
    if (!numberStr) return null;
    return parseFloat(numberStr.replace(/[,']/g, ''));
  }

  // Extract security entry from multi-line text
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

    // Parse main data line (first line)
    const mainLine = lines[0];
    
    // Extract currency (first 3 letters)
    const currencyMatch = mainLine.match(/^([A-Z]{3})\s+/);
    if (currencyMatch) {
      security.currency = currencyMatch[1];
    }

    // Extract nominal quantity (number after currency)
    const nominalMatch = mainLine.match(/^[A-Z]{3}\s+([\d,']+(?:\.\d{2})?)/);
    if (nominalMatch) {
      security.nominalQuantity = this.parseSwissNumber(nominalMatch[1]);
    }

    // Extract description (text between nominal and prices)
    const descriptionMatch = mainLine.match(/^[A-Z]{3}\s+[\d,']+(?:\.\d{2})?\s+(.+?)\s+[\d,']+\.\d{4}/);
    if (descriptionMatch) {
      security.description = descriptionMatch[1].trim();
    }

    // Extract financial data (acquisition price, current price, performance, valuation, weight)
    const financialPattern = /([\d,']+\.\d{4})\s+([\d,']+\.\d{4})\s+([-+]?\d+\.\d{2}%)\s+([-+]?\d+\.\d{2}%)\s+([\d,']+)\s+([\d,']+\.\d{2}%)/;
    const financialMatch = mainLine.match(financialPattern);
    if (financialMatch) {
      security.acquisitionPrice = this.parseSwissNumber(financialMatch[1]);
      security.currentPrice = this.parseSwissNumber(financialMatch[2]);
      security.performanceYTD = financialMatch[3];
      security.performanceTotal = financialMatch[4];
      security.marketValue = this.parseSwissNumber(financialMatch[5]);
      security.portfolioWeight = financialMatch[6];
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
      const couponMatch = line.match(/Coupon:.*?(\d+\.\d+%)/);
      if (couponMatch) {
        security.coupon = couponMatch[1];
      }

      // Extract PRC
      const prcMatch = line.match(/PRC:\s*([\d.]+)/);
      if (prcMatch) {
        security.prc = prcMatch[1];
      }

      // Extract security type
      const securityTypes = ['Ordinary Bonds', 'Zero Bonds', 'Structured Bonds', 'Ordinary Stocks', 'Bond Funds', 'Hedge Funds'];
      for (const type of securityTypes) {
        if (line.includes(type)) {
          security.securityType = type;
          break;
        }
      }

      // Extract accruals (numbers at end of certain lines)
      const accrualMatch = line.match(/(\d+[,']?\d*)\s*$/);
      if (accrualMatch && line.includes('//')) {
        security.accruals = this.parseSwissNumber(accrualMatch[1]);
      }
    }

    return security;
  }

  // Extract holdings from a section of text
  extractHoldings(sectionText, sectionType) {
    const holdings = [];
    
    // Split by security boundaries - look for currency codes at start of line
    const securityBoundaries = sectionText.split(/(?=^[A-Z]{3}\s+[\d,']+)/gm);
    
    for (const securityBlock of securityBoundaries) {
      const trimmedBlock = securityBlock.trim();
      
      // Skip short blocks or summary lines
      if (trimmedBlock.length < 50 || 
          trimmedBlock.startsWith('Total ') || 
          trimmedBlock.startsWith('Accr') || 
          trimmedBlock.startsWith('thereof')) {
        continue;
      }

      const security = this.parseSecurityEntry(trimmedBlock);
      if (security && security.currency) {
        security.section = sectionType;
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

  // Main extraction method
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

    const totalValueMatch = pdfText.match(/Total\s+([\d,']+)\s+100\.00%/);
    if (totalValueMatch) {
      extractedData.portfolioInfo.totalValue = this.parseSwissNumber(totalValueMatch[1]);
      extractedData.portfolioInfo.currency = 'USD';
    }

    // Extract holdings by section
    const sections = [
      { name: 'bonds', markers: ['Bonds, Bond funds', 'Ordinary Bonds', 'Zero Bonds'] },
      { name: 'equities', markers: ['Equities, Equity funds', 'Ordinary Stocks'] },
      { name: 'structured_products', markers: ['Structured products'] },
      { name: 'hedge_funds', markers: ['Hedge Funds'] },
      { name: 'money_market', markers: ['Money market', 'Cash accounts'] }
    ];

    for (const section of sections) {
      for (const marker of section.markers) {
        const sectionStart = pdfText.indexOf(marker);
        if (sectionStart !== -1) {
          // Extract text for this section (rough approximation)
          const sectionText = pdfText.substring(sectionStart, sectionStart + 5000);
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

    // Summary
    extractedData.summary = {
      totalHoldings: extractedData.holdings.length,
      sectionsFound: [...new Set(extractedData.holdings.map(h => h.section))],
      extractionMethod: 'enhanced_multiline_parsing',
      accuracy: 'improved'
    };

    return extractedData;
  }
}

// Usage example:
// const extractor = new MessosExtractor();
// const extractedData = extractor.extractData(pdfText);
// console.log(extractedData);

module.exports = MessosExtractor;