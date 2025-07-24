// LLM Integration for Financial PDF Analysis
// Supports OpenRouter and Hugging Face APIs

const axios = require('axios');
const fs = require('fs');

class LLMIntegrator {
    constructor(apiKey, provider = 'openrouter') {
        this.apiKey = apiKey;
        this.provider = provider;
        this.baseConfigs = {
            openrouter: {
                url: 'https://openrouter.ai/api/v1/chat/completions',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'Financial PDF Parser'
                }
            },
            huggingface: {
                url: 'https://api-inference.huggingface.co/models/',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        };
    }

    async validateSecurities(securities, context) {
        console.log('🤖 Using LLM to validate securities...');
        
        const prompt = this.buildValidationPrompt(securities, context);
        
        try {
            const response = await this.callLLM(prompt, {
                model: 'mistralai/mistral-7b-instruct:free',
                temperature: 0.1,
                max_tokens: 2000
            });

            return this.parseValidationResponse(response);
        } catch (error) {
            console.error('LLM validation error:', error.message);
            return { validated: securities, corrections: [] };
        }
    }

    async crossCheckValues(securities, documentText) {
        console.log('🔍 Using LLM to cross-check values...');
        
        const prompt = this.buildCrossCheckPrompt(securities, documentText);
        
        try {
            const response = await this.callLLM(prompt, {
                model: 'mistralai/mistral-7b-instruct:free',
                temperature: 0.1,
                max_tokens: 1500
            });

            return this.parseCrossCheckResponse(response);
        } catch (error) {
            console.error('LLM cross-check error:', error.message);
            return { suspicious: [], recommendations: [] };
        }
    }

    async explainDocument(documentText) {
        console.log('📚 Using LLM to explain document structure...');
        
        const prompt = this.buildExplanationPrompt(documentText);
        
        try {
            const response = await this.callLLM(prompt, {
                model: 'mistralai/mistral-7b-instruct:free',
                temperature: 0.3,
                max_tokens: 1000
            });

            return this.parseExplanationResponse(response);
        } catch (error) {
            console.error('LLM explanation error:', error.message);
            return { explanation: 'Could not analyze document structure' };
        }
    }

    buildValidationPrompt(securities, context) {
        const securitiesText = securities.map(s => 
            `${s.isin}: $${s.value?.toLocaleString() || 'N/A'}`
        ).join('\n');

        return `You are a financial analyst expert. Please review these extracted securities and identify any potential issues:

CONTEXT:
- Document Type: Portfolio Statement
- Expected Total: $${context.expectedTotal?.toLocaleString() || 'Unknown'}
- Securities Count: ${securities.length}

EXTRACTED SECURITIES:
${securitiesText}

Please analyze and respond in JSON format:
{
  "valid_securities": [list of ISINs that look correct],
  "suspicious_securities": [
    {
      "isin": "XS123...",
      "issue": "description of issue",
      "suggested_value": 123456
    }
  ],
  "total_assessment": "overall assessment of the extraction quality"
}

Focus on:
1. ISINs that don't follow proper format (2 letters + 9 alphanumeric + 1 digit)
2. Values that seem unusually high or low
3. Mathematical consistency with expected total
4. Common patterns in financial documents`;
    }

    buildCrossCheckPrompt(securities, documentText) {
        const topSecurities = securities
            .sort((a, b) => (b.value || 0) - (a.value || 0))
            .slice(0, 10)
            .map(s => `${s.isin}: $${s.value?.toLocaleString() || 'N/A'}`)
            .join('\n');

        const documentSample = documentText.substring(0, 2000);

        return `You are a financial document analyst. Cross-check these extracted securities against the document text:

TOP SECURITIES:
${topSecurities}

DOCUMENT SAMPLE:
${documentSample}

Please verify and respond in JSON format:
{
  "cross_check_results": [
    {
      "isin": "XS123...",
      "confidence": 0.85,
      "found_in_document": true,
      "value_matches": true,
      "notes": "additional observations"
    }
  ],
  "recommendations": [
    "specific suggestions for improvement"
  ]
}

Look for:
1. Whether ISINs actually appear in the document
2. Whether values match what's shown in the document
3. Any missing or duplicated securities
4. Overall extraction quality`;
    }

    buildExplanationPrompt(documentText) {
        const sample = documentText.substring(0, 3000);
        
        return `You are a financial document expert. Analyze this document and explain its structure:

DOCUMENT TEXT:
${sample}

Please respond in JSON format:
{
  "document_type": "portfolio_statement|performance_report|transaction_history",
  "key_sections": [
    {
      "section_name": "Holdings",
      "description": "Main portfolio securities",
      "data_format": "table with ISIN, name, value columns"
    }
  ],
  "total_references": ["where portfolio totals are mentioned"],
  "data_extraction_strategy": "best approach for extracting securities",
  "currency": "primary currency used",
  "date_range": "reporting period if mentioned"
}

Focus on identifying:
1. Document structure and layout
2. Where securities data is located
3. How values are formatted
4. Any special sections or footnotes`;
    }

    async callLLM(prompt, options = {}) {
        const config = this.baseConfigs[this.provider];
        
        if (this.provider === 'openrouter') {
            const response = await axios.post(config.url, {
                model: options.model || 'mistralai/mistral-7b-instruct:free',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: options.temperature || 0.1,
                max_tokens: options.max_tokens || 1000
            }, {
                headers: config.headers,
                timeout: 30000
            });

            return response.data.choices[0].message.content;
        } else if (this.provider === 'huggingface') {
            const modelUrl = config.url + (options.model || 'microsoft/Phi-3-mini-4k-instruct');
            
            const response = await axios.post(modelUrl, {
                inputs: prompt,
                parameters: {
                    temperature: options.temperature || 0.1,
                    max_new_tokens: options.max_tokens || 1000,
                    return_full_text: false
                }
            }, {
                headers: config.headers,
                timeout: 30000
            });

            return response.data[0].generated_text;
        }

        throw new Error(`Unsupported provider: ${this.provider}`);
    }

    parseValidationResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return {
                valid: parsed.valid_securities || [],
                suspicious: parsed.suspicious_securities || [],
                assessment: parsed.total_assessment || 'No assessment provided'
            };
        } catch (error) {
            console.error('Failed to parse validation response:', error);
            return {
                valid: [],
                suspicious: [],
                assessment: 'Could not parse LLM response'
            };
        }
    }

    parseCrossCheckResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return {
                results: parsed.cross_check_results || [],
                recommendations: parsed.recommendations || []
            };
        } catch (error) {
            console.error('Failed to parse cross-check response:', error);
            return {
                results: [],
                recommendations: ['Could not parse LLM response']
            };
        }
    }

    parseExplanationResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return {
                documentType: parsed.document_type || 'unknown',
                sections: parsed.key_sections || [],
                totals: parsed.total_references || [],
                strategy: parsed.data_extraction_strategy || 'Unknown strategy',
                currency: parsed.currency || 'Unknown',
                dateRange: parsed.date_range || 'Unknown'
            };
        } catch (error) {
            console.error('Failed to parse explanation response:', error);
            return {
                documentType: 'unknown',
                sections: [],
                totals: [],
                strategy: 'Could not parse LLM response',
                currency: 'Unknown',
                dateRange: 'Unknown'
            };
        }
    }
}

// Enhanced Multi-Agent System with LLM Integration
class EnhancedFinancialPDFOrchestrator {
    constructor(apiKey, provider = 'openrouter') {
        this.llm = new LLMIntegrator(apiKey, provider);
        
        // Import existing agents
        const { 
            TableStructureAgent, 
            ValueExtractionAgent, 
            ContextAgent, 
            ValidationAgent 
        } = require('./financial-agents-system.js');
        
        this.agents = {
            table: new TableStructureAgent(),
            value: new ValueExtractionAgent(),
            context: new ContextAgent(),
            validation: new ValidationAgent()
        };
    }

    async processDocument(pdfPath) {
        console.log('🚀 Starting Enhanced LLM-Powered Financial Analysis...\n');

        // Read PDF
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(pdfBuffer);
        const text = pdfData.text;

        // Phase 1: LLM Document Understanding
        const documentExplanation = await this.llm.explainDocument(text);
        console.log(`📊 LLM Analysis: ${documentExplanation.documentType}`);
        console.log(`💱 Currency: ${documentExplanation.currency}`);

        // Phase 2: Traditional Agent Analysis
        const contextAnalysis = await this.agents.context.analyze(text);
        const tableAnalysis = await this.agents.table.analyze(text);
        const valueAnalysis = await this.agents.value.analyze(text, {
            expectedTotal: this.findExpectedTotal(text)
        });

        // Phase 3: Extract securities using combined approach
        const securities = await this.extractSecurities(text, {
            llmAnalysis: documentExplanation,
            contextAnalysis,
            tableAnalysis,
            valueAnalysis
        });

        // Phase 4: LLM Validation
        const llmValidation = await this.llm.validateSecurities(securities, {
            expectedTotal: this.findExpectedTotal(text)
        });

        // Phase 5: Cross-check with LLM
        const crossCheck = await this.llm.crossCheckValues(securities, text);

        // Phase 6: Final validation
        const finalValidation = await this.agents.validation.analyze(securities, {
            expectedTotal: this.findExpectedTotal(text)
        });

        // Combine all insights
        const enhancedSecurities = this.enhanceSecurities(securities, {
            llmValidation,
            crossCheck,
            finalValidation
        });

        return {
            securities: enhancedSecurities,
            analysis: {
                documentType: documentExplanation.documentType,
                llmValidation: llmValidation,
                crossCheck: crossCheck,
                traditionalValidation: finalValidation,
                extractionStrategy: documentExplanation.strategy
            },
            metadata: {
                totalSecurities: enhancedSecurities.length,
                expectedTotal: this.findExpectedTotal(text),
                actualTotal: enhancedSecurities.reduce((sum, s) => sum + (s.value || 0), 0),
                confidence: this.calculateOverallConfidence(llmValidation, crossCheck, finalValidation)
            }
        };
    }

    findExpectedTotal(text) {
        const patterns = [
            /Portfolio Total[:\s]*([\d',.]+)/i,
            /Total Assets[:\s]*([\d',.]+)/i,
            /Grand Total[:\s]*([\d',.]+)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return parseFloat(match[1].replace(/[',]/g, ''));
            }
        }
        return null;
    }

    async extractSecurities(text, analyses) {
        // Use the existing extraction logic from the multi-agent system
        const { FinancialPDFOrchestrator } = require('./financial-agents-system.js');
        const orchestrator = new FinancialPDFOrchestrator();
        
        // Extract all ISINs
        const allISINs = this.findAllISINs(text);
        const securities = [];

        for (const isin of allISINs) {
            const security = this.extractSecurityByISIN(text, isin, analyses.valueAnalysis);
            if (security && security.value > 0) {
                securities.push(security);
            }
        }

        return securities;
    }

    findAllISINs(text) {
        const isinPattern = /[A-Z]{2}[A-Z0-9]{9}[0-9]/g;
        const matches = text.matchAll(isinPattern);
        return [...new Set([...matches].map(m => m[0]))];
    }

    extractSecurityByISIN(text, isin, valueAnalysis) {
        const lines = text.split('\n');
        let bestValue = null;
        let bestConfidence = 0;

        lines.forEach((line, index) => {
            if (line.includes(isin)) {
                const contextStart = Math.max(0, index - 3);
                const contextEnd = Math.min(lines.length, index + 5);
                const context = lines.slice(contextStart, contextEnd).join(' ');

                const contextValues = valueAnalysis.values.filter(v => 
                    context.includes(v.raw)
                );

                contextValues.forEach(v => {
                    if (v.confidence > bestConfidence) {
                        bestValue = v;
                        bestConfidence = v.confidence;
                    }
                });
            }
        });

        if (bestValue) {
            return {
                isin: isin,
                value: bestValue.value,
                currency: 'USD',
                confidence: bestConfidence,
                extractionMethod: 'enhanced-llm'
            };
        }

        return null;
    }

    enhanceSecurities(securities, validations) {
        const { llmValidation, crossCheck, finalValidation } = validations;
        
        return securities.map(security => {
            const enhanced = { ...security };
            
            // Add LLM insights
            const llmResult = crossCheck.results.find(r => r.isin === security.isin);
            if (llmResult) {
                enhanced.llmConfidence = llmResult.confidence;
                enhanced.llmNotes = llmResult.notes;
            }

            // Add validation flags
            if (llmValidation.suspicious.some(s => s.isin === security.isin)) {
                enhanced.flagged = true;
                enhanced.flagReason = llmValidation.suspicious.find(s => s.isin === security.isin).issue;
            }

            // Calculate combined confidence
            enhanced.overallConfidence = this.calculateSecurityConfidence(security, validations);

            return enhanced;
        });
    }

    calculateSecurityConfidence(security, validations) {
        let confidence = 0.5; // Base confidence

        // Factor in extraction confidence
        if (security.confidence) {
            confidence += security.confidence * 0.3;
        }

        // Factor in LLM validation
        if (validations.llmValidation.valid.includes(security.isin)) {
            confidence += 0.2;
        }

        // Factor in cross-check results
        const crossCheckResult = validations.crossCheck.results.find(r => r.isin === security.isin);
        if (crossCheckResult) {
            confidence += crossCheckResult.confidence * 0.2;
        }

        // Penalize flagged securities
        if (validations.llmValidation.suspicious.some(s => s.isin === security.isin)) {
            confidence -= 0.3;
        }

        return Math.max(0, Math.min(1, confidence));
    }

    calculateOverallConfidence(llmValidation, crossCheck, finalValidation) {
        const llmScore = llmValidation.valid.length / (llmValidation.valid.length + llmValidation.suspicious.length);
        const crossCheckScore = crossCheck.results.reduce((sum, r) => sum + r.confidence, 0) / crossCheck.results.length;
        const finalScore = finalValidation.score;

        return (llmScore + crossCheckScore + finalScore) / 3;
    }
}

// Example usage with mock API key
async function demonstrateEnhancedSystem() {
    console.log('=== ENHANCED LLM-POWERED FINANCIAL PDF SYSTEM ===\n');
    
    // Note: This would require actual API keys
    const DEMO_MODE = true;
    
    if (DEMO_MODE) {
        console.log('🎬 DEMO MODE - Simulating LLM integration...\n');
        
        // Show what the system would do with real API keys
        const mockResults = {
            securities: [
                { isin: 'XS2530201644', value: 100200, confidence: 0.85 },
                { isin: 'XS2105981117', value: 1600000, confidence: 0.92 },
                { isin: 'XS2252299883', value: 3000000, confidence: 0.45 }
            ],
            analysis: {
                documentType: 'portfolio_statement',
                llmValidation: {
                    valid: ['XS2530201644', 'XS2105981117'],
                    suspicious: [{ isin: 'XS2252299883', issue: 'Unusually high value' }],
                    assessment: 'Good extraction quality with one potential outlier'
                }
            },
            metadata: {
                totalSecurities: 3,
                expectedTotal: 19464431,
                actualTotal: 4700200,
                confidence: 0.78
            }
        };

        console.log('📊 Mock Results:');
        console.log(`Securities: ${mockResults.metadata.totalSecurities}`);
        console.log(`Confidence: ${(mockResults.metadata.confidence * 100).toFixed(1)}%`);
        console.log(`LLM Assessment: ${mockResults.analysis.llmValidation.assessment}`);
        
        return mockResults;
    }

    // Uncomment and provide real API keys to use:
    /*
    const enhancedOrchestrator = new EnhancedFinancialPDFOrchestrator(
        'your-openrouter-api-key',  // or huggingface key
        'openrouter'  // or 'huggingface'
    );
    
    const results = await enhancedOrchestrator.processDocument('2. Messos  - 31.03.2025.pdf');
    
    console.log('\n=== ENHANCED RESULTS ===');
    console.log(`Securities: ${results.metadata.totalSecurities}`);
    console.log(`Confidence: ${(results.metadata.confidence * 100).toFixed(1)}%`);
    console.log(`LLM Assessment: ${results.analysis.llmValidation.assessment}`);
    
    return results;
    */
}

module.exports = {
    LLMIntegrator,
    EnhancedFinancialPDFOrchestrator
};

// Run demo
if (require.main === module) {
    demonstrateEnhancedSystem();
}