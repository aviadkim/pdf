// Debug ISIN context extraction to understand parsing issues
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function debugISINContext() {
  console.log('🔍 DEBUG: ISIN Context and Value Extraction');
  console.log('============================================');
  
  const PDF_PATH = '/mnt/c/Users/aviad/OneDrive/Desktop/pdf-main/2. Messos  - 31.03.2025.pdf';
  const TARGET_ISINS = ['XS2665592833', 'XS2567543397', 'CH0024899483']; // Known securities
  
  try {
    // Load PDF
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(pdfBuffer);
    
    const text = pdfData.text;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    console.log(`📊 Processing ${lines.length} lines...`);
    console.log('');
    
    // Function to parse Swiss numbers
    const parseSwissNumber = (str) => {
      if (typeof str !== 'string') return parseFloat(str) || 0;
      return parseFloat(str.replace(/['\s]/g, '').replace(/,/g, '.')) || 0;
    };
    
    // Check each target ISIN
    TARGET_ISINS.forEach(targetISIN => {
      console.log(`🎯 ANALYZING: ${targetISIN}`);
      console.log('='.repeat(50));
      
      // Find lines containing this ISIN
      const isinLines = lines.filter(line => line.includes(targetISIN));
      
      if (isinLines.length === 0) {
        console.log('❌ ISIN not found in any line');
        console.log('');
        return;
      }
      
      isinLines.forEach((line, idx) => {
        console.log(`📄 Line ${idx + 1}: ${line}`);
        
        // Find the line index in the full array
        const lineIndex = lines.indexOf(line);
        
        // Get extended context
        const contextStart = Math.max(0, lineIndex - 3);
        const contextEnd = Math.min(lines.length, lineIndex + 4);
        const contextLines = lines.slice(contextStart, contextEnd);
        
        console.log('📋 Context:');
        contextLines.forEach((contextLine, contextIdx) => {
          const prefix = contextIdx === 3 ? '>>> ' : '    ';
          console.log(`${prefix}${contextLine}`);
        });
        
        // Extract potential values from context
        const fullContext = contextLines.join(' ');
        
        // Try different value patterns
        const valuePatterns = [
          { name: 'Dollar amounts', pattern: /\$\s*([0-9,.']+\.?\d*)/g },
          { name: 'Currency amounts', pattern: /([0-9,.']+\.?\d*)\s*(USD|CHF)/g },
          { name: 'Swiss numbers', pattern: /(\d{1,3}(?:['\s]\d{3})*(?:[.,]\d{2})?)/g },
          { name: 'Large numbers', pattern: /([0-9,.']{4,})/g }
        ];
        
        valuePatterns.forEach(({ name, pattern }) => {
          const matches = [...fullContext.matchAll(pattern)];
          if (matches.length > 0) {
            console.log(`💰 ${name}:`);
            matches.forEach((match, matchIdx) => {
              const value = parseSwissNumber(match[1]);
              console.log(`    ${matchIdx + 1}. "${match[0]}" → ${value}`);
            });
          }
        });
        
        console.log('');
      });
      
      console.log('');
    });
    
    // Show summary of all found ISINs with value extraction
    console.log('📊 SUMMARY: All ISINs with Value Extraction');
    console.log('==========================================');
    
    const isinPattern = /\b([A-Z]{2}[A-Z0-9]{9}[0-9])\b/g;
    const allISINs = [...text.matchAll(isinPattern)];
    const uniqueISINs = [...new Set(allISINs.map(m => m[1]))];
    
    // Filter valid ISINs
    const validISINs = uniqueISINs.filter(isin => {
      const invalidPrefixes = ['CH19', 'CH08', 'CH00'];
      if (invalidPrefixes.some(prefix => isin.startsWith(prefix))) return false;
      
      const validPrefixes = ['XS', 'US', 'DE', 'FR', 'CH', 'LU', 'GB', 'IT', 'ES', 'NL', 'XD'];
      return validPrefixes.some(prefix => isin.startsWith(prefix));
    });
    
    console.log(`Found ${validISINs.length} valid ISINs:`);
    
    validISINs.slice(0, 10).forEach((isin, idx) => {
      // Find context for each ISIN
      const isinIndex = text.indexOf(isin);
      const start = Math.max(0, isinIndex - 200);
      const end = Math.min(text.length, isinIndex + 200);
      const context = text.substring(start, end);
      
      // Extract largest number from context
      const numberPattern = /([0-9,.']+)/g;
      const numbers = [...context.matchAll(numberPattern)]
        .map(m => parseSwissNumber(m[1]))
        .filter(n => n > 1000 && n < 100000000)
        .sort((a, b) => b - a);
      
      const largestValue = numbers.length > 0 ? numbers[0] : 0;
      
      console.log(`${idx + 1}. ${isin} → $${largestValue.toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugISINContext().catch(console.error);