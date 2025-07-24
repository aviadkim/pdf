/**
 * DATABASE MANAGER
 * Comprehensive database management for persistent data storage
 * 
 * Features:
 * - PostgreSQL with Prisma ORM integration
 * - MongoDB with Mongoose fallback option  
 * - Document history tracking
 * - Pattern storage and learning data
 * - User management and analytics
 * - Migration and backup support
 */

const fs = require('fs').promises;
const path = require('path');

class DatabaseManager {
    constructor(options = {}) {
        this.config = {
            provider: options.provider || 'postgresql', // 'postgresql' | 'mongodb' | 'sqlite'
            connectionString: options.connectionString || process.env.DATABASE_URL,
            maxConnections: options.maxConnections || 20,
            timeout: options.timeout || 30000,
            ssl: options.ssl !== false,
            logging: options.logging !== false
        };
        
        this.connection = null;
        this.models = {};
        this.isConnected = false;
        
        console.log('🗄️ Database Manager initialized');
        console.log(`📊 Provider: ${this.config.provider}`);
    }

    async initialize() {
        console.log('🚀 Initializing database connection...');
        
        try {
            switch (this.config.provider) {
                case 'postgresql':
                    await this.initializePostgreSQL();
                    break;
                case 'mongodb':
                    await this.initializeMongoDB();
                    break;
                case 'sqlite':
                    await this.initializeSQLite();
                    break;
                default:
                    throw new Error(`Unsupported database provider: ${this.config.provider}`);
            }
            
            await this.setupModels();
            await this.runMigrations();
            
            this.isConnected = true;
            console.log('✅ Database connection established successfully');
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    async initializePostgreSQL() {
        console.log('🐘 Setting up PostgreSQL with Prisma...');
        
        // Create Prisma schema if it doesn't exist
        await this.createPrismaSchema();
        
        // Initialize Prisma client
        try {
            const { PrismaClient } = await this.loadPrismaClient();
            this.connection = new PrismaClient({
                log: this.config.logging ? ['query', 'info', 'warn', 'error'] : [],
                datasources: {
                    db: {
                        url: this.config.connectionString
                    }
                }
            });
            
            // Test connection
            await this.connection.$connect();
            console.log('✅ PostgreSQL connection established');
            
        } catch (error) {
            console.error('❌ PostgreSQL connection failed:', error);
            throw error;
        }
    }

    async initializeMongoDB() {
        console.log('🍃 Setting up MongoDB with Mongoose...');
        
        try {
            const mongoose = require('mongoose');
            
            mongoose.set('strictQuery', false);
            
            await mongoose.connect(this.config.connectionString, {
                maxPoolSize: this.config.maxConnections,
                serverSelectionTimeoutMS: this.config.timeout,
                socketTimeoutMS: this.config.timeout
            });
            
            this.connection = mongoose.connection;
            
            this.connection.on('error', (error) => {
                console.error('MongoDB connection error:', error);
            });
            
            this.connection.on('disconnected', () => {
                console.warn('⚠️ MongoDB disconnected');
            });
            
            console.log('✅ MongoDB connection established');
            
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            throw error;
        }
    }

    async initializeSQLite() {
        console.log('📁 Setting up SQLite...');
        
        try {
            const sqlite3 = require('sqlite3').verbose();
            const { open } = require('sqlite');
            
            this.connection = await open({
                filename: this.config.connectionString || './smart_ocr.db',
                driver: sqlite3.Database
            });
            
            console.log('✅ SQLite connection established');
            
        } catch (error) {
            console.error('❌ SQLite connection failed:', error);
            throw error;
        }
    }

    async createPrismaSchema() {
        const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
        const schemaDir = path.dirname(schemaPath);
        
        try {
            await fs.mkdir(schemaDir, { recursive: true });
        } catch (error) {
            // Directory already exists
        }
        
        const schemaContent = `
// Prisma Schema for Smart OCR Learning System
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Users and Authentication
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  username    String   @unique
  password    String   // hashed
  role        String   @default("user") // admin, expert, user
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  lastLoginAt DateTime?
  
  // Profile Information
  firstName   String?
  lastName    String?
  company     String?
  department  String?
  expertise   String[] // financial, risk_analysis, compliance
  
  // Relationships
  documents   Document[]
  annotations Annotation[]
  sessions    UserSession[]
  apiKeys     ApiKey[]
  
  @@map("users")
}

model UserSession {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  ipAddress String?
  userAgent String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_sessions")
}

model ApiKey {
  id          String   @id @default(cuid())
  userId      String
  name        String
  key         String   @unique
  permissions String[] // read, write, admin
  active      Boolean  @default(true)
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("api_keys")
}

// Document Management
model Document {
  id            String   @id @default(cuid())
  userId        String
  filename      String
  originalName  String
  fileSize      Int
  mimeType      String
  fileHash      String   @unique
  uploadedAt    DateTime @default(now())
  processedAt   DateTime?
  
  // Document Metadata
  documentType  String?   // portfolio_statement, trade_confirmation, etc.
  source        String?   // upload, api, email
  tags          String[]
  
  // Processing Status
  status        String   @default("uploaded") // uploaded, processing, completed, failed
  processingLog Json?
  
  // Results
  extractionResults Json?
  accuracy         Float?
  totalSecurities  Int?
  totalValue       Decimal?
  currency         String?
  
  // Relationships
  user        User         @relation(fields: [userId], references: [id])
  securities  Security[]
  annotations Annotation[]
  patterns    Pattern[]
  
  @@map("documents")
}

// Financial Securities
model Security {
  id          String   @id @default(cuid())
  documentId  String
  isin        String
  name        String?
  marketValue Decimal?
  currency    String   @default("CHF")
  percentage  Float?
  
  // Extraction Metadata
  confidence    Float?
  method        String? // mistral_ocr, text_extraction, manual
  pageNumber    Int?
  coordinates   Json?   // x, y, width, height
  extractedText String?
  
  // Validation Status
  validated     Boolean @default(false)
  corrected     Boolean @default(false)
  flagged       Boolean @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationships
  document    Document     @relation(fields: [documentId], references: [id], onDelete: Cascade)
  annotations Annotation[]
  
  @@map("securities")
}

// Human Annotations and Corrections
model Annotation {
  id         String   @id @default(cuid())
  userId     String
  documentId String
  securityId String?
  
  // Annotation Type
  type       String   // correction, flag, validation, note
  field      String?  // isin, name, value, currency
  
  // Original and Corrected Values
  originalValue  String?
  correctedValue String?
  reason         String?
  confidence     Float?
  
  // Learning Impact
  patternCreated Boolean @default(false)
  globalPattern  Boolean @default(false)
  
  createdAt DateTime @default(now())
  
  // Relationships
  user     User      @relation(fields: [userId], references: [id])
  document Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  security Security? @relation(fields: [securityId], references: [id], onDelete: SetNull)
  
  @@map("annotations")
}

// Learning Patterns
model Pattern {
  id          String   @id @default(cuid())
  documentId  String?
  
  // Pattern Information
  type        String   // text_correction, value_format, table_structure
  pattern     String   // regex or description
  replacement String?
  confidence  Float    @default(0.5)
  
  // Usage Statistics
  timesUsed   Int      @default(0)
  successRate Float    @default(0.0)
  
  // Scope
  global      Boolean  @default(false)
  documentType String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relationships
  document Document? @relation(fields: [documentId], references: [id], onDelete: SetNull)
  
  @@map("patterns")
}

// Analytics and Metrics
model Analytics {
  id        String   @id @default(cuid())
  date      DateTime @default(now())
  
  // Processing Metrics
  documentsProcessed Int @default(0)
  securitiesExtracted Int @default(0)
  averageAccuracy    Float?
  averageProcessingTime Float? // in seconds
  
  // Learning Metrics
  annotationsCreated Int @default(0)
  patternsGenerated  Int @default(0)
  accuracyImprovement Float?
  
  // User Activity
  activeUsers        Int @default(0)
  apiCalls          Int @default(0)
  
  // Cost Metrics
  mistralApiCost    Decimal?
  totalCostSaving   Decimal?
  
  @@map("analytics")
}

// System Configuration
model SystemConfig {
  id    String @id @default(cuid())
  key   String @unique
  value Json
  description String?
  updatedAt DateTime @updatedAt
  
  @@map("system_config")
}
`;
        
        try {
            await fs.writeFile(schemaPath, schemaContent.trim());
            console.log('📄 Prisma schema created successfully');
        } catch (error) {
            console.warn('⚠️ Could not create Prisma schema:', error.message);
        }
    }

    async loadPrismaClient() {
        try {
            return require('@prisma/client');
        } catch (error) {
            console.warn('⚠️ Prisma client not found, installing...');
            
            // Fallback to dynamic import or installation
            const { exec } = require('child_process');
            return new Promise((resolve, reject) => {
                exec('npm install @prisma/client', (error) => {
                    if (error) {
                        reject(new Error('Failed to install Prisma client'));
                    } else {
                        try {
                            resolve(require('@prisma/client'));
                        } catch (requireError) {
                            reject(requireError);
                        }
                    }
                });
            });
        }
    }

    async setupModels() {
        console.log('📋 Setting up database models...');
        
        if (this.config.provider === 'postgresql') {
            // Prisma models are generated from schema
            this.models = {
                User: this.connection.user,
                Document: this.connection.document,
                Security: this.connection.security,
                Annotation: this.connection.annotation,
                Pattern: this.connection.pattern,
                Analytics: this.connection.analytics,
                SystemConfig: this.connection.systemConfig
            };
        } else if (this.config.provider === 'mongodb') {
            await this.setupMongooseModels();
        } else if (this.config.provider === 'sqlite') {
            await this.setupSQLiteModels();
        }
        
        console.log('✅ Database models configured');
    }

    async setupMongooseModels() {
        const mongoose = require('mongoose');
        
        // User Schema
        const userSchema = new mongoose.Schema({
            email: { type: String, required: true, unique: true },
            username: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            role: { type: String, default: 'user' },
            active: { type: Boolean, default: true },
            profile: {
                firstName: String,
                lastName: String,
                company: String,
                department: String,
                expertise: [String]
            }
        }, { timestamps: true });
        
        // Document Schema
        const documentSchema = new mongoose.Schema({
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            filename: { type: String, required: true },
            originalName: { type: String, required: true },
            fileSize: Number,
            mimeType: String,
            fileHash: { type: String, unique: true },
            documentType: String,
            status: { type: String, default: 'uploaded' },
            extractionResults: mongoose.Schema.Types.Mixed,
            accuracy: Number,
            totalSecurities: Number,
            totalValue: Number,
            currency: String
        }, { timestamps: true });
        
        // Security Schema
        const securitySchema = new mongoose.Schema({
            documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
            isin: { type: String, required: true },
            name: String,
            marketValue: Number,
            currency: { type: String, default: 'CHF' },
            percentage: Number,
            confidence: Number,
            method: String,
            pageNumber: Number,
            coordinates: mongoose.Schema.Types.Mixed,
            validated: { type: Boolean, default: false },
            corrected: { type: Boolean, default: false },
            flagged: { type: Boolean, default: false }
        }, { timestamps: true });
        
        // Annotation Schema
        const annotationSchema = new mongoose.Schema({
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
            securityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Security' },
            type: { type: String, required: true },
            field: String,
            originalValue: String,
            correctedValue: String,
            reason: String,
            confidence: Number,
            patternCreated: { type: Boolean, default: false },
            globalPattern: { type: Boolean, default: false }
        }, { timestamps: true });
        
        // Pattern Schema
        const patternSchema = new mongoose.Schema({
            documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
            type: { type: String, required: true },
            pattern: { type: String, required: true },
            replacement: String,
            confidence: { type: Number, default: 0.5 },
            timesUsed: { type: Number, default: 0 },
            successRate: { type: Number, default: 0.0 },
            global: { type: Boolean, default: false },
            documentType: String
        }, { timestamps: true });
        
        this.models = {
            User: mongoose.model('User', userSchema),
            Document: mongoose.model('Document', documentSchema),
            Security: mongoose.model('Security', securitySchema),
            Annotation: mongoose.model('Annotation', annotationSchema),
            Pattern: mongoose.model('Pattern', patternSchema)
        };
    }

    async runMigrations() {
        console.log('🔄 Running database migrations...');
        
        try {
            if (this.config.provider === 'postgresql') {
                // Run Prisma migrations
                const { exec } = require('child_process');
                await new Promise((resolve, reject) => {
                    exec('npx prisma migrate deploy', (error, stdout, stderr) => {
                        if (error) {
                            console.warn('⚠️ Prisma migration warning:', error.message);
                            resolve(); // Continue even if migrations fail
                        } else {
                            console.log('✅ Prisma migrations completed');
                            resolve();
                        }
                    });
                });
            } else if (this.config.provider === 'sqlite') {
                await this.runSQLiteMigrations();
            }
            // MongoDB doesn't need migrations as it's schema-less
            
        } catch (error) {
            console.warn('⚠️ Migration warning:', error.message);
            // Continue without migrations for now
        }
    }

    async runSQLiteMigrations() {
        const migrations = [
            `CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                original_name TEXT NOT NULL,
                file_size INTEGER,
                mime_type TEXT,
                file_hash TEXT UNIQUE,
                status TEXT DEFAULT 'uploaded',
                extraction_results TEXT,
                accuracy REAL,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,
            `CREATE TABLE IF NOT EXISTS securities (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL,
                isin TEXT NOT NULL,
                name TEXT,
                market_value REAL,
                currency TEXT DEFAULT 'CHF',
                confidence REAL,
                validated BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (document_id) REFERENCES documents (id)
            )`
        ];
        
        for (const migration of migrations) {
            await this.connection.exec(migration);
        }
        
        console.log('✅ SQLite migrations completed');
    }

    // User Management Methods
    async createUser(userData) {
        console.log('👤 Creating new user...');
        
        try {
            const user = await this.models.User.create({
                ...userData,
                password: await this.hashPassword(userData.password)
            });
            
            console.log(`✅ User created: ${user.email}`);
            return user;
            
        } catch (error) {
            console.error('❌ User creation failed:', error);
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            if (this.config.provider === 'mongodb') {
                return await this.models.User.findOne({ email });
            } else {
                return await this.models.User.findUnique({ where: { email } });
            }
        } catch (error) {
            console.error('❌ User lookup failed:', error);
            throw error;
        }
    }

    async updateUser(userId, updateData) {
        try {
            if (this.config.provider === 'mongodb') {
                return await this.models.User.findByIdAndUpdate(userId, updateData, { new: true });
            } else {
                return await this.models.User.update({
                    where: { id: userId },
                    data: updateData
                });
            }
        } catch (error) {
            console.error('❌ User update failed:', error);
            throw error;
        }
    }

    // Document Management Methods
    async saveDocument(documentData) {
        console.log('📄 Saving document to database...');
        
        try {
            const document = await this.models.Document.create(documentData);
            console.log(`✅ Document saved: ${document.id}`);
            return document;
            
        } catch (error) {
            console.error('❌ Document save failed:', error);
            throw error;
        }
    }

    async getDocument(documentId) {
        try {
            if (this.config.provider === 'mongodb') {
                return await this.models.Document.findById(documentId)
                    .populate('securities')
                    .populate('annotations');
            } else {
                return await this.models.Document.findUnique({
                    where: { id: documentId },
                    include: {
                        securities: true,
                        annotations: true
                    }
                });
            }
        } catch (error) {
            console.error('❌ Document lookup failed:', error);
            throw error;
        }
    }

    async getDocumentsByUser(userId, options = {}) {
        const { limit = 50, offset = 0, status } = options;
        
        try {
            let query = { userId };
            if (status) query.status = status;
            
            if (this.config.provider === 'mongodb') {
                return await this.models.Document.find(query)
                    .limit(limit)
                    .skip(offset)
                    .sort({ createdAt: -1 });
            } else {
                return await this.models.Document.findMany({
                    where: query,
                    take: limit,
                    skip: offset,
                    orderBy: { createdAt: 'desc' }
                });
            }
        } catch (error) {
            console.error('❌ Document query failed:', error);
            throw error;
        }
    }

    // Security Management Methods
    async saveSecurities(documentId, securities) {
        console.log(`💰 Saving ${securities.length} securities...`);
        
        try {
            const savedSecurities = [];
            
            for (const security of securities) {
                const securityData = {
                    documentId,
                    ...security
                };
                
                const saved = await this.models.Security.create(securityData);
                savedSecurities.push(saved);
            }
            
            console.log(`✅ ${savedSecurities.length} securities saved`);
            return savedSecurities;
            
        } catch (error) {
            console.error('❌ Securities save failed:', error);
            throw error;
        }
    }

    async getSecurities(documentId) {
        try {
            if (this.config.provider === 'mongodb') {
                return await this.models.Security.find({ documentId });
            } else {
                return await this.models.Security.findMany({
                    where: { documentId }
                });
            }
        } catch (error) {
            console.error('❌ Securities lookup failed:', error);
            throw error;
        }
    }

    // Annotation Management Methods
    async saveAnnotation(annotationData) {
        console.log('📝 Saving annotation...');
        
        try {
            const annotation = await this.models.Annotation.create(annotationData);
            console.log(`✅ Annotation saved: ${annotation.id}`);
            return annotation;
            
        } catch (error) {
            console.error('❌ Annotation save failed:', error);
            throw error;
        }
    }

    async getAnnotations(documentId) {
        try {
            if (this.config.provider === 'mongodb') {
                return await this.models.Annotation.find({ documentId });
            } else {
                return await this.models.Annotation.findMany({
                    where: { documentId }
                });
            }
        } catch (error) {
            console.error('❌ Annotations lookup failed:', error);
            throw error;
        }
    }

    // Pattern Management Methods
    async savePattern(patternData) {
        console.log('🧠 Saving learning pattern...');
        
        try {
            const pattern = await this.models.Pattern.create(patternData);
            console.log(`✅ Pattern saved: ${pattern.id}`);
            return pattern;
            
        } catch (error) {
            console.error('❌ Pattern save failed:', error);
            throw error;
        }
    }

    async getPatterns(options = {}) {
        const { global = true, documentType } = options;
        
        try {
            let query = {};
            if (global !== null) query.global = global;
            if (documentType) query.documentType = documentType;
            
            if (this.config.provider === 'mongodb') {
                return await this.models.Pattern.find(query).sort({ successRate: -1 });
            } else {
                return await this.models.Pattern.findMany({
                    where: query,
                    orderBy: { successRate: 'desc' }
                });
            }
        } catch (error) {
            console.error('❌ Patterns lookup failed:', error);
            throw error;
        }
    }

    async updatePatternUsage(patternId, success = true) {
        try {
            if (this.config.provider === 'mongodb') {
                const pattern = await this.models.Pattern.findById(patternId);
                if (pattern) {
                    pattern.timesUsed += 1;
                    if (success) {
                        pattern.successRate = (pattern.successRate * (pattern.timesUsed - 1) + 1) / pattern.timesUsed;
                    } else {
                        pattern.successRate = (pattern.successRate * (pattern.timesUsed - 1)) / pattern.timesUsed;
                    }
                    await pattern.save();
                }
            } else {
                // PostgreSQL update with calculated success rate
                await this.connection.$executeRaw`
                    UPDATE patterns 
                    SET times_used = times_used + 1,
                        success_rate = CASE 
                            WHEN ${success} THEN (success_rate * times_used + 1) / (times_used + 1)
                            ELSE (success_rate * times_used) / (times_used + 1)
                        END
                    WHERE id = ${patternId}
                `;
            }
        } catch (error) {
            console.error('❌ Pattern update failed:', error);
            throw error;
        }
    }

    // Analytics Methods
    async recordAnalytics(data) {
        console.log('📊 Recording analytics data...');
        
        try {
            const analytics = await this.models.Analytics.create({
                date: new Date(),
                ...data
            });
            
            console.log('✅ Analytics recorded');
            return analytics;
            
        } catch (error) {
            console.error('❌ Analytics recording failed:', error);
            throw error;
        }
    }

    async getAnalytics(options = {}) {
        const { startDate, endDate, limit = 100 } = options;
        
        try {
            let query = {};
            if (startDate || endDate) {
                query.date = {};
                if (startDate) query.date.$gte = startDate;
                if (endDate) query.date.$lte = endDate;
            }
            
            if (this.config.provider === 'mongodb') {
                return await this.models.Analytics.find(query)
                    .limit(limit)
                    .sort({ date: -1 });
            } else {
                const where = {};
                if (startDate || endDate) {
                    where.date = {};
                    if (startDate) where.date.gte = startDate;
                    if (endDate) where.date.lte = endDate;
                }
                
                return await this.models.Analytics.findMany({
                    where,
                    take: limit,
                    orderBy: { date: 'desc' }
                });
            }
        } catch (error) {
            console.error('❌ Analytics query failed:', error);
            throw error;
        }
    }

    // Utility Methods
    async hashPassword(password) {
        const bcrypt = require('bcrypt');
        return await bcrypt.hash(password, 10);
    }

    async verifyPassword(password, hash) {
        const bcrypt = require('bcrypt');
        return await bcrypt.compare(password, hash);
    }

    async backup(backupPath) {
        console.log('💾 Creating database backup...');
        
        try {
            if (this.config.provider === 'postgresql') {
                // PostgreSQL backup
                const { exec } = require('child_process');
                const backupFile = `${backupPath}/backup_${Date.now()}.sql`;
                
                await new Promise((resolve, reject) => {
                    exec(`pg_dump ${this.config.connectionString} > ${backupFile}`, (error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });
                
                console.log(`✅ PostgreSQL backup created: ${backupFile}`);
                
            } else if (this.config.provider === 'mongodb') {
                // MongoDB backup
                const collections = ['users', 'documents', 'securities', 'annotations', 'patterns'];
                const backupData = {};
                
                for (const collection of collections) {
                    if (this.models[collection.charAt(0).toUpperCase() + collection.slice(1)]) {
                        backupData[collection] = await this.models[collection.charAt(0).toUpperCase() + collection.slice(1)].find({});
                    }
                }
                
                const backupFile = `${backupPath}/backup_${Date.now()}.json`;
                await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
                console.log(`✅ MongoDB backup created: ${backupFile}`);
            }
            
        } catch (error) {
            console.error('❌ Backup failed:', error);
            throw error;
        }
    }

    async close() {
        console.log('🔌 Closing database connection...');
        
        try {
            if (this.config.provider === 'postgresql') {
                await this.connection.$disconnect();
            } else if (this.config.provider === 'mongodb') {
                await this.connection.close();
            } else if (this.config.provider === 'sqlite') {
                await this.connection.close();
            }
            
            this.isConnected = false;
            console.log('✅ Database connection closed');
            
        } catch (error) {
            console.error('❌ Error closing database:', error);
        }
    }

    // Health Check
    async healthCheck() {
        try {
            if (this.config.provider === 'postgresql') {
                await this.connection.$queryRaw`SELECT 1`;
            } else if (this.config.provider === 'mongodb') {
                await this.connection.db.admin().ping();
            } else if (this.config.provider === 'sqlite') {
                await this.connection.get('SELECT 1');
            }
            
            return {
                status: 'healthy',
                provider: this.config.provider,
                connected: this.isConnected,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                status: 'unhealthy',
                provider: this.config.provider,
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = { DatabaseManager };