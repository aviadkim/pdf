#!/usr/bin/env node

// 🧪 AUTOMATED TEST RUNNER
// Runs comprehensive tests and generates reports

import { ClaudeCodeMonitor } from './claude-code-monitor.js';
import { LogAnalyzer } from './analyze-logs.js';
import { VercelLogFetcher } from './fetch-vercel-logs.js';
import { AutoFixGenerator } from './auto-fix-generator.js';

async function runComprehensiveTests() {
  console.log('🧪 RUNNING COMPREHENSIVE AUTOMATED TESTS');
  console.log('==========================================');
  
  try {
    // 1. Run monitoring tests
    const monitor = new ClaudeCodeMonitor();
    await monitor.runComprehensiveTests();
    
    // 2. Analyze existing logs
    const logAnalyzer = new LogAnalyzer();
    const logAnalysis = await logAnalyzer.analyzeRecentLogs();
    
    // 3. Fetch Vercel logs
    const vercelFetcher = new VercelLogFetcher();
    await vercelFetcher.fetchRecentLogs();
    
    // 4. Generate automated fixes
    const fixGenerator = new AutoFixGenerator();
    const fixes = await fixGenerator.generateFixesFromAnalysis(logAnalysis);
    
    // 5. Apply critical fixes
    const criticalFixes = fixes.filter(f => f.priority === 'high');
    for (const fix of criticalFixes) {
      await fixGenerator.applyFix(fix);
    }
    
    console.log('\n✅ Comprehensive testing complete!');
    console.log(`📊 Generated ${fixes.length} fixes, applied ${criticalFixes.length} critical fixes`);
    
  } catch (error) {
    console.error('❌ Testing failed:', error);
  }
}

// Run tests
runComprehensiveTests().catch(console.error);
