/**
 * PORTFOLIO SYNCHRONIZATION SYSTEM
 * Bidirectional synchronization with external portfolio management systems
 * 
 * Features:
 * - Multi-platform portfolio sync (Bloomberg Port, Charles River, etc.)
 * - Real-time position updates
 * - Conflict resolution and data reconciliation
 * - Historical change tracking
 * - Automated validation and error handling
 * - Custom field mapping and transformation
 */

const EventEmitter = require('events');

class PortfolioSync extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            syncInterval: options.syncInterval || 300000, // 5 minutes
            enableRealTime: options.enableRealTime !== false,
            conflictResolution: options.conflictResolution || 'external_priority',
            maxRetries: options.maxRetries || 3,
            timeout: options.timeout || 30000,
            validateData: options.validateData !== false,
            trackHistory: options.trackHistory !== false
        };
        
        this.connectors = new Map();
        this.portfolios = new Map();
        this.syncStatus = new Map();
        this.fieldMappings = new Map();
        this.transformations = new Map();
        this.conflicts = [];
        this.syncHistory = [];
        
        this.initializeDefaultMappings();
        
        console.log('🔄 Portfolio Sync System initialized');
        console.log(`⏱️ Sync interval: ${this.config.syncInterval}ms`);
    }

    async initialize(database, bloombergConnector, reutersConnector) {
        console.log('🚀 Initializing portfolio synchronization...');
        
        try {
            this.db = database;
            this.bloomberg = bloombergConnector;
            this.reuters = reutersConnector;
            
            // Initialize external connectors
            await this.initializeExternalConnectors();
            
            // Load existing portfolios
            await this.loadPortfolios();
            
            // Start sync scheduler if enabled
            if (this.config.enableRealTime) {
                this.startSyncScheduler();
            }
            
            console.log('✅ Portfolio synchronization ready');
            
        } catch (error) {
            console.error('❌ Portfolio sync initialization failed:', error);
            throw error;
        }
    }

    async initializeExternalConnectors() {
        console.log('🔌 Initializing external portfolio connectors...');
        
        // Bloomberg Port connector
        if (process.env.BLOOMBERG_PORT_ENABLED === 'true') {
            this.connectors.set('bloomberg_port', {
                type: 'bloomberg_port',
                config: {
                    host: process.env.BLOOMBERG_PORT_HOST || 'localhost',
                    port: process.env.BLOOMBERG_PORT_PORT || 8194,
                    username: process.env.BLOOMBERG_PORT_USER,
                    password: process.env.BLOOMBERG_PORT_PASS
                },
                enabled: true
            });
        }
        
        // Charles River IMS connector
        if (process.env.CHARLES_RIVER_ENABLED === 'true') {
            this.connectors.set('charles_river', {
                type: 'charles_river',
                config: {
                    apiUrl: process.env.CHARLES_RIVER_API_URL,
                    apiKey: process.env.CHARLES_RIVER_API_KEY,
                    username: process.env.CHARLES_RIVER_USER,
                    password: process.env.CHARLES_RIVER_PASS
                },
                enabled: true
            });
        }
        
        // Aladdin connector
        if (process.env.ALADDIN_ENABLED === 'true') {
            this.connectors.set('aladdin', {
                type: 'aladdin',
                config: {
                    apiUrl: process.env.ALADDIN_API_URL,
                    clientId: process.env.ALADDIN_CLIENT_ID,
                    clientSecret: process.env.ALADDIN_CLIENT_SECRET
                },
                enabled: true
            });
        }
        
        // Generic FTP/SFTP connector for file-based systems
        if (process.env.FTP_SYNC_ENABLED === 'true') {
            this.connectors.set('ftp_sync', {
                type: 'ftp',
                config: {
                    host: process.env.FTP_HOST,
                    port: process.env.FTP_PORT || 21,
                    username: process.env.FTP_USER,
                    password: process.env.FTP_PASS,
                    directory: process.env.FTP_DIRECTORY || '/',
                    protocol: process.env.FTP_PROTOCOL || 'ftp' // ftp, sftp, ftps
                },
                enabled: true
            });
        }
        
        console.log(`🔗 Initialized ${this.connectors.size} external connectors`);
    }

    initializeDefaultMappings() {
        // Standard field mappings for common portfolio systems
        this.fieldMappings.set('bloomberg_port', {
            'security_id': 'ISIN',
            'security_name': 'SECURITY_DES',
            'position': 'POSITION',
            'market_value': 'MARKET_VALUE_BASE',
            'book_value': 'BOOK_VALUE_BASE',
            'currency': 'BASE_CCY',
            'sector': 'GICS_SECTOR_NAME',
            'country': 'COUNTRY_ISO',
            'portfolio_id': 'PORT_ID',
            'as_of_date': 'AS_OF_DATE'
        });
        
        this.fieldMappings.set('charles_river', {
            'security_id': 'SecurityId',
            'security_name': 'SecurityName',
            'position': 'Quantity',
            'market_value': 'MarketValue',
            'book_value': 'BookValue',
            'currency': 'Currency',
            'sector': 'Sector',
            'country': 'Country',
            'portfolio_id': 'PortfolioCode',
            'as_of_date': 'AsOfDate'
        });
        
        this.fieldMappings.set('aladdin', {
            'security_id': 'identifier',
            'security_name': 'name',
            'position': 'shares',
            'market_value': 'marketValue',
            'book_value': 'costBasis',
            'currency': 'currency',
            'sector': 'sector',
            'country': 'country',
            'portfolio_id': 'portfolioId',
            'as_of_date': 'date'
        });
    }

    // Portfolio Management
    async registerPortfolio(portfolioConfig) {
        console.log(`📁 Registering portfolio: ${portfolioConfig.id}`);
        
        const portfolio = {
            id: portfolioConfig.id,
            name: portfolioConfig.name,
            description: portfolioConfig.description,
            externalSystems: portfolioConfig.externalSystems || [],
            syncEnabled: portfolioConfig.syncEnabled !== false,
            lastSync: null,
            conflictResolution: portfolioConfig.conflictResolution || this.config.conflictResolution,
            fieldMappings: portfolioConfig.fieldMappings || {},
            transformations: portfolioConfig.transformations || {},
            positions: new Map(),
            metadata: portfolioConfig.metadata || {}
        };
        
        // Validate external systems
        for (const system of portfolio.externalSystems) {
            if (!this.connectors.has(system.type)) {
                throw new Error(`External system not configured: ${system.type}`);
            }
        }
        
        this.portfolios.set(portfolio.id, portfolio);
        this.syncStatus.set(portfolio.id, {
            status: 'ready',
            lastSync: null,
            nextSync: null,
            errors: [],
            conflicts: []
        });
        
        // Store in database
        if (this.db.models.Portfolio) {
            await this.db.models.Portfolio.upsert({
                id: portfolio.id,
                name: portfolio.name,
                description: portfolio.description,
                config: JSON.stringify(portfolio),
                syncEnabled: portfolio.syncEnabled
            });
        }
        
        console.log(`✅ Portfolio registered: ${portfolio.name}`);
        return portfolio;
    }

    async syncPortfolio(portfolioId, force = false) {
        console.log(`🔄 Starting portfolio sync: ${portfolioId}`);
        
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) {
            throw new Error(`Portfolio not found: ${portfolioId}`);
        }
        
        if (!portfolio.syncEnabled && !force) {
            console.log(`⏸️ Sync disabled for portfolio: ${portfolioId}`);
            return { status: 'disabled' };
        }
        
        const syncStatus = this.syncStatus.get(portfolioId);
        syncStatus.status = 'syncing';
        syncStatus.errors = [];
        syncStatus.conflicts = [];
        
        const startTime = new Date();
        
        try {
            const syncResults = [];
            
            // Sync with each external system
            for (const externalSystem of portfolio.externalSystems) {
                console.log(`🔗 Syncing with ${externalSystem.type}...`);
                
                try {
                    const result = await this.syncWithExternalSystem(
                        portfolio,
                        externalSystem
                    );
                    syncResults.push(result);
                } catch (error) {
                    console.error(`❌ Sync failed with ${externalSystem.type}:`, error);
                    syncStatus.errors.push({
                        system: externalSystem.type,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
            
            // Resolve conflicts if any
            const conflicts = await this.resolveConflicts(portfolio, syncResults);
            if (conflicts.length > 0) {
                syncStatus.conflicts = conflicts;
                this.conflicts.push(...conflicts);
            }
            
            // Update portfolio positions
            await this.updatePortfolioPositions(portfolio, syncResults);
            
            // Update sync status
            syncStatus.status = 'completed';
            syncStatus.lastSync = startTime;
            syncStatus.nextSync = new Date(Date.now() + this.config.syncInterval);
            portfolio.lastSync = startTime;
            
            const duration = Date.now() - startTime.getTime();
            
            // Record sync history
            if (this.config.trackHistory) {
                this.syncHistory.push({
                    portfolioId,
                    timestamp: startTime,
                    duration,
                    results: syncResults,
                    conflicts: conflicts.length,
                    errors: syncStatus.errors.length
                });
            }
            
            console.log(`✅ Portfolio sync completed: ${portfolioId} (${duration}ms)`);
            
            // Emit sync completed event
            this.emit('syncCompleted', {
                portfolioId,
                results: syncResults,
                duration,
                conflicts: conflicts.length,
                errors: syncStatus.errors.length
            });
            
            return {
                status: 'completed',
                duration,
                systems: syncResults.length,
                conflicts: conflicts.length,
                errors: syncStatus.errors.length,
                results: syncResults
            };
            
        } catch (error) {
            syncStatus.status = 'failed';
            syncStatus.errors.push({
                system: 'sync_manager',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            console.error(`❌ Portfolio sync failed: ${portfolioId}`, error);
            
            this.emit('syncFailed', {
                portfolioId,
                error: error.message
            });
            
            throw error;
        }
    }

    async syncWithExternalSystem(portfolio, externalSystem) {
        const connector = this.connectors.get(externalSystem.type);
        if (!connector || !connector.enabled) {
            throw new Error(`Connector not available: ${externalSystem.type}`);
        }
        
        switch (externalSystem.type) {
            case 'bloomberg_port':
                return await this.syncWithBloombergPort(portfolio, externalSystem);
            case 'charles_river':
                return await this.syncWithCharlesRiver(portfolio, externalSystem);
            case 'aladdin':
                return await this.syncWithAladdin(portfolio, externalSystem);
            case 'ftp':
                return await this.syncWithFTP(portfolio, externalSystem);
            default:
                throw new Error(`Unknown external system type: ${externalSystem.type}`);
        }
    }

    async syncWithBloombergPort(portfolio, externalSystem) {
        console.log('📊 Syncing with Bloomberg PORT...');
        
        // Mock implementation - would use actual Bloomberg PORT API
        const positions = await this.fetchBloombergPortPositions(
            portfolio.id,
            externalSystem.portfolioCode
        );
        
        return {
            system: 'bloomberg_port',
            portfolioId: portfolio.id,
            positions: positions.map(pos => this.transformPosition(pos, 'bloomberg_port')),
            timestamp: new Date().toISOString(),
            recordCount: positions.length
        };
    }

    async syncWithCharlesRiver(portfolio, externalSystem) {
        console.log('🏛️ Syncing with Charles River IMS...');
        
        // Mock implementation - would use actual Charles River API
        const positions = await this.fetchCharlesRiverPositions(
            portfolio.id,
            externalSystem.portfolioCode
        );
        
        return {
            system: 'charles_river',
            portfolioId: portfolio.id,
            positions: positions.map(pos => this.transformPosition(pos, 'charles_river')),
            timestamp: new Date().toISOString(),
            recordCount: positions.length
        };
    }

    async syncWithAladdin(portfolio, externalSystem) {
        console.log('🗿 Syncing with Aladdin...');
        
        // Mock implementation - would use actual Aladdin API
        const positions = await this.fetchAladdinPositions(
            portfolio.id,
            externalSystem.portfolioCode
        );
        
        return {
            system: 'aladdin',
            portfolioId: portfolio.id,
            positions: positions.map(pos => this.transformPosition(pos, 'aladdin')),
            timestamp: new Date().toISOString(),
            recordCount: positions.length
        };
    }

    async syncWithFTP(portfolio, externalSystem) {
        console.log('📁 Syncing with FTP file system...');
        
        // Mock implementation - would download and parse files via FTP/SFTP
        const positions = await this.fetchFTPPositions(
            portfolio.id,
            externalSystem.filePath
        );
        
        return {
            system: 'ftp',
            portfolioId: portfolio.id,
            positions: positions.map(pos => this.transformPosition(pos, 'ftp')),
            timestamp: new Date().toISOString(),
            recordCount: positions.length
        };
    }

    // Data Transformation
    transformPosition(position, systemType) {
        const mapping = this.fieldMappings.get(systemType);
        if (!mapping) {
            return position; // No transformation if no mapping
        }
        
        const transformed = {};
        
        // Apply field mappings
        for (const [standardField, externalField] of Object.entries(mapping)) {
            if (position.hasOwnProperty(externalField)) {
                transformed[standardField] = position[externalField];
            }
        }
        
        // Apply custom transformations
        const transformations = this.transformations.get(systemType);
        if (transformations) {
            for (const [field, transformer] of Object.entries(transformations)) {
                if (typeof transformer === 'function') {
                    transformed[field] = transformer(transformed[field], position);
                }
            }
        }
        
        // Add metadata
        transformed._source = systemType;
        transformed._transformedAt = new Date().toISOString();
        
        return transformed;
    }

    // Conflict Resolution
    async resolveConflicts(portfolio, syncResults) {
        console.log('🔍 Checking for conflicts...');
        
        const conflicts = [];
        const positionsBySecurityId = new Map();
        
        // Group positions by security ID
        for (const result of syncResults) {
            for (const position of result.positions) {
                const securityId = position.security_id;
                if (!positionsBySecurityId.has(securityId)) {
                    positionsBySecurityId.set(securityId, []);
                }
                positionsBySecurityId.get(securityId).push({
                    ...position,
                    _system: result.system
                });
            }
        }
        
        // Check for conflicts in positions
        for (const [securityId, positions] of positionsBySecurityId) {
            if (positions.length > 1) {
                const conflict = this.detectConflict(securityId, positions);
                if (conflict) {
                    conflicts.push(conflict);
                }
            }
        }
        
        // Apply conflict resolution strategy
        for (const conflict of conflicts) {
            const resolution = await this.applyConflictResolution(
                conflict,
                portfolio.conflictResolution
            );
            conflict.resolution = resolution;
        }
        
        if (conflicts.length > 0) {
            console.log(`⚠️ Found ${conflicts.length} conflicts`);
        }
        
        return conflicts;
    }

    detectConflict(securityId, positions) {
        // Check for significant differences in position quantities or values
        const quantities = positions.map(p => parseFloat(p.position) || 0);
        const marketValues = positions.map(p => parseFloat(p.market_value) || 0);
        
        const quantityVariance = this.calculateVariance(quantities);
        const valueVariance = this.calculateVariance(marketValues);
        
        // Consider it a conflict if variance is > 5% for quantities or > 10% for values
        if (quantityVariance > 0.05 || valueVariance > 0.10) {
            return {
                securityId,
                type: 'position_mismatch',
                positions,
                quantityVariance,
                valueVariance,
                detectedAt: new Date().toISOString()
            };
        }
        
        return null;
    }

    async applyConflictResolution(conflict, strategy) {
        switch (strategy) {
            case 'external_priority':
                // Use position from external system with highest priority
                return this.resolveBySystemPriority(conflict);
            
            case 'latest_timestamp':
                // Use position with latest timestamp
                return this.resolveByTimestamp(conflict);
            
            case 'largest_value':
                // Use position with largest market value
                return this.resolveByValue(conflict);
            
            case 'manual':
                // Flag for manual resolution
                return {
                    strategy: 'manual',
                    status: 'pending_manual_review',
                    resolvedPosition: null
                };
            
            default:
                return this.resolveBySystemPriority(conflict);
        }
    }

    resolveBySystemPriority(conflict) {
        const priorityOrder = ['bloomberg_port', 'charles_river', 'aladdin', 'ftp'];
        
        for (const system of priorityOrder) {
            const position = conflict.positions.find(p => p._system === system);
            if (position) {
                return {
                    strategy: 'external_priority',
                    status: 'resolved',
                    resolvedPosition: position,
                    reason: `Selected position from ${system} based on system priority`
                };
            }
        }
        
        // Fallback to first position
        return {
            strategy: 'external_priority',
            status: 'resolved',
            resolvedPosition: conflict.positions[0],
            reason: 'Used first position as fallback'
        };
    }

    resolveByTimestamp(conflict) {
        const sortedPositions = conflict.positions.sort((a, b) => 
            new Date(b.as_of_date || b._transformedAt) - new Date(a.as_of_date || a._transformedAt)
        );
        
        return {
            strategy: 'latest_timestamp',
            status: 'resolved',
            resolvedPosition: sortedPositions[0],
            reason: 'Selected position with latest timestamp'
        };
    }

    resolveByValue(conflict) {
        const sortedPositions = conflict.positions.sort((a, b) => 
            (parseFloat(b.market_value) || 0) - (parseFloat(a.market_value) || 0)
        );
        
        return {
            strategy: 'largest_value',
            status: 'resolved',
            resolvedPosition: sortedPositions[0],
            reason: 'Selected position with largest market value'
        };
    }

    // Portfolio Updates
    async updatePortfolioPositions(portfolio, syncResults) {
        console.log(`📊 Updating positions for portfolio: ${portfolio.id}`);
        
        const newPositions = new Map();
        
        // Process all positions from sync results
        for (const result of syncResults) {
            for (const position of result.positions) {
                const securityId = position.security_id;
                
                // Check if there's a conflict resolution for this position
                const conflict = this.conflicts.find(c => 
                    c.securityId === securityId && 
                    c.resolution && 
                    c.resolution.status === 'resolved'
                );
                
                if (conflict) {
                    // Use resolved position
                    newPositions.set(securityId, conflict.resolution.resolvedPosition);
                } else {
                    // Use position as-is
                    newPositions.set(securityId, position);
                }
            }
        }
        
        // Update portfolio positions
        portfolio.positions = newPositions;
        
        // Store in database
        if (this.db.models.PortfolioPosition) {
            const positionData = Array.from(newPositions.values()).map(position => ({
                portfolioId: portfolio.id,
                securityId: position.security_id,
                securityName: position.security_name,
                position: parseFloat(position.position) || 0,
                marketValue: parseFloat(position.market_value) || 0,
                bookValue: parseFloat(position.book_value) || 0,
                currency: position.currency,
                sector: position.sector,
                country: position.country,
                asOfDate: position.as_of_date || new Date(),
                source: position._source,
                lastUpdated: new Date()
            }));
            
            // Clear existing positions and insert new ones
            await this.db.models.PortfolioPosition.deleteMany({
                where: { portfolioId: portfolio.id }
            });
            
            await this.db.models.PortfolioPosition.createMany({
                data: positionData
            });
        }
        
        console.log(`✅ Updated ${newPositions.size} positions for portfolio: ${portfolio.id}`);
    }

    // Scheduler
    startSyncScheduler() {
        console.log('⏰ Starting portfolio sync scheduler...');
        
        const interval = setInterval(async () => {
            try {
                await this.syncAllPortfolios();
            } catch (error) {
                console.error('❌ Scheduled sync failed:', error);
            }
        }, this.config.syncInterval);
        
        this.syncInterval = interval;
    }

    async syncAllPortfolios() {
        console.log('🔄 Running scheduled sync for all portfolios...');
        
        const syncPromises = [];
        
        for (const [portfolioId, portfolio] of this.portfolios) {
            if (portfolio.syncEnabled) {
                syncPromises.push(
                    this.syncPortfolio(portfolioId).catch(error => {
                        console.error(`❌ Sync failed for portfolio ${portfolioId}:`, error);
                    })
                );
            }
        }
        
        await Promise.allSettled(syncPromises);
        console.log('✅ Scheduled sync completed');
    }

    // Utility Methods
    calculateVariance(values) {
        if (values.length <= 1) return 0;
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
        
        return mean === 0 ? 0 : Math.sqrt(variance) / Math.abs(mean); // Coefficient of variation
    }

    async loadPortfolios() {
        console.log('📂 Loading existing portfolios...');
        
        try {
            if (this.db.models.Portfolio) {
                const portfolios = await this.db.models.Portfolio.findMany({
                    where: { syncEnabled: true }
                });
                
                for (const portfolioData of portfolios) {
                    const config = JSON.parse(portfolioData.config);
                    this.portfolios.set(portfolioData.id, config);
                    this.syncStatus.set(portfolioData.id, {
                        status: 'ready',
                        lastSync: portfolioData.lastSync,
                        nextSync: null,
                        errors: [],
                        conflicts: []
                    });
                }
                
                console.log(`📋 Loaded ${portfolios.length} portfolios`);
            }
        } catch (error) {
            console.warn('⚠️ Could not load portfolios from database:', error.message);
        }
    }

    // Mock data fetchers (would be replaced with actual API calls)
    async fetchBloombergPortPositions(portfolioId, portfolioCode) {
        // Mock Bloomberg PORT positions
        return [
            {
                ISIN: 'US0378331005',
                SECURITY_DES: 'APPLE INC',
                POSITION: 1000,
                MARKET_VALUE_BASE: 150000,
                BOOK_VALUE_BASE: 140000,
                BASE_CCY: 'USD',
                GICS_SECTOR_NAME: 'Information Technology',
                COUNTRY_ISO: 'US',
                PORT_ID: portfolioCode,
                AS_OF_DATE: new Date().toISOString().split('T')[0]
            }
        ];
    }

    async fetchCharlesRiverPositions(portfolioId, portfolioCode) {
        // Mock Charles River positions
        return [
            {
                SecurityId: 'US0378331005',
                SecurityName: 'Apple Inc',
                Quantity: 1000,
                MarketValue: 150000,
                BookValue: 140000,
                Currency: 'USD',
                Sector: 'Technology',
                Country: 'US',
                PortfolioCode: portfolioCode,
                AsOfDate: new Date().toISOString().split('T')[0]
            }
        ];
    }

    async fetchAladdinPositions(portfolioId, portfolioCode) {
        // Mock Aladdin positions
        return [
            {
                identifier: 'US0378331005',
                name: 'Apple Inc',
                shares: 1000,
                marketValue: 150000,
                costBasis: 140000,
                currency: 'USD',
                sector: 'Technology',
                country: 'US',
                portfolioId: portfolioCode,
                date: new Date().toISOString().split('T')[0]
            }
        ];
    }

    async fetchFTPPositions(portfolioId, filePath) {
        // Mock FTP file-based positions
        return [
            {
                'Security ID': 'US0378331005',
                'Security Name': 'Apple Inc',
                'Position': '1000',
                'Market Value': '150000',
                'Book Value': '140000',
                'Currency': 'USD',
                'Sector': 'Technology',
                'Country': 'US',
                'Portfolio': portfolioId,
                'Date': new Date().toISOString().split('T')[0]
            }
        ];
    }

    // API Methods
    getPortfolioStatus(portfolioId) {
        return {
            portfolio: this.portfolios.get(portfolioId),
            status: this.syncStatus.get(portfolioId)
        };
    }

    getAllPortfolioStatuses() {
        const statuses = {};
        for (const [portfolioId] of this.portfolios) {
            statuses[portfolioId] = this.getPortfolioStatus(portfolioId);
        }
        return statuses;
    }

    getConflicts(portfolioId = null) {
        if (portfolioId) {
            return this.conflicts.filter(c => c.portfolioId === portfolioId);
        }
        return this.conflicts;
    }

    getSyncHistory(portfolioId = null, limit = 100) {
        let history = this.syncHistory;
        if (portfolioId) {
            history = history.filter(h => h.portfolioId === portfolioId);
        }
        return history.slice(-limit);
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up portfolio sync...');
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // Close any open connections
        for (const [name, connector] of this.connectors) {
            if (connector.cleanup && typeof connector.cleanup === 'function') {
                await connector.cleanup();
            }
        }
        
        console.log('✅ Portfolio sync cleanup complete');
    }
}

module.exports = { PortfolioSync };