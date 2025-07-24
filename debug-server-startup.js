#!/usr/bin/env node

/**
 * DEBUG SERVER STARTUP
 * 
 * Add debug logging to smart-ocr-learning-system.js to see what's happening
 */

const fs = require('fs');

async function addDebugLogging() {
    console.log('🔧 ADDING DEBUG LOGGING TO SERVER');
    console.log('===================================');

    const smartOCRPath = './smart-ocr-learning-system.js';
    
    try {
        let content = fs.readFileSync(smartOCRPath, 'utf8');
        
        // Check if debug logging is already added
        if (content.includes('DEBUG: Environment variables')) {
            console.log('⚠️ Debug logging already present');
            return;
        }
        
        // Add debug logging right after the constructor starts
        const originalConstructor = `    constructor() {
        // Core configuration
        this.config = {
            mistralApiKey: process.env.MISTRAL_API_KEY,`;
            
        const debugConstructor = `    constructor() {
        // DEBUG: Environment variables
        console.log('🔍 MISTRAL DEBUG: Constructor starting');
        console.log('🔍 MISTRAL DEBUG: process.env.MISTRAL_API_KEY =', process.env.MISTRAL_API_KEY ? 'SET' : 'NOT SET');
        console.log('🔍 MISTRAL DEBUG: process.env.NODE_ENV =', process.env.NODE_ENV);
        console.log('🔍 MISTRAL DEBUG: process.env.PORT =', process.env.PORT);
        
        // Core configuration
        this.config = {
            mistralApiKey: process.env.MISTRAL_API_KEY,`;
        
        // Replace the constructor
        content = content.replace(originalConstructor, debugConstructor);
        
        // Add debug logging to getStats method
        const originalGetStats = `    getStats() {
        return {
            currentAccuracy: this.getCurrentAccuracy(),
            patternCount: this.getPatternCount(),
            documentCount: this.getDocumentCount(),
            annotationCount: this.getAnnotationCount(),
            accuracyGain: this.getAccuracyGain(),
            confidenceScore: this.getConfidenceScore(),
            learningRate: this.getLearningRate(),
            mistralEnabled: !!this.config.mistralApiKey,
            targetAccuracy: this.config.targetAccuracy
        };
    }`;
    
        const debugGetStats = `    getStats() {
        // DEBUG: getStats called
        console.log('🔍 MISTRAL DEBUG: getStats() called');
        console.log('🔍 MISTRAL DEBUG: this.config.mistralApiKey =', this.config.mistralApiKey ? 'SET' : 'NOT SET');
        console.log('🔍 MISTRAL DEBUG: !!this.config.mistralApiKey =', !!this.config.mistralApiKey);
        
        return {
            currentAccuracy: this.getCurrentAccuracy(),
            patternCount: this.getPatternCount(),
            documentCount: this.getDocumentCount(),
            annotationCount: this.getAnnotationCount(),
            accuracyGain: this.getAccuracyGain(),
            confidenceScore: this.getConfidenceScore(),
            learningRate: this.getLearningRate(),
            mistralEnabled: !!this.config.mistralApiKey,
            targetAccuracy: this.config.targetAccuracy
        };
    }`;
        
        content = content.replace(originalGetStats, debugGetStats);
        
        // Write the updated file
        fs.writeFileSync(smartOCRPath, content);
        
        console.log('✅ Debug logging added successfully');
        console.log('📋 Added debug logs to:');
        console.log('  - Constructor (environment variable reading)');
        console.log('  - getStats() method (mistralEnabled calculation)');
        
        return true;
        
    } catch (error) {
        console.error('❌ Failed to add debug logging:', error.message);
        return false;
    }
}

async function commitDebugVersion() {
    console.log('\n🚀 COMMITTING DEBUG VERSION');
    console.log('============================');
    
    console.log('This debug version will show in the server logs:');
    console.log('1. 🔍 What environment variables are available at startup');
    console.log('2. 🔍 What this.config.mistralApiKey contains');
    console.log('3. 🔍 What mistralEnabled evaluates to');
    
    console.log('\n📋 DEPLOYMENT PLAN:');
    console.log('===================');
    console.log('1. Commit this debug version');
    console.log('2. Deploy to Render');
    console.log('3. Check Render logs for debug output');
    console.log('4. Identify exactly what\'s wrong with environment variables');
    console.log('5. Fix the issue and remove debug logging');
}

if (require.main === module) {
    addDebugLogging()
        .then((success) => {
            if (success) {
                return commitDebugVersion();
            }
        })
        .catch(console.error);
}

module.exports = { addDebugLogging };