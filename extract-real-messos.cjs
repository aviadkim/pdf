const fs = require('fs').promises;
const path = require('path');

// Simple PDF text extraction using built-in Node.js capabilities
async function extractTextFromPDF(pdfPath) {
    try {
        console.log(`📄 Reading PDF: ${pdfPath}`);
        
        const pdfBuffer = await fs.readFile(pdfPath);
        console.log(`✅ PDF loaded: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        
        // Convert buffer to string and extract text patterns
        const pdfText = pdfBuffer.toString('latin1');
        
        // Look for common Swiss banking document patterns
        const patterns = {
            isin: /[A-Z]{2}[0-9A-Z]{10}/g,
            currency: /[A-Z]{3}\s+[\d',]+\.?\d*/g,
            amounts: /[\d']+\.\d{2}/g,
            dates: /\d{2}\.\d{2}\.\d{4}/g,
            client: /MESSOS\s+ENTERPRISES\s+LTD/gi,
            accountNumber: /\d{6}/g
        };
        
        console.log('\n🔍 Searching for patterns in PDF...');
        
        const results = {};
        for (const [key, pattern] of Object.entries(patterns)) {
            const matches = pdfText.match(pattern) || [];
            results[key] = [...new Set(matches)]; // Remove duplicates
            console.log(`${key}: ${matches.length} matches found`);
        }
        
        return {
            rawText: pdfText,
            patterns: results,
            size: pdfBuffer.length
        };
        
    } catch (error) {
        console.error('❌ Error extracting PDF:', error.message);
        throw error;
    }
}

// Parse holdings from extracted text
function parseHoldings(textData) {
    const holdings = [];
    const { patterns, rawText } = textData;
    
    console.log('\n📋 Parsing holdings data...');
    
    // Extract potential ISIN codes
    const isinCodes = patterns.isin.filter(code => 
        code.length === 12 && 
        /^[A-Z]{2}[0-9A-Z]{10}$/.test(code)
    );
    
    console.log(`Found ${isinCodes.length} potential ISIN codes:`, isinCodes);
    
    // Extract currency amounts
    const amounts = patterns.amounts.map(amount => {
        const cleanAmount = amount.replace(/'/g, '');
        return parseFloat(cleanAmount);
    }).filter(amount => !isNaN(amount) && amount > 0);
    
    console.log(`Found ${amounts.length} monetary amounts`);
    
    // Try to extract security names (lines near ISIN codes)
    const lines = rawText.split(/[\r\n]+/).filter(line => line.trim().length > 0);
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Look for lines containing ISIN codes
        const isinMatch = line.match(/([A-Z]{2}[0-9A-Z]{10})/);
        if (isinMatch) {
            const isin = isinMatch[1];
            
            // Look for security name in surrounding lines
            let securityName = 'Unknown Security';
            
            // Check current line for security name
            const nameParts = line.split(isin);
            if (nameParts[0].trim()) {
                securityName = nameParts[0].trim();
            } else if (i > 0) {
                // Check previous line
                securityName = lines[i - 1].trim();
            }
            
            // Clean up security name
            securityName = securityName.replace(/[^\w\s&\.-]/g, '').trim();
            
            // Look for amount in the same line or nearby lines
            let value = 0;
            const amountMatch = line.match(/[\d']+\.\d{2}/);
            if (amountMatch) {
                value = parseFloat(amountMatch[0].replace(/'/g, ''));
            }
            
            holdings.push({
                isin: isin,
                securityName: securityName,
                value: value,
                currency: 'USD', // Default, could be parsed from context
                rawLine: line.trim()
            });
        }
    }
    
    return holdings;
}

// Main extraction function
async function extractRealMessosData() {
    try {
        const pdfPath = '/mnt/c/Users/aviad/OneDrive/Desktop/pdf-main/2. Messos  - 31.03.2025.pdf';
        
        console.log('🚀 Starting REAL Messos PDF extraction...\n');
        
        // Extract text from PDF
        const textData = await extractTextFromPDF(pdfPath);
        
        // Parse holdings
        const holdings = parseHoldings(textData);
        
        // Display results
        console.log('\n=== REAL EXTRACTION RESULTS ===\n');
        
        console.log(`📊 DOCUMENT ANALYSIS:`);
        console.log(`   File size: ${(textData.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   ISIN codes found: ${textData.patterns.isin.length}`);
        console.log(`   Currency amounts: ${textData.patterns.amounts.length}`);
        console.log(`   Date references: ${textData.patterns.dates.length}`);
        
        if (textData.patterns.client.length > 0) {
            console.log(`   Client: ${textData.patterns.client[0]}`);
        }
        
        console.log(`\n📋 HOLDINGS EXTRACTED (${holdings.length} securities):\n`);
        
        holdings.forEach((holding, index) => {
            console.log(`${index + 1}. ${holding.securityName}`);
            console.log(`   ISIN: ${holding.isin}`);
            console.log(`   Value: ${holding.currency} ${holding.value.toLocaleString()}`);
            console.log(`   Raw: ${holding.rawLine.substring(0, 100)}...`);
            console.log('');
        });
        
        // Calculate total
        const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
        console.log(`💰 TOTAL PORTFOLIO VALUE: USD ${totalValue.toLocaleString()}`);
        
        // Save results
        const result = {
            extractionDate: new Date().toISOString(),
            pdfFile: pdfPath,
            documentInfo: {
                fileSize: textData.size,
                extractionMethod: 'real-text-extraction'
            },
            holdings: holdings,
            summary: {
                totalHoldings: holdings.length,
                totalValue: totalValue,
                isinCodesFound: textData.patterns.isin.length,
                extractionAccuracy: 'raw-text-based'
            },
            rawPatterns: textData.patterns
        };
        
        const outputPath = path.join(__dirname, 'real-messos-extraction-results.json');
        await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
        console.log(`\n✅ Real results saved to: ${outputPath}`);
        
        return result;
        
    } catch (error) {
        console.error('\n❌ Real extraction failed:', error.message);
        throw error;
    }
}

// Run the extraction
extractRealMessosData().catch(console.error);