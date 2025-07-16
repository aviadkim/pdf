// Test script for Messos PDF extraction using Puppeteer
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function extractMessosPDF() {
  const pdfPath = 'C:\\Users\\aviad\\OneDrive\\Desktop\\pdf-main\\2. Messos  - 31.03.2025.pdf';
  
  console.log('Starting Messos PDF extraction...');
  console.log('PDF Path:', pdfPath);
  
  // Check if file exists
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF file not found:', pdfPath);
    return;
  }
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ],
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('Browser:', msg.text()));
    page.on('pageerror', error => console.error('Page error:', error));

    // Read PDF as base64
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log('PDF loaded, size:', pdfBuffer.length, 'bytes');

    // Create HTML content with PDF.js
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Messos PDF Data Extractor</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background: #f5f5f5;
    }
    #status {
      background: #4CAF50;
      color: white;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      font-size: 16px;
    }
    #progress {
      background: #e0e0e0;
      height: 20px;
      border-radius: 10px;
      overflow: hidden;
      margin: 10px 0;
    }
    #progress-bar {
      background: #2196F3;
      height: 100%;
      width: 0%;
      transition: width 0.3s;
    }
    .canvas-container {
      display: none;
    }
    #results {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-top: 20px;
    }
    .table-preview {
      margin: 20px 0;
      overflow-x: auto;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 6px;
      text-align: left;
    }
    th {
      background: #4CAF50;
      color: white;
    }
    .number {
      text-align: right;
      font-family: monospace;
    }
    pre {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div id="status">Initializing PDF extraction...</div>
  <div id="progress"><div id="progress-bar"></div></div>
  <div class="canvas-container" id="canvas-container"></div>
  <div id="results"></div>

  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const extractedData = {
      metadata: {},
      pages: [],
      allText: [],
      structuredData: [],
      tables: [],
      holdings: [],
      numbers: [],
      isinCodes: [],
      totals: {}
    };

    function updateStatus(message, progress = null) {
      document.getElementById('status').textContent = message;
      if (progress !== null) {
        document.getElementById('progress-bar').style.width = progress + '%';
      }
      console.log(message);
    }

    async function extractPDF() {
      try {
        updateStatus('Loading PDF...', 10);
        
        const pdfData = atob('${pdfBase64}');
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        
        updateStatus(\`PDF loaded successfully. Total pages: \${pdf.numPages}\`, 20);
        
        extractedData.metadata = {
          numPages: pdf.numPages,
          fingerprint: pdf.fingerprints?.[0] || 'unknown'
        };

        // Process each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const progress = 20 + (pageNum / pdf.numPages) * 60;
          updateStatus(\`Processing page \${pageNum} of \${pdf.numPages}...\`, progress);
          
          await processPage(pdf, pageNum);
        }

        // Analyze extracted data
        updateStatus('Analyzing financial data...', 85);
        analyzeData();
        
        // Display results
        updateStatus('Extraction complete!', 100);
        displayResults();
        
        // Mark completion
        window.extractionComplete = true;
        window.extractedData = extractedData;
        document.body.setAttribute('data-complete', 'true');
        
      } catch (error) {
        updateStatus('Error: ' + error.message);
        console.error('Extraction error:', error);
      }
    }

    async function processPage(pdf, pageNum) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      
      // Create canvas for rendering
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const container = document.getElementById('canvas-container');
      container.appendChild(canvas);
      
      // Render page
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Extract text with positions
      const textContent = await page.getTextContent();
      const pageData = {
        pageNumber: pageNum,
        items: [],
        text: '',
        structuredRows: []
      };
      
      // Process text items
      const rows = {};
      textContent.items.forEach(item => {
        const text = item.str.trim();
        if (text) {
          pageData.items.push({
            text: text,
            x: item.transform[4],
            y: item.transform[5],
            width: item.width,
            height: item.height
          });
          
          // Group by Y position (row detection)
          const yKey = Math.round(item.transform[5] / 5) * 5;
          if (!rows[yKey]) rows[yKey] = [];
          rows[yKey].push({
            text: text,
            x: item.transform[4]
          });
          
          // Extract numbers
          const numbers = text.match(/-?\\d+[,.]?\\d*/g);
          if (numbers) {
            numbers.forEach(num => {
              const cleaned = num.replace(/,/g, '');
              const parsed = parseFloat(cleaned);
              if (!isNaN(parsed)) {
                extractedData.numbers.push({
                  original: num,
                  parsed: parsed,
                  page: pageNum,
                  context: text
                });
              }
            });
          }
          
          // Extract ISIN codes
          const isinMatch = text.match(/[A-Z]{2}[A-Z0-9]{9}[0-9]/g);
          if (isinMatch) {
            isinMatch.forEach(isin => {
              extractedData.isinCodes.push({
                isin: isin,
                page: pageNum,
                context: text
              });
            });
          }
        }
      });
      
      // Convert rows to structured data
      Object.keys(rows)
        .sort((a, b) => b - a)
        .forEach(yKey => {
          const row = rows[yKey].sort((a, b) => a.x - b.x);
          if (row.length > 1) {
            pageData.structuredRows.push(row.map(item => item.text));
          }
        });
      
      pageData.text = textContent.items.map(item => item.str).join(' ');
      extractedData.allText.push(pageData.text);
      extractedData.pages.push(pageData);
      
      // Detect tables
      detectTables(pageData);
    }

    function detectTables(pageData) {
      const rows = pageData.structuredRows;
      let currentTable = [];
      let inTable = false;
      
      rows.forEach((row, index) => {
        // Simple heuristic: rows with 3+ columns might be table data
        if (row.length >= 3) {
          if (!inTable) {
            inTable = true;
            currentTable = [];
          }
          currentTable.push(row);
        } else if (inTable && row.length < 3) {
          // End of table
          if (currentTable.length > 2) {
            extractedData.tables.push({
              page: pageData.pageNumber,
              rows: currentTable,
              headers: currentTable[0],
              data: currentTable.slice(1)
            });
          }
          inTable = false;
          currentTable = [];
        }
      });
      
      // Check last table
      if (currentTable.length > 2) {
        extractedData.tables.push({
          page: pageData.pageNumber,
          rows: currentTable,
          headers: currentTable[0],
          data: currentTable.slice(1)
        });
      }
    }

    function analyzeData() {
      // Find holdings/securities
      extractedData.pages.forEach(page => {
        page.structuredRows.forEach(row => {
          // Look for rows with ISIN codes
          const rowText = row.join(' ');
          const hasISIN = /[A-Z]{2}[A-Z0-9]{9}[0-9]/.test(rowText);
          
          if (hasISIN || (row.length >= 4 && hasNumbers(row))) {
            const holding = {
              page: page.pageNumber,
              isin: extractISIN(rowText),
              description: findDescription(row),
              values: extractNumbers(row),
              raw: row
            };
            
            // Try to identify specific fields
            holding.quantity = findQuantity(row);
            holding.marketValue = findMarketValue(row);
            holding.percentage = findPercentage(row);
            
            if (holding.description || holding.isin) {
              extractedData.holdings.push(holding);
            }
          }
        });
      });
      
      // Calculate totals
      const allValues = extractedData.holdings
        .map(h => h.marketValue)
        .filter(v => v !== null);
      
      extractedData.totals = {
        numberOfHoldings: extractedData.holdings.length,
        totalMarketValue: allValues.length > 0 ? Math.max(...allValues) : 0,
        isinCodesFound: extractedData.isinCodes.length,
        tablesFound: extractedData.tables.length,
        numbersExtracted: extractedData.numbers.length
      };
    }

    function hasNumbers(row) {
      return row.some(cell => /\\d/.test(cell));
    }

    function extractISIN(text) {
      const match = text.match(/[A-Z]{2}[A-Z0-9]{9}[0-9]/);
      return match ? match[0] : null;
    }

    function findDescription(row) {
      // Find the longest text that's not a number
      const texts = row.filter(cell => 
        cell.length > 5 && !/^[\\d,.-]+$/.test(cell.trim())
      );
      return texts.length > 0 ? texts[0] : '';
    }

    function extractNumbers(row) {
      const numbers = [];
      row.forEach(cell => {
        const cleaned = cell.replace(/,/g, '').trim();
        const num = parseFloat(cleaned);
        if (!isNaN(num)) {
          numbers.push(num);
        }
      });
      return numbers;
    }

    function findQuantity(row) {
      const numbers = extractNumbers(row);
      // Usually quantity is a whole number
      const wholeNumbers = numbers.filter(n => n === Math.floor(n));
      return wholeNumbers.length > 0 ? wholeNumbers[0] : null;
    }

    function findMarketValue(row) {
      const numbers = extractNumbers(row);
      // Market value is usually the largest number
      return numbers.length > 0 ? Math.max(...numbers) : null;
    }

    function findPercentage(row) {
      // Look for percentages
      for (const cell of row) {
        if (cell.includes('%')) {
          const num = parseFloat(cell.replace('%', ''));
          if (!isNaN(num)) return num;
        }
      }
      // Look for small numbers that might be percentages
      const numbers = extractNumbers(row);
      const small = numbers.filter(n => n > 0 && n < 100);
      return small.length > 0 ? small[small.length - 1] : null;
    }

    function displayResults() {
      const results = document.getElementById('results');
      
      // Summary
      const summary = document.createElement('div');
      summary.innerHTML = \`
        <h2>Extraction Summary</h2>
        <p><strong>Pages Processed:</strong> \${extractedData.metadata.numPages}</p>
        <p><strong>Holdings Found:</strong> \${extractedData.totals.numberOfHoldings}</p>
        <p><strong>ISIN Codes:</strong> \${extractedData.totals.isinCodesFound}</p>
        <p><strong>Tables Detected:</strong> \${extractedData.totals.tablesFound}</p>
        <p><strong>Numbers Extracted:</strong> \${extractedData.totals.numbersExtracted}</p>
        <p><strong>Est. Total Value:</strong> \${formatNumber(extractedData.totals.totalMarketValue)}</p>
      \`;
      results.appendChild(summary);
      
      // Holdings table
      if (extractedData.holdings.length > 0) {
        const tableDiv = document.createElement('div');
        tableDiv.className = 'table-preview';
        tableDiv.innerHTML = '<h3>Extracted Holdings</h3>';
        
        const table = document.createElement('table');
        table.innerHTML = \`
          <thead>
            <tr>
              <th>Page</th>
              <th>ISIN</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Market Value</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            \${extractedData.holdings.slice(0, 20).map(h => \`
              <tr>
                <td>\${h.page}</td>
                <td>\${h.isin || '-'}</td>
                <td>\${h.description || '-'}</td>
                <td class="number">\${formatNumber(h.quantity)}</td>
                <td class="number">\${formatNumber(h.marketValue)}</td>
                <td class="number">\${h.percentage ? h.percentage + '%' : '-'}</td>
              </tr>
            \`).join('')}
          </tbody>
        \`;
        tableDiv.appendChild(table);
        
        if (extractedData.holdings.length > 20) {
          tableDiv.innerHTML += '<p>... and ' + (extractedData.holdings.length - 20) + ' more holdings</p>';
        }
        
        results.appendChild(tableDiv);
      }
      
      // Raw data preview
      const rawDiv = document.createElement('div');
      rawDiv.innerHTML = '<h3>Sample Raw Data</h3>';
      const pre = document.createElement('pre');
      pre.textContent = JSON.stringify(extractedData.holdings.slice(0, 3), null, 2);
      rawDiv.appendChild(pre);
      results.appendChild(rawDiv);
    }

    function formatNumber(num) {
      if (num == null || isNaN(num)) return '-';
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(num);
    }

    // Start extraction
    extractPDF();
  </script>
</body>
</html>
    `;

    await page.setContent(htmlContent);
    
    // Wait for extraction to complete
    await page.waitForSelector('body[data-complete="true"]', { timeout: 60000 });
    
    // Get extracted data
    const extractedData = await page.evaluate(() => window.extractedData);
    
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(__dirname, 'extraction-results');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save JSON data
    const jsonPath = path.join(outputDir, `messos-data-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(extractedData, null, 2));
    console.log('JSON saved to:', jsonPath);
    
    // Save screenshot
    const screenshotPath = path.join(outputDir, `messos-extraction-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Screenshot saved to:', screenshotPath);
    
    // Print summary
    console.log('\n=== Extraction Summary ===');
    console.log('Pages:', extractedData.metadata.numPages);
    console.log('Holdings found:', extractedData.holdings.length);
    console.log('ISIN codes:', extractedData.isinCodes.length);
    console.log('Tables:', extractedData.tables.length);
    console.log('Numbers:', extractedData.numbers.length);
    console.log('Total value:', extractedData.totals.totalMarketValue);
    
    // Save a CSV for easy viewing
    if (extractedData.holdings.length > 0) {
      const csvPath = path.join(outputDir, `messos-holdings-${timestamp}.csv`);
      const csvHeader = 'Page,ISIN,Description,Quantity,Market Value,Percentage\\n';
      const csvRows = extractedData.holdings.map(h => 
        `${h.page},"${h.isin || ''}","${h.description || ''}",${h.quantity || ''},${h.marketValue || ''},${h.percentage || ''}`
      ).join('\\n');
      fs.writeFileSync(csvPath, csvHeader + csvRows);
      console.log('CSV saved to:', csvPath);
    }
    
    return extractedData;
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

// Run the extraction
extractMessosPDF().then(() => {
  console.log('\\nExtraction completed successfully!');
}).catch(error => {
  console.error('\\nExtraction failed:', error);
});