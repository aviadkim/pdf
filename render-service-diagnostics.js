#!/usr/bin/env node

/**
 * RENDER SERVICE DIAGNOSTICS
 * 
 * Comprehensive diagnostics for the Render service
 * - Service information
 * - Deployment status
 * - Environment variables
 * - Build logs
 */

const axios = require('axios');

class RenderServiceDiagnostics {
    constructor() {
        this.renderApiKey = 'rnd_UQyw0Qdm42RRIcLq3qL8COdn5X1y';
        this.serviceId = 'srv-cqvhqhbtq21c73e3bnag';
        this.baseUrl = 'https://api.render.com/v1';
    }

    async getServiceInfo() {
        console.log('🔍 RENDER SERVICE DIAGNOSTICS');
        console.log('==============================');
        console.log(`Service ID: ${this.serviceId}`);
        console.log('');

        try {
            // Get service information
            console.log('1️⃣ Fetching service information...');
            const serviceResponse = await axios.get(
                `${this.baseUrl}/services/${this.serviceId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.renderApiKey}`,
                        'Accept': 'application/json'
                    }
                }
            );

            const service = serviceResponse.data;
            console.log('✅ Service Information:');
            console.log(`   Name: ${service.name}`);
            console.log(`   Type: ${service.type}`);
            console.log(`   Environment: ${service.environment}`);
            console.log(`   Region: ${service.region}`);
            console.log(`   Status: ${service.suspended ? 'SUSPENDED' : 'ACTIVE'}`);
            console.log(`   Auto Deploy: ${service.autoDeploy ? 'ENABLED' : 'DISABLED'}`);
            console.log(`   Branch: ${service.branch}`);
            console.log(`   Build Command: ${service.buildCommand || 'Default'}`);
            console.log(`   Start Command: ${service.startCommand || 'Default'}`);

            return service;

        } catch (error) {
            console.error('❌ Failed to fetch service info:', error.response?.data || error.message);
            return null;
        }
    }

    async getDeployments() {
        console.log('\n2️⃣ Fetching recent deployments...');
        
        try {
            const deploymentsResponse = await axios.get(
                `${this.baseUrl}/services/${this.serviceId}/deploys`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.renderApiKey}`,
                        'Accept': 'application/json'
                    },
                    params: {
                        limit: 5
                    }
                }
            );

            const deployments = deploymentsResponse.data;
            console.log(`✅ Found ${deployments.length} recent deployments:`);
            
            deployments.forEach((deploy, index) => {
                console.log(`   ${index + 1}. ${deploy.id}`);
                console.log(`      Status: ${deploy.status}`);
                console.log(`      Created: ${new Date(deploy.createdAt).toLocaleString()}`);
                console.log(`      Finished: ${deploy.finishedAt ? new Date(deploy.finishedAt).toLocaleString() : 'In Progress'}`);
                console.log(`      Commit: ${deploy.commit?.id?.substring(0, 8) || 'N/A'}`);
                console.log(`      Message: ${deploy.commit?.message?.substring(0, 60) || 'N/A'}...`);
                console.log('');
            });

            return deployments;

        } catch (error) {
            console.error('❌ Failed to fetch deployments:', error.response?.data || error.message);
            return [];
        }
    }

    async getEnvironmentVariables() {
        console.log('3️⃣ Checking environment variables...');
        
        try {
            const envResponse = await axios.get(
                `${this.baseUrl}/services/${this.serviceId}/env-vars`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.renderApiKey}`,
                        'Accept': 'application/json'
                    }
                }
            );

            const envVars = envResponse.data;
            console.log(`✅ Found ${envVars.length} environment variables:`);
            
            envVars.forEach(envVar => {
                const value = envVar.value ? '***SET***' : 'NOT SET';
                console.log(`   ${envVar.key}: ${value}`);
            });

            // Check for critical variables
            const criticalVars = ['MISTRAL_API_KEY', 'NODE_ENV', 'PORT'];
            const missingVars = criticalVars.filter(varName => 
                !envVars.find(env => env.key === varName)
            );

            if (missingVars.length > 0) {
                console.log(`⚠️  Missing critical variables: ${missingVars.join(', ')}`);
            } else {
                console.log('✅ All critical environment variables are set');
            }

            return envVars;

        } catch (error) {
            console.error('❌ Failed to fetch environment variables:', error.response?.data || error.message);
            return [];
        }
    }

    async getLogs() {
        console.log('\n4️⃣ Fetching service logs...');
        
        try {
            // Try different log endpoints
            const logEndpoints = [
                `/services/${this.serviceId}/logs`,
                `/services/${this.serviceId}/events`
            ];

            for (const endpoint of logEndpoints) {
                try {
                    console.log(`   Trying endpoint: ${endpoint}`);
                    const logsResponse = await axios.get(
                        `${this.baseUrl}${endpoint}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${this.renderApiKey}`,
                                'Accept': 'application/json'
                            },
                            params: {
                                limit: 50
                            }
                        }
                    );

                    const logs = logsResponse.data;
                    console.log(`✅ Fetched ${logs.length} log entries from ${endpoint}`);
                    
                    if (logs.length > 0) {
                        console.log('\n📋 Recent log entries:');
                        logs.slice(0, 10).forEach((log, index) => {
                            const timestamp = log.timestamp || log.createdAt || 'Unknown';
                            const message = log.message || log.text || JSON.stringify(log);
                            console.log(`   ${index + 1}. [${new Date(timestamp).toLocaleTimeString()}] ${message.substring(0, 100)}...`);
                        });
                    }

                    return logs;

                } catch (endpointError) {
                    console.log(`   ❌ ${endpoint}: ${endpointError.response?.status || endpointError.message}`);
                }
            }

        } catch (error) {
            console.error('❌ Failed to fetch logs:', error.response?.data || error.message);
            return [];
        }
    }

    async checkServiceHealth() {
        console.log('\n5️⃣ Checking service health...');
        
        try {
            const healthResponse = await axios.get('https://pdf-fzzi.onrender.com', {
                timeout: 10000
            });

            console.log(`✅ Service is responding: ${healthResponse.status}`);
            console.log(`   Response time: ${healthResponse.headers['x-response-time'] || 'N/A'}`);
            
            // Check if it's the right application
            const content = healthResponse.data;
            const hasSmartOCR = content.includes('Smart OCR');
            const hasSystemCapabilities = content.includes('system-capabilities');
            const hasMistralOCR = content.includes('mistral-ocr');
            
            console.log(`   Smart OCR content: ${hasSmartOCR ? '✅' : '❌'}`);
            console.log(`   System capabilities: ${hasSystemCapabilities ? '✅' : '❌'}`);
            console.log(`   Mistral OCR: ${hasMistralOCR ? '✅' : '❌'}`);

            if (!hasSystemCapabilities && !hasMistralOCR) {
                console.log('⚠️  Service appears to be running an older version');
                console.log('   The comprehensive system with API endpoints is not active');
            }

            return {
                responding: true,
                hasSmartOCR,
                hasSystemCapabilities,
                hasMistralOCR
            };

        } catch (error) {
            console.error('❌ Service health check failed:', error.message);
            return { responding: false, error: error.message };
        }
    }

    async runFullDiagnostics() {
        const results = {};
        
        results.service = await this.getServiceInfo();
        results.deployments = await this.getDeployments();
        results.envVars = await this.getEnvironmentVariables();
        results.logs = await this.getLogs();
        results.health = await this.checkServiceHealth();

        console.log('\n📊 DIAGNOSTIC SUMMARY');
        console.log('=====================');
        
        if (results.service) {
            console.log(`✅ Service Status: ${results.service.suspended ? 'SUSPENDED' : 'ACTIVE'}`);
        }
        
        if (results.deployments && results.deployments.length > 0) {
            const latestDeploy = results.deployments[0];
            console.log(`📦 Latest Deployment: ${latestDeploy.status} (${new Date(latestDeploy.createdAt).toLocaleString()})`);
        }
        
        if (results.health) {
            console.log(`🌐 Service Health: ${results.health.responding ? 'RESPONDING' : 'NOT RESPONDING'}`);
            if (results.health.responding && !results.health.hasSystemCapabilities) {
                console.log('⚠️  ISSUE: Service is running but API endpoints are not available');
                console.log('   This suggests the deployment is incomplete or failed');
            }
        }

        return results;
    }
}

async function main() {
    const diagnostics = new RenderServiceDiagnostics();
    await diagnostics.runFullDiagnostics();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { RenderServiceDiagnostics };
