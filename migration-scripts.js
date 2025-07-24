/**
 * MIGRATION SCRIPTS
 * Database migration utilities for schema updates and data transformations
 * 
 * Features:
 * - Version-controlled migrations
 * - Rollback capabilities
 * - Data transformation utilities
 * - Cross-database compatibility
 */

const fs = require('fs').promises;
const path = require('path');

class MigrationManager {
    constructor(databaseManager) {
        this.db = databaseManager;
        this.migrationsPath = path.join(__dirname, 'migrations');
        this.migrationTable = 'schema_migrations';
        
        console.log('🔄 Migration Manager initialized');
    }

    async initialize() {
        console.log('🚀 Initializing migration system...');
        
        try {
            // Ensure migrations directory exists
            await fs.mkdir(this.migrationsPath, { recursive: true });
            
            // Create migration tracking table
            await this.createMigrationTable();
            
            console.log('✅ Migration system ready');
            
        } catch (error) {
            console.error('❌ Migration initialization failed:', error);
            throw error;
        }
    }

    async createMigrationTable() {
        try {
            if (this.db.config.provider === 'postgresql') {
                await this.db.connection.$executeRaw`
                    CREATE TABLE IF NOT EXISTS schema_migrations (
                        id SERIAL PRIMARY KEY,
                        version VARCHAR(255) UNIQUE NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        execution_time INTEGER,
                        checksum VARCHAR(255)
                    )
                `;
            } else if (this.db.config.provider === 'sqlite') {
                await this.db.connection.exec(`
                    CREATE TABLE IF NOT EXISTS schema_migrations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        version TEXT UNIQUE NOT NULL,
                        name TEXT NOT NULL,
                        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        execution_time INTEGER,
                        checksum TEXT
                    )
                `);
            }
            // MongoDB doesn't need a migration table (document-based tracking)
            
            console.log('📋 Migration tracking table ready');
            
        } catch (error) {
            console.warn('⚠️ Could not create migration table:', error.message);
        }
    }

    async generateMigration(name, type = 'general') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const version = timestamp.replace(/[-T]/g, '');
        const filename = `${version}_${name.toLowerCase().replace(/\s+/g, '_')}.js`;
        const filepath = path.join(this.migrationsPath, filename);
        
        let template = '';
        
        switch (type) {
            case 'create_table':
                template = this.getCreateTableTemplate(name);
                break;
            case 'add_column':
                template = this.getAddColumnTemplate(name);
                break;
            case 'data_transform':
                template = this.getDataTransformTemplate(name);
                break;
            default:
                template = this.getGeneralTemplate(name);
                break;
        }
        
        await fs.writeFile(filepath, template);
        
        console.log(`📝 Migration created: ${filename}`);
        return filepath;
    }

    getGeneralTemplate(name) {
        return `/**
 * Migration: ${name}
 * Created: ${new Date().toISOString()}
 */

module.exports = {
    async up(db, provider) {
        console.log('⬆️ Running migration: ${name}');
        
        try {
            if (provider === 'postgresql') {
                // PostgreSQL migration code
                await db.$executeRaw\`
                    -- Add your PostgreSQL migration code here
                \`;
                
            } else if (provider === 'mongodb') {
                // MongoDB migration code
                // Example: await db.collection('users').updateMany({}, { $set: { newField: 'defaultValue' } });
                
            } else if (provider === 'sqlite') {
                // SQLite migration code
                await db.exec(\`
                    -- Add your SQLite migration code here
                \`);
            }
            
            console.log('✅ Migration completed: ${name}');
            
        } catch (error) {
            console.error('❌ Migration failed: ${name}', error);
            throw error;
        }
    },

    async down(db, provider) {
        console.log('⬇️ Rolling back migration: ${name}');
        
        try {
            if (provider === 'postgresql') {
                // PostgreSQL rollback code
                await db.$executeRaw\`
                    -- Add your PostgreSQL rollback code here
                \`;
                
            } else if (provider === 'mongodb') {
                // MongoDB rollback code
                
            } else if (provider === 'sqlite') {
                // SQLite rollback code
                await db.exec(\`
                    -- Add your SQLite rollback code here
                \`);
            }
            
            console.log('✅ Rollback completed: ${name}');
            
        } catch (error) {
            console.error('❌ Rollback failed: ${name}', error);
            throw error;
        }
    }
};`;
    }

    getCreateTableTemplate(tableName) {
        return `/**
 * Migration: Create ${tableName} table
 * Created: ${new Date().toISOString()}
 */

module.exports = {
    async up(db, provider) {
        console.log('⬆️ Creating table: ${tableName}');
        
        try {
            if (provider === 'postgresql') {
                await db.$executeRaw\`
                    CREATE TABLE ${tableName} (
                        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        -- Add your columns here
                    )
                \`;
                
            } else if (provider === 'sqlite') {
                await db.exec(\`
                    CREATE TABLE ${tableName} (
                        id TEXT PRIMARY KEY,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        -- Add your columns here
                    )
                \`);
            }
            
            console.log('✅ Table created: ${tableName}');
            
        } catch (error) {
            console.error('❌ Table creation failed: ${tableName}', error);
            throw error;
        }
    },

    async down(db, provider) {
        console.log('⬇️ Dropping table: ${tableName}');
        
        try {
            if (provider === 'postgresql') {
                await db.$executeRaw\`DROP TABLE IF EXISTS ${tableName}\`;
            } else if (provider === 'sqlite') {
                await db.exec('DROP TABLE IF EXISTS ${tableName}');
            }
            
            console.log('✅ Table dropped: ${tableName}');
            
        } catch (error) {
            console.error('❌ Table drop failed: ${tableName}', error);
            throw error;
        }
    }
};`;
    }

    getAddColumnTemplate(columnName) {
        return `/**
 * Migration: Add ${columnName} column
 * Created: ${new Date().toISOString()}
 */

module.exports = {
    async up(db, provider) {
        console.log('⬆️ Adding column: ${columnName}');
        
        try {
            if (provider === 'postgresql') {
                await db.$executeRaw\`
                    ALTER TABLE your_table_name 
                    ADD COLUMN ${columnName} TEXT
                \`;
                
            } else if (provider === 'sqlite') {
                await db.exec(\`
                    ALTER TABLE your_table_name 
                    ADD COLUMN ${columnName} TEXT
                \`);
            }
            
            console.log('✅ Column added: ${columnName}');
            
        } catch (error) {
            console.error('❌ Column addition failed: ${columnName}', error);
            throw error;
        }
    },

    async down(db, provider) {
        console.log('⬇️ Removing column: ${columnName}');
        
        try {
            if (provider === 'postgresql') {
                await db.$executeRaw\`
                    ALTER TABLE your_table_name 
                    DROP COLUMN ${columnName}
                \`;
            } else if (provider === 'sqlite') {
                // SQLite doesn't support DROP COLUMN directly
                console.warn('⚠️ SQLite does not support dropping columns directly');
            }
            
            console.log('✅ Column removed: ${columnName}');
            
        } catch (error) {
            console.error('❌ Column removal failed: ${columnName}', error);
            throw error;
        }
    }
};`;
    }

    getDataTransformTemplate(transformName) {
        return `/**
 * Migration: Data transformation - ${transformName}
 * Created: ${new Date().toISOString()}
 */

module.exports = {
    async up(db, provider) {
        console.log('⬆️ Running data transformation: ${transformName}');
        
        try {
            if (provider === 'postgresql') {
                // Example: Update existing data
                await db.$executeRaw\`
                    UPDATE your_table 
                    SET column_name = CASE 
                        WHEN condition THEN new_value
                        ELSE old_value
                    END
                \`;
                
            } else if (provider === 'mongodb') {
                // MongoDB data transformation
                const collection = db.collection('your_collection');
                
                // Example: Bulk update
                await collection.updateMany(
                    { /* your filter */ },
                    { $set: { /* your update */ } }
                );
                
            } else if (provider === 'sqlite') {
                await db.exec(\`
                    UPDATE your_table 
                    SET column_name = new_value 
                    WHERE condition
                \`);
            }
            
            console.log('✅ Data transformation completed: ${transformName}');
            
        } catch (error) {
            console.error('❌ Data transformation failed: ${transformName}', error);
            throw error;
        }
    },

    async down(db, provider) {
        console.log('⬇️ Reversing data transformation: ${transformName}');
        
        try {
            // Add rollback logic here
            console.log('✅ Data transformation reversed: ${transformName}');
            
        } catch (error) {
            console.error('❌ Data transformation rollback failed: ${transformName}', error);
            throw error;
        }
    }
};`;
    }

    async getMigrationFiles() {
        try {
            const files = await fs.readdir(this.migrationsPath);
            return files
                .filter(file => file.endsWith('.js'))
                .sort()
                .map(file => ({
                    file,
                    version: file.split('_')[0],
                    name: file.replace(/^\d+_/, '').replace(/\.js$/, ''),
                    path: path.join(this.migrationsPath, file)
                }));
        } catch (error) {
            console.warn('⚠️ Could not read migrations directory:', error.message);
            return [];
        }
    }

    async getExecutedMigrations() {
        try {
            if (this.db.config.provider === 'postgresql') {
                const result = await this.db.connection.$queryRaw`
                    SELECT version, name, executed_at, execution_time 
                    FROM schema_migrations 
                    ORDER BY version
                `;
                return result;
                
            } else if (this.db.config.provider === 'sqlite') {
                const result = await this.db.connection.all(
                    'SELECT version, name, executed_at, execution_time FROM schema_migrations ORDER BY version'
                );
                return result;
                
            } else if (this.db.config.provider === 'mongodb') {
                // Use a collection to track migrations
                const migrationsCollection = this.db.connection.db.collection('schema_migrations');
                return await migrationsCollection.find({}).sort({ version: 1 }).toArray();
            }
            
            return [];
            
        } catch (error) {
            console.warn('⚠️ Could not get executed migrations:', error.message);
            return [];
        }
    }

    async runMigrations(targetVersion = null) {
        console.log('🚀 Running migrations...');
        
        try {
            const migrationFiles = await this.getMigrationFiles();
            const executedMigrations = await this.getExecutedMigrations();
            const executedVersions = new Set(executedMigrations.map(m => m.version));
            
            let migrationsToRun = migrationFiles.filter(m => !executedVersions.has(m.version));
            
            if (targetVersion) {
                migrationsToRun = migrationsToRun.filter(m => m.version <= targetVersion);
            }
            
            if (migrationsToRun.length === 0) {
                console.log('✅ No migrations to run');
                return;
            }
            
            console.log(`📋 Found ${migrationsToRun.length} migrations to run`);
            
            for (const migration of migrationsToRun) {
                await this.runSingleMigration(migration);
            }
            
            console.log('✅ All migrations completed successfully');
            
        } catch (error) {
            console.error('❌ Migration run failed:', error);
            throw error;
        }
    }

    async runSingleMigration(migration) {
        const startTime = Date.now();
        
        try {
            console.log(`⬆️ Running migration: ${migration.name}`);
            
            // Load and execute migration
            const migrationModule = require(migration.path);
            await migrationModule.up(this.db.connection, this.db.config.provider);
            
            const executionTime = Date.now() - startTime;
            
            // Record successful execution
            await this.recordMigration(migration.version, migration.name, executionTime);
            
            console.log(`✅ Migration completed: ${migration.name} (${executionTime}ms)`);
            
        } catch (error) {
            console.error(`❌ Migration failed: ${migration.name}`, error);
            throw error;
        }
    }

    async recordMigration(version, name, executionTime) {
        try {
            if (this.db.config.provider === 'postgresql') {
                await this.db.connection.$executeRaw`
                    INSERT INTO schema_migrations (version, name, execution_time)
                    VALUES (${version}, ${name}, ${executionTime})
                `;
                
            } else if (this.db.config.provider === 'sqlite') {
                await this.db.connection.run(
                    'INSERT INTO schema_migrations (version, name, execution_time) VALUES (?, ?, ?)',
                    [version, name, executionTime]
                );
                
            } else if (this.db.config.provider === 'mongodb') {
                const migrationsCollection = this.db.connection.db.collection('schema_migrations');
                await migrationsCollection.insertOne({
                    version,
                    name,
                    executedAt: new Date(),
                    executionTime
                });
            }
            
        } catch (error) {
            console.warn('⚠️ Could not record migration:', error.message);
        }
    }

    async rollbackMigration(version) {
        console.log(`⬇️ Rolling back migration: ${version}`);
        
        try {
            const migrationFiles = await this.getMigrationFiles();
            const migration = migrationFiles.find(m => m.version === version);
            
            if (!migration) {
                throw new Error(`Migration not found: ${version}`);
            }
            
            // Load and execute rollback
            const migrationModule = require(migration.path);
            await migrationModule.down(this.db.connection, this.db.config.provider);
            
            // Remove from migration records
            await this.removeMigrationRecord(version);
            
            console.log(`✅ Migration rolled back: ${migration.name}`);
            
        } catch (error) {
            console.error(`❌ Rollback failed: ${version}`, error);
            throw error;
        }
    }

    async removeMigrationRecord(version) {
        try {
            if (this.db.config.provider === 'postgresql') {
                await this.db.connection.$executeRaw`
                    DELETE FROM schema_migrations WHERE version = ${version}
                `;
                
            } else if (this.db.config.provider === 'sqlite') {
                await this.db.connection.run(
                    'DELETE FROM schema_migrations WHERE version = ?',
                    [version]
                );
                
            } else if (this.db.config.provider === 'mongodb') {
                const migrationsCollection = this.db.connection.db.collection('schema_migrations');
                await migrationsCollection.deleteOne({ version });
            }
            
        } catch (error) {
            console.warn('⚠️ Could not remove migration record:', error.message);
        }
    }

    async getMigrationStatus() {
        const migrationFiles = await this.getMigrationFiles();
        const executedMigrations = await this.getExecutedMigrations();
        const executedVersions = new Set(executedMigrations.map(m => m.version));
        
        return {
            total: migrationFiles.length,
            executed: executedMigrations.length,
            pending: migrationFiles.filter(m => !executedVersions.has(m.version)).length,
            migrations: migrationFiles.map(migration => ({
                ...migration,
                executed: executedVersions.has(migration.version),
                executedAt: executedMigrations.find(m => m.version === migration.version)?.executed_at
            }))
        };
    }

    async createInitialMigrations() {
        console.log('📝 Creating initial migrations...');
        
        const migrations = [
            { name: 'create_users_table', type: 'create_table' },
            { name: 'create_documents_table', type: 'create_table' },
            { name: 'create_securities_table', type: 'create_table' },
            { name: 'create_annotations_table', type: 'create_table' },
            { name: 'create_patterns_table', type: 'create_table' },
            { name: 'create_analytics_table', type: 'create_table' }
        ];
        
        for (const migration of migrations) {
            await this.generateMigration(migration.name, migration.type);
        }
        
        console.log('✅ Initial migrations created');
    }
}

// Example migration files for Smart OCR system
const exampleMigrations = {
    // Initial Smart OCR schema
    '20250721_001_create_smart_ocr_schema.js': `
module.exports = {
    async up(db, provider) {
        if (provider === 'postgresql') {
            // Create comprehensive Smart OCR schema
            await db.$executeRaw\`
                -- Users table
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role VARCHAR(50) DEFAULT 'user',
                    active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    profile JSONB
                );

                -- Documents table
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
                    user_id TEXT NOT NULL REFERENCES users(id),
                    filename VARCHAR(255) NOT NULL,
                    original_name VARCHAR(255) NOT NULL,
                    file_size BIGINT,
                    mime_type VARCHAR(100),
                    file_hash VARCHAR(255) UNIQUE,
                    document_type VARCHAR(100),
                    status VARCHAR(50) DEFAULT 'uploaded',
                    extraction_results JSONB,
                    accuracy DECIMAL(5,2),
                    total_securities INTEGER,
                    total_value DECIMAL(15,2),
                    currency VARCHAR(3),
                    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed_at TIMESTAMP
                );

                -- Securities table
                CREATE TABLE IF NOT EXISTS securities (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
                    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                    isin VARCHAR(12) NOT NULL,
                    name TEXT,
                    market_value DECIMAL(15,2),
                    currency VARCHAR(3) DEFAULT 'CHF',
                    percentage DECIMAL(5,2),
                    confidence DECIMAL(3,2),
                    method VARCHAR(100),
                    page_number INTEGER,
                    coordinates JSONB,
                    validated BOOLEAN DEFAULT false,
                    corrected BOOLEAN DEFAULT false,
                    flagged BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Annotations table
                CREATE TABLE IF NOT EXISTS annotations (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
                    user_id TEXT NOT NULL REFERENCES users(id),
                    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                    security_id TEXT REFERENCES securities(id) ON DELETE SET NULL,
                    type VARCHAR(50) NOT NULL,
                    field VARCHAR(50),
                    original_value TEXT,
                    corrected_value TEXT,
                    reason TEXT,
                    confidence DECIMAL(3,2),
                    pattern_created BOOLEAN DEFAULT false,
                    global_pattern BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Patterns table
                CREATE TABLE IF NOT EXISTS patterns (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
                    document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
                    type VARCHAR(100) NOT NULL,
                    pattern TEXT NOT NULL,
                    replacement TEXT,
                    confidence DECIMAL(3,2) DEFAULT 0.5,
                    times_used INTEGER DEFAULT 0,
                    success_rate DECIMAL(3,2) DEFAULT 0.0,
                    global BOOLEAN DEFAULT false,
                    document_type VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Analytics table
                CREATE TABLE IF NOT EXISTS analytics (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
                    date DATE DEFAULT CURRENT_DATE,
                    documents_processed INTEGER DEFAULT 0,
                    securities_extracted INTEGER DEFAULT 0,
                    average_accuracy DECIMAL(5,2),
                    average_processing_time DECIMAL(8,2),
                    annotations_created INTEGER DEFAULT 0,
                    patterns_generated INTEGER DEFAULT 0,
                    accuracy_improvement DECIMAL(5,2),
                    active_users INTEGER DEFAULT 0,
                    api_calls INTEGER DEFAULT 0,
                    mistral_api_cost DECIMAL(10,2),
                    total_cost_saving DECIMAL(10,2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Create indexes for performance
                CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
                CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
                CREATE INDEX IF NOT EXISTS idx_securities_document_id ON securities(document_id);
                CREATE INDEX IF NOT EXISTS idx_securities_isin ON securities(isin);
                CREATE INDEX IF NOT EXISTS idx_annotations_document_id ON annotations(document_id);
                CREATE INDEX IF NOT EXISTS idx_patterns_type ON patterns(type);
                CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);
            \`;
        }
    },

    async down(db, provider) {
        if (provider === 'postgresql') {
            await db.$executeRaw\`
                DROP TABLE IF EXISTS analytics CASCADE;
                DROP TABLE IF EXISTS patterns CASCADE;
                DROP TABLE IF EXISTS annotations CASCADE;
                DROP TABLE IF EXISTS securities CASCADE;
                DROP TABLE IF EXISTS documents CASCADE;
                DROP TABLE IF EXISTS users CASCADE;
            \`;
        }
    }
};`,

    // Add user sessions and API keys
    '20250721_002_add_user_sessions_and_api_keys.js': `
module.exports = {
    async up(db, provider) {
        if (provider === 'postgresql') {
            await db.$executeRaw\`
                -- User sessions table
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    token VARCHAR(255) UNIQUE NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    ip_address INET,
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- API keys table
                CREATE TABLE IF NOT EXISTS api_keys (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    key VARCHAR(255) UNIQUE NOT NULL,
                    permissions TEXT[] DEFAULT '{}',
                    active BOOLEAN DEFAULT true,
                    expires_at TIMESTAMP,
                    last_used_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Create indexes
                CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
                CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
                CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
                CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
            \`;
        }
    },

    async down(db, provider) {
        if (provider === 'postgresql') {
            await db.$executeRaw\`
                DROP TABLE IF EXISTS api_keys CASCADE;
                DROP TABLE IF EXISTS user_sessions CASCADE;
            \`;
        }
    }
};`
};

module.exports = { MigrationManager, exampleMigrations };