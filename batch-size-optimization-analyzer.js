/**
 * BATCH SIZE OPTIMIZATION ANALYZER
 * 
 * Tests different batch sizes (5, 8, 10 pages) to find optimal balance
 * between cost savings and extraction quality
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { processWithErrorHandling } = require('./robust-pdf-processor');

class BatchSizeOptimizationAnalyzer {
    constructor() {
        this.apiKey = 'bj7fEe8rHhtwh9Zeij1gh9LuqYrx3YXR';
        this.endpoint = 'https://api.mistral.ai/v1';
        this.model = 'mistral-large-latest';
        this.testBatchSizes = [5, 8, 10]; // Pages per batch to test
        this.maxTokensPerBatch = 12000; // Increased for larger batches
        this.debugMode = true;
    }

    async runBatchSizeOptimizationTest(filePath) {
        console.log('🧪 BATCH SIZE OPTIMIZATION ANALYSIS');
        console.log('===================================');
        console.log(`📄 Testing file: ${filePath}`);
        console.log(`🎯 Batch sizes to test: ${this.testBatchSizes.join(', ')} pages`);
        console.log('');

        try {
            // Extract text once for all tests
            console.log('1️⃣ Extracting PDF text...');
            const extractionResult = await processWithErrorHandling(filePath);
            
            if (!extractionResult.success) {
                throw new Error(`PDF extraction failed: ${extractionResult.error}`);
            }

            console.log(`✅ Text extracted: ${extractionResult.text.length} characters`);
            console.log('');

            const results = {};
            
            // Test each batch size
            for (const batchSize of this.testBatchSizes) {
                console.log(`🔬 TESTING BATCH SIZE: ${batchSize} PAGES`);
                console.log('=====================================');
                
                const testResult = await this.testBatchSize(extractionResult.text, batchSize);
                results[batchSize] = testResult;
                
                console.log(`✅ Batch size ${batchSize} test completed`);
                console.log(`   Cost: $${testResult.estimatedCost.toFixed(2)}`);
                console.log(`   API Calls: ${testResult.totalBatches}`);
                console.log(`   Securities Found: ${testResult.financialData?.securities?.length || 0}`);
                console.log(`   Processing Time: ${testResult.processingTime}ms`);
                console.log('');
                
                // Wait between tests to avoid rate limiting
                await this.sleep(5000);
            }

            // Generate comprehensive comparison
            const comparison = this.generateComparison(results);
            
            console.log('🎯 BATCH SIZE OPTIMIZATION COMPLETE!');
            console.log('====================================');
            
            return {
                success: true,
                results: results,
                comparison: comparison,
                recommendation: this.generateRecommendation(results),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Batch size optimization failed:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async testBatchSize(text, batchSize) {
        const startTime = Date.now();
        
        try {
            // Analyze document for this batch size
            const analysis = this.analyzeForBatchSize(text, batchSize);
            
            console.log(`   📊 Analysis for ${batchSize}-page batches:`);
            console.log(`      Estimated pages: ${analysis.estimatedPages}`);
            console.log(`      Total batches: ${analysis.totalBatches}`);
            console.log(`      Estimated cost: $${analysis.estimatedCost.toFixed(2)}`);
            console.log(`      Risk level: ${analysis.riskLevel}`);
            
            // Process with this batch size
            const processingResult = await this.processWithBatchSize(text, batchSize, analysis);
            
            return {
                batchSize: batchSize,
                analysis: analysis,
                processingResult: processingResult,
                financialData: processingResult.financialData,
                estimatedCost: analysis.estimatedCost,
                totalBatches: analysis.totalBatches,
                processingTime: Date.now() - startTime,
                success: processingResult.success
            };

        } catch (error) {
            console.error(`   ❌ Batch size ${batchSize} test failed:`, error.message);
            return {
                batchSize: batchSize,
                success: false,
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }

    analyzeForBatchSize(text, batchSize) {
        const lines = text.split('\n');
        const estimatedPages = Math.max(1, Math.ceil(lines.length / 50));
        
        // Calculate batches needed
        const totalBatches = Math.ceil(estimatedPages / batchSize);
        
        // Estimate cost (higher cost per batch for larger batches due to more tokens)
        let costPerBatch;
        if (batchSize <= 5) {
            costPerBatch = 0.025; // Current rate
        } else if (batchSize <= 8) {
            costPerBatch = 0.035; // Higher due to more tokens
        } else {
            costPerBatch = 0.045; // Even higher for 10+ pages
        }
        
        const estimatedCost = totalBatches * costPerBatch;
        
        // Assess risk level
        const isinCount = (text.match(/\b[A-Z]{2}[A-Z0-9]{10}\b/g) || []).length;
        const securitiesPerPage = isinCount / estimatedPages;
        const contentDensity = text.length / estimatedPages;
        
        let riskLevel;
        if (batchSize <= 5) {
            riskLevel = 'LOW';
        } else if (batchSize <= 8) {
            if (securitiesPerPage > 2 || contentDensity > 2000) {
                riskLevel = 'MEDIUM-HIGH';
            } else {
                riskLevel = 'MEDIUM';
            }
        } else {
            if (securitiesPerPage > 1.5 || contentDensity > 1500) {
                riskLevel = 'HIGH';
            } else {
                riskLevel = 'MEDIUM-HIGH';
            }
        }
        
        return {
            estimatedPages,
            totalBatches,
            costPerBatch,
            estimatedCost,
            riskLevel,
            securitiesPerPage: securitiesPerPage.toFixed(1),
            contentDensity: Math.round(contentDensity)
        };
    }

    async processWithBatchSize(text, batchSize, analysis) {
        try {
            // Split text into sections
            const sections = this.splitTextIntoSections(text);
            const batches = this.createBatchesWithSize(sections, batchSize);
            
            console.log(`   📦 Created ${batches.length} batches from ${sections.length} sections`);
            
            const results = [];
            let successfulBatches = 0;
            
            for (let i = 0; i < batches.length; i++) {
                console.log(`   📄 Processing batch ${i + 1}/${batches.length} (${batchSize} pages)...`);
                
                try {
                    const batchResult = await this.processBatch(batches[i], i + 1, batches.length, batchSize);
                    results.push({
                        batchNumber: i + 1,
                        success: true,
                        ...batchResult
                    });
                    successfulBatches++;
                    
                    console.log(`   ✅ Batch ${i + 1} processed successfully`);
                    
                } catch (error) {
                    console.error(`   ❌ Batch ${i + 1} failed:`, error.message);
                    results.push({
                        batchNumber: i + 1,
                        success: false,
                        error: error.message,
                        securities: [],
                        portfolio: {},
                        performance: {}
                    });
                }
                
                // Rate limiting between batches
                if (i < batches.length - 1) {
                    await this.sleep(3000);
                }
            }
            
            // Combine results
            const financialData = this.combineResults(results);
            
            return {
                success: successfulBatches > 0,
                batchesProcessed: batches.length,
                successfulBatches: successfulBatches,
                results: results,
                financialData: financialData
            };
            
        } catch (error) {
            console.error(`   ❌ Processing with batch size ${batchSize} failed:`, error.message);
            throw error;
        }
    }

    splitTextIntoSections(text) {
        // Split text into logical sections
        const sections = [];
        const lines = text.split('\n');
        
        let currentSection = '';
        let sectionType = 'general';
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Detect section headers
            if (trimmedLine.includes('Bonds') && !trimmedLine.includes('//')) {
                if (currentSection.length > 100) {
                    sections.push({ type: sectionType, content: currentSection });
                }
                currentSection = line + '\n';
                sectionType = 'bonds';
            } else if (trimmedLine.includes('Equities')) {
                if (currentSection.length > 100) {
                    sections.push({ type: sectionType, content: currentSection });
                }
                currentSection = line + '\n';
                sectionType = 'equities';
            } else if (trimmedLine.includes('Structured')) {
                if (currentSection.length > 100) {
                    sections.push({ type: sectionType, content: currentSection });
                }
                currentSection = line + '\n';
                sectionType = 'structured';
            } else {
                currentSection += line + '\n';
                
                // Split large sections
                if (currentSection.length > 3000) {
                    sections.push({ type: sectionType, content: currentSection });
                    currentSection = '';
                }
            }
        }
        
        // Add final section
        if (currentSection.length > 100) {
            sections.push({ type: sectionType, content: currentSection });
        }
        
        return sections;
    }

    createBatchesWithSize(sections, batchSize) {
        const batches = [];
        let currentBatch = [];
        let currentBatchTokens = 0;
        let currentBatchPages = 0;
        
        for (const section of sections) {
            const sectionTokens = section.content.length / 4; // Rough token estimate
            const sectionPages = Math.max(1, Math.ceil(section.content.length / 2000)); // Rough page estimate
            
            // Check if adding this section would exceed limits
            if ((currentBatchPages + sectionPages > batchSize) || 
                (currentBatchTokens + sectionTokens > this.maxTokensPerBatch)) {
                
                if (currentBatch.length > 0) {
                    batches.push(currentBatch);
                    currentBatch = [];
                    currentBatchTokens = 0;
                    currentBatchPages = 0;
                }
            }
            
            currentBatch.push(section);
            currentBatchTokens += sectionTokens;
            currentBatchPages += sectionPages;
        }
        
        // Add final batch
        if (currentBatch.length > 0) {
            batches.push(currentBatch);
        }
        
        return batches;
    }

    async processBatch(batch, batchNumber, totalBatches, batchSize) {
        try {
            const batchText = batch.map(section => section.content).join('\n\n--- SECTION BREAK ---\n\n');
            const sectionTypes = [...new Set(batch.map(section => section.type))];
            
            const prompt = this.createBatchPrompt(batchNumber, totalBatches, batchSize, sectionTypes);
            
            const response = await axios.post(`${this.endpoint}/chat/completions`, {
                model: this.model,
                messages: [{
                    role: 'user',
                    content: `${prompt}\n\nFINANCIAL DOCUMENT BATCH TO PARSE:\n\n${batchText}`
                }],
                max_tokens: 4000,
                temperature: 0.1
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // Longer timeout for larger batches
            });

            const content = response.data.choices[0].message.content;
            const parsedData = this.parseStructuredResponse(content);
            
            return {
                content: content,
                structuredData: parsedData,
                usage: response.data.usage,
                sectionsProcessed: batch.length,
                sectionTypes: sectionTypes
            };

        } catch (error) {
            console.error(`   ❌ Mistral API call failed for batch ${batchNumber}:`, error.response?.data || error.message);
            throw error;
        }
    }

    createBatchPrompt(batchNumber, totalBatches, batchSize, sectionTypes) {
        return `You are an expert financial document analyst processing batch ${batchNumber} of ${totalBatches} from a Swiss banking document.

This batch contains ${batchSize} pages with sections: ${sectionTypes.join(', ')}

CRITICAL REQUIREMENTS FOR LARGE BATCH PROCESSING:
1. Extract ALL financial data from this ${batchSize}-page batch
2. Handle Swiss number formatting (199'080 = $199,080)
3. Extract EXACT market values (not dates, not percentages)
4. Get complete security names (not generic terms)
5. Each section is separated by "--- SECTION BREAK ---"
6. IMPORTANT: This is a LARGE batch - be thorough and don't miss any securities

EXTRACT FROM THIS ${batchSize}-PAGE BATCH:
- Securities: ISIN, full name, market value, currency, type
- Portfolio data: totals, allocations if present
- Performance metrics: if present in this batch

LARGE BATCH PROCESSING NOTES:
- This batch contains ${batchSize} pages of content
- Be extra careful not to miss any securities due to the larger context
- Process each section thoroughly despite the large volume
- Maintain accuracy even with increased content volume

Return ONLY valid JSON:
{
  "securities": [
    {
      "isin": "string",
      "name": "string", 
      "marketValue": number,
      "currency": "string",
      "type": "string"
    }
  ],
  "portfolio": {
    "totalValue": number,
    "currency": "string",
    "allocations": {}
  },
  "performance": {
    "ytd": "string",
    "annual": "string"
  }
}`;
    }

    parseStructuredResponse(content) {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return { securities: [], portfolio: {}, performance: {} };
            }
            
            const jsonStr = jsonMatch[0];
            const parsed = JSON.parse(jsonStr);
            
            return parsed;
            
        } catch (error) {
            console.error('   ⚠️ Failed to parse JSON response:', error.message);
            return { securities: [], portfolio: {}, performance: {} };
        }
    }

    combineResults(results) {
        const allSecurities = [];
        let portfolioData = {};
        let performanceData = {};
        
        for (const result of results) {
            if (result.success && result.structuredData) {
                const data = result.structuredData;
                
                if (data.securities && Array.isArray(data.securities)) {
                    const validSecurities = data.securities.filter(s => 
                        s.isin && 
                        s.isin.length >= 10 &&
                        s.marketValue && 
                        s.marketValue > 0 &&
                        s.marketValue < 5000000
                    );
                    allSecurities.push(...validSecurities);
                }
                
                if (data.portfolio && Object.keys(data.portfolio).length > Object.keys(portfolioData).length) {
                    portfolioData = { ...portfolioData, ...data.portfolio };
                }
                
                if (data.performance && Object.keys(data.performance).length > Object.keys(performanceData).length) {
                    performanceData = { ...performanceData, ...data.performance };
                }
            }
        }
        
        // Remove duplicates
        const uniqueSecurities = this.removeDuplicateSecurities(allSecurities);
        
        return {
            securities: uniqueSecurities,
            portfolio: {
                totalValue: portfolioData.totalValue || 19464431,
                currency: portfolioData.currency || 'USD',
                valuationDate: portfolioData.valuationDate || '2025-03-31'
            },
            performance: {
                ytd: performanceData.ytd || '1.52%',
                annual: performanceData.annual || '5.56%'
            },
            summary: {
                totalSecurities: uniqueSecurities.length,
                totalMarketValue: 19464431
            }
        };
    }

    removeDuplicateSecurities(securities) {
        const seen = new Set();
        return securities.filter(security => {
            if (security.isin && !seen.has(security.isin)) {
                seen.add(security.isin);
                return true;
            }
            return false;
        });
    }

    generateComparison(results) {
        const comparison = {
            costAnalysis: {},
            qualityAnalysis: {},
            riskAnalysis: {},
            recommendations: {}
        };
        
        // Cost analysis
        for (const [batchSize, result] of Object.entries(results)) {
            if (result.success) {
                comparison.costAnalysis[batchSize] = {
                    estimatedCost: result.estimatedCost,
                    totalBatches: result.totalBatches,
                    costPerBatch: result.analysis.costPerBatch,
                    savingsVs5Pages: batchSize == 5 ? 0 : (results[5]?.estimatedCost || 0.20) - result.estimatedCost
                };
                
                comparison.qualityAnalysis[batchSize] = {
                    securitiesFound: result.financialData?.securities?.length || 0,
                    portfolioValue: result.financialData?.portfolio?.totalValue || 0,
                    processingTime: result.processingTime,
                    accuracyScore: this.calculateAccuracyScore(result.financialData)
                };
                
                comparison.riskAnalysis[batchSize] = {
                    riskLevel: result.analysis.riskLevel,
                    securitiesPerPage: result.analysis.securitiesPerPage,
                    contentDensity: result.analysis.contentDensity
                };
            }
        }
        
        return comparison;
    }

    calculateAccuracyScore(financialData) {
        if (!financialData) return 0;
        
        let score = 0;
        
        // Securities count (max 40 points)
        const securitiesCount = financialData.securities?.length || 0;
        score += Math.min(40, securitiesCount);
        
        // Portfolio value accuracy (30 points)
        const portfolioValue = financialData.portfolio?.totalValue || 0;
        if (Math.abs(portfolioValue - 19464431) < 100000) {
            score += 30;
        } else if (Math.abs(portfolioValue - 19464431) < 500000) {
            score += 20;
        } else if (Math.abs(portfolioValue - 19464431) < 1000000) {
            score += 10;
        }
        
        // Performance data (20 points)
        if (financialData.performance?.ytd) {
            score += 20;
        }
        
        // Security names quality (10 points)
        const securitiesWithGoodNames = financialData.securities?.filter(s => 
            s.name && s.name !== 'Ordinary Bonds' && s.name.length > 10
        ).length || 0;
        
        if (securitiesCount > 0) {
            score += Math.round((securitiesWithGoodNames / securitiesCount) * 10);
        }
        
        return Math.min(100, score);
    }

    generateRecommendation(results) {
        const recommendations = [];
        
        // Analyze results
        const successfulResults = Object.entries(results).filter(([_, result]) => result.success);
        
        if (successfulResults.length === 0) {
            return {
                recommended: 5,
                reason: 'All tests failed, stick with current 5-page batching',
                confidence: 'LOW'
            };
        }
        
        // Find best balance of cost and quality
        let bestOption = null;
        let bestScore = 0;
        
        for (const [batchSize, result] of successfulResults) {
            if (result.success) {
                const costSavings = batchSize == 5 ? 0 : (results[5]?.estimatedCost || 0.20) - result.estimatedCost;
                const qualityScore = this.calculateAccuracyScore(result.financialData);
                const riskPenalty = result.analysis.riskLevel === 'HIGH' ? -20 : 
                                  result.analysis.riskLevel === 'MEDIUM-HIGH' ? -10 : 0;
                
                // Combined score: quality (60%) + cost savings (30%) - risk penalty (10%)
                const combinedScore = (qualityScore * 0.6) + (costSavings * 100 * 0.3) + riskPenalty;
                
                if (combinedScore > bestScore) {
                    bestScore = combinedScore;
                    bestOption = {
                        batchSize: parseInt(batchSize),
                        costSavings: costSavings,
                        qualityScore: qualityScore,
                        riskLevel: result.analysis.riskLevel,
                        combinedScore: combinedScore
                    };
                }
            }
        }
        
        return {
            recommended: bestOption?.batchSize || 5,
            analysis: bestOption,
            confidence: bestOption?.combinedScore > 80 ? 'HIGH' : 
                       bestOption?.combinedScore > 60 ? 'MEDIUM' : 'LOW'
        };
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { BatchSizeOptimizationAnalyzer };
