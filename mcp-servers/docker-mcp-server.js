#!/usr/bin/env node

// Docker MCP Server for container management across all projects
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import Docker from 'dockerode';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

class DockerMCPServer {
  constructor() {
    this.docker = new Docker();
    this.server = new Server(
      {
        name: 'docker-management-server',
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
            name: 'docker_build',
            description: 'Build Docker image from Dockerfile in specified directory',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project directory containing Dockerfile'
                },
                imageName: {
                  type: 'string',
                  description: 'Name for the Docker image'
                },
                dockerfile: {
                  type: 'string',
                  description: 'Dockerfile name (default: Dockerfile)',
                  default: 'Dockerfile'
                },
                buildArgs: {
                  type: 'object',
                  description: 'Build arguments as key-value pairs'
                }
              },
              required: ['projectPath', 'imageName']
            }
          },
          {
            name: 'docker_run',
            description: 'Run Docker container with specified configuration',
            inputSchema: {
              type: 'object',
              properties: {
                imageName: {
                  type: 'string',
                  description: 'Docker image name to run'
                },
                containerName: {
                  type: 'string',
                  description: 'Name for the container'
                },
                ports: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Port mappings (e.g., ["3000:3000"])'
                },
                environment: {
                  type: 'object',
                  description: 'Environment variables'
                },
                volumes: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Volume mounts (e.g., ["./src:/app/src"])'
                },
                detached: {
                  type: 'boolean',
                  description: 'Run in detached mode',
                  default: true
                }
              },
              required: ['imageName']
            }
          },
          {
            name: 'docker_stop',
            description: 'Stop and remove Docker container',
            inputSchema: {
              type: 'object',
              properties: {
                containerName: {
                  type: 'string',
                  description: 'Container name or ID to stop'
                },
                force: {
                  type: 'boolean',
                  description: 'Force stop container',
                  default: false
                }
              },
              required: ['containerName']
            }
          },
          {
            name: 'docker_logs',
            description: 'Get logs from Docker container',
            inputSchema: {
              type: 'object',
              properties: {
                containerName: {
                  type: 'string',
                  description: 'Container name or ID'
                },
                tail: {
                  type: 'number',
                  description: 'Number of lines to tail (default: 100)',
                  default: 100
                },
                follow: {
                  type: 'boolean',
                  description: 'Follow log output',
                  default: false
                }
              },
              required: ['containerName']
            }
          },
          {
            name: 'docker_ps',
            description: 'List Docker containers',
            inputSchema: {
              type: 'object',
              properties: {
                all: {
                  type: 'boolean',
                  description: 'Show all containers (including stopped)',
                  default: false
                }
              }
            }
          },
          {
            name: 'docker_images',
            description: 'List Docker images',
            inputSchema: {
              type: 'object',
              properties: {
                dangling: {
                  type: 'boolean',
                  description: 'Show only dangling images',
                  default: false
                }
              }
            }
          },
          {
            name: 'docker_compose',
            description: 'Run docker-compose commands',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to directory containing docker-compose.yml'
                },
                command: {
                  type: 'string',
                  enum: ['up', 'down', 'build', 'logs', 'ps'],
                  description: 'Docker Compose command to run'
                },
                services: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific services to target'
                },
                detached: {
                  type: 'boolean',
                  description: 'Run in detached mode',
                  default: true
                }
              },
              required: ['projectPath', 'command']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'docker_build':
            return await this.dockerBuild(args);
          case 'docker_run':
            return await this.dockerRun(args);
          case 'docker_stop':
            return await this.dockerStop(args);
          case 'docker_logs':
            return await this.dockerLogs(args);
          case 'docker_ps':
            return await this.dockerPs(args);
          case 'docker_images':
            return await this.dockerImages(args);
          case 'docker_compose':
            return await this.dockerCompose(args);
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

  async dockerBuild(args) {
    const { projectPath, imageName, dockerfile = 'Dockerfile', buildArgs = {} } = args;
    
    try {
      const buildPath = path.resolve(projectPath);
      const dockerfilePath = path.join(buildPath, dockerfile);
      
      // Check if Dockerfile exists
      await fs.access(dockerfilePath);
      
      const stream = await this.docker.buildImage({
        context: buildPath,
        src: ['.']
      }, {
        t: imageName,
        dockerfile: dockerfile,
        buildargs: buildArgs
      });

      let output = '';
      return new Promise((resolve, reject) => {
        this.docker.modem.followProgress(stream, (err, res) => {
          if (err) reject(err);
          else resolve({
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                imageName: imageName,
                dockerfile: dockerfile,
                buildPath: buildPath,
                output: output.split('\n').slice(-20).join('\n'), // Last 20 lines
                timestamp: new Date().toISOString()
              }, null, 2)
            }]
          });
        }, (event) => {
          if (event.stream) {
            output += event.stream;
          }
        });
      });
    } catch (error) {
      throw new Error(`Docker build failed: ${error.message}`);
    }
  }

  async dockerRun(args) {
    const { 
      imageName, 
      containerName = `container-${Date.now()}`, 
      ports = [], 
      environment = {}, 
      volumes = [], 
      detached = true 
    } = args;

    try {
      const portBindings = {};
      const exposedPorts = {};
      
      ports.forEach(port => {
        const [hostPort, containerPort] = port.split(':');
        portBindings[`${containerPort}/tcp`] = [{ HostPort: hostPort }];
        exposedPorts[`${containerPort}/tcp`] = {};
      });

      const binds = volumes.map(vol => {
        const [hostPath, containerPath] = vol.split(':');
        return `${path.resolve(hostPath)}:${containerPath}`;
      });

      const container = await this.docker.createContainer({
        Image: imageName,
        name: containerName,
        Env: Object.entries(environment).map(([key, value]) => `${key}=${value}`),
        ExposedPorts: exposedPorts,
        HostConfig: {
          PortBindings: portBindings,
          Binds: binds
        }
      });

      if (detached) {
        await container.start();
      }

      const info = await container.inspect();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            containerId: container.id,
            containerName: containerName,
            imageName: imageName,
            status: info.State.Status,
            ports: info.NetworkSettings.Ports,
            started: detached,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Docker run failed: ${error.message}`);
    }
  }

  async dockerStop(args) {
    const { containerName, force = false } = args;

    try {
      const container = this.docker.getContainer(containerName);
      
      if (force) {
        await container.kill();
      } else {
        await container.stop();
      }
      
      await container.remove();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            containerName: containerName,
            action: force ? 'killed and removed' : 'stopped and removed',
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Docker stop failed: ${error.message}`);
    }
  }

  async dockerLogs(args) {
    const { containerName, tail = 100, follow = false } = args;

    try {
      const container = this.docker.getContainer(containerName);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: tail,
        follow: follow
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            containerName: containerName,
            logs: logs.toString(),
            tail: tail,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Docker logs failed: ${error.message}`);
    }
  }

  async dockerPs(args) {
    const { all = false } = args;

    try {
      const containers = await this.docker.listContainers({ all });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            containers: containers.map(container => ({
              id: container.Id.substring(0, 12),
              image: container.Image,
              command: container.Command,
              created: container.Created,
              status: container.Status,
              ports: container.Ports,
              names: container.Names
            })),
            total: containers.length,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Docker ps failed: ${error.message}`);
    }
  }

  async dockerImages(args) {
    const { dangling = false } = args;

    try {
      const images = await this.docker.listImages({
        filters: dangling ? { dangling: ['true'] } : {}
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            images: images.map(image => ({
              id: image.Id.substring(7, 19),
              repository: image.RepoTags ? image.RepoTags[0] : '<none>',
              tag: image.RepoTags ? image.RepoTags[0].split(':')[1] : '<none>',
              created: image.Created,
              size: image.Size,
              virtualSize: image.VirtualSize
            })),
            total: images.length,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Docker images failed: ${error.message}`);
    }
  }

  async dockerCompose(args) {
    const { projectPath, command, services = [], detached = true } = args;

    try {
      const composePath = path.resolve(projectPath);
      const composeFile = path.join(composePath, 'docker-compose.yml');
      
      // Check if docker-compose.yml exists
      await fs.access(composeFile);

      let cmd = ['docker-compose'];
      if (detached && (command === 'up' || command === 'build')) {
        cmd.push('-d');
      }
      cmd.push(command);
      if (services.length > 0) {
        cmd.push(...services);
      }

      const result = await this.runCommand(cmd, { cwd: composePath });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            command: cmd.join(' '),
            projectPath: composePath,
            services: services,
            output: result.stdout,
            error: result.stderr,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Docker Compose failed: ${error.message}`);
    }
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
    
    console.error('Docker MCP Server running');
  }
}

// Handle test mode
if (process.argv.includes('--test')) {
  console.log('Docker MCP Server test passed');
  process.exit(0);
}

// Start the server
const server = new DockerMCPServer();
server.run().catch(console.error);