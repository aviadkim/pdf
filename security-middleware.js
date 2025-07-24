/**
 * SECURITY MIDDLEWARE
 * Comprehensive security middleware for Express.js applications
 * 
 * Features:
 * - Input validation and sanitization
 * - Rate limiting and DDoS protection
 * - CSRF protection
 * - XSS prevention
 * - SQL injection prevention
 * - File upload security
 * - Request/response logging and monitoring
 * - IP whitelisting/blacklisting
 * - Security headers management
 * - API key validation
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const xss = require('xss');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

class SecurityMiddleware {
    constructor(options = {}) {
        this.config = {
            // Rate limiting
            rateLimitWindowMs: options.rateLimitWindowMs || 15 * 60 * 1000, // 15 minutes
            rateLimitMax: options.rateLimitMax || 100, // 100 requests per window
            rateLimitSkipSuccessfulRequests: options.rateLimitSkipSuccessfulRequests || false,
            
            // CSRF protection
            enableCSRF: options.enableCSRF !== false,
            csrfSecret: options.csrfSecret || process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex'),
            
            // Input validation
            maxRequestSize: options.maxRequestSize || '10mb',
            allowedFileTypes: options.allowedFileTypes || ['.pdf', '.png', '.jpg', '.jpeg', '.xlsx', '.csv'],
            maxFileSize: options.maxFileSize || 50 * 1024 * 1024, // 50MB
            
            // Security headers
            contentSecurityPolicy: options.contentSecurityPolicy || {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"]
                }
            },
            
            // IP filtering
            enableIPFiltering: options.enableIPFiltering || false,
            allowedIPs: options.allowedIPs || [],
            blockedIPs: options.blockedIPs || [],
            
            // Logging
            enableSecurityLogging: options.enableSecurityLogging !== false,
            logSensitiveData: options.logSensitiveData || false,
            
            // API security
            requireAPIKey: options.requireAPIKey || false,
            apiKeyHeader: options.apiKeyHeader || 'X-API-Key',
            
            // Advanced protection
            enableHoneypot: options.enableHoneypot || false,
            detectBots: options.detectBots !== false,
            blockSuspiciousPatterns: options.blockSuspiciousPatterns !== false
        };
        
        this.rateLimiters = new Map();
        this.securityViolations = new Map();
        this.suspiciousIPs = new Set();
        this.apiKeys = new Set();
        this.securityLog = [];
        
        console.log('🛡️ Security Middleware initialized');
        console.log(`🔒 Rate limit: ${this.config.rateLimitMax} requests per ${this.config.rateLimitWindowMs / 60000} minutes`);
    }

    // Main security middleware function
    createSecurityMiddleware() {
        return [
            this.setupHelmet(),
            this.setupRateLimit(),
            this.setupInputValidation(),
            this.setupCSRFProtection(),
            this.setupIPFiltering(),
            this.setupRequestLogging(),
            this.setupFileUploadSecurity(),
            this.setupAPIKeyValidation(),
            this.setupAdvancedProtection()
        ].filter(Boolean);
    }

    // Helmet configuration for security headers
    setupHelmet() {
        return helmet({
            contentSecurityPolicy: this.config.contentSecurityPolicy,
            hsts: {
                maxAge: 31536000, // 1 year
                includeSubDomains: true,
                preload: true
            },
            noSniff: true,
            xssFilter: true,
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
            permittedCrossDomainPolicies: false,
            dnsPrefetchControl: true,
            frameguard: { action: 'deny' },
            hidePoweredBy: true
        });
    }

    // Rate limiting middleware
    setupRateLimit() {
        const limiter = rateLimit({
            windowMs: this.config.rateLimitWindowMs,
            max: this.config.rateLimitMax,
            skipSuccessfulRequests: this.config.rateLimitSkipSuccessfulRequests,
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: Math.ceil(this.config.rateLimitWindowMs / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res) => {
                this.logSecurityViolation(req, 'RATE_LIMIT_EXCEEDED', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    endpoint: req.path
                });
                
                res.status(429).json({
                    error: 'Rate limit exceeded',
                    retryAfter: Math.ceil(this.config.rateLimitWindowMs / 1000)
                });
            }
        });
        
        this.rateLimiters.set('default', limiter);
        return limiter;
    }

    // Create specialized rate limiters for different endpoints
    createAPIRateLimit(options = {}) {
        return rateLimit({
            windowMs: options.windowMs || 60 * 1000, // 1 minute
            max: options.max || 60,
            keyGenerator: (req) => {
                // Use API key if available, otherwise IP
                return req.headers[this.config.apiKeyHeader.toLowerCase()] || req.ip;
            },
            message: {
                error: 'API rate limit exceeded',
                retryAfter: Math.ceil((options.windowMs || 60000) / 1000)
            }
        });
    }

    createLoginRateLimit() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // 5 login attempts per window
            skipSuccessfulRequests: true,
            keyGenerator: (req) => {
                return req.body?.email || req.ip;
            },
            message: {
                error: 'Too many login attempts, please try again later'
            }
        });
    }

    // Input validation middleware
    setupInputValidation() {
        return (req, res, next) => {
            try {
                // Validate and sanitize common inputs
                if (req.body) {
                    req.body = this.sanitizeObject(req.body);
                }
                
                if (req.query) {
                    req.query = this.sanitizeObject(req.query);
                }
                
                if (req.params) {
                    req.params = this.sanitizeObject(req.params);
                }
                
                // Check for SQL injection patterns
                if (this.detectSQLInjection(req)) {
                    this.logSecurityViolation(req, 'SQL_INJECTION_ATTEMPT', {
                        body: this.config.logSensitiveData ? req.body : '[REDACTED]',
                        query: req.query
                    });
                    
                    return res.status(400).json({
                        error: 'Invalid request parameters'
                    });
                }
                
                // Check for XSS patterns
                if (this.detectXSS(req)) {
                    this.logSecurityViolation(req, 'XSS_ATTEMPT', {
                        body: this.config.logSensitiveData ? req.body : '[REDACTED]',
                        query: req.query
                    });
                    
                    return res.status(400).json({
                        error: 'Invalid request content'
                    });
                }
                
                next();
                
            } catch (error) {
                console.error('❌ Input validation error:', error);
                res.status(500).json({ error: 'Input validation failed' });
            }
        };
    }

    // Sanitize input objects
    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                // Remove XSS patterns and validate
                sanitized[key] = this.sanitizeString(value);
            } else if (typeof value === 'object') {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }

    sanitizeString(str) {
        if (typeof str !== 'string') return str;
        
        // Remove XSS patterns
        let sanitized = xss(str, {
            whiteList: {}, // No HTML tags allowed
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script', 'style']
        });
        
        // Additional sanitization
        sanitized = validator.escape(sanitized);
        
        return sanitized;
    }

    // CSRF protection
    setupCSRFProtection() {
        if (!this.config.enableCSRF) return null;
        
        return (req, res, next) => {
            // Skip CSRF for GET, HEAD, OPTIONS
            if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
                return next();
            }
            
            // Skip CSRF for API endpoints with valid API key
            if (req.headers[this.config.apiKeyHeader.toLowerCase()]) {
                return next();
            }
            
            const token = req.headers['x-csrf-token'] || req.body._csrf;
            
            if (!token) {
                this.logSecurityViolation(req, 'CSRF_TOKEN_MISSING');
                return res.status(403).json({ error: 'CSRF token required' });
            }
            
            if (!this.validateCSRFToken(token, req)) {
                this.logSecurityViolation(req, 'CSRF_TOKEN_INVALID');
                return res.status(403).json({ error: 'Invalid CSRF token' });
            }
            
            next();
        };
    }

    generateCSRFToken(req) {
        const sessionId = req.sessionID || req.ip;
        const timestamp = Date.now();
        const data = `${sessionId}:${timestamp}`;
        const hash = crypto.createHmac('sha256', this.config.csrfSecret)
            .update(data)
            .digest('hex');
        
        return Buffer.from(`${data}:${hash}`).toString('base64');
    }

    validateCSRFToken(token, req) {
        try {
            const decoded = Buffer.from(token, 'base64').toString();
            const [sessionId, timestamp, hash] = decoded.split(':');
            
            const expectedHash = crypto.createHmac('sha256', this.config.csrfSecret)
                .update(`${sessionId}:${timestamp}`)
                .digest('hex');
            
            if (hash !== expectedHash) return false;
            
            // Check if token is expired (24 hours)
            const tokenTime = parseInt(timestamp);
            const now = Date.now();
            if (now - tokenTime > 24 * 60 * 60 * 1000) return false;
            
            // Verify session matches
            const currentSessionId = req.sessionID || req.ip;
            return sessionId === currentSessionId;
            
        } catch (error) {
            return false;
        }
    }

    // IP filtering middleware
    setupIPFiltering() {
        if (!this.config.enableIPFiltering) return null;
        
        return (req, res, next) => {
            const clientIP = this.getClientIP(req);
            
            // Check if IP is blocked
            if (this.config.blockedIPs.includes(clientIP) || this.suspiciousIPs.has(clientIP)) {
                this.logSecurityViolation(req, 'BLOCKED_IP_ACCESS', { ip: clientIP });
                return res.status(403).json({ error: 'Access denied' });
            }
            
            // Check if IP is in allowlist (if allowlist is configured)
            if (this.config.allowedIPs.length > 0 && !this.config.allowedIPs.includes(clientIP)) {
                this.logSecurityViolation(req, 'UNAUTHORIZED_IP_ACCESS', { ip: clientIP });
                return res.status(403).json({ error: 'Access denied' });
            }
            
            next();
        };
    }

    // Request logging middleware
    setupRequestLogging() {
        if (!this.config.enableSecurityLogging) return null;
        
        return (req, res, next) => {
            const startTime = Date.now();
            const clientIP = this.getClientIP(req);
            
            // Log suspicious patterns
            if (this.config.blockSuspiciousPatterns && this.detectSuspiciousPatterns(req)) {
                this.logSecurityViolation(req, 'SUSPICIOUS_REQUEST_PATTERN', {
                    ip: clientIP,
                    userAgent: req.get('User-Agent'),
                    path: req.path,
                    method: req.method
                });
            }
            
            // Override res.end to log response
            const originalEnd = res.end;
            res.end = function(...args) {
                const duration = Date.now() - startTime;
                
                // Log security-relevant requests
                if (res.statusCode >= 400) {
                    console.log(`🛡️ Security log: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms) from ${clientIP}`);
                }
                
                originalEnd.apply(this, args);
            };
            
            next();
        };
    }

    // File upload security
    setupFileUploadSecurity() {
        const storage = multer.memoryStorage(); // Use memory storage for security scanning
        
        return multer({
            storage,
            limits: {
                fileSize: this.config.maxFileSize,
                files: 10, // Maximum 10 files per request
                fields: 20 // Maximum 20 form fields
            },
            fileFilter: (req, file, cb) => {
                try {
                    // Check file extension
                    const ext = path.extname(file.originalname).toLowerCase();
                    if (!this.config.allowedFileTypes.includes(ext)) {
                        this.logSecurityViolation(req, 'INVALID_FILE_TYPE', {
                            filename: file.originalname,
                            extension: ext
                        });
                        return cb(new Error(`File type ${ext} not allowed`));
                    }
                    
                    // Check MIME type
                    if (!this.validateMimeType(file.mimetype, ext)) {
                        this.logSecurityViolation(req, 'MIME_TYPE_MISMATCH', {
                            filename: file.originalname,
                            mimetype: file.mimetype,
                            extension: ext
                        });
                        return cb(new Error('MIME type does not match file extension'));
                    }
                    
                    cb(null, true);
                    
                } catch (error) {
                    cb(error);
                }
            }
        }).any(); // Accept any field name
    }

    // API key validation
    setupAPIKeyValidation() {
        if (!this.config.requireAPIKey) return null;
        
        return (req, res, next) => {
            const apiKey = req.headers[this.config.apiKeyHeader.toLowerCase()];
            
            if (!apiKey) {
                return res.status(401).json({ error: 'API key required' });
            }
            
            if (!this.validateAPIKey(apiKey)) {
                this.logSecurityViolation(req, 'INVALID_API_KEY', {
                    providedKey: apiKey.substring(0, 8) + '...'
                });
                return res.status(401).json({ error: 'Invalid API key' });
            }
            
            req.apiKey = apiKey;
            next();
        };
    }

    // Advanced protection patterns
    setupAdvancedProtection() {
        return (req, res, next) => {
            const clientIP = this.getClientIP(req);
            const userAgent = req.get('User-Agent') || '';
            
            // Bot detection
            if (this.config.detectBots && this.detectBot(req)) {
                this.logSecurityViolation(req, 'BOT_DETECTED', {
                    ip: clientIP,
                    userAgent
                });
                
                // Rate limit bots more aggressively
                this.addToSuspiciousIPs(clientIP);
            }
            
            // Honeypot detection
            if (this.config.enableHoneypot && req.body && req.body.honeypot) {
                this.logSecurityViolation(req, 'HONEYPOT_TRIGGERED', {
                    ip: clientIP,
                    honeypotValue: req.body.honeypot
                });
                
                // Silently reject honeypot submissions
                return res.status(200).json({ success: true });
            }
            
            // Directory traversal protection
            if (this.detectDirectoryTraversal(req)) {
                this.logSecurityViolation(req, 'DIRECTORY_TRAVERSAL_ATTEMPT', {
                    path: req.path,
                    query: req.query
                });
                
                return res.status(400).json({ error: 'Invalid path' });
            }
            
            next();
        };
    }

    // Validation methods
    detectSQLInjection(req) {
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
            /('|"|`|;|--|\/\*|\*\/)/,
            /(UNION\s+SELECT|ORDER\s+BY|GROUP\s+BY)/i,
            /(OR\s+1\s*=\s*1|AND\s+1\s*=\s*1)/i,
            /(0x[0-9A-Fa-f]+|CHAR\(|CONCAT\()/i
        ];
        
        const checkString = (str) => {
            if (typeof str !== 'string') return false;
            return sqlPatterns.some(pattern => pattern.test(str));
        };
        
        return this.checkObjectRecursively(req.body, checkString) ||
               this.checkObjectRecursively(req.query, checkString) ||
               this.checkObjectRecursively(req.params, checkString);
    }

    detectXSS(req) {
        const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe\b/gi,
            /<object\b/gi,
            /<embed\b/gi,
            /expression\s*\(/gi
        ];
        
        const checkString = (str) => {
            if (typeof str !== 'string') return false;
            return xssPatterns.some(pattern => pattern.test(str));
        };
        
        return this.checkObjectRecursively(req.body, checkString) ||
               this.checkObjectRecursively(req.query, checkString);
    }

    detectSuspiciousPatterns(req) {
        const suspiciousPatterns = [
            /\.\./,  // Directory traversal
            /\/etc\/passwd/i,
            /\/proc\/self\/environ/i,
            /cmd\.exe/i,
            /powershell/i,
            /base64_decode/i,
            /eval\(/i,
            /system\(/i
        ];
        
        const requestStr = `${req.path} ${req.get('User-Agent')} ${JSON.stringify(req.query)}`;
        return suspiciousPatterns.some(pattern => pattern.test(requestStr));
    }

    detectDirectoryTraversal(req) {
        const path = req.path + JSON.stringify(req.query);
        return /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\\|%252e%252e%252f/i.test(path);
    }

    detectBot(req) {
        const userAgent = req.get('User-Agent') || '';
        const botPatterns = [
            /bot|crawler|spider|scraper/i,
            /curl|wget|python|java|go-http/i,
            /postman|insomnia|httpie/i
        ];
        
        return botPatterns.some(pattern => pattern.test(userAgent));
    }

    validateMimeType(mimetype, extension) {
        const mimeTypeMap = {
            '.pdf': ['application/pdf'],
            '.png': ['image/png'],
            '.jpg': ['image/jpeg'],
            '.jpeg': ['image/jpeg'],
            '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            '.csv': ['text/csv', 'application/csv']
        };
        
        const allowedMimes = mimeTypeMap[extension];
        return allowedMimes && allowedMimes.includes(mimetype);
    }

    validateAPIKey(apiKey) {
        // In production, this would check against a database or cache
        return this.apiKeys.has(apiKey);
    }

    // Utility methods
    checkObjectRecursively(obj, checkFn) {
        if (!obj || typeof obj !== 'object') {
            return checkFn(obj);
        }
        
        if (Array.isArray(obj)) {
            return obj.some(item => this.checkObjectRecursively(item, checkFn));
        }
        
        return Object.values(obj).some(value => this.checkObjectRecursively(value, checkFn));
    }

    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0] ||
               req.headers['x-real-ip'] ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               req.ip ||
               'unknown';
    }

    addToSuspiciousIPs(ip) {
        this.suspiciousIPs.add(ip);
        
        // Remove from suspicious list after 1 hour
        setTimeout(() => {
            this.suspiciousIPs.delete(ip);
        }, 60 * 60 * 1000);
    }

    logSecurityViolation(req, type, details = {}) {
        const violation = {
            timestamp: new Date().toISOString(),
            type,
            ip: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
            details
        };
        
        this.securityLog.push(violation);
        
        // Keep only last 1000 security violations
        if (this.securityLog.length > 1000) {
            this.securityLog.shift();
        }
        
        // Count violations per IP
        const ip = violation.ip;
        const violations = this.securityViolations.get(ip) || [];
        violations.push({ type, timestamp: Date.now() });
        this.securityViolations.set(ip, violations);
        
        // Auto-block IPs with too many violations
        if (violations.length > 10) {
            this.addToSuspiciousIPs(ip);
        }
        
        console.warn(`🚨 Security violation: ${type} from ${ip} on ${req.method} ${req.path}`);
    }

    // Management methods
    addAPIKey(apiKey) {
        this.apiKeys.add(apiKey);
        console.log(`🔑 API key added: ${apiKey.substring(0, 8)}...`);
    }

    removeAPIKey(apiKey) {
        this.apiKeys.delete(apiKey);
        console.log(`🔑 API key removed: ${apiKey.substring(0, 8)}...`);
    }

    blockIP(ip) {
        this.config.blockedIPs.push(ip);
        this.addToSuspiciousIPs(ip);
        console.log(`🚫 IP blocked: ${ip}`);
    }

    unblockIP(ip) {
        const index = this.config.blockedIPs.indexOf(ip);
        if (index > -1) {
            this.config.blockedIPs.splice(index, 1);
        }
        this.suspiciousIPs.delete(ip);
        console.log(`✅ IP unblocked: ${ip}`);
    }

    getSecurityStats() {
        return {
            violations: {
                total: this.securityLog.length,
                recent: this.securityLog.filter(v => 
                    Date.now() - new Date(v.timestamp).getTime() < 24 * 60 * 60 * 1000
                ).length,
                byType: this.groupViolationsByType()
            },
            blockedIPs: this.config.blockedIPs.length,
            suspiciousIPs: this.suspiciousIPs.size,
            activeAPIKeys: this.apiKeys.size,
            rateLimiters: this.rateLimiters.size
        };
    }

    getSecurityLog(limit = 100) {
        return this.securityLog.slice(-limit);
    }

    groupViolationsByType() {
        const groups = {};
        for (const violation of this.securityLog) {
            groups[violation.type] = (groups[violation.type] || 0) + 1;
        }
        return groups;
    }

    // Cleanup
    cleanup() {
        console.log('🧹 Cleaning up security middleware...');
        
        // Clear old violations
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        for (const [ip, violations] of this.securityViolations.entries()) {
            const recentViolations = violations.filter(v => v.timestamp > oneDayAgo);
            if (recentViolations.length === 0) {
                this.securityViolations.delete(ip);
            } else {
                this.securityViolations.set(ip, recentViolations);
            }
        }
        
        // Clear old security log entries
        this.securityLog = this.securityLog.filter(v => 
            Date.now() - new Date(v.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000 // Keep 7 days
        );
        
        console.log('✅ Security middleware cleanup complete');
    }
}

module.exports = { SecurityMiddleware };