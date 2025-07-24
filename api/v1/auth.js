// Authentication API for Phase 3 PDF Platform
// JWT-based authentication with enterprise security

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation middleware
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

const validateRegister = [
  ...validateLogin,
  body('company')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be 2-100 characters'),
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required'),
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required'),
];

// JWT token generation
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
    { id: user.id, tokenVersion: user.tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d',
      issuer: 'phase3-platform'
    }
  );

  return { accessToken, refreshToken };
}

// POST /api/v1/auth/register
router.post('/register', authLimiter, validateRegister, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, company, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      await AuditLog.create({
        action: 'REGISTRATION_ATTEMPTED',
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'FAILED',
        reason: 'Email already exists'
      });

      return res.status(409).json({
        error: 'Account already exists with this email'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      company,
      firstName,
      lastName,
      role: 'user',
      plan: 'starter',
      isActive: true,
      emailVerified: false
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Log successful registration
    await AuditLog.create({
      action: 'USER_REGISTERED',
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS'
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
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
      accessToken,
      expiresIn: 900 // 15 minutes
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    await AuditLog.create({
      action: 'REGISTRATION_ERROR',
      email: req.body?.email,
      ip: req.ip,
      error: error.message,
      status: 'ERROR'
    });

    res.status(500).json({
      error: 'Internal server error during registration'
    });
  }
});

// POST /api/v1/auth/login
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Invalid input',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      await AuditLog.create({
        action: 'LOGIN_ATTEMPTED',
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'FAILED',
        reason: 'User not found'
      });

      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      await AuditLog.create({
        action: 'LOGIN_ATTEMPTED',
        userId: user.id,
        email,
        ip: req.ip,
        status: 'FAILED',
        reason: 'Account deactivated'
      });

      return res.status(401).json({
        error: 'Account has been deactivated'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await AuditLog.create({
        action: 'LOGIN_ATTEMPTED',
        userId: user.id,
        email,
        ip: req.ip,
        status: 'FAILED',
        reason: 'Invalid password'
      });

      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await User.updateLastLogin(user.id, req.ip);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Log successful login
    await AuditLog.create({
      action: 'USER_LOGGED_IN',
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS'
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        company: user.company,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        plan: user.plan,
        lastLogin: new Date()
      },
      accessToken,
      expiresIn: 900
    });

  } catch (error) {
    console.error('Login error:', error);
    
    await AuditLog.create({
      action: 'LOGIN_ERROR',
      email: req.body?.email,
      ip: req.ip,
      error: error.message,
      status: 'ERROR'
    });

    res.status(500).json({
      error: 'Internal server error during login'
    });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token not provided'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      res.clearCookie('refreshToken');
      return res.status(401).json({
        error: 'Invalid refresh token'
      });
    }

    if (!user.isActive) {
      res.clearCookie('refreshToken');
      return res.status(401).json({
        error: 'Account deactivated'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Set new refresh token
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    await AuditLog.create({
      action: 'TOKEN_REFRESHED',
      userId: user.id,
      ip: req.ip,
      status: 'SUCCESS'
    });

    res.json({
      accessToken: tokens.accessToken,
      expiresIn: 900
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.clearCookie('refreshToken');
    
    res.status(401).json({
      error: 'Invalid refresh token'
    });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        await AuditLog.create({
          action: 'USER_LOGGED_OUT',
          userId: decoded.id,
          ip: req.ip,
          status: 'SUCCESS'
        });
      } catch (error) {
        // Token already invalid, continue with logout
      }
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.clearCookie('refreshToken');
    res.status(500).json({
      error: 'Error during logout'
    });
  }
});

// GET /api/v1/auth/profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
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
    res.status(500).json({
      error: 'Error retrieving profile'
    });
  }
});

// Authentication middleware
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({
        error: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  });
}

// Role-based authorization middleware
export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    next();
  };
}

export default router;