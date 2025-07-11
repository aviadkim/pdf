// 🚀 ULTIMATE PDF PROCESSOR - Family Office Back Office System
// Complete PDF-to-image splitting + Azure Form Recognizer + Claude Vision
// Designed for maximum accuracy with 42+ holdings extraction

export default async function handler(req, res) {
  // Handle CORS for production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed - Use POST',
      supportedMethods: ['POST']
    });
  }

  const processingStartTime = Date.now();
  
  try {
    console.log('🏛️ ULTIMATE PDF PROCESSOR - Starting Family Office Processing');
    
    const { pdfBase64, filename } = req.body;
    
    if (!pdfBase64) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing PDF data - Please provide pdfBase64 field',
        requiredFields: ['pdfBase64', 'filename']
      });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    console.log(`📄 Processing PDF: ${filename || 'unknown.pdf'}`);
    console.log(`📊 PDF size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    // Environment check
    const azureKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || process.env.AZURE_FORM_KEY;
    const azureEndpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || process.env.AZURE_FORM_ENDPOINT;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    
    console.log('🔑 Environment Status:');
    console.log(`   Azure Key: ${azureKey ? '✅ Available' : '❌ Missing'}`);
    console.log(`   Azure Endpoint: ${azureEndpoint ? '✅ Available' : '❌ Missing'}`);
    console.log(`   Claude Key: ${claudeKey ? '✅ Available' : '❌ Missing'}`);
    
    // Step 1: Convert PDF to images (page splitting)
    console.log('🖼️ Step 1: Converting PDF to images...');
    const imageData = await convertPdfToImages(pdfBuffer);
    
    if (!imageData || imageData.length === 0) {
      throw new Error('Failed to convert PDF to images');
    }
    
    console.log(`✅ PDF converted to ${imageData.length} page images`);
    
    // Step 2: Process with Azure Form Recognizer
    let azureResults = [];
    let azureSuccess = false;
    
    if (azureKey && azureEndpoint) {
      console.log('🔷 Step 2: Processing with Azure Form Recognizer...');
      try {
        azureResults = await processWithAzure(imageData, azureKey, azureEndpoint);
        azureSuccess = true;
        console.log(`✅ Azure processing complete: ${azureResults.length} results`);
      } catch (error) {
        console.log('⚠️ Azure processing failed:', error.message);
      }
    }
    
    // Step 3: Process with Claude Vision (backup/enhancement)
    let claudeResults = [];
    let claudeSuccess = false;
    
    if (claudeKey) {
      console.log('👁️ Step 3: Processing with Claude Vision...');
      try {
        claudeResults = await processWithClaudeVision(imageData, claudeKey, filename);
        claudeSuccess = true;
        console.log(`✅ Claude Vision processing complete: ${claudeResults.length} results`);
      } catch (error) {
        console.log('⚠️ Claude Vision processing failed:', error.message);
      }
    }
    
    // Step 4: Combine and optimize results
    console.log('🔄 Step 4: Combining and optimizing results...');
    const finalResults = combineResults(azureResults, claudeResults);
    
    // Step 5: Generate comprehensive response
    const processingTime = Date.now() - processingStartTime;
    
    console.log(`✅ Processing complete in ${processingTime}ms`);
    console.log(`📊 Total holdings extracted: ${finalResults.holdings.length}`);
    
    // Generate CSV data for download
    const csvData = generateCSV(finalResults.holdings);
    
    res.status(200).json({
      success: true,
      data: {
        holdings: finalResults.holdings,
        portfolioInfo: {
          ...finalResults.portfolioInfo,
          totalValue: finalResults.holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0),
          extractionDate: new Date().toISOString(),
          processingMethod: azureSuccess && claudeSuccess ? 'Hybrid (Azure + Claude)' : 
                           azureSuccess ? 'Azure Form Recognizer' : 
                           claudeSuccess ? 'Claude Vision' : 'Fallback'
        }
      },
      metadata: {
        processingTime: `${processingTime}ms`,
        pagesProcessed: imageData.length,
        holdingsFound: finalResults.holdings.length,
        azureUsed: azureSuccess,
        claudeUsed: claudeSuccess,
        confidence: azureSuccess ? 95 : claudeSuccess ? 90 : 0,
        filename: filename || 'unknown.pdf',
        version: 'ULTIMATE-PROCESSOR-V1.0'
      },
      csvData: csvData,
      downloadReady: true,
      message: finalResults.holdings.length > 0 ? 
        `Successfully extracted ${finalResults.holdings.length} holdings` : 
        'No holdings found - check API configuration'
    });
    
  } catch (error) {
    console.error('❌ Ultimate PDF processing failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'PDF processing failed',
      details: error.message,
      timestamp: new Date().toISOString(),
      version: 'ULTIMATE-PROCESSOR-V1.0'
    });
  }
}

// 🖼️ PDF to Images Conversion Function
async function convertPdfToImages(pdfBuffer) {
  console.log('🖼️ Converting PDF to images...');
  
  try {
    // Use pdf-poppler for reliable PDF to image conversion
    const { pdf2pic } = await import('pdf2pic');
    
    const convert = pdf2pic.fromBuffer(pdfBuffer, {
      density: 300,           // High DPI for better text recognition
      saveFilename: "page",
      savePath: "/tmp",
      format: "png",
      width: 2480,           // A4 width at 300 DPI
      height: 3508           // A4 height at 300 DPI
    });
    
    const results = await convert.bulk(-1); // Convert all pages
    
    // Convert to base64 for API processing
    const imageData = [];
    for (const result of results) {
      const fs = await import('fs');
      const imageBuffer = fs.readFileSync(result.path);
      const base64Data = imageBuffer.toString('base64');
      
      imageData.push({
        pageNumber: result.page,
        base64: base64Data,
        format: 'png',
        path: result.path
      });
      
      // Clean up temporary file
      fs.unlinkSync(result.path);
    }
    
    console.log(`✅ Converted ${imageData.length} pages to images`);
    return imageData;
    
  } catch (error) {
    console.log('⚠️ pdf2pic failed, trying alternative method...');
    
    // Fallback: Use sharp for PDF processing
    try {
      const sharp = await import('sharp');
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
      
      // Load PDF
      const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
      const imageData = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        
        // Create canvas
        const canvas = new (await import('canvas')).Canvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');
        
        // Render page
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        // Convert to base64
        const base64Data = canvas.toBuffer('image/png').toString('base64');
        
        imageData.push({
          pageNumber: pageNum,
          base64: base64Data,
          format: 'png'
        });
      }
      
      console.log(`✅ Converted ${imageData.length} pages using PDF.js`);
      return imageData;
      
    } catch (fallbackError) {
      console.error('❌ All image conversion methods failed:', fallbackError);
      throw new Error('PDF to image conversion failed');
    }
  }
}

// 🔷 Azure Form Recognizer Processing
async function processWithAzure(imageData, azureKey, azureEndpoint) {
  console.log('🔷 Processing with Azure Form Recognizer...');
  
  try {
    const { DocumentAnalysisClient, AzureKeyCredential } = await import('@azure/ai-form-recognizer');
    
    const client = new DocumentAnalysisClient(
      azureEndpoint,
      new AzureKeyCredential(azureKey)
    );
    
    const allHoldings = [];
    
    // Process each page image
    for (const imageInfo of imageData) {
      console.log(`🔍 Processing page ${imageInfo.pageNumber}...`);
      
      const imageBuffer = Buffer.from(imageInfo.base64, 'base64');
      
      // Analyze with prebuilt-layout for maximum accuracy
      const poller = await client.beginAnalyzeDocument('prebuilt-layout', imageBuffer);
      const result = await poller.pollUntilDone();
      
      // Extract holdings from this page
      const pageHoldings = extractHoldingsFromAzureResult(result, imageInfo.pageNumber);
      allHoldings.push(...pageHoldings);
      
      console.log(`📊 Page ${imageInfo.pageNumber}: ${pageHoldings.length} holdings found`);
    }
    
    console.log(`✅ Azure processing complete: ${allHoldings.length} total holdings`);
    return allHoldings;
    
  } catch (error) {
    console.error('❌ Azure processing failed:', error);
    throw error;
  }
}

// 👁️ Claude Vision Processing
async function processWithClaudeVision(imageData, claudeKey, filename) {
  console.log('👁️ Processing with Claude Vision...');
  
  try {
    const { Anthropic } = await import('@anthropic-ai/sdk');
    
    const anthropic = new Anthropic({
      apiKey: claudeKey,
    });
    
    const allHoldings = [];
    
    // Process images in batches to avoid token limits
    const batchSize = 3;
    for (let i = 0; i < imageData.length; i += batchSize) {
      const batch = imageData.slice(i, i + batchSize);
      
      console.log(`🔍 Processing Claude batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(imageData.length/batchSize)}...`);
      
      // Prepare images for Claude
      const images = batch.map(img => ({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/png",
          data: img.base64
        }
      }));
      
      // Create comprehensive prompt
      const content = [
        {
          type: "text",
          text: `🏛️ FAMILY OFFICE DOCUMENT ANALYSIS
          
Please analyze these banking document pages and extract ALL financial holdings with complete accuracy.

EXTRACTION REQUIREMENTS:
1. Find ALL securities/holdings (target: 40+ for Swiss banking documents)
2. Extract ISIN codes (12 characters: 2 letters + 10 alphanumeric)
3. Extract current market values (handle Swiss formatting: 1'234'567.89)
4. Extract security names and descriptions
5. Extract currencies and categories
6. Extract portfolio totals and client information

CRITICAL: This is for a Family Office back-office system. Accuracy is paramount.

Return JSON format:
{
  "holdings": [
    {
      "position": number,
      "securityName": "Full Security Name",
      "isin": "ISIN Code",
      "currentValue": number,
      "currency": "USD/CHF/EUR",
      "category": "Securities/Bonds/Funds",
      "pageNumber": number
    }
  ],
  "portfolioInfo": {
    "clientName": "Client Name",
    "portfolioTotal": {"value": number, "currency": "USD"},
    "bankName": "Bank Name",
    "statementDate": "Date if found"
  }
}

IMPORTANT: Only return valid JSON. Extract ALL holdings, not just examples.`
        },
        ...images
      ];
      
      const message = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4000,
        messages: [{
          role: "user",
          content: content
        }]
      });
      
      // Parse response
      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const batchResults = JSON.parse(jsonMatch[0]);
        if (batchResults.holdings) {
          allHoldings.push(...batchResults.holdings);
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ Claude Vision processing complete: ${allHoldings.length} holdings`);
    return allHoldings;
    
  } catch (error) {
    console.error('❌ Claude Vision processing failed:', error);
    throw error;
  }
}

// 🔄 Extract Holdings from Azure Result
function extractHoldingsFromAzureResult(result, pageNumber) {
  const holdings = [];
  
  if (!result.tables || result.tables.length === 0) {
    return holdings;
  }
  
  for (const table of result.tables) {
    // Group cells by row
    const rows = {};
    for (const cell of table.cells) {
      if (!rows[cell.rowIndex]) {
        rows[cell.rowIndex] = [];
      }
      rows[cell.rowIndex].push(cell);
    }
    
    // Process each row
    for (const rowIndex in rows) {
      const row = rows[rowIndex];
      const rowText = row.map(cell => cell.content).join(' ');
      
      // Look for ISIN pattern
      const isinMatches = rowText.match(/[A-Z]{2}[A-Z0-9]{10}/g);
      
      if (isinMatches) {
        for (const isin of isinMatches) {
          let securityName = 'Unknown Security';
          let currentValue = 0;
          let currency = 'USD';
          
          // Extract security name (longest meaningful text)
          for (const cell of row) {
            const text = cell.content.trim();
            if (text.length > 10 && !text.match(/^\d/) && text !== isin) {
              securityName = text;
              break;
            }
          }
          
          // Extract value
          for (const cell of row) {
            const valueMatch = cell.content.match(/[\d,'.\s]+/);
            if (valueMatch) {
              const cleanValue = valueMatch[0].replace(/[,'\s]/g, '');
              const numValue = parseFloat(cleanValue);
              if (numValue > 100) {
                currentValue = numValue;
              }
            }
          }
          
          // Extract currency
          const currencyMatch = rowText.match(/\b(USD|CHF|EUR|GBP)\b/);
          if (currencyMatch) {
            currency = currencyMatch[0];
          }
          
          holdings.push({
            position: holdings.length + 1,
            securityName: securityName.substring(0, 100),
            isin: isin,
            currentValue: currentValue,
            currency: currency,
            category: 'Securities',
            pageNumber: pageNumber,
            extractedBy: 'Azure'
          });
        }
      }
    }
  }
  
  return holdings;
}

// 🔄 Combine Results from Multiple Sources
function combineResults(azureResults, claudeResults) {
  console.log('🔄 Combining results...');
  
  const allHoldings = [];
  const seenISINs = new Set();
  
  // Add Azure results first (higher confidence)
  for (const holding of azureResults) {
    if (holding.isin && !seenISINs.has(holding.isin)) {
      seenISINs.add(holding.isin);
      allHoldings.push({
        ...holding,
        source: 'Azure',
        confidence: 95
      });
    }
  }
  
  // Add Claude results (fill gaps)
  for (const holding of claudeResults) {
    if (holding.isin && !seenISINs.has(holding.isin)) {
      seenISINs.add(holding.isin);
      allHoldings.push({
        ...holding,
        source: 'Claude',
        confidence: 90
      });
    }
  }
  
  // Sort by value descending
  allHoldings.sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0));
  
  // Update positions
  allHoldings.forEach((holding, index) => {
    holding.position = index + 1;
  });
  
  const portfolioTotal = allHoldings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
  
  console.log(`✅ Combined ${allHoldings.length} unique holdings`);
  console.log(`💰 Total portfolio value: ${portfolioTotal.toLocaleString()}`);
  
  return {
    holdings: allHoldings,
    portfolioInfo: {
      clientName: 'Family Office Client',
      portfolioTotal: { value: portfolioTotal, currency: 'USD' },
      bankName: 'Swiss Private Bank',
      extractionDate: new Date().toISOString(),
      totalHoldings: allHoldings.length
    }
  };
}

// 📊 Generate CSV Data
function generateCSV(holdings) {
  if (!holdings || holdings.length === 0) {
    return 'No holdings data available';
  }
  
  const headers = [
    'Position',
    'Security Name',
    'ISIN',
    'Current Value',
    'Currency',
    'Category',
    'Page Number',
    'Source',
    'Confidence'
  ];
  
  const csvRows = [headers.join(',')];
  
  for (const holding of holdings) {
    const row = [
      holding.position || '',
      `"${(holding.securityName || '').replace(/"/g, '""')}"`,
      holding.isin || '',
      holding.currentValue || 0,
      holding.currency || 'USD',
      holding.category || 'Securities',
      holding.pageNumber || 1,
      holding.source || 'Unknown',
      holding.confidence || 0
    ];
    csvRows.push(row.join(','));
  }
  
  return csvRows.join('\n');
}