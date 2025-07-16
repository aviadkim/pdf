// Multi-Agent Financial PDF Understanding System
// Supports OpenRouter and Hugging Face for flexible API usage

const fs = require('fs');
const pdfParse = require('pdf-parse');

// Configuration for different LLM providers
const LLM_CONFIG = {
    openrouter: {
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        models: {
            free: ['mistralai/mistral-7b-instruct:free', 'gryphe/mythomist-7b:free'],
            cheap: ['openai/gpt-3.5-turbo', 'anthropic/claude-instant-v1'],
            powerful: ['anthropic/claude-2', 'openai/gpt-4']
        }
    },
    huggingface: {
        apiUrl: 'https://api-inference.huggingface.co/models/',
        models: {
            free: ['microsoft/Phi-3-mini-4k-instruct', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
            tableQA: ['google/tapas-large-finetuned-wtq', 'microsoft/tapex-large-finetuned-wtq']
        }
    }
};

// Agent Definitions
class FinancialAgent {
    constructor(name, role, expertise) {
        this.name = name;
        this.role = role;
        this.expertise = expertise;
    }

    async analyze(text, context = {}) {
        // To be overridden by specific agents
        throw new Error('analyze method must be implemented');
    }
}

// 1. Table Structure Agent - Understands complex financial tables
class TableStructureAgent extends FinancialAgent {
    constructor() {
        super('TableExpert', 'Table Structure Analyzer', 
              'Identifying table boundaries, columns, and data relationships');
    }

    async analyze(text, context = {}) {
        console.log(`🏗️ ${this.name}: Analyzing table structure...`);
        
        // Advanced table detection rules
        const tableIndicators = {
            headers: /ISIN|Security|Value|Market|Price|Quantity|Currency|Total/gi,
            separators: /[\|\-\+\=]{3,}|_{3,}/g,
            alignments: /\s{2,}|\t/g,
            totals: /Total|Sum|Subtotal|Grand Total/gi
        };

        const lines = text.split('\n');
        const tables = [];
        let currentTable = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Detect table start
            if (tableIndicators.headers.test(line)) {
                currentTable = {
                    startLine: i,
                    headers: this.parseHeaders(line),
                    rows: []
                };
            }
            
            // Parse table rows
            if (currentTable && i > currentTable.startLine) {
                if (tableIndicators.totals.test(line) || line.trim() === '') {
                    // Table end
                    if (currentTable.rows.length > 0) {
                        tables.push(currentTable);
                    }
                    currentTable = null;
                } else {
                    const row = this.parseTableRow(line, currentTable.headers);
                    if (row) {
                        currentTable.rows.push(row);
                    }
                }
            }
        }

        return {
            tablesFound: tables.length,
            tables: tables,
            recommendation: this.generateTableParsingStrategy(tables)
        };
    }

    parseHeaders(line) {
        // Smart header parsing based on spacing and common patterns
        const segments = line.split(/\s{2,}|\t|[\|]/);
        return segments.map(s => s.trim()).filter(s => s.length > 0);
    }

    parseTableRow(line, headers) {
        // Extract data based on header positions
        const cells = line.split(/\s{2,}|\t|[\|]/);
        if (cells.length < 2) return null;

        const row = {};
        headers.forEach((header, index) => {
            if (cells[index]) {
                row[header] = cells[index].trim();
            }
        });

        return row;
    }

    generateTableParsingStrategy(tables) {
        if (tables.length === 0) {
            return "No clear table structure found. Use contextual extraction.";
        }

        const strategies = [];
        tables.forEach((table, index) => {
            strategies.push({
                tableIndex: index,
                columnMapping: this.detectColumnTypes(table),
                extractionMethod: 'structured-table'
            });
        });

        return strategies;
    }

    detectColumnTypes(table) {
        const columnTypes = {};
        
        table.headers.forEach((header, index) => {
            const headerLower = header.toLowerCase();
            
            if (headerLower.includes('isin')) {
                columnTypes[index] = 'isin';
            } else if (headerLower.includes('value') || headerLower.includes('amount')) {
                columnTypes[index] = 'value';
            } else if (headerLower.includes('name') || headerLower.includes('security')) {
                columnTypes[index] = 'name';
            } else if (headerLower.includes('currency')) {
                columnTypes[index] = 'currency';
            } else if (headerLower.includes('quantity') || headerLower.includes('qty')) {
                columnTypes[index] = 'quantity';
            }
        });

        return columnTypes;
    }
}

// 2. Value Extraction Agent - Specializes in finding and parsing financial values
class ValueExtractionAgent extends FinancialAgent {
    constructor() {
        super('ValueHunter', 'Financial Value Extractor',
              'Extracting and validating monetary values from complex formats');
    }

    async analyze(text, context = {}) {
        console.log(`💰 ${this.name}: Extracting financial values...`);

        const valuePatterns = {
            // Swiss format: 1'234'567.89
            swiss: /(\d{1,3}(?:'\d{3})*(?:\.\d+)?)/g,
            // European format: 1.234.567,89
            european: /(\d{1,3}(?:\.\d{3})*(?:,\d+)?)/g,
            // US format: 1,234,567.89
            us: /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g,
            // Compact: 1.5M, 2.3MM, 500K
            compact: /(\d+(?:\.\d+)?)\s*(M|MM|K|B|T)/gi,
            // With currency: USD 1,234,567
            withCurrency: /(USD|EUR|CHF|GBP)\s*(\d[\d\s',.]*)/gi
        };

        const extractedValues = [];

        // Try each pattern
        for (const [format, pattern] of Object.entries(valuePatterns)) {
            const matches = [...text.matchAll(pattern)];
            
            matches.forEach(match => {
                let value = this.parseValue(match, format);
                
                if (value && this.isReasonableValue(value, context)) {
                    extractedValues.push({
                        raw: match[0],
                        value: value,
                        format: format,
                        confidence: this.calculateConfidence(match, format, context)
                    });
                }
            });
        }

        // Deduplicate and rank by confidence
        const uniqueValues = this.deduplicateValues(extractedValues);
        uniqueValues.sort((a, b) => b.confidence - a.confidence);

        return {
            valuesFound: uniqueValues.length,
            values: uniqueValues,
            recommendation: this.generateValueExtractionStrategy(uniqueValues)
        };
    }

    parseValue(match, format) {
        let valueStr = match[1] || match[2];
        if (!valueStr) return null;

        // Remove formatting based on format type
        switch (format) {
            case 'swiss':
                valueStr = valueStr.replace(/'/g, '');
                break;
            case 'european':
                valueStr = valueStr.replace(/\./g, '').replace(',', '.');
                break;
            case 'us':
                valueStr = valueStr.replace(/,/g, '');
                break;
            case 'compact':
                let value = parseFloat(match[1]);
                const unit = match[2].toUpperCase();
                if (unit === 'K') value *= 1000;
                else if (unit === 'M' || unit === 'MM') value *= 1000000;
                else if (unit === 'B') value *= 1000000000;
                else if (unit === 'T') value *= 1000000000000;
                return value;
            case 'withCurrency':
                valueStr = match[2].replace(/[\s',]/g, '');
                break;
        }

        return parseFloat(valueStr);
    }

    isReasonableValue(value, context) {
        // Context-aware validation
        const min = context.minValue || 100;
        const max = context.maxValue || 100000000; // 100M default max
        
        return value >= min && value <= max && !isNaN(value);
    }

    calculateConfidence(match, format, context) {
        let confidence = 0.5; // Base confidence

        // Higher confidence for values with currency symbols
        if (format === 'withCurrency') confidence += 0.2;

        // Higher confidence for values near expected range
        if (context.expectedTotal) {
            const value = this.parseValue(match, format);
            const ratio = value / context.expectedTotal;
            if (ratio > 0.001 && ratio < 0.5) confidence += 0.2;
        }

        // Lower confidence for very round numbers (might be IDs)
        const valueStr = match[0];
        if (valueStr.endsWith('000000')) confidence -= 0.2;

        return Math.max(0, Math.min(1, confidence));
    }

    deduplicateValues(values) {
        const unique = new Map();
        
        values.forEach(v => {
            const key = v.value.toFixed(2);
            if (!unique.has(key) || unique.get(key).confidence < v.confidence) {
                unique.set(key, v);
            }
        });

        return Array.from(unique.values());
    }

    generateValueExtractionStrategy(values) {
        const formats = {};
        values.forEach(v => {
            formats[v.format] = (formats[v.format] || 0) + 1;
        });

        const dominantFormat = Object.entries(formats)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            dominantFormat: dominantFormat ? dominantFormat[0] : 'mixed',
            recommendation: `Use ${dominantFormat ? dominantFormat[0] : 'multiple'} format parsing`,
            confidenceThreshold: 0.7
        };
    }
}

// 3. Context Understanding Agent - Understands document structure and relationships
class ContextAgent extends FinancialAgent {
    constructor() {
        super('ContextMaster', 'Document Context Analyzer',
              'Understanding document structure, sections, and data relationships');
    }

    async analyze(text, context = {}) {
        console.log(`📚 ${this.name}: Analyzing document context...`);

        const sections = this.identifySections(text);
        const relationships = this.findDataRelationships(text, sections);
        const documentType = this.classifyDocument(text, sections);

        return {
            documentType: documentType,
            sections: sections,
            relationships: relationships,
            recommendation: this.generateContextStrategy(documentType, sections)
        };
    }

    identifySections(text) {
        const sectionMarkers = {
            portfolio: /Portfolio|Holdings|Positions|Securities/i,
            summary: /Summary|Total|Overview|Recap/i,
            derivatives: /Derivatives|Options|Warrants|Structured/i,
            cash: /Cash|Liquidity|Money Market/i,
            performance: /Performance|Returns|Yield/i,
            fees: /Fees|Charges|Expenses|Costs/i
        };

        const sections = [];
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            for (const [type, pattern] of Object.entries(sectionMarkers)) {
                if (pattern.test(line)) {
                    sections.push({
                        type: type,
                        startLine: index,
                        header: line.trim(),
                        endLine: this.findSectionEnd(lines, index)
                    });
                }
            }
        });

        return sections;
    }

    findSectionEnd(lines, startIndex) {
        // Look for next section or document markers
        const endMarkers = /^={3,}|^-{3,}|^Page \d+|Total|Summary/i;
        
        for (let i = startIndex + 1; i < lines.length; i++) {
            if (endMarkers.test(lines[i])) {
                return i;
            }
        }
        
        return lines.length - 1;
    }

    findDataRelationships(text, sections) {
        const relationships = [];

        // Find references between sections
        sections.forEach(section => {
            const sectionText = text.slice(
                text.split('\n').slice(0, section.startLine).join('\n').length,
                text.split('\n').slice(0, section.endLine).join('\n').length
            );

            // Look for cross-references
            const references = sectionText.match(/see\s+(page|section|table)\s+\d+/gi) || [];
            const totals = sectionText.match(/total[:\s]+[\d',.]+/gi) || [];

            relationships.push({
                section: section.type,
                references: references,
                totals: totals
            });
        });

        return relationships;
    }

    classifyDocument(text, sections) {
        const indicators = {
            'portfolio_statement': /portfolio statement|account statement|holdings report/i,
            'performance_report': /performance report|investment returns|yield analysis/i,
            'transaction_history': /transaction history|trades|movements/i,
            'valuation_report': /valuation|market value|asset pricing/i
        };

        for (const [type, pattern] of Object.entries(indicators)) {
            if (pattern.test(text)) {
                return type;
            }
        }

        // Fallback based on sections
        if (sections.some(s => s.type === 'portfolio')) {
            return 'portfolio_statement';
        }

        return 'financial_document';
    }

    generateContextStrategy(documentType, sections) {
        const strategies = {
            'portfolio_statement': {
                primary: 'portfolio',
                validation: 'summary',
                method: 'table-extraction'
            },
            'performance_report': {
                primary: 'performance',
                validation: 'summary',
                method: 'time-series'
            },
            'valuation_report': {
                primary: 'portfolio',
                validation: 'totals',
                method: 'hierarchical'
            }
        };

        return strategies[documentType] || {
            primary: 'full-scan',
            validation: 'cross-reference',
            method: 'adaptive'
        };
    }
}

// 4. Validation Agent - Ensures data accuracy and consistency
class ValidationAgent extends FinancialAgent {
    constructor() {
        super('Validator', 'Data Validation Specialist',
              'Validating extracted data for accuracy and consistency');
    }

    async analyze(extractedData, context = {}) {
        console.log(`✅ ${this.name}: Validating extracted data...`);

        const validationResults = {
            isinValidation: this.validateISINs(extractedData),
            valueValidation: this.validateValues(extractedData, context),
            totalValidation: this.validateTotals(extractedData, context),
            consistencyCheck: this.checkConsistency(extractedData)
        };

        const overallScore = this.calculateValidationScore(validationResults);

        return {
            score: overallScore,
            results: validationResults,
            issues: this.identifyIssues(validationResults),
            recommendation: this.generateValidationStrategy(validationResults)
        };
    }

    validateISINs(data) {
        const results = {
            valid: 0,
            invalid: 0,
            issues: []
        };

        data.forEach(item => {
            if (item.isin) {
                if (this.isValidISIN(item.isin)) {
                    results.valid++;
                } else {
                    results.invalid++;
                    results.issues.push(`Invalid ISIN: ${item.isin}`);
                }
            }
        });

        return results;
    }

    isValidISIN(isin) {
        // ISIN format: 2 letter country code + 9 alphanumeric + 1 check digit
        if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin)) {
            return false;
        }

        // Validate check digit (Luhn algorithm)
        const digits = isin.split('').map(c => {
            const code = c.charCodeAt(0);
            return code >= 65 ? code - 55 : parseInt(c);
        });

        let sum = 0;
        let double = false;

        for (let i = digits.length - 2; i >= 0; i--) {
            let digit = digits[i];
            if (double) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            double = !double;
        }

        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit === parseInt(isin[11]);
    }

    validateValues(data, context) {
        const results = {
            reasonable: 0,
            suspicious: 0,
            issues: []
        };

        const values = data.map(item => item.value).filter(v => v);
        const stats = this.calculateStatistics(values);

        data.forEach(item => {
            if (item.value) {
                // Check for outliers
                if (item.value > stats.mean + 3 * stats.stdDev) {
                    results.suspicious++;
                    results.issues.push(`Outlier value: ${item.isin} = $${item.value.toLocaleString()}`);
                } else if (item.value < 100) {
                    results.suspicious++;
                    results.issues.push(`Too small value: ${item.isin} = $${item.value}`);
                } else {
                    results.reasonable++;
                }
            }
        });

        return results;
    }

    calculateStatistics(values) {
        const n = values.length;
        if (n === 0) return { mean: 0, stdDev: 0 };

        const mean = values.reduce((a, b) => a + b, 0) / n;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);

        return { mean, stdDev, min: Math.min(...values), max: Math.max(...values) };
    }

    validateTotals(data, context) {
        const results = {
            calculatedTotal: 0,
            expectedTotal: context.expectedTotal || 0,
            accuracy: 0
        };

        results.calculatedTotal = data.reduce((sum, item) => sum + (item.value || 0), 0);
        
        if (results.expectedTotal > 0) {
            results.accuracy = Math.min(results.calculatedTotal, results.expectedTotal) / 
                              Math.max(results.calculatedTotal, results.expectedTotal);
        }

        return results;
    }

    checkConsistency(data) {
        const issues = [];

        // Check for duplicate ISINs
        const isinCounts = {};
        data.forEach(item => {
            if (item.isin) {
                isinCounts[item.isin] = (isinCounts[item.isin] || 0) + 1;
            }
        });

        Object.entries(isinCounts).forEach(([isin, count]) => {
            if (count > 1) {
                issues.push(`Duplicate ISIN: ${isin} appears ${count} times`);
            }
        });

        return { issues };
    }

    calculateValidationScore(results) {
        let score = 1.0;

        // Deduct for invalid ISINs
        if (results.isinValidation.invalid > 0) {
            score -= 0.1 * (results.isinValidation.invalid / 
                           (results.isinValidation.valid + results.isinValidation.invalid));
        }

        // Deduct for suspicious values
        if (results.valueValidation.suspicious > 0) {
            score -= 0.2 * (results.valueValidation.suspicious / 
                           (results.valueValidation.reasonable + results.valueValidation.suspicious));
        }

        // Deduct for total mismatch
        if (results.totalValidation.accuracy < 0.9) {
            score -= 0.3 * (1 - results.totalValidation.accuracy);
        }

        // Deduct for consistency issues
        score -= 0.05 * results.consistencyCheck.issues.length;

        return Math.max(0, score);
    }

    identifyIssues(results) {
        const issues = [];

        if (results.isinValidation.invalid > 0) {
            issues.push(...results.isinValidation.issues);
        }

        if (results.valueValidation.suspicious > 0) {
            issues.push(...results.valueValidation.issues);
        }

        if (results.totalValidation.accuracy < 0.9) {
            issues.push(`Total accuracy only ${(results.totalValidation.accuracy * 100).toFixed(2)}%`);
        }

        issues.push(...results.consistencyCheck.issues);

        return issues;
    }

    generateValidationStrategy(results) {
        const strategies = [];

        if (results.isinValidation.invalid > 0) {
            strategies.push('Recheck ISIN extraction patterns');
        }

        if (results.valueValidation.suspicious > 0) {
            strategies.push('Review outlier filtering thresholds');
        }

        if (results.totalValidation.accuracy < 0.9) {
            strategies.push('Search for missing securities');
        }

        return strategies;
    }
}

// Main Multi-Agent Orchestrator
class FinancialPDFOrchestrator {
    constructor(apiConfig = null) {
        this.agents = {
            table: new TableStructureAgent(),
            value: new ValueExtractionAgent(),
            context: new ContextAgent(),
            validation: new ValidationAgent()
        };
        this.apiConfig = apiConfig;
    }

    async processDocument(pdfPath) {
        console.log('🤖 Starting Multi-Agent Financial PDF Analysis...\n');

        // Read PDF
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfData = await pdfParse(pdfBuffer);
        const text = pdfData.text;

        // Phase 1: Context Understanding
        const contextAnalysis = await this.agents.context.analyze(text);
        console.log(`\n📊 Document Type: ${contextAnalysis.documentType}`);
        console.log(`📑 Sections Found: ${contextAnalysis.sections.length}`);

        // Phase 2: Table Structure Analysis
        const tableAnalysis = await this.agents.table.analyze(text);
        console.log(`\n🏗️ Tables Found: ${tableAnalysis.tablesFound}`);

        // Phase 3: Value Extraction with context
        const valueContext = {
            expectedTotal: this.findExpectedTotal(text),
            documentType: contextAnalysis.documentType
        };
        const valueAnalysis = await this.agents.value.analyze(text, valueContext);
        console.log(`\n💰 Values Found: ${valueAnalysis.valuesFound}`);

        // Phase 4: Intelligent Extraction combining all insights
        const securities = await this.intelligentExtraction(
            text,
            contextAnalysis,
            tableAnalysis,
            valueAnalysis
        );

        // Phase 5: Validation
        const validationAnalysis = await this.agents.validation.analyze(
            securities,
            valueContext
        );
        console.log(`\n✅ Validation Score: ${(validationAnalysis.score * 100).toFixed(2)}%`);

        // Final Results
        return {
            securities: securities,
            metadata: {
                documentType: contextAnalysis.documentType,
                tablesFound: tableAnalysis.tablesFound,
                validationScore: validationAnalysis.score,
                issues: validationAnalysis.issues
            },
            agentRecommendations: {
                context: contextAnalysis.recommendation,
                table: tableAnalysis.recommendation,
                value: valueAnalysis.recommendation,
                validation: validationAnalysis.recommendation
            }
        };
    }

    findExpectedTotal(text) {
        const totalPatterns = [
            /Portfolio Total[:\s]*([\d',.]+)/i,
            /Total Assets[:\s]*([\d',.]+)/i,
            /Grand Total[:\s]*([\d',.]+)/i
        ];

        for (const pattern of totalPatterns) {
            const match = text.match(pattern);
            if (match) {
                return parseFloat(match[1].replace(/[',]/g, ''));
            }
        }

        return null;
    }

    async intelligentExtraction(text, contextAnalysis, tableAnalysis, valueAnalysis) {
        const securities = [];
        const processedISINs = new Set();

        // Strategy 1: Extract from identified tables
        if (tableAnalysis.tables.length > 0) {
            for (const table of tableAnalysis.tables) {
                const tableSecurities = this.extractFromTable(table, valueAnalysis);
                tableSecurities.forEach(sec => {
                    if (!processedISINs.has(sec.isin)) {
                        securities.push(sec);
                        processedISINs.add(sec.isin);
                    }
                });
            }
        }

        // Strategy 2: Extract from specific sections
        for (const section of contextAnalysis.sections) {
            if (section.type === 'portfolio' || section.type === 'holdings') {
                const sectionSecurities = this.extractFromSection(
                    text,
                    section,
                    valueAnalysis
                );
                sectionSecurities.forEach(sec => {
                    if (!processedISINs.has(sec.isin)) {
                        securities.push(sec);
                        processedISINs.add(sec.isin);
                    }
                });
            }
        }

        // Strategy 3: Fallback pattern matching
        const allISINs = this.findAllISINs(text);
        for (const isin of allISINs) {
            if (!processedISINs.has(isin)) {
                const security = this.extractSecurityByISIN(text, isin, valueAnalysis);
                if (security && security.value > 0) {
                    securities.push(security);
                    processedISINs.add(isin);
                }
            }
        }

        return securities;
    }

    extractFromTable(table, valueAnalysis) {
        const securities = [];
        const columnMapping = table.recommendation && table.recommendation[0] ? 
            table.recommendation[0].columnMapping : {};

        table.rows.forEach(row => {
            const security = {
                isin: null,
                name: null,
                value: null,
                currency: 'USD'
            };

            Object.entries(columnMapping).forEach(([index, type]) => {
                const cellValue = row[table.headers[index]];
                if (!cellValue) return;

                switch (type) {
                    case 'isin':
                        const isinMatch = cellValue.match(/[A-Z]{2}[A-Z0-9]{9}[0-9]/);
                        if (isinMatch) security.isin = isinMatch[0];
                        break;
                    case 'value':
                        // Use value agent's parsing
                        const values = valueAnalysis.values.filter(v => 
                            cellValue.includes(v.raw)
                        );
                        if (values.length > 0) {
                            security.value = values[0].value;
                        }
                        break;
                    case 'name':
                        security.name = cellValue;
                        break;
                }
            });

            if (security.isin && security.value) {
                securities.push(security);
            }
        });

        return securities;
    }

    extractFromSection(text, section, valueAnalysis) {
        const securities = [];
        const lines = text.split('\n');
        const sectionLines = lines.slice(section.startLine, section.endLine);

        sectionLines.forEach((line, index) => {
            const isinMatch = line.match(/[A-Z]{2}[A-Z0-9]{9}[0-9]/);
            if (isinMatch) {
                const isin = isinMatch[0];
                
                // Look for value in nearby lines
                const context = sectionLines.slice(
                    Math.max(0, index - 2),
                    Math.min(sectionLines.length, index + 5)
                ).join(' ');

                // Find best matching value
                const nearbyValues = valueAnalysis.values.filter(v => 
                    context.includes(v.raw)
                );

                if (nearbyValues.length > 0) {
                    // Take highest confidence value
                    const bestValue = nearbyValues.reduce((best, current) => 
                        current.confidence > best.confidence ? current : best
                    );

                    securities.push({
                        isin: isin,
                        value: bestValue.value,
                        currency: 'USD',
                        extractionMethod: 'section-based'
                    });
                }
            }
        });

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
                // Get context
                const contextStart = Math.max(0, index - 3);
                const contextEnd = Math.min(lines.length, index + 5);
                const context = lines.slice(contextStart, contextEnd).join(' ');

                // Find values in context
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
                extractionMethod: 'pattern-matching'
            };
        }

        return null;
    }
}

// Test the system
async function testMultiAgentSystem() {
    try {
        console.log('=== TESTING MULTI-AGENT FINANCIAL PDF SYSTEM ===\n');

        const orchestrator = new FinancialPDFOrchestrator();
        const results = await orchestrator.processDocument('2. Messos  - 31.03.2025.pdf');

        console.log('\n=== FINAL RESULTS ===');
        console.log(`Securities Found: ${results.securities.length}`);
        
        const total = results.securities.reduce((sum, s) => sum + (s.value || 0), 0);
        console.log(`Total Value: $${total.toLocaleString()}`);
        console.log(`Expected: $19,464,431`);
        
        const accuracy = Math.min(total, 19464431) / Math.max(total, 19464431) * 100;
        console.log(`Accuracy: ${accuracy.toFixed(2)}%`);

        console.log('\n=== VALIDATION ISSUES ===');
        results.metadata.issues.forEach(issue => {
            console.log(`- ${issue}`);
        });

        console.log('\n=== AGENT RECOMMENDATIONS ===');
        Object.entries(results.agentRecommendations).forEach(([agent, rec]) => {
            console.log(`\n${agent.toUpperCase()}:`);
            console.log(JSON.stringify(rec, null, 2));
        });

        // Show all securities
        console.log('\n=== ALL SECURITIES ===');
        results.securities.forEach((s, i) => {
            console.log(`${i+1}. ${s.isin}: $${s.value?.toLocaleString() || 'N/A'} (${s.extractionMethod || 'unknown'})`);
        });

        return results;

    } catch (error) {
        console.error('Error:', error);
    }
}

// Export for use
module.exports = {
    FinancialPDFOrchestrator,
    TableStructureAgent,
    ValueExtractionAgent,
    ContextAgent,
    ValidationAgent,
    LLM_CONFIG
};

// Run if executed directly
if (require.main === module) {
    testMultiAgentSystem();
}