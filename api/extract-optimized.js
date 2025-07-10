// Optimized PDF extraction endpoint with performance enhancements
import { Anthropic } from '@anthropic-ai/sdk';
import { setSecurityHeaders, validatePDFInput, sanitizeOutput, createErrorResponse, checkRateLimit } from '../lib/security.js';
import { responseCache, generateCacheKey, processLargePDF, parallelAPIExtraction, performanceMonitor } from '../lib/performance.js';
import { convertPDFToImages } from '../lib/puppeteer-config.js';

export default async function handler(req, res) {
  // Security headers and CORS
  const origin = req.headers.origin;
  setSecurityHeaders(res, origin);
  
  // Rate limiting
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const operationId = `extract-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  performanceMonitor.start(operationId);

  try {
    const { pdfBase64, filename, method = 'auto', useCache = true } = req.body;
    
    if (!pdfBase64) {
      return res.status(400).json({ 
        error: 'Missing PDF data',
        details: 'Please provide pdfBase64 in the request body'
      });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    
    // Validate PDF input
    const validationErrors = validatePDFInput(pdfBuffer, filename);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid file',
        details: validationErrors
      });
    }

    // Check cache first
    const cacheKey = generateCacheKey(pdfBuffer, method);
    if (useCache) {
      const cachedResult = responseCache.get(cacheKey);
      if (cachedResult) {
        const perfMetrics = performanceMonitor.end(operationId);
        return res.status(200).json({
          ...cachedResult,
          cached: true,
          performance: perfMetrics
        });
      }
    }

    // Determine extraction methods based on file size and request
    const extractionMethods = await getExtractionMethods(pdfBuffer, method);
    
    // Process with parallel extraction
    const result = await parallelAPIExtraction(pdfBuffer, extractionMethods);
    
    if (!result.success) {
      return res.status(500).json(createErrorResponse(new Error(result.error)));
    }

    // Sanitize output
    const sanitizedData = sanitizeOutput(result.data);
    
    // Cache successful results
    if (useCache && result.confidence > 70) {
      responseCache.set(cacheKey, {
        success: true,
        data: sanitizedData,
        metadata: {
          method: result.method,
          confidence: result.confidence,
          filename: filename || 'document.pdf',
          extractionDate: new Date().toISOString()
        }
      });
    }

    const perfMetrics = performanceMonitor.end(operationId);
    
    return res.status(200).json({
      success: true,
      data: sanitizedData,
      metadata: {
        method: result.method,
        confidence: result.confidence,
        filename: filename || 'document.pdf',
        extractionDate: new Date().toISOString(),
        cached: false
      },
      performance: perfMetrics
    });

  } catch (error) {
    const perfMetrics = performanceMonitor.end(operationId);
    console.error(`Extraction error [${operationId}]:`, error.message);
    
    return res.status(500).json({
      ...createErrorResponse(error, process.env.NODE_ENV === 'development'),
      performance: perfMetrics
    });
  }
}

// Get appropriate extraction methods based on file characteristics
async function getExtractionMethods(pdfBuffer, preferredMethod) {
  const fileSizeMB = pdfBuffer.length / (1024 * 1024);
  const methods = [];

  // Always include text-based extraction as fallback
  methods.push({
    name: 'text-extraction',
    processor: async (buffer) => await extractWithTextParsing(buffer),
    confidence: 70
  });

  // Add vision-based extraction for smaller files
  if (fileSizeMB < 20 && (preferredMethod === 'auto' || preferredMethod === 'vision')) {
    methods.push({
      name: 'vision-extraction',
      processor: async (buffer) => await extractWithVision(buffer),
      confidence: 90
    });
  }

  // Add Azure extraction if available
  if (process.env.AZURE_FORM_KEY && process.env.AZURE_FORM_ENDPOINT) {
    methods.push({
      name: 'azure-extraction',
      processor: async (buffer) => await extractWithAzure(buffer),
      confidence: 95
    });
  }

  return methods;
}

// Text-based extraction
async function extractWithTextParsing(pdfBuffer) {
  const pdfParse = (await import('pdf-parse')).default;
  const pdfData = await pdfParse(pdfBuffer);
  
  // Basic ISIN pattern extraction
  const isinPattern = /([A-Z]{2}[A-Z0-9]{9}[0-9])/g;
  const isins = [...new Set(pdfData.text.match(isinPattern) || [])];
  
  const holdings = isins.map((isin, index) => ({
    position: index + 1,
    isin,
    securityName: `Security ${index + 1}`,
    currentValue: 0,
    currency: 'USD',
    category: 'Securities'
  }));

  return {
    holdings,
    portfolioInfo: {
      portfolioTotal: { value: 0, currency: 'USD' },
      extractionMethod: 'text-parsing'
    }
  };
}

// Vision-based extraction using Claude
async function extractWithVision(pdfBuffer) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  // Convert PDF to images first
  const imageResults = await convertPDFToImages(pdfBuffer, {
    maxPages: 10,
    quality: 80,
    format: 'png'
  });

  if (!imageResults.success || imageResults.images.length === 0) {
    throw new Error('Failed to convert PDF to images');
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Process first few pages
  const imagesToProcess = imageResults.images.slice(0, 3);
  const allHoldings = [];

  for (const image of imagesToProcess) {
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 3000,
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract financial holdings from this PDF page. Focus on ISIN codes and security names. Return JSON format:
              {
                "holdings": [
                  {
                    "isin": "ISIN code",
                    "securityName": "security name",
                    "currentValue": number,
                    "currency": "USD"
                  }
                ]
              }`
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: image.base64
              }
            }
          ]
        }]
      });

      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const pageData = JSON.parse(jsonMatch[0]);
        if (pageData.holdings) {
          allHoldings.push(...pageData.holdings);
        }
      }
    } catch (error) {
      console.error(`Vision extraction failed for page ${image.page}:`, error.message);
    }
  }

  // Remove duplicates by ISIN
  const uniqueHoldings = new Map();
  for (const holding of allHoldings) {
    if (holding.isin && !uniqueHoldings.has(holding.isin)) {
      uniqueHoldings.set(holding.isin, {
        ...holding,
        position: uniqueHoldings.size + 1,
        category: 'Securities'
      });
    }
  }

  const holdings = Array.from(uniqueHoldings.values());
  const totalValue = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);

  return {
    holdings,
    portfolioInfo: {
      portfolioTotal: { value: totalValue, currency: 'USD' },
      extractionMethod: 'vision-analysis',
      pagesProcessed: imagesToProcess.length
    }
  };
}

// Azure Form Recognizer extraction
async function extractWithAzure(pdfBuffer) {
  const { DocumentAnalysisClient, AzureKeyCredential } = await import('@azure/ai-form-recognizer');
  
  const client = new DocumentAnalysisClient(
    process.env.AZURE_FORM_ENDPOINT,
    new AzureKeyCredential(process.env.AZURE_FORM_KEY)
  );

  const poller = await client.beginAnalyzeDocument('prebuilt-layout', pdfBuffer);
  const result = await poller.pollUntilDone();

  const holdings = [];
  
  if (result.tables) {
    for (const table of result.tables) {
      const tableHoldings = extractHoldingsFromTable(table);
      holdings.push(...tableHoldings);
    }
  }

  return {
    holdings,
    portfolioInfo: {
      portfolioTotal: { 
        value: holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0), 
        currency: 'USD' 
      },
      extractionMethod: 'azure-form-recognizer',
      tablesProcessed: result.tables?.length || 0
    }
  };
}

// Extract holdings from Azure table
function extractHoldingsFromTable(table) {
  const holdings = [];
  const cells = table.cells || [];
  
  // Simple extraction logic - would need refinement for production
  for (const cell of cells) {
    const isinMatch = cell.content.match(/([A-Z]{2}[A-Z0-9]{9}[0-9])/);
    if (isinMatch) {
      holdings.push({
        isin: isinMatch[1],
        securityName: 'Azure Extracted Security',
        currentValue: 0,
        currency: 'USD',
        category: 'Securities'
      });
    }
  }
  
  return holdings;
}