#!/usr/bin/env node

/**
 * Extract Real Values from Messos PDF
 * Find the actual Toronto Dominion ($199,080) and Canadian Imperial ($200,288) values
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎯 EXTRACTING REAL VALUES FROM MESSOS PDF');
console.log('=========================================\n');

const MESSOS_PDF_PATH = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');

// Target values from your correction
const TARGET_VALUES = {
    'XS2530201644': 199080,   // Toronto Dominion
    'XS2588105036': 200288    // Canadian Imperial
};

async function extractRealValues() {
    try {
        console.log('📄 Reading Messos PDF text...');
        
        // Extract text from PDF
        const { stdout } = await execAsync('pdftotext -layout "' + MESSOS_PDF_PATH + '" -');
        const text = stdout;
        
        console.log(`📊 Extracted ${text.length} characters`);
        console.log(`🎯 Looking for Toronto Dominion: $${TARGET_VALUES['XS2530201644'].toLocaleString()}`);
        console.log(`🎯 Looking for Canadian Imperial: $${TARGET_VALUES['XS2588105036'].toLocaleString()}\n`);

        // Save full text for analysis
        fs.writeFileSync(path.join(__dirname, 'messos-full-text.txt'), text);
        console.log('📄 Full text saved to messos-full-text.txt\n');

        // Search for ISINs and their context
        console.log('🔍 SEARCHING FOR ISIN PATTERNS:');
        console.log('===============================');
        
        const lines = text.split('\n');
        const isinLines = [];
        
        // Find lines with ISINs
        lines.forEach((line, index) => {
            if (line.includes('XS2530201644') || line.includes('XS2588105036')) {
                isinLines.push({ line, index, text: line });
                
                // Get context (lines before and after)
                const contextStart = Math.max(0, index - 3);
                const contextEnd = Math.min(lines.length, index + 4);
                const context = lines.slice(contextStart, contextEnd);
                
                console.log(`\n📋 Found ISIN at line ${index + 1}:`);
                console.log('─'.repeat(70));
                context.forEach((contextLine, i) => {
                    const lineNum = contextStart + i + 1;
                    const marker = (lineNum === index + 1) ? '>>> ' : '    ';
                    console.log(`${marker}${lineNum.toString().padStart(3)}: ${contextLine}`);
                });
                console.log('─'.repeat(70));
            }
        });

        // Look for number patterns around ISINs
        console.log('\n🔍 SEARCHING FOR VALUE PATTERNS:');
        console.log('================================');
        
        // Look for patterns that might contain our target values
        const patterns = [
            /199[,\s]*080/g,      // Toronto Dominion value
            /200[,\s]*288/g,      // Canadian Imperial value
            /199[\s,]*080/g,      // Alternative spacing
            /200[\s,]*288/g,      // Alternative spacing
            /\b199\s*080\b/g,     // Word boundary
            /\b200\s*288\b/g      // Word boundary
        ];

        patterns.forEach((pattern, i) => {
            const matches = text.match(pattern);
            if (matches) {
                console.log(`✅ Pattern ${i + 1}: Found ${matches.length} matches`);
                matches.forEach(match => {
                    console.log(`   • "${match}"`);
                    
                    // Find context around this match
                    const index = text.indexOf(match);
                    const contextStart = Math.max(0, index - 100);
                    const contextEnd = Math.min(text.length, index + 100);
                    const context = text.substring(contextStart, contextEnd);
                    console.log(`   Context: ...${context.replace(/\s+/g, ' ')}...`);
                });
            } else {
                console.log(`❌ Pattern ${i + 1}: No matches`);
            }
        });

        // Look for table-like structures
        console.log('\n🔍 SEARCHING FOR TABLE STRUCTURES:');
        console.log('=================================');
        
        // Find lines that might be table rows with multiple columns
        const tableLines = lines.filter(line => {
            // Look for lines with multiple whitespace-separated values
            const parts = line.trim().split(/\s+/);
            return parts.length >= 3 && line.includes('XS2');
        });

        tableLines.forEach((line, i) => {
            console.log(`📊 Table line ${i + 1}: "${line}"`);
            
            // Try to parse as columns
            const columns = line.trim().split(/\s+/);
            console.log(`   Columns: ${columns.length}`);
            columns.forEach((col, j) => {
                console.log(`   Col ${j + 1}: "${col}"`);
            });
        });

        // Advanced pattern search
        console.log('\n🔍 ADVANCED PATTERN SEARCH:');
        console.log('===========================');
        
        // Look for any mention of the target numbers in different formats
        const targetNumbers = [199080, 200288];
        
        targetNumbers.forEach(num => {
            const variations = [
                num.toString(),
                num.toLocaleString(),
                num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,'),
                num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 '),
                `${Math.floor(num/1000)} ${num%1000}`,
                `${Math.floor(num/1000)},${num%1000}`,
                `${Math.floor(num/1000)}.${num%1000}`
            ];
            
            console.log(`\n💰 Searching for ${num} in various formats:`);
            variations.forEach(variation => {
                if (text.includes(variation)) {
                    console.log(`   ✅ Found: "${variation}"`);
                    
                    // Get context
                    const index = text.indexOf(variation);
                    const contextStart = Math.max(0, index - 50);
                    const contextEnd = Math.min(text.length, index + 50);
                    const context = text.substring(contextStart, contextEnd);
                    console.log(`   Context: ...${context.replace(/\s+/g, ' ')}...`);
                } else {
                    console.log(`   ❌ Not found: "${variation}"`);
                }
            });
        });

        // Try to find the specific ISINs and map their values
        console.log('\n🎯 FINAL TARGETED SEARCH:');
        console.log('=========================');
        
        const targetISINs = ['XS2530201644', 'XS2588105036'];
        
        targetISINs.forEach(isin => {
            const targetValue = TARGET_VALUES[isin];
            console.log(`\n🔍 Searching for ${isin} (target: $${targetValue.toLocaleString()})`);
            
            const isinIndex = text.indexOf(isin);
            if (isinIndex !== -1) {
                console.log(`✅ Found ${isin} at position ${isinIndex}`);
                
                // Get surrounding text (500 chars before and after)
                const contextStart = Math.max(0, isinIndex - 500);
                const contextEnd = Math.min(text.length, isinIndex + 500);
                const context = text.substring(contextStart, contextEnd);
                
                console.log('📄 Context around ISIN:');
                console.log('─'.repeat(70));
                console.log(context);
                console.log('─'.repeat(70));
                
                // Look for numbers in this context
                const numberPattern = /\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b/g;
                const numbersInContext = context.match(numberPattern) || [];
                
                console.log(`🔢 Numbers found in context: ${numbersInContext.length}`);
                numbersInContext.forEach(num => {
                    const cleanNum = parseInt(num.replace(/[,\.]/g, ''));
                    console.log(`   • "${num}" (parsed: ${cleanNum})`);
                    
                    // Check if this matches our target
                    if (cleanNum === targetValue) {
                        console.log(`   🎯 EXACT MATCH! This is the target value!`);
                    } else if (Math.abs(cleanNum - targetValue) < 10000) {
                        console.log(`   🎯 CLOSE MATCH! Difference: ${Math.abs(cleanNum - targetValue)}`);
                    }
                });
            } else {
                console.log(`❌ ${isin} not found in text`);
            }
        });

    } catch (error) {
        console.error('❌ Extraction failed:', error.message);
    }
}

// Run the extraction
extractRealValues().then(() => {
    console.log('\n🎯 REAL VALUE EXTRACTION COMPLETE');
    console.log('=================================');
    console.log('Next steps:');
    console.log('1. Review the context around each ISIN');
    console.log('2. Identify the exact pattern of the target values');
    console.log('3. Update the MCP processor to extract these specific patterns');
    console.log('4. Test with the corrected extraction logic');
}).catch(console.error);