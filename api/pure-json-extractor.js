// 🔍 PURE JSON EXTRACTOR - Extract 100% Raw Data to JSON
// Just extract everything, no table building - show complete raw data

import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const execAsync = promisify(exec);
const pdfParse = require('pdf-parse');

class PureJSONExtractor {
    constructor() {
        this.extractionMethods = [
            'pdfParse',
            'paddleOCR',
            'pdfPlumber',
            'pymupdf'
        ];
    }

    async extractToJSON(pdfBuffer, filename) {
        console.log('🔍 PURE JSON EXTRACTION - No Processing, Just Raw Data');
        console.log('📄 Extracting 100% of PDF content to complete JSON...');
        
        const completeJSON = {
            metadata: {
                filename: filename,
                extractionTime: new Date().toISOString(),
                methods: [],
                pdfSize: pdfBuffer.length
            },
            rawText: {
                fullText: '',
                lines: [],
                pages: []
            },
            allWords: [],
            allNumbers: [],
            allSymbols: [],
            patterns: {
                isins: [],
                amounts: [],
                currencies: [],
                dates: [],
                emails: [],
                percentages: []
            },
            ocrResults: {
                available: false,
                pages: [],
                allText: '',
                coordinates: []
            },
            pythonResults: {
                available: false,
                libraries: [],
                tables: [],
                elements: []
            }
        };

        // Method 1: PDF-Parse - Complete text extraction
        await this.extractWithPDFParse(pdfBuffer, completeJSON);

        // Method 2: PaddleOCR - Visual text extraction
        await this.extractWithPaddleOCR(pdfBuffer, filename, completeJSON);

        // Method 3: Python libraries - Comprehensive extraction
        await this.extractWithPython(pdfBuffer, filename, completeJSON);

        // Method 4: Pattern extraction on all collected text
        await this.extractAllPatterns(completeJSON);

        // Final statistics
        this.calculateStatistics(completeJSON);

        console.log(`🔍 PURE JSON EXTRACTION COMPLETE`);
        console.log(`📄 Total elements: ${completeJSON.metadata.totalElements}`);
        console.log(`📊 Methods used: ${completeJSON.metadata.methods.join(', ')}`);

        return completeJSON;
    }

    async extractWithPDFParse(pdfBuffer, completeJSON) {
        try {
            console.log('📊 Method 1: PDF-Parse complete extraction...');
            const pdfData = await pdfParse(pdfBuffer);
            
            completeJSON.rawText.fullText = pdfData.text;
            completeJSON.rawText.lines = pdfData.text.split('\n').map((line, index) => ({
                lineNumber: index + 1,
                text: line,
                length: line.length
            }));

            // Extract every word with position
            const wordMatches = [...pdfData.text.matchAll(/\b\w+\b/g)];
            completeJSON.allWords = wordMatches.map((match, index) => ({
                word: match[0],
                position: match.index,
                wordNumber: index + 1
            }));

            // Extract every number with context
            const numberMatches = [...pdfData.text.matchAll(/[\d,.'%$€£¥\-\+]+/g)];
            completeJSON.allNumbers = numberMatches.map((match, index) => ({
                number: match[0],
                position: match.index,
                numberIndex: index + 1,
                parsed: this.tryParseNumber(match[0])
            }));

            // Extract every symbol
            const symbolMatches = [...pdfData.text.matchAll(/[^\w\s]/g)];
            completeJSON.allSymbols = symbolMatches.map((match, index) => ({
                symbol: match[0],
                position: match.index,
                symbolIndex: index + 1
            }));

            completeJSON.metadata.methods.push('pdfParse');
            console.log(`   ✅ PDF-Parse: ${completeJSON.allWords.length} words, ${completeJSON.allNumbers.length} numbers`);
            
        } catch (error) {
            console.log(`   ❌ PDF-Parse failed: ${error.message}`);
            completeJSON.metadata.pdfParseError = error.message;
        }
    }

    async extractWithPaddleOCR(pdfBuffer, filename, completeJSON) {
        try {
            console.log('📊 Method 2: PaddleOCR complete visual extraction...');
            
            const tempPdfPath = `/tmp/pure_extract_${Date.now()}.pdf`;
            fs.writeFileSync(tempPdfPath, pdfBuffer);

            const paddleScript = `
import sys
import json
import os

# Check if PaddleOCR is available
PADDLE_AVAILABLE = True
try:
    from paddleocr import PaddleOCR
    from pdf2image import convert_from_path
    import numpy as np
except ImportError as e:
    PADDLE_AVAILABLE = False
    print(json.dumps({
        'available': False,
        'error': str(e),
        'pages': [],
        'allText': '',
        'coordinates': []
    }))
    sys.exit(0)

def extract_pure_ocr(pdf_path):
    results = {
        'available': True,
        'pages': [],
        'allText': '',
        'coordinates': [],
        'totalElements': 0
    }
    
    try:
        # Initialize PaddleOCR
        ocr = PaddleOCR(lang='en')
        
        # Convert PDF to images
        images = convert_from_path(pdf_path, dpi=300)
        
        for page_idx, image in enumerate(images):
            image_array = np.array(image)
            ocr_result = ocr.ocr(image_array)
            
            page_data = {
                'page': page_idx + 1,
                'elements': [],
                'text': '',
                'wordCount': 0
            }
            
            if ocr_result and ocr_result[0]:
                for element_idx, line in enumerate(ocr_result[0]):
                    if line and len(line) >= 2:
                        coordinates = line[0]
                        text_info = line[1]
                        
                        if isinstance(text_info, (list, tuple)) and len(text_info) >= 2:
                            text = text_info[0]
                            confidence = text_info[1]
                            
                            if text and text.strip():
                                element = {
                                    'elementId': f'page{page_idx + 1}_element{element_idx + 1}',
                                    'text': text.strip(),
                                    'confidence': confidence,
                                    'coordinates': coordinates,
                                    'page': page_idx + 1,
                                    'bbox': {
                                        'x1': min(coord[0] for coord in coordinates),
                                        'y1': min(coord[1] for coord in coordinates),
                                        'x2': max(coord[0] for coord in coordinates),
                                        'y2': max(coord[1] for coord in coordinates)
                                    }
                                }
                                
                                page_data['elements'].append(element)
                                page_data['text'] += text + ' '
                                results['allText'] += text + ' '
                                results['coordinates'].append(element)
                
                page_data['wordCount'] = len(page_data['text'].split())
            
            results['pages'].append(page_data)
        
        results['totalElements'] = len(results['coordinates'])
        
    except Exception as e:
        results['available'] = False
        results['error'] = str(e)
    
    return results

if __name__ == "__main__":
    pdf_path = "${tempPdfPath}"
    result = extract_pure_ocr(pdf_path)
    print(json.dumps(result, ensure_ascii=False))
`;

            const scriptPath = `/tmp/paddle_pure_${Date.now()}.py`;
            fs.writeFileSync(scriptPath, paddleScript);

            try {
                const { stdout } = await execAsync(`python3 ${scriptPath}`);
                const paddleResult = JSON.parse(stdout);

                completeJSON.ocrResults = paddleResult;
                
                if (paddleResult.available) {
                    completeJSON.metadata.methods.push('paddleOCR');
                    console.log(`   ✅ PaddleOCR: ${paddleResult.totalElements} elements from ${paddleResult.pages.length} pages`);
                } else {
                    console.log(`   ⚠️ PaddleOCR: ${paddleResult.error}`);
                }

            } catch (error) {
                console.log(`   ⚠️ PaddleOCR execution failed: ${error.message}`);
                completeJSON.ocrResults.available = false;
                completeJSON.ocrResults.error = error.message;
            }

            // Cleanup
            if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
            if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);

        } catch (error) {
            console.log(`   ❌ PaddleOCR method failed: ${error.message}`);
            completeJSON.ocrResults.available = false;
            completeJSON.ocrResults.error = error.message;
        }
    }

    async extractWithPython(pdfBuffer, filename, completeJSON) {
        try {
            console.log('📊 Method 3: Python libraries comprehensive extraction...');
            
            const tempPdfPath = `/tmp/python_pure_${Date.now()}.pdf`;
            fs.writeFileSync(tempPdfPath, pdfBuffer);

            const pythonScript = `
import sys
import json
import re

# Try multiple libraries and report what's available
results = {
    'available': True,
    'libraries': [],
    'allText': '',
    'tables': [],
    'elements': [],
    'pages': [],
    'errors': []
}

pdf_path = "${tempPdfPath}"

# Try PyMuPDF (fitz)
try:
    import fitz
    doc = fitz.open(pdf_path)
    
    pymupdf_data = {
        'library': 'pymupdf',
        'pages': [],
        'text': '',
        'elements': []
    }
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        page_text = page.get_text()
        
        page_info = {
            'page': page_num + 1,
            'text': page_text,
            'wordCount': len(page_text.split()),
            'characterCount': len(page_text)
        }
        
        # Get detailed text with formatting
        blocks = page.get_text("dict")
        page_elements = []
        
        for block_idx, block in enumerate(blocks.get("blocks", [])):
            if "lines" in block:
                for line_idx, line in enumerate(block["lines"]):
                    for span_idx, span in enumerate(line.get("spans", [])):
                        if span.get("text", "").strip():
                            element = {
                                'id': f'page{page_num + 1}_block{block_idx}_line{line_idx}_span{span_idx}',
                                'text': span['text'].strip(),
                                'font': span.get('font', ''),
                                'size': span.get('size', 0),
                                'flags': span.get('flags', 0),
                                'bbox': span.get('bbox', []),
                                'page': page_num + 1
                            }
                            page_elements.append(element)
        
        page_info['elements'] = page_elements
        pymupdf_data['pages'].append(page_info)
        pymupdf_data['text'] += page_text + '\\n'
        pymupdf_data['elements'].extend(page_elements)
    
    doc.close()
    
    results['libraries'].append(pymupdf_data)
    results['allText'] += pymupdf_data['text']
    
except Exception as e:
    results['errors'].append(f'PyMuPDF: {str(e)}')

# Try pdfplumber
try:
    import pdfplumber
    
    pdfplumber_data = {
        'library': 'pdfplumber',
        'pages': [],
        'text': '',
        'tables': []
    }
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            page_text = page.extract_text() or ''
            
            page_info = {
                'page': page_num + 1,
                'text': page_text,
                'chars': page.chars,
                'words': page.extract_words(),
                'bbox': page.bbox,
                'width': page.width,
                'height': page.height
            }
            
            # Extract tables
            tables = page.extract_tables()
            page_tables = []
            for table_idx, table in enumerate(tables):
                if table:
                    page_tables.append({
                        'tableId': f'page{page_num + 1}_table{table_idx + 1}',
                        'data': table,
                        'rows': len(table),
                        'columns': len(table[0]) if table else 0
                    })
            
            page_info['tables'] = page_tables
            pdfplumber_data['pages'].append(page_info)
            pdfplumber_data['text'] += page_text + '\\n'
            pdfplumber_data['tables'].extend(page_tables)
    
    results['libraries'].append(pdfplumber_data)
    results['allText'] += pdfplumber_data['text']
    results['tables'].extend(pdfplumber_data['tables'])
    
except Exception as e:
    results['errors'].append(f'pdfplumber: {str(e)}')

# Compile all elements
all_elements = []
for lib_data in results['libraries']:
    if 'elements' in lib_data:
        all_elements.extend(lib_data['elements'])

results['elements'] = all_elements
results['totalElements'] = len(all_elements)

print(json.dumps(results, ensure_ascii=False))
`;

            const scriptPath = `/tmp/python_pure_comprehensive_${Date.now()}.py`;
            fs.writeFileSync(scriptPath, pythonScript);

            try {
                const { stdout } = await execAsync(`python3 ${scriptPath}`);
                const pythonResult = JSON.parse(stdout);

                completeJSON.pythonResults = pythonResult;
                
                if (pythonResult.available && pythonResult.libraries.length > 0) {
                    completeJSON.metadata.methods.push('python_libraries');
                    console.log(`   ✅ Python: ${pythonResult.libraries.length} libraries, ${pythonResult.totalElements} elements`);
                    
                    // Add Python text to main text
                    completeJSON.rawText.fullText += '\n' + pythonResult.allText;
                } else {
                    console.log(`   ⚠️ Python libraries: ${pythonResult.errors.join(', ')}`);
                }

            } catch (error) {
                console.log(`   ⚠️ Python execution failed: ${error.message}`);
                completeJSON.pythonResults.available = false;
                completeJSON.pythonResults.error = error.message;
            }

            // Cleanup
            if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
            if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);

        } catch (error) {
            console.log(`   ❌ Python method failed: ${error.message}`);
            completeJSON.pythonResults.available = false;
            completeJSON.pythonResults.error = error.message;
        }
    }

    async extractAllPatterns(completeJSON) {
        console.log('📊 Method 4: Complete pattern extraction...');
        
        // Combine all text sources
        let allText = completeJSON.rawText.fullText;
        if (completeJSON.ocrResults.available) {
            allText += ' ' + completeJSON.ocrResults.allText;
        }
        if (completeJSON.pythonResults.available) {
            allText += ' ' + completeJSON.pythonResults.allText;
        }

        // Extract all ISINs with context
        const isinPattern = /\b([A-Z]{2}[A-Z0-9]{9}[0-9])\b/g;
        const isinMatches = [...allText.matchAll(isinPattern)];
        completeJSON.patterns.isins = isinMatches.map((match, index) => ({
            isin: match[1],
            position: match.index,
            context: allText.substring(Math.max(0, match.index - 50), match.index + 50),
            isinIndex: index + 1
        }));

        // Extract all amounts with context
        const amountPatterns = [
            /\b(\d{1,3}(?:[',]\d{3})*(?:\.\d{2})?)\b/g,  // 1,234.56 or 1'234.56
            /\b(\d+\.\d{2})\b/g,                         // 123.45
            /\b(\d{4,})\b/g                              // 1234 or larger
        ];

        completeJSON.patterns.amounts = [];
        for (const pattern of amountPatterns) {
            const matches = [...allText.matchAll(pattern)];
            matches.forEach((match, index) => {
                completeJSON.patterns.amounts.push({
                    amount: match[1],
                    position: match.index,
                    parsed: this.tryParseNumber(match[1]),
                    context: allText.substring(Math.max(0, match.index - 30), match.index + 30),
                    pattern: pattern.source
                });
            });
        }

        // Extract currencies
        const currencyPattern = /\b(USD|EUR|CHF|GBP|JPY|CAD|AUD)\b/g;
        const currencyMatches = [...allText.matchAll(currencyPattern)];
        completeJSON.patterns.currencies = currencyMatches.map((match, index) => ({
            currency: match[1],
            position: match.index,
            context: allText.substring(Math.max(0, match.index - 20), match.index + 20),
            currencyIndex: index + 1
        }));

        // Extract dates
        const datePattern = /\b(\d{1,2}[./]\d{1,2}[./]\d{2,4})\b/g;
        const dateMatches = [...allText.matchAll(datePattern)];
        completeJSON.patterns.dates = dateMatches.map((match, index) => ({
            date: match[1],
            position: match.index,
            context: allText.substring(Math.max(0, match.index - 20), match.index + 20),
            dateIndex: index + 1
        }));

        // Extract percentages
        const percentagePattern = /\b(\d+(?:\.\d+)?%)\b/g;
        const percentageMatches = [...allText.matchAll(percentagePattern)];
        completeJSON.patterns.percentages = percentageMatches.map((match, index) => ({
            percentage: match[1],
            position: match.index,
            context: allText.substring(Math.max(0, match.index - 20), match.index + 20),
            percentageIndex: index + 1
        }));

        console.log(`   ✅ Patterns: ${completeJSON.patterns.isins.length} ISINs, ${completeJSON.patterns.amounts.length} amounts`);
    }

    tryParseNumber(numberStr) {
        if (!numberStr) return null;
        
        try {
            // Handle Swiss format (1'234'567.89) and regular (1,234,567.89)
            let cleaned = numberStr.toString().replace(/[',]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? null : parsed;
        } catch {
            return null;
        }
    }

    calculateStatistics(completeJSON) {
        completeJSON.metadata.totalElements = 
            completeJSON.allWords.length +
            completeJSON.allNumbers.length +
            completeJSON.patterns.isins.length +
            completeJSON.patterns.amounts.length +
            (completeJSON.ocrResults.coordinates || []).length +
            (completeJSON.pythonResults.elements || []).length;

        completeJSON.metadata.statistics = {
            totalWords: completeJSON.allWords.length,
            totalNumbers: completeJSON.allNumbers.length,
            totalSymbols: completeJSON.allSymbols.length,
            totalISINs: completeJSON.patterns.isins.length,
            totalAmounts: completeJSON.patterns.amounts.length,
            totalCurrencies: completeJSON.patterns.currencies.length,
            totalDates: completeJSON.patterns.dates.length,
            ocrElements: completeJSON.ocrResults.coordinates ? completeJSON.ocrResults.coordinates.length : 0,
            pythonElements: completeJSON.pythonResults.elements ? completeJSON.pythonResults.elements.length : 0,
            methodsUsed: completeJSON.metadata.methods.length
        };
    }
}

// Main Handler
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const startTime = Date.now();
    console.log('\n🔍 PURE JSON EXTRACTOR STARTING');
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

        // Extract to pure JSON
        const extractor = new PureJSONExtractor();
        const completeJSON = await extractor.extractToJSON(pdfBuffer, actualFilename);

        const processingTime = Date.now() - startTime;

        console.log('\n🔍 PURE JSON EXTRACTION COMPLETE');
        console.log(`⏱️  Processing time: ${processingTime}ms`);
        console.log(`📄 Total elements: ${completeJSON.metadata.totalElements}`);

        res.json({
            success: true,
            message: `Pure JSON extraction complete: ${completeJSON.metadata.totalElements} elements`,
            processingTime: processingTime,
            completeJSON: completeJSON
        });

    } catch (error) {
        console.error('❌ Pure JSON extraction failed:', error);
        
        res.status(500).json({
            success: false,
            error: 'Pure JSON extraction failed',
            details: error.message
        });
    }
}