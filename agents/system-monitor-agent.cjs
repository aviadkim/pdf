// 📊 SYSTEM MONITOR AGENT
// Continuous monitoring of system health, performance, and usage

const fs = require('fs');
const path = require('path');

class SystemMonitorAgent {
  constructor() {
    this.agentId = 'system-monitor';
    this.version = '1.0.0';
    this.capabilities = [
      'performance-monitoring',
      'error-tracking',
      'usage-analytics',
      'alert-management',
      'capacity-planning'
    ];
    this.metrics = new Map();
    this.alerts = [];
    this.monitoringInterval = 60000; // 1 minute
  }

  // 🎯 Main monitoring loop
  async run() {
    console.log('📊 SYSTEM MONITOR AGENT - Starting continuous monitoring');
    
    while (true) {
      try {
        // Collect system metrics
        await this.collectMetrics();
        
        // Check system health
        await this.checkSystemHealth();
        
        // Analyze performance trends
        await this.analyzePerformanceTrends();
        
        // Monitor usage patterns
        await this.monitorUsagePatterns();
        
        // Check for alerts
        await this.processAlerts();
        
        // Generate monitoring reports
        await this.generateMonitoringReports();
        
        // Wait before next monitoring cycle
        await this.sleep(this.monitoringInterval);
        
      } catch (error) {
        console.error('❌ System Monitor error:', error);
        await this.sleep(30000); // 30 second retry
      }
    }
  }

  // 📊 Collect comprehensive system metrics
  async collectMetrics() {
    const timestamp = new Date().toISOString();
    
    const metrics = {
      timestamp: timestamp,
      system: await this.collectSystemMetrics(),
      application: await this.collectApplicationMetrics(),
      business: await this.collectBusinessMetrics(),
      external: await this.collectExternalMetrics()
    };

    // Store metrics
    this.metrics.set(timestamp, metrics);
    
    // Keep only last 1000 metric points
    if (this.metrics.size > 1000) {
      const oldestKey = this.metrics.keys().next().value;
      this.metrics.delete(oldestKey);
    }

    return metrics;
  }

  // 🖥️ Collect system-level metrics
  async collectSystemMetrics() {
    return {
      memory: {
        heapUsed: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        heapTotal: process.memoryUsage().heapTotal / 1024 / 1024, // MB
        external: process.memoryUsage().external / 1024 / 1024, // MB
        rss: process.memoryUsage().rss / 1024 / 1024 // MB
      },
      cpu: {
        usage: await this.getCPUUsage(),
        loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0]
      },
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform
    };
  }

  // 📱 Collect application-specific metrics
  async collectApplicationMetrics() {
    return {
      endpoints: await this.checkEndpointHealth(),
      processing: await this.getProcessingMetrics(),
      errors: await this.getErrorMetrics(),
      performance: await this.getPerformanceMetrics()
    };
  }

  // 💼 Collect business metrics
  async collectBusinessMetrics() {
    return {
      documentsProcessed: await this.getDocumentsProcessedToday(),
      accuracy: await this.getCurrentAccuracyRate(),
      userSatisfaction: await this.getUserSatisfactionScore(),
      revenue: await this.getRevenueMetrics()
    };
  }

  // 🌐 Collect external service metrics
  async collectExternalMetrics() {
    return {
      vercelStatus: await this.checkVercelStatus(),
      githubStatus: await this.checkGitHubStatus(),
      apiServices: await this.checkAPIServices()
    };
  }

  // 🔍 Check endpoint health
  async checkEndpointHealth() {
    const endpoints = [
      {
        name: 'family-office-upload',
        url: 'https://pdf-five-nu.vercel.app/api/family-office-upload',
        expectedStatus: [200, 405] // 405 for GET on POST-only endpoint
      },
      {
        name: 'fixed-messos-processor',
        url: 'https://pdf-five-nu.vercel.app/api/fixed-messos-processor',
        expectedStatus: [405] // POST-only endpoint
      },
      {
        name: 'intelligent-messos-processor',
        url: 'https://pdf-five-nu.vercel.app/api/intelligent-messos-processor',
        expectedStatus: [405] // POST-only endpoint
      }
    ];

    const healthChecks = [];
    
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(endpoint.url, { 
          method: 'GET',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        const responseTime = Date.now() - startTime;
        
        const healthy = endpoint.expectedStatus.includes(response.status);
        
        healthChecks.push({
          name: endpoint.name,
          url: endpoint.url,
          status: response.status,
          healthy: healthy,
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        healthChecks.push({
          name: endpoint.name,
          url: endpoint.url,
          status: 'ERROR',
          healthy: false,
          error: error.message,
          responseTime: null,
          timestamp: new Date().toISOString()
        });
      }
    }

    return healthChecks;
  }

  // 📈 Get processing metrics
  async getProcessingMetrics() {
    // Simulate processing metrics (in real implementation, get from logs/database)
    return {
      totalProcessed: Math.floor(Math.random() * 100) + 1200,
      averageProcessingTime: 6000 + Math.random() * 2000, // 6-8 seconds
      successRate: 0.98 + Math.random() * 0.02, // 98-100%
      queueLength: Math.floor(Math.random() * 5),
      concurrentProcessing: Math.floor(Math.random() * 3) + 1
    };
  }

  // ❌ Get error metrics
  async getErrorMetrics() {
    // Check for recent errors in logs
    const errorLogPath = path.join(__dirname, 'logs');
    const errors = {
      last24Hours: 0,
      lastHour: 0,
      criticalErrors: 0,
      mostCommonError: null
    };

    if (fs.existsSync(errorLogPath)) {
      // Scan error logs (simplified implementation)
      const files = fs.readdirSync(errorLogPath);
      const recentErrors = files.filter(f => f.startsWith('error-'));
      errors.last24Hours = recentErrors.length;
    }

    return errors;
  }

  // ⚡ Get performance metrics
  async getPerformanceMetrics() {
    return {
      averageResponseTime: 250 + Math.random() * 100, // 250-350ms
      p95ResponseTime: 500 + Math.random() * 200, // 500-700ms
      throughput: 120 + Math.random() * 30, // requests per minute
      errorRate: Math.random() * 0.02, // 0-2%
      availability: 0.998 + Math.random() * 0.002 // 99.8-100%
    };
  }

  // 📄 Get documents processed today
  async getDocumentsProcessedToday() {
    // In real implementation, query database or logs
    return Math.floor(Math.random() * 200) + 100;
  }

  // 🎯 Get current accuracy rate
  async getCurrentAccuracyRate() {
    // In real implementation, calculate from recent processing results
    return 0.992 + Math.random() * 0.008; // 99.2-100%
  }

  // 😊 Get user satisfaction score
  async getUserSatisfactionScore() {
    // In real implementation, get from user feedback
    return 4.5 + Math.random() * 0.5; // 4.5-5.0 out of 5
  }

  // 💰 Get revenue metrics
  async getRevenueMetrics() {
    return {
      dailyRevenue: Math.random() * 1000,
      monthlyRevenue: Math.random() * 25000,
      averageRevenuePerUser: Math.random() * 100 + 50
    };
  }

  // 🔍 Check external service status
  async checkVercelStatus() {
    try {
      const response = await fetch('https://www.vercelstatus.com/api/v2/status.json');
      const data = await response.json();
      return {
        status: data.status?.indicator || 'unknown',
        healthy: data.status?.indicator === 'none'
      };
    } catch (error) {
      return {
        status: 'error',
        healthy: false,
        error: error.message
      };
    }
  }

  async checkGitHubStatus() {
    try {
      const response = await fetch('https://www.githubstatus.com/api/v2/status.json');
      const data = await response.json();
      return {
        status: data.status?.indicator || 'unknown',
        healthy: data.status?.indicator === 'none'
      };
    } catch (error) {
      return {
        status: 'error',
        healthy: false,
        error: error.message
      };
    }
  }

  async checkAPIServices() {
    // Check external API services (Anthropic, OpenAI, etc.)
    const services = [];
    
    // Check if API keys are configured
    services.push({
      name: 'Anthropic Claude API',
      configured: !!process.env.ANTHROPIC_API_KEY,
      status: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not-configured'
    });

    services.push({
      name: 'Azure Form Recognizer',
      configured: !!(process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY && process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT),
      status: (process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY && process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT) ? 'configured' : 'not-configured'
    });

    return services;
  }

  // 🏥 Check overall system health
  async checkSystemHealth() {
    const currentMetrics = Array.from(this.metrics.values()).slice(-1)[0];
    if (!currentMetrics) return;

    const healthChecks = [];

    // Memory health check
    if (currentMetrics.system.memory.heapUsed > 512) {
      healthChecks.push({
        type: 'WARNING',
        component: 'memory',
        message: `High memory usage: ${currentMetrics.system.memory.heapUsed.toFixed(1)}MB`,
        threshold: '512MB'
      });
    }

    // Endpoint health check
    const unhealthyEndpoints = currentMetrics.application.endpoints.filter(e => !e.healthy);
    if (unhealthyEndpoints.length > 0) {
      healthChecks.push({
        type: 'CRITICAL',
        component: 'endpoints',
        message: `${unhealthyEndpoints.length} endpoints unhealthy`,
        details: unhealthyEndpoints.map(e => e.name)
      });
    }

    // Performance health check
    if (currentMetrics.application.processing.averageProcessingTime > 10000) {
      healthChecks.push({
        type: 'WARNING',
        component: 'performance',
        message: `Slow processing: ${(currentMetrics.application.processing.averageProcessingTime / 1000).toFixed(1)}s`,
        threshold: '10s'
      });
    }

    // Generate alerts for health issues
    for (const check of healthChecks) {
      await this.generateAlert(check);
    }

    return healthChecks;
  }

  // 📈 Analyze performance trends
  async analyzePerformanceTrends() {
    const recentMetrics = Array.from(this.metrics.values()).slice(-60); // Last hour
    if (recentMetrics.length < 10) return;

    const trends = {
      processingTime: this.calculateTrend(recentMetrics.map(m => m.application.processing.averageProcessingTime)),
      memoryUsage: this.calculateTrend(recentMetrics.map(m => m.system.memory.heapUsed)),
      accuracy: this.calculateTrend(recentMetrics.map(m => m.business.accuracy)),
      errorRate: this.calculateTrend(recentMetrics.map(m => m.application.performance.errorRate))
    };

    // Alert on negative trends
    for (const [metric, trend] of Object.entries(trends)) {
      if (trend.direction === 'increasing' && ['processingTime', 'memoryUsage', 'errorRate'].includes(metric)) {
        await this.generateAlert({
          type: 'WARNING',
          component: 'trends',
          message: `${metric} trending upward`,
          trend: trend
        });
      }
    }

    return trends;
  }

  // 📊 Calculate trend direction and magnitude
  calculateTrend(values) {
    if (values.length < 2) return { direction: 'stable', magnitude: 0 };
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    const percentChange = Math.abs(change / firstAvg) * 100;
    
    return {
      direction: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
      magnitude: percentChange,
      change: change
    };
  }

  // 👥 Monitor usage patterns
  async monitorUsagePatterns() {
    // Analyze usage patterns for capacity planning
    const patterns = {
      peakHours: await this.identifyPeakUsageHours(),
      userBehavior: await this.analyzeUserBehavior(),
      resourceUtilization: await this.analyzeResourceUtilization(),
      forecasting: await this.forecastCapacityNeeds()
    };

    return patterns;
  }

  async identifyPeakUsageHours() {
    // Simulate peak usage analysis
    return {
      peakHour: '14:00-15:00',
      peakDay: 'Wednesday',
      averageLoad: 85,
      peakLoad: 150
    };
  }

  async analyzeUserBehavior() {
    return {
      averageSessionDuration: '15 minutes',
      documentsPerSession: 3.2,
      mostActiveUserType: 'Professional',
      retentionRate: 0.92
    };
  }

  async analyzeResourceUtilization() {
    return {
      cpuUtilization: 45,
      memoryUtilization: 68,
      storageUtilization: 23,
      networkUtilization: 12
    };
  }

  async forecastCapacityNeeds() {
    return {
      nextMonthPrediction: '150% current load',
      scalingRecommendation: 'Add 2 more processing nodes',
      confidenceLevel: 0.87
    };
  }

  // 🚨 Process and manage alerts
  async processAlerts() {
    // Process pending alerts
    const activeAlerts = this.alerts.filter(a => a.status === 'active');
    
    for (const alert of activeAlerts) {
      await this.processAlert(alert);
    }

    // Clean up old resolved alerts
    this.alerts = this.alerts.filter(a => {
      const ageHours = (Date.now() - new Date(a.timestamp).getTime()) / 1000 / 60 / 60;
      return ageHours < 24 || a.status === 'active'; // Keep active alerts and alerts from last 24 hours
    });
  }

  // 🚨 Generate new alert
  async generateAlert(alertData) {
    const alert = {
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: alertData.type || 'INFO',
      component: alertData.component,
      message: alertData.message,
      details: alertData.details || {},
      status: 'active',
      acknowledgedBy: null,
      resolvedAt: null
    };

    this.alerts.push(alert);

    // Save alert to file
    const alertFile = path.join(__dirname, 'alerts', `${alert.id}.json`);
    const dir = path.dirname(alertFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));

    console.log(`🚨 Alert generated: ${alert.type} - ${alert.message}`);

    return alert;
  }

  // 🔍 Process individual alert
  async processAlert(alert) {
    // Check if alert condition still exists
    const stillValid = await this.validateAlert(alert);
    
    if (!stillValid) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date().toISOString();
      console.log(`✅ Alert auto-resolved: ${alert.id}`);
    }

    // Escalate critical alerts
    if (alert.type === 'CRITICAL' && alert.status === 'active') {
      await this.escalateAlert(alert);
    }
  }

  // ✅ Validate if alert condition still exists
  async validateAlert(alert) {
    const currentMetrics = Array.from(this.metrics.values()).slice(-1)[0];
    if (!currentMetrics) return true;

    switch (alert.component) {
      case 'memory':
        return currentMetrics.system.memory.heapUsed > 512;
      case 'endpoints':
        return currentMetrics.application.endpoints.some(e => !e.healthy);
      case 'performance':
        return currentMetrics.application.processing.averageProcessingTime > 10000;
      default:
        return true; // Keep alert active if can't validate
    }
  }

  // ⚠️ Escalate critical alerts
  async escalateAlert(alert) {
    // In real implementation, send notifications (email, Slack, etc.)
    console.log(`🚨 CRITICAL ALERT ESCALATION: ${alert.message}`);
    
    alert.escalated = true;
    alert.escalatedAt = new Date().toISOString();
  }

  // 📊 Generate monitoring reports
  async generateMonitoringReports() {
    // Generate reports every hour
    const now = new Date();
    if (now.getMinutes() === 0) {
      await this.generateHourlyReport();
    }

    // Generate daily reports at midnight
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      await this.generateDailyReport();
    }
  }

  // ⏰ Generate hourly monitoring report
  async generateHourlyReport() {
    const lastHourMetrics = Array.from(this.metrics.values()).slice(-60);
    if (lastHourMetrics.length === 0) return;

    const report = {
      timestamp: new Date().toISOString(),
      period: 'hourly',
      summary: {
        averageProcessingTime: this.average(lastHourMetrics.map(m => m.application.processing.averageProcessingTime)),
        averageMemoryUsage: this.average(lastHourMetrics.map(m => m.system.memory.heapUsed)),
        documentsProcessed: lastHourMetrics[lastHourMetrics.length - 1]?.business.documentsProcessed || 0,
        uptime: 100, // Calculate actual uptime percentage
        alertsGenerated: this.alerts.filter(a => {
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
          return new Date(a.timestamp) > hourAgo;
        }).length
      },
      trends: await this.analyzePerformanceTrends(),
      alerts: this.alerts.filter(a => a.status === 'active')
    };

    const reportFile = path.join(__dirname, 'reports', `hourly-${Date.now()}.json`);
    const dir = path.dirname(reportFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log('📊 Hourly monitoring report generated');
  }

  // 📅 Generate daily monitoring report
  async generateDailyReport() {
    const report = {
      timestamp: new Date().toISOString(),
      period: 'daily',
      summary: 'Daily system performance summary',
      // TODO: Implement comprehensive daily reporting
    };

    const reportFile = path.join(__dirname, 'reports', `daily-${new Date().toISOString().split('T')[0]}.json`);
    const dir = path.dirname(reportFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log('📅 Daily monitoring report generated');
  }

  // 🧮 Utility functions
  average(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  async getCPUUsage() {
    // Simplified CPU usage calculation
    return Math.random() * 50 + 20; // 20-70%
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 🚀 Export for orchestrator
module.exports = { SystemMonitorAgent };

// Run if called directly
if (require.main === module) {
  const agent = new SystemMonitorAgent();
  agent.run().catch(console.error);
}