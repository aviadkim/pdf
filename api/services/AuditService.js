// Audit Service for Phase 3 PDF Platform
// Comprehensive logging and security monitoring

import { Database } from '../../lib/database.js';
import { v4 as uuidv4 } from 'uuid';

const AUDIT_PREFIX = 'audit:';
const AUDIT_USER_PREFIX = 'audit_user:';
const AUDIT_ACTION_PREFIX = 'audit_action:';
const AUDIT_COUNT = 'audit_count';

// Audit event severity levels
export const SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Security-relevant actions
const SECURITY_ACTIONS = [
  'USER_REGISTERED',
  'USER_LOGGED_IN',
  'LOGIN_FAILED',
  'TOKEN_REFRESHED',
  'USER_LOGGED_OUT',
  'PASSWORD_CHANGED',
  'EMAIL_CHANGED',
  'ACCOUNT_DEACTIVATED',
  'PERMISSION_DENIED',
  'SUSPICIOUS_ACTIVITY'
];

export class AuditService {
  // Log an audit event
  static async log(eventData) {
    try {
      const auditId = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Determine severity
      let severity = SEVERITY.LOW;
      if (eventData.status === 'FAILED' || eventData.status === 'ERROR') {
        severity = SEVERITY.MEDIUM;
      }
      if (SECURITY_ACTIONS.includes(eventData.action)) {
        severity = SEVERITY.HIGH;
      }
      if (eventData.action === 'SUSPICIOUS_ACTIVITY') {
        severity = SEVERITY.CRITICAL;
      }
      
      const auditRecord = {
        id: auditId,
        timestamp,
        action: eventData.action,
        status: eventData.status || 'SUCCESS',
        severity,
        userId: eventData.userId || null,
        email: eventData.email || null,
        ip: eventData.ip || null,
        userAgent: eventData.userAgent || null,
        resource: eventData.resource || null,
        details: eventData.details || {},
        error: eventData.error || null,
        sessionId: eventData.sessionId || null,
        requestId: eventData.requestId || null,
        metadata: {
          environment: process.env.VERCEL_ENV || 'development',
          region: process.env.VERCEL_REGION || 'unknown',
          service: 'phase3-pdf-platform'
        }
      };
      
      // Store main audit record
      const auditKey = AUDIT_PREFIX + auditId;
      await Database.set(auditKey, auditRecord, 86400 * 90); // 90 days retention
      
      // Create indexes for efficient querying
      if (eventData.userId) {
        const userAuditKey = AUDIT_USER_PREFIX + eventData.userId;
        await Database.hset(userAuditKey, auditId, timestamp);
        await Database.expire(userAuditKey, 86400 * 90);
      }
      
      const actionAuditKey = AUDIT_ACTION_PREFIX + eventData.action;
      await Database.hset(actionAuditKey, auditId, timestamp);
      await Database.expire(actionAuditKey, 86400 * 30); // 30 days for action queries
      
      // Increment audit count
      await Database.increment(AUDIT_COUNT);
      
      // Log to console for immediate visibility
      console.log(`[AUDIT] ${severity.toUpperCase()} - ${eventData.action}: ${eventData.status || 'SUCCESS'}`, {
        userId: eventData.userId,
        ip: eventData.ip,
        timestamp
      });
      
      // Check for suspicious activity patterns
      await this.checkSuspiciousActivity(eventData);
      
      return auditId;
      
    } catch (error) {
      console.error('Audit logging error:', error);
      // Fallback: log to console if database fails
      console.log('[AUDIT-FALLBACK]', eventData);
      return null;
    }
  }
  
  // Get audit records by user
  static async getByUser(userId, limit = 50) {
    try {
      const userAuditKey = AUDIT_USER_PREFIX + userId;
      const auditIds = await Database.hgetall(userAuditKey);
      
      // Sort by timestamp and limit
      const sortedIds = Object.entries(auditIds)
        .sort(([, a], [, b]) => new Date(b) - new Date(a))
        .slice(0, limit)
        .map(([id]) => id);
      
      const records = [];
      for (const auditId of sortedIds) {
        const auditKey = AUDIT_PREFIX + auditId;
        const record = await Database.get(auditKey);
        if (record) {
          records.push(record);
        }
      }
      
      return records;
      
    } catch (error) {
      console.error('Get audit by user error:', error);
      return [];
    }
  }
  
  // Get audit records by action
  static async getByAction(action, limit = 100) {
    try {
      const actionAuditKey = AUDIT_ACTION_PREFIX + action;
      const auditIds = await Database.hgetall(actionAuditKey);
      
      // Sort by timestamp and limit
      const sortedIds = Object.entries(auditIds)
        .sort(([, a], [, b]) => new Date(b) - new Date(a))
        .slice(0, limit)
        .map(([id]) => id);
      
      const records = [];
      for (const auditId of sortedIds) {
        const auditKey = AUDIT_PREFIX + auditId;
        const record = await Database.get(auditKey);
        if (record) {
          records.push(record);
        }
      }
      
      return records;
      
    } catch (error) {
      console.error('Get audit by action error:', error);
      return [];
    }
  }
  
  // Get recent security events
  static async getSecurityEvents(hours = 24, limit = 100) {
    try {
      const records = [];
      
      for (const action of SECURITY_ACTIONS) {
        const actionRecords = await this.getByAction(action, 20);
        records.push(...actionRecords);
      }
      
      // Filter by time window
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      const filteredRecords = records.filter(record => 
        new Date(record.timestamp) >= cutoff
      );
      
      // Sort by timestamp and limit
      return filteredRecords
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
        
    } catch (error) {
      console.error('Get security events error:', error);
      return [];
    }
  }
  
  // Check for suspicious activity patterns
  static async checkSuspiciousActivity(eventData) {
    try {
      const { action, ip, userId, email } = eventData;
      
      // Check for multiple failed login attempts
      if (action === 'LOGIN_FAILED' && ip) {
        const recentFailures = await this.countRecentEvents('LOGIN_FAILED', { ip }, 15); // 15 minutes
        
        if (recentFailures >= 5) {
          await this.log({
            action: 'SUSPICIOUS_ACTIVITY',
            details: {
              type: 'multiple_failed_logins',
              ip,
              email,
              count: recentFailures,
              threshold: 5
            },
            ip,
            email,
            status: 'DETECTED'
          });
        }
      }
      
      // Check for rapid registration attempts from same IP
      if (action === 'USER_REGISTERED' && ip) {
        const recentRegistrations = await this.countRecentEvents('USER_REGISTERED', { ip }, 60); // 1 hour
        
        if (recentRegistrations >= 3) {
          await this.log({
            action: 'SUSPICIOUS_ACTIVITY',
            details: {
              type: 'rapid_registrations',
              ip,
              count: recentRegistrations,
              threshold: 3
            },
            ip,
            status: 'DETECTED'
          });
        }
      }
      
      // Check for unusual access patterns
      if (userId && ['USER_LOGGED_IN', 'TOKEN_REFRESHED'].includes(action)) {
        const userEvents = await this.getByUser(userId, 10);
        const uniqueIPs = new Set(userEvents.map(e => e.ip).filter(Boolean));
        
        if (uniqueIPs.size >= 5) { // User accessing from 5+ different IPs recently
          await this.log({
            action: 'SUSPICIOUS_ACTIVITY',
            details: {
              type: 'multiple_ip_access',
              userId,
              uniqueIPs: uniqueIPs.size,
              threshold: 5
            },
            userId,
            ip,
            status: 'DETECTED'
          });
        }
      }
      
    } catch (error) {
      console.error('Suspicious activity check error:', error);
    }
  }
  
  // Count recent events matching criteria
  static async countRecentEvents(action, criteria, minutes) {
    try {
      const records = await this.getByAction(action, 100);
      const cutoff = new Date(Date.now() - minutes * 60 * 1000);
      
      return records.filter(record => {
        if (new Date(record.timestamp) < cutoff) return false;
        
        // Check if record matches criteria
        for (const [key, value] of Object.entries(criteria)) {
          if (record[key] !== value) return false;
        }
        
        return true;
      }).length;
      
    } catch (error) {
      console.error('Count recent events error:', error);
      return 0;
    }
  }
  
  // Get audit statistics
  static async getStats(hours = 24) {
    try {
      const totalAudits = await Database.get(AUDIT_COUNT) || 0;
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      // Get recent security events for analysis
      const securityEvents = await this.getSecurityEvents(hours, 1000);
      
      // Calculate statistics
      const eventsByAction = {};
      const eventsBySeverity = {};
      const eventsByStatus = {};
      const suspiciousEvents = [];
      
      securityEvents.forEach(event => {
        eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1;
        eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
        eventsByStatus[event.status] = (eventsByStatus[event.status] || 0) + 1;
        
        if (event.action === 'SUSPICIOUS_ACTIVITY') {
          suspiciousEvents.push(event);
        }
      });
      
      return {
        totalAudits,
        recentEvents: securityEvents.length,
        timeWindow: `${hours} hours`,
        eventsByAction,
        eventsBySeverity,
        eventsByStatus,
        suspiciousEvents: suspiciousEvents.length,
        suspiciousDetails: suspiciousEvents.slice(0, 10), // Latest 10
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Get audit stats error:', error);
      return {
        totalAudits: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // Health check
  static async healthCheck() {
    try {
      // Test audit logging
      const testAuditId = await this.log({
        action: 'HEALTH_CHECK',
        details: { test: true },
        status: 'SUCCESS'
      });
      
      // Verify the audit was stored
      const auditKey = AUDIT_PREFIX + testAuditId;
      const stored = await Database.get(auditKey);
      
      // Clean up test record
      if (stored) {
        await Database.delete(auditKey);
      }
      
      return {
        healthy: true,
        operations: ['log', 'get', 'delete'],
        testAuditId,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Audit service health check failed:', error);
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default AuditService;