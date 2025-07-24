/**
 * MONITORING SETUP
 * Comprehensive monitoring and observability system for production deployment
 * 
 * Features:
 * - Application Performance Monitoring (APM)
 * - Real-time metrics collection and alerting
 * - Health checks and uptime monitoring
 * - Error tracking and exception handling
 * - Custom business metrics and KPIs
 * - Log aggregation and analysis
 * - Distributed tracing for microservices
 * - Resource usage monitoring (CPU, Memory, Disk, Network)
 * - Integration with popular monitoring services
 */

const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class MonitoringSetup extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Application settings
            appName: options.appName || 'smart-ocr-system',
            environment: options.environment || process.env.NODE_ENV || 'production',
            version: options.version || process.env.APP_VERSION || '1.0.0',
            
            // Metrics collection
            metricsInterval: options.metricsInterval || 30000, // 30 seconds
            enableSystemMetrics: options.enableSystemMetrics !== false,
            enableCustomMetrics: options.enableCustomMetrics !== false,
            enableBusinessMetrics: options.enableBusinessMetrics !== false,
            
            // Health checks
            healthCheckInterval: options.healthCheckInterval || 60000, // 1 minute
            healthCheckTimeout: options.healthCheckTimeout || 5000,
            enableDeepHealthChecks: options.enableDeepHealthChecks || true,
            
            // Alerting
            enableAlerting: options.enableAlerting !== false,
            alertThresholds: options.alertThresholds || {
                cpuUsage: 80,
                memoryUsage: 85,
                diskUsage: 90,
                errorRate: 5,
                responseTime: 5000
            },
            
            // External services
            prometheusEnabled: options.prometheusEnabled || false,
            grafanaEnabled: options.grafanaEnabled || false,
            datadogEnabled: options.datadogEnabled || false,
            newRelicEnabled: options.newRelicEnabled || false,
            elasticAPMEnabled: options.elasticAPMEnabled || false,
            
            // Logging
            logLevel: options.logLevel || 'info',
            logFormat: options.logFormat || 'json',
            logFilePath: options.logFilePath || path.join(process.cwd(), 'logs'),
            enableStructuredLogging: options.enableStructuredLogging !== false,
            
            // Performance
            enableProfiling: options.enableProfiling || false,
            enableTracing: options.enableTracing || false,
            tracingSampleRate: options.tracingSampleRate || 0.1
        };
        
        this.metrics = {
            system: {},
            application: {},
            business: {},
            custom: new Map()
        };
        
        this.healthChecks = new Map();
        this.alerts = [];
        this.traces = [];
        this.startTime = Date.now();
        this.requestCounter = 0;
        this.errorCounter = 0;
        
        console.log('📊 Monitoring Setup initialized');
        console.log(`🏷️ App: ${this.config.appName} v${this.config.version} (${this.config.environment})`);
    }

    async initialize() {
        console.log('🚀 Initializing monitoring system...');
        
        try {
            // Setup logging
            await this.setupLogging();
            
            // Initialize external monitoring services
            await this.initializeExternalServices();
            
            // Register default health checks
            this.registerDefaultHealthChecks();
            
            // Start metrics collection
            this.startMetricsCollection();
            
            // Start health check monitoring
            this.startHealthCheckMonitoring();
            
            // Setup error handling
            this.setupErrorHandling();
            
            // Setup performance monitoring
            if (this.config.enableProfiling) {
                this.setupProfiling();
            }
            
            // Setup distributed tracing
            if (this.config.enableTracing) {
                this.setupTracing();
            }
            
            console.log('✅ Monitoring system ready');
            
        } catch (error) {
            console.error('❌ Monitoring initialization failed:', error);
            throw error;
        }
    }

    async setupLogging() {
        console.log('📝 Setting up structured logging...');
        
        try {
            // Create logs directory
            await fs.mkdir(this.config.logFilePath, { recursive: true });
            
            // Setup winston logger if available
            try {
                const winston = require('winston');
                
                const logFormat = winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.errors({ stack: true }),
                    this.config.logFormat === 'json' 
                        ? winston.format.json()
                        : winston.format.simple()
                );
                
                this.logger = winston.createLogger({
                    level: this.config.logLevel,
                    format: logFormat,
                    defaultMeta: {
                        service: this.config.appName,
                        version: this.config.version,
                        environment: this.config.environment
                    },
                    transports: [
                        new winston.transports.Console(),
                        new winston.transports.File({
                            filename: path.join(this.config.logFilePath, 'app.log')
                        }),
                        new winston.transports.File({
                            filename: path.join(this.config.logFilePath, 'error.log'),
                            level: 'error'
                        })
                    ]
                });
                
                console.log('✅ Winston logger configured');
                
            } catch (error) {
                console.warn('⚠️ Winston not available, using console logging');
                this.logger = console;
            }
            
        } catch (error) {
            console.error('❌ Logging setup failed:', error);
            this.logger = console;
        }
    }

    async initializeExternalServices() {
        console.log('🔌 Initializing external monitoring services...');
        
        // Prometheus metrics
        if (this.config.prometheusEnabled) {
            await this.setupPrometheus();
        }
        
        // Datadog APM
        if (this.config.datadogEnabled) {
            await this.setupDatadog();
        }
        
        // New Relic APM
        if (this.config.newRelicEnabled) {
            await this.setupNewRelic();
        }
        
        // Elastic APM
        if (this.config.elasticAPMEnabled) {
            await this.setupElasticAPM();
        }
    }

    async setupPrometheus() {
        try {
            const prometheus = require('prom-client');
            
            // Create a Registry to register the metrics
            this.prometheusRegistry = new prometheus.Registry();
            
            // Add default metrics
            prometheus.collectDefaultMetrics({ register: this.prometheusRegistry });
            
            // Custom metrics
            this.prometheusMetrics = {
                httpRequestsTotal: new prometheus.Counter({
                    name: 'http_requests_total',
                    help: 'Total number of HTTP requests',
                    labelNames: ['method', 'route', 'status_code']
                }),
                
                httpRequestDuration: new prometheus.Histogram({
                    name: 'http_request_duration_seconds',
                    help: 'Duration of HTTP requests in seconds',
                    labelNames: ['method', 'route', 'status_code'],
                    buckets: [0.1, 0.5, 1, 2, 5, 10]
                }),
                
                documentsProcessed: new prometheus.Counter({
                    name: 'documents_processed_total',
                    help: 'Total number of documents processed',
                    labelNames: ['type', 'status']
                }),
                
                extractionAccuracy: new prometheus.Gauge({
                    name: 'extraction_accuracy_percentage',
                    help: 'Current extraction accuracy percentage'
                }),
                
                queueSize: new prometheus.Gauge({
                    name: 'queue_size',
                    help: 'Current queue size',
                    labelNames: ['queue_name']
                })
            };
            
            // Register custom metrics
            Object.values(this.prometheusMetrics).forEach(metric => {
                this.prometheusRegistry.registerMetric(metric);
            });
            
            console.log('✅ Prometheus metrics configured');
            
        } catch (error) {
            console.warn('⚠️ Prometheus setup failed:', error.message);
        }
    }

    async setupDatadog() {
        try {
            const tracer = require('dd-trace').init({
                service: this.config.appName,
                version: this.config.version,
                env: this.config.environment
            });
            
            this.datadogTracer = tracer;
            console.log('✅ Datadog APM configured');
            
        } catch (error) {
            console.warn('⚠️ Datadog setup failed:', error.message);
        }
    }

    async setupNewRelic() {
        try {
            const newrelic = require('newrelic');
            this.newrelic = newrelic;
            console.log('✅ New Relic APM configured');
            
        } catch (error) {
            console.warn('⚠️ New Relic setup failed:', error.message);
        }
    }

    async setupElasticAPM() {
        try {
            const apm = require('elastic-apm-node').start({
                serviceName: this.config.appName,
                serviceVersion: this.config.version,
                environment: this.config.environment
            });
            
            this.elasticAPM = apm;
            console.log('✅ Elastic APM configured');
            
        } catch (error) {
            console.warn('⚠️ Elastic APM setup failed:', error.message);
        }
    }

    // Metrics Collection
    startMetricsCollection() {
        console.log('📊 Starting metrics collection...');
        
        this.metricsInterval = setInterval(async () => {
            try {
                await this.collectMetrics();
            } catch (error) {
                console.error('❌ Metrics collection failed:', error);
            }
        }, this.config.metricsInterval);
    }

    async collectMetrics() {
        // System metrics
        if (this.config.enableSystemMetrics) {
            this.collectSystemMetrics();
        }
        
        // Application metrics
        this.collectApplicationMetrics();
        
        // Business metrics
        if (this.config.enableBusinessMetrics) {
            await this.collectBusinessMetrics();
        }
        
        // Check for alerts
        if (this.config.enableAlerting) {
            this.checkAlerts();
        }
        
        // Emit metrics event
        this.emit('metrics', {
            timestamp: new Date().toISOString(),
            ...this.metrics
        });
    }

    collectSystemMetrics() {
        // CPU usage
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        
        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        
        this.metrics.system = {
            cpuUsage: 100 - Math.round(100 * totalIdle / totalTick),
            memoryUsage: Math.round((1 - os.freemem() / os.totalmem()) * 100),
            loadAverage: os.loadavg(),
            uptime: Math.round(os.uptime()),
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            processUptime: Math.round(process.uptime()),
            processMemory: process.memoryUsage(),
            processHeapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            processHeapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        };
        
        // Update Prometheus metrics if available
        if (this.prometheusMetrics) {
            this.prometheusMetrics.extractionAccuracy?.set(this.metrics.business.averageAccuracy || 0);
        }
    }

    collectApplicationMetrics() {
        this.metrics.application = {
            requestsTotal: this.requestCounter,
            errorsTotal: this.errorCounter,
            errorRate: this.requestCounter > 0 ? (this.errorCounter / this.requestCounter) * 100 : 0,
            uptime: Math.round((Date.now() - this.startTime) / 1000),
            version: this.config.version,
            environment: this.config.environment
        };
    }

    async collectBusinessMetrics() {
        // These would be collected from your application's database/services
        this.metrics.business = {
            documentsProcessedToday: await this.getDocumentsProcessedToday(),
            averageAccuracy: await this.getAverageAccuracy(),
            activeUsers: await this.getActiveUsers(),
            queueSizes: await this.getQueueSizes(),
            apiCallsPerMinute: await this.getAPICallsPerMinute(),
            successfulExtractions: await this.getSuccessfulExtractions(),
            failedExtractions: await this.getFailedExtractions()
        };
    }

    // Health Checks
    registerDefaultHealthChecks() {
        console.log('🏥 Registering default health checks...');
        
        // Basic health check
        this.registerHealthCheck('basic', async () => {
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            };
        });
        
        // Database health check
        this.registerHealthCheck('database', async () => {
            try {
                // This would check your actual database connection
                const startTime = Date.now();
                // await db.query('SELECT 1');
                const responseTime = Date.now() - startTime;
                
                return {
                    status: 'healthy',
                    responseTime,
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                return {
                    status: 'unhealthy',
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        });
        
        // Redis health check
        this.registerHealthCheck('redis', async () => {
            try {
                // This would check your actual Redis connection
                const startTime = Date.now();
                // await redis.ping();
                const responseTime = Date.now() - startTime;
                
                return {
                    status: 'healthy',
                    responseTime,
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                return {
                    status: 'unhealthy',
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        });
        
        // File system health check
        this.registerHealthCheck('filesystem', async () => {
            try {
                const testFile = path.join(os.tmpdir(), 'health-check.txt');
                const startTime = Date.now();
                
                await fs.writeFile(testFile, 'health check test');
                await fs.unlink(testFile);
                
                const responseTime = Date.now() - startTime;
                
                return {
                    status: 'healthy',
                    responseTime,
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                return {
                    status: 'unhealthy',
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        });
    }

    registerHealthCheck(name, checkFunction) {
        this.healthChecks.set(name, {
            name,
            check: checkFunction,
            lastResult: null,
            lastCheck: null
        });
        
        console.log(`🏥 Health check registered: ${name}`);
    }

    async runHealthCheck(name) {
        const healthCheck = this.healthChecks.get(name);
        if (!healthCheck) {
            throw new Error(`Health check not found: ${name}`);
        }
        
        try {
            const result = await Promise.race([
                healthCheck.check(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Health check timeout')), this.config.healthCheckTimeout)
                )
            ]);
            
            healthCheck.lastResult = result;
            healthCheck.lastCheck = new Date().toISOString();
            
            return result;
            
        } catch (error) {
            const result = {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            healthCheck.lastResult = result;
            healthCheck.lastCheck = new Date().toISOString();
            
            return result;
        }
    }

    async runAllHealthChecks() {
        const results = {};
        
        for (const [name, healthCheck] of this.healthChecks) {
            results[name] = await this.runHealthCheck(name);
        }
        
        const overallStatus = Object.values(results).every(result => result.status === 'healthy')
            ? 'healthy'
            : 'unhealthy';
        
        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            checks: results
        };
    }

    startHealthCheckMonitoring() {
        console.log('🏥 Starting health check monitoring...');
        
        this.healthCheckInterval = setInterval(async () => {
            try {
                const healthStatus = await this.runAllHealthChecks();
                
                if (healthStatus.status === 'unhealthy') {
                    this.logger.error('Health check failed:', healthStatus);
                    this.emit('healthCheckFailed', healthStatus);
                }
                
                this.emit('healthCheck', healthStatus);
                
            } catch (error) {
                console.error('❌ Health check monitoring failed:', error);
            }
        }, this.config.healthCheckInterval);
    }

    // Alerting
    checkAlerts() {
        const thresholds = this.config.alertThresholds;
        const alerts = [];
        
        // CPU usage alert
        if (this.metrics.system.cpuUsage > thresholds.cpuUsage) {
            alerts.push({
                type: 'cpu_high',
                severity: 'warning',
                message: `High CPU usage: ${this.metrics.system.cpuUsage}%`,
                value: this.metrics.system.cpuUsage,
                threshold: thresholds.cpuUsage
            });
        }
        
        // Memory usage alert
        if (this.metrics.system.memoryUsage > thresholds.memoryUsage) {
            alerts.push({
                type: 'memory_high',
                severity: 'warning',
                message: `High memory usage: ${this.metrics.system.memoryUsage}%`,
                value: this.metrics.system.memoryUsage,
                threshold: thresholds.memoryUsage
            });
        }
        
        // Error rate alert
        if (this.metrics.application.errorRate > thresholds.errorRate) {
            alerts.push({
                type: 'error_rate_high',
                severity: 'critical',
                message: `High error rate: ${this.metrics.application.errorRate.toFixed(2)}%`,
                value: this.metrics.application.errorRate,
                threshold: thresholds.errorRate
            });
        }
        
        // Trigger alerts
        alerts.forEach(alert => {
            this.triggerAlert(alert);
        });
    }

    triggerAlert(alert) {
        const alertWithTimestamp = {
            ...alert,
            timestamp: new Date().toISOString(),
            id: this.generateAlertId()
        };
        
        this.alerts.push(alertWithTimestamp);
        
        // Keep only last 100 alerts
        if (this.alerts.length > 100) {
            this.alerts.shift();
        }
        
        this.logger.warn('Alert triggered:', alertWithTimestamp);
        this.emit('alert', alertWithTimestamp);
        
        // Send to external alerting services
        this.sendExternalAlert(alertWithTimestamp);
    }

    sendExternalAlert(alert) {
        // Send to Slack, PagerDuty, email, etc.
        // Implementation would depend on your alerting setup
        console.log(`🚨 Alert: ${alert.message}`);
    }

    // Error Handling
    setupErrorHandling() {
        console.log('🚨 Setting up error handling...');
        
        // Uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.logger.error('Uncaught Exception:', error);
            this.recordError(error, { type: 'uncaughtException' });
            
            // Graceful shutdown
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        });
        
        // Unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.logger.error('Unhandled Rejection:', reason);
            this.recordError(reason, { type: 'unhandledRejection', promise });
        });
        
        // Warning events
        process.on('warning', (warning) => {
            this.logger.warn('Process Warning:', warning);
        });
    }

    recordError(error, context = {}) {
        this.errorCounter++;
        
        const errorRecord = {
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            context,
            id: this.generateErrorId()
        };
        
        // Send to external error tracking services
        if (this.elasticAPM) {
            this.elasticAPM.captureError(error);
        }
        
        if (this.newrelic) {
            this.newrelic.noticeError(error);
        }
        
        this.emit('error', errorRecord);
    }

    // Performance Monitoring
    setupProfiling() {
        console.log('⚡ Setting up performance profiling...');
        
        try {
            const v8Profiler = require('v8-profiler-next');
            
            // CPU profiling
            setInterval(() => {
                const profile = v8Profiler.startProfiling('CPU', true);
                setTimeout(() => {
                    const cpuProfile = v8Profiler.stopProfiling('CPU');
                    this.saveCPUProfile(cpuProfile);
                }, 30000); // 30-second profiles
            }, 300000); // Every 5 minutes
            
        } catch (error) {
            console.warn('⚠️ V8 profiler not available:', error.message);
        }
    }

    setupTracing() {
        console.log('🔍 Setting up distributed tracing...');
        
        // Custom tracing implementation
        this.activeTraces = new Map();
    }

    startTrace(operationName, context = {}) {
        const traceId = this.generateTraceId();
        const trace = {
            traceId,
            operationName,
            startTime: Date.now(),
            context,
            spans: []
        };
        
        this.activeTraces.set(traceId, trace);
        return traceId;
    }

    addSpan(traceId, spanName, data = {}) {
        const trace = this.activeTraces.get(traceId);
        if (trace) {
            trace.spans.push({
                spanName,
                timestamp: Date.now(),
                data
            });
        }
    }

    finishTrace(traceId, result = {}) {
        const trace = this.activeTraces.get(traceId);
        if (trace) {
            trace.endTime = Date.now();
            trace.duration = trace.endTime - trace.startTime;
            trace.result = result;
            
            this.traces.push(trace);
            this.activeTraces.delete(traceId);
            
            // Keep only last 1000 traces
            if (this.traces.length > 1000) {
                this.traces.shift();
            }
            
            this.emit('trace', trace);
        }
    }

    // Middleware for Express.js
    createMonitoringMiddleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            this.requestCounter++;
            
            // Start trace
            const traceId = this.startTrace('http_request', {
                method: req.method,
                url: req.url,
                userAgent: req.get('User-Agent'),
                ip: req.ip
            });
            
            req.traceId = traceId;
            
            // Override res.end to capture response metrics
            const originalEnd = res.end;
            res.end = (...args) => {
                const duration = Date.now() - startTime;
                
                // Record metrics
                if (this.prometheusMetrics) {
                    this.prometheusMetrics.httpRequestsTotal.inc({
                        method: req.method,
                        route: req.route?.path || req.path,
                        status_code: res.statusCode
                    });
                    
                    this.prometheusMetrics.httpRequestDuration.observe({
                        method: req.method,
                        route: req.route?.path || req.path,
                        status_code: res.statusCode
                    }, duration / 1000);
                }
                
                // Finish trace
                this.finishTrace(traceId, {
                    statusCode: res.statusCode,
                    duration
                });
                
                // Log request
                this.logger.info('HTTP Request', {
                    method: req.method,
                    url: req.url,
                    statusCode: res.statusCode,
                    duration,
                    userAgent: req.get('User-Agent'),
                    ip: req.ip
                });
                
                originalEnd.apply(res, args);
            };
            
            next();
        };
    }

    // Utility methods
    async getDocumentsProcessedToday() {
        // Mock implementation - replace with actual database query
        return Math.floor(Math.random() * 1000) + 500;
    }

    async getAverageAccuracy() {
        // Mock implementation - replace with actual calculation
        return 92.5 + Math.random() * 5;
    }

    async getActiveUsers() {
        // Mock implementation - replace with actual user count
        return Math.floor(Math.random() * 100) + 20;
    }

    async getQueueSizes() {
        // Mock implementation - replace with actual queue monitoring
        return {
            'pdf-processing': Math.floor(Math.random() * 50),
            'ocr-processing': Math.floor(Math.random() * 20),
            'notifications': Math.floor(Math.random() * 10)
        };
    }

    async getAPICallsPerMinute() {
        // Mock implementation - replace with actual API metrics
        return Math.floor(Math.random() * 200) + 50;
    }

    async getSuccessfulExtractions() {
        // Mock implementation
        return Math.floor(Math.random() * 900) + 400;
    }

    async getFailedExtractions() {
        // Mock implementation
        return Math.floor(Math.random() * 50) + 10;
    }

    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateTraceId() {
        return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    saveCPUProfile(profile) {
        // Save CPU profile to file for analysis
        const filename = `cpu-profile-${Date.now()}.cpuprofile`;
        const filepath = path.join(this.config.logFilePath, filename);
        
        profile.export((error, result) => {
            if (!error) {
                fs.writeFile(filepath, result);
            }
            profile.delete();
        });
    }

    // API methods
    getMetrics() {
        return this.metrics;
    }

    getAlerts(limit = 50) {
        return this.alerts.slice(-limit);
    }

    getTraces(limit = 100) {
        return this.traces.slice(-limit);
    }

    getPrometheusMetrics() {
        if (this.prometheusRegistry) {
            return this.prometheusRegistry.metrics();
        }
        return null;
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up monitoring system...');
        
        // Clear intervals
        if (this.metricsInterval) clearInterval(this.metricsInterval);
        if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
        
        // Close external connections
        if (this.datadogTracer) {
            await this.datadogTracer.flush();
        }
        
        if (this.elasticAPM) {
            this.elasticAPM.destroy();
        }
        
        console.log('✅ Monitoring system cleanup complete');
    }
}

module.exports = { MonitoringSetup };