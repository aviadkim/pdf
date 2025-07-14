// Local test server for bulletproof processor
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import bulletproofProcessor from './api/bulletproof-processor.js';
import twoStageProcessor from './api/two-stage-processor.js';
import superClaudeYoloProcessor from './api/superclaude-yolo-ultimate.js';
import paddleFinancialProcessor from './api/paddle-financial-processor.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Local Multi-Processor Test Server',
    endpoints: [
      'POST /api/bulletproof-processor',
      'POST /api/two-stage-processor',
      'POST /api/superclaude-yolo-ultimate',
      'POST /api/paddle-financial-processor',
      'POST /test'
    ]
  });
});

// Bulletproof processor endpoint
app.post('/api/bulletproof-processor', async (req, res) => {
  console.log('🎯 Bulletproof processor request received');
  
  // Create mock Vercel request/response objects
  const mockReq = {
    method: 'POST',
    body: req.body
  };
  
  const mockRes = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader: function(name, value) {
      this.headers[name] = value;
    },
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    },
    end: function() {
      return this;
    }
  };
  
  try {
    await bulletproofProcessor(mockReq, mockRes);
    
    // Send the response
    res.status(mockRes.statusCode);
    Object.keys(mockRes.headers).forEach(key => {
      res.setHeader(key, mockRes.headers[key]);
    });
    res.json(mockRes.body);
    
  } catch (error) {
    console.error('❌ Bulletproof processor error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Two-stage processor endpoint
app.post('/api/two-stage-processor', async (req, res) => {
  console.log('🎯 Two-stage processor request received');
  
  // Create mock Vercel request/response objects
  const mockReq = {
    method: 'POST',
    body: req.body
  };
  
  const mockRes = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader: function(name, value) {
      this.headers[name] = value;
    },
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    },
    end: function() {
      return this;
    }
  };
  
  try {
    await twoStageProcessor(mockReq, mockRes);
    
    // Send the response
    res.status(mockRes.statusCode);
    Object.keys(mockRes.headers).forEach(key => {
      res.setHeader(key, mockRes.headers[key]);
    });
    res.json(mockRes.body);
    
  } catch (error) {
    console.error('❌ Two-stage processor error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Simple test endpoint
app.post('/test', async (req, res) => {
  const { pdfBase64, filename } = req.body;
  
  if (!pdfBase64) {
    return res.status(400).json({
      success: false,
      error: 'No PDF data provided'
    });
  }
  
  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  
  res.json({
    success: true,
    message: 'Test endpoint working',
    pdfSize: pdfBuffer.length,
    filename: filename
  });
});

// SuperClaude YOLO processor endpoint
app.post('/api/superclaude-yolo-ultimate', async (req, res) => {
  console.log('💀 SuperClaude YOLO processor request received');
  
  // Create mock Vercel request/response objects
  const mockReq = {
    method: 'POST',
    body: req.body
  };
  
  const mockRes = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader: function(name, value) {
      this.headers[name] = value;
    },
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    },
    end: function() {
      return this;
    }
  };
  
  try {
    await superClaudeYoloProcessor(mockReq, mockRes);
    
    // Send the response
    res.status(mockRes.statusCode);
    Object.keys(mockRes.headers).forEach(key => {
      res.setHeader(key, mockRes.headers[key]);
    });
    res.json(mockRes.body);
    
  } catch (error) {
    console.error('❌ SuperClaude YOLO processor error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Paddle Financial processor endpoint
app.post('/api/paddle-financial-processor', async (req, res) => {
  console.log('🏦 Paddle Financial processor request received');
  
  // Create mock Vercel request/response objects
  const mockReq = {
    method: 'POST',
    body: req.body
  };
  
  const mockRes = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader: function(name, value) {
      this.headers[name] = value;
    },
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    },
    end: function() {
      return this;
    }
  };
  
  try {
    await paddleFinancialProcessor(mockReq, mockRes);
    
    // Send the response
    res.status(mockRes.statusCode);
    Object.keys(mockRes.headers).forEach(key => {
      res.setHeader(key, mockRes.headers[key]);
    });
    res.json(mockRes.body);
    
  } catch (error) {
    console.error('❌ Paddle Financial processor error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local test server running on http://localhost:${PORT}`);
  console.log(`📊 Bulletproof processor endpoint: http://localhost:${PORT}/api/bulletproof-processor`);
  console.log(`🎯 Two-stage processor endpoint: http://localhost:${PORT}/api/two-stage-processor`);
  console.log(`💀 SuperClaude YOLO processor endpoint: http://localhost:${PORT}/api/superclaude-yolo-ultimate`);
  console.log(`🏦 Paddle Financial processor endpoint: http://localhost:${PORT}/api/paddle-financial-processor`);
});

export default app;