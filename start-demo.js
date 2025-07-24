#!/usr/bin/env node

/**
 * START DEMO - PDF Perfect Extractor
 * Launch the web interface for testing
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import open from 'open';

const execAsync = promisify(exec);

console.log('🎯 PDF Perfect Extractor Demo Launcher');
console.log('====================================\n');

async function startDemo() {
    try {
        console.log('🚀 Starting PDF Perfect Extractor web interface...');
        console.log('🌐 Server will be available at: http://localhost:3000');
        console.log('📄 Upload your PDF file to test Swiss formatting extraction');
        console.log('🇨🇭 Expected results: Toronto $199,080 | Canadian $200,288');
        console.log('🔍 Real-time logging and debug console included');
        console.log('🎯 Target accuracy: 98.4% with MCP Context 7\n');
        
        // Start the web server
        console.log('Starting web server...');
        const serverProcess = exec('node web-server.js', (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Server error:', error);
                return;
            }
            if (stderr) {
                console.error('Server stderr:', stderr);
            }
            console.log('Server stdout:', stdout);
        });
        
        // Wait a moment for server to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Open browser
        console.log('🌐 Opening browser...');
        await open('http://localhost:3000');
        
        console.log('✅ Demo launched successfully!');
        console.log('📋 Instructions:');
        console.log('1. Upload your PDF file (drag & drop or click)');
        console.log('2. Click "Process PDF Document" button');
        console.log('3. Watch real-time logs in the debug console');
        console.log('4. See results with Swiss formatting accuracy');
        console.log('5. Check for Toronto ($199,080) and Canadian ($200,288) values');
        console.log('\n🔧 Press Ctrl+C to stop the server');
        
        // Keep the process running
        process.stdin.resume();
        
    } catch (error) {
        console.error('❌ Demo launch failed:', error.message);
        console.log('\n🔧 Manual start instructions:');
        console.log('1. Run: node web-server.js');
        console.log('2. Open: http://localhost:3000');
        console.log('3. Upload PDF and test');
    }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping PDF Perfect Extractor demo...');
    console.log('✅ Demo stopped successfully');
    process.exit(0);
});

startDemo().catch(console.error);