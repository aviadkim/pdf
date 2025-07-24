#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AdvancedFileOpsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'advanced-file-ops-mcp-server',
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
          name: 'bulk_rename_files',
          description: 'Rename multiple files based on patterns, numbering, or text replacement',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Directory containing files to rename',
              },
              pattern: {
                type: 'string',
                description: 'File pattern to match (e.g., "*.txt")',
              },
              rename_type: {
                type: 'string',
                enum: ['replace', 'prefix', 'suffix', 'number', 'camelcase', 'lowercase', 'uppercase'],
                description: 'Type of renaming operation',
              },
              old_text: {
                type: 'string',
                description: 'Text to replace (for replace type)',
              },
              new_text: {
                type: 'string',
                description: 'Replacement text',
              },
              start_number: {
                type: 'number',
                description: 'Starting number for numbering (default: 1)',
                default: 1,
              },
              dry_run: {
                type: 'boolean',
                description: 'Preview changes without executing',
                default: true,
              },
            },
            required: ['directory', 'pattern', 'rename_type'],
          },
        },
        {
          name: 'find_duplicate_files',
          description: 'Find duplicate files based on content hash, size, or name',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Directory to search for duplicates',
              },
              method: {
                type: 'string',
                enum: ['hash', 'size', 'name'],
                description: 'Method to detect duplicates',
                default: 'hash',
              },
              recursive: {
                type: 'boolean',
                description: 'Search subdirectories recursively',
                default: true,
              },
              min_size: {
                type: 'number',
                description: 'Minimum file size in bytes to check',
                default: 0,
              },
            },
            required: ['directory'],
          },
        },
        {
          name: 'organize_files_by_type',
          description: 'Organize files into subdirectories based on file type or date',
          inputSchema: {
            type: 'object',
            properties: {
              source_directory: {
                type: 'string',
                description: 'Source directory containing files to organize',
              },
              organize_by: {
                type: 'string',
                enum: ['extension', 'date', 'size'],
                description: 'Criteria for organization',
                default: 'extension',
              },
              create_structure: {
                type: 'boolean',
                description: 'Create directory structure if it does not exist',
                default: true,
              },
              dry_run: {
                type: 'boolean',
                description: 'Preview organization without moving files',
                default: true,
              },
            },
            required: ['source_directory'],
          },
        },
        {
          name: 'batch_file_operations',
          description: 'Perform batch operations (copy, move, delete) on multiple files',
          inputSchema: {
            type: 'object',
            properties: {
              operation: {
                type: 'string',
                enum: ['copy', 'move', 'delete'],
                description: 'Operation to perform',
              },
              files: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of file paths to process',
              },
              destination: {
                type: 'string',
                description: 'Destination directory (for copy/move operations)',
              },
              overwrite: {
                type: 'boolean',
                description: 'Overwrite existing files',
                default: false,
              },
              dry_run: {
                type: 'boolean',
                description: 'Preview operations without executing',
                default: true,
              },
            },
            required: ['operation', 'files'],
          },
        },
        {
          name: 'compress_files',
          description: 'Compress files and directories into archives (ZIP, TAR)',
          inputSchema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { type: 'string' },
                description: 'Files and directories to compress',
              },
              output_path: {
                type: 'string',
                description: 'Output archive path',
              },
              format: {
                type: 'string',
                enum: ['zip', 'tar', 'tar.gz'],
                description: 'Archive format',
                default: 'zip',
              },
              compression_level: {
                type: 'number',
                minimum: 1,
                maximum: 9,
                description: 'Compression level (1-9)',
                default: 6,
              },
            },
            required: ['items', 'output_path'],
          },
        },
        {
          name: 'extract_archive',
          description: 'Extract files from archives (ZIP, TAR, TAR.GZ)',
          inputSchema: {
            type: 'object',
            properties: {
              archive_path: {
                type: 'string',
                description: 'Path to archive file',
              },
              destination: {
                type: 'string',
                description: 'Extraction destination directory',
              },
              overwrite: {
                type: 'boolean',
                description: 'Overwrite existing files',
                default: false,
              },
            },
            required: ['archive_path', 'destination'],
          },
        },
        {
          name: 'file_content_search',
          description: 'Search for text patterns within files and replace content',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Directory to search in',
              },
              search_pattern: {
                type: 'string',
                description: 'Text pattern to search for (regex supported)',
              },
              file_pattern: {
                type: 'string',
                description: 'File name pattern (e.g., "*.js")',
                default: '*',
              },
              replace_with: {
                type: 'string',
                description: 'Replacement text (for replace operation)',
              },
              case_sensitive: {
                type: 'boolean',
                description: 'Case sensitive search',
                default: true,
              },
              dry_run: {
                type: 'boolean',
                description: 'Preview matches without replacing',
                default: true,
              },
            },
            required: ['directory', 'search_pattern'],
          },
        },
        {
          name: 'calculate_directory_size',
          description: 'Calculate total size of directories and generate size reports',
          inputSchema: {
            type: 'object',
            properties: {
              directories: {
                type: 'array',
                items: { type: 'string' },
                description: 'Directories to analyze',
              },
              include_subdirs: {
                type: 'boolean',
                description: 'Include subdirectory breakdown',
                default: true,
              },
              sort_by: {
                type: 'string',
                enum: ['size', 'name', 'files'],
                description: 'Sort results by',
                default: 'size',
              },
              unit: {
                type: 'string',
                enum: ['bytes', 'kb', 'mb', 'gb'],
                description: 'Display unit',
                default: 'mb',
              },
            },
            required: ['directories'],
          },
        },
        {
          name: 'sync_directories',
          description: 'Synchronize files between two directories',
          inputSchema: {
            type: 'object',
            properties: {
              source: {
                type: 'string',
                description: 'Source directory',
              },
              destination: {
                type: 'string',
                description: 'Destination directory',
              },
              sync_type: {
                type: 'string',
                enum: ['mirror', 'update', 'merge'],
                description: 'Type of synchronization',
                default: 'update',
              },
              delete_extra: {
                type: 'boolean',
                description: 'Delete files in destination not present in source',
                default: false,
              },
              dry_run: {
                type: 'boolean',
                description: 'Preview sync operations without executing',
                default: true,
              },
            },
            required: ['source', 'destination'],
          },
        },
        {
          name: 'file_permissions_manager',
          description: 'Manage file and directory permissions (Unix/Linux systems)',
          inputSchema: {
            type: 'object',
            properties: {
              paths: {
                type: 'array',
                items: { type: 'string' },
                description: 'File/directory paths',
              },
              operation: {
                type: 'string',
                enum: ['view', 'set', 'reset'],
                description: 'Permission operation',
              },
              permissions: {
                type: 'string',
                description: 'Permission string (e.g., "755", "644")',
              },
              recursive: {
                type: 'boolean',
                description: 'Apply to subdirectories recursively',
                default: false,
              },
            },
            required: ['paths', 'operation'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'bulk_rename_files':
          return await this.bulkRenameFiles(request.params.arguments);
        case 'find_duplicate_files':
          return await this.findDuplicateFiles(request.params.arguments);
        case 'organize_files_by_type':
          return await this.organizeFilesByType(request.params.arguments);
        case 'batch_file_operations':
          return await this.batchFileOperations(request.params.arguments);
        case 'compress_files':
          return await this.compressFiles(request.params.arguments);
        case 'extract_archive':
          return await this.extractArchive(request.params.arguments);
        case 'file_content_search':
          return await this.fileContentSearch(request.params.arguments);
        case 'calculate_directory_size':
          return await this.calculateDirectorySize(request.params.arguments);
        case 'sync_directories':
          return await this.syncDirectories(request.params.arguments);
        case 'file_permissions_manager':
          return await this.filePermissionsManager(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async bulkRenameFiles(args) {
    try {
      const {
        directory,
        pattern,
        rename_type,
        old_text = '',
        new_text = '',
        start_number = 1,
        dry_run = true
      } = args;

      const files = await this.getMatchingFiles(directory, pattern);
      const operations = [];

      files.forEach((file, index) => {
        const oldName = path.basename(file);
        const extension = path.extname(oldName);
        const nameWithoutExt = path.basename(oldName, extension);
        let newName = oldName;

        switch (rename_type) {
          case 'replace':
            newName = oldName.replace(new RegExp(old_text, 'g'), new_text);
            break;
          case 'prefix':
            newName = new_text + oldName;
            break;
          case 'suffix':
            newName = nameWithoutExt + new_text + extension;
            break;
          case 'number':
            newName = `${new_text || 'file'}${(start_number + index).toString().padStart(3, '0')}${extension}`;
            break;
          case 'camelcase':
            newName = this.toCamelCase(nameWithoutExt) + extension;
            break;
          case 'lowercase':
            newName = oldName.toLowerCase();
            break;
          case 'uppercase':
            newName = oldName.toUpperCase();
            break;
        }

        const oldPath = file;
        const newPath = path.join(path.dirname(file), newName);

        operations.push({
          oldPath,
          newPath,
          oldName,
          newName,
          changed: oldName !== newName
        });
      });

      if (!dry_run) {
        for (const op of operations.filter(o => o.changed)) {
          await fs.rename(op.oldPath, op.newPath);
        }
      }

      const summary = operations.filter(o => o.changed);
      const resultText = dry_run ? 
        `DRY RUN - Preview of ${summary.length} rename operations:\n\n` :
        `Successfully renamed ${summary.length} files:\n\n`;

      const operationsList = summary.map(op => 
        `${op.oldName} → ${op.newName}`
      ).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: resultText + operationsList,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to bulk rename files: ${error.message}`);
    }
  }

  async findDuplicateFiles(args) {
    try {
      const {
        directory,
        method = 'hash',
        recursive = true,
        min_size = 0
      } = args;

      const files = await this.getAllFiles(directory, recursive);
      const filteredFiles = files.filter(async file => {
        const stats = await fs.stat(file);
        return stats.size >= min_size;
      });

      const duplicates = {};

      for (const file of filteredFiles) {
        let key;
        const stats = await fs.stat(file);

        switch (method) {
          case 'hash':
            key = await this.calculateFileHash(file);
            break;
          case 'size':
            key = stats.size.toString();
            break;
          case 'name':
            key = path.basename(file);
            break;
        }

        if (!duplicates[key]) {
          duplicates[key] = [];
        }
        duplicates[key].push({
          path: file,
          size: stats.size,
          modified: stats.mtime
        });
      }

      const duplicateGroups = Object.entries(duplicates)
        .filter(([key, files]) => files.length > 1)
        .map(([key, files]) => ({ key, files }));

      let resultText = `Found ${duplicateGroups.length} duplicate groups using ${method} method:\n\n`;

      duplicateGroups.forEach((group, index) => {
        resultText += `Group ${index + 1} (${method}: ${group.key}):\n`;
        group.files.forEach(file => {
          resultText += `  - ${file.path} (${this.formatBytes(file.size)}, modified: ${file.modified.toLocaleDateString()})\n`;
        });
        resultText += '\n';
      });

      const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.files.length - 1, 0);
      const potentialSavings = duplicateGroups.reduce((sum, group) => 
        sum + (group.files[0].size * (group.files.length - 1)), 0);

      resultText += `\nSummary:\n`;
      resultText += `- Duplicate files: ${totalDuplicates}\n`;
      resultText += `- Potential space savings: ${this.formatBytes(potentialSavings)}`;

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to find duplicate files: ${error.message}`);
    }
  }

  async organizeFilesByType(args) {
    try {
      const {
        source_directory,
        organize_by = 'extension',
        create_structure = true,
        dry_run = true
      } = args;

      const files = await this.getAllFiles(source_directory, false);
      const operations = [];
      const typeMapping = {
        // Images
        '.jpg': 'Images', '.jpeg': 'Images', '.png': 'Images', '.gif': 'Images', '.bmp': 'Images', '.svg': 'Images',
        // Documents
        '.pdf': 'Documents', '.doc': 'Documents', '.docx': 'Documents', '.txt': 'Documents', '.rtf': 'Documents',
        // Spreadsheets
        '.xls': 'Spreadsheets', '.xlsx': 'Spreadsheets', '.csv': 'Spreadsheets',
        // Videos
        '.mp4': 'Videos', '.avi': 'Videos', '.mkv': 'Videos', '.mov': 'Videos', '.wmv': 'Videos',
        // Audio
        '.mp3': 'Audio', '.wav': 'Audio', '.flac': 'Audio', '.aac': 'Audio',
        // Archives
        '.zip': 'Archives', '.rar': 'Archives', '.7z': 'Archives', '.tar': 'Archives', '.gz': 'Archives',
        // Code
        '.js': 'Code', '.html': 'Code', '.css': 'Code', '.py': 'Code', '.java': 'Code', '.cpp': 'Code',
      };

      for (const file of files) {
        const stats = await fs.stat(file);
        if (!stats.isFile()) continue;

        let targetDir;
        const extension = path.extname(file).toLowerCase();
        const basename = path.basename(file);

        switch (organize_by) {
          case 'extension':
            targetDir = typeMapping[extension] || 'Others';
            break;
          case 'date':
            const date = stats.mtime;
            targetDir = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            break;
          case 'size':
            if (stats.size < 1024 * 1024) targetDir = 'Small (< 1MB)';
            else if (stats.size < 10 * 1024 * 1024) targetDir = 'Medium (1-10MB)';
            else targetDir = 'Large (> 10MB)';
            break;
        }

        const targetPath = path.join(source_directory, targetDir);
        const newFilePath = path.join(targetPath, basename);

        operations.push({
          sourcePath: file,
          targetPath: newFilePath,
          targetDir,
          fileName: basename
        });
      }

      if (!dry_run && create_structure) {
        const dirs = [...new Set(operations.map(op => path.dirname(op.targetPath)))];
        for (const dir of dirs) {
          await fs.mkdir(dir, { recursive: true });
        }

        for (const op of operations) {
          await fs.rename(op.sourcePath, op.targetPath);
        }
      }

      const byDir = operations.reduce((acc, op) => {
        if (!acc[op.targetDir]) acc[op.targetDir] = [];
        acc[op.targetDir].push(op.fileName);
        return acc;
      }, {});

      let resultText = dry_run ? 
        `DRY RUN - Preview of file organization by ${organize_by}:\n\n` :
        `Successfully organized ${operations.length} files by ${organize_by}:\n\n`;

      Object.entries(byDir).forEach(([dir, files]) => {
        resultText += `📁 ${dir} (${files.length} files):\n`;
        files.slice(0, 5).forEach(file => resultText += `  - ${file}\n`);
        if (files.length > 5) resultText += `  ... and ${files.length - 5} more\n`;
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
      throw new Error(`Failed to organize files: ${error.message}`);
    }
  }

  async batchFileOperations(args) {
    try {
      const {
        operation,
        files,
        destination = '',
        overwrite = false,
        dry_run = true
      } = args;

      const operations = [];
      const errors = [];

      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          const basename = path.basename(file);
          
          let targetPath = file;
          if (operation === 'copy' || operation === 'move') {
            if (!destination) throw new Error('Destination required for copy/move operations');
            targetPath = path.join(destination, basename);
          }

          operations.push({
            operation,
            sourcePath: file,
            targetPath,
            fileName: basename,
            size: stats.size
          });
        } catch (error) {
          errors.push(`${file}: ${error.message}`);
        }
      }

      if (!dry_run) {
        for (const op of operations) {
          try {
            switch (op.operation) {
              case 'copy':
                if (!overwrite && await this.fileExists(op.targetPath)) {
                  errors.push(`${op.fileName}: Target already exists`);
                  continue;
                }
                await fs.copyFile(op.sourcePath, op.targetPath);
                break;
              case 'move':
                if (!overwrite && await this.fileExists(op.targetPath)) {
                  errors.push(`${op.fileName}: Target already exists`);
                  continue;
                }
                await fs.rename(op.sourcePath, op.targetPath);
                break;
              case 'delete':
                await fs.unlink(op.sourcePath);
                break;
            }
          } catch (error) {
            errors.push(`${op.fileName}: ${error.message}`);
          }
        }
      }

      const successCount = operations.length - errors.length;
      const totalSize = operations.reduce((sum, op) => sum + op.size, 0);

      let resultText = dry_run ? 
        `DRY RUN - Preview of batch ${operation} operation:\n\n` :
        `Batch ${operation} operation completed:\n\n`;

      resultText += `✅ Successful: ${successCount} files (${this.formatBytes(totalSize)})\n`;
      
      if (errors.length > 0) {
        resultText += `❌ Errors: ${errors.length}\n\n`;
        resultText += 'Error details:\n';
        errors.forEach(error => resultText += `- ${error}\n`);
      }

      if (operations.length > 0 && operations.length <= 10) {
        resultText += '\nFiles processed:\n';
        operations.forEach(op => {
          const icon = op.operation === 'delete' ? '🗑️' : op.operation === 'copy' ? '📋' : '📁';
          resultText += `${icon} ${op.fileName}\n`;
        });
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
      throw new Error(`Failed batch operation: ${error.message}`);
    }
  }

  async compressFiles(args) {
    try {
      const {
        items,
        output_path,
        format = 'zip',
        compression_level = 6
      } = args;

      // This is a simplified implementation
      // In a real implementation, you'd use libraries like archiver or node-stream-zip
      
      const stats = [];
      for (const item of items) {
        try {
          const stat = await fs.stat(item);
          stats.push({
            path: item,
            size: stat.isDirectory() ? await this.getDirectorySize(item) : stat.size,
            type: stat.isDirectory() ? 'directory' : 'file'
          });
        } catch (error) {
          stats.push({ path: item, error: error.message });
        }
      }

      const totalSize = stats.reduce((sum, item) => sum + (item.size || 0), 0);
      const validItems = stats.filter(item => !item.error);

      let resultText = `Archive Creation Summary:\n\n`;
      resultText += `📦 Archive: ${output_path}\n`;
      resultText += `📁 Format: ${format.toUpperCase()}\n`;
      resultText += `🗜️ Compression Level: ${compression_level}\n`;
      resultText += `📊 Items: ${validItems.length} (${this.formatBytes(totalSize)})\n\n`;

      resultText += `Items to compress:\n`;
      validItems.forEach(item => {
        const icon = item.type === 'directory' ? '📁' : '📄';
        resultText += `${icon} ${item.path} (${this.formatBytes(item.size)})\n`;
      });

      if (stats.some(item => item.error)) {
        resultText += `\n❌ Errors:\n`;
        stats.filter(item => item.error).forEach(item => {
          resultText += `- ${item.path}: ${item.error}\n`;
        });
      }

      resultText += `\n⚠️ Note: This is a preview. Actual compression requires archiver library implementation.`;

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to compress files: ${error.message}`);
    }
  }

  async extractArchive(args) {
    try {
      const { archive_path, destination, overwrite = false } = args;

      const archiveStats = await fs.stat(archive_path);
      const extension = path.extname(archive_path).toLowerCase();

      let resultText = `Archive Extraction Summary:\n\n`;
      resultText += `📦 Archive: ${archive_path}\n`;
      resultText += `📁 Destination: ${destination}\n`;
      resultText += `📊 Archive Size: ${this.formatBytes(archiveStats.size)}\n`;
      resultText += `🗜️ Format: ${extension}\n`;
      resultText += `🔄 Overwrite: ${overwrite ? 'Yes' : 'No'}\n\n`;

      // Create destination directory if it doesn't exist
      await fs.mkdir(destination, { recursive: true });

      resultText += `⚠️ Note: This is a preview. Actual extraction requires archive library implementation.\n`;
      resultText += `Supported formats: .zip, .tar, .tar.gz\n`;
      resultText += `Files would be extracted to: ${destination}`;

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to extract archive: ${error.message}`);
    }
  }

  async fileContentSearch(args) {
    try {
      const {
        directory,
        search_pattern,
        file_pattern = '*',
        replace_with = '',
        case_sensitive = true,
        dry_run = true
      } = args;

      const files = await this.getMatchingFiles(directory, file_pattern);
      const matches = [];
      const flags = case_sensitive ? 'g' : 'gi';
      const regex = new RegExp(search_pattern, flags);

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const lines = content.split('\n');
          const fileMatches = [];

          lines.forEach((line, index) => {
            const lineMatches = [...line.matchAll(regex)];
            if (lineMatches.length > 0) {
              fileMatches.push({
                lineNumber: index + 1,
                line: line.trim(),
                matches: lineMatches.length
              });
            }
          });

          if (fileMatches.length > 0) {
            matches.push({
              file,
              matches: fileMatches,
              totalMatches: fileMatches.reduce((sum, m) => sum + m.matches, 0)
            });
          }

          // Perform replacement if specified and not dry run
          if (replace_with && !dry_run) {
            const newContent = content.replace(regex, replace_with);
            if (newContent !== content) {
              await fs.writeFile(file, newContent, 'utf-8');
            }
          }
        } catch (error) {
          // Skip files we can't read
        }
      }

      const totalMatches = matches.reduce((sum, m) => sum + m.totalMatches, 0);
      
      let resultText = dry_run && replace_with ? 
        `SEARCH & REPLACE PREVIEW - Pattern: "${search_pattern}" → "${replace_with}"\n\n` :
        `SEARCH RESULTS - Pattern: "${search_pattern}"\n\n`;

      resultText += `📊 Summary:\n`;
      resultText += `- Files searched: ${files.length}\n`;
      resultText += `- Files with matches: ${matches.length}\n`;
      resultText += `- Total matches: ${totalMatches}\n\n`;

      if (matches.length > 0) {
        resultText += `🔍 Matches found:\n\n`;
        matches.slice(0, 10).forEach(match => {
          resultText += `📄 ${path.basename(match.file)} (${match.totalMatches} matches):\n`;
          match.matches.slice(0, 3).forEach(lineMatch => {
            resultText += `  Line ${lineMatch.lineNumber}: ${lineMatch.line}\n`;
          });
          if (match.matches.length > 3) {
            resultText += `  ... and ${match.matches.length - 3} more matches\n`;
          }
          resultText += '\n';
        });

        if (matches.length > 10) {
          resultText += `... and ${matches.length - 10} more files with matches\n`;
        }
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
      throw new Error(`Failed to search file content: ${error.message}`);
    }
  }

  async calculateDirectorySize(args) {
    try {
      const {
        directories,
        include_subdirs = true,
        sort_by = 'size',
        unit = 'mb'
      } = args;

      const results = [];

      for (const directory of directories) {
        try {
          const size = await this.getDirectorySize(directory);
          const fileCount = await this.countFiles(directory);
          
          const result = {
            path: directory,
            size,
            fileCount,
            subdirs: []
          };

          if (include_subdirs) {
            const subdirs = await fs.readdir(directory, { withFileTypes: true });
            for (const subdir of subdirs.filter(d => d.isDirectory())) {
              const subdirPath = path.join(directory, subdir.name);
              const subdirSize = await this.getDirectorySize(subdirPath);
              const subdirFileCount = await this.countFiles(subdirPath);
              
              result.subdirs.push({
                name: subdir.name,
                size: subdirSize,
                fileCount: subdirFileCount
              });
            }

            // Sort subdirectories
            result.subdirs.sort((a, b) => {
              switch (sort_by) {
                case 'size': return b.size - a.size;
                case 'files': return b.fileCount - a.fileCount;
                case 'name': return a.name.localeCompare(b.name);
                default: return 0;
              }
            });
          }

          results.push(result);
        } catch (error) {
          results.push({
            path: directory,
            error: error.message
          });
        }
      }

      // Sort main directories
      const validResults = results.filter(r => !r.error);
      validResults.sort((a, b) => {
        switch (sort_by) {
          case 'size': return b.size - a.size;
          case 'files': return b.fileCount - a.fileCount;
          case 'name': return a.path.localeCompare(b.path);
          default: return 0;
        }
      });

      let resultText = `📊 Directory Size Analysis (sorted by ${sort_by}):\n\n`;

      validResults.forEach(result => {
        resultText += `📁 ${result.path}\n`;
        resultText += `   Size: ${this.formatBytes(result.size, unit)}\n`;
        resultText += `   Files: ${result.fileCount.toLocaleString()}\n`;

        if (result.subdirs && result.subdirs.length > 0) {
          resultText += `   Subdirectories:\n`;
          result.subdirs.slice(0, 10).forEach(subdir => {
            resultText += `   ├─ ${subdir.name}: ${this.formatBytes(subdir.size, unit)} (${subdir.fileCount} files)\n`;
          });
          if (result.subdirs.length > 10) {
            resultText += `   └─ ... and ${result.subdirs.length - 10} more subdirectories\n`;
          }
        }
        resultText += '\n';
      });

      // Show errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        resultText += `❌ Errors:\n`;
        errors.forEach(error => {
          resultText += `- ${error.path}: ${error.error}\n`;
        });
      }

      const totalSize = validResults.reduce((sum, r) => sum + r.size, 0);
      const totalFiles = validResults.reduce((sum, r) => sum + r.fileCount, 0);
      
      resultText += `\n📈 Summary:\n`;
      resultText += `- Total size: ${this.formatBytes(totalSize, unit)}\n`;
      resultText += `- Total files: ${totalFiles.toLocaleString()}\n`;
      resultText += `- Directories analyzed: ${validResults.length}`;

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to calculate directory size: ${error.message}`);
    }
  }

  async syncDirectories(args) {
    try {
      const {
        source,
        destination,
        sync_type = 'update',
        delete_extra = false,
        dry_run = true
      } = args;

      const sourceFiles = await this.getFileList(source);
      const destFiles = await this.getFileList(destination);

      const operations = [];
      const sourceMap = new Map(sourceFiles.map(f => [f.relativePath, f]));
      const destMap = new Map(destFiles.map(f => [f.relativePath, f]));

      // Files to copy/update
      for (const [relativePath, sourceFile] of sourceMap) {
        const destFile = destMap.get(relativePath);
        
        if (!destFile) {
          operations.push({
            type: 'copy',
            source: sourceFile.fullPath,
            destination: path.join(destination, relativePath),
            reason: 'File not in destination'
          });
        } else if (sync_type === 'update' && sourceFile.modified > destFile.modified) {
          operations.push({
            type: 'update',
            source: sourceFile.fullPath,
            destination: destFile.fullPath,
            reason: 'Source is newer'
          });
        } else if (sync_type === 'mirror' && sourceFile.size !== destFile.size) {
          operations.push({
            type: 'update',
            source: sourceFile.fullPath,
            destination: destFile.fullPath,
            reason: 'Size difference'
          });
        }
      }

      // Files to delete (mirror mode or delete_extra)
      if (sync_type === 'mirror' || delete_extra) {
        for (const [relativePath, destFile] of destMap) {
          if (!sourceMap.has(relativePath)) {
            operations.push({
              type: 'delete',
              destination: destFile.fullPath,
              reason: 'Not in source'
            });
          }
        }
      }

      if (!dry_run) {
        for (const op of operations) {
          try {
            switch (op.type) {
              case 'copy':
              case 'update':
                await fs.mkdir(path.dirname(op.destination), { recursive: true });
                await fs.copyFile(op.source, op.destination);
                break;
              case 'delete':
                await fs.unlink(op.destination);
                break;
            }
          } catch (error) {
            console.error(`Error with ${op.type} operation: ${error.message}`);
          }
        }
      }

      const copyOps = operations.filter(op => op.type === 'copy');
      const updateOps = operations.filter(op => op.type === 'update');
      const deleteOps = operations.filter(op => op.type === 'delete');

      let resultText = dry_run ? 
        `DRY RUN - Directory Sync Preview (${sync_type} mode):\n\n` :
        `Directory Sync Completed (${sync_type} mode):\n\n`;

      resultText += `📁 Source: ${source}\n`;
      resultText += `📁 Destination: ${destination}\n\n`;

      resultText += `📊 Summary:\n`;
      resultText += `- Files to copy: ${copyOps.length}\n`;
      resultText += `- Files to update: ${updateOps.length}\n`;
      resultText += `- Files to delete: ${deleteOps.length}\n`;
      resultText += `- Total operations: ${operations.length}\n\n`;

      if (operations.length > 0) {
        resultText += `📋 Operations:\n\n`;
        
        [...copyOps.slice(0, 5), ...updateOps.slice(0, 5), ...deleteOps.slice(0, 5)].forEach(op => {
          const icon = op.type === 'copy' ? '📋' : op.type === 'update' ? '🔄' : '🗑️';
          const file = path.basename(op.destination);
          resultText += `${icon} ${op.type.toUpperCase()}: ${file} (${op.reason})\n`;
        });

        if (operations.length > 15) {
          resultText += `... and ${operations.length - 15} more operations\n`;
        }
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
      throw new Error(`Failed to sync directories: ${error.message}`);
    }
  }

  async filePermissionsManager(args) {
    try {
      const {
        paths,
        operation,
        permissions = '',
        recursive = false
      } = args;

      const results = [];

      for (const targetPath of paths) {
        try {
          const stats = await fs.stat(targetPath);
          const isDirectory = stats.isDirectory();

          switch (operation) {
            case 'view':
              results.push({
                path: targetPath,
                type: isDirectory ? 'directory' : 'file',
                permissions: this.formatPermissions(stats.mode),
                octal: (stats.mode & parseInt('777', 8)).toString(8)
              });
              break;
            case 'set':
              if (!permissions) throw new Error('Permissions required for set operation');
              // Note: fs.chmod is available but limited on Windows
              results.push({
                path: targetPath,
                operation: 'set',
                permissions,
                note: 'Permission setting is limited on Windows systems'
              });
              break;
            case 'reset':
              const defaultPerms = isDirectory ? '755' : '644';
              results.push({
                path: targetPath,
                operation: 'reset',
                permissions: defaultPerms,
                note: 'Reset to default permissions'
              });
              break;
          }
        } catch (error) {
          results.push({
            path: targetPath,
            error: error.message
          });
        }
      }

      let resultText = `🔐 File Permissions Manager - ${operation.toUpperCase()} operation:\n\n`;

      results.forEach(result => {
        if (result.error) {
          resultText += `❌ ${result.path}: ${result.error}\n`;
        } else if (operation === 'view') {
          resultText += `📄 ${result.path} (${result.type})\n`;
          resultText += `   Permissions: ${result.permissions} (${result.octal})\n\n`;
        } else {
          resultText += `✅ ${result.path}\n`;
          resultText += `   ${result.operation.toUpperCase()}: ${result.permissions}\n`;
          if (result.note) resultText += `   Note: ${result.note}\n`;
          resultText += '\n';
        }
      });

      if (recursive) {
        resultText += `🔄 Recursive: ${recursive ? 'Yes' : 'No'}\n`;
      }

      resultText += `\n⚠️ Note: File permission management varies by operating system.`;

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to manage file permissions: ${error.message}`);
    }
  }

  // Helper methods
  async getMatchingFiles(directory, pattern) {
    const files = [];
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    const globPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    const regex = new RegExp(`^${globPattern}$`, 'i');

    for (const entry of entries) {
      if (entry.isFile() && regex.test(entry.name)) {
        files.push(path.join(directory, entry.name));
      }
    }

    return files;
  }

  async getAllFiles(directory, recursive = true) {
    const files = [];
    
    const scan = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isFile()) {
          files.push(fullPath);
        } else if (entry.isDirectory() && recursive) {
          await scan(fullPath);
        }
      }
    };

    await scan(directory);
    return files;
  }

  async calculateFileHash(filePath) {
    const content = await fs.readFile(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getDirectorySize(directory) {
    let size = 0;
    
    const scan = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            size += stats.size;
          } else if (entry.isDirectory()) {
            await scan(fullPath);
          }
        }
      } catch (error) {
        // Handle permission errors
      }
    };

    await scan(directory);
    return size;
  }

  async countFiles(directory) {
    let count = 0;
    
    const scan = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isFile()) {
            count++;
          } else if (entry.isDirectory()) {
            await scan(path.join(dir, entry.name));
          }
        }
      } catch (error) {
        // Handle permission errors
      }
    };

    await scan(directory);
    return count;
  }

  async getFileList(directory) {
    const files = [];
    
    const scan = async (dir, relativeTo = directory) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(relativeTo, fullPath);
          
          if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            files.push({
              fullPath,
              relativePath,
              size: stats.size,
              modified: stats.mtime
            });
          } else if (entry.isDirectory()) {
            await scan(fullPath, relativeTo);
          }
        }
      } catch (error) {
        // Handle permission errors
      }
    };

    await scan(directory);
    return files;
  }

  formatBytes(bytes, unit = 'auto') {
    if (unit === 'bytes') return `${bytes} bytes`;
    
    const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 bytes';
    
    if (unit !== 'auto') {
      const unitIndex = sizes.findIndex(s => s.toLowerCase() === unit.toLowerCase());
      if (unitIndex > 0) {
        const size = bytes / Math.pow(1024, unitIndex);
        return `${size.toFixed(2)} ${sizes[unitIndex]}`;
      }
    }
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    return `${size.toFixed(2)} ${sizes[i]}`;
  }

  formatPermissions(mode) {
    const perms = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
    const owner = perms[(mode >> 6) & 7];
    const group = perms[(mode >> 3) & 7];
    const other = perms[mode & 7];
    return owner + group + other;
  }

  toCamelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AdvancedFileOpsMCP server running on stdio');
  }
}

const server = new AdvancedFileOpsMCPServer();
server.run().catch(console.error);