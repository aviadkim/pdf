# 🚀 Render Deployment Guide - MCP-Enhanced PDF Processor

Complete guide for deploying our MCP-enhanced PDF processor on Render.com with full Puppeteer/Playwright support.

## 🎯 Why Render?

✅ **No Bundle Size Limits** (vs Vercel's 250MB limit)  
✅ **Full Docker Support** (vs Vercel's serverless constraints)  
✅ **System Dependencies** (browser automation works!)  
✅ **Large PDF Support** (no 4.5MB upload limit)  
✅ **Cost Effective** ($25/month vs enterprise Vercel)  

## 📋 Deployment Steps

### 1. Create Render Account
1. Go to https://render.com
2. Sign up with GitHub account
3. Connect your repository

### 2. Deploy Web Service
1. Click "New +" → "Web Service"
2. Select your `pdf` repository
3. Configure:
   - **Name**: `mcp-pdf-processor`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile.render`
   - **Plan**: `Standard ($25/month)`
   - **Auto-Deploy**: `Yes`

### 3. Environment Variables
Set in Render dashboard:
```env
NODE_ENV=production
MCP_MODE=enhanced
PORT=10000
PLAYWRIGHT_BROWSERS_PATH=/app/.playwright
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
```

### 4. Optional: Add Redis Cache
1. Create new Redis service
2. Use free tier for caching
3. Connect to web service

## 🔧 Configuration Files

### Dockerfile.render
- Optimized for Render platform
- Installs all browser dependencies
- Supports Playwright and Puppeteer
- Python integration for enhanced processing

### render.yaml
- Infrastructure as code
- Automatic scaling configuration
- Redis integration
- Environment variables

## 🧪 Testing Your Deployment

### Quick Test
```bash
# Test basic API
curl https://your-app.onrender.com/api/test

# Test PDF extraction
curl -X POST https://your-app.onrender.com/api/real-pdf-extractor \
  -H "Content-Type: application/json" \
  -d '{"testMode": true}'

# Test MCP processor
curl -X POST https://your-app.onrender.com/api/mcp-enhanced-processor \
  -H "Content-Type: application/json" \
  -d '{"testMode": true}'
```

### Automated Testing
```bash
node test-render-deployment.js
```

## 📊 Expected Performance

### First Deployment
- **Build Time**: 5-8 minutes (installing browsers)
- **Cold Start**: 30-60 seconds (first request)
- **Memory Usage**: ~1GB (Standard plan: 2GB available)

### Steady State
- **Response Time**: 2-10 seconds (depending on PDF complexity)
- **Warm Requests**: <3 seconds
- **Browser Automation**: Full Puppeteer/Playwright support

## 🎯 API Endpoints

### Basic Endpoints
- `GET /` - Web interface
- `GET /api/test` - Health check
- `POST /api/test` - Extended testing

### PDF Processing
- `POST /api/real-pdf-extractor` - Real PDF extraction (no hardcoded values)
- `POST /api/mcp-enhanced-processor` - Full MCP pipeline with browser automation
- `POST /api/mcp/analyze_financial_pdf` - MCP financial analysis tool

### Request Format
```json
{
  "pdfBase64": "JVBERi0xLjQK...", // Base64 PDF data
  "filename": "document.pdf",      // Optional filename
  "testMode": true                 // Use built-in test PDF
}
```

### Response Format
```json
{
  "success": true,
  "extractedData": {
    "securities": [
      {
        "isin": "XS2530201644",
        "name": "TORONTO DOMINION BANK NOTES",
        "value": 199080,
        "currency": "USD",
        "confidence": 0.92
      }
    ],
    "totalValue": 399368,
    "confidence": 0.89
  },
  "mcpEnhanced": true,
  "playwrightUsed": true,
  "puppeteerUsed": true
}
```

## 🔍 Troubleshooting

### Common Issues

**Build Fails:**
- Check Dockerfile.render syntax
- Verify all dependencies in package.json
- Check Render build logs

**Browser Automation Fails:**
- Ensure PLAYWRIGHT_BROWSERS_PATH is set
- Check system dependencies in Dockerfile
- Verify memory allocation (Standard plan needed)

**PDF Processing Errors:**
- Check PDF file size (Render supports large files)
- Verify Base64 encoding
- Check application logs

### Debugging Commands
```bash
# Check browser installation
npx playwright install --dry-run

# Test PDF parsing
node -e "console.log(require('pdf-parse'))"

# Verify environment
printenv | grep -E "(NODE_ENV|MCP_MODE|PLAYWRIGHT)"
```

## 💰 Cost Analysis

### Render Standard Plan ($25/month)
- 2GB RAM, 1 CPU
- Unlimited bandwidth
- Custom domains
- SSL certificates
- Auto-scaling

### vs Vercel Pro ($20/month)
- ❌ 250MB bundle limit
- ❌ 4.5MB upload limit
- ❌ Limited browser automation
- ❌ Missing system dependencies

**Render provides better value for complex PDF processing!**

## 🚀 Next Steps

1. **Deploy to Render** following this guide
2. **Test with real PDFs** using the web interface
3. **Monitor performance** and adjust plan if needed
4. **Scale horizontally** if processing volume increases
5. **Add monitoring** and alerting for production use

## 📞 Support

- **Render Documentation**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Our Repository Issues**: GitHub Issues for PDF processor specific problems

---

**🎉 Congratulations! You now have a production-ready MCP-enhanced PDF processor with full browser automation capabilities!**