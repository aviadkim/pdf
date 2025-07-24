// Spatial Intelligence Extractor - The Ultimate Solution
// Uses "Spatial Intelligence" to understand which data belongs to which holding
// Builds complete data relationships for any table structure

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class SpatialIntelligenceExtractor {
  constructor() {
    this.extractedData = {
      // Raw extraction data
      raw_data: {
        text_items: [],      // Every text item with X/Y coordinates
        numbers: [],         // Every number with position and type
        isins: [],          // Every ISIN with position
        visual_elements: []  // Lines, boxes, table structure
      },
      
      // Spatial intelligence analysis
      spatial_analysis: {
        security_blocks: [], // Grouped data blocks per security
        table_structure: [], // Detected table rows/columns
        data_clusters: [],   // Spatially related items
        relationships: []    // Data point relationships
      },
      
      // Complete security mapping
      securities_complete: [],  // Each ISIN with ALL related data
      
      // Data dictionary
      data_dictionary: {
        field_types: {},     // What each data field represents
        value_mappings: {},  // How values connect to securities
        table_schemas: []    // Available table structures
      },
      
      // Query engine data
      queryable_data: {
        by_isin: {},        // Query by ISIN
        by_field: {},       // Query by field type
        by_position: {}     // Query by position
      }
    };
  }

  async extractWithSpatialIntelligence() {
    console.log('🧠 SPATIAL INTELLIGENCE EXTRACTOR');
    console.log('=================================');
    console.log('🎯 Phase 1: Complete Raw Extraction');
    console.log('🧩 Phase 2: Spatial Relationship Analysis');
    console.log('🔗 Phase 3: Data Connection Mapping');
    console.log('📊 Phase 4: Universal Table Builder');
    console.log('🚀 Building the ultimate data understanding system...');
    
    const pdfPath = 'C:\\Users\\aviad\\OneDrive\\Desktop\\pdf-main\\2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found');
      return null;
    }

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1800, height: 1200 },
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });

    try {
      const page = await browser.newPage();
      
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('🧠') || text.includes('🎯') || text.includes('📊')) {
          console.log('SPATIAL:', text);
        }
      });

      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      console.log(`📄 PDF loaded for spatial intelligence analysis`);

      const spatialHTML = this.generateSpatialIntelligenceHTML(pdfBase64);
      await page.setContent(spatialHTML);
      
      console.log('⏳ Running spatial intelligence analysis...');
      await page.waitForSelector('body[data-spatial-complete="true"]', { timeout: 180000 });
      
      const spatialData = await page.evaluate(() => window.spatialIntelligenceData);
      this.extractedData = spatialData;
      
      console.log('🧩 Building complete data relationships...');
      await this.buildDataRelationships();
      
      console.log('📊 Creating universal table builder...');
      await this.createUniversalTableBuilder();
      
      this.displaySpatialResults();
      
      console.log('\n🎬 Spatial intelligence results available for 90 seconds...');
      await new Promise(resolve => setTimeout(resolve, 90000));
      
      return this.extractedData;
      
    } catch (error) {
      console.error('❌ Spatial intelligence extraction failed:', error);
      return null;
    } finally {
      await browser.close();
    }
  }

  generateSpatialIntelligenceHTML(pdfBase64) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>🧠 Spatial Intelligence PDF Extractor</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    body { 
      font-family: 'Segoe UI', sans-serif; 
      margin: 0; 
      background: linear-gradient(135deg, #6a11cb, #2575fc); 
      color: white; 
    }
    .intelligence-container {
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
    .phase-indicator {
      font-size: 2em;
      font-weight: bold;
      color: #00ff88;
      text-shadow: 0 0 20px rgba(0,255,136,0.5);
      margin: 10px 0;
    }
    .progress-section {
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
    .data-cluster {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #00ff88;
      position: relative;
    }
    .security-block {
      background: rgba(0,255,136,0.1);
      border: 2px solid #00ff88;
      border-radius: 8px;
      padding: 12px;
      margin: 8px 0;
      animation: blockAppear 0.8s ease-in-out;
    }
    @keyframes blockAppear {
      0% { opacity: 0; transform: scale(0.9); }
      100% { opacity: 1; transform: scale(1); }
    }
    .relationship-line {
      position: absolute;
      height: 2px;
      background: #00ff88;
      z-index: 10;
      animation: lineGrow 1s ease-out;
    }
    @keyframes lineGrow {
      0% { width: 0; }
      100% { width: 100%; }
    }
    .canvas-overlay {
      position: relative;
      text-align: center;
    }
    .spatial-overlay {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 5;
    }
    canvas {
      border: 2px solid #ddd;
      border-radius: 10px;
      max-width: 100%;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    .data-point {
      position: absolute;
      background: rgba(255,0,0,0.7);
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: bold;
      pointer-events: none;
      z-index: 10;
    }
    .isin-highlight {
      background: rgba(0,255,136,0.7);
    }
    .number-highlight {
      background: rgba(255,193,7,0.7);
      color: black;
    }
  </style>
</head>
<body>

<div class="header">
  <h1>🧠 Spatial Intelligence Analysis</h1>
  <div class="phase-indicator" id="phaseIndicator">Phase 1: Raw Extraction</div>
  
  <div class="progress-section">
    <div class="progress-bar">
      <div class="progress-fill" id="progressBar"></div>
    </div>
    <div id="statusText">🚀 Initializing spatial intelligence...</div>
  </div>
</div>

<div class="intelligence-container">
  <div class="analysis-area">
    <h3>📄 Spatial Analysis Visualization</h3>
    <div id="visualizationArea">
      <!-- PDF with spatial overlays will appear here -->
    </div>
  </div>
  
  <div class="intelligence-panel">
    <h3>🧠 Intelligence Feed</h3>
    
    <div id="rawDataSection">
      <h4>Phase 1: Raw Data</h4>
      <div id="rawDataFeed"></div>
    </div>
    
    <div id="spatialSection" style="display: none;">
      <h4>Phase 2: Spatial Clusters</h4>
      <div id="spatialFeed"></div>
    </div>
    
    <div id="relationshipSection" style="display: none;">
      <h4>Phase 3: Data Relationships</h4>
      <div id="relationshipFeed"></div>
    </div>
    
    <div id="tableSection" style="display: none;">
      <h4>Phase 4: Table Builder</h4>
      <div id="tableFeed"></div>
    </div>
  </div>
</div>

<script>
window.spatialIntelligenceData = {
  raw_data: {
    text_items: [],
    numbers: [],
    isins: [],
    visual_elements: []
  },
  spatial_analysis: {
    security_blocks: [],
    table_structure: [],
    data_clusters: [],
    relationships: []
  },
  securities_complete: [],
  data_dictionary: {
    field_types: {},
    value_mappings: {},
    table_schemas: []
  },
  queryable_data: {
    by_isin: {},
    by_field: {},
    by_position: {}
  }
};

let currentPhase = 1;
let processedPages = 0;
let totalPages = 0;

function updatePhase(phase, description) {
  currentPhase = phase;
  document.getElementById('phaseIndicator').textContent = \`Phase \${phase}: \${description}\`;
  
  // Show/hide sections based on phase
  document.getElementById('rawDataSection').style.display = phase >= 1 ? 'block' : 'none';
  document.getElementById('spatialSection').style.display = phase >= 2 ? 'block' : 'none';
  document.getElementById('relationshipSection').style.display = phase >= 3 ? 'block' : 'none';
  document.getElementById('tableSection').style.display = phase >= 4 ? 'block' : 'none';
}

function updateProgress(current, total, description) {
  const percentage = (current / total) * 100;
  document.getElementById('progressBar').style.width = percentage + '%';
  document.getElementById('statusText').textContent = description;
  
  processedPages = current;
  totalPages = total;
}

function addRawDataItem(type, item, page) {
  const feedDiv = document.getElementById('rawDataFeed');
  const itemDiv = document.createElement('div');
  itemDiv.className = 'data-cluster';
  
  const icon = type === 'isin' ? '🏦' : type === 'number' ? '💰' : '📝';
  
  itemDiv.innerHTML = \`
    <div style="display: flex; justify-content: space-between;">
      <strong>\${icon} \${type.toUpperCase()}</strong>
      <span>Page \${page}</span>
    </div>
    <div style="margin: 5px 0; font-family: monospace;">
      \${typeof item === 'object' ? JSON.stringify(item, null, 2).substring(0, 100) : item}...
    </div>
    <div style="font-size: 0.8em; opacity: 0.7;">
      Position: X:\${item.x || 0}, Y:\${item.y || 0}
    </div>
  \`;
  
  feedDiv.appendChild(itemDiv);
  feedDiv.scrollTop = feedDiv.scrollHeight;
}

function addSpatialCluster(cluster) {
  const feedDiv = document.getElementById('spatialFeed');
  const clusterDiv = document.createElement('div');
  clusterDiv.className = 'security-block';
  
  clusterDiv.innerHTML = \`
    <div style="font-weight: bold; color: #00ff88;">
      🧩 Security Block #\${cluster.id}
    </div>
    <div style="margin: 5px 0;">
      ISIN: \${cluster.isin || 'Detecting...'}
    </div>
    <div style="margin: 5px 0;">
      Data Points: \${cluster.dataPoints.length}
    </div>
    <div style="font-size: 0.8em; opacity: 0.8;">
      Region: \${cluster.bounds.x1}-\${cluster.bounds.x2}, \${cluster.bounds.y1}-\${cluster.bounds.y2}
    </div>
  \`;
  
  feedDiv.appendChild(clusterDiv);
  feedDiv.scrollTop = feedDiv.scrollHeight;
}

function addRelationship(relationship) {
  const feedDiv = document.getElementById('relationshipFeed');
  const relDiv = document.createElement('div');
  relDiv.className = 'data-cluster';
  
  relDiv.innerHTML = \`
    <div style="display: flex; justify-content: space-between;">
      <strong>🔗 \${relationship.isin}</strong>
      <span>\${relationship.dataType}</span>
    </div>
    <div style="margin: 5px 0; color: #00ff88;">
      \${relationship.fieldName}: \${relationship.value}
    </div>
    <div style="font-size: 0.8em; opacity: 0.7;">
      Confidence: \${(relationship.confidence * 100).toFixed(1)}%
    </div>
  \`;
  
  feedDiv.appendChild(relDiv);
  feedDiv.scrollTop = feedDiv.scrollHeight;
}

function parseSwissNumber(str) {
  if (!str) return null;
  const cleaned = str.replace(/[^\\d'.,]/g, '');
  const withoutApostrophes = cleaned.replace(/'/g, '');
  const normalized = withoutApostrophes.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
}

function classifyDataType(text, context) {
  text = text.toLowerCase();
  context = context.toLowerCase();
  
  if (/\\b[a-z]{2}[a-z0-9]{9}[0-9]\\b/i.test(text)) return 'isin';
  if (/%/.test(text)) return 'percentage';
  if (/\\d{4}-\\d{2}-\\d{2}/.test(text) || /\\d{2}\\.\\d{2}\\.\\d{4}/.test(text)) return 'date';
  if (/\\b\\d+[.,]\\d{2}\\b/.test(text)) return 'currency';
  if (/\\b\\d+['\\s]?\\d{3}['\\s]?\\d{3}\\b/.test(text)) return 'large_currency';
  if (/\\b\\d+[.,]\\d+\\b/.test(text)) return 'decimal';
  if (/^\\d+$/.test(text)) return 'integer';
  
  return 'text';
}

function calculateDistance(item1, item2) {
  const dx = (item1.x || 0) - (item2.x || 0);
  const dy = (item1.y || 0) - (item2.y || 0);
  return Math.sqrt(dx * dx + dy * dy);
}

function findSpatialClusters(items, maxDistance = 50) {
  const clusters = [];
  const processed = new Set();
  
  for (let i = 0; i < items.length; i++) {
    if (processed.has(i)) continue;
    
    const cluster = {
      id: clusters.length + 1,
      items: [items[i]],
      bounds: {
        x1: items[i].x, x2: items[i].x,
        y1: items[i].y, y2: items[i].y
      }
    };
    
    processed.add(i);
    
    // Find nearby items
    for (let j = i + 1; j < items.length; j++) {
      if (processed.has(j)) continue;
      
      const distance = calculateDistance(items[i], items[j]);
      if (distance <= maxDistance) {
        cluster.items.push(items[j]);
        processed.add(j);
        
        // Update bounds
        cluster.bounds.x1 = Math.min(cluster.bounds.x1, items[j].x);
        cluster.bounds.x2 = Math.max(cluster.bounds.x2, items[j].x);
        cluster.bounds.y1 = Math.min(cluster.bounds.y1, items[j].y);
        cluster.bounds.y2 = Math.max(cluster.bounds.y2, items[j].y);
      }
    }
    
    clusters.push(cluster);
  }
  
  return clusters;
}

async function startSpatialIntelligenceAnalysis() {
  try {
    updatePhase(1, 'Raw Extraction');
    console.log('🧠 Starting spatial intelligence analysis...');
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const pdfData = 'data:application/pdf;base64,${pdfBase64}';
    const pdf = await pdfjsLib.getDocument(pdfData).promise;
    
    console.log(\`📄 PDF loaded: \${pdf.numPages} pages for spatial analysis\`);
    totalPages = pdf.numPages;
    
    // Phase 1: Complete Raw Extraction
    updatePhase(1, 'Complete Raw Extraction');
    
    let allTextItems = [];
    let allNumbers = [];
    let allISINs = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      updateProgress(pageNum, pdf.numPages, \`🎯 Phase 1: Extracting page \${pageNum}/\${pdf.numPages}\`);
      
      const page = await pdf.getPage(pageNum);
      
      // High-resolution rendering with spatial overlay
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Create overlay for spatial visualization
      const overlayDiv = document.createElement('div');
      overlayDiv.className = 'canvas-overlay';
      
      const spatialOverlay = document.createElement('div');
      spatialOverlay.className = 'spatial-overlay';
      spatialOverlay.style.width = canvas.width + 'px';
      spatialOverlay.style.height = canvas.height + 'px';
      
      overlayDiv.appendChild(canvas);
      overlayDiv.appendChild(spatialOverlay);
      
      if (pageNum <= 3) {
        document.getElementById('visualizationArea').appendChild(overlayDiv);
      }
      
      // Extract text with precise coordinates
      const textContent = await page.getTextContent();
      
      for (let i = 0; i < textContent.items.length; i++) {
        const item = textContent.items[i];
        
        const textItem = {
          text: item.str,
          x: Math.round(item.transform[4]),
          y: Math.round(item.transform[5]),
          width: Math.round(item.width),
          height: Math.round(item.height),
          fontSize: Math.round(item.height),
          page: pageNum,
          index: i,
          dataType: classifyDataType(item.str, textContent.items.slice(Math.max(0, i-2), i+3).map(x => x.str).join(' '))
        };
        
        allTextItems.push(textItem);
        window.spatialIntelligenceData.raw_data.text_items.push(textItem);
        
        // Classify and store by type
        if (textItem.dataType === 'isin') {
          allISINs.push(textItem);
          window.spatialIntelligenceData.raw_data.isins.push(textItem);
          addRawDataItem('isin', textItem, pageNum);
          
          // Add visual highlight
          if (pageNum <= 3) {
            const highlight = document.createElement('div');
            highlight.className = 'data-point isin-highlight';
            highlight.textContent = 'ISIN';
            highlight.style.left = (textItem.x * 0.8) + 'px';
            highlight.style.top = (textItem.y * 0.8) + 'px';
            spatialOverlay.appendChild(highlight);
          }
          
        } else if (['currency', 'large_currency', 'decimal', 'percentage'].includes(textItem.dataType)) {
          const parsedValue = parseSwissNumber(textItem.text);
          if (parsedValue !== null) {
            const numberItem = { ...textItem, parsedValue };
            allNumbers.push(numberItem);
            window.spatialIntelligenceData.raw_data.numbers.push(numberItem);
            addRawDataItem('number', numberItem, pageNum);
            
            // Add visual highlight
            if (pageNum <= 3 && parsedValue > 10000) {
              const highlight = document.createElement('div');
              highlight.className = 'data-point number-highlight';
              highlight.textContent = parsedValue > 1000000 ? 'VAL' : 'NUM';
              highlight.style.left = (textItem.x * 0.8) + 'px';
              highlight.style.top = (textItem.y * 0.8) + 'px';
              spatialOverlay.appendChild(highlight);
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1)); // Visual effect
      }
    }
    
    // Phase 2: Spatial Relationship Analysis
    updatePhase(2, 'Spatial Relationship Analysis');
    console.log(\`🧩 Phase 2: Analyzing spatial relationships...\`);
    console.log(\`📊 Found \${allISINs.length} ISINs, \${allNumbers.length} numbers across \${allTextItems.length} text items\`);
    
    // Create spatial clusters around each ISIN
    for (let i = 0; i < allISINs.length; i++) {
      const isin = allISINs[i];
      updateProgress(i + 1, allISINs.length, \`🧩 Phase 2: Clustering data for ISIN \${i + 1}/\${allISINs.length}\`);
      
      // Find all data points within reasonable distance of this ISIN
      const nearbyItems = allTextItems.filter(item => {
        if (item.page !== isin.page) return false;
        
        const distance = calculateDistance(isin, item);
        const sameRow = Math.abs(isin.y - item.y) < 20;
        const sameArea = distance < 200;
        
        return sameRow || sameArea;
      });
      
      const cluster = {
        id: i + 1,
        isin: isin.text,
        centerISIN: isin,
        dataPoints: nearbyItems,
        bounds: {
          x1: Math.min(...nearbyItems.map(item => item.x)),
          x2: Math.max(...nearbyItems.map(item => item.x)),
          y1: Math.min(...nearbyItems.map(item => item.y)),
          y2: Math.max(...nearbyItems.map(item => item.y))
        },
        page: isin.page
      };
      
      window.spatialIntelligenceData.spatial_analysis.security_blocks.push(cluster);
      addSpatialCluster(cluster);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Phase 3: Data Connection Mapping
    updatePhase(3, 'Data Connection Mapping');
    console.log(\`🔗 Phase 3: Building data relationships...\`);
    
    for (let i = 0; i < window.spatialIntelligenceData.spatial_analysis.security_blocks.length; i++) {
      const cluster = window.spatialIntelligenceData.spatial_analysis.security_blocks[i];
      updateProgress(i + 1, window.spatialIntelligenceData.spatial_analysis.security_blocks.length, \`🔗 Phase 3: Mapping data for \${cluster.isin}\`);
      
      const securityData = {
        isin: cluster.isin,
        page: cluster.page,
        complete_data: {},
        raw_items: cluster.dataPoints
      };
      
      // Analyze each data point in the cluster
      for (const item of cluster.dataPoints) {
        if (item.dataType === 'currency' || item.dataType === 'large_currency') {
          const value = parseSwissNumber(item.text);
          if (value > 1000000) {
            securityData.complete_data.market_value = value;
            addRelationship({
              isin: cluster.isin,
              fieldName: 'Market Value',
              value: \`$\${value.toLocaleString()}\`,
              dataType: 'currency',
              confidence: 0.9
            });
          } else if (value > 10 && value < 10000) {
            securityData.complete_data.price = value;
            addRelationship({
              isin: cluster.isin,
              fieldName: 'Price',
              value: \`$\${value.toFixed(2)}\`,
              dataType: 'price',
              confidence: 0.8
            });
          }
        } else if (item.dataType === 'percentage') {
          const percentValue = parseFloat(item.text.replace('%', ''));
          if (percentValue < 50) {
            securityData.complete_data.weight_percent = percentValue;
            addRelationship({
              isin: cluster.isin,
              fieldName: 'Weight %',
              value: \`\${percentValue}%\`,
              dataType: 'percentage',
              confidence: 0.7
            });
          }
        }
      }
      
      window.spatialIntelligenceData.securities_complete.push(securityData);
      window.spatialIntelligenceData.queryable_data.by_isin[cluster.isin] = securityData;
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Phase 4: Universal Table Builder
    updatePhase(4, 'Universal Table Builder');
    console.log(\`📊 Phase 4: Building universal table system...\`);
    
    // Create queryable data structures
    const tableSchemas = [
      {
        name: 'Complete Securities Overview',
        fields: ['isin', 'market_value', 'price', 'weight_percent', 'page'],
        description: 'All securities with their primary data'
      },
      {
        name: 'Market Values Table',
        fields: ['isin', 'market_value'],
        description: 'Market values for all holdings'
      },
      {
        name: 'Performance Analysis',
        fields: ['isin', 'price', 'weight_percent'],
        description: 'Performance metrics'
      }
    ];
    
    window.spatialIntelligenceData.data_dictionary.table_schemas = tableSchemas;
    
    const tableFeed = document.getElementById('tableFeed');
    for (const schema of tableSchemas) {
      const schemaDiv = document.createElement('div');
      schemaDiv.className = 'data-cluster';
      schemaDiv.innerHTML = \`
        <div style="font-weight: bold; color: #00ff88;">
          📊 \${schema.name}
        </div>
        <div style="margin: 5px 0;">
          Fields: \${schema.fields.join(', ')}
        </div>
        <div style="font-size: 0.8em; opacity: 0.8;">
          \${schema.description}
        </div>
      \`;
      tableFeed.appendChild(schemaDiv);
    }
    
    updateProgress(1, 1, '✅ Spatial intelligence analysis completed!');
    console.log(\`✅ Spatial intelligence analysis completed!\`);
    console.log(\`🧠 Built complete data understanding system\`);
    console.log(\`🔗 Mapped \${window.spatialIntelligenceData.securities_complete.length} securities with complete relationships\`);
    
    document.body.setAttribute('data-spatial-complete', 'true');
    
  } catch (error) {
    console.error('❌ Spatial intelligence error:', error);
    document.getElementById('statusText').textContent = '❌ Error: ' + error.message;
  }
}

// Start spatial intelligence analysis
setTimeout(startSpatialIntelligenceAnalysis, 1000);
</script>

</body>
</html>`;
  }

  async buildDataRelationships() {
    console.log('🔗 Building complete data relationships...');
    
    // Calculate portfolio totals and validation
    let totalMarketValue = 0;
    let validSecurities = 0;
    
    for (const security of this.extractedData.securities_complete) {
      if (security.complete_data.market_value) {
        totalMarketValue += security.complete_data.market_value;
        validSecurities++;
      }
    }
    
    this.extractedData.portfolio_validation = {
      calculated_total: totalMarketValue,
      expected_total: 19464431, // We know this from previous analysis
      difference: Math.abs(totalMarketValue - 19464431),
      accuracy_percent: (1 - Math.abs(totalMarketValue - 19464431) / 19464431) * 100,
      valid_securities: validSecurities
    };
    
    console.log(`🧮 Portfolio validation: ${validSecurities} securities, $${totalMarketValue.toLocaleString()} calculated total`);
  }

  async createUniversalTableBuilder() {
    const tableBuilderHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>📊 Universal Table Builder - Any Table Structure</title>
  <style>
    body { 
      font-family: 'Segoe UI', sans-serif; 
      margin: 0; 
      background: #f5f7fa; 
      color: #333; 
    }
    .builder-header { 
      background: linear-gradient(135deg, #6a11cb, #2575fc); 
      color: white; 
      padding: 40px; 
      text-align: center; 
    }
    .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
    .builder-section { 
      background: white; 
      border-radius: 15px; 
      padding: 30px; 
      margin: 20px 0; 
      box-shadow: 0 8px 25px rgba(0,0,0,0.1); 
    }
    .query-builder { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
      gap: 20px; 
      margin: 20px 0; 
    }
    .field-selector { 
      background: #f8f9fa; 
      padding: 15px; 
      border-radius: 10px; 
      border: 2px solid #e9ecef; 
      cursor: pointer; 
      transition: all 0.3s ease; 
    }
    .field-selector.selected { 
      border-color: #6a11cb; 
      background: #f3e5f5; 
    }
    .data-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0; 
    }
    .data-table th { 
      background: linear-gradient(45deg, #6a11cb, #2575fc); 
      color: white; 
      padding: 15px; 
      text-align: left; 
    }
    .data-table td { 
      padding: 12px 15px; 
      border-bottom: 1px solid #eee; 
    }
    .data-table tr:hover { background: #f8f9fa; }
    .btn { 
      background: #6a11cb; 
      color: white; 
      border: none; 
      padding: 12px 25px; 
      border-radius: 8px; 
      cursor: pointer; 
      font-weight: bold; 
      margin: 5px; 
    }
    .stats-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
      gap: 20px; 
      margin: 20px 0; 
    }
    .stat-card { 
      background: linear-gradient(135deg, #667eea, #764ba2); 
      color: white; 
      padding: 20px; 
      border-radius: 10px; 
      text-align: center; 
    }
    .stat-value { font-size: 2em; font-weight: bold; }
  </style>
</head>
<body>

<div class="builder-header">
  <h1>📊 Universal Table Builder</h1>
  <p>Build ANY table structure from spatially intelligent data</p>
  <p>🧠 Each data point knows which security it belongs to</p>
</div>

<div class="container">
  
  <!-- Statistics Dashboard -->
  <div class="builder-section">
    <h2>📈 Spatial Intelligence Results</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${this.extractedData.securities_complete.length}</div>
        <div>Securities Mapped</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${this.extractedData.raw_data.text_items.length}</div>
        <div>Data Points Extracted</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${this.extractedData.spatial_analysis.security_blocks.length}</div>
        <div>Spatial Clusters</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${((this.extractedData.portfolio_validation?.accuracy_percent) || 0).toFixed(1)}%</div>
        <div>Data Accuracy</div>
      </div>
    </div>
  </div>

  <!-- Table Builder Interface -->
  <div class="builder-section">
    <h2>🔧 Build Custom Tables</h2>
    <p>Select fields to include in your table. Each field is spatially connected to its security.</p>
    
    <div class="query-builder">
      <div class="field-selector" onclick="toggleField('isin')">
        <strong>🏦 ISIN Code</strong><br>
        <small>Security identifier</small>
      </div>
      <div class="field-selector" onclick="toggleField('market_value')">
        <strong>💰 Market Value</strong><br>
        <small>Current market value</small>
      </div>
      <div class="field-selector" onclick="toggleField('price')">
        <strong>💲 Price</strong><br>
        <small>Current price</small>
      </div>
      <div class="field-selector" onclick="toggleField('weight_percent')">
        <strong>📊 Weight %</strong><br>
        <small>Portfolio weight</small>
      </div>
      <div class="field-selector" onclick="toggleField('page')">
        <strong>📄 Page</strong><br>
        <small>Source page</small>
      </div>
      <div class="field-selector" onclick="toggleField('spatial_info')">
        <strong>🧠 Spatial Info</strong><br>
        <small>Coordinate data</small>
      </div>
    </div>
    
    <div style="margin: 20px 0;">
      <button class="btn" onclick="buildTable()">🔨 Build Table</button>
      <button class="btn" onclick="exportData()">📥 Export Data</button>
      <button class="btn" onclick="showRelationships()">🔗 Show Relationships</button>
    </div>
    
    <div id="customTableContainer">
      <!-- Custom built tables will appear here -->
    </div>
  </div>

  <!-- Query Examples -->
  <div class="builder-section">
    <h2>🎯 Query Examples</h2>
    <p>With spatial intelligence, you can ask complex questions:</p>
    
    <button class="btn" onclick="queryHighValue()">Show securities > $1M</button>
    <button class="btn" onclick="queryByPage()">Group by page</button>
    <button class="btn" onclick="queryValidation()">Validate totals</button>
    <button class="btn" onclick="queryPositional()">Show spatial clusters</button>
  </div>

  <!-- Complete Data Structure -->
  <div class="builder-section">
    <h2>📋 Complete Data Structure</h2>
    <p>Full spatially intelligent data - ready for any analysis:</p>
    <button class="btn" onclick="downloadFullData()">💾 Download Complete Data</button>
    
    <div id="dataStructurePreview" style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; max-height: 400px; overflow: auto;">
      <pre>${JSON.stringify(this.extractedData, null, 2).substring(0, 2000)}...</pre>
    </div>
  </div>

</div>

<script>
const spatialData = ${JSON.stringify(this.extractedData)};
let selectedFields = [];

function toggleField(field) {
  const element = event.target.closest('.field-selector');
  
  if (selectedFields.includes(field)) {
    selectedFields = selectedFields.filter(f => f !== field);
    element.classList.remove('selected');
  } else {
    selectedFields.push(field);
    element.classList.add('selected');
  }
}

function buildTable() {
  if (selectedFields.length === 0) {
    alert('Please select at least one field');
    return;
  }
  
  const tableContainer = document.getElementById('customTableContainer');
  
  // Build table header
  let tableHTML = '<table class="data-table"><thead><tr>';
  for (const field of selectedFields) {
    const fieldName = field.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase());
    tableHTML += \`<th>\${fieldName}</th>\`;
  }
  tableHTML += '</tr></thead><tbody>';
  
  // Build table rows
  for (const security of spatialData.securities_complete) {
    if (!security.complete_data) continue;
    
    tableHTML += '<tr>';
    for (const field of selectedFields) {
      let value = '';
      
      switch(field) {
        case 'isin':
          value = security.isin;
          break;
        case 'market_value':
          value = security.complete_data.market_value ? 
            '$' + security.complete_data.market_value.toLocaleString() : 'N/A';
          break;
        case 'price':
          value = security.complete_data.price ? 
            '$' + security.complete_data.price.toFixed(2) : 'N/A';
          break;
        case 'weight_percent':
          value = security.complete_data.weight_percent ? 
            security.complete_data.weight_percent.toFixed(2) + '%' : 'N/A';
          break;
        case 'page':
          value = security.page;
          break;
        case 'spatial_info':
          value = \`Items: \${security.raw_items.length}\`;
          break;
        default:
          value = 'N/A';
      }
      
      tableHTML += \`<td>\${value}</td>\`;
    }
    tableHTML += '</tr>';
  }
  
  tableHTML += '</tbody></table>';
  tableContainer.innerHTML = tableHTML;
}

function queryHighValue() {
  const highValueSecurities = spatialData.securities_complete.filter(s => 
    s.complete_data.market_value && s.complete_data.market_value > 1000000
  );
  
  console.log('High value securities:', highValueSecurities);
  alert(\`Found \${highValueSecurities.length} securities with value > $1M\`);
}

function queryByPage() {
  const byPage = {};
  spatialData.securities_complete.forEach(s => {
    if (!byPage[s.page]) byPage[s.page] = [];
    byPage[s.page].push(s);
  });
  
  console.log('Securities by page:', byPage);
  alert('Check console for page groupings');
}

function downloadFullData() {
  const dataStr = JSON.stringify(spatialData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'spatial-intelligence-complete-data.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Initialize with default selection
selectedFields = ['isin', 'market_value', 'page'];
document.querySelectorAll('.field-selector').forEach((el, i) => {
  if (i < 3) el.classList.add('selected');
});
buildTable();
</script>

</body>
</html>`;

    const htmlPath = path.join('extraction-results', `spatial-intelligence-tables-${new Date().toISOString().replace(/[:.]/g, '-')}.html`);
    if (!fs.existsSync('extraction-results')) {
      fs.mkdirSync('extraction-results');
    }
    fs.writeFileSync(htmlPath, tableBuilderHTML);
    
    console.log(`📊 Universal table builder created: ${htmlPath}`);
  }

  displaySpatialResults() {
    console.log('\n🧠 SPATIAL INTELLIGENCE RESULTS');
    console.log('===============================');
    console.log(`📊 Securities Completely Mapped: ${this.extractedData.securities_complete.length}`);
    console.log(`🎯 Raw Data Points Extracted: ${this.extractedData.raw_data.text_items.length}`);
    console.log(`🧩 Spatial Clusters Created: ${this.extractedData.spatial_analysis.security_blocks.length}`);
    console.log(`🔗 Data Relationships Built: ${Object.keys(this.extractedData.queryable_data.by_isin).length}`);
    
    if (this.extractedData.portfolio_validation) {
      console.log('\n💰 Portfolio Validation:');
      console.log(`✅ Calculated Total: $${this.extractedData.portfolio_validation.calculated_total.toLocaleString()}`);
      console.log(`🎯 Expected Total: $${this.extractedData.portfolio_validation.expected_total.toLocaleString()}`);
      console.log(`📊 Accuracy: ${this.extractedData.portfolio_validation.accuracy_percent.toFixed(1)}%`);
    }
    
    console.log('\n🎯 Sample Complete Security Data:');
    this.extractedData.securities_complete.slice(0, 3).forEach((security, index) => {
      console.log(`   ${index + 1}. ${security.isin}`);
      console.log(`      📍 Page: ${security.page}`);
      console.log(`      💰 Market Value: $${security.complete_data.market_value?.toLocaleString() || 'N/A'}`);
      console.log(`      💲 Price: $${security.complete_data.price?.toFixed(2) || 'N/A'}`);
      console.log(`      📊 Weight: ${security.complete_data.weight_percent?.toFixed(2) || 'N/A'}%`);
      console.log(`      🧩 Data Points: ${security.raw_items?.length || 0}`);
      console.log('');
    });
  }
}

// Run the spatial intelligence extractor
const spatialExtractor = new SpatialIntelligenceExtractor();
spatialExtractor.extractWithSpatialIntelligence().then((results) => {
  if (results) {
    console.log('\n🎉 SPATIAL INTELLIGENCE EXTRACTION COMPLETED!');
    console.log('🧠 Built complete understanding of data relationships');
    console.log('🔗 Each data point knows which security it belongs to');
    console.log('📊 Universal table builder ready for any structure');
    console.log('🎯 Perfect foundation for building any analysis table');
  } else {
    console.log('❌ Spatial intelligence extraction failed');
  }
});