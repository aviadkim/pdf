import fs from 'fs';
import pdfParse from 'pdf-parse';
import { Anthropic } from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

async function analyzeMessosPDF() {
  console.log('🔍 Analyzing Messos PDF locally...\n');
  
  try {
    // Read PDF
    const pdfPath = '/mnt/c/Users/aviad/OneDrive/Desktop/2. Messos  - 31.03.2025.pdf';
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    
    console.log('📄 PDF Info:');
    console.log(`- Pages: ${pdfData.numpages}`);
    console.log(`- Text length: ${pdfData.text.length} characters`);
    console.log(`- PDF version: ${pdfData.version}`);
    
    // Show first part of text
    console.log('\n📝 First 1000 characters:');
    console.log(pdfData.text.substring(0, 1000));
    console.log('\n...\n');
    
    // Find patterns
    console.log('🔎 Pattern Analysis:');
    
    // ISINs
    const isinMatches = pdfData.text.match(/[A-Z]{2}[A-Z0-9]{9}[0-9]/g);
    console.log(`- Found ${isinMatches ? isinMatches.length : 0} ISIN codes`);
    if (isinMatches) {
      console.log('  First 5 ISINs:', isinMatches.slice(0, 5));
    }
    
    // Values with currency
    const valueMatches = pdfData.text.match(/(?:USD|CHF|EUR)\s*[0-9]{1,3}(?:[',.]?[0-9]{3})*(?:[.,][0-9]{2})?/g);
    console.log(`- Found ${valueMatches ? valueMatches.length : 0} currency values`);
    if (valueMatches) {
      console.log('  Sample values:', valueMatches.slice(0, 5));
    }
    
    // Client info
    const clientMatch = pdfData.text.match(/(?:Beneficiario|Client|Cliente)[\s:]*([^\n]+)/i);
    if (clientMatch) {
      console.log(`- Client: ${clientMatch[1].trim()}`);
    }
    
    // Bank info
    const bankMatch = pdfData.text.match(/Cornèr Banca SA/i);
    if (bankMatch) {
      console.log('- Bank: Cornèr Banca SA');
    }
    
    // Date patterns
    const dateMatches = pdfData.text.match(/\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4}/g);
    if (dateMatches) {
      console.log(`- Found ${dateMatches.length} dates:`, dateMatches.slice(0, 3));
    }
    
    // Total portfolio value
    const totalMatch = pdfData.text.match(/(?:Subtotale|Total|Totale)[\s:]*(?:USD|CHF|EUR)?\s*([0-9]{1,3}(?:[',.]?[0-9]{3})*(?:[.,][0-9]{2})?)/i);
    if (totalMatch) {
      console.log(`- Portfolio Total: ${totalMatch[1]}`);
    }
    
    // Now try Claude API if available
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('\n🤖 Testing Claude API...');
      
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      try {
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          temperature: 0,
          messages: [{
            role: 'user',
            content: `Extract the total portfolio value and number of holdings from this text. Just return the numbers:
            
${pdfData.text.substring(0, 3000)}

Format: Total: [amount] | Holdings: [count]`
          }]
        });
        
        console.log('Claude response:', response.content[0].text);
      } catch (apiError) {
        console.log('Claude API error:', apiError.message);
      }
    }
    
    // Save extracted text for analysis
    fs.writeFileSync('messos-text-content.txt', pdfData.text);
    console.log('\n✅ Full text saved to messos-text-content.txt');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the analysis
analyzeMessosPDF();