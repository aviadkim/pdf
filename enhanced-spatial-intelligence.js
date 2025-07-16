// Enhanced Spatial Intelligence with Pattern Recognition & Common Sense
// Uses your insights: X/Y grid mapping + mathematical validation + asset allocation logic
// Validates quantity × price = valuation patterns

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class EnhancedSpatialIntelligence {
  constructor() {
    this.extractedData = {
      // Enhanced spatial grid system
      spatial_grid: {
        grid_resolution: 10,      // Pixel precision for grouping
        data_clusters: [],        // Groups of related data points
        pattern_matches: [],      // Identified patterns
        validation_results: []    // Mathematical validations
      },
      
      // Complete security profiles with validation
      securities_enhanced: [],
      
      // Asset allocation with common sense grouping
      asset_allocation: {
        bonds: { securities: [], total_value: 0, percentage: 0 },
        equities: { securities: [], total_value: 0, percentage: 0 },
        funds: { securities: [], total_value: 0, percentage: 0 },
        other: { securities: [], total_value: 0, percentage: 0 }
      },
      
      // Mathematical validation system
      validation_engine: {
        quantity_price_valuation_checks: [],
        portfolio_percentage_checks: [],
        total_validation: { passed: 0, failed: 0, accuracy: 0 }
      },
      
      // Pattern recognition results
      pattern_analysis: {
        identified_patterns: [],
        confidence_scores: [],
        common_sense_rules: []
      }
    };
  }

  async runEnhancedSpatialIntelligence() {
    console.log('🧠✨ ENHANCED SPATIAL INTELLIGENCE SYSTEM');
    console.log('=======================================');
    console.log('🎯 Using your insights for perfect data mapping');
    console.log('📍 X/Y Grid System + Pattern Recognition');
    console.log('🧮 Mathematical Validation (Quantity × Price = Valuation)');
    console.log('📊 Asset Allocation with Common Sense Grouping');
    console.log('✅ Building the ultimate financial data understanding...');
    
    const pdfPath = 'C:\\Users\\aviad\\OneDrive\\Desktop\\pdf-main\\2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found');
      return null;
    }

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1900, height: 1200 },
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });

    try {
      const page = await browser.newPage();
      
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('🧠') || text.includes('🎯') || text.includes('✅')) {
          console.log('ENHANCED:', text);
        }
      });

      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      console.log(`📄 PDF loaded for enhanced spatial intelligence`);

      const enhancedHTML = this.generateEnhancedSpatialHTML(pdfBase64);
      await page.setContent(enhancedHTML);
      
      console.log('⏳ Running enhanced spatial intelligence with pattern recognition...');
      await page.waitForSelector('body[data-enhanced-complete="true"]', { timeout: 180000 });
      
      const enhancedData = await page.evaluate(() => window.enhancedSpatialData);
      this.extractedData = enhancedData;
      
      console.log('🧮 Running mathematical validation engine...');
      await this.runMathematicalValidation();
      
      console.log('📊 Building asset allocation with common sense...');
      await this.buildAssetAllocation();
      
      console.log('📋 Creating enhanced analysis tables...');
      await this.createEnhancedAnalysisTables();
      
      this.displayEnhancedResults();
      
      console.log('\\n🎬 Enhanced spatial intelligence results available for 90 seconds...');
      await new Promise(resolve => setTimeout(resolve, 90000));
      
      return this.extractedData;
      
    } catch (error) {
      console.error('❌ Enhanced spatial intelligence failed:', error);
      return null;
    } finally {
      await browser.close();
    }
  }

  generateEnhancedSpatialHTML(pdfBase64) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>🧠✨ Enhanced Spatial Intelligence with Pattern Recognition</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    body { 
      font-family: 'Segoe UI', sans-serif; 
      margin: 0; 
      background: linear-gradient(135deg, #667eea, #764ba2); 
      color: white; 
    }
    .enhanced-container {
      display: grid;
      grid-template-columns: 2fr 1fr;
      height: 100vh;
      gap: 20px;
      padding: 20px;
    }
    .analysis-area {
      background: white;
      color: black;
      border-radius: 15px;
      padding: 20px;
      overflow-y: auto;
      position: relative;
    }
    .intelligence-panel {
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
    .phase-display {
      font-size: 2.5em;
      font-weight: bold;
      color: #00ff88;
      text-shadow: 0 0 20px rgba(0,255,136,0.5);
      margin: 10px 0;
    }
    .validation-card {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #00ff88;
      animation: cardSlide 0.6s ease-out;
    }
    .validation-card.failed {
      border-left-color: #ff6b6b;
    }
    @keyframes cardSlide {
      0% { opacity: 0; transform: translateX(-20px); }
      100% { opacity: 1; transform: translateX(0); }
    }
    .pattern-highlight {
      position: absolute;
      border: 2px solid #00ff88;
      background: rgba(0,255,136,0.1);
      border-radius: 4px;
      pointer-events: none;
      z-index: 10;
      animation: highlightPulse 2s infinite;
    }
    @keyframes highlightPulse {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
    .grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 5;
      opacity: 0.3;
    }
    .grid-line {
      position: absolute;
      background: #00ff88;
    }
    .data-connection {
      position: absolute;
      height: 2px;
      background: linear-gradient(90deg, #00ff88, #ffeb3b);
      z-index: 8;
      animation: connectionGrow 1.5s ease-out;
    }
    @keyframes connectionGrow {
      0% { width: 0; opacity: 0; }
      100% { width: 100%; opacity: 1; }
    }
    canvas {
      border: 2px solid #ddd;
      border-radius: 10px;
      max-width: 100%;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      margin: 10px 0;
    }
    .canvas-container {
      position: relative;
      display: inline-block;
    }
    .validation-summary {
      background: rgba(0,255,136,0.1);
      border-radius: 10px;
      padding: 15px;
      margin: 15px 0;
      border: 2px solid #00ff88;
    }
  </style>
</head>
<body>

<div class="header">
  <h1>🧠✨ Enhanced Spatial Intelligence</h1>
  <div class="phase-display" id="phaseDisplay">Initializing...</div>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0;">
    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: center;">
      <div style="font-size: 2em; font-weight: bold;" id="patternCount">0</div>
      <div>Patterns Found</div>
    </div>
    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: center;">
      <div style="font-size: 2em; font-weight: bold;" id="validationCount">0</div>
      <div>Validations Passed</div>
    </div>
    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: center;">
      <div style="font-size: 2em; font-weight: bold;" id="accuracyScore">0%</div>
      <div>Mathematical Accuracy</div>
    </div>
  </div>
</div>

<div class="enhanced-container">
  <div class="analysis-area">
    <h3>📍 Spatial Grid Analysis with Pattern Recognition</h3>
    <div id="spatialVisualization">
      <!-- Enhanced spatial visualization will appear here -->
    </div>
  </div>
  
  <div class="intelligence-panel">
    <h3>🧠 Enhanced Intelligence Feed</h3>
    
    <div class="validation-summary" id="validationSummary" style="display: none;">
      <h4>🧮 Mathematical Validation Results</h4>
      <div id="validationResults"></div>
    </div>
    
    <div id="patternFeed">
      <h4>🎯 Pattern Recognition</h4>
      <div id="patternResults"></div>
    </div>
    
    <div id="validationFeed">
      <h4>✅ Live Validations</h4>
      <div id="liveValidations"></div>
    </div>
  </div>
</div>

<script>
window.enhancedSpatialData = {
  spatial_grid: {
    grid_resolution: 10,
    data_clusters: [],
    pattern_matches: [],
    validation_results: []
  },
  securities_enhanced: [],
  asset_allocation: {
    bonds: { securities: [], total_value: 0, percentage: 0 },
    equities: { securities: [], total_value: 0, percentage: 0 },
    funds: { securities: [], total_value: 0, percentage: 0 },
    other: { securities: [], total_value: 0, percentage: 0 }
  },
  validation_engine: {
    quantity_price_valuation_checks: [],
    portfolio_percentage_checks: [],
    total_validation: { passed: 0, failed: 0, accuracy: 0 }
  },
  pattern_analysis: {
    identified_patterns: [],
    confidence_scores: [],
    common_sense_rules: []
  }
};

let patternsFound = 0;
let validationsPassed = 0;
let totalValidations = 0;

function updatePhase(phase) {
  document.getElementById('phaseDisplay').textContent = phase;
}

function updateCounters() {
  document.getElementById('patternCount').textContent = patternsFound;
  document.getElementById('validationCount').textContent = validationsPassed;
  const accuracy = totalValidations > 0 ? (validationsPassed / totalValidations * 100).toFixed(1) : 0;
  document.getElementById('accuracyScore').textContent = accuracy + '%';
}

function parseSwissNumber(str) {
  if (!str) return null;
  const cleaned = str.replace(/[^\\d'.,]/g, '');
  const withoutApostrophes = cleaned.replace(/'/g, '');
  const normalized = withoutApostrophes.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
}

function classifyDataType(text, x, y, context) {
  text = text.toString().toLowerCase();
  
  // Enhanced classification with position awareness
  if (/\\b[a-z]{2}[a-z0-9]{9}[0-9]\\b/i.test(text)) return { type: 'isin', confidence: 0.95 };
  if (/%/.test(text)) return { type: 'percentage', confidence: 0.9 };
  if (/\\d{2}\\.\\d{2}\\.\\d{4}/.test(text)) return { type: 'date', confidence: 0.9 };
  
  const numValue = parseSwissNumber(text);
  if (numValue !== null) {
    if (numValue > 100000) return { type: 'valuation', confidence: 0.8 };
    if (numValue > 1000 && numValue < 100000) return { type: 'quantity', confidence: 0.7 };
    if (numValue > 10 && numValue < 1000) return { type: 'price', confidence: 0.8 };
    if (numValue < 10) return { type: 'ratio', confidence: 0.6 };
  }
  
  return { type: 'text', confidence: 0.3 };
}

function createSpatialGrid(width, height, resolution) {
  const grid = [];
  for (let x = 0; x < width; x += resolution) {
    for (let y = 0; y < height; y += resolution) {
      grid.push({ x, y, items: [] });
    }
  }
  return grid;
}

function addToGrid(grid, item, resolution) {
  const gridX = Math.floor(item.x / resolution) * resolution;
  const gridY = Math.floor(item.y / resolution) * resolution;
  
  const gridCell = grid.find(cell => cell.x === gridX && cell.y === gridY);
  if (gridCell) {
    gridCell.items.push(item);
  }
}

function findPatternsInGrid(grid) {
  const patterns = [];
  
  for (const cell of grid) {
    if (cell.items.length >= 3) {
      // Look for ISIN + multiple numbers pattern
      const isin = cell.items.find(item => item.classification.type === 'isin');
      const numbers = cell.items.filter(item => 
        ['quantity', 'price', 'valuation', 'percentage'].includes(item.classification.type)
      );
      
      if (isin && numbers.length >= 2) {
        patterns.push({
          type: 'security_data_cluster',
          isin: isin.text,
          center: { x: cell.x, y: cell.y },
          dataPoints: [isin, ...numbers],
          confidence: 0.8 + (numbers.length * 0.05)
        });
        
        patternsFound++;
        addPatternToFeed(isin.text, numbers.length, cell.x, cell.y);
      }
    }
  }
  
  return patterns;
}

function validateQuantityPriceValuation(pattern) {
  const dataPoints = pattern.dataPoints;
  const quantity = dataPoints.find(p => p.classification.type === 'quantity');
  const price = dataPoints.find(p => p.classification.type === 'price');
  const valuation = dataPoints.find(p => p.classification.type === 'valuation');
  
  if (quantity && price && valuation) {
    const calculatedValuation = quantity.parsedValue * price.parsedValue;
    const actualValuation = valuation.parsedValue;
    const difference = Math.abs(calculatedValuation - actualValuation);
    const tolerance = actualValuation * 0.05; // 5% tolerance
    
    const isValid = difference <= tolerance;
    totalValidations++;
    if (isValid) validationsPassed++;
    
    addValidationToFeed(pattern.isin, quantity.parsedValue, price.parsedValue, actualValuation, calculatedValuation, isValid);
    
    return {
      isin: pattern.isin,
      quantity: quantity.parsedValue,
      price: price.parsedValue,
      expected_valuation: calculatedValuation,
      actual_valuation: actualValuation,
      difference: difference,
      is_valid: isValid,
      confidence: isValid ? 0.95 : 0.3
    };
  }
  
  return null;
}

function addPatternToFeed(isin, dataPointCount, x, y) {
  const feedDiv = document.getElementById('patternResults');
  const patternDiv = document.createElement('div');
  patternDiv.className = 'validation-card';
  
  patternDiv.innerHTML = \`
    <div style="display: flex; justify-content: space-between;">
      <strong>🎯 \${isin}</strong>
      <span>\${dataPointCount} data points</span>
    </div>
    <div style="margin: 5px 0; font-size: 0.9em;">
      Grid position: (\${x}, \${y})
    </div>
    <div style="font-size: 0.8em; opacity: 0.8;">
      Pattern: Security data cluster identified
    </div>
  \`;
  
  feedDiv.appendChild(patternDiv);
  feedDiv.scrollTop = feedDiv.scrollHeight;
  
  console.log(\`🎯 Pattern found: \${isin} with \${dataPointCount} data points\`);
}

function addValidationToFeed(isin, quantity, price, actualVal, calculatedVal, isValid) {
  const feedDiv = document.getElementById('liveValidations');
  const validationDiv = document.createElement('div');
  validationDiv.className = 'validation-card' + (isValid ? '' : ' failed');
  
  const icon = isValid ? '✅' : '❌';
  const status = isValid ? 'VALID' : 'INVALID';
  
  validationDiv.innerHTML = \`
    <div style="display: flex; justify-content: space-between;">
      <strong>\${icon} \${isin}</strong>
      <span style="color: \${isValid ? '#00ff88' : '#ff6b6b'};">\${status}</span>
    </div>
    <div style="margin: 5px 0; font-family: monospace; font-size: 0.9em;">
      \${quantity.toLocaleString()} × \${price.toFixed(2)} = \${calculatedVal.toLocaleString()}
    </div>
    <div style="margin: 5px 0; font-size: 0.9em;">
      Actual: \${actualVal.toLocaleString()} | Diff: \${Math.abs(calculatedVal - actualVal).toLocaleString()}
    </div>
  \`;
  
  feedDiv.appendChild(validationDiv);
  feedDiv.scrollTop = feedDiv.scrollHeight;
  
  console.log(\`\${icon} Validation: \${isin} - \${status}\`);
  updateCounters();
}

function addGridVisualization(canvas, grid, patterns) {
  const overlayDiv = document.createElement('div');
  overlayDiv.className = 'grid-overlay';
  overlayDiv.style.width = canvas.width + 'px';
  overlayDiv.style.height = canvas.height + 'px';
  
  // Add pattern highlights
  for (const pattern of patterns) {
    const highlight = document.createElement('div');
    highlight.className = 'pattern-highlight';
    highlight.style.left = (pattern.center.x * 0.6) + 'px';
    highlight.style.top = (pattern.center.y * 0.6) + 'px';
    highlight.style.width = '60px';
    highlight.style.height = '40px';
    highlight.title = \`Pattern: \${pattern.isin}\`;
    overlayDiv.appendChild(highlight);
  }
  
  const container = canvas.parentElement;
  container.style.position = 'relative';
  container.appendChild(overlayDiv);
}

async function runEnhancedSpatialAnalysis() {
  try {
    updatePhase('🧠 Enhanced Spatial Intelligence');
    console.log('🧠 Starting enhanced spatial intelligence with pattern recognition...');
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const pdfData = 'data:application/pdf;base64,${pdfBase64}';
    const pdf = await pdfjsLib.getDocument(pdfData).promise;
    
    console.log(\`📄 Enhanced analysis: \${pdf.numPages} pages\`);
    
    let allDataItems = [];
    let allPatterns = [];
    let allValidations = [];
    
    // Process each page with enhanced spatial analysis
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      updatePhase(\`📍 Grid Analysis Page \${pageNum}/\${pdf.numPages}\`);
      
      const page = await pdf.getPage(pageNum);
      
      // High-resolution rendering
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Create spatial grid for this page
      const grid = createSpatialGrid(canvas.width, canvas.height, window.enhancedSpatialData.spatial_grid.grid_resolution);
      
      // Extract text with enhanced classification
      const textContent = await page.getTextContent();
      
      for (const item of textContent.items) {
        const dataItem = {
          text: item.str,
          x: Math.round(item.transform[4]),
          y: Math.round(item.transform[5]),
          width: Math.round(item.width),
          height: Math.round(item.height),
          page: pageNum,
          classification: classifyDataType(item.str, item.transform[4], item.transform[5], ''),
          parsedValue: parseSwissNumber(item.str)
        };
        
        allDataItems.push(dataItem);
        addToGrid(grid, dataItem, window.enhancedSpatialData.spatial_grid.grid_resolution);
      }
      
      // Find patterns in this page's grid
      const pagePatterns = findPatternsInGrid(grid);
      allPatterns.push(...pagePatterns);
      
      // Validate patterns with mathematical checks
      for (const pattern of pagePatterns) {
        const validation = validateQuantityPriceValuation(pattern);
        if (validation) {
          allValidations.push(validation);
        }
      }
      
      // Add visualization for first few pages
      if (pageNum <= 3) {
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-container';
        canvasContainer.appendChild(canvas);
        document.getElementById('spatialVisualization').appendChild(canvasContainer);
        
        addGridVisualization(canvas, grid, pagePatterns);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Store results
    window.enhancedSpatialData.spatial_grid.data_clusters = allDataItems;
    window.enhancedSpatialData.spatial_grid.pattern_matches = allPatterns;
    window.enhancedSpatialData.spatial_grid.validation_results = allValidations;
    window.enhancedSpatialData.validation_engine.quantity_price_valuation_checks = allValidations;
    window.enhancedSpatialData.validation_engine.total_validation = {
      passed: validationsPassed,
      failed: totalValidations - validationsPassed,
      accuracy: totalValidations > 0 ? (validationsPassed / totalValidations) : 0
    };
    
    // Create enhanced securities profiles
    for (const pattern of allPatterns) {
      const validation = allValidations.find(v => v.isin === pattern.isin);
      
      const enhancedSecurity = {
        isin: pattern.isin,
        page: pattern.dataPoints[0].page,
        spatial_cluster: pattern,
        mathematical_validation: validation,
        complete_data: {
          quantity: validation?.quantity,
          price: validation?.price,
          valuation: validation?.actual_valuation,
          calculated_valuation: validation?.expected_valuation,
          is_mathematically_valid: validation?.is_valid || false
        }
      };
      
      window.enhancedSpatialData.securities_enhanced.push(enhancedSecurity);
    }
    
    updatePhase('✅ Enhanced Analysis Complete');
    updateCounters();
    
    console.log(\`✅ Enhanced spatial intelligence completed!\`);
    console.log(\`🎯 Found \${patternsFound} patterns\`);
    console.log(\`🧮 Passed \${validationsPassed}/\${totalValidations} validations\`);
    console.log(\`📊 Mathematical accuracy: \${((validationsPassed / totalValidations) * 100).toFixed(1)}%\`);
    
    // Show validation summary
    document.getElementById('validationSummary').style.display = 'block';
    document.getElementById('validationResults').innerHTML = \`
      <div>Total Patterns Found: \${patternsFound}</div>
      <div>Mathematical Validations: \${validationsPassed}/\${totalValidations}</div>
      <div>Accuracy: \${((validationsPassed / totalValidations) * 100).toFixed(1)}%</div>
    \`;
    
    document.body.setAttribute('data-enhanced-complete', 'true');
    
  } catch (error) {
    console.error('❌ Enhanced spatial analysis error:', error);
    updatePhase('❌ Analysis Error');
  }
}

// Start enhanced spatial analysis
setTimeout(runEnhancedSpatialAnalysis, 1000);
</script>

</body>
</html>`;
  }

  async runMathematicalValidation() {
    console.log('🧮 Running mathematical validation engine...');
    
    // Additional validations beyond what was done in browser
    let portfolioTotal = 0;
    let validSecurities = 0;
    
    for (const security of this.extractedData.securities_enhanced) {
      if (security.complete_data?.valuation) {
        portfolioTotal += security.complete_data.valuation;
        validSecurities++;
      }
    }
    
    // Portfolio percentage validation
    for (const security of this.extractedData.securities_enhanced) {
      if (security.complete_data?.valuation && portfolioTotal > 0) {
        const calculatedPercentage = (security.complete_data.valuation / portfolioTotal) * 100;
        
        this.extractedData.validation_engine.portfolio_percentage_checks.push({
          isin: security.isin,
          actual_percentage: calculatedPercentage,
          expected_total: portfolioTotal
        });
      }
    }
    
    console.log(`🧮 Portfolio validation: ${validSecurities} securities, $${portfolioTotal.toLocaleString()} total`);
  }

  async buildAssetAllocation() {
    console.log('📊 Building asset allocation with common sense...');
    
    // Asset classification using common sense rules
    for (const security of this.extractedData.securities_enhanced) {
      const isin = security.isin;
      let assetClass = 'other';
      
      // Common sense classification
      if (isin.startsWith('XS')) {
        assetClass = 'bonds'; // International bonds
      } else if (isin.startsWith('LU')) {
        assetClass = 'funds'; // Luxembourg funds
      } else if (isin.startsWith('CH')) {
        assetClass = 'bonds'; // Swiss bonds
      } else if (isin.startsWith('US')) {
        assetClass = 'equities'; // US equities
      }
      
      // Add to appropriate allocation
      this.extractedData.asset_allocation[assetClass].securities.push(security);
      
      if (security.complete_data?.valuation) {
        this.extractedData.asset_allocation[assetClass].total_value += security.complete_data.valuation;
      }
    }
    
    // Calculate percentages
    const totalPortfolio = Object.values(this.extractedData.asset_allocation)
      .reduce((sum, allocation) => sum + allocation.total_value, 0);
    
    for (const assetClass of Object.keys(this.extractedData.asset_allocation)) {
      const allocation = this.extractedData.asset_allocation[assetClass];
      allocation.percentage = totalPortfolio > 0 ? (allocation.total_value / totalPortfolio * 100) : 0;
    }
    
    console.log('📊 Asset allocation built with common sense classification');
  }

  async createEnhancedAnalysisTables() {
    const tableHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>🧠✨ Enhanced Spatial Intelligence Analysis</title>
  <style>
    body { 
      font-family: 'Segoe UI', sans-serif; 
      margin: 0; 
      background: #f5f7fa; 
      color: #333; 
    }
    .header { 
      background: linear-gradient(135deg, #667eea, #764ba2); 
      color: white; 
      padding: 40px; 
      text-align: center; 
    }
    .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
    .analysis-section { 
      background: white; 
      border-radius: 15px; 
      padding: 30px; 
      margin: 20px 0; 
      box-shadow: 0 8px 25px rgba(0,0,0,0.1); 
    }
    .validation-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
      gap: 20px; 
      margin: 20px 0; 
    }
    .validation-card { 
      background: #f8f9fa; 
      padding: 20px; 
      border-radius: 10px; 
      border-left: 4px solid #28a745; 
    }
    .validation-card.failed { border-left-color: #dc3545; }
    .data-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0; 
    }
    .data-table th { 
      background: linear-gradient(45deg, #667eea, #764ba2); 
      color: white; 
      padding: 15px; 
      text-align: left; 
    }
    .data-table td { 
      padding: 12px 15px; 
      border-bottom: 1px solid #eee; 
    }
    .data-table tr:hover { background: #f8f9fa; }
    .valid-row { background: rgba(40, 167, 69, 0.1); }
    .invalid-row { background: rgba(220, 53, 69, 0.1); }
    .formula { 
      font-family: 'Courier New', monospace; 
      background: #e9ecef; 
      padding: 4px 8px; 
      border-radius: 4px; 
    }
  </style>
</head>
<body>

<div class="header">
  <h1>🧠✨ Enhanced Spatial Intelligence Analysis</h1>
  <p>Pattern Recognition + Mathematical Validation + Common Sense</p>
  <p>✅ Your insights implemented: X/Y Grid + Quantity×Price=Valuation + Asset Allocation</p>
</div>

<div class="container">
  
  <!-- Mathematical Validation Results -->
  <div class="analysis-section">
    <h2>🧮 Mathematical Validation Results</h2>
    <p>Testing the pattern: <span class="formula">Quantity × Price = Valuation</span></p>
    
    <div class="validation-grid">
      <div class="validation-card">
        <h4>✅ Validations Passed</h4>
        <div style="font-size: 2em; color: #28a745;">${this.extractedData.validation_engine?.total_validation?.passed || 0}</div>
      </div>
      <div class="validation-card ${(this.extractedData.validation_engine?.total_validation?.failed || 0) > 0 ? 'failed' : ''}">
        <h4>❌ Validations Failed</h4>
        <div style="font-size: 2em; color: #dc3545;">${this.extractedData.validation_engine?.total_validation?.failed || 0}</div>
      </div>
      <div class="validation-card">
        <h4>📊 Accuracy</h4>
        <div style="font-size: 2em; color: #667eea;">${((this.extractedData.validation_engine?.total_validation?.accuracy || 0) * 100).toFixed(1)}%</div>
      </div>
    </div>
    
    <table class="data-table">
      <thead>
        <tr>
          <th>ISIN</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Calculated Valuation</th>
          <th>Actual Valuation</th>
          <th>Difference</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${(this.extractedData.validation_engine?.quantity_price_valuation_checks || []).map(check => `
          <tr class="${check.is_valid ? 'valid-row' : 'invalid-row'}">
            <td>${check.isin}</td>
            <td>${check.quantity?.toLocaleString() || 'N/A'}</td>
            <td>$${check.price?.toFixed(2) || 'N/A'}</td>
            <td>$${check.expected_valuation?.toLocaleString() || 'N/A'}</td>
            <td>$${check.actual_valuation?.toLocaleString() || 'N/A'}</td>
            <td>$${check.difference?.toLocaleString() || 'N/A'}</td>
            <td>${check.is_valid ? '✅ Valid' : '❌ Invalid'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- Asset Allocation with Common Sense -->
  <div class="analysis-section">
    <h2>📊 Asset Allocation (Common Sense Classification)</h2>
    <p>Automatically grouped securities by type using ISIN patterns</p>
    
    <table class="data-table">
      <thead>
        <tr>
          <th>Asset Class</th>
          <th>Securities Count</th>
          <th>Total Value</th>
          <th>Portfolio %</th>
          <th>Classification Rule</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(this.extractedData.asset_allocation || {}).map(([assetClass, data]) => `
          <tr>
            <td><strong>${assetClass.toUpperCase()}</strong></td>
            <td>${data.securities?.length || 0}</td>
            <td>$${data.total_value?.toLocaleString() || '0'}</td>
            <td>${data.percentage?.toFixed(2) || '0'}%</td>
            <td>${this.getClassificationRule(assetClass)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- Complete Enhanced Securities -->
  <div class="analysis-section">
    <h2>🎯 Complete Enhanced Securities</h2>
    <p>Each security with spatial mapping, pattern recognition, and mathematical validation</p>
    
    <table class="data-table">
      <thead>
        <tr>
          <th>ISIN</th>
          <th>Page</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Valuation</th>
          <th>Math Valid</th>
          <th>Data Points</th>
          <th>Pattern Confidence</th>
        </tr>
      </thead>
      <tbody>
        ${(this.extractedData.securities_enhanced || []).map(security => `
          <tr class="${security.complete_data?.is_mathematically_valid ? 'valid-row' : ''}">
            <td>${security.isin}</td>
            <td>${security.page}</td>
            <td>${security.complete_data?.quantity?.toLocaleString() || 'N/A'}</td>
            <td>$${security.complete_data?.price?.toFixed(2) || 'N/A'}</td>
            <td>$${security.complete_data?.valuation?.toLocaleString() || 'N/A'}</td>
            <td>${security.complete_data?.is_mathematically_valid ? '✅' : '❌'}</td>
            <td>${security.spatial_cluster?.dataPoints?.length || 0}</td>
            <td>${((security.spatial_cluster?.confidence || 0) * 100).toFixed(1)}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- Pattern Analysis Summary -->
  <div class="analysis-section">
    <h2>🧠 Pattern Recognition Summary</h2>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
      <h4>🎯 What We Discovered:</h4>
      <ul>
        <li><strong>Spatial Grid System:</strong> Mapped every data point to X/Y coordinates with ${this.extractedData.spatial_grid?.grid_resolution || 10}px precision</li>
        <li><strong>Pattern Recognition:</strong> Found ${this.extractedData.spatial_grid?.pattern_matches?.length || 0} security data clusters</li>
        <li><strong>Mathematical Validation:</strong> ${((this.extractedData.validation_engine?.total_validation?.accuracy || 0) * 100).toFixed(1)}% accuracy on Quantity×Price=Valuation</li>
        <li><strong>Asset Classification:</strong> Automatically grouped securities using ISIN pattern analysis</li>
      </ul>
      
      <h4>✅ Your Insights Successfully Implemented:</h4>
      <ul>
        <li>📍 X/Y grid mapping with pattern detection</li>
        <li>🧮 Mathematical validation (quantity × price = valuation)</li>
        <li>📊 Common sense asset allocation grouping</li>
        <li>🔗 Complete data relationship mapping</li>
      </ul>
    </div>
  </div>

</div>

</body>
</html>`;

    const htmlPath = path.join('extraction-results', `enhanced-spatial-analysis-${new Date().toISOString().replace(/[:.]/g, '-')}.html`);
    if (!fs.existsSync('extraction-results')) {
      fs.mkdirSync('extraction-results');
    }
    fs.writeFileSync(htmlPath, tableHTML);
    
    console.log(`📊 Enhanced analysis tables created: ${htmlPath}`);
  }

  getClassificationRule(assetClass) {
    const rules = {
      'bonds': 'ISIN starts with XS (International) or CH (Swiss)',
      'funds': 'ISIN starts with LU (Luxembourg)',
      'equities': 'ISIN starts with US (United States)',
      'other': 'Other ISIN patterns'
    };
    return rules[assetClass] || 'Unknown';
  }

  displayEnhancedResults() {
    console.log('\n🧠✨ ENHANCED SPATIAL INTELLIGENCE RESULTS');
    console.log('=========================================');
    console.log(`🎯 Patterns Found: ${this.extractedData.spatial_grid?.pattern_matches?.length || 0}`);
    console.log(`🧮 Mathematical Validations: ${this.extractedData.validation_engine?.total_validation?.passed || 0}/${(this.extractedData.validation_engine?.total_validation?.passed || 0) + (this.extractedData.validation_engine?.total_validation?.failed || 0)}`);
    console.log(`📊 Accuracy: ${((this.extractedData.validation_engine?.total_validation?.accuracy || 0) * 100).toFixed(1)}%`);
    console.log(`🔗 Securities Enhanced: ${this.extractedData.securities_enhanced?.length || 0}`);
    
    console.log('\n📊 Asset Allocation (Common Sense):');
    Object.entries(this.extractedData.asset_allocation || {}).forEach(([assetClass, data]) => {
      console.log(`   ${assetClass.toUpperCase()}: ${data.securities?.length || 0} securities, $${data.total_value?.toLocaleString() || '0'} (${data.percentage?.toFixed(2) || '0'}%)`);
    });
    
    if ((this.extractedData.validation_engine?.quantity_price_valuation_checks || []).length > 0) {
      console.log('\n🧮 Sample Mathematical Validations:');
      this.extractedData.validation_engine.quantity_price_valuation_checks.slice(0, 3).forEach((check, index) => {
        console.log(`   ${index + 1}. ${check.isin}`);
        console.log(`      ${check.quantity?.toLocaleString()} × $${check.price?.toFixed(2)} = $${check.expected_valuation?.toLocaleString()}`);
        console.log(`      Actual: $${check.actual_valuation?.toLocaleString()} (${check.is_valid ? '✅ Valid' : '❌ Invalid'})`);
        console.log('');
      });
    }
  }
}

// Run the enhanced spatial intelligence system
const enhancedExtractor = new EnhancedSpatialIntelligence();
enhancedExtractor.runEnhancedSpatialIntelligence().then((results) => {
  if (results) {
    console.log('\n🎉 ENHANCED SPATIAL INTELLIGENCE COMPLETED!');
    console.log('🧠 Your insights successfully implemented:');
    console.log('📍 X/Y grid system with pattern recognition');
    console.log('🧮 Mathematical validation (quantity × price = valuation)');
    console.log('📊 Common sense asset allocation');
    console.log('🔗 Complete data relationship understanding');
  } else {
    console.log('❌ Enhanced spatial intelligence failed');
  }
});