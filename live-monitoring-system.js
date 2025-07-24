/**
 * LIVE MONITORING SYSTEM
 * Real-time monitoring of the live deployment with logging and alerts
 * Shows all user activity and extraction results in real-time
 */

const fetch = require('node-fetch');
const fs = require('fs').promises;

class LiveMonitoringSystem {
    constructor() {
        this.renderUrl = 'https://pdf-fzzi.onrender.com';
        this.monitoringInterval = 10000; // 10 seconds
        this.logFile = `live-monitoring-${Date.now()}.log`;
        this.isMonitoring = false;
        this.lastActivity = null;
        
        console.log('📡 LIVE MONITORING SYSTEM INITIALIZED');
        console.log(`🔍 Monitoring: ${this.renderUrl}`);
        console.log(`📝 Log file: ${this.logFile}`);
    }

    async log(message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}${data ? '\\n' + JSON.stringify(data, null, 2) : ''}\\n`;
        
        console.log(`[${timestamp}] ${message}`);
        if (data) console.log(data);
        
        await fs.appendFile(this.logFile, logEntry);
    }

    async startMonitoring() {
        this.isMonitoring = true;
        await this.log('🚀 STARTING LIVE MONITORING');
        await this.log('👀 Watching for user activity and extraction results...');
        
        // Initial system check
        await this.checkSystemStatus();
        
        // Start monitoring loop
        this.monitoringLoop();
        
        console.log('\\n📊 MONITORING COMMANDS:');
        console.log('  - Press Ctrl+C to stop monitoring');
        console.log('  - Check log file for detailed activity');
    }

    async monitoringLoop() {
        while (this.isMonitoring) {
            try {
                await this.checkForActivity();
                await this.checkSystemHealth();
                
                // Wait for next check
                await this.sleep(this.monitoringInterval);
                
            } catch (error) {
                await this.log('❌ Monitoring error', { error: error.message });
                await this.sleep(this.monitoringInterval * 2); // Wait longer on error
            }
        }
    }

    async checkSystemStatus() {
        await this.log('🔍 CHECKING SYSTEM STATUS');
        
        try {
            // Check main page
            const mainResponse = await fetch(this.renderUrl, { timeout: 10000 });
            const mainContent = await mainResponse.text();
            
            // Determine system type
            const systemType = mainContent.includes('Perfect Mistral') ? 'Perfect Mistral System' :
                              mainContent.includes('Smart OCR Learning') ? 'Smart OCR System' :
                              mainContent.includes('express-server') ? 'Express Server' :
                              'Unknown System';
            
            await this.log(`🎯 System Type: ${systemType}`);
            await this.log(`📊 Status: ${mainResponse.status()}`);
            
            // Check key endpoints
            const endpoints = [
                '/api/system-capabilities',
                '/api/perfect-extraction',
                '/api/smart-ocr-stats'
            ];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(this.renderUrl + endpoint, { timeout: 5000 });
                    await this.log(`${response.ok ? '✅' : '❌'} ${endpoint}: ${response.status()}`);
                } catch (error) {
                    await this.log(`❌ ${endpoint}: ${error.message}`);
                }
            }
            
        } catch (error) {
            await this.log('❌ System status check failed', { error: error.message });
        }
    }

    async checkForActivity() {
        try {
            // Check for recent processing activity
            const statsResponse = await fetch(`${this.renderUrl}/api/smart-ocr-stats`, { timeout: 5000 });
            
            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                
                if (stats.stats) {
                    const currentActivity = {
                        documentCount: stats.stats.documentCount || 0,
                        annotationCount: stats.stats.annotationCount || 0,
                        accuracy: stats.stats.currentAccuracy || 0,
                        timestamp: new Date().toISOString()
                    };
                    
                    // Check if activity changed
                    if (this.lastActivity) {
                        if (currentActivity.documentCount > this.lastActivity.documentCount) {
                            await this.log('🆕 NEW DOCUMENT PROCESSED!', {
                                newDocuments: currentActivity.documentCount - this.lastActivity.documentCount,
                                totalDocuments: currentActivity.documentCount
                            });
                            
                            // Try to get processing results
                            await this.getLatestResults();
                        }
                        
                        if (currentActivity.annotationCount > this.lastActivity.annotationCount) {
                            await this.log('📝 NEW ANNOTATION ACTIVITY!', {
                                newAnnotations: currentActivity.annotationCount - this.lastActivity.annotationCount,
                                totalAnnotations: currentActivity.annotationCount
                            });
                        }
                        
                        if (currentActivity.accuracy !== this.lastActivity.accuracy) {
                            await this.log('📊 ACCURACY CHANGED!', {
                                oldAccuracy: this.lastActivity.accuracy,
                                newAccuracy: currentActivity.accuracy,
                                change: currentActivity.accuracy - this.lastActivity.accuracy
                            });
                        }
                    }
                    
                    this.lastActivity = currentActivity;
                    
                    // Log current stats every 5 minutes
                    const now = new Date();
                    if (now.getMinutes() % 5 === 0 && now.getSeconds() < 10) {
                        await this.log('📊 CURRENT STATS', currentActivity);
                    }
                }
            }
            
        } catch (error) {
            // Don't log every connection error, just major ones
            if (!error.message.includes('timeout')) {
                await this.log('⚠️ Activity check warning', { error: error.message });
            }
        }
    }

    async getLatestResults() {
        await this.log('🔍 FETCHING LATEST PROCESSING RESULTS');
        
        try {
            // Try to get export data which might contain latest results
            const exportResponse = await fetch(`${this.renderUrl}/api/export/json`, { timeout: 10000 });
            
            if (exportResponse.ok) {
                const exportData = await exportResponse.json();
                
                if (exportData && (exportData.securities || exportData.results)) {
                    await this.log('📊 LATEST EXTRACTION RESULTS', {
                        securities: exportData.securities?.length || 0,
                        totalValue: exportData.totalValue || exportData.summary?.totalValue || 0,
                        accuracy: exportData.accuracy || exportData.summary?.accuracy || 0,
                        timestamp: exportData.timestamp || new Date().toISOString()
                    });
                }
            }
            
        } catch (error) {
            await this.log('⚠️ Could not fetch latest results', { error: error.message });
        }
    }

    async checkSystemHealth() {
        try {
            // Quick health check
            const healthResponse = await fetch(this.renderUrl, { timeout: 5000 });
            
            if (!healthResponse.ok) {
                await this.log('⚠️ SYSTEM HEALTH WARNING', {
                    status: healthResponse.status,
                    statusText: healthResponse.statusText
                });
            }
            
        } catch (error) {
            await this.log('❌ SYSTEM HEALTH CHECK FAILED', { error: error.message });
        }
    }

    async simulateUserActivity() {
        await this.log('🧪 SIMULATING USER ACTIVITY FOR TESTING');
        
        try {
            // Simulate checking the main page
            await fetch(this.renderUrl);
            await this.log('👤 User visited main page');
            
            await this.sleep(2000);
            
            // Simulate checking stats
            await fetch(`${this.renderUrl}/api/smart-ocr-stats`);
            await this.log('👤 User checked system stats');
            
            await this.sleep(1000);
            
            // Simulate checking patterns
            await fetch(`${this.renderUrl}/api/smart-ocr-patterns`);
            await this.log('👤 User checked extraction patterns');
            
        } catch (error) {
            await this.log('❌ Simulation failed', { error: error.message });
        }
    }

    stopMonitoring() {
        this.isMonitoring = false;
        this.log('🛑 MONITORING STOPPED');
        console.log(`\\n📝 Complete log saved to: ${this.logFile}`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\\n🛑 Stopping monitoring...');
    if (global.monitor) {
        global.monitor.stopMonitoring();
    }
    process.exit(0);
});

// Run monitoring if called directly
if (require.main === module) {
    const monitor = new LiveMonitoringSystem();
    global.monitor = monitor;
    
    // Start monitoring
    monitor.startMonitoring();
    
    // Optional: Simulate some activity after 30 seconds for testing
    setTimeout(() => {
        monitor.simulateUserActivity();
    }, 30000);
}

module.exports = { LiveMonitoringSystem };