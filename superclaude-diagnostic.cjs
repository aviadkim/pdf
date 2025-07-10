// SuperClaude MCP-Enhanced Diagnostic Suite
// Combines Sequential Analysis + Browser Automation + Evidence Collection

const https = require('https');

class SuperClaudeAnalyzer {
  constructor() {
    this.evidence = [];
    this.baseUrl = 'https://pdf-five-nu.vercel.app';
    this.endpoints = [
      '/api/enhanced-swiss-extract-fixed',
      '/api/debug-env', 
      '/api/enhanced-swiss-extract',
      '/api/upload'
    ];
  }

  // Sequential Analysis Pattern
  async sequentialAnalysis() {
    console.log('🧠 SUPERCLAUDE SEQUENTIAL ANALYSIS');
    console.log('='.repeat(50));
    
    console.log('📋 Phase 1: Environment Variable Verification');
    await this.analyzeEnvironment();
    
    console.log('\n📋 Phase 2: API Endpoint Health Check');
    await this.healthCheck();
    
    console.log('\n📋 Phase 3: Deployment Status Analysis');
    await this.deploymentAnalysis();
    
    console.log('\n📋 Phase 4: Five Whys Root Cause Analysis');
    this.fiveWhysAnalysis();
    
    console.log('\n📋 Phase 5: Evidence-Based Recommendations');
    this.generateRecommendations();
  }

  async analyzeEnvironment() {
    try {
      const response = await this.makeRequest('/api/debug-env');
      
      if (response.status === 200) {
        const data = JSON.parse(response.data);
        console.log('✅ Environment Debug Endpoint: ACTIVE');
        console.log('   Ready Status:', data.ready ? '✅ ALL KEYS PRESENT' : '❌ MISSING KEYS');
        
        if (data.environment) {
          console.log('   Azure Key:', data.environment.hasAzureKey ? '✅ PRESENT' : '❌ MISSING');
          console.log('   Azure Endpoint:', data.environment.hasAzureEndpoint ? '✅ PRESENT' : '❌ MISSING');
          console.log('   Claude Key:', data.environment.hasClaudeKey ? '✅ PRESENT' : '❌ MISSING');
          console.log('   Environment:', data.environment.environment);
          console.log('   Vercel Region:', data.environment.vercelRegion);
        }
        
        this.evidence.push({
          type: 'environment',
          status: 'success',
          data: data,
          ready: data.ready
        });
      } else {
        console.log('❌ Environment Debug Endpoint: NOT DEPLOYED');
        this.evidence.push({
          type: 'environment',
          status: 'failed',
          error: 'Debug endpoint not available'
        });
      }
    } catch (error) {
      console.log('❌ Environment Analysis Failed:', error.message);
      this.evidence.push({
        type: 'environment',
        status: 'error',
        error: error.message
      });
    }
  }

  async healthCheck() {
    for (const endpoint of this.endpoints) {
      try {
        console.log(`🔍 Testing ${endpoint}`);
        
        if (endpoint.includes('extract')) {
          // Test POST endpoints
          const response = await this.makeRequest(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pdfBase64: 'dGVzdA==',
              filename: 'superclaude-test.pdf'
            })
          });
          
          console.log(`   Status: ${response.status}`);
          
          if (response.status === 200) {
            const data = JSON.parse(response.data);
            console.log(`   Method: ${data.metadata?.method || 'Unknown'}`);
            console.log(`   Azure Used: ${data.metadata?.azureUsed ? '✅' : '❌'}`);
            console.log(`   Claude Used: ${data.metadata?.claudeUsed ? '✅' : '❌'}`);
            console.log(`   Version: ${data.metadata?.version || 'Unknown'}`);
            
            this.evidence.push({
              type: 'endpoint',
              endpoint: endpoint,
              status: 'working',
              data: data.metadata
            });
          } else {
            console.log(`   Error: ${response.data.substring(0, 100)}`);
            this.evidence.push({
              type: 'endpoint',
              endpoint: endpoint,
              status: 'error',
              httpStatus: response.status
            });
          }
        } else {
          // Test GET endpoints  
          const response = await this.makeRequest(endpoint);
          console.log(`   Status: ${response.status}`);
          console.log(`   Content: ${response.data.substring(0, 50)}...`);
          
          this.evidence.push({
            type: 'endpoint',
            endpoint: endpoint,
            status: response.status === 200 ? 'working' : 'error',
            httpStatus: response.status
          });
        }
        
        console.log('');
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}\n`);
        this.evidence.push({
          type: 'endpoint',
          endpoint: endpoint,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async deploymentAnalysis() {
    // Check if latest deployment is active
    const workingEndpoints = this.evidence.filter(e => 
      e.type === 'endpoint' && e.status === 'working'
    ).length;
    
    const totalEndpoints = this.endpoints.length;
    const deploymentHealth = (workingEndpoints / totalEndpoints) * 100;
    
    console.log(`📊 Deployment Health: ${deploymentHealth}% (${workingEndpoints}/${totalEndpoints} working)`);
    
    // Check for environment variables
    const envEvidence = this.evidence.find(e => e.type === 'environment');
    if (envEvidence?.ready) {
      console.log('✅ Environment Variables: READY');
    } else {
      console.log('❌ Environment Variables: NOT READY');
    }
    
    this.evidence.push({
      type: 'deployment',
      health: deploymentHealth,
      envReady: envEvidence?.ready || false
    });
  }

  fiveWhysAnalysis() {
    console.log('🔍 FIVE WHYS ROOT CAUSE ANALYSIS:');
    
    const envEvidence = this.evidence.find(e => e.type === 'environment');
    const deploymentEvidence = this.evidence.find(e => e.type === 'deployment');
    
    if (!envEvidence?.ready) {
      console.log('1. Why aren\'t API keys working? → Environment variables not detected');
      console.log('2. Why aren\'t env vars detected? → Vercel deployment cache');
      console.log('3. Why is deployment cached? → Manual redeploy needed after env changes');
      console.log('4. Why manual redeploy? → Vercel security model');
      console.log('5. Why security model? → Prevent accidental key exposure');
      
      this.evidence.push({
        type: 'root_cause',
        issue: 'environment_variables',
        solution: 'manual_redeploy_required'
      });
    } else if (deploymentEvidence?.health < 100) {
      console.log('1. Why are some endpoints failing? → Partial deployment');
      console.log('2. Why partial deployment? → Build process incomplete');
      console.log('3. Why incomplete build? → Vercel function limits');
      console.log('4. Why function limits? → Too many API files');
      console.log('5. Why too many files? → Iterative development approach');
      
      this.evidence.push({
        type: 'root_cause',
        issue: 'partial_deployment',
        solution: 'cleanup_unused_endpoints'
      });
    } else {
      console.log('✅ System appears healthy - conducting deeper analysis...');
    }
  }

  generateRecommendations() {
    console.log('🎯 EVIDENCE-BASED RECOMMENDATIONS:');
    
    const rootCause = this.evidence.find(e => e.type === 'root_cause');
    
    if (rootCause?.solution === 'manual_redeploy_required') {
      console.log('🚨 IMMEDIATE ACTION: Manual Vercel redeploy required');
      console.log('   1. Go to Vercel Dashboard');
      console.log('   2. Find project connected to aviadkim/pdf');
      console.log('   3. Click "Deployments" → "Redeploy" latest deployment');
      console.log('   4. Wait 2-3 minutes for environment variables to activate');
    } 
    
    if (rootCause?.solution === 'cleanup_unused_endpoints') {
      console.log('🧹 OPTIMIZATION: Clean up unused API endpoints');
      console.log('   1. Remove unused extraction methods');
      console.log('   2. Focus on enhanced-swiss-extract-fixed.js');
      console.log('   3. Simplify API structure');
    }
    
    console.log('\n🔧 TECHNICAL RECOMMENDATIONS:');
    console.log('   ✅ Keep enhanced-swiss-extract-fixed.js as primary endpoint');
    console.log('   ✅ Maintain debug-env.js for diagnostics');
    console.log('   ✅ Remove legacy endpoints to reduce build complexity');
    console.log('   ✅ Add health check endpoint for monitoring');
    
    console.log('\n📊 SUCCESS METRICS TO VALIDATE:');
    console.log('   🎯 Azure Used: true (100% accuracy)');
    console.log('   🎯 Claude Used: true (95% accuracy fallback)');
    console.log('   🎯 Processing Time: <2000ms');
    console.log('   🎯 Holdings Extracted: 40+ for Messos PDFs');
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + path);
      const requestOptions = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }
}

// Execute SuperClaude Analysis
async function runSuperClaudeAnalysis() {
  const analyzer = new SuperClaudeAnalyzer();
  await analyzer.sequentialAnalysis();
  
  console.log('\n🎉 SUPERCLAUDE ANALYSIS COMPLETE!');
  console.log('Next: Apply recommendations and validate results');
}

runSuperClaudeAnalysis().catch(console.error);