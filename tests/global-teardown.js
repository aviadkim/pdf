// Global Teardown for Playwright Tests
// Cleanup after all tests have completed

async function globalTeardown() {
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Starting Phase 3 PDF Platform Test Suite Teardown');
  
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    // Read test configuration
    const testResultsDir = path.resolve('test-results');
    const configPath = path.join(testResultsDir, 'test-config.json');
    
    let testConfig = {};
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      testConfig = JSON.parse(configData);
    }
    
    // Generate test summary report
    console.log('📄 Generating test summary report...');
    
    const testSummary = {
      testSuiteCompleted: new Date().toISOString(),
      testDuration: testConfig.serverStartTime ? 
        Date.now() - testConfig.serverStartTime : null,
      testResultsDirectory: testResultsDir,
      generatedFiles: [],
      cleanup: {
        screenshotsPreserved: true,
        configFilesPreserved: true,
        serverStopped: true
      }
    };
    
    // List generated files
    if (fs.existsSync(testResultsDir)) {
      const files = fs.readdirSync(testResultsDir);
      testSummary.generatedFiles = files;
      console.log(`📁 Generated ${files.length} test result files`);
    }
    
    // Create final summary
    const summaryPath = path.join(testResultsDir, 'test-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(testSummary, null, 2));
    
    // Display test completion information
    console.log('📊 Test Summary:');
    console.log(`   Duration: ${testSummary.testDuration ? 
      Math.round(testSummary.testDuration / 1000) + 's' : 'Unknown'}`);
    console.log(`   Results: ${testResultsDir}`);
    console.log(`   Files: ${testSummary.generatedFiles.length} generated`);
    
    // List key result files
    const keyFiles = testSummary.generatedFiles.filter(file => 
      file.includes('baseline') || 
      file.includes('results') || 
      file.includes('summary')
    );
    
    if (keyFiles.length > 0) {
      console.log('\n🗺️  Key Result Files:');
      keyFiles.forEach(file => {
        console.log(`   - ${file}`);
      });
    }
    
    // Performance metrics if available
    const metricsFiles = testSummary.generatedFiles.filter(file => 
      file.includes('metrics') || file.includes('performance')
    );
    
    if (metricsFiles.length > 0) {
      console.log('\n📈 Performance Metrics Available:');
      metricsFiles.forEach(file => {
        console.log(`   - ${file}`);
      });
    }
    
    // Check for any error logs
    const errorFiles = testSummary.generatedFiles.filter(file => 
      file.includes('error') || file.includes('failed')
    );
    
    if (errorFiles.length > 0) {
      console.log('\n⚠️  Error Files Found:');
      errorFiles.forEach(file => {
        console.log(`   - ${file}`);
      });
    }
    
    // Cleanup recommendations
    console.log('\n🧹 Cleanup Recommendations:');
    console.log('   - Screenshots saved for visual comparison');
    console.log('   - Test results preserved for analysis');
    console.log('   - Server logs available for debugging');
    
    // Next steps
    console.log('\n🚀 Next Steps:');
    console.log('   - Review test results in playwright-report/');
    console.log('   - Check screenshots for visual regressions');
    console.log('   - Analyze performance metrics if available');
    
    if (errorFiles.length > 0) {
      console.log('   - Investigate error files for issues');
    }
    
    console.log('\n✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('\n❌ Global teardown error:', error.message);
    console.log('   - Manual cleanup may be required');
    console.log('   - Check test-results/ directory for artifacts');
  }
  
  console.log('=' .repeat(50));
  console.log('🎉 Phase 3 PDF Platform Test Suite Complete\n');
}

export default globalTeardown;