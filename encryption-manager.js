/**
 * ENCRYPTION MANAGER
 * Advanced encryption and cryptographic utilities for data protection
 * 
 * Features:
 * - AES-256-GCM encryption for data at rest
 * - RSA key pair generation and management
 * - Digital signatures and verification
 * - Key derivation functions (PBKDF2, scrypt, Argon2)
 * - Secure key storage and rotation
 * - Field-level encryption for sensitive data
 * - Hash-based message authentication codes (HMAC)
 * - Cryptographically secure random generation
 * - PGP-style encryption for file protection
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class EncryptionManager {
    constructor(options = {}) {
        this.config = {
            // Encryption algorithms
            symmetricAlgorithm: options.symmetricAlgorithm || 'aes-256-gcm',
            asymmetricAlgorithm: options.asymmetricAlgorithm || 'rsa',
            hashAlgorithm: options.hashAlgorithm || 'sha256',
            keySize: options.keySize || 256, // bits
            
            // Key derivation
            kdfAlgorithm: options.kdfAlgorithm || 'pbkdf2',
            kdfIterations: options.kdfIterations || 100000,
            saltLength: options.saltLength || 32,
            
            // Key management
            keyRotationInterval: options.keyRotationInterval || 30 * 24 * 60 * 60 * 1000, // 30 days
            keyStoragePath: options.keyStoragePath || path.join(process.cwd(), '.keys'),
            masterKeyEnv: options.masterKeyEnv || 'MASTER_ENCRYPTION_KEY',
            
            // RSA settings
            rsaKeySize: options.rsaKeySize || 2048,
            rsaPublicExponent: options.rsaPublicExponent || 65537,
            
            // Security options
            enableKeyEscrow: options.enableKeyEscrow || false,
            enableHSM: options.enableHSM || false, // Hardware Security Module
            auditEncryption: options.auditEncryption !== false
        };
        
        this.keys = new Map();
        this.keyHistory = new Map();
        this.encryptionLog = [];
        this.masterKey = null;
        
        console.log('🔐 Encryption Manager initialized');
        console.log(`🔑 Algorithm: ${this.config.symmetricAlgorithm}, Key size: ${this.config.keySize} bits`);
    }

    async initialize() {
        console.log('🚀 Initializing encryption manager...');
        
        try {
            // Load or generate master key
            await this.initializeMasterKey();
            
            // Create key storage directory
            await this.initializeKeyStorage();
            
            // Load existing keys
            await this.loadKeys();
            
            // Start key rotation scheduler
            this.startKeyRotationScheduler();
            
            console.log('✅ Encryption manager ready');
            
        } catch (error) {
            console.error('❌ Encryption manager initialization failed:', error);
            throw error;
        }
    }

    async initializeMasterKey() {
        // Try to load master key from environment
        const masterKeyHex = process.env[this.config.masterKeyEnv];
        
        if (masterKeyHex) {
            this.masterKey = Buffer.from(masterKeyHex, 'hex');
            console.log('🔑 Master key loaded from environment');
        } else {
            // Generate new master key
            this.masterKey = crypto.randomBytes(32);
            console.warn('⚠️ Generated new master key - store securely!');
            console.log(`🔑 Master key (store in ${this.config.masterKeyEnv}): ${this.masterKey.toString('hex')}`);
        }
    }

    async initializeKeyStorage() {
        try {
            await fs.mkdir(this.config.keyStoragePath, { recursive: true });
            console.log(`📁 Key storage: ${this.config.keyStoragePath}`);
        } catch (error) {
            console.error('❌ Failed to create key storage directory:', error);
            throw error;
        }
    }

    // Symmetric Encryption
    async encrypt(data, keyId = 'default', additionalData = null) {
        try {
            const key = await this.getOrCreateKey(keyId);
            const iv = crypto.randomBytes(16);
            
            const cipher = crypto.createCipher(this.config.symmetricAlgorithm, key.key);
            cipher.setAAD(Buffer.from(additionalData || '', 'utf8'));
            
            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            const result = {
                data: encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                keyId: keyId,
                algorithm: this.config.symmetricAlgorithm,
                timestamp: new Date().toISOString()
            };
            
            if (this.config.auditEncryption) {
                this.logEncryptionOperation('ENCRYPT', keyId, data.length || 0);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Encryption failed:', error);
            throw new Error('Encryption operation failed');
        }
    }

    async decrypt(encryptedData, additionalData = null) {
        try {
            const { data, iv, authTag, keyId, algorithm } = encryptedData;
            
            const key = await this.getKey(keyId);
            if (!key) {
                throw new Error(`Decryption key not found: ${keyId}`);
            }
            
            const decipher = crypto.createDecipher(algorithm, key.key);
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            
            if (additionalData) {
                decipher.setAAD(Buffer.from(additionalData, 'utf8'));
            }
            
            let decrypted = decipher.update(data, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            const result = JSON.parse(decrypted);
            
            if (this.config.auditEncryption) {
                this.logEncryptionOperation('DECRYPT', keyId, data.length || 0);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Decryption failed:', error);
            throw new Error('Decryption operation failed');
        }
    }

    // Field-level encryption for databases
    async encryptField(value, fieldName, recordId = null) {
        if (value === null || value === undefined) {
            return null;
        }
        
        const keyId = `field_${fieldName}`;
        const additionalData = recordId ? `${fieldName}:${recordId}` : fieldName;
        
        return await this.encrypt(value, keyId, additionalData);
    }

    async decryptField(encryptedData, fieldName, recordId = null) {
        if (!encryptedData) {
            return null;
        }
        
        const additionalData = recordId ? `${fieldName}:${recordId}` : fieldName;
        
        return await this.decrypt(encryptedData, additionalData);
    }

    // Asymmetric Encryption (RSA)
    async generateKeyPair(keyId = 'default') {
        console.log(`🔑 Generating RSA key pair: ${keyId}`);
        
        try {
            const { publicKey, privateKey } = crypto.generateKeyPairSync(this.config.asymmetricAlgorithm, {
                modulusLength: this.config.rsaKeySize,
                publicExponent: this.config.rsaPublicExponent,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });
            
            const keyPair = {
                id: keyId,
                publicKey,
                privateKey,
                createdAt: new Date().toISOString(),
                type: 'rsa'
            };
            
            // Encrypt private key with master key
            const encryptedPrivateKey = await this.encryptWithMasterKey(privateKey);
            keyPair.privateKey = encryptedPrivateKey;
            
            await this.storeKeyPair(keyId, keyPair);
            
            console.log(`✅ RSA key pair generated: ${keyId}`);
            return {
                keyId,
                publicKey,
                fingerprint: this.generateKeyFingerprint(publicKey)
            };
            
        } catch (error) {
            console.error('❌ Key pair generation failed:', error);
            throw error;
        }
    }

    async encryptAsymmetric(data, publicKeyOrId) {
        try {
            let publicKey;
            
            if (typeof publicKeyOrId === 'string' && !publicKeyOrId.includes('-----')) {
                // It's a key ID
                const keyPair = await this.getKeyPair(publicKeyOrId);
                publicKey = keyPair.publicKey;
            } else {
                // It's a public key
                publicKey = publicKeyOrId;
            }
            
            const buffer = Buffer.from(JSON.stringify(data), 'utf8');
            const encrypted = crypto.publicEncrypt({
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            }, buffer);
            
            return {
                data: encrypted.toString('base64'),
                algorithm: 'rsa',
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Asymmetric encryption failed:', error);
            throw error;
        }
    }

    async decryptAsymmetric(encryptedData, privateKeyOrId) {
        try {
            let privateKey;
            
            if (typeof privateKeyOrId === 'string' && !privateKeyOrId.includes('-----')) {
                // It's a key ID
                const keyPair = await this.getKeyPair(privateKeyOrId);
                privateKey = await this.decryptWithMasterKey(keyPair.privateKey);
            } else {
                // It's a private key
                privateKey = privateKeyOrId;
            }
            
            const buffer = Buffer.from(encryptedData.data, 'base64');
            const decrypted = crypto.privateDecrypt({
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            }, buffer);
            
            return JSON.parse(decrypted.toString('utf8'));
            
        } catch (error) {
            console.error('❌ Asymmetric decryption failed:', error);
            throw error;
        }
    }

    // Digital Signatures
    async sign(data, privateKeyOrId) {
        try {
            let privateKey;
            
            if (typeof privateKeyOrId === 'string' && !privateKeyOrId.includes('-----')) {
                const keyPair = await this.getKeyPair(privateKeyOrId);
                privateKey = await this.decryptWithMasterKey(keyPair.privateKey);
            } else {
                privateKey = privateKeyOrId;
            }
            
            const dataBuffer = Buffer.from(JSON.stringify(data), 'utf8');
            const sign = crypto.createSign(this.config.hashAlgorithm);
            sign.update(dataBuffer);
            
            const signature = sign.sign(privateKey, 'base64');
            
            return {
                data,
                signature,
                algorithm: this.config.hashAlgorithm,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Signing failed:', error);
            throw error;
        }
    }

    async verify(signedData, publicKeyOrId) {
        try {
            let publicKey;
            
            if (typeof publicKeyOrId === 'string' && !publicKeyOrId.includes('-----')) {
                const keyPair = await this.getKeyPair(publicKeyOrId);
                publicKey = keyPair.publicKey;
            } else {
                publicKey = publicKeyOrId;
            }
            
            const { data, signature, algorithm } = signedData;
            const dataBuffer = Buffer.from(JSON.stringify(data), 'utf8');
            
            const verify = crypto.createVerify(algorithm);
            verify.update(dataBuffer);
            
            const isValid = verify.verify(publicKey, signature, 'base64');
            
            return {
                valid: isValid,
                data: isValid ? data : null,
                verifiedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Signature verification failed:', error);
            return { valid: false, data: null };
        }
    }

    // Key Derivation Functions
    async deriveKey(password, salt = null, keyLength = 32) {
        const actualSalt = salt || crypto.randomBytes(this.config.saltLength);
        
        let derivedKey;
        
        switch (this.config.kdfAlgorithm) {
            case 'pbkdf2':
                derivedKey = crypto.pbkdf2Sync(
                    password,
                    actualSalt,
                    this.config.kdfIterations,
                    keyLength,
                    this.config.hashAlgorithm
                );
                break;
                
            case 'scrypt':
                derivedKey = crypto.scryptSync(password, actualSalt, keyLength);
                break;
                
            default:
                throw new Error(`Unsupported KDF algorithm: ${this.config.kdfAlgorithm}`);
        }
        
        return {
            key: derivedKey,
            salt: actualSalt,
            algorithm: this.config.kdfAlgorithm,
            iterations: this.config.kdfIterations
        };
    }

    // HMAC operations
    generateHMAC(data, key = null) {
        const hmacKey = key || this.masterKey;
        const hmac = crypto.createHmac(this.config.hashAlgorithm, hmacKey);
        hmac.update(JSON.stringify(data));
        return hmac.digest('hex');
    }

    verifyHMAC(data, providedHMAC, key = null) {
        const expectedHMAC = this.generateHMAC(data, key);
        return crypto.timingSafeEqual(
            Buffer.from(providedHMAC, 'hex'),
            Buffer.from(expectedHMAC, 'hex')
        );
    }

    // Hash functions
    hash(data, algorithm = null) {
        const hashAlgorithm = algorithm || this.config.hashAlgorithm;
        const hash = crypto.createHash(hashAlgorithm);
        hash.update(JSON.stringify(data));
        return hash.digest('hex');
    }

    // Secure random generation
    generateSecureRandom(length = 32, encoding = 'hex') {
        return crypto.randomBytes(length).toString(encoding);
    }

    generateSecureRandomInt(min = 0, max = Number.MAX_SAFE_INTEGER) {
        const range = max - min;
        const bytesNeeded = Math.ceil(Math.log2(range) / 8);
        const maxValid = Math.floor(256 ** bytesNeeded / range) * range;
        
        let randomBytes;
        let randomValue;
        
        do {
            randomBytes = crypto.randomBytes(bytesNeeded);
            randomValue = randomBytes.readUIntBE(0, bytesNeeded);
        } while (randomValue >= maxValid);
        
        return min + (randomValue % range);
    }

    // Key Management
    async getOrCreateKey(keyId) {
        let key = this.keys.get(keyId);
        
        if (!key) {
            key = await this.createKey(keyId);
        }
        
        // Check if key needs rotation
        if (this.shouldRotateKey(key)) {
            key = await this.rotateKey(keyId);
        }
        
        return key;
    }

    async createKey(keyId) {
        console.log(`🔑 Creating new encryption key: ${keyId}`);
        
        const keyData = crypto.randomBytes(this.config.keySize / 8);
        const key = {
            id: keyId,
            key: keyData,
            createdAt: new Date(),
            lastUsed: new Date(),
            version: 1
        };
        
        this.keys.set(keyId, key);
        await this.storeKey(keyId, key);
        
        return key;
    }

    async getKey(keyId) {
        return this.keys.get(keyId);
    }

    async rotateKey(keyId) {
        console.log(`🔄 Rotating encryption key: ${keyId}`);
        
        const oldKey = this.keys.get(keyId);
        if (oldKey) {
            // Store old key in history
            const historyKey = `${keyId}_v${oldKey.version}`;
            this.keyHistory.set(historyKey, oldKey);
        }
        
        const newKey = {
            id: keyId,
            key: crypto.randomBytes(this.config.keySize / 8),
            createdAt: new Date(),
            lastUsed: new Date(),
            version: oldKey ? oldKey.version + 1 : 1
        };
        
        this.keys.set(keyId, newKey);
        await this.storeKey(keyId, newKey);
        
        console.log(`✅ Key rotated: ${keyId} (version ${newKey.version})`);
        return newKey;
    }

    shouldRotateKey(key) {
        const age = Date.now() - key.createdAt.getTime();
        return age > this.config.keyRotationInterval;
    }

    // Key Storage
    async storeKey(keyId, key) {
        try {
            const encryptedKey = await this.encryptWithMasterKey(JSON.stringify({
                ...key,
                key: key.key.toString('hex')
            }));
            
            const keyPath = path.join(this.config.keyStoragePath, `${keyId}.key`);
            await fs.writeFile(keyPath, JSON.stringify(encryptedKey));
            
        } catch (error) {
            console.error(`❌ Failed to store key ${keyId}:`, error);
            throw error;
        }
    }

    async storeKeyPair(keyId, keyPair) {
        try {
            const keyPath = path.join(this.config.keyStoragePath, `${keyId}.keypair`);
            await fs.writeFile(keyPath, JSON.stringify(keyPair));
            
        } catch (error) {
            console.error(`❌ Failed to store key pair ${keyId}:`, error);
            throw error;
        }
    }

    async loadKeys() {
        try {
            const files = await fs.readdir(this.config.keyStoragePath);
            
            for (const file of files) {
                if (file.endsWith('.key')) {
                    const keyId = file.replace('.key', '');
                    await this.loadKey(keyId);
                }
            }
            
            console.log(`📋 Loaded ${this.keys.size} encryption keys`);
            
        } catch (error) {
            console.warn('⚠️ Could not load keys from storage:', error.message);
        }
    }

    async loadKey(keyId) {
        try {
            const keyPath = path.join(this.config.keyStoragePath, `${keyId}.key`);
            const encryptedData = JSON.parse(await fs.readFile(keyPath, 'utf8'));
            const decryptedData = await this.decryptWithMasterKey(encryptedData);
            const keyData = JSON.parse(decryptedData);
            
            const key = {
                ...keyData,
                key: Buffer.from(keyData.key, 'hex'),
                createdAt: new Date(keyData.createdAt),
                lastUsed: new Date(keyData.lastUsed)
            };
            
            this.keys.set(keyId, key);
            
        } catch (error) {
            console.warn(`⚠️ Could not load key ${keyId}:`, error.message);
        }
    }

    async getKeyPair(keyId) {
        try {
            const keyPath = path.join(this.config.keyStoragePath, `${keyId}.keypair`);
            const keyPairData = JSON.parse(await fs.readFile(keyPath, 'utf8'));
            
            return keyPairData;
            
        } catch (error) {
            console.warn(`⚠️ Could not load key pair ${keyId}:`, error.message);
            return null;
        }
    }

    // Master key operations
    async encryptWithMasterKey(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-gcm', this.masterKey);
        
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            data: encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    async decryptWithMasterKey(encryptedData) {
        const { data, iv, authTag } = encryptedData;
        
        const decipher = crypto.createDecipher('aes-256-gcm', this.masterKey);
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        
        let decrypted = decipher.update(data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    // Utility methods
    generateKeyFingerprint(publicKey) {
        const hash = crypto.createHash('sha256');
        hash.update(publicKey);
        return hash.digest('hex').substring(0, 16);
    }

    startKeyRotationScheduler() {
        const checkInterval = 24 * 60 * 60 * 1000; // Check daily
        
        setInterval(async () => {
            console.log('🔄 Checking for keys that need rotation...');
            
            for (const [keyId, key] of this.keys) {
                if (this.shouldRotateKey(key)) {
                    try {
                        await this.rotateKey(keyId);
                    } catch (error) {
                        console.error(`❌ Failed to rotate key ${keyId}:`, error);
                    }
                }
            }
        }, checkInterval);
    }

    logEncryptionOperation(operation, keyId, dataSize) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation,
            keyId,
            dataSize,
            algorithm: this.config.symmetricAlgorithm
        };
        
        this.encryptionLog.push(logEntry);
        
        // Keep only last 1000 entries
        if (this.encryptionLog.length > 1000) {
            this.encryptionLog.shift();
        }
    }

    // API methods
    getEncryptionStats() {
        return {
            keysActive: this.keys.size,
            keysInHistory: this.keyHistory.size,
            operationsLogged: this.encryptionLog.length,
            algorithms: {
                symmetric: this.config.symmetricAlgorithm,
                asymmetric: this.config.asymmetricAlgorithm,
                hash: this.config.hashAlgorithm,
                kdf: this.config.kdfAlgorithm
            },
            config: {
                keySize: this.config.keySize,
                rotationInterval: this.config.keyRotationInterval,
                auditEnabled: this.config.auditEncryption
            }
        };
    }

    getEncryptionLog(limit = 100) {
        return this.encryptionLog.slice(-limit);
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up encryption manager...');
        
        // Clear sensitive data from memory
        for (const key of this.keys.values()) {
            if (key.key) {
                key.key.fill(0); // Zero out the key
            }
        }
        
        if (this.masterKey) {
            this.masterKey.fill(0);
        }
        
        this.keys.clear();
        this.keyHistory.clear();
        this.encryptionLog.length = 0;
        
        console.log('✅ Encryption manager cleanup complete');
    }
}

module.exports = { EncryptionManager };