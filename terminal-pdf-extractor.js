// Universal Terminal PDF Extractor - Works with ANY PDF Document
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class UniversalPDFExtractor {
  constructor() {
    this.extractedData = {
      metadata: {},
      client_info: {},
      financial_data: {
        holdings: [],
        all_numbers: [],
        isin_codes: [],
        percentages: [],
        currencies: []
      },
      table_structures: [],
      text_by_page: [],
      categories: {
        bonds: [],
        equities: [],
        funds: [],
        cash: [],
        other: []
      },
      summary: {
        total_pages: 0,
        total_holdings: 0,
        total_isins: 0,
        total_numbers: 0,
        estimated_portfolio_value: 0
      }
    };
  }

  async extractPDF(pdfPath) {
    console.log('🔍 UNIVERSAL PDF EXTRACTOR');
    console.log('==========================');
    console.log(`📄 Processing: ${path.basename(pdfPath)}`);
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found:', pdfPath);
      return null;
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      console.log(`📊 File size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      const extractorHTML = this.generateExtractorHTML(pdfBase64);
      await page.setContent(extractorHTML);
      
      // Wait for extraction to complete
      await page.waitForSelector('body[data-extraction-complete="true"]', { timeout: 60000 });
      
      // Get extracted data
      const data = await page.evaluate(() => window.extractedData);
      this.extractedData = data;
      
      // Display in terminal
      this.displayInTerminal();
      
      return this.extractedData;
      
    } catch (error) {
      console.error('❌ Extraction failed:', error);
      return null;
    } finally {
      await browser.close();
    }
  }

  generateExtractorHTML(pdfBase64) {
    return `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const extractedData = {
      metadata: {},
      client_info: {},
      financial_data: {
        holdings: [],
        all_numbers: [],
        isin_codes: [],
        percentages: [],
        currencies: []
      },
      table_structures: [],
      text_by_page: [],
      categories: {
        bonds: [],
        equities: [],
        funds: [],
        cash: [],
        other: []
      },
      summary: {
        total_pages: 0,
        total_holdings: 0,
        total_isins: 0,
        total_numbers: 0,
        estimated_portfolio_value: 0
      }
    };

    async function extractUniversal() {
      try {
        const pdfData = atob('${pdfBase64}');
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        
        extractedData.metadata = {
          num_pages: pdf.numPages,
          fingerprint: pdf.fingerprints?.[0] || 'unknown'
        };
        extractedData.summary.total_pages = pdf.numPages;

        // Extract from all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          await extractPageData(pdf, pageNum);
        }

        // Analyze and categorize data
        analyzeExtractedData();
        
        // Mark completion
        document.body.setAttribute('data-extraction-complete', 'true');
        window.extractedData = extractedData;
        
      } catch (error) {
        console.error('Extraction error:', error);
      }
    }

    async function extractPageData(pdf, pageNum) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false
      });

      const pageData = {
        page_number: pageNum,
        raw_text: '',
        text_items: [],
        numbers_found: [],
        isins_found: [],
        percentages_found: []
      };

      // Process each text item
      textContent.items.forEach((item, index) => {
        if (item.str && item.str.trim().length > 0) {
          const text = item.str.trim();
          
          const textItem = {
            text: text,
            x: Math.round(item.transform[4] * 100) / 100,
            y: Math.round(item.transform[5] * 100) / 100,
            width: Math.round(item.width * 100) / 100,
            height: Math.round(item.height * 100) / 100,
            fontSize: Math.round(Math.sqrt(item.transform[0] * item.transform[0] + item.transform[1] * item.transform[1]) * 100) / 100
          };
          
          pageData.text_items.push(textItem);
          pageData.raw_text += text + ' ';

          // Extract different data types
          extractNumbers(text, pageNum, textItem);
          extractISINs(text, pageNum, textItem);
          extractPercentages(text, pageNum, textItem);
          extractCurrencies(text, pageNum, textItem);
          extractClientInfo(text, pageNum, textItem);
        }
      });

      // Detect table structures
      detectTables(pageData.text_items, pageNum);
      
      extractedData.text_by_page.push(pageData);
    }

    function extractNumbers(text, pageNum, textItem) {
      // Multiple number patterns for different formats
      const patterns = [
        /^-?[\\d'.,]+$/,                    // Swiss/European format with apostrophes
        /^-?\\d{1,3}(,\\d{3})*(\\.\\d+)?$/,  // US format with commas
        /^-?\\d+\\.\\d+$/,                  // Simple decimal
        /^-?\\d+$/                          // Integer
      ];

      patterns.forEach(pattern => {
        if (pattern.test(text)) {
          let cleanNumber = text.replace(/[',]/g, '');
          if (text.includes(',') && text.includes('.') && text.lastIndexOf(',') > text.lastIndexOf('.')) {
            // European format: 1.234,56
            cleanNumber = text.replace(/\\./g, '').replace(',', '.');
          }
          
          const parsed = parseFloat(cleanNumber);
          if (!isNaN(parsed) && Math.abs(parsed) > 0.01) {
            extractedData.financial_data.all_numbers.push({
              original: text,
              parsed: parsed,
              page: pageNum,
              x: textItem.x,
              y: textItem.y,
              magnitude: getMagnitude(parsed),
              context: ''
            });
          }
        }
      });
    }

    function extractISINs(text, pageNum, textItem) {
      const isinPattern = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;
      if (isinPattern.test(text)) {
        const category = categorizeByISIN(text);
        
        extractedData.financial_data.isin_codes.push({
          isin: text,
          page: pageNum,
          category: category,
          x: textItem.x,
          y: textItem.y,
          validated: validateISIN(text)
        });
        
        // Add to category
        if (extractedData.categories[category]) {
          extractedData.categories[category].push({
            isin: text,
            page: pageNum,
            description: '',
            value: 0
          });
        }
      }
    }

    function extractPercentages(text, pageNum, textItem) {
      if (text.endsWith('%')) {
        const percent = parseFloat(text.replace('%', ''));
        if (!isNaN(percent)) {
          extractedData.financial_data.percentages.push({
            original: text,
            value: percent,
            page: pageNum,
            x: textItem.x,
            y: textItem.y
          });
        }
      }
    }

    function extractCurrencies(text, pageNum, textItem) {
      const currencies = ['USD', 'CHF', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
      if (currencies.includes(text)) {
        extractedData.financial_data.currencies.push({
          currency: text,
          page: pageNum,
          x: textItem.x,
          y: textItem.y
        });
      }
    }

    function extractClientInfo(text, pageNum, textItem) {
      // Client name patterns
      if (text.includes('ENTERPRISES') || text.includes('LTD') || text.includes('INC') || text.includes('CORP')) {
        extractedData.client_info.name = text;
      }
      
      // Account number (6-8 digits)
      if (/^\\d{6,8}$/.test(text)) {
        extractedData.client_info.account_number = text;
      }
      
      // Dates
      if (/\\d{2}[./-]\\d{2}[./-]\\d{4}/.test(text)) {
        extractedData.client_info.valuation_date = text;
      }
    }

    function detectTables(textItems, pageNum) {
      // Group by Y coordinate to find rows
      const rows = {};
      const tolerance = 8;
      
      textItems.forEach(item => {
        const yKey = Math.round(item.y / tolerance) * tolerance;
        if (!rows[yKey]) rows[yKey] = [];
        rows[yKey].push(item);
      });
      
      // Process potential table rows
      Object.keys(rows).forEach(yKey => {
        const row = rows[yKey].sort((a, b) => a.x - b.x);
        
        if (row.length >= 3) { // Minimum 3 columns for a table
          const tableRow = {
            page: pageNum,
            y: parseFloat(yKey),
            cells: row.map(item => ({
              text: item.text,
              x: item.x,
              type: classifyCell(item.text)
            }))
          };
          
          // Check if this looks like a holding row
          if (hasISIN(row) || hasSignificantAmount(row)) {
            const holding = extractHoldingFromRow(row, pageNum);
            if (holding) {
              extractedData.financial_data.holdings.push(holding);
            }
          }
          
          extractedData.table_structures.push(tableRow);
        }
      });
    }

    function hasISIN(row) {
      return row.some(item => /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(item.text));
    }

    function hasSignificantAmount(row) {
      return row.some(item => {
        const cleaned = item.text.replace(/[',]/g, '');
        const parsed = parseFloat(cleaned);
        return !isNaN(parsed) && parsed > 1000;
      });
    }

    function extractHoldingFromRow(row, pageNum) {
      const holding = {
        isin: null,
        description: '',
        quantity: null,
        market_value: null,
        percentage: null,
        currency: 'Unknown',
        page: pageNum,
        category: 'other'
      };
      
      row.forEach(item => {
        const text = item.text;
        
        // ISIN
        if (/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(text)) {
          holding.isin = text;
          holding.category = categorizeByISIN(text);
        }
        
        // Description
        if (text.length > 10 && !/^[\\d'.,%-]+$/.test(text) && !/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(text)) {
          if (!holding.description || text.length > holding.description.length) {
            holding.description = text;
          }
        }
        
        // Percentage
        if (text.endsWith('%')) {
          const percent = parseFloat(text.replace('%', ''));
          if (!isNaN(percent)) {
            holding.percentage = percent;
          }
        }
        
        // Numbers
        const cleaned = text.replace(/[',]/g, '');
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed) && parsed > 0) {
          if (parsed > 1000) {
            if (!holding.market_value || parsed > holding.market_value) {
              holding.market_value = parsed;
            }
          } else if (parsed === Math.floor(parsed)) {
            holding.quantity = parsed;
          }
        }
      });
      
      return (holding.isin || holding.market_value > 1000) ? holding : null;
    }

    function categorizeByISIN(isin) {
      const prefix = isin.substring(0, 2);
      if (prefix === 'XS') return 'bonds';
      if (prefix === 'CH') return 'equities';
      if (prefix === 'LU') return 'funds';
      if (prefix === 'US') return 'equities';
      if (prefix === 'DE') return 'bonds';
      return 'other';
    }

    function validateISIN(isin) {
      return isin.length === 12 && /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin);
    }

    function classifyCell(text) {
      if (/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(text)) return 'isin';
      if (text.endsWith('%')) return 'percentage';
      if (/^-?[\\d'.,]+$/.test(text)) return 'number';
      if (text.length > 15) return 'description';
      return 'text';
    }

    function getMagnitude(num) {
      const abs = Math.abs(num);
      if (abs > 1000000) return 'large';
      if (abs > 10000) return 'medium';
      if (abs > 100) return 'small';
      return 'tiny';
    }

    function analyzeExtractedData() {
      // Calculate summary statistics
      extractedData.summary.total_holdings = extractedData.financial_data.holdings.length;
      extractedData.summary.total_isins = extractedData.financial_data.isin_codes.length;
      extractedData.summary.total_numbers = extractedData.financial_data.all_numbers.length;
      
      // Estimate portfolio value
      const largeNumbers = extractedData.financial_data.all_numbers
        .filter(n => n.magnitude === 'large')
        .map(n => n.parsed);
      
      if (largeNumbers.length > 0) {
        extractedData.summary.estimated_portfolio_value = Math.max(...largeNumbers);
      }
      
      // Set currency
      const currencies = extractedData.financial_data.currencies;
      if (currencies.length > 0) {
        extractedData.client_info.currency = currencies[0].currency;
      }
    }

    // Start extraction
    extractUniversal();
  </script>
</body>
</html>`;
  }

  displayInTerminal() {
    const data = this.extractedData;
    
    console.log('\n📋 EXTRACTION RESULTS');
    console.log('=====================');
    
    // Metadata
    console.log('\n📄 DOCUMENT INFO:');
    console.log(`   Pages: ${data.summary.total_pages}`);
    console.log(`   Fingerprint: ${data.metadata.fingerprint}`);
    
    // Client Information
    if (data.client_info.name || data.client_info.account_number) {
      console.log('\n👤 CLIENT INFO:');
      if (data.client_info.name) console.log(`   Name: ${data.client_info.name}`);
      if (data.client_info.account_number) console.log(`   Account: ${data.client_info.account_number}`);
      if (data.client_info.valuation_date) console.log(`   Date: ${data.client_info.valuation_date}`);
      if (data.client_info.currency) console.log(`   Currency: ${data.client_info.currency}`);
    }
    
    // Summary Statistics
    console.log('\n📊 SUMMARY STATISTICS:');
    console.log(`   Holdings Found: ${data.summary.total_holdings}`);
    console.log(`   ISIN Codes: ${data.summary.total_isins}`);
    console.log(`   Numbers Extracted: ${data.summary.total_numbers}`);
    console.log(`   Est. Portfolio Value: ${this.formatCurrency(data.summary.estimated_portfolio_value)}`);
    
    // ISIN Codes by Category
    if (data.financial_data.isin_codes.length > 0) {
      console.log('\n🏦 ISIN CODES BY CATEGORY:');
      Object.keys(data.categories).forEach(category => {
        const items = data.categories[category];
        if (items.length > 0) {
          console.log(`   ${category.toUpperCase()}: ${items.length} securities`);
          items.slice(0, 5).forEach(item => {
            console.log(`     - ${item.isin} (Page ${item.page})`);
          });
          if (items.length > 5) {
            console.log(`     ... and ${items.length - 5} more`);
          }
        }
      });
    }
    
    // Top Holdings
    if (data.financial_data.holdings.length > 0) {
      console.log('\n🏆 TOP HOLDINGS:');
      const topHoldings = data.financial_data.holdings
        .filter(h => h.market_value > 0)
        .sort((a, b) => (b.market_value || 0) - (a.market_value || 0))
        .slice(0, 10);
      
      topHoldings.forEach((holding, i) => {
        console.log(`   ${i + 1}. ${holding.isin || 'N/A'} - ${this.formatCurrency(holding.market_value)}`);
        if (holding.description) {
          console.log(`      ${holding.description.substring(0, 60)}${holding.description.length > 60 ? '...' : ''}`);
        }
        console.log(`      Page ${holding.page}, Category: ${holding.category}`);
      });
    }
    
    // Large Numbers Found
    const largeNumbers = data.financial_data.all_numbers
      .filter(n => n.magnitude === 'large')
      .sort((a, b) => b.parsed - a.parsed)
      .slice(0, 10);
    
    if (largeNumbers.length > 0) {
      console.log('\n💰 LARGE AMOUNTS FOUND:');
      largeNumbers.forEach((num, i) => {
        console.log(`   ${i + 1}. ${this.formatCurrency(num.parsed)} (Page ${num.page})`);
      });
    }
    
    // Percentages
    if (data.financial_data.percentages.length > 0) {
      console.log('\n📈 PERCENTAGES FOUND:');
      const sortedPercentages = data.financial_data.percentages
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      
      sortedPercentages.forEach((pct, i) => {
        console.log(`   ${i + 1}. ${pct.original} (Page ${pct.page})`);
      });
    }
    
    // Page-by-page text summary
    console.log('\n📄 PAGE-BY-PAGE SUMMARY:');
    data.text_by_page.forEach(page => {
      const wordCount = page.raw_text.split(' ').length;
      const numbersOnPage = page.numbers_found?.length || 0;
      const isinsOnPage = page.isins_found?.length || 0;
      
      console.log(`   Page ${page.page_number}: ${wordCount} words, ${numbersOnPage} numbers, ${isinsOnPage} ISINs`);
    });
    
    console.log('\n✅ EXTRACTION COMPLETE!');
  }

  formatCurrency(amount) {
    if (!amount || isNaN(amount)) return '0';
    
    const currency = this.extractedData.client_info.currency || 'USD';
    const locale = currency === 'CHF' ? 'de-CH' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  async saveResults(outputDir = './extraction-results') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const basename = 'universal-extraction';
    
    // Save JSON
    const jsonPath = path.join(outputDir, `${basename}-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.extractedData, null, 2));
    
    // Save CSV
    const csvPath = path.join(outputDir, `${basename}-holdings-${timestamp}.csv`);
    const csvContent = this.generateCSV();
    fs.writeFileSync(csvPath, csvContent);
    
    console.log(`\n💾 Results saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   CSV: ${csvPath}`);
    
    return { jsonPath, csvPath };
  }

  generateCSV() {
    const headers = 'ISIN,Description,Market_Value,Percentage,Category,Currency,Page\n';
    const rows = this.extractedData.financial_data.holdings.map(h => 
      `"${h.isin || ''}","${(h.description || '').replace(/"/g, '""')}",${h.market_value || ''},${h.percentage || ''},"${h.category}","${h.currency}",${h.page}`
    ).join('\n');
    return headers + rows;
  }
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node terminal-pdf-extractor.js <pdf-path>');
    console.log('Example: node terminal-pdf-extractor.js "C:\\path\\to\\document.pdf"');
    return;
  }
  
  const pdfPath = args[0];
  const extractor = new UniversalPDFExtractor();
  
  console.log('🚀 Starting Universal PDF Extraction...');
  console.log('=====================================');
  
  const result = await extractor.extractPDF(pdfPath);
  
  if (result) {
    await extractor.saveResults();
    console.log('\n🎉 Universal extraction completed successfully!');
  } else {
    console.log('\n❌ Extraction failed');
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('terminal-pdf-extractor.js')) {
  main().catch(console.error);
}

export default UniversalPDFExtractor;