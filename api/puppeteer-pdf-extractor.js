// Puppeteer-based PDF extraction for perfect data capture
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pdfPath, extractionMode = 'comprehensive' } = req.body;
  
  try {
    console.log('Starting Puppeteer PDF extraction...');
    
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

    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('Browser console:', msg.text()));
    page.on('pageerror', error => console.error('Browser error:', error));

    // Create extraction results
    const extractionResults = {
      metadata: {},
      pages: [],
      tables: [],
      financialData: {},
      rawText: '',
      structuredData: {},
      timestamp: new Date().toISOString()
    };

    // Load PDF viewer with extraction capabilities
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Messos PDF Extractor</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    #status {
      background: #4CAF50;
      color: white;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    #pdf-container {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .page-canvas {
      border: 1px solid #ddd;
      margin: 10px 0;
      max-width: 100%;
    }
    #extracted-data {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 5px;
      margin-top: 20px;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 12px;
      max-height: 400px;
      overflow-y: auto;
    }
    .table-container {
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
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #4CAF50;
      color: white;
    }
    .number-cell {
      text-align: right;
      font-family: monospace;
    }
    .highlight {
      background-color: yellow;
    }
  </style>
</head>
<body>
  <div id="status">Initializing PDF extraction...</div>
  <div id="pdf-container"></div>
  <div id="table-container"></div>
  <div id="extracted-data"></div>

  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    let extractedData = {
      pages: [],
      tables: [],
      holdings: [],
      totals: {},
      metadata: {},
      rawNumbers: []
    };

    async function loadAndExtractPDF(pdfPath) {
      try {
        updateStatus('Loading PDF...');
        
        // Convert file path to base64 for loading
        const pdfData = await fetch('/api/read-pdf-base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: pdfPath })
        }).then(res => res.json());
        
        const pdf = await pdfjsLib.getDocument({ data: atob(pdfData.base64) }).promise;
        
        updateStatus(\`PDF loaded. Pages: \${pdf.numPages}\`);
        
        extractedData.metadata = {
          numPages: pdf.numPages,
          info: await pdf.getMetadata()
        };

        // Process each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          await extractPageData(pdf, pageNum);
        }

        // Analyze and structure the data
        analyzeFinancialData();
        
        // Display results
        displayResults();
        
        // Send data to parent
        window.extractedData = extractedData;
        document.body.setAttribute('data-extraction-complete', 'true');
        
      } catch (error) {
        updateStatus('Error: ' + error.message);
        console.error('Extraction error:', error);
      }
    }

    async function extractPageData(pdf, pageNum) {
      updateStatus(\`Processing page \${pageNum}...\`);
      
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      
      // Create canvas for rendering
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.className = 'page-canvas';
      
      // Render page
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      document.getElementById('pdf-container').appendChild(canvas);
      
      // Extract text content
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      
      // Extract structured text with positions
      const structuredText = await extractStructuredText(page, textContent);
      
      // Detect and extract tables
      const tables = await detectTables(structuredText);
      
      // OCR for better number extraction
      const ocrData = await performOCR(canvas);
      
      extractedData.pages.push({
        pageNumber: pageNum,
        text: pageText,
        structuredText: structuredText,
        tables: tables,
        ocrData: ocrData
      });
    }

    async function extractStructuredText(page, textContent) {
      const viewport = page.getViewport({ scale: 1.0 });
      const structured = [];
      
      textContent.items.forEach(item => {
        const tx = pdfjsLib.Util.transform(
          viewport.transform,
          item.transform
        );
        
        structured.push({
          text: item.str,
          x: tx[4],
          y: tx[5],
          width: item.width,
          height: item.height,
          fontSize: Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1])
        });
      });
      
      return structured;
    }

    async function detectTables(structuredText) {
      // Group text by Y position (rows)
      const rows = {};
      const tolerance = 5; // pixels
      
      structuredText.forEach(item => {
        const yKey = Math.round(item.y / tolerance) * tolerance;
        if (!rows[yKey]) rows[yKey] = [];
        rows[yKey].push(item);
      });
      
      // Sort rows and detect table structure
      const sortedRows = Object.keys(rows)
        .sort((a, b) => b - a) // PDF Y coordinates are inverted
        .map(key => rows[key].sort((a, b) => a.x - b.x));
      
      // Identify tables based on consistent column alignment
      const tables = [];
      let currentTable = [];
      let columnPositions = [];
      
      sortedRows.forEach(row => {
        if (row.length > 2) { // Potential table row
          const positions = row.map(item => item.x);
          
          if (columnPositions.length === 0) {
            columnPositions = positions;
            currentTable.push(row);
          } else {
            // Check if columns align
            const aligned = positions.some(pos => 
              columnPositions.some(colPos => Math.abs(pos - colPos) < tolerance)
            );
            
            if (aligned) {
              currentTable.push(row);
            } else {
              if (currentTable.length > 2) {
                tables.push(processTable(currentTable));
              }
              currentTable = [row];
              columnPositions = positions;
            }
          }
        }
      });
      
      if (currentTable.length > 2) {
        tables.push(processTable(currentTable));
      }
      
      return tables;
    }

    function processTable(tableRows) {
      const headers = tableRows[0].map(item => item.text);
      const rows = tableRows.slice(1).map(row => {
        const rowData = {};
        row.forEach((item, index) => {
          const header = headers[index] || \`Column\${index}\`;
          rowData[header] = parseValue(item.text);
        });
        return rowData;
      });
      
      return { headers, rows };
    }

    function parseValue(text) {
      // Clean and parse numbers
      const cleanText = text.trim();
      
      // Check if it's a number
      const numberPattern = /^-?[\\d,\\.]+$/;
      if (numberPattern.test(cleanText.replace(/[\\s,]/g, ''))) {
        const number = parseFloat(cleanText.replace(/,/g, ''));
        if (!isNaN(number)) {
          extractedData.rawNumbers.push({
            original: cleanText,
            parsed: number,
            context: text
          });
          return number;
        }
      }
      
      // Check for percentages
      if (cleanText.endsWith('%')) {
        const percent = parseFloat(cleanText.slice(0, -1));
        if (!isNaN(percent)) {
          return { value: percent, type: 'percentage' };
        }
      }
      
      // Check for dates
      const datePattern = /\\d{1,2}[\\/\\.\\-]\\d{1,2}[\\/\\.\\-]\\d{2,4}/;
      if (datePattern.test(cleanText)) {
        return { value: cleanText, type: 'date' };
      }
      
      return cleanText;
    }

    async function performOCR(canvas) {
      updateStatus('Performing OCR for enhanced number extraction...');
      
      try {
        const worker = await Tesseract.createWorker();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789.,-%() ',
        });
        
        const { data } = await worker.recognize(canvas);
        await worker.terminate();
        
        // Extract all numbers from OCR
        const numberPattern = /-?[\\d,\\.]+/g;
        const numbers = data.text.match(numberPattern) || [];
        
        return {
          text: data.text,
          numbers: numbers.map(n => ({
            original: n,
            parsed: parseFloat(n.replace(/,/g, ''))
          })).filter(n => !isNaN(n.parsed))
        };
        
      } catch (error) {
        console.error('OCR error:', error);
        return { text: '', numbers: [] };
      }
    }

    function analyzeFinancialData() {
      updateStatus('Analyzing financial data...');
      
      // Extract holdings data
      const holdings = [];
      const isinPattern = /[A-Z]{2}[A-Z0-9]{9}[0-9]/;
      
      extractedData.pages.forEach(page => {
        page.tables.forEach(table => {
          table.rows.forEach(row => {
            // Look for ISIN codes to identify securities
            const rowText = JSON.stringify(row);
            const isinMatch = rowText.match(isinPattern);
            
            if (isinMatch || hasFinancialData(row)) {
              holdings.push({
                isin: isinMatch ? isinMatch[0] : null,
                description: findDescription(row),
                quantity: findNumber(row, 'quantity'),
                marketValue: findNumber(row, 'value'),
                percentage: findNumber(row, 'percent'),
                currency: findCurrency(row),
                row: row
              });
            }
          });
        });
      });
      
      extractedData.holdings = holdings;
      
      // Calculate totals
      extractedData.totals = {
        totalMarketValue: holdings.reduce((sum, h) => sum + (h.marketValue || 0), 0),
        numberOfHoldings: holdings.length,
        currencies: [...new Set(holdings.map(h => h.currency).filter(Boolean))]
      };
    }

    function hasFinancialData(row) {
      const values = Object.values(row);
      return values.some(v => {
        if (typeof v === 'number') return true;
        if (typeof v === 'object' && v.type === 'percentage') return true;
        return false;
      });
    }

    function findDescription(row) {
      const textValues = Object.entries(row)
        .filter(([k, v]) => typeof v === 'string' && v.length > 10)
        .map(([k, v]) => v);
      return textValues[0] || '';
    }

    function findNumber(row, type) {
      const entries = Object.entries(row);
      
      for (const [key, value] of entries) {
        if (typeof value === 'number') {
          const keyLower = key.toLowerCase();
          
          if (type === 'quantity' && (keyLower.includes('quantity') || keyLower.includes('units'))) {
            return value;
          }
          if (type === 'value' && (keyLower.includes('value') || keyLower.includes('amount'))) {
            return value;
          }
          if (type === 'percent' && keyLower.includes('percent')) {
            return value;
          }
        }
        
        if (typeof value === 'object' && value.type === 'percentage' && type === 'percent') {
          return value.value;
        }
      }
      
      // Fallback: return first number found
      if (type === 'value') {
        const numbers = entries.filter(([k, v]) => typeof v === 'number').map(([k, v]) => v);
        return Math.max(...numbers) || null; // Assume largest number is market value
      }
      
      return null;
    }

    function findCurrency(row) {
      const currencyPattern = /USD|EUR|GBP|CHF|JPY/;
      const rowText = JSON.stringify(row);
      const match = rowText.match(currencyPattern);
      return match ? match[0] : 'USD';
    }

    function displayResults() {
      updateStatus('Extraction complete!');
      
      // Display summary
      const summary = \`
Extraction Summary:
==================
Total Pages: \${extractedData.metadata.numPages}
Total Tables Found: \${extractedData.tables.length}
Holdings Identified: \${extractedData.holdings.length}
Total Market Value: \${formatNumber(extractedData.totals.totalMarketValue)}
Currencies: \${extractedData.totals.currencies.join(', ')}
Raw Numbers Extracted: \${extractedData.rawNumbers.length}
      \`;
      
      document.getElementById('extracted-data').textContent = summary;
      
      // Display holdings table
      if (extractedData.holdings.length > 0) {
        displayHoldingsTable();
      }
    }

    function displayHoldingsTable() {
      const container = document.getElementById('table-container');
      container.innerHTML = '<h3>Extracted Holdings</h3>';
      
      const table = document.createElement('table');
      table.innerHTML = \`
        <thead>
          <tr>
            <th>ISIN</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Market Value</th>
            <th>%</th>
            <th>Currency</th>
          </tr>
        </thead>
        <tbody>
          \${extractedData.holdings.map(h => \`
            <tr>
              <td>\${h.isin || '-'}</td>
              <td>\${h.description}</td>
              <td class="number-cell">\${formatNumber(h.quantity)}</td>
              <td class="number-cell">\${formatNumber(h.marketValue)}</td>
              <td class="number-cell">\${h.percentage ? h.percentage + '%' : '-'}</td>
              <td>\${h.currency}</td>
            </tr>
          \`).join('')}
        </tbody>
      \`;
      
      const tableContainer = document.createElement('div');
      tableContainer.className = 'table-container';
      tableContainer.appendChild(table);
      container.appendChild(tableContainer);
    }

    function formatNumber(num) {
      if (num == null) return '-';
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    }

    function updateStatus(message) {
      document.getElementById('status').textContent = message;
      console.log('Status:', message);
    }

    // Start extraction
    loadAndExtractPDF('${pdfPath}');
  </script>
</body>
</html>
    `;

    await page.setContent(htmlContent);
    
    // Wait for extraction to complete
    await page.waitForSelector('body[data-extraction-complete="true"]', { timeout: 120000 });
    
    // Get extracted data
    const pageData = await page.evaluate(() => window.extractedData);
    
    // Merge with results
    Object.assign(extractionResults, pageData);
    
    // Take screenshots for verification
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(process.cwd(), 'test-results', `messos-extraction-${timestamp}.png`);
    
    // Ensure directory exists
    const dir = path.dirname(screenshotPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Save JSON results
    const jsonPath = path.join(process.cwd(), 'test-results', `messos-data-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(extractionResults, null, 2));
    
    await browser.close();
    
    res.json({
      success: true,
      data: extractionResults,
      screenshotPath,
      jsonPath,
      summary: {
        pages: extractionResults.pages.length,
        holdings: extractionResults.holdings?.length || 0,
        totalValue: extractionResults.totals?.totalMarketValue || 0,
        numbersExtracted: extractionResults.rawNumbers?.length || 0
      }
    });

  } catch (error) {
    console.error('Puppeteer extraction failed:', error);
    res.status(500).json({ error: error.message });
  }
}

// Helper endpoint to read PDF as base64
export async function readPdfBase64(req, res) {
  const { path: pdfPath } = req.body;
  
  try {
    const absolutePath = path.isAbsolute(pdfPath) ? pdfPath : path.join(process.cwd(), pdfPath);
    const pdfBuffer = fs.readFileSync(absolutePath);
    const base64 = pdfBuffer.toString('base64');
    
    res.json({ base64 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}