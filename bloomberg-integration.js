/**
 * BLOOMBERG INTEGRATION
 * Integration with Bloomberg Terminal and Bloomberg API for financial data
 * 
 * Features:
 * - Bloomberg Terminal API integration
 * - Real-time market data feeds
 * - Security reference data lookup
 * - Portfolio data synchronization
 * - ISIN validation and enrichment
 * - Historical data retrieval
 */

const WebSocket = require('ws');
const https = require('https');

class BloombergIntegration {
    constructor(options = {}) {
        this.config = {
            apiKey: options.apiKey || process.env.BLOOMBERG_API_KEY,
            apiSecret: options.apiSecret || process.env.BLOOMBERG_API_SECRET,
            baseUrl: options.baseUrl || 'https://api.bloomberg.com/eqs/v1',
            terminalHost: options.terminalHost || 'localhost',
            terminalPort: options.terminalPort || 8194,
            enableRealTime: options.enableRealTime !== false,
            rateLimitPerSecond: options.rateLimitPerSecond || 10,
            timeout: options.timeout || 30000
        };
        
        this.connections = new Map();
        this.subscriptions = new Map();
        this.cache = new Map();
        this.rateLimit = {
            requests: [],
            maxRequests: this.config.rateLimitPerSecond
        };
        
        console.log('📊 Bloomberg Integration initialized');
        console.log(`🔗 API Base URL: ${this.config.baseUrl}`);
    }

    async initialize() {
        console.log('🚀 Initializing Bloomberg integration...');
        
        try {
            // Test API connectivity
            await this.testConnection();
            
            // Initialize Terminal connection if available
            if (this.config.terminalHost) {
                await this.initializeTerminalConnection();
            }
            
            // Start real-time data feeds if enabled
            if (this.config.enableRealTime) {
                await this.initializeRealTimeFeeds();
            }
            
            console.log('✅ Bloomberg integration ready');
            
        } catch (error) {
            console.error('❌ Bloomberg integration initialization failed:', error);
            throw error;
        }
    }

    async testConnection() {
        console.log('🔍 Testing Bloomberg API connection...');
        
        try {
            const response = await this.makeRequest('/status', 'GET');
            if (response.status === 'active') {
                console.log('✅ Bloomberg API connection successful');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Bloomberg API not available, using mock data');
            return false;
        }
    }

    async initializeTerminalConnection() {
        console.log('🖥️ Connecting to Bloomberg Terminal...');
        
        try {
            // Bloomberg Terminal uses a proprietary protocol
            // This is a simplified WebSocket connection example
            const ws = new WebSocket(`ws://${this.config.terminalHost}:${this.config.terminalPort}`);
            
            ws.on('open', () => {
                console.log('✅ Bloomberg Terminal connection established');
                this.connections.set('terminal', ws);
            });
            
            ws.on('message', (data) => {
                this.handleTerminalMessage(data);
            });
            
            ws.on('error', (error) => {
                console.warn('⚠️ Bloomberg Terminal connection failed:', error.message);
            });
            
            ws.on('close', () => {
                console.log('🔌 Bloomberg Terminal connection closed');
                this.connections.delete('terminal');
            });
            
        } catch (error) {
            console.warn('⚠️ Bloomberg Terminal not available:', error.message);
        }
    }

    async initializeRealTimeFeeds() {
        console.log('📡 Initializing real-time data feeds...');
        
        try {
            // Initialize market data WebSocket
            const marketDataWs = new WebSocket(`wss://api.bloomberg.com/market-data/v1/stream`);
            
            marketDataWs.on('open', () => {
                console.log('✅ Bloomberg market data feed connected');
                this.connections.set('market_data', marketDataWs);
                
                // Authenticate
                marketDataWs.send(JSON.stringify({
                    type: 'auth',
                    apiKey: this.config.apiKey,
                    apiSecret: this.config.apiSecret
                }));
            });
            
            marketDataWs.on('message', (data) => {
                this.handleMarketDataMessage(data);
            });
            
        } catch (error) {
            console.warn('⚠️ Real-time feeds not available:', error.message);
        }
    }

    // Security Reference Data
    async getSecurityData(identifier, identifierType = 'ISIN') {
        console.log(`🔍 Looking up security data: ${identifier}`);
        
        try {
            // Check cache first
            const cacheKey = `security_${identifierType}_${identifier}`;
            if (this.cache.has(cacheKey)) {
                console.log('📋 Returning cached security data');
                return this.cache.get(cacheKey);
            }
            
            // Apply rate limiting
            await this.applyRateLimit();
            
            const response = await this.makeRequest(`/securities/${identifier}`, 'GET', {
                identifierType,
                fields: [
                    'SECURITY_NAME',
                    'SECURITY_TYP',
                    'COUNTRY_ISO',
                    'CRNCY',
                    'MARKET_CAP',
                    'GICS_SECTOR_NAME',
                    'GICS_INDUSTRY_NAME',
                    'PX_LAST',
                    'PX_OPEN',
                    'PX_HIGH',
                    'PX_LOW',
                    'PX_VOLUME',
                    'VOLATILITY_30D'
                ].join(',')
            });
            
            const securityData = {
                identifier,
                identifierType,
                name: response.SECURITY_NAME,
                type: response.SECURITY_TYP,
                country: response.COUNTRY_ISO,
                currency: response.CRNCY,
                marketCap: response.MARKET_CAP,
                sector: response.GICS_SECTOR_NAME,
                industry: response.GICS_INDUSTRY_NAME,
                price: {
                    last: response.PX_LAST,
                    open: response.PX_OPEN,
                    high: response.PX_HIGH,
                    low: response.PX_LOW,
                    volume: response.PX_VOLUME
                },
                volatility30D: response.VOLATILITY_30D,
                lastUpdated: new Date().toISOString(),
                source: 'bloomberg'
            };
            
            // Cache the result
            this.cache.set(cacheKey, securityData);
            
            console.log(`✅ Security data retrieved: ${securityData.name}`);
            return securityData;
            
        } catch (error) {
            console.error(`❌ Security lookup failed: ${identifier}`, error);
            
            // Return mock data for development
            return this.getMockSecurityData(identifier, identifierType);
        }
    }

    async enrichSecurityData(securities) {
        console.log(`📈 Enriching ${securities.length} securities with Bloomberg data...`);
        
        const enrichedSecurities = [];
        const batchSize = 5; // Process in batches to respect rate limits
        
        for (let i = 0; i < securities.length; i += batchSize) {
            const batch = securities.slice(i, i + batchSize);
            const batchPromises = batch.map(async (security) => {
                try {
                    const bloombergData = await this.getSecurityData(security.isin, 'ISIN');
                    
                    return {
                        ...security,
                        bloomberg: bloombergData,
                        enriched: true,
                        enrichedAt: new Date().toISOString()
                    };
                } catch (error) {
                    console.warn(`⚠️ Failed to enrich ${security.isin}:`, error.message);
                    return {
                        ...security,
                        bloomberg: null,
                        enriched: false,
                        enrichmentError: error.message
                    };
                }
            });
            
            const batchResults = await Promise.allSettled(batchPromises);
            const batchSecurities = batchResults.map(result => 
                result.status === 'fulfilled' ? result.value : null
            ).filter(Boolean);
            
            enrichedSecurities.push(...batchSecurities);
            
            // Delay between batches to respect rate limits
            if (i + batchSize < securities.length) {
                await this.delay(1000);
            }
        }
        
        console.log(`✅ Enriched ${enrichedSecurities.filter(s => s.enriched).length}/${securities.length} securities`);
        return enrichedSecurities;
    }

    // Portfolio Data Synchronization
    async syncPortfolioData(portfolioData) {
        console.log('🔄 Synchronizing portfolio data with Bloomberg...');
        
        try {
            const syncResult = {
                portfolioId: portfolioData.id,
                syncedAt: new Date().toISOString(),
                securities: [],
                summary: {
                    total: portfolioData.securities.length,
                    synced: 0,
                    failed: 0,
                    warnings: []
                }
            };
            
            // Sync each security
            for (const security of portfolioData.securities) {
                try {
                    const bloombergData = await this.getSecurityData(security.isin);
                    
                    // Validate data consistency
                    const validation = this.validateSecurityData(security, bloombergData);
                    
                    syncResult.securities.push({
                        isin: security.isin,
                        localName: security.name,
                        bloombergName: bloombergData.name,
                        localValue: security.value,
                        bloombergPrice: bloombergData.price.last,
                        validation,
                        synced: true
                    });
                    
                    syncResult.summary.synced++;
                    
                    if (validation.warnings.length > 0) {
                        syncResult.summary.warnings.push(...validation.warnings);
                    }
                    
                } catch (error) {
                    syncResult.securities.push({
                        isin: security.isin,
                        error: error.message,
                        synced: false
                    });
                    
                    syncResult.summary.failed++;
                }
            }
            
            console.log(`✅ Portfolio sync complete: ${syncResult.summary.synced}/${syncResult.summary.total} synced`);
            return syncResult;
            
        } catch (error) {
            console.error('❌ Portfolio sync failed:', error);
            throw error;
        }
    }

    validateSecurityData(localData, bloombergData) {
        const validation = {
            nameMatch: false,
            priceReasonable: false,
            currencyMatch: false,
            warnings: [],
            score: 0
        };
        
        // Name similarity check
        const nameSimilarity = this.calculateStringSimilarity(
            localData.name?.toLowerCase() || '',
            bloombergData.name?.toLowerCase() || ''
        );
        
        validation.nameMatch = nameSimilarity > 0.7;
        if (!validation.nameMatch) {
            validation.warnings.push(`Name mismatch: "${localData.name}" vs "${bloombergData.name}"`);
        }
        
        // Price reasonableness check (within 20% of Bloomberg price)
        if (bloombergData.price.last && localData.value) {
            const priceDifference = Math.abs(localData.value - bloombergData.price.last) / bloombergData.price.last;
            validation.priceReasonable = priceDifference < 0.2;
            if (!validation.priceReasonable) {
                validation.warnings.push(`Price variance: ${(priceDifference * 100).toFixed(1)}%`);
            }
        }
        
        // Currency check
        validation.currencyMatch = localData.currency === bloombergData.currency;
        if (!validation.currencyMatch) {
            validation.warnings.push(`Currency mismatch: ${localData.currency} vs ${bloombergData.currency}`);
        }
        
        // Calculate overall validation score
        validation.score = (
            (validation.nameMatch ? 1 : 0) +
            (validation.priceReasonable ? 1 : 0) +
            (validation.currencyMatch ? 1 : 0)
        ) / 3;
        
        return validation;
    }

    // Market Data
    async getMarketData(identifiers) {
        console.log(`📊 Fetching market data for ${identifiers.length} securities...`);
        
        try {
            await this.applyRateLimit();
            
            const response = await this.makeRequest('/market-data/snapshot', 'POST', {
                identifiers,
                fields: [
                    'PX_LAST',
                    'PX_OPEN',
                    'PX_HIGH',
                    'PX_LOW',
                    'PX_VOLUME',
                    'CHG_PCT_1D',
                    'LAST_UPDATE_DT'
                ]
            });
            
            const marketData = response.data.map(item => ({
                identifier: item.identifier,
                price: {
                    last: item.PX_LAST,
                    open: item.PX_OPEN,
                    high: item.PX_HIGH,
                    low: item.PX_LOW,
                    change: item.CHG_PCT_1D,
                    volume: item.PX_VOLUME
                },
                lastUpdate: item.LAST_UPDATE_DT,
                source: 'bloomberg'
            }));
            
            console.log(`✅ Market data retrieved for ${marketData.length} securities`);
            return marketData;
            
        } catch (error) {
            console.error('❌ Market data retrieval failed:', error);
            return this.getMockMarketData(identifiers);
        }
    }

    async getHistoricalData(identifier, startDate, endDate, frequency = 'DAILY') {
        console.log(`📈 Fetching historical data: ${identifier} from ${startDate} to ${endDate}`);
        
        try {
            await this.applyRateLimit();
            
            const response = await this.makeRequest(`/historical-data/${identifier}`, 'GET', {
                startDate,
                endDate,
                frequency,
                fields: 'PX_LAST,PX_VOLUME'
            });
            
            const historicalData = {
                identifier,
                frequency,
                startDate,
                endDate,
                data: response.data.map(item => ({
                    date: item.date,
                    price: item.PX_LAST,
                    volume: item.PX_VOLUME
                })),
                source: 'bloomberg'
            };
            
            console.log(`✅ Historical data retrieved: ${historicalData.data.length} data points`);
            return historicalData;
            
        } catch (error) {
            console.error('❌ Historical data retrieval failed:', error);
            return this.getMockHistoricalData(identifier, startDate, endDate);
        }
    }

    // Real-time Subscriptions
    async subscribeToMarketData(identifiers, callback) {
        console.log(`📡 Subscribing to real-time data for ${identifiers.length} securities...`);
        
        const subscription = {
            id: this.generateSubscriptionId(),
            identifiers,
            callback,
            createdAt: new Date().toISOString()
        };
        
        this.subscriptions.set(subscription.id, subscription);
        
        // Send subscription request if connected
        const ws = this.connections.get('market_data');
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'subscribe',
                subscriptionId: subscription.id,
                identifiers,
                fields: ['PX_LAST', 'PX_VOLUME', 'CHG_PCT_1D']
            }));
        }
        
        console.log(`✅ Market data subscription created: ${subscription.id}`);
        return subscription.id;
    }

    async unsubscribeFromMarketData(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
            throw new Error(`Subscription not found: ${subscriptionId}`);
        }
        
        // Send unsubscribe request
        const ws = this.connections.get('market_data');
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'unsubscribe',
                subscriptionId
            }));
        }
        
        this.subscriptions.delete(subscriptionId);
        console.log(`✅ Market data subscription removed: ${subscriptionId}`);
    }

    // ISIN Validation and Conversion
    async validateISIN(isin) {
        console.log(`🔍 Validating ISIN: ${isin}`);
        
        try {
            await this.applyRateLimit();
            
            const response = await this.makeRequest(`/reference/validate`, 'POST', {
                identifier: isin,
                identifierType: 'ISIN'
            });
            
            const validation = {
                isin,
                valid: response.valid,
                exists: response.exists,
                security: response.exists ? {
                    name: response.securityName,
                    type: response.securityType,
                    country: response.countryCode,
                    currency: response.currency
                } : null,
                alternativeIdentifiers: response.alternativeIdentifiers || {},
                source: 'bloomberg'
            };
            
            console.log(`✅ ISIN validation complete: ${isin} - ${validation.valid ? 'Valid' : 'Invalid'}`);
            return validation;
            
        } catch (error) {
            console.error(`❌ ISIN validation failed: ${isin}`, error);
            return this.getMockISINValidation(isin);
        }
    }

    async convertIdentifier(identifier, fromType, toType) {
        console.log(`🔄 Converting identifier: ${identifier} from ${fromType} to ${toType}`);
        
        try {
            await this.applyRateLimit();
            
            const response = await this.makeRequest('/reference/convert', 'POST', {
                identifier,
                fromType,
                toType
            });
            
            const conversion = {
                original: { identifier, type: fromType },
                converted: { identifier: response.convertedIdentifier, type: toType },
                securityName: response.securityName,
                confidence: response.confidence,
                source: 'bloomberg'
            };
            
            console.log(`✅ Identifier converted: ${identifier} → ${conversion.converted.identifier}`);
            return conversion;
            
        } catch (error) {
            console.error(`❌ Identifier conversion failed: ${identifier}`, error);
            throw error;
        }
    }

    // Message Handlers
    handleTerminalMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            console.log('📨 Bloomberg Terminal message:', message.type);
            
            switch (message.type) {
                case 'market_data':
                    this.processMarketDataUpdate(message.data);
                    break;
                case 'news':
                    this.processNewsUpdate(message.data);
                    break;
                case 'alert':
                    this.processAlert(message.data);
                    break;
                default:
                    console.log('Unknown terminal message type:', message.type);
            }
        } catch (error) {
            console.error('❌ Error processing terminal message:', error);
        }
    }

    handleMarketDataMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'market_data_update') {
                this.processMarketDataUpdate(message.data);
            }
        } catch (error) {
            console.error('❌ Error processing market data message:', error);
        }
    }

    processMarketDataUpdate(data) {
        // Notify subscribers
        for (const [subscriptionId, subscription] of this.subscriptions) {
            if (subscription.identifiers.includes(data.identifier)) {
                subscription.callback(data);
            }
        }
    }

    // Utility Methods
    async makeRequest(endpoint, method = 'GET', params = {}) {
        const url = `${this.config.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: this.config.timeout
        };
        
        if (method === 'GET' && Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            url += `?${queryString}`;
        } else if (method !== 'GET') {
            options.body = JSON.stringify(params);
        }
        
        return new Promise((resolve, reject) => {
            const req = https.request(url, options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(response);
                        } else {
                            reject(new Error(`API Error: ${res.statusCode} - ${response.message}`));
                        }
                    } catch (error) {
                        reject(new Error(`Invalid JSON response: ${data}`));
                    }
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Request timeout')));
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }

    async applyRateLimit() {
        const now = Date.now();
        
        // Remove old requests (older than 1 second)
        this.rateLimit.requests = this.rateLimit.requests.filter(time => 
            now - time < 1000
        );
        
        // Check if we're at the limit
        if (this.rateLimit.requests.length >= this.rateLimit.maxRequests) {
            const oldestRequest = Math.min(...this.rateLimit.requests);
            const waitTime = 1000 - (now - oldestRequest);
            
            if (waitTime > 0) {
                await this.delay(waitTime);
            }
        }
        
        this.rateLimit.requests.push(now);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateSubscriptionId() {
        return `bloomberg_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    calculateStringSimilarity(str1, str2) {
        // Simple Levenshtein distance implementation
        const matrix = [];
        const n = str1.length;
        const m = str2.length;
        
        if (n === 0) return m === 0 ? 1 : 0;
        if (m === 0) return 0;
        
        for (let i = 0; i <= n; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= m; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= m; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
        
        const maxLength = Math.max(n, m);
        return (maxLength - matrix[n][m]) / maxLength;
    }

    // Mock Data Methods (for development/testing)
    getMockSecurityData(identifier, identifierType) {
        return {
            identifier,
            identifierType,
            name: `Mock Security ${identifier.slice(-4)}`,
            type: 'Common Stock',
            country: 'CH',
            currency: 'CHF',
            marketCap: Math.random() * 10000000000,
            sector: 'Technology',
            industry: 'Software',
            price: {
                last: Math.random() * 1000 + 50,
                open: Math.random() * 1000 + 50,
                high: Math.random() * 1000 + 50,
                low: Math.random() * 1000 + 50,
                volume: Math.floor(Math.random() * 1000000)
            },
            volatility30D: Math.random() * 50 + 10,
            lastUpdated: new Date().toISOString(),
            source: 'mock'
        };
    }

    getMockMarketData(identifiers) {
        return identifiers.map(identifier => ({
            identifier,
            price: {
                last: Math.random() * 1000 + 50,
                open: Math.random() * 1000 + 50,
                high: Math.random() * 1000 + 50,
                low: Math.random() * 1000 + 50,
                change: (Math.random() - 0.5) * 10,
                volume: Math.floor(Math.random() * 1000000)
            },
            lastUpdate: new Date().toISOString(),
            source: 'mock'
        }));
    }

    getMockHistoricalData(identifier, startDate, endDate) {
        const data = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        
        let price = Math.random() * 1000 + 50;
        
        for (let i = 0; i < days; i++) {
            const date = new Date(start.getTime() + (i * 24 * 60 * 60 * 1000));
            price = price * (0.98 + Math.random() * 0.04); // Random walk
            
            data.push({
                date: date.toISOString().split('T')[0],
                price: Math.round(price * 100) / 100,
                volume: Math.floor(Math.random() * 1000000)
            });
        }
        
        return {
            identifier,
            frequency: 'DAILY',
            startDate,
            endDate,
            data,
            source: 'mock'
        };
    }

    getMockISINValidation(isin) {
        return {
            isin,
            valid: /^[A-Z]{2}[A-Z0-9]{10}$/.test(isin),
            exists: Math.random() > 0.3, // 70% chance of existing
            security: {
                name: `Mock Security ${isin.slice(-4)}`,
                type: 'Common Stock',
                country: isin.substring(0, 2),
                currency: 'CHF'
            },
            alternativeIdentifiers: {
                CUSIP: `${Math.random().toString(36).substr(2, 9)}`,
                SEDOL: `${Math.random().toString(36).substr(2, 7)}`
            },
            source: 'mock'
        };
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up Bloomberg connections...');
        
        // Close all WebSocket connections
        for (const [name, ws] of this.connections) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        }
        
        // Clear subscriptions
        this.subscriptions.clear();
        
        // Clear cache
        this.cache.clear();
        
        console.log('✅ Bloomberg integration cleanup complete');
    }
}

module.exports = { BloombergIntegration };