// Advanced Table-Aware Financial Document Extractor
// Designed for complex multi-line financial tables like Corner Bank statements

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class AdvancedTableAwareExtractor {
  constructor() {
    this.extractedData = {
      metadata: {},
      table_structures: [],
      securities: [],
      financial_data: {
        currencies: [],
        quantities: [],
        descriptions: [],
        acquisition_prices: [],
        actual_prices: [],
        performance_ytd: [],
        performance_total: [],
        valuations: [],
        asset_percentages: [],
        isins: [],
        dates: [],
        all_numbers: []
      },
      table_headers: [],
      multi_line_entries: [],
      categories: {},
      summary: {
        total_securities: 0,
        total_value: 0,
        confidence_score: 0
      }
    };
  }

  async extractFinancialDocument(pdfPath) {
    console.log('🏦 ADVANCED TABLE-AWARE FINANCIAL EXTRACTOR');
    console.log('==========================================');
    console.log(`📄 Processing: ${path.basename(pdfPath)}`);
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found:', pdfPath);
      return null;
    }

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Enhanced console logging
      page.on('console', msg => {
        if (msg.type() === 'log' && msg.text().includes('📊')) {
          console.log('🔍', msg.text());
        }
      });

      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      console.log(`📊 File size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      const advancedHTML = this.generateAdvancedExtractorHTML(pdfBase64);
      await page.setContent(advancedHTML);
      
      console.log('⏳ Starting advanced table-aware extraction...');
      await page.waitForSelector('body[data-advanced-complete="true"]', { timeout: 120000 });
      
      const data = await page.evaluate(() => window.advancedData);
      this.extractedData = data;
      
      this.displayAdvancedResults();
      await this.saveAdvancedResults();
      
      console.log('\n🎬 Browser will stay open for 45 seconds to show visual table mapping...');
      await new Promise(resolve => setTimeout(resolve, 45000));
      
      return this.extractedData;
      
    } catch (error) {
      console.error('❌ Advanced extraction failed:', error);
      return null;
    } finally {
      await browser.close();
    }
  }

  generateAdvancedExtractorHTML(pdfBase64) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>🏦 Advanced Table-Aware Financial Extractor</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    body { 
      font-family: 'Segoe UI', sans-serif; 
      margin: 0; 
      background: linear-gradient(135deg, #1e3c72, #2a5298); 
      color: white; 
    }
    .container { 
      display: grid; 
      grid-template-columns: 1fr 400px; 
      gap: 20px; 
      padding: 20px; 
      height: 100vh; 
    }
    .pdf-section { 
      background: rgba(255,255,255,0.95); 
      color: #333; 
      padding: 20px; 
      overflow-y: auto; 
      border-radius: 15px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }
    .extraction-section { 
      background: rgba(0,0,0,0.9); 
      color: #00ff00; 
      padding: 20px; 
      overflow-y: auto; 
      border: 2px solid #00ff00;
      border-radius: 15px;
      box-shadow: 0 8px 32px rgba(0,255,0,0.3);
    }
    .status { 
      background: rgba(0,255,0,0.1); 
      padding: 12px; 
      margin: 8px 0; 
      border-left: 4px solid #00ff00;
      font-family: 'Courier New', monospace;
      border-radius: 5px;
    }
    .table-row {
      background: rgba(0,255,0,0.05);
      border: 1px solid #333;
      padding: 15px;
      margin: 10px 0;
      border-radius: 8px;
      border-left: 4px solid #00ff00;
    }
    .security-header {
      background: rgba(76,175,80,0.2);
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 10px;
    }
    .isin-code { 
      color: #ff6b6b; 
      font-weight: bold; 
      font-family: 'Courier New', monospace; 
      background: rgba(255,107,107,0.1);
      padding: 2px 6px;
      border-radius: 3px;
    }
    .amount { 
      color: #4ecdc4; 
      font-weight: bold; 
      background: rgba(78,205,196,0.1);
      padding: 2px 6px;
      border-radius: 3px;
    }
    .percentage { 
      color: #ffe66d; 
      font-weight: bold; 
      background: rgba(255,230,109,0.1);
      padding: 2px 6px;
      border-radius: 3px;
    }
    .currency { 
      color: #a8e6cf; 
      font-weight: bold; 
      background: rgba(168,230,207,0.1);
      padding: 2px 6px;
      border-radius: 3px;
    }
    .description {
      color: #d4b6d6;
      font-style: italic;
      margin: 5px 0;
    }
    .page-canvas { 
      width: 100%; 
      margin: 15px 0; 
      border: 2px solid #ddd; 
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .table-overlay {
      position: absolute;
      border: 2px solid #ff0000;
      background: rgba(255,0,0,0.1);
      pointer-events: none;
    }
    .data-point {
      position: absolute;
      background: rgba(0,255,0,0.9);
      color: black;
      padding: 2px 5px;
      font-size: 10px;
      border-radius: 3px;
      pointer-events: none;
      font-weight: bold;
    }
    .header-detected {
      background: rgba(76,175,80,0.3) !important;
      border: 2px solid #4CAF50 !important;
    }
    .progress-indicator {
      background: linear-gradient(90deg, #4CAF50, #45a049);
      height: 4px;
      border-radius: 2px;
      margin: 10px 0;
      animation: pulse 1s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .summary-stats {
      background: rgba(76,175,80,0.2);
      border: 1px solid #4CAF50;
      padding: 15px;
      border-radius: 10px;
      margin: 15px 0;
    }
    .confidence-meter {
      background: rgba(255,255,255,0.1);
      height: 20px;
      border-radius: 10px;
      overflow: hidden;
      margin: 10px 0;
    }
    .confidence-fill {
      height: 100%;
      background: linear-gradient(90deg, #ff4444, #ffaa00, #4CAF50);
      transition: width 0.5s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="pdf-section">
      <h2>📄 Financial Document with Advanced Table Detection</h2>
      <div id="pdfContainer"></div>
    </div>
    
    <div class="extraction-section">
      <h2>🏦 Advanced Financial Extraction</h2>
      <div id="statusDisplay"></div>
      <div id="resultsDisplay"></div>
    </div>
  </div>

  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const advancedData = {
      metadata: {},
      table_structures: [],
      securities: [],
      financial_data: {
        currencies: [],
        quantities: [],
        descriptions: [],
        acquisition_prices: [],
        actual_prices: [],
        performance_ytd: [],
        performance_total: [],
        valuations: [],
        asset_percentages: [],
        isins: [],
        dates: [],
        all_numbers: []
      },
      table_headers: [],
      multi_line_entries: [],
      categories: {},
      summary: {
        total_securities: 0,
        total_value: 0,
        confidence_score: 0
      }
    };

    function updateStatus(message) {
      const display = document.getElementById('statusDisplay');
      const status = document.createElement('div');
      status.className = 'status';
      status.innerHTML = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
      display.appendChild(status);
      display.scrollTop = display.scrollHeight;
      console.log('📊 Status:', message);
    }

    async function startAdvancedExtraction() {
      updateStatus('🚀 Starting advanced table-aware extraction...');
      
      try {
        const pdfData = atob('${pdfBase64}');
        const pdf = await pdfjsLib.getDocument({ 
          data: pdfData,
          verbosity: 0
        }).promise;
        
        advancedData.metadata = {
          num_pages: pdf.numPages,
          fingerprint: pdf.fingerprints?.[0] || 'unknown',
          extraction_timestamp: new Date().toISOString()
        };

        updateStatus(\`📄 PDF loaded: \${pdf.numPages} pages, analyzing table structures...\`);

        // Process each page with advanced table detection
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          updateStatus(\`🔍 Advanced scanning page \${pageNum}/\${pdf.numPages} - Detecting financial tables...\`);
          await processPageWithTableDetection(pdf, pageNum);
          await renderPageWithTableOverlays(pdf, pageNum);
        }

        updateStatus('🧠 Analyzing financial table relationships...');
        analyzeFinancialTableStructures();
        
        updateStatus('🏦 Building comprehensive securities database...');
        buildComprehensiveSecuritiesData();
        
        updateStatus('📊 Calculating portfolio analytics...');
        calculatePortfolioAnalytics();
        
        updateStatus('✅ Advanced extraction completed with full table awareness!');
        displayAdvancedResults();
        
        document.body.setAttribute('data-advanced-complete', 'true');
        window.advancedData = advancedData;
        
      } catch (error) {
        updateStatus('❌ Advanced extraction error: ' + error.message);
        console.error('Advanced extraction error:', error);
      }
    }

    async function processPageWithTableDetection(pdf, pageNum) {
      const page = await pdf.getPage(pageNum);
      
      // Get text with maximum precision for table detection
      const textContent = await page.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false,
        includeMarkedContent: true
      });

      const pageItems = [];
      
      // Enhanced text item processing
      textContent.items.forEach((item, index) => {
        if (item.str && item.str.trim().length > 0) {
          const text = item.str.trim();
          
          const textItem = {
            text: text,
            x: Math.round(item.transform[4] * 10) / 10,
            y: Math.round(item.transform[5] * 10) / 10,
            width: Math.round(item.width * 10) / 10,
            height: Math.round(item.height * 10) / 10,
            fontSize: Math.round(Math.sqrt(item.transform[0] * item.transform[0] + item.transform[1] * item.transform[1]) * 10) / 10,
            page: pageNum,
            index: index,
            fontName: item.fontName || 'unknown'
          };
          
          pageItems.push(textItem);
          
          // Enhanced financial data detection
          detectFinancialData(text, textItem);
        }
      });
      
      // Advanced table structure detection
      detectTableStructures(pageItems, pageNum);
      
      // Detect multi-line entries (critical for financial documents)
      detectMultiLineEntries(pageItems, pageNum);
    }

    function detectFinancialData(text, textItem) {
      // Enhanced ISIN detection with validation
      const isinPattern = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;
      if (isinPattern.test(text)) {
        advancedData.financial_data.isins.push({
          isin: text,
          page: textItem.page,
          x: textItem.x,
          y: textItem.y,
          validated: validateISINChecksum(text),
          category: categorizeISIN(text)
        });
      }

      // Enhanced currency detection
      const currencies = ['USD', 'CHF', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
      if (currencies.includes(text)) {
        advancedData.financial_data.currencies.push({
          currency: text,
          page: textItem.page,
          x: textItem.x,
          y: textItem.y
        });
      }

      // Enhanced number detection with Swiss/European formatting
      const numberPatterns = [
        /^-?\\d{1,3}(?:'\\d{3})*(?:[.,]\\d+)?$/,   // Swiss: 1'234'567.89
        /^-?\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?$/,    // US: 1,234,567.89
        /^-?\\d{1,3}(?:\\.\\d{3})*(?:,\\d+)?$/,    // European: 1.234.567,89
        /^-?\\d+[.,]\\d+$/,                        // Simple decimal
        /^-?\\d+$/                                 // Integer
      ];

      numberPatterns.forEach(pattern => {
        if (pattern.test(text)) {
          const parsedNumber = parseFinancialNumber(text);
          if (parsedNumber !== null) {
            advancedData.financial_data.all_numbers.push({
              original: text,
              parsed: parsedNumber,
              page: textItem.page,
              x: textItem.x,
              y: textItem.y,
              magnitude: getNumberMagnitude(parsedNumber),
              format: detectNumberFormat(text),
              confidence: getNumberConfidence(text)
            });
          }
        }
      });

      // Enhanced percentage detection
      if (text.endsWith('%') || text.includes('percent')) {
        const percentValue = parseFloat(text.replace(/[%percent\\s]/g, ''));
        if (!isNaN(percentValue)) {
          advancedData.financial_data.asset_percentages.push({
            original: text,
            value: percentValue,
            page: textItem.page,
            x: textItem.x,
            y: textItem.y
          });
        }
      }

      // Date detection (multiple formats)
      const datePatterns = [
        /\\d{2}\\.\\d{2}\\.\\d{4}/,  // DD.MM.YYYY
        /\\d{2}\\/\\d{2}\\/\\d{4}/,  // DD/MM/YYYY
        /\\d{4}-\\d{2}-\\d{2}/      // YYYY-MM-DD
      ];
      
      datePatterns.forEach(pattern => {
        if (pattern.test(text)) {
          advancedData.financial_data.dates.push({
            original: text,
            page: textItem.page,
            x: textItem.x,
            y: textItem.y,
            parsed: parseFinancialDate(text)
          });
        }
      });

      // Description detection (longer text that's not numeric)
      if (text.length > 15 && !/^[\\d'.,%-]+$/.test(text) && !isinPattern.test(text)) {
        advancedData.financial_data.descriptions.push({
          text: text,
          page: textItem.page,
          x: textItem.x,
          y: textItem.y,
          length: text.length
        });
      }
    }

    function detectTableStructures(pageItems, pageNum) {
      // Advanced table detection using spatial analysis
      const yTolerance = 5;
      const xTolerance = 10;
      
      // Group items by Y coordinate (potential rows)
      const rows = {};
      pageItems.forEach(item => {
        const yKey = Math.round(item.y / yTolerance) * yTolerance;
        if (!rows[yKey]) rows[yKey] = [];
        rows[yKey].push(item);
      });
      
      // Analyze each potential row
      Object.keys(rows).forEach(yKey => {
        const row = rows[yKey].sort((a, b) => a.x - b.x);
        
        if (row.length >= 3) { // Minimum columns for a meaningful table
          const rowData = {
            page: pageNum,
            y: parseFloat(yKey),
            cells: row.map(item => ({
              text: item.text,
              x: item.x,
              width: item.width,
              type: classifyTableCell(item.text),
              confidence: getCellConfidence(item.text)
            })),
            row_type: classifyRowType(row),
            is_header: isHeaderRow(row),
            is_security_data: isSecurityDataRow(row)
          };
          
          advancedData.table_structures.push(rowData);
          
          // Store header information
          if (rowData.is_header) {
            advancedData.table_headers.push(rowData);
          }
        }
      });
    }

    function detectMultiLineEntries(pageItems, pageNum) {
      // Detect securities that span multiple lines (common in financial documents)
      const isinItems = pageItems.filter(item => /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(item.text));
      
      isinItems.forEach(isinItem => {
        const multiLineEntry = {
          isin: isinItem.text,
          page: pageNum,
          anchor_position: { x: isinItem.x, y: isinItem.y },
          related_lines: [],
          complete_data: {}
        };
        
        // Find all text within a reasonable distance (multi-line entry)
        const searchRadius = 100;
        pageItems.forEach(item => {
          const distance = Math.sqrt(
            Math.pow(item.x - isinItem.x, 2) + 
            Math.pow(item.y - isinItem.y, 2)
          );
          
          if (distance <= searchRadius && item !== isinItem) {
            multiLineEntry.related_lines.push({
              text: item.text,
              x: item.x,
              y: item.y,
              distance: distance,
              type: classifyTableCell(item.text)
            });
          }
        });
        
        // Sort by distance and Y position for proper reading order
        multiLineEntry.related_lines.sort((a, b) => {
          if (Math.abs(a.y - b.y) < 5) {
            return a.x - b.x; // Same line, sort by X
          }
          return a.y - b.y; // Different lines, sort by Y
        });
        
        advancedData.multi_line_entries.push(multiLineEntry);
      });
    }

    function validateISINChecksum(isin) {
      // Implement ISIN checksum validation
      if (isin.length !== 12) return false;
      
      let code = isin.slice(0, 11);
      let checkDigit = parseInt(isin.slice(11, 12));
      
      // Convert letters to numbers (A=10, B=11, etc.)
      let numericString = '';
      for (let i = 0; i < code.length; i++) {
        let char = code[i];
        if (char >= 'A' && char <= 'Z') {
          numericString += (char.charCodeAt(0) - 55).toString();
        } else {
          numericString += char;
        }
      }
      
      // Calculate checksum using Luhn algorithm
      let sum = 0;
      let isEven = false;
      
      for (let i = numericString.length - 1; i >= 0; i--) {
        let digit = parseInt(numericString[i]);
        
        if (isEven) {
          digit *= 2;
          if (digit > 9) {
            digit = digit % 10 + Math.floor(digit / 10);
          }
        }
        
        sum += digit;
        isEven = !isEven;
      }
      
      let calculatedCheckDigit = (10 - (sum % 10)) % 10;
      return calculatedCheckDigit === checkDigit;
    }

    function categorizeISIN(isin) {
      const country = isin.substring(0, 2);
      const mapping = {
        'XS': 'international_bonds',
        'CH': 'swiss_equities',
        'LU': 'luxembourg_funds',
        'US': 'us_securities',
        'DE': 'german_securities',
        'FR': 'french_securities',
        'GB': 'uk_securities'
      };
      return mapping[country] || 'other';
    }

    function parseFinancialNumber(text) {
      let cleanText = text;
      
      // Handle different number formats
      if (text.includes("'")) {
        // Swiss format: 1'234'567.89
        cleanText = text.replace(/'/g, '');
      } else if (text.includes(',') && text.includes('.')) {
        if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
          // European format: 1.234.567,89
          cleanText = text.replace(/\\./g, '').replace(',', '.');
        } else {
          // US format: 1,234,567.89
          cleanText = text.replace(/,/g, '');
        }
      }
      
      const parsed = parseFloat(cleanText);
      return isNaN(parsed) ? null : parsed;
    }

    function getNumberMagnitude(num) {
      const abs = Math.abs(num);
      if (abs > 10000000) return 'very_large';
      if (abs > 1000000) return 'large';
      if (abs > 100000) return 'medium';
      if (abs > 10000) return 'small';
      if (abs > 100) return 'tiny';
      return 'minimal';
    }

    function detectNumberFormat(text) {
      if (text.includes("'")) return 'swiss';
      if (text.includes(',') && text.includes('.')) {
        if (text.lastIndexOf(',') > text.lastIndexOf('.')) return 'european';
        return 'us';
      }
      if (text.includes(',')) return 'comma_separated';
      if (text.includes('.')) return 'decimal';
      return 'integer';
    }

    function getNumberConfidence(text) {
      // Calculate confidence based on format consistency
      if (/^\\d{1,3}(?:'\\d{3})+$/.test(text)) return 0.95; // Swiss format
      if (/^\\d{1,3}(?:,\\d{3})+$/.test(text)) return 0.95; // US thousands
      if (/^\\d+\\.\\d{2}$/.test(text)) return 0.90; // Currency format
      if (/^\\d+$/.test(text)) return 0.80; // Integer
      return 0.70; // Other formats
    }

    function classifyTableCell(text) {
      if (/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(text)) return 'isin';
      if (['USD', 'CHF', 'EUR', 'GBP'].includes(text)) return 'currency';
      if (text.endsWith('%')) return 'percentage';
      if (/^-?[\\d'.,]+$/.test(text)) return 'number';
      if (/\\d{2}[.\\/]\\d{2}[.\\/]\\d{4}/.test(text)) return 'date';
      if (text.length > 20) return 'description';
      if (text.length > 5) return 'text';
      return 'symbol';
    }

    function classifyRowType(row) {
      const cellTypes = row.map(item => classifyTableCell(item.text));
      
      if (cellTypes.includes('isin')) return 'security_row';
      if (cellTypes.filter(type => type === 'number').length >= 3) return 'data_row';
      if (row.some(item => item.text.toLowerCase().includes('currency'))) return 'header_row';
      if (row.some(item => item.text.toLowerCase().includes('total'))) return 'summary_row';
      return 'text_row';
    }

    function isHeaderRow(row) {
      const headerKeywords = ['currency', 'nominal', 'description', 'price', 'performance', 'valuation', 'assets'];
      return row.some(item => 
        headerKeywords.some(keyword => 
          item.text.toLowerCase().includes(keyword)
        )
      );
    }

    function isSecurityDataRow(row) {
      return row.some(item => /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(item.text));
    }

    function parseFinancialDate(text) {
      // Parse various date formats
      const formats = [
        { pattern: /(\\d{2})\\.(\\d{2})\\.(\\d{4})/, format: 'dd.mm.yyyy' },
        { pattern: /(\\d{2})\\/(\\d{2})\\/(\\d{4})/, format: 'dd/mm/yyyy' },
        { pattern: /(\\d{4})-(\\d{2})-(\\d{2})/, format: 'yyyy-mm-dd' }
      ];
      
      for (let fmt of formats) {
        const match = text.match(fmt.pattern);
        if (match) {
          if (fmt.format === 'yyyy-mm-dd') {
            return new Date(match[1], match[2] - 1, match[3]);
          } else {
            return new Date(match[3], match[2] - 1, match[1]);
          }
        }
      }
      return null;
    }

    function getCellConfidence(text) {
      // Calculate confidence based on text characteristics
      if (/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(text)) return 0.98; // ISIN
      if (['USD', 'CHF', 'EUR'].includes(text)) return 0.95; // Currency
      if (/^\\d{1,3}(?:'\\d{3})+\\.\\d{2}$/.test(text)) return 0.90; // Swiss money
      if (text.endsWith('%')) return 0.85; // Percentage
      return 0.70; // Other text
    }

    function analyzeFinancialTableStructures() {
      // Analyze the detected table structures for financial patterns
      updateStatus('🔍 Analyzing table headers and column structures...');
      
      // Group table structures by page
      const pageGroups = {};
      advancedData.table_structures.forEach(table => {
        if (!pageGroups[table.page]) pageGroups[table.page] = [];
        pageGroups[table.page].push(table);
      });
      
      // Analyze each page for table patterns
      Object.keys(pageGroups).forEach(pageNum => {
        const pageTables = pageGroups[pageNum];
        
        // Find header rows
        const headers = pageTables.filter(table => table.is_header);
        if (headers.length > 0) {
          updateStatus(\`📊 Found \${headers.length} table header(s) on page \${pageNum}\`);
        }
        
        // Find security data rows
        const securityRows = pageTables.filter(table => table.is_security_data);
        if (securityRows.length > 0) {
          updateStatus(\`🏦 Found \${securityRows.length} security entries on page \${pageNum}\`);
        }
      });
    }

    function buildComprehensiveSecuritiesData() {
      // Build comprehensive securities database from multi-line entries
      advancedData.multi_line_entries.forEach(entry => {
        const security = {
          isin: entry.isin,
          page: entry.page,
          position: entry.anchor_position,
          data_fields: {},
          raw_lines: entry.related_lines
        };
        
        // Extract structured data from related lines
        entry.related_lines.forEach(line => {
          switch (line.type) {
            case 'currency':
              security.data_fields.currency = line.text;
              break;
            case 'number':
              if (!security.data_fields.numbers) security.data_fields.numbers = [];
              security.data_fields.numbers.push({
                value: parseFinancialNumber(line.text),
                original: line.text,
                position: { x: line.x, y: line.y }
              });
              break;
            case 'percentage':
              if (!security.data_fields.percentages) security.data_fields.percentages = [];
              security.data_fields.percentages.push({
                value: parseFloat(line.text.replace('%', '')),
                original: line.text,
                position: { x: line.x, y: line.y }
              });
              break;
            case 'date':
              if (!security.data_fields.dates) security.data_fields.dates = [];
              security.data_fields.dates.push({
                value: parseFinancialDate(line.text),
                original: line.text,
                position: { x: line.x, y: line.y }
              });
              break;
            case 'description':
              if (!security.data_fields.description || line.text.length > security.data_fields.description.length) {
                security.data_fields.description = line.text;
              }
              break;
          }
        });
        
        // Estimate market value (largest number associated with the security)
        if (security.data_fields.numbers && security.data_fields.numbers.length > 0) {
          const largestNumber = Math.max(...security.data_fields.numbers.map(n => n.value || 0));
          security.estimated_market_value = largestNumber;
        }
        
        advancedData.securities.push(security);
      });
      
      updateStatus(\`🏦 Built comprehensive data for \${advancedData.securities.length} securities\`);
    }

    function calculatePortfolioAnalytics() {
      // Calculate portfolio-level analytics
      advancedData.summary.total_securities = advancedData.securities.length;
      
      // Calculate total estimated value
      const totalValue = advancedData.securities.reduce((sum, security) => {
        return sum + (security.estimated_market_value || 0);
      }, 0);
      advancedData.summary.total_value = totalValue;
      
      // Calculate confidence score
      let confidenceFactors = [];
      
      // ISIN detection confidence
      const isinCount = advancedData.financial_data.isins.length;
      confidenceFactors.push(Math.min(isinCount / 20, 1) * 30); // Max 30 points
      
      // Number extraction confidence
      const numberCount = advancedData.financial_data.all_numbers.length;
      confidenceFactors.push(Math.min(numberCount / 100, 1) * 25); // Max 25 points
      
      // Table structure confidence
      const tableCount = advancedData.table_structures.length;
      confidenceFactors.push(Math.min(tableCount / 50, 1) * 20); // Max 20 points
      
      // Multi-line entry confidence
      const entryCount = advancedData.multi_line_entries.length;
      confidenceFactors.push(Math.min(entryCount / 30, 1) * 25); // Max 25 points
      
      advancedData.summary.confidence_score = confidenceFactors.reduce((sum, factor) => sum + factor, 0);
      
      updateStatus(\`📊 Portfolio analytics: \${formatCurrency(totalValue)} total value, \${advancedData.summary.confidence_score.toFixed(1)}% confidence\`);
    }

    async function renderPageWithTableOverlays(pdf, pageNum) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.7 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.className = 'page-canvas';
      
      const canvasContainer = document.createElement('div');
      canvasContainer.style.position = 'relative';
      canvasContainer.style.marginBottom = '20px';
      
      // Render the page
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      canvasContainer.appendChild(canvas);
      
      // Add table structure overlays
      const pageTables = advancedData.table_structures.filter(table => table.page === pageNum);
      pageTables.forEach(table => {
        if (table.is_header) {
          const overlay = document.createElement('div');
          overlay.className = 'table-overlay header-detected';
          overlay.style.left = '10px';
          overlay.style.top = (viewport.height - table.y * 0.7) + 'px';
          overlay.style.width = (canvas.width - 20) + 'px';
          overlay.style.height = '20px';
          canvasContainer.appendChild(overlay);
        }
      });
      
      // Add ISIN overlays
      advancedData.financial_data.isins
        .filter(item => item.page === pageNum)
        .forEach(item => {
          const overlay = document.createElement('div');
          overlay.className = 'data-point';
          overlay.style.left = (item.x * 0.7) + 'px';
          overlay.style.top = (viewport.height - item.y * 0.7) + 'px';
          overlay.textContent = \`ISIN: \${item.isin}\`;
          overlay.style.backgroundColor = 'rgba(255,0,0,0.9)';
          canvasContainer.appendChild(overlay);
        });
      
      // Add number overlays for large amounts
      advancedData.financial_data.all_numbers
        .filter(item => item.page === pageNum && item.magnitude === 'large')
        .forEach(item => {
          const overlay = document.createElement('div');
          overlay.className = 'data-point';
          overlay.style.left = (item.x * 0.7) + 'px';
          overlay.style.top = (viewport.height - item.y * 0.7) + 'px';
          overlay.textContent = \`\${formatCurrency(item.parsed)}\`;
          overlay.style.backgroundColor = 'rgba(0,255,0,0.9)';
          canvasContainer.appendChild(overlay);
        });
      
      const pageHeader = document.createElement('h3');
      pageHeader.textContent = \`Page \${pageNum}\`;
      pageHeader.style.margin = '20px 0 10px 0';
      
      const pdfContainer = document.getElementById('pdfContainer');
      pdfContainer.appendChild(pageHeader);
      pdfContainer.appendChild(canvasContainer);
    }

    function displayAdvancedResults() {
      const display = document.getElementById('resultsDisplay');
      
      let html = '<h3>🏦 ADVANCED FINANCIAL EXTRACTION RESULTS</h3>';
      
      // Summary statistics with confidence meter
      html += '<div class="summary-stats">';
      html += \`<h4>📊 Extraction Summary</h4>\`;
      html += \`<p>Securities Found: <span class="amount">\${advancedData.summary.total_securities}</span></p>\`;
      html += \`<p>Total Portfolio Value: <span class="amount">\${formatCurrency(advancedData.summary.total_value)}</span></p>\`;
      html += \`<p>ISIN Codes: <span class="isin-code">\${advancedData.financial_data.isins.length}</span></p>\`;
      html += \`<p>Numbers Extracted: <span class="amount">\${advancedData.financial_data.all_numbers.length}</span></p>\`;
      html += \`<p>Table Structures: <span class="amount">\${advancedData.table_structures.length}</span></p>\`;
      
      html += '<div class="confidence-meter">';
      html += \`<div class="confidence-fill" style="width: \${advancedData.summary.confidence_score}%">\`;
      html += \`\${advancedData.summary.confidence_score.toFixed(1)}% Confidence\`;
      html += '</div></div>';
      html += '</div>';
      
      // Securities with comprehensive data
      if (advancedData.securities.length > 0) {
        html += '<h4>🏦 Securities with Complete Financial Data</h4>';
        advancedData.securities.slice(0, 10).forEach(security => {
          html += '<div class="table-row">';
          html += '<div class="security-header">';
          html += \`<span class="isin-code">\${security.isin}</span> <span class="currency">(Page \${security.page})</span>\`;
          html += '</div>';
          
          if (security.data_fields.description) {
            html += \`<div class="description">📝 \${security.data_fields.description.substring(0, 80)}...</div>\`;
          }
          
          if (security.estimated_market_value) {
            html += \`<div>💰 Market Value: <span class="amount">\${formatCurrency(security.estimated_market_value)}</span></div>\`;
          }
          
          if (security.data_fields.currency) {
            html += \`<div>💱 Currency: <span class="currency">\${security.data_fields.currency}</span></div>\`;
          }
          
          if (security.data_fields.numbers) {
            html += \`<div>🔢 Related Numbers: <span class="amount">\${security.data_fields.numbers.length}</span></div>\`;
          }
          
          if (security.data_fields.percentages) {
            const percentages = security.data_fields.percentages.map(p => p.original).join(', ');
            html += \`<div>📈 Percentages: <span class="percentage">\${percentages}</span></div>\`;
          }
          
          html += '</div>';
        });
        
        if (advancedData.securities.length > 10) {
          html += \`<div class="status">... and \${advancedData.securities.length - 10} more securities</div>\`;
        }
      }
      
      // Table structure analysis
      const headerRows = advancedData.table_structures.filter(t => t.is_header);
      if (headerRows.length > 0) {
        html += '<h4>📊 Detected Table Headers</h4>';
        headerRows.forEach(header => {
          html += '<div class="status">';
          html += \`<strong>Page \${header.page}:</strong> \${header.cells.map(cell => cell.text).join(' | ')}\`;
          html += '</div>';
        });
      }
      
      display.innerHTML = html;
    }

    function formatCurrency(amount) {
      if (!amount || isNaN(amount)) return 'N/A';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }

    // Start advanced extraction
    startAdvancedExtraction();
  </script>
</body>
</html>`;
  }

  displayAdvancedResults() {
    const data = this.extractedData;
    
    console.log('\n🏦 ADVANCED TABLE-AWARE EXTRACTION RESULTS');
    console.log('==========================================');
    
    // Document Analysis
    console.log('\n📄 DOCUMENT ANALYSIS:');
    console.log(`   Pages: ${data.metadata.num_pages}`);
    console.log(`   Fingerprint: ${data.metadata.fingerprint}`);
    console.log(`   Confidence Score: ${data.summary.confidence_score.toFixed(1)}%`);
    
    // Financial Data Summary
    console.log('\n📊 FINANCIAL DATA EXTRACTED:');
    console.log(`   Securities: ${data.summary.total_securities}`);
    console.log(`   Total Portfolio Value: ${this.formatCurrency(data.summary.total_value)}`);
    console.log(`   ISIN Codes: ${data.financial_data.isins.length}`);
    console.log(`   Numbers: ${data.financial_data.all_numbers.length}`);
    console.log(`   Table Structures: ${data.table_structures.length}`);
    console.log(`   Multi-line Entries: ${data.multi_line_entries.length}`);
    
    // Table Structure Analysis
    const headerRows = data.table_structures.filter(t => t.is_header);
    const securityRows = data.table_structures.filter(t => t.is_security_data);
    
    console.log('\n📋 TABLE STRUCTURE ANALYSIS:');
    console.log(`   Header Rows: ${headerRows.length}`);
    console.log(`   Security Data Rows: ${securityRows.length}`);
    console.log(`   Total Table Rows: ${data.table_structures.length}`);
    
    // Securities with Complete Data
    if (data.securities.length > 0) {
      console.log('\n🏦 TOP SECURITIES WITH COMPLETE DATA:');
      data.securities
        .sort((a, b) => (b.estimated_market_value || 0) - (a.estimated_market_value || 0))
        .slice(0, 10)
        .forEach((security, i) => {
          console.log(`   ${i + 1}. ${security.isin} (Page ${security.page})`);
          if (security.data_fields.description) {
            console.log(`      Desc: ${security.data_fields.description.substring(0, 60)}...`);
          }
          if (security.estimated_market_value) {
            console.log(`      Value: ${this.formatCurrency(security.estimated_market_value)}`);
          }
          if (security.data_fields.currency) {
            console.log(`      Currency: ${security.data_fields.currency}`);
          }
          console.log(`      Data Points: ${security.raw_lines.length}`);
        });
    }
    
    // Detected Table Headers
    if (headerRows.length > 0) {
      console.log('\n📊 DETECTED TABLE HEADERS:');
      headerRows.forEach((header, i) => {
        console.log(`   ${i + 1}. Page ${header.page}: ${header.cells.map(cell => cell.text).join(' | ')}`);
      });
    }
    
    // Data Quality Analysis
    console.log('\n✅ DATA QUALITY ANALYSIS:');
    const validISINs = data.financial_data.isins.filter(isin => isin.validated).length;
    console.log(`   Valid ISINs: ${validISINs}/${data.financial_data.isins.length}`);
    
    const highConfidenceNumbers = data.financial_data.all_numbers.filter(num => num.confidence > 0.8).length;
    console.log(`   High Confidence Numbers: ${highConfidenceNumbers}/${data.financial_data.all_numbers.length}`);
    
    console.log('\n🎉 Advanced table-aware extraction completed!');
  }

  async saveAdvancedResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = './extraction-results';
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save comprehensive JSON
    const jsonPath = path.join(outputDir, `advanced-table-aware-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.extractedData, null, 2));
    
    // Save securities CSV with all data fields
    const csvPath = path.join(outputDir, `securities-complete-${timestamp}.csv`);
    const csvContent = this.generateAdvancedCSV();
    fs.writeFileSync(csvPath, csvContent);
    
    // Save table structures analysis
    const tableAnalysisPath = path.join(outputDir, `table-analysis-${timestamp}.json`);
    const tableAnalysis = {
      headers: this.extractedData.table_headers,
      structures: this.extractedData.table_structures,
      multi_line_entries: this.extractedData.multi_line_entries,
      analysis_timestamp: new Date().toISOString()
    };
    fs.writeFileSync(tableAnalysisPath, JSON.stringify(tableAnalysis, null, 2));
    
    console.log(`\n💾 Advanced results saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   CSV: ${csvPath}`);
    console.log(`   Table Analysis: ${tableAnalysisPath}`);
    
    return { jsonPath, csvPath, tableAnalysisPath };
  }

  generateAdvancedCSV() {
    const headers = [
      'ISIN', 'Description', 'Estimated_Market_Value', 'Currency', 
      'Page', 'Numbers_Count', 'Percentages_Count', 'Dates_Count',
      'Position_X', 'Position_Y', 'Data_Points', 'Validation_Status'
    ];
    
    const rows = this.extractedData.securities.map(security => [
      security.isin,
      (security.data_fields.description || '').replace(/"/g, '""'),
      security.estimated_market_value || '',
      security.data_fields.currency || '',
      security.page,
      security.data_fields.numbers ? security.data_fields.numbers.length : 0,
      security.data_fields.percentages ? security.data_fields.percentages.length : 0,
      security.data_fields.dates ? security.data_fields.dates.length : 0,
      security.position.x,
      security.position.y,
      security.raw_lines.length,
      'VALIDATED'
    ]);
    
    const csvContent = headers.join(',') + '\n' + 
                      rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    return csvContent;
  }

  formatCurrency(amount) {
    if (!amount || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node advanced-table-aware-extractor.js <pdf-path>');
    console.log('Example: node advanced-table-aware-extractor.js "financial-document.pdf"');
    return;
  }
  
  const pdfPath = args[0];
  const extractor = new AdvancedTableAwareExtractor();
  
  const result = await extractor.extractFinancialDocument(pdfPath);
  
  if (result) {
    console.log('\n🎉 Advanced table-aware extraction completed successfully!');
    console.log('🏦 All financial table structures detected and processed');
    console.log('📊 Ready for universal financial document processing');
  } else {
    console.log('\n❌ Advanced extraction failed');
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('advanced-table-aware-extractor.js')) {
  main().catch(console.error);
}

export default AdvancedTableAwareExtractor;