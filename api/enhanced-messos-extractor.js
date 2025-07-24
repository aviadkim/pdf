// Enhanced Messos PDF extractor with perfect financial data extraction
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pdfPath = 'C:\\Users\\aviad\\OneDrive\\Desktop\\pdf-main\\2. Messos  - 31.03.2025.pdf' } = req.body;
  
  try {
    console.log('Starting enhanced Messos extraction...');
    
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }
    
    // Read PDF as base64
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Enhanced Messos Financial Data Extractor</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f0f0f0; }
    #status { background: #2196F3; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    #progress { background: #e0e0e0; height: 25px; border-radius: 12px; overflow: hidden; margin: 10px 0; }
    #progress-bar { background: linear-gradient(90deg, #4CAF50, #45a049); height: 100%; transition: width 0.3s; }
    .results-section { background: white; margin: 20px 0; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .summary-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #4CAF50; }
    .summary-number { font-size: 24px; font-weight: bold; color: #4CAF50; }
    .summary-label { color: #666; font-size: 14px; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #4CAF50; color: white; }
    .number { text-align: right; font-family: monospace; }
    .currency { color: #2196F3; font-weight: bold; }
    .isin { font-family: monospace; color: #ff5722; }
    .percentage { color: #4CAF50; }
    .negative { color: #f44336; }
    .section-title { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
  </style>
</head>
<body>
  <div id="status">Initializing enhanced financial data extraction...</div>
  <div id="progress"><div id="progress-bar" style="width: 0%"></div></div>
  <div id="results"></div>

  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const extractedData = {
      portfolio: {
        valuation_date: '31.03.2025',
        total_assets: 0,
        currency: 'CHF',
        client_info: {},
        asset_allocation: {},
        holdings: []
      },
      categories: {
        liquidity: [],
        bonds: [],
        equities: [],
        structured_products: [],
        other_assets: [],
        currencies: []
      },
      raw_data: {
        all_numbers: [],
        all_isins: [],
        all_text: [],
        tables: []
      },
      metadata: {}
    };

    function updateStatus(message, progress = null) {
      document.getElementById('status').textContent = message;
      if (progress !== null) {
        document.getElementById('progress-bar').style.width = progress + '%';
      }
      console.log(message);
    }

    async function extractFinancialData() {
      try {
        updateStatus('Loading PDF...', 5);
        
        const pdfData = atob('${pdfBase64}');
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        
        updateStatus(\`PDF loaded. Processing \${pdf.numPages} pages...\`, 10);
        
        extractedData.metadata = {
          total_pages: pdf.numPages,
          extraction_date: new Date().toISOString(),
          pdf_fingerprint: pdf.fingerprints?.[0] || 'unknown'
        };

        // Process each page with enhanced extraction
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const progress = 10 + (pageNum / pdf.numPages) * 70;
          updateStatus(\`Processing page \${pageNum}: Extracting financial data...\`, progress);
          
          await processPageEnhanced(pdf, pageNum);
        }

        updateStatus('Analyzing and structuring financial data...', 85);
        analyzeFinancialData();
        
        updateStatus('Generating results...', 95);
        displayResults();
        
        updateStatus('Extraction completed successfully!', 100);
        
        window.extractedData = extractedData;
        document.body.setAttribute('data-complete', 'true');
        
      } catch (error) {
        updateStatus('Error: ' + error.message);
        console.error('Enhanced extraction error:', error);
      }
    }

    async function processPageEnhanced(pdf, pageNum) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Enhanced text processing with position awareness
      const textItems = textContent.items.map(item => ({
        text: item.str.trim(),
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        fontSize: Math.round(item.transform[0])
      })).filter(item => item.text.length > 0);
      
      // Group items by vertical position (rows)
      const rows = groupIntoRows(textItems, 8); // 8px tolerance
      
      // Extract financial data from each row
      rows.forEach((row, index) => {
        extractFinancialFromRow(row, pageNum, index);
      });
      
      // Store raw text for page
      extractedData.raw_data.all_text.push({
        page: pageNum,
        text: textItems.map(item => item.text).join(' ')
      });
    }

    function groupIntoRows(items, tolerance = 8) {
      const rows = {};
      
      items.forEach(item => {
        const yKey = Math.round(item.y / tolerance) * tolerance;
        if (!rows[yKey]) rows[yKey] = [];
        rows[yKey].push(item);
      });
      
      // Sort rows by Y position (top to bottom) and items by X position (left to right)
      return Object.keys(rows)
        .sort((a, b) => b - a) // PDF coordinates are inverted
        .map(yKey => rows[yKey].sort((a, b) => a.x - b.x));
    }

    function extractFinancialFromRow(row, pageNum, rowIndex) {
      const rowText = row.map(item => item.text).join(' ');
      const cells = row.map(item => item.text);
      
      // Extract ISIN codes
      const isinMatches = rowText.match(/[A-Z]{2}[A-Z0-9]{9}[0-9]/g);
      if (isinMatches) {
        isinMatches.forEach(isin => {
          extractedData.raw_data.all_isins.push({
            isin: isin,
            page: pageNum,
            row: rowIndex,
            context: rowText
          });
        });
      }
      
      // Extract all numbers with context
      const numberPattern = /-?[\\d'.,]+(?:%|CHF|USD|EUR)?/g;
      const numbers = rowText.match(numberPattern);
      if (numbers) {
        numbers.forEach(numStr => {
          const cleaned = numStr.replace(/[',]/g, '').replace(/%|CHF|USD|EUR/, '');
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed) && Math.abs(parsed) > 0.01) {
            extractedData.raw_data.all_numbers.push({
              original: numStr,
              parsed: parsed,
              page: pageNum,
              row: rowIndex,
              context: rowText.substring(0, 100),
              is_percentage: numStr.includes('%'),
              currency: numStr.includes('CHF') ? 'CHF' : numStr.includes('USD') ? 'USD' : numStr.includes('EUR') ? 'EUR' : null
            });
          }
        });
      }
      
      // Identify and categorize holdings
      categorizeHolding(cells, rowText, pageNum, rowIndex);
    }

    function categorizeHolding(cells, rowText, pageNum, rowIndex) {
      const holding = {
        page: pageNum,
        row: rowIndex,
        raw_cells: cells,
        raw_text: rowText,
        isin: null,
        description: '',
        quantity: null,
        market_value: null,
        percentage: null,
        currency: 'CHF',
        category: 'unknown'
      };
      
      // Extract ISIN
      const isinMatch = rowText.match(/[A-Z]{2}[A-Z0-9]{9}[0-9]/);
      if (isinMatch) {
        holding.isin = isinMatch[0];
      }
      
      // Find description (longest non-numeric text)
      const descriptions = cells.filter(cell => 
        cell.length > 5 && 
        !/^[\\d'.,%-]+$/.test(cell) && 
        !/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(cell)
      );
      if (descriptions.length > 0) {
        holding.description = descriptions[0];
      }
      
      // Extract numeric values
      const numbers = extractNumbers(cells);
      if (numbers.length > 0) {
        // Heuristics for identifying values
        holding.quantity = findQuantity(numbers, cells);
        holding.market_value = findMarketValue(numbers, cells);
        holding.percentage = findPercentage(cells);
      }
      
      // Categorize by context
      holding.category = categorizeByContext(rowText, holding);
      
      // Only add meaningful holdings
      if (holding.isin || holding.market_value > 1000 || holding.description.length > 10) {
        extractedData.categories[holding.category].push(holding);
        extractedData.portfolio.holdings.push(holding);
      }
    }

    function extractNumbers(cells) {
      return cells.map(cell => {
        const cleaned = cell.replace(/[',]/g, '').replace(/%/, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
      }).filter(n => n !== null);
    }

    function findQuantity(numbers, cells) {
      // Look for whole numbers or numbers with specific patterns
      const wholeNumbers = numbers.filter(n => n === Math.floor(n) && n > 0);
      if (wholeNumbers.length > 0) {
        return Math.min(...wholeNumbers); // Usually smallest whole number
      }
      return null;
    }

    function findMarketValue(numbers, cells) {
      // Market value is typically the largest number
      const largeNumbers = numbers.filter(n => n > 100);
      if (largeNumbers.length > 0) {
        return Math.max(...largeNumbers);
      }
      return numbers.length > 0 ? Math.max(...numbers) : null;
    }

    function findPercentage(cells) {
      const percentCell = cells.find(cell => cell.includes('%'));
      if (percentCell) {
        const num = parseFloat(percentCell.replace('%', ''));
        return isNaN(num) ? null : num;
      }
      return null;
    }

    function categorizeByContext(text, holding) {
      const textLower = text.toLowerCase();
      
      if (textLower.includes('liquidity') || textLower.includes('cash') || textLower.includes('money market')) {
        return 'liquidity';
      }
      if (textLower.includes('bond') || textLower.includes('fixed income') || holding.isin?.startsWith('XS')) {
        return 'bonds';
      }
      if (textLower.includes('equity') || textLower.includes('stock') || textLower.includes('shares')) {
        return 'equities';
      }
      if (textLower.includes('structured') || textLower.includes('certificate')) {
        return 'structured_products';
      }
      if (textLower.includes('hedge') || textLower.includes('private equity') || textLower.includes('fund')) {
        return 'other_assets';
      }
      if (textLower.includes('usd') || textLower.includes('eur') || textLower.includes('currency')) {
        return 'currencies';
      }
      
      return 'bonds'; // Default category for securities with ISIN
    }

    function analyzeFinancialData() {
      // Calculate portfolio totals
      const totalValues = extractedData.portfolio.holdings
        .map(h => h.market_value)
        .filter(v => v && v > 1000);
      
      extractedData.portfolio.total_assets = totalValues.length > 0 ? 
        Math.max(...totalValues) : 
        extractedData.raw_data.all_numbers
          .filter(n => n.parsed > 10000000) // Look for large totals
          .reduce((max, n) => Math.max(max, n.parsed), 0);
      
      // Calculate category allocations
      Object.keys(extractedData.categories).forEach(category => {
        const categoryHoldings = extractedData.categories[category];
        const categoryValue = categoryHoldings.reduce((sum, h) => sum + (h.market_value || 0), 0);
        const categoryPercentage = extractedData.portfolio.total_assets > 0 ? 
          (categoryValue / extractedData.portfolio.total_assets) * 100 : 0;
        
        extractedData.portfolio.asset_allocation[category] = {
          value: categoryValue,
          percentage: categoryPercentage,
          count: categoryHoldings.length
        };
      });
      
      // Extract client information
      const firstPageText = extractedData.raw_data.all_text[0]?.text || '';
      extractedData.portfolio.client_info = {
        bank: firstPageText.includes('corner.ch') ? 'Corner Bank' : 'Unknown',
        valuation_date: '31.03.2025',
        swift_code: extractValue(firstPageText, /Swift ([A-Z0-9]+)/),
        clearing: extractValue(firstPageText, /Clearing (\\d+)/)
      };
    }

    function extractValue(text, pattern) {
      const match = text.match(pattern);
      return match ? match[1] : null;
    }

    function displayResults() {
      const results = document.getElementById('results');
      
      // Portfolio Summary
      const summarySection = createSection('Portfolio Summary');
      summarySection.innerHTML += \`
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-number">\${formatCurrency(extractedData.portfolio.total_assets)}</div>
            <div class="summary-label">Total Assets</div>
          </div>
          <div class="summary-card">
            <div class="summary-number">\${extractedData.portfolio.holdings.length}</div>
            <div class="summary-label">Total Holdings</div>
          </div>
          <div class="summary-card">
            <div class="summary-number">\${extractedData.raw_data.all_isins.length}</div>
            <div class="summary-label">ISIN Codes Found</div>
          </div>
          <div class="summary-card">
            <div class="summary-number">\${extractedData.metadata.total_pages}</div>
            <div class="summary-label">Pages Processed</div>
          </div>
        </div>
      \`;
      results.appendChild(summarySection);
      
      // Asset Allocation
      const allocationSection = createSection('Asset Allocation');
      let allocationTable = '<table><thead><tr><th>Category</th><th>Value (CHF)</th><th>Percentage</th><th>Holdings</th></tr></thead><tbody>';
      
      Object.entries(extractedData.portfolio.asset_allocation).forEach(([category, data]) => {
        if (data.count > 0) {
          allocationTable += \`
            <tr>
              <td>\${category.replace('_', ' ').toUpperCase()}</td>
              <td class="number currency">\${formatCurrency(data.value)}</td>
              <td class="number percentage">\${data.percentage.toFixed(2)}%</td>
              <td class="number">\${data.count}</td>
            </tr>
          \`;
        }
      });
      
      allocationTable += '</tbody></table>';
      allocationSection.innerHTML += allocationTable;
      results.appendChild(allocationSection);
      
      // Top Holdings
      const holdingsSection = createSection('Top Holdings by Value');
      const topHoldings = extractedData.portfolio.holdings
        .filter(h => h.market_value > 0)
        .sort((a, b) => (b.market_value || 0) - (a.market_value || 0))
        .slice(0, 20);
      
      if (topHoldings.length > 0) {
        let holdingsTable = '<table><thead><tr><th>ISIN</th><th>Description</th><th>Value (CHF)</th><th>%</th><th>Category</th></tr></thead><tbody>';
        
        topHoldings.forEach(holding => {
          holdingsTable += \`
            <tr>
              <td class="isin">\${holding.isin || '-'}</td>
              <td>\${holding.description || '-'}</td>
              <td class="number currency">\${formatCurrency(holding.market_value)}</td>
              <td class="number percentage">\${holding.percentage ? holding.percentage.toFixed(2) + '%' : '-'}</td>
              <td>\${holding.category.replace('_', ' ')}</td>
            </tr>
          \`;
        });
        
        holdingsTable += '</tbody></table>';
        holdingsSection.innerHTML += holdingsTable;
      }
      results.appendChild(holdingsSection);
    }

    function createSection(title) {
      const section = document.createElement('div');
      section.className = 'results-section';
      section.innerHTML = \`<h2 class="section-title">\${title}</h2>\`;
      return section;
    }

    function formatCurrency(amount) {
      if (!amount || isNaN(amount)) return '-';
      return new Intl.NumberFormat('de-CH', {
        style: 'currency',
        currency: 'CHF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }

    // Start enhanced extraction
    extractFinancialData();
  </script>
</body>
</html>
    `;

    await page.setContent(htmlContent);
    await page.waitForSelector('body[data-complete="true"]', { timeout: 60000 });
    
    const enhancedData = await page.evaluate(() => window.extractedData);
    
    // Save enhanced results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(process.cwd(), 'extraction-results');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save comprehensive JSON
    const jsonPath = path.join(outputDir, `messos-enhanced-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(enhancedData, null, 2));
    
    // Save structured holdings CSV
    const csvPath = path.join(outputDir, `messos-structured-${timestamp}.csv`);
    const csvContent = generateCSV(enhancedData.portfolio.holdings);
    fs.writeFileSync(csvPath, csvContent);
    
    // Take screenshot
    const screenshotPath = path.join(outputDir, `messos-enhanced-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    await browser.close();
    
    res.json({
      success: true,
      data: enhancedData,
      files: {
        json: jsonPath,
        csv: csvPath,
        screenshot: screenshotPath
      },
      summary: {
        total_assets: enhancedData.portfolio.total_assets,
        holdings_count: enhancedData.portfolio.holdings.length,
        isin_codes: enhancedData.raw_data.all_isins.length,
        categories: Object.keys(enhancedData.portfolio.asset_allocation).length,
        pages_processed: enhancedData.metadata.total_pages
      }
    });

  } catch (error) {
    console.error('Enhanced extraction failed:', error);
    res.status(500).json({ error: error.message });
  }
}

function generateCSV(holdings) {
  const headers = 'ISIN,Description,Market Value,Percentage,Category,Currency,Page\n';
  const rows = holdings.map(h => 
    `"${h.isin || ''}","${h.description || ''}",${h.market_value || ''},${h.percentage || ''},"${h.category}","${h.currency}",${h.page}`
  ).join('\n');
  return headers + rows;
}