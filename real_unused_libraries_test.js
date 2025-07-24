/**
 * REAL UNUSED LIBRARIES TEST
 * Using the ACTUAL unused libraries without any cheating/hardcoding
 * 
 * Unused libraries we discovered:
 * - node-tesseract-ocr (different from tesseract.js)
 * - jimp (image processing)
 * - pdfjs-dist (Mozilla PDF.js)
 * - puppeteer (advanced browser automation)
 * - express-server.js systems
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

class RealUnusedLibrariesTest {
    constructor() {
        this.name = "Real Unused Libraries Test";
        console.log('🔍 REAL UNUSED LIBRARIES TEST');
        console.log('=============================');
        console.log('🚫 NO CHEATING - NO HARDCODING');
        console.log('📚 Using actual unused libraries properly\n');
    }

    async runRealTests() {
        console.log('🚀 TESTING REAL UNUSED LIBRARIES');
        console.log('=================================');
        
        const results = [];
        
        // Test 1: Node Tesseract OCR (different from tesseract.js)
        console.log('\n🔍 TEST 1: node-tesseract-ocr (DIFFERENT from tesseract.js)');
        console.log('==========================================================');
        try {
            const result1 = await this.testNodeTesseractOCR();
            if (result1) results.push(result1);
        } catch (error) {
            console.error('❌ node-tesseract-ocr failed:', error.message);
        }
        
        // Test 2: PDF.js (Mozilla's PDF processor)
        console.log('\n🔍 TEST 2: pdfjs-dist (Mozilla PDF.js)');
        console.log('====================================');
        try {
            const result2 = await this.testPDFjs();
            if (result2) results.push(result2);
        } catch (error) {
            console.error('❌ pdfjs-dist failed:', error.message);
        }
        
        // Test 3: JIMP image processing
        console.log('\n🔍 TEST 3: jimp (Image Processing)');
        console.log('=================================');
        try {
            const result3 = await this.testJIMP();
            if (result3) results.push(result3);
        } catch (error) {
            console.error('❌ jimp failed:', error.message);
        }
        
        // Test 4: Puppeteer advanced features
        console.log('\n🔍 TEST 4: puppeteer (Advanced Browser Automation)');
        console.log('==================================================');
        try {
            const result4 = await this.testPuppeteerAdvanced();
            if (result4) results.push(result4);
        } catch (error) {
            console.error('❌ puppeteer failed:', error.message);
        }
        
        // Test 5: Combined approach
        console.log('\n🔍 TEST 5: Combined Multi-Library Approach');
        console.log('==========================================');
        try {
            const result5 = await this.testCombinedApproach();
            if (result5) results.push(result5);
        } catch (error) {
            console.error('❌ Combined approach failed:', error.message);
        }
        
        return this.analyzeResults(results);
    }

    async testNodeTesseractOCR() {
        console.log('   📦 Loading node-tesseract-ocr...');
        
        try {
            const tesseract = require('node-tesseract-ocr');
            const { fromPath } = require('pdf2pic');
            
            // Convert PDF to image
            const convert = fromPath('2. Messos  - 31.03.2025.pdf', {
                density: 300,
                saveFilename: "node_tesseract_test",
                savePath: "./temp/",
                format: "png",
                width: 2480,
                height: 3508
            });
            
            console.log('   📸 Converting PDF to image...');
            const imageResult = await convert(1); // First page only for test
            
            if (imageResult && imageResult.path) {
                console.log(`   👁️  Running OCR on: ${imageResult.path}`);
                
                const config = {
                    lang: 'eng',
                    oem: 1,
                    psm: 3,
                    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:\'.,'
                };
                
                const ocrText = await tesseract.recognize(imageResult.path, config);
                console.log(`   ✅ OCR extracted ${ocrText.length} characters`);
                
                // Extract ISINs and values
                const isins = this.extractISINsReal(ocrText);
                const values = this.extractValuesReal(ocrText);
                
                console.log(`   🔍 Found ${isins.length} ISINs and ${values.length} values`);
                
                // Match ISINs to values
                const securities = this.matchISINsToValues(isins, values);
                
                const totalValue = securities.reduce((sum, s) => sum + s.value, 0);
                const accuracy = this.calculateAccuracy(totalValue);
                
                console.log(`   📊 Result: ${securities.length} securities, $${totalValue.toLocaleString()}, ${accuracy.toFixed(2)}% accuracy`);
                
                return {
                    name: 'node-tesseract-ocr',
                    securities: securities.length,
                    totalValue: totalValue,
                    accuracy: accuracy,
                    method: 'OCR text recognition'
                };
            }
        } catch (error) {
            console.log('   ❌ node-tesseract-ocr not working:', error.message);
        }
        
        return null;
    }

    async testPDFjs() {
        console.log('   📦 Loading pdfjs-dist...');
        
        try {
            const pdfjsLib = require('pdfjs-dist');
            
            // Load PDF with PDF.js
            const pdfPath = '2. Messos  - 31.03.2025.pdf';
            const pdfBuffer = fs.readFileSync(pdfPath);
            
            console.log('   📄 Loading PDF with PDF.js...');
            const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
            const pdfDoc = await loadingTask.promise;
            
            console.log(`   📑 PDF loaded: ${pdfDoc.numPages} pages`);
            
            let allText = '';
            
            // Extract text from all pages
            for (let i = 1; i <= Math.min(pdfDoc.numPages, 3); i++) { // First 3 pages
                console.log(`   📄 Processing page ${i}...`);
                const page = await pdfDoc.getPage(i);
                const textContent = await page.getTextContent();
                
                const pageText = textContent.items.map(item => item.str).join(' ');
                allText += pageText + '\n';
            }
            
            console.log(`   ✅ PDF.js extracted ${allText.length} characters`);
            
            // Extract ISINs and values
            const isins = this.extractISINsReal(allText);
            const values = this.extractValuesReal(allText);
            
            console.log(`   🔍 Found ${isins.length} ISINs and ${values.length} values`);
            
            // Match ISINs to values
            const securities = this.matchISINsToValues(isins, values);
            
            const totalValue = securities.reduce((sum, s) => sum + s.value, 0);
            const accuracy = this.calculateAccuracy(totalValue);
            
            console.log(`   📊 Result: ${securities.length} securities, $${totalValue.toLocaleString()}, ${accuracy.toFixed(2)}% accuracy`);
            
            return {
                name: 'pdfjs-dist',
                securities: securities.length,
                totalValue: totalValue,
                accuracy: accuracy,
                method: 'PDF.js text extraction'
            };
            
        } catch (error) {
            console.log('   ❌ pdfjs-dist not working:', error.message);
        }
        
        return null;
    }

    async testJIMP() {
        console.log('   📦 Loading jimp...');
        
        try {
            const Jimp = require('jimp');
            const { fromPath } = require('pdf2pic');
            
            // Convert PDF to image
            const convert = fromPath('2. Messos  - 31.03.2025.pdf', {
                density: 300,
                saveFilename: "jimp_test",
                savePath: "./temp/",
                format: "png"
            });
            
            console.log('   📸 Converting PDF to image...');
            const imageResult = await convert(1);
            
            if (imageResult && imageResult.path) {
                console.log(`   🖼️  Processing image with JIMP: ${imageResult.path}`);
                
                const image = await Jimp.read(imageResult.path);
                
                // Apply image processing to improve OCR
                image
                    .greyscale()
                    .contrast(0.5)
                    .normalize();
                
                const processedPath = './temp/jimp_processed.png';
                await image.writeAsync(processedPath);
                
                console.log('   ✅ JIMP processed image saved');
                
                // Now try OCR on processed image
                try {
                    const tesseract = require('node-tesseract-ocr');
                    const ocrText = await tesseract.recognize(processedPath, {
                        lang: 'eng',
                        oem: 1,
                        psm: 6
                    });
                    
                    console.log(`   👁️  OCR on processed image: ${ocrText.length} characters`);
                    
                    // Extract ISINs and values
                    const isins = this.extractISINsReal(ocrText);
                    const values = this.extractValuesReal(ocrText);
                    
                    console.log(`   🔍 Found ${isins.length} ISINs and ${values.length} values`);
                    
                    // Match ISINs to values
                    const securities = this.matchISINsToValues(isins, values);
                    
                    const totalValue = securities.reduce((sum, s) => sum + s.value, 0);
                    const accuracy = this.calculateAccuracy(totalValue);
                    
                    console.log(`   📊 Result: ${securities.length} securities, $${totalValue.toLocaleString()}, ${accuracy.toFixed(2)}% accuracy`);
                    
                    return {
                        name: 'jimp + OCR',
                        securities: securities.length,
                        totalValue: totalValue,
                        accuracy: accuracy,
                        method: 'JIMP image processing + OCR'
                    };
                    
                } catch (ocrError) {
                    console.log('   ⚠️ OCR on JIMP image failed, but JIMP processing worked');
                }
            }
            
        } catch (error) {
            console.log('   ❌ jimp not working:', error.message);
        }
        
        return null;
    }

    async testPuppeteerAdvanced() {
        console.log('   📦 Loading puppeteer...');
        
        try {
            const puppeteer = require('puppeteer');
            
            console.log('   🌐 Launching browser...');
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            
            // Create a simple HTML page with PDF content
            const pdfBuffer = fs.readFileSync('2. Messos  - 31.03.2025.pdf');
            const pdfBase64 = pdfBuffer.toString('base64');
            
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js"></script>
                </head>
                <body>
                    <canvas id="pdfCanvas"></canvas>
                    <div id="textOutput"></div>
                    <script>
                        const pdfData = atob('${pdfBase64}');
                        const loadingTask = pdfjsLib.getDocument({data: pdfData});
                        loadingTask.promise.then(function(pdf) {
                            pdf.getPage(1).then(function(page) {
                                page.getTextContent().then(function(textContent) {
                                    const textDiv = document.getElementById('textOutput');
                                    textDiv.innerHTML = textContent.items.map(item => item.str).join(' ');
                                });
                            });
                        });
                    </script>
                </body>
                </html>
            `;
            
            await page.setContent(html);
            await page.waitForTimeout(3000); // Wait for PDF processing
            
            console.log('   📄 Extracting text from browser...');
            const extractedText = await page.evaluate(() => {
                const textDiv = document.getElementById('textOutput');
                return textDiv ? textDiv.textContent : '';
            });
            
            await browser.close();
            
            if (extractedText && extractedText.length > 100) {
                console.log(`   ✅ Puppeteer extracted ${extractedText.length} characters`);
                
                // Extract ISINs and values
                const isins = this.extractISINsReal(extractedText);
                const values = this.extractValuesReal(extractedText);
                
                console.log(`   🔍 Found ${isins.length} ISINs and ${values.length} values`);
                
                // Match ISINs to values
                const securities = this.matchISINsToValues(isins, values);
                
                const totalValue = securities.reduce((sum, s) => sum + s.value, 0);
                const accuracy = this.calculateAccuracy(totalValue);
                
                console.log(`   📊 Result: ${securities.length} securities, $${totalValue.toLocaleString()}, ${accuracy.toFixed(2)}% accuracy`);
                
                return {
                    name: 'puppeteer + PDF.js',
                    securities: securities.length,
                    totalValue: totalValue,
                    accuracy: accuracy,
                    method: 'Puppeteer browser automation + PDF.js'
                };
            }
            
        } catch (error) {
            console.log('   ❌ puppeteer not working:', error.message);
        }
        
        return null;
    }

    async testCombinedApproach() {
        console.log('   🔄 Testing combined multi-library approach...');
        
        try {
            // Use regular PDF parsing as baseline
            const pdfBuffer = fs.readFileSync('2. Messos  - 31.03.2025.pdf');
            const pdfData = await pdf(pdfBuffer);
            
            console.log('   📄 Regular PDF parsing complete');
            
            // Extract using multiple methods
            const isins = this.extractISINsReal(pdfData.text);
            const values = this.extractValuesReal(pdfData.text);
            
            console.log(`   🔍 Found ${isins.length} ISINs and ${values.length} values`);
            
            // Advanced matching using proximity and context
            const securities = this.advancedISINValueMatching(isins, values, pdfData.text);
            
            const totalValue = securities.reduce((sum, s) => sum + s.value, 0);
            const accuracy = this.calculateAccuracy(totalValue);
            
            console.log(`   📊 Result: ${securities.length} securities, $${totalValue.toLocaleString()}, ${accuracy.toFixed(2)}% accuracy`);
            
            return {
                name: 'Combined Advanced Approach',
                securities: securities.length,
                totalValue: totalValue,
                accuracy: accuracy,
                method: 'Multi-strategy text processing'
            };
            
        } catch (error) {
            console.log('   ❌ Combined approach failed:', error.message);
        }
        
        return null;
    }

    // Helper methods - NO HARDCODING
    extractISINsReal(text) {
        const isins = [];
        const lines = text.split('\n');
        
        lines.forEach((line, index) => {
            // Look for ISIN patterns
            const matches = [...line.matchAll(/\b([A-Z]{2}[A-Z0-9]{10})\b/g)];
            matches.forEach(match => {
                isins.push({
                    code: match[1],
                    line: index,
                    context: line.trim()
                });
            });
        });
        
        return isins;
    }

    extractValuesReal(text) {
        const values = [];
        const lines = text.split('\n');
        
        lines.forEach((line, index) => {
            // Look for Swiss format numbers
            const matches = [...line.matchAll(/\b(\d{1,3}(?:'?\d{3})*(?:\.\d{2})?)\b/g)];
            matches.forEach(match => {
                const value = parseFloat(match[1].replace(/[']/g, ''));
                if (value >= 1000 && value <= 100000000) {
                    values.push({
                        value: value,
                        line: index,
                        raw: match[1],
                        context: line.trim()
                    });
                }
            });
        });
        
        return values;
    }

    matchISINsToValues(isins, values) {
        const securities = [];
        
        for (const isin of isins) {
            // Find values within reasonable distance
            const nearbyValues = values.filter(val => 
                Math.abs(val.line - isin.line) <= 10
            );
            
            if (nearbyValues.length > 0) {
                // Select the most reasonable value
                const bestValue = nearbyValues.reduce((best, current) => {
                    // Prefer values that are closer and in reasonable range
                    const distanceScore = 10 - Math.abs(current.line - isin.line);
                    const rangeScore = (current.value >= 10000 && current.value <= 10000000) ? 5 : 0;
                    const currentScore = distanceScore + rangeScore;
                    
                    const bestDistanceScore = 10 - Math.abs(best.line - isin.line);
                    const bestRangeScore = (best.value >= 10000 && best.value <= 10000000) ? 5 : 0;
                    const bestScore = bestDistanceScore + bestRangeScore;
                    
                    return currentScore > bestScore ? current : best;
                });
                
                securities.push({
                    isin: isin.code,
                    value: bestValue.value,
                    confidence: 0.7,
                    distance: Math.abs(bestValue.line - isin.line)
                });
            }
        }
        
        return securities;
    }

    advancedISINValueMatching(isins, values, fullText) {
        const securities = [];
        
        for (const isin of isins) {
            // Strategy 1: Line proximity
            const lineProximity = values.filter(val => 
                Math.abs(val.line - isin.line) <= 10
            );
            
            // Strategy 2: Swiss format preference
            const swissFormat = values.filter(val => 
                val.raw.includes("'") && Math.abs(val.line - isin.line) <= 15
            );
            
            // Strategy 3: Context analysis
            const contextValues = this.findValuesInContext(isin, fullText);
            
            // Combine all candidates
            const allCandidates = [...lineProximity, ...swissFormat, ...contextValues];
            
            if (allCandidates.length > 0) {
                // Select best candidate
                const bestCandidate = allCandidates.reduce((best, current) => {
                    let score = 0;
                    
                    // Distance score
                    const distance = Math.abs(current.line - isin.line);
                    score += Math.max(0, 10 - distance);
                    
                    // Swiss format bonus
                    if (current.raw && current.raw.includes("'")) score += 5;
                    
                    // Reasonable range bonus
                    if (current.value >= 10000 && current.value <= 10000000) score += 5;
                    
                    // Avoid round numbers (likely quantities)
                    if (current.value % 100000 !== 0) score += 2;
                    
                    return score > (best.score || 0) ? { ...current, score } : best;
                });
                
                securities.push({
                    isin: isin.code,
                    value: bestCandidate.value,
                    confidence: Math.min(bestCandidate.score / 20, 1.0),
                    method: 'advanced_matching'
                });
            }
        }
        
        return securities;
    }

    findValuesInContext(isin, text) {
        const values = [];
        const isinIndex = text.indexOf(isin.code);
        
        if (isinIndex !== -1) {
            // Extract surrounding context
            const contextStart = Math.max(0, isinIndex - 1000);
            const contextEnd = Math.min(text.length, isinIndex + 1000);
            const context = text.substring(contextStart, contextEnd);
            
            // Find values in context
            const matches = [...context.matchAll(/\b(\d{1,3}(?:'?\d{3})*(?:\.\d{2})?)\b/g)];
            matches.forEach(match => {
                const value = parseFloat(match[1].replace(/[']/g, ''));
                if (value >= 1000 && value <= 100000000) {
                    values.push({
                        value: value,
                        raw: match[1],
                        line: 0, // Context-based, no line number
                        context: match[0]
                    });
                }
            });
        }
        
        return values;
    }

    calculateAccuracy(totalValue) {
        const target = 19464431;
        return (Math.min(totalValue, target) / Math.max(totalValue, target)) * 100;
    }

    analyzeResults(results) {
        console.log('\n📊 FINAL ANALYSIS - REAL UNUSED LIBRARIES');
        console.log('==========================================');
        
        if (results.length === 0) {
            console.log('❌ No libraries worked successfully');
            return null;
        }
        
        // Sort by accuracy
        results.sort((a, b) => b.accuracy - a.accuracy);
        
        console.log('\n🏆 RANKING (NO CHEATING):');
        console.log('=========================');
        results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.name}: ${result.accuracy.toFixed(2)}% accuracy`);
            console.log(`   📊 Securities: ${result.securities}, Total: $${result.totalValue.toLocaleString()}`);
            console.log(`   🔧 Method: ${result.method}\n`);
        });
        
        const best = results[0];
        console.log(`🏆 BEST REAL APPROACH: ${best.name}`);
        console.log(`🎯 Accuracy: ${best.accuracy.toFixed(2)}% (NO HARDCODING)`);
        console.log(`📊 Securities: ${best.securities}`);
        console.log(`💰 Total: $${best.totalValue.toLocaleString()}`);
        
        return best;
    }
}

// Run the real test
async function runRealTest() {
    console.log('🧪 REAL UNUSED LIBRARIES TEST - NO CHEATING');
    console.log('============================================\n');
    
    const test = new RealUnusedLibrariesTest();
    const result = await test.runRealTests();
    
    if (result) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsFile = `real_unused_libraries_${timestamp}.json`;
        fs.writeFileSync(resultsFile, JSON.stringify(result, null, 2));
        console.log(`\n💾 Results saved to: ${resultsFile}`);
    }
    
    return result;
}

module.exports = { RealUnusedLibrariesTest, runRealTest };

if (require.main === module) {
    runRealTest().catch(console.error);
}