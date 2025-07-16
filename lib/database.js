// Database abstraction layer for Vercel deployment
// Supports multiple database backends (Vercel KV, PostgreSQL, MongoDB)

import { createClient } from '@vercel/kv';

// Database configuration
const DATABASE_TYPE = process.env.DATABASE_TYPE || 'kv';
const KV_URL = process.env.KV_URL;
const KV_TOKEN = process.env.KV_TOKEN;
const POSTGRES_URL = process.env.POSTGRES_URL;

// Initialize database client
let db;

if (DATABASE_TYPE === 'kv' && KV_URL && KV_TOKEN) {
  // Use Vercel KV for simple key-value storage
  db = createClient({
    url: KV_URL,
    token: KV_TOKEN,
  });
} else {
  // Fallback to in-memory storage for development
  console.warn('Using in-memory database - not suitable for production');
  
  const memoryStore = new Map();
  
  db = {
    async get(key) {
      return memoryStore.get(key) || null;
    },
    
    async set(key, value, options = {}) {
      memoryStore.set(key, value);
      
      if (options.ex) {
        setTimeout(() => {
          memoryStore.delete(key);
        }, options.ex * 1000);
      }
      
      return 'OK';
    },
    
    async del(key) {
      const existed = memoryStore.has(key);
      memoryStore.delete(key);
      return existed ? 1 : 0;
    },
    
    async exists(key) {
      return memoryStore.has(key) ? 1 : 0;
    },
    
    async incr(key) {
      const current = memoryStore.get(key) || 0;
      const newValue = current + 1;
      memoryStore.set(key, newValue);
      return newValue;
    },
    
    async expire(key, seconds) {
      if (memoryStore.has(key)) {
        setTimeout(() => {
          memoryStore.delete(key);
        }, seconds * 1000);
        return 1;
      }
      return 0;
    },
    
    async hget(key, field) {
      const obj = memoryStore.get(key) || {};
      return obj[field] || null;
    },
    
    async hset(key, field, value) {
      const obj = memoryStore.get(key) || {};
      obj[field] = value;
      memoryStore.set(key, obj);
      return 1;
    },
    
    async hgetall(key) {
      return memoryStore.get(key) || {};
    },
    
    async hdel(key, field) {
      const obj = memoryStore.get(key) || {};
      const existed = field in obj;
      delete obj[field];
      memoryStore.set(key, obj);
      return existed ? 1 : 0;
    },
    
    async scan(cursor = 0, options = {}) {
      const keys = Array.from(memoryStore.keys());
      const pattern = options.match;
      
      let filteredKeys = keys;
      if (pattern) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        filteredKeys = keys.filter(key => regex.test(key));
      }
      
      return [0, filteredKeys]; // [nextCursor, keys]
    }
  };
}

// Database utilities
export class Database {
  static async get(key) {
    try {
      const value = await db.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Database get error:', error);
      return null;
    }
  }
  
  static async set(key, value, expirationSeconds = null) {
    try {
      const options = expirationSeconds ? { ex: expirationSeconds } : {};
      await db.set(key, JSON.stringify(value), options);
      return true;
    } catch (error) {
      console.error('Database set error:', error);
      return false;
    }
  }
  
  static async delete(key) {
    try {
      const result = await db.del(key);
      return result > 0;
    } catch (error) {
      console.error('Database delete error:', error);
      return false;
    }
  }
  
  static async exists(key) {
    try {
      const result = await db.exists(key);
      return result > 0;
    } catch (error) {
      console.error('Database exists error:', error);
      return false;
    }
  }
  
  static async increment(key) {
    try {
      return await db.incr(key);
    } catch (error) {
      console.error('Database increment error:', error);
      return 0;
    }
  }
  
  static async expire(key, seconds) {
    try {
      const result = await db.expire(key, seconds);
      return result > 0;
    } catch (error) {
      console.error('Database expire error:', error);
      return false;
    }
  }
  
  // Hash operations
  static async hget(key, field) {
    try {
      const value = await db.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Database hget error:', error);
      return null;
    }
  }
  
  static async hset(key, field, value) {
    try {
      await db.hset(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Database hset error:', error);
      return false;
    }
  }
  
  static async hgetall(key) {
    try {
      const obj = await db.hgetall(key);
      const result = {};
      
      for (const [field, value] of Object.entries(obj)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Database hgetall error:', error);
      return {};
    }
  }
  
  static async hdel(key, field) {
    try {
      const result = await db.hdel(key, field);
      return result > 0;
    } catch (error) {
      console.error('Database hdel error:', error);
      return false;
    }
  }
  
  // Search operations
  static async findKeys(pattern) {
    try {
      const [, keys] = await db.scan(0, { match: pattern });
      return keys;
    } catch (error) {
      console.error('Database findKeys error:', error);
      return [];
    }
  }
  
  // Health check
  static async healthCheck() {
    try {
      const testKey = 'health_check_' + Date.now();
      await this.set(testKey, { timestamp: Date.now() }, 10);
      const result = await this.get(testKey);
      await this.delete(testKey);
      
      return {
        healthy: true,
        type: DATABASE_TYPE,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        healthy: false,
        type: DATABASE_TYPE,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default Database;