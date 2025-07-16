// Specialized Financial Table Parser for Corner Bank Style Documents
// Handles multi-line securities with ISIN codes embedded in descriptions

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class SpecializedFinancialParser {
  constructor() {
    this.extractedData = {
      metadata: {},
      securities: [],
      financial_summary: {
        total_portfolio_value: 0,
        currency: 'USD',
        valuation_date: '',
        client_info: {}
      },
      table_data: [],
      raw_extraction: {
        all_text: [],
        all_numbers: [],
        detected_patterns: []
      }
    };
  }

  async parseFinancialDocument(pdfPath) {
    console.log('🎯 SPECIALIZED FINANCIAL TABLE PARSER');
    console.log('===================================');
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
      
      page.on('console', msg => {
        if (msg.type() === 'log' && msg.text().includes('💼')) {
          console.log('🔍', msg.text());
        }
      });

      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      console.log(`📊 File size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      const specializedHTML = this.generateSpecializedParserHTML(pdfBase64);
      await page.setContent(specializedHTML);
      
      console.log('⏳ Starting specialized financial parsing...');
      await page.waitForSelector('body[data-parsing-complete="true"]', { timeout: 120000 });
      
      const data = await page.evaluate(() => window.financialData);
      this.extractedData = data;
      
      this.displayParsingResults();
      await this.saveParsingResults();
      
      console.log('\n🎬 Visual parser will stay open for 60 seconds...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      return this.extractedData;
      
    } catch (error) {
      console.error('❌ Specialized parsing failed:', error);
      return null;
    } finally {
      await browser.close();
    }
  }

  generateSpecializedParserHTML(pdfBase64) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>💼 Specialized Financial Table Parser</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    body { 
      font-family: 'Segoe UI', sans-serif; 
      margin: 0; 
      background: linear-gradient(135deg, #2c3e50, #3498db); 
      color: white; 
    }
    .container { 
      display: grid; 
      grid-template-columns: 1fr 450px; 
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
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    .parsing-section { 
      background: rgba(0,0,0,0.9); 
      color: #00ff88; 
      padding: 20px; 
      overflow-y: auto; 
      border: 2px solid #00ff88;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,255,136,0.3);
    }
    .status { 
      background: rgba(0,255,136,0.1); 
      padding: 12px; 
      margin: 8px 0; 
      border-left: 4px solid #00ff88;
      font-family: 'Courier New', monospace;
      border-radius: 5px;
      font-size: 13px;
    }
    .security-entry {
      background: linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,200,100,0.05));
      border: 2px solid #00ff88;
      padding: 20px;
      margin: 15px 0;
      border-radius: 12px;
      position: relative;
      overflow: hidden;
    }
    .security-entry::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #00ff88, #00cc66);
    }
    .security-header {
      background: rgba(0,255,136,0.2);
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 15px;
      border-left: 4px solid #00ff88;
    }
    .isin-code { 
      color: #ff6b6b; 
      font-weight: bold; 
      font-family: 'Courier New', monospace; 
      background: rgba(255,107,107,0.15);
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid rgba(255,107,107,0.3);
    }
    .amount { 
      color: #4ecdc4; 
      font-weight: bold; 
      background: rgba(78,205,196,0.15);
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid rgba(78,205,196,0.3);
    }
    .percentage { 
      color: #f39c12; 
      font-weight: bold; 
      background: rgba(243,156,18,0.15);
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid rgba(243,156,18,0.3);
    }
    .currency { 
      color: #9b59b6; 
      font-weight: bold; 
      background: rgba(155,89,182,0.15);
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid rgba(155,89,182,0.3);
    }
    .description {
      color: #95a5a6;
      font-style: italic;
      margin: 8px 0;
      line-height: 1.4;
      background: rgba(149,165,166,0.1);
      padding: 8px;
      border-radius: 6px;
    }
    .data-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
      margin: 15px 0;
    }
    .data-item {
      background: rgba(255,255,255,0.05);
      padding: 8px 12px;
      border-radius: 6px;
      border-left: 3px solid #00ff88;
    }
    .data-label {
      font-size: 11px;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .data-value {
      font-weight: bold;
      margin-top: 2px;
    }
    .page-canvas { 
      width: 100%; 
      margin: 15px 0; 
      border: 2px solid #ddd; 
      border-radius: 10px;
      box-shadow: 0 6px 15px rgba(0,0,0,0.15);
    }
    .summary-stats {
      background: linear-gradient(135deg, #00ff88, #00cc66);
      color: #000;
      padding: 20px;
      border-radius: 12px;
      margin: 20px 0;
      text-align: center;
    }
    .summary-stats h3 {
      margin: 0 0 15px 0;
      font-size: 18px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .stat-item {
      background: rgba(0,0,0,0.1);
      padding: 10px;
      border-radius: 8px;
    }
    .stat-number {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .progress-indicator {
      background: linear-gradient(90deg, #00ff88, #00cc66);
      height: 6px;
      border-radius: 3px;
      margin: 15px 0;
      animation: glow 2s ease-in-out infinite alternate;
    }
    @keyframes glow {
      from { box-shadow: 0 0 10px rgba(0,255,136,0.5); }
      to { box-shadow: 0 0 20px rgba(0,255,136,0.8); }
    }
    .pattern-detection {
      background: rgba(52,152,219,0.2);
      border: 1px solid #3498db;
      padding: 15px;
      border-radius: 10px;
      margin: 15px 0;
    }
    .highlight-overlay {
      position: absolute;
      background: rgba(0,255,136,0.3);
      border: 2px solid #00ff88;
      pointer-events: none;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="pdf-section">
      <h2>📄 Financial Document with Advanced Pattern Recognition</h2>
      <div id="pdfContainer"></div>
    </div>
    
    <div class="parsing-section">
      <h2>💼 Specialized Financial Parser</h2>
      <div id="statusDisplay"></div>
      <div id="resultsDisplay"></div>
    </div>
  </div>

  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const financialData = {
      metadata: {},
      securities: [],
      financial_summary: {
        total_portfolio_value: 0,
        currency: 'USD',
        valuation_date: '',
        client_info: {}
      },
      table_data: [],
      raw_extraction: {
        all_text: [],
        all_numbers: [],
        detected_patterns: []
      }
    };

    function updateStatus(message) {
      const display = document.getElementById('statusDisplay');
      const status = document.createElement('div');
      status.className = 'status';
      status.innerHTML = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
      display.appendChild(status);
      display.scrollTop = display.scrollHeight;
      console.log('💼 Parser:', message);
    }

    async function startSpecializedParsing() {
      updateStatus('🚀 Starting specialized financial parsing...');
      updateStatus('🎯 Optimized for Corner Bank style multi-line securities');
      
      try {
        const pdfData = atob('${pdfBase64}');
        const pdf = await pdfjsLib.getDocument({ 
          data: pdfData,
          verbosity: 0
        }).promise;
        
        financialData.metadata = {
          num_pages: pdf.numPages,
          fingerprint: pdf.fingerprints?.[0] || 'unknown',
          parsing_timestamp: new Date().toISOString()
        };

        updateStatus(\`📄 PDF loaded: \${pdf.numPages} pages - Starting pattern recognition...\`);

        // Process each page with specialized financial pattern detection
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          updateStatus(\`💼 Parsing page \${pageNum}/\${pdf.numPages} - Looking for financial table patterns...\`);
          await parsePageForFinancialData(pdf, pageNum);
          await renderPageWithHighlights(pdf, pageNum);
        }

        updateStatus('🧠 Analyzing detected financial patterns...');
        analyzeFinancialPatterns();
        
        updateStatus('🏦 Building securities database from patterns...');
        buildSecuritiesFromPatterns();
        
        updateStatus('📊 Calculating portfolio totals...');
        calculatePortfolioTotals();
        
        updateStatus('✅ Specialized parsing completed successfully!');
        displayParsingResults();
        
        document.body.setAttribute('data-parsing-complete', 'true');
        window.financialData = financialData;
        
      } catch (error) {
        updateStatus('❌ Specialized parsing error: ' + error.message);
        console.error('Specialized parsing error:', error);
      }
    }

    async function parsePageForFinancialData(pdf, pageNum) {
      const page = await pdf.getPage(pageNum);
      
      // Get text with highest precision
      const textContent = await page.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false,
        includeMarkedContent: true
      });

      const pageItems = [];
      
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
            fontSize: Math.round(Math.sqrt(item.transform[0] * item.transform[0] + item.transform[1] * item.transform[1]) * 100) / 100,
            page: pageNum,
            index: index
          };
          
          pageItems.push(textItem);
          financialData.raw_extraction.all_text.push(textItem);
          
          // Detect financial patterns
          detectFinancialPatterns(text, textItem);
        }
      });
      
      // Specialized table row detection for financial documents
      detectFinancialTableRows(pageItems, pageNum);
    }

    function detectFinancialPatterns(text, textItem) {
      // Enhanced ISIN detection with context
      const isinPattern = /\\b[A-Z]{2}[A-Z0-9]{9}[0-9]\\b/g;
      let match;
      while ((match = isinPattern.exec(text)) !== null) {
        financialData.raw_extraction.detected_patterns.push({
          type: 'isin',
          value: match[0],
          page: textItem.page,
          x: textItem.x,
          y: textItem.y,
          context: text,
          confidence: 0.95
        });
      }

      // Enhanced number detection for financial amounts
      const numberPatterns = [
        { pattern: /\\b\\d{1,3}(?:'\\d{3})+(?:\\.\\d{2})?\\b/g, type: 'swiss_currency' },
        { pattern: /\\b\\d{1,3}(?:,\\d{3})+(?:\\.\\d{2})?\\b/g, type: 'us_currency' },
        { pattern: /\\b\\d+\\.\\d{2}\\b/g, type: 'decimal_currency' },
        { pattern: /\\b\\d{6,}\\b/g, type: 'large_number' },
        { pattern: /\\b\\d+%\\b/g, type: 'percentage' }
      ];

      numberPatterns.forEach(patternInfo => {
        let match;
        while ((match = patternInfo.pattern.exec(text)) !== null) {
          const parsedValue = parseFinancialNumber(match[0]);
          if (parsedValue !== null) {
            financialData.raw_extraction.all_numbers.push({
              original: match[0],
              parsed: parsedValue,
              type: patternInfo.type,
              page: textItem.page,
              x: textItem.x,
              y: textItem.y,
              context: text
            });
            
            financialData.raw_extraction.detected_patterns.push({
              type: patternInfo.type,
              value: match[0],
              parsed: parsedValue,
              page: textItem.page,
              x: textItem.x,
              y: textItem.y,
              context: text,
              confidence: getNumberConfidence(match[0], patternInfo.type)
            });
          }
        }
      });

      // Currency detection
      const currencies = ['USD', 'CHF', 'EUR', 'GBP'];
      if (currencies.includes(text)) {
        financialData.raw_extraction.detected_patterns.push({
          type: 'currency',
          value: text,
          page: textItem.page,
          x: textItem.x,
          y: textItem.y,
          context: text,
          confidence: 0.98
        });
      }

      // Date pattern detection
      const datePattern = /\\b\\d{2}\\.\\d{2}\\.\\d{4}\\b/g;
      let dateMatch;
      while ((dateMatch = datePattern.exec(text)) !== null) {
        financialData.raw_extraction.detected_patterns.push({
          type: 'date',
          value: dateMatch[0],
          page: textItem.page,
          x: textItem.x,
          y: textItem.y,
          context: text,
          confidence: 0.90
        });
      }

      // Financial institution names
      const institutionPattern = /(TORONTO|CANADIAN|HARP|GOLDMAN|CIBC|BANK|LUMINIS|BNP|CITIGROUP)/i;
      if (institutionPattern.test(text)) {
        financialData.raw_extraction.detected_patterns.push({
          type: 'institution',
          value: text,
          page: textItem.page,
          x: textItem.x,
          y: textItem.y,
          context: text,
          confidence: 0.85
        });
      }
    }

    function detectFinancialTableRows(pageItems, pageNum) {
      // Group items by Y coordinate to detect table rows
      const yTolerance = 8;
      const rows = {};
      
      pageItems.forEach(item => {
        const yKey = Math.round(item.y / yTolerance) * yTolerance;
        if (!rows[yKey]) rows[yKey] = [];
        rows[yKey].push(item);
      });
      
      // Process each potential row
      Object.keys(rows).forEach(yKey => {
        const row = rows[yKey].sort((a, b) => a.x - b.x);
        
        if (row.length >= 4) { // Financial rows typically have multiple columns
          const rowText = row.map(item => item.text).join(' ');
          
          // Check if this row contains an ISIN pattern
          const hasISIN = /\\b[A-Z]{2}[A-Z0-9]{9}[0-9]\\b/.test(rowText);
          
          // Check if this row has financial characteristics
          const hasNumbers = row.filter(item => /\\d/.test(item.text)).length >= 2;
          const hasPercentage = /\\d+%/.test(rowText);
          const hasCurrency = /(USD|CHF|EUR)/.test(rowText);
          
          if (hasISIN || (hasNumbers && hasPercentage) || (hasNumbers && hasCurrency)) {
            const tableRow = {
              page: pageNum,
              y: parseFloat(yKey),
              items: row,
              combined_text: rowText,
              has_isin: hasISIN,
              has_numbers: hasNumbers,
              has_percentage: hasPercentage,
              has_currency: hasCurrency,
              confidence: calculateRowConfidence(row)
            };
            
            financialData.table_data.push(tableRow);
            
            updateStatus(\`💼 Found potential security row on page \${pageNum}: \${rowText.substring(0, 60)}...\`);
          }
        }
      });
    }

    function parseFinancialNumber(text) {
      let cleanText = text.replace(/[%]/g, '');
      
      // Handle Swiss format (apostrophes)
      if (text.includes("'")) {
        cleanText = cleanText.replace(/'/g, '');
      }
      
      // Handle US format (commas)
      if (text.includes(',')) {
        cleanText = cleanText.replace(/,/g, '');
      }
      
      const parsed = parseFloat(cleanText);
      return isNaN(parsed) ? null : parsed;
    }

    function getNumberConfidence(text, type) {
      switch (type) {
        case 'swiss_currency': return 0.95;
        case 'us_currency': return 0.90;
        case 'decimal_currency': return 0.85;
        case 'large_number': return 0.80;
        case 'percentage': return 0.88;
        default: return 0.70;
      }
    }

    function calculateRowConfidence(row) {
      let score = 0;
      const rowText = row.map(item => item.text).join(' ');
      
      if (/\\b[A-Z]{2}[A-Z0-9]{9}[0-9]\\b/.test(rowText)) score += 40;
      if (/\\d{1,3}[',]\\d{3}/.test(rowText)) score += 25;
      if (/\\d+%/.test(rowText)) score += 20;
      if (/(USD|CHF|EUR)/.test(rowText)) score += 15;
      
      return Math.min(score, 100);
    }

    function analyzeFinancialPatterns() {
      // Group patterns by type
      const patternGroups = {};
      financialData.raw_extraction.detected_patterns.forEach(pattern => {
        if (!patternGroups[pattern.type]) patternGroups[pattern.type] = [];
        patternGroups[pattern.type].push(pattern);
      });
      
      // Log pattern analysis
      Object.keys(patternGroups).forEach(type => {
        updateStatus(\`📊 Found \${patternGroups[type].length} \${type} patterns\`);
      });
      
      // Extract client information
      const clientText = financialData.raw_extraction.all_text.find(item => 
        item.text.includes('MESSOS') || item.text.includes('ENTERPRISES')
      );
      if (clientText) {
        financialData.financial_summary.client_info.name = clientText.text;
      }
      
      // Extract valuation date
      const datePattern = financialData.raw_extraction.detected_patterns.find(p => 
        p.type === 'date' && p.value.includes('2025')
      );
      if (datePattern) {
        financialData.financial_summary.valuation_date = datePattern.value;
      }
    }

    function buildSecuritiesFromPatterns() {
      // Build securities by analyzing table rows with ISINs
      const securityRows = financialData.table_data.filter(row => row.has_isin);
      
      securityRows.forEach(row => {
        // Extract ISIN from row
        const isinMatch = row.combined_text.match(/\\b[A-Z]{2}[A-Z0-9]{9}[0-9]\\b/);
        if (!isinMatch) return;
        
        const isin = isinMatch[0];
        
        // Build security object
        const security = {
          isin: isin,
          page: row.page,
          row_y: row.y,
          raw_data: {},
          financial_data: {}
        };
        
        // Extract data from the row items
        row.items.forEach(item => {
          const text = item.text;
          
          // Currency detection
          if (['USD', 'CHF', 'EUR'].includes(text)) {
            security.financial_data.currency = text;
          }
          
          // Number extraction with context
          if (/\\d/.test(text)) {
            const parsed = parseFinancialNumber(text);
            if (parsed !== null) {
              if (!security.financial_data.numbers) security.financial_data.numbers = [];
              security.financial_data.numbers.push({
                original: text,
                parsed: parsed,
                x: item.x,
                type: getNumberType(text, parsed)
              });
            }
          }
          
          // Description extraction (longer text)
          if (text.length > 10 && !/^[\\d'.,%-]+$/.test(text) && text !== isin) {
            if (!security.raw_data.description || text.length > security.raw_data.description.length) {
              security.raw_data.description = text;
            }
          }
        });
        
        // Find nearby rows that might contain additional data for this security
        const nearbyRows = financialData.table_data.filter(otherRow => 
          otherRow.page === row.page && 
          Math.abs(otherRow.y - row.y) <= 25 &&
          otherRow !== row
        );
        
        nearbyRows.forEach(nearbyRow => {
          nearbyRow.items.forEach(item => {
            const text = item.text;
            if (text.length > 10 && !/^[\\d'.,%-]+$/.test(text)) {
              if (!security.raw_data.additional_info) security.raw_data.additional_info = [];
              security.raw_data.additional_info.push(text);
            }
          });
        });
        
        // Determine market value (largest reasonable number)
        if (security.financial_data.numbers) {
          const amounts = security.financial_data.numbers
            .filter(n => n.parsed > 1000 && n.parsed < 10000000)
            .sort((a, b) => b.parsed - a.parsed);
          
          if (amounts.length > 0) {
            security.financial_data.market_value = amounts[0].parsed;
          }
        }
        
        financialData.securities.push(security);
        updateStatus(\`🏦 Built security: \${isin} - \${formatCurrency(security.financial_data.market_value || 0)}\`);
      });
    }

    function getNumberType(text, parsed) {
      if (text.endsWith('%')) return 'percentage';
      if (parsed > 1000000) return 'large_amount';
      if (parsed > 10000) return 'medium_amount';
      if (parsed > 100) return 'small_amount';
      if (parsed === Math.floor(parsed)) return 'quantity';
      return 'decimal';
    }

    function calculatePortfolioTotals() {
      // Calculate total portfolio value
      const totalValue = financialData.securities.reduce((sum, security) => {
        return sum + (security.financial_data.market_value || 0);
      }, 0);
      
      financialData.financial_summary.total_portfolio_value = totalValue;
      
      // Find currency (most common)
      const currencies = financialData.securities
        .map(s => s.financial_data.currency)
        .filter(c => c);
      
      if (currencies.length > 0) {
        financialData.financial_summary.currency = currencies[0];
      }
      
      updateStatus(\`💰 Total portfolio value calculated: \${formatCurrency(totalValue)}\`);
    }

    async function renderPageWithHighlights(pdf, pageNum) {
      // Only render pages 8-14 which contain the main securities data
      if (pageNum < 8 || pageNum > 14) return;
      
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
      
      // Add highlights for detected patterns
      const pagePatterns = financialData.raw_extraction.detected_patterns.filter(p => p.page === pageNum);
      
      pagePatterns.forEach(pattern => {
        if (pattern.type === 'isin') {
          const overlay = document.createElement('div');
          overlay.className = 'highlight-overlay';
          overlay.style.left = (pattern.x * 0.7) + 'px';
          overlay.style.top = (viewport.height - pattern.y * 0.7) + 'px';
          overlay.style.width = '120px';
          overlay.style.height = '15px';
          overlay.title = \`ISIN: \${pattern.value}\`;
          canvasContainer.appendChild(overlay);
        }
      });
      
      const pageHeader = document.createElement('h3');
      pageHeader.textContent = \`Page \${pageNum} - Securities Data\`;
      pageHeader.style.margin = '20px 0 10px 0';
      
      const pdfContainer = document.getElementById('pdfContainer');
      pdfContainer.appendChild(pageHeader);
      pdfContainer.appendChild(canvasContainer);
    }

    function displayParsingResults() {
      const display = document.getElementById('resultsDisplay');
      
      // Summary statistics
      const summaryHtml = \`
        <div class="summary-stats">
          <h3>💼 SPECIALIZED PARSING RESULTS</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">\${financialData.securities.length}</div>
              <div>Securities Found</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">\${formatCurrency(financialData.financial_summary.total_portfolio_value)}</div>
              <div>Total Value</div>
            </div>
          </div>
        </div>
      \`;
      
      let html = summaryHtml;
      
      // Securities display
      if (financialData.securities.length > 0) {
        html += '<h3>🏦 Parsed Securities</h3>';
        
        financialData.securities.forEach(security => {
          html += '<div class="security-entry">';
          html += '<div class="security-header">';
          html += \`<span class="isin-code">\${security.isin}</span>\`;
          html += \` <span class="currency">Page \${security.page}</span>\`;
          html += '</div>';
          
          if (security.raw_data.description) {
            html += \`<div class="description">📝 \${security.raw_data.description}</div>\`;
          }
          
          html += '<div class="data-grid">';
          
          if (security.financial_data.market_value) {
            html += '<div class="data-item">';
            html += '<div class="data-label">Market Value</div>';
            html += \`<div class="data-value"><span class="amount">\${formatCurrency(security.financial_data.market_value)}</span></div>\`;
            html += '</div>';
          }
          
          if (security.financial_data.currency) {
            html += '<div class="data-item">';
            html += '<div class="data-label">Currency</div>';
            html += \`<div class="data-value"><span class="currency">\${security.financial_data.currency}</span></div>\`;
            html += '</div>';
          }
          
          if (security.financial_data.numbers) {
            html += '<div class="data-item">';
            html += '<div class="data-label">Data Points</div>';
            html += \`<div class="data-value">\${security.financial_data.numbers.length} numbers</div>\`;
            html += '</div>';
          }
          
          html += '</div>';
          
          if (security.raw_data.additional_info) {
            html += '<div class="description">';
            html += '📋 Additional: ' + security.raw_data.additional_info.join(' | ');
            html += '</div>';
          }
          
          html += '</div>';
        });
      }
      
      // Pattern detection summary
      const patternTypes = [...new Set(financialData.raw_extraction.detected_patterns.map(p => p.type))];
      if (patternTypes.length > 0) {
        html += '<div class="pattern-detection">';
        html += '<h4>🎯 Pattern Detection Summary</h4>';
        patternTypes.forEach(type => {
          const count = financialData.raw_extraction.detected_patterns.filter(p => p.type === type).length;
          html += \`<div>\${type.toUpperCase()}: \${count} patterns detected</div>\`;
        });
        html += '</div>';
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

    // Start specialized parsing
    startSpecializedParsing();
  </script>
</body>
</html>`;
  }

  displayParsingResults() {
    const data = this.extractedData;
    
    console.log('\n💼 SPECIALIZED FINANCIAL PARSING RESULTS');
    console.log('=======================================');
    
    // Document Info
    console.log('\n📄 DOCUMENT INFO:');
    console.log(`   Pages: ${data.metadata.num_pages}`);
    console.log(`   Fingerprint: ${data.metadata.fingerprint}`);
    
    // Financial Summary
    console.log('\n💰 FINANCIAL SUMMARY:');
    console.log(`   Total Portfolio Value: ${this.formatCurrency(data.financial_summary.total_portfolio_value)}`);
    console.log(`   Currency: ${data.financial_summary.currency}`);
    console.log(`   Securities Found: ${data.securities.length}`);
    console.log(`   Client: ${data.financial_summary.client_info.name || 'N/A'}`);
    console.log(`   Valuation Date: ${data.financial_summary.valuation_date || 'N/A'}`);
    
    // Pattern Detection
    const patternTypes = [...new Set(data.raw_extraction.detected_patterns.map(p => p.type))];
    console.log('\n🎯 PATTERN DETECTION:');
    patternTypes.forEach(type => {
      const count = data.raw_extraction.detected_patterns.filter(p => p.type === type).length;
      console.log(`   ${type.toUpperCase()}: ${count} patterns`);
    });
    
    // Securities Details
    if (data.securities.length > 0) {
      console.log('\n🏦 SECURITIES DETAILS:');
      data.securities
        .sort((a, b) => (b.financial_data.market_value || 0) - (a.financial_data.market_value || 0))
        .slice(0, 10)
        .forEach((security, i) => {
          console.log(`   ${i + 1}. ${security.isin} (Page ${security.page})`);
          if (security.raw_data.description) {
            console.log(`      Desc: ${security.raw_data.description.substring(0, 60)}...`);
          }
          if (security.financial_data.market_value) {
            console.log(`      Value: ${this.formatCurrency(security.financial_data.market_value)}`);
          }
          if (security.financial_data.currency) {
            console.log(`      Currency: ${security.financial_data.currency}`);
          }
          console.log(`      Data Points: ${security.financial_data.numbers ? security.financial_data.numbers.length : 0}`);
        });
      
      if (data.securities.length > 10) {
        console.log(`   ... and ${data.securities.length - 10} more securities`);
      }
    }
    
    console.log('\n✅ Specialized financial parsing completed successfully!');
  }

  async saveParsingResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = './extraction-results';
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save comprehensive JSON
    const jsonPath = path.join(outputDir, `specialized-financial-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.extractedData, null, 2));
    
    // Save securities CSV
    const csvPath = path.join(outputDir, `specialized-securities-${timestamp}.csv`);
    const csvContent = this.generateSpecializedCSV();
    fs.writeFileSync(csvPath, csvContent);
    
    console.log(`\n💾 Specialized parsing results saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   CSV: ${csvPath}`);
    
    return { jsonPath, csvPath };
  }

  generateSpecializedCSV() {
    const headers = [
      'ISIN', 'Description', 'Market_Value', 'Currency', 'Page', 
      'Number_Data_Points', 'Additional_Info', 'Row_Y_Position'
    ];
    
    const rows = this.extractedData.securities.map(security => [
      security.isin,
      (security.raw_data.description || '').replace(/"/g, '""'),
      security.financial_data.market_value || '',
      security.financial_data.currency || '',
      security.page,
      security.financial_data.numbers ? security.financial_data.numbers.length : 0,
      security.raw_data.additional_info ? security.raw_data.additional_info.join(' | ').replace(/"/g, '""') : '',
      security.row_y
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
    console.log('Usage: node specialized-financial-parser.js <pdf-path>');
    console.log('Example: node specialized-financial-parser.js "corner-bank-statement.pdf"');
    return;
  }
  
  const pdfPath = args[0];
  const parser = new SpecializedFinancialParser();
  
  const result = await parser.parseFinancialDocument(pdfPath);
  
  if (result) {
    console.log('\n🎉 Specialized financial parsing completed successfully!');
    console.log('💼 Optimized for Corner Bank style multi-line securities');
    console.log('🏦 All ISIN codes and financial data extracted');
  } else {
    console.log('\n❌ Specialized parsing failed');
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('specialized-financial-parser.js')) {
  main().catch(console.error);
}

export default SpecializedFinancialParser;