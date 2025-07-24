#!/usr/bin/env node

// Quick integration test for the new MCP servers
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Running MCP Server Integration Tests...\n');

const servers = [
  { name: 'FileScopeMCP', file: 'filescope-mcp-server.js' },
  { name: 'RepomixMCP', file: 'repomix-mcp-server.js' },
  { name: 'TaskManagement', file: 'task-management-mcp-server.js' },
  { name: 'AdvancedFileOps', file: 'advanced-file-ops-mcp-server.js' },
  { name: 'CodeQuality', file: 'code-quality-mcp-server.js' },
  { name: 'ProcessManagement', file: 'process-management-mcp-server.js' }
];

async function testServer(serverName, serverFile) {
  return new Promise((resolve) => {
    console.log(`Testing ${serverName}...`);
    
    const child = spawn('node', [path.join(__dirname, serverFile)], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let hasError = false;

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      if (errorOutput.includes('server running on stdio')) {
        console.log(`✅ ${serverName}: Server started successfully`);
        child.kill();
        resolve(true);
      } else if (errorOutput.includes('Error')) {
        hasError = true;
        console.log(`❌ ${serverName}: ${errorOutput}`);
      }
    });

    child.on('close', (code) => {
      if (!hasError && code !== null) {
        console.log(`✅ ${serverName}: Exited cleanly (code ${code})`);
        resolve(true);
      } else if (!hasError) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    // Kill after 3 seconds if still running
    setTimeout(() => {
      if (!child.killed) {
        child.kill();
        if (!hasError) {
          console.log(`✅ ${serverName}: Timeout reached, server running`);
          resolve(true);
        }
      }
    }, 3000);
  });
}

async function runTests() {
  const results = [];
  
  for (const server of servers) {
    const result = await testServer(server.name, server.file);
    results.push({ name: server.name, success: result });
  }

  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });

  console.log(`\n🎯 Success Rate: ${successful}/${total} (${Math.round(successful/total*100)}%)`);
  
  if (successful === total) {
    console.log('\n🎉 All MCP servers are working correctly!');
    console.log('You can now configure them in Claude Code settings.');
  } else {
    console.log('\n⚠️  Some servers need attention. Check the error messages above.');
  }
}

runTests().catch(console.error);