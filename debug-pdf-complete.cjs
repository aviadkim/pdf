// 🔍 COMPLETE PDF DEBUGGING SYSTEM
// Extract 100% of data to understand structure before processing

const fs = require('fs');
const path = require('path');

async function debugMessosPDF() {
  console.log('🔍 COMPLETE MESSOS PDF DEBUGGING SYSTEM');
  console.log('=' * 60);
  
  const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBuffer.toString('base64');
  
  console.log(`📄 PDF Size: ${pdfBuffer.length} bytes`);
  console.log(`📊 Base64 Length: ${pdfBase64.length} characters`);
  
  // Test multiple extraction methods
  const results = {
    azure: null,
    claude: null,
    currentWebsite: null
  };
  
  // 1. Test Azure Form Recognizer (Raw)
  console.log('\n🔷 TESTING AZURE FORM RECOGNIZER (RAW DATA EXTRACTION)');
  try {
    const azureResult = await testAzureRaw(pdfBase64);
    results.azure = azureResult;
    console.log(`✅ Azure: Found ${azureResult?.tables?.length || 0} tables`);
  } catch (error) {
    console.log(`❌ Azure failed: ${error.message}`);
  }
  
  // 2. Test Claude Vision (Raw)
  console.log('\n👁️ TESTING CLAUDE VISION (RAW DATA EXTRACTION)');
  try {
    const claudeResult = await testClaudeRaw(pdfBase64);
    results.claude = claudeResult;
    console.log(`✅ Claude: Extracted raw text`);
  } catch (error) {
    console.log(`❌ Claude failed: ${error.message}`);
  }
  
  // 3. Test Current Website
  console.log('\n🌐 TESTING CURRENT WEBSITE EXTRACTION');
  try {
    const websiteResult = await testCurrentWebsite(pdfBase64);
    results.currentWebsite = websiteResult;
    console.log(`✅ Website: ${websiteResult?.data?.holdings?.length || 0} holdings`);
  } catch (error) {
    console.log(`❌ Website failed: ${error.message}`);
  }
  
  // 4. ANALYZE RESULTS
  console.log('\n📊 COMPREHENSIVE ANALYSIS');
  await analyzeExtractionResults(results);
  
  // 5. GENERATE DEBUGGING REPORT
  await generateDebuggingReport(results);
  
  console.log('\n🎯 DEBUGGING COMPLETE - Check debug-report.json for details');
}

async function testAzureRaw(pdfBase64) {
  console.log('🔷 Azure Form Recognizer - Raw Extraction');
  
  const azureKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || process.env.AZURE_FORM_KEY;
  const azureEndpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || process.env.AZURE_FORM_ENDPOINT;
  
  if (!azureKey || !azureEndpoint) {
    throw new Error('Azure credentials not configured');
  }
  
  try {
    const { DocumentAnalysisClient, AzureKeyCredential } = await import('@azure/ai-form-recognizer');
    
    const client = new DocumentAnalysisClient(
      azureEndpoint,
      new AzureKeyCredential(azureKey)
    );
    
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const poller = await client.beginAnalyzeDocument('prebuilt-layout', pdfBuffer);
    const result = await poller.pollUntilDone();
    
    console.log(`📋 Found ${result.tables?.length || 0} tables`);
    console.log(`📝 Found ${result.paragraphs?.length || 0} paragraphs`);
    console.log(`🔢 Found ${result.pages?.length || 1} pages`);
    
    // Extract ALL text content
    const allText = [];
    if (result.paragraphs) {
      for (const paragraph of result.paragraphs) {
        allText.push(paragraph.content);
      }
    }
    
    return {
      tables: result.tables,
      paragraphs: result.paragraphs,
      pages: result.pages,
      allText: allText.join('\n'),
      keyValuePairs: result.keyValuePairs || []
    };
    
  } catch (error) {
    console.error('Azure extraction failed:', error);
    throw error;
  }
}

async function testClaudeRaw(pdfBase64) {
  console.log('👁️ Claude Vision - Raw Extraction');
  
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  if (!claudeKey) {
    throw new Error('Claude API key not configured');
  }
  
  try {
    const { Anthropic } = await import('@anthropic-ai/sdk');
    
    const anthropic = new Anthropic({
      apiKey: claudeKey,
    });
    
    const message = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `🔍 COMPLETE PDF DATA EXTRACTION

Extract EVERYTHING from this Swiss banking PDF. Don't process or format - just extract ALL text, numbers, and structure.

Return:
1. ALL text content line by line
2. ALL numbers found with their context
3. Table structure if visible
4. Any patterns you notice

Be comprehensive - extract every single piece of information visible.`
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64
            }
          }
        ]
      }]
    });
    
    const rawText = message.content[0].text;
    
    return {
      rawExtraction: rawText,
      extractionLength: rawText.length
    };
    
  } catch (error) {
    console.error('Claude extraction failed:', error);
    throw error;
  }
}

async function testCurrentWebsite(pdfBase64) {
  console.log('🌐 Current Website - Processed Extraction');
  
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/family-office-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: '2. Messos  - 31.03.2025.pdf'
      })
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    console.error('Website test failed:', error);
    throw error;
  }
}

async function analyzeExtractionResults(results) {
  console.log('\n📊 DETAILED ANALYSIS');
  
  // Analyze Azure results
  if (results.azure) {
    console.log('\n🔷 AZURE ANALYSIS:');
    console.log(`  Tables: ${results.azure.tables?.length || 0}`);
    console.log(`  Text length: ${results.azure.allText?.length || 0} characters`);
    
    // Look for currency amounts in raw text
    const currencyMatches = results.azure.allText?.match(/\$?[\d,']+\.?\d*/g) || [];
    console.log(`  Currency patterns found: ${currencyMatches.length}`);
    console.log(`  Sample amounts: ${currencyMatches.slice(0, 10).join(', ')}`);
    
    // Look for ISINs
    const isinMatches = results.azure.allText?.match(/[A-Z]{2}[A-Z0-9]{10}/g) || [];
    console.log(`  ISIN codes found: ${isinMatches.length}`);
    console.log(`  Sample ISINs: ${isinMatches.slice(0, 5).join(', ')}`);
  }
  
  // Analyze Claude results
  if (results.claude) {
    console.log('\n👁️ CLAUDE ANALYSIS:');
    console.log(`  Raw text length: ${results.claude.extractionLength} characters`);
    
    // Look for specific patterns in Claude extraction
    const claudeText = results.claude.rawExtraction || '';
    const amounts = claudeText.match(/\$?[\d,']+\.?\d*/g) || [];
    console.log(`  Amount patterns: ${amounts.length}`);
    
    // Look for the target total
    const targetMatches = claudeText.match(/19[,']?464[,']?431|19\.464\.431/g) || [];
    console.log(`  Target value (19,464,431) found: ${targetMatches.length > 0 ? 'YES' : 'NO'}`);
  }
  
  // Analyze current website results
  if (results.currentWebsite) {
    console.log('\n🌐 WEBSITE ANALYSIS:');
    const data = results.currentWebsite.data || {};
    console.log(`  Holdings extracted: ${data.holdings?.length || 0}`);
    console.log(`  Total value: $${(data.portfolioInfo?.totalValue || 0).toLocaleString()}`);
    console.log(`  Expected: $19,464,431`);
    
    const accuracy = (data.portfolioInfo?.totalValue || 0) / 19464431 * 100;
    console.log(`  Accuracy: ${accuracy.toFixed(1)}%`);
    
    // Analyze individual holdings
    if (data.holdings && data.holdings.length > 0) {
      console.log('\n  📋 HOLDINGS ANALYSIS:');
      const values = data.holdings.map(h => h.currentValue || 0);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
      
      console.log(`    Min value: $${minValue.toLocaleString()}`);
      console.log(`    Max value: $${maxValue.toLocaleString()}`);
      console.log(`    Avg value: $${avgValue.toLocaleString()}`);
      console.log(`    Values over $1M: ${values.filter(v => v > 1000000).length}`);
      console.log(`    Values under $100K: ${values.filter(v => v < 100000).length}`);
    }
  }
}

async function generateDebuggingReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    pdfFile: '2. Messos  - 31.03.2025.pdf',
    targetTotal: 19464431,
    extractionResults: {
      azure: {
        success: !!results.azure,
        tablesFound: results.azure?.tables?.length || 0,
        textLength: results.azure?.allText?.length || 0,
        sampleText: results.azure?.allText?.substring(0, 1000) || ''
      },
      claude: {
        success: !!results.claude,
        textLength: results.claude?.extractionLength || 0,
        sampleText: results.claude?.rawExtraction?.substring(0, 1000) || ''
      },
      website: {
        success: !!results.currentWebsite,
        holdingsCount: results.currentWebsite?.data?.holdings?.length || 0,
        extractedTotal: results.currentWebsite?.data?.portfolioInfo?.totalValue || 0,
        accuracy: ((results.currentWebsite?.data?.portfolioInfo?.totalValue || 0) / 19464431 * 100)
      }
    },
    issues: [],
    recommendations: []
  };
  
  // Identify issues
  if (report.extractionResults.website.accuracy < 90) {
    report.issues.push('Website extraction accuracy below 90%');
    report.recommendations.push('Review value extraction logic in API processors');
  }
  
  if (report.extractionResults.website.holdingsCount < 30) {
    report.issues.push('Low holdings count - might be missing data');
    report.recommendations.push('Check if all PDF pages/tables are being processed');
  }
  
  // Save detailed results
  fs.writeFileSync('debug-report.json', JSON.stringify(report, null, 2));
  fs.writeFileSync('debug-azure-raw.json', JSON.stringify(results.azure, null, 2));
  fs.writeFileSync('debug-claude-raw.json', JSON.stringify(results.claude, null, 2));
  fs.writeFileSync('debug-website-raw.json', JSON.stringify(results.currentWebsite, null, 2));
  
  console.log('\n💾 DEBUGGING FILES SAVED:');
  console.log('  - debug-report.json (summary)');
  console.log('  - debug-azure-raw.json (Azure raw data)');
  console.log('  - debug-claude-raw.json (Claude raw extraction)');
  console.log('  - debug-website-raw.json (Website processed data)');
}

// Run the debugging system
debugMessosPDF().catch(console.error);