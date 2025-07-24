# PowerShell script to set up global MCP servers for Claude Code
# This script copies the MCP servers to a global location and configures Claude Code

$globalMcpPath = "$env:USERPROFILE\claude-mcp-servers"
$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"

Write-Host "Setting up global MCP servers for Claude Code..." -ForegroundColor Green

# Create global MCP directory
if (-not (Test-Path $globalMcpPath)) {
    New-Item -ItemType Directory -Path $globalMcpPath -Force | Out-Null
    Write-Host "Created directory: $globalMcpPath" -ForegroundColor Yellow
}

# Copy MCP servers to global location
Write-Host "Copying MCP servers to global location..." -ForegroundColor Yellow
Copy-Item -Path ".\mcp-servers\*" -Destination $globalMcpPath -Force -Recurse

# Install dependencies in global location
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Push-Location $globalMcpPath
npm install
Pop-Location

# Create Claude config directory if it doesn't exist
$claudeConfigDir = Split-Path $configPath -Parent
if (-not (Test-Path $claudeConfigDir)) {
    New-Item -ItemType Directory -Path $claudeConfigDir -Force | Out-Null
}

# Generate global MCP configuration
$mcpConfig = @{
    "mcpServers" = @{
        "docker" = @{
            "command" = "node"
            "args" = @("$globalMcpPath\docker-mcp-server.js")
        }
        "deployment" = @{
            "command" = "node"
            "args" = @("$globalMcpPath\deployment-mcp-server.js")
        }
        "playwright" = @{
            "command" = "node"
            "args" = @("$globalMcpPath\playwright-mcp-server.js")
        }
        "github" = @{
            "command" = "node"
            "args" = @("$globalMcpPath\github-mcp-server.js")
        }
        "semgrep" = @{
            "command" = "node"
            "args" = @("$globalMcpPath\semgrep-mcp-server.js")
        }
        "filesystem" = @{
            "command" = "node"
            "args" = @("$globalMcpPath\filesystem-mcp-server.js")
        }
        "filescope" = @{
            "command" = "node"
            "args" = @("$globalMcpPath\filescope-mcp-server.js")
        }
        "repomix" = @{
            "command" = "node"
            "args" = @("$globalMcpPath\repomix-mcp-server.js")
        }
        "task-management" = @{
            "command" = "node"
            "args" = @("$globalMcpPath\task-management-mcp-server.js")
        }
        "advanced-file-ops" = @{
            "command" = "node"
            "args" = @("$globalMcpPath\advanced-file-ops-mcp-server.js")
        }
        "code-quality" = @{
            "command" = "node"
            "args" = @("$globalMcpPath\code-quality-mcp-server.js")
        }
        "process-management" = @{
            "command" = "node"
            "args" = @("$globalMcpPath\process-management-mcp-server.js")
        }
        "puppeteer" = @{
            "command" = "node"
            "args" = @("$globalMcpPath\puppeteer-mcp-server.js")
        }
        "database" = @{
            "command" = "node"
            "args" = @("$globalMcpPath\database-mcp-server.js")
        }
        "brave-search" = @{
            "command" = "npx"
            "args" = @("-y", "@modelcontextprotocol/server-brave-search")
            "env" = @{
                "BRAVE_API_KEY" = "BSAUjeMGEqKikb9PZ20bcUbc9_2g6Ii"
            }
        }
    }
}

# Write configuration
$mcpConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath -Force
Write-Host "Created Claude configuration at: $configPath" -ForegroundColor Green

Write-Host "`nGlobal MCP setup completed!" -ForegroundColor Green
Write-Host "MCP servers installed at: $globalMcpPath" -ForegroundColor Cyan
Write-Host "Configuration saved to: $configPath" -ForegroundColor Cyan
Write-Host "`nRestart Claude Code to activate the MCP servers." -ForegroundColor Yellow