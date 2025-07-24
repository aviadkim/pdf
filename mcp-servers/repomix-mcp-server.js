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

class RepomixMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'repomix-mcp-server',
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
          name: 'pack_codebase',
          description: 'Pack your codebase into AI-friendly formats for better context understanding',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Path to the directory to pack',
              },
              output_format: {
                type: 'string',
                enum: ['markdown', 'text', 'json', 'xml'],
                description: 'Output format for the packed codebase',
                default: 'markdown',
              },
              include_extensions: {
                type: 'array',
                items: { type: 'string' },
                description: 'File extensions to include',
                default: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.html', '.css', '.md'],
              },
              exclude_dirs: {
                type: 'array',
                items: { type: 'string' },
                description: 'Directories to exclude',
                default: ['node_modules', '.git', 'dist', 'build', '__pycache__', '.vscode', '.idea'],
              },
              max_file_size: {
                type: 'number',
                description: 'Maximum file size in bytes to include',
                default: 1048576, // 1MB
              },
              include_metadata: {
                type: 'boolean',
                description: 'Include file metadata (size, modification date, etc.)',
                default: true,
              },
            },
            required: ['directory'],
          },
        },
        {
          name: 'extract_code_snippets',
          description: 'Extract specific code snippets based on patterns or functions',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Path to the directory to search',
              },
              patterns: {
                type: 'array',
                items: { type: 'string' },
                description: 'Regex patterns to match code snippets',
                default: ['function\\s+\\w+', 'class\\s+\\w+', 'export\\s+.*'],
              },
              file_extensions: {
                type: 'array',
                items: { type: 'string' },
                description: 'File extensions to search in',
                default: ['.js', '.ts', '.jsx', '.tsx', '.py'],
              },
              context_lines: {
                type: 'number',
                description: 'Number of context lines to include around matches',
                default: 5,
              },
            },
            required: ['directory'],
          },
        },
        {
          name: 'generate_code_summary',
          description: 'Generate a high-level summary of the codebase structure and content',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Path to the directory to summarize',
              },
              detail_level: {
                type: 'string',
                enum: ['basic', 'detailed', 'comprehensive'],
                description: 'Level of detail in the summary',
                default: 'detailed',
              },
              include_dependencies: {
                type: 'boolean',
                description: 'Include dependency analysis in the summary',
                default: true,
              },
            },
            required: ['directory'],
          },
        },
        {
          name: 'create_documentation',
          description: 'Create documentation from code comments and structure',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Path to the directory to document',
              },
              doc_format: {
                type: 'string',
                enum: ['markdown', 'html', 'json'],
                description: 'Documentation output format',
                default: 'markdown',
              },
              include_private: {
                type: 'boolean',
                description: 'Include private/internal functions and classes',
                default: false,
              },
            },
            required: ['directory'],
          },
        },
        {
          name: 'compress_for_ai',
          description: 'Compress codebase optimally for AI model consumption',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Path to the directory to compress',
              },
              target_token_limit: {
                type: 'number',
                description: 'Target token limit for the compressed output',
                default: 100000,
              },
              prioritize_recent: {
                type: 'boolean',
                description: 'Prioritize recently modified files',
                default: true,
              },
              remove_comments: {
                type: 'boolean',
                description: 'Remove comments to save space',
                default: false,
              },
            },
            required: ['directory'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'pack_codebase':
          return await this.packCodebase(request.params.arguments);
        case 'extract_code_snippets':
          return await this.extractCodeSnippets(request.params.arguments);
        case 'generate_code_summary':
          return await this.generateCodeSummary(request.params.arguments);
        case 'create_documentation':
          return await this.createDocumentation(request.params.arguments);
        case 'compress_for_ai':
          return await this.compressForAI(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async packCodebase(args) {
    try {
      const {
        directory,
        output_format = 'markdown',
        include_extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.html', '.css', '.md'],
        exclude_dirs = ['node_modules', '.git', 'dist', 'build', '__pycache__', '.vscode', '.idea'],
        max_file_size = 1048576,
        include_metadata = true
      } = args;

      const files = await this.scanFiles(directory, include_extensions, exclude_dirs, max_file_size);
      let packed = '';

      switch (output_format) {
        case 'markdown':
          packed = await this.formatAsMarkdown(files, include_metadata);
          break;
        case 'text':
          packed = await this.formatAsText(files, include_metadata);
          break;
        case 'json':
          packed = JSON.stringify(await this.formatAsJSON(files, include_metadata), null, 2);
          break;
        case 'xml':
          packed = await this.formatAsXML(files, include_metadata);
          break;
        default:
          throw new Error(`Unsupported output format: ${output_format}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: packed,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to pack codebase: ${error.message}`);
    }
  }

  async extractCodeSnippets(args) {
    try {
      const {
        directory,
        patterns = ['function\\s+\\w+', 'class\\s+\\w+', 'export\\s+.*'],
        file_extensions = ['.js', '.ts', '.jsx', '.tsx', '.py'],
        context_lines = 5
      } = args;

      const files = await this.scanFiles(directory, file_extensions, [], Infinity);
      const snippets = [];

      for (const file of files) {
        for (const pattern of patterns) {
          const regex = new RegExp(pattern, 'gm');
          const matches = await this.findMatchesWithContext(file.content, regex, context_lines);
          
          snippets.push(...matches.map(match => ({
            file: file.path,
            pattern,
            line: match.line,
            snippet: match.context,
          })));
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(snippets, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to extract code snippets: ${error.message}`);
    }
  }

  async generateCodeSummary(args) {
    try {
      const {
        directory,
        detail_level = 'detailed',
        include_dependencies = true
      } = args;

      const files = await this.scanFiles(directory, ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs'], ['node_modules', '.git', 'dist', 'build'], Infinity);
      
      const summary = {
        overview: {
          total_files: files.length,
          total_lines: files.reduce((sum, f) => sum + f.lines, 0),
          total_size: files.reduce((sum, f) => sum + f.size, 0),
          languages: this.getLanguageStats(files),
        },
        structure: await this.analyzeStructure(files, detail_level),
      };

      if (include_dependencies) {
        summary.dependencies = await this.analyzeDependencies(directory);
      }

      if (detail_level === 'comprehensive') {
        summary.complexity_analysis = await this.analyzeComplexity(files);
        summary.code_patterns = await this.identifyPatterns(files);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to generate code summary: ${error.message}`);
    }
  }

  async createDocumentation(args) {
    try {
      const {
        directory,
        doc_format = 'markdown',
        include_private = false
      } = args;

      const files = await this.scanFiles(directory, ['.js', '.ts', '.jsx', '.tsx', '.py'], ['node_modules', '.git'], Infinity);
      const documentation = await this.extractDocumentation(files, include_private);

      let formatted = '';
      switch (doc_format) {
        case 'markdown':
          formatted = this.formatDocAsMarkdown(documentation);
          break;
        case 'html':
          formatted = this.formatDocAsHTML(documentation);
          break;
        case 'json':
          formatted = JSON.stringify(documentation, null, 2);
          break;
      }

      return {
        content: [
          {
            type: 'text',
            text: formatted,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create documentation: ${error.message}`);
    }
  }

  async compressForAI(args) {
    try {
      const {
        directory,
        target_token_limit = 100000,
        prioritize_recent = true,
        remove_comments = false
      } = args;

      const files = await this.scanFiles(directory, ['.js', '.ts', '.jsx', '.tsx', '.py'], ['node_modules', '.git'], Infinity);
      
      // Sort by priority (recent files first if enabled)
      if (prioritize_recent) {
        files.sort((a, b) => b.modified - a.modified);
      }

      let compressed = '';
      let estimated_tokens = 0;
      const token_per_char = 0.25; // Rough estimation

      for (const file of files) {
        let content = file.content;
        
        if (remove_comments) {
          content = this.removeComments(content, file.extension);
        }

        const file_tokens = content.length * token_per_char;
        
        if (estimated_tokens + file_tokens > target_token_limit) {
          // Try to include a truncated version
          const remaining_tokens = target_token_limit - estimated_tokens;
          const chars_to_include = Math.floor(remaining_tokens / token_per_char);
          if (chars_to_include > 100) {
            content = content.substring(0, chars_to_include) + '\n// ... truncated ...';
            compressed += `\n## ${file.path}\n\`\`\`${file.extension.substring(1)}\n${content}\n\`\`\`\n`;
          }
          break;
        }

        compressed += `\n## ${file.path}\n\`\`\`${file.extension.substring(1)}\n${content}\n\`\`\`\n`;
        estimated_tokens += file_tokens;
      }

      return {
        content: [
          {
            type: 'text',
            text: `# Compressed Codebase\n\nEstimated tokens: ${Math.floor(estimated_tokens)}\nFiles included: ${files.length}\n\n${compressed}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to compress for AI: ${error.message}`);
    }
  }

  async scanFiles(directory, include_extensions, exclude_dirs, max_file_size) {
    const files = [];

    const scan = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!exclude_dirs.includes(entry.name) && !entry.name.startsWith('.')) {
              await scan(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (include_extensions.includes(ext)) {
              try {
                const stats = await fs.stat(fullPath);
                if (stats.size <= max_file_size) {
                  const content = await fs.readFile(fullPath, 'utf-8');
                  files.push({
                    path: fullPath,
                    name: entry.name,
                    extension: ext,
                    content,
                    size: stats.size,
                    lines: content.split('\n').length,
                    modified: stats.mtime,
                  });
                }
              } catch (error) {
                // Skip files we can't read
              }
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

  async formatAsMarkdown(files, include_metadata) {
    let markdown = '# Codebase Pack\n\n';
    
    if (include_metadata) {
      const stats = {
        totalFiles: files.length,
        totalLines: files.reduce((sum, f) => sum + f.lines, 0),
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        languages: this.getLanguageStats(files),
      };
      
      markdown += `## Statistics\n\n`;
      markdown += `- **Total Files**: ${stats.totalFiles}\n`;
      markdown += `- **Total Lines**: ${stats.totalLines}\n`;
      markdown += `- **Total Size**: ${(stats.totalSize / 1024).toFixed(2)} KB\n\n`;
      markdown += `### Languages\n\n`;
      for (const [lang, count] of Object.entries(stats.languages)) {
        markdown += `- **${lang}**: ${count} files\n`;
      }
      markdown += '\n';
    }
    
    markdown += '## Files\n\n';
    
    for (const file of files) {
      markdown += `### ${file.path}\n\n`;
      if (include_metadata) {
        markdown += `- **Size**: ${file.size} bytes\n`;
        markdown += `- **Lines**: ${file.lines}\n`;
        markdown += `- **Modified**: ${file.modified.toISOString()}\n\n`;
      }
      markdown += `\`\`\`${file.extension.substring(1)}\n${file.content}\n\`\`\`\n\n`;
    }
    
    return markdown;
  }

  async formatAsText(files, include_metadata) {
    let text = 'CODEBASE PACK\n' + '='.repeat(50) + '\n\n';
    
    for (const file of files) {
      text += `FILE: ${file.path}\n`;
      text += '-'.repeat(file.path.length + 6) + '\n';
      if (include_metadata) {
        text += `Size: ${file.size} bytes | Lines: ${file.lines} | Modified: ${file.modified.toISOString()}\n\n`;
      }
      text += file.content + '\n\n';
    }
    
    return text;
  }

  async formatAsJSON(files, include_metadata) {
    return {
      metadata: include_metadata ? {
        totalFiles: files.length,
        totalLines: files.reduce((sum, f) => sum + f.lines, 0),
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        languages: this.getLanguageStats(files),
        generatedAt: new Date().toISOString(),
      } : undefined,
      files: files.map(file => ({
        path: file.path,
        name: file.name,
        extension: file.extension,
        content: file.content,
        ...(include_metadata && {
          size: file.size,
          lines: file.lines,
          modified: file.modified.toISOString(),
        }),
      })),
    };
  }

  async formatAsXML(files, include_metadata) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<codebase>\n';
    
    if (include_metadata) {
      xml += '  <metadata>\n';
      xml += `    <totalFiles>${files.length}</totalFiles>\n`;
      xml += `    <totalLines>${files.reduce((sum, f) => sum + f.lines, 0)}</totalLines>\n`;
      xml += `    <totalSize>${files.reduce((sum, f) => sum + f.size, 0)}</totalSize>\n`;
      xml += '  </metadata>\n';
    }
    
    xml += '  <files>\n';
    for (const file of files) {
      xml += `    <file path="${this.escapeXml(file.path)}" extension="${file.extension}">\n`;
      if (include_metadata) {
        xml += `      <size>${file.size}</size>\n`;
        xml += `      <lines>${file.lines}</lines>\n`;
        xml += `      <modified>${file.modified.toISOString()}</modified>\n`;
      }
      xml += `      <content><![CDATA[${file.content}]]></content>\n`;
      xml += '    </file>\n';
    }
    xml += '  </files>\n</codebase>';
    
    return xml;
  }

  getLanguageStats(files) {
    const stats = {};
    for (const file of files) {
      const lang = this.getLanguageFromExtension(file.extension);
      stats[lang] = (stats[lang] || 0) + 1;
    }
    return stats;
  }

  getLanguageFromExtension(ext) {
    const mapping = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript (React)',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript (React)',
      '.py': 'Python',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.cs': 'C#',
      '.go': 'Go',
      '.rs': 'Rust',
      '.html': 'HTML',
      '.css': 'CSS',
      '.md': 'Markdown',
    };
    return mapping[ext] || ext;
  }

  async findMatchesWithContext(content, regex, contextLines) {
    const lines = content.split('\n');
    const matches = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      
      const start = Math.max(0, lineNumber - contextLines - 1);
      const end = Math.min(lines.length, lineNumber + contextLines);
      const context = lines.slice(start, end).join('\n');
      
      matches.push({
        line: lineNumber,
        context,
        match: match[0],
      });
    }

    return matches;
  }

  removeComments(content, extension) {
    try {
      switch (extension) {
        case '.js':
        case '.jsx':
        case '.ts':
        case '.tsx':
        case '.java':
        case '.cpp':
        case '.c':
        case '.cs':
        case '.go':
          // Remove single line comments
          content = content.replace(/\/\/.*$/gm, '');
          // Remove multi-line comments
          content = content.replace(/\/\*[\s\S]*?\*\//g, '');
          break;
        case '.py':
          // Remove Python comments
          content = content.replace(/#.*$/gm, '');
          // Remove multi-line strings used as comments
          content = content.replace(/"""[\s\S]*?"""/g, '');
          content = content.replace(/'''[\s\S]*?'''/g, '');
          break;
      }
    } catch (error) {
      // If comment removal fails, return original content
    }
    return content;
  }

  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  async analyzeStructure(files, detailLevel) {
    const structure = {
      directories: new Set(),
      fileTypes: {},
    };

    for (const file of files) {
      const dir = path.dirname(file.path);
      structure.directories.add(dir);
      
      const ext = file.extension;
      if (!structure.fileTypes[ext]) {
        structure.fileTypes[ext] = { count: 0, totalLines: 0 };
      }
      structure.fileTypes[ext].count++;
      structure.fileTypes[ext].totalLines += file.lines;
    }

    return {
      directories: Array.from(structure.directories).length,
      fileTypes: structure.fileTypes,
    };
  }

  async analyzeDependencies(directory) {
    const dependencies = {};
    const packageFiles = ['package.json', 'requirements.txt', 'Cargo.toml', 'pom.xml', 'go.mod'];

    for (const packageFile of packageFiles) {
      const filePath = path.join(directory, packageFile);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        dependencies[packageFile] = this.parseDependencyFile(packageFile, content);
      } catch (error) {
        // File doesn't exist, skip
      }
    }

    return dependencies;
  }

  parseDependencyFile(filename, content) {
    try {
      switch (filename) {
        case 'package.json':
          const pkg = JSON.parse(content);
          return {
            dependencies: Object.keys(pkg.dependencies || {}),
            devDependencies: Object.keys(pkg.devDependencies || {}),
          };
        case 'requirements.txt':
          return {
            dependencies: content.split('\n')
              .filter(line => line.trim() && !line.startsWith('#'))
              .map(line => line.split(/[>=<]/)[0].trim())
          };
        default:
          return { raw: content };
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  async analyzeComplexity(files) {
    const complexity = {};
    
    for (const file of files) {
      complexity[file.path] = {
        cyclomaticComplexity: this.calculateCyclomaticComplexity(file.content),
        linesOfCode: file.lines,
        cognitiveComplexity: this.calculateCognitiveComplexity(file.content),
      };
    }
    
    return complexity;
  }

  calculateCyclomaticComplexity(content) {
    // Simple cyclomatic complexity calculation
    const patterns = [/\bif\b/g, /\belse\b/g, /\bwhile\b/g, /\bfor\b/g, /\bcatch\b/g, /\bcase\b/g];
    let complexity = 1; // Base complexity
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length;
    }
    
    return complexity;
  }

  calculateCognitiveComplexity(content) {
    // Simplified cognitive complexity
    const nesting = content.split('{').length - 1;
    const conditions = (content.match(/\b(if|while|for|switch)\b/g) || []).length;
    return nesting + conditions * 2;
  }

  async identifyPatterns(files) {
    const patterns = {
      designPatterns: [],
      commonStructures: [],
      antiPatterns: [],
    };

    // This is a simplified pattern identification
    for (const file of files) {
      if (file.content.includes('class') && file.content.includes('extends')) {
        patterns.designPatterns.push({ file: file.path, pattern: 'Inheritance' });
      }
      if (file.content.includes('function') && file.content.includes('return function')) {
        patterns.designPatterns.push({ file: file.path, pattern: 'Higher Order Function' });
      }
    }

    return patterns;
  }

  async extractDocumentation(files, includePrivate) {
    const documentation = {};

    for (const file of files) {
      const docs = this.parseDocComments(file.content, file.extension, includePrivate);
      if (docs.length > 0) {
        documentation[file.path] = docs;
      }
    }

    return documentation;
  }

  parseDocComments(content, extension, includePrivate) {
    const docs = [];
    let patterns = [];

    switch (extension) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        patterns = [
          /\/\*\*([\s\S]*?)\*\/\s*(?:export\s+)?(?:function|class|const|let|var)\s+(\w+)/g,
        ];
        break;
      case '.py':
        patterns = [
          /def\s+(\w+).*?:\s*"""([\s\S]*?)"""/g,
          /class\s+(\w+).*?:\s*"""([\s\S]*?)"""/g,
        ];
        break;
    }

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const [, docComment, name] = match;
        if (includePrivate || !name.startsWith('_')) {
          docs.push({
            name,
            documentation: docComment.trim(),
            type: content.includes(`function ${name}`) ? 'function' : 'class',
          });
        }
      }
    }

    return docs;
  }

  formatDocAsMarkdown(documentation) {
    let markdown = '# API Documentation\n\n';

    for (const [filePath, docs] of Object.entries(documentation)) {
      markdown += `## ${filePath}\n\n`;
      
      for (const doc of docs) {
        markdown += `### ${doc.name} (${doc.type})\n\n`;
        markdown += `${doc.documentation}\n\n`;
      }
    }

    return markdown;
  }

  formatDocAsHTML(documentation) {
    let html = '<!DOCTYPE html><html><head><title>API Documentation</title></head><body>';
    html += '<h1>API Documentation</h1>';

    for (const [filePath, docs] of Object.entries(documentation)) {
      html += `<h2>${filePath}</h2>`;
      
      for (const doc of docs) {
        html += `<h3>${doc.name} (${doc.type})</h3>`;
        html += `<p>${doc.documentation.replace(/\n/g, '<br>')}</p>`;
      }
    }

    html += '</body></html>';
    return html;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('RepomixMCP server running on stdio');
  }
}

const server = new RepomixMCPServer();
server.run().catch(console.error);