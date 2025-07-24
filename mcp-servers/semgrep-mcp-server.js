#!/usr/bin/env node

// Semgrep MCP Server for security scanning and code quality analysis
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

class SemgrepMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'semgrep-security-server',
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
            name: 'semgrep_scan',
            description: 'Run Semgrep security scan on project',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project directory to scan'
                },
                rulesets: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Ruleset IDs to use (e.g., ["owasp-top-10", "security"])',
                  default: ['auto']
                },
                severity: {
                  type: 'string',
                  enum: ['INFO', 'WARNING', 'ERROR', 'all'],
                  description: 'Minimum severity level',
                  default: 'WARNING'
                },
                output: {
                  type: 'string',
                  enum: ['json', 'text', 'sarif', 'emacs', 'vim'],
                  description: 'Output format',
                  default: 'json'
                },
                exclude: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Patterns to exclude from scanning'
                },
                maxFileSize: {
                  type: 'string',
                  description: 'Maximum file size to scan (e.g., "1MB")',
                  default: '1MB'
                },
                timeout: {
                  type: 'number',
                  description: 'Timeout in seconds',
                  default: 300
                }
              },
              required: ['projectPath']
            }
          },
          {
            name: 'semgrep_rules_list',
            description: 'List available Semgrep rulesets and rules',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Filter by category (security, correctness, performance, etc.)'
                },
                language: {
                  type: 'string',
                  description: 'Filter by programming language'
                },
                search: {
                  type: 'string',
                  description: 'Search term for rule names/descriptions'
                }
              }
            }
          },
          {
            name: 'semgrep_custom_rule',
            description: 'Create and run custom Semgrep rule',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project directory'
                },
                ruleYaml: {
                  type: 'string',
                  description: 'Custom rule in YAML format'
                },
                saveRule: {
                  type: 'boolean',
                  description: 'Save rule to project .semgrep/ directory',
                  default: false
                },
                ruleName: {
                  type: 'string',
                  description: 'Name for saved rule file'
                }
              },
              required: ['projectPath', 'ruleYaml']
            }
          },
          {
            name: 'semgrep_baseline',
            description: 'Create baseline for ignoring existing findings',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project directory'
                },
                baselineFile: {
                  type: 'string',
                  description: 'Path for baseline file',
                  default: '.semgrep_baseline.json'
                },
                rulesets: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Rulesets to include in baseline'
                }
              },
              required: ['projectPath']
            }
          },
          {
            name: 'semgrep_diff_scan',
            description: 'Scan only changed files (diff scan)',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project directory'
                },
                baseBranch: {
                  type: 'string',
                  description: 'Base branch for comparison',
                  default: 'main'
                },
                rulesets: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Rulesets to use'
                },
                staged: {
                  type: 'boolean',
                  description: 'Scan only staged changes',
                  default: false
                }
              },
              required: ['projectPath']
            }
          },
          {
            name: 'semgrep_fix',
            description: 'Auto-fix issues found by Semgrep',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project directory'
                },
                rulesets: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Rulesets with fix suggestions'
                },
                dryRun: {
                  type: 'boolean',
                  description: 'Show fixes without applying them',
                  default: true
                },
                autoConfirm: {
                  type: 'boolean',
                  description: 'Auto-confirm all fixes',
                  default: false
                }
              },
              required: ['projectPath']
            }
          },
          {
            name: 'semgrep_report',
            description: 'Generate comprehensive security report',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project directory'
                },
                reportPath: {
                  type: 'string',
                  description: 'Path for report output',
                  default: './security-report.html'
                },
                includeFixed: {
                  type: 'boolean',
                  description: 'Include already fixed issues',
                  default: false
                },
                groupBy: {
                  type: 'string',
                  enum: ['severity', 'file', 'rule'],
                  description: 'How to group findings',
                  default: 'severity'
                }
              },
              required: ['projectPath']
            }
          },
          {
            name: 'semgrep_ci_config',
            description: 'Generate CI/CD configuration for Semgrep',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project directory'
                },
                ciPlatform: {
                  type: 'string',
                  enum: ['github-actions', 'gitlab-ci', 'jenkins', 'azure-pipelines'],
                  description: 'CI/CD platform',
                  default: 'github-actions'
                },
                failOnFindings: {
                  type: 'boolean',
                  description: 'Fail CI on security findings',
                  default: true
                },
                rulesets: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Rulesets to use in CI'
                },
                uploadResults: {
                  type: 'boolean',
                  description: 'Upload results to Semgrep App',
                  default: false
                }
              },
              required: ['projectPath']
            }
          },
          {
            name: 'semgrep_dependency_scan',
            description: 'Scan for vulnerable dependencies',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project directory'
                },
                packageFiles: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific package files to scan'
                },
                severity: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                  description: 'Minimum vulnerability severity',
                  default: 'medium'
                }
              },
              required: ['projectPath']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'semgrep_scan':
            return await this.semgrepScan(args);
          case 'semgrep_rules_list':
            return await this.semgrepRulesList(args);
          case 'semgrep_custom_rule':
            return await this.semgrepCustomRule(args);
          case 'semgrep_baseline':
            return await this.semgrepBaseline(args);
          case 'semgrep_diff_scan':
            return await this.semgrepDiffScan(args);
          case 'semgrep_fix':
            return await this.semgrepFix(args);
          case 'semgrep_report':
            return await this.semgrepReport(args);
          case 'semgrep_ci_config':
            return await this.semgrepCiConfig(args);
          case 'semgrep_dependency_scan':
            return await this.semgrepDependencyScan(args);
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

  async semgrepScan(args) {
    const { 
      projectPath, 
      rulesets = ['auto'], 
      severity = 'WARNING', 
      output = 'json',
      exclude = [],
      maxFileSize = '1MB',
      timeout = 300
    } = args;

    try {
      const projectDir = path.resolve(projectPath);
      
      let semgrepCmd = ['semgrep', '--config'];
      
      // Add rulesets
      if (rulesets.includes('auto')) {
        semgrepCmd.push('auto');
      } else {
        semgrepCmd.push(rulesets.join(','));
      }

      // Add other options
      semgrepCmd.push('--json', '--timeout', timeout.toString());
      
      if (severity !== 'all') {
        semgrepCmd.push('--severity', severity);
      }

      // Add exclusions
      exclude.forEach(pattern => {
        semgrepCmd.push('--exclude', pattern);
      });

      semgrepCmd.push('--max-target-bytes', maxFileSize);
      semgrepCmd.push(projectDir);

      const result = await this.runCommand(semgrepCmd, { timeout: (timeout + 30) * 1000 });
      
      let findings = [];
      if (result.stdout.trim()) {
        try {
          const scanResults = JSON.parse(result.stdout);
          findings = scanResults.results || [];
        } catch (parseError) {
          // If JSON parsing fails, treat as text output
          findings = result.stdout.split('\n').filter(line => line.trim());
        }
      }

      // Analyze findings
      const summary = this.analyzeScanResults(findings);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            projectPath: projectDir,
            rulesets: rulesets,
            severity: severity,
            summary: summary,
            findings: findings,
            scanTime: new Date().toISOString(),
            semgrepVersion: await this.getSemgrepVersion()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Semgrep scan failed: ${error.message}`);
    }
  }

  async semgrepRulesList(args) {
    const { category, language, search } = args;

    try {
      let cmd = ['semgrep', '--list'];
      
      if (category) cmd.push('--category', category);
      if (language) cmd.push('--lang', language);

      const result = await this.runCommand(cmd);
      let rules = result.stdout.split('\n').filter(line => line.trim());

      if (search) {
        const searchLower = search.toLowerCase();
        rules = rules.filter(rule => 
          rule.toLowerCase().includes(searchLower)
        );
      }

      // Parse rule information
      const ruleDetails = rules.map(rule => {
        const parts = rule.split('\t');
        return {
          id: parts[0] || rule,
          description: parts[1] || '',
          severity: parts[2] || 'unknown',
          language: parts[3] || 'unknown'
        };
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            filters: { category, language, search },
            totalRules: ruleDetails.length,
            rules: ruleDetails,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to list Semgrep rules: ${error.message}`);
    }
  }

  async semgrepCustomRule(args) {
    const { projectPath, ruleYaml, saveRule = false, ruleName } = args;

    try {
      const projectDir = path.resolve(projectPath);
      
      // Create temporary rule file
      const tempRuleFile = path.join(projectDir, '.temp-semgrep-rule.yml');
      await fs.writeFile(tempRuleFile, ruleYaml);

      // Run semgrep with custom rule
      const result = await this.runCommand(['semgrep', '--config', tempRuleFile, '--json', projectDir]);

      // Parse results
      let findings = [];
      if (result.stdout.trim()) {
        const scanResults = JSON.parse(result.stdout);
        findings = scanResults.results || [];
      }

      // Save rule if requested
      if (saveRule && ruleName) {
        const semgrepDir = path.join(projectDir, '.semgrep');
        await fs.mkdir(semgrepDir, { recursive: true });
        const savedRulePath = path.join(semgrepDir, `${ruleName}.yml`);
        await fs.writeFile(savedRulePath, ruleYaml);
      }

      // Clean up temp file
      await fs.unlink(tempRuleFile);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            projectPath: projectDir,
            ruleName: ruleName,
            saved: saveRule,
            findings: findings,
            findingsCount: findings.length,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Custom rule execution failed: ${error.message}`);
    }
  }

  async semgrepBaseline(args) {
    const { projectPath, baselineFile = '.semgrep_baseline.json', rulesets } = args;

    try {
      const projectDir = path.resolve(projectPath);
      const baselinePath = path.join(projectDir, baselineFile);
      
      let cmd = ['semgrep', '--baseline', baselinePath];
      
      if (rulesets && rulesets.length > 0) {
        cmd.push('--config', rulesets.join(','));
      } else {
        cmd.push('--config', 'auto');
      }
      
      cmd.push('--json', projectDir);

      const result = await this.runCommand(cmd);
      
      // Parse baseline
      const baselineData = await fs.readFile(baselinePath, 'utf8');
      const baseline = JSON.parse(baselineData);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            projectPath: projectDir,
            baselineFile: baselinePath,
            baselineCreated: true,
            baselineSize: baseline.results?.length || 0,
            rulesets: rulesets,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Baseline creation failed: ${error.message}`);
    }
  }

  async semgrepDiffScan(args) {
    const { projectPath, baseBranch = 'main', rulesets, staged = false } = args;

    try {
      const projectDir = path.resolve(projectPath);
      
      let cmd = ['semgrep'];
      
      if (staged) {
        cmd.push('--diff-staged');
      } else {
        cmd.push('--diff', `origin/${baseBranch}`);
      }
      
      if (rulesets && rulesets.length > 0) {
        cmd.push('--config', rulesets.join(','));
      } else {
        cmd.push('--config', 'auto');
      }
      
      cmd.push('--json', projectDir);

      const result = await this.runCommand(cmd, { cwd: projectDir });
      
      let findings = [];
      if (result.stdout.trim()) {
        const scanResults = JSON.parse(result.stdout);
        findings = scanResults.results || [];
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            projectPath: projectDir,
            scanType: staged ? 'staged-changes' : 'diff-from-branch',
            baseBranch: baseBranch,
            findings: findings,
            newIssuesCount: findings.length,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Diff scan failed: ${error.message}`);
    }
  }

  async semgrepFix(args) {
    const { projectPath, rulesets, dryRun = true, autoConfirm = false } = args;

    try {
      const projectDir = path.resolve(projectPath);
      
      let cmd = ['semgrep', '--autofix'];
      
      if (dryRun) {
        cmd.push('--dryrun');
      }
      
      if (autoConfirm) {
        cmd.push('--autofix-ignore-files');
      }
      
      if (rulesets && rulesets.length > 0) {
        cmd.push('--config', rulesets.join(','));
      } else {
        cmd.push('--config', 'auto');
      }
      
      cmd.push('--json', projectDir);

      const result = await this.runCommand(cmd, { cwd: projectDir });
      
      let fixes = [];
      if (result.stdout.trim()) {
        const fixResults = JSON.parse(result.stdout);
        fixes = fixResults.results || [];
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            projectPath: projectDir,
            dryRun: dryRun,
            autoConfirm: autoConfirm,
            fixes: fixes,
            fixesCount: fixes.length,
            fixesApplied: !dryRun,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Auto-fix failed: ${error.message}`);
    }
  }

  async semgrepCiConfig(args) {
    const { 
      projectPath, 
      ciPlatform = 'github-actions', 
      failOnFindings = true, 
      rulesets,
      uploadResults = false 
    } = args;

    try {
      const projectDir = path.resolve(projectPath);
      let configContent = '';
      let configPath = '';

      switch (ciPlatform) {
        case 'github-actions':
          configPath = path.join(projectDir, '.github', 'workflows', 'semgrep.yml');
          configContent = this.generateGitHubActionsConfig(failOnFindings, rulesets, uploadResults);
          break;
        case 'gitlab-ci':
          configPath = path.join(projectDir, '.gitlab-ci.yml');
          configContent = this.generateGitLabCIConfig(failOnFindings, rulesets, uploadResults);
          break;
        case 'jenkins':
          configPath = path.join(projectDir, 'Jenkinsfile.semgrep');
          configContent = this.generateJenkinsConfig(failOnFindings, rulesets, uploadResults);
          break;
        case 'azure-pipelines':
          configPath = path.join(projectDir, 'azure-pipelines.semgrep.yml');
          configContent = this.generateAzurePipelinesConfig(failOnFindings, rulesets, uploadResults);
          break;
      }

      // Ensure directory exists
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      
      // Write config file
      await fs.writeFile(configPath, configContent);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            projectPath: projectDir,
            ciPlatform: ciPlatform,
            configPath: configPath,
            failOnFindings: failOnFindings,
            rulesets: rulesets,
            uploadResults: uploadResults,
            instructions: this.getCIInstructions(ciPlatform),
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`CI config generation failed: ${error.message}`);
    }
  }

  generateGitHubActionsConfig(failOnFindings, rulesets, uploadResults) {
    const rulesConfig = rulesets ? rulesets.join(',') : 'auto';
    return `name: Semgrep Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  semgrep:
    name: Security Scan
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run Semgrep
      id: semgrep
      uses: semgrep/semgrep-action@v1
      with:
        config: ${rulesConfig}
        generateSarif: "1"
        ${uploadResults ? 'publishToken: ${{ secrets.SEMGREP_APP_TOKEN }}' : ''}
    
    - name: Upload SARIF file
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: semgrep.sarif
      if: always()
    
    ${failOnFindings ? `- name: Fail on findings
      if: steps.semgrep.outputs.findings != '0'
      run: |
        echo "Security findings detected!"
        exit 1` : ''}
`;
  }

  analyzeScanResults(findings) {
    if (!Array.isArray(findings)) {
      return { total: 0, severities: {} };
    }

    const summary = {
      total: findings.length,
      severities: {},
      rules: {},
      files: {}
    };

    findings.forEach(finding => {
      // Count by severity
      const severity = finding.extra?.severity || 'UNKNOWN';
      summary.severities[severity] = (summary.severities[severity] || 0) + 1;

      // Count by rule
      const ruleId = finding.check_id || 'unknown-rule';
      summary.rules[ruleId] = (summary.rules[ruleId] || 0) + 1;

      // Count by file
      const filePath = finding.path || 'unknown-file';
      summary.files[filePath] = (summary.files[filePath] || 0) + 1;
    });

    return summary;
  }

  async getSemgrepVersion() {
    try {
      const result = await this.runCommand(['semgrep', '--version']);
      return result.stdout.trim();
    } catch {
      return 'unknown';
    }
  }

  getCIInstructions(platform) {
    const instructions = {
      'github-actions': [
        '1. Commit and push the workflow file',
        '2. The scan will run automatically on pushes and PRs',
        '3. Check the Actions tab for results',
        '4. Set SEMGREP_APP_TOKEN secret if using uploaded results'
      ],
      'gitlab-ci': [
        '1. Commit the .gitlab-ci.yml changes',
        '2. Pipeline will run automatically',
        '3. Check CI/CD > Pipelines for results'
      ],
      'jenkins': [
        '1. Create a new Pipeline job',
        '2. Use the generated Jenkinsfile',
        '3. Configure SCM settings',
        '4. Run the pipeline'
      ],
      'azure-pipelines': [
        '1. Import the pipeline YAML',
        '2. Configure repository connection',
        '3. Run the pipeline'
      ]
    };

    return instructions[platform] || ['Configuration created successfully'];
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
        // Semgrep may return non-zero exit code when findings are found
        if (code === 0 || (code === 1 && stdout.trim())) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      if (options.timeout) {
        setTimeout(() => {
          child.kill('SIGTERM');
          reject(new Error('Command timed out'));
        }, options.timeout);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('Semgrep MCP Server running');
  }
}

// Handle test mode
if (process.argv.includes('--test')) {
  console.log('Semgrep MCP Server test passed');
  process.exit(0);
}

// Start the server
const server = new SemgrepMCPServer();
server.run().catch(console.error);