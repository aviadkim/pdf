// MCP API Endpoints for Phase 3 Enterprise Platform
// Direct MCP server interaction endpoints

import { authenticateRequest } from '../auth/index.js';
import { AuditService } from '../services/AuditService.js';
import { corsHeaders } from '../../lib/cors.js';
import mcpIntegration from '../mcp-integration.js';

// Main MCP handler
export default async function mcpHandler(req, res) {
  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const path = req.url.split('/api/mcp/')[1].split('?')[0];

  try {
    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error });
    }

    const user = authResult.user;

    switch (path) {
      case 'health':
        return await handleHealth(req, res, user);
      case 'process':
        return await handleProcess(req, res, user);
      case 'fetch':
        return await handleFetch(req, res, user);
      case 'validate':
        return await handleValidate(req, res, user);
      case 'report':
        return await handleReport(req, res, user);
      case 'status':
        return await handleStatus(req, res, user);
      default:
        return res.status(404).json({ error: 'MCP endpoint not found' });
    }
  } catch (error) {
    console.error('MCP API error:', error);
    return res.status(500).json({ error: 'MCP service error' });
  }
}

// Health check endpoint
async function handleHealth(req, res, user) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const healthResult = await mcpIntegration.healthCheck();
    
    await AuditService.log({
      action: 'MCP_HEALTH_CHECK',
      userId: user.id,
      details: { endpoint: 'health' },
      ip: getClientIP(req),
      status: 'SUCCESS'
    });

    return res.json({
      success: true,
      mcp_health: healthResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('MCP health check error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Process PDF with MCP
async function handleProcess(req, res, user) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      filePath,
      processingMode = 'standard',
      extractType = 'all',
      institutionType = 'auto_detect',
      includeWebData = false
    } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }

    const startTime = Date.now();

    // Start MCP server
    await mcpIntegration.startMCPServer();

    // Process with MCP
    const result = await mcpIntegration.processWithMCP(filePath, {
      processingMode,
      extractType,
      institutionType,
      includeWebData
    });

    const processingTime = (Date.now() - startTime) / 1000;

    // Log MCP processing
    await AuditService.log({
      action: 'MCP_PDF_PROCESSING',
      userId: user.id,
      details: {
        filePath,
        processingMode,
        extractType,
        institutionType,
        includeWebData,
        processingTime,
        success: result.success
      },
      ip: getClientIP(req),
      status: result.success ? 'SUCCESS' : 'FAILED'
    });

    return res.json({
      success: result.success,
      processing_time: processingTime,
      mcp_enhanced: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('MCP process error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Fetch web content
async function handleFetch(req, res, user) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, contentType = 'market_data' } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const result = await mcpIntegration.fetchWebContent(url, contentType);

    // Log web fetch
    await AuditService.log({
      action: 'MCP_WEB_FETCH',
      userId: user.id,
      details: {
        url,
        contentType,
        success: result.success
      },
      ip: getClientIP(req),
      status: result.success ? 'SUCCESS' : 'FAILED'
    });

    return res.json({
      success: result.success,
      mcp_enhanced: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('MCP fetch error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Validate extraction accuracy
async function handleValidate(req, res, user) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { extractedData, threshold = 99.5 } = req.body;

    if (!extractedData) {
      return res.status(400).json({ error: 'Extracted data required' });
    }

    const result = await mcpIntegration.validateAccuracy(extractedData, threshold);

    // Log validation
    await AuditService.log({
      action: 'MCP_ACCURACY_VALIDATION',
      userId: user.id,
      details: {
        threshold,
        accuracy: result.accuracy,
        meets_threshold: result.meets_threshold
      },
      ip: getClientIP(req),
      status: 'SUCCESS'
    });

    return res.json({
      success: true,
      mcp_enhanced: true,
      validation: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('MCP validation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Generate enterprise report
async function handleReport(req, res, user) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, reportType = 'portfolio_summary' } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Data required for report generation' });
    }

    const result = await mcpIntegration.generateReport(data, reportType);

    // Log report generation
    await AuditService.log({
      action: 'MCP_REPORT_GENERATION',
      userId: user.id,
      details: {
        reportType,
        success: result.success
      },
      ip: getClientIP(req),
      status: result.success ? 'SUCCESS' : 'FAILED'
    });

    return res.json({
      success: result.success,
      mcp_enhanced: true,
      report: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('MCP report error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// MCP server status
async function handleStatus(req, res, user) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const status = {
      server_running: mcpIntegration.isServerRunning,
      server_info: {
        name: 'Phase 3 MCP Server',
        version: '1.0.0',
        capabilities: [
          'Universal PDF Processing',
          'Web Content Fetching',
          'Accuracy Validation',
          'Enterprise Reporting',
          'Real-time AI Integration'
        ]
      },
      integration_status: {
        enterprise_platform: 'Connected',
        phase3_core: 'Integrated',
        vercel_deployment: 'Ready'
      },
      performance: {
        target_accuracy: 99.5,
        processing_modes: ['demo', 'standard', 'full', 'aggressive'],
        supported_institutions: 'Universal'
      }
    };

    return res.json({
      success: true,
      mcp_status: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('MCP status error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Helper functions
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         'unknown';
}