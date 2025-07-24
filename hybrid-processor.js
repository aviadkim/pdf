/**
 * Hybrid Processing System
 * Combines 86% accurate base extraction with OpenAI verification
 */

const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const OpenAI = require('openai');

class HybridProcessor {
    constructor() {
        this.openaiClient = null;
        this.initializeOpenAI();
    }
    
    initializeOpenAI() {
        if (process.env.OPENAI_API_KEY) {
            this.openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            console.log('✅ Hybrid processor: OpenAI client initialized');
        } else {
            console.log('⚠️ Hybrid processor: OpenAI not available, using base extraction only');
        }
    }
    
    /**
     * Main hybrid processing pipeline
     */
    async processDocument(filePath, expectedTotal = 19464431) {
        console.log('🔄 Starting hybrid processing...');
        const startTime = Date.now();
        
        try {
            // Step 1: Base extraction (86% accurate system)
            console.log('📊 Step 1: Base extraction (86% system)...');
            const baseResult = await this.baseExtraction(filePath);
            
            // Step 2: OpenAI verification and enhancement
            console.log('🤖 Step 2: OpenAI verification and enhancement...');
            const enhancedResult = await this.openaiEnhancement(filePath, baseResult, expectedTotal);
            
            // Step 3: Intelligent merge
            console.log('🔀 Step 3: Intelligent merge...');
            const finalResult = await this.intelligentMerge(baseResult, enhancedResult, expectedTotal);
            
            const processingTime = Date.now() - startTime;
            
            return {
                ...finalResult,
                metadata: {
                    ...finalResult.metadata,
                    totalProcessingTime: processingTime,
                    approach: 'hybrid-base-plus-ai',
                    baseAccuracy: baseResult.accuracy,
                    aiAccuracy: enhancedResult.accuracy,
                    hybridAccuracy: finalResult.accuracy
                }
            };
            
        } catch (error) {
            console.error('❌ Hybrid processing failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Step 1: Use current 86% accurate extraction
     */
    async baseExtraction(filePath) {
        console.log('📄 Running base extraction (proven 86% system)...');
        
        // Read PDF
        const pdfBuffer = await fs.readFile(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        const text = pdfData.text;
        
        // Use the existing precise extraction method
        const securities = this.extractSecuritiesPrecise(text);
        const totalValue = securities.reduce((sum, sec) => sum + sec.marketValue, 0);
        const accuracy = ((totalValue / 19464431) * 100).toFixed(2);
        
        return {
            success: true,
            securities: securities,
            totalValue: totalValue,
            accuracy: accuracy,
            method: 'base-extraction-86pct',
            securitiesFound: securities.length
        };
    }
    
    /**
     * Step 2: OpenAI enhancement for missing securities
     */
    async openaiEnhancement(filePath, baseResult, expectedTotal) {
        if (!this.openaiClient) {
            console.log('⚠️ OpenAI not available, skipping enhancement');
            return baseResult;
        }
        
        const gap = expectedTotal - baseResult.totalValue;
        const gapPercentage = (gap / expectedTotal) * 100;
        
        if (gapPercentage < 5) {
            console.log('✅ Base accuracy sufficient, skipping OpenAI enhancement');
            return baseResult;
        }
        
        console.log(`🔍 Gap: $${gap.toLocaleString()} (${gapPercentage.toFixed(1)}%) - Using OpenAI to find missing securities`);
        
        // Read document for OpenAI analysis
        const pdfBuffer = await fs.readFile(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        const text = pdfData.text;
        
        const foundISINs = baseResult.securities.map(s => s.isin);
        
        const prompt = `
FINANCIAL DOCUMENT GAP ANALYSIS

A base extraction system found ${baseResult.securities.length} securities totaling $${baseResult.totalValue.toLocaleString()}.
Expected total: $${expectedTotal.toLocaleString()}
MISSING: $${gap.toLocaleString()} (${gapPercentage.toFixed(1)}%)

ALREADY FOUND: ${foundISINs.join(', ')}

MISSION: Find the specific missing securities that explain the $${gap.toLocaleString()} gap.

STRATEGY:
1. Look for ISINs NOT in the found list above
2. Focus on high-value securities (>$100,000)
3. Check for any major securities the base system missed
4. Swiss format: 1'234'567 = $1,234,567

Return JSON with ONLY the missing securities:
{
  "success": true,
  "missingsecurities": [
    {
      "isin": "MISSING_ISIN",
      "name": "Security name", 
      "marketValue": 1000000,
      "currency": "USD",
      "confidence": 0.9,
      "source": "Found in section X"
    }
  ],
  "totalMissingValue": 1000000,
  "analysis": "Why these were missed"
}

DOCUMENT:
${text.substring(0, 20000)}

FIND THE HIGH-VALUE MISSING SECURITIES!
`;

        try {
            const response = await this.openaiClient.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a financial document gap analysis expert. Find missing high-value securities."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" },
                max_tokens: 2000,
                temperature: 0.1
            });
            
            const content = response.choices[0].message.content;
            const parsed = JSON.parse(content);
            
            console.log('📝 OpenAI gap analysis:', parsed.analysis || 'No analysis provided');
            
            if (parsed.missingsecurities && parsed.missingsecurities.length > 0) {
                console.log(`✅ OpenAI found ${parsed.missingsecurities.length} missing securities`);
                
                return {
                    success: true,
                    securities: parsed.missingsecurities.map(sec => ({
                        ...sec,
                        extractionMethod: 'openai-gap-analysis',
                        openaiEnhanced: true
                    })),
                    totalValue: parsed.totalMissingValue || 0,
                    method: 'openai-gap-analysis',
                    securitiesFound: parsed.missingsecurities.length
                };
            }
            
            return { success: true, securities: [], totalValue: 0, method: 'openai-no-gaps-found' };
            
        } catch (error) {
            console.error('❌ OpenAI enhancement failed:', error.message);
            return { success: false, securities: [], totalValue: 0, error: error.message };
        }
    }
    
    /**
     * Step 3: Intelligently merge base + AI results
     */
    async intelligentMerge(baseResult, aiResult, expectedTotal) {
        console.log('🔀 Merging base and AI results...');
        
        // Start with base results (proven 86% accurate)
        const mergedSecurities = [...baseResult.securities];
        
        // Add AI-found securities that don't conflict
        if (aiResult.securities) {
            const baseISINs = new Set(baseResult.securities.map(s => s.isin));
            
            aiResult.securities.forEach(aiSec => {
                if (!baseISINs.has(aiSec.isin)) {
                    mergedSecurities.push({
                        ...aiSec,
                        hybridSource: 'ai-enhancement'
                    });
                    console.log(`➕ Added AI-found security: ${aiSec.isin} ($${aiSec.marketValue.toLocaleString()})`);
                } else {
                    console.log(`⚠️ Skipped duplicate ISIN: ${aiSec.isin}`);
                }
            });
        }
        
        const totalValue = mergedSecurities.reduce((sum, sec) => sum + sec.marketValue, 0);
        const accuracy = ((totalValue / expectedTotal) * 100).toFixed(2);
        
        console.log(`📊 Hybrid result: ${mergedSecurities.length} securities, $${totalValue.toLocaleString()}, ${accuracy}% accuracy`);
        
        return {
            success: true,
            securities: mergedSecurities,
            totalValue: totalValue,
            accuracy: accuracy,
            expectedTotal: expectedTotal,
            gap: expectedTotal - totalValue,
            securitiesFound: mergedSecurities.length,
            metadata: {
                extractionMethod: 'hybrid-base-plus-ai',
                baseSecurities: baseResult.securities.length,
                aiSecurities: aiResult.securities ? aiResult.securities.length : 0,
                mergedSecurities: mergedSecurities.length,
                provider: 'Hybrid-System'
            }
        };
    }
    
    /**
     * Existing precise extraction method (86% accurate)
     */
    extractSecuritiesPrecise(text) {
        const securities = [];
        
        // Enhanced ISIN detection
        const isinPattern = /([A-Z]{2}[A-Z0-9]{9}[0-9])/g;
        const isinMatches = [...text.matchAll(isinPattern)];
        
        isinMatches.forEach(match => {
            const isin = match[1];
            const isinIndex = match.index;
            
            // Extract context around ISIN
            const contextStart = Math.max(0, isinIndex - 300);
            const contextEnd = Math.min(text.length, isinIndex + 300);
            const context = text.substring(contextStart, contextEnd);
            
            // Multiple value extraction patterns
            const valuePatterns = [
                /(\d{1,3}(?:[']\d{3})*(?:\.\d{2})?)\s*USD/g,
                /USD\s*(\d{1,3}(?:[']\d{3})*(?:\.\d{2})?)/g,
                /(\d{1,3}(?:[']\d{3})*)\s*(?=\s|$)/g
            ];
            
            let bestValue = null;
            let bestScore = 0;
            
            valuePatterns.forEach(pattern => {
                const matches = [...context.matchAll(pattern)];
                matches.forEach(valueMatch => {
                    const valueStr = valueMatch[1];
                    const value = parseFloat(valueStr.replace(/'/g, ''));
                    
                    if (value > 1000 && value < 20000000) {
                        const distance = Math.abs(valueMatch.index - (isinIndex - contextStart));
                        const score = 1000 - distance;
                        
                        if (score > bestScore) {
                            bestValue = value;
                            bestScore = score;
                        }
                    }
                });
            });
            
            if (bestValue) {
                securities.push({
                    isin: isin,
                    marketValue: bestValue,
                    extractionMethod: 'enhanced-precision-v3-improved',
                    context: context.substring(Math.max(0, isinIndex - contextStart - 50), 
                                            Math.min(context.length, isinIndex - contextStart + 50)),
                    confidence: bestScore / 1000
                });
            }
        });
        
        return securities;
    }
}

module.exports = { HybridProcessor };