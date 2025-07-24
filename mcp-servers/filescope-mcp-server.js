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

class FileScopeMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'filescope-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

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
          name: 'analyze_codebase_structure',
          description: 'Analyze and visualize codebase structure, dependencies, and file organization',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Path to the directory to analyze',
              },
              include_extensions: {
                type: 'array',
                items: { type: 'string' },
                description: 'File extensions to include (e.g., [".js", ".ts", ".py"])',
                default: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs'],
              },
              max_depth: {
                type: 'number',
                description: 'Maximum directory depth to analyze',
                default: 10,
              },
            },
            required: ['directory'],
          },
        },
        {
          name: 'find_dependencies',
          description: 'Find and analyze dependencies in package files',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Path to the directory to search for dependency files',
              },
              package_files: {
                type: 'array',
                items: { type: 'string' },
                description: 'Package files to analyze',
                default: ['package.json', 'requirements.txt', 'Cargo.toml', 'pom.xml', 'go.mod'],
              },
            },
            required: ['directory'],
          },
        },
        {
          name: 'analyze_file_relationships',
          description: 'Analyze import/export relationships between files',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Path to the directory to analyze',
              },
              file_pattern: {
                type: 'string',
                description: 'Glob pattern for files to analyze',
                default: '**/*.{js,ts,jsx,tsx,py}',
              },
            },
            required: ['directory'],
          },
        },
        {
          name: 'generate_file_tree',
          description: 'Generate a visual tree representation of the directory structure',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Path to the directory to generate tree for',
              },
              show_hidden: {
                type: 'boolean',
                description: 'Include hidden files and directories',
                default: false,
              },
              max_depth: {
                type: 'number',
                description: 'Maximum directory depth',
                default: 5,
              },
            },
            required: ['directory'],
          },
        },
        {
          name: 'count_lines_of_code',
          description: 'Count lines of code by file type and generate statistics',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Path to the directory to analyze',
              },
              exclude_dirs: {
                type: 'array',
                items: { type: 'string' },
                description: 'Directories to exclude',
                default: ['node_modules', '.git', 'dist', 'build', '__pycache__'],
              },
            },
            required: ['directory'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'analyze_codebase_structure':
          return await this.analyzeCodebaseStructure(request.params.arguments);
        case 'find_dependencies':
          return await this.findDependencies(request.params.arguments);
        case 'analyze_file_relationships':
          return await this.analyzeFileRelationships(request.params.arguments);
        case 'generate_file_tree':
          return await this.generateFileTree(request.params.arguments);
        case 'count_lines_of_code':
          return await this.countLinesOfCode(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async analyzeCodebaseStructure(args) {
    try {
      const {
        directory,
        include_extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs'],
        max_depth = 10
      } = args;

      const analysis = await this.scanDirectory(directory, include_extensions, max_depth);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              summary: {
                total_files: analysis.files.length,
                total_directories: analysis.directories.length,
                file_types: analysis.fileTypes,
                largest_files: analysis.largestFiles,
                structure_depth: analysis.maxDepth,
              },
              files: analysis.files,
              directories: analysis.directories,
              file_types_breakdown: analysis.fileTypes,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to analyze codebase structure: ${error.message}`);
    }
  }

  async findDependencies(args) {
    try {
      const {
        directory,
        package_files = ['package.json', 'requirements.txt', 'Cargo.toml', 'pom.xml', 'go.mod']
      } = args;

      const dependencies = {};

      for (const packageFile of package_files) {
        const filePath = path.join(directory, packageFile);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          dependencies[packageFile] = await this.parseDependencyFile(packageFile, content);
        } catch (error) {
          // File doesn't exist, skip
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(dependencies, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to find dependencies: ${error.message}`);
    }
  }

  async analyzeFileRelationships(args) {
    try {
      const { directory, file_pattern = '**/*.{js,ts,jsx,tsx,py}' } = args;
      
      const files = await this.findFilesByPattern(directory, file_pattern);
      const relationships = {};

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          relationships[file] = this.extractImports(content, path.extname(file));
        } catch (error) {
          relationships[file] = { error: error.message };
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(relationships, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to analyze file relationships: ${error.message}`);
    }
  }

  async generateFileTree(args) {
    try {
      const { directory, show_hidden = false, max_depth = 5 } = args;
      
      const tree = await this.buildFileTree(directory, '', show_hidden, 0, max_depth);
      
      return {
        content: [
          {
            type: 'text',
            text: tree,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to generate file tree: ${error.message}`);
    }
  }

  async countLinesOfCode(args) {
    try {
      const {
        directory,
        exclude_dirs = ['node_modules', '.git', 'dist', 'build', '__pycache__']
      } = args;

      const stats = await this.calculateCodeStats(directory, exclude_dirs);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to count lines of code: ${error.message}`);
    }
  }

  async scanDirectory(dir, includeExtensions, maxDepth, currentDepth = 0) {
    const result = {
      files: [],
      directories: [],
      fileTypes: {},
      largestFiles: [],
      maxDepth: currentDepth
    };

    if (currentDepth >= maxDepth) return result;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          result.directories.push(fullPath);
          const subResult = await this.scanDirectory(fullPath, includeExtensions, maxDepth, currentDepth + 1);
          result.files.push(...subResult.files);
          result.directories.push(...subResult.directories);
          Object.assign(result.fileTypes, subResult.fileTypes);
          result.largestFiles.push(...subResult.largestFiles);
          result.maxDepth = Math.max(result.maxDepth, subResult.maxDepth);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (includeExtensions.includes(ext)) {
            const stats = await fs.stat(fullPath);
            const fileInfo = {
              path: fullPath,
              name: entry.name,
              extension: ext,
              size: stats.size,
              modified: stats.mtime,
            };

            result.files.push(fileInfo);
            result.fileTypes[ext] = (result.fileTypes[ext] || 0) + 1;
            result.largestFiles.push(fileInfo);
          }
        }
      }

      // Keep only top 10 largest files
      result.largestFiles.sort((a, b) => b.size - a.size);
      result.largestFiles = result.largestFiles.slice(0, 10);

    } catch (error) {
      // Handle permission errors gracefully
    }

    return result;
  }

  async parseDependencyFile(filename, content) {
    try {
      switch (filename) {
        case 'package.json':
          const pkg = JSON.parse(content);
          return {
            dependencies: pkg.dependencies || {},
            devDependencies: pkg.devDependencies || {},
            peerDependencies: pkg.peerDependencies || {},
          };
        case 'requirements.txt':
          return {
            dependencies: content.split('\n')
              .filter(line => line.trim() && !line.startsWith('#'))
              .reduce((acc, line) => {
                const [name] = line.split(/[>=<]/);
                acc[name.trim()] = line;
                return acc;
              }, {})
          };
        default:
          return { raw: content };
      }
    } catch (error) {
      return { error: error.message, raw: content };
    }
  }

  extractImports(content, extension) {
    const imports = [];
    const exports = [];

    try {
      switch (extension) {
        case '.js':
        case '.ts':
        case '.jsx':
        case '.tsx':
          // ES6 imports
          const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
          const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
          const exportRegex = /export\s+.*?from\s+['"`]([^'"`]+)['"`]/g;

          let match;
          while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
          }
          while ((match = requireRegex.exec(content)) !== null) {
            imports.push(match[1]);
          }
          while ((match = exportRegex.exec(content)) !== null) {
            exports.push(match[1]);
          }
          break;

        case '.py':
          const pythonImportRegex = /(?:from\s+(\S+)\s+import|import\s+(\S+))/g;
          while ((match = pythonImportRegex.exec(content)) !== null) {
            imports.push(match[1] || match[2]);
          }
          break;
      }
    } catch (error) {
      return { error: error.message };
    }

    return { imports, exports };
  }

  async findFilesByPattern(directory, pattern) {
    // Simple glob implementation for common patterns
    const files = [];
    const extensions = pattern.match(/\{([^}]+)\}/);
    const exts = extensions ? extensions[1].split(',') : [pattern.replace('**/*.', '.')];

    const scan = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (exts.some(e => ext === `.${e}` || ext === e)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Handle permission errors
      }
    };

    await scan(directory);
    return files;
  }

  async buildFileTree(dir, prefix = '', showHidden = false, depth = 0, maxDepth = 5) {
    if (depth >= maxDepth) return '';

    let tree = '';
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const filteredEntries = showHidden ? entries : entries.filter(e => !e.name.startsWith('.'));
      
      filteredEntries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

      for (let i = 0; i < filteredEntries.length; i++) {
        const entry = filteredEntries[i];
        const isLast = i === filteredEntries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const icon = entry.isDirectory() ? '📁 ' : '📄 ';
        
        tree += `${prefix}${connector}${icon}${entry.name}\n`;

        if (entry.isDirectory()) {
          const nextPrefix = prefix + (isLast ? '    ' : '│   ');
          const subTree = await this.buildFileTree(
            path.join(dir, entry.name),
            nextPrefix,
            showHidden,
            depth + 1,
            maxDepth
          );
          tree += subTree;
        }
      }
    } catch (error) {
      tree += `${prefix}└── ❌ Error reading directory: ${error.message}\n`;
    }

    return tree;
  }

  async calculateCodeStats(directory, excludeDirs) {
    const stats = {
      totalFiles: 0,
      totalLines: 0,
      totalBytes: 0,
      fileTypes: {},
      largestFiles: [],
    };

    const scan = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!excludeDirs.includes(entry.name)) {
              await scan(fullPath);
            }
          } else if (entry.isFile()) {
            try {
              const content = await fs.readFile(fullPath, 'utf-8');
              const lines = content.split('\n').length;
              const fileStats = await fs.stat(fullPath);
              const ext = path.extname(entry.name) || 'no extension';

              stats.totalFiles++;
              stats.totalLines += lines;
              stats.totalBytes += fileStats.size;

              if (!stats.fileTypes[ext]) {
                stats.fileTypes[ext] = { files: 0, lines: 0, bytes: 0 };
              }
              stats.fileTypes[ext].files++;
              stats.fileTypes[ext].lines += lines;
              stats.fileTypes[ext].bytes += fileStats.size;

              stats.largestFiles.push({
                path: fullPath,
                lines,
                bytes: fileStats.size,
              });

            } catch (error) {
              // Skip binary files or files we can't read
            }
          }
        }
      } catch (error) {
        // Handle permission errors
      }
    };

    await scan(directory);

    // Keep only top 10 largest files
    stats.largestFiles.sort((a, b) => b.lines - a.lines);
    stats.largestFiles = stats.largestFiles.slice(0, 10);

    return stats;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('FileScopeMCP server running on stdio');
  }
}

const server = new FileScopeMCPServer();
server.run().catch(console.error);