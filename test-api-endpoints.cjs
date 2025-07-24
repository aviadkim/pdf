const fs = require('fs');
const path = require('path');

// Test data
const testPDFBase64 = Buffer.from('Test PDF content').toString('base64');

// Simulate request and response objects
function createMockReq(body = {}) {
  return {
    method: 'POST',
    body: body,
    headers: {},
    url: '/api/test'
  };
}

function createMockRes() {
  let statusCode = 200;
  let headers = {};
  let responseData = null;
  
  return {
    setHeader: (name, value) => { headers[name] = value; },
    status: (code) => { statusCode = code; return this; },
    json: (data) => { responseData = data; return this; },
    send: (data) => { responseData = data; return this; },
    end: () => { return this; },
    getStatus: () => statusCode,
    getHeaders: () => headers,
    getResponse: () => responseData
  };
}

// Test individual API endpoints
async function testEndpoint(apiFile, testName, requestBody = {}) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log('─'.repeat(50));
  
  try {
    // Check if file exists
    const fullPath = path.join(__dirname, apiFile);
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${apiFile}`);
      return { success: false, error: 'File not found' };
    }
    
    // Read file and check basic structure
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for export default
    if (!content.includes('export default')) {
      console.log(`❌ Missing export default in ${apiFile}`);
      return { success: false, error: 'Missing export default' };
    }
    
    // Check for common import issues
    const problematicImports = content.match(/import\s+.*\s+from\s+['\"](pdf-parse|@anthropic|@azure)/g);
    if (problematicImports) {
      console.log(`⚠️  Potentially problematic imports found:`);
      problematicImports.forEach(imp => console.log(`   - ${imp}`));
    }
    
    // Try to import and test the handler
    try {
      // Convert Windows path to file:// URL for ESM
      const fileUrl = new URL(`file:///${fullPath.replace(/\\\\/g, '/')}`).href;
      const module = await import(fileUrl);
      const handler = module.default;
      
      if (typeof handler !== 'function') {
        console.log(`❌ Default export is not a function: ${typeof handler}`);
        return { success: false, error: 'Invalid handler' };
      }
      
      // Test with mock request/response
      const req = createMockReq(requestBody);
      const res = createMockRes();
      
      // Test the handler
      try {
        await handler(req, res);
        const response = res.getResponse();
        const status = res.getStatus();
        
        if (status === 500) {
          console.log(`❌ Handler returned 500 error`);
          console.log(`Response:`, response);
          return { success: false, error: 'Handler returned 500', response };
        } else if (status === 200) {
          console.log(`✅ Handler executed successfully`);
          console.log(`Status: ${status}`);
          if (response) {
            console.log(`Response type: ${typeof response}`);
            if (typeof response === 'object' && response.success !== undefined) {
              console.log(`Success: ${response.success}`);
              if (response.error) console.log(`Error: ${response.error}`);
            }
          }
          return { success: true, status, response };
        } else {
          console.log(`⚠️  Handler returned status ${status}`);
          return { success: false, error: `Status ${status}`, response };
        }
      } catch (handlerError) {
        console.log(`❌ Handler execution error: ${handlerError.message}`);
        console.log(`Stack: ${handlerError.stack}`);
        return { success: false, error: handlerError.message, stack: handlerError.stack };
      }
      
    } catch (importError) {
      console.log(`❌ Import error: ${importError.message}`);
      
      // Check specific import issues
      if (importError.message.includes('pdf-parse')) {
        console.log(`   💡 Issue: pdf-parse import problem`);
      }
      if (importError.message.includes('@anthropic')) {
        console.log(`   💡 Issue: Anthropic SDK import problem`);
      }
      if (importError.message.includes('@azure')) {
        console.log(`   💡 Issue: Azure SDK import problem`);
      }
      
      return { success: false, error: importError.message };
    }
    
  } catch (error) {
    console.log(`❌ General error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 API ENDPOINT TESTING');
  console.log('='.repeat(50));
  
  const tests = [
    {
      file: 'api/extract.js',
      name: '/api/extract',
      body: { pdfBase64: testPDFBase64, filename: 'test.pdf' }
    },
    {
      file: 'api/public-extract.js',
      name: '/api/public-extract',
      body: { pdfBase64: testPDFBase64, filename: 'test.pdf' }
    },
    {
      file: 'api/true-100-percent-extractor.js',
      name: '/api/true-100-percent-extractor',
      body: { pdfBase64: testPDFBase64, filename: 'test.pdf' }
    },
    {
      file: 'api/bulletproof-processor.js',
      name: '/api/bulletproof-processor',
      body: { pdfBase64: testPDFBase64, filename: 'test.pdf' }
    },
    {
      file: 'api/max-plan-processor.js',
      name: '/api/max-plan-processor',
      body: { pdfBase64: testPDFBase64, filename: 'test.pdf' }
    },
    {
      file: 'api/mcp-integration.js',
      name: '/api/mcp-integration',
      body: { pdfBase64: testPDFBase64, filename: 'test.pdf' }
    }
  ];
  
  const results = {};
  
  for (const test of tests) {
    const result = await testEndpoint(test.file, test.name, test.body);
    results[test.name] = result;
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const successful = Object.values(results).filter(r => r.success).length;
  const failed = Object.values(results).filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  console.log('\n🔍 DETAILED RESULTS:');
  Object.entries(results).forEach(([endpoint, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${endpoint}: ${result.success ? 'OK' : result.error}`);
  });
  
  // Common issues analysis
  console.log('\n⚠️  COMMON ISSUES FOUND:');
  console.log('='.repeat(50));
  
  const issues = [];
  Object.entries(results).forEach(([endpoint, result]) => {
    if (!result.success) {
      if (result.error.includes('pdf-parse')) {
        issues.push(`${endpoint}: pdf-parse import issue`);
      }
      if (result.error.includes('@anthropic')) {
        issues.push(`${endpoint}: Anthropic SDK import issue`);
      }
      if (result.error.includes('@azure')) {
        issues.push(`${endpoint}: Azure SDK import issue`);
      }
      if (result.error.includes('createRequire')) {
        issues.push(`${endpoint}: ESM/CommonJS import issue`);
      }
      if (result.error.includes('500')) {
        issues.push(`${endpoint}: Runtime error (500)`);
      }
    }
  });
  
  if (issues.length > 0) {
    issues.forEach(issue => console.log(`• ${issue}`));
  } else {
    console.log('No common issues detected.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});