#!/usr/bin/env node

/**
 * REAL-TIME MONITORING SYSTEM
 * 
 * Comprehensive logging and monitoring for Smart OCR system
 * Provides real-time insights into PDF processing, user actions, and system performance
 */

const express = require('express');
const WebSocket = require('ws');
const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');

class SmartOCRMonitoringSystem {
    constructor() {
        this.app = express();
        this.setupLogger();
        this.setupWebSocket();
        this.setupRoutes();
        this.setupMiddleware();
        this.metrics = {
            totalProcessed: 0,
            currentAccuracy: 80,
            activeUsers: 0,
            averageProcessingTime: 0,
            errorCount: 0,
            lastProcessed: null
        };
    }

    setupLogger() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'smart-ocr' },
            transports: [
                new winston.transports.File({ 
                    filename: 'logs/error.log', 
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                }),
                new winston.transports.File({ 
                    filename: 'logs/combined.log',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });

        // Ensure logs directory exists
        this.ensureLogsDirectory();
    }

    async ensureLogsDirectory() {
        try {
            await fs.mkdir('logs', { recursive: true });
        } catch (error) {
            console.error('Failed to create logs directory:', error);
        }
    }

    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: 8080 });
        
        this.wss.on('connection', (ws) => {
            console.log('📊 Dashboard client connected');
            this.metrics.activeUsers++;
            
            // Send current metrics to new client
            this.sendToClient(ws, 'METRICS_UPDATE', this.metrics);
            
            ws.on('close', () => {
                console.log('📊 Dashboard client disconnected');
                this.metrics.activeUsers = Math.max(0, this.metrics.activeUsers - 1);
            });
        });
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Request logging middleware
        this.app.use((req, res, next) => {
            const startTime = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                this.logRequest(req, res, duration);
            });
            
            next();
        });
    }

    setupRoutes() {
        // Dashboard route
        this.app.get('/dashboard', (req, res) => {
            res.send(this.generateDashboardHTML());
        });

        // API monitoring endpoints
        this.app.get('/api/monitoring/metrics', (req, res) => {
            res.json({
                success: true,
                metrics: this.metrics,
                timestamp: new Date().toISOString()
            });
        });

        this.app.get('/api/monitoring/logs', async (req, res) => {
            try {
                const logs = await this.getRecentLogs(50);
                res.json({
                    success: true,
                    logs: logs,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to retrieve logs'
                });
            }
        });

        // PDF processing monitoring
        this.app.post('/api/monitoring/pdf-processing', (req, res) => {
            const { sessionId, step, data } = req.body;
            this.logPDFProcessing(sessionId, step, data);
            res.json({ success: true });
        });

        // User action monitoring
        this.app.post('/api/monitoring/user-action', (req, res) => {
            const { userId, action, details } = req.body;
            this.logUserAction(userId, action, details);
            res.json({ success: true });
        });

        // ML learning monitoring
        this.app.post('/api/monitoring/ml-learning', (req, res) => {
            const { patternId, accuracy, impact } = req.body;
            this.logMLLearning(patternId, accuracy, impact);
            res.json({ success: true });
        });
    }

    logRequest(req, res, duration) {
        this.logger.info({
            type: 'HTTP_REQUEST',
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: duration,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        // Update metrics
        if (req.url.includes('/api/smart-ocr')) {
            this.updateProcessingMetrics(duration, res.statusCode === 200);
        }

        // Broadcast to dashboard
        this.broadcastEvent('HTTP_REQUEST', {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: duration
        });
    }

    logPDFProcessing(sessionId, step, data) {
        this.logger.info({
            type: 'PDF_PROCESSING',
            sessionId: sessionId,
            step: step,
            data: data,
            timestamp: new Date().toISOString()
        });

        // Update metrics based on processing step
        if (step === 'PROCESSING_COMPLETE') {
            this.metrics.totalProcessed++;
            this.metrics.lastProcessed = new Date().toISOString();
            
            if (data.accuracy) {
                this.updateAccuracy(data.accuracy);
            }
        }

        // Broadcast to dashboard
        this.broadcastEvent('PDF_PROCESSING', {
            sessionId: sessionId,
            step: step,
            data: data
        });
    }

    logUserAction(userId, action, details) {
        this.logger.info({
            type: 'USER_ACTION',
            userId: userId,
            action: action,
            details: details,
            timestamp: new Date().toISOString()
        });

        // Broadcast to dashboard
        this.broadcastEvent('USER_ACTION', {
            userId: userId,
            action: action,
            details: details
        });
    }

    logMLLearning(patternId, accuracy, impact) {
        this.logger.info({
            type: 'ML_LEARNING',
            patternId: patternId,
            accuracy: accuracy,
            impact: impact,
            timestamp: new Date().toISOString()
        });

        // Update accuracy metrics
        if (accuracy) {
            this.updateAccuracy(accuracy);
        }

        // Broadcast to dashboard
        this.broadcastEvent('ML_LEARNING', {
            patternId: patternId,
            accuracy: accuracy,
            impact: impact
        });
    }

    updateProcessingMetrics(duration, success) {
        if (success) {
            // Update average processing time
            const currentAvg = this.metrics.averageProcessingTime;
            const count = this.metrics.totalProcessed;
            this.metrics.averageProcessingTime = (currentAvg * count + duration) / (count + 1);
        } else {
            this.metrics.errorCount++;
        }

        // Broadcast updated metrics
        this.broadcastEvent('METRICS_UPDATE', this.metrics);
    }

    updateAccuracy(newAccuracy) {
        // Simple moving average for accuracy
        const alpha = 0.1; // Smoothing factor
        this.metrics.currentAccuracy = (1 - alpha) * this.metrics.currentAccuracy + alpha * newAccuracy;
        
        // Broadcast updated metrics
        this.broadcastEvent('METRICS_UPDATE', this.metrics);
    }

    broadcastEvent(eventType, data) {
        const message = JSON.stringify({
            type: eventType,
            data: data,
            timestamp: new Date().toISOString()
        });

        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    sendToClient(client, eventType, data) {
        if (client.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: eventType,
                data: data,
                timestamp: new Date().toISOString()
            });
            client.send(message);
        }
    }

    async getRecentLogs(limit = 50) {
        try {
            const logFile = 'logs/combined.log';
            const content = await fs.readFile(logFile, 'utf8');
            const lines = content.trim().split('\n');
            
            // Get last N lines and parse as JSON
            const recentLines = lines.slice(-limit);
            const logs = recentLines.map(line => {
                try {
                    return JSON.parse(line);
                } catch (error) {
                    return { message: line, timestamp: new Date().toISOString() };
                }
            });

            return logs.reverse(); // Most recent first
        } catch (error) {
            this.logger.error('Failed to read log file:', error);
            return [];
        }
    }

    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Smart OCR Real-time Dashboard</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
            color: #333;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .dashboard-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.2s;
        }
        
        .metric-card:hover {
            transform: translateY(-2px);
        }
        
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .metric-label {
            font-size: 1.1em;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .activity-section {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .section-header {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #dee2e6;
            font-size: 1.3em;
            font-weight: bold;
        }
        
        .activity-log {
            max-height: 500px;
            overflow-y: auto;
            padding: 20px;
        }
        
        .log-entry {
            background: #f9f9f9;
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        
        .log-entry.error { border-left-color: #dc3545; background: #fff5f5; }
        .log-entry.success { border-left-color: #28a745; background: #f0fff4; }
        .log-entry.warning { border-left-color: #ffc107; background: #fffbf0; }
        
        .log-timestamp {
            color: #666;
            font-size: 0.8em;
            margin-bottom: 5px;
        }
        
        .log-type {
            font-weight: bold;
            color: #007bff;
            margin-bottom: 5px;
        }
        
        .log-data {
            color: #333;
            white-space: pre-wrap;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-online { background: #28a745; }
        .status-offline { background: #dc3545; }
        
        @media (max-width: 768px) {
            .metrics-grid {
                grid-template-columns: 1fr;
            }
            
            .dashboard-container {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Smart OCR Real-time Dashboard</h1>
        <p>Live monitoring of PDF processing and system performance</p>
        <p><span class="status-indicator status-online"></span>System Status: Online</p>
    </div>
    
    <div class="dashboard-container">
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value" id="accuracy">80%</div>
                <div class="metric-label">Current Accuracy</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-value" id="patterns">19</div>
                <div class="metric-label">Patterns Learned</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-value" id="documents">0</div>
                <div class="metric-label">Documents Processed</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-value" id="active-users">1</div>
                <div class="metric-label">Active Users</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-value" id="avg-time">0ms</div>
                <div class="metric-label">Avg Processing Time</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-value" id="error-count">0</div>
                <div class="metric-label">Errors Today</div>
            </div>
        </div>
        
        <div class="activity-section">
            <div class="section-header">
                📋 Live Activity Log
            </div>
            <div class="activity-log" id="activity-log">
                <div class="log-entry">
                    <div class="log-timestamp">System initialized</div>
                    <div class="log-type">SYSTEM_START</div>
                    <div class="log-data">Smart OCR monitoring system is now active</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        class SmartOCRDashboard {
            constructor() {
                this.ws = null;
                this.reconnectAttempts = 0;
                this.maxReconnectAttempts = 5;
                this.connectWebSocket();
                this.updateMetrics();
                
                // Update metrics every 30 seconds
                setInterval(() => this.updateMetrics(), 30000);
            }
            
            connectWebSocket() {
                try {
                    this.ws = new WebSocket('ws://localhost:8080');
                    
                    this.ws.onopen = () => {
                        console.log('📊 Connected to monitoring system');
                        this.reconnectAttempts = 0;
                        this.updateConnectionStatus(true);
                    };
                    
                    this.ws.onmessage = (event) => {
                        const data = JSON.parse(event.data);
                        this.handleWebSocketMessage(data);
                    };
                    
                    this.ws.onclose = () => {
                        console.log('📊 Disconnected from monitoring system');
                        this.updateConnectionStatus(false);
                        this.attemptReconnect();
                    };
                    
                    this.ws.onerror = (error) => {
                        console.error('WebSocket error:', error);
                    };
                    
                } catch (error) {
                    console.error('Failed to connect to WebSocket:', error);
                    this.attemptReconnect();
                }
            }
            
            attemptReconnect() {
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(\`Attempting to reconnect (\${this.reconnectAttempts}/\${this.maxReconnectAttempts})...\`);
                    setTimeout(() => this.connectWebSocket(), 5000);
                }
            }
            
            updateConnectionStatus(connected) {
                const indicators = document.querySelectorAll('.status-indicator');
                indicators.forEach(indicator => {
                    indicator.className = 'status-indicator ' + (connected ? 'status-online' : 'status-offline');
                });
            }
            
            handleWebSocketMessage(data) {
                switch (data.type) {
                    case 'METRICS_UPDATE':
                        this.updateMetricsDisplay(data.data);
                        break;
                    case 'PDF_PROCESSING':
                    case 'USER_ACTION':
                    case 'ML_LEARNING':
                    case 'HTTP_REQUEST':
                        this.addLogEntry(data);
                        break;
                }
            }
            
            updateMetricsDisplay(metrics) {
                document.getElementById('accuracy').textContent = Math.round(metrics.currentAccuracy) + '%';
                document.getElementById('documents').textContent = metrics.totalProcessed;
                document.getElementById('active-users').textContent = metrics.activeUsers;
                document.getElementById('avg-time').textContent = Math.round(metrics.averageProcessingTime) + 'ms';
                document.getElementById('error-count').textContent = metrics.errorCount;
            }
            
            async updateMetrics() {
                try {
                    const response = await fetch('/api/monitoring/metrics');
                    const data = await response.json();
                    
                    if (data.success) {
                        this.updateMetricsDisplay(data.metrics);
                    }
                } catch (error) {
                    console.error('Failed to update metrics:', error);
                }
            }
            
            addLogEntry(data) {
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry ' + this.getLogEntryClass(data.type);
                
                logEntry.innerHTML = \`
                    <div class="log-timestamp">\${new Date(data.timestamp).toLocaleString()}</div>
                    <div class="log-type">\${data.type}</div>
                    <div class="log-data">\${this.formatLogData(data.data)}</div>
                \`;
                
                const log = document.getElementById('activity-log');
                log.insertBefore(logEntry, log.firstChild);
                
                // Keep only last 100 entries
                while (log.children.length > 100) {
                    log.removeChild(log.lastChild);
                }
            }
            
            getLogEntryClass(type) {
                switch (type) {
                    case 'ERROR':
                    case 'PROCESSING_ERROR':
                        return 'error';
                    case 'PDF_PROCESSING':
                    case 'ML_LEARNING':
                        return 'success';
                    case 'USER_ACTION':
                        return 'warning';
                    default:
                        return '';
                }
            }
            
            formatLogData(data) {
                if (typeof data === 'object') {
                    return JSON.stringify(data, null, 2);
                }
                return String(data);
            }
        }
        
        // Initialize dashboard when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new SmartOCRDashboard();
        });
    </script>
</body>
</html>
        `;
    }

    start(port = 3001) {
        this.app.listen(port, () => {
            console.log(`🎯 Smart OCR Monitoring System running on port ${port}`);
            console.log(`📊 Dashboard available at: http://localhost:${port}/dashboard`);
            console.log(`🔌 WebSocket server running on port 8080`);
            
            this.logger.info({
                type: 'SYSTEM_START',
                port: port,
                timestamp: new Date().toISOString()
            });
        });
    }
}

// Start monitoring system if run directly
if (require.main === module) {
    const monitoring = new SmartOCRMonitoringSystem();
    monitoring.start();
}

module.exports = { SmartOCRMonitoringSystem };
