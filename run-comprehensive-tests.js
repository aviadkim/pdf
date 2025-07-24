#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configurations
const TESTS = [
    {
        name: 'Production API Tests',
        command: 'node',
        args: ['comprehensive-production-tests.js'],
        timeout: 600000 // 10 minutes
    },
    {
        name: 'Playwright Annotation Tests',
        command: 'npx',
        args: ['playwright', 'test', 'tests/playwright-annotation-tests.spec.js', '--reporter=html'],
        timeout: 300000 // 5 minutes
    },
    {
        name: 'Puppeteer Processing Tests',
        command: 'node',
        args: ['puppeteer-processing-tests.js'],
        timeout: 600000 // 10 minutes
    },
    {
        name: 'Load Testing Suite',
        command: 'node',
        args: ['load-testing-suite.js'],
        timeout: 900000 // 15 minutes
    }
];

// Results tracking
const testResults = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {
        totalTests: TESTS.length,
        passed: 0,
        failed: 0,
        skipped: 0
    }
};

function logResult(testName, status, details = {}) {
    testResults.tests[testName] = {
        status,
        timestamp: new Date().toISOString(),
        ...details
    };
    
    if (status === 'passed') {
        testResults.summary.passed++;
        console.log(`✅ ${testName}: PASSED`);
    } else if (status === 'failed') {
        testResults.summary.failed++;
        console.log(`❌ ${testName}: FAILED`);
    } else if (status === 'skipped') {
        testResults.summary.skipped++;
        console.log(`⏭️  ${testName}: SKIPPED`);
    }
    
    if (details.error) {
        console.error(`   Error: ${details.error}`);
    }
    if (details.duration) {
        console.log(`   Duration: ${(details.duration / 1000).toFixed(2)}s`);
    }
}

function runTest(test) {
    return new Promise((resolve) => {
        console.log(`\n🚀 Starting: ${test.name}`);
        console.log(`   Command: ${test.command} ${test.args.join(' ')}`);
        
        const startTime = Date.now();
        
        const child = spawn(test.command, test.args, {
            stdio: 'inherit',
            shell: true,
            cwd: process.cwd()
        });
        
        const timeoutId = setTimeout(() => {
            child.kill('SIGTERM');
            const duration = Date.now() - startTime;
            logResult(test.name, 'failed', {
                error: `Test timed out after ${test.timeout}ms`,
                duration
            });
            resolve();
        }, test.timeout);
        
        child.on('close', (code) => {
            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;
            
            if (code === 0) {
                logResult(test.name, 'passed', { duration });
            } else {
                logResult(test.name, 'failed', {
                    error: `Process exited with code ${code}`,
                    duration
                });
            }
            resolve();
        });
        
        child.on('error', (error) => {
            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;
            logResult(test.name, 'failed', {
                error: error.message,
                duration
            });
            resolve();
        });
    });
}

async function checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    const checks = [
        {
            name: 'Node.js',
            check: () => process.version,
            required: true
        },
        {
            name: 'npm packages',
            check: () => fs.existsSync('node_modules'),
            required: true
        },
        {
            name: 'Playwright',
            check: () => fs.existsSync('node_modules/@playwright/test'),
            required: false
        },
        {
            name: 'Test PDF',
            check: () => fs.existsSync('Messos_Anlagestiftung_Full_Report.pdf'),
            required: false
        }
    ];
    
    let canProceed = true;
    
    for (const check of checks) {
        try {
            const result = check.check();
            if (result) {
                console.log(`   ✅ ${check.name}: Available`);
            } else {
                console.log(`   ${check.required ? '❌' : '⚠️ '} ${check.name}: ${check.required ? 'Missing (required)' : 'Missing (optional)'}`);
                if (check.required) canProceed = false;
            }
        } catch (error) {
            console.log(`   ${check.required ? '❌' : '⚠️ '} ${check.name}: ${check.required ? 'Error (required)' : 'Error (optional)'}`);
            if (check.required) canProceed = false;
        }
    }
    
    if (!canProceed) {
        console.log('\n❌ Cannot proceed - missing required prerequisites');
        console.log('   Please run: npm install');
        process.exit(1);
    }
    
    return true;
}

async function generateFinalReport() {
    // Ensure results directory exists
    const resultsDir = path.join(__dirname, 'test-results');
    fs.mkdirSync(resultsDir, { recursive: true });
    
    // Save detailed JSON report
    const reportPath = path.join(resultsDir, `comprehensive-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    
    // Generate HTML report
    const htmlReport = `<!DOCTYPE html>
<html>
<head>
    <title>Comprehensive Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .test-result { margin: 10px 0; padding: 15px; border-radius: 8px; }
        .test-passed { background: #d4edda; border-left: 4px solid #28a745; }
        .test-failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .test-skipped { background: #fff3cd; border-left: 4px solid #ffc107; }
        .details { margin-top: 10px; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PDF Processing System - Comprehensive Test Report</h1>
        <p><strong>Target:</strong> https://pdf-fzzi.onrender.com</p>
        <p><strong>Test Date:</strong> ${testResults.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <p style="font-size: 2em; margin: 0;">${testResults.summary.totalTests}</p>
        </div>
        <div class="metric">
            <h3 class="passed">Passed</h3>
            <p style="font-size: 2em; margin: 0;" class="passed">${testResults.summary.passed}</p>
        </div>
        <div class="metric">
            <h3 class="failed">Failed</h3>
            <p style="font-size: 2em; margin: 0;" class="failed">${testResults.summary.failed}</p>
        </div>
        <div class="metric">
            <h3 class="skipped">Skipped</h3>
            <p style="font-size: 2em; margin: 0;" class="skipped">${testResults.summary.skipped}</p>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <p style="font-size: 2em; margin: 0;">${((testResults.summary.passed / testResults.summary.totalTests) * 100).toFixed(1)}%</p>
        </div>
    </div>
    
    <h2>Test Results</h2>
    ${Object.entries(testResults.tests).map(([name, result]) => `
        <div class="test-result test-${result.status}">
            <h3>${name}</h3>
            <p><strong>Status:</strong> ${result.status.toUpperCase()}</p>
            ${result.duration ? `<p><strong>Duration:</strong> ${(result.duration / 1000).toFixed(2)}s</p>` : ''}
            ${result.error ? `<div class="details"><strong>Error:</strong> ${result.error}</div>` : ''}
        </div>
    `).join('')}
    
    <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <h3>Next Steps</h3>
        <ul>
            ${testResults.summary.failed > 0 ? 
                '<li>🔍 Review failed tests and check server logs</li>' : 
                '<li>✅ All tests passed - system is functioning correctly</li>'
            }
            <li>📊 Check individual test reports in the test-results directory</li>
            <li>🚀 Consider running tests on a schedule for continuous monitoring</li>
        </ul>
    </div>
</body>
</html>`;
    
    const htmlReportPath = path.join(resultsDir, `comprehensive-test-report-${Date.now()}.html`);
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    // Print final summary
    console.log('\n' + '='.repeat(80));
    console.log('COMPREHENSIVE TEST SUITE - FINAL SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${testResults.summary.totalTests}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Skipped: ${testResults.summary.skipped}`);
    console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.totalTests) * 100).toFixed(2)}%`);
    console.log(`\nDetailed Reports:`);
    console.log(`  JSON: ${reportPath}`);
    console.log(`  HTML: ${htmlReportPath}`);
    console.log(`  Screenshots: ${resultsDir}`);
    console.log('='.repeat(80));
    
    return testResults.summary.failed === 0;
}

// Main execution
async function main() {
    console.log('🧪 Comprehensive Testing Suite for PDF Processing System');
    console.log('Target: https://pdf-fzzi.onrender.com');
    console.log('='.repeat(80));
    
    try {
        // Check prerequisites
        await checkPrerequisites();
        
        // Run all tests sequentially
        for (const test of TESTS) {
            await runTest(test);
        }
        
        // Generate final report
        const allPassed = await generateFinalReport();
        
        // Exit with appropriate code
        process.exit(allPassed ? 0 : 1);
        
    } catch (error) {
        console.error('Fatal error running comprehensive tests:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Test suite interrupted by user');
    process.exit(130);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Test suite terminated');
    process.exit(143);
});

// Run the tests
main();