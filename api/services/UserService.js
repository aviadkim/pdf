// User Service for Phase 3 PDF Platform
// Handles all user-related database operations

import { Database } from '../../lib/database.js';
import { v4 as uuidv4 } from 'uuid';

const USER_PREFIX = 'user:';
const EMAIL_INDEX = 'email_index:';
const USER_COUNT = 'user_count';

export class UserService {
  // Create a new user
  static async create(userData) {
    try {
      const userId = uuidv4();
      const user = {
        id: userId,
        ...userData,
        tokenVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save user data
      const userKey = USER_PREFIX + userId;
      await Database.set(userKey, user);
      
      // Create email index
      const emailKey = EMAIL_INDEX + userData.email.toLowerCase();
      await Database.set(emailKey, userId);
      
      // Increment user count
      await Database.increment(USER_COUNT);
      
      console.log(`User created: ${userData.email} (${userId})`);
      return user;
      
    } catch (error) {
      console.error('User creation error:', error);
      throw new Error('Failed to create user');
    }
  }
  
  // Find user by ID
  static async findById(userId) {
    try {
      const userKey = USER_PREFIX + userId;
      return await Database.get(userKey);
    } catch (error) {
      console.error('Find user by ID error:', error);
      return null;
    }
  }
  
  // Find user by email
  static async findByEmail(email) {
    try {
      const emailKey = EMAIL_INDEX + email.toLowerCase();
      const userId = await Database.get(emailKey);
      
      if (!userId) {
        return null;
      }
      
      return await this.findById(userId);
    } catch (error) {
      console.error('Find user by email error:', error);
      return null;
    }
  }
  
  // Update user
  static async update(userId, updates) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      const updatedUser = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // If email is being updated, update the index
      if (updates.email && updates.email !== user.email) {
        // Remove old email index
        const oldEmailKey = EMAIL_INDEX + user.email.toLowerCase();
        await Database.delete(oldEmailKey);
        
        // Create new email index
        const newEmailKey = EMAIL_INDEX + updates.email.toLowerCase();
        await Database.set(newEmailKey, userId);
      }
      
      const userKey = USER_PREFIX + userId;
      await Database.set(userKey, updatedUser);
      
      console.log(`User updated: ${userId}`);
      return updatedUser;
      
    } catch (error) {
      console.error('User update error:', error);
      throw error;
    }
  }
  
  // Update last login
  static async updateLastLogin(userId, ipAddress) {
    try {
      const updates = {
        lastLogin: new Date().toISOString(),
        lastLoginIP: ipAddress
      };
      
      return await this.update(userId, updates);
    } catch (error) {
      console.error('Update last login error:', error);
      throw error;
    }
  }
  
  // Update token version (for logout/security)
  static async incrementTokenVersion(userId) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      const updates = {
        tokenVersion: (user.tokenVersion || 1) + 1
      };
      
      return await this.update(userId, updates);
    } catch (error) {
      console.error('Increment token version error:', error);
      throw error;
    }
  }
  
  // Deactivate user
  static async deactivate(userId) {
    try {
      const updates = {
        isActive: false,
        deactivatedAt: new Date().toISOString()
      };
      
      return await this.update(userId, updates);
    } catch (error) {
      console.error('User deactivation error:', error);
      throw error;
    }
  }
  
  // Reactivate user
  static async reactivate(userId) {
    try {
      const updates = {
        isActive: true,
        reactivatedAt: new Date().toISOString()
      };
      
      return await this.update(userId, updates);
    } catch (error) {
      console.error('User reactivation error:', error);
      throw error;
    }
  }
  
  // Verify email
  static async verifyEmail(userId) {
    try {
      const updates = {
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString()
      };
      
      return await this.update(userId, updates);
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }
  
  // Update plan
  static async updatePlan(userId, plan) {
    try {
      const updates = {
        plan,
        planUpdatedAt: new Date().toISOString()
      };
      
      return await this.update(userId, updates);
    } catch (error) {
      console.error('Plan update error:', error);
      throw error;
    }
  }
  
  // Delete user (GDPR compliance)
  static async delete(userId) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Remove user data
      const userKey = USER_PREFIX + userId;
      await Database.delete(userKey);
      
      // Remove email index
      const emailKey = EMAIL_INDEX + user.email.toLowerCase();
      await Database.delete(emailKey);
      
      console.log(`User deleted: ${userId}`);
      return true;
      
    } catch (error) {
      console.error('User deletion error:', error);
      throw error;
    }
  }
  
  // Get user statistics
  static async getStats() {
    try {
      const totalUsers = await Database.get(USER_COUNT) || 0;
      
      // Get recent users (approximate)
      const userKeys = await Database.findKeys(USER_PREFIX + '*');
      const recentUsers = [];
      
      // Sample some users to get stats
      const sampleSize = Math.min(userKeys.length, 100);
      for (let i = 0; i < sampleSize; i++) {
        const user = await Database.get(userKeys[i]);
        if (user && user.createdAt) {
          recentUsers.push(user);
        }
      }
      
      // Calculate statistics
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const newUsersLast24h = recentUsers.filter(u => 
        new Date(u.createdAt) >= last24h
      ).length;
      
      const newUsersLast7d = recentUsers.filter(u => 
        new Date(u.createdAt) >= last7d
      ).length;
      
      const activeUsers = recentUsers.filter(u => u.isActive).length;
      const verifiedUsers = recentUsers.filter(u => u.emailVerified).length;
      
      // Plan distribution
      const planDistribution = recentUsers.reduce((acc, user) => {
        acc[user.plan] = (acc[user.plan] || 0) + 1;
        return acc;
      }, {});
      
      return {
        totalUsers,
        newUsersLast24h,
        newUsersLast7d,
        activeUsers,
        verifiedUsers,
        planDistribution,
        sampleSize,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Get user stats error:', error);
      return {
        totalUsers: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // Health check
  static async healthCheck() {
    try {
      // Test basic operations
      const testUserId = 'health_check_' + Date.now();
      const testUser = {
        email: 'health@test.com',
        firstName: 'Health',
        lastName: 'Check',
        company: 'Test Company',
        role: 'user',
        plan: 'starter',
        isActive: true
      };
      
      // Test create
      await this.create({ ...testUser, email: testUserId + '@test.com' });
      
      // Test find by email
      const found = await this.findByEmail(testUserId + '@test.com');
      
      // Clean up
      if (found) {
        await this.delete(found.id);
      }
      
      return {
        healthy: true,
        operations: ['create', 'findByEmail', 'delete'],
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('User service health check failed:', error);
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default UserService;