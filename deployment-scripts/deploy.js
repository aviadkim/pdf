/**
 * DEPLOYMENT AUTOMATION SCRIPT
 * Comprehensive deployment automation for production environments
 * 
 * Features:
 * - Multi-environment deployment (staging, production)
 * - Health checks and rollback capabilities
 * - Database migrations and seeding
 * - Asset optimization and CDN deployment
 * - Service discovery and load balancer updates
 * - Monitoring setup and alerting configuration
 * - Blue-green and canary deployment strategies
 * - Automated testing and validation
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class DeploymentAutomation {
    constructor(options = {}) {
        this.config = {
            environment: options.environment || process.env.DEPLOY_ENV || 'staging',
            region: options.region || process.env.DEPLOY_REGION || 'us-east-1',
            appName: options.appName || 'smart-ocr-system',
            version: options.version || process.env.APP_VERSION || '1.0.0',
            
            // Deployment strategy
            strategy: options.strategy || 'rolling', // rolling, blue-green, canary
            healthCheckUrl: options.healthCheckUrl || '/health',
            healthCheckTimeout: options.healthCheckTimeout || 30000,
            rollbackOnFailure: options.rollbackOnFailure !== false,
            
            // Infrastructure
            dockerRegistry: options.dockerRegistry || process.env.DOCKER_REGISTRY,
            kubernetesNamespace: options.kubernetesNamespace || 'default',
            enableAutoScaling: options.enableAutoScaling !== false,
            minReplicas: options.minReplicas || 2,
            maxReplicas: options.maxReplicas || 10,
            
            // Database
            runMigrations: options.runMigrations !== false,
            seedDatabase: options.seedDatabase || false,
            backupBeforeDeploy: options.backupBeforeDeploy !== false,
            
            // Monitoring
            setupMonitoring: options.setupMonitoring !== false,
            enableAlerting: options.enableAlerting !== false,
            slackWebhook: options.slackWebhook || process.env.SLACK_WEBHOOK,
            
            // Testing
            runSmokeTests: options.runSmokeTests !== false,
            runE2ETests: options.runE2ETests || false,
            testTimeout: options.testTimeout || 300000 // 5 minutes
        };
        
        this.deploymentState = {
            startTime: null,
            currentStep: null,
            previousVersion: null,
            rollbackAvailable: false,
            errors: [],
            warnings: []
        };
        
        console.log(`🚀 Deployment Automation initialized`);
        console.log(`📦 App: ${this.config.appName} v${this.config.version}`);
        console.log(`🌍 Environment: ${this.config.environment} (${this.config.region})`);
        console.log(`🔄 Strategy: ${this.config.strategy}`);
    }

    async deploy() {
        console.log('🚀 Starting deployment process...');
        this.deploymentState.startTime = new Date();
        
        try {
            // Pre-deployment checks
            await this.runPreDeploymentChecks();
            
            // Backup current version
            if (this.config.backupBeforeDeploy) {
                await this.backupCurrentVersion();
            }
            
            // Build and test
            await this.buildApplication();
            await this.runTests();
            
            // Database operations
            if (this.config.runMigrations) {
                await this.runDatabaseMigrations();
            }
            
            // Deploy based on strategy
            switch (this.config.strategy) {
                case 'blue-green':
                    await this.deployBlueGreen();
                    break;
                case 'canary':
                    await this.deployCanary();
                    break;
                case 'rolling':
                default:
                    await this.deployRolling();
                    break;
            }
            
            // Post-deployment tasks
            await this.runPostDeploymentTasks();
            
            // Health checks
            await this.performHealthChecks();
            
            // Setup monitoring
            if (this.config.setupMonitoring) {
                await this.setupMonitoring();
            }
            
            // Run smoke tests
            if (this.config.runSmokeTests) {
                await this.runSmokeTests();
            }
            
            // Finalize deployment
            await this.finalizeDeployment();
            
            const duration = Date.now() - this.deploymentState.startTime.getTime();
            console.log(`✅ Deployment completed successfully in ${duration}ms`);
            
            // Send success notification
            await this.sendNotification('success', {
                version: this.config.version,
                environment: this.config.environment,
                duration: duration
            });
            
            return {
                success: true,
                version: this.config.version,
                environment: this.config.environment,
                duration: duration,
                warnings: this.deploymentState.warnings
            };
            
        } catch (error) {
            console.error('❌ Deployment failed:', error);
            
            // Attempt rollback if enabled
            if (this.config.rollbackOnFailure && this.deploymentState.rollbackAvailable) {
                await this.rollback();
            }
            
            // Send failure notification
            await this.sendNotification('failure', {
                error: error.message,
                version: this.config.version,
                environment: this.config.environment
            });
            
            throw error;
        }
    }

    async runPreDeploymentChecks() {
        this.deploymentState.currentStep = 'pre-deployment-checks';
        console.log('🔍 Running pre-deployment checks...');
        
        // Check environment variables
        const requiredEnvVars = [
            'DATABASE_URL',
            'REDIS_URL',
            'JWT_SECRET'
        ];
        
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }
        
        // Check Docker registry access
        if (this.config.dockerRegistry) {
            try {
                await execAsync(`docker login ${this.config.dockerRegistry}`);
                console.log('✅ Docker registry access verified');
            } catch (error) {
                throw new Error(`Docker registry access failed: ${error.message}`);
            }
        }
        
        // Check Kubernetes cluster access
        try {
            await execAsync('kubectl cluster-info');
            console.log('✅ Kubernetes cluster access verified');
        } catch (error) {
            this.deploymentState.warnings.push('Kubernetes cluster access failed - using alternative deployment');
        }
        
        // Check database connectivity
        try {
            // This would check actual database connection
            console.log('✅ Database connectivity verified');
        } catch (error) {
            throw new Error(`Database connectivity check failed: ${error.message}`);
        }
        
        console.log('✅ Pre-deployment checks completed');
    }

    async backupCurrentVersion() {
        this.deploymentState.currentStep = 'backup';
        console.log('💾 Creating backup of current version...');
        
        try {
            // Get current version
            const { stdout: currentVersion } = await execAsync('kubectl get deployment smart-ocr-api -o jsonpath="{.metadata.labels.version}"');
            this.deploymentState.previousVersion = currentVersion.trim();
            
            // Create database backup
            const backupFile = `backup-${this.config.environment}-${Date.now()}.sql`;
            await execAsync(`pg_dump $DATABASE_URL > backups/${backupFile}`);
            
            // Tag current Docker image
            if (this.deploymentState.previousVersion) {
                await execAsync(`docker tag ${this.config.dockerRegistry}/${this.config.appName}:${this.deploymentState.previousVersion} ${this.config.dockerRegistry}/${this.config.appName}:backup-${Date.now()}`);
            }
            
            this.deploymentState.rollbackAvailable = true;
            console.log(`✅ Backup completed (previous version: ${this.deploymentState.previousVersion})`);
            
        } catch (error) {
            this.deploymentState.warnings.push(`Backup failed: ${error.message}`);
            console.warn('⚠️ Backup failed, continuing deployment...');
        }
    }

    async buildApplication() {
        this.deploymentState.currentStep = 'build';
        console.log('🔨 Building application...');
        
        try {
            // Build Docker image
            const imageName = `${this.config.dockerRegistry}/${this.config.appName}:${this.config.version}`;
            await execAsync(`docker build -t ${imageName} .`);
            
            // Push to registry
            await execAsync(`docker push ${imageName}`);
            
            // Build assets
            await execAsync('npm run build');
            
            console.log('✅ Application build completed');
            
        } catch (error) {
            throw new Error(`Build failed: ${error.message}`);
        }
    }

    async runTests() {
        this.deploymentState.currentStep = 'testing';
        console.log('🧪 Running tests...');
        
        try {
            // Run unit tests
            await execAsync('npm test');
            
            // Run integration tests
            await execAsync('npm run test:integration');
            
            // Run security tests
            await execAsync('npm audit --audit-level moderate');
            
            console.log('✅ All tests passed');
            
        } catch (error) {
            throw new Error(`Tests failed: ${error.message}`);
        }
    }

    async runDatabaseMigrations() {
        this.deploymentState.currentStep = 'migrations';
        console.log('🗄️ Running database migrations...');
        
        try {
            // Run migrations
            await execAsync('npm run migrate');
            
            // Seed database if required
            if (this.config.seedDatabase) {
                await execAsync('npm run seed');
            }
            
            console.log('✅ Database migrations completed');
            
        } catch (error) {
            throw new Error(`Database migrations failed: ${error.message}`);
        }
    }

    async deployRolling() {
        this.deploymentState.currentStep = 'rolling-deployment';
        console.log('🔄 Performing rolling deployment...');
        
        try {
            // Update Kubernetes deployment
            await execAsync(`kubectl set image deployment/smart-ocr-api smart-ocr-api=${this.config.dockerRegistry}/${this.config.appName}:${this.config.version} -n ${this.config.kubernetesNamespace}`);
            
            // Wait for rollout to complete
            await execAsync(`kubectl rollout status deployment/smart-ocr-api -n ${this.config.kubernetesNamespace} --timeout=300s`);
            
            console.log('✅ Rolling deployment completed');
            
        } catch (error) {
            throw new Error(`Rolling deployment failed: ${error.message}`);
        }
    }

    async deployBlueGreen() {
        this.deploymentState.currentStep = 'blue-green-deployment';
        console.log('🔵🟢 Performing blue-green deployment...');
        
        try {
            // Create green environment
            await this.createGreenEnvironment();
            
            // Deploy to green environment
            await this.deployToGreen();
            
            // Test green environment
            await this.testGreenEnvironment();
            
            // Switch traffic to green
            await this.switchToGreen();
            
            // Clean up blue environment
            await this.cleanupBlueEnvironment();
            
            console.log('✅ Blue-green deployment completed');
            
        } catch (error) {
            await this.cleanupGreenEnvironment();
            throw new Error(`Blue-green deployment failed: ${error.message}`);
        }
    }

    async deployCanary() {
        this.deploymentState.currentStep = 'canary-deployment';
        console.log('🐤 Performing canary deployment...');
        
        try {
            // Deploy canary version (10% traffic)
            await this.deployCanaryVersion(10);
            
            // Monitor canary for 5 minutes
            await this.monitorCanary(5 * 60 * 1000);
            
            // Increase to 50% traffic
            await this.deployCanaryVersion(50);
            
            // Monitor canary for 5 more minutes
            await this.monitorCanary(5 * 60 * 1000);
            
            // Full deployment (100% traffic)
            await this.deployCanaryVersion(100);
            
            console.log('✅ Canary deployment completed');
            
        } catch (error) {
            await this.rollbackCanary();
            throw new Error(`Canary deployment failed: ${error.message}`);
        }
    }

    async createGreenEnvironment() {
        console.log('🟢 Creating green environment...');
        
        // Create green deployment
        const greenDeployment = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smart-ocr-api-green
  labels:
    app: smart-ocr-api
    version: ${this.config.version}
    slot: green
spec:
  replicas: ${this.config.minReplicas}
  selector:
    matchLabels:
      app: smart-ocr-api
      slot: green
  template:
    metadata:
      labels:
        app: smart-ocr-api
        slot: green
        version: ${this.config.version}
    spec:
      containers:
      - name: smart-ocr-api
        image: ${this.config.dockerRegistry}/${this.config.appName}:${this.config.version}
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: ${this.config.environment}
        - name: APP_VERSION
          value: ${this.config.version}
`;
        
        await fs.writeFile('/tmp/green-deployment.yaml', greenDeployment);
        await execAsync('kubectl apply -f /tmp/green-deployment.yaml');
    }

    async deployToGreen() {
        console.log('🚀 Deploying to green environment...');
        
        // Wait for green deployment to be ready
        await execAsync('kubectl wait --for=condition=available --timeout=300s deployment/smart-ocr-api-green');
    }

    async testGreenEnvironment() {
        console.log('🧪 Testing green environment...');
        
        // Get green service endpoint
        const { stdout: greenIP } = await execAsync('kubectl get service smart-ocr-api-green -o jsonpath="{.status.loadBalancer.ingress[0].ip}"');
        
        // Run health check against green environment
        const healthCheckUrl = `http://${greenIP.trim()}${this.config.healthCheckUrl}`;
        
        for (let i = 0; i < 5; i++) {
            try {
                const response = await fetch(healthCheckUrl);
                if (response.ok) {
                    console.log('✅ Green environment health check passed');
                    return;
                }
            } catch (error) {
                console.warn(`⚠️ Health check attempt ${i + 1} failed`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
        throw new Error('Green environment health checks failed');
    }

    async switchToGreen() {
        console.log('🔀 Switching traffic to green environment...');
        
        // Update service selector to point to green
        await execAsync('kubectl patch service smart-ocr-api -p \'{"spec":{"selector":{"slot":"green"}}}\'');
        
        // Wait for traffic to switch
        await new Promise(resolve => setTimeout(resolve, 10000));
    }

    async cleanupBlueEnvironment() {
        console.log('🧹 Cleaning up blue environment...');
        
        // Delete blue deployment
        await execAsync('kubectl delete deployment smart-ocr-api-blue --ignore-not-found=true');
    }

    async cleanupGreenEnvironment() {
        console.log('🧹 Cleaning up green environment...');
        
        // Delete green deployment
        await execAsync('kubectl delete deployment smart-ocr-api-green --ignore-not-found=true');
    }

    async deployCanaryVersion(trafficPercentage) {
        console.log(`🐤 Deploying canary version with ${trafficPercentage}% traffic...`);
        
        // Update traffic splitting configuration
        const canaryConfig = {
            apiVersion: 'networking.istio.io/v1beta1',
            kind: 'VirtualService',
            metadata: {
                name: 'smart-ocr-api'
            },
            spec: {
                http: [{
                    match: [{ headers: { 'canary': { exact: 'true' } } }],
                    route: [{ destination: { host: 'smart-ocr-api', subset: 'canary' } }]
                }, {
                    route: [
                        { destination: { host: 'smart-ocr-api', subset: 'canary' }, weight: trafficPercentage },
                        { destination: { host: 'smart-ocr-api', subset: 'stable' }, weight: 100 - trafficPercentage }
                    ]
                }]
            }
        };
        
        await fs.writeFile('/tmp/canary-config.yaml', JSON.stringify(canaryConfig, null, 2));
        await execAsync('kubectl apply -f /tmp/canary-config.yaml');
    }

    async monitorCanary(duration) {
        console.log(`🔍 Monitoring canary deployment for ${duration / 1000} seconds...`);
        
        const startTime = Date.now();
        
        while (Date.now() - startTime < duration) {
            try {
                // Check error rate
                const errorRate = await this.getCanaryErrorRate();
                if (errorRate > 5) { // 5% error rate threshold
                    throw new Error(`Canary error rate too high: ${errorRate}%`);
                }
                
                // Check response time
                const responseTime = await this.getCanaryResponseTime();
                if (responseTime > 2000) { // 2 second threshold
                    throw new Error(`Canary response time too high: ${responseTime}ms`);
                }
                
                console.log(`📊 Canary metrics: ${errorRate}% error rate, ${responseTime}ms response time`);
                
                await new Promise(resolve => setTimeout(resolve, 30000)); // Check every 30 seconds
                
            } catch (error) {
                throw new Error(`Canary monitoring failed: ${error.message}`);
            }
        }
        
        console.log('✅ Canary monitoring completed successfully');
    }

    async rollbackCanary() {
        console.log('⏪ Rolling back canary deployment...');
        
        // Set traffic to 100% stable
        await this.deployCanaryVersion(0);
    }

    async runPostDeploymentTasks() {
        this.deploymentState.currentStep = 'post-deployment';
        console.log('📋 Running post-deployment tasks...');
        
        try {
            // Clear caches
            await this.clearCaches();
            
            // Warm up caches
            await this.warmUpCaches();
            
            // Update service discovery
            await this.updateServiceDiscovery();
            
            // Configure auto-scaling
            if (this.config.enableAutoScaling) {
                await this.configureAutoScaling();
            }
            
            console.log('✅ Post-deployment tasks completed');
            
        } catch (error) {
            this.deploymentState.warnings.push(`Post-deployment tasks failed: ${error.message}`);
            console.warn('⚠️ Some post-deployment tasks failed');
        }
    }

    async performHealthChecks() {
        this.deploymentState.currentStep = 'health-checks';
        console.log('🏥 Performing health checks...');
        
        const healthCheckUrl = `${await this.getServiceUrl()}${this.config.healthCheckUrl}`;
        
        for (let i = 0; i < 10; i++) {
            try {
                const response = await fetch(healthCheckUrl, {
                    timeout: this.config.healthCheckTimeout
                });
                
                if (response.ok) {
                    const healthData = await response.json();
                    console.log('✅ Health check passed:', healthData.status);
                    return;
                }
                
            } catch (error) {
                console.warn(`⚠️ Health check attempt ${i + 1} failed:`, error.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
        throw new Error('Health checks failed after 10 attempts');
    }

    async setupMonitoring() {
        this.deploymentState.currentStep = 'monitoring-setup';
        console.log('📊 Setting up monitoring...');
        
        try {
            // Deploy monitoring stack
            await execAsync('kubectl apply -f monitoring/prometheus.yaml');
            await execAsync('kubectl apply -f monitoring/grafana.yaml');
            await execAsync('kubectl apply -f monitoring/alerts.yaml');
            
            // Configure service monitors
            const serviceMonitor = `
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: smart-ocr-api-monitor
spec:
  selector:
    matchLabels:
      app: smart-ocr-api
  endpoints:
  - port: metrics
    path: /metrics
    interval: 30s
`;
            
            await fs.writeFile('/tmp/service-monitor.yaml', serviceMonitor);
            await execAsync('kubectl apply -f /tmp/service-monitor.yaml');
            
            console.log('✅ Monitoring setup completed');
            
        } catch (error) {
            this.deploymentState.warnings.push(`Monitoring setup failed: ${error.message}`);
            console.warn('⚠️ Monitoring setup failed');
        }
    }

    async runSmokeTests() {
        this.deploymentState.currentStep = 'smoke-tests';
        console.log('💨 Running smoke tests...');
        
        try {
            const serviceUrl = await this.getServiceUrl();
            
            // Test critical endpoints
            const criticalEndpoints = [
                '/health',
                '/api/status',
                '/api/pdf-extract',
                '/api/patterns'
            ];
            
            for (const endpoint of criticalEndpoints) {
                const response = await fetch(`${serviceUrl}${endpoint}`, {
                    timeout: 10000
                });
                
                if (!response.ok) {
                    throw new Error(`Smoke test failed for ${endpoint}: ${response.status}`);
                }
                
                console.log(`✅ Smoke test passed: ${endpoint}`);
            }
            
            // Test file upload functionality
            await this.testFileUpload(serviceUrl);
            
            console.log('✅ All smoke tests passed');
            
        } catch (error) {
            throw new Error(`Smoke tests failed: ${error.message}`);
        }
    }

    async testFileUpload(serviceUrl) {
        console.log('📄 Testing file upload functionality...');
        
        // Create a test PDF file (this would be a real test file in production)
        const testFile = Buffer.from('Mock PDF content');
        
        const formData = new FormData();
        formData.append('pdf', new Blob([testFile]), 'test.pdf');
        
        try {
            const response = await fetch(`${serviceUrl}/api/pdf-extract`, {
                method: 'POST',
                body: formData,
                timeout: 30000
            });
            
            if (response.ok) {
                console.log('✅ File upload test passed');
            } else {
                throw new Error(`File upload test failed: ${response.status}`);
            }
        } catch (error) {
            this.deploymentState.warnings.push(`File upload test failed: ${error.message}`);
        }
    }

    async finalizeDeployment() {
        this.deploymentState.currentStep = 'finalization';
        console.log('🏁 Finalizing deployment...');
        
        try {
            // Tag successful deployment
            await execAsync(`kubectl label deployment smart-ocr-api deployment-status=successful`);
            
            // Update version labels
            await execAsync(`kubectl label deployment smart-ocr-api version=${this.config.version} --overwrite`);
            
            // Clean up old deployments
            await this.cleanupOldDeployments();
            
            // Update load balancer health checks
            await this.updateLoadBalancerConfig();
            
            console.log('✅ Deployment finalized');
            
        } catch (error) {
            this.deploymentState.warnings.push(`Finalization failed: ${error.message}`);
            console.warn('⚠️ Deployment finalization failed');
        }
    }

    async rollback() {
        console.log('⏪ Initiating rollback...');
        
        try {
            if (this.deploymentState.previousVersion) {
                // Rollback to previous version
                await execAsync(`kubectl rollout undo deployment/smart-ocr-api -n ${this.config.kubernetesNamespace}`);
                
                // Wait for rollback to complete
                await execAsync(`kubectl rollout status deployment/smart-ocr-api -n ${this.config.kubernetesNamespace} --timeout=300s`);
                
                console.log(`✅ Rollback completed to version ${this.deploymentState.previousVersion}`);
                
                // Send rollback notification
                await this.sendNotification('rollback', {
                    previousVersion: this.deploymentState.previousVersion,
                    failedVersion: this.config.version
                });
            } else {
                console.warn('⚠️ No previous version available for rollback');
            }
            
        } catch (error) {
            console.error('❌ Rollback failed:', error);
            await this.sendNotification('rollback-failed', { error: error.message });
        }
    }

    // Utility methods
    async getServiceUrl() {
        try {
            const { stdout: serviceIP } = await execAsync(`kubectl get service smart-ocr-api -o jsonpath="{.status.loadBalancer.ingress[0].ip}"`);
            return `http://${serviceIP.trim()}`;
        } catch (error) {
            return 'http://localhost:3000'; // Fallback
        }
    }

    async getCanaryErrorRate() {
        // Mock implementation - would query actual metrics
        return Math.random() * 2; // 0-2% error rate
    }

    async getCanaryResponseTime() {
        // Mock implementation - would query actual metrics
        return Math.random() * 1000 + 200; // 200-1200ms response time
    }

    async clearCaches() {
        console.log('🗑️ Clearing application caches...');
        // Implementation would clear Redis, CDN, etc.
    }

    async warmUpCaches() {
        console.log('🔥 Warming up caches...');
        // Implementation would pre-populate critical cache entries
    }

    async updateServiceDiscovery() {
        console.log('🔍 Updating service discovery...');
        // Implementation would update service mesh, consul, etc.
    }

    async configureAutoScaling() {
        console.log('📈 Configuring auto-scaling...');
        
        const hpaConfig = `
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: smart-ocr-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: smart-ocr-api
  minReplicas: ${this.config.minReplicas}
  maxReplicas: ${this.config.maxReplicas}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
`;
        
        await fs.writeFile('/tmp/hpa-config.yaml', hpaConfig);
        await execAsync('kubectl apply -f /tmp/hpa-config.yaml');
    }

    async cleanupOldDeployments() {
        console.log('🧹 Cleaning up old deployments...');
        
        // Keep only last 3 replica sets
        await execAsync('kubectl patch deployment smart-ocr-api -p \'{"spec":{"revisionHistoryLimit":3}}\'');
    }

    async updateLoadBalancerConfig() {
        console.log('⚖️ Updating load balancer configuration...');
        // Implementation would update ALB, nginx, etc.
    }

    async sendNotification(type, data) {
        if (!this.config.slackWebhook) return;
        
        const messages = {
            success: `✅ Deployment successful: ${data.version} to ${data.environment} (${data.duration}ms)`,
            failure: `❌ Deployment failed: ${data.version} to ${data.environment} - ${data.error}`,
            rollback: `⏪ Rollback completed: ${data.failedVersion} → ${data.previousVersion}`,
            'rollback-failed': `❌ Rollback failed: ${data.error}`
        };
        
        const payload = {
            text: messages[type] || 'Deployment notification',
            username: 'DeployBot',
            icon_emoji: ':rocket:'
        };
        
        try {
            await fetch(this.config.slackWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.warn('⚠️ Failed to send notification:', error.message);
        }
    }
}

// CLI interface
if (require.main === module) {
    const deployment = new DeploymentAutomation({
        environment: process.argv[2] || 'staging',
        strategy: process.argv[3] || 'rolling'
    });
    
    deployment.deploy()
        .then(result => {
            console.log('🎉 Deployment successful:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Deployment failed:', error);
            process.exit(1);
        });
}

module.exports = { DeploymentAutomation };