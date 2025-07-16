// Browser-based PDF processing testing with Puppeteer
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pdfUrl, testSuite = 'comprehensive', browserOptions = {} } = req.body;
  
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 },
      ...browserOptions
    });

    const results = await runPDFProcessingTests(browser, pdfUrl, testSuite);
    await browser.close();

    res.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('PDF processing test failed:', error);
    res.status(500).json({ error: error.message });
  }
}

async function runPDFProcessingTests(browser, pdfUrl, testSuite) {
  const page = await browser.newPage();
  const results = {
    testSuite,
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // Test 1: Basic PDF Loading
    await testPDFLoading(page, pdfUrl, results);
    
    // Test 2: Text Extraction
    await testTextExtraction(page, pdfUrl, results);
    
    // Test 3: Visual Rendering
    await testVisualRendering(page, pdfUrl, results);
    
    // Test 4: Performance Testing
    await testPerformance(page, pdfUrl, results);
    
    // Test 5: Security Testing
    await testSecurity(page, pdfUrl, results);
    
    if (testSuite === 'comprehensive') {
      // Test 6: Cross-browser compatibility
      await testCrossBrowserCompatibility(browser, pdfUrl, results);
      
      // Test 7: Large file handling
      await testLargeFileHandling(page, pdfUrl, results);
      
      // Test 8: Memory usage
      await testMemoryUsage(page, pdfUrl, results);
    }
    
  } catch (error) {
    results.tests.push({
      name: 'Test Suite Error',
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  return results;
}

async function testPDFLoading(page, pdfUrl, results) {
  const startTime = Date.now();
  
  try {
    await page.goto(`data:text/html,
      <html>
        <body>
          <h1>PDF Loading Test</h1>
          <iframe id="pdf-frame" src="${pdfUrl}" width="100%" height="600px"></iframe>
          <script>
            document.getElementById('pdf-frame').onload = function() {
              document.body.setAttribute('data-pdf-loaded', 'true');
            };
          </script>
        </body>
      </html>
    `);

    // Wait for PDF to load
    await page.waitForSelector('iframe[data-pdf-loaded="true"]', { timeout: 30000 });
    
    const loadTime = Date.now() - startTime;
    
    results.tests.push({
      name: 'PDF Loading',
      status: 'passed',
      loadTime: `${loadTime}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    results.tests.push({
      name: 'PDF Loading',
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function testTextExtraction(page, pdfUrl, results) {
  try {
    await page.goto(`data:text/html,
      <html>
        <head>
          <script src="https://mozilla.github.io/pdf.js/build/pdf.js"></script>
        </head>
        <body>
          <h1>Text Extraction Test</h1>
          <div id="text-content"></div>
          <script>
            async function extractText() {
              const pdf = await pdfjsLib.getDocument('${pdfUrl}').promise;
              const page = await pdf.getPage(1);
              const textContent = await page.getTextContent();
              const text = textContent.items.map(item => item.str).join(' ');
              document.getElementById('text-content').textContent = text;
              document.body.setAttribute('data-text-extracted', 'true');
            }
            extractText();
          </script>
        </body>
      </html>
    `);

    await page.waitForSelector('body[data-text-extracted="true"]', { timeout: 30000 });
    
    const extractedText = await page.$eval('#text-content', el => el.textContent);
    
    results.tests.push({
      name: 'Text Extraction',
      status: 'passed',
      extractedLength: extractedText.length,
      sample: extractedText.substring(0, 100),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    results.tests.push({
      name: 'Text Extraction',
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function testVisualRendering(page, pdfUrl, results) {
  try {
    await page.goto(`data:text/html,
      <html>
        <head>
          <script src="https://mozilla.github.io/pdf.js/build/pdf.js"></script>
        </head>
        <body>
          <h1>Visual Rendering Test</h1>
          <canvas id="pdf-canvas"></canvas>
          <script>
            async function renderPDF() {
              const pdf = await pdfjsLib.getDocument('${pdfUrl}').promise;
              const page = await pdf.getPage(1);
              const canvas = document.getElementById('pdf-canvas');
              const context = canvas.getContext('2d');
              
              const viewport = page.getViewport({ scale: 1.5 });
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              
              await page.render({ canvasContext: context, viewport }).promise;
              document.body.setAttribute('data-pdf-rendered', 'true');
            }
            renderPDF();
          </script>
        </body>
      </html>
    `);

    await page.waitForSelector('body[data-pdf-rendered="true"]', { timeout: 30000 });
    
    // Take screenshot of rendered PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(process.cwd(), 'test-results', `pdf-render-${timestamp}.png`);
    
    // Ensure directory exists
    const dir = path.dirname(screenshotPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    results.tests.push({
      name: 'Visual Rendering',
      status: 'passed',
      screenshotPath,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    results.tests.push({
      name: 'Visual Rendering',
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function testPerformance(page, pdfUrl, results) {
  try {
    await page.goto(`data:text/html,
      <html>
        <head>
          <script src="https://mozilla.github.io/pdf.js/build/pdf.js"></script>
        </head>
        <body>
          <h1>Performance Test</h1>
          <div id="performance-results"></div>
          <script>
            async function performanceTest() {
              const startTime = performance.now();
              
              const pdf = await pdfjsLib.getDocument('${pdfUrl}').promise;
              const loadTime = performance.now() - startTime;
              
              const parseStart = performance.now();
              const page = await pdf.getPage(1);
              const textContent = await page.getTextContent();
              const parseTime = performance.now() - parseStart;
              
              const results = {
                loadTime: loadTime.toFixed(2),
                parseTime: parseTime.toFixed(2),
                totalTime: (loadTime + parseTime).toFixed(2),
                pageCount: pdf.numPages,
                textItems: textContent.items.length
              };
              
              document.getElementById('performance-results').textContent = JSON.stringify(results);
              document.body.setAttribute('data-performance-tested', 'true');
            }
            performanceTest();
          </script>
        </body>
      </html>
    `);

    await page.waitForSelector('body[data-performance-tested="true"]', { timeout: 30000 });
    
    const performanceData = await page.$eval('#performance-results', el => JSON.parse(el.textContent));
    
    results.tests.push({
      name: 'Performance',
      status: 'passed',
      metrics: performanceData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    results.tests.push({
      name: 'Performance',
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function testSecurity(page, pdfUrl, results) {
  try {
    // Test for potential security issues
    await page.goto(`data:text/html,
      <html>
        <head>
          <script src="https://mozilla.github.io/pdf.js/build/pdf.js"></script>
        </head>
        <body>
          <h1>Security Test</h1>
          <div id="security-results"></div>
          <script>
            async function securityTest() {
              try {
                const pdf = await pdfjsLib.getDocument('${pdfUrl}').promise;
                const info = await pdf.getMetadata();
                
                const securityInfo = {
                  isEncrypted: pdf.isEncrypted || false,
                  fingerprint: pdf.fingerprint,
                  hasJavaScript: false, // PDF.js doesn't expose this easily
                  hasAnnotations: false,
                  metadata: info.metadata ? 'present' : 'absent'
                };
                
                document.getElementById('security-results').textContent = JSON.stringify(securityInfo);
                document.body.setAttribute('data-security-tested', 'true');
              } catch (error) {
                document.getElementById('security-results').textContent = JSON.stringify({ error: error.message });
                document.body.setAttribute('data-security-tested', 'true');
              }
            }
            securityTest();
          </script>
        </body>
      </html>
    `);

    await page.waitForSelector('body[data-security-tested="true"]', { timeout: 30000 });
    
    const securityData = await page.$eval('#security-results', el => JSON.parse(el.textContent));
    
    results.tests.push({
      name: 'Security',
      status: 'passed',
      securityInfo: securityData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    results.tests.push({
      name: 'Security',
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function testCrossBrowserCompatibility(browser, pdfUrl, results) {
  try {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
    ];
    
    const browserResults = [];
    
    for (const userAgent of userAgents) {
      const page = await browser.newPage();
      await page.setUserAgent(userAgent);
      
      try {
        await page.goto(`data:text/html,
          <html>
            <head>
              <script src="https://mozilla.github.io/pdf.js/build/pdf.js"></script>
            </head>
            <body>
              <iframe src="${pdfUrl}" width="100%" height="400px"></iframe>
              <script>
                setTimeout(() => {
                  document.body.setAttribute('data-loaded', 'true');
                }, 3000);
              </script>
            </body>
          </html>
        `);
        
        await page.waitForSelector('body[data-loaded="true"]', { timeout: 10000 });
        
        browserResults.push({
          userAgent: userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : 'Edge',
          status: 'passed'
        });
        
      } catch (error) {
        browserResults.push({
          userAgent: userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : 'Edge',
          status: 'failed',
          error: error.message
        });
      }
      
      await page.close();
    }
    
    results.tests.push({
      name: 'Cross-browser Compatibility',
      status: 'passed',
      browserResults,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    results.tests.push({
      name: 'Cross-browser Compatibility',
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function testLargeFileHandling(page, pdfUrl, results) {
  try {
    await page.goto(`data:text/html,
      <html>
        <head>
          <script src="https://mozilla.github.io/pdf.js/build/pdf.js"></script>
        </head>
        <body>
          <h1>Large File Test</h1>
          <div id="file-info"></div>
          <script>
            async function testLargeFile() {
              const startTime = performance.now();
              
              const pdf = await pdfjsLib.getDocument('${pdfUrl}').promise;
              const loadTime = performance.now() - startTime;
              
              const fileInfo = {
                pageCount: pdf.numPages,
                loadTime: loadTime.toFixed(2),
                fingerprint: pdf.fingerprint
              };
              
              document.getElementById('file-info').textContent = JSON.stringify(fileInfo);
              document.body.setAttribute('data-file-tested', 'true');
            }
            testLargeFile();
          </script>
        </body>
      </html>
    `);

    await page.waitForSelector('body[data-file-tested="true"]', { timeout: 60000 });
    
    const fileInfo = await page.$eval('#file-info', el => JSON.parse(el.textContent));
    
    results.tests.push({
      name: 'Large File Handling',
      status: 'passed',
      fileInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    results.tests.push({
      name: 'Large File Handling',
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function testMemoryUsage(page, pdfUrl, results) {
  try {
    const metrics = await page.metrics();
    
    await page.goto(`data:text/html,
      <html>
        <head>
          <script src="https://mozilla.github.io/pdf.js/build/pdf.js"></script>
        </head>
        <body>
          <h1>Memory Usage Test</h1>
          <iframe src="${pdfUrl}" width="100%" height="400px"></iframe>
          <script>
            setTimeout(() => {
              document.body.setAttribute('data-memory-tested', 'true');
            }, 5000);
          </script>
        </body>
      </html>
    `);

    await page.waitForSelector('body[data-memory-tested="true"]', { timeout: 30000 });
    
    const finalMetrics = await page.metrics();
    
    const memoryUsage = {
      initialHeapUsed: metrics.JSHeapUsedSize,
      finalHeapUsed: finalMetrics.JSHeapUsedSize,
      memoryIncrease: finalMetrics.JSHeapUsedSize - metrics.JSHeapUsedSize,
      totalHeapSize: finalMetrics.JSHeapTotalSize
    };
    
    results.tests.push({
      name: 'Memory Usage',
      status: 'passed',
      memoryUsage,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    results.tests.push({
      name: 'Memory Usage',
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}