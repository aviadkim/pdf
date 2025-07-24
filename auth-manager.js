/**
 * AUTHENTICATION MANAGER
 * Comprehensive authentication and authorization system
 * 
 * Features:
 * - JWT token-based authentication
 * - Role-based access control (RBAC)
 * - OAuth2 integration support
 * - Multi-factor authentication (MFA)
 * - Session management
 * - API key management
 * - Password policies and security
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class AuthManager {
    constructor(options = {}) {
        this.config = {
            jwtSecret: options.jwtSecret || process.env.JWT_SECRET || this.generateSecret(),
            jwtExpiry: options.jwtExpiry || '24h',
            refreshTokenExpiry: options.refreshTokenExpiry || '7d',
            bcryptRounds: options.bcryptRounds || 12,
            sessionTimeout: options.sessionTimeout || 3600000, // 1 hour
            maxLoginAttempts: options.maxLoginAttempts || 5,
            lockoutDuration: options.lockoutDuration || 900000, // 15 minutes
            passwordMinLength: options.passwordMinLength || 8,
            requireMFA: options.requireMFA || false,
            apiKeyLength: options.apiKeyLength || 32
        };
        
        this.sessions = new Map();
        this.loginAttempts = new Map();
        this.refreshTokens = new Map();
        this.apiKeys = new Map();
        this.mfaSecrets = new Map();
        
        console.log('🔐 Authentication Manager initialized');
        console.log(`🔑 JWT expiry: ${this.config.jwtExpiry}, MFA: ${this.config.requireMFA ? 'enabled' : 'disabled'}`);
    }

    async initialize(database) {
        console.log('🚀 Initializing authentication system...');
        
        try {
            this.db = database;
            
            // Initialize OAuth providers if configured
            await this.initializeOAuthProviders();
            
            // Load existing API keys
            await this.loadApiKeys();
            
            // Start session cleanup interval
            this.startSessionCleanup();
            
            console.log('✅ Authentication system ready');
            
        } catch (error) {
            console.error('❌ Authentication initialization failed:', error);
            throw error;
        }
    }

    // User Registration
    async registerUser(userData) {
        console.log('👤 Registering new user...');
        
        try {
            // Validate user data
            const validation = await this.validateUserData(userData);
            if (!validation.valid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Check if user exists
            const existingUser = await this.db.getUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }
            
            // Check username uniqueness
            const existingUsername = await this.db.models.User.findUnique({
                where: { username: userData.username }
            });
            if (existingUsername) {
                throw new Error('Username already taken');
            }
            
            // Hash password
            const hashedPassword = await this.hashPassword(userData.password);
            
            // Create user
            const user = await this.db.createUser({
                email: userData.email.toLowerCase(),
                username: userData.username,
                password: hashedPassword,
                role: userData.role || 'user',
                firstName: userData.firstName,
                lastName: userData.lastName,
                company: userData.company,
                department: userData.department,
                expertise: userData.expertise || []
            });
            
            // Generate MFA secret if required
            if (this.config.requireMFA || userData.enableMFA) {
                const mfaSecret = await this.generateMFASecret(user.id);
                user.mfaQRCode = await this.generateMFAQRCode(user.email, mfaSecret.base32);
            }
            
            // Create initial session
            const tokens = await this.createSession(user);
            
            console.log(`✅ User registered: ${user.email}`);
            
            return {
                user: this.sanitizeUser(user),
                tokens,
                requireMFA: this.config.requireMFA || userData.enableMFA
            };
            
        } catch (error) {
            console.error('❌ User registration failed:', error);
            throw error;
        }
    }

    // User Login
    async login(credentials) {
        console.log('🔑 User login attempt...');
        
        try {
            const { email, password, mfaCode } = credentials;
            
            // Check login attempts
            if (this.isLockedOut(email)) {
                throw new Error('Account temporarily locked due to multiple failed login attempts');
            }
            
            // Find user
            const user = await this.db.getUserByEmail(email.toLowerCase());
            if (!user) {
                this.recordFailedLogin(email);
                throw new Error('Invalid credentials');
            }
            
            // Verify password
            const validPassword = await this.verifyPassword(password, user.password);
            if (!validPassword) {
                this.recordFailedLogin(email);
                throw new Error('Invalid credentials');
            }
            
            // Check if user is active
            if (!user.active) {
                throw new Error('Account is deactivated');
            }
            
            // Verify MFA if enabled
            if (user.mfaEnabled || this.config.requireMFA) {
                if (!mfaCode) {
                    return {
                        requireMFA: true,
                        tempToken: this.generateTempToken(user.id)
                    };
                }
                
                const validMFA = await this.verifyMFACode(user.id, mfaCode);
                if (!validMFA) {
                    this.recordFailedLogin(email);
                    throw new Error('Invalid MFA code');
                }
            }
            
            // Clear failed login attempts
            this.loginAttempts.delete(email);
            
            // Update last login
            await this.db.updateUser(user.id, { lastLoginAt: new Date() });
            
            // Create session
            const tokens = await this.createSession(user);
            
            console.log(`✅ User logged in: ${user.email}`);
            
            return {
                user: this.sanitizeUser(user),
                tokens
            };
            
        } catch (error) {
            console.error('❌ Login failed:', error);
            throw error;
        }
    }

    // Create Session
    async createSession(user) {
        const sessionId = this.generateSessionId();
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        
        // Store session
        const session = {
            id: sessionId,
            userId: user.id,
            createdAt: new Date(),
            lastActivity: new Date(),
            userAgent: null, // Will be set from request
            ipAddress: null  // Will be set from request
        };
        
        this.sessions.set(sessionId, session);
        this.refreshTokens.set(refreshToken, {
            userId: user.id,
            sessionId,
            createdAt: new Date()
        });
        
        // Store in database
        if (this.db.models.UserSession) {
            await this.db.models.UserSession.create({
                userId: user.id,
                token: sessionId,
                expiresAt: new Date(Date.now() + this.config.sessionTimeout),
                ipAddress: session.ipAddress,
                userAgent: session.userAgent
            });
        }
        
        return {
            accessToken,
            refreshToken,
            expiresIn: this.config.jwtExpiry,
            tokenType: 'Bearer'
        };
    }

    // Token Generation
    generateAccessToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: this.getRolePermissions(user.role)
        };
        
        return jwt.sign(payload, this.config.jwtSecret, {
            expiresIn: this.config.jwtExpiry,
            issuer: 'smart-ocr-system',
            audience: 'smart-ocr-api'
        });
    }

    generateRefreshToken(user) {
        const token = crypto.randomBytes(32).toString('hex');
        return `${user.id}.${token}`;
    }

    generateTempToken(userId) {
        return jwt.sign({ userId, temp: true }, this.config.jwtSecret, {
            expiresIn: '5m'
        });
    }

    // Token Verification
    async verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, this.config.jwtSecret);
            
            // Check if session is still valid
            const user = await this.db.models.User.findUnique({
                where: { id: decoded.id }
            });
            
            if (!user || !user.active) {
                throw new Error('Invalid token');
            }
            
            return decoded;
            
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expired');
            }
            throw new Error('Invalid token');
        }
    }

    async refreshAccessToken(refreshToken) {
        const tokenData = this.refreshTokens.get(refreshToken);
        if (!tokenData) {
            throw new Error('Invalid refresh token');
        }
        
        const user = await this.db.models.User.findUnique({
            where: { id: tokenData.userId }
        });
        
        if (!user || !user.active) {
            throw new Error('Invalid refresh token');
        }
        
        // Generate new access token
        const accessToken = this.generateAccessToken(user);
        
        return {
            accessToken,
            expiresIn: this.config.jwtExpiry,
            tokenType: 'Bearer'
        };
    }

    // Logout
    async logout(sessionId, userId) {
        console.log(`🚪 User logout: ${userId}`);
        
        // Remove session
        this.sessions.delete(sessionId);
        
        // Remove refresh tokens
        for (const [token, data] of this.refreshTokens.entries()) {
            if (data.userId === userId && data.sessionId === sessionId) {
                this.refreshTokens.delete(token);
            }
        }
        
        // Remove from database
        if (this.db.models.UserSession) {
            await this.db.models.UserSession.deleteMany({
                where: { userId, token: sessionId }
            });
        }
        
        return { success: true };
    }

    // Password Management
    async hashPassword(password) {
        return await bcrypt.hash(password, this.config.bcryptRounds);
    }

    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    async changePassword(userId, oldPassword, newPassword) {
        const user = await this.db.models.User.findUnique({
            where: { id: userId }
        });
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // Verify old password
        const validPassword = await this.verifyPassword(oldPassword, user.password);
        if (!validPassword) {
            throw new Error('Invalid current password');
        }
        
        // Validate new password
        const validation = this.validatePassword(newPassword);
        if (!validation.valid) {
            throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Hash and update password
        const hashedPassword = await this.hashPassword(newPassword);
        await this.db.updateUser(userId, { password: hashedPassword });
        
        // Invalidate all sessions
        await this.invalidateUserSessions(userId);
        
        console.log(`✅ Password changed for user: ${userId}`);
        return { success: true };
    }

    async resetPassword(email, resetToken, newPassword) {
        // Verify reset token
        try {
            const decoded = jwt.verify(resetToken, this.config.jwtSecret);
            if (decoded.type !== 'password_reset' || decoded.email !== email) {
                throw new Error('Invalid reset token');
            }
        } catch (error) {
            throw new Error('Invalid or expired reset token');
        }
        
        // Find user
        const user = await this.db.getUserByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Validate new password
        const validation = this.validatePassword(newPassword);
        if (!validation.valid) {
            throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Update password
        const hashedPassword = await this.hashPassword(newPassword);
        await this.db.updateUser(user.id, { password: hashedPassword });
        
        console.log(`✅ Password reset for user: ${email}`);
        return { success: true };
    }

    generatePasswordResetToken(email) {
        return jwt.sign(
            { email, type: 'password_reset' },
            this.config.jwtSecret,
            { expiresIn: '1h' }
        );
    }

    // MFA Management
    async generateMFASecret(userId) {
        const secret = speakeasy.generateSecret({
            name: `Smart OCR (${userId})`,
            issuer: 'Smart OCR System'
        });
        
        this.mfaSecrets.set(userId, secret);
        
        // Store in database
        await this.db.updateUser(userId, {
            mfaSecret: secret.base32,
            mfaEnabled: false // Will be enabled after verification
        });
        
        return secret;
    }

    async generateMFAQRCode(email, secret) {
        const otpauth = speakeasy.otpauthURL({
            secret: secret,
            label: email,
            issuer: 'Smart OCR System',
            encoding: 'base32'
        });
        
        return await QRCode.toDataURL(otpauth);
    }

    async verifyMFACode(userId, code) {
        const user = await this.db.models.User.findUnique({
            where: { id: userId }
        });
        
        if (!user || !user.mfaSecret) {
            return false;
        }
        
        return speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: code,
            window: 2 // Allow 2 time windows for clock skew
        });
    }

    async enableMFA(userId, code) {
        const valid = await this.verifyMFACode(userId, code);
        if (!valid) {
            throw new Error('Invalid MFA code');
        }
        
        await this.db.updateUser(userId, { mfaEnabled: true });
        
        console.log(`✅ MFA enabled for user: ${userId}`);
        return { success: true };
    }

    async disableMFA(userId, password) {
        const user = await this.db.models.User.findUnique({
            where: { id: userId }
        });
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // Verify password
        const validPassword = await this.verifyPassword(password, user.password);
        if (!validPassword) {
            throw new Error('Invalid password');
        }
        
        await this.db.updateUser(userId, {
            mfaEnabled: false,
            mfaSecret: null
        });
        
        console.log(`✅ MFA disabled for user: ${userId}`);
        return { success: true };
    }

    // API Key Management
    async createApiKey(userId, name, permissions = ['read']) {
        console.log(`🔑 Creating API key for user: ${userId}`);
        
        const key = this.generateApiKey();
        const hashedKey = await this.hashApiKey(key);
        
        const apiKey = await this.db.models.ApiKey.create({
            userId,
            name,
            key: hashedKey,
            permissions,
            active: true
        });
        
        this.apiKeys.set(hashedKey, {
            id: apiKey.id,
            userId,
            permissions
        });
        
        console.log(`✅ API key created: ${name}`);
        
        // Return the unhashed key only once
        return {
            id: apiKey.id,
            name,
            key: key, // This is the only time the full key is shown
            permissions,
            createdAt: apiKey.createdAt
        };
    }

    async verifyApiKey(key) {
        const hashedKey = await this.hashApiKey(key);
        
        // Check cache first
        const cached = this.apiKeys.get(hashedKey);
        if (cached) {
            return cached;
        }
        
        // Check database
        const apiKey = await this.db.models.ApiKey.findUnique({
            where: { key: hashedKey }
        });
        
        if (!apiKey || !apiKey.active) {
            throw new Error('Invalid API key');
        }
        
        // Update last used
        await this.db.models.ApiKey.update({
            where: { id: apiKey.id },
            data: { lastUsedAt: new Date() }
        });
        
        // Cache the key
        this.apiKeys.set(hashedKey, {
            id: apiKey.id,
            userId: apiKey.userId,
            permissions: apiKey.permissions
        });
        
        return {
            userId: apiKey.userId,
            permissions: apiKey.permissions
        };
    }

    generateApiKey() {
        return `sk_${crypto.randomBytes(this.config.apiKeyLength).toString('hex')}`;
    }

    async hashApiKey(key) {
        return crypto.createHash('sha256').update(key).digest('hex');
    }

    // Role-Based Access Control
    getRolePermissions(role) {
        const permissions = {
            admin: ['read', 'write', 'delete', 'admin'],
            expert: ['read', 'write', 'annotate', 'validate'],
            user: ['read', 'write', 'annotate'],
            viewer: ['read']
        };
        
        return permissions[role] || permissions.user;
    }

    checkPermission(userPermissions, requiredPermission) {
        return userPermissions.includes(requiredPermission) || 
               userPermissions.includes('admin');
    }

    // OAuth Integration
    async initializeOAuthProviders() {
        // Initialize OAuth providers if configured
        this.oauthProviders = new Map();
        
        if (process.env.GOOGLE_CLIENT_ID) {
            this.oauthProviders.set('google', {
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                redirectUri: process.env.GOOGLE_REDIRECT_URI
            });
        }
        
        if (process.env.MICROSOFT_CLIENT_ID) {
            this.oauthProviders.set('microsoft', {
                clientId: process.env.MICROSOFT_CLIENT_ID,
                clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
                redirectUri: process.env.MICROSOFT_REDIRECT_URI
            });
        }
        
        console.log(`🔗 OAuth providers initialized: ${Array.from(this.oauthProviders.keys()).join(', ') || 'none'}`);
    }

    async authenticateOAuth(provider, code) {
        const providerConfig = this.oauthProviders.get(provider);
        if (!providerConfig) {
            throw new Error(`OAuth provider not configured: ${provider}`);
        }
        
        // Exchange code for tokens (provider-specific implementation)
        // This is a simplified example
        const tokens = await this.exchangeOAuthCode(provider, code, providerConfig);
        const profile = await this.getOAuthProfile(provider, tokens.accessToken);
        
        // Find or create user
        let user = await this.db.getUserByEmail(profile.email);
        if (!user) {
            user = await this.db.createUser({
                email: profile.email,
                username: profile.email.split('@')[0],
                password: crypto.randomBytes(32).toString('hex'), // Random password
                firstName: profile.firstName,
                lastName: profile.lastName,
                oauthProvider: provider,
                oauthId: profile.id
            });
        }
        
        // Create session
        const sessionTokens = await this.createSession(user);
        
        return {
            user: this.sanitizeUser(user),
            tokens: sessionTokens
        };
    }

    // Session Management
    startSessionCleanup() {
        setInterval(() => {
            const now = Date.now();
            
            // Clean up expired sessions
            for (const [sessionId, session] of this.sessions.entries()) {
                const lastActivity = session.lastActivity.getTime();
                if (now - lastActivity > this.config.sessionTimeout) {
                    this.sessions.delete(sessionId);
                }
            }
            
            // Clean up expired refresh tokens
            for (const [token, data] of this.refreshTokens.entries()) {
                const createdAt = data.createdAt.getTime();
                const expiryMs = 7 * 24 * 60 * 60 * 1000; // 7 days
                if (now - createdAt > expiryMs) {
                    this.refreshTokens.delete(token);
                }
            }
        }, 60000); // Run every minute
    }

    async invalidateUserSessions(userId) {
        // Remove all sessions for user
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.userId === userId) {
                this.sessions.delete(sessionId);
            }
        }
        
        // Remove all refresh tokens
        for (const [token, data] of this.refreshTokens.entries()) {
            if (data.userId === userId) {
                this.refreshTokens.delete(token);
            }
        }
        
        // Remove from database
        if (this.db.models.UserSession) {
            await this.db.models.UserSession.deleteMany({
                where: { userId }
            });
        }
    }

    // Validation Methods
    validatePassword(password) {
        const errors = [];
        
        if (password.length < this.config.passwordMinLength) {
            errors.push(`Password must be at least ${this.config.passwordMinLength} characters`);
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (!/[!@#$%^&*]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    async validateUserData(userData) {
        const errors = [];
        
        // Email validation
        if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
            errors.push('Invalid email address');
        }
        
        // Username validation
        if (!userData.username || userData.username.length < 3) {
            errors.push('Username must be at least 3 characters');
        }
        
        if (userData.username && !/^[a-zA-Z0-9_-]+$/.test(userData.username)) {
            errors.push('Username can only contain letters, numbers, underscores, and hyphens');
        }
        
        // Password validation
        if (userData.password) {
            const passwordValidation = this.validatePassword(userData.password);
            if (!passwordValidation.valid) {
                errors.push(...passwordValidation.errors);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Login Security
    recordFailedLogin(email) {
        const attempts = this.loginAttempts.get(email) || {
            count: 0,
            firstAttempt: Date.now(),
            lastAttempt: Date.now()
        };
        
        attempts.count++;
        attempts.lastAttempt = Date.now();
        
        this.loginAttempts.set(email, attempts);
    }

    isLockedOut(email) {
        const attempts = this.loginAttempts.get(email);
        if (!attempts) return false;
        
        if (attempts.count >= this.config.maxLoginAttempts) {
            const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
            if (timeSinceLastAttempt < this.config.lockoutDuration) {
                return true;
            } else {
                // Reset attempts after lockout duration
                this.loginAttempts.delete(email);
                return false;
            }
        }
        
        return false;
    }

    // Utility Methods
    generateSessionId() {
        return crypto.randomBytes(32).toString('hex');
    }

    generateSecret() {
        return crypto.randomBytes(64).toString('hex');
    }

    sanitizeUser(user) {
        const { password, mfaSecret, ...sanitized } = user;
        return sanitized;
    }

    async loadApiKeys() {
        try {
            if (this.db.models.ApiKey) {
                const apiKeys = await this.db.models.ApiKey.findMany({
                    where: { active: true }
                });
                
                for (const apiKey of apiKeys) {
                    this.apiKeys.set(apiKey.key, {
                        id: apiKey.id,
                        userId: apiKey.userId,
                        permissions: apiKey.permissions
                    });
                }
                
                console.log(`📋 Loaded ${apiKeys.length} active API keys`);
            }
        } catch (error) {
            console.warn('⚠️ Could not load API keys:', error.message);
        }
    }

    // Middleware
    authenticate() {
        return async (req, res, next) => {
            try {
                const token = this.extractToken(req);
                if (!token) {
                    return res.status(401).json({ error: 'No token provided' });
                }
                
                const decoded = await this.verifyAccessToken(token);
                req.user = decoded;
                next();
            } catch (error) {
                return res.status(401).json({ error: error.message });
            }
        };
    }

    authorize(requiredPermission) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            
            if (!this.checkPermission(req.user.permissions, requiredPermission)) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
            
            next();
        };
    }

    extractToken(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        
        return req.query.token || req.body.token;
    }
}

module.exports = { AuthManager };