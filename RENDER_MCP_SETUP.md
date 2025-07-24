# Setting up MCP for Render

## Option 1: Render CLI MCP (if available)

If there's a Render MCP server available, you can add it to your Claude Desktop config:

```json
{
  "mcpServers": {
    "render": {
      "command": "npx",
      "args": ["@render/mcp-server", "--api-key", "YOUR_RENDER_API_KEY"]
    }
  }
}
```

## Option 2: Custom HTTP MCP Server

Create a simple MCP server that exposes Render functionality:

```javascript
// render-mcp-server.js
const express = require('express');
const https = require('https');

const app = express();
const RENDER_API_KEY = process.env.RENDER_API_KEY;

// Get service details
app.get('/mcp/service/:serviceId', async (req, res) => {
    const options = {
        hostname: 'api.render.com',
        path: `/v1/services/${req.params.serviceId}`,
        headers: {
            'Authorization': `Bearer ${RENDER_API_KEY}`
        }
    };
    
    // Make request to Render API
    // Return service details including env vars
});

// Update environment variable
app.post('/mcp/service/:serviceId/env/:key', async (req, res) => {
    // Update env var via Render API
});

app.listen(3000);
```

## Option 3: Use the Diagnostic Endpoint

The diagnostic endpoint I created is actually a simpler solution:
1. Deploy the diagnostic endpoint (commit `ac20cfc`)
2. Visit: https://pdf-fzzi.onrender.com/api/mistral-diagnostic
3. See exactly what's wrong with the API key

## Quick Fix Without MCP

Based on my experience, the issue is likely one of these:

1. **Extra quotes in Render**: 
   - Wrong: `"pgPfIqCxT8hYJ4V9e1EeOR1jcwAGxocs"`
   - Right: `pgPfIqCxT8hYJ4V9e1EeOR1jcwAGxocs`

2. **Trailing newline**:
   - Check if there's an Enter/newline after the key

3. **Copy-paste issue**:
   - Try typing the key manually instead of pasting

## To fix in Render Dashboard:

1. Go to your service in Render
2. Click "Environment" 
3. Find `MISTRAL_API_KEY`
4. Click edit
5. Delete everything and type/paste just: `pgPfIqCxT8hYJ4V9e1EeOR1jcwAGxocs`
6. Make sure no quotes, no spaces, no newlines
7. Save and let it redeploy