// Simple Live Messos Demo - Always Visible Browser Window
// Ensures browser stays open and visible throughout the process

import puppeteer from 'puppeteer';
import fs from 'fs';

async function showSimpleLiveDemo() {
  console.log('🎬 OPENING LIVE MESSOS DEMO');
  console.log('===========================');
  console.log('🚀 Browser window will open and stay visible...');
  console.log('👀 WATCH THE BROWSER WINDOW for live extraction!');
  
  const pdfPath = 'C:\\Users\\aviad\\OneDrive\\Desktop\\pdf-main\\2. Messos  - 31.03.2025.pdf';
  
  if (!fs.existsSync(pdfPath)) {
    console.error('❌ PDF file not found');
    return;
  }

  const browser = await puppeteer.launch({
    headless: false,           // ALWAYS visible
    devtools: true,            // Open DevTools 
    defaultViewport: null,     // Use full screen
    args: [
      '--start-maximized',     // Maximize window
      '--no-sandbox',
      '--disable-web-security',
      '--kiosk'                // Full screen mode
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Monitor extraction progress
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('BROWSER:', msg.text());
      }
    });

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log('📊 PDF loaded, opening visual demo...');
    console.log('');
    console.log('🎬 LOOK AT YOUR BROWSER WINDOW NOW!');
    console.log('👆 The extraction is happening LIVE in the browser');
    console.log('');

    const demoHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>🎬 LIVE MESSOS EXTRACTION - WATCH THIS WINDOW!</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 20px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      text-align: center;
    }
    .header {
      background: rgba(0,0,0,0.3);
      padding: 30px;
      border-radius: 20px;
      margin: 20px 0;
    }
    .counter {
      font-size: 5em;
      font-weight: bold;
      color: #00ff00;
      text-shadow: 0 0 30px rgba(0,255,0,0.7);
      margin: 20px 0;
    }
    .status {
      font-size: 2em;
      margin: 20px 0;
      padding: 20px;
      background: rgba(0,0,0,0.2);
      border-radius: 15px;
    }
    .found-list {
      background: rgba(0,0,0,0.3);
      border-radius: 15px;
      padding: 20px;
      margin: 20px;
      max-height: 400px;
      overflow-y: auto;
      text-align: left;
    }
    .isin-item {
      background: rgba(0,255,0,0.1);
      border: 2px solid #00ff00;
      padding: 15px;
      margin: 10px 0;
      border-radius: 10px;
      font-size: 1.2em;
      animation: appear 0.5s ease-in;
    }
    @keyframes appear {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .progress {
      width: 80%;
      height: 40px;
      background: rgba(0,0,0,0.3);
      border-radius: 20px;
      margin: 20px auto;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #00ff00, #00cc00);
      width: 0%;
      transition: width 0.3s ease;
      border-radius: 20px;
    }
  </style>
</head>
<body>

<div class="header">
  <h1>🎬 LIVE MESSOS PDF EXTRACTION</h1>
  <h2>👀 WATCH THE EXTRACTION HAPPEN!</h2>
</div>

<div class="counter" id="counter">0</div>
<div style="font-size: 1.5em; margin-bottom: 20px;">ISIN CODES FOUND</div>

<div class="progress">
  <div class="progress-bar" id="progressBar"></div>
</div>

<div class="status" id="status">🚀 Starting extraction...</div>

<div class="found-list" id="foundList">
  <h3>📋 Securities Found:</h3>
</div>

<script>
let foundCount = 0;
let currentPage = 0;
let totalPages = 0;

function updateCounter(count) {
  document.getElementById('counter').textContent = count;
  foundCount = count;
}

function updateStatus(message) {
  document.getElementById('status').textContent = message;
  console.log('STATUS: ' + message);
}

function updateProgress(current, total) {
  totalPages = total;
  currentPage = current;
  const percent = (current / total) * 100;
  document.getElementById('progressBar').style.width = percent + '%';
}

function addISIN(isin, page) {
  const listDiv = document.getElementById('foundList');
  const isinDiv = document.createElement('div');
  isinDiv.className = 'isin-item';
  isinDiv.innerHTML = \`
    <strong>🎯 \${isin}</strong><br>
    📄 Found on page \${page}<br>
    ⏰ \${new Date().toLocaleTimeString()}
  \`;
  listDiv.appendChild(isinDiv);
  
  // Update counter
  updateCounter(foundCount + 1);
  
  // Scroll to show new item
  isinDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

async function startExtraction() {
  try {
    updateStatus('🔄 Loading PDF document...');
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const pdfData = 'data:application/pdf;base64,${pdfBase64}';
    const pdf = await pdfjsLib.getDocument(pdfData).promise;
    
    totalPages = pdf.numPages;
    updateStatus(\`📄 PDF loaded! \${totalPages} pages to analyze\`);
    
    const isinPattern = /\\b[A-Z]{2}[A-Z0-9]{9}[0-9]\\b/g;
    let foundISINs = new Set();
    
    // Process each page with visual feedback
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      updateProgress(pageNum, pdf.numPages);
      updateStatus(\`🔍 Analyzing page \${pageNum}/\${pdf.numPages}...\`);
      
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      
      // Find ISINs
      const matches = pageText.match(isinPattern) || [];
      
      for (const isin of matches) {
        if (!foundISINs.has(isin)) {
          foundISINs.add(isin);
          addISIN(isin, pageNum);
          
          // Pause to show the animation
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Small delay between pages
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    updateStatus(\`✅ EXTRACTION COMPLETE! Found \${foundISINs.size} ISIN codes\`);
    updateProgress(totalPages, totalPages);
    
    // Flash the counter
    const counterEl = document.getElementById('counter');
    setInterval(() => {
      counterEl.style.color = counterEl.style.color === 'yellow' ? '#00ff00' : 'yellow';
    }, 500);
    
  } catch (error) {
    updateStatus('❌ Error: ' + error.message);
    console.error('Extraction error:', error);
  }
}

// Start extraction immediately
setTimeout(startExtraction, 1000);

// Keep the page active
setInterval(() => {
  document.title = \`🎬 LIVE DEMO - \${foundCount} ISINs Found\`;
}, 1000);

</script>

</body>
</html>`;

    await page.setContent(demoHTML);
    
    console.log('🎬 EXTRACTION STARTING IN BROWSER WINDOW!');
    console.log('👀 Watch the browser for live results...');
    console.log('📊 ISINs will appear one by one in real-time');
    console.log('');
    
    // Wait longer and provide more feedback
    for (let i = 180; i > 0; i--) {
      if (i % 30 === 0) {
        console.log(`⏰ Browser staying open for ${i} more seconds...`);
        console.log('👀 Keep watching the browser window!');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ Demo completed - closing browser');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the demo
showSimpleLiveDemo();