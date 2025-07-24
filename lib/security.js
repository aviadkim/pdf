// Security utilities for PDF extraction API
import crypto from 'crypto';

// Allowed domains for CORS - Configure for your production domain
const ALLOWED_ORIGINS = [
  'https://claude-pdf-vercel.vercel.app',
  'https://your-domain.vercel.app', // Replace with your actual domain
  'https://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'null' // Allow file:// protocols for local testing
];

// Security headers configuration
export function setSecurityHeaders(res, origin) {
  // Secure CORS
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Security headers
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

// Input validation for PDF files
export function validatePDFInput(buffer, filename) {
  const errors = [];
  
  // File size limit: 50MB
  if (buffer.length > 50 * 1024 * 1024) {
    errors.push('File too large (max 50MB)');
  }
  
  // PDF magic number validation
  if (!buffer.slice(0, 4).equals(Buffer.from('%PDF'))) {
    errors.push('Invalid PDF file format');
  }
  
  // Filename validation
  if (filename && !/^[a-zA-Z0-9\-_\.\s]+\.pdf$/i.test(filename)) {
    errors.push('Invalid filename format');
  }
  
  return errors;
}

// Sanitize output data
export function sanitizeOutput(data) {
  if (typeof data === 'string') {
    return data.replace(/<script/gi, '&lt;script')
                .replace(/javascript:/gi, 'javascript_:')
                .replace(/on\w+=/gi, 'on_event=');
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeOutput);
  }
  
  if (data && typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeOutput(value);
    }
    return sanitized;
  }
  
  return data;
}

// Generate content hash for caching
export function generateContentHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Secure error response
export function createErrorResponse(error, isDevelopment = false) {
  const baseResponse = {
    success: false,
    error: 'Processing failed',
    timestamp: new Date().toISOString()
  };
  
  if (isDevelopment) {
    baseResponse.details = error.message;
    baseResponse.type = error.constructor.name;
  }
  
  return baseResponse;
}

// Rate limiting store (in-memory for demo, use Redis in production)
const rateLimitStore = new Map();

export function checkRateLimit(ip, windowMs = 15 * 60 * 1000, maxRequests = 10) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }
  
  const requests = rateLimitStore.get(ip);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (validRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitStore.set(ip, validRequests);
  
  return true; // Request allowed
}