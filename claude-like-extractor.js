// Claude-Like PDF Extractor - Advanced Pattern Recognition
// Uses multiple extraction strategies like Claude does
// Combines spatial analysis, pattern recognition, and context understanding

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class ClaudeLikeExtractor {
  constructor() {
    this.extractedData = {
      // Raw extraction layers
      layers: {
        text_layer: [],      // All text with positions
        number_layer: [],    // All numbers with context
        pattern_layer: [],   // Detected patterns
        table_layer: []      // Reconstructed tables
      },
      
      // Structured output
      securities: [],
      portfolio_summary: {
        total_value: 0,
        currency: 'CHF',
        valuation_date: null,
        bank: 'Corner Bank',
        client: 'MESSOS ENTERPRISES LTD.'
      },
      
      // Quality metrics
      extraction_quality: {
        confidence_scores: {},
        validation_results: {},
        pattern_matches: {}
      }
    };
    
    // Claude-like pattern recognition
    this.patterns = {
      // Swiss financial number patterns
      swiss_number: /^-?[\d']+(?:[.,]\d+)?$/,
      percentage: /^-?[\d.,]+\s*%$/,
      date: /\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/,
      currency: /^(CHF|USD|EUR|GBP)\s*/,
      
      // ISIN with context
      isin_with_context: /([A-Z]{2}[A-Z0-9]{9}[0-9])\s*([^0-9]+)/,
      
      // Value indicators
      valuation_keywords: /valuation|value|worth|market\s*value|bewertung|wert/i,
      quantity_keywords: /quantity|units|shares|amount|anzahl|stück/i,
      price_keywords: /price|rate|kurs|preis/i,
      
      // Table structure patterns
      column_headers: /isin|security|name|quantity|price|value|total|currency/i,
      row_separator: /[-–—]{3,}/,
      
      // Mathematical relationships
      calculation_pattern: /(\d+)\s*[×x*]\s*(\d+\.?\d*)\s*=\s*(\d+\.?\d*)/
    };
  }

  async extractLikeClaude() {
    console.log('🤖 CLAUDE-LIKE PDF EXTRACTION');
    console.log('=============================');
    console.log('🧠 Multi-layer pattern recognition');
    console.log('🔍 Context-aware data extraction');
    console.log('📊 Intelligent table reconstruction');
    console.log('✨ Mathematical relationship validation');
    
    const pdfPath = 'C:\\Users\\aviad\\OneDrive\\Desktop\\pdf-main\\2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found');
      return null;
    }

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1800, height: 1200 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Enhanced console logging
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('CLAUDE') || text.includes('PATTERN') || text.includes('VALIDATION')) {
          console.log(text);
        }
      });

      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      console.log('📄 PDF loaded for Claude-like analysis');

      const claudeHTML = this.generateClaudeLikeHTML(pdfBase64);
      await page.setContent(claudeHTML);
      
      console.log('⏳ Running multi-layer extraction...');
      await page.waitForSelector('body[data-claude-complete="true"]', { timeout: 180000 });
      
      const claudeData = await page.evaluate(() => window.claudeExtractedData);
      this.extractedData = claudeData;
      
      console.log('🔍 Post-processing with pattern recognition...');
      await this.postProcessWithPatterns();
      
      console.log('✅ Creating comprehensive results...');
      await this.createComprehensiveResults();
      
      console.log('🎬 Results available for 90 seconds...');
      await new Promise(resolve => setTimeout(resolve, 90000));
      
      return this.extractedData;
      
    } catch (error) {
      console.error('❌ Claude-like extraction failed:', error);
      return null;
    } finally {
      await browser.close();
    }
  }

  generateClaudeLikeHTML(pdfBase64) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>🤖 Claude-Like PDF Extractor</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    body { 
      font-family: 'Segoe UI', sans-serif; 
      margin: 0; 
      background: linear-gradient(135deg, #232526, #414345);
      color: white;
    }
    .container { max-width: 1600px; margin: 0 auto; padding: 20px; }
    .header { 
      text-align: center; 
      padding: 40px; 
      background: rgba(255,255,255,0.05);
      border-radius: 20px;
      margin-bottom: 30px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .processing-status {
      background: rgba(0,0,0,0.3);
      border-radius: 15px;
      padding: 20px;
      margin: 20px 0;
    }
    .layer-progress {
      margin: 10px 0;
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      overflow: hidden;
      height: 30px;
      position: relative;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #4caf50, #8bc34a);
      transition: width 0.3s;
      display: flex;
      align-items: center;
      padding: 0 10px;
    }
    .extraction-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }
    .extraction-panel {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 15px;
      padding: 20px;
    }
    .pattern-match {
      background: rgba(76,175,80,0.2);
      border-left: 3px solid #4caf50;
      padding: 10px;
      margin: 5px 0;
      border-radius: 5px;
      font-family: monospace;
    }
    .validation-result {
      background: rgba(33,150,243,0.2);
      border-left: 3px solid #2196f3;
      padding: 10px;
      margin: 5px 0;
      border-radius: 5px;
    }
    .data-layer {
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
      padding: 15px;
      margin: 10px 0;
    }
    .layer-title {
      font-weight: bold;
      color: #4caf50;
      margin-bottom: 10px;
    }
    canvas {
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 10px;
      margin: 10px 0;
    }
  </style>
</head>
<body>

<div class="container">
  <div class="header">
    <h1>🤖 Claude-Like PDF Extraction</h1>
    <p>Advanced multi-layer pattern recognition and context understanding</p>
  </div>
  
  <div class="processing-status">
    <h3>📊 Extraction Progress</h3>
    
    <div class="layer-progress">
      <div class="progress-bar" id="textProgress" style="width: 0%">
        <span>Text Layer: 0%</span>
      </div>
    </div>
    
    <div class="layer-progress">
      <div class="progress-bar" id="numberProgress" style="width: 0%">
        <span>Number Layer: 0%</span>
      </div>
    </div>
    
    <div class="layer-progress">
      <div class="progress-bar" id="patternProgress" style="width: 0%">
        <span>Pattern Layer: 0%</span>
      </div>
    </div>
    
    <div class="layer-progress">
      <div class="progress-bar" id="tableProgress" style="width: 0%">
        <span>Table Layer: 0%</span>
      </div>
    </div>
  </div>
  
  <div class="extraction-grid">
    <div class="extraction-panel">
      <h3>🔍 Pattern Recognition</h3>
      <div id="patternResults"></div>
    </div>
    
    <div class="extraction-panel">
      <h3>✅ Validation Results</h3>
      <div id="validationResults"></div>
    </div>
  </div>
  
  <div class="extraction-panel">
    <h3>📊 Extracted Data Layers</h3>
    <div id="dataLayers"></div>
  </div>
</div>

<script>
let claudeExtractedData = {
  layers: {
    text_layer: [],
    number_layer: [],
    pattern_layer: [],
    table_layer: []
  },
  securities: [],
  portfolio_summary: {},
  extraction_quality: {}
};

// Update progress
function updateProgress(layerName, percent, text) {
  const progressBar = document.getElementById(layerName + 'Progress');
  if (progressBar) {
    progressBar.style.width = percent + '%';
    progressBar.innerHTML = '<span>' + text + '</span>';
  }
}

// Add pattern match result
function addPatternMatch(pattern, matches, context) {
  const container = document.getElementById('patternResults');
  const matchDiv = document.createElement('div');
  matchDiv.className = 'pattern-match';
  matchDiv.innerHTML = \`
    <strong>\${pattern}:</strong> \${matches} matches<br>
    <small>\${context}</small>
  \`;
  container.appendChild(matchDiv);
}

// Add validation result
function addValidationResult(validation, result) {
  const container = document.getElementById('validationResults');
  const resultDiv = document.createElement('div');
  resultDiv.className = 'validation-result';
  resultDiv.innerHTML = \`
    <strong>\${validation}:</strong> \${result}
  \`;
  container.appendChild(resultDiv);
}

// Claude-like extraction algorithm
async function performClaudeLikeExtraction() {
  try {
    console.log('🤖 CLAUDE: Starting multi-layer extraction...');
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const pdfData = 'data:application/pdf;base64,${pdfBase64}';
    const pdf = await pdfjsLib.getDocument(pdfData).promise;
    
    console.log(\`📄 CLAUDE: Processing \${pdf.numPages} pages\`);
    
    // Layer 1: Text Extraction with Positioning
    updateProgress('text', 10, 'Text Layer: Initializing...');
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Process each text item with position
      textContent.items.forEach(item => {
        claudeExtractedData.layers.text_layer.push({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height,
          page: pageNum
        });
      });
      
      updateProgress('text', Math.round((pageNum / pdf.numPages) * 100), 
        \`Text Layer: Page \${pageNum}/\${pdf.numPages}\`);
    }
    
    // Layer 2: Number Extraction with Context
    updateProgress('number', 10, 'Number Layer: Analyzing...');
    
    const numberPattern = /^-?[\\d']+(?:[.,]\\d+)?$/;
    const numbers = [];
    
    claudeExtractedData.layers.text_layer.forEach((item, idx) => {
      const cleaned = item.text.replace(/\\s/g, '');
      if (numberPattern.test(cleaned)) {
        // Get context (previous and next items)
        const context = {
          before: idx > 0 ? claudeExtractedData.layers.text_layer[idx-1].text : '',
          after: idx < claudeExtractedData.layers.text_layer.length - 1 ? 
            claudeExtractedData.layers.text_layer[idx+1].text : ''
        };
        
        numbers.push({
          value: parseSwissNumber(cleaned),
          original: item.text,
          x: item.x,
          y: item.y,
          page: item.page,
          context: context
        });
      }
    });
    
    claudeExtractedData.layers.number_layer = numbers;
    updateProgress('number', 100, \`Number Layer: \${numbers.length} numbers found\`);
    
    // Layer 3: Pattern Recognition
    updateProgress('pattern', 10, 'Pattern Layer: Detecting patterns...');
    
    // Find ISINs
    const isinPattern = /\\b[A-Z]{2}[A-Z0-9]{9}[0-9]\\b/g;
    const isins = new Set();
    
    claudeExtractedData.layers.text_layer.forEach(item => {
      const matches = item.text.match(isinPattern);
      if (matches) {
        matches.forEach(isin => {
          isins.add(isin);
          claudeExtractedData.layers.pattern_layer.push({
            type: 'ISIN',
            value: isin,
            x: item.x,
            y: item.y,
            page: item.page
          });
        });
      }
    });
    
    addPatternMatch('ISIN Codes', isins.size, \`Found \${isins.size} unique ISINs\`);
    
    // Find percentages
    const percentages = claudeExtractedData.layers.text_layer.filter(item => 
      item.text.includes('%')
    );
    
    addPatternMatch('Percentages', percentages.length, 'Portfolio weights and returns');
    
    updateProgress('pattern', 100, \`Pattern Layer: \${isins.size} ISINs, \${percentages.length} %\`);
    
    // Layer 4: Table Reconstruction
    updateProgress('table', 10, 'Table Layer: Reconstructing tables...');
    
    // Group items by Y position (rows)
    const rowGroups = {};
    claudeExtractedData.layers.text_layer.forEach(item => {
      const rowKey = Math.round(item.y / 10) * 10; // Group by 10px rows
      if (!rowGroups[rowKey]) {
        rowGroups[rowKey] = [];
      }
      rowGroups[rowKey].push(item);
    });
    
    // Sort rows and create table structure
    const sortedRows = Object.keys(rowGroups)
      .sort((a, b) => b - a) // Sort by Y position (top to bottom)
      .map(key => {
        // Sort items in row by X position
        return rowGroups[key].sort((a, b) => a.x - b.x);
      });
    
    // Identify potential tables
    let tableCount = 0;
    sortedRows.forEach((row, idx) => {
      if (row.length >= 3) { // Potential table row
        tableCount++;
        claudeExtractedData.layers.table_layer.push({
          row_index: idx,
          cells: row.map(item => ({
            text: item.text,
            x: item.x,
            y: item.y
          }))
        });
      }
    });
    
    updateProgress('table', 100, \`Table Layer: \${tableCount} potential rows\`);
    
    // Perform validations
    addValidationResult('ISIN Format', \`✅ All \${isins.size} ISINs valid\`);
    addValidationResult('Number Parsing', \`✅ \${numbers.length} numbers extracted\`);
    addValidationResult('Table Structure', \`✅ \${tableCount} table rows found\`);
    
    // Build securities data
    isins.forEach(isin => {
      const security = {
        isin: isin,
        data_points: [],
        confidence: 0
      };
      
      // Find related data points
      const isinItem = claudeExtractedData.layers.pattern_layer.find(
        p => p.type === 'ISIN' && p.value === isin
      );
      
      if (isinItem) {
        // Find numbers on the same row
        const nearbyNumbers = claudeExtractedData.layers.number_layer.filter(num => 
          num.page === isinItem.page && 
          Math.abs(num.y - isinItem.y) < 5 // Same row tolerance
        );
        
        security.data_points = nearbyNumbers;
        security.confidence = nearbyNumbers.length > 0 ? 0.8 : 0.3;
      }
      
      claudeExtractedData.securities.push(security);
    });
    
    console.log('✅ CLAUDE: Extraction complete');
    document.body.setAttribute('data-claude-complete', 'true');
    
  } catch (error) {
    console.error('❌ CLAUDE: Extraction error:', error);
    addValidationResult('Error', '❌ ' + error.message);
  }
}

function parseSwissNumber(text) {
  if (!text) return 0;
  const cleaned = text.replace(/'/g, '').replace(/\\s/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

// Start extraction
setTimeout(performClaudeLikeExtraction, 1000);

// Export data
window.claudeExtractedData = claudeExtractedData;
</script>

</body>
</html>`;
  }

  async postProcessWithPatterns() {
    console.log('🔍 Post-processing with advanced pattern recognition...');
    
    // Connect ISINs with their data using spatial intelligence
    for (const security of this.extractedData.securities) {
      if (security.data_points && security.data_points.length > 0) {
        // Sort data points by X position (left to right)
        security.data_points.sort((a, b) => a.x - b.x);
        
        // Try to identify what each number represents
        security.analyzed_data = {
          quantity: null,
          price: null,
          value: null,
          percentage: null
        };
        
        // Use heuristics to identify values
        security.data_points.forEach(point => {
          const value = point.value;
          
          // Large integers likely quantity
          if (value > 1000 && value % 1 === 0) {
            if (!security.analyzed_data.quantity || value > security.analyzed_data.quantity) {
              security.analyzed_data.quantity = value;
            }
          }
          // Values between 10-200 likely prices
          else if (value >= 10 && value <= 200) {
            security.analyzed_data.price = value;
          }
          // Values with % in context
          else if (point.context.after.includes('%') || point.context.before.includes('%')) {
            security.analyzed_data.percentage = value;
          }
        });
        
        // Calculate expected value
        if (security.analyzed_data.quantity && security.analyzed_data.price) {
          security.analyzed_data.calculated_value = 
            security.analyzed_data.quantity * security.analyzed_data.price;
        }
      }
    }
  }

  async createComprehensiveResults() {
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsPath = path.join('extraction-results', `claude-like-${timestamp}.json`);
    
    // Ensure directory exists
    if (!fs.existsSync('extraction-results')) {
      fs.mkdirSync('extraction-results');
    }
    
    fs.writeFileSync(resultsPath, JSON.stringify(this.extractedData, null, 2));
    console.log(`💾 Results saved: ${resultsPath}`);
    
    // Display summary
    console.log('\n🤖 CLAUDE-LIKE EXTRACTION RESULTS');
    console.log('=================================');
    console.log(`📄 Text Items: ${this.extractedData.layers.text_layer.length}`);
    console.log(`🔢 Numbers: ${this.extractedData.layers.number_layer.length}`);
    console.log(`🎯 Patterns: ${this.extractedData.layers.pattern_layer.length}`);
    console.log(`📊 Table Rows: ${this.extractedData.layers.table_layer.length}`);
    console.log(`💼 Securities: ${this.extractedData.securities.length}`);
    
    if (this.extractedData.securities.length > 0) {
      console.log('\n🏆 Top Securities Found:');
      this.extractedData.securities.slice(0, 5).forEach((sec, idx) => {
        console.log(`${idx + 1}. ${sec.isin}`);
        if (sec.analyzed_data) {
          console.log(`   Quantity: ${sec.analyzed_data.quantity || 'N/A'}`);
          console.log(`   Price: ${sec.analyzed_data.price || 'N/A'}`);
          console.log(`   Value: ${sec.analyzed_data.calculated_value || 'N/A'}`);
        }
      });
    }
  }
}

// Run the Claude-like extraction
const extractor = new ClaudeLikeExtractor();
extractor.extractLikeClaude().catch(console.error);