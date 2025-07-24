// Debug text extraction from Messos PDF
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function debugTextExtraction() {
  console.log('🔍 DEBUG: Text Extraction from Messos PDF');
  console.log('==========================================');
  
  const PDF_PATH = '/mnt/c/Users/aviad/OneDrive/Desktop/pdf-main/2. Messos  - 31.03.2025.pdf';
  
  try {
    // Load PDF
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    console.log(`📄 PDF Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
    
    // Try to extract text
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(pdfBuffer);
    
    console.log(`📊 Pages: ${pdfData.numpages}`);
    console.log(`📝 Text Length: ${pdfData.text.length} characters`);
    console.log('');
    
    // Show first 2000 characters
    console.log('📄 FIRST 2000 CHARACTERS:');
    console.log('=========================');
    console.log(pdfData.text.substring(0, 2000));
    console.log('');
    
    // Look for ISIN patterns
    const isinPattern = /([A-Z]{2}[A-Z0-9]{9}[0-9])/g;
    const isinMatches = [...pdfData.text.matchAll(isinPattern)];
    
    console.log(`🔍 FOUND ${isinMatches.length} POTENTIAL ISINs:`);
    console.log('===========================================');
    
    const uniqueISINs = [...new Set(isinMatches.map(m => m[1]))];
    uniqueISINs.forEach((isin, idx) => {
      console.log(`${idx + 1}. ${isin}`);
    });
    console.log('');
    
    // Show context around each ISIN
    console.log('📋 ISIN CONTEXTS:');
    console.log('=================');
    
    uniqueISINs.slice(0, 5).forEach((isin, idx) => {
      const isinIndex = pdfData.text.indexOf(isin);
      const start = Math.max(0, isinIndex - 100);
      const end = Math.min(pdfData.text.length, isinIndex + 100);
      const context = pdfData.text.substring(start, end);
      
      console.log(`\n${idx + 1}. ${isin}:`);
      console.log(`Context: ...${context}...`);
    });
    
  } catch (error) {
    console.error('❌ Text extraction failed:', error);
  }
}

debugTextExtraction().catch(console.error);