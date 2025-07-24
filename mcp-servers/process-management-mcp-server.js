#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

class ProcessManagementMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'process-management-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.runningProcesses = new Map();
    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_processes',
          description: 'List running processes with optional filtering',
          inputSchema: {
            type: 'object',
            properties: {
              filter: {
                type: 'string',
                description: 'Filter processes by name or pattern',
              },
              sort_by: {
                type: 'string',
                enum: ['pid', 'name', 'cpu', 'memory'],
                description: 'Sort processes by field',
                default: 'pid',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of processes to return',
                default: 20,
              },
            },
          },
        },
        {
          name: 'start_process',
          description: 'Start a new process',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'Command to execute',
              },
              args: {
                type: 'array',
                items: { type: 'string' },
                description: 'Command arguments',
                default: [],
              },
              working_directory: {
                type: 'string',
                description: 'Working directory for the process',
              },
              environment: {
                type: 'object',
                description: 'Environment variables',
              },
              detached: {
                type: 'boolean',
                description: 'Run process in detached mode',
                default: false,
              },
            },
            required: ['command'],
          },
        },
        {
          name: 'kill_process',
          description: 'Terminate a process by PID or name',
          inputSchema: {
            type: 'object',
            properties: {
              identifier: {
                type: 'string',
                description: 'Process PID or name pattern',
              },
              signal: {
                type: 'string',
                enum: ['SIGTERM', 'SIGKILL', 'SIGINT'],
                description: 'Signal to send',
                default: 'SIGTERM',
              },
              force: {
                type: 'boolean',
                description: 'Force kill if graceful termination fails',
                default: false,
              },
            },
            required: ['identifier'],
          },
        },
        {
          name: 'monitor_process',
          description: 'Monitor a process and get real-time stats',
          inputSchema: {
            type: 'object',
            properties: {
              pid: {
                type: 'string',
                description: 'Process ID to monitor',
              },
              duration: {
                type: 'number',
                description: 'Monitoring duration in seconds',
                default: 30,
              },
              interval: {
                type: 'number',
                description: 'Sampling interval in seconds',
                default: 1,
              },
            },
            required: ['pid'],
          },
        },
        {
          name: 'system_info',
          description: 'Get system information and resource usage',
          inputSchema: {
            type: 'object',
            properties: {
              include: {
                type: 'array',
                items: { 
                  type: 'string',
                  enum: ['cpu', 'memory', 'disk', 'network', 'processes']
                },
                description: 'Information to include',
                default: ['cpu', 'memory', 'disk', 'processes'],
              },
            },
          },
        },
        {
          name: 'process_tree',
          description: 'Display process tree showing parent-child relationships',
          inputSchema: {
            type: 'object',
            properties: {
              root_pid: {
                type: 'string',
                description: 'Root process PID (optional)',
              },
              depth: {
                type: 'number',
                description: 'Maximum tree depth',
                default: 5,
              },
            },
          },
        },
        {
          name: 'service_management',
          description: 'Manage system services (start/stop/status)',
          inputSchema: {
            type: 'object',
            properties: {
              service_name: {
                type: 'string',
                description: 'Service name',
              },
              action: {
                type: 'string',
                enum: ['start', 'stop', 'restart', 'status', 'list'],
                description: 'Service action',
              },
            },
            required: ['action'],
          },
        },
        {
          name: 'resource_monitor',
          description: 'Monitor system resources over time',
          inputSchema: {
            type: 'object',
            properties: {
              resources: {
                type: 'array',
                items: { 
                  type: 'string',
                  enum: ['cpu', 'memory', 'disk_io', 'network_io']
                },
                description: 'Resources to monitor',
                default: ['cpu', 'memory'],
              },
              duration: {
                type: 'number',
                description: 'Monitoring duration in seconds',
                default: 60,
              },
              interval: {
                type: 'number',
                description: 'Sampling interval in seconds',
                default: 5,
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'list_processes':
          return await this.listProcesses(request.params.arguments);
        case 'start_process':
          return await this.startProcess(request.params.arguments);
        case 'kill_process':
          return await this.killProcess(request.params.arguments);
        case 'monitor_process':
          return await this.monitorProcess(request.params.arguments);
        case 'system_info':
          return await this.getSystemInfo(request.params.arguments);
        case 'process_tree':
          return await this.getProcessTree(request.params.arguments);
        case 'service_management':
          return await this.manageService(request.params.arguments);
        case 'resource_monitor':
          return await this.monitorResources(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async listProcesses(args) {
    try {
      const { filter, sort_by = 'pid', limit = 20 } = args;
      
      let command;
      if (os.platform() === 'win32') {
        command = 'wmic process get ProcessId,Name,PageFileUsage,WorkingSetSize /format:csv';
      } else {
        command = 'ps aux --no-headers';
      }

      const { stdout } = await execAsync(command);
      const processes = this.parseProcessList(stdout, os.platform());
      
      let filteredProcesses = processes;
      if (filter) {
        const filterRegex = new RegExp(filter, 'i');
        filteredProcesses = processes.filter(p => 
          p.name.match(filterRegex) || p.pid.toString().includes(filter)
        );
      }

      // Sort processes
      filteredProcesses.sort((a, b) => {
        switch (sort_by) {
          case 'pid': return parseInt(a.pid) - parseInt(b.pid);
          case 'name': return a.name.localeCompare(b.name);
          case 'cpu': return parseFloat(b.cpu || 0) - parseFloat(a.cpu || 0);
          case 'memory': return parseFloat(b.memory || 0) - parseFloat(a.memory || 0);
          default: return 0;
        }
      });

      const limitedProcesses = filteredProcesses.slice(0, limit);

      let resultText = `🔍 Process List (${limitedProcesses.length}/${filteredProcesses.length} shown, sorted by ${sort_by}):\n\n`;
      
      if (filter) {
        resultText += `📋 Filter: "${filter}"\n\n`;
      }

      resultText += `${'PID'.padEnd(8)} ${'Name'.padEnd(25)} ${'CPU%'.padEnd(6)} ${'Memory'.padEnd(10)}\n`;
      resultText += '-'.repeat(55) + '\n';

      limitedProcesses.forEach(proc => {
        resultText += `${proc.pid.toString().padEnd(8)} `;
        resultText += `${proc.name.slice(0, 24).padEnd(25)} `;
        resultText += `${(proc.cpu || 'N/A').toString().padEnd(6)} `;
        resultText += `${this.formatMemory(proc.memory || 0).padEnd(10)}\n`;
      });

      if (filteredProcesses.length > limit) {
        resultText += `\n... and ${filteredProcesses.length - limit} more processes`;
      }

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list processes: ${error.message}`);
    }
  }

  async startProcess(args) {
    try {
      const {
        command,
        args: processArgs = [],
        working_directory,
        environment,
        detached = false
      } = args;

      const processId = Date.now().toString();
      
      const spawnOptions = {
        detached,
        stdio: detached ? 'ignore' : 'pipe',
        cwd: working_directory,
        env: environment ? { ...process.env, ...environment } : process.env
      };

      const childProcess = spawn(command, processArgs, spawnOptions);
      
      if (detached) {
        childProcess.unref();
      }

      this.runningProcesses.set(processId, {
        pid: childProcess.pid,
        command,
        args: processArgs,
        startTime: new Date(),
        detached,
        process: childProcess
      });

      let resultText = `🚀 Process Started:\n\n`;
      resultText += `📋 Command: ${command} ${processArgs.join(' ')}\n`;
      resultText += `🆔 PID: ${childProcess.pid}\n`;
      resultText += `📁 Working Directory: ${working_directory || process.cwd()}\n`;
      resultText += `🔗 Detached: ${detached ? 'Yes' : 'No'}\n`;
      resultText += `⏰ Started: ${new Date().toLocaleString()}\n`;

      if (!detached) {
        resultText += `\n⚠️ Process is attached. It will terminate when this session ends.`;
      }

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to start process: ${error.message}`);
    }
  }

  async killProcess(args) {
    try {
      const { identifier, signal = 'SIGTERM', force = false } = args;
      
      const results = [];
      
      // Check if identifier is a PID
      if (/^\d+$/.test(identifier)) {
        try {
          process.kill(parseInt(identifier), signal);
          results.push({
            pid: identifier,
            status: 'terminated',
            signal
          });
        } catch (error) {
          results.push({
            pid: identifier,
            status: 'error',
            error: error.message
          });
        }
      } else {
        // Find processes by name pattern
        const { stdout } = await execAsync(
          os.platform() === 'win32' 
            ? `tasklist /fo csv | findstr /i "${identifier}"`
            : `pgrep -f "${identifier}"`
        ).catch(() => ({ stdout: '' }));

        const pids = this.extractPidsFromOutput(stdout, identifier);
        
        for (const pid of pids) {
          try {
            process.kill(parseInt(pid), signal);
            results.push({
              pid,
              status: 'terminated',
              signal
            });
          } catch (error) {
            results.push({
              pid,
              status: 'error',
              error: error.message
            });
          }
        }
      }

      // Force kill if requested and graceful termination failed
      if (force && results.some(r => r.status === 'error')) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        for (const result of results.filter(r => r.status === 'error')) {
          try {
            process.kill(parseInt(result.pid), 'SIGKILL');
            result.status = 'force killed';
            result.signal = 'SIGKILL';
          } catch (error) {
            result.forceKillError = error.message;
          }
        }
      }

      let resultText = `💀 Process Termination Results:\n\n`;
      
      results.forEach(result => {
        const icon = result.status === 'terminated' || result.status === 'force killed' ? '✅' : '❌';
        resultText += `${icon} PID ${result.pid}: ${result.status}`;
        if (result.signal) resultText += ` (${result.signal})`;
        if (result.error) resultText += ` - ${result.error}`;
        resultText += '\n';
      });

      const successful = results.filter(r => r.status !== 'error').length;
      const failed = results.length - successful;
      
      resultText += `\n📊 Summary: ${successful} terminated, ${failed} failed`;

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to kill process: ${error.message}`);
    }
  }

  async monitorProcess(args) {
    try {
      const { pid, duration = 30, interval = 1 } = args;
      
      const samples = [];
      const maxSamples = Math.min(duration / interval, 60); // Limit to 60 samples
      
      for (let i = 0; i < maxSamples; i++) {
        try {
          const stats = await this.getProcessStats(pid);
          samples.push({
            timestamp: new Date(),
            ...stats
          });
          
          if (i < maxSamples - 1) {
            await new Promise(resolve => setTimeout(resolve, interval * 1000));
          }
        } catch (error) {
          samples.push({
            timestamp: new Date(),
            error: error.message
          });
          break;
        }
      }

      const validSamples = samples.filter(s => !s.error);
      const avgCpu = validSamples.length > 0 ? 
        validSamples.reduce((sum, s) => sum + (s.cpu || 0), 0) / validSamples.length : 0;
      const avgMemory = validSamples.length > 0 ? 
        validSamples.reduce((sum, s) => sum + (s.memory || 0), 0) / validSamples.length : 0;

      let resultText = `📊 Process Monitoring Results (PID: ${pid}):\n\n`;
      resultText += `⏱️ Duration: ${duration}s (${interval}s intervals)\n`;
      resultText += `📈 Samples: ${samples.length}\n`;
      resultText += `💻 Average CPU: ${avgCpu.toFixed(1)}%\n`;
      resultText += `🧠 Average Memory: ${this.formatMemory(avgMemory)}\n\n`;

      if (validSamples.length > 0) {
        resultText += `📋 Sample Data:\n`;
        resultText += `${'Time'.padEnd(12)} ${'CPU%'.padEnd(8)} ${'Memory'.padEnd(12)} ${'Status'.padEnd(10)}\n`;
        resultText += '-'.repeat(45) + '\n';

        samples.slice(-10).forEach(sample => {
          const time = sample.timestamp.toLocaleTimeString().slice(-8);
          if (sample.error) {
            resultText += `${time.padEnd(12)} ${'N/A'.padEnd(8)} ${'N/A'.padEnd(12)} Error\n`;
          } else {
            resultText += `${time.padEnd(12)} `;
            resultText += `${(sample.cpu || 0).toFixed(1).padEnd(8)} `;
            resultText += `${this.formatMemory(sample.memory || 0).padEnd(12)} `;
            resultText += `Running\n`;
          }
        });
      }

      const errors = samples.filter(s => s.error).length;
      if (errors > 0) {
        resultText += `\n⚠️ Errors encountered: ${errors}`;
      }

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to monitor process: ${error.message}`);
    }
  }

  async getSystemInfo(args) {
    try {
      const { include = ['cpu', 'memory', 'disk', 'processes'] } = args;
      
      let resultText = `💻 System Information:\n\n`;
      
      // Basic system info
      resultText += `🖥️ Platform: ${os.platform()}\n`;
      resultText += `🏗️ Architecture: ${os.arch()}\n`;
      resultText += `📋 Hostname: ${os.hostname()}\n`;
      resultText += `⏰ Uptime: ${this.formatUptime(os.uptime())}\n\n`;

      if (include.includes('cpu')) {
        const cpus = os.cpus();
        const loadAvg = os.loadavg();
        
        resultText += `🧠 CPU Information:\n`;
        resultText += `   Model: ${cpus[0].model}\n`;
        resultText += `   Cores: ${cpus.length}\n`;
        resultText += `   Speed: ${cpus[0].speed} MHz\n`;
        if (os.platform() !== 'win32') {
          resultText += `   Load Average: ${loadAvg.map(l => l.toFixed(2)).join(', ')}\n`;
        }
        resultText += '\n';
      }

      if (include.includes('memory')) {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memUsage = (usedMem / totalMem) * 100;
        
        resultText += `🧠 Memory Information:\n`;
        resultText += `   Total: ${this.formatMemory(totalMem)}\n`;
        resultText += `   Used: ${this.formatMemory(usedMem)} (${memUsage.toFixed(1)}%)\n`;
        resultText += `   Free: ${this.formatMemory(freeMem)}\n\n`;
      }

      if (include.includes('processes')) {
        try {
          const { stdout } = await execAsync(
            os.platform() === 'win32' 
              ? 'tasklist /fo csv | find /c /v ""'
              : 'ps aux --no-headers | wc -l'
          );
          const processCount = parseInt(stdout.trim());
          
          resultText += `🔄 Process Information:\n`;
          resultText += `   Total Processes: ${processCount}\n`;
          resultText += `   Managed Processes: ${this.runningProcesses.size}\n\n`;
        } catch (error) {
          resultText += `🔄 Process Information: Unable to retrieve\n\n`;
        }
      }

      if (include.includes('network')) {
        const networkInterfaces = os.networkInterfaces();
        const activeInterfaces = Object.keys(networkInterfaces).length;
        
        resultText += `🌐 Network Information:\n`;
        resultText += `   Interfaces: ${activeInterfaces}\n`;
        
        Object.entries(networkInterfaces).forEach(([name, interfaces]) => {
          const ipv4 = interfaces.find(iface => iface.family === 'IPv4' && !iface.internal);
          if (ipv4) {
            resultText += `   ${name}: ${ipv4.address}\n`;
          }
        });
        resultText += '\n';
      }

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get system info: ${error.message}`);
    }
  }

  async getProcessTree(args) {
    try {
      const { root_pid, depth = 5 } = args;
      
      let command;
      if (os.platform() === 'win32') {
        command = 'wmic process get ProcessId,ParentProcessId,Name /format:csv';
      } else {
        command = 'ps -eo pid,ppid,comm --no-headers';
      }

      const { stdout } = await execAsync(command);
      const processes = this.parseProcessTreeData(stdout, os.platform());
      
      const tree = this.buildProcessTree(processes, root_pid, depth);
      let resultText = `🌳 Process Tree:\n\n`;
      
      if (root_pid) {
        resultText += `🎯 Root PID: ${root_pid}\n`;
      }
      resultText += `📏 Max Depth: ${depth}\n\n`;

      resultText += this.formatProcessTree(tree, 0, depth);

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get process tree: ${error.message}`);
    }
  }

  async manageService(args) {
    try {
      const { service_name, action } = args;
      
      let command;
      let resultText = `⚙️ Service Management:\n\n`;

      if (os.platform() === 'win32') {
        switch (action) {
          case 'list':
            command = 'sc query type=service state=all';
            break;
          case 'status':
            command = `sc query "${service_name}"`;
            break;
          case 'start':
            command = `sc start "${service_name}"`;
            break;
          case 'stop':
            command = `sc stop "${service_name}"`;
            break;
          case 'restart':
            command = `sc stop "${service_name}" && timeout 2 && sc start "${service_name}"`;
            break;
        }
      } else {
        switch (action) {
          case 'list':
            command = 'systemctl list-units --type=service --no-pager';
            break;
          case 'status':
            command = `systemctl status "${service_name}" --no-pager`;
            break;
          case 'start':
            command = `systemctl start "${service_name}"`;
            break;
          case 'stop':
            command = `systemctl stop "${service_name}"`;
            break;
          case 'restart':
            command = `systemctl restart "${service_name}"`;
            break;
        }
      }

      if (!command) {
        throw new Error(`Unsupported action: ${action}`);
      }

      const { stdout, stderr } = await execAsync(command).catch(e => ({
        stdout: e.stdout || '',
        stderr: e.stderr || e.message
      }));

      resultText += `🔧 Action: ${action.toUpperCase()}\n`;
      if (service_name) {
        resultText += `📋 Service: ${service_name}\n`;
      }
      resultText += `⏰ Executed: ${new Date().toLocaleString()}\n\n`;

      if (stdout) {
        resultText += `📤 Output:\n${stdout}\n`;
      }
      
      if (stderr) {
        resultText += `⚠️ Errors:\n${stderr}`;
      }

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to manage service: ${error.message}`);
    }
  }

  async monitorResources(args) {
    try {
      const {
        resources = ['cpu', 'memory'],
        duration = 60,
        interval = 5
      } = args;

      const samples = [];
      const maxSamples = Math.min(Math.floor(duration / interval), 20);

      for (let i = 0; i < maxSamples; i++) {
        const sample = {
          timestamp: new Date(),
        };

        if (resources.includes('cpu')) {
          sample.cpu = await this.getCpuUsage();
        }

        if (resources.includes('memory')) {
          const totalMem = os.totalmem();
          const freeMem = os.freemem();
          sample.memory = ((totalMem - freeMem) / totalMem) * 100;
        }

        samples.push(sample);

        if (i < maxSamples - 1) {
          await new Promise(resolve => setTimeout(resolve, interval * 1000));
        }
      }

      let resultText = `📊 Resource Monitoring Results:\n\n`;
      resultText += `⏱️ Duration: ${duration}s (${interval}s intervals)\n`;
      resultText += `📈 Resources: ${resources.join(', ')}\n`;
      resultText += `📋 Samples: ${samples.length}\n\n`;

      // Calculate averages
      if (resources.includes('cpu')) {
        const avgCpu = samples.reduce((sum, s) => sum + (s.cpu || 0), 0) / samples.length;
        resultText += `💻 Average CPU: ${avgCpu.toFixed(1)}%\n`;
      }

      if (resources.includes('memory')) {
        const avgMemory = samples.reduce((sum, s) => sum + (s.memory || 0), 0) / samples.length;
        resultText += `🧠 Average Memory: ${avgMemory.toFixed(1)}%\n`;
      }

      resultText += `\n📋 Sample Data:\n`;
      resultText += `${'Time'.padEnd(12)} `;
      if (resources.includes('cpu')) resultText += `${'CPU%'.padEnd(8)} `;
      if (resources.includes('memory')) resultText += `${'Memory%'.padEnd(10)} `;
      resultText += '\n';
      resultText += '-'.repeat(12 + (resources.includes('cpu') ? 8 : 0) + (resources.includes('memory') ? 10 : 0)) + '\n';

      samples.slice(-10).forEach(sample => {
        const time = sample.timestamp.toLocaleTimeString().slice(-8);
        resultText += `${time.padEnd(12)} `;
        
        if (resources.includes('cpu')) {
          resultText += `${(sample.cpu || 0).toFixed(1).padEnd(8)} `;
        }
        
        if (resources.includes('memory')) {
          resultText += `${(sample.memory || 0).toFixed(1).padEnd(10)} `;
        }
        
        resultText += '\n';
      });

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to monitor resources: ${error.message}`);
    }
  }

  // Helper methods
  parseProcessList(output, platform) {
    const processes = [];
    
    if (platform === 'win32') {
      const lines = output.split('\n').slice(1); // Skip header
      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length >= 4) {
          processes.push({
            pid: parts[3]?.trim().replace(/"/g, ''),
            name: parts[1]?.trim().replace(/"/g, ''),
            memory: parseInt(parts[2]?.trim().replace(/"/g, '')) || 0
          });
        }
      });
    } else {
      const lines = output.split('\n');
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 11) {
          processes.push({
            pid: parts[1],
            name: parts[10],
            cpu: parseFloat(parts[2]),
            memory: parseFloat(parts[3]) * 1024 // Convert to KB
          });
        }
      });
    }
    
    return processes.filter(p => p.pid && p.name);
  }

  parseProcessTreeData(output, platform) {
    const processes = [];
    
    if (platform === 'win32') {
      const lines = output.split('\n').slice(1);
      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length >= 4) {
          processes.push({
            pid: parts[2]?.trim().replace(/"/g, ''),
            ppid: parts[1]?.trim().replace(/"/g, ''),
            name: parts[3]?.trim().replace(/"/g, '')
          });
        }
      });
    } else {
      const lines = output.split('\n');
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          processes.push({
            pid: parts[0],
            ppid: parts[1],
            name: parts[2]
          });
        }
      });
    }
    
    return processes.filter(p => p.pid && p.ppid && p.name);
  }

  buildProcessTree(processes, rootPid, maxDepth) {
    const processMap = new Map();
    processes.forEach(p => processMap.set(p.pid, { ...p, children: [] }));
    
    const roots = [];
    
    processes.forEach(p => {
      const parent = processMap.get(p.ppid);
      if (parent && parent !== processMap.get(p.pid)) {
        parent.children.push(processMap.get(p.pid));
      } else if (!rootPid || p.pid === rootPid) {
        roots.push(processMap.get(p.pid));
      }
    });
    
    return rootPid ? [processMap.get(rootPid)].filter(Boolean) : roots.slice(0, 10);
  }

  formatProcessTree(tree, depth, maxDepth) {
    if (depth >= maxDepth) return '';
    
    let result = '';
    
    tree.forEach((node, index) => {
      if (!node) return;
      
      const isLast = index === tree.length - 1;
      const prefix = '  '.repeat(depth) + (depth > 0 ? (isLast ? '└─ ' : '├─ ') : '');
      
      result += `${prefix}${node.name} (${node.pid})\n`;
      
      if (node.children && node.children.length > 0 && depth < maxDepth - 1) {
        result += this.formatProcessTree(node.children, depth + 1, maxDepth);
      }
    });
    
    return result;
  }

  extractPidsFromOutput(output, pattern) {
    const pids = [];
    const lines = output.split('\n');
    
    lines.forEach(line => {
      const pidMatch = line.match(/\b(\d+)\b/);
      if (pidMatch) {
        pids.push(pidMatch[1]);
      }
    });
    
    return pids;
  }

  async getProcessStats(pid) {
    if (os.platform() === 'win32') {
      const { stdout } = await execAsync(
        `wmic process where ProcessId=${pid} get ProcessId,PageFileUsage,WorkingSetSize /format:csv`
      );
      const lines = stdout.split('\n');
      const dataLine = lines.find(line => line.includes(pid));
      if (dataLine) {
        const parts = dataLine.split(',');
        return {
          cpu: 0, // CPU usage not easily available on Windows via wmic
          memory: parseInt(parts[1]?.trim()) || 0
        };
      }
    } else {
      const { stdout } = await execAsync(`ps -p ${pid} -o pid,pcpu,rss --no-headers`);
      const parts = stdout.trim().split(/\s+/);
      if (parts.length >= 3) {
        return {
          cpu: parseFloat(parts[1]),
          memory: parseInt(parts[2]) * 1024 // Convert KB to bytes
        };
      }
    }
    
    throw new Error('Process not found or access denied');
  }

  async getCpuUsage() {
    // Simplified CPU usage calculation
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    return 100 - Math.round(100 * totalIdle / totalTick);
  }

  formatMemory(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ProcessManagementMCP server running on stdio');
  }
}

const server = new ProcessManagementMCPServer();
server.run().catch(console.error);