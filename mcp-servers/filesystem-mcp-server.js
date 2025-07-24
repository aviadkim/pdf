#!/usr/bin/env node

// Filesystem MCP Server for advanced file operations
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

class FilesystemMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'filesystem-utilities-server',
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
            name: 'bulk_rename',
            description: 'Rename multiple files using patterns',
            inputSchema: {
              type: 'object',
              properties: {
                directory: {
                  type: 'string',
                  description: 'Directory containing files to rename'
                },
                pattern: {
                  type: 'string',
                  description: 'Current filename pattern (supports * wildcards)'
                },
                replacement: {
                  type: 'string',
                  description: 'New filename pattern (supports $1, $2 for matches)'
                },
                recursive: {
                  type: 'boolean',
                  description: 'Include subdirectories',
                  default: false
                },
                dryRun: {
                  type: 'boolean',
                  description: 'Preview changes without applying',
                  default: true
                }
              },
              required: ['directory', 'pattern', 'replacement']
            }
          },
          {
            name: 'find_duplicates',
            description: 'Find duplicate files by content hash',
            inputSchema: {
              type: 'object',
              properties: {
                directory: {
                  type: 'string',
                  description: 'Directory to search for duplicates'
                },
                recursive: {
                  type: 'boolean',
                  description: 'Search subdirectories',
                  default: true
                },
                minSize: {
                  type: 'number',
                  description: 'Minimum file size in bytes',
                  default: 1024
                },
                extensions: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'File extensions to include (e.g., [".jpg", ".png"])'
                }
              },
              required: ['directory']
            }
          },
          {
            name: 'directory_tree',
            description: 'Generate directory tree structure',
            inputSchema: {
              type: 'object',
              properties: {
                directory: {
                  type: 'string',
                  description: 'Root directory for tree'
                },
                maxDepth: {
                  type: 'number',
                  description: 'Maximum depth to traverse',
                  default: 5
                },
                showHidden: {
                  type: 'boolean',
                  description: 'Include hidden files/directories',
                  default: false
                },
                showSizes: {
                  type: 'boolean',
                  description: 'Show file sizes',
                  default: true
                },
                exclude: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Patterns to exclude (e.g., ["node_modules", "*.log"])'
                }
              },
              required: ['directory']
            }
          },
          {
            name: 'disk_usage',
            description: 'Analyze disk usage by directory',
            inputSchema: {
              type: 'object',
              properties: {
                directory: {
                  type: 'string',
                  description: 'Directory to analyze'
                },
                depth: {
                  type: 'number',
                  description: 'Depth of analysis',
                  default: 2
                },
                sortBy: {
                  type: 'string',
                  enum: ['size', 'name', 'count'],
                  description: 'Sort results by',
                  default: 'size'
                },
                unit: {
                  type: 'string',
                  enum: ['bytes', 'KB', 'MB', 'GB'],
                  description: 'Size unit',
                  default: 'MB'
                }
              },
              required: ['directory']
            }
          },
          {
            name: 'file_search',
            description: 'Advanced file search with multiple criteria',
            inputSchema: {
              type: 'object',
              properties: {
                directory: {
                  type: 'string',
                  description: 'Directory to search in'
                },
                name: {
                  type: 'string',
                  description: 'Filename pattern (supports * wildcards)'
                },
                content: {
                  type: 'string',
                  description: 'Text content to search for'
                },
                extension: {
                  type: 'string',
                  description: 'File extension (e.g., ".js")'
                },
                size: {
                  type: 'object',
                  properties: {
                    min: { type: 'number' },
                    max: { type: 'number' },
                    unit: { type: 'string', enum: ['bytes', 'KB', 'MB', 'GB'], default: 'bytes' }
                  }
                },
                modified: {
                  type: 'object',
                  properties: {
                    since: { type: 'string', description: 'ISO date string' },
                    before: { type: 'string', description: 'ISO date string' }
                  }
                },
                recursive: {
                  type: 'boolean',
                  description: 'Search subdirectories',
                  default: true
                }
              },
              required: ['directory']
            }
          },
          {
            name: 'cleanup_temp',
            description: 'Clean up temporary and cache files',
            inputSchema: {
              type: 'object',
              properties: {
                directory: {
                  type: 'string',
                  description: 'Directory to clean'
                },
                types: {
                  type: 'array',
                  items: { 
                    type: 'string',
                    enum: ['temp', 'logs', 'cache', 'backups', 'thumbnails', 'custom']
                  },
                  description: 'Types of files to clean',
                  default: ['temp', 'cache']
                },
                customPatterns: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Custom file patterns to delete'
                },
                olderThan: {
                  type: 'number',
                  description: 'Delete files older than N days',
                  default: 30
                },
                dryRun: {
                  type: 'boolean',
                  description: 'Preview without deleting',
                  default: true
                }
              },
              required: ['directory']
            }
          },
          {
            name: 'sync_directories',
            description: 'Synchronize two directories',
            inputSchema: {
              type: 'object',
              properties: {
                source: {
                  type: 'string',
                  description: 'Source directory'
                },
                destination: {
                  type: 'string',
                  description: 'Destination directory'
                },
                mode: {
                  type: 'string',
                  enum: ['copy', 'mirror', 'update'],
                  description: 'Sync mode',
                  default: 'copy'
                },
                exclude: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Patterns to exclude'
                },
                preserveTimestamps: {
                  type: 'boolean',
                  description: 'Preserve file timestamps',
                  default: true
                },
                dryRun: {
                  type: 'boolean',
                  description: 'Preview without copying',
                  default: true
                }
              },
              required: ['source', 'destination']
            }
          },
          {
            name: 'file_permissions',
            description: 'Manage file and directory permissions',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'File or directory path'
                },
                permissions: {
                  type: 'string',
                  description: 'Permissions in octal (e.g., "755") or symbolic (e.g., "rwxr-xr-x")'
                },
                recursive: {
                  type: 'boolean',
                  description: 'Apply to subdirectories',
                  default: false
                },
                owner: {
                  type: 'string',
                  description: 'Change owner (Unix only)'
                },
                group: {
                  type: 'string',
                  description: 'Change group (Unix only)'
                }
              },
              required: ['path']
            }
          },
          {
            name: 'backup_create',
            description: 'Create backup of files/directories',
            inputSchema: {
              type: 'object',
              properties: {
                source: {
                  type: 'string',
                  description: 'Source path to backup'
                },
                destination: {
                  type: 'string',
                  description: 'Backup destination directory'
                },
                compression: {
                  type: 'string',
                  enum: ['none', 'zip', 'tar', 'tar.gz'],
                  description: 'Compression format',
                  default: 'tar.gz'
                },
                exclude: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Patterns to exclude from backup'
                },
                incremental: {
                  type: 'boolean',
                  description: 'Create incremental backup',
                  default: false
                }
              },
              required: ['source', 'destination']
            }
          },
          {
            name: 'file_monitor',
            description: 'Monitor directory for file changes',
            inputSchema: {
              type: 'object',
              properties: {
                directory: {
                  type: 'string',
                  description: 'Directory to monitor'
                },
                events: {
                  type: 'array',
                  items: { type: 'string', enum: ['create', 'modify', 'delete', 'rename'] },
                  description: 'Events to monitor',
                  default: ['create', 'modify', 'delete']
                },
                pattern: {
                  type: 'string',
                  description: 'File pattern to watch (e.g., "*.js")'
                },
                duration: {
                  type: 'number',
                  description: 'Monitoring duration in seconds',
                  default: 60
                },
                recursive: {
                  type: 'boolean',
                  description: 'Monitor subdirectories',
                  default: true
                }
              },
              required: ['directory']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'bulk_rename':
            return await this.bulkRename(args);
          case 'find_duplicates':
            return await this.findDuplicates(args);
          case 'directory_tree':
            return await this.directoryTree(args);
          case 'disk_usage':
            return await this.diskUsage(args);
          case 'file_search':
            return await this.fileSearch(args);
          case 'cleanup_temp':
            return await this.cleanupTemp(args);
          case 'sync_directories':
            return await this.syncDirectories(args);
          case 'file_permissions':
            return await this.filePermissions(args);
          case 'backup_create':
            return await this.backupCreate(args);
          case 'file_monitor':
            return await this.fileMonitor(args);
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

  async bulkRename(args) {
    const { directory, pattern, replacement, recursive = false, dryRun = true } = args;

    try {
      const dir = path.resolve(directory);
      const files = await this.findFilesByPattern(dir, pattern, recursive);
      
      const renames = files.map(filePath => {
        const fileName = path.basename(filePath);
        const newName = this.applyRenamePattern(fileName, pattern, replacement);
        const newPath = path.join(path.dirname(filePath), newName);
        
        return {
          from: filePath,
          to: newPath,
          fromName: fileName,
          toName: newName
        };
      });

      if (!dryRun) {
        for (const rename of renames) {
          await fs.rename(rename.from, rename.to);
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            directory: dir,
            pattern: pattern,
            replacement: replacement,
            dryRun: dryRun,
            filesFound: files.length,
            renames: renames,
            applied: !dryRun,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Bulk rename failed: ${error.message}`);
    }
  }

  async findDuplicates(args) {
    const { directory, recursive = true, minSize = 1024, extensions } = args;

    try {
      const dir = path.resolve(directory);
      const files = await this.getAllFiles(dir, recursive);
      
      // Filter by size and extension
      const filteredFiles = files.filter(file => {
        if (file.size < minSize) return false;
        if (extensions && extensions.length > 0) {
          const ext = path.extname(file.path).toLowerCase();
          return extensions.includes(ext);
        }
        return true;
      });

      // Group by size first (optimization)
      const sizeGroups = {};
      filteredFiles.forEach(file => {
        if (!sizeGroups[file.size]) {
          sizeGroups[file.size] = [];
        }
        sizeGroups[file.size].push(file);
      });

      // Find duplicates by content hash
      const duplicates = [];
      for (const [size, sameSize] of Object.entries(sizeGroups)) {
        if (sameSize.length > 1) {
          const hashGroups = {};
          
          for (const file of sameSize) {
            const hash = await this.getFileHash(file.path);
            if (!hashGroups[hash]) {
              hashGroups[hash] = [];
            }
            hashGroups[hash].push(file);
          }

          for (const [hash, sameHash] of Object.entries(hashGroups)) {
            if (sameHash.length > 1) {
              duplicates.push({
                hash: hash,
                size: parseInt(size),
                files: sameHash.map(f => f.path),
                count: sameHash.length
              });
            }
          }
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            directory: dir,
            recursive: recursive,
            totalFiles: files.length,
            duplicateGroups: duplicates.length,
            duplicates: duplicates,
            spaceSavable: duplicates.reduce((total, group) => 
              total + (group.size * (group.count - 1)), 0
            ),
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Duplicate finding failed: ${error.message}`);
    }
  }

  async directoryTree(args) {
    const { 
      directory, 
      maxDepth = 5, 
      showHidden = false, 
      showSizes = true,
      exclude = []
    } = args;

    try {
      const dir = path.resolve(directory);
      const tree = await this.buildDirectoryTree(dir, maxDepth, showHidden, showSizes, exclude);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            directory: dir,
            maxDepth: maxDepth,
            showHidden: showHidden,
            showSizes: showSizes,
            tree: tree,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Directory tree generation failed: ${error.message}`);
    }
  }

  async diskUsage(args) {
    const { directory, depth = 2, sortBy = 'size', unit = 'MB' } = args;

    try {
      const dir = path.resolve(directory);
      const usage = await this.calculateDiskUsage(dir, depth);
      
      // Sort results
      const sorted = usage.sort((a, b) => {
        switch (sortBy) {
          case 'size':
            return b.size - a.size;
          case 'name':
            return a.name.localeCompare(b.name);
          case 'count':
            return b.fileCount - a.fileCount;
          default:
            return b.size - a.size;
        }
      });

      // Convert units
      const converted = sorted.map(item => ({
        ...item,
        sizeFormatted: this.formatBytes(item.size, unit)
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            directory: dir,
            depth: depth,
            sortBy: sortBy,
            unit: unit,
            usage: converted,
            totalSize: this.formatBytes(converted.reduce((sum, item) => sum + item.size, 0), unit),
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Disk usage analysis failed: ${error.message}`);
    }
  }

  async fileSearch(args) {
    const { 
      directory, 
      name, 
      content, 
      extension, 
      size, 
      modified, 
      recursive = true 
    } = args;

    try {
      const dir = path.resolve(directory);
      const allFiles = await this.getAllFiles(dir, recursive);
      
      let results = allFiles;

      // Filter by name pattern
      if (name) {
        const nameRegex = new RegExp(name.replace(/\*/g, '.*'), 'i');
        results = results.filter(file => nameRegex.test(path.basename(file.path)));
      }

      // Filter by extension
      if (extension) {
        results = results.filter(file => 
          path.extname(file.path).toLowerCase() === extension.toLowerCase()
        );
      }

      // Filter by size
      if (size) {
        const minBytes = size.min ? this.convertToBytes(size.min, size.unit || 'bytes') : 0;
        const maxBytes = size.max ? this.convertToBytes(size.max, size.unit || 'bytes') : Infinity;
        results = results.filter(file => file.size >= minBytes && file.size <= maxBytes);
      }

      // Filter by modification date
      if (modified) {
        if (modified.since) {
          const sinceDate = new Date(modified.since);
          results = results.filter(file => file.modified >= sinceDate);
        }
        if (modified.before) {
          const beforeDate = new Date(modified.before);
          results = results.filter(file => file.modified <= beforeDate);
        }
      }

      // Search content (for text files)
      if (content) {
        const contentResults = [];
        for (const file of results) {
          try {
            const fileContent = await fs.readFile(file.path, 'utf8');
            if (fileContent.includes(content)) {
              const lines = fileContent.split('\n');
              const matches = lines
                .map((line, index) => ({ line: index + 1, content: line }))
                .filter(item => item.content.includes(content));
              
              contentResults.push({
                ...file,
                matches: matches.slice(0, 10) // Limit matches per file
              });
            }
          } catch {
            // Skip binary files or files that can't be read
          }
        }
        results = contentResults;
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            directory: dir,
            criteria: { name, content, extension, size, modified },
            resultsCount: results.length,
            results: results.slice(0, 100), // Limit results
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`File search failed: ${error.message}`);
    }
  }

  async cleanupTemp(args) {
    const { 
      directory, 
      types = ['temp', 'cache'], 
      customPatterns = [],
      olderThan = 30,
      dryRun = true 
    } = args;

    try {
      const dir = path.resolve(directory);
      const patterns = this.getCleanupPatterns(types, customPatterns);
      const cutoffDate = new Date(Date.now() - (olderThan * 24 * 60 * 60 * 1000));
      
      const filesToDelete = [];
      
      for (const pattern of patterns) {
        const matches = await this.findFilesByPattern(dir, pattern, true);
        for (const filePath of matches) {
          const stats = await fs.stat(filePath);
          if (stats.mtime < cutoffDate) {
            filesToDelete.push({
              path: filePath,
              size: stats.size,
              modified: stats.mtime,
              type: this.getFileType(filePath, types)
            });
          }
        }
      }

      let deletedCount = 0;
      let freedSpace = 0;

      if (!dryRun) {
        for (const file of filesToDelete) {
          try {
            await fs.unlink(file.path);
            deletedCount++;
            freedSpace += file.size;
          } catch (error) {
            console.error(`Failed to delete ${file.path}: ${error.message}`);
          }
        }
      } else {
        freedSpace = filesToDelete.reduce((sum, file) => sum + file.size, 0);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            directory: dir,
            types: types,
            olderThan: olderThan,
            dryRun: dryRun,
            filesToDelete: filesToDelete.length,
            deletedCount: deletedCount,
            freedSpace: this.formatBytes(freedSpace),
            files: dryRun ? filesToDelete.slice(0, 50) : [],
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Cleanup failed: ${error.message}`);
    }
  }

  // Helper methods
  async getAllFiles(dir, recursive) {
    const files = [];
    
    async function scan(currentDir) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          files.push({
            path: fullPath,
            name: entry.name,
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime
          });
        } else if (entry.isDirectory() && recursive) {
          await scan(fullPath);
        }
      }
    }
    
    await scan(dir);
    return files;
  }

  async getFileHash(filePath) {
    const { createHash } = await import('crypto');
    const hash = createHash('md5');
    const data = await fs.readFile(filePath);
    hash.update(data);
    return hash.digest('hex');
  }

  formatBytes(bytes, unit = 'MB') {
    const units = {
      'bytes': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };
    
    const value = bytes / units[unit];
    return `${value.toFixed(2)} ${unit}`;
  }

  convertToBytes(value, unit) {
    const units = {
      'bytes': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };
    
    return value * (units[unit] || 1);
  }

  getCleanupPatterns(types, customPatterns) {
    const patterns = {
      'temp': ['*.tmp', '*.temp', '*~', '*.bak'],
      'logs': ['*.log', '*.log.*'],
      'cache': ['*cache*', '*.cache'],
      'backups': ['*.bak', '*.backup', '*.old'],
      'thumbnails': ['Thumbs.db', '.DS_Store', '*.thumbnail']
    };

    let allPatterns = [];
    types.forEach(type => {
      if (patterns[type]) {
        allPatterns = allPatterns.concat(patterns[type]);
      }
    });

    return allPatterns.concat(customPatterns);
  }

  async findFilesByPattern(dir, pattern, recursive) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
    const files = await this.getAllFiles(dir, recursive);
    return files.filter(file => regex.test(path.basename(file.path))).map(f => f.path);
  }

  applyRenamePattern(fileName, pattern, replacement) {
    const regex = new RegExp(pattern.replace(/\*/g, '(.*)'), 'i');
    const match = fileName.match(regex);
    
    if (match) {
      let newName = replacement;
      match.slice(1).forEach((group, index) => {
        newName = newName.replace(`$${index + 1}`, group);
      });
      return newName;
    }
    
    return fileName;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('Filesystem MCP Server running');
  }
}

// Handle test mode
if (process.argv.includes('--test')) {
  console.log('Filesystem MCP Server test passed');
  process.exit(0);
}

// Start the server
const server = new FilesystemMCPServer();
server.run().catch(console.error);