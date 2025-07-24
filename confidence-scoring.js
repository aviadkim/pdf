/**
 * CONFIDENCE SCORING SYSTEM
 * Advanced confidence calculation and scoring algorithms
 * 
 * Features:
 * - Multi-factor confidence scoring
 * - Bayesian confidence updates
 * - Historical accuracy tracking
 * - Dynamic threshold adjustment
 * - Pattern-based confidence boosting
 */

class ConfidenceScoring {
    constructor(options = {}) {
        this.config = {
            baseConfidence: options.baseConfidence || 0.5,
            minConfidence: options.minConfidence || 0.1,
            maxConfidence: options.maxConfidence || 0.99,
            learningRate: options.learningRate || 0.1,
            historyWeight: options.historyWeight || 0.3,
            patternWeight: options.patternWeight || 0.2,
            contextWeight: options.contextWeight || 0.3,
            validationWeight: options.validationWeight || 0.2
        };
        
        this.scoringFactors = {
            extraction: new Map(),
            validation: new Map(),
            pattern: new Map(),
            context: new Map(),
            historical: new Map()
        };
        
        this.thresholds = {
            high: 0.8,
            medium: 0.6,
            low: 0.4
        };
        
        this.statistics = {
            totalScores: 0,
            averageConfidence: 0,
            accuracyHistory: [],
            calibrationData: []
        };
        
        console.log('🎯 Confidence Scoring System initialized');
    }

    async calculateConfidence(extractionData, context = {}) {
        console.log('🔍 Calculating confidence score...');
        
        try {
            const factors = await this.evaluateFactors(extractionData, context);
            const baseScore = this.calculateBaseScore(factors);
            const adjustedScore = await this.applyAdjustments(baseScore, extractionData, context);
            const finalScore = this.normalizeScore(adjustedScore);
            
            const confidenceData = {
                score: finalScore,
                level: this.getConfidenceLevel(finalScore),
                factors: factors,
                reasoning: this.generateReasoning(factors, finalScore),
                timestamp: new Date().toISOString()
            };
            
            await this.updateStatistics(confidenceData);
            
            console.log(`✅ Confidence calculated: ${(finalScore * 100).toFixed(1)}% (${confidenceData.level})`);
            return confidenceData;
            
        } catch (error) {
            console.error('❌ Confidence calculation failed:', error);
            return this.getDefaultConfidence();
        }
    }

    async evaluateFactors(extractionData, context) {
        const factors = {
            extraction: await this.evaluateExtractionFactors(extractionData),
            validation: await this.evaluateValidationFactors(extractionData),
            pattern: await this.evaluatePatternFactors(extractionData, context),
            context: await this.evaluateContextFactors(extractionData, context),
            historical: await this.evaluateHistoricalFactors(extractionData, context)
        };
        
        console.log('📊 Confidence factors evaluated:');
        for (const [factor, score] of Object.entries(factors)) {
            console.log(`   ${factor}: ${(score * 100).toFixed(1)}%`);
        }
        
        return factors;
    }

    async evaluateExtractionFactors(data) {
        let score = this.config.baseConfidence;
        const factors = [];
        
        // ISIN format validation
        if (data.isin) {
            const isinValid = this.validateISINFormat(data.isin);
            score += isinValid ? 0.2 : -0.3;
            factors.push({ factor: 'isin_format', valid: isinValid, weight: 0.2 });
        }
        
        // Value validation
        if (data.value !== undefined) {
            const valueValid = this.validateValue(data.value);
            score += valueValid ? 0.15 : -0.2;
            factors.push({ factor: 'value_format', valid: valueValid, weight: 0.15 });
        }
        
        // Security name validation
        if (data.name) {
            const nameQuality = this.evaluateNameQuality(data.name);
            score += (nameQuality - 0.5) * 0.3;
            factors.push({ factor: 'name_quality', score: nameQuality, weight: 0.3 });
        }
        
        // Extraction method reliability
        if (data.method) {
            const methodReliability = this.getMethodReliability(data.method);
            score += (methodReliability - 0.5) * 0.2;
            factors.push({ factor: 'method_reliability', score: methodReliability, weight: 0.2 });
        }
        
        // Currency consistency
        if (data.currency) {
            const currencyValid = this.validateCurrency(data.currency);
            score += currencyValid ? 0.1 : -0.1;
            factors.push({ factor: 'currency_valid', valid: currencyValid, weight: 0.1 });
        }
        
        this.scoringFactors.extraction.set('last_evaluation', { score, factors });
        return Math.max(0, Math.min(1, score));
    }

    async evaluateValidationFactors(data) {
        let score = this.config.baseConfidence;
        const factors = [];
        
        // Cross-field validation
        const crossValidation = this.performCrossValidation(data);
        score += (crossValidation - 0.5) * 0.4;
        factors.push({ factor: 'cross_validation', score: crossValidation, weight: 0.4 });
        
        // Format consistency
        const formatConsistency = this.checkFormatConsistency(data);
        score += (formatConsistency - 0.5) * 0.3;
        factors.push({ factor: 'format_consistency', score: formatConsistency, weight: 0.3 });
        
        // Completeness check
        const completeness = this.checkDataCompleteness(data);
        score += (completeness - 0.5) * 0.3;
        factors.push({ factor: 'completeness', score: completeness, weight: 0.3 });
        
        this.scoringFactors.validation.set('last_evaluation', { score, factors });
        return Math.max(0, Math.min(1, score));
    }

    async evaluatePatternFactors(data, context) {
        let score = this.config.baseConfidence;
        const factors = [];
        
        // Known pattern matching
        const patternMatch = await this.matchKnownPatterns(data);
        score += (patternMatch - 0.5) * 0.4;
        factors.push({ factor: 'pattern_match', score: patternMatch, weight: 0.4 });
        
        // Document type patterns
        if (context.documentType) {
            const typePattern = this.getDocumentTypePatterns(context.documentType);
            const typeMatch = this.matchDocumentTypePattern(data, typePattern);
            score += (typeMatch - 0.5) * 0.3;
            factors.push({ factor: 'document_type_pattern', score: typeMatch, weight: 0.3 });
        }
        
        // Regional patterns (e.g., Swiss formatting)
        const regionalPattern = this.detectRegionalPatterns(data);
        score += (regionalPattern - 0.5) * 0.3;
        factors.push({ factor: 'regional_pattern', score: regionalPattern, weight: 0.3 });
        
        this.scoringFactors.pattern.set('last_evaluation', { score, factors });
        return Math.max(0, Math.min(1, score));
    }

    async evaluateContextFactors(data, context) {
        let score = this.config.baseConfidence;
        const factors = [];
        
        // Position context (page, coordinates)
        if (data.pageNumber || data.coordinates) {
            const positionScore = this.evaluatePositionContext(data, context);
            score += (positionScore - 0.5) * 0.3;
            factors.push({ factor: 'position_context', score: positionScore, weight: 0.3 });
        }
        
        // Surrounding text context
        if (context.surroundingText) {
            const textContext = this.evaluateTextContext(data, context.surroundingText);
            score += (textContext - 0.5) * 0.4;
            factors.push({ factor: 'text_context', score: textContext, weight: 0.4 });
        }
        
        // Portfolio context (total values, securities count)
        if (context.portfolioData) {
            const portfolioContext = this.evaluatePortfolioContext(data, context.portfolioData);
            score += (portfolioContext - 0.5) * 0.3;
            factors.push({ factor: 'portfolio_context', score: portfolioContext, weight: 0.3 });
        }
        
        this.scoringFactors.context.set('last_evaluation', { score, factors });
        return Math.max(0, Math.min(1, score));
    }

    async evaluateHistoricalFactors(data, context) {
        let score = this.config.baseConfidence;
        const factors = [];
        
        // Historical accuracy for similar extractions
        const historicalAccuracy = await this.getHistoricalAccuracy(data, context);
        score += (historicalAccuracy - 0.5) * 0.4;
        factors.push({ factor: 'historical_accuracy', score: historicalAccuracy, weight: 0.4 });
        
        // User correction patterns
        const correctionPatterns = await this.getUserCorrectionPatterns(data);
        score += (correctionPatterns - 0.5) * 0.3;
        factors.push({ factor: 'correction_patterns', score: correctionPatterns, weight: 0.3 });
        
        // Model performance trends
        const modelTrends = await this.getModelPerformanceTrends(context.method);
        score += (modelTrends - 0.5) * 0.3;
        factors.push({ factor: 'model_trends', score: modelTrends, weight: 0.3 });
        
        this.scoringFactors.historical.set('last_evaluation', { score, factors });
        return Math.max(0, Math.min(1, score));
    }

    calculateBaseScore(factors) {
        const weights = {
            extraction: 0.3,
            validation: 0.2,
            pattern: 0.2,
            context: 0.15,
            historical: 0.15
        };
        
        let weightedSum = 0;
        let totalWeight = 0;
        
        for (const [factorName, factorScore] of Object.entries(factors)) {
            if (weights[factorName] && factorScore !== null && factorScore !== undefined) {
                weightedSum += factorScore * weights[factorName];
                totalWeight += weights[factorName];
            }
        }
        
        return totalWeight > 0 ? weightedSum / totalWeight : this.config.baseConfidence;
    }

    async applyAdjustments(baseScore, data, context) {
        let adjustedScore = baseScore;
        
        // Bayesian updates based on priors
        if (context.priorConfidence) {
            adjustedScore = this.bayesianUpdate(adjustedScore, context.priorConfidence);
        }
        
        // Uncertainty penalties
        const uncertaintyPenalty = this.calculateUncertaintyPenalty(data, context);
        adjustedScore -= uncertaintyPenalty;
        
        // Confidence boosters
        const confidenceBoost = this.calculateConfidenceBoost(data, context);
        adjustedScore += confidenceBoost;
        
        // Calibration adjustment
        adjustedScore = this.applyCalibration(adjustedScore);
        
        return adjustedScore;
    }

    bayesianUpdate(likelihood, prior) {
        // Simple Bayesian update: P(A|B) = P(B|A) * P(A) / P(B)
        // Here we use a simplified approach
        const posterior = (likelihood * prior) / ((likelihood * prior) + ((1 - likelihood) * (1 - prior)));
        return posterior;
    }

    calculateUncertaintyPenalty(data, context) {
        let penalty = 0;
        
        // Missing data penalty
        const requiredFields = ['isin', 'name', 'value'];
        const missingFields = requiredFields.filter(field => !data[field]);
        penalty += missingFields.length * 0.1;
        
        // Ambiguous data penalty
        if (data.name && this.isAmbiguousName(data.name)) {
            penalty += 0.15;
        }
        
        // Extraction method uncertainty
        if (data.method && this.isUncertainMethod(data.method)) {
            penalty += 0.1;
        }
        
        return Math.min(penalty, 0.4); // Cap penalty at 40%
    }

    calculateConfidenceBoost(data, context) {
        let boost = 0;
        
        // High-quality data boost
        if (this.isHighQualityData(data)) {
            boost += 0.1;
        }
        
        // Multiple validation sources boost
        if (context.validationSources > 1) {
            boost += 0.05 * (context.validationSources - 1);
        }
        
        // Expert validation boost
        if (context.expertValidated) {
            boost += 0.2;
        }
        
        return Math.min(boost, 0.3); // Cap boost at 30%
    }

    applyCalibration(rawScore) {
        // Apply calibration curve to improve score reliability
        if (this.statistics.calibrationData.length > 0) {
            return this.interpolateCalibration(rawScore);
        }
        
        // Default calibration (sigmoid-like adjustment)
        return 1 / (1 + Math.exp(-6 * (rawScore - 0.5)));
    }

    normalizeScore(score) {
        return Math.max(
            this.config.minConfidence,
            Math.min(this.config.maxConfidence, score)
        );
    }

    getConfidenceLevel(score) {
        if (score >= this.thresholds.high) return 'high';
        if (score >= this.thresholds.medium) return 'medium';
        if (score >= this.thresholds.low) return 'low';
        return 'very_low';
    }

    generateReasoning(factors, finalScore) {
        const reasoning = [];
        
        // Explain main contributing factors
        const sortedFactors = Object.entries(factors)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        
        for (const [factor, score] of sortedFactors) {
            if (score > 0.7) {
                reasoning.push(`Strong ${factor} validation (+${((score - 0.5) * 100).toFixed(0)}%)`);
            } else if (score < 0.3) {
                reasoning.push(`Weak ${factor} validation (${((score - 0.5) * 100).toFixed(0)}%)`);
            }
        }
        
        // Overall assessment
        if (finalScore >= 0.8) {
            reasoning.push('High confidence extraction with strong validation');
        } else if (finalScore >= 0.6) {
            reasoning.push('Moderate confidence with some validation concerns');
        } else {
            reasoning.push('Low confidence requiring manual review');
        }
        
        return reasoning;
    }

    // Validation helper methods
    validateISINFormat(isin) {
        return /^[A-Z]{2}[A-Z0-9]{10}$/.test(isin) && this.validateISINChecksum(isin);
    }

    validateISINChecksum(isin) {
        // Simplified ISIN checksum validation
        const digits = isin.substring(0, 11).split('').map(char => {
            return isNaN(char) ? char.charCodeAt(0) - 55 : parseInt(char);
        }).join('');
        
        let sum = 0;
        for (let i = digits.length - 1; i >= 0; i--) {
            let digit = parseInt(digits[i]);
            if ((digits.length - i) % 2 === 0) {
                digit *= 2;
                if (digit > 9) digit = Math.floor(digit / 10) + digit % 10;
            }
            sum += digit;
        }
        
        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit === parseInt(isin[11]);
    }

    validateValue(value) {
        if (typeof value !== 'number') return false;
        return value > 0 && value < 1e12 && Number.isFinite(value);
    }

    validateCurrency(currency) {
        const validCurrencies = ['CHF', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
        return validCurrencies.includes(currency);
    }

    evaluateNameQuality(name) {
        if (!name || typeof name !== 'string') return 0;
        
        let quality = 0.5;
        
        // Length check
        if (name.length >= 10 && name.length <= 100) quality += 0.2;
        else if (name.length < 5) quality -= 0.3;
        
        // Content quality
        if (/[A-Z]/.test(name)) quality += 0.1; // Has uppercase
        if (/\b(AG|SA|Ltd|Corp|Inc|GmbH|PLC)\b/i.test(name)) quality += 0.2; // Company indicators
        if (!/\d{5,}/.test(name)) quality += 0.1; // Not mostly numbers
        if (!/^[A-Z\s&.-]+$/i.test(name)) quality -= 0.2; // Invalid characters
        
        return Math.max(0, Math.min(1, quality));
    }

    getMethodReliability(method) {
        const reliabilityMap = {
            'mistral_ocr': 0.9,
            'claude_vision': 0.85,
            'azure_vision': 0.8,
            'text_extraction': 0.7,
            'manual_entry': 0.95,
            'fallback': 0.4
        };
        
        return reliabilityMap[method] || 0.5;
    }

    performCrossValidation(data) {
        let score = 0.5;
        let checks = 0;
        
        // ISIN-Name consistency
        if (data.isin && data.name) {
            const countryCode = data.isin.substring(0, 2);
            const nameConsistency = this.checkNameCountryConsistency(data.name, countryCode);
            score += (nameConsistency - 0.5) * 0.3;
            checks++;
        }
        
        // Value-Percentage consistency
        if (data.value && data.percentage) {
            const valueConsistency = this.checkValuePercentageConsistency(data.value, data.percentage);
            score += (valueConsistency - 0.5) * 0.3;
            checks++;
        }
        
        // Currency consistency
        if (data.currency && data.value) {
            const currencyConsistency = this.checkCurrencyValueConsistency(data.currency, data.value);
            score += (currencyConsistency - 0.5) * 0.4;
            checks++;
        }
        
        return checks > 0 ? score / checks : 0.5;
    }

    checkFormatConsistency(data) {
        // Check if all formats follow expected patterns
        let consistency = 0.5;
        
        if (data.isin && this.validateISINFormat(data.isin)) consistency += 0.2;
        if (data.value && this.validateValue(data.value)) consistency += 0.2;
        if (data.currency && this.validateCurrency(data.currency)) consistency += 0.1;
        
        return Math.min(1, consistency);
    }

    checkDataCompleteness(data) {
        const requiredFields = ['isin', 'name', 'value'];
        const optionalFields = ['currency', 'percentage'];
        
        const requiredComplete = requiredFields.filter(field => data[field]).length / requiredFields.length;
        const optionalComplete = optionalFields.filter(field => data[field]).length / optionalFields.length;
        
        return (requiredComplete * 0.8) + (optionalComplete * 0.2);
    }

    async matchKnownPatterns(data) {
        // This would integrate with the pattern recognition system
        // For now, return a basic score
        return 0.6;
    }

    async updateStatistics(confidenceData) {
        this.statistics.totalScores++;
        
        // Update running average
        const currentAvg = this.statistics.averageConfidence;
        this.statistics.averageConfidence = 
            (currentAvg * (this.statistics.totalScores - 1) + confidenceData.score) / this.statistics.totalScores;
        
        // Maintain recent history
        if (this.statistics.accuracyHistory.length >= 1000) {
            this.statistics.accuracyHistory.shift();
        }
        this.statistics.accuracyHistory.push(confidenceData.score);
    }

    async updateCalibration(predictedConfidence, actualAccuracy) {
        this.statistics.calibrationData.push({
            predicted: predictedConfidence,
            actual: actualAccuracy,
            timestamp: new Date().toISOString()
        });
        
        // Keep only recent calibration data
        if (this.statistics.calibrationData.length > 10000) {
            this.statistics.calibrationData = this.statistics.calibrationData.slice(-5000);
        }
    }

    getDefaultConfidence() {
        return {
            score: this.config.baseConfidence,
            level: 'medium',
            factors: {},
            reasoning: ['Default confidence due to calculation error'],
            timestamp: new Date().toISOString()
        };
    }

    getStatistics() {
        return {
            ...this.statistics,
            thresholds: this.thresholds,
            config: this.config
        };
    }

    // Additional helper methods would be implemented here...
    isAmbiguousName(name) {
        const ambiguousWords = ['bond', 'note', 'security', 'investment', 'fund'];
        return ambiguousWords.some(word => name.toLowerCase().includes(word)) && name.length < 20;
    }

    isUncertainMethod(method) {
        const uncertainMethods = ['fallback', 'text_extraction', 'basic_ocr'];
        return uncertainMethods.includes(method);
    }

    isHighQualityData(data) {
        return data.isin && 
               data.name && 
               data.value && 
               this.validateISINFormat(data.isin) && 
               this.evaluateNameQuality(data.name) > 0.7;
    }

    interpolateCalibration(rawScore) {
        // Simple linear interpolation of calibration curve
        const calibrationData = this.statistics.calibrationData;
        if (calibrationData.length < 10) return rawScore;
        
        // Find closest calibration points
        const sorted = calibrationData.sort((a, b) => a.predicted - b.predicted);
        
        for (let i = 0; i < sorted.length - 1; i++) {
            if (rawScore >= sorted[i].predicted && rawScore <= sorted[i + 1].predicted) {
                const ratio = (rawScore - sorted[i].predicted) / 
                             (sorted[i + 1].predicted - sorted[i].predicted);
                return sorted[i].actual + ratio * (sorted[i + 1].actual - sorted[i].actual);
            }
        }
        
        return rawScore; // Fallback to original score
    }

    checkNameCountryConsistency(name, countryCode) {
        // Basic heuristics for name-country consistency
        const countryIndicators = {
            'CH': ['AG', 'SA', 'Swiss', 'Zurich', 'Geneva'],
            'US': ['Inc', 'Corp', 'LLC', 'American'],
            'GB': ['PLC', 'Ltd', 'British', 'London'],
            'DE': ['GmbH', 'AG', 'German', 'Deutsche']
        };
        
        const indicators = countryIndicators[countryCode] || [];
        const hasIndicator = indicators.some(indicator => 
            name.toUpperCase().includes(indicator.toUpperCase())
        );
        
        return hasIndicator ? 0.8 : 0.5;
    }

    checkValuePercentageConsistency(value, percentage) {
        // This would require portfolio total context
        // For now, return neutral score
        return 0.6;
    }

    checkCurrencyValueConsistency(currency, value) {
        // Basic checks for currency-value consistency
        if (currency === 'CHF' && value > 0 && value < 1e9) return 0.8;
        if (currency === 'USD' && value > 0 && value < 1e9) return 0.8;
        return 0.6;
    }

    getDocumentTypePatterns(documentType) {
        // Return patterns specific to document types
        return {};
    }

    matchDocumentTypePattern(data, pattern) {
        // Match data against document type patterns
        return 0.6;
    }

    detectRegionalPatterns(data) {
        // Detect regional formatting patterns
        return 0.6;
    }

    evaluatePositionContext(data, context) {
        // Evaluate position-based context
        return 0.6;
    }

    evaluateTextContext(data, surroundingText) {
        // Evaluate surrounding text context
        return 0.6;
    }

    evaluatePortfolioContext(data, portfolioData) {
        // Evaluate portfolio-level context
        return 0.6;
    }

    async getHistoricalAccuracy(data, context) {
        // Get historical accuracy for similar extractions
        return 0.6;
    }

    async getUserCorrectionPatterns(data) {
        // Analyze user correction patterns
        return 0.6;
    }

    async getModelPerformanceTrends(method) {
        // Get model performance trends
        return 0.6;
    }
}

module.exports = { ConfidenceScoring };