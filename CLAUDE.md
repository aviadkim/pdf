# PDF Processing System - Claude Configuration

## Project Overview
**pdf-main**: Advanced PDF processing system with Claude Vision integration
- **Tech Stack**: Node.js, Express.js, Puppeteer, Azure AI Vision, MCP
- **Main Purpose**: Extract data from PDFs using hybrid text/vision processing
- **Deployment**: Docker containers on Vercel, Render

## Key Commands
```bash
# Development
npm run dev          # Development server
npm run start        # Production server (express-server.js)
npm run mcp          # MCP server (mcp-server.js)

# Testing
npm run test         # Main test suite
npm run test:all     # Playwright tests with HTML report
npm run test:accuracy # Accuracy validation tests
npm run test:extraction # PDF extraction tests

# Build & Deploy
npm run build        # Vercel build
npm run build:render # Render build
```

## Architecture & Key Files
- `express-server.js` - Main Express server
- `api/` - API endpoints for different extraction methods
- `mcp-server.js` - Model Context Protocol server
- `Dockerfile*` - Multiple Docker configurations
- `package.json` - Dependencies and scripts

## Current Features
- PDF to image conversion with pdf2pic
- Azure AI Vision integration
- Claude Vision API processing
- Batch processing capabilities
- MCP server integration
- Playwright testing suite

## Development Patterns
- Prefer editing existing API endpoints over creating new ones
- Use existing Express.js patterns and middleware
- Follow existing error handling conventions
- Maintain Docker compatibility across environments
- Use MCP for external integrations

## Recent Work Context
- Docker optimization for Alpine Linux
- PDF processing capabilities enhancement
- Express server deployment fixes
- MCP integration improvements
- Testing infrastructure with Playwright

## Common Issues & Solutions
- **Build errors**: Check Docker configuration and dependencies
- **PDF processing**: Verify pdf2pic and Puppeteer setup
- **API errors**: Check Azure/Claude API credentials
- **Memory issues**: Use streaming for large PDFs