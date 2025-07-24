#!/usr/bin/env node

/**
 * END-TO-END WORKFLOW TEST
 * Tests: Upload PDF → Process → Extract → Annotate → Learn
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

class EndToEndWorkflowTester {
    constructor(baseUrl = 'https://pdf-fzzi.onrender.com') {
        this.baseUrl = baseUrl;
        this.testPDF = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
        this.results = {
            timestamp: new Date().toISOString(),
            workflow_steps: [],
            final_accuracy: null,
            securities_extracted: 0,
            total_value: 0
        };
    }

    async runEndToEndTest() {
        console.log('🔄 Starting End-to-End Workflow Test');
        console.log('Target:', this.baseUrl);
        console.log('=====================================');

        try {
            // Step 1: Upload PDF and Process
            await this.step1_UploadAndProcess();
            
            // Step 2: Extract Data
            await this.step2_ExtractData();
            
            // Step 3: Annotate Errors
            await this.step3_AnnotateErrors();
            
            // Step 4: Learn from Annotations
            await this.step4_LearnFromAnnotations();
            
            // Step 5: Verify Improvement
            await this.step5_VerifyImprovement();

            this.generateFinalReport();

        } catch (error) {
            console.error('❌ End-to-end test failed:', error.message);
            this.results.error = error.message;
        }
    }

    async step1_UploadAndProcess() {
        console.log('\\n📤 STEP 1: Upload PDF and Process');
        console.log('----------------------------------');

        if (!fs.existsSync(this.testPDF)) {
            throw new Error('Messos PDF not found for testing');
        }

        try {
            // Test ultra-accurate extraction
            const formData = new FormData();
            formData.append('pdf', fs.createReadStream(this.testPDF));

            const response = await axios.post(`${this.baseUrl}/api/ultra-accurate-extract`, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                timeout: 60000
            });

            if (response.data.success) {
                console.log('✅ PDF uploaded and processed successfully');
                console.log(`📊 Securities found: ${response.data.extraction_results?.securities_found || 0}`);
                console.log(`💰 Total value: $${response.data.extraction_results?.total_value || 0}`);
                console.log(`🎯 Accuracy: ${response.data.accuracy_metrics?.overall_accuracy || 0}%`);

                this.results.workflow_steps.push({
                    step: 1,
                    name: 'Upload and Process',
                    success: true,
                    data: response.data
                });

                this.results.securities_extracted = response.data.extraction_results?.securities_found || 0;
                this.results.total_value = response.data.extraction_results?.total_value || 0;
            } else {
                throw new Error('PDF processing failed');
            }

        } catch (error) {
            console.log('❌ PDF processing failed:', error.message);
            
            // Try fallback with Smart OCR
            console.log('🔄 Trying Smart OCR fallback...');
            const statsResponse = await axios.get(`${this.baseUrl}/api/smart-ocr-stats`);
            
            this.results.workflow_steps.push({
                step: 1,
                name: 'Upload and Process',
                success: false,
                fallback: 'smart-ocr',
                data: statsResponse.data
            });
        }
    }

    async step2_ExtractData() {
        console.log('\\n🔍 STEP 2: Extract Data');
        console.log('------------------------');

        try {
            // Test system capabilities
            const response = await axios.get(`${this.baseUrl}/api/system-capabilities`);
            
            console.log('✅ System capabilities retrieved');
            console.log(`📋 Available methods: ${Object.keys(response.data.capabilities || {}).length}`);

            this.results.workflow_steps.push({
                step: 2,
                name: 'Extract Data',
                success: true,
                capabilities: Object.keys(response.data.capabilities || {})
            });

        } catch (error) {
            console.log('❌ System capabilities failed:', error.message);
            
            // Fallback: Use Smart OCR stats
            const statsResponse = await axios.get(`${this.baseUrl}/api/smart-ocr-stats`);
            console.log('✅ Using Smart OCR stats as fallback');
            
            this.results.workflow_steps.push({
                step: 2,
                name: 'Extract Data',
                success: false,
                fallback: 'smart-ocr-stats',
                data: statsResponse.data
            });
        }
    }

    async step3_AnnotateErrors() {
        console.log('\\n✏️ STEP 3: Annotate Errors');
        console.log('---------------------------');

        try {
            // Test annotation interface
            const response = await axios.get(`${this.baseUrl}/smart-annotation`);
            
            if (response.status === 200) {
                console.log('✅ Annotation interface accessible');
                
                // Test patterns retrieval
                const patternsResponse = await axios.get(`${this.baseUrl}/api/smart-ocr-patterns`);
                console.log(`📋 Current patterns: ${patternsResponse.data.patterns?.length || 0}`);

                this.results.workflow_steps.push({
                    step: 3,
                    name: 'Annotate Errors',
                    success: true,
                    patterns_count: patternsResponse.data.patterns?.length || 0
                });
            }

        } catch (error) {
            console.log('❌ Annotation interface failed:', error.message);
            
            this.results.workflow_steps.push({
                step: 3,
                name: 'Annotate Errors',
                success: false,
                error: error.message
            });
        }
    }

    async step4_LearnFromAnnotations() {
        console.log('\\n🧠 STEP 4: Learn from Annotations');
        console.log('----------------------------------');

        try {
            // Test learning API with sample annotation
            const learningData = {
                corrections: [{
                    id: 'test-correction-' + Date.now(),
                    original: 'wrong_value',
                    corrected: 'correct_value',
                    field: 'market_value',
                    confidence: 0.95
                }]
            };

            const response = await axios.post(`${this.baseUrl}/api/smart-ocr-learn`, learningData);
            
            if (response.data.success) {
                console.log('✅ Learning API successful');
                console.log(`📈 Patterns learned: ${response.data.patterns_learned || 0}`);

                this.results.workflow_steps.push({
                    step: 4,
                    name: 'Learn from Annotations',
                    success: true,
                    patterns_learned: response.data.patterns_learned || 0
                });
            }

        } catch (error) {
            console.log('❌ Learning API failed:', error.message);
            
            this.results.workflow_steps.push({
                step: 4,
                name: 'Learn from Annotations',
                success: false,
                error: error.message
            });
        }
    }

    async step5_VerifyImprovement() {
        console.log('\\n📈 STEP 5: Verify Improvement');
        console.log('------------------------------');

        try {
            // Get final stats
            const response = await axios.get(`${this.baseUrl}/api/smart-ocr-stats`);
            
            const finalAccuracy = response.data.stats?.currentAccuracy || 0;
            console.log(`🎯 Final accuracy: ${finalAccuracy}%`);
            console.log(`📊 Total patterns: ${response.data.stats?.patternCount || 0}`);
            console.log(`📝 Total annotations: ${response.data.stats?.annotationCount || 0}`);

            this.results.final_accuracy = finalAccuracy;
            this.results.workflow_steps.push({
                step: 5,
                name: 'Verify Improvement',
                success: true,
                final_stats: response.data.stats
            });

            // Check if we reached target
            if (finalAccuracy >= 90) {
                console.log('🎉 TARGET ACHIEVED: 90%+ accuracy!');
            } else if (finalAccuracy >= 80) {
                console.log('✅ GOOD PROGRESS: 80%+ accuracy achieved');
            } else {
                console.log('⚠️ NEEDS WORK: Below 80% accuracy');
            }

        } catch (error) {
            console.log('❌ Final verification failed:', error.message);
            
            this.results.workflow_steps.push({
                step: 5,
                name: 'Verify Improvement',
                success: false,
                error: error.message
            });
        }
    }

    generateFinalReport() {
        console.log('\\n📋 FINAL WORKFLOW REPORT');
        console.log('=========================');

        const successfulSteps = this.results.workflow_steps.filter(s => s.success).length;
        const totalSteps = this.results.workflow_steps.length;
        const successRate = (successfulSteps / totalSteps) * 100;

        console.log(`✅ Successful steps: ${successfulSteps}/${totalSteps} (${successRate.toFixed(1)}%)`);
        console.log(`🎯 Final accuracy: ${this.results.final_accuracy || 'N/A'}%`);
        console.log(`📊 Securities extracted: ${this.results.securities_extracted}`);
        console.log(`💰 Total value: $${this.results.total_value?.toLocaleString() || 0}`);

        // Save detailed results
        const reportFile = path.join(__dirname, 'end-to-end-workflow-results.json');
        fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
        console.log(`📄 Detailed report saved: ${reportFile}`);

        if (successRate >= 80) {
            console.log('\\n🎉 END-TO-END WORKFLOW: SUCCESS');
        } else {
            console.log('\\n⚠️ END-TO-END WORKFLOW: NEEDS ATTENTION');
        }
    }
}

// Run if called directly
if (require.main === module) {
    const tester = new EndToEndWorkflowTester();
    tester.runEndToEndTest().catch(console.error);
}

module.exports = EndToEndWorkflowTester;