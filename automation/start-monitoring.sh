#!/bin/bash

# Start Claude Code monitoring service
echo "🤖 Starting Claude Code monitoring service..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Load environment variables
source automation/config/monitoring.env

# Start monitoring with logging
node automation/claude-code-monitor.js 2>&1 | tee automation/logs/monitor-$(date +%Y%m%d-%H%M%S).log

echo "✅ Monitoring service started"
