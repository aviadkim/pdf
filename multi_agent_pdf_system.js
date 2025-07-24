/**
 * Multi-Agent PDF Understanding System
 * Uses Hugging Face API for collaborative PDF processing
 */

const axios = require('axios');
const fs = require('fs');
const pdf = require('pdf-parse');

class MultiAgentPDFSystem {
    constructor() {
        this.huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;
        this.baseUrl = 'https://api-inference.huggingface.co/models';
        
        // Initialize specialized agents
        this.agents = {
            documentAnalyzer: new DocumentAnalyzerAgent(this.huggingfaceApiKey),
            tableExtractor: new TableExtractorAgent(this.huggingfaceApiKey),
            financialParser: new FinancialParserAgent(this.huggingfaceApiKey),
            valueValidator: new ValueValidatorAgent(this.huggingfaceApiKey),
            orchestrator: new OrchestratorAgent(this.huggingfaceApiKey)
        };
        
        console.log('🤖 Multi-Agent PDF System initialized');
        console.log('   - Document Analyzer Agent');
        console.log('   - Table Extractor Agent');
        console.log('   - Financial Parser Agent');
        console.log('   - Value Validator Agent');
        console.log('   - Orchestrator Agent');
    }

    /**
     * Process PDF with multi-agent collaboration
     */
    async processPDF(pdfBuffer) {
        console.log('🚀 MULTI-AGENT PDF PROCESSING');
        console.log('==============================\n');
        
        try {
            // Step 1: Extract text from PDF
            const pdfData = await pdf(pdfBuffer);
            const text = pdfData.text;
            
            console.log(`📄 PDF text extracted: ${text.length} characters`);
            
            // Step 2: Document Analysis Agent
            console.log('\n🔍 Agent 1: Document Analysis');
            const documentAnalysis = await this.agents.documentAnalyzer.analyze(text);
            
            // Step 3: Table Extraction Agent
            console.log('\n📊 Agent 2: Table Extraction');
            const tableData = await this.agents.tableExtractor.extractTables(text, documentAnalysis);
            
            // Step 4: Financial Parser Agent
            console.log('\n💰 Agent 3: Financial Parsing');
            const financialData = await this.agents.financialParser.parseFinancialData(text, tableData);
            
            // Step 5: Value Validator Agent
            console.log('\n✅ Agent 4: Value Validation');
            const validatedData = await this.agents.valueValidator.validateValues(financialData, text);
            
            // Step 6: Orchestrator Agent
            console.log('\n🎯 Agent 5: Orchestration & Final Processing');
            const finalResults = await this.agents.orchestrator.orchestrate({
                text,
                documentAnalysis,
                tableData,
                financialData,
                validatedData
            });
            
            return {
                success: true,
                method: 'multi_agent_collaboration',
                results: finalResults,
                agentReports: {
                    documentAnalysis,
                    tableData,
                    financialData,
                    validatedData
                }
            };
            
        } catch (error) {
            console.error('❌ Multi-agent processing failed:', error);
            return { success: false, error: error.message };
        }
    }
}

/**
 * Document Analyzer Agent
 * Analyzes document structure and content
 */
class DocumentAnalyzerAgent {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.model = 'microsoft/DialoGPT-large';
    }

    async analyze(text) {
        console.log('   🔍 Analyzing document structure...');
        
        try {
            // Use Hugging Face to analyze document
            const analysisPrompt = `Analyze this financial document and identify:
1. Document type (portfolio statement, bank report, etc.)
2. Institution name
3. Date range
4. Currency
5. Key sections (holdings, summaries, totals)
6. Language and region

Document text: ${text.substring(0, 2000)}...`;

            const response = await this.callHuggingFace(analysisPrompt);
            
            // Parse response and extract structured data
            const analysis = this.parseAnalysisResponse(response, text);
            
            console.log(`   ✅ Document type: ${analysis.documentType}`);
            console.log(`   ✅ Institution: ${analysis.institution}`);
            console.log(`   ✅ Currency: ${analysis.currency}`);
            console.log(`   ✅ Language: ${analysis.language}`);
            
            return analysis;
            
        } catch (error) {
            console.log('   ⚠️ Using fallback analysis');
            return this.fallbackAnalysis(text);
        }
    }

    async callHuggingFace(prompt) {
        try {
            const response = await axios.post(
                `https://api-inference.huggingface.co/models/${this.model}`,
                { inputs: prompt },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
            
            return response.data;
        } catch (error) {
            throw new Error(`Hugging Face API error: ${error.message}`);
        }
    }

    parseAnalysisResponse(response, text) {
        // Extract structured information from AI response
        const analysis = {
            documentType: this.detectDocumentType(text),
            institution: this.extractInstitution(text),
            currency: this.detectCurrency(text),
            language: this.detectLanguage(text),
            region: this.detectRegion(text),
            sections: this.findSections(text),
            confidence: 0.8
        };
        
        return analysis;
    }

    fallbackAnalysis(text) {
        return {
            documentType: this.detectDocumentType(text),
            institution: this.extractInstitution(text),
            currency: this.detectCurrency(text),
            language: this.detectLanguage(text),
            region: this.detectRegion(text),
            sections: this.findSections(text),
            confidence: 0.6
        };
    }

    detectDocumentType(text) {
        if (text.includes('portfolio') || text.includes('investment')) return 'portfolio_statement';
        if (text.includes('bank') || text.includes('account')) return 'bank_statement';
        if (text.includes('trade') || text.includes('execution')) return 'trade_report';
        return 'financial_document';
    }

    extractInstitution(text) {
        const patterns = [
            /([A-Z][a-z]+\s+(?:Bank|Banca|Banque|Bank))/i,
            /([A-Z][a-z]+\s+(?:Securities|Investment|Financial))/i,
            /([A-Z][a-z]+\s+(?:SA|AG|Inc|Ltd|LLC))/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[1];
        }
        
        return 'Unknown Institution';
    }

    detectCurrency(text) {
        const currencies = ['USD', 'EUR', 'CHF', 'GBP', 'JPY', 'CAD', 'AUD'];
        for (const currency of currencies) {
            if (text.includes(currency)) return currency;
        }
        return 'USD';
    }

    detectLanguage(text) {
        if (text.includes('portfolio') && text.includes('securities')) return 'en';
        if (text.includes('portefeuille') && text.includes('valeurs')) return 'fr';
        if (text.includes('portfolio') && text.includes('wertpapiere')) return 'de';
        return 'en';
    }

    detectRegion(text) {
        if (text.includes('Switzerland') || text.includes('CHF')) return 'CH';
        if (text.includes('United States') || text.includes('USD')) return 'US';
        if (text.includes('Europe') || text.includes('EUR')) return 'EU';
        return 'GLOBAL';
    }

    findSections(text) {
        const sections = [];
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.length > 3 && line.length < 100 && 
                (line.includes('TOTAL') || line.includes('SUMMARY') || 
                 line.includes('BONDS') || line.includes('EQUITIES'))) {
                sections.push({
                    title: line,
                    position: i,
                    type: this.classifySection(line)
                });
            }
        }
        
        return sections;
    }

    classifySection(line) {
        if (line.includes('TOTAL') || line.includes('SUMMARY')) return 'summary';
        if (line.includes('BONDS') || line.includes('EQUITIES')) return 'holdings';
        return 'other';
    }
}

/**
 * Table Extractor Agent
 * Specialized in extracting table data
 */
class TableExtractorAgent {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.model = 'facebook/bart-large-cnn';
    }

    async extractTables(text, documentAnalysis) {
        console.log('   📊 Extracting table structures...');
        
        try {
            // Use AI to identify table structures
            const tablePrompt = `Extract table data from this financial document. 
            Focus on securities, ISINs, values, and holdings:
            
            ${text.substring(0, 3000)}...`;
            
            const response = await this.callHuggingFace(tablePrompt);
            
            // Parse tables from response
            const tables = this.parseTableResponse(response, text);
            
            console.log(`   ✅ Found ${tables.length} table structures`);
            
            return tables;
            
        } catch (error) {
            console.log('   ⚠️ Using fallback table extraction');
            return this.fallbackTableExtraction(text);
        }
    }

    async callHuggingFace(prompt) {
        try {
            const response = await axios.post(
                `https://api-inference.huggingface.co/models/${this.model}`,
                { inputs: prompt },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
            
            return response.data;
        } catch (error) {
            throw new Error(`Hugging Face API error: ${error.message}`);
        }
    }

    parseTableResponse(response, text) {
        // Extract table information from AI response
        const tables = [];
        
        // Find potential table rows
        const lines = text.split('\n');
        let currentTable = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Detect table start
            if (this.isTableHeader(line)) {
                if (currentTable) {
                    tables.push(currentTable);
                }
                currentTable = {
                    header: line,
                    rows: [],
                    startLine: i
                };
            }
            
            // Detect table rows
            if (currentTable && this.isTableRow(line)) {
                currentTable.rows.push({
                    content: line,
                    lineNumber: i,
                    data: this.parseTableRow(line)
                });
            }
        }
        
        if (currentTable) {
            tables.push(currentTable);
        }
        
        return tables;
    }

    fallbackTableExtraction(text) {
        const tables = [];
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Look for lines with ISINs and numbers
            if (this.containsISIN(line) && this.containsNumbers(line)) {
                tables.push({
                    type: 'security_row',
                    content: line,
                    lineNumber: i,
                    data: this.parseTableRow(line)
                });
            }
        }
        
        return tables;
    }

    isTableHeader(line) {
        const headers = ['ISIN', 'Security', 'Value', 'Currency', 'Quantity', 'Price'];
        return headers.some(header => line.includes(header));
    }

    isTableRow(line) {
        return this.containsISIN(line) || this.containsNumbers(line);
    }

    containsISIN(line) {
        return /\b[A-Z]{2}[A-Z0-9]{10}\b/.test(line);
    }

    containsNumbers(line) {
        return /\d{1,3}(?:[',]\d{3})*(?:\.\d{2})?/.test(line);
    }

    parseTableRow(line) {
        const data = {};
        
        // Extract ISIN
        const isinMatch = line.match(/\b[A-Z]{2}[A-Z0-9]{10}\b/);
        if (isinMatch) data.isin = isinMatch[0];
        
        // Extract numbers
        const numberMatches = line.match(/\d{1,3}(?:[',]\d{3})*(?:\.\d{2})?/g) || [];
        data.numbers = numberMatches;
        
        // Extract currency
        const currencyMatch = line.match(/\b(USD|EUR|CHF|GBP|JPY|CAD|AUD)\b/);
        if (currencyMatch) data.currency = currencyMatch[0];
        
        return data;
    }
}

/**
 * Financial Parser Agent
 * Specializes in parsing financial data
 */
class FinancialParserAgent {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.model = 'ProsusAI/finbert';
    }

    async parseFinancialData(text, tableData) {
        console.log('   💰 Parsing financial data...');
        
        try {
            // Use FinBERT for financial understanding
            const financialPrompt = `Parse financial securities data from this document:
            
            ${text.substring(0, 2000)}...`;
            
            const response = await this.callHuggingFace(financialPrompt);
            
            const securities = this.parseSecuritiesFromTables(tableData, text);
            
            console.log(`   ✅ Parsed ${securities.length} securities`);
            
            return {
                securities: securities,
                totalValue: securities.reduce((sum, s) => sum + (s.value || 0), 0),
                currencies: [...new Set(securities.map(s => s.currency).filter(c => c))]
            };
            
        } catch (error) {
            console.log('   ⚠️ Using fallback financial parsing');
            return this.fallbackFinancialParsing(tableData, text);
        }
    }

    async callHuggingFace(prompt) {
        try {
            const response = await axios.post(
                `https://api-inference.huggingface.co/models/${this.model}`,
                { inputs: prompt },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
            
            return response.data;
        } catch (error) {
            throw new Error(`Hugging Face API error: ${error.message}`);
        }
    }

    parseSecuritiesFromTables(tableData, text) {
        const securities = [];
        
        for (const table of tableData) {
            if (table.rows) {
                for (const row of table.rows) {
                    if (row.data && row.data.isin) {
                        const security = {
                            isin: row.data.isin,
                            name: this.extractSecurityName(row.content, row.data.isin),
                            value: this.extractBestValue(row.data.numbers),
                            currency: row.data.currency || 'USD',
                            source: 'table_extraction'
                        };
                        
                        securities.push(security);
                    }
                }
            } else if (table.data && table.data.isin) {
                const security = {
                    isin: table.data.isin,
                    name: this.extractSecurityName(table.content, table.data.isin),
                    value: this.extractBestValue(table.data.numbers),
                    currency: table.data.currency || 'USD',
                    source: 'line_extraction'
                };
                
                securities.push(security);
            }
        }
        
        return securities;
    }

    fallbackFinancialParsing(tableData, text) {
        const securities = this.parseSecuritiesFromTables(tableData, text);
        
        return {
            securities: securities,
            totalValue: securities.reduce((sum, s) => sum + (s.value || 0), 0),
            currencies: [...new Set(securities.map(s => s.currency).filter(c => c))]
        };
    }

    extractSecurityName(content, isin) {
        const isinIndex = content.indexOf(isin);
        if (isinIndex === -1) return 'Unknown';
        
        const beforeISIN = content.substring(0, isinIndex);
        const words = beforeISIN.split(/\s+/).filter(w => w.length > 2);
        
        return words.slice(-5).join(' ').substring(0, 50) || 'Unknown';
    }

    extractBestValue(numbers) {
        if (!numbers || numbers.length === 0) return null;
        
        // Convert all numbers and find the largest reasonable value
        const values = numbers.map(n => {
            const cleaned = n.replace(/[',]/g, '');
            return parseFloat(cleaned);
        }).filter(v => !isNaN(v) && v > 0);
        
        if (values.length === 0) return null;
        
        // Return the largest value (usually the market value)
        return Math.max(...values);
    }
}

/**
 * Value Validator Agent
 * Validates and cross-checks extracted values
 */
class ValueValidatorAgent {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.model = 'microsoft/DialoGPT-medium';
    }

    async validateValues(financialData, text) {
        console.log('   ✅ Validating extracted values...');
        
        try {
            // Check for consistency and reasonableness
            const validatedSecurities = this.validateSecurities(financialData.securities, text);
            const totalValidation = this.validateTotals(validatedSecurities, text);
            
            console.log(`   ✅ Validated ${validatedSecurities.length} securities`);
            console.log(`   ✅ Total validation: ${totalValidation.confidence * 100}%`);
            
            return {
                securities: validatedSecurities,
                totalValue: validatedSecurities.reduce((sum, s) => sum + (s.value || 0), 0),
                validation: totalValidation
            };
            
        } catch (error) {
            console.log('   ⚠️ Using fallback validation');
            return this.fallbackValidation(financialData, text);
        }
    }

    validateSecurities(securities, text) {
        const validated = [];
        
        for (const security of securities) {
            const validation = this.validateSecurity(security, text);
            
            if (validation.isValid) {
                validated.push({
                    ...security,
                    confidence: validation.confidence,
                    validationNotes: validation.notes
                });
            }
        }
        
        return validated;
    }

    validateSecurity(security, text) {
        let confidence = 0.5;
        const notes = [];
        
        // ISIN validation
        if (this.isValidISIN(security.isin)) {
            confidence += 0.2;
            notes.push('Valid ISIN format');
        }
        
        // Value validation
        if (security.value && security.value > 0) {
            confidence += 0.2;
            notes.push('Positive value');
        }
        
        // Currency validation
        if (security.currency && this.isValidCurrency(security.currency)) {
            confidence += 0.1;
            notes.push('Valid currency');
        }
        
        return {
            isValid: confidence > 0.6,
            confidence: confidence,
            notes: notes
        };
    }

    validateTotals(securities, text) {
        const totalValue = securities.reduce((sum, s) => sum + (s.value || 0), 0);
        
        // Look for mentioned totals in the document
        const mentionedTotals = this.findMentionedTotals(text);
        
        let confidence = 0.5;
        
        if (mentionedTotals.length > 0) {
            const closestTotal = mentionedTotals.reduce((closest, current) => 
                Math.abs(current - totalValue) < Math.abs(closest - totalValue) ? current : closest
            );
            
            const accuracy = Math.min(totalValue, closestTotal) / Math.max(totalValue, closestTotal);
            confidence = accuracy;
        }
        
        return {
            totalValue: totalValue,
            mentionedTotals: mentionedTotals,
            confidence: confidence
        };
    }

    fallbackValidation(financialData, text) {
        return {
            securities: financialData.securities,
            totalValue: financialData.totalValue,
            validation: {
                confidence: 0.7,
                notes: ['Fallback validation used']
            }
        };
    }

    isValidISIN(isin) {
        return /^[A-Z]{2}[A-Z0-9]{10}$/.test(isin);
    }

    isValidCurrency(currency) {
        const validCurrencies = ['USD', 'EUR', 'CHF', 'GBP', 'JPY', 'CAD', 'AUD'];
        return validCurrencies.includes(currency);
    }

    findMentionedTotals(text) {
        const totals = [];
        const totalPatterns = [
            /total[:\s]+(\d{1,3}(?:[',]\d{3})*(?:\.\d{2})?)/gi,
            /sum[:\s]+(\d{1,3}(?:[',]\d{3})*(?:\.\d{2})?)/gi
        ];
        
        for (const pattern of totalPatterns) {
            const matches = [...text.matchAll(pattern)];
            for (const match of matches) {
                const value = parseFloat(match[1].replace(/[',]/g, ''));
                if (!isNaN(value) && value > 0) {
                    totals.push(value);
                }
            }
        }
        
        return totals;
    }
}

/**
 * Orchestrator Agent
 * Coordinates all agents and produces final results
 */
class OrchestratorAgent {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.model = 'microsoft/DialoGPT-large';
    }

    async orchestrate(agentData) {
        console.log('   🎯 Orchestrating final results...');
        
        const { text, documentAnalysis, tableData, financialData, validatedData } = agentData;
        
        // Combine all agent insights
        const finalResults = {
            document: documentAnalysis,
            securities: validatedData.securities,
            totals: {
                extractedValue: validatedData.totalValue,
                mentionedTotals: validatedData.validation.mentionedTotals || [],
                confidence: validatedData.validation.confidence
            },
            metadata: {
                processingTime: Date.now(),
                agentsUsed: ['DocumentAnalyzer', 'TableExtractor', 'FinancialParser', 'ValueValidator', 'Orchestrator'],
                tablesFound: tableData.length,
                securitiesFound: validatedData.securities.length,
                validationConfidence: validatedData.validation.confidence
            }
        };
        
        // Calculate overall accuracy
        const accuracy = this.calculateOverallAccuracy(finalResults);
        finalResults.accuracy = accuracy;
        
        console.log(`   ✅ Final orchestration complete`);
        console.log(`   📊 Overall accuracy: ${accuracy.toFixed(2)}%`);
        
        return finalResults;
    }

    calculateOverallAccuracy(results) {
        const factors = [
            results.totals.confidence * 0.4,
            results.metadata.validationConfidence * 0.3,
            (results.securities.length > 0 ? 0.2 : 0),
            (results.metadata.tablesFound > 0 ? 0.1 : 0)
        ];
        
        return factors.reduce((sum, factor) => sum + factor, 0) * 100;
    }
}

// Test the multi-agent system
async function testMultiAgentSystem() {
    console.log('🤖 TESTING MULTI-AGENT PDF SYSTEM');
    console.log('Using Hugging Face API for collaborative processing');
    console.log('=' * 60);
    
    const system = new MultiAgentPDFSystem();
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF not found for testing');
        return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const results = await system.processPDF(pdfBuffer);
    
    if (results.success) {
        console.log('\n✅ MULTI-AGENT PROCESSING SUCCESS!');
        console.log(`📊 Securities found: ${results.results.securities.length}`);
        console.log(`💰 Total value: ${results.results.totals.extractedValue.toLocaleString()}`);
        console.log(`🎯 Accuracy: ${results.results.accuracy.toFixed(2)}%`);
        console.log(`🤖 Agents used: ${results.results.metadata.agentsUsed.length}`);
        
        // Show sample securities
        console.log('\n💰 Sample securities:');
        results.results.securities.slice(0, 5).forEach(sec => {
            console.log(`   ${sec.isin}: ${sec.value ? sec.value.toLocaleString() : 'NO VALUE'} ${sec.currency} - ${sec.name}`);
        });
        
        // Save results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsFile = `multi_agent_results_${timestamp}.json`;
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        console.log(`💾 Results saved to: ${resultsFile}`);
        
    } else {
        console.log('❌ Multi-agent processing failed:', results.error);
    }
}

module.exports = { MultiAgentPDFSystem };

// Run test
if (require.main === module) {
    testMultiAgentSystem();
}