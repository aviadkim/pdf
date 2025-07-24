// 📊 PROPER TABLE EXTRACTOR - Extract table structure with column mapping
// Use pdfplumber to extract actual table data with column boundaries

import fs from 'fs';
import { spawn } from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

class ProperTableExtractor {
    constructor() {
        this.pythonScript = `
import pdfplumber
import json
import sys
import re

def extract_table_structure(pdf_path):
    """Extract table structure with proper column mapping"""
    
    results = {
        'pages': [],
        'tables': [],
        'securities': [],
        'errors': []
    }
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                print(f"Processing page {page_num + 1}...", file=sys.stderr)
                
                # Extract tables from this page
                tables = page.extract_tables()
                
                for table_idx, table in enumerate(tables):
                    if not table:
                        continue
                        
                    print(f"Found table {table_idx + 1} with {len(table)} rows", file=sys.stderr)
                    
                    # First, try to identify column structure
                    header_row = None
                    if len(table) > 0:
                        # Look for header row with column names
                        for i, row in enumerate(table[:3]):  # Check first 3 rows
                            if row:
                                row_text = ' '.join([str(cell) if cell else '' for cell in row])
                                if 'Valuation' in row_text or 'Currency' in row_text or 'Description' in row_text:
                                    header_row = i
                                    break
                    
                    # Process each row in the table
                    for row_idx, row in enumerate(table):
                        if not row or row_idx == header_row:
                            continue
                            
                        # Look for ISINs in this row
                        row_text = ' '.join([str(cell) if cell else '' for cell in row])
                        
                        # Find ISIN pattern
                        isin_match = re.search(r'ISIN[:\\s]*([A-Z]{2}[A-Z0-9]{9}[0-9])', row_text)
                        if isin_match:
                            isin = isin_match.group(1)
                            
                            # Extract valuation using column position analysis
                            valuation = None
                            valuation_candidates = []
                            
                            # Method 1: Look for the pattern after percentages
                            # Swiss banking format: ... percentage% percentage% VALUE percentage%
                            parts = row_text.split()
                            percentage_positions = []
                            
                            for i, part in enumerate(parts):
                                if part.endswith('%'):
                                    percentage_positions.append(i)
                            
                            # The valuation usually appears after the last percentage
                            if len(percentage_positions) >= 2:
                                # Look for numbers after the second-to-last percentage
                                search_start = percentage_positions[-2] + 1
                                for i in range(search_start, min(search_start + 5, len(parts))):
                                    if i < len(parts):
                                        part = parts[i]
                                        # Look for Swiss format numbers
                                        num_match = re.search(r'([\\d]{1,3}(?:\\'[\\d]{3})*)', part)
                                        if num_match:
                                            try:
                                                parsed = int(num_match.group(1).replace("'", ""))
                                                if 1000 <= parsed <= 100000000:
                                                    valuation_candidates.append({
                                                        'raw': num_match.group(1),
                                                        'parsed': parsed,
                                                        'position': i,
                                                        'context': ' '.join(parts[max(0, i-2):i+3])
                                                    })
                                            except:
                                                pass
                            
                            # Method 2: Column position based (typically 8th column is valuation)
                            if len(row) >= 8:
                                for col_idx in [7, 8, 9]:  # Check columns 8, 9, 10 (0-indexed)
                                    if col_idx < len(row) and row[col_idx]:
                                        cell_str = str(row[col_idx]).strip()
                                        num_match = re.search(r'([\\d]{1,3}(?:\\'[\\d]{3})*)', cell_str)
                                        if num_match:
                                            try:
                                                parsed = int(num_match.group(1).replace("'", ""))
                                                if 1000 <= parsed <= 100000000:
                                                    valuation_candidates.append({
                                                        'raw': num_match.group(1),
                                                        'parsed': parsed,
                                                        'position': col_idx,
                                                        'context': cell_str,
                                                        'method': 'column_position'
                                                    })
                                            except:
                                                pass
                            
                            # Select the best valuation candidate
                            if valuation_candidates:
                                # Prefer column position method if available
                                column_candidates = [c for c in valuation_candidates if c.get('method') == 'column_position']
                                if column_candidates:
                                    valuation = column_candidates[0]  # Take first column-based candidate
                                else:
                                    # Take the smallest reasonable value (more likely to be the actual valuation)
                                    valuation = min(valuation_candidates, key=lambda x: x['parsed'])
                            
                            security = {
                                'isin': isin,
                                'page': page_num + 1,
                                'table': table_idx + 1,
                                'row': row_idx + 1,
                                'raw_row': row,
                                'all_candidates': valuation_candidates,
                                'valuation': valuation,
                                'row_text': row_text[:200]  # First 200 chars for debugging
                            }
                            
                            results['securities'].append(security)
                            print(f"Found {isin} with valuation {valuation['parsed'] if valuation else 'N/A'}", file=sys.stderr)
                
                # Also extract raw text for fallback
                page_text = page.extract_text()
                results['pages'].append({
                    'page_number': page_num + 1,
                    'text': page_text,
                    'tables_found': len(tables)
                })
                
    except Exception as e:
        results['errors'].append(f"Error processing PDF: {str(e)}")
        print(f"Error: {str(e)}", file=sys.stderr)
    
    return results

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    results = extract_table_structure(pdf_path)
    print(json.dumps(results, indent=2))
`;
    }

    async extractTableStructure(pdfBuffer, filename) {
        console.log('📊 PROPER TABLE EXTRACTION - Using pdfplumber');
        console.log('🎯 Extracting table structure with column mapping...');
        
        // Write PDF to temp file
        const tempPdfPath = './temp_extraction.pdf';
        fs.writeFileSync(tempPdfPath, pdfBuffer);
        
        // Write Python script to temp file
        const tempScriptPath = './temp_table_extractor.py';
        fs.writeFileSync(tempScriptPath, this.pythonScript);
        
        try {
            const result = await this.runPythonScript(tempScriptPath, tempPdfPath);
            
            // Clean up temp files
            fs.unlinkSync(tempPdfPath);
            fs.unlinkSync(tempScriptPath);
            
            return result;
            
        } catch (error) {
            console.error('❌ Table extraction failed:', error);
            
            // Clean up temp files
            if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
            if (fs.existsSync(tempScriptPath)) fs.unlinkSync(tempScriptPath);
            
            throw error;
        }
    }

    runPythonScript(scriptPath, pdfPath) {
        return new Promise((resolve, reject) => {
            const python = spawn('python3', [scriptPath, pdfPath]);
            
            let stdout = '';
            let stderr = '';
            
            python.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            python.stderr.on('data', (data) => {
                stderr += data.toString();
                console.log('Python:', data.toString().trim());
            });
            
            python.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(stdout);
                        resolve(result);
                    } catch (parseError) {
                        reject(new Error(`Failed to parse Python output: ${parseError.message}`));
                    }
                } else {
                    reject(new Error(`Python script failed with code ${code}: ${stderr}`));
                }
            });
            
            python.on('error', (error) => {
                reject(new Error(`Failed to run Python script: ${error.message}`));
            });
        });
    }

    async processResults(extractionResults, filename) {
        console.log('📊 Processing table extraction results...');
        
        const securities = extractionResults.securities || [];
        const processedSecurities = [];
        
        for (const security of securities) {
            const processed = {
                isin: security.isin,
                name: this.extractSecurityName(security.row_text),
                currency: this.extractCurrency(security.row_text),
                nominalAmount: this.extractNominalAmount(security.raw_row),
                marketValue: security.valuation ? security.valuation.parsed : null,
                rawValuation: security.valuation ? security.valuation.raw : null,
                page: security.page,
                table: security.table,
                row: security.row,
                allCandidates: security.all_candidates,
                rawContext: security.row_text,
                dataQuality: this.assessDataQuality(security)
            };
            
            processedSecurities.push(processed);
            console.log(`   ✅ ${processed.isin}: ${processed.rawValuation || 'N/A'} (${processed.marketValue || 'N/A'})`);
        }
        
        const totalValue = processedSecurities.reduce((sum, s) => sum + (s.marketValue || 0), 0);
        
        console.log(`📊 Total securities found: ${processedSecurities.length}`);
        console.log(`💰 Total calculated value: ${totalValue.toLocaleString()}`);
        
        return {
            securities: processedSecurities,
            totalValue: totalValue,
            securitiesCount: processedSecurities.length,
            extractionMethod: 'pdfplumber-table-structure',
            rawResults: extractionResults
        };
    }

    extractSecurityName(rowText) {
        // Extract security name from row text
        const lines = rowText.split(/\\n|\\r/);
        for (const line of lines) {
            if (line.includes('NOTES') || line.includes('BOND') || line.includes('BANK')) {
                return line.trim().substring(0, 50);
            }
        }
        return 'Security';
    }

    extractCurrency(rowText) {
        const currencyMatch = rowText.match(/\\b(USD|CHF|EUR|GBP)\\b/);
        return currencyMatch ? currencyMatch[1] : 'USD';
    }

    extractNominalAmount(rawRow) {
        // Look for nominal amount in the row
        for (const cell of rawRow) {
            if (cell && cell.includes && (cell.includes('000') || cell.includes("'"))) {
                const match = cell.match(/([\\d]{1,3}(?:\\'[\\d]{3})*)/);
                if (match) {
                    return parseInt(match[1].replace(/'/g, ''));
                }
            }
        }
        return null;
    }

    assessDataQuality(security) {
        let score = 0;
        if (security.isin && security.isin.length === 12) score += 25;
        if (security.valuation && security.valuation.parsed > 1000) score += 25;
        if (security.all_candidates && security.all_candidates.length > 0) score += 25;
        if (security.row_text && security.row_text.length > 50) score += 25;
        
        return {
            score: score,
            quality: score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low'
        };
    }
}

// Main Handler
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const startTime = Date.now();
    console.log('\\n📊 PROPER TABLE EXTRACTOR STARTING');
    console.log('=' * 60);

    try {
        const { pdfBase64, filename, testMode } = req.body;

        if (!pdfBase64 && !testMode) {
            return res.status(400).json({ 
                success: false,
                error: 'No PDF data provided' 
            });
        }

        // Handle test mode with Messos PDF
        let pdfBuffer;
        let actualFilename;

        if (testMode) {
            const messosPdfPath = './2. Messos  - 31.03.2025.pdf';
            if (fs.existsSync(messosPdfPath)) {
                pdfBuffer = fs.readFileSync(messosPdfPath);
                actualFilename = 'Messos - 31.03.2025.pdf';
            } else {
                return res.status(400).json({
                    success: false,
                    error: 'Test PDF not found'
                });
            }
        } else {
            pdfBuffer = Buffer.from(pdfBase64, 'base64');
            actualFilename = filename;
        }

        console.log(`📄 Processing: ${actualFilename} (${Math.round(pdfBuffer.length / 1024)}KB)`);

        // Extract with proper table structure
        const extractor = new ProperTableExtractor();
        const rawResults = await extractor.extractTableStructure(pdfBuffer, actualFilename);
        const processedResults = await extractor.processResults(rawResults, actualFilename);

        const processingTime = Date.now() - startTime;

        console.log('\\n📊 PROPER TABLE EXTRACTION COMPLETE');
        console.log(`⏱️  Processing time: ${processingTime}ms`);
        console.log(`📄 Securities found: ${processedResults.securitiesCount}`);
        console.log(`💰 Total value: $${processedResults.totalValue.toLocaleString()}`);

        res.json({
            success: true,
            message: `Proper table extraction complete: found ${processedResults.securitiesCount} securities`,
            processingTime: processingTime,
            data: processedResults,
            method: 'pdfplumber-table-structure'
        });

    } catch (error) {
        console.error('❌ Proper table extraction failed:', error);
        
        res.status(500).json({
            success: false,
            error: 'Proper table extraction failed',
            details: error.message
        });
    }
}