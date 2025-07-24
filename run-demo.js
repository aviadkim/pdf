#!/usr/bin/env node

/**
 * QUICK DEMO RUNNER
 * 
 * Simple script to run the Mistral OCR demonstration
 * with proper error handling and setup
 */

const MistralOCRDemonstration = require('./mistral-ocr-demonstration.js');

async function runDemo() {
    console.log('🚀 Starting Mistral OCR Demonstration...');
    console.log('====================================');
    
    const demo = new MistralOCRDemonstration();
    
    try {
        await demo.runFullDemonstration();
        console.log('\n✅ Demo completed successfully!');
    } catch (error) {
        console.error('\n❌ Demo failed:', error.message);
        process.exit(1);
    }
}

runDemo();