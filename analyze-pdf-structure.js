#!/usr/bin/env node

/**
 * ANALYZE PDF STRUCTURE
 * 
 * Analyzes the PDF structure to understand page count issues
 */

const fs = require('fs').promises;
const pdfParse = require('pdf-parse');

async function analyzePDFStructure() {
    console.log('🔍 ANALYZING PDF STRUCTURE');
    console.log('==========================');
    
    try {
        // Test all our PDF files
        const pdfFiles = [
            'valid-test.pdf',
            'financial-test.pdf', 
            'messos-realistic.pdf'
        ];
        
        for (const filename of pdfFiles) {
            try {
                console.log(`\n📄 ANALYZING: ${filename}`);
                console.log('='.repeat(filename.length + 12));
                
                const buffer = await fs.readFile(filename);
                console.log(`File Size: ${buffer.length} bytes`);
                
                // Parse with pdf-parse
                const pdfData = await pdfParse(buffer);
                
                console.log(`📊 PDF-PARSE RESULTS:`);
                console.log(`   Pages: ${pdfData.numpages}`);
                console.log(`   Text Length: ${pdfData.text.length} characters`);
                console.log(`   Info: ${JSON.stringify(pdfData.info)}`);
                console.log(`   Metadata: ${JSON.stringify(pdfData.metadata)}`);
                
                // Show text sample
                if (pdfData.text.length > 0) {
                    console.log(`\n📝 TEXT SAMPLE (first 200 chars):`);
                    console.log(`"${pdfData.text.substring(0, 200)}..."`);
                    
                    // Look for page breaks or indicators
                    const pageBreaks = pdfData.text.split(/\f|\n\s*\n\s*\n/).length;
                    console.log(`\n🔍 POTENTIAL PAGE BREAKS: ${pageBreaks}`);
                    
                    // Look for page-specific content
                    const page1Indicators = pdfData.text.match(/page\s*1|first\s*page/gi) || [];
                    const page2Indicators = pdfData.text.match(/page\s*2|second\s*page/gi) || [];
                    console.log(`   Page 1 indicators: ${page1Indicators.length}`);
                    console.log(`   Page 2 indicators: ${page2Indicators.length}`);
                    
                    // Check for our specific content
                    if (filename === 'messos-realistic.pdf') {
                        const hasPage1Content = pdfData.text.includes('MESSOS FINANCIAL SERVICES AG');
                        const hasPage2Content = pdfData.text.includes('PAGE 2') || pdfData.text.includes('DETAILED HOLDINGS');
                        console.log(`   Has Page 1 content: ${hasPage1Content}`);
                        console.log(`   Has Page 2 content: ${hasPage2Content}`);
                        
                        if (hasPage1Content && hasPage2Content) {
                            console.log('   ✅ Both pages content found in text');
                        } else if (hasPage1Content) {
                            console.log('   ⚠️ Only Page 1 content found');
                        } else {
                            console.log('   ❌ No expected content found');
                        }
                    }
                }
                
                // Manual PDF structure analysis
                const pdfString = buffer.toString('latin1');
                const pageObjects = pdfString.match(/\/Type\s*\/Page/g) || [];
                const pageRefs = pdfString.match(/\d+\s+0\s+obj[^]*?\/Type\s*\/Page/g) || [];
                
                console.log(`\n🔍 MANUAL PDF ANALYSIS:`);
                console.log(`   /Type /Page objects: ${pageObjects.length}`);
                console.log(`   Page object references: ${pageRefs.length}`);
                
                // Check Kids array
                const kidsMatch = pdfString.match(/\/Kids\s*\[([^\]]+)\]/);
                if (kidsMatch) {
                    const kids = kidsMatch[1].split(/\s+/).filter(k => k.match(/\d+/));
                    console.log(`   Kids array: [${kids.join(', ')}] (${kids.length} references)`);
                }
                
                // Check Count
                const countMatch = pdfString.match(/\/Count\s+(\d+)/);
                if (countMatch) {
                    console.log(`   Count: ${countMatch[1]}`);
                }
                
            } catch (error) {
                console.log(`❌ Error analyzing ${filename}: ${error.message}`);
            }
        }
        
        console.log('\n🎯 SUMMARY:');
        console.log('===========');
        console.log('If pdf-parse reports 1 page but manual analysis shows 2 pages,');
        console.log('the issue might be in the PDF structure or pdf-parse parsing.');
        console.log('If both show 1 page, the PDF creation might have an issue.');
        
    } catch (error) {
        console.error('💥 Analysis failed:', error.message);
    }
}

analyzePDFStructure();
