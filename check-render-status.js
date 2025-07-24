const https = require('https');

const RENDER_URL = 'https://pdf-fzzi.onrender.com';
const TIMEOUT = 10000; // 10 seconds

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(RENDER_URL + path);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: method,
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Render-Status-Check/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.end();
  });
}

async function checkRenderStatus() {
  console.log(`${colors.blue}🔍 Checking Render deployment status...${colors.reset}\n`);
  
  let checks = {
    connectivity: false,
    systemCapabilities: false,
    newEndpoints: false,
    titleUpdated: false
  };

  // 1. Test basic connectivity
  console.log('1. Testing basic connectivity...');
  try {
    const response = await makeRequest('/');
    if (response.statusCode === 200) {
      checks.connectivity = true;
      console.log(`${colors.green}✓ Server is reachable${colors.reset}`);
      
      // Check if title is updated
      if (response.body.includes('Smart OCR Learning System')) {
        console.log(`${colors.yellow}⚠ Still showing old "Smart OCR Learning System" title${colors.reset}`);
      } else if (response.body.includes('PDF Processing System') || response.body.includes('Comprehensive PDF')) {
        checks.titleUpdated = true;
        console.log(`${colors.green}✓ Title updated from Smart OCR${colors.reset}`);
      }
    } else {
      console.log(`${colors.red}✗ Server returned status ${response.statusCode}${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}✗ Cannot reach server: ${error.message}${colors.reset}`);
  }

  // 2. Check system capabilities endpoint
  console.log('\n2. Checking /api/system-capabilities...');
  try {
    const response = await makeRequest('/api/system-capabilities');
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      checks.systemCapabilities = true;
      console.log(`${colors.green}✓ System capabilities endpoint working${colors.reset}`);
      console.log(`   Version: ${data.version || 'unknown'}`);
      console.log(`   Endpoints: ${data.availableEndpoints?.length || 0} available`);
      
      // Check if new endpoints are listed
      if (data.availableEndpoints) {
        const hasNewEndpoints = data.availableEndpoints.some(ep => 
          ep.includes('smart-ocr') || 
          ep.includes('mistral') || 
          ep.includes('multi-agent')
        );
        if (hasNewEndpoints) {
          checks.newEndpoints = true;
          console.log(`${colors.green}✓ New endpoints are registered${colors.reset}`);
        }
      }
    } else {
      console.log(`${colors.red}✗ Endpoint returned status ${response.statusCode}${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}✗ System capabilities check failed: ${error.message}${colors.reset}`);
  }

  // 3. Test new endpoint (should return 405 for GET)
  console.log('\n3. Testing new endpoint /api/smart-ocr/process...');
  try {
    const response = await makeRequest('/api/smart-ocr/process');
    if (response.statusCode === 405) {
      checks.newEndpoints = true;
      console.log(`${colors.green}✓ New endpoint exists (returned expected 405 for GET)${colors.reset}`);
    } else if (response.statusCode === 404) {
      console.log(`${colors.red}✗ New endpoint not found (404) - deployment may have failed${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ Unexpected status ${response.statusCode}${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}✗ Endpoint test failed: ${error.message}${colors.reset}`);
  }

  // 4. Test another new endpoint
  console.log('\n4. Testing /api/mistral-ocr/process...');
  try {
    const response = await makeRequest('/api/mistral-ocr/process');
    if (response.statusCode === 405 || response.statusCode === 200) {
      console.log(`${colors.green}✓ Mistral OCR endpoint exists${colors.reset}`);
    } else if (response.statusCode === 404) {
      console.log(`${colors.red}✗ Mistral OCR endpoint not found${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠ Could not test Mistral endpoint${colors.reset}`);
  }

  // Final summary
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}DEPLOYMENT STATUS SUMMARY${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}`);

  const successCount = Object.values(checks).filter(v => v).length;
  const totalChecks = Object.keys(checks).length;

  if (successCount === totalChecks) {
    console.log(`${colors.green}✅ DEPLOYMENT SUCCESSFUL!${colors.reset}`);
    console.log(`${colors.green}All checks passed (${successCount}/${totalChecks})${colors.reset}`);
  } else if (checks.connectivity && checks.newEndpoints) {
    console.log(`${colors.green}✅ DEPLOYMENT SUCCESSFUL (with minor issues)${colors.reset}`);
    console.log(`${colors.yellow}Most critical checks passed (${successCount}/${totalChecks})${colors.reset}`);
  } else if (checks.connectivity) {
    console.log(`${colors.red}❌ DEPLOYMENT FAILED${colors.reset}`);
    console.log(`${colors.red}Server is running but new code not deployed${colors.reset}`);
    console.log(`${colors.yellow}Only ${successCount}/${totalChecks} checks passed${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ DEPLOYMENT UNREACHABLE${colors.reset}`);
    console.log(`${colors.red}Cannot connect to Render server${colors.reset}`);
  }

  console.log(`\n${colors.blue}Detailed Results:${colors.reset}`);
  console.log(`  Connectivity: ${checks.connectivity ? '✓' : '✗'}`);
  console.log(`  System Capabilities: ${checks.systemCapabilities ? '✓' : '✗'}`);
  console.log(`  New Endpoints: ${checks.newEndpoints ? '✓' : '✗'}`);
  console.log(`  Title Updated: ${checks.titleUpdated ? '✓' : '✗'}`);

  // Exit with appropriate code
  process.exit(successCount === totalChecks ? 0 : 1);
}

// Run the check
checkRenderStatus().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});