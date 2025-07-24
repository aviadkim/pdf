#!/usr/bin/env node

// ☁️ VERCEL LOG FETCHER
// Fetches deployment and runtime logs from Vercel

import fs from 'fs';
import path from 'path';

class VercelLogFetcher {
  constructor() {
    this.vercelToken = process.env.VERCEL_TOKEN;
    this.projectId = process.env.VERCEL_PROJECT_ID || 'pdf-five-nu';
  }

  async fetchRecentLogs() {
    if (!this.vercelToken) {
      console.log('⚠️ VERCEL_TOKEN not set. Cannot fetch Vercel logs.');
      return [];
    }

    console.log('☁️ Fetching Vercel logs...');

    try {
      // Fetch deployment logs
      const deploymentLogs = await this.fetchDeploymentLogs();
      
      // Fetch function logs
      const functionLogs = await this.fetchFunctionLogs();
      
      // Save logs locally
      const allLogs = [...deploymentLogs, ...functionLogs];
      this.saveLogs(allLogs);
      
      return allLogs;
      
    } catch (error) {
      console.error('❌ Failed to fetch Vercel logs:', error.message);
      return [];
    }
  }

  async fetchDeploymentLogs() {
    const response = await fetch(`https://api.vercel.com/v6/deployments?projectId=${this.projectId}&limit=10`, {
      headers: {
        'Authorization': `Bearer ${this.vercelToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.status}`);
    }

    const data = await response.json();
    return data.deployments || [];
  }

  async fetchFunctionLogs() {
    // This would fetch function invocation logs
    // Implementation depends on Vercel's specific log API
    return [];
  }

  saveLogs(logs) {
    const logPath = path.join('automation/logs', `vercel-logs-${Date.now()}.json`);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
    console.log(`📁 Vercel logs saved: ${logPath}`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fetcher = new VercelLogFetcher();
  fetcher.fetchRecentLogs().catch(console.error);
}

export { VercelLogFetcher };
