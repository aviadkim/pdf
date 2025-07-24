/**
 * DOCUMENT TYPE DETECTION FRAMEWORK
 * 
 * Intelligent system for automatically detecting financial document types
 * and routing them to appropriate specialized parsers
 */

class DocumentTypeDetector {
    constructor() {
        this.detectionRules = this.initializeDetectionRules();
        this.confidenceThreshold = 0.7;
    }

    initializeDetectionRules() {
        return {
            // Swiss Banking Documents
            'messos-corner-banca': {
                weight: 1.0,
                patterns: [
                    { pattern: /Cornèr Banca SA/i, weight: 0.3 },
                    { pattern: /MESSOS ENTERPRISES/i, weight: 0.25 },
                    { pattern: /Valuation as of/i, weight: 0.15 },
                    { pattern: /Swift CBLUCH2280A/i, weight: 0.2 },
                    { pattern: /Clearing 8490/i, weight: 0.1 }
                ],
                keywords: ['cornèr', 'messos', 'valuation', 'swift', 'clearing'],
                structure: ['portfolio', 'asset allocation', 'performance overview']
            },

            'ubs-portfolio': {
                weight: 1.0,
                patterns: [
                    { pattern: /UBS Switzerland AG/i, weight: 0.3 },
                    { pattern: /UBS Group/i, weight: 0.25 },
                    { pattern: /Portfolio Report/i, weight: 0.2 },
                    { pattern: /Investment Advisory/i, weight: 0.15 },
                    { pattern: /UBSWCHZH/i, weight: 0.1 }
                ],
                keywords: ['ubs', 'portfolio', 'investment', 'advisory'],
                structure: ['holdings', 'performance', 'allocation']
            },

            'credit-suisse': {
                weight: 1.0,
                patterns: [
                    { pattern: /Credit Suisse/i, weight: 0.3 },
                    { pattern: /CS Portfolio/i, weight: 0.25 },
                    { pattern: /Investment Report/i, weight: 0.2 },
                    { pattern: /CRESCHZZ/i, weight: 0.15 },
                    { pattern: /Private Banking/i, weight: 0.1 }
                ],
                keywords: ['credit suisse', 'cs', 'private banking'],
                structure: ['portfolio', 'investments', 'performance']
            },

            // US Brokerage Documents
            'fidelity-statement': {
                weight: 1.0,
                patterns: [
                    { pattern: /Fidelity Investments/i, weight: 0.3 },
                    { pattern: /Account Statement/i, weight: 0.2 },
                    { pattern: /Brokerage Account/i, weight: 0.2 },
                    { pattern: /FMR LLC/i, weight: 0.15 },
                    { pattern: /Boston, MA/i, weight: 0.15 }
                ],
                keywords: ['fidelity', 'brokerage', 'statement'],
                structure: ['account summary', 'holdings', 'transactions']
            },

            'vanguard-statement': {
                weight: 1.0,
                patterns: [
                    { pattern: /The Vanguard Group/i, weight: 0.3 },
                    { pattern: /Vanguard Brokerage/i, weight: 0.25 },
                    { pattern: /Account Statement/i, weight: 0.2 },
                    { pattern: /Malvern, PA/i, weight: 0.15 },
                    { pattern: /Valley Forge/i, weight: 0.1 }
                ],
                keywords: ['vanguard', 'brokerage', 'statement'],
                structure: ['account', 'investments', 'performance']
            },

            'schwab-statement': {
                weight: 1.0,
                patterns: [
                    { pattern: /Charles Schwab/i, weight: 0.3 },
                    { pattern: /Schwab Brokerage/i, weight: 0.25 },
                    { pattern: /Account Statement/i, weight: 0.2 },
                    { pattern: /San Francisco, CA/i, weight: 0.15 },
                    { pattern: /Member SIPC/i, weight: 0.1 }
                ],
                keywords: ['schwab', 'charles', 'brokerage'],
                structure: ['positions', 'activity', 'summary']
            },

            // European Banking
            'deutsche-bank': {
                weight: 1.0,
                patterns: [
                    { pattern: /Deutsche Bank/i, weight: 0.3 },
                    { pattern: /DB Portfolio/i, weight: 0.25 },
                    { pattern: /Investment Report/i, weight: 0.2 },
                    { pattern: /DEUTDEFF/i, weight: 0.15 },
                    { pattern: /Frankfurt/i, weight: 0.1 }
                ],
                keywords: ['deutsche bank', 'db', 'frankfurt'],
                structure: ['portfolio', 'performance', 'allocation']
            },

            'bnp-paribas': {
                weight: 1.0,
                patterns: [
                    { pattern: /BNP Paribas/i, weight: 0.3 },
                    { pattern: /Wealth Management/i, weight: 0.25 },
                    { pattern: /Portfolio Statement/i, weight: 0.2 },
                    { pattern: /BNPAFRPP/i, weight: 0.15 },
                    { pattern: /Paris/i, weight: 0.1 }
                ],
                keywords: ['bnp paribas', 'wealth management', 'paris'],
                structure: ['patrimoine', 'performance', 'allocation']
            },

            // Generic Document Types
            'generic-portfolio': {
                weight: 0.8,
                patterns: [
                    { pattern: /Portfolio/i, weight: 0.25 },
                    { pattern: /Asset Allocation/i, weight: 0.25 },
                    { pattern: /Performance/i, weight: 0.2 },
                    { pattern: /Holdings/i, weight: 0.15 },
                    { pattern: /Investment/i, weight: 0.15 }
                ],
                keywords: ['portfolio', 'assets', 'performance', 'holdings'],
                structure: ['summary', 'holdings', 'performance']
            },

            'bank-statement': {
                weight: 0.8,
                patterns: [
                    { pattern: /Bank Statement/i, weight: 0.3 },
                    { pattern: /Account Statement/i, weight: 0.25 },
                    { pattern: /Transaction History/i, weight: 0.2 },
                    { pattern: /Balance/i, weight: 0.15 },
                    { pattern: /Deposits/i, weight: 0.1 }
                ],
                keywords: ['statement', 'transactions', 'balance', 'deposits'],
                structure: ['account info', 'transactions', 'summary']
            },

            'fund-report': {
                weight: 0.8,
                patterns: [
                    { pattern: /Fund Report/i, weight: 0.3 },
                    { pattern: /Mutual Fund/i, weight: 0.25 },
                    { pattern: /NAV/i, weight: 0.2 },
                    { pattern: /Expense Ratio/i, weight: 0.15 },
                    { pattern: /Prospectus/i, weight: 0.1 }
                ],
                keywords: ['fund', 'nav', 'expense ratio', 'prospectus'],
                structure: ['fund info', 'performance', 'holdings']
            }
        };
    }

    detectDocumentType(text) {
        console.log('🔍 Analyzing document for type detection...');
        
        const results = [];
        
        // Analyze each document type
        for (const [type, rules] of Object.entries(this.detectionRules)) {
            const score = this.calculateTypeScore(text, rules);
            results.push({
                type,
                score,
                confidence: score * rules.weight
            });
        }
        
        // Sort by confidence score
        results.sort((a, b) => b.confidence - a.confidence);
        
        const topResult = results[0];
        
        console.log(`📋 Document type analysis:`);
        results.slice(0, 3).forEach((result, index) => {
            console.log(`   ${index + 1}. ${result.type}: ${(result.confidence * 100).toFixed(1)}% confidence`);
        });
        
        // Return the best match if confidence is above threshold
        if (topResult.confidence >= this.confidenceThreshold) {
            console.log(`✅ Detected document type: ${topResult.type} (${(topResult.confidence * 100).toFixed(1)}% confidence)`);
            return {
                type: topResult.type,
                confidence: topResult.confidence,
                alternatives: results.slice(1, 3)
            };
        } else {
            console.log(`⚠️ Low confidence detection, using generic-financial (${(topResult.confidence * 100).toFixed(1)}% confidence)`);
            return {
                type: 'generic-financial',
                confidence: topResult.confidence,
                alternatives: results.slice(0, 3)
            };
        }
    }

    calculateTypeScore(text, rules) {
        let totalScore = 0;
        let maxPossibleScore = 0;
        
        // Check pattern matches
        for (const rule of rules.patterns) {
            maxPossibleScore += rule.weight;
            if (rule.pattern.test(text)) {
                totalScore += rule.weight;
            }
        }
        
        // Check keyword density
        const keywordScore = this.calculateKeywordScore(text, rules.keywords);
        totalScore += keywordScore * 0.2; // Keywords contribute 20% to total score
        maxPossibleScore += 0.2;
        
        // Check document structure
        const structureScore = this.calculateStructureScore(text, rules.structure);
        totalScore += structureScore * 0.1; // Structure contributes 10% to total score
        maxPossibleScore += 0.1;
        
        return maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
    }

    calculateKeywordScore(text, keywords) {
        const textLower = text.toLowerCase();
        let foundKeywords = 0;
        
        for (const keyword of keywords) {
            if (textLower.includes(keyword.toLowerCase())) {
                foundKeywords++;
            }
        }
        
        return keywords.length > 0 ? foundKeywords / keywords.length : 0;
    }

    calculateStructureScore(text, structureElements) {
        const textLower = text.toLowerCase();
        let foundElements = 0;
        
        for (const element of structureElements) {
            if (textLower.includes(element.toLowerCase())) {
                foundElements++;
            }
        }
        
        return structureElements.length > 0 ? foundElements / structureElements.length : 0;
    }

    getParserForType(documentType) {
        const parserMapping = {
            'messos-corner-banca': 'messos-corner-banca',
            'ubs-portfolio': 'generic-portfolio',
            'credit-suisse': 'generic-portfolio',
            'fidelity-statement': 'generic-portfolio',
            'vanguard-statement': 'generic-portfolio',
            'schwab-statement': 'generic-portfolio',
            'deutsche-bank': 'generic-portfolio',
            'bnp-paribas': 'generic-portfolio',
            'generic-portfolio': 'generic-portfolio',
            'bank-statement': 'generic-portfolio',
            'fund-report': 'generic-portfolio',
            'generic-financial': 'generic-portfolio'
        };
        
        return parserMapping[documentType] || 'generic-portfolio';
    }

    addLearningData(documentType, text, userFeedback) {
        // Store learning data for improving detection accuracy
        // This will be used by the learning system
        console.log(`📚 Learning data added for ${documentType}`);
        
        // In a full implementation, this would:
        // 1. Analyze user corrections
        // 2. Update detection patterns
        // 3. Improve confidence scoring
        // 4. Store training data for ML models
    }

    getDetectionSuggestions(text, detectionResult) {
        const suggestions = [];
        
        if (detectionResult.confidence < 0.8) {
            suggestions.push({
                type: 'low_confidence',
                message: `Document type detection confidence is ${(detectionResult.confidence * 100).toFixed(1)}%. Consider manual verification.`,
                alternatives: detectionResult.alternatives
            });
        }
        
        if (detectionResult.type === 'generic-financial') {
            suggestions.push({
                type: 'generic_fallback',
                message: 'Using generic financial parser. For better accuracy, consider adding this document type to the specialized parsers.',
                action: 'annotation_recommended'
            });
        }
        
        return suggestions;
    }
}

module.exports = { DocumentTypeDetector };
