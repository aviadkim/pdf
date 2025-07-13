#!/usr/bin/env node

// 📊 LOG ANALYSIS UTILITY
// Analyzes Vercel and application logs for issues

import fs from 'fs';
import path from 'path';

class LogAnalyzer {
  constructor() {
    this.patterns = {
      errors: [
        /ERROR:/i,
        /FAILED:/i,
        /Exception:/i,
        /timeout/i,
        /memory/i,
        /crash/i
      ],
      performance: [
        /processing time: (\d+)ms/i,
        /response time: (\d+)ms/i,
        /memory usage: (\d+)mb/i
      ],
      accuracy: [
        /accuracy: ([\d.]+)%/i,
        /total value: \$?([\d,]+)/i,
        /holdings: (\d+)/i
      ]
    };
  }

  async analyzeRecentLogs() {
    console.log('📊 Analyzing recent logs...');
    
    const logDir = 'automation/logs';
    const logFiles = fs.readdirSync(logDir)
      .filter(f => f.endsWith('.log'))
      .sort()
      .slice(-5); // Last 5 log files
    
    const analysis = {
      errors: [],
      performance: [],
      accuracy: [],
      trends: {}
    };
    
    for (const file of logFiles) {
      const content = fs.readFileSync(path.join(logDir, file), 'utf8');
      this.analyzeLogContent(content, analysis);
    }
    
    this.generateInsights(analysis);
    return analysis;
  }

  analyzeLogContent(content, analysis) {
    const lines = content.split('\n');
    
    lines.forEach(line => {
      // Check for errors
      this.patterns.errors.forEach(pattern => {
        if (pattern.test(line)) {
          analysis.errors.push({
            message: line.trim(),
            timestamp: this.extractTimestamp(line)
          });
        }
      });
      
      // Check for performance metrics
      this.patterns.performance.forEach(pattern => {
        const match = line.match(pattern);
        if (match) {
          analysis.performance.push({
            metric: pattern.source.split(':')[0],
            value: parseInt(match[1]),
            timestamp: this.extractTimestamp(line)
          });
        }
      });
      
      // Check for accuracy metrics
      this.patterns.accuracy.forEach(pattern => {
        const match = line.match(pattern);
        if (match) {
          analysis.accuracy.push({
            metric: pattern.source.split(':')[0],
            value: parseFloat(match[1].replace(/,/g, '')),
            timestamp: this.extractTimestamp(line)
          });
        }
      });
    });
  }

  extractTimestamp(line) {
    const timestampMatch = line.match(/\[([\d-T:.Z]+)\]/);
    return timestampMatch ? timestampMatch[1] : new Date().toISOString();
  }

  generateInsights(analysis) {
    console.log('\n🔍 LOG ANALYSIS INSIGHTS');
    console.log('========================');
    
    console.log(`📊 Errors Found: ${analysis.errors.length}`);
    if (analysis.errors.length > 0) {
      console.log('Recent errors:');
      analysis.errors.slice(-3).forEach(error => {
        console.log(`  - ${error.message}`);
      });
    }
    
    const avgProcessingTime = this.calculateAverage(
      analysis.performance.filter(p => p.metric.includes('processing'))
    );
    if (avgProcessingTime > 0) {
      console.log(`⏱️ Average Processing Time: ${avgProcessingTime.toFixed(0)}ms`);
    }
    
    const recentAccuracy = analysis.accuracy
      .filter(a => a.metric.includes('accuracy'))
      .slice(-1)[0];
    if (recentAccuracy) {
      console.log(`🎯 Latest Accuracy: ${recentAccuracy.value}%`);
    }
  }

  calculateAverage(metrics) {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new LogAnalyzer();
  analyzer.analyzeRecentLogs().catch(console.error);
}

export { LogAnalyzer };
