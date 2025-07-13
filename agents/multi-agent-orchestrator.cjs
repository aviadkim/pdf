// 🎭 MULTI-AGENT ORCHESTRATOR
// Central coordination hub for all autonomous agents

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class MultiAgentOrchestrator {
  constructor() {
    this.orchestratorId = 'multi-agent-orchestrator';
    this.version = '1.0.0';
    this.agents = new Map();
    this.agentProcesses = new Map();
    this.systemState = {
      status: 'initializing',
      startedAt: new Date().toISOString(),
      totalAgents: 0,
      activeAgents: 0,
      systemHealth: 'unknown'
    };
    this.communicationHub = new Map();
    this.taskQueue = [];
    this.completedTasks = [];
  }

  // 🚀 Initialize and start all agents
  async initialize() {
    console.log('🎭 MULTI-AGENT ORCHESTRATOR - Initializing autonomous development system');
    
    // Define agent configurations
    const agentConfigs = [
      {
        id: 'roadmap-planner',
        name: 'Roadmap Planner Agent',
        file: 'roadmap-planner-agent.js',
        priority: 'HIGH',
        autoStart: true,
        schedule: 'weekly' // Run weekly to update roadmap
      },
      {
        id: 'feature-builder',
        name: 'Feature Builder Agent',
        file: 'feature-builder-agent.js',
        priority: 'HIGH',
        autoStart: true,
        schedule: 'continuous'
      },
      {
        id: 'quality-validator',
        name: 'Quality Validator Agent',
        file: 'quality-validator-agent.js',
        priority: 'HIGH',
        autoStart: true,
        schedule: 'continuous'
      },
      {
        id: 'system-monitor',
        name: 'System Monitor Agent', 
        file: 'system-monitor-agent.js',
        priority: 'HIGH',
        autoStart: true,
        schedule: 'continuous'
      }
    ];

    // Initialize agent registry
    for (const config of agentConfigs) {
      this.agents.set(config.id, {
        ...config,
        status: 'initialized',
        lastStarted: null,
        process: null,
        metrics: {
          tasksCompleted: 0,
          uptime: 0,
          errors: 0
        }
      });
    }

    this.systemState.totalAgents = agentConfigs.length;
    this.systemState.status = 'initialized';

    console.log(`🤖 Initialized ${agentConfigs.length} agents`);
  }

  // 🎬 Start the orchestration system
  async start() {
    console.log('🎬 Starting Multi-Agent Development System...');
    
    await this.initialize();
    
    // Start all auto-start agents
    for (const [agentId, agent] of this.agents) {
      if (agent.autoStart) {
        await this.startAgent(agentId);
      }
    }

    // Start the orchestrator's main loop
    this.startOrchestrationLoop();
    
    // Generate initial roadmap
    await this.generateInitialRoadmap();
    
    this.systemState.status = 'running';
    console.log('🎭 Multi-Agent System fully operational!');
    
    return this.systemState;
  }

  // 🤖 Start individual agent
  async startAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    console.log(`🚀 Starting agent: ${agent.name}`);
    
    try {
      // Start agent process
      const agentPath = path.join(__dirname, agent.file);
      const process = spawn('node', [agentPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      // Handle process output
      process.stdout.on('data', (data) => {
        console.log(`[${agentId}] ${data.toString().trim()}`);
      });

      process.stderr.on('data', (data) => {
        console.error(`[${agentId}] ERROR: ${data.toString().trim()}`);
        agent.metrics.errors++;
      });

      process.on('close', (code) => {
        console.log(`[${agentId}] Process exited with code ${code}`);
        agent.status = 'stopped';
        this.agentProcesses.delete(agentId);
        
        // Auto-restart if unexpected exit
        if (code !== 0 && agent.autoStart) {
          setTimeout(() => this.startAgent(agentId), 5000); // Restart after 5 seconds
        }
      });

      // Store process reference
      this.agentProcesses.set(agentId, process);
      agent.process = process;
      agent.status = 'running';
      agent.lastStarted = new Date().toISOString();
      
      this.systemState.activeAgents++;
      
      console.log(`✅ Agent ${agent.name} started successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to start agent ${agent.name}:`, error);
      agent.status = 'failed';
      agent.lastError = error.message;
    }
  }

  // ⏹️ Stop individual agent
  async stopAgent(agentId) {
    const agent = this.agents.get(agentId);
    const process = this.agentProcesses.get(agentId);
    
    if (process) {
      console.log(`⏹️ Stopping agent: ${agent.name}`);
      process.kill('SIGTERM');
      this.agentProcesses.delete(agentId);
      agent.status = 'stopped';
      this.systemState.activeAgents--;
    }
  }

  // 🔄 Start main orchestration loop
  startOrchestrationLoop() {
    console.log('🔄 Starting orchestration loop...');
    
    // Main orchestration cycle every 5 minutes
    setInterval(async () => {
      try {
        await this.orchestrationCycle();
      } catch (error) {
        console.error('❌ Orchestration cycle error:', error);
      }
    }, 300000); // 5 minutes

    // Health check every minute
    setInterval(async () => {
      await this.healthCheck();
    }, 60000); // 1 minute

    // Weekly roadmap update
    setInterval(async () => {
      await this.updateRoadmap();
    }, 604800000); // 1 week
  }

  // 🔄 Main orchestration cycle
  async orchestrationCycle() {
    console.log('🔄 Orchestration cycle starting...');
    
    // 1. Check agent health
    await this.checkAgentHealth();
    
    // 2. Coordinate inter-agent communication
    await this.facilitateCommunication();
    
    // 3. Load balance tasks
    await this.loadBalanceTasks();
    
    // 4. Update system state
    await this.updateSystemState();
    
    // 5. Generate reports
    await this.generateOrchestrationReport();
    
    console.log('🔄 Orchestration cycle completed');
  }

  // 🏥 Health check for all agents
  async healthCheck() {
    let healthyAgents = 0;
    
    for (const [agentId, agent] of this.agents) {
      // Check if agent process is still running
      if (agent.status === 'running' && this.agentProcesses.has(agentId)) {
        const process = this.agentProcesses.get(agentId);
        if (process.killed) {
          agent.status = 'stopped';
          this.systemState.activeAgents--;
        } else {
          healthyAgents++;
        }
      }
      
      // Check agent output files for health indicators
      await this.checkAgentOutput(agentId);
    }
    
    const healthPercentage = (healthyAgents / this.systemState.totalAgents) * 100;
    this.systemState.systemHealth = healthPercentage >= 80 ? 'healthy' : 
                                   healthPercentage >= 60 ? 'degraded' : 'critical';
    
    if (this.systemState.systemHealth !== 'healthy') {
      console.warn(`⚠️ System health: ${this.systemState.systemHealth} (${healthPercentage.toFixed(1)}%)`);
    }
  }

  // 📊 Check individual agent output
  async checkAgentOutput(agentId) {
    const statusFile = path.join(__dirname, 'status', `${agentId}-status.json`);
    
    if (fs.existsSync(statusFile)) {
      try {
        const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
        const agent = this.agents.get(agentId);
        
        // Update agent metrics
        agent.metrics.tasksCompleted = status.completedTasks || 0;
        agent.metrics.uptime = Date.now() - new Date(agent.lastStarted).getTime();
        agent.lastUpdate = status.timestamp;
        
        // Check if agent is responsive (updated recently)
        const lastUpdateAge = Date.now() - new Date(status.timestamp).getTime();
        if (lastUpdateAge > 600000) { // 10 minutes
          console.warn(`⚠️ Agent ${agentId} may be unresponsive (last update: ${Math.floor(lastUpdateAge / 60000)} minutes ago)`);
        }
        
      } catch (error) {
        console.error(`❌ Error reading status for agent ${agentId}:`, error);
      }
    }
  }

  // 🗣️ Facilitate inter-agent communication
  async facilitateCommunication() {
    // Check for agent communication requests
    const communicationDir = path.join(__dirname, 'communication');
    if (!fs.existsSync(communicationDir)) {
      fs.mkdirSync(communicationDir, { recursive: true });
      return;
    }

    const messages = fs.readdirSync(communicationDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const content = fs.readFileSync(path.join(communicationDir, f), 'utf8');
        return { file: f, ...JSON.parse(content) };
      });

    for (const message of messages) {
      await this.routeMessage(message);
      // Clean up processed message
      fs.unlinkSync(path.join(communicationDir, message.file));
    }
  }

  // 📨 Route message between agents
  async routeMessage(message) {
    console.log(`📨 Routing message from ${message.from} to ${message.to}: ${message.type}`);
    
    switch (message.type) {
      case 'task-completed':
        await this.handleTaskCompletion(message);
        break;
      case 'error-report':
        await this.handleErrorReport(message);
        break;
      case 'resource-request':
        await this.handleResourceRequest(message);
        break;
      case 'coordination-request':
        await this.handleCoordinationRequest(message);
        break;
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  // ✅ Handle task completion notifications
  async handleTaskCompletion(message) {
    this.completedTasks.push({
      taskId: message.taskId,
      agentId: message.from,
      completedAt: message.timestamp,
      result: message.result
    });

    // Notify dependent agents
    if (message.notifyAgents) {
      for (const agentId of message.notifyAgents) {
        await this.notifyAgent(agentId, {
          type: 'dependency-completed',
          dependency: message.taskId,
          result: message.result
        });
      }
    }
  }

  // 📨 Notify agent of events
  async notifyAgent(agentId, notification) {
    const notificationFile = path.join(__dirname, 'notifications', `${agentId}-${Date.now()}.json`);
    const dir = path.dirname(notificationFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(notificationFile, JSON.stringify({
      ...notification,
      timestamp: new Date().toISOString(),
      from: this.orchestratorId
    }, null, 2));
  }

  // ⚖️ Load balance tasks across agents
  async loadBalanceTasks() {
    // Check agent workloads and redistribute if needed
    const agentWorkloads = new Map();
    
    for (const [agentId, agent] of this.agents) {
      if (agent.status === 'running') {
        const taskFile = path.join(__dirname, 'tasks', `${agentId}-tasks.json`);
        if (fs.existsSync(taskFile)) {
          const tasks = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
          agentWorkloads.set(agentId, tasks.priorityTasks?.length || 0);
        } else {
          agentWorkloads.set(agentId, 0);
        }
      }
    }

    // Identify overloaded and underloaded agents
    const workloads = Array.from(agentWorkloads.values());
    const averageWorkload = workloads.reduce((a, b) => a + b, 0) / workloads.length;
    
    for (const [agentId, workload] of agentWorkloads) {
      if (workload > averageWorkload * 1.5) {
        console.log(`⚠️ Agent ${agentId} is overloaded (${workload} tasks vs ${averageWorkload.toFixed(1)} average)`);
        // TODO: Implement task redistribution
      }
    }
  }

  // 📊 Update system state
  async updateSystemState() {
    this.systemState.activeAgents = this.agentProcesses.size;
    this.systemState.lastUpdate = new Date().toISOString();
    this.systemState.uptime = Date.now() - new Date(this.systemState.startedAt).getTime();
    
    // Calculate system metrics
    let totalTasksCompleted = 0;
    let totalErrors = 0;
    
    for (const [agentId, agent] of this.agents) {
      totalTasksCompleted += agent.metrics.tasksCompleted;
      totalErrors += agent.metrics.errors;
    }
    
    this.systemState.totalTasksCompleted = totalTasksCompleted;
    this.systemState.totalErrors = totalErrors;
    this.systemState.errorRate = totalTasksCompleted > 0 ? (totalErrors / totalTasksCompleted) * 100 : 0;
    
    // Save system state
    const stateFile = path.join(__dirname, 'system-state.json');
    fs.writeFileSync(stateFile, JSON.stringify(this.systemState, null, 2));
  }

  // 📋 Generate initial roadmap
  async generateInitialRoadmap() {
    console.log('📋 Generating initial development roadmap...');
    
    // Send roadmap generation request to roadmap planner
    await this.notifyAgent('roadmap-planner', {
      type: 'generate-roadmap',
      priority: 'HIGH',
      parameters: {
        currentSystemState: this.systemState,
        marketRequirements: {
          bankSupport: ['Credit Suisse', 'UBS', 'Julius Baer'],
          automation: ['Batch processing', 'Email integration'],
          enterprise: ['Multi-tenant', 'RBAC', 'Advanced reporting']
        }
      }
    });
  }

  // 🔄 Update roadmap (weekly)
  async updateRoadmap() {
    console.log('🔄 Updating development roadmap...');
    
    await this.notifyAgent('roadmap-planner', {
      type: 'update-roadmap',
      priority: 'MEDIUM',
      progress: this.generateProgressReport()
    });
  }

  // 📈 Generate progress report
  generateProgressReport() {
    return {
      totalTasksCompleted: this.systemState.totalTasksCompleted,
      systemHealth: this.systemState.systemHealth,
      activeAgents: this.systemState.activeAgents,
      uptime: this.systemState.uptime,
      errorRate: this.systemState.errorRate
    };
  }

  // 📊 Generate orchestration report
  async generateOrchestrationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      orchestratorId: this.orchestratorId,
      systemState: this.systemState,
      agentStates: Object.fromEntries(this.agents),
      performance: {
        totalTasksCompleted: this.systemState.totalTasksCompleted,
        averageTaskCompletionTime: this.calculateAverageTaskTime(),
        systemUptime: this.systemState.uptime,
        errorRate: this.systemState.errorRate
      },
      recommendations: this.generateRecommendations()
    };

    const reportFile = path.join(__dirname, 'reports', `orchestration-${Date.now()}.json`);
    const dir = path.dirname(reportFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    return report;
  }

  // 🧮 Calculate average task completion time
  calculateAverageTaskTime() {
    if (this.completedTasks.length === 0) return 0;
    
    const totalTime = this.completedTasks.reduce((sum, task) => {
      const completionTime = new Date(task.completedAt).getTime();
      const startTime = new Date(task.startedAt || task.completedAt).getTime();
      return sum + (completionTime - startTime);
    }, 0);
    
    return totalTime / this.completedTasks.length;
  }

  // 💡 Generate system recommendations
  generateRecommendations() {
    const recommendations = [];
    
    // Health-based recommendations
    if (this.systemState.systemHealth === 'critical') {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'health',
        recommendation: 'Immediate intervention required - multiple agents failing',
        action: 'Restart failed agents and investigate root cause'
      });
    }
    
    // Performance-based recommendations
    if (this.systemState.errorRate > 5) {
      recommendations.push({
        priority: 'HIGH',
        category: 'performance',
        recommendation: 'High error rate detected',
        action: 'Review agent logs and implement error handling improvements'
      });
    }
    
    // Capacity-based recommendations
    if (this.systemState.activeAgents < this.systemState.totalAgents) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'capacity',
        recommendation: 'Some agents are not running',
        action: 'Check agent startup issues and resource availability'
      });
    }
    
    return recommendations;
  }

  // 🎯 Public API methods for external control
  async getSystemStatus() {
    return {
      ...this.systemState,
      agents: Object.fromEntries(this.agents),
      activeProcesses: this.agentProcesses.size
    };
  }

  async restartAgent(agentId) {
    await this.stopAgent(agentId);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await this.startAgent(agentId);
  }

  async shutdownSystem() {
    console.log('🛑 Shutting down Multi-Agent System...');
    
    // Stop all agents
    for (const agentId of this.agentProcesses.keys()) {
      await this.stopAgent(agentId);
    }
    
    this.systemState.status = 'shutdown';
    console.log('✅ Multi-Agent System shutdown complete');
  }

  // Error handlers
  async handleErrorReport(message) {
    console.error(`🚨 Error reported by ${message.from}: ${message.error}`);
    
    const agent = this.agents.get(message.from);
    if (agent) {
      agent.metrics.errors++;
      agent.lastError = message.error;
    }
  }

  async handleResourceRequest(message) {
    console.log(`📦 Resource request from ${message.from}: ${message.resource}`);
    // TODO: Implement resource allocation
  }

  async handleCoordinationRequest(message) {
    console.log(`🤝 Coordination request from ${message.from}: ${message.request}`);
    // TODO: Implement agent coordination
  }
}

// 🚀 Create and export orchestrator instance
const orchestrator = new MultiAgentOrchestrator();

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      orchestrator.start()
        .then(() => console.log('🎭 Multi-Agent System started successfully'))
        .catch(console.error);
      break;
      
    case 'status':
      orchestrator.getSystemStatus()
        .then(status => console.log(JSON.stringify(status, null, 2)))
        .catch(console.error);
      break;
      
    case 'stop':
      orchestrator.shutdownSystem()
        .then(() => process.exit(0))
        .catch(console.error);
      break;
      
    default:
      console.log(`
🎭 Multi-Agent Orchestrator Commands:

  node multi-agent-orchestrator.js start   - Start the multi-agent system
  node multi-agent-orchestrator.js status  - Get system status
  node multi-agent-orchestrator.js stop    - Shutdown the system

The multi-agent system includes:
  📋 Roadmap Planner Agent    - Creates 3-month development plans
  🛠️ Feature Builder Agent    - Implements new functionality
  🧪 Quality Validator Agent  - Runs comprehensive testing
  📊 System Monitor Agent     - Monitors performance and health

Once started, the system will run autonomously and coordinate
development tasks according to the roadmap.
      `);
  }
}

module.exports = { MultiAgentOrchestrator, orchestrator };