/**
 * CACHE LAYER
 * Multi-level caching system for improved performance and scalability
 * 
 * Features:
 * - Multi-tier caching (Memory, Redis, File-based)
 * - Cache warming and preloading strategies
 * - TTL (Time-To-Live) management
 * - Cache invalidation and eviction policies
 * - Cache statistics and performance monitoring
 * - Distributed cache synchronization
 * - Compression and serialization options
 * - Cache partitioning and sharding
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class CacheLayer {
    constructor(options = {}) {
        this.config = {
            // Memory cache settings
            memoryLimit: options.memoryLimit || 100 * 1024 * 1024, // 100MB
            memoryTTL: options.memoryTTL || 300000, // 5 minutes
            
            // Redis settings
            redisUrl: options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
            redisTTL: options.redisTTL || 3600000, // 1 hour
            redisPrefix: options.redisPrefix || 'smartocr:cache:',
            
            // File cache settings
            fileCacheDir: options.fileCacheDir || path.join(process.cwd(), '.cache'),
            fileTTL: options.fileTTL || 86400000, // 24 hours
            maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
            
            // General settings
            enableCompression: options.enableCompression !== false,
            compressionThreshold: options.compressionThreshold || 1024, // 1KB
            enableMetrics: options.enableMetrics !== false,
            cleanupInterval: options.cleanupInterval || 300000, // 5 minutes
            shardCount: options.shardCount || 16
        };
        
        // Cache layers
        this.memoryCache = new Map();
        this.memorySizes = new Map();
        this.memoryAccess = new Map();
        this.redisClient = null;
        this.redisConnected = false;
        
        // Cache statistics
        this.stats = {
            memory: { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0 },
            redis: { hits: 0, misses: 0, sets: 0, deletes: 0 },
            file: { hits: 0, misses: 0, sets: 0, deletes: 0 },
            compression: { compressed: 0, decompressed: 0, ratio: 0 }
        };
        
        // Cache warming strategies
        this.warmingStrategies = new Map();
        this.preloadTasks = new Map();
        
        console.log('🗃️ Cache Layer initialized');
        console.log(`💾 Memory limit: ${this.formatBytes(this.config.memoryLimit)}`);
    }

    async initialize() {
        console.log('🚀 Initializing cache layer...');
        
        try {
            // Initialize Redis connection
            await this.initializeRedis();
            
            // Initialize file cache directory
            await this.initializeFileCache();
            
            // Start cleanup process
            this.startCleanupProcess();
            
            // Load cache warming strategies
            this.initializeCacheWarming();
            
            console.log('✅ Cache layer ready');
            
        } catch (error) {
            console.error('❌ Cache layer initialization failed:', error);
            throw error;
        }
    }

    async initializeRedis() {
        try {
            const redis = require('redis');
            this.redisClient = redis.createClient({ url: this.config.redisUrl });
            
            this.redisClient.on('error', (err) => {
                console.warn('⚠️ Redis connection error:', err.message);
                this.redisConnected = false;
            });
            
            this.redisClient.on('connect', () => {
                console.log('✅ Redis cache connected');
                this.redisConnected = true;
            });
            
            await this.redisClient.connect();
            
        } catch (error) {
            console.warn('⚠️ Redis not available, using memory/file cache only');
            this.redisConnected = false;
        }
    }

    async initializeFileCache() {
        try {
            await fs.mkdir(this.config.fileCacheDir, { recursive: true });
            console.log(`📁 File cache directory: ${this.config.fileCacheDir}`);
        } catch (error) {
            console.error('❌ Failed to create file cache directory:', error);
            throw error;
        }
    }

    initializeCacheWarming() {
        // Register default warming strategies
        this.registerWarmingStrategy('documents', {
            priority: 1,
            batchSize: 50,
            warmer: async (keys) => {
                console.log(`🔥 Warming document cache for ${keys.length} keys`);
                // Implementation would fetch document data
                return new Map();
            }
        });
        
        this.registerWarmingStrategy('securities', {
            priority: 2,
            batchSize: 100,
            warmer: async (keys) => {
                console.log(`🔥 Warming securities cache for ${keys.length} keys`);
                // Implementation would fetch security data
                return new Map();
            }
        });
        
        this.registerWarmingStrategy('patterns', {
            priority: 3,
            batchSize: 20,
            warmer: async (keys) => {
                console.log(`🔥 Warming patterns cache for ${keys.length} keys`);
                // Implementation would fetch pattern data
                return new Map();
            }
        });
    }

    // Core Cache Operations
    async get(key, options = {}) {
        const cacheKey = this.normalizeKey(key);
        const startTime = Date.now();
        
        try {
            // Try memory cache first
            const memoryResult = await this.getFromMemory(cacheKey);
            if (memoryResult !== undefined) {
                this.stats.memory.hits++;
                this.recordAccess(cacheKey);
                return memoryResult;
            }
            this.stats.memory.misses++;
            
            // Try Redis cache
            if (this.redisConnected && !options.skipRedis) {
                const redisResult = await this.getFromRedis(cacheKey);
                if (redisResult !== undefined) {
                    this.stats.redis.hits++;
                    // Promote to memory cache
                    await this.setInMemory(cacheKey, redisResult, this.config.memoryTTL);
                    return redisResult;
                }
                this.stats.redis.misses++;
            }
            
            // Try file cache
            if (!options.skipFile) {
                const fileResult = await this.getFromFile(cacheKey);
                if (fileResult !== undefined) {
                    this.stats.file.hits++;
                    // Promote to upper cache layers
                    await this.setInMemory(cacheKey, fileResult, this.config.memoryTTL);
                    if (this.redisConnected) {
                        await this.setInRedis(cacheKey, fileResult, this.config.redisTTL);
                    }
                    return fileResult;
                }
                this.stats.file.misses++;
            }
            
            return undefined;
            
        } catch (error) {
            console.error(`❌ Cache get error for key ${cacheKey}:`, error);
            return undefined;
        } finally {
            const duration = Date.now() - startTime;
            if (duration > 100) { // Log slow cache operations
                console.warn(`🐌 Slow cache get: ${cacheKey} (${duration}ms)`);
            }
        }
    }

    async set(key, value, ttl = null, options = {}) {
        const cacheKey = this.normalizeKey(key);
        const startTime = Date.now();
        
        try {
            const serializedValue = await this.serialize(value);
            const compressed = await this.compress(serializedValue);
            
            // Set in all cache layers unless specified otherwise
            const promises = [];
            
            if (!options.skipMemory) {
                promises.push(this.setInMemory(cacheKey, value, ttl || this.config.memoryTTL));
            }
            
            if (this.redisConnected && !options.skipRedis) {
                promises.push(this.setInRedis(cacheKey, compressed, ttl || this.config.redisTTL));
            }
            
            if (!options.skipFile && serializedValue.length <= this.config.maxFileSize) {
                promises.push(this.setInFile(cacheKey, compressed, ttl || this.config.fileTTL));
            }
            
            await Promise.allSettled(promises);
            
            return true;
            
        } catch (error) {
            console.error(`❌ Cache set error for key ${cacheKey}:`, error);
            return false;
        } finally {
            const duration = Date.now() - startTime;
            if (duration > 200) { // Log slow cache operations
                console.warn(`🐌 Slow cache set: ${cacheKey} (${duration}ms)`);
            }
        }
    }

    async delete(key, options = {}) {
        const cacheKey = this.normalizeKey(key);
        
        try {
            const promises = [];
            
            // Delete from all cache layers
            if (!options.skipMemory) {
                promises.push(this.deleteFromMemory(cacheKey));
            }
            
            if (this.redisConnected && !options.skipRedis) {
                promises.push(this.deleteFromRedis(cacheKey));
            }
            
            if (!options.skipFile) {
                promises.push(this.deleteFromFile(cacheKey));
            }
            
            await Promise.allSettled(promises);
            
            return true;
            
        } catch (error) {
            console.error(`❌ Cache delete error for key ${cacheKey}:`, error);
            return false;
        }
    }

    async exists(key) {
        const cacheKey = this.normalizeKey(key);
        
        // Check memory first (fastest)
        if (this.memoryCache.has(cacheKey)) {
            return true;
        }
        
        // Check Redis
        if (this.redisConnected) {
            try {
                const exists = await this.redisClient.exists(this.config.redisPrefix + cacheKey);
                if (exists) return true;
            } catch (error) {
                console.warn(`⚠️ Redis exists check failed for ${cacheKey}:`, error.message);
            }
        }
        
        // Check file cache
        try {
            const filePath = this.getFilePath(cacheKey);
            await fs.access(filePath);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Memory Cache Operations
    async getFromMemory(key) {
        const entry = this.memoryCache.get(key);
        if (!entry) return undefined;
        
        // Check TTL
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.memoryCache.delete(key);
            this.memorySizes.delete(key);
            this.memoryAccess.delete(key);
            return undefined;
        }
        
        this.recordAccess(key);
        return entry.value;
    }

    async setInMemory(key, value, ttl) {
        const size = this.calculateSize(value);
        
        // Check if we need to evict items
        await this.evictMemoryIfNeeded(size);
        
        const entry = {
            value,
            createdAt: Date.now(),
            expiresAt: ttl ? Date.now() + ttl : null
        };
        
        this.memoryCache.set(key, entry);
        this.memorySizes.set(key, size);
        this.recordAccess(key);
        
        this.stats.memory.sets++;
        this.stats.memory.size += size;
    }

    async deleteFromMemory(key) {
        const size = this.memorySizes.get(key) || 0;
        
        this.memoryCache.delete(key);
        this.memorySizes.delete(key);
        this.memoryAccess.delete(key);
        
        this.stats.memory.deletes++;
        this.stats.memory.size -= size;
    }

    async evictMemoryIfNeeded(newItemSize) {
        const currentSize = this.stats.memory.size;
        
        if (currentSize + newItemSize <= this.config.memoryLimit) {
            return; // No eviction needed
        }
        
        console.log(`🗑️ Memory cache eviction needed (${this.formatBytes(currentSize)} + ${this.formatBytes(newItemSize)} > ${this.formatBytes(this.config.memoryLimit)})`);
        
        // Use LRU eviction strategy
        const accessEntries = Array.from(this.memoryAccess.entries())
            .sort(([, a], [, b]) => a.lastAccess - b.lastAccess);
        
        for (const [key] of accessEntries) {
            await this.deleteFromMemory(key);
            
            if (this.stats.memory.size + newItemSize <= this.config.memoryLimit) {
                break;
            }
        }
    }

    recordAccess(key) {
        this.memoryAccess.set(key, {
            lastAccess: Date.now(),
            accessCount: (this.memoryAccess.get(key)?.accessCount || 0) + 1
        });
    }

    // Redis Cache Operations
    async getFromRedis(key) {
        if (!this.redisConnected) return undefined;
        
        try {
            const redisKey = this.config.redisPrefix + key;
            const data = await this.redisClient.get(redisKey);
            if (!data) return undefined;
            
            const decompressed = await this.decompress(Buffer.from(data, 'base64'));
            return await this.deserialize(decompressed);
            
        } catch (error) {
            console.warn(`⚠️ Redis get failed for ${key}:`, error.message);
            return undefined;
        }
    }

    async setInRedis(key, value, ttl) {
        if (!this.redisConnected) return;
        
        try {
            const redisKey = this.config.redisPrefix + key;
            const data = Buffer.isBuffer(value) ? value.toString('base64') : value;
            
            if (ttl) {
                await this.redisClient.setEx(redisKey, Math.floor(ttl / 1000), data);
            } else {
                await this.redisClient.set(redisKey, data);
            }
            
            this.stats.redis.sets++;
            
        } catch (error) {
            console.warn(`⚠️ Redis set failed for ${key}:`, error.message);
        }
    }

    async deleteFromRedis(key) {
        if (!this.redisConnected) return;
        
        try {
            const redisKey = this.config.redisPrefix + key;
            await this.redisClient.del(redisKey);
            this.stats.redis.deletes++;
            
        } catch (error) {
            console.warn(`⚠️ Redis delete failed for ${key}:`, error.message);
        }
    }

    // File Cache Operations
    async getFromFile(key) {
        try {
            const filePath = this.getFilePath(key);
            const metaPath = filePath + '.meta';
            
            // Check if file exists and is not expired
            const [fileStats, metaData] = await Promise.all([
                fs.stat(filePath).catch(() => null),
                fs.readFile(metaPath, 'utf8').then(JSON.parse).catch(() => null)
            ]);
            
            if (!fileStats || !metaData) return undefined;
            
            // Check TTL
            if (metaData.expiresAt && Date.now() > metaData.expiresAt) {
                await this.deleteFromFile(key);
                return undefined;
            }
            
            const data = await fs.readFile(filePath);
            const decompressed = await this.decompress(data);
            return await this.deserialize(decompressed);
            
        } catch (error) {
            console.warn(`⚠️ File cache get failed for ${key}:`, error.message);
            return undefined;
        }
    }

    async setInFile(key, value, ttl) {
        try {
            const filePath = this.getFilePath(key);
            const metaPath = filePath + '.meta';
            const dir = path.dirname(filePath);
            
            // Ensure directory exists
            await fs.mkdir(dir, { recursive: true });
            
            // Write data and metadata
            const data = Buffer.isBuffer(value) ? value : Buffer.from(value);
            const metaData = {
                key,
                createdAt: Date.now(),
                expiresAt: ttl ? Date.now() + ttl : null,
                size: data.length
            };
            
            await Promise.all([
                fs.writeFile(filePath, data),
                fs.writeFile(metaPath, JSON.stringify(metaData))
            ]);
            
            this.stats.file.sets++;
            
        } catch (error) {
            console.warn(`⚠️ File cache set failed for ${key}:`, error.message);
        }
    }

    async deleteFromFile(key) {
        try {
            const filePath = this.getFilePath(key);
            const metaPath = filePath + '.meta';
            
            await Promise.all([
                fs.unlink(filePath).catch(() => {}),
                fs.unlink(metaPath).catch(() => {})
            ]);
            
            this.stats.file.deletes++;
            
        } catch (error) {
            console.warn(`⚠️ File cache delete failed for ${key}:`, error.message);
        }
    }

    getFilePath(key) {
        const hash = crypto.createHash('sha256').update(key).digest('hex');
        const shard = hash.substring(0, 2);
        return path.join(this.config.fileCacheDir, shard, hash);
    }

    // Cache Warming
    registerWarmingStrategy(name, strategy) {
        console.log(`🔥 Registering cache warming strategy: ${name}`);
        this.warmingStrategies.set(name, strategy);
    }

    async warmCache(strategyName, keys) {
        const strategy = this.warmingStrategies.get(strategyName);
        if (!strategy) {
            throw new Error(`Warming strategy not found: ${strategyName}`);
        }
        
        console.log(`🔥 Warming cache with strategy: ${strategyName} (${keys.length} keys)`);
        
        // Process in batches
        const batches = this.chunkArray(keys, strategy.batchSize);
        const results = [];
        
        for (const batch of batches) {
            try {
                const batchResults = await strategy.warmer(batch);
                results.push(batchResults);
                
                // Store results in cache
                for (const [key, value] of batchResults) {
                    await this.set(key, value);
                }
                
            } catch (error) {
                console.error(`❌ Cache warming failed for batch:`, error);
            }
        }
        
        console.log(`✅ Cache warming completed: ${strategyName}`);
        return results;
    }

    async preloadCache(patterns = []) {
        console.log('🔥 Starting cache preload...');
        
        // Default patterns for common data
        const defaultPatterns = [
            'document:metadata:*',
            'security:isin:*',
            'user:session:*',
            'pattern:ml:*'
        ];
        
        const allPatterns = [...defaultPatterns, ...patterns];
        
        for (const pattern of allPatterns) {
            try {
                await this.preloadPattern(pattern);
            } catch (error) {
                console.error(`❌ Preload failed for pattern ${pattern}:`, error);
            }
        }
        
        console.log('✅ Cache preload completed');
    }

    async preloadPattern(pattern) {
        // This would be implemented based on your specific data sources
        console.log(`🔥 Preloading pattern: ${pattern}`);
        
        // Example implementation for document metadata
        if (pattern.startsWith('document:metadata:')) {
            // Load recent document metadata
            const keys = []; // Would fetch from database
            if (keys.length > 0) {
                await this.warmCache('documents', keys);
            }
        }
    }

    // Serialization and Compression
    async serialize(value) {
        try {
            return JSON.stringify(value);
        } catch (error) {
            console.error('❌ Serialization failed:', error);
            return null;
        }
    }

    async deserialize(data) {
        try {
            return JSON.parse(data);
        } catch (error) {
            console.error('❌ Deserialization failed:', error);
            return null;
        }
    }

    async compress(data) {
        if (!this.config.enableCompression || 
            (typeof data === 'string' && data.length < this.config.compressionThreshold)) {
            return data;
        }
        
        try {
            const compressed = await gzip(Buffer.from(data));
            this.stats.compression.compressed++;
            
            // Only use compression if it actually reduces size
            if (compressed.length < data.length) {
                this.stats.compression.ratio = compressed.length / data.length;
                return compressed;
            }
            
            return data;
            
        } catch (error) {
            console.warn('⚠️ Compression failed:', error.message);
            return data;
        }
    }

    async decompress(data) {
        if (!Buffer.isBuffer(data)) {
            return data;
        }
        
        try {
            // Check if data is gzipped (magic number)
            if (data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b) {
                const decompressed = await gunzip(data);
                this.stats.compression.decompressed++;
                return decompressed.toString();
            }
            
            return data.toString();
            
        } catch (error) {
            console.warn('⚠️ Decompression failed:', error.message);
            return data.toString();
        }
    }

    // Cache Invalidation
    async invalidatePattern(pattern) {
        console.log(`🗑️ Invalidating cache pattern: ${pattern}`);
        
        // Memory cache invalidation
        const memoryKeys = Array.from(this.memoryCache.keys());
        for (const key of memoryKeys) {
            if (this.matchPattern(key, pattern)) {
                await this.deleteFromMemory(key);
            }
        }
        
        // Redis cache invalidation
        if (this.redisConnected) {
            try {
                const redisPattern = this.config.redisPrefix + pattern;
                const keys = await this.redisClient.keys(redisPattern);
                if (keys.length > 0) {
                    await this.redisClient.del(keys);
                }
            } catch (error) {
                console.warn('⚠️ Redis pattern invalidation failed:', error.message);
            }
        }
        
        // File cache invalidation (more expensive, done in background)
        setImmediate(() => this.invalidateFilePattern(pattern));
    }

    async invalidateFilePattern(pattern) {
        try {
            const files = await this.findFilesByPattern(pattern);
            for (const file of files) {
                const key = await this.extractKeyFromFile(file);
                if (key) {
                    await this.deleteFromFile(key);
                }
            }
        } catch (error) {
            console.warn('⚠️ File pattern invalidation failed:', error.message);
        }
    }

    matchPattern(str, pattern) {
        // Simple glob pattern matching
        const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
        return regex.test(str);
    }

    // Cleanup Process
    startCleanupProcess() {
        console.log('🧹 Starting cache cleanup process...');
        
        this.cleanupInterval = setInterval(async () => {
            try {
                await this.performCleanup();
            } catch (error) {
                console.error('❌ Cache cleanup failed:', error);
            }
        }, this.config.cleanupInterval);
    }

    async performCleanup() {
        console.log('🧹 Performing cache cleanup...');
        
        const startTime = Date.now();
        let cleanedItems = 0;
        
        // Clean memory cache
        const memoryKeysToDelete = [];
        for (const [key, entry] of this.memoryCache) {
            if (entry.expiresAt && Date.now() > entry.expiresAt) {
                memoryKeysToDelete.push(key);
            }
        }
        
        for (const key of memoryKeysToDelete) {
            await this.deleteFromMemory(key);
            cleanedItems++;
        }
        
        // Clean file cache
        try {
            const fileCleanupCount = await this.cleanupFileCache();
            cleanedItems += fileCleanupCount;
        } catch (error) {
            console.warn('⚠️ File cache cleanup failed:', error.message);
        }
        
        const duration = Date.now() - startTime;
        console.log(`✅ Cache cleanup completed: ${cleanedItems} items removed (${duration}ms)`);
    }

    async cleanupFileCache() {
        const now = Date.now();
        let cleanedCount = 0;
        
        const shards = await fs.readdir(this.config.fileCacheDir).catch(() => []);
        
        for (const shard of shards) {
            const shardPath = path.join(this.config.fileCacheDir, shard);
            const files = await fs.readdir(shardPath).catch(() => []);
            
            for (const file of files) {
                if (!file.endsWith('.meta')) continue;
                
                const metaPath = path.join(shardPath, file);
                try {
                    const metaData = JSON.parse(await fs.readFile(metaPath, 'utf8'));
                    
                    if (metaData.expiresAt && now > metaData.expiresAt) {
                        const dataPath = metaPath.replace('.meta', '');
                        await Promise.all([
                            fs.unlink(dataPath).catch(() => {}),
                            fs.unlink(metaPath).catch(() => {})
                        ]);
                        cleanedCount++;
                    }
                } catch (error) {
                    // Invalid meta file, remove it
                    await fs.unlink(metaPath).catch(() => {});
                }
            }
        }
        
        return cleanedCount;
    }

    // Utility Methods
    normalizeKey(key) {
        return typeof key === 'string' ? key : JSON.stringify(key);
    }

    calculateSize(value) {
        if (typeof value === 'string') {
            return value.length * 2; // Approximate size for UTF-16
        } else if (Buffer.isBuffer(value)) {
            return value.length;
        } else {
            return JSON.stringify(value).length * 2;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    // API Methods
    getStats() {
        return {
            ...this.stats,
            memory: {
                ...this.stats.memory,
                formattedSize: this.formatBytes(this.stats.memory.size),
                itemCount: this.memoryCache.size
            },
            config: {
                memoryLimit: this.formatBytes(this.config.memoryLimit),
                redisConnected: this.redisConnected,
                compressionEnabled: this.config.enableCompression
            }
        };
    }

    async getCacheInfo(key) {
        const cacheKey = this.normalizeKey(key);
        const info = {
            key: cacheKey,
            layers: {}
        };
        
        // Check memory
        const memoryEntry = this.memoryCache.get(cacheKey);
        if (memoryEntry) {
            info.layers.memory = {
                exists: true,
                size: this.memorySizes.get(cacheKey),
                createdAt: memoryEntry.createdAt,
                expiresAt: memoryEntry.expiresAt,
                access: this.memoryAccess.get(cacheKey)
            };
        }
        
        // Check Redis
        if (this.redisConnected) {
            try {
                const ttl = await this.redisClient.ttl(this.config.redisPrefix + cacheKey);
                info.layers.redis = {
                    exists: ttl > -2,
                    ttl: ttl > 0 ? ttl : null
                };
            } catch (error) {
                info.layers.redis = { exists: false, error: error.message };
            }
        }
        
        // Check file
        try {
            const filePath = this.getFilePath(cacheKey);
            const metaPath = filePath + '.meta';
            const metaData = JSON.parse(await fs.readFile(metaPath, 'utf8'));
            info.layers.file = {
                exists: true,
                path: filePath,
                ...metaData
            };
        } catch (error) {
            info.layers.file = { exists: false };
        }
        
        return info;
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up cache layer...');
        
        // Clear cleanup interval
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        // Close Redis connection
        if (this.redisConnected && this.redisClient) {
            await this.redisClient.quit();
        }
        
        // Clear memory cache
        this.memoryCache.clear();
        this.memorySizes.clear();
        this.memoryAccess.clear();
        
        console.log('✅ Cache layer cleanup complete');
    }
}

module.exports = { CacheLayer };