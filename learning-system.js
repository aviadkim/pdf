/**
 * LEARNING SYSTEM FOUNDATION
 * 
 * Annotation-driven improvement system for continuous parser enhancement
 * Implements feedback loops to improve OCR accuracy and financial data extraction
 */

const fs = require('fs').promises;
const path = require('path');

class LearningSystem {
    constructor() {
        this.learningDataPath = path.join(__dirname, 'learning-data');
        this.annotationsPath = path.join(this.learningDataPath, 'annotations');
        this.modelsPath = path.join(this.learningDataPath, 'models');
        this.feedbackPath = path.join(this.learningDataPath, 'feedback');
        
        this.initializeLearningSystem();
    }

    async initializeLearningSystem() {
        try {
            // Create learning data directories
            await fs.mkdir(this.learningDataPath, { recursive: true });
            await fs.mkdir(this.annotationsPath, { recursive: true });
            await fs.mkdir(this.modelsPath, { recursive: true });
            await fs.mkdir(this.feedbackPath, { recursive: true });
            
            console.log('📚 Learning system initialized');
        } catch (error) {
            console.error('❌ Learning system initialization failed:', error.message);
        }
    }

    async processAnnotation(annotationData) {
        try {
            console.log('📝 Processing user annotation for learning...');
            
            const annotation = {
                id: this.generateAnnotationId(),
                timestamp: new Date().toISOString(),
                documentType: annotationData.documentType,
                originalText: annotationData.originalText,
                correctedData: annotationData.correctedData,
                annotationType: annotationData.type, // 'correction', 'validation', 'enhancement'
                confidence: annotationData.confidence || 1.0,
                userFeedback: annotationData.userFeedback,
                extractionContext: annotationData.context
            };
            
            // Store annotation
            await this.storeAnnotation(annotation);
            
            // Process for immediate improvements
            const improvements = await this.generateImprovements(annotation);
            
            // Update extraction patterns
            await this.updateExtractionPatterns(improvements);
            
            // Generate training data
            await this.generateTrainingData(annotation);
            
            console.log(`✅ Annotation processed and learning data updated`);
            
            return {
                success: true,
                annotationId: annotation.id,
                improvements: improvements.length,
                trainingDataGenerated: true
            };
            
        } catch (error) {
            console.error('❌ Annotation processing failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    async storeAnnotation(annotation) {
        const filename = `annotation-${annotation.id}.json`;
        const filepath = path.join(this.annotationsPath, filename);
        
        await fs.writeFile(filepath, JSON.stringify(annotation, null, 2));
        
        // Also update the master annotations index
        await this.updateAnnotationsIndex(annotation);
    }

    async updateAnnotationsIndex(annotation) {
        const indexPath = path.join(this.annotationsPath, 'index.json');
        
        let index = [];
        try {
            const indexData = await fs.readFile(indexPath, 'utf8');
            index = JSON.parse(indexData);
        } catch (error) {
            // Index doesn't exist yet, start with empty array
        }
        
        index.push({
            id: annotation.id,
            timestamp: annotation.timestamp,
            documentType: annotation.documentType,
            annotationType: annotation.annotationType,
            confidence: annotation.confidence
        });
        
        // Keep only the last 1000 annotations in the index
        if (index.length > 1000) {
            index = index.slice(-1000);
        }
        
        await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
    }

    async generateImprovements(annotation) {
        const improvements = [];
        
        switch (annotation.annotationType) {
            case 'security_name_correction':
                improvements.push(...await this.improveSecurityNameExtraction(annotation));
                break;
                
            case 'value_correction':
                improvements.push(...await this.improveValueExtraction(annotation));
                break;
                
            case 'date_correction':
                improvements.push(...await this.improveDateExtraction(annotation));
                break;
                
            case 'currency_correction':
                improvements.push(...await this.improveCurrencyExtraction(annotation));
                break;
                
            case 'performance_correction':
                improvements.push(...await this.improvePerformanceExtraction(annotation));
                break;
                
            case 'document_type_correction':
                improvements.push(...await this.improveDocumentTypeDetection(annotation));
                break;
                
            default:
                improvements.push(...await this.generateGenericImprovements(annotation));
        }
        
        return improvements;
    }

    async improveSecurityNameExtraction(annotation) {
        const improvements = [];
        
        if (annotation.correctedData.securityName) {
            // Learn new pattern for security name extraction
            const pattern = this.extractNamePattern(
                annotation.originalText,
                annotation.correctedData.securityName
            );
            
            if (pattern) {
                improvements.push({
                    type: 'security_name_pattern',
                    pattern: pattern,
                    confidence: annotation.confidence,
                    documentType: annotation.documentType
                });
            }
        }
        
        return improvements;
    }

    async improveValueExtraction(annotation) {
        const improvements = [];
        
        if (annotation.correctedData.value) {
            // Learn new pattern for value extraction
            const pattern = this.extractValuePattern(
                annotation.originalText,
                annotation.correctedData.value
            );
            
            if (pattern) {
                improvements.push({
                    type: 'value_extraction_pattern',
                    pattern: pattern,
                    confidence: annotation.confidence,
                    documentType: annotation.documentType
                });
            }
        }
        
        return improvements;
    }

    async improveDateExtraction(annotation) {
        const improvements = [];
        
        if (annotation.correctedData.date) {
            const pattern = this.extractDatePattern(
                annotation.originalText,
                annotation.correctedData.date
            );
            
            if (pattern) {
                improvements.push({
                    type: 'date_extraction_pattern',
                    pattern: pattern,
                    confidence: annotation.confidence,
                    documentType: annotation.documentType
                });
            }
        }
        
        return improvements;
    }

    async improveCurrencyExtraction(annotation) {
        const improvements = [];
        
        if (annotation.correctedData.currency) {
            const pattern = this.extractCurrencyPattern(
                annotation.originalText,
                annotation.correctedData.currency
            );
            
            if (pattern) {
                improvements.push({
                    type: 'currency_extraction_pattern',
                    pattern: pattern,
                    confidence: annotation.confidence,
                    documentType: annotation.documentType
                });
            }
        }
        
        return improvements;
    }

    async improvePerformanceExtraction(annotation) {
        const improvements = [];
        
        if (annotation.correctedData.performance) {
            const pattern = this.extractPerformancePattern(
                annotation.originalText,
                annotation.correctedData.performance
            );
            
            if (pattern) {
                improvements.push({
                    type: 'performance_extraction_pattern',
                    pattern: pattern,
                    confidence: annotation.confidence,
                    documentType: annotation.documentType
                });
            }
        }
        
        return improvements;
    }

    async improveDocumentTypeDetection(annotation) {
        const improvements = [];
        
        if (annotation.correctedData.documentType) {
            improvements.push({
                type: 'document_type_pattern',
                originalType: annotation.documentType,
                correctedType: annotation.correctedData.documentType,
                textSample: annotation.originalText.substring(0, 500),
                confidence: annotation.confidence
            });
        }
        
        return improvements;
    }

    async generateGenericImprovements(annotation) {
        const improvements = [];
        
        // Analyze the correction to generate generic improvements
        if (annotation.correctedData) {
            for (const [field, value] of Object.entries(annotation.correctedData)) {
                if (value && typeof value === 'string') {
                    const pattern = this.extractGenericPattern(annotation.originalText, value);
                    if (pattern) {
                        improvements.push({
                            type: 'generic_extraction_pattern',
                            field: field,
                            pattern: pattern,
                            confidence: annotation.confidence,
                            documentType: annotation.documentType
                        });
                    }
                }
            }
        }
        
        return improvements;
    }

    extractNamePattern(text, correctName) {
        // Find the correct name in the text and create a pattern
        const nameIndex = text.toLowerCase().indexOf(correctName.toLowerCase());
        if (nameIndex === -1) return null;
        
        // Extract context around the name
        const start = Math.max(0, nameIndex - 50);
        const end = Math.min(text.length, nameIndex + correctName.length + 50);
        const context = text.substring(start, end);
        
        // Create a pattern based on the context
        return {
            regex: this.createRegexFromContext(context, correctName),
            context: context,
            targetValue: correctName
        };
    }

    extractValuePattern(text, correctValue) {
        // Similar to name pattern but for monetary values
        const valueStr = correctValue.toString().replace(/,/g, '');
        const valueIndex = text.indexOf(valueStr);
        if (valueIndex === -1) return null;
        
        const start = Math.max(0, valueIndex - 30);
        const end = Math.min(text.length, valueIndex + valueStr.length + 30);
        const context = text.substring(start, end);
        
        return {
            regex: this.createValueRegexFromContext(context, valueStr),
            context: context,
            targetValue: correctValue
        };
    }

    extractDatePattern(text, correctDate) {
        const dateIndex = text.indexOf(correctDate);
        if (dateIndex === -1) return null;
        
        const start = Math.max(0, dateIndex - 20);
        const end = Math.min(text.length, dateIndex + correctDate.length + 20);
        const context = text.substring(start, end);
        
        return {
            regex: this.createDateRegexFromContext(context, correctDate),
            context: context,
            targetValue: correctDate
        };
    }

    extractCurrencyPattern(text, correctCurrency) {
        const currencyIndex = text.indexOf(correctCurrency);
        if (currencyIndex === -1) return null;
        
        const start = Math.max(0, currencyIndex - 15);
        const end = Math.min(text.length, currencyIndex + correctCurrency.length + 15);
        const context = text.substring(start, end);
        
        return {
            regex: this.createCurrencyRegexFromContext(context, correctCurrency),
            context: context,
            targetValue: correctCurrency
        };
    }

    extractPerformancePattern(text, correctPerformance) {
        const perfIndex = text.indexOf(correctPerformance);
        if (perfIndex === -1) return null;
        
        const start = Math.max(0, perfIndex - 25);
        const end = Math.min(text.length, perfIndex + correctPerformance.length + 25);
        const context = text.substring(start, end);
        
        return {
            regex: this.createPerformanceRegexFromContext(context, correctPerformance),
            context: context,
            targetValue: correctPerformance
        };
    }

    extractGenericPattern(text, correctValue) {
        const valueIndex = text.indexOf(correctValue);
        if (valueIndex === -1) return null;
        
        const start = Math.max(0, valueIndex - 30);
        const end = Math.min(text.length, valueIndex + correctValue.length + 30);
        const context = text.substring(start, end);
        
        return {
            regex: this.createGenericRegexFromContext(context, correctValue),
            context: context,
            targetValue: correctValue
        };
    }

    createRegexFromContext(context, targetValue) {
        // Create a regex pattern that can extract similar values in similar contexts
        const escapedValue = targetValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const beforeContext = context.substring(0, context.indexOf(targetValue));
        const afterContext = context.substring(context.indexOf(targetValue) + targetValue.length);
        
        // Simplify the context to create a more general pattern
        const beforePattern = this.simplifyContext(beforeContext);
        const afterPattern = this.simplifyContext(afterContext);
        
        return `${beforePattern}([A-Z][A-Za-z\\s&\\.\\-]+)${afterPattern}`;
    }

    createValueRegexFromContext(context, targetValue) {
        const beforeContext = context.substring(0, context.indexOf(targetValue));
        const afterContext = context.substring(context.indexOf(targetValue) + targetValue.length);
        
        const beforePattern = this.simplifyContext(beforeContext);
        const afterPattern = this.simplifyContext(afterContext);
        
        return `${beforePattern}([0-9,]+(?:\\.[0-9]{2})?)${afterPattern}`;
    }

    createDateRegexFromContext(context, targetValue) {
        const beforeContext = context.substring(0, context.indexOf(targetValue));
        const afterContext = context.substring(context.indexOf(targetValue) + targetValue.length);
        
        const beforePattern = this.simplifyContext(beforeContext);
        const afterPattern = this.simplifyContext(afterContext);
        
        return `${beforePattern}(\\d{1,2}[\\.\\/]\\d{1,2}[\\.\\/]\\d{4})${afterPattern}`;
    }

    createCurrencyRegexFromContext(context, targetValue) {
        const beforeContext = context.substring(0, context.indexOf(targetValue));
        const afterContext = context.substring(context.indexOf(targetValue) + targetValue.length);
        
        const beforePattern = this.simplifyContext(beforeContext);
        const afterPattern = this.simplifyContext(afterContext);
        
        return `${beforePattern}([A-Z]{3})${afterPattern}`;
    }

    createPerformanceRegexFromContext(context, targetValue) {
        const beforeContext = context.substring(0, context.indexOf(targetValue));
        const afterContext = context.substring(context.indexOf(targetValue) + targetValue.length);
        
        const beforePattern = this.simplifyContext(beforeContext);
        const afterPattern = this.simplifyContext(afterContext);
        
        return `${beforePattern}([-+]?\\d+(?:\\.\\d{1,4})?)\\s*%${afterPattern}`;
    }

    createGenericRegexFromContext(context, targetValue) {
        const beforeContext = context.substring(0, context.indexOf(targetValue));
        const afterContext = context.substring(context.indexOf(targetValue) + targetValue.length);
        
        const beforePattern = this.simplifyContext(beforeContext);
        const afterPattern = this.simplifyContext(afterContext);
        
        return `${beforePattern}([^\\s]+)${afterPattern}`;
    }

    simplifyContext(context) {
        // Simplify context to create more general patterns
        return context
            .replace(/\d+/g, '\\d+') // Replace numbers with number pattern
            .replace(/\s+/g, '\\s*') // Replace spaces with flexible space pattern
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special characters
            .substring(-20, 20); // Limit context length
    }

    async updateExtractionPatterns(improvements) {
        if (improvements.length === 0) return;
        
        const patternsPath = path.join(this.modelsPath, 'learned-patterns.json');
        
        let patterns = {};
        try {
            const patternsData = await fs.readFile(patternsPath, 'utf8');
            patterns = JSON.parse(patternsData);
        } catch (error) {
            // Patterns file doesn't exist yet
        }
        
        // Add new patterns
        for (const improvement of improvements) {
            if (!patterns[improvement.type]) {
                patterns[improvement.type] = [];
            }
            
            patterns[improvement.type].push({
                pattern: improvement.pattern,
                confidence: improvement.confidence,
                documentType: improvement.documentType,
                timestamp: new Date().toISOString()
            });
        }
        
        await fs.writeFile(patternsPath, JSON.stringify(patterns, null, 2));
        console.log(`📈 Updated extraction patterns with ${improvements.length} improvements`);
    }

    async generateTrainingData(annotation) {
        const trainingData = {
            id: annotation.id,
            input: annotation.originalText,
            expectedOutput: annotation.correctedData,
            documentType: annotation.documentType,
            annotationType: annotation.annotationType,
            confidence: annotation.confidence,
            timestamp: annotation.timestamp
        };
        
        const trainingPath = path.join(this.modelsPath, 'training-data.jsonl');
        const trainingLine = JSON.stringify(trainingData) + '\n';
        
        await fs.appendFile(trainingPath, trainingLine);
        console.log(`🎯 Generated training data for ${annotation.annotationType}`);
    }

    generateAnnotationId() {
        return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async getLearnedPatterns(documentType = null) {
        const patternsPath = path.join(this.modelsPath, 'learned-patterns.json');
        
        try {
            const patternsData = await fs.readFile(patternsPath, 'utf8');
            const patterns = JSON.parse(patternsData);
            
            if (documentType) {
                // Filter patterns by document type
                const filteredPatterns = {};
                for (const [type, patternList] of Object.entries(patterns)) {
                    filteredPatterns[type] = patternList.filter(p => 
                        p.documentType === documentType || p.documentType === 'generic'
                    );
                }
                return filteredPatterns;
            }
            
            return patterns;
        } catch (error) {
            return {};
        }
    }

    async getLearningStats() {
        const annotationsIndex = path.join(this.annotationsPath, 'index.json');
        
        try {
            const indexData = await fs.readFile(annotationsIndex, 'utf8');
            const annotations = JSON.parse(indexData);
            
            const stats = {
                totalAnnotations: annotations.length,
                byType: {},
                byDocumentType: {},
                averageConfidence: 0,
                recentActivity: annotations.slice(-10)
            };
            
            // Calculate statistics
            let totalConfidence = 0;
            annotations.forEach(annotation => {
                // By annotation type
                stats.byType[annotation.annotationType] = 
                    (stats.byType[annotation.annotationType] || 0) + 1;
                
                // By document type
                stats.byDocumentType[annotation.documentType] = 
                    (stats.byDocumentType[annotation.documentType] || 0) + 1;
                
                totalConfidence += annotation.confidence;
            });
            
            stats.averageConfidence = annotations.length > 0 ? 
                totalConfidence / annotations.length : 0;
            
            return stats;
        } catch (error) {
            return {
                totalAnnotations: 0,
                byType: {},
                byDocumentType: {},
                averageConfidence: 0,
                recentActivity: []
            };
        }
    }
}

module.exports = { LearningSystem };
