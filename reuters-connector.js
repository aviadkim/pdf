/**
 * REUTERS DATA CONNECTOR
 * Integration with Reuters data feeds and APIs for financial information
 * 
 * Features:
 * - Eikon Data API integration
 * - Real-time news feeds
 * - Financial instrument data
 * - Market data streaming
 * - Historical data retrieval
 * - Symbology conversion
 */

const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');

class ReutersConnector {
    constructor(options = {}) {
        this.config = {
            apiKey: options.apiKey || process.env.REUTERS_API_KEY,
            appId: options.appId || process.env.REUTERS_APP_ID,
            baseUrl: options.baseUrl || 'https://api.refinitiv.com/data/historical-pricing/v1',
            eikonUrl: options.eikonUrl || 'http://localhost:9000/api/v1',
            enableRealTime: options.enableRealTime !== false,
            rateLimitPerSecond: options.rateLimitPerSecond || 5,
            timeout: options.timeout || 30000,
            maxRetries: options.maxRetries || 3
        };
        
        this.connections = new Map();
        this.subscriptions = new Map();
        this.cache = new Map();
        this.rateLimit = {
            requests: [],
            maxRequests: this.config.rateLimitPerSecond
        };
        
        console.log('📰 Reuters Connector initialized');
        console.log(`🔗 Base URL: ${this.config.baseUrl}`);
    }

    async initialize() {
        console.log('🚀 Initializing Reuters integration...');
        
        try {
            // Test API connectivity
            await this.testConnection();
            
            // Initialize Eikon connection if available
            if (this.config.eikonUrl) {
                await this.initializeEikonConnection();
            }
            
            // Start real-time data feeds if enabled
            if (this.config.enableRealTime) {
                await this.initializeRealTimeFeeds();
            }
            
            console.log('✅ Reuters integration ready');
            
        } catch (error) {
            console.error('❌ Reuters integration initialization failed:', error);
            throw error;
        }
    }

    async testConnection() {
        console.log('🔍 Testing Reuters API connection...');
        
        try {
            const response = await this.makeRequest('/status', 'GET');
            if (response.status === 'OK' || response.message === 'Service is running') {
                console.log('✅ Reuters API connection successful');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Reuters API not available, using mock data');
            return false;
        }
    }

    async initializeEikonConnection() {
        console.log('🖥️ Connecting to Eikon Desktop...');
        
        try {
            // Test Eikon connection
            const response = await this.makeEikonRequest('/heartbeat');
            if (response.status === 'Connected') {
                console.log('✅ Eikon Desktop connection established');
                this.eikonConnected = true;
            }
        } catch (error) {
            console.warn('⚠️ Eikon Desktop not available:', error.message);
            this.eikonConnected = false;
        }
    }

    async initializeRealTimeFeeds() {
        console.log('📡 Initializing Reuters real-time feeds...');
        
        try {
            // Initialize WebSocket connection for real-time data
            const ws = new WebSocket('wss://api.refinitiv.com/streaming/pricing/v1/');
            
            ws.on('open', () => {
                console.log('✅ Reuters real-time feed connected');
                this.connections.set('realtime', ws);
                
                // Send authentication
                ws.send(JSON.stringify({
                    type: 'login',
                    appId: this.config.appId,
                    token: this.config.apiKey
                }));
            });
            
            ws.on('message', (data) => {
                this.handleRealTimeMessage(data);
            });
            
            ws.on('error', (error) => {
                console.warn('⚠️ Reuters real-time feed error:', error.message);
            });
            
        } catch (error) {
            console.warn('⚠️ Real-time feeds not available:', error.message);
        }
    }

    // Security Data Retrieval
    async getSecurityData(identifier, identifierType = 'ISIN') {
        console.log(`🔍 Looking up Reuters security data: ${identifier}`);
        
        try {
            // Check cache first
            const cacheKey = `security_${identifierType}_${identifier}`;
            if (this.cache.has(cacheKey)) {
                console.log('📋 Returning cached security data');
                return this.cache.get(cacheKey);
            }
            
            // Apply rate limiting
            await this.applyRateLimit();
            
            // Try Eikon first if available
            if (this.eikonConnected) {
                const eikonData = await this.getEikonSecurityData(identifier, identifierType);
                if (eikonData) {
                    this.cache.set(cacheKey, eikonData);
                    return eikonData;
                }
            }
            
            // Fallback to REST API
            const response = await this.makeRequest(`/instruments/${identifier}`, 'GET', {
                identifierType,
                fields: [
                    'TR.CommonName',
                    'TR.InstrumentType',
                    'TR.ExchangeCountry',
                    'TR.Currency',
                    'TR.MarketCap',
                    'TR.GICSSector',
                    'TR.GICSIndustry',
                    'TR.PriceClose',
                    'TR.Volume',
                    'TR.Volatility30D'
                ].join(',')
            });
            
            const securityData = {
                identifier,
                identifierType,
                name: response['TR.CommonName'],
                type: response['TR.InstrumentType'],
                country: response['TR.ExchangeCountry'],
                currency: response['TR.Currency'],
                marketCap: response['TR.MarketCap'],
                sector: response['TR.GICSSector'],
                industry: response['TR.GICSIndustry'],
                price: {
                    last: response['TR.PriceClose'],
                    volume: response['TR.Volume']
                },
                volatility30D: response['TR.Volatility30D'],
                lastUpdated: new Date().toISOString(),
                source: 'reuters'
            };
            
            // Cache the result
            this.cache.set(cacheKey, securityData);
            
            console.log(`✅ Reuters security data retrieved: ${securityData.name}`);
            return securityData;
            
        } catch (error) {
            console.error(`❌ Reuters security lookup failed: ${identifier}`, error);
            
            // Return mock data for development
            return this.getMockSecurityData(identifier, identifierType);
        }
    }

    async getEikonSecurityData(identifier, identifierType) {
        try {
            const response = await this.makeEikonRequest('/data', {
                method: 'POST',
                body: {
                    universe: [identifier],
                    fields: [
                        'TR.CommonName',
                        'TR.InstrumentType',
                        'TR.ExchangeCountry',
                        'TR.Currency',
                        'TR.MarketCap',
                        'TR.GICSSector',
                        'TR.GICSIndustry',
                        'TR.PriceClose',
                        'TR.Volume'
                    ]
                }
            });
            
            if (response.data && response.data.length > 0) {
                const data = response.data[0];
                return {
                    identifier,
                    identifierType,
                    name: data['TR.CommonName'],
                    type: data['TR.InstrumentType'],
                    country: data['TR.ExchangeCountry'],
                    currency: data['TR.Currency'],
                    marketCap: data['TR.MarketCap'],
                    sector: data['TR.GICSSector'],
                    industry: data['TR.GICSIndustry'],
                    price: {
                        last: data['TR.PriceClose'],
                        volume: data['TR.Volume']
                    },
                    lastUpdated: new Date().toISOString(),
                    source: 'reuters_eikon'
                };
            }
        } catch (error) {
            console.warn('⚠️ Eikon data retrieval failed:', error.message);
            return null;
        }
    }

    // News and Research
    async getNews(options = {}) {
        console.log('📰 Fetching Reuters news...');
        
        const {
            query = '',
            maxCount = 20,
            dateFrom = null,
            dateTo = null,
            lang = 'en'
        } = options;
        
        try {
            await this.applyRateLimit();
            
            const params = {
                query,
                maxCount,
                lang
            };
            
            if (dateFrom) params.dateFrom = dateFrom;
            if (dateTo) params.dateTo = dateTo;
            
            const response = await this.makeRequest('/news/headlines', 'GET', params);
            
            const news = response.headlines.map(item => ({
                id: item.storyId,
                headline: item.text,
                summary: item.summary,
                timestamp: item.versionCreated,
                source: 'Reuters',
                topics: item.subjects || [],
                instruments: item.companies || [],
                url: item.newsWebUrl
            }));
            
            console.log(`✅ Retrieved ${news.length} news items`);
            return news;
            
        } catch (error) {
            console.error('❌ Reuters news retrieval failed:', error);
            return this.getMockNews(options);
        }
    }

    async getStoryDetail(storyId) {
        console.log(`📄 Fetching Reuters story detail: ${storyId}`);
        
        try {
            await this.applyRateLimit();
            
            const response = await this.makeRequest(`/news/stories/${storyId}`, 'GET');
            
            return {
                id: storyId,
                headline: response.text,
                body: response.bodyHTML,
                summary: response.summary,
                timestamp: response.versionCreated,
                author: response.byline,
                source: 'Reuters',
                topics: response.subjects || [],
                instruments: response.companies || []
            };
            
        } catch (error) {
            console.error(`❌ Reuters story retrieval failed: ${storyId}`, error);
            throw error;
        }
    }

    // Market Data
    async getHistoricalPrices(instrument, startDate, endDate, interval = 'daily') {
        console.log(`📈 Fetching historical prices: ${instrument} from ${startDate} to ${endDate}`);
        
        try {
            await this.applyRateLimit();
            
            const response = await this.makeRequest('/views/historical-pricing', 'GET', {
                universe: instrument,
                fields: 'BID,ASK,OPEN_PRC,HIGH_1,LOW_1,TRDPRC_1,NUM_MOVES,ACVOL_UNS',
                interval: interval.toUpperCase(),
                start: startDate,
                end: endDate
            });
            
            const historicalData = {
                instrument,
                interval,
                startDate,
                endDate,
                data: response.data.map(item => ({
                    date: item.DATE,
                    open: item.OPEN_PRC,
                    high: item.HIGH_1,
                    low: item.LOW_1,
                    close: item.TRDPRC_1,
                    volume: item.ACVOL_UNS,
                    trades: item.NUM_MOVES
                })),
                source: 'reuters'
            };
            
            console.log(`✅ Historical data retrieved: ${historicalData.data.length} data points`);
            return historicalData;
            
        } catch (error) {
            console.error('❌ Historical prices retrieval failed:', error);
            return this.getMockHistoricalData(instrument, startDate, endDate);
        }
    }

    async getIntradayPrices(instrument, startTime, endTime) {
        console.log(`⏱️ Fetching intraday prices: ${instrument}`);
        
        try {
            await this.applyRateLimit();
            
            const response = await this.makeRequest('/views/interday-pricing', 'GET', {
                universe: instrument,
                fields: 'BID,ASK,TRDPRC_1,ACVOL_UNS',
                start: startTime,
                end: endTime,
                interval: 'PT1M' // 1 minute intervals
            });
            
            return {
                instrument,
                startTime,
                endTime,
                data: response.data.map(item => ({
                    timestamp: item.DATE_TIME,
                    price: item.TRDPRC_1,
                    bid: item.BID,
                    ask: item.ASK,
                    volume: item.ACVOL_UNS
                })),
                source: 'reuters'
            };
            
        } catch (error) {
            console.error('❌ Intraday prices retrieval failed:', error);
            throw error;
        }
    }

    // Symbology and Reference Data
    async convertSymbol(identifier, fromType, toType) {
        console.log(`🔄 Converting symbol: ${identifier} from ${fromType} to ${toType}`);
        
        try {
            await this.applyRateLimit();
            
            const response = await this.makeRequest('/discovery/symbology/v1/lookup', 'POST', {
                from: [{
                    identifierTypes: [fromType],
                    values: [identifier]
                }],
                to: [{
                    identifierTypes: [toType]
                }]
            });
            
            if (response.data && response.data.length > 0) {
                const conversion = response.data[0];
                return {
                    original: { identifier, type: fromType },
                    converted: { 
                        identifier: conversion.output[0].value, 
                        type: toType 
                    },
                    confidence: conversion.output[0].confidence,
                    source: 'reuters'
                };
            }
            
            throw new Error('No conversion found');
            
        } catch (error) {
            console.error(`❌ Symbol conversion failed: ${identifier}`, error);
            throw error;
        }
    }

    async searchInstruments(query, maxResults = 50) {
        console.log(`🔍 Searching instruments: ${query}`);
        
        try {
            await this.applyRateLimit();
            
            const response = await this.makeRequest('/discovery/search/v1', 'GET', {
                query,
                top: maxResults,
                select: 'RIC,CommonName,IssuerOAPermID,PI,AssetType',
                filter: 'AssetType eq \'Equity\' or AssetType eq \'Bond\''
            });
            
            return response.value.map(item => ({
                ric: item.RIC,
                name: item.CommonName,
                type: item.AssetType,
                issuer: item.IssuerOAPermID,
                primaryInstrument: item.PI
            }));
            
        } catch (error) {
            console.error('❌ Instrument search failed:', error);
            return [];
        }
    }

    // Real-time Data Subscriptions
    async subscribeToRealTimeData(instruments, callback) {
        console.log(`📡 Subscribing to real-time data for ${instruments.length} instruments...`);
        
        const subscription = {
            id: this.generateSubscriptionId(),
            instruments,
            callback,
            createdAt: new Date().toISOString()
        };
        
        this.subscriptions.set(subscription.id, subscription);
        
        // Send subscription request if connected
        const ws = this.connections.get('realtime');
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'request',
                subscriptionId: subscription.id,
                service: 'ELEKTRON_DD',
                key: instruments,
                streaming: true
            }));
        }
        
        console.log(`✅ Real-time subscription created: ${subscription.id}`);
        return subscription.id;
    }

    async unsubscribeFromRealTimeData(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
            throw new Error(`Subscription not found: ${subscriptionId}`);
        }
        
        // Send unsubscribe request
        const ws = this.connections.get('realtime');
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'close',
                subscriptionId
            }));
        }
        
        this.subscriptions.delete(subscriptionId);
        console.log(`✅ Real-time subscription removed: ${subscriptionId}`);
    }

    // Message Handlers
    handleRealTimeMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            
            switch (message.type) {
                case 'refresh':
                case 'update':
                    this.processMarketDataUpdate(message);
                    break;
                case 'status':
                    this.processStatusMessage(message);
                    break;
                case 'error':
                    console.error('Reuters real-time error:', message);
                    break;
                default:
                    console.log('Unknown real-time message type:', message.type);
            }
        } catch (error) {
            console.error('❌ Error processing real-time message:', error);
        }
    }

    processMarketDataUpdate(message) {
        // Notify subscribers
        for (const [subscriptionId, subscription] of this.subscriptions) {
            if (subscription.instruments.includes(message.key)) {
                subscription.callback({
                    instrument: message.key,
                    fields: message.fields,
                    timestamp: new Date().toISOString(),
                    source: 'reuters'
                });
            }
        }
    }

    processStatusMessage(message) {
        console.log(`📊 Reuters status: ${message.key} - ${message.state}`);
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

    async makeEikonRequest(endpoint, options = {}) {
        const url = `${this.config.eikonUrl}${endpoint}`;
        const requestOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: this.config.timeout
        };
        
        if (options.body) {
            requestOptions.body = JSON.stringify(options.body);
        }
        
        return new Promise((resolve, reject) => {
            const req = https.request(url, requestOptions, (res) => {
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
                            reject(new Error(`Eikon API Error: ${res.statusCode}`));
                        }
                    } catch (error) {
                        reject(new Error(`Invalid JSON response: ${data}`));
                    }
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Eikon request timeout')));
            
            if (requestOptions.body) {
                req.write(requestOptions.body);
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
        return `reuters_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Mock Data Methods (for development/testing)
    getMockSecurityData(identifier, identifierType) {
        return {
            identifier,
            identifierType,
            name: `Mock Security ${identifier.slice(-4)}`,
            type: 'Equity',
            country: 'US',
            currency: 'USD',
            marketCap: Math.random() * 50000000000,
            sector: 'Technology',
            industry: 'Software',
            price: {
                last: Math.random() * 500 + 50,
                volume: Math.floor(Math.random() * 1000000)
            },
            volatility30D: Math.random() * 30 + 10,
            lastUpdated: new Date().toISOString(),
            source: 'mock'
        };
    }

    getMockNews(options) {
        const { maxCount = 20 } = options;
        const news = [];
        
        for (let i = 0; i < maxCount; i++) {
            news.push({
                id: `story_${Date.now()}_${i}`,
                headline: `Mock Financial News Story ${i + 1}`,
                summary: 'This is a mock news story for development purposes.',
                timestamp: new Date(Date.now() - (i * 3600000)).toISOString(),
                source: 'Reuters (Mock)',
                topics: ['markets', 'economy'],
                instruments: [],
                url: `https://reuters.com/mock/story-${i}`
            });
        }
        
        return news;
    }

    getMockHistoricalData(instrument, startDate, endDate) {
        const data = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        
        let price = Math.random() * 500 + 50;
        
        for (let i = 0; i < days; i++) {
            const date = new Date(start.getTime() + (i * 24 * 60 * 60 * 1000));
            const change = (Math.random() - 0.5) * 10;
            price = Math.max(price + change, 10);
            
            data.push({
                date: date.toISOString().split('T')[0],
                open: Math.round((price - change) * 100) / 100,
                high: Math.round((price + Math.random() * 5) * 100) / 100,
                low: Math.round((price - Math.random() * 5) * 100) / 100,
                close: Math.round(price * 100) / 100,
                volume: Math.floor(Math.random() * 1000000),
                trades: Math.floor(Math.random() * 10000)
            });
        }
        
        return {
            instrument,
            interval: 'DAILY',
            startDate,
            endDate,
            data,
            source: 'mock'
        };
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up Reuters connections...');
        
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
        
        console.log('✅ Reuters integration cleanup complete');
    }
}

module.exports = { ReutersConnector };