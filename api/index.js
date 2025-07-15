// Main API Router for Phase 3 PDF Platform
// Vercel Serverless Functions Entry Point

import { corsHeaders, handleCors } from '../lib/cors.js';
import { authenticateRequest } from '../lib/auth.js';
import { logRequest } from '../lib/logging.js';

// Main API handler for Vercel
export default async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return handleCors(req, res);
  }

  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    // Log request
    await logRequest(req);

    // Health check endpoint
    if (req.method === 'GET' && req.url === '/api/health') {
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Phase 3 PDF Platform',
        version: '3.0.0',
        environment: process.env.VERCEL_ENV || 'development'
      });
    }

    // Public API endpoints (no authentication required)
    if (path === '/api/test') {
      const { default: testHandler } = await import('./test.js');
      return testHandler(req, res);
    }

    if (path === '/api/public-extract') {
      const { default: publicExtractHandler } = await import('./public-extract.js');
      return publicExtractHandler(req, res);
    }

    // Route to appropriate handlers
    const path = req.url.split('?')[0];
    
    // Authentication routes
    if (path.startsWith('/api/auth/')) {
      const { default: authHandler } = await import('./auth/index.js');
      return authHandler(req, res);
    }

    // Document processing routes
    if (path.startsWith('/api/documents/')) {
      const { default: documentsHandler } = await import('./documents/index.js');
      return documentsHandler(req, res);
    }

    // MCP integration routes
    if (path.startsWith('/api/mcp/')) {
      const { default: mcpHandler } = await import('./mcp/index.js');
      return mcpHandler(req, res);
    }

    // Templates routes
    if (path.startsWith('/api/templates/')) {
      const { default: templatesHandler } = await import('./templates/index.js');
      return templatesHandler(req, res);
    }

    // Analytics routes
    if (path.startsWith('/api/analytics/')) {
      const { default: analyticsHandler } = await import('./analytics/index.js');
      return analyticsHandler(req, res);
    }

    // User management routes
    if (path.startsWith('/api/users/')) {
      const { default: usersHandler } = await import('./users/index.js');
      return usersHandler(req, res);
    }

    // Legacy compatibility - Phase 3 processor
    if (path === '/api/process') {
      const { default: phase3Handler } = await import('./phase3-processor.js');
      return phase3Handler(req, res);
    }

    // 404 for unknown routes
    return res.status(404).json({
      error: 'Endpoint not found',
      availableEndpoints: [
        'GET /api/health',
        'GET /api/test (public)',
        'POST /api/public-extract (public)',
        'POST /api/auth/*',
        'POST /api/documents/*',
        'POST /api/mcp/*',
        'GET /api/templates/*',
        'GET /api/analytics/*',
        'GET /api/users/*',
        'POST /api/process'
      ]
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  }
}