// Performance optimization utilities
import crypto from 'crypto';

// Response cache with TTL
class ResponseCache {
  constructor(maxSize = 100, ttlMs = 3600000) { // 1 hour TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key, data) {
    // Remove oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttlMs
    });
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Global cache instance
export const responseCache = new ResponseCache();

// Generate cache key from PDF content
export function generateCacheKey(pdfBuffer, method = 'default') {
  const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
  return `${method}-${hash.substring(0, 16)}`;
}

// Stream processing for large PDFs
export async function processLargePDF(pdfBuffer, processor, options = {}) {
  const {
    chunkSize = 10 * 1024 * 1024, // 10MB chunks
    maxMemory = 100 * 1024 * 1024 // 100MB max memory
  } = options;

  if (pdfBuffer.length <= chunkSize) {
    return await processor(pdfBuffer);
  }

  // For very large files, process in chunks
  const results = [];
  let offset = 0;

  while (offset < pdfBuffer.length) {
    const chunk = pdfBuffer.slice(offset, offset + chunkSize);
    
    try {
      const result = await processor(chunk);
      results.push(result);
    } catch (error) {
      console.error(`Chunk processing failed at offset ${offset}:`, error.message);
    }
    
    offset += chunkSize;
    
    // Force garbage collection if available
    if (global.gc && offset % (chunkSize * 3) === 0) {
      global.gc();
    }
  }

  return mergeChunkResults(results);
}

// Merge results from chunk processing
function mergeChunkResults(results) {
  const merged = {
    holdings: [],
    portfolioInfo: {},
    totalValue: 0
  };

  for (const result of results) {
    if (result.holdings) {
      merged.holdings.push(...result.holdings);
    }
    if (result.portfolioInfo) {
      Object.assign(merged.portfolioInfo, result.portfolioInfo);
    }
    if (result.totalValue) {
      merged.totalValue += result.totalValue;
    }
  }

  // Remove duplicates by ISIN
  const uniqueHoldings = new Map();
  for (const holding of merged.holdings) {
    if (holding.isin && !uniqueHoldings.has(holding.isin)) {
      uniqueHoldings.set(holding.isin, holding);
    }
  }
  
  merged.holdings = Array.from(uniqueHoldings.values());
  return merged;
}

// Parallel API processing
export async function parallelAPIExtraction(pdfData, methods) {
  const promises = methods.map(async (method) => {
    try {
      const result = await method.processor(pdfData);
      return {
        method: method.name,
        success: true,
        data: result,
        confidence: method.confidence || 80
      };
    } catch (error) {
      return {
        method: method.name,
        success: false,
        error: error.message,
        confidence: 0
      };
    }
  });

  const results = await Promise.allSettled(promises);
  
  // Return best result based on confidence and success
  const successfulResults = results
    .filter(result => result.status === 'fulfilled' && result.value.success)
    .map(result => result.value)
    .sort((a, b) => b.confidence - a.confidence);

  return successfulResults.length > 0 ? successfulResults[0] : {
    method: 'fallback',
    success: false,
    error: 'All extraction methods failed',
    confidence: 0
  };
}

// Memory monitoring
export function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
    timestamp: new Date().toISOString()
  };
}

// Performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  start(operationId) {
    this.metrics.set(operationId, {
      startTime: Date.now(),
      startMemory: getMemoryUsage()
    });
  }

  end(operationId) {
    const metric = this.metrics.get(operationId);
    if (!metric) return null;

    const endTime = Date.now();
    const endMemory = getMemoryUsage();
    
    const result = {
      operationId,
      duration: endTime - metric.startTime,
      memoryDelta: endMemory.heapUsed - metric.startMemory.heapUsed,
      startMemory: metric.startMemory,
      endMemory: endMemory
    };

    this.metrics.delete(operationId);
    return result;
  }

  getActiveOperations() {
    return Array.from(this.metrics.keys());
  }
}

// Global performance monitor
export const performanceMonitor = new PerformanceMonitor();

// Cleanup old cache entries periodically
setInterval(() => {
  // Force cache cleanup by accessing a non-existent key
  responseCache.get('__cleanup__');
}, 300000); // Every 5 minutes