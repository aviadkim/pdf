#!/usr/bin/env node

// GitHub MCP Server for repository management and automation
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

class GitHubMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'github-management-server',
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
            name: 'github_create_repo',
            description: 'Create new GitHub repository',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Repository name'
                },
                description: {
                  type: 'string',
                  description: 'Repository description'
                },
                private: {
                  type: 'boolean',
                  description: 'Make repository private',
                  default: false
                },
                initReadme: {
                  type: 'boolean',
                  description: 'Initialize with README',
                  default: true
                },
                gitignoreTemplate: {
                  type: 'string',
                  description: 'Gitignore template (e.g., Node, Python, React)'
                },
                license: {
                  type: 'string',
                  description: 'License template (e.g., MIT, Apache-2.0)'
                },
                token: {
                  type: 'string',
                  description: 'GitHub personal access token'
                }
              },
              required: ['name', 'token']
            }
          },
          {
            name: 'github_clone_repo',
            description: 'Clone GitHub repository to local directory',
            inputSchema: {
              type: 'object',
              properties: {
                repoUrl: {
                  type: 'string',
                  description: 'GitHub repository URL or owner/repo format'
                },
                targetPath: {
                  type: 'string',
                  description: 'Local path to clone to'
                },
                branch: {
                  type: 'string',
                  description: 'Specific branch to clone',
                  default: 'main'
                },
                depth: {
                  type: 'number',
                  description: 'Clone depth (shallow clone)',
                  default: 0
                }
              },
              required: ['repoUrl', 'targetPath']
            }
          },
          {
            name: 'github_create_pr',
            description: 'Create pull request using GitHub CLI',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project directory'
                },
                title: {
                  type: 'string',
                  description: 'Pull request title'
                },
                body: {
                  type: 'string',
                  description: 'Pull request description'
                },
                base: {
                  type: 'string',
                  description: 'Base branch',
                  default: 'main'
                },
                head: {
                  type: 'string',
                  description: 'Head branch (current branch if not specified)'
                },
                draft: {
                  type: 'boolean',
                  description: 'Create as draft PR',
                  default: false
                },
                assignees: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'GitHub usernames to assign'
                },
                labels: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Labels to add to PR'
                }
              },
              required: ['projectPath', 'title']
            }
          },
          {
            name: 'github_repo_info',
            description: 'Get repository information and statistics',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner'
                },
                repo: {
                  type: 'string',
                  description: 'Repository name'
                },
                token: {
                  type: 'string',
                  description: 'GitHub personal access token'
                }
              },
              required: ['owner', 'repo', 'token']
            }
          },
          {
            name: 'github_list_issues',
            description: 'List repository issues with filtering',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner'
                },
                repo: {
                  type: 'string',
                  description: 'Repository name'
                },
                state: {
                  type: 'string',
                  enum: ['open', 'closed', 'all'],
                  description: 'Issue state',
                  default: 'open'
                },
                labels: {
                  type: 'string',
                  description: 'Comma-separated list of labels'
                },
                assignee: {
                  type: 'string',
                  description: 'Filter by assignee'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of issues to return',
                  default: 30
                },
                token: {
                  type: 'string',
                  description: 'GitHub personal access token'
                }
              },
              required: ['owner', 'repo', 'token']
            }
          },
          {
            name: 'github_create_issue',
            description: 'Create new GitHub issue',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner'
                },
                repo: {
                  type: 'string',
                  description: 'Repository name'
                },
                title: {
                  type: 'string',
                  description: 'Issue title'
                },
                body: {
                  type: 'string',
                  description: 'Issue description'
                },
                labels: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Labels to add'
                },
                assignees: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Users to assign'
                },
                milestone: {
                  type: 'number',
                  description: 'Milestone number'
                },
                token: {
                  type: 'string',
                  description: 'GitHub personal access token'
                }
              },
              required: ['owner', 'repo', 'title', 'token']
            }
          },
          {
            name: 'github_workflow_status',
            description: 'Check GitHub Actions workflow status',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner'
                },
                repo: {
                  type: 'string',
                  description: 'Repository name'
                },
                workflowId: {
                  type: 'string',
                  description: 'Workflow ID or filename'
                },
                branch: {
                  type: 'string',
                  description: 'Branch to check'
                },
                token: {
                  type: 'string',
                  description: 'GitHub personal access token'
                }
              },
              required: ['owner', 'repo', 'token']
            }
          },
          {
            name: 'github_release_create',
            description: 'Create GitHub release',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner'
                },
                repo: {
                  type: 'string',
                  description: 'Repository name'
                },
                tagName: {
                  type: 'string',
                  description: 'Tag name for release'
                },
                name: {
                  type: 'string',
                  description: 'Release name'
                },
                body: {
                  type: 'string',
                  description: 'Release notes'
                },
                draft: {
                  type: 'boolean',
                  description: 'Create as draft',
                  default: false
                },
                prerelease: {
                  type: 'boolean',
                  description: 'Mark as prerelease',
                  default: false
                },
                generateReleaseNotes: {
                  type: 'boolean',
                  description: 'Auto-generate release notes',
                  default: true
                },
                token: {
                  type: 'string',
                  description: 'GitHub personal access token'
                }
              },
              required: ['owner', 'repo', 'tagName', 'name', 'token']
            }
          },
          {
            name: 'git_commit_push',
            description: 'Add, commit, and push changes to repository',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project directory'
                },
                message: {
                  type: 'string',
                  description: 'Commit message'
                },
                files: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific files to add (default: all changes)',
                  default: ['.']
                },
                branch: {
                  type: 'string',
                  description: 'Branch to push to (current branch if not specified)'
                },
                force: {
                  type: 'boolean',
                  description: 'Force push',
                  default: false
                }
              },
              required: ['projectPath', 'message']
            }
          },
          {
            name: 'github_branch_protection',
            description: 'Configure branch protection rules',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner'
                },
                repo: {
                  type: 'string',
                  description: 'Repository name'
                },
                branch: {
                  type: 'string',
                  description: 'Branch name',
                  default: 'main'
                },
                requirePRReviews: {
                  type: 'boolean',
                  description: 'Require PR reviews',
                  default: true
                },
                requiredReviewers: {
                  type: 'number',
                  description: 'Number of required reviewers',
                  default: 1
                },
                requireStatusChecks: {
                  type: 'boolean',
                  description: 'Require status checks',
                  default: true
                },
                requiredStatusChecks: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Required status check contexts'
                },
                enforceAdmins: {
                  type: 'boolean',
                  description: 'Enforce restrictions for admins',
                  default: false
                },
                token: {
                  type: 'string',
                  description: 'GitHub personal access token'
                }
              },
              required: ['owner', 'repo', 'token']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'github_create_repo':
            return await this.githubCreateRepo(args);
          case 'github_clone_repo':
            return await this.githubCloneRepo(args);
          case 'github_create_pr':
            return await this.githubCreatePR(args);
          case 'github_repo_info':
            return await this.githubRepoInfo(args);
          case 'github_list_issues':
            return await this.githubListIssues(args);
          case 'github_create_issue':
            return await this.githubCreateIssue(args);
          case 'github_workflow_status':
            return await this.githubWorkflowStatus(args);
          case 'github_release_create':
            return await this.githubReleaseCreate(args);
          case 'git_commit_push':
            return await this.gitCommitPush(args);
          case 'github_branch_protection':
            return await this.githubBranchProtection(args);
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

  async githubCreateRepo(args) {
    const { 
      name, 
      description = '', 
      private: isPrivate = false, 
      initReadme = true, 
      gitignoreTemplate, 
      license, 
      token 
    } = args;

    try {
      const repoData = {
        name: name,
        description: description,
        private: isPrivate,
        auto_init: initReadme
      };

      if (gitignoreTemplate) {
        repoData.gitignore_template = gitignoreTemplate;
      }

      if (license) {
        repoData.license_template = license;
      }

      const response = await axios.post('https://api.github.com/user/repos', repoData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        }
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            repository: {
              name: response.data.name,
              fullName: response.data.full_name,
              htmlUrl: response.data.html_url,
              cloneUrl: response.data.clone_url,
              sshUrl: response.data.ssh_url,
              private: response.data.private,
              description: response.data.description
            },
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`GitHub repository creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async githubCloneRepo(args) {
    const { repoUrl, targetPath, branch = 'main', depth = 0 } = args;

    try {
      const targetDir = path.resolve(targetPath);
      
      // Ensure parent directory exists
      await fs.mkdir(path.dirname(targetDir), { recursive: true });

      let cloneUrl = repoUrl;
      if (!repoUrl.startsWith('http') && !repoUrl.startsWith('git@')) {
        cloneUrl = `https://github.com/${repoUrl}.git`;
      }

      let cloneCmd = ['git', 'clone'];
      
      if (depth > 0) {
        cloneCmd.push('--depth', depth.toString());
      }
      
      if (branch !== 'main') {
        cloneCmd.push('--branch', branch);
      }
      
      cloneCmd.push(cloneUrl, targetDir);

      const result = await this.runCommand(cloneCmd);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            repoUrl: repoUrl,
            targetPath: targetDir,
            branch: branch,
            depth: depth,
            output: result.stdout,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Repository clone failed: ${error.message}`);
    }
  }

  async githubCreatePR(args) {
    const { 
      projectPath, 
      title, 
      body = '', 
      base = 'main', 
      head, 
      draft = false,
      assignees = [],
      labels = []
    } = args;

    try {
      const projectDir = path.resolve(projectPath);
      
      let ghCmd = ['gh', 'pr', 'create', '--title', title, '--body', body, '--base', base];
      
      if (head) {
        ghCmd.push('--head', head);
      }
      
      if (draft) {
        ghCmd.push('--draft');
      }
      
      if (assignees.length > 0) {
        ghCmd.push('--assignee', assignees.join(','));
      }
      
      if (labels.length > 0) {
        ghCmd.push('--label', labels.join(','));
      }

      const result = await this.runCommand(ghCmd, { cwd: projectDir });

      // Extract PR URL from output
      const prUrlMatch = result.stdout.match(/https:\/\/github\.com\/[^\s]+\/pull\/\d+/);
      const prUrl = prUrlMatch ? prUrlMatch[0] : null;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            title: title,
            base: base,
            head: head,
            draft: draft,
            assignees: assignees,
            labels: labels,
            prUrl: prUrl,
            output: result.stdout,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Pull request creation failed: ${error.message}`);
    }
  }

  async githubRepoInfo(args) {
    const { owner, repo, token } = args;

    try {
      const [repoResponse, contributorsResponse, languagesResponse] = await Promise.all([
        axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`https://api.github.com/repos/${owner}/${repo}/contributors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`https://api.github.com/repos/${owner}/${repo}/languages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const repoData = repoResponse.data;
      const contributors = contributorsResponse.data;
      const languages = languagesResponse.data;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            repository: {
              name: repoData.name,
              fullName: repoData.full_name,
              description: repoData.description,
              htmlUrl: repoData.html_url,
              private: repoData.private,
              fork: repoData.fork,
              createdAt: repoData.created_at,
              updatedAt: repoData.updated_at,
              size: repoData.size,
              stargazersCount: repoData.stargazers_count,
              watchersCount: repoData.watchers_count,
              forksCount: repoData.forks_count,
              openIssuesCount: repoData.open_issues_count,
              defaultBranch: repoData.default_branch,
              license: repoData.license?.name || 'None'
            },
            contributors: contributors.slice(0, 10).map(c => ({
              login: c.login,
              contributions: c.contributions,
              type: c.type
            })),
            languages: languages,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Repository info retrieval failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async githubListIssues(args) {
    const { owner, repo, state = 'open', labels, assignee, limit = 30, token } = args;

    try {
      const params = new URLSearchParams({
        state: state,
        per_page: limit.toString()
      });

      if (labels) params.append('labels', labels);
      if (assignee) params.append('assignee', assignee);

      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/issues?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const issues = response.data.filter(issue => !issue.pull_request); // Exclude PRs

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            repository: `${owner}/${repo}`,
            filters: { state, labels, assignee },
            totalCount: issues.length,
            issues: issues.map(issue => ({
              number: issue.number,
              title: issue.title,
              state: issue.state,
              user: issue.user.login,
              assignees: issue.assignees.map(a => a.login),
              labels: issue.labels.map(l => l.name),
              createdAt: issue.created_at,
              updatedAt: issue.updated_at,
              htmlUrl: issue.html_url,
              comments: issue.comments
            })),
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Issues listing failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async githubCreateIssue(args) {
    const { owner, repo, title, body = '', labels = [], assignees = [], milestone, token } = args;

    try {
      const issueData = {
        title: title,
        body: body,
        labels: labels,
        assignees: assignees
      };

      if (milestone) {
        issueData.milestone = milestone;
      }

      const response = await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/issues`,
        issueData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            issue: {
              number: response.data.number,
              title: response.data.title,
              state: response.data.state,
              htmlUrl: response.data.html_url,
              user: response.data.user.login,
              labels: response.data.labels.map(l => l.name),
              assignees: response.data.assignees.map(a => a.login),
              createdAt: response.data.created_at
            },
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Issue creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async githubWorkflowStatus(args) {
    const { owner, repo, workflowId, branch, token } = args;

    try {
      let url = `https://api.github.com/repos/${owner}/${repo}/actions/runs`;
      const params = new URLSearchParams({ per_page: '10' });
      
      if (branch) params.append('branch', branch);
      if (workflowId) {
        url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs`;
      }

      const response = await axios.get(`${url}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const runs = response.data.workflow_runs;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            repository: `${owner}/${repo}`,
            workflowId: workflowId,
            branch: branch,
            totalCount: runs.length,
            runs: runs.map(run => ({
              id: run.id,
              name: run.name,
              headBranch: run.head_branch,
              status: run.status,
              conclusion: run.conclusion,
              createdAt: run.created_at,
              updatedAt: run.updated_at,
              htmlUrl: run.html_url,
              headCommit: {
                message: run.head_commit.message,
                author: run.head_commit.author.name
              }
            })),
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Workflow status check failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async gitCommitPush(args) {
    const { projectPath, message, files = ['.'], branch, force = false } = args;

    try {
      const projectDir = path.resolve(projectPath);

      // Add files
      const addResult = await this.runCommand(['git', 'add', ...files], { cwd: projectDir });

      // Check if there are changes to commit
      const statusResult = await this.runCommand(['git', 'status', '--porcelain'], { cwd: projectDir });
      
      if (!statusResult.stdout.trim()) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'No changes to commit',
              projectPath: projectDir,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }

      // Commit changes
      const commitResult = await this.runCommand(['git', 'commit', '-m', message], { cwd: projectDir });

      // Push changes
      let pushCmd = ['git', 'push'];
      if (branch) {
        pushCmd.push('origin', branch);
      }
      if (force) {
        pushCmd.push('--force');
      }

      const pushResult = await this.runCommand(pushCmd, { cwd: projectDir });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            projectPath: projectDir,
            message: message,
            filesAdded: files,
            branch: branch,
            force: force,
            commitOutput: commitResult.stdout,
            pushOutput: pushResult.stdout,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Git commit and push failed: ${error.message}`);
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
    
    console.error('GitHub MCP Server running');
  }
}

// Handle test mode
if (process.argv.includes('--test')) {
  console.log('GitHub MCP Server test passed');
  process.exit(0);
}

// Start the server
const server = new GitHubMCPServer();
server.run().catch(console.error);