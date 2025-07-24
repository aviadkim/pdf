// 🏦 PADDLE FINANCIAL PROCESSOR - FastAPI Integration
// Integrates PaddleOCR 3.0 financial extractor with FinanceAI Pro system

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
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
      error: 'Method not allowed - Use POST only',
      processor: 'paddle-financial'
    });
  }

  const processingStartTime = Date.now();
  
  try {
    console.log('🏦 PADDLE FINANCIAL PROCESSOR INITIATED');
    
    const { pdfBase64, filename } = req.body;
    
    if (!pdfBase64) {
      return res.status(400).json({ 
        success: false, 
        error: 'No PDF data provided',
        processor: 'paddle-financial'
      });
    }

    // Create temporary file for processing
    const tempDir = '/tmp/paddle_processing';
    const tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
    const outputDir = path.join(tempDir, 'output');
    
    // Ensure directories exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save PDF to temporary file
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    console.log(`📄 Processing: ${filename || 'document.pdf'} (${Math.round(pdfBuffer.length/1024)}KB)`);
    
    // Run Python PaddleOCR extractor
    const extractionResult = await runPaddleExtractor(tempPdfPath, outputDir);
    
    // Clean up temporary files
    try {
      fs.unlinkSync(tempPdfPath);
    } catch (e) {
      console.warn('Could not clean up temp file:', e.message);
    }
    
    const processingTime = Date.now() - processingStartTime;
    
    if (extractionResult.success) {
      console.log('✅ Paddle extraction successful');
      console.log(`📊 Securities: ${extractionResult.securities?.length || 0}`);
      console.log(`💰 Total Value: $${extractionResult.total_value?.toLocaleString() || 0}`);
      console.log(`🎯 Confidence: ${(extractionResult.confidence * 100).toFixed(1)}%`);
      
      // Convert to FinanceAI Pro format
      const holdings = (extractionResult.securities || []).map(security => ({
        isin: security.isin,
        securityName: security.name,
        symbol: security.symbol,
        quantity: security.quantity,
        price: security.price,
        totalValue: security.market_value,
        currency: security.currency,
        percentage: security.percentage,
        source: 'paddle-ocr'
      }));
      
      res.status(200).json({
        success: true,
        message: `PaddleOCR extraction complete: ${holdings.length} securities found`,
        processor: 'paddle-financial',
        data: {
          holdings: holdings,
          totalValue: extractionResult.total_value || 0,
          institution: extractionResult.institution,
          documentType: extractionResult.document_type,
          confidence: extractionResult.confidence || 0,
          securitiesCount: holdings.length
        },
        analysis: {
          paddleOCR: {
            version: '3.0',
            structure_parser: 'PP-StructureV3',
            processing_time: extractionResult.processing_time || 0,
            confidence: extractionResult.confidence || 0,
            tables_found: extractionResult.tables?.length || 0,
            accounts_found: extractionResult.accounts?.length || 0
          },
          extraction_methods: [
            'paddleocr-structure-analysis',
            'table-recognition',
            'ocr-text-extraction',
            'financial-entity-extraction'
          ],
          processingTime: `${processingTime}ms`
        },
        raw_data: {
          full_text: extractionResult.full_text || '',
          tables: extractionResult.tables || [],
          accounts: extractionResult.accounts || [],
          errors: extractionResult.errors || []
        }
      });
      
    } else {
      console.log('❌ Paddle extraction failed');
      
      res.status(500).json({
        success: false,
        error: 'PaddleOCR extraction failed',
        processor: 'paddle-financial',
        details: extractionResult.errors || ['Unknown error'],
        analysis: {
          paddleOCR: {
            available: false,
            error: extractionResult.errors?.[0] || 'PaddleOCR not available'
          },
          processingTime: `${processingTime}ms`
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Paddle processor failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Paddle processing failed',
      processor: 'paddle-financial',
      details: error.message,
      analysis: {
        processingTime: `${Date.now() - processingStartTime}ms`
      }
    });
  }
}

async function runPaddleExtractor(pdfPath, outputDir) {
  return new Promise((resolve) => {
    // Create Python script to run the extractor
    const pythonScript = `
import sys
sys.path.append('${process.cwd()}')

import asyncio
import json
from paddle_financial_extractor import FinancialPDFExtractor

async def extract():
    extractor = FinancialPDFExtractor()
    
    if not extractor.paddle_available:
        return {
            "success": False,
            "errors": ["PaddleOCR not available - install with: pip install paddlepaddle paddleocr pdf2image opencv-python pandas"]
        }
    
    try:
        result = await extractor.extract_financial_data('${pdfPath}', '${outputDir}')
        
        # Convert to JSON-serializable format
        return {
            "success": result.success,
            "document_type": result.document_type,
            "institution": result.institution,
            "total_value": result.total_value,
            "securities": [
                {
                    "isin": sec.isin,
                    "name": sec.name,
                    "symbol": sec.symbol,
                    "quantity": sec.quantity,
                    "price": sec.price,
                    "market_value": sec.market_value,
                    "currency": sec.currency,
                    "percentage": sec.percentage
                } for sec in result.securities
            ],
            "accounts": result.accounts,
            "tables": result.tables,
            "full_text": result.full_text,
            "confidence": result.confidence,
            "processing_time": result.processing_time,
            "errors": result.errors
        }
        
    except Exception as e:
        return {
            "success": False,
            "errors": [str(e)]
        }

if __name__ == "__main__":
    result = asyncio.run(extract())
    print("PADDLE_RESULT_START")
    print(json.dumps(result, default=str))
    print("PADDLE_RESULT_END")
`;

    // Write and execute Python script
    const scriptPath = path.join(outputDir, 'extract_script.py');
    fs.writeFileSync(scriptPath, pythonScript);
    
    const python = spawn('python3', [scriptPath], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let error = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    python.on('close', (code) => {
      try {
        // Clean up script
        try {
          fs.unlinkSync(scriptPath);
        } catch (e) {
          // Ignore cleanup errors
        }
        
        if (code !== 0) {
          console.error('Python script failed with code:', code);
          console.error('Error output:', error);
          resolve({
            success: false,
            errors: [`Python script failed (code ${code})`, error]
          });
          return;
        }
        
        // Extract JSON result from output
        const startMarker = 'PADDLE_RESULT_START';
        const endMarker = 'PADDLE_RESULT_END';
        const startIndex = output.indexOf(startMarker);
        const endIndex = output.indexOf(endMarker);
        
        if (startIndex === -1 || endIndex === -1) {
          console.error('Could not find result markers in output:', output);
          resolve({
            success: false,
            errors: ['Could not parse Python output', output.substring(0, 500)]
          });
          return;
        }
        
        const jsonStr = output.substring(startIndex + startMarker.length, endIndex).trim();
        const result = JSON.parse(jsonStr);
        
        resolve(result);
        
      } catch (e) {
        console.error('Failed to parse Python result:', e);
        resolve({
          success: false,
          errors: ['Failed to parse extraction result', e.message]
        });
      }
    });
    
    // Set timeout
    setTimeout(() => {
      python.kill();
      resolve({
        success: false,
        errors: ['Python extraction timeout (60s)']
      });
    }, 60000);
  });
}