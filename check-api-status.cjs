const fs = require('fs');
const path = require('path');

// Test if main API files exist and can be imported
const apiFiles = [
  'api/extract.js',
  'api/public-extract.js', 
  'api/true-100-percent-extractor.js',
  'api/bulletproof-processor.js',
  'api/max-plan-processor.js',
  'api/mcp-integration.js'
];

console.log('🔍 API FILE ANALYSIS:');
console.log('=====================================');

apiFiles.forEach(file => {
  try {
    const fullPath = path.join(__dirname, file);
    const exists = fs.existsSync(fullPath);
    if (exists) {
      const stats = fs.statSync(fullPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for common issues
      const issues = [];
      if (!content.includes('export default')) issues.push('Missing export default');
      if (content.includes('import') && !content.includes('createRequire')) {
        const hasProblematicImports = content.match(/import\s+.*\s+from\s+['\"](pdf-parse|@anthropic|@azure)/);
        if (hasProblematicImports) issues.push('Potentially problematic imports');
      }
      
      console.log(`✅ ${file}: EXISTS (${Math.round(stats.size/1024)}KB) - ${issues.length ? 'ISSUES: ' + issues.join(', ') : 'OK'}`);
    } else {
      console.log(`❌ ${file}: NOT FOUND`);
    }
  } catch (error) {
    console.log(`⚠️  ${file}: ERROR - ${error.message}`);
  }
});

// Check package.json dependencies
console.log('\n🔍 DEPENDENCY ANALYSIS:');
console.log('=====================================');

try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const deps = packageJson.dependencies || {};
  
  const criticalDeps = ['pdf-parse', '@anthropic-ai/sdk', '@azure/ai-form-recognizer', 'formidable'];
  
  criticalDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`✅ ${dep}: ${deps[dep]}`);
    } else {
      console.log(`❌ ${dep}: NOT INSTALLED`);
    }
  });
} catch (error) {
  console.log(`⚠️  package.json: ERROR - ${error.message}`);
}