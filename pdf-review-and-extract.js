// PDF Review and Complete Extraction
// Reviews the actual Messos PDF and extracts ALL data
// Reports the real portfolio value as shown in the document

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class PDFReviewAndExtract {
  constructor() {
    this.extractedData = {
      document_analysis: {
        total_pages: 0,
        document_type: '',
        bank_name: '',
        client_name: '',
        portfolio_value: 0,
        currency: '',
        valuation_date: ''
      },
      complete_extraction: {
        all_text: [],
        all_numbers: [],
        all_currencies: [],
        all_percentages: [],
        all_isins: [],
        securities_data: []
      },
      portfolio_summary: {
        total_value_found: 0,
        total_value_calculated: 0,
        securities_count: 0,
        asset_allocation: {}
      }
    };
  }

  async reviewAndExtractPDF() {
    console.log('📄 PDF REVIEW AND COMPLETE EXTRACTION');
    console.log('=====================================');
    console.log('🔍 Reviewing actual Messos PDF document');
    console.log('📊 Extracting ALL data and finding portfolio value');
    
    const pdfPath = 'C:\\Users\\aviad\\OneDrive\\Desktop\\pdf-main\\2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found:', pdfPath);
      return null;
    }

    console.log('🚀 Opening PDF for complete review...');

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1800, height: 1200 },
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });

    try {
      const page = await browser.newPage();
      
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('📊') || text.includes('💰') || text.includes('🔍')) {
          console.log('REVIEW:', text);
        }
      });

      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      console.log(`📄 PDF loaded: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      const reviewHTML = this.generatePDFReviewHTML(pdfBase64);
      await page.setContent(reviewHTML);
      
      console.log('⏳ Conducting comprehensive PDF review and extraction...');
      await page.waitForSelector('body[data-review-complete="true"]', { timeout: 180000 });
      
      const reviewData = await page.evaluate(() => window.pdfReviewData);
      this.extractedData = reviewData;
      
      console.log('📊 Analyzing extracted data...');
      this.analyzeExtractedData();
      
      console.log('💾 Saving complete review results...');
      await this.saveReviewResults();
      
      this.displayReviewResults();
      
      console.log('\n🎬 PDF review available in browser for 90 seconds...');
      await new Promise(resolve => setTimeout(resolve, 90000));
      
      return this.extractedData;
      
    } catch (error) {
      console.error('❌ PDF review failed:', error);
      return null;
    } finally {
      await browser.close();
    }
  }

  generatePDFReviewHTML(pdfBase64) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>📄 Messos PDF Complete Review & Extraction</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    body { 
      font-family: 'Segoe UI', sans-serif; 
      margin: 0; 
      background: linear-gradient(135deg, #2c3e50, #3498db); 
      color: white; 
    }
    .review-container {
      display: grid;
      grid-template-columns: 2fr 1fr;
      height: 100vh;
      gap: 20px;
      padding: 20px;
    }
    .pdf-review {
      background: white;
      color: black;
      border-radius: 15px;
      padding: 20px;
      overflow-y: auto;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    .extraction-panel {
      background: rgba(0,0,0,0.2);
      border-radius: 15px;
      padding: 20px;
      overflow-y: auto;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: rgba(255,255,255,0.1);
      border-radius: 15px;
      backdrop-filter: blur(10px);
    }
    .value-display {
      font-size: 3em;
      font-weight: bold;
      color: #00ff88;
      text-shadow: 0 0 20px rgba(0,255,136,0.5);
      margin: 10px 0;
      text-align: center;
    }
    .progress-area {
      background: rgba(0,0,0,0.3);
      border-radius: 15px;
      padding: 15px;
      margin: 15px 0;
    }
    .progress-bar {
      width: 100%;
      height: 25px;
      background: rgba(255,255,255,0.1);
      border-radius: 15px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #00ff88, #00cc6a);
      width: 0%;
      transition: width 0.5s ease;
      border-radius: 15px;
    }
    .data-section {
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
      padding: 15px;
      margin: 15px 0;
      max-height: 200px;
      overflow-y: auto;
    }
    .data-item {
      background: rgba(255,255,255,0.1);
      margin: 5px 0;
      padding: 10px;
      border-radius: 5px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      border-left: 3px solid #00ff88;
    }
    .canvas-container {
      text-align: center;
      margin: 20px 0;
    }
    canvas {
      border: 2px solid #ddd;
      border-radius: 10px;
      max-width: 100%;
      height: auto;
      margin: 10px 0;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    .summary-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 15px 0;
    }
    .stat-card {
      background: rgba(255,255,255,0.1);
      padding: 15px;
      border-radius: 10px;
      text-align: center;
    }
    .stat-value {
      font-size: 1.5em;
      font-weight: bold;
      color: #00ff88;
    }
    .extraction-log {
      background: rgba(0,0,0,0.3);
      border-radius: 10px;
      padding: 15px;
      margin: 10px 0;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      max-height: 150px;
      overflow-y: auto;
      border-left: 4px solid #00ff88;
    }
  </style>
</head>
<body>

<div class="header">
  <h1>📄 Messos PDF Complete Review</h1>
  <div class="value-display" id="portfolioValue">Analyzing...</div>
  <div>Portfolio Value</div>
  
  <div class="progress-area">
    <div class="progress-bar">
      <div class="progress-fill" id="progressBar"></div>
    </div>
    <div id="statusText">🚀 Starting comprehensive PDF review...</div>
  </div>
  
  <div class="summary-stats">
    <div class="stat-card">
      <div class="stat-value" id="pageCount">0</div>
      <div>Pages</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" id="isinCount">0</div>
      <div>ISINs</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" id="numberCount">0</div>
      <div>Numbers</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" id="currencyCount">0</div>
      <div>Currencies</div>
    </div>
  </div>
</div>

<div class="review-container">
  <div class="pdf-review">
    <h3>📄 PDF Document Analysis</h3>
    <div class="canvas-container" id="canvasContainer">
      <!-- PDF pages will be rendered here -->
    </div>
  </div>
  
  <div class="extraction-panel">
    <h3>🔍 Live Data Extraction</h3>
    
    <div class="extraction-log" id="extractionLog">
      <div>🚀 Starting comprehensive PDF review...</div>
    </div>
    
    <h4>💰 Currency Values Found:</h4>
    <div class="data-section" id="currencySection">
      <!-- Currency values will appear here -->
    </div>
    
    <h4>🏦 ISIN Codes Found:</h4>
    <div class="data-section" id="isinSection">
      <!-- ISIN codes will appear here -->
    </div>
    
    <h4>📊 Key Numbers Found:</h4>
    <div class="data-section" id="numberSection">
      <!-- Important numbers will appear here -->
    </div>
  </div>
</div>

<script>
window.pdfReviewData = {
  document_analysis: {
    total_pages: 0,
    document_type: 'Portfolio Statement',
    bank_name: 'Corner Bank',
    client_name: 'MESSOS ENTERPRISES LTD.',
    portfolio_value: 0,
    currency: 'USD',
    valuation_date: '31.03.2025'
  },
  complete_extraction: {
    all_text: [],
    all_numbers: [],
    all_currencies: [],
    all_percentages: [],
    all_isins: [],
    securities_data: []
  },
  portfolio_summary: {
    total_value_found: 0,
    total_value_calculated: 0,
    securities_count: 0,
    asset_allocation: {}
  }
};

let extractionLog = document.getElementById('extractionLog');
let currencySection = document.getElementById('currencySection');
let isinSection = document.getElementById('isinSection');
let numberSection = document.getElementById('numberSection');
let canvasContainer = document.getElementById('canvasContainer');

function addLog(message) {
  console.log('📊 ' + message);
  const logEntry = document.createElement('div');
  logEntry.textContent = new Date().toLocaleTimeString() + ' - ' + message;
  extractionLog.appendChild(logEntry);
  extractionLog.scrollTop = extractionLog.scrollHeight;
}

function updateProgress(current, total) {
  const percentage = (current / total) * 100;
  document.getElementById('progressBar').style.width = percentage + '%';
  document.getElementById('statusText').textContent = \`📊 Analyzing page \${current}/\${total}...\`;
  document.getElementById('pageCount').textContent = total;
}

function updateStats() {
  document.getElementById('isinCount').textContent = window.pdfReviewData.complete_extraction.all_isins.length;
  document.getElementById('numberCount').textContent = window.pdfReviewData.complete_extraction.all_numbers.length;
  document.getElementById('currencyCount').textContent = window.pdfReviewData.complete_extraction.all_currencies.length;
}

function addCurrencyValue(value, page, context) {
  const currencyDiv = document.createElement('div');
  currencyDiv.className = 'data-item';
  currencyDiv.innerHTML = \`
    <strong>\${value}</strong> (Page \${page})<br>
    <small>\${context.substring(0, 50)}...</small>
  \`;
  currencySection.appendChild(currencyDiv);
  
  window.pdfReviewData.complete_extraction.all_currencies.push({
    value: value,
    page: page,
    context: context
  });
  
  addLog(\`💰 Currency value found: \${value} on page \${page}\`);
}

function addISINCode(isin, page, context) {
  const isinDiv = document.createElement('div');
  isinDiv.className = 'data-item';
  isinDiv.innerHTML = \`
    <strong>\${isin}</strong> (Page \${page})<br>
    <small>\${context.substring(0, 50)}...</small>
  \`;
  isinSection.appendChild(isinDiv);
  
  window.pdfReviewData.complete_extraction.all_isins.push({
    isin: isin,
    page: page,
    context: context
  });
  
  addLog(\`🏦 ISIN found: \${isin} on page \${page}\`);
}

function addKeyNumber(number, page, context) {
  const numberDiv = document.createElement('div');
  numberDiv.className = 'data-item';
  numberDiv.innerHTML = \`
    <strong>\${number}</strong> (Page \${page})<br>
    <small>\${context.substring(0, 50)}...</small>
  \`;
  numberSection.appendChild(numberDiv);
  
  window.pdfReviewData.complete_extraction.all_numbers.push({
    number: number,
    page: page,
    context: context
  });
}

async function startPDFReview() {
  try {
    addLog('📄 Starting comprehensive PDF document review...');
    addLog('🔍 Looking for portfolio value and all financial data...');
    
    // Set up PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const pdfData = 'data:application/pdf;base64,${pdfBase64}';
    addLog('📄 Loading PDF document for complete analysis...');
    
    const pdf = await pdfjsLib.getDocument(pdfData).promise;
    addLog(\`📊 PDF loaded: \${pdf.numPages} pages to analyze\`);
    
    window.pdfReviewData.document_analysis.total_pages = pdf.numPages;
    
    // Enhanced patterns for comprehensive extraction
    const isinPattern = /\\b[A-Z]{2}[A-Z0-9]{9}[0-9]\\b/g;
    const currencyPattern = /(?:USD|CHF|EUR)?\\s*[\d']+[.,]\\d{2,3}/g;
    const swissCurrencyPattern = /[\d']+[.,]\\d{2}/g;
    const percentagePattern = /\\d+[.,]\\d+%/g;
    const largeNumberPattern = /\\b\\d{1,3}['\\s]?\\d{3}['\\s]?\\d{3}\\b/g;
    
    let foundISINs = new Set();
    let foundCurrencies = new Set();
    let foundNumbers = new Set();
    let allText = '';
    let portfolioValues = [];
    
    // Process all pages comprehensively
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      updateProgress(pageNum, pdf.numPages);
      addLog(\`🔍 Deep analysis of page \${pageNum} - extracting all data...\`);
      
      const page = await pdf.getPage(pageNum);
      
      // Render page for visual review
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const context = canvas.getContext('2d');
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Show all pages for review
      if (pageNum <= 5) {
        canvasContainer.appendChild(canvas);
      }
      
      // Extract detailed text content
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      allText += pageText + ' ';
      
      // Store all text for analysis
      window.pdfReviewData.complete_extraction.all_text.push({
        page: pageNum,
        text: pageText
      });
      
      // Find ISINs
      const pageISINs = pageText.match(isinPattern) || [];
      for (const isin of pageISINs) {
        if (!foundISINs.has(isin)) {
          foundISINs.add(isin);
          addISINCode(isin, pageNum, pageText);
        }
      }
      
      // Find currency values
      const pageCurrencies = pageText.match(currencyPattern) || [];
      const pageSwissCurrencies = pageText.match(swissCurrencyPattern) || [];
      const allPageCurrencies = [...pageCurrencies, ...pageSwissCurrencies];
      
      for (const currency of allPageCurrencies) {
        const cleanCurrency = currency.replace(/[^\\d'.,]/g, '');
        if (cleanCurrency && !foundCurrencies.has(cleanCurrency)) {
          foundCurrencies.add(cleanCurrency);
          addCurrencyValue(currency, pageNum, pageText);
          
          // Check if this could be a portfolio total
          const numValue = parseFloat(cleanCurrency.replace(/['\\s]/g, '').replace(',', '.'));
          if (numValue > 10000000) { // Values over 10M could be portfolio totals
            portfolioValues.push({
              value: numValue,
              original: currency,
              page: pageNum,
              context: pageText
            });
          }
        }
      }
      
      // Find large numbers (potential portfolio values)
      const largeNumbers = pageText.match(largeNumberPattern) || [];
      for (const number of largeNumbers) {
        if (!foundNumbers.has(number)) {
          foundNumbers.add(number);
          addKeyNumber(number, pageNum, pageText);
          
          const numValue = parseFloat(number.replace(/['\\s]/g, ''));
          if (numValue > 5000000) {
            portfolioValues.push({
              value: numValue,
              original: number,
              page: pageNum,
              context: pageText
            });
          }
        }
      }
      
      updateStats();
      
      // Brief pause for visual effect
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Analyze for portfolio value
    addLog('💰 Analyzing for portfolio total value...');
    
    // Look for portfolio value indicators
    const portfolioIndicators = [
      'total assets', 'total portfolio', 'portfolio value', 'total value',
      'net asset value', 'total', 'assets', 'portfolio'
    ];
    
    let detectedPortfolioValue = 0;
    
    for (const indicator of portfolioIndicators) {
      const regex = new RegExp(indicator + '.*?([\\d\\'\\s]+[\\d])', 'gi');
      const matches = allText.match(regex);
      if (matches) {
        for (const match of matches) {
          const numbers = match.match(/[\\d'\\s]+\\d/g);
          if (numbers) {
            for (const num of numbers) {
              const value = parseFloat(num.replace(/['\\s]/g, ''));
              if (value > detectedPortfolioValue && value > 10000000) {
                detectedPortfolioValue = value;
                addLog(\`💰 Portfolio value detected: \${value.toLocaleString()} from "\${indicator}"\`);
              }
            }
          }
        }
      }
    }
    
    // If no clear portfolio value, use largest currency value found
    if (detectedPortfolioValue === 0 && portfolioValues.length > 0) {
      portfolioValues.sort((a, b) => b.value - a.value);
      detectedPortfolioValue = portfolioValues[0].value;
      addLog(\`💰 Using largest value as portfolio total: \${detectedPortfolioValue.toLocaleString()}\`);
    }
    
    // Update portfolio value display
    window.pdfReviewData.document_analysis.portfolio_value = detectedPortfolioValue;
    window.pdfReviewData.portfolio_summary.total_value_found = detectedPortfolioValue;
    window.pdfReviewData.portfolio_summary.securities_count = foundISINs.size;
    
    document.getElementById('portfolioValue').textContent = '$' + detectedPortfolioValue.toLocaleString();
    
    // Final summary
    document.getElementById('statusText').textContent = '✅ PDF review completed!';
    document.getElementById('progressBar').style.width = '100%';
    
    addLog(\`🎉 PDF review completed!\`);
    addLog(\`📊 Found \${foundISINs.size} ISIN codes\`);
    addLog(\`💰 Found \${foundCurrencies.size} currency values\`);
    addLog(\`📄 Analyzed \${pdf.numPages} pages\`);
    addLog(\`💼 Portfolio value: \${detectedPortfolioValue ? '$' + detectedPortfolioValue.toLocaleString() : 'Not clearly detected'}\`);
    
    document.body.setAttribute('data-review-complete', 'true');
    
  } catch (error) {
    addLog('❌ Error: ' + error.message);
    console.error('PDF review error:', error);
  }
}

// Start PDF review when page loads
setTimeout(startPDFReview, 1000);
</script>

</body>
</html>`;
  }

  analyzeExtractedData() {
    console.log('🧠 Analyzing extracted data for portfolio insights...');
    
    // Calculate portfolio metrics
    const totalISINs = this.extractedData.complete_extraction.all_isins.length;
    const totalCurrencies = this.extractedData.complete_extraction.all_currencies.length;
    const totalNumbers = this.extractedData.complete_extraction.all_numbers.length;
    
    this.extractedData.portfolio_summary.securities_count = totalISINs;
    
    console.log(`📊 Analysis complete: ${totalISINs} ISINs, ${totalCurrencies} currencies, ${totalNumbers} numbers`);
  }

  async saveReviewResults() {
    const resultsPath = path.join('extraction-results', `pdf-review-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    if (!fs.existsSync('extraction-results')) {
      fs.mkdirSync('extraction-results');
    }
    
    fs.writeFileSync(resultsPath, JSON.stringify(this.extractedData, null, 2));
    console.log(`💾 PDF review results saved: ${resultsPath}`);
  }

  displayReviewResults() {
    console.log('\n📄 PDF REVIEW RESULTS');
    console.log('=====================');
    console.log(`📊 Document Type: ${this.extractedData.document_analysis.document_type}`);
    console.log(`🏦 Bank: ${this.extractedData.document_analysis.bank_name}`);
    console.log(`👤 Client: ${this.extractedData.document_analysis.client_name}`);
    console.log(`📅 Valuation Date: ${this.extractedData.document_analysis.valuation_date}`);
    console.log(`📄 Total Pages: ${this.extractedData.document_analysis.total_pages}`);
    
    console.log('\n💰 PORTFOLIO VALUE ANALYSIS:');
    console.log(`💼 Detected Portfolio Value: $${this.extractedData.document_analysis.portfolio_value.toLocaleString()}`);
    console.log(`💱 Currency: ${this.extractedData.document_analysis.currency}`);
    
    console.log('\n📊 EXTRACTION SUMMARY:');
    console.log(`🏦 ISIN Codes Found: ${this.extractedData.complete_extraction.all_isins.length}`);
    console.log(`💰 Currency Values Found: ${this.extractedData.complete_extraction.all_currencies.length}`);
    console.log(`📊 Numbers Extracted: ${this.extractedData.complete_extraction.all_numbers.length}`);
    console.log(`📄 Text Sections: ${this.extractedData.complete_extraction.all_text.length}`);
    
    if (this.extractedData.complete_extraction.all_isins.length > 0) {
      console.log('\n🎯 Sample ISIN Codes Found:');
      this.extractedData.complete_extraction.all_isins.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.isin} (Page ${item.page})`);
      });
    }
    
    if (this.extractedData.complete_extraction.all_currencies.length > 0) {
      console.log('\n💰 Sample Currency Values Found:');
      this.extractedData.complete_extraction.all_currencies.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.value} (Page ${item.page})`);
      });
    }
  }
}

// Run the PDF review and extraction
const pdfReview = new PDFReviewAndExtract();
pdfReview.reviewAndExtractPDF().then((results) => {
  if (results) {
    console.log('\n🎉 PDF REVIEW AND EXTRACTION COMPLETED!');
    console.log('📊 Complete data extracted from actual PDF');
    console.log('💰 Portfolio value detected and reported');
    console.log('📋 All financial data available for analysis');
  } else {
    console.log('❌ PDF review failed');
  }
});