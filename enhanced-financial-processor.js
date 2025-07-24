/**
 * ENHANCED FINANCIAL PROCESSOR
 * 
 * Complete financial document processing system that integrates:
 * - Universal Financial Parser
 * - Document Type Detection
 * - Specialized Parsers
 * - Learning System
 * - Annotation Feedback Loop
 */

const { UniversalFinancialParser } = require('./universal-financial-parser');
const { DocumentTypeDetector } = require('./document-type-detector');
const { LearningSystem } = require('./learning-system');
const { processWithErrorHandling } = require('./robust-pdf-processor');

class EnhancedFinancialProcessor {
    constructor() {
        this.universalParser = new UniversalFinancialParser();
        this.documentDetector = new DocumentTypeDetector();
        this.learningSystem = new LearningSystem();
        this.processingHistory = [];
    }

    async processFinancialDocument(filePath, options = {}) {
        const startTime = Date.now();
        console.log('🚀 Starting enhanced financial document processing...');
        console.log(`📄 File: ${filePath}`);
        
        try {
            // Step 1: Extract text from PDF
            console.log('\n1️⃣ Extracting text from PDF...');
            const extractionResult = await processWithErrorHandling(filePath, {
                maxPages: options.maxPages || 50,
                timeout: options.timeout || 60000,
                fallbackToImages: true
            });
            
            if (!extractionResult.success) {
                throw new Error(`PDF extraction failed: ${extractionResult.error}`);
            }
            
            console.log(`✅ Text extracted: ${extractionResult.text.length} characters`);
            console.log(`⏱️  Extraction time: ${extractionResult.processingTime}ms`);
            
            // Step 2: Detect document type
            console.log('\n2️⃣ Detecting document type...');
            const detectionResult = this.documentDetector.detectDocumentType(extractionResult.text);
            
            // Step 3: Apply learned patterns
            console.log('\n3️⃣ Applying learned patterns...');
            const learnedPatterns = await this.learningSystem.getLearnedPatterns(detectionResult.type);
            
            // Step 4: Parse financial data
            console.log('\n4️⃣ Parsing financial data...');
            const parsingOptions = {
                ...options,
                startTime,
                documentType: detectionResult.type,
                learnedPatterns: learnedPatterns
            };
            
            const parsingResult = await this.universalParser.parseDocument(
                extractionResult.text, 
                parsingOptions
            );
            
            if (!parsingResult.success) {
                throw new Error(`Financial parsing failed: ${parsingResult.error}`);
            }
            
            // Step 5: Generate comprehensive result
            const result = {
                success: true,
                processingTime: Date.now() - startTime,
                fileInfo: {
                    path: filePath,
                    size: extractionResult.fileSize,
                    pages: extractionResult.pages
                },
                extraction: {
                    method: extractionResult.method,
                    textLength: extractionResult.text.length,
                    processingTime: extractionResult.processingTime
                },
                detection: {
                    documentType: detectionResult.type,
                    confidence: detectionResult.confidence,
                    alternatives: detectionResult.alternatives
                },
                financialData: parsingResult.extractedData,
                analysis: {
                    confidence: parsingResult.confidence,
                    suggestions: parsingResult.suggestions,
                    detectionSuggestions: this.documentDetector.getDetectionSuggestions(
                        extractionResult.text, 
                        detectionResult
                    )
                },
                learning: {
                    patternsApplied: Object.keys(learnedPatterns).length,
                    improvementOpportunities: this.identifyImprovementOpportunities(parsingResult)
                },
                metadata: {
                    timestamp: new Date().toISOString(),
                    version: '1.0.0',
                    processor: 'enhanced-financial-processor'
                }
            };
            
            // Step 6: Store processing history
            await this.storeProcessingHistory(result);
            
            console.log('\n🎉 Enhanced financial processing completed!');
            console.log(`📊 Overall confidence: ${result.analysis.confidence}%`);
            console.log(`🔍 Document type: ${result.detection.documentType} (${(result.detection.confidence * 100).toFixed(1)}% confidence)`);
            console.log(`💰 Securities found: ${result.financialData.securities.length}`);
            console.log(`⏱️  Total processing time: ${result.processingTime}ms`);
            
            return result;
            
        } catch (error) {
            console.error('❌ Enhanced financial processing failed:', error.message);
            
            return {
                success: false,
                error: error.message,
                processingTime: Date.now() - startTime,
                fileInfo: { path: filePath },
                timestamp: new Date().toISOString()
            };
        }
    }

    async processAnnotation(annotationData) {
        console.log('📝 Processing user annotation...');
        
        try {
            // Process the annotation through the learning system
            const learningResult = await this.learningSystem.processAnnotation(annotationData);
            
            if (learningResult.success) {
                console.log(`✅ Annotation processed: ${learningResult.improvements} improvements generated`);
                
                // Update document detector if needed
                if (annotationData.type === 'document_type_correction') {
                    this.documentDetector.addLearningData(
                        annotationData.documentType,
                        annotationData.originalText,
                        annotationData.correctedData
                    );
                }
                
                return {
                    success: true,
                    annotationId: learningResult.annotationId,
                    improvements: learningResult.improvements,
                    message: 'Annotation processed successfully. The system will use this feedback to improve future extractions.'
                };
            } else {
                throw new Error(learningResult.error);
            }
            
        } catch (error) {
            console.error('❌ Annotation processing failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async validateExtraction(originalResult, userValidation) {
        console.log('✅ Processing extraction validation...');
        
        try {
            // Compare original extraction with user validation
            const validationData = this.generateValidationData(originalResult, userValidation);
            
            // Process as annotation for learning
            const annotationResult = await this.processAnnotation({
                type: 'validation',
                documentType: originalResult.detection.documentType,
                originalText: originalResult.extraction.text,
                correctedData: validationData.corrections,
                confidence: userValidation.confidence || 1.0,
                userFeedback: userValidation.feedback
            });
            
            return {
                success: true,
                validationProcessed: true,
                corrections: validationData.corrections.length,
                learningResult: annotationResult
            };
            
        } catch (error) {
            console.error('❌ Validation processing failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    generateValidationData(originalResult, userValidation) {
        const corrections = [];
        
        // Compare securities data
        if (userValidation.securities) {
            userValidation.securities.forEach((userSecurity, index) => {
                const originalSecurity = originalResult.financialData.securities[index];
                if (originalSecurity) {
                    // Check for corrections in security data
                    if (userSecurity.name !== originalSecurity.name) {
                        corrections.push({
                            type: 'security_name_correction',
                            original: originalSecurity.name,
                            corrected: userSecurity.name,
                            isin: originalSecurity.isin
                        });
                    }
                    
                    if (userSecurity.value !== originalSecurity.value) {
                        corrections.push({
                            type: 'value_correction',
                            original: originalSecurity.value,
                            corrected: userSecurity.value,
                            isin: originalSecurity.isin
                        });
                    }
                }
            });
        }
        
        // Compare portfolio data
        if (userValidation.portfolio) {
            if (userValidation.portfolio.totalValue !== originalResult.financialData.portfolio.totalValue) {
                corrections.push({
                    type: 'portfolio_total_correction',
                    original: originalResult.financialData.portfolio.totalValue,
                    corrected: userValidation.portfolio.totalValue
                });
            }
        }
        
        // Compare performance data
        if (userValidation.performance) {
            Object.keys(userValidation.performance).forEach(key => {
                if (userValidation.performance[key] !== originalResult.financialData.performance[key]) {
                    corrections.push({
                        type: 'performance_correction',
                        field: key,
                        original: originalResult.financialData.performance[key],
                        corrected: userValidation.performance[key]
                    });
                }
            });
        }
        
        return { corrections };
    }

    identifyImprovementOpportunities(parsingResult) {
        const opportunities = [];
        
        // Check for missing security names
        const securitiesWithoutNames = parsingResult.extractedData.securities.filter(s => !s.name).length;
        if (securitiesWithoutNames > 0) {
            opportunities.push({
                type: 'missing_security_names',
                count: securitiesWithoutNames,
                priority: 'high',
                suggestion: 'Use annotation tools to mark security names for improved extraction'
            });
        }
        
        // Check for missing values
        const securitiesWithoutValues = parsingResult.extractedData.securities.filter(s => !s.value).length;
        if (securitiesWithoutValues > 0) {
            opportunities.push({
                type: 'missing_security_values',
                count: securitiesWithoutValues,
                priority: 'high',
                suggestion: 'Mark security values in the document to improve parsing accuracy'
            });
        }
        
        // Check for low confidence
        if (parsingResult.confidence < 80) {
            opportunities.push({
                type: 'low_confidence',
                confidence: parsingResult.confidence,
                priority: 'medium',
                suggestion: 'Consider manual validation and annotation to improve accuracy'
            });
        }
        
        return opportunities;
    }

    async storeProcessingHistory(result) {
        this.processingHistory.push({
            timestamp: result.metadata.timestamp,
            documentType: result.detection.documentType,
            confidence: result.analysis.confidence,
            securitiesCount: result.financialData.securities.length,
            processingTime: result.processingTime
        });
        
        // Keep only the last 100 processing records
        if (this.processingHistory.length > 100) {
            this.processingHistory = this.processingHistory.slice(-100);
        }
    }

    async getProcessingStats() {
        const stats = {
            totalProcessed: this.processingHistory.length,
            averageConfidence: 0,
            averageProcessingTime: 0,
            documentTypes: {},
            recentActivity: this.processingHistory.slice(-10)
        };
        
        if (this.processingHistory.length > 0) {
            const totalConfidence = this.processingHistory.reduce((sum, record) => sum + record.confidence, 0);
            const totalTime = this.processingHistory.reduce((sum, record) => sum + record.processingTime, 0);
            
            stats.averageConfidence = totalConfidence / this.processingHistory.length;
            stats.averageProcessingTime = totalTime / this.processingHistory.length;
            
            // Count document types
            this.processingHistory.forEach(record => {
                stats.documentTypes[record.documentType] = 
                    (stats.documentTypes[record.documentType] || 0) + 1;
            });
        }
        
        // Get learning system stats
        const learningStats = await this.learningSystem.getLearningStats();
        stats.learning = learningStats;
        
        return stats;
    }

    async generateProcessingReport(result) {
        const report = {
            summary: {
                success: result.success,
                documentType: result.detection?.documentType,
                confidence: result.analysis?.confidence,
                processingTime: result.processingTime
            },
            extraction: {
                method: result.extraction?.method,
                textLength: result.extraction?.textLength,
                pages: result.fileInfo?.pages
            },
            financialData: {
                securitiesFound: result.financialData?.securities?.length || 0,
                portfolioValue: result.financialData?.portfolio?.totalValue,
                allocations: Object.keys(result.financialData?.portfolio?.allocations || {}).length,
                performance: Object.keys(result.financialData?.performance || {}).length
            },
            quality: {
                securitiesWithNames: result.financialData?.securities?.filter(s => s.name).length || 0,
                securitiesWithValues: result.financialData?.securities?.filter(s => s.value).length || 0,
                completenessScore: this.calculateCompletenessScore(result.financialData)
            },
            suggestions: result.analysis?.suggestions || [],
            improvementOpportunities: result.learning?.improvementOpportunities || []
        };
        
        return report;
    }

    calculateCompletenessScore(financialData) {
        if (!financialData || !financialData.securities) return 0;
        
        let score = 0;
        let maxScore = 0;
        
        // Portfolio data completeness
        if (financialData.portfolio?.totalValue) score += 20;
        if (financialData.portfolio?.valuationDate) score += 10;
        if (Object.keys(financialData.portfolio?.allocations || {}).length > 0) score += 20;
        maxScore += 50;
        
        // Securities completeness
        const securities = financialData.securities;
        if (securities.length > 0) {
            const withNames = securities.filter(s => s.name).length;
            const withValues = securities.filter(s => s.value).length;
            const withTypes = securities.filter(s => s.type).length;
            
            score += (withNames / securities.length) * 20;
            score += (withValues / securities.length) * 20;
            score += (withTypes / securities.length) * 10;
        }
        maxScore += 50;
        
        return Math.round((score / maxScore) * 100);
    }
}

module.exports = { EnhancedFinancialProcessor };
