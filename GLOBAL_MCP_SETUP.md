# Global MCP Servers Setup for Claude Code

## Overview
This guide explains how to set up your MCP servers globally for Claude Code so they're available in every project.

## Setup Instructions

### Option 1: Quick Setup (PowerShell)
Run the provided PowerShell script:
```powershell
.\setup-global-mcp.ps1
```

This will:
- Copy all MCP servers to `%USERPROFILE%\claude-mcp-servers`
- Install dependencies
- Configure Claude Code to use the global MCP servers
- Create the configuration at `%APPDATA%\Claude\claude_desktop_config.json`

### Option 2: Manual Setup

1. **Copy MCP servers to a global location:**
   ```bash
   mkdir %USERPROFILE%\claude-mcp-servers
   xcopy /E /I mcp-servers %USERPROFILE%\claude-mcp-servers
   ```

2. **Install dependencies:**
   ```bash
   cd %USERPROFILE%\claude-mcp-servers
   npm install
   ```

3. **Create Claude configuration:**
   Create/edit `%APPDATA%\Claude\claude_desktop_config.json` with the MCP server configurations pointing to the global location.

## Available MCP Servers

1. **Docker** - Container management and deployment
2. **Deployment** - Deploy to Render, Vercel with health monitoring
3. **Playwright** - Browser automation and testing
4. **GitHub** - Repository management and automation
5. **Semgrep** - Security scanning and vulnerability detection
6. **Filesystem** - Advanced file operations
7. **Filescope** - Codebase analysis and exploration
8. **Repomix** - Repository packaging and documentation
9. **Task Management** - Project and task tracking
10. **Advanced File Ops** - File transformations and batch processing
11. **Code Quality** - Code analysis and improvement suggestions
12. **Process Management** - System process monitoring
13. **Puppeteer** - Web scraping and browser automation
14. **Database** - SQLite, MySQL, PostgreSQL operations
15. **Brave Search** - Web search integration

## Usage

After setup, restart Claude Code. The MCP servers will be available globally in all your projects.

## Project-Specific Configuration

If you want to use the MCP servers in a specific project only, use the `claude-code-mcp-config.json` file in your project root instead of the global setup.

## Troubleshooting

1. **MCP servers not showing up:** Restart Claude Code after configuration
2. **Permission errors:** Run PowerShell as Administrator
3. **Path issues:** Ensure paths in config use forward slashes or escaped backslashes

## Updating MCP Servers

To update to the latest version:
1. Pull the latest changes from the MCP servers repository
2. Re-run the setup script or manually copy updated files
3. Restart Claude Code