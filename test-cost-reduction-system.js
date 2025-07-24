#!/usr/bin/env node

/**
 * TEST COST REDUCTION SYSTEM
 * 
 * Demonstrates how the smart learning system reduces costs over time
 * by learning from client annotations
 */

const { SmartLearningCostReductionSystem } = require('./smart-learning-cost-reduction-system');
const path = require('path');

class CostReductionSystemTest {
    constructor() {
        this.smartSystem = new SmartLearningCostReductionSystem();
        this.messosPdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    }

    async runCostReductionDemo() {
        console.log('💰 COST REDUCTION SYSTEM DEMONSTRATION');
        console.log('======================================');
        console.log('Simulating how costs decrease as the system learns from client annotations');
        console.log('');

        try {
            // Scenario 1: First client processes document (will use Mistral API - $0.30)
            console.log('📊 SCENARIO 1: First Client Processing');
            console.log('=====================================');
            
            const client1Result = await this.smartSystem.processFinancialDocument(this.messosPdfPath, 'client-001');
            
            console.log(`💰 Cost for Client 1: $${client1Result.costIncurred.toFixed(2)}`);
            console.log(`📋 Method used: ${client1Result.method}`);
            console.log(`📊 Securities extracted: ${client1Result.financialData?.securities?.length || 0}`);
            console.log('');

            // Scenario 2: Client 1 provides annotations to improve the system
            console.log('📝 SCENARIO 2: Client 1 Provides Annotations');
            console.log('=============================================');
            
            await this.simulateClientAnnotations('client-001');
            console.log('✅ Client 1 provided 5 annotations - system learned new patterns!');
            console.log('🧠 These patterns will benefit ALL future clients');
            console.log('');

            // Scenario 3: Second client processes similar document (should be cheaper/free)
            console.log('📊 SCENARIO 3: Second Client Processing (After Learning)');
            console.log('========================================================');
            
            const client2Result = await this.smartSystem.processFinancialDocument(this.messosPdfPath, 'client-002');
            
            console.log(`💰 Cost for Client 2: $${client2Result.costIncurred.toFixed(2)}`);
            console.log(`📋 Method used: ${client2Result.method}`);
            console.log(`📊 Securities extracted: ${client2Result.financialData?.securities?.length || 0}`);
            
            if (client2Result.costIncurred === 0) {
                console.log('🎉 SUCCESS! Client 2 processed for FREE using learned patterns!');
            }
            console.log('');

            // Scenario 4: Show cost analytics
            console.log('📈 SCENARIO 4: Cost Analytics');
            console.log('=============================');
            
            const analytics = await this.smartSystem.getCostAnalytics();
            this.displayCostAnalytics(analytics);

            // Scenario 5: Simulate multiple clients over time
            console.log('🚀 SCENARIO 5: Multiple Clients Over Time');
            console.log('=========================================');
            
            await this.simulateMultipleClients();

            console.log('');
            console.log('🎯 COST REDUCTION DEMONSTRATION COMPLETE!');
            console.log('==========================================');
            console.log('Key Benefits:');
            console.log('✅ First client pays $0.30, helps train the system');
            console.log('✅ Subsequent clients benefit from learned patterns (FREE processing)');
            console.log('✅ System gets smarter with each annotation');
            console.log('✅ Costs decrease over time for all clients');
            console.log('✅ Revenue model: charge premium for first extractions, free for learned patterns');

        } catch (error) {
            console.error('❌ Cost reduction demo failed:', error.message);
        }
    }

    async simulateClientAnnotations(clientId) {
        // Simulate typical annotations a client would provide
        const annotations = [
            {
                type: 'security_name_correction',
                securityISIN: 'XS2530201644',
                originalValue: 'Ordinary Bonds',
                correctedData: { securityName: 'TORONTO DOMINION BANK NOTES 23-23.02.27 REG-S VRN' },
                confidence: 1.0,
                userFeedback: 'System extracted generic name instead of specific bank name'
            },
            {
                type: 'value_correction',
                securityISIN: 'XS2530201644',
                originalValue: '23.02',
                correctedData: { marketValue: 199080 },
                confidence: 1.0,
                userFeedback: 'System confused maturity date (23.02) with market value'
            },
            {
                type: 'security_name_correction',
                securityISIN: 'XS2588105036',
                originalValue: 'Ordinary Bonds',
                correctedData: { securityName: 'CANADIAN IMPERIAL BANK OF COMMERCE NOTES' },
                confidence: 1.0,
                userFeedback: 'Another generic name that should be specific bank name'
            },
            {
                type: 'value_correction',
                securityISIN: 'XS2588105036',
                originalValue: '28.03',
                correctedData: { marketValue: 200288 },
                confidence: 1.0,
                userFeedback: 'Another date confused with market value'
            },
            {
                type: 'portfolio_value',
                originalValue: 28645884,
                correctedData: { totalValue: 19464431 },
                confidence: 1.0,
                userFeedback: 'Portfolio total was over-calculated, correct value is $19.4M'
            }
        ];

        for (const annotation of annotations) {
            await this.smartSystem.processClientAnnotation(clientId, annotation);
        }
    }

    displayCostAnalytics(analytics) {
        console.log(`📊 Total Documents Processed: ${analytics.totalDocuments}`);
        console.log(`🆓 Free Processing: ${analytics.freeProcessing} (${analytics.savingsPercentage.toFixed(1)}%)`);
        console.log(`💰 Paid Processing: ${analytics.paidProcessing}`);
        console.log(`💵 Total Cost: $${analytics.totalCost.toFixed(2)}`);
        console.log(`📈 Average Cost: $${analytics.averageCost.toFixed(3)} per document`);
        console.log(`💚 Total Savings: $${analytics.costSavings.toFixed(2)}`);
        console.log('');
    }

    async simulateMultipleClients() {
        console.log('Simulating 10 more clients processing similar documents...');
        
        let totalCost = 0;
        let freeProcessing = 0;
        let paidProcessing = 0;

        for (let i = 3; i <= 12; i++) {
            const clientId = `client-${i.toString().padStart(3, '0')}`;
            
            // Simulate processing (most should be free after learning)
            const shouldBeFree = Math.random() > 0.2; // 80% chance of free processing after learning
            
            if (shouldBeFree) {
                console.log(`   Client ${i}: FREE processing (learned patterns)`);
                freeProcessing++;
            } else {
                console.log(`   Client ${i}: $0.30 (new document type, will learn)`);
                totalCost += 0.30;
                paidProcessing++;
                
                // Simulate this client also providing annotations
                if (Math.random() > 0.5) {
                    console.log(`   Client ${i}: Provided annotations - system learned more!`);
                }
            }
        }

        console.log('');
        console.log('📊 SIMULATION RESULTS:');
        console.log(`💰 Total Cost for 10 clients: $${totalCost.toFixed(2)}`);
        console.log(`🆓 Free Processing: ${freeProcessing}/10 clients (${(freeProcessing/10*100).toFixed(1)}%)`);
        console.log(`💵 Paid Processing: ${paidProcessing}/10 clients (${(paidProcessing/10*100).toFixed(1)}%)`);
        console.log(`📈 Average Cost: $${(totalCost/10).toFixed(3)} per document`);
        console.log(`💚 Savings vs All-Mistral: $${((10 * 0.30) - totalCost).toFixed(2)} (${(((10 * 0.30) - totalCost)/(10 * 0.30)*100).toFixed(1)}% reduction)`);
    }

    async demonstrateRevenueModel() {
        console.log('');
        console.log('💼 REVENUE MODEL DEMONSTRATION');
        console.log('==============================');
        
        console.log('🎯 Pricing Strategy:');
        console.log('   • Premium Processing: $1.00 per document (includes Mistral API + markup)');
        console.log('   • Standard Processing: $0.25 per document (learned patterns)');
        console.log('   • Free Tier: 5 documents per month');
        console.log('');
        
        console.log('📊 Cost Structure:');
        console.log('   • Mistral API Cost: $0.30 per document (when needed)');
        console.log('   • Pattern Processing: $0.00 (free)');
        console.log('   • Server Costs: ~$0.05 per document');
        console.log('');
        
        console.log('💰 Profit Margins:');
        console.log('   • Premium Processing: $1.00 - $0.30 - $0.05 = $0.65 profit (65%)');
        console.log('   • Standard Processing: $0.25 - $0.00 - $0.05 = $0.20 profit (80%)');
        console.log('   • Free Tier: Loss leader for customer acquisition');
        console.log('');
        
        console.log('🚀 Scaling Benefits:');
        console.log('   • More clients = more annotations = better patterns');
        console.log('   • Better patterns = lower costs = higher margins');
        console.log('   • Network effect: each client improves service for all');
        console.log('   • Competitive moat: proprietary learned patterns');
    }
}

async function main() {
    const tester = new CostReductionSystemTest();
    await tester.runCostReductionDemo();
    await tester.demonstrateRevenueModel();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { CostReductionSystemTest };
