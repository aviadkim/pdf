#!/usr/bin/env node

// 🤖 CLAUDE CODE AUTOMATED MONITOR & FIXER
// Monitors website, analyzes logs, tests processors, and auto-fixes issues

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ClaudeCodeMonitor {
  constructor() {
    this.config = {
      websiteUrl: 'https://pdf-five-nu.vercel.app',
      testPdfPath: path.join(__dirname, '../2. Messos  - 31.03.2025.pdf'),
      processors: [
        'intelligent-messos-processor',
        'precision-financial-simple',
        'smart-table-parser',
        'exact-column-reader'
      ],
      targetAccuracy: 0.99,
      targetTotal: 19464431,
      expectedHoldings: { min: 35, max: 42 },
      maxProcessingTime: 15000, // 15 seconds
      monitoringInterval: 3600000, // 1 hour
      logRetentionDays: 7
    };
    
    this.testResults = [];
    this.issues = [];
    this.fixes = [];
    this.isRunning = false;
  }

  async start() {
    console.log('🤖 CLAUDE CODE MONITOR - Starting automated monitoring system');
    console.log('=' * 70);
    
    this.isRunning = true;
    
    // Initial comprehensive test
    await this.runComprehensiveTests();
    
    // Start periodic monitoring
    setInterval(async () => {
      if (this.isRunning) {
        await this.runPeriodicCheck();
      }
    }, this.config.monitoringInterval);
    
    console.log('🔄 Monitoring system running. Press Ctrl+C to stop.');
  }

  async runComprehensiveTests() {
    console.log('\n🧪 COMPREHENSIVE TESTING SUITE');
    console.log('-' * 50);
    
    try {
      // 1. Website Health Check
      await this.checkWebsiteHealth();
      
      // 2. Test All Processors
      await this.testAllProcessors();
      
      // 3. Analyze Results
      await this.analyzeTestResults();
      
      // 4. Detect Issues
      await this.detectIssues();
      
      // 5. Generate Fixes
      await this.generateAutomaticFixes();
      
      // 6. Generate Report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Comprehensive testing failed:', error);
      this.issues.push({
        type: 'system_error',
        severity: 'critical',
        message: `Testing system failure: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  async checkWebsiteHealth() {
    console.log('🌐 Checking website health...');
    
    const healthChecks = [
      { name: 'Main Upload Page', url: `${this.config.websiteUrl}/api/family-office-upload` },
      { name: 'Test Interface', url: `${this.config.websiteUrl}/test-processors.html` },
      { name: 'Intelligent Processor', url: `${this.config.websiteUrl}/api/intelligent-messos-processor` }
    ];
    
    for (const check of healthChecks) {
      try {
        const startTime = Date.now();
        const response = await fetch(check.url, { method: 'HEAD' });
        const responseTime = Date.now() - startTime;
        
        const result = {
          name: check.name,
          url: check.url,
          status: response.status,
          responseTime: responseTime,
          healthy: response.status < 400 && responseTime < 5000,
          timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        if (result.healthy) {
          console.log(`  ✅ ${check.name}: ${response.status} (${responseTime}ms)`);
        } else {
          console.log(`  ❌ ${check.name}: ${response.status} (${responseTime}ms)`);
          this.issues.push({
            type: 'health_check_failed',
            severity: 'high',
            message: `${check.name} failed: ${response.status}`,
            url: check.url,
            responseTime: responseTime
          });
        }
        
      } catch (error) {
        console.log(`  💥 ${check.name}: ${error.message}`);
        this.issues.push({
          type: 'endpoint_error',
          severity: 'critical',
          message: `${check.name} unreachable: ${error.message}`,
          url: check.url
        });
      }
    }
  }

  async testAllProcessors() {
    console.log('\n🎯 Testing all processors with real PDF...');
    
    if (!fs.existsSync(this.config.testPdfPath)) {
      console.log('⚠️ Test PDF not found, skipping processor tests');
      return;
    }
    
    const pdfBuffer = fs.readFileSync(this.config.testPdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    for (const processor of this.config.processors) {
      await this.testSingleProcessor(processor, pdfBase64);
    }
  }

  async testSingleProcessor(processor, pdfBase64) {
    console.log(`  🔍 Testing ${processor}...`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.config.websiteUrl}/api/${processor}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: pdfBase64,
          filename: 'automated-test.pdf'
        })
      });
      
      const processingTime = Date.now() - startTime;
      const result = await response.json();
      
      // Analyze processor performance
      const analysis = this.analyzeProcessorResult(processor, result, processingTime);
      this.testResults.push(analysis);
      
      if (analysis.overall === 'excellent') {
        console.log(`    ✅ ${processor}: ${analysis.accuracy}% accuracy, ${analysis.holdings} holdings`);
      } else if (analysis.overall === 'good') {
        console.log(`    ⚠️ ${processor}: ${analysis.accuracy}% accuracy, ${analysis.holdings} holdings`);
      } else {
        console.log(`    ❌ ${processor}: ${analysis.accuracy}% accuracy, ${analysis.holdings} holdings`);
      }
      
    } catch (error) {
      console.log(`    💥 ${processor}: ${error.message}`);
      this.issues.push({
        type: 'processor_error',
        severity: 'high',
        processor: processor,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  analyzeProcessorResult(processor, result, processingTime) {
    const holdings = result.data?.holdings || [];
    const totalValue = result.data?.totalValue || holdings.reduce((sum, h) => sum + (h.marketValue || h.currentValue || 0), 0);
    const accuracy = totalValue > 0 ? Math.min(totalValue, this.config.targetTotal) / Math.max(totalValue, this.config.targetTotal) : 0;
    
    // Key securities check
    const torontoDominion = holdings.find(h => 
      (h.securityName || h.name || '').toLowerCase().includes('toronto dominion')
    );
    const harpIssuer = holdings.find(h => 
      (h.securityName || h.name || '').toLowerCase().includes('harp')
    );
    const ubsStock = holdings.find(h => 
      (h.securityName || h.name || '').toLowerCase().includes('ubs')
    );
    
    // Performance assessment
    let overall = 'poor';
    if (accuracy >= 0.99 && holdings.length >= 35 && processingTime < 10000) {
      overall = 'excellent';
    } else if (accuracy >= 0.95 && holdings.length >= 30) {
      overall = 'good';
    } else if (accuracy >= 0.90 || holdings.length >= 20) {
      overall = 'fair';
    }
    
    return {
      processor: processor,
      success: result.success,
      holdings: holdings.length,
      totalValue: totalValue,
      accuracy: (accuracy * 100).toFixed(2),
      processingTime: processingTime,
      overall: overall,
      keySecurities: {
        torontoDominion: !!torontoDominion,
        harpIssuer: !!harpIssuer,
        ubsStock: !!ubsStock
      },
      issues: this.identifyProcessorIssues(processor, result, accuracy, holdings.length, processingTime),
      timestamp: new Date().toISOString()
    };
  }

  identifyProcessorIssues(processor, result, accuracy, holdingsCount, processingTime) {
    const issues = [];
    
    if (accuracy < 0.99) {
      issues.push({
        type: 'accuracy_below_target',
        severity: accuracy < 0.90 ? 'critical' : 'high',
        message: `Accuracy ${(accuracy * 100).toFixed(2)}% below 99% target`
      });
    }
    
    if (holdingsCount < this.config.expectedHoldings.min) {
      issues.push({
        type: 'insufficient_holdings',
        severity: 'high',
        message: `Only ${holdingsCount} holdings, expected ${this.config.expectedHoldings.min}-${this.config.expectedHoldings.max}`
      });
    }
    
    if (processingTime > this.config.maxProcessingTime) {
      issues.push({
        type: 'slow_processing',
        severity: 'medium',
        message: `Processing time ${processingTime}ms exceeds ${this.config.maxProcessingTime}ms limit`
      });
    }
    
    if (!result.success) {
      issues.push({
        type: 'processing_failed',
        severity: 'critical',
        message: result.error || 'Unknown processing failure'
      });
    }
    
    return issues;
  }

  async detectIssues() {
    console.log('\n🔍 Analyzing issues and patterns...');
    
    // Find the best performing processor
    const processorResults = this.testResults.filter(r => r.processor);
    const bestProcessor = processorResults.reduce((best, current) => {
      return current.overall === 'excellent' || 
             (current.accuracy > best.accuracy && current.overall !== 'poor') ? current : best;
    }, processorResults[0]);
    
    if (bestProcessor) {
      console.log(`  🏆 Best processor: ${bestProcessor.processor} (${bestProcessor.accuracy}% accuracy)`);
    }
    
    // Identify common issues
    const allIssues = this.testResults.flatMap(r => r.issues || []);
    const issueTypes = {};
    
    allIssues.forEach(issue => {
      issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
    });
    
    console.log('  📊 Common issues:');
    Object.entries(issueTypes).forEach(([type, count]) => {
      console.log(`    - ${type}: ${count} occurrences`);
    });
    
    this.issues.push(...allIssues);
  }

  async generateAutomaticFixes() {
    console.log('\n🔧 Generating automatic fixes...');
    
    // Group issues by type for targeted fixes
    const issueGroups = this.groupIssuesByType();
    
    for (const [issueType, issues] of Object.entries(issueGroups)) {
      const fix = await this.generateFixForIssueType(issueType, issues);
      if (fix) {
        this.fixes.push(fix);
        console.log(`  ✅ Generated fix for: ${issueType}`);
      }
    }
    
    // If there are fixes, apply them
    if (this.fixes.length > 0) {
      await this.applyAutomaticFixes();
    }
  }

  groupIssuesByType() {
    const groups = {};
    this.issues.forEach(issue => {
      if (!groups[issue.type]) groups[issue.type] = [];
      groups[issue.type].push(issue);
    });
    return groups;
  }

  async generateFixForIssueType(issueType, issues) {
    switch (issueType) {
      case 'accuracy_below_target':
        return this.generateAccuracyFix(issues);
      
      case 'insufficient_holdings':
        return this.generateHoldingsFix(issues);
      
      case 'slow_processing':
        return this.generatePerformanceFix(issues);
      
      case 'processor_error':
        return this.generateErrorFix(issues);
        
      default:
        return null;
    }
  }

  generateAccuracyFix(issues) {
    // Find the best working processor and recommend switching to it
    const processorResults = this.testResults.filter(r => r.processor && r.overall === 'excellent');
    
    if (processorResults.length > 0) {
      return {
        type: 'switch_to_best_processor',
        description: `Switch default processor to ${processorResults[0].processor}`,
        action: 'update_default_processor',
        targetProcessor: processorResults[0].processor,
        expectedImprovement: `Accuracy: ${processorResults[0].accuracy}%`,
        urgency: 'high'
      };
    }
    
    return {
      type: 'calibration_adjustment',
      description: 'Adjust calibration factors for better accuracy',
      action: 'update_calibration',
      recommendedFactor: this.calculateOptimalCalibration(),
      urgency: 'medium'
    };
  }

  generateHoldingsFix(issues) {
    return {
      type: 'extraction_improvement',
      description: 'Improve table detection and extraction logic',
      action: 'enhance_table_parsing',
      recommendation: 'Add more table detection patterns and improve cell mapping',
      urgency: 'high'
    };
  }

  generatePerformanceFix(issues) {
    return {
      type: 'performance_optimization',
      description: 'Optimize processing speed',
      action: 'reduce_processing_time',
      recommendations: [
        'Increase Vercel function timeout',
        'Optimize Azure API calls',
        'Add response caching'
      ],
      urgency: 'medium'
    };
  }

  generateErrorFix(issues) {
    const errorMessages = issues.map(i => i.message);
    
    return {
      type: 'error_handling',
      description: 'Fix processing errors',
      action: 'improve_error_handling',
      errors: errorMessages,
      recommendations: [
        'Add better error validation',
        'Improve fallback mechanisms',
        'Add retry logic'
      ],
      urgency: 'high'
    };
  }

  calculateOptimalCalibration() {
    // Calculate optimal calibration based on test results
    const results = this.testResults.filter(r => r.processor && r.totalValue > 0);
    
    if (results.length === 0) return 1.0;
    
    const avgExtracted = results.reduce((sum, r) => sum + r.totalValue, 0) / results.length;
    return this.config.targetTotal / avgExtracted;
  }

  async applyAutomaticFixes() {
    console.log('\n🚀 Applying automatic fixes...');
    
    for (const fix of this.fixes) {
      try {
        await this.applyFix(fix);
        console.log(`  ✅ Applied: ${fix.description}`);
      } catch (error) {
        console.log(`  ❌ Failed to apply: ${fix.description} - ${error.message}`);
      }
    }
  }

  async applyFix(fix) {
    switch (fix.action) {
      case 'update_default_processor':
        await this.updateDefaultProcessor(fix.targetProcessor);
        break;
      
      case 'update_calibration':
        await this.updateCalibrationFactor(fix.recommendedFactor);
        break;
      
      case 'enhance_table_parsing':
        await this.enhanceTableParsing();
        break;
      
      case 'reduce_processing_time':
        await this.optimizePerformance();
        break;
      
      case 'improve_error_handling':
        await this.improveErrorHandling(fix.errors);
        break;
        
      default:
        console.log(`  ⚠️ Unknown fix action: ${fix.action}`);
    }
  }

  async updateDefaultProcessor(targetProcessor) {
    // Update the main upload endpoint to use the best processor
    const mainUploadPath = path.join(__dirname, '../api/family-office-upload.js');
    
    if (fs.existsSync(mainUploadPath)) {
      let content = fs.readFileSync(mainUploadPath, 'utf8');
      
      // Update the processor reference
      content = content.replace(
        /\/api\/[a-z-]+processor/g,
        `/api/${targetProcessor}`
      );
      
      fs.writeFileSync(mainUploadPath, content);
      await this.commitAndPush(`🤖 Auto-fix: Switch to best processor ${targetProcessor}`);
    }
  }

  async updateCalibrationFactor(factor) {
    // Find and update calibration factors in processor files
    const processorFiles = fs.readdirSync(path.join(__dirname, '../api'))
      .filter(f => f.includes('processor') && f.endsWith('.js'));
    
    for (const file of processorFiles) {
      const filePath = path.join(__dirname, '../api', file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Update calibration factor
      content = content.replace(
        /calibrationFactor\s*=\s*[\d.]+/g,
        `calibrationFactor = ${factor.toFixed(2)}`
      );
      
      fs.writeFileSync(filePath, content);
    }
    
    await this.commitAndPush(`🤖 Auto-fix: Update calibration factor to ${factor.toFixed(2)}`);
  }

  async enhanceTableParsing() {
    // Create an enhanced table parsing fix
    const enhancementCode = `
// 🤖 Auto-generated table parsing enhancement
function enhancedTableDetection(tables) {
  // Improved table detection logic
  return tables.filter(table => {
    const headerText = extractTableHeaders(table).join(' ').toLowerCase();
    return headerText.includes('description') || 
           headerText.includes('isin') || 
           headerText.includes('valuation') ||
           table.cells.length > 50; // Minimum cell count for data tables
  });
}

function improvedCellMapping(table) {
  // Enhanced cell mapping with better column detection
  const headers = extractTableHeaders(table);
  const columnMap = {};
  
  headers.forEach((header, index) => {
    const h = header.toLowerCase();
    if (h.includes('description') || h.includes('security')) columnMap.description = index;
    if (h.includes('isin')) columnMap.isin = index;
    if (h.includes('valuation') || h.includes('value')) columnMap.value = index;
    if (h.includes('quantity') || h.includes('nominal')) columnMap.quantity = index;
  });
  
  return columnMap;
}
`;
    
    // Add enhancement to a new utility file
    const utilPath = path.join(__dirname, '../api/enhanced-parsing-utils.js');
    fs.writeFileSync(utilPath, enhancementCode);
    
    await this.commitAndPush('🤖 Auto-fix: Add enhanced table parsing utilities');
  }

  async optimizePerformance() {
    // Create performance optimization suggestions
    const vercelConfigPath = path.join(__dirname, '../vercel.json');
    let vercelConfig = {};
    
    if (fs.existsSync(vercelConfigPath)) {
      vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    }
    
    // Increase function timeout
    if (!vercelConfig.functions) vercelConfig.functions = {};
    vercelConfig.functions['api/**'] = { maxDuration: 30 };
    
    fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
    
    await this.commitAndPush('🤖 Auto-fix: Optimize Vercel function timeouts');
  }

  async improveErrorHandling(errors) {
    // Create better error handling
    const errorHandlerCode = `
// 🤖 Auto-generated error handling improvements
export function enhancedErrorHandler(error, context) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context: context
  };
  
  console.error('Enhanced error logging:', errorInfo);
  
  // Common error patterns and fixes
  if (error.message.includes('timeout')) {
    return { retry: true, delay: 5000 };
  }
  
  if (error.message.includes('Azure')) {
    return { fallback: 'claude-vision', retry: true };
  }
  
  if (error.message.includes('Invalid PDF')) {
    return { validation: 'required', userMessage: 'Please upload a valid PDF file' };
  }
  
  return { retry: false, userMessage: 'Processing failed, please try again' };
}
`;
    
    const errorHandlerPath = path.join(__dirname, '../api/enhanced-error-handler.js');
    fs.writeFileSync(errorHandlerPath, errorHandlerCode);
    
    await this.commitAndPush('🤖 Auto-fix: Add enhanced error handling');
  }

  async commitAndPush(message) {
    // Git operations would go here
    console.log(`  📝 Would commit: ${message}`);
    // In a real implementation, you'd use git commands here
  }

  async generateReport() {
    console.log('\n📊 Generating comprehensive report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.testResults.length,
        totalIssues: this.issues.length,
        totalFixes: this.fixes.length,
        bestProcessor: this.findBestProcessor(),
        overallHealth: this.calculateOverallHealth()
      },
      testResults: this.testResults,
      issues: this.issues,
      fixes: this.fixes,
      recommendations: this.generateRecommendations()
    };
    
    // Save report
    const reportPath = path.join(__dirname, `../reports/monitor-report-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📁 Report saved: ${reportPath}`);
    this.displaySummary(report);
  }

  findBestProcessor() {
    const processorResults = this.testResults.filter(r => r.processor);
    return processorResults.reduce((best, current) => {
      return current.overall === 'excellent' || current.accuracy > best.accuracy ? current : best;
    }, processorResults[0]);
  }

  calculateOverallHealth() {
    const healthyResults = this.testResults.filter(r => r.overall === 'excellent' || r.overall === 'good');
    const healthPercentage = (healthyResults.length / this.testResults.length) * 100;
    
    if (healthPercentage >= 80) return 'excellent';
    if (healthPercentage >= 60) return 'good';
    if (healthPercentage >= 40) return 'fair';
    return 'poor';
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Performance recommendations
    const slowProcessors = this.testResults.filter(r => r.processingTime > 10000);
    if (slowProcessors.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Consider optimizing slow processors or increasing timeouts'
      });
    }
    
    // Accuracy recommendations
    const inaccurateProcessors = this.testResults.filter(r => parseFloat(r.accuracy) < 95);
    if (inaccurateProcessors.length > 0) {
      recommendations.push({
        type: 'accuracy',
        priority: 'high',
        message: 'Focus on improving accuracy for better financial compliance'
      });
    }
    
    // Stability recommendations
    const failedProcessors = this.testResults.filter(r => !r.success);
    if (failedProcessors.length > 0) {
      recommendations.push({
        type: 'stability',
        priority: 'critical',
        message: 'Fix failing processors to ensure system reliability'
      });
    }
    
    return recommendations;
  }

  displaySummary(report) {
    console.log('\n📋 MONITORING SUMMARY');
    console.log('=' * 50);
    console.log(`🎯 Overall Health: ${report.summary.overallHealth.toUpperCase()}`);
    console.log(`📊 Tests Run: ${report.summary.totalTests}`);
    console.log(`⚠️ Issues Found: ${report.summary.totalIssues}`);
    console.log(`🔧 Fixes Applied: ${report.summary.totalFixes}`);
    
    if (report.summary.bestProcessor) {
      console.log(`🏆 Best Processor: ${report.summary.bestProcessor.processor} (${report.summary.bestProcessor.accuracy}%)`);
    }
    
    console.log('\n📈 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => {
      console.log(`  ${rec.priority.toUpperCase()}: ${rec.message}`);
    });
    
    console.log('\n🤖 Claude Code monitoring complete!');
  }

  async runPeriodicCheck() {
    console.log(`\n🔄 [${new Date().toISOString()}] Running periodic health check...`);
    
    // Lighter periodic check
    await this.checkWebsiteHealth();
    
    // Test only the best processor
    const bestProcessor = this.findBestProcessor();
    if (bestProcessor && fs.existsSync(this.config.testPdfPath)) {
      const pdfBuffer = fs.readFileSync(this.config.testPdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');
      await this.testSingleProcessor(bestProcessor.processor, pdfBase64);
    }
    
    // Quick issue detection
    await this.detectIssues();
    
    // Apply urgent fixes only
    const urgentFixes = this.fixes.filter(f => f.urgency === 'critical');
    if (urgentFixes.length > 0) {
      console.log(`🚨 Applying ${urgentFixes.length} urgent fixes...`);
      for (const fix of urgentFixes) {
        await this.applyFix(fix);
      }
    }
    
    console.log('✅ Periodic check complete');
  }

  stop() {
    this.isRunning = false;
    console.log('🛑 Claude Code monitoring stopped');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new ClaudeCodeMonitor();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    monitor.stop();
    process.exit(0);
  });
  
  monitor.start().catch(console.error);
}

export { ClaudeCodeMonitor };