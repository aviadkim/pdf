#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class CodeQualityMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'code-quality-mcp-server',
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
          name: 'format_code',
          description: 'Format code using Prettier, Black, or other formatters',
          inputSchema: {
            type: 'object',
            properties: {
              files: {
                type: 'array',
                items: { type: 'string' },
                description: 'Files to format',
              },
              formatter: {
                type: 'string',
                enum: ['prettier', 'black', 'gofmt', 'rustfmt', 'clang-format'],
                description: 'Code formatter to use',
                default: 'prettier',
              },
              config_file: {
                type: 'string',
                description: 'Path to formatter config file',
              },
              dry_run: {
                type: 'boolean',
                description: 'Preview changes without applying',
                default: true,
              },
            },
            required: ['files'],
          },
        },
        {
          name: 'lint_code',
          description: 'Run linting tools (ESLint, Pylint, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Directory to lint',
              },
              linter: {
                type: 'string',
                enum: ['eslint', 'pylint', 'flake8', 'golint', 'clippy'],
                description: 'Linter to use',
                default: 'eslint',
              },
              fix: {
                type: 'boolean',
                description: 'Auto-fix issues where possible',
                default: false,
              },
              config_file: {
                type: 'string',
                description: 'Path to linter config file',
              },
            },
            required: ['directory'],
          },
        },
        {
          name: 'check_code_style',
          description: 'Check code style and conventions',
          inputSchema: {
            type: 'object',
            properties: {
              files: {
                type: 'array',
                items: { type: 'string' },
                description: 'Files to check',
              },
              style_guide: {
                type: 'string',
                enum: ['airbnb', 'google', 'standard', 'pep8'],
                description: 'Style guide to follow',
                default: 'standard',
              },
              severity: {
                type: 'string',
                enum: ['error', 'warning', 'info'],
                description: 'Minimum severity level',
                default: 'warning',
              },
            },
            required: ['files'],
          },
        },
        {
          name: 'analyze_complexity',
          description: 'Analyze code complexity metrics',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Directory to analyze',
              },
              include_extensions: {
                type: 'array',
                items: { type: 'string' },
                description: 'File extensions to include',
                default: ['.js', '.ts', '.py', '.java'],
              },
              threshold: {
                type: 'number',
                description: 'Complexity threshold for warnings',
                default: 10,
              },
            },
            required: ['directory'],
          },
        },
        {
          name: 'detect_code_smells',
          description: 'Detect code smells and anti-patterns',
          inputSchema: {
            type: 'object',
            properties: {
              files: {
                type: 'array',
                items: { type: 'string' },
                description: 'Files to analyze',
              },
              language: {
                type: 'string',
                enum: ['javascript', 'typescript', 'python', 'java', 'go'],
                description: 'Programming language',
              },
              patterns: {
                type: 'array',
                items: { type: 'string' },
                description: 'Specific patterns to check',
                default: ['long-methods', 'duplicate-code', 'large-classes'],
              },
            },
            required: ['files'],
          },
        },
        {
          name: 'generate_quality_report',
          description: 'Generate comprehensive code quality report',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Directory to analyze',
              },
              output_format: {
                type: 'string',
                enum: ['text', 'json', 'html', 'markdown'],
                description: 'Report output format',
                default: 'text',
              },
              include_metrics: {
                type: 'array',
                items: { type: 'string' },
                description: 'Metrics to include',
                default: ['complexity', 'duplication', 'coverage', 'maintainability'],
              },
            },
            required: ['directory'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'format_code':
          return await this.formatCode(request.params.arguments);
        case 'lint_code':
          return await this.lintCode(request.params.arguments);
        case 'check_code_style':
          return await this.checkCodeStyle(request.params.arguments);
        case 'analyze_complexity':
          return await this.analyzeComplexity(request.params.arguments);
        case 'detect_code_smells':
          return await this.detectCodeSmells(request.params.arguments);
        case 'generate_quality_report':
          return await this.generateQualityReport(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async formatCode(args) {
    try {
      const { files, formatter = 'prettier', config_file, dry_run = true } = args;
      
      const results = [];
      
      for (const file of files) {
        try {
          const beforeContent = await fs.readFile(file, 'utf-8');
          let command = '';
          
          switch (formatter) {
            case 'prettier':
              command = `npx prettier ${dry_run ? '--check' : '--write'} "${file}"`;
              if (config_file) command += ` --config "${config_file}"`;
              break;
            case 'black':
              command = `python -m black ${dry_run ? '--check --diff' : ''} "${file}"`;
              break;
            case 'gofmt':
              command = `gofmt ${dry_run ? '-d' : '-w'} "${file}"`;
              break;
            case 'rustfmt':
              command = `rustfmt ${dry_run ? '--check' : ''} "${file}"`;
              break;
            default:
              throw new Error(`Unsupported formatter: ${formatter}`);
          }

          const { stdout, stderr } = await execAsync(command).catch(e => ({ stdout: e.stdout || '', stderr: e.stderr || e.message }));
          
          let status = 'formatted';
          if (dry_run) {
            status = stdout.trim() ? 'needs formatting' : 'already formatted';
          }
          
          results.push({
            file: path.basename(file),
            status,
            output: stdout.trim() || stderr.trim() || 'No output'
          });
        } catch (error) {
          results.push({
            file: path.basename(file),
            status: 'error',
            error: error.message
          });
        }
      }

      let resultText = dry_run ? 
        `📋 Code Formatting Preview (${formatter}):\n\n` :
        `✨ Code Formatting Results (${formatter}):\n\n`;

      results.forEach(result => {
        const icon = result.status === 'error' ? '❌' : 
                   result.status === 'needs formatting' ? '⚠️' : '✅';
        
        resultText += `${icon} ${result.file}: ${result.status}\n`;
        if (result.output && result.output !== 'No output') {
          resultText += `   ${result.output.split('\n')[0]}\n`;
        }
        if (result.error) {
          resultText += `   Error: ${result.error}\n`;
        }
        resultText += '\n';
      });

      const needsFormatting = results.filter(r => r.status === 'needs formatting').length;
      const errors = results.filter(r => r.status === 'error').length;
      
      resultText += `📊 Summary:\n`;
      resultText += `- Files processed: ${files.length}\n`;
      if (dry_run) {
        resultText += `- Needs formatting: ${needsFormatting}\n`;
      }
      resultText += `- Errors: ${errors}`;

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to format code: ${error.message}`);
    }
  }

  async lintCode(args) {
    try {
      const { directory, linter = 'eslint', fix = false, config_file } = args;
      
      let command = '';
      
      switch (linter) {
        case 'eslint':
          command = `npx eslint ${directory}`;
          if (fix) command += ' --fix';
          if (config_file) command += ` --config "${config_file}"`;
          command += ' --format=json';
          break;
        case 'pylint':
          command = `python -m pylint ${directory} --output-format=json`;
          break;
        case 'flake8':
          command = `python -m flake8 ${directory} --format=json`;
          break;
        default:
          throw new Error(`Unsupported linter: ${linter}`);
      }

      const { stdout, stderr } = await execAsync(command).catch(e => ({ 
        stdout: e.stdout || '', 
        stderr: e.stderr || e.message 
      }));

      let issues = [];
      try {
        const output = stdout || stderr;
        if (linter === 'eslint' && output) {
          issues = JSON.parse(output).flatMap(file => 
            file.messages.map(msg => ({
              file: path.basename(file.filePath),
              line: msg.line,
              column: msg.column,
              rule: msg.ruleId,
              severity: msg.severity === 2 ? 'error' : 'warning',
              message: msg.message
            }))
          );
        }
      } catch (parseError) {
        // Fallback to text parsing
        const lines = (stdout || stderr).split('\n');
        issues = lines.filter(line => line.trim()).map(line => ({
          raw: line,
          severity: line.includes('error') ? 'error' : 'warning'
        }));
      }

      const errors = issues.filter(i => i.severity === 'error').length;
      const warnings = issues.filter(i => i.severity === 'warning').length;

      let resultText = `🔍 Linting Results (${linter}):\n\n`;
      
      if (fix) {
        resultText += `🔧 Auto-fix enabled\n\n`;
      }

      resultText += `📊 Summary:\n`;
      resultText += `- Errors: ${errors}\n`;
      resultText += `- Warnings: ${warnings}\n`;
      resultText += `- Total issues: ${errors + warnings}\n\n`;

      if (issues.length > 0) {
        resultText += `🚨 Issues found:\n\n`;
        
        issues.slice(0, 20).forEach(issue => {
          const icon = issue.severity === 'error' ? '❌' : '⚠️';
          
          if (issue.raw) {
            resultText += `${icon} ${issue.raw}\n`;
          } else {
            resultText += `${icon} ${issue.file}:${issue.line}:${issue.column} - ${issue.message}`;
            if (issue.rule) resultText += ` (${issue.rule})`;
            resultText += '\n';
          }
        });

        if (issues.length > 20) {
          resultText += `\n... and ${issues.length - 20} more issues\n`;
        }
      } else {
        resultText += `✅ No issues found!`;
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
      throw new Error(`Failed to lint code: ${error.message}`);
    }
  }

  async checkCodeStyle(args) {
    try {
      const { files, style_guide = 'standard', severity = 'warning' } = args;
      
      const styleRules = this.getStyleRules(style_guide);
      const violations = [];

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const fileViolations = this.checkStyleViolations(content, styleRules, file);
          violations.push(...fileViolations);
        } catch (error) {
          violations.push({
            file: path.basename(file),
            line: 0,
            rule: 'file-access',
            severity: 'error',
            message: `Cannot read file: ${error.message}`
          });
        }
      }

      const filteredViolations = violations.filter(v => 
        this.getSeverityLevel(v.severity) >= this.getSeverityLevel(severity)
      );

      const errors = filteredViolations.filter(v => v.severity === 'error').length;
      const warnings = filteredViolations.filter(v => v.severity === 'warning').length;
      const info = filteredViolations.filter(v => v.severity === 'info').length;

      let resultText = `📏 Code Style Check (${style_guide} guide):\n\n`;
      
      resultText += `📊 Summary:\n`;
      resultText += `- Files checked: ${files.length}\n`;
      resultText += `- Errors: ${errors}\n`;
      resultText += `- Warnings: ${warnings}\n`;
      resultText += `- Info: ${info}\n\n`;

      if (filteredViolations.length > 0) {
        resultText += `🎯 Style Violations:\n\n`;
        
        filteredViolations.slice(0, 15).forEach(violation => {
          const icon = violation.severity === 'error' ? '❌' : 
                      violation.severity === 'warning' ? '⚠️' : 'ℹ️';
          
          resultText += `${icon} ${violation.file}:${violation.line} - ${violation.message} (${violation.rule})\n`;
        });

        if (filteredViolations.length > 15) {
          resultText += `\n... and ${filteredViolations.length - 15} more violations\n`;
        }
      } else {
        resultText += `✅ No style violations found!`;
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
      throw new Error(`Failed to check code style: ${error.message}`);
    }
  }

  async analyzeComplexity(args) {
    try {
      const { 
        directory, 
        include_extensions = ['.js', '.ts', '.py', '.java'], 
        threshold = 10 
      } = args;

      const files = await this.getFilesWithExtensions(directory, include_extensions);
      const complexityResults = [];

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const complexity = this.calculateComplexity(content, path.extname(file));
          
          complexityResults.push({
            file: path.relative(directory, file),
            ...complexity
          });
        } catch (error) {
          complexityResults.push({
            file: path.relative(directory, file),
            error: error.message
          });
        }
      }

      const validResults = complexityResults.filter(r => !r.error);
      const highComplexity = validResults.filter(r => r.cyclomaticComplexity > threshold);
      const avgComplexity = validResults.reduce((sum, r) => sum + r.cyclomaticComplexity, 0) / validResults.length;

      let resultText = `🧮 Complexity Analysis:\n\n`;
      
      resultText += `📊 Summary:\n`;
      resultText += `- Files analyzed: ${validResults.length}\n`;
      resultText += `- Average complexity: ${avgComplexity.toFixed(2)}\n`;
      resultText += `- High complexity (>${threshold}): ${highComplexity.length}\n`;
      resultText += `- Complexity threshold: ${threshold}\n\n`;

      if (highComplexity.length > 0) {
        resultText += `⚠️ High Complexity Files:\n\n`;
        
        highComplexity
          .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
          .slice(0, 10)
          .forEach(result => {
            resultText += `🔴 ${result.file}\n`;
            resultText += `   Cyclomatic: ${result.cyclomaticComplexity}\n`;
            resultText += `   Cognitive: ${result.cognitiveComplexity}\n`;
            resultText += `   Lines: ${result.linesOfCode}\n\n`;
          });
      }

      resultText += `📈 Complexity Distribution:\n`;
      const ranges = [
        { min: 0, max: 5, label: 'Low (0-5)', color: '🟢' },
        { min: 6, max: 10, label: 'Medium (6-10)', color: '🟡' },
        { min: 11, max: 20, label: 'High (11-20)', color: '🟠' },
        { min: 21, max: Infinity, label: 'Very High (21+)', color: '🔴' }
      ];

      ranges.forEach(range => {
        const count = validResults.filter(r => 
          r.cyclomaticComplexity >= range.min && r.cyclomaticComplexity <= range.max
        ).length;
        resultText += `${range.color} ${range.label}: ${count} files\n`;
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
      throw new Error(`Failed to analyze complexity: ${error.message}`);
    }
  }

  async detectCodeSmells(args) {
    try {
      const { files, language, patterns = ['long-methods', 'duplicate-code', 'large-classes'] } = args;
      
      const smells = [];

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const detectedLanguage = language || this.detectLanguage(path.extname(file));
          const fileSmells = this.detectSmells(content, detectedLanguage, patterns);
          
          smells.push(...fileSmells.map(smell => ({
            ...smell,
            file: path.basename(file)
          })));
        } catch (error) {
          smells.push({
            file: path.basename(file),
            type: 'file-error',
            severity: 'error',
            message: `Cannot analyze file: ${error.message}`,
            line: 0
          });
        }
      }

      const smellTypes = [...new Set(smells.map(s => s.type))];
      const severity = {
        critical: smells.filter(s => s.severity === 'critical').length,
        major: smells.filter(s => s.severity === 'major').length,
        minor: smells.filter(s => s.severity === 'minor').length
      };

      let resultText = `👃 Code Smell Detection:\n\n`;
      
      resultText += `📊 Summary:\n`;
      resultText += `- Files analyzed: ${files.length}\n`;
      resultText += `- Code smells found: ${smells.length}\n`;
      resultText += `- Critical: ${severity.critical}\n`;
      resultText += `- Major: ${severity.major}\n`;
      resultText += `- Minor: ${severity.minor}\n\n`;

      if (smells.length > 0) {
        resultText += `🦨 Detected Code Smells:\n\n`;
        
        smellTypes.forEach(smellType => {
          const typeSmells = smells.filter(s => s.type === smellType);
          if (typeSmells.length > 0) {
            resultText += `🔍 ${smellType.replace('-', ' ').toUpperCase()} (${typeSmells.length}):\n`;
            
            typeSmells.slice(0, 5).forEach(smell => {
              const icon = smell.severity === 'critical' ? '🔴' : 
                          smell.severity === 'major' ? '🟠' : '🟡';
              
              resultText += `${icon} ${smell.file}:${smell.line} - ${smell.message}\n`;
              if (smell.suggestion) {
                resultText += `   💡 Suggestion: ${smell.suggestion}\n`;
              }
            });
            
            if (typeSmells.length > 5) {
              resultText += `   ... and ${typeSmells.length - 5} more\n`;
            }
            resultText += '\n';
          }
        });
      } else {
        resultText += `✅ No code smells detected!`;
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
      throw new Error(`Failed to detect code smells: ${error.message}`);
    }
  }

  async generateQualityReport(args) {
    try {
      const { 
        directory, 
        output_format = 'text',
        include_metrics = ['complexity', 'duplication', 'coverage', 'maintainability']
      } = args;

      const files = await this.getFilesWithExtensions(directory, ['.js', '.ts', '.py', '.java', '.go']);
      const report = {
        summary: {
          totalFiles: files.length,
          totalLines: 0,
          analysisDate: new Date().toISOString()
        },
        metrics: {}
      };

      // Calculate metrics
      if (include_metrics.includes('complexity')) {
        report.metrics.complexity = await this.calculateProjectComplexity(files);
      }

      if (include_metrics.includes('duplication')) {
        report.metrics.duplication = await this.calculateDuplication(files);
      }

      if (include_metrics.includes('maintainability')) {
        report.metrics.maintainability = await this.calculateMaintainability(files);
      }

      // Count total lines
      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          report.summary.totalLines += content.split('\n').length;
        } catch (error) {
          // Skip files we can't read
        }
      }

      let resultText = '';

      switch (output_format) {
        case 'text':
          resultText = this.formatReportAsText(report);
          break;
        case 'json':
          resultText = JSON.stringify(report, null, 2);
          break;
        case 'markdown':
          resultText = this.formatReportAsMarkdown(report);
          break;
        case 'html':
          resultText = this.formatReportAsHTML(report);
          break;
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
      throw new Error(`Failed to generate quality report: ${error.message}`);
    }
  }

  // Helper methods
  getStyleRules(styleGuide) {
    const rules = {
      standard: {
        indentation: { type: 'spaces', size: 2 },
        maxLineLength: 100,
        trailingComma: false,
        semicolons: false
      },
      airbnb: {
        indentation: { type: 'spaces', size: 2 },
        maxLineLength: 100,
        trailingComma: true,
        semicolons: true
      },
      google: {
        indentation: { type: 'spaces', size: 2 },
        maxLineLength: 80,
        trailingComma: true,
        semicolons: true
      }
    };
    return rules[styleGuide] || rules.standard;
  }

  checkStyleViolations(content, rules, filePath) {
    const violations = [];
    const lines = content.split('\n');
    const fileName = path.basename(filePath);

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check line length
      if (line.length > rules.maxLineLength) {
        violations.push({
          file: fileName,
          line: lineNumber,
          rule: 'max-line-length',
          severity: 'warning',
          message: `Line too long (${line.length}/${rules.maxLineLength})`
        });
      }

      // Check indentation
      const leadingSpaces = line.match(/^(\s*)/)[1];
      if (rules.indentation.type === 'spaces' && leadingSpaces.includes('\t')) {
        violations.push({
          file: fileName,
          line: lineNumber,
          rule: 'indent',
          severity: 'error',
          message: 'Use spaces for indentation, not tabs'
        });
      }

      // Check trailing whitespace
      if (line.endsWith(' ') || line.endsWith('\t')) {
        violations.push({
          file: fileName,
          line: lineNumber,
          rule: 'no-trailing-spaces',
          severity: 'warning',
          message: 'Trailing whitespace'
        });
      }
    });

    return violations;
  }

  getSeverityLevel(severity) {
    const levels = { info: 1, warning: 2, error: 3 };
    return levels[severity] || 1;
  }

  async getFilesWithExtensions(directory, extensions) {
    const files = [];
    
    const scan = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
            files.push(fullPath);
          } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scan(fullPath);
          }
        }
      } catch (error) {
        // Handle permission errors
      }
    };

    await scan(directory);
    return files;
  }

  calculateComplexity(content, extension) {
    // Simplified complexity calculation
    const lines = content.split('\n');
    const linesOfCode = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;
    
    // Cyclomatic complexity
    const cyclomaticPatterns = [/\bif\b/g, /\belse\b/g, /\bwhile\b/g, /\bfor\b/g, /\bcatch\b/g, /\bcase\b/g];
    let cyclomaticComplexity = 1;
    
    cyclomaticPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) cyclomaticComplexity += matches.length;
    });

    // Cognitive complexity (simplified)
    const nesting = (content.match(/\{/g) || []).length;
    const cognitiveComplexity = cyclomaticComplexity + Math.floor(nesting / 2);

    return {
      linesOfCode,
      cyclomaticComplexity,
      cognitiveComplexity
    };
  }

  detectLanguage(extension) {
    const mapping = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go'
    };
    return mapping[extension] || 'unknown';
  }

  detectSmells(content, language, patterns) {
    const smells = [];
    const lines = content.split('\n');

    if (patterns.includes('long-methods')) {
      const functions = this.extractFunctions(content, language);
      functions.forEach(func => {
        if (func.lines > 30) {
          smells.push({
            type: 'long-methods',
            severity: func.lines > 50 ? 'major' : 'minor',
            message: `Function '${func.name}' is too long (${func.lines} lines)`,
            line: func.startLine,
            suggestion: 'Consider breaking this function into smaller functions'
          });
        }
      });
    }

    if (patterns.includes('large-classes')) {
      const classes = this.extractClasses(content, language);
      classes.forEach(cls => {
        if (cls.lines > 100) {
          smells.push({
            type: 'large-classes',
            severity: cls.lines > 200 ? 'major' : 'minor',
            message: `Class '${cls.name}' is too large (${cls.lines} lines)`,
            line: cls.startLine,
            suggestion: 'Consider splitting this class into multiple classes'
          });
        }
      });
    }

    if (patterns.includes('duplicate-code')) {
      const duplicates = this.findDuplicateBlocks(lines);
      duplicates.forEach(dup => {
        smells.push({
          type: 'duplicate-code',
          severity: 'minor',
          message: `Potential duplicate code block (${dup.lines} lines)`,
          line: dup.startLine,
          suggestion: 'Extract common code into a function'
        });
      });
    }

    return smells;
  }

  extractFunctions(content, language) {
    const functions = [];
    const lines = content.split('\n');
    
    let funcRegex;
    switch (language) {
      case 'javascript':
      case 'typescript':
        funcRegex = /^\s*(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:function|\(.*\)\s*=>))/;
        break;
      case 'python':
        funcRegex = /^\s*def\s+(\w+)/;
        break;
      case 'java':
        funcRegex = /^\s*(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/;
        break;
      default:
        return functions;
    }

    let currentFunction = null;
    let braceCount = 0;

    lines.forEach((line, index) => {
      const match = line.match(funcRegex);
      if (match) {
        if (currentFunction) {
          currentFunction.lines = index - currentFunction.startLine;
          functions.push(currentFunction);
        }
        
        currentFunction = {
          name: match[1] || match[2] || 'anonymous',
          startLine: index + 1,
          lines: 0
        };
        braceCount = 0;
      }

      if (currentFunction) {
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        
        if (braceCount === 0 && line.includes('}')) {
          currentFunction.lines = index - currentFunction.startLine + 1;
          functions.push(currentFunction);
          currentFunction = null;
        }
      }
    });

    return functions;
  }

  extractClasses(content, language) {
    const classes = [];
    const lines = content.split('\n');
    
    let classRegex;
    switch (language) {
      case 'javascript':
      case 'typescript':
        classRegex = /^\s*class\s+(\w+)/;
        break;
      case 'python':
        classRegex = /^\s*class\s+(\w+)/;
        break;
      case 'java':
        classRegex = /^\s*(?:public|private)?\s*class\s+(\w+)/;
        break;
      default:
        return classes;
    }

    let currentClass = null;
    let braceCount = 0;

    lines.forEach((line, index) => {
      const match = line.match(classRegex);
      if (match) {
        if (currentClass) {
          currentClass.lines = index - currentClass.startLine;
          classes.push(currentClass);
        }
        
        currentClass = {
          name: match[1],
          startLine: index + 1,
          lines: 0
        };
        braceCount = 0;
      }

      if (currentClass) {
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        
        if (braceCount === 0 && line.includes('}')) {
          currentClass.lines = index - currentClass.startLine + 1;
          classes.push(currentClass);
          currentClass = null;
        }
      }
    });

    return classes;
  }

  findDuplicateBlocks(lines) {
    const duplicates = [];
    const minBlockSize = 5;

    for (let i = 0; i < lines.length - minBlockSize; i++) {
      for (let j = i + minBlockSize; j < lines.length - minBlockSize; j++) {
        let matchLength = 0;
        
        while (i + matchLength < lines.length && 
               j + matchLength < lines.length && 
               lines[i + matchLength].trim() === lines[j + matchLength].trim() &&
               lines[i + matchLength].trim() !== '') {
          matchLength++;
        }

        if (matchLength >= minBlockSize) {
          duplicates.push({
            startLine: i + 1,
            lines: matchLength
          });
        }
      }
    }

    return duplicates;
  }

  async calculateProjectComplexity(files) {
    let totalComplexity = 0;
    let totalFiles = 0;
    const complexityDistribution = { low: 0, medium: 0, high: 0, veryHigh: 0 };

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const complexity = this.calculateComplexity(content, path.extname(file));
        totalComplexity += complexity.cyclomaticComplexity;
        totalFiles++;

        if (complexity.cyclomaticComplexity <= 5) complexityDistribution.low++;
        else if (complexity.cyclomaticComplexity <= 10) complexityDistribution.medium++;
        else if (complexity.cyclomaticComplexity <= 20) complexityDistribution.high++;
        else complexityDistribution.veryHigh++;
      } catch (error) {
        // Skip files we can't read
      }
    }

    return {
      averageComplexity: totalFiles > 0 ? totalComplexity / totalFiles : 0,
      totalComplexity,
      distribution: complexityDistribution
    };
  }

  async calculateDuplication(files) {
    // Simplified duplication detection
    const blocks = [];
    let totalDuplication = 0;

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');
        const duplicates = this.findDuplicateBlocks(lines);
        totalDuplication += duplicates.length;
        blocks.push(...duplicates);
      } catch (error) {
        // Skip files we can't read
      }
    }

    return {
      duplicateBlocks: blocks.length,
      duplicationPercentage: files.length > 0 ? (totalDuplication / files.length) * 100 : 0
    };
  }

  async calculateMaintainability(files) {
    let totalMaintainability = 0;
    let validFiles = 0;

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const complexity = this.calculateComplexity(content, path.extname(file));
        
        // Simplified maintainability index calculation
        const maintainabilityIndex = Math.max(0, 
          171 - 5.2 * Math.log(complexity.linesOfCode) - 
          0.23 * complexity.cyclomaticComplexity - 
          16.2 * Math.log(complexity.linesOfCode / 1000)
        );

        totalMaintainability += maintainabilityIndex;
        validFiles++;
      } catch (error) {
        // Skip files we can't read
      }
    }

    const averageMaintainability = validFiles > 0 ? totalMaintainability / validFiles : 0;
    
    return {
      averageMaintainability,
      rating: averageMaintainability > 85 ? 'Excellent' :
              averageMaintainability > 71 ? 'Good' :
              averageMaintainability > 51 ? 'Moderate' : 'Poor'
    };
  }

  formatReportAsText(report) {
    let text = `📊 CODE QUALITY REPORT\n`;
    text += `==========================================\n\n`;
    text += `📅 Analysis Date: ${new Date(report.summary.analysisDate).toLocaleString()}\n`;
    text += `📁 Total Files: ${report.summary.totalFiles}\n`;
    text += `📄 Total Lines: ${report.summary.totalLines.toLocaleString()}\n\n`;

    if (report.metrics.complexity) {
      text += `🧮 COMPLEXITY METRICS\n`;
      text += `---------------------\n`;
      text += `Average Complexity: ${report.metrics.complexity.averageComplexity.toFixed(2)}\n`;
      text += `Total Complexity: ${report.metrics.complexity.totalComplexity}\n`;
      text += `Distribution:\n`;
      text += `  🟢 Low (0-5): ${report.metrics.complexity.distribution.low}\n`;
      text += `  🟡 Medium (6-10): ${report.metrics.complexity.distribution.medium}\n`;
      text += `  🟠 High (11-20): ${report.metrics.complexity.distribution.high}\n`;
      text += `  🔴 Very High (21+): ${report.metrics.complexity.distribution.veryHigh}\n\n`;
    }

    if (report.metrics.duplication) {
      text += `📋 DUPLICATION METRICS\n`;
      text += `----------------------\n`;
      text += `Duplicate Blocks: ${report.metrics.duplication.duplicateBlocks}\n`;
      text += `Duplication Rate: ${report.metrics.duplication.duplicationPercentage.toFixed(2)}%\n\n`;
    }

    if (report.metrics.maintainability) {
      text += `🔧 MAINTAINABILITY METRICS\n`;
      text += `---------------------------\n`;
      text += `Average Index: ${report.metrics.maintainability.averageMaintainability.toFixed(2)}\n`;
      text += `Rating: ${report.metrics.maintainability.rating}\n\n`;
    }

    return text;
  }

  formatReportAsMarkdown(report) {
    let md = `# 📊 Code Quality Report\n\n`;
    md += `**Analysis Date:** ${new Date(report.summary.analysisDate).toLocaleString()}\n`;
    md += `**Total Files:** ${report.summary.totalFiles}\n`;
    md += `**Total Lines:** ${report.summary.totalLines.toLocaleString()}\n\n`;

    if (report.metrics.complexity) {
      md += `## 🧮 Complexity Metrics\n\n`;
      md += `- **Average Complexity:** ${report.metrics.complexity.averageComplexity.toFixed(2)}\n`;
      md += `- **Total Complexity:** ${report.metrics.complexity.totalComplexity}\n\n`;
      md += `### Distribution\n`;
      md += `- 🟢 Low (0-5): ${report.metrics.complexity.distribution.low}\n`;
      md += `- 🟡 Medium (6-10): ${report.metrics.complexity.distribution.medium}\n`;
      md += `- 🟠 High (11-20): ${report.metrics.complexity.distribution.high}\n`;
      md += `- 🔴 Very High (21+): ${report.metrics.complexity.distribution.veryHigh}\n\n`;
    }

    return md;
  }

  formatReportAsHTML(report) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Code Quality Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }
        .good { border-color: #28a745; }
        .warning { border-color: #ffc107; }
        .danger { border-color: #dc3545; }
    </style>
</head>
<body>
    <h1>📊 Code Quality Report</h1>
    <p><strong>Analysis Date:</strong> ${new Date(report.summary.analysisDate).toLocaleString()}</p>
    <p><strong>Total Files:</strong> ${report.summary.totalFiles}</p>
    <p><strong>Total Lines:</strong> ${report.summary.totalLines.toLocaleString()}</p>
    ${report.metrics.complexity ? `
    <div class="metric">
        <h2>🧮 Complexity Metrics</h2>
        <p><strong>Average Complexity:</strong> ${report.metrics.complexity.averageComplexity.toFixed(2)}</p>
        <p><strong>Total Complexity:</strong> ${report.metrics.complexity.totalComplexity}</p>
    </div>
    ` : ''}
</body>
</html>`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('CodeQualityMCP server running on stdio');
  }
}

const server = new CodeQualityMCPServer();
server.run().catch(console.error);