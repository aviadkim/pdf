// Authentication API for Vercel Deployment
// Enterprise-grade authentication with edge computing

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { rateLimit } from '../middleware/rateLimit.js';
import { validateInput } from '../middleware/validation.js';
import { UserService } from '../services/UserService.js';
import { AuditService } from '../services/AuditService.js';
import { corsHeaders } from '../../lib/cors.js';

// Input validation schemas
const loginSchema = z.object({
  email: z.string().email().max(100),
  password: z.string().min(8).max(100)
});

const registerSchema = z.object({
  email: z.string().email().max(100),
  password: z.string().min(8).max(100),
  company: z.string().min(2).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50)
});

// Main auth handler
export default async function authHandler(req, res) {
  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const path = req.url.split('/api/auth/')[1].split('?')[0];

  try {
    switch (path) {
      case 'register':
        return await handleRegister(req, res);
      case 'login':
        return await handleLogin(req, res);
      case 'refresh':
        return await handleRefresh(req, res);
      case 'logout':
        return await handleLogout(req, res);
      case 'profile':
        return await handleProfile(req, res);
      case 'verify-email':
        return await handleEmailVerification(req, res);
      default:
        return res.status(404).json({ error: 'Auth endpoint not found' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication service error' });
  }
}

// Register new user
async function handleRegister(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const rateLimitResult = await rateLimit(req, 'auth', 5, 15 * 60 * 1000);
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Too many registration attempts',
      retryAfter: rateLimitResult.retryAfter
    });
  }

  // Validate input
  const validation = validateInput(req.body, registerSchema);
  if (!validation.success) {
    await AuditService.log({
      action: 'REGISTRATION_VALIDATION_FAILED',
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'],
      errors: validation.errors
    });
    
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors
    });
  }

  const { email, password, company, firstName, lastName } = validation.data;

  try {
    // Check if user exists
    const existingUser = await UserService.findByEmail(email);
    if (existingUser) {
      await AuditService.log({
        action: 'REGISTRATION_DUPLICATE_EMAIL',
        email,
        ip: getClientIP(req),
        status: 'FAILED'
      });

      return res.status(409).json({
        error: 'Account already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await UserService.create({
      email,
      password: hashedPassword,
      company,
      firstName,
      lastName,
      role: 'user',
      plan: 'starter',
      isActive: true,
      emailVerified: false,
      createdAt: new Date().toISOString()
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Log successful registration
    await AuditService.log({
      action: 'USER_REGISTERED',
      userId: user.id,
      email: user.email,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'],
      status: 'SUCCESS'
    });

    // Set secure cookie
    res.setHeader('Set-Cookie', [
      `refreshToken=${tokens.refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`
    ]);

    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        company: user.company,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        plan: user.plan
      },
      accessToken: tokens.accessToken,
      expiresIn: 900
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    await AuditService.log({
      action: 'REGISTRATION_ERROR',
      email,
      ip: getClientIP(req),
      error: error.message,
      status: 'ERROR'
    });

    return res.status(500).json({
      error: 'Registration failed'
    });
  }
}

// Login user
async function handleLogin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const rateLimitResult = await rateLimit(req, 'auth', 5, 15 * 60 * 1000);
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Too many login attempts',
      retryAfter: rateLimitResult.retryAfter
    });
  }

  // Validate input
  const validation = validateInput(req.body, loginSchema);
  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid input',
      details: validation.errors
    });
  }

  const { email, password } = validation.data;

  try {
    // Find user
    const user = await UserService.findByEmail(email);
    if (!user) {
      await AuditService.log({
        action: 'LOGIN_FAILED_USER_NOT_FOUND',
        email,
        ip: getClientIP(req),
        status: 'FAILED'
      });

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      await AuditService.log({
        action: 'LOGIN_FAILED_ACCOUNT_INACTIVE',
        userId: user.id,
        email,
        ip: getClientIP(req),
        status: 'FAILED'
      });

      return res.status(401).json({ error: 'Account has been deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await AuditService.log({
        action: 'LOGIN_FAILED_INVALID_PASSWORD',
        userId: user.id,
        email,
        ip: getClientIP(req),
        status: 'FAILED'
      });

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await UserService.updateLastLogin(user.id, getClientIP(req));

    // Generate tokens
    const tokens = generateTokens(user);

    // Log successful login
    await AuditService.log({
      action: 'USER_LOGGED_IN',
      userId: user.id,
      email: user.email,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'],
      status: 'SUCCESS'
    });

    // Set secure cookie
    res.setHeader('Set-Cookie', [
      `refreshToken=${tokens.refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`
    ]);

    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        company: user.company,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        plan: user.plan,
        lastLogin: new Date().toISOString()
      },
      accessToken: tokens.accessToken,
      expiresIn: 900
    });

  } catch (error) {
    console.error('Login error:', error);
    
    await AuditService.log({
      action: 'LOGIN_ERROR',
      email,
      ip: getClientIP(req),
      error: error.message,
      status: 'ERROR'
    });

    return res.status(500).json({ error: 'Login failed' });
  }
}

// Refresh token
async function handleRefresh(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const refreshToken = cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not provided' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await UserService.findById(decoded.id);

    if (!user || user.tokenVersion !== decoded.tokenVersion || !user.isActive) {
      res.setHeader('Set-Cookie', [
        'refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
      ]);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Set new refresh token
    res.setHeader('Set-Cookie', [
      `refreshToken=${tokens.refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`
    ]);

    await AuditService.log({
      action: 'TOKEN_REFRESHED',
      userId: user.id,
      ip: getClientIP(req),
      status: 'SUCCESS'
    });

    return res.json({
      accessToken: tokens.accessToken,
      expiresIn: 900
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    res.setHeader('Set-Cookie', [
      'refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
    ]);
    
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}

// Logout user
async function handleLogout(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const refreshToken = cookies.refreshToken;
    
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        await AuditService.log({
          action: 'USER_LOGGED_OUT',
          userId: decoded.id,
          ip: getClientIP(req),
          status: 'SUCCESS'
        });
      } catch (error) {
        // Token already invalid, continue with logout
      }
    }

    res.setHeader('Set-Cookie', [
      'refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
    ]);
    
    return res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    
    res.setHeader('Set-Cookie', [
      'refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
    ]);
    
    return res.status(500).json({ error: 'Error during logout' });
  }
}

// Get user profile
async function handleProfile(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error });
    }

    const user = await UserService.findById(authResult.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        company: user.company,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        plan: user.plan,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: 'Error retrieving profile' });
  }
}

// Email verification
async function handleEmailVerification(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Implementation for email verification
  return res.json({ message: 'Email verification endpoint' });
}

// Helper functions
function generateTokens(user) {
  const payload = {
    id: user.id,
    email: user.email,
    company: user.company,
    role: user.role,
    plan: user.plan
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '15m',
    issuer: 'phase3-platform',
    audience: 'phase3-users'
  });

  const refreshToken = jwt.sign(
    { id: user.id, tokenVersion: user.tokenVersion || 1 },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d',
      issuer: 'phase3-platform'
    }
  );

  return { accessToken, refreshToken };
}

function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         'unknown';
}

function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

// Authentication middleware for other APIs
export async function authenticateRequest(req) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return { success: false, error: 'Access token required' };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { success: true, user: decoded };

  } catch (error) {
    return { success: false, error: 'Invalid or expired token' };
  }
}