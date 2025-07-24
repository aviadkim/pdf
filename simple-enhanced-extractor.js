// Simple Enhanced PDF Extractor with Visual Demo
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class SimpleEnhancedExtractor {
  constructor() {
    this.results = {
      metadata: {},
      all_text: [],
      all_numbers: [],
      all_isins: [],
      securities: [],
      tables: []
    };
  }

  async extract(pdfPath) {
    console.log('🎯 SIMPLE ENHANCED EXTRACTOR');
    console.log('============================');
    console.log(`📄 Processing: ${path.basename(pdfPath)}`);
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found:', pdfPath);
      return null;
    }

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1600, height: 1000 },
      args: ['--no-sandbox']
    });

    try {
      const page = await browser.newPage();
      page.on('console', msg => console.log('🔍', msg.text()));

      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      console.log(`📊 File size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Enhanced PDF Extractor Demo</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #111; color: #0f0; }
    .container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px; height: 100vh; }
    .pdf-section { background: rgba(255,255,255,0.95); color: #333; padding: 20px; overflow-y: auto; border-radius: 10px; }
    .results-section { background: rgba(0,0,0,0.9); color: #0f0; padding: 20px; overflow-y: auto; border: 1px solid #0f0; border-radius: 10px; }
    .status { background: rgba(0,255,0,0.1); padding: 10px; margin: 5px 0; border-left: 3px solid #0f0; }
    .security { background: rgba(0,255,0,0.05); border: 1px solid #0f0; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .isin { color: #ff6b6b; font-weight: bold; font-family: monospace; }
    .amount { color: #4ecdc4; font-weight: bold; }
    .page-canvas { width: 100%; margin: 10px 0; border: 1px solid #ddd; }
    .data-overlay { position: absolute; background: rgba(255,0,0,0.7); color: white; padding: 2px 5px; font-size: 10px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="pdf-section">
      <h2>📄 PDF Document</h2>
      <div id="pdfContainer"></div>
    </div>
    <div class="results-section">
      <h2>🎯 Extraction Results</h2>
      <div id="statusContainer"></div>
      <div id="resultsContainer"></div>
    </div>
  </div>

  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const results = {
      metadata: {},
      all_text: [],
      all_numbers: [],
      all_isins: [],
      securities: [],
      tables: []
    };

    function addStatus(msg) {
      const container = document.getElementById('statusContainer');
      const div = document.createElement('div');
      div.className = 'status';
      div.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
      console.log('Status:', msg);
    }

    async function startExtraction() {
      addStatus('🚀 Starting enhanced extraction...');
      
      try {
        const pdfData = atob('${pdfBase64}');
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        
        results.metadata = {
          pages: pdf.numPages,
          fingerprint: pdf.fingerprints?.[0] || 'unknown'
        };

        addStatus('📄 PDF loaded: ' + pdf.numPages + ' pages');

        // Process each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          addStatus('🔍 Processing page ' + pageNum + '/' + pdf.numPages);
          await processPage(pdf, pageNum);
          await renderPage(pdf, pageNum);
        }

        addStatus('🧠 Analyzing relationships...');
        analyzeData();
        
        addStatus('📊 Building tables...');
        buildTables();
        
        addStatus('✅ Extraction completed!');
        displayResults();
        
        document.body.setAttribute('data-complete', 'true');
        window.extractionResults = results;
        
      } catch (error) {
        addStatus('❌ Error: ' + error.message);
        console.error(error);
      }
    }

    async function processPage(pdf, pageNum) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      textContent.items.forEach(item => {
        if (item.str && item.str.trim()) {
          const text = item.str.trim();
          
          results.all_text.push({
            text: text,
            x: Math.round(item.transform[4]),
            y: Math.round(item.transform[5]),
            page: pageNum
          });

          // Enhanced ISIN detection
          const isinPattern = /[A-Z]{2}[A-Z0-9]{9}[0-9]/g;
          let match;
          while ((match = isinPattern.exec(text)) !== null) {
            if (validateISIN(match[0])) {
              results.all_isins.push({
                isin: match[0],
                page: pageNum,
                x: Math.round(item.transform[4]),
                y: Math.round(item.transform[5]),
                context: text
              });
            }
          }

          // Enhanced number detection
          const numberPatterns = [
            /^-?\\d{1,3}(?:'\\d{3})*(?:[.,]\\d+)?$/,   // Swiss format
            /^-?\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?$/,    // US format
            /^-?\\d+[.,]\\d+$/,                        // Decimal
            /^-?\\d+$/                                 // Integer
          ];

          numberPatterns.forEach(pattern => {
            if (pattern.test(text)) {
              let cleanNum = text.replace(/'/g, '').replace(/,/g, '');
              if (text.includes(',') && text.includes('.') && text.lastIndexOf(',') > text.lastIndexOf('.')) {
                cleanNum = text.replace(/\\./g, '').replace(',', '.');
              }
              
              const parsed = parseFloat(cleanNum);
              if (!isNaN(parsed) && Math.abs(parsed) > 0) {
                results.all_numbers.push({
                  original: text,
                  parsed: parsed,
                  page: pageNum,
                  x: Math.round(item.transform[4]),
                  y: Math.round(item.transform[5]),
                  magnitude: getMagnitude(parsed)
                });
              }
            }
          });
        }
      });
    }

    function validateISIN(isin) {
      if (isin.length !== 12) return false;
      const countryCode = isin.substring(0, 2);
      return /^[A-Z]{2}$/.test(countryCode);
    }

    function getMagnitude(num) {
      const abs = Math.abs(num);
      if (abs > 1000000) return 'large';
      if (abs > 10000) return 'medium';
      if (abs > 100) return 'small';
      return 'tiny';
    }

    function analyzeData() {
      // Map ISINs to nearby numbers
      results.all_isins.forEach(isin => {
        const security = {
          isin: isin.isin,
          page: isin.page,
          position: { x: isin.x, y: isin.y },
          relatedNumbers: [],
          marketValue: null,
          description: ''
        };

        // Find numbers within 100 pixels
        results.all_numbers.forEach(num => {
          if (num.page === isin.page) {
            const distance = Math.sqrt(Math.pow(num.x - isin.x, 2) + Math.pow(num.y - isin.y, 2));
            if (distance <= 100) {
              security.relatedNumbers.push(num);
              if (num.magnitude === 'large' && (!security.marketValue || num.parsed > security.marketValue)) {
                security.marketValue = num.parsed;
              }
            }
          }
        });

        // Find description
        results.all_text.forEach(textItem => {
          if (textItem.page === isin.page && textItem.text.length > 10) {
            const distance = Math.sqrt(Math.pow(textItem.x - isin.x, 2) + Math.pow(textItem.y - isin.y, 2));
            if (distance <= 150 && !isNumberOrISIN(textItem.text)) {
              if (!security.description || textItem.text.length > security.description.length) {
                security.description = textItem.text;
              }
            }
          }
        });

        results.securities.push(security);
      });
    }

    function isNumberOrISIN(text) {
      return /^[\\d'.,%-]+$/.test(text) || /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(text);
    }

    function buildTables() {
      // Securities table
      results.tables.push({
        name: 'Securities Overview',
        headers: ['ISIN', 'Description', 'Market Value', 'Page'],
        data: results.securities.map(sec => [
          sec.isin,
          sec.description || 'N/A',
          formatCurrency(sec.marketValue),
          sec.page
        ])
      });

      // Numbers table
      results.tables.push({
        name: 'All Numbers',
        headers: ['Original', 'Parsed', 'Magnitude', 'Page'],
        data: results.all_numbers.map(num => [
          num.original,
          num.parsed.toLocaleString(),
          num.magnitude,
          num.page
        ])
      });
    }

    async function renderPage(pdf, pageNum) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.6 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.className = 'page-canvas';
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      const pageDiv = document.createElement('div');
      pageDiv.style.position = 'relative';
      pageDiv.style.marginBottom = '20px';
      
      const pageHeader = document.createElement('h3');
      pageHeader.textContent = 'Page ' + pageNum;
      pageDiv.appendChild(pageHeader);
      pageDiv.appendChild(canvas);
      
      document.getElementById('pdfContainer').appendChild(pageDiv);
    }

    function displayResults() {
      const container = document.getElementById('resultsContainer');
      
      let html = '<h3>📊 Extraction Summary</h3>';
      html += '<div class="status">';
      html += '<p>Pages: ' + results.metadata.pages + '</p>';
      html += '<p>Text Items: ' + results.all_text.length + '</p>';
      html += '<p>Numbers: ' + results.all_numbers.length + '</p>';
      html += '<p>ISIN Codes: ' + results.all_isins.length + '</p>';
      html += '<p>Securities: ' + results.securities.length + '</p>';
      html += '</div>';
      
      if (results.securities.length > 0) {
        html += '<h4>🏦 Securities Found</h4>';
        results.securities.forEach(sec => {
          html += '<div class="security">';
          html += '<div><span class="isin">' + sec.isin + '</span> (Page ' + sec.page + ')</div>';
          if (sec.description) html += '<div>Description: ' + sec.description + '</div>';
          if (sec.marketValue) html += '<div>Value: <span class="amount">' + formatCurrency(sec.marketValue) + '</span></div>';
          html += '<div>Related Numbers: ' + sec.relatedNumbers.length + '</div>';
          html += '</div>';
        });
      }
      
      html += '<h4>📋 Available Tables (' + results.tables.length + ')</h4>';
      results.tables.forEach(table => {
        html += '<div class="status">';
        html += '<h5>' + table.name + '</h5>';
        html += '<p>Columns: ' + table.headers.join(', ') + '</p>';
        html += '<p>Rows: ' + table.data.length + '</p>';
        html += '</div>';
      });
      
      container.innerHTML = html;
    }

    function formatCurrency(amount) {
      if (!amount || isNaN(amount)) return 'N/A';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      }).format(amount);
    }

    // Start extraction
    startExtraction();
  </script>
</body>
</html>`;

      await page.setContent(html);
      
      console.log('⏳ Running enhanced extraction with visual demo...');
      await page.waitForSelector('body[data-complete="true"]', { timeout: 60000 });
      
      const data = await page.evaluate(() => window.extractionResults);
      this.results = data;
      
      this.displayResults();
      await this.saveResults();
      
      console.log('\n🎬 Browser demo will stay open for 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Extraction failed:', error);
      return null;
    } finally {
      await browser.close();
    }
  }

  displayResults() {
    console.log('\n🎯 ENHANCED EXTRACTION RESULTS');
    console.log('==============================');
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Pages: ${this.results.metadata.pages}`);
    console.log(`   Text Items: ${this.results.all_text.length}`);
    console.log(`   Numbers: ${this.results.all_numbers.length}`);
    console.log(`   ISIN Codes: ${this.results.all_isins.length}`);
    console.log(`   Securities: ${this.results.securities.length}`);
    
    if (this.results.securities.length > 0) {
      console.log('\n🏦 SECURITIES WITH MAPPED DATA:');
      this.results.securities.forEach((sec, i) => {
        console.log(`   ${i + 1}. ${sec.isin} (Page ${sec.page})`);
        if (sec.description) {
          console.log(`      Desc: ${sec.description.substring(0, 50)}...`);
        }
        if (sec.marketValue) {
          console.log(`      Value: ${this.formatCurrency(sec.marketValue)}`);
        }
        console.log(`      Related Numbers: ${sec.relatedNumbers.length}`);
      });
    }
    
    console.log('\n📋 BUILDABLE TABLES:');
    this.results.tables.forEach((table, i) => {
      console.log(`   ${i + 1}. ${table.name} (${table.data.length} rows)`);
      console.log(`      Columns: ${table.headers.join(', ')}`);
    });
  }

  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = './extraction-results';
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save JSON
    const jsonPath = path.join(outputDir, `enhanced-simple-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));
    
    // Save CSV tables
    const csvPaths = [];
    this.results.tables.forEach((table, i) => {
      const csvPath = path.join(outputDir, `table-${table.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.csv`);
      const csv = table.headers.join(',') + '\n' + 
                  table.data.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      fs.writeFileSync(csvPath, csv);
      csvPaths.push(csvPath);
    });
    
    console.log(`\n💾 Results saved:`);
    console.log(`   JSON: ${jsonPath}`);
    csvPaths.forEach(path => console.log(`   CSV: ${path}`));
  }

  formatCurrency(amount) {
    if (!amount || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node simple-enhanced-extractor.js <pdf-path>');
    return;
  }
  
  const extractor = new SimpleEnhancedExtractor();
  const result = await extractor.extract(args[0]);
  
  if (result) {
    console.log('\n🎉 Enhanced extraction completed successfully!');
  }
}

if (process.argv[1] && process.argv[1].includes('simple-enhanced-extractor.js')) {
  main().catch(console.error);
}

export default SimpleEnhancedExtractor;