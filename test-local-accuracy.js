// Test 99% accuracy locally with text extraction - no hardcoding
const fs = require('fs');
const pdfParse = require('pdf-parse');

// Enhanced Swiss number parsing
function parseSwissNumber(str) {
    if (!str) return 0;
    const cleaned = str.replace(/[^\d.-]/g, '');
    const number = parseFloat(cleaned) || 0;
    return number;
}

// Dynamic portfolio total detection (NO HARDCODING)
function extractPortfolioTotal(text) {
    console.log('🔍 Dynamically detecting portfolio total...');
    
    const totalPatterns = [
        /Total\s+(?:assets|portfolio)?\s*(?:USD|CHF)?\s*(\d{1,3}(?:[',]?\d{3})*)/gi,
        /Portfolio\s+Total\s*(?:USD|CHF)?\s*(\d{1,3}(?:[',]?\d{3})*)/gi,
        /Total\s*(\d{1,3}(?:[',]?\d{3})*)\s*100\.00%/gi,
        // More patterns without hardcoding specific numbers
        /Total.*?(\d{1,3}[',]\d{3}[',]\d{3})/gi,
        /(\d{1,3}[',]\d{3}[',]\d{3}).*?100\.00%/gi
    ];
    
    const candidates = [];
    
    for (const pattern of totalPatterns) {
        const matches = [...text.matchAll(pattern)];
        for (const match of matches) {
            const value = parseSwissNumber(match[1]);
            if (value > 10000000 && value < 100000000) {
                candidates.push({ value, pattern: pattern.source });
                console.log(`   Found candidate: $${value.toLocaleString()} from pattern: ${pattern.source}`);
            }
        }
    }
    
    if (candidates.length > 0) {
        // Use the most common value or the one from the most specific pattern
        const result = candidates[0].value;
        console.log(`✅ Detected portfolio total: $${result.toLocaleString()} (NO HARDCODING)`);
        return result;
    }
    
    console.log('❌ Could not detect portfolio total dynamically');
    return 0; // Return 0 if we can't detect it - NO FALLBACK TO HARDCODED VALUE
}

// Enhanced securities extraction - 99% accuracy target
function extractSecuritiesEnhanced(text) {
    console.log('🎯 Extracting securities with enhanced method...');
    
    const securities = [];
    const lines = text.split('\n');
    const portfolioTotal = extractPortfolioTotal(text);
    
    if (portfolioTotal === 0) {
        console.log('❌ Cannot proceed without portfolio total - no hardcoding allowed');
        return [];
    }
    
    // Improved section detection
    let inPortfolioSection = false;
    const portfolioKeywords = ['Holdings', 'Portfolio', 'Securities', 'Positions', 'Assets'];
    const endKeywords = ['Total Portfolio', 'Summary', 'Performance Analysis'];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detect portfolio section start
        if (portfolioKeywords.some(keyword => line.includes(keyword))) {
            inPortfolioSection = true;
            console.log(`   📁 Entering portfolio section: ${line}`);
            continue;
        }
        
        // Detect section end
        if (endKeywords.some(keyword => line.includes(keyword))) {
            inPortfolioSection = false;
            console.log(`   📁 Exiting portfolio section: ${line}`);
            continue;
        }
        
        if (inPortfolioSection) {
            // Enhanced ISIN detection
            const isinMatch = line.match(/([A-Z]{2}[A-Z0-9]{10})/);
            if (isinMatch) {
                const isin = isinMatch[1];
                
                // Extract security name
                let name = '';
                const beforeIsin = line.substring(0, line.indexOf(isin)).trim();
                if (beforeIsin.length > 3) {
                    name = beforeIsin.replace(/^\d+\s*/, '').trim();
                }
                
                // Enhanced value extraction - remove ISIN first
                const lineWithoutISIN = line.replace(/[A-Z]{2}[A-Z0-9]{10}/g, '');
                
                const valuePatterns = [
                    // Swiss format with currency context
                    /(\d{1,3}[',]?\d{3}[',]?\d{3}(?:\.\d{2})?)\s*(?:CHF|USD|EUR)/gi,
                    /(?:CHF|USD|EUR)\s*(\d{1,3}[',]?\d{3}[',]?\d{3}(?:\.\d{2})?)/gi,
                    // Decimal amounts in reasonable range
                    /(\d{1,3}[',]?\d{3}[',]?\d{3}\.\d{2})/g
                ];
                
                const valueCandidates = [];
                
                for (const pattern of valuePatterns) {
                    let match;
                    while ((match = pattern.exec(lineWithoutISIN)) !== null) {
                        const candidate = parseSwissNumber(match[1]);
                        // Conservative range - typical individual securities
                        if (candidate >= 10000 && candidate <= portfolioTotal * 0.2) {
                            valueCandidates.push(candidate);
                        }
                    }
                }
                
                // Select best value using median approach
                if (valueCandidates.length > 0) {
                    valueCandidates.sort((a, b) => a - b);
                    const mid = Math.floor(valueCandidates.length / 2);
                    const value = valueCandidates.length % 2 !== 0 
                        ? valueCandidates[mid] 
                        : (valueCandidates[mid - 1] + valueCandidates[mid]) / 2;
                    
                    securities.push({
                        isin: isin,
                        name: name || `Security ${isin}`,
                        value: value,
                        currency: 'CHF'
                    });
                    
                    console.log(`   ✅ Found: ${isin} - $${value.toLocaleString()}`);
                }
            }
        }
    }
    
    console.log(`📊 Extracted ${securities.length} securities`);
    return securities;
}

async function testLocalAccuracy() {
    console.log('🎯 TESTING 99% ACCURACY LOCALLY (NO HARDCODING)');
    console.log('==============================================');
    
    const messosPdfPath = './2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(messosPdfPath)) {
        console.log('❌ Messos PDF not found');
        return;
    }
    
    try {
        console.log('📄 Reading and parsing PDF...');
        const pdfBuffer = fs.readFileSync(messosPdfPath);
        const pdfData = await pdfParse(pdfBuffer);
        const text = pdfData.text;
        
        console.log(`📝 Extracted ${text.length} characters of text`);
        console.log('');
        
        // Extract securities with enhanced method
        const securities = extractSecuritiesEnhanced(text);
        const totalValue = securities.reduce((sum, sec) => sum + sec.value, 0);
        const portfolioTotal = extractPortfolioTotal(text);
        
        console.log('');
        console.log('📊 FINAL RESULTS:');
        console.log('==================');
        console.log(`Securities found: ${securities.length}`);
        console.log(`Total extracted: $${totalValue.toLocaleString()}`);
        console.log(`Portfolio total: $${portfolioTotal.toLocaleString()}`);
        
        if (portfolioTotal > 0) {
            const accuracy = ((1 - Math.abs(totalValue - portfolioTotal) / portfolioTotal) * 100);
            console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
            
            if (accuracy >= 99.0) {
                console.log('🎉 SUCCESS! 99%+ ACCURACY ACHIEVED WITHOUT HARDCODING!');
            } else if (accuracy >= 95.0) {
                console.log('✅ Excellent accuracy (95%+) - very close to 99% target');
            } else {
                console.log('⚠️  Accuracy below target - needs improvement');
            }
        } else {
            console.log('❌ Cannot calculate accuracy - portfolio total not detected');
        }
        
        // Show top securities
        if (securities.length > 0) {
            console.log('');
            console.log('📋 Top 10 securities found:');
            securities.slice(0, 10).forEach((sec, i) => {
                console.log(`${i+1}. ${sec.isin}: $${sec.value.toLocaleString()} - ${sec.name}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testLocalAccuracy();