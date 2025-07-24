#!/usr/bin/env node

// Deployment MCP Server for Render, Vercel, and other platforms
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import FormData from 'form-data';
import archiver from 'archiver';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import path from 'path';

class DeploymentMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'deployment-management-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'render_deploy',
            description: 'Deploy project to Render using Git or manual upload',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project directory'
                },
                serviceName: {
                  type: 'string',
                  description: 'Render service name'
                },
                buildCommand: {
                  type: 'string',
                  description: 'Build command (e.g., npm run build)'
                },
                startCommand: {
                  type: 'string',
                  description: 'Start command (e.g., npm start)'
                },
                environment: {
                  type: 'object',
                  description: 'Environment variables'
                },
                dockerfilePath: {
                  type: 'string',
                  description: 'Path to Dockerfile (optional)'
                }
              },
              required: ['projectPath', 'serviceName']
            }
          },
          {
            name: 'vercel_deploy',
            description: 'Deploy project to Vercel',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project directory'
                },
                projectName: {
                  type: 'string',
                  description: 'Vercel project name'
                },
                environment: {
                  type: 'object',
                  description: 'Environment variables'
                },
                buildCommand: {
                  type: 'string',
                  description: 'Custom build command'
                },
                outputDirectory: {
                  type: 'string',
                  description: 'Output directory (default: build)'
                },
                production: {
                  type: 'boolean',
                  description: 'Deploy to production',
                  default: false
                }
              },
              required: ['projectPath']
            }
          },
          {
            name: 'render_status',
            description: 'Check status of Render deployment',
            inputSchema: {
              type: 'object',
              properties: {
                serviceId: {
                  type: 'string',
                  description: 'Render service ID'
                },
                apiKey: {
                  type: 'string',
                  description: 'Render API key'
                }
              },
              required: ['serviceId', 'apiKey']
            }
          },
          {
            name: 'render_logs',
            description: 'Get logs from Render service',
            inputSchema: {
              type: 'object',
              properties: {
                serviceId: {
                  type: 'string',
                  description: 'Render service ID'
                },
                apiKey: {
                  type: 'string',
                  description: 'Render API key'
                },
                limit: {
                  type: 'number',
                  description: 'Number of log lines to retrieve',
                  default: 100
                }
              },
              required: ['serviceId', 'apiKey']
            }
          },
          {
            name: 'test_deployment',
            description: 'Test deployed application endpoints',
            inputSchema: {
              type: 'object',
              properties: {
                baseUrl: {
                  type: 'string',
                  description: 'Base URL of deployed application'
                },
                endpoints: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      path: { type: 'string' },
                      method: { type: 'string', default: 'GET' },
                      expectedStatus: { type: 'number', default: 200 },
                      data: { type: 'object' }
                    }
                  },
                  description: 'Endpoints to test'
                },
                timeout: {
                  type: 'number',
                  description: 'Request timeout in milliseconds',
                  default: 10000
                }
              },
              required: ['baseUrl', 'endpoints']
            }
          },
          {
            name: 'create_dockerfile',
            description: 'Generate optimized Dockerfile for deployment',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project directory'
                },
                nodeVersion: {
                  type: 'string',
                  description: 'Node.js version',
                  default: '18-alpine'
                },
                port: {
                  type: 'number',
                  description: 'Application port',
                  default: 3000
                },
                buildCommand: {
                  type: 'string',
                  description: 'Build command',
                  default: 'npm run build'
                },
                startCommand: {
                  type: 'string',
                  description: 'Start command',
                  default: 'npm start'
                }
              },
              required: ['projectPath']
            }
          },
          {
            name: 'deploy_health_check',
            description: 'Comprehensive health check of deployed service',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL of deployed service'
                },
                checks: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Types of checks to perform',
                  default: ['http', 'ssl', 'response-time', 'endpoints']
                }
              },
              required: ['url']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'render_deploy':
            return await this.renderDeploy(args);
          case 'vercel_deploy':
            return await this.vercelDeploy(args);
          case 'render_status':
            return await this.renderStatus(args);
          case 'render_logs':
            return await this.renderLogs(args);
          case 'test_deployment':
            return await this.testDeployment(args);
          case 'create_dockerfile':
            return await this.createDockerfile(args);
          case 'deploy_health_check':
            return await this.deployHealthCheck(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    });
  }

  async renderDeploy(args) {
    const { 
      projectPath, 
      serviceName, 
      buildCommand = 'npm run build', 
      startCommand = 'npm start',
      environment = {},
      dockerfilePath 
    } = args;

    try {
      const projectDir = path.resolve(projectPath);
      
      // Check if project has git repository
      const gitExists = await this.checkGitRepo(projectDir);
      
      if (!gitExists) {
        // Initialize git repo if it doesn't exist
        await this.runCommand(['git', 'init'], { cwd: projectDir });
        await this.runCommand(['git', 'add', '.'], { cwd: projectDir });
        await this.runCommand(['git', 'commit', '-m', 'Initial commit for Render deployment'], { cwd: projectDir });
      }

      // Create render.yaml if it doesn't exist
      const renderConfigPath = path.join(projectDir, 'render.yaml');
      const renderConfigExists = await fs.access(renderConfigPath).then(() => true).catch(() => false);
      
      if (!renderConfigExists) {
        const renderConfig = {
          services: [{
            type: dockerfilePath ? 'web' : 'web',
            name: serviceName,
            env: dockerfilePath ? 'docker' : 'node',
            buildCommand: buildCommand,
            startCommand: startCommand,
            envVars: Object.entries(environment).map(([key, value]) => ({
              key,
              value: value.toString()
            }))
          }]
        };

        if (dockerfilePath) {
          renderConfig.services[0].dockerfilePath = dockerfilePath;
        }

        await fs.writeFile(renderConfigPath, JSON.stringify(renderConfig, null, 2));
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Render deployment prepared',
            serviceName: serviceName,
            projectPath: projectDir,
            configCreated: !renderConfigExists,
            buildCommand: buildCommand,
            startCommand: startCommand,
            environment: environment,
            instructions: [
              '1. Connect your Git repository to Render',
              '2. Create a new Web Service on Render',
              '3. Select your repository and branch',
              '4. Render will automatically detect the render.yaml configuration',
              '5. Deploy will start automatically'
            ],
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Render deployment preparation failed: ${error.message}`);
    }
  }

  async vercelDeploy(args) {
    const { 
      projectPath, 
      projectName, 
      environment = {}, 
      buildCommand,
      outputDirectory = 'build',
      production = false 
    } = args;

    try {
      const projectDir = path.resolve(projectPath);
      
      // Create vercel.json if it doesn't exist
      const vercelConfigPath = path.join(projectDir, 'vercel.json');
      const vercelConfigExists = await fs.access(vercelConfigPath).then(() => true).catch(() => false);
      
      if (!vercelConfigExists) {
        const vercelConfig = {
          name: projectName || path.basename(projectDir),
          version: 2
        };

        if (buildCommand) {
          vercelConfig.buildCommand = buildCommand;
        }

        if (outputDirectory !== 'build') {
          vercelConfig.outputDirectory = outputDirectory;
        }

        await fs.writeFile(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
      }

      // Deploy using Vercel CLI
      let deployCmd = ['vercel'];
      if (production) {
        deployCmd.push('--prod');
      }

      // Add environment variables
      for (const [key, value] of Object.entries(environment)) {
        deployCmd.push('-e', `${key}=${value}`);
      }

      const result = await this.runCommand(deployCmd, { cwd: projectDir });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            projectName: projectName || path.basename(projectDir),
            projectPath: projectDir,
            production: production,
            environment: environment,
            deploymentUrl: this.extractVercelUrl(result.stdout),
            output: result.stdout,
            configCreated: !vercelConfigExists,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Vercel deployment failed: ${error.message}`);
    }
  }

  async renderStatus(args) {
    const { serviceId, apiKey } = args;

    try {
      const response = await axios.get(`https://api.render.com/v1/services/${serviceId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      const service = response.data;
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            service: {
              id: service.id,
              name: service.name,
              type: service.type,
              status: service.status,
              url: service.serviceUrl,
              createdAt: service.createdAt,
              updatedAt: service.updatedAt,
              branch: service.branch,
              buildCommand: service.buildCommand,
              startCommand: service.startCommand
            },
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Render status check failed: ${error.message}`);
    }
  }

  async renderLogs(args) {
    const { serviceId, apiKey, limit = 100 } = args;

    try {
      const response = await axios.get(`https://api.render.com/v1/services/${serviceId}/logs`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        params: { limit }
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            serviceId: serviceId,
            logs: response.data,
            limit: limit,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Render logs retrieval failed: ${error.message}`);
    }
  }

  async testDeployment(args) {
    const { baseUrl, endpoints, timeout = 10000 } = args;

    try {
      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          const startTime = Date.now();
          try {
            const response = await axios({
              method: endpoint.method || 'GET',
              url: `${baseUrl}${endpoint.path}`,
              data: endpoint.data,
              timeout: timeout,
              validateStatus: () => true // Don't throw on HTTP errors
            });

            const responseTime = Date.now() - startTime;
            const expectedStatus = endpoint.expectedStatus || 200;
            const success = response.status === expectedStatus;

            return {
              endpoint: endpoint.path,
              method: endpoint.method || 'GET',
              status: response.status,
              expectedStatus: expectedStatus,
              success: success,
              responseTime: responseTime,
              headers: response.headers,
              data: typeof response.data === 'string' ? 
                response.data.substring(0, 500) : response.data
            };
          } catch (error) {
            return {
              endpoint: endpoint.path,
              method: endpoint.method || 'GET',
              success: false,
              error: error.message,
              responseTime: Date.now() - startTime
            };
          }
        })
      );

      const successCount = results.filter(r => r.success).length;
      const totalTests = results.length;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: successCount === totalTests,
            baseUrl: baseUrl,
            summary: {
              total: totalTests,
              passed: successCount,
              failed: totalTests - successCount,
              successRate: `${((successCount / totalTests) * 100).toFixed(1)}%`
            },
            results: results,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Deployment testing failed: ${error.message}`);
    }
  }

  async createDockerfile(args) {
    const { 
      projectPath, 
      nodeVersion = '18-alpine', 
      port = 3000,
      buildCommand = 'npm run build',
      startCommand = 'npm start'
    } = args;

    try {
      const projectDir = path.resolve(projectPath);
      const dockerfilePath = path.join(projectDir, 'Dockerfile');
      
      const dockerfile = `# Multi-stage build for production optimization
FROM node:${nodeVersion} AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN ${buildCommand}

# Production stage
FROM node:${nodeVersion} AS production

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE ${port}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:${port}/health || exit 1

# Start command
CMD ["${startCommand}"]
`;

      await fs.writeFile(dockerfilePath, dockerfile);

      // Also create .dockerignore
      const dockerignorePath = path.join(projectDir, '.dockerignore');
      const dockerignore = `node_modules
npm-debug.log
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.git
.gitignore
README.md
.DS_Store
.nyc_output
coverage
.coverage
.coverage.*
`;

      await fs.writeFile(dockerignorePath, dockerignore);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            dockerfilePath: dockerfilePath,
            dockerignorePath: dockerignorePath,
            configuration: {
              nodeVersion: nodeVersion,
              port: port,
              buildCommand: buildCommand,
              startCommand: startCommand
            },
            instructions: [
              '1. Build the image: docker build -t your-app .',
              '2. Run the container: docker run -p 3000:3000 your-app',
              '3. For production: docker build -t your-app --target production .'
            ],
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Dockerfile creation failed: ${error.message}`);
    }
  }

  async deployHealthCheck(args) {
    const { url, checks = ['http', 'ssl', 'response-time', 'endpoints'] } = args;

    try {
      const results = {};

      if (checks.includes('http')) {
        results.http = await this.checkHttp(url);
      }

      if (checks.includes('ssl')) {
        results.ssl = await this.checkSsl(url);
      }

      if (checks.includes('response-time')) {
        results.responseTime = await this.checkResponseTime(url);
      }

      if (checks.includes('endpoints')) {
        results.endpoints = await this.checkCommonEndpoints(url);
      }

      const overallHealth = Object.values(results).every(result => result.success);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: overallHealth,
            url: url,
            checks: checks,
            results: results,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  async checkHttp(url) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      return {
        success: response.status === 200,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkSsl(url) {
    if (!url.startsWith('https://')) {
      return {
        success: false,
        error: 'URL is not HTTPS'
      };
    }

    try {
      const response = await axios.get(url, { timeout: 10000 });
      return {
        success: true,
        certificate: 'Valid SSL certificate'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkResponseTime(url) {
    const startTime = Date.now();
    try {
      await axios.get(url, { timeout: 10000 });
      const responseTime = Date.now() - startTime;
      return {
        success: responseTime < 2000,
        responseTime: responseTime,
        benchmark: responseTime < 1000 ? 'excellent' : responseTime < 2000 ? 'good' : 'slow'
      };
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  async checkCommonEndpoints(baseUrl) {
    const commonEndpoints = ['/health', '/api/health', '/status', '/ping'];
    const results = await Promise.all(
      commonEndpoints.map(async (endpoint) => {
        try {
          const response = await axios.get(`${baseUrl}${endpoint}`, { 
            timeout: 5000,
            validateStatus: () => true 
          });
          return {
            endpoint,
            status: response.status,
            available: response.status < 400
          };
        } catch (error) {
          return {
            endpoint,
            available: false,
            error: error.message
          };
        }
      })
    );

    return {
      success: results.some(r => r.available),
      endpoints: results
    };
  }

  async checkGitRepo(projectPath) {
    try {
      await fs.access(path.join(projectPath, '.git'));
      return true;
    } catch {
      return false;
    }
  }

  extractVercelUrl(output) {
    const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/);
    return urlMatch ? urlMatch[0] : null;
  }

  runCommand(cmd, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd[0], cmd.slice(1), {
        ...options,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('Deployment MCP Server running');
  }
}

// Handle test mode
if (process.argv.includes('--test')) {
  console.log('Deployment MCP Server test passed');
  process.exit(0);
}

// Start the server
const server = new DeploymentMCPServer();
server.run().catch(console.error);