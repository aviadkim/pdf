// Test the new multiline processor with real Messos data
const fs = require('fs');
const path = require('path');

// Import the processor class (simulated since we can't import ES modules in CommonJS)
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

    // Parse main data line (first line)
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

      // Extract accruals
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
}

async function testMultilineProcessor() {
  console.log('🎯 Testing Enhanced Multiline Processor');
  
  // Test with real extraction data
  const testData = `USD 200'000 TORONTO DOMINION BANK NOTES 23-23.02.27 REG-S VRN 100.2000 99.1991 0.25% -1.00% 199'080 1.02%
ISIN: XS2530201644 // Valorn.: 125350273 682
Ordinary Bonds // Maturity: 23.02.2027 28.03.2025
Coupon: 23.5 // Quarterly 3.32% // Days: 37
Moody's: A2 // PRC: 2.00

USD 200'000 CANADIAN IMPERIAL BANK OF COMMERCE NOTES 23-22.08.28 100.2000 99.6285 0.47% -0.57% 200'288 1.03%
ISIN: XS2588105036 // Valorn.: 112286204 1'031
Ordinary Bonds // Maturity: 22.02.2028 28.03.2025
Coupon: 23.2 // Annual 5.1531% // Days: 46
PRC: 5.00

USD 100'000.00 RBC LONDON 0% NOTES 2025-28.03.2035 100.0000 97.7000 -2.30% -2.30% 97'700 0.50%
ISIN: XS2993414619 // Valorn.: 140610687
MM secs discounted // Maturity: 28.03.2035 // PRC: 5.00 31.03.2025`;

  const processor = new MessosMultilineProcessor();
  const holdings = processor.extractHoldings(testData, 'bonds');
  
  console.log(`\n📊 Extraction Results:`);
  console.log(`Holdings found: ${holdings.length}`);
  
  let totalValue = 0;
  for (const holding of holdings) {
    console.log(`\n📋 Position ${holding.position}:`);
    console.log(`  Security: ${holding.description}`);
    console.log(`  ISIN: ${holding.isin}`);
    console.log(`  Valorn: ${holding.valorn}`);
    console.log(`  Currency: ${holding.currency}`);
    console.log(`  Nominal: ${holding.nominalQuantity?.toLocaleString()}`);
    console.log(`  Market Value: ${holding.marketValue?.toLocaleString()}`);
    console.log(`  Performance YTD: ${holding.performanceYTD}`);
    console.log(`  Performance Total: ${holding.performanceTotal}`);
    console.log(`  Portfolio Weight: ${holding.portfolioWeight}`);
    console.log(`  Maturity: ${holding.maturityDate}`);
    console.log(`  Coupon: ${holding.coupon}`);
    console.log(`  PRC: ${holding.prc}`);
    console.log(`  Accruals: ${holding.accruals}`);
    console.log(`  Security Type: ${holding.securityType}`);
    
    totalValue += holding.marketValue || 0;
  }
  
  console.log(`\n💰 Total Value: ${totalValue.toLocaleString()} USD`);
  
  // Test specific parsing issues
  console.log(`\n🔍 Testing Swiss Number Parsing:`);
  console.log(`  199'080 -> ${processor.parseSwissNumber("199'080")}`);
  console.log(`  200'288 -> ${processor.parseSwissNumber("200'288")}`);
  console.log(`  97'700 -> ${processor.parseSwissNumber("97'700")}`);
  console.log(`  100'000.00 -> ${processor.parseSwissNumber("100'000.00")}`);
  
  // Test pattern matching
  console.log(`\n🎯 Testing Pattern Matching:`);
  const testLine = "USD 200'000 TORONTO DOMINION BANK NOTES 23-23.02.27 REG-S VRN 100.2000 99.1991 0.25% -1.00% 199'080 1.02%";
  const match = testLine.match(processor.securityBoundaryPattern);
  if (match) {
    console.log(`  Pattern matched successfully!`);
    console.log(`  Currency: ${match[1]}`);
    console.log(`  Nominal: ${match[2]}`);
    console.log(`  Description: ${match[3]}`);
    console.log(`  Market Value: ${match[8]}`);
    console.log(`  Weight: ${match[9]}`);
  } else {
    console.log(`  Pattern did not match - needs adjustment`);
  }
  
  return holdings;
}

// Run the test
testMultilineProcessor().catch(console.error);