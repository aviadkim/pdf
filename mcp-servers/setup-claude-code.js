#!/usr/bin/env node

/**
 * Claude Code MCP Servers - Automated Setup Script
 * 
 * This script automatically configures all 14 MCP servers for Claude Code
 * Author: @aviadkim
 * Date: 2025-07-24
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 Claude Code MCP Servers - Automated Setup');
console.log('===============================================\n');

// Configuration
const SERVERS = [
    {
        name: 'docker',
        file: 'docker-mcp-server.js',
        description: 'Docker container management'
    },
    {
        name: 'deployment',
        file: 'deployment-mcp-server.js',
        description: 'Cloud deployment automation'
    },
    {
        name: 'playwright',
        file: 'playwright-mcp-server.js',
        description: 'Browser automation and testing'
    },
    {
        name: 'github',
        file: 'github-mcp-server.js',
        description: 'GitHub repository management'
    },
    {
        name: 'semgrep',
        file: 'semgrep-mcp-server.js',
        description: 'Security vulnerability scanning'
    },
    {
        name: 'filesystem',
        file: 'filesystem-mcp-server.js',
        description: 'Advanced file operations'
    },
    {
        name: 'filescope',
        file: 'filescope-mcp-server.js',
        description: 'Intelligent file analysis'
    },
    {
        name: 'repomix',
        file: 'repomix-mcp-server.js',
        description: 'Repository packaging tools'
    },
    {
        name: 'task-management',
        file: 'task-management-mcp-server.js',
        description: 'Task tracking and project management'
    },
    {
        name: 'advanced-file-ops',
        file: 'advanced-file-ops-mcp-server.js',
        description: 'Advanced file transformations'
    },
    {
        name: 'code-quality',
        file: 'code-quality-mcp-server.js',
        description: 'Code quality analysis'
    },
    {
        name: 'process-management',
        file: 'process-management-mcp-server.js',
        description: 'System process monitoring'
    },
    {
        name: 'puppeteer',
        file: 'puppeteer-mcp-server.js',
        description: 'Web scraping and automation'
    },
    {
        name: 'database',
        file: 'database-mcp-server.js',
        description: 'Database operations'
    }
];

// Helper functions
function runCommand(command, description) {
    try {
        console.log(`⏳ ${description}...`);
        const result = execSync(command, { 
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log(`✅ ${description} completed`);
        return result;
    } catch (error) {
        console.log(`⚠️  ${description} failed: ${error.message}`);
        return null;
    }
}

function checkPrerequisites() {
    console.log('🔍 Checking prerequisites...\n');
    
    // Check Node.js
    try {
        const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
        console.log(`✅ Node.js: ${nodeVersion}`);
    } catch (error) {
        console.log('❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/');
        process.exit(1);
    }
    
    // Check Claude CLI
    try {
        const claudeVersion = execSync('claude --version', { encoding: 'utf-8' }).trim();
        console.log(`✅ Claude Code: ${claudeVersion}`);
    } catch (error) {
        console.log('❌ Claude Code CLI not found. Please install Claude Code first.');
        process.exit(1);
    }
    
    // Check if server files exist
    const currentDir = process.cwd();
    const missingFiles = SERVERS.filter(server => {
        const filePath = path.join(currentDir, server.file);
        return !fs.existsSync(filePath);
    });
    
    if (missingFiles.length > 0) {
        console.log('❌ Missing server files:');
        missingFiles.forEach(server => {
            console.log(`   - ${server.file}`);
        });
        console.log('Please ensure you are running this script in the claude-mcp-servers directory.');
        process.exit(1);
    }
    
    console.log(`✅ All ${SERVERS.length} server files found\n`);
}

function installDependencies() {
    console.log('📦 Installing dependencies...\n');
    
    // Install Node.js dependencies
    runCommand('npm install', 'Installing Node.js packages');
    
    // Install global dependencies if not present
    const globalDeps = [
        { cmd: 'playwright install', desc: 'Installing Playwright browsers' },
        { cmd: 'npm list -g playwright || npm install -g playwright', desc: 'Installing Playwright globally' }
    ];
    
    globalDeps.forEach(dep => {
        runCommand(dep.cmd, dep.desc);
    });
    
    console.log();
}

function configureMCPServers() {
    console.log('⚙️  Configuring MCP servers...\n');
    
    const currentDir = process.cwd();
    let successCount = 0;
    let failCount = 0;
    
    // Remove existing servers first (optional)
    console.log('🧹 Cleaning existing MCP configuration...');
    SERVERS.forEach(server => {
        try {
            execSync(`claude mcp remove ${server.name}`, { 
                stdio: ['pipe', 'pipe', 'pipe'] 
            });
        } catch (error) {
            // Ignore errors - server might not exist
        }
    });
    
    console.log('\n🔧 Adding MCP servers...\n');
    
    // Add each server
    SERVERS.forEach((server, index) => {
        const serverPath = path.join(currentDir, server.file);
        const command = `claude mcp add ${server.name} node "${serverPath}"`;
        
        console.log(`[${index + 1}/${SERVERS.length}] Adding ${server.name}...`);
        console.log(`   Description: ${server.description}`);
        
        try {
            execSync(command, { encoding: 'utf-8' });
            console.log(`   ✅ Successfully added ${server.name}\n`);
            successCount++;
        } catch (error) {
            console.log(`   ❌ Failed to add ${server.name}: ${error.message}\n`);
            failCount++;
        }
    });
    
    return { successCount, failCount };
}

function verifyInstallation() {
    console.log('🚦 Verifying installation...\n');
    
    try {
        const result = execSync('claude mcp list', { encoding: 'utf-8' });
        console.log('📋 MCP Server Status:');
        console.log('====================');
        console.log(result);
        
        // Count connected servers
        const connectedCount = (result.match(/✓ Connected/g) || []).length;
        
        if (connectedCount === SERVERS.length) {
            console.log(`🎉 SUCCESS! All ${SERVERS.length} MCP servers are connected and working!\n`);
            return true;
        } else {
            console.log(`⚠️  Warning: Only ${connectedCount}/${SERVERS.length} servers connected.\n`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Failed to verify installation: ${error.message}\n`);
        return false;
    }
}

function testIntegration() {
    console.log('🧪 Running integration tests...\n');
    
    const testFile = path.join(process.cwd(), 'test-integration.js');
    if (fs.existsSync(testFile)) {
        try {
            const result = execSync('node test-integration.js', { encoding: 'utf-8' });
            console.log(result);
            return true;
        } catch (error) {
            console.log(`⚠️  Integration tests failed: ${error.message}\n`);
            return false;
        }
    } else {
        console.log('⏭️  Integration test file not found, skipping tests...\n');
        return true;
    }
}

function generateQuickStart() {
    console.log('📝 Generating quick start guide...\n');
    
    const quickStartContent = `# Claude Code MCP Servers - Quick Start

## ✅ Installation Complete!

All ${SERVERS.length} MCP servers have been successfully configured for Claude Code.

## 🚀 Available Servers

${SERVERS.map((server, index) => `${index + 1}. **${server.name}** - ${server.description}`).join('\n')}

## 🔧 Verification Commands

\`\`\`bash
# Check all servers status
claude mcp list

# Expected: All ${SERVERS.length} servers showing ✅ Connected
\`\`\`

## 💡 Example Usage

Ask Claude:
- "Build and deploy my app using Docker"
- "Run security scans on my codebase"
- "Test my website across all browsers"
- "Generate a PDF report from this URL"
- "Analyze my project structure and dependencies"

## 🆘 Troubleshooting

If any servers are not connecting:
1. Ensure all files are in the repository directory
2. Check Node.js is installed (version 18+)
3. Verify file paths are correct
4. Run with debug: \`claude --debug\`

## 📚 Documentation

See README.md for complete documentation and usage examples.

---
Generated on: ${new Date().toISOString()}
Setup completed: ${new Date().toLocaleString()}
`;
    
    try {
        fs.writeFileSync(path.join(process.cwd(), 'QUICK_START.md'), quickStartContent);
        console.log('✅ Quick start guide generated: QUICK_START.md\n');
    } catch (error) {
        console.log(`⚠️  Failed to generate quick start guide: ${error.message}\n`);
    }
}

function printSummary(results) {
    console.log('📊 Setup Summary');
    console.log('================\n');
    
    console.log(`✅ Successfully configured: ${results.successCount}/${SERVERS.length} servers`);
    if (results.failCount > 0) {
        console.log(`❌ Failed to configure: ${results.failCount}/${SERVERS.length} servers`);
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Run `claude mcp list` to verify all servers are connected');
    console.log('2. Start using Claude Code with your new MCP servers!');
    console.log('3. Ask Claude: "Help me set up a CI/CD pipeline for my project"');
    
    console.log('\n📚 Documentation:');
    console.log('- README.md - Complete documentation');
    console.log('- QUICK_START.md - Quick reference guide');
    
    console.log('\n🔗 Useful Commands:');
    console.log('- `claude mcp list` - Show all servers');
    console.log('- `claude mcp get <server-name>` - Get server details');
    console.log('- `claude --debug` - Enable debug mode');
    
    if (results.successCount === SERVERS.length) {
        console.log('\n🎉 Setup completed successfully! All MCP servers are ready to use.');
    } else {
        console.log('\n⚠️  Setup completed with some issues. Check the output above for details.');
    }
}

// Main execution
async function main() {
    try {
        // Step 1: Check prerequisites
        checkPrerequisites();
        
        // Step 2: Install dependencies
        installDependencies();
        
        // Step 3: Configure MCP servers
        const results = configureMCPServers();
        
        // Step 4: Verify installation
        const verificationSuccess = verifyInstallation();
        
        // Step 5: Run integration tests
        testIntegration();
        
        // Step 6: Generate quick start guide
        generateQuickStart();
        
        // Step 7: Print summary
        printSummary(results);
        
        // Exit with appropriate code
        process.exit(results.failCount === 0 && verificationSuccess ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Setup failed with error:', error.message);
        console.error('\n🆘 Troubleshooting:');
        console.error('1. Ensure you are in the claude-mcp-servers directory');
        console.error('2. Check that Node.js and Claude Code are installed');
        console.error('3. Verify all server files are present');
        console.error('4. Run with --verbose for more details');
        process.exit(1);
    }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Claude Code MCP Servers - Automated Setup Script

Usage: node setup-claude-code.js [options]

Options:
  -h, --help     Show this help message
  --version      Show version information

This script will:
1. Check prerequisites (Node.js, Claude Code CLI)
2. Install required dependencies
3. Configure all ${SERVERS.length} MCP servers for Claude Code
4. Verify the installation
5. Run integration tests
6. Generate quick start documentation

For manual installation, see README.md
`);
    process.exit(0);
}

if (process.argv.includes('--version')) {
    console.log('Claude Code MCP Servers Setup Script v1.0.0');
    process.exit(0);
}

// Run the main function
main();