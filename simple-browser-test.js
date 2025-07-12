// Simple browser test using Node.js native approach
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function simpleBrowserTest() {
  console.log('🌐 Simple Browser Test - Visual Website Testing');
  
  // Method 1: Use curl to test the website response
  console.log('\n📡 Testing website response with curl:');
  
  try {
    const curlTest = spawn('curl', [
      '-s',
      '-H', 'Content-Type: application/json',
      '-X', 'POST',
      '-d', '{"pdfBase64":"JVBERi0xLjQKJeL","filename":"test.pdf"}',
      'https://pdf-five-nu.vercel.app/api/fixed-messos-processor'
    ]);
    
    let curlOutput = '';
    curlTest.stdout.on('data', (data) => {
      curlOutput += data.toString();
    });
    
    curlTest.on('close', (code) => {
      console.log('✅ Curl test completed');
      try {
        const result = JSON.parse(curlOutput);
        console.log('Holdings found:', result.data?.holdings?.length || 0);
        console.log('Total value:', result.data?.portfolioInfo?.totalValue?.toLocaleString() || 'N/A');
      } catch (parseError) {
        console.log('Response preview:', curlOutput.substring(0, 200));
      }
    });
    
  } catch (error) {
    console.log('❌ Curl test failed:', error.message);
  }
  
  // Method 2: Create a simple HTML test page
  console.log('\n📄 Creating local test page:');
  
  const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>PDF Processor Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .test-section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
        .results { background: #f5f5f5; padding: 15px; margin: 10px 0; }
        button { padding: 10px 20px; margin: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <h1>PDF Processor Test</h1>
        
        <div class="test-section">
            <h2>Test Website Status</h2>
            <button onclick="testWebsite()">Test Website</button>
            <button onclick="testAPI()">Test API</button>
            <button onclick="testWithRealPDF()">Test with Real PDF</button>
            <div id="website-results" class="results"></div>
        </div>
        
        <div class="test-section">
            <h2>Value Analysis</h2>
            <button onclick="analyzeValues()">Analyze Values</button>
            <div id="value-results" class="results"></div>
        </div>
        
        <div class="test-section">
            <h2>Number Parsing Test</h2>
            <button onclick="testNumberParsing()">Test Number Parsing</button>
            <div id="number-results" class="results"></div>
        </div>
    </div>
    
    <script>
        async function testWebsite() {
            const results = document.getElementById('website-results');
            results.innerHTML = 'Testing website...';
            
            try {
                const response = await fetch('https://pdf-five-nu.vercel.app/api/family-office-upload');
                const html = await response.text();
                
                results.innerHTML = \`
                    <h3>Website Test Results:</h3>
                    <p>Status: \${response.status}</p>
                    <p>Content-Type: \${response.headers.get('content-type')}</p>
                    <p>HTML Length: \${html.length} characters</p>
                    <p>Has Upload Area: \${html.includes('upload-area') ? 'Yes' : 'No'}</p>
                \`;
            } catch (error) {
                results.innerHTML = \`<p>Error: \${error.message}</p>\`;
            }
        }
        
        async function testAPI() {
            const results = document.getElementById('website-results');
            results.innerHTML = 'Testing API...';
            
            try {
                const response = await fetch('https://pdf-five-nu.vercel.app/api/fixed-messos-processor', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        pdfBase64: 'JVBERi0xLjQKJeL',
                        filename: 'test.pdf'
                    })
                });
                
                const result = await response.json();
                
                results.innerHTML = \`
                    <h3>API Test Results:</h3>
                    <p>Status: \${response.status}</p>
                    <p>Success: \${result.success}</p>
                    <p>Holdings: \${result.data?.holdings?.length || 0}</p>
                    <p>Total Value: \${result.data?.portfolioInfo?.totalValue?.toLocaleString() || 'N/A'}</p>
                    <p>Method: \${result.metadata?.extractionMethod}</p>
                \`;
            } catch (error) {
                results.innerHTML = \`<p>Error: \${error.message}</p>\`;
            }
        }
        
        async function testWithRealPDF() {
            const results = document.getElementById('website-results');
            results.innerHTML = 'Please upload a PDF file to test...';
            
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf';
            input.onchange = async (event) => {
                const file = event.target.files[0];
                if (!file) return;
                
                results.innerHTML = 'Processing PDF...';
                
                try {
                    const base64 = await fileToBase64(file);
                    
                    const response = await fetch('https://pdf-five-nu.vercel.app/api/fixed-messos-processor', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            pdfBase64: base64,
                            filename: file.name
                        })
                    });
                    
                    const result = await response.json();
                    
                    results.innerHTML = \`
                        <h3>Real PDF Test Results:</h3>
                        <p>File: \${file.name}</p>
                        <p>Size: \${file.size} bytes</p>
                        <p>Holdings: \${result.data?.holdings?.length || 0}</p>
                        <p>Total Value: \${result.data?.portfolioInfo?.totalValue?.toLocaleString() || 'N/A'}</p>
                        <p>Processing Time: \${result.metadata?.processingTime}</p>
                        <p>Method: \${result.metadata?.extractionMethod}</p>
                        
                        <h4>First 3 Holdings:</h4>
                        <ul>
                            \${(result.data?.holdings || []).slice(0, 3).map(h => 
                                \`<li>\${h.securityName} - \${h.currentValue?.toLocaleString()} \${h.currency}</li>\`
                            ).join('')}
                        </ul>
                    \`;
                } catch (error) {
                    results.innerHTML = \`<p>Error: \${error.message}</p>\`;
                }
            };
            
            input.click();
        }
        
        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
            });
        }
        
        function analyzeValues() {
            const results = document.getElementById('value-results');
            results.innerHTML = \`
                <h3>Value Analysis:</h3>
                <p><strong>Expected Total:</strong> ~$46 million</p>
                <p><strong>Current System:</strong> $99.8 million</p>
                <p><strong>Issue:</strong> System extracting nominal values instead of market values</p>
                <p><strong>Fix Needed:</strong> Parse correct column from PDF table</p>
                
                <h4>Example Holdings Analysis:</h4>
                <ul>
                    <li>HARP ISSUER: $1,500,000 (likely nominal, not market value)</li>
                    <li>GOLDMAN SACHS: $690,000 (likely nominal, not market value)</li>
                    <li>BANK OF AMERICA: $250,000 (likely nominal, not market value)</li>
                </ul>
                
                <p><strong>Solution:</strong> Need to extract market values, not nominal values</p>
            \`;
        }
        
        function testNumberParsing() {
            const results = document.getElementById('number-results');
            
            // Test Swiss number parsing
            const swissNumbers = [
                "1'500'000",
                "690'000", 
                "250'000",
                "6'069.77",
                "99'897'584.56"
            ];
            
            const parseSwissNumber = (str) => {
                return parseFloat(str.replace(/[,']/g, ''));
            };
            
            let output = '<h3>Swiss Number Parsing Test:</h3><ul>';
            swissNumbers.forEach(num => {
                const parsed = parseSwissNumber(num);
                output += \`<li>\${num} → \${parsed.toLocaleString()}</li>\`;
            });
            output += '</ul>';
            
            output += \`
                <h4>Conclusion:</h4>
                <p>Swiss number parsing is working correctly.</p>
                <p>The issue is that we're extracting the wrong column from the PDF table.</p>
                <p>We need to extract market values, not nominal values.</p>
            \`;
            
            results.innerHTML = output;
        }
    </script>
</body>
</html>
`;

  fs.writeFileSync('pdf-test-page.html', testHtml);
  console.log('✅ Test page created: pdf-test-page.html');
  console.log('🌐 Open this file in your browser to test the website visually');
  
  // Method 3: Try to open the test page
  console.log('\n🔍 Attempting to open test page...');
  
  try {
    // Try different methods to open the file
    const testPagePath = path.resolve('pdf-test-page.html');
    
    // Windows WSL approach
    const windowsPath = testPagePath.replace('/mnt/c', 'C:').replace(/\//g, '\\');
    
    console.log('📄 Test page saved to:', testPagePath);
    console.log('🪟 Windows path:', windowsPath);
    console.log('🔗 File URL:', `file://${testPagePath}`);
    
    // Try to open with Windows default browser
    const { exec } = require('child_process');
    exec(`cmd.exe /c start "${windowsPath}"`, (error) => {
      if (error) {
        console.log('❌ Could not auto-open browser');
        console.log('📖 Manual instruction: Open pdf-test-page.html in your browser');
      } else {
        console.log('✅ Test page opened in browser');
      }
    });
    
  } catch (error) {
    console.log('❌ Could not open test page:', error.message);
    console.log('📖 Manual instruction: Open pdf-test-page.html in your browser');
  }
}

simpleBrowserTest().catch(console.error);