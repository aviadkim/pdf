#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TaskManagementMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'task-management-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.tasksFile = path.join(__dirname, 'tasks.json');
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
          name: 'create_task',
          description: 'Create a new task with title, description, priority, and due date',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Task title',
              },
              description: {
                type: 'string',
                description: 'Task description',
                default: '',
              },
              priority: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'urgent'],
                description: 'Task priority level',
                default: 'medium',
              },
              due_date: {
                type: 'string',
                description: 'Due date in YYYY-MM-DD format',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Task tags for categorization',
                default: [],
              },
              project: {
                type: 'string',
                description: 'Project name this task belongs to',
                default: 'default',
              },
            },
            required: ['title'],
          },
        },
        {
          name: 'list_tasks',
          description: 'List tasks with optional filtering by status, priority, project, or tags',
          inputSchema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['pending', 'in_progress', 'completed', 'cancelled'],
                description: 'Filter by task status',
              },
              priority: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'urgent'],
                description: 'Filter by priority level',
              },
              project: {
                type: 'string',
                description: 'Filter by project name',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter by tags (tasks must have all specified tags)',
              },
              due_soon: {
                type: 'boolean',
                description: 'Show only tasks due within 7 days',
                default: false,
              },
            },
          },
        },
        {
          name: 'update_task_status',
          description: 'Update the status of a task',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: {
                type: 'string',
                description: 'Task ID to update',
              },
              status: {
                type: 'string',
                enum: ['pending', 'in_progress', 'completed', 'cancelled'],
                description: 'New task status',
              },
            },
            required: ['task_id', 'status'],
          },
        },
        {
          name: 'update_task',
          description: 'Update task details (title, description, priority, due date, tags)',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: {
                type: 'string',
                description: 'Task ID to update',
              },
              title: {
                type: 'string',
                description: 'New task title',
              },
              description: {
                type: 'string',
                description: 'New task description',
              },
              priority: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'urgent'],
                description: 'New priority level',
              },
              due_date: {
                type: 'string',
                description: 'New due date in YYYY-MM-DD format',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'New tags array',
              },
            },
            required: ['task_id'],
          },
        },
        {
          name: 'delete_task',
          description: 'Delete a task permanently',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: {
                type: 'string',
                description: 'Task ID to delete',
              },
            },
            required: ['task_id'],
          },
        },
        {
          name: 'get_task_stats',
          description: 'Get statistics about tasks (total, by status, by priority, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              project: {
                type: 'string',
                description: 'Get stats for specific project only',
              },
            },
          },
        },
        {
          name: 'create_project',
          description: 'Create a new project for organizing tasks',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Project name',
              },
              description: {
                type: 'string',
                description: 'Project description',
                default: '',
              },
              color: {
                type: 'string',
                description: 'Project color (hex code)',
                default: '#007bff',
              },
            },
            required: ['name'],
          },
        },
        {
          name: 'list_projects',
          description: 'List all projects with task counts',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'export_tasks',
          description: 'Export tasks to various formats (JSON, CSV, Markdown)',
          inputSchema: {
            type: 'object',
            properties: {
              format: {
                type: 'string',
                enum: ['json', 'csv', 'markdown'],
                description: 'Export format',
                default: 'json',
              },
              filter: {
                type: 'object',
                description: 'Filter criteria for export',
                properties: {
                  status: { type: 'string' },
                  priority: { type: 'string' },
                  project: { type: 'string' },
                },
              },
            },
          },
        },
        {
          name: 'search_tasks',
          description: 'Search tasks by title, description, or tags',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
              search_in: {
                type: 'array',
                items: { 
                  type: 'string',
                  enum: ['title', 'description', 'tags']
                },
                description: 'Fields to search in',
                default: ['title', 'description', 'tags'],
              },
            },
            required: ['query'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'create_task':
          return await this.createTask(request.params.arguments);
        case 'list_tasks':
          return await this.listTasks(request.params.arguments);
        case 'update_task_status':
          return await this.updateTaskStatus(request.params.arguments);
        case 'update_task':
          return await this.updateTask(request.params.arguments);
        case 'delete_task':
          return await this.deleteTask(request.params.arguments);
        case 'get_task_stats':
          return await this.getTaskStats(request.params.arguments);
        case 'create_project':
          return await this.createProject(request.params.arguments);
        case 'list_projects':
          return await this.listProjects(request.params.arguments);
        case 'export_tasks':
          return await this.exportTasks(request.params.arguments);
        case 'search_tasks':
          return await this.searchTasks(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async loadTasks() {
    try {
      const data = await fs.readFile(this.tasksFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return { tasks: [], projects: [], nextId: 1 };
    }
  }

  async saveTasks(data) {
    await fs.writeFile(this.tasksFile, JSON.stringify(data, null, 2));
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  async createTask(args) {
    try {
      const {
        title,
        description = '',
        priority = 'medium',
        due_date,
        tags = [],
        project = 'default'
      } = args;

      const data = await this.loadTasks();
      const task = {
        id: this.generateId(),
        title,
        description,
        priority,
        due_date: due_date || null,
        tags,
        project,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      data.tasks.push(task);
      await this.saveTasks(data);

      return {
        content: [
          {
            type: 'text',
            text: `Task created successfully!\n\nID: ${task.id}\nTitle: ${task.title}\nPriority: ${task.priority}\nProject: ${task.project}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  async listTasks(args) {
    try {
      const {
        status,
        priority,
        project,
        tags = [],
        due_soon = false
      } = args;

      const data = await this.loadTasks();
      let filteredTasks = data.tasks;

      // Apply filters
      if (status) {
        filteredTasks = filteredTasks.filter(task => task.status === status);
      }
      if (priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === priority);
      }
      if (project) {
        filteredTasks = filteredTasks.filter(task => task.project === project);
      }
      if (tags.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          tags.every(tag => task.tags.includes(tag))
        );
      }
      if (due_soon) {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        filteredTasks = filteredTasks.filter(task => 
          task.due_date && new Date(task.due_date) <= sevenDaysFromNow
        );
      }

      // Sort by priority and due date
      filteredTasks.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        if (a.priority !== b.priority) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        if (a.due_date && b.due_date) {
          return new Date(a.due_date) - new Date(b.due_date);
        }
        return 0;
      });

      const taskList = filteredTasks.map(task => {
        const dueDate = task.due_date ? ` (Due: ${task.due_date})` : '';
        const tagsStr = task.tags.length > 0 ? ` [${task.tags.join(', ')}]` : '';
        const statusIcon = {
          pending: '⏳',
          in_progress: '🔄',
          completed: '✅',
          cancelled: '❌'
        }[task.status];
        
        return `${statusIcon} ${task.title} - ${task.priority.toUpperCase()}${dueDate}${tagsStr}\n  ID: ${task.id} | Project: ${task.project}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${filteredTasks.length} task(s):\n\n${taskList || 'No tasks found.'}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list tasks: ${error.message}`);
    }
  }

  async updateTaskStatus(args) {
    try {
      const { task_id, status } = args;

      const data = await this.loadTasks();
      const taskIndex = data.tasks.findIndex(task => task.id === task_id);

      if (taskIndex === -1) {
        throw new Error(`Task with ID ${task_id} not found`);
      }

      const oldStatus = data.tasks[taskIndex].status;
      data.tasks[taskIndex].status = status;
      data.tasks[taskIndex].updated_at = new Date().toISOString();

      if (status === 'completed') {
        data.tasks[taskIndex].completed_at = new Date().toISOString();
      }

      await this.saveTasks(data);

      return {
        content: [
          {
            type: 'text',
            text: `Task status updated!\n\nTask: ${data.tasks[taskIndex].title}\nStatus: ${oldStatus} → ${status}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to update task status: ${error.message}`);
    }
  }

  async updateTask(args) {
    try {
      const { task_id, title, description, priority, due_date, tags } = args;

      const data = await this.loadTasks();
      const taskIndex = data.tasks.findIndex(task => task.id === task_id);

      if (taskIndex === -1) {
        throw new Error(`Task with ID ${task_id} not found`);
      }

      const task = data.tasks[taskIndex];
      const updates = [];

      if (title && title !== task.title) {
        task.title = title;
        updates.push(`Title: "${task.title}"`);
      }
      if (description !== undefined && description !== task.description) {
        task.description = description;
        updates.push(`Description updated`);
      }
      if (priority && priority !== task.priority) {
        task.priority = priority;
        updates.push(`Priority: ${priority}`);
      }
      if (due_date !== undefined && due_date !== task.due_date) {
        task.due_date = due_date;
        updates.push(`Due date: ${due_date || 'removed'}`);
      }
      if (tags !== undefined) {
        task.tags = tags;
        updates.push(`Tags: [${tags.join(', ')}]`);
      }

      task.updated_at = new Date().toISOString();

      await this.saveTasks(data);

      return {
        content: [
          {
            type: 'text',
            text: `Task updated successfully!\n\nUpdates:\n${updates.join('\n')}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }

  async deleteTask(args) {
    try {
      const { task_id } = args;

      const data = await this.loadTasks();
      const taskIndex = data.tasks.findIndex(task => task.id === task_id);

      if (taskIndex === -1) {
        throw new Error(`Task with ID ${task_id} not found`);
      }

      const deletedTask = data.tasks.splice(taskIndex, 1)[0];
      await this.saveTasks(data);

      return {
        content: [
          {
            type: 'text',
            text: `Task deleted successfully!\n\nDeleted: ${deletedTask.title}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  async getTaskStats(args) {
    try {
      const { project } = args;

      const data = await this.loadTasks();
      let tasks = data.tasks;

      if (project) {
        tasks = tasks.filter(task => task.project === project);
      }

      const stats = {
        total: tasks.length,
        by_status: {},
        by_priority: {},
        by_project: {},
        overdue: 0,
        due_today: 0,
        due_this_week: 0,
      };

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      tasks.forEach(task => {
        // Status stats
        stats.by_status[task.status] = (stats.by_status[task.status] || 0) + 1;
        
        // Priority stats
        stats.by_priority[task.priority] = (stats.by_priority[task.priority] || 0) + 1;
        
        // Project stats
        stats.by_project[task.project] = (stats.by_project[task.project] || 0) + 1;
        
        // Due date stats
        if (task.due_date) {
          const dueDate = new Date(task.due_date);
          if (dueDate < today && task.status !== 'completed') {
            stats.overdue++;
          } else if (task.due_date === todayStr) {
            stats.due_today++;
          } else if (dueDate <= weekFromNow) {
            stats.due_this_week++;
          }
        }
      });

      const statsText = `Task Statistics${project ? ` for ${project}` : ''}:

📊 Overview:
- Total tasks: ${stats.total}
- Overdue: ${stats.overdue}
- Due today: ${stats.due_today}
- Due this week: ${stats.due_this_week}

📈 By Status:
${Object.entries(stats.by_status).map(([status, count]) => `- ${status}: ${count}`).join('\n')}

🎯 By Priority:
${Object.entries(stats.by_priority).map(([priority, count]) => `- ${priority}: ${count}`).join('\n')}

📁 By Project:
${Object.entries(stats.by_project).map(([proj, count]) => `- ${proj}: ${count}`).join('\n')}`;

      return {
        content: [
          {
            type: 'text',
            text: statsText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get task stats: ${error.message}`);
    }
  }

  async createProject(args) {
    try {
      const { name, description = '', color = '#007bff' } = args;

      const data = await this.loadTasks();
      
      // Check if project already exists
      if (data.projects.some(p => p.name === name)) {
        throw new Error(`Project "${name}" already exists`);
      }

      const project = {
        id: this.generateId(),
        name,
        description,
        color,
        created_at: new Date().toISOString(),
      };

      data.projects.push(project);
      await this.saveTasks(data);

      return {
        content: [
          {
            type: 'text',
            text: `Project created successfully!\n\nName: ${name}\nDescription: ${description}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  async listProjects(args) {
    try {
      const data = await this.loadTasks();
      
      // Count tasks per project
      const taskCounts = {};
      data.tasks.forEach(task => {
        taskCounts[task.project] = (taskCounts[task.project] || 0) + 1;
      });

      const projectList = data.projects.map(project => {
        const taskCount = taskCounts[project.name] || 0;
        return `📁 ${project.name} (${taskCount} tasks)\n  ${project.description || 'No description'}`;
      }).join('\n\n');

      // Add default project if it has tasks
      let defaultInfo = '';
      if (taskCounts['default']) {
        defaultInfo = `📁 default (${taskCounts['default']} tasks)\n  Default project for uncategorized tasks\n\n`;
      }

      return {
        content: [
          {
            type: 'text',
            text: `Projects:\n\n${defaultInfo}${projectList || 'No projects found.'}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list projects: ${error.message}`);
    }
  }

  async exportTasks(args) {
    try {
      const { format = 'json', filter = {} } = args;

      const data = await this.loadTasks();
      let tasks = data.tasks;

      // Apply filters
      if (filter.status) {
        tasks = tasks.filter(task => task.status === filter.status);
      }
      if (filter.priority) {
        tasks = tasks.filter(task => task.priority === filter.priority);
      }
      if (filter.project) {
        tasks = tasks.filter(task => task.project === filter.project);
      }

      let exported = '';

      switch (format) {
        case 'json':
          exported = JSON.stringify(tasks, null, 2);
          break;
        case 'csv':
          exported = this.exportToCSV(tasks);
          break;
        case 'markdown':
          exported = this.exportToMarkdown(tasks);
          break;
      }

      return {
        content: [
          {
            type: 'text',
            text: `Exported ${tasks.length} tasks in ${format.toUpperCase()} format:\n\n${exported}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to export tasks: ${error.message}`);
    }
  }

  exportToCSV(tasks) {
    const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Project', 'Due Date', 'Tags', 'Created', 'Updated'];
    const rows = tasks.map(task => [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`,
      `"${task.description.replace(/"/g, '""')}"`,
      task.status,
      task.priority,
      task.project,
      task.due_date || '',
      `"${task.tags.join(', ')}"`,
      task.created_at,
      task.updated_at,
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  exportToMarkdown(tasks) {
    let markdown = '# Task Export\n\n';
    
    const groupedByProject = {};
    tasks.forEach(task => {
      if (!groupedByProject[task.project]) {
        groupedByProject[task.project] = [];
      }
      groupedByProject[task.project].push(task);
    });

    for (const [project, projectTasks] of Object.entries(groupedByProject)) {
      markdown += `## ${project}\n\n`;
      
      projectTasks.forEach(task => {
        const statusIcon = {
          pending: '⏳',
          in_progress: '🔄',
          completed: '✅',
          cancelled: '❌'
        }[task.status];
        
        markdown += `### ${statusIcon} ${task.title}\n\n`;
        if (task.description) {
          markdown += `${task.description}\n\n`;
        }
        markdown += `- **Status**: ${task.status}\n`;
        markdown += `- **Priority**: ${task.priority}\n`;
        if (task.due_date) {
          markdown += `- **Due Date**: ${task.due_date}\n`;
        }
        if (task.tags.length > 0) {
          markdown += `- **Tags**: ${task.tags.join(', ')}\n`;
        }
        markdown += `- **Created**: ${task.created_at}\n\n`;
      });
    }

    return markdown;
  }

  async searchTasks(args) {
    try {
      const { query, search_in = ['title', 'description', 'tags'] } = args;

      const data = await this.loadTasks();
      const searchQuery = query.toLowerCase();
      
      const matchingTasks = data.tasks.filter(task => {
        return search_in.some(field => {
          switch (field) {
            case 'title':
              return task.title.toLowerCase().includes(searchQuery);
            case 'description':
              return task.description.toLowerCase().includes(searchQuery);
            case 'tags':
              return task.tags.some(tag => tag.toLowerCase().includes(searchQuery));
            default:
              return false;
          }
        });
      });

      const taskList = matchingTasks.map(task => {
        const statusIcon = {
          pending: '⏳',
          in_progress: '🔄',
          completed: '✅',
          cancelled: '❌'
        }[task.status];
        
        return `${statusIcon} ${task.title} - ${task.priority.toUpperCase()}\n  ID: ${task.id} | Project: ${task.project}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `Search Results for "${query}":\n\nFound ${matchingTasks.length} matching task(s):\n\n${taskList || 'No tasks found.'}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to search tasks: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('TaskManagementMCP server running on stdio');
  }
}

const server = new TaskManagementMCPServer();
server.run().catch(console.error);