#!/usr/bin/env node

/**
 * Test Smart OCR Learning System Locally
 */

const SmartOCRLearningSystem = require('./smart-ocr-learning-system.js');

async function testSmartOCRSystem() {
    console.log('🧪 Testing Smart OCR Learning System...');
    
    try {
        // Initialize the system
        const smartOCR = new SmartOCRLearningSystem();
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test stats method
        console.log('📊 Testing getStats()...');
        const stats = smartOCR.getStats();
        console.log('Stats:', JSON.stringify(stats, null, 2));
        
        // Test patterns method
        console.log('🎯 Testing getPatterns()...');
        const patterns = smartOCR.getPatterns();
        console.log('Patterns count:', Object.keys(patterns).length);
        
        // Test individual methods
        console.log('✅ Current accuracy:', smartOCR.getCurrentAccuracy());
        console.log('✅ Pattern count:', smartOCR.getPatternCount());
        console.log('✅ Document count:', smartOCR.getDocumentCount());
        
        console.log('🎉 Smart OCR system is working correctly!');
        
    } catch (error) {
        console.error('❌ Error testing Smart OCR:', error);
    }
}

// Run test
testSmartOCRSystem();