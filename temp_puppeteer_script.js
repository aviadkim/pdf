
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function analyzePDFTables(pdfPath) {
  console.log('Starting Puppeteer browser...', { file: process.stderr });
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  try {
    // Convert PDF to data URL
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    const dataUrl = 'data:application/pdf;base64,' + pdfBase64;
    
    console.log('Loading PDF for analysis...', { file: process.stderr });
    await page.goto(dataUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Advanced table structure analysis
    const analysisResult = await page.evaluate(() => {
      const text = document.body.innerText || '';
      const tables = [];
      const securities = [];
      
      // Find all ISIN patterns with comprehensive context
      const isinRegex = /ISIN[:\s]*([A-Z]{2}[A-Z0-9]{9}[0-9])/g;
      let match;
      
      while ((match = isinRegex.exec(text)) !== null) {
        const isin = match[1];
        const position = match.index;
        
        // Extract extensive context around ISIN
        const contextStart = Math.max(0, position - 1000);
        const contextEnd = Math.min(text.length, position + 1000);
        const context = text.substring(contextStart, contextEnd);
        
        // Advanced number extraction with Swiss format support
        const numberPatterns = [
          /([0-9]{1,3}(?:'[0-9]{3})*)/g,  // Swiss format: 1'234'567
          /\b([0-9]{4,})\b/g,              // Regular format: 1234567
          /([0-9]+\.[0-9]+)/g             // Decimal format: 123.45
        ];
        
        const allNumbers = [];
        
        numberPatterns.forEach(pattern => {
          let numMatch;
          while ((numMatch = pattern.exec(context)) !== null) {
            const raw = numMatch[1];
            const parsed = parseInt(raw.replace(/[',\.]/g, ''));
            
            if (parsed > 1000 && parsed < 100000000) {
              allNumbers.push({
                raw: raw,
                parsed: parsed,
                position: numMatch.index,
                type: raw.includes("'") ? 'swiss' : raw.includes('.') ? 'decimal' : 'regular'
              });
            }
          }
        });
        
        // Find currency information
        const currencyMatch = context.match(/\b(USD|CHF|EUR|GBP)\b/);
        const currency = currencyMatch ? currencyMatch[1] : 'USD';
        
        // Extract security name
        const lines = context.split(/\n|\r/);
        let securityName = 'Unknown Security';
        
        for (const line of lines) {
          if (line.includes(isin) && line.length > 20) {
            securityName = line.replace(/ISIN[:\s]*[A-Z0-9]+/g, '').trim();
            break;
          }
        }
        
        securities.push({
          isin: isin,
          name: securityName.substring(0, 100),
          currency: currency,
          numbers: allNumbers,
          context: context.substring(0, 500),
          confidence: allNumbers.length > 0 ? 0.8 : 0.4
        });
      }
      
      return {
        securitiesFound: securities.length,
        securities: securities,
        textLength: text.length,
        analysisComplete: true
      };
    });
    
    await browser.close();
    
    console.log(`Analysis complete: ${analysisResult.securitiesFound} securities found`, { file: process.stderr });
    return analysisResult;
    
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Execute
const pdfPath = process.argv[2];
analyzePDFTables(pdfPath).then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(error => {
  console.error(JSON.stringify({ error: error.message, analysisComplete: false }, null, 2));
});
