/**
 * HUMAN-AI FEEDBACK LOOP SYSTEM
 * 
 * Advanced system that captures human corrections, learns from them,
 * and progressively improves AI accuracy while reducing costs
 */

const fs = require('fs').promises;
const path = require('path');

class HumanAIFeedbackLoop {
    constructor() {
        this.patternsPath = path.join(__dirname, 'data/learned-patterns');
        this.feedbackPath = path.join(__dirname, 'data/feedback');
        this.analyticsPath = path.join(__dirname, 'data/analytics');
        this.initializeSystem();
    }

    async initializeSystem() {
        const dirs = [this.patternsPath, this.feedbackPath, this.analyticsPath];
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        console.log('🧠 Human-AI Feedback Loop System initialized');
    }

    async processHumanCorrection(correction) {
        console.log('📝 Processing human correction...');
        
        try {
            // Store the correction
            const correctionId = await this.storeFeedback(correction);
            
            // Analyze the correction pattern
            const pattern = await this.analyzeCorrection(correction);
            
            // Create learning pattern
            const learningPattern = await this.createLearningPattern(pattern);
            
            // Update global patterns
            await this.updateGlobalPatterns(learningPattern);
            
            // Calculate impact
            const impact = await this.calculateImpact(learningPattern);
            
            console.log(`✅ Human correction processed: ${correction.type}`);
            console.log(`🧠 Pattern created: ${learningPattern.id}`);
            console.log(`📈 Expected improvement: ${impact.accuracyImprovement}%`);
            
            return {
                success: true,
                correctionId: correctionId,
                patternId: learningPattern.id,
                impact: impact,
                globalBenefit: true,
                message: 'Correction learned and will improve future extractions'
            };

        } catch (error) {
            console.error('❌ Failed to process human correction:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async storeFeedback(correction) {
        const correctionId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const feedbackRecord = {
            id: correctionId,
            timestamp: new Date().toISOString(),
            type: correction.type,
            originalValue: correction.originalValue,
            correctedValue: correction.correctedValue,
            securityISIN: correction.securityISIN,
            confidence: correction.confidence,
            notes: correction.notes,
            clientId: correction.clientId,
            documentId: correction.documentId,
            processed: false
        };

        await fs.writeFile(
            path.join(this.feedbackPath, `${correctionId}.json`),
            JSON.stringify(feedbackRecord, null, 2)
        );

        return correctionId;
    }

    async analyzeCorrection(correction) {
        console.log(`   🔍 Analyzing correction type: ${correction.type}`);
        
        const analysis = {
            type: correction.type,
            errorPattern: this.identifyErrorPattern(correction),
            correctionPattern: this.identifyCorrectPattern(correction),
            context: this.extractContext(correction),
            frequency: await this.calculateErrorFrequency(correction),
            severity: this.assessErrorSeverity(correction)
        };

        console.log(`   📊 Error pattern identified: ${analysis.errorPattern.description}`);
        return analysis;
    }

    identifyErrorPattern(correction) {
        const patterns = {
            'security_name_correction': {
                description: 'Generic security name extraction',
                commonErrors: ['Ordinary Bonds', 'Corporate Bond', 'Government Bond'],
                rootCause: 'AI extracting generic terms instead of specific issuer names',
                solution: 'Look for bank/company names near ISIN codes'
            },
            'value_correction': {
                description: 'Date/percentage confused with market value',
                commonErrors: ['23.02', '28.03', '3.32%', '2027'],
                rootCause: 'AI confusing dates, percentages, or years with market values',
                solution: 'Distinguish between dates, percentages, and currency amounts'
            },
            'portfolio_correction': {
                description: 'Incorrect portfolio total calculation',
                commonErrors: ['Sum of individual values', 'Including non-portfolio items'],
                rootCause: 'AI summing wrong values or including irrelevant amounts',
                solution: 'Identify specific portfolio total indicators'
            },
            'isin_correction': {
                description: 'ISIN format or extraction error',
                commonErrors: ['Partial ISIN', 'Wrong format', 'Missing characters'],
                rootCause: 'AI not recognizing complete ISIN format',
                solution: 'Strict ISIN format validation (XX0000000000)'
            }
        };

        return patterns[correction.type] || {
            description: 'Unknown error pattern',
            commonErrors: [],
            rootCause: 'Unidentified extraction issue',
            solution: 'Manual review required'
        };
    }

    identifyCorrectPattern(correction) {
        const correctPatterns = {
            'security_name_correction': {
                pattern: this.extractBankNamePattern(correction.correctedValue),
                rule: 'Extract specific bank/company name from document context',
                example: 'TORONTO DOMINION BANK NOTES 23-23.02.27 REG-S VRN'
            },
            'value_correction': {
                pattern: this.extractValuePattern(correction.correctedValue),
                rule: 'Extract currency amounts, not dates or percentages',
                example: '199,080 (Swiss format) → $199,080'
            },
            'portfolio_correction': {
                pattern: this.extractPortfolioPattern(correction.correctedValue),
                rule: 'Find explicit portfolio total, not sum of parts',
                example: 'Total Portfolio Value: $19,464,431'
            }
        };

        return correctPatterns[correction.type] || {
            pattern: correction.correctedValue,
            rule: 'Use corrected value as provided',
            example: correction.correctedValue
        };
    }

    extractBankNamePattern(correctedName) {
        // Extract bank name pattern for future recognition
        const bankNames = [
            'TORONTO DOMINION BANK',
            'CANADIAN IMPERIAL BANK',
            'UBS GROUP',
            'GOLDMAN SACHS',
            'BANCO SAFRA',
            'CREDIT SUISSE',
            'DEUTSCHE BANK'
        ];

        for (const bankName of bankNames) {
            if (correctedName.includes(bankName)) {
                return {
                    bankName: bankName,
                    pattern: `${bankName}.*NOTES?`,
                    context: 'Look for bank name followed by NOTES or similar'
                };
            }
        }

        return {
            pattern: correctedName,
            context: 'Use exact corrected name'
        };
    }

    extractValuePattern(correctedValue) {
        const value = parseFloat(correctedValue.toString().replace(/[,']/g, ''));
        
        return {
            value: value,
            range: {
                min: value * 0.95,
                max: value * 1.05
            },
            format: value > 100000 ? 'large_amount' : 'standard_amount',
            context: 'Currency amount, not date or percentage'
        };
    }

    extractPortfolioPattern(correctedValue) {
        const value = parseFloat(correctedValue.toString().replace(/[,']/g, ''));
        
        return {
            value: value,
            indicators: ['Total', 'Portfolio', 'Value', 'Sum', 'Total Value'],
            context: 'Portfolio-level total, not individual security value',
            validation: 'Should be sum of all security values'
        };
    }

    extractContext(correction) {
        return {
            securityISIN: correction.securityISIN,
            documentType: 'swiss_banking_statement',
            correctionConfidence: correction.confidence,
            userNotes: correction.notes,
            timestamp: correction.timestamp
        };
    }

    async calculateErrorFrequency(correction) {
        try {
            // Count similar errors in feedback history
            const feedbackFiles = await fs.readdir(this.feedbackPath);
            let similarErrors = 0;
            
            for (const file of feedbackFiles) {
                if (file.endsWith('.json')) {
                    const feedback = JSON.parse(await fs.readFile(path.join(this.feedbackPath, file), 'utf8'));
                    if (feedback.type === correction.type && 
                        feedback.originalValue === correction.originalValue) {
                        similarErrors++;
                    }
                }
            }
            
            return {
                count: similarErrors,
                frequency: similarErrors > 5 ? 'high' : similarErrors > 2 ? 'medium' : 'low'
            };
        } catch (error) {
            return { count: 0, frequency: 'unknown' };
        }
    }

    assessErrorSeverity(correction) {
        const severityMap = {
            'security_name_correction': 'medium', // Affects readability but not calculations
            'value_correction': 'high',           // Affects financial calculations
            'portfolio_correction': 'critical',   // Affects total portfolio value
            'isin_correction': 'high'             // Affects security identification
        };

        return severityMap[correction.type] || 'medium';
    }

    async createLearningPattern(analysis) {
        const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const learningPattern = {
            id: patternId,
            type: analysis.type,
            createdAt: new Date().toISOString(),
            errorPattern: analysis.errorPattern,
            correctionPattern: analysis.correctionPattern,
            context: analysis.context,
            frequency: analysis.frequency,
            severity: analysis.severity,
            confidence: 0.9, // Initial confidence
            usageCount: 0,
            successRate: 1.0,
            globalPattern: this.generateGlobalPattern(analysis),
            validationRules: this.generateValidationRules(analysis)
        };

        console.log(`   🧠 Learning pattern created: ${patternId}`);
        return learningPattern;
    }

    generateGlobalPattern(analysis) {
        switch (analysis.type) {
            case 'security_name_correction':
                return {
                    regex: this.createSecurityNameRegex(analysis.correctionPattern),
                    replacement: analysis.correctionPattern.pattern,
                    context: 'Extract specific bank names instead of generic terms'
                };
                
            case 'value_correction':
                return {
                    regex: /(\d{1,3}(?:'?\d{3})*(?:\.\d{2})?)/g,
                    validation: 'Must be currency amount, not date or percentage',
                    context: 'Swiss number formatting with apostrophes'
                };
                
            case 'portfolio_correction':
                return {
                    regex: /(Total|Portfolio|Value).*?(\d{1,3}(?:['.,]\d{3})*(?:\.\d{2})?)/gi,
                    extraction: 'portfolio_total',
                    context: 'Look for explicit portfolio total indicators'
                };
                
            default:
                return {
                    pattern: analysis.correctionPattern.pattern,
                    context: 'Generic correction pattern'
                };
        }
    }

    createSecurityNameRegex(correctionPattern) {
        if (correctionPattern.bankName) {
            return new RegExp(`ISIN:\\s*([A-Z]{2}[A-Z0-9]{10})[\\s\\S]*?(${correctionPattern.bankName}[^\\n]*)`, 'gi');
        }
        return /ISIN:\s*([A-Z]{2}[A-Z0-9]{10})[\s\S]*?([A-Z\s]+(?:BANK|GROUP|CORP|INC)[^\\n]*)/gi;
    }

    generateValidationRules(analysis) {
        const rules = {
            'security_name_correction': [
                'Name must not be "Ordinary Bonds" or generic term',
                'Name should include specific bank or company name',
                'Name length should be > 10 characters'
            ],
            'value_correction': [
                'Value must be numeric and > 1000',
                'Value must not be a date (no format like XX.XX.XX)',
                'Value must not be a percentage (no % symbol)',
                'Value must be reasonable for financial instrument'
            ],
            'portfolio_correction': [
                'Value must be sum of all security values',
                'Value must be significantly larger than individual securities',
                'Value must match portfolio total indicators in document'
            ]
        };

        return rules[analysis.type] || ['Use corrected value as provided'];
    }

    async updateGlobalPatterns(learningPattern) {
        try {
            const patternsFile = path.join(this.patternsPath, 'global-patterns.json');
            let patterns = [];
            
            try {
                const patternsData = await fs.readFile(patternsFile, 'utf8');
                patterns = JSON.parse(patternsData);
            } catch (error) {
                // File doesn't exist yet
            }
            
            patterns.push(learningPattern);
            
            // Keep only the most successful patterns (max 200)
            if (patterns.length > 200) {
                patterns.sort((a, b) => (b.successRate * b.usageCount) - (a.successRate * a.usageCount));
                patterns = patterns.slice(0, 200);
            }
            
            await fs.writeFile(patternsFile, JSON.stringify(patterns, null, 2));
            console.log(`   📚 Global patterns updated: ${patterns.length} total patterns`);
            
        } catch (error) {
            console.error('❌ Failed to update global patterns:', error.message);
        }
    }

    async calculateImpact(learningPattern) {
        try {
            // Calculate expected impact of this learning pattern
            const impact = {
                accuracyImprovement: this.estimateAccuracyImprovement(learningPattern),
                costReduction: this.estimateCostReduction(learningPattern),
                futureDocuments: this.estimateAffectedDocuments(learningPattern),
                confidenceIncrease: this.estimateConfidenceIncrease(learningPattern)
            };

            // Store impact analysis
            const impactRecord = {
                patternId: learningPattern.id,
                timestamp: new Date().toISOString(),
                impact: impact,
                projections: this.generateProjections(impact)
            };

            await fs.writeFile(
                path.join(this.analyticsPath, `impact_${learningPattern.id}.json`),
                JSON.stringify(impactRecord, null, 2)
            );

            return impact;

        } catch (error) {
            console.error('❌ Failed to calculate impact:', error.message);
            return {
                accuracyImprovement: 0,
                costReduction: 0,
                futureDocuments: 0,
                confidenceIncrease: 0
            };
        }
    }

    estimateAccuracyImprovement(pattern) {
        const severityImpact = {
            'critical': 5,  // 5% improvement for critical fixes
            'high': 3,      // 3% improvement for high severity
            'medium': 2,    // 2% improvement for medium severity
            'low': 1        // 1% improvement for low severity
        };

        const frequencyMultiplier = {
            'high': 1.5,    // High frequency errors have bigger impact
            'medium': 1.2,
            'low': 1.0,
            'unknown': 1.0
        };

        const baseImprovement = severityImpact[pattern.severity] || 1;
        const multiplier = frequencyMultiplier[pattern.frequency.frequency] || 1.0;

        return Math.round(baseImprovement * multiplier * 10) / 10; // Round to 1 decimal
    }

    estimateCostReduction(pattern) {
        // Estimate how much this pattern will reduce future costs
        const typeImpact = {
            'security_name_correction': 0.02,  // $0.02 per document
            'value_correction': 0.05,          // $0.05 per document
            'portfolio_correction': 0.03,      // $0.03 per document
            'isin_correction': 0.04            // $0.04 per document
        };

        return typeImpact[pattern.type] || 0.01;
    }

    estimateAffectedDocuments(pattern) {
        // Estimate how many future documents will benefit
        const frequencyImpact = {
            'high': 80,     // 80% of future documents
            'medium': 50,   // 50% of future documents
            'low': 20,      // 20% of future documents
            'unknown': 10   // 10% of future documents
        };

        return frequencyImpact[pattern.frequency.frequency] || 10;
    }

    estimateConfidenceIncrease(pattern) {
        // Estimate confidence increase for this type of extraction
        return Math.min(5, pattern.confidence * 5); // Max 5% confidence increase
    }

    generateProjections(impact) {
        const monthlyDocuments = 100; // Assume 100 documents per month
        
        return {
            monthly: {
                documentsAffected: Math.round(monthlyDocuments * impact.futureDocuments / 100),
                costSavings: monthlyDocuments * impact.costReduction,
                accuracyImprovement: impact.accuracyImprovement
            },
            annual: {
                documentsAffected: Math.round(monthlyDocuments * 12 * impact.futureDocuments / 100),
                costSavings: monthlyDocuments * 12 * impact.costReduction,
                totalImpact: impact.accuracyImprovement * 12
            }
        };
    }

    async getSystemLearningAnalytics() {
        try {
            // Get all feedback records
            const feedbackFiles = await fs.readdir(this.feedbackPath);
            const feedback = [];
            
            for (const file of feedbackFiles) {
                if (file.endsWith('.json')) {
                    const record = JSON.parse(await fs.readFile(path.join(this.feedbackPath, file), 'utf8'));
                    feedback.push(record);
                }
            }

            // Get all patterns
            const patternsFile = path.join(this.patternsPath, 'global-patterns.json');
            let patterns = [];
            try {
                const patternsData = await fs.readFile(patternsFile, 'utf8');
                patterns = JSON.parse(patternsData);
            } catch (error) {
                // No patterns yet
            }

            // Calculate analytics
            const analytics = {
                totalCorrections: feedback.length,
                totalPatterns: patterns.length,
                correctionTypes: this.groupBy(feedback, 'type'),
                severityDistribution: this.analyzeSeverityDistribution(patterns),
                accuracyTrend: this.calculateAccuracyTrend(feedback),
                costSavingsTrend: this.calculateCostSavingsTrend(patterns),
                topImprovements: this.identifyTopImprovements(patterns),
                recentActivity: this.getRecentActivity(feedback),
                projectedImpact: this.calculateProjectedImpact(patterns)
            };

            return analytics;

        } catch (error) {
            console.error('❌ Failed to get learning analytics:', error.message);
            return {
                totalCorrections: 0,
                totalPatterns: 0,
                error: error.message
            };
        }
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key] || 'unknown';
            groups[group] = (groups[group] || 0) + 1;
            return groups;
        }, {});
    }

    analyzeSeverityDistribution(patterns) {
        const distribution = this.groupBy(patterns, 'severity');
        const total = patterns.length;
        
        return Object.keys(distribution).reduce((result, severity) => {
            result[severity] = {
                count: distribution[severity],
                percentage: total > 0 ? Math.round((distribution[severity] / total) * 100) : 0
            };
            return result;
        }, {});
    }

    calculateAccuracyTrend(feedback) {
        // Calculate accuracy improvement over time
        const sortedFeedback = feedback.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        let cumulativeImprovement = 0;
        const trend = sortedFeedback.map((correction, index) => {
            cumulativeImprovement += this.estimateAccuracyImprovement({ 
                severity: 'medium', 
                frequency: { frequency: 'medium' } 
            });
            
            return {
                date: correction.timestamp.split('T')[0],
                cumulativeImprovement: Math.round(cumulativeImprovement * 10) / 10,
                correctionCount: index + 1
            };
        });

        return trend;
    }

    calculateCostSavingsTrend(patterns) {
        let cumulativeSavings = 0;
        
        return patterns.map(pattern => {
            cumulativeSavings += this.estimateCostReduction(pattern) * 100; // Assume 100 docs/month
            
            return {
                patternId: pattern.id,
                type: pattern.type,
                monthlySavings: this.estimateCostReduction(pattern) * 100,
                cumulativeSavings: Math.round(cumulativeSavings * 100) / 100
            };
        });
    }

    identifyTopImprovements(patterns) {
        return patterns
            .map(pattern => ({
                id: pattern.id,
                type: pattern.type,
                impact: this.estimateAccuracyImprovement(pattern),
                costSavings: this.estimateCostReduction(pattern),
                createdAt: pattern.createdAt
            }))
            .sort((a, b) => (b.impact + b.costSavings * 10) - (a.impact + a.costSavings * 10))
            .slice(0, 10);
    }

    getRecentActivity(feedback) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        return feedback
            .filter(correction => new Date(correction.timestamp) > sevenDaysAgo)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
    }

    calculateProjectedImpact(patterns) {
        const totalAccuracyImprovement = patterns.reduce((sum, pattern) => 
            sum + this.estimateAccuracyImprovement(pattern), 0);
        
        const totalCostSavings = patterns.reduce((sum, pattern) => 
            sum + this.estimateCostReduction(pattern), 0);

        return {
            currentAccuracy: Math.min(98, 95 + totalAccuracyImprovement), // Cap at 98%
            projectedAccuracy: Math.min(99, 95 + totalAccuracyImprovement * 1.5),
            monthlyCostSavings: totalCostSavings * 100, // Assume 100 docs/month
            annualCostSavings: totalCostSavings * 1200,
            patternsLearned: patterns.length,
            estimatedROI: (totalCostSavings * 1200 / 150000) * 100 // ROI percentage
        };
    }
}

module.exports = { HumanAIFeedbackLoop };
