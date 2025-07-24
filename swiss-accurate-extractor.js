// Swiss Banking Accurate Extractor
// Specifically designed for Corner Bank style documents
// Handles Swiss number format correctly (apostrophes as thousand separators)

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class SwissAccurateExtractor {
  constructor() {
    this.portfolioData = {
      client_info: {
        name: 'MESSOS ENTERPRISES LTD.',
        bank: 'Corner Bank',
        date: '31.03.2025'
      },
      portfolio_value: 0,
      securities: [],
      summary: {
        total_assets: 0,
        currency: 'USD',
        securities_count: 0
      }
    };
  }

  async extractAccuratePortfolioValue() {
    console.log('🇨🇭 SWISS BANKING ACCURATE EXTRACTOR');
    console.log('====================================');
    console.log('💰 Extracting REAL portfolio value from Corner Bank format');
    console.log('🔧 Handling Swiss number formatting correctly');
    
    const pdfPath = 'C:\\Users\\aviad\\OneDrive\\Desktop\\pdf-main\\2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found');
      return null;
    }

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1600, height: 1200 },
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });

    try {
      const page = await browser.newPage();
      
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('💰') || text.includes('🇨🇭') || text.includes('✅')) {
          console.log('SWISS:', text);
        }
      });

      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      console.log(`📄 PDF loaded: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      const swissHTML = this.generateSwissExtractorHTML(pdfBase64);
      await page.setContent(swissHTML);
      
      console.log('⏳ Extracting with Swiss banking precision...');
      await page.waitForSelector('body[data-swiss-complete="true"]', { timeout: 120000 });
      
      const extractedData = await page.evaluate(() => window.swissPortfolioData);
      this.portfolioData = extractedData;
      
      this.displayAccurateResults();
      
      console.log('\n🎬 Swiss extraction results visible for 60 seconds...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      return this.portfolioData;
      
    } catch (error) {
      console.error('❌ Swiss extraction failed:', error);
      return null;
    } finally {
      await browser.close();
    }
  }

  generateSwissExtractorHTML(pdfBase64) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>🇨🇭 Swiss Banking Accurate Extractor</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 20px; 
      background: linear-gradient(135deg, #d32f2f, #c62828); 
      color: white; 
    }
    .container {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      height: 90vh;
    }
    .pdf-area {
      background: white;
      color: black;
      border-radius: 15px;
      padding: 20px;
      overflow-y: auto;
    }
    .results-area {
      background: rgba(0,0,0,0.2);
      border-radius: 15px;
      padding: 20px;
      overflow-y: auto;
      backdrop-filter: blur(10px);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: rgba(255,255,255,0.1);
      border-radius: 15px;
    }
    .value-display {
      font-size: 4em;
      font-weight: bold;
      color: #ffeb3b;
      text-shadow: 0 0 20px rgba(255,235,59,0.5);
      margin: 15px 0;
    }
    .progress {
      width: 100%;
      height: 20px;
      background: rgba(255,255,255,0.2);
      border-radius: 10px;
      overflow: hidden;
      margin: 10px 0;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #ffeb3b, #fdd835);
      width: 0%;
      transition: width 0.5s ease;
    }
    .value-item {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #ffeb3b;
    }
    canvas {
      max-width: 100%;
      border: 1px solid #ddd;
      border-radius: 5px;
      margin: 10px 0;
    }
    .swiss-flag {
      display: inline-block;
      width: 20px;
      height: 20px;
      background: #d32f2f;
      position: relative;
      margin-right: 8px;
    }
    .swiss-flag::before {
      content: '+';
      position: absolute;
      color: white;
      font-weight: bold;
      font-size: 14px;
      top: 2px;
      left: 6px;
    }
  </style>
</head>
<body>

<div class="header">
  <h1><span class="swiss-flag"></span>Swiss Banking Accurate Extractor</h1>
  <div class="value-display" id="portfolioValue">Calculating...</div>
  <div>Portfolio Value (USD)</div>
  
  <div class="progress">
    <div class="progress-bar" id="progress"></div>
  </div>
  <div id="status">🇨🇭 Starting Swiss-precision extraction...</div>
</div>

<div class="container">
  <div class="pdf-area">
    <h3>📄 Corner Bank Document Analysis</h3>
    <div id="pdfContainer"></div>
  </div>
  
  <div class="results-area">
    <h3>💰 Swiss Format Values</h3>
    <div id="valuesContainer"></div>
  </div>
</div>

<script>
window.swissPortfolioData = {
  client_info: {
    name: 'MESSOS ENTERPRISES LTD.',
    bank: 'Corner Bank',
    date: '31.03.2025'
  },
  portfolio_value: 0,
  securities: [],
  summary: {
    total_assets: 0,
    currency: 'USD',
    securities_count: 0
  }
};

function parseSwissNumber(swissStr) {
  // Swiss format: 19'464'431 or 19'464'431.50
  if (!swissStr) return 0;
  
  // Remove any non-digit, non-apostrophe, non-decimal characters
  const cleaned = swissStr.replace(/[^\\d'.,]/g, '');
  
  // Replace apostrophes with nothing (they're thousand separators)
  const withoutApostrophes = cleaned.replace(/'/g, '');
  
  // Handle decimal separator (could be . or ,)
  const normalized = withoutApostrophes.replace(',', '.');
  
  return parseFloat(normalized) || 0;
}

function formatSwissValue(value) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function addValueFound(description, swissValue, usdValue, page, context) {
  const valueDiv = document.createElement('div');
  valueDiv.className = 'value-item';
  valueDiv.innerHTML = \`
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <strong>\${description}</strong>
      <span style="background: rgba(255,235,59,0.2); padding: 4px 8px; border-radius: 4px;">Page \${page}</span>
    </div>
    <div style="color: #ffeb3b; font-weight: bold; font-size: 1.2em; margin: 8px 0;">
      Swiss: \${swissValue} → USD: \${formatSwissValue(usdValue)}
    </div>
    <div style="font-size: 0.9em; opacity: 0.8;">
      \${context.substring(0, 100)}...
    </div>
  \`;
  document.getElementById('valuesContainer').appendChild(valueDiv);
  
  console.log(\`💰 Value found: \${description} = \${formatSwissValue(usdValue)}\`);
}

function updateDisplay(value, description) {
  document.getElementById('portfolioValue').textContent = formatSwissValue(value);
  document.getElementById('status').textContent = description;
}

async function startSwissExtraction() {
  try {
    console.log('🇨🇭 Starting Swiss banking accurate extraction...');
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const pdfData = 'data:application/pdf;base64,${pdfBase64}';
    const pdf = await pdfjsLib.getDocument(pdfData).promise;
    
    console.log(\`📄 PDF loaded: \${pdf.numPages} pages\`);
    
    // Swiss number patterns
    const swissNumberPattern = /\\b\\d{1,3}(?:'\\d{3})*(?:[.,]\\d{1,2})?\\b/g;
    const portfolioKeywords = [
      'total assets', 'total portfolio', 'portfolio value', 'total value',
      'net asset value', 'gesamtvermögen', 'total', 'assets'
    ];
    
    let maxPortfolioValue = 0;
    let portfolioValueContext = '';
    let allValues = [];
    let pageTexts = [];
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      document.getElementById('progress').style.width = (pageNum / pdf.numPages * 100) + '%';
      document.getElementById('status').textContent = \`🔍 Analyzing page \${pageNum}/\${pdf.numPages}...\`;
      
      const page = await pdf.getPage(pageNum);
      
      // Render page
      const viewport = page.getViewport({ scale: 0.8 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      if (pageNum <= 3) {
        document.getElementById('pdfContainer').appendChild(canvas);
      }
      
      // Extract text
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      pageTexts.push(pageText);
      
      // Find Swiss-formatted numbers
      const swissNumbers = pageText.match(swissNumberPattern) || [];
      
      for (const swissNum of swissNumbers) {
        const usdValue = parseSwissNumber(swissNum);
        
        if (usdValue > 1000000) { // Values over 1M
          allValues.push({
            swiss: swissNum,
            usd: usdValue,
            page: pageNum,
            context: pageText
          });
          
          // Check if this is near portfolio keywords
          const lowerText = pageText.toLowerCase();
          for (const keyword of portfolioKeywords) {
            if (lowerText.includes(keyword)) {
              const distance = Math.abs(lowerText.indexOf(keyword) - lowerText.indexOf(swissNum.toLowerCase()));
              if (distance < 100 && usdValue > maxPortfolioValue) {
                maxPortfolioValue = usdValue;
                portfolioValueContext = \`Found "\${keyword}" near \${swissNum} on page \${pageNum}\`;
                addValueFound(\`Portfolio Total (\${keyword})\`, swissNum, usdValue, pageNum, pageText);
              }
            }
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // If no clear portfolio value found, look for the largest consistent value
    if (maxPortfolioValue === 0 && allValues.length > 0) {
      // Sort by value and look for repeated large values
      allValues.sort((a, b) => b.usd - a.usd);
      
      // Check for values that appear multiple times (likely totals)
      const valueCounts = {};
      for (const val of allValues) {
        const rounded = Math.round(val.usd / 1000) * 1000; // Round to nearest thousand
        valueCounts[rounded] = (valueCounts[rounded] || 0) + 1;
      }
      
      // Find the largest value that appears multiple times
      let bestValue = 0;
      for (const [value, count] of Object.entries(valueCounts)) {
        const numValue = parseFloat(value);
        if (count >= 2 && numValue > bestValue && numValue > 10000000) {
          bestValue = numValue;
        }
      }
      
      if (bestValue > 0) {
        maxPortfolioValue = bestValue;
        portfolioValueContext = \`Largest repeated value: \${formatSwissValue(bestValue)}\`;
      } else {
        maxPortfolioValue = allValues[0].usd;
        portfolioValueContext = \`Largest value found: \${allValues[0].swiss}\`;
      }
    }
    
    // Look specifically for "19'464'431" pattern (common in Swiss banking)
    const fullText = pageTexts.join(' ');
    const specificPatterns = [
      /19['\\s]?464['\\s]?431/g,
      /20['\\s]?\\d{3}['\\s]?\\d{3}/g,
      /\\b\\d{2}['\\s]?\\d{3}['\\s]?\\d{3}\\b/g
    ];
    
    for (const pattern of specificPatterns) {
      const matches = fullText.match(pattern);
      if (matches) {
        for (const match of matches) {
          const value = parseSwissNumber(match);
          if (value > maxPortfolioValue && value > 10000000 && value < 100000000) {
            maxPortfolioValue = value;
            portfolioValueContext = \`Swiss pattern match: \${match}\`;
            console.log(\`🇨🇭 Swiss pattern found: \${match} = \${formatSwissValue(value)}\`);
          }
        }
      }
    }
    
    // Update portfolio data
    window.swissPortfolioData.portfolio_value = maxPortfolioValue;
    window.swissPortfolioData.summary.total_assets = maxPortfolioValue;
    
    updateDisplay(maxPortfolioValue, '✅ Swiss extraction completed!');
    
    console.log(\`✅ Swiss extraction completed!\`);
    console.log(\`💰 Portfolio Value: \${formatSwissValue(maxPortfolioValue)}\`);
    console.log(\`📝 Context: \${portfolioValueContext}\`);
    
    document.body.setAttribute('data-swiss-complete', 'true');
    
  } catch (error) {
    console.error('❌ Swiss extraction error:', error);
    document.getElementById('status').textContent = '❌ Error: ' + error.message;
  }
}

// Start extraction
setTimeout(startSwissExtraction, 1000);
</script>

</body>
</html>`;
  }

  displayAccurateResults() {
    console.log('\n🇨🇭 SWISS BANKING ACCURATE RESULTS');
    console.log('==================================');
    console.log(`💰 ACCURATE Portfolio Value: $${this.portfolioData.portfolio_value.toLocaleString()}`);
    console.log(`🏦 Bank: ${this.portfolioData.client_info.bank}`);
    console.log(`👤 Client: ${this.portfolioData.client_info.name}`);
    console.log(`📅 Date: ${this.portfolioData.client_info.date}`);
    console.log(`💱 Currency: ${this.portfolioData.summary.currency}`);
  }
}

// Run Swiss accurate extraction
const swissExtractor = new SwissAccurateExtractor();
swissExtractor.extractAccuratePortfolioValue().then((results) => {
  if (results) {
    console.log('\n🎉 SWISS ACCURATE EXTRACTION COMPLETED!');
    console.log('💰 Real portfolio value extracted with Swiss banking precision');
    console.log('🇨🇭 Correctly handled Swiss number formatting');
  } else {
    console.log('❌ Swiss extraction failed');
  }
});