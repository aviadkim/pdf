/**
 * BATCH PROCESSING API
 * High-performance batch processing system for enterprise-scale document processing
 * 
 * Features:
 * - Queue-based batch processing
 * - Progress tracking and monitoring
 * - Parallel processing with worker threads
 * - Retry logic and error handling
 * - Resource optimization and throttling
 * - Comprehensive reporting and analytics
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class BatchProcessingAPI extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            maxConcurrentJobs: options.maxConcurrentJobs || 5,
            maxWorkers: options.maxWorkers || 4,
            batchTimeout: options.batchTimeout || 300000, // 5 minutes
            retryAttempts: options.retryAttempts || 3,
            retryDelay: options.retryDelay || 5000,
            queueMaxSize: options.queueMaxSize || 1000,
            resultsPath: options.resultsPath || path.join(__dirname, 'batch_results'),
            enablePersistence: options.enablePersistence !== false
        };
        
        this.batches = new Map();
        this.processingQueue = [];
        this.workers = [];
        this.activeJobs = new Set();
        this.statistics = {
            totalBatches: 0,
            completedBatches: 0,
            failedBatches: 0,
            totalDocuments: 0,
            averageProcessingTime: 0,
            successRate: 0
        };
        
        console.log('📦 Batch Processing API initialized');
        console.log(`⚙️ Config: ${this.config.maxWorkers} workers, ${this.config.maxConcurrentJobs} concurrent jobs`);
    }

    async initialize() {
        console.log('🚀 Initializing batch processing system...');
        
        try {
            // Create results directory
            await fs.mkdir(this.config.resultsPath, { recursive: true });
            
            // Initialize worker pool
            await this.initializeWorkers();
            
            // Load existing batches if persistence is enabled
            if (this.config.enablePersistence) {
                await this.loadPersistedBatches();
            }
            
            // Start queue processor
            this.startQueueProcessor();
            
            console.log('✅ Batch processing system ready');
            
        } catch (error) {
            console.error('❌ Batch processing initialization failed:', error);
            throw error;
        }
    }

    async initializeWorkers() {
        console.log(`👷 Initializing ${this.config.maxWorkers} worker threads...`);
        
        for (let i = 0; i < this.config.maxWorkers; i++) {
            const worker = new Worker(__filename, {
                workerData: {
                    workerId: i,
                    isWorker: true
                }
            });
            
            worker.on('message', (message) => {
                this.handleWorkerMessage(worker, message);
            });
            
            worker.on('error', (error) => {
                console.error(`❌ Worker ${i} error:`, error);
                this.handleWorkerError(worker, error);
            });
            
            worker.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`🚨 Worker ${i} exited with code ${code}`);
                    this.handleWorkerExit(worker, code);
                }
            });
            
            this.workers.push({
                id: i,
                worker,
                busy: false,
                currentJob: null
            });
        }
        
        console.log(`✅ ${this.workers.length} workers initialized`);
    }

    async createBatch(documents, options = {}) {
        console.log(`📦 Creating batch with ${documents.length} documents...`);
        
        try {
            const batchId = this.generateBatchId();
            const batch = {
                id: batchId,
                documents: documents.map((doc, index) => ({
                    id: `${batchId}_doc_${index}`,
                    index,
                    ...doc,
                    status: 'pending',
                    attempts: 0,
                    errors: [],
                    result: null
                })),
                options: {
                    priority: options.priority || 'normal',
                    notifyUrl: options.notifyUrl,
                    enableMLLearning: options.enableMLLearning !== false,
                    outputFormat: options.outputFormat || 'json',
                    timeout: options.timeout || this.config.batchTimeout,
                    ...options
                },
                status: 'created',
                createdAt: new Date().toISOString(),
                startedAt: null,
                completedAt: null,
                progress: {
                    total: documents.length,
                    pending: documents.length,
                    processing: 0,
                    completed: 0,
                    failed: 0,
                    percentage: 0
                },
                results: {
                    successful: [],
                    failed: [],
                    summary: null
                },
                statistics: {
                    totalProcessingTime: 0,
                    averageProcessingTime: 0,
                    accuracyStats: {
                        average: 0,
                        min: 0,
                        max: 0
                    }
                }
            };
            
            this.batches.set(batchId, batch);
            this.statistics.totalBatches++;
            
            // Add to processing queue
            this.addToQueue(batch);
            
            // Persist batch if enabled
            if (this.config.enablePersistence) {
                await this.persistBatch(batch);
            }
            
            console.log(`✅ Batch ${batchId} created with ${documents.length} documents`);
            
            // Emit batch created event
            this.emit('batchCreated', { batchId, documentCount: documents.length });
            
            return {
                batchId,
                status: 'created',
                totalDocuments: documents.length,
                estimatedCompletion: this.estimateCompletion(documents.length),
                queuePosition: this.getQueuePosition(batchId)
            };
            
        } catch (error) {
            console.error('❌ Batch creation failed:', error);
            throw error;
        }
    }

    addToQueue(batch) {
        // Insert based on priority
        const priority = batch.options.priority;
        const priorityValue = this.getPriorityValue(priority);
        
        let insertIndex = this.processingQueue.length;
        for (let i = 0; i < this.processingQueue.length; i++) {
            const queueBatchPriority = this.getPriorityValue(this.processingQueue[i].options.priority);
            if (priorityValue > queueBatchPriority) {
                insertIndex = i;
                break;
            }
        }
        
        this.processingQueue.splice(insertIndex, 0, batch);
        console.log(`📋 Batch ${batch.id} added to queue at position ${insertIndex + 1}`);
    }

    startQueueProcessor() {
        setInterval(() => {
            this.processQueue();
        }, 1000); // Check queue every second
        
        console.log('🔄 Queue processor started');
    }

    async processQueue() {
        // Check if we can start new jobs
        const availableSlots = this.config.maxConcurrentJobs - this.activeJobs.size;
        if (availableSlots <= 0 || this.processingQueue.length === 0) {
            return;
        }
        
        // Start new batch processing
        for (let i = 0; i < Math.min(availableSlots, this.processingQueue.length); i++) {
            const batch = this.processingQueue.shift();
            if (batch) {
                this.processBatch(batch);
            }
        }
    }

    async processBatch(batch) {
        console.log(`🚀 Starting batch processing: ${batch.id}`);
        
        try {
            batch.status = 'processing';
            batch.startedAt = new Date().toISOString();
            this.activeJobs.add(batch.id);
            
            // Emit batch started event
            this.emit('batchStarted', { batchId: batch.id });
            
            // Process documents in parallel
            const processingPromises = batch.documents.map(document => 
                this.processDocument(batch, document)
            );
            
            // Set batch timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Batch processing timeout'));
                }, batch.options.timeout);
            });
            
            // Wait for completion or timeout
            await Promise.race([
                Promise.allSettled(processingPromises),
                timeoutPromise
            ]);
            
            // Complete batch processing
            await this.completeBatch(batch);
            
        } catch (error) {
            console.error(`❌ Batch processing failed: ${batch.id}`, error);
            await this.failBatch(batch, error);
        }
    }

    async processDocument(batch, document) {
        const startTime = Date.now();
        let attempts = 0;
        
        while (attempts < this.config.retryAttempts) {
            try {
                console.log(`📄 Processing document ${document.id} (attempt ${attempts + 1})`);
                
                document.status = 'processing';
                document.attempts = attempts + 1;
                
                // Update batch progress
                this.updateBatchProgress(batch);
                
                // Get available worker
                const workerInfo = await this.getAvailableWorker();
                if (!workerInfo) {
                    throw new Error('No workers available');
                }
                
                // Process document with worker
                const result = await this.processDocumentWithWorker(workerInfo, document, batch.options);
                
                // Process successful
                document.status = 'completed';
                document.result = result;
                document.processingTime = Date.now() - startTime;
                
                batch.results.successful.push({
                    documentId: document.id,
                    result,
                    processingTime: document.processingTime
                });
                
                // Release worker
                this.releaseWorker(workerInfo);
                
                console.log(`✅ Document ${document.id} processed successfully`);
                
                // Emit document completed event
                this.emit('documentCompleted', {
                    batchId: batch.id,
                    documentId: document.id,
                    result
                });
                
                break; // Success, exit retry loop
                
            } catch (error) {
                attempts++;
                document.errors.push({
                    attempt: attempts,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                console.error(`❌ Document ${document.id} processing failed (attempt ${attempts}):`, error.message);
                
                if (attempts >= this.config.retryAttempts) {
                    // Max retries reached
                    document.status = 'failed';
                    document.processingTime = Date.now() - startTime;
                    
                    batch.results.failed.push({
                        documentId: document.id,
                        error: error.message,
                        attempts,
                        errors: document.errors
                    });
                    
                    // Emit document failed event
                    this.emit('documentFailed', {
                        batchId: batch.id,
                        documentId: document.id,
                        error: error.message
                    });
                    
                } else {
                    // Wait before retry
                    await this.delay(this.config.retryDelay * attempts);
                }
            }
        }
        
        // Update batch progress
        this.updateBatchProgress(batch);
    }

    async getAvailableWorker() {
        return new Promise((resolve) => {
            const checkWorker = () => {
                const availableWorker = this.workers.find(w => !w.busy);
                if (availableWorker) {
                    availableWorker.busy = true;
                    resolve(availableWorker);
                } else {
                    setTimeout(checkWorker, 100); // Check again in 100ms
                }
            };
            checkWorker();
        });
    }

    async processDocumentWithWorker(workerInfo, document, options) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Worker processing timeout'));
            }, 60000); // 1 minute timeout per document
            
            workerInfo.currentJob = document.id;
            
            const messageHandler = (message) => {
                if (message.type === 'result' && message.documentId === document.id) {
                    clearTimeout(timeout);
                    workerInfo.worker.removeListener('message', messageHandler);
                    
                    if (message.success) {
                        resolve(message.result);
                    } else {
                        reject(new Error(message.error));
                    }
                }
            };
            
            workerInfo.worker.on('message', messageHandler);
            
            // Send processing task to worker
            workerInfo.worker.postMessage({
                type: 'process',
                documentId: document.id,
                document: document,
                options: options
            });
        });
    }

    releaseWorker(workerInfo) {
        workerInfo.busy = false;
        workerInfo.currentJob = null;
    }

    updateBatchProgress(batch) {
        const completed = batch.documents.filter(d => d.status === 'completed').length;
        const failed = batch.documents.filter(d => d.status === 'failed').length;
        const processing = batch.documents.filter(d => d.status === 'processing').length;
        const pending = batch.documents.filter(d => d.status === 'pending').length;
        
        batch.progress = {
            total: batch.documents.length,
            pending,
            processing,
            completed,
            failed,
            percentage: Math.round(((completed + failed) / batch.documents.length) * 100)
        };
        
        // Emit progress update
        this.emit('batchProgress', {
            batchId: batch.id,
            progress: batch.progress
        });
    }

    async completeBatch(batch) {
        console.log(`✅ Completing batch: ${batch.id}`);
        
        batch.status = 'completed';
        batch.completedAt = new Date().toISOString();
        
        // Calculate statistics
        const processingTimes = batch.results.successful.map(r => r.processingTime);
        const totalProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0);
        
        batch.statistics = {
            totalProcessingTime,
            averageProcessingTime: processingTimes.length > 0 ? totalProcessingTime / processingTimes.length : 0,
            accuracyStats: this.calculateAccuracyStats(batch.results.successful)
        };
        
        // Generate summary
        batch.results.summary = {
            totalDocuments: batch.documents.length,
            successful: batch.results.successful.length,
            failed: batch.results.failed.length,
            successRate: (batch.results.successful.length / batch.documents.length) * 100,
            averageAccuracy: batch.statistics.accuracyStats.average,
            totalProcessingTime: batch.statistics.totalProcessingTime
        };
        
        // Save results
        await this.saveBatchResults(batch);
        
        // Update global statistics
        this.updateGlobalStatistics(batch);
        
        // Send webhook notification if configured
        if (batch.options.notifyUrl) {
            await this.sendWebhookNotification(batch);
        }
        
        // Remove from active jobs
        this.activeJobs.delete(batch.id);
        
        console.log(`🎉 Batch ${batch.id} completed: ${batch.results.summary.successful}/${batch.results.summary.totalDocuments} successful`);
        
        // Emit batch completed event
        this.emit('batchCompleted', {
            batchId: batch.id,
            summary: batch.results.summary
        });
    }

    async failBatch(batch, error) {
        console.log(`❌ Failing batch: ${batch.id}`);
        
        batch.status = 'failed';
        batch.completedAt = new Date().toISOString();
        batch.error = error.message;
        
        // Update statistics
        this.statistics.failedBatches++;
        
        // Remove from active jobs
        this.activeJobs.delete(batch.id);
        
        // Emit batch failed event
        this.emit('batchFailed', {
            batchId: batch.id,
            error: error.message
        });
    }

    // Status and results methods
    getBatchStatus(batchId) {
        const batch = this.batches.get(batchId);
        if (!batch) {
            throw new Error(`Batch not found: ${batchId}`);
        }
        
        return {
            batchId,
            status: batch.status,
            progress: batch.progress,
            createdAt: batch.createdAt,
            startedAt: batch.startedAt,
            completedAt: batch.completedAt,
            estimatedCompletion: this.estimateRemainingTime(batch),
            queuePosition: this.getQueuePosition(batchId)
        };
    }

    getBatchResults(batchId, options = {}) {
        const batch = this.batches.get(batchId);
        if (!batch) {
            throw new Error(`Batch not found: ${batchId}`);
        }
        
        const results = {
            batchId,
            status: batch.status,
            summary: batch.results.summary,
            statistics: batch.statistics
        };
        
        if (options.includeDetails) {
            results.documents = batch.documents.map(doc => ({
                id: doc.id,
                status: doc.status,
                processingTime: doc.processingTime,
                attempts: doc.attempts,
                ...(doc.result && { result: doc.result }),
                ...(doc.errors.length > 0 && { errors: doc.errors })
            }));
        }
        
        return results;
    }

    async cancelBatch(batchId) {
        const batch = this.batches.get(batchId);
        if (!batch) {
            throw new Error(`Batch not found: ${batchId}`);
        }
        
        if (batch.status === 'completed' || batch.status === 'failed') {
            throw new Error(`Cannot cancel batch in status: ${batch.status}`);
        }
        
        // Remove from queue if not started
        if (batch.status === 'created') {
            const queueIndex = this.processingQueue.findIndex(b => b.id === batchId);
            if (queueIndex !== -1) {
                this.processingQueue.splice(queueIndex, 1);
            }
        }
        
        batch.status = 'cancelled';
        batch.completedAt = new Date().toISOString();
        
        // Remove from active jobs
        this.activeJobs.delete(batchId);
        
        console.log(`🚫 Batch ${batchId} cancelled`);
        
        // Emit batch cancelled event
        this.emit('batchCancelled', { batchId });
        
        return { cancelled: true };
    }

    // Utility methods
    generateBatchId() {
        return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getPriorityValue(priority) {
        const priorities = { high: 3, normal: 2, low: 1 };
        return priorities[priority] || 2;
    }

    estimateCompletion(documentCount) {
        const avgProcessingTime = 30000; // 30 seconds per document
        const parallelProcessing = Math.min(documentCount, this.config.maxWorkers);
        const estimatedTime = (documentCount / parallelProcessing) * avgProcessingTime;
        return new Date(Date.now() + estimatedTime).toISOString();
    }

    getQueuePosition(batchId) {
        return this.processingQueue.findIndex(b => b.id === batchId) + 1;
    }

    estimateRemainingTime(batch) {
        if (batch.status !== 'processing') return null;
        
        const completedDocs = batch.progress.completed + batch.progress.failed;
        const remainingDocs = batch.progress.total - completedDocs;
        
        if (completedDocs === 0) return null;
        
        const avgTimePerDoc = batch.statistics.averageProcessingTime || 30000;
        const estimatedTime = (remainingDocs / this.config.maxWorkers) * avgTimePerDoc;
        
        return new Date(Date.now() + estimatedTime).toISOString();
    }

    calculateAccuracyStats(successfulResults) {
        if (successfulResults.length === 0) {
            return { average: 0, min: 0, max: 0 };
        }
        
        const accuracies = successfulResults
            .map(r => r.result?.accuracy || 0)
            .filter(acc => acc > 0);
        
        if (accuracies.length === 0) {
            return { average: 0, min: 0, max: 0 };
        }
        
        return {
            average: accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length,
            min: Math.min(...accuracies),
            max: Math.max(...accuracies)
        };
    }

    updateGlobalStatistics(batch) {
        this.statistics.completedBatches++;
        this.statistics.totalDocuments += batch.documents.length;
        
        const successfulDocs = batch.results.successful.length;
        const totalDocs = batch.documents.length;
        
        this.statistics.successRate = 
            (this.statistics.successRate * (this.statistics.completedBatches - 1) + 
             (successfulDocs / totalDocs) * 100) / this.statistics.completedBatches;
        
        this.statistics.averageProcessingTime = 
            (this.statistics.averageProcessingTime * (this.statistics.completedBatches - 1) + 
             batch.statistics.averageProcessingTime) / this.statistics.completedBatches;
    }

    async saveBatchResults(batch) {
        try {
            const resultsFile = path.join(this.config.resultsPath, `${batch.id}_results.json`);
            await fs.writeFile(resultsFile, JSON.stringify(batch.results, null, 2));
            console.log(`💾 Batch results saved: ${resultsFile}`);
        } catch (error) {
            console.error('❌ Failed to save batch results:', error);
        }
    }

    async persistBatch(batch) {
        try {
            const batchFile = path.join(this.config.resultsPath, `${batch.id}_batch.json`);
            await fs.writeFile(batchFile, JSON.stringify(batch, null, 2));
        } catch (error) {
            console.error('❌ Failed to persist batch:', error);
        }
    }

    async loadPersistedBatches() {
        try {
            const files = await fs.readdir(this.config.resultsPath);
            const batchFiles = files.filter(f => f.endsWith('_batch.json'));
            
            for (const file of batchFiles) {
                try {
                    const content = await fs.readFile(path.join(this.config.resultsPath, file), 'utf8');
                    const batch = JSON.parse(content);
                    
                    // Only load incomplete batches
                    if (batch.status !== 'completed' && batch.status !== 'failed' && batch.status !== 'cancelled') {
                        this.batches.set(batch.id, batch);
                        this.addToQueue(batch);
                        console.log(`📂 Loaded persisted batch: ${batch.id}`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to load batch file ${file}:`, error.message);
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to load persisted batches:', error.message);
        }
    }

    async sendWebhookNotification(batch) {
        try {
            const fetch = require('node-fetch');
            const payload = {
                batchId: batch.id,
                status: batch.status,
                summary: batch.results.summary,
                timestamp: new Date().toISOString()
            };
            
            await fetch(batch.options.notifyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                timeout: 10000
            });
            
            console.log(`📡 Webhook notification sent for batch ${batch.id}`);
        } catch (error) {
            console.error(`❌ Webhook notification failed for batch ${batch.id}:`, error.message);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    handleWorkerMessage(worker, message) {
        // Handle worker messages (already handled in processDocumentWithWorker)
    }

    handleWorkerError(worker, error) {
        console.error('❌ Worker error:', error);
        // Handle worker errors - restart worker if necessary
    }

    handleWorkerExit(worker, code) {
        console.warn(`⚠️ Worker exited with code ${code}`);
        // Handle worker exit - restart worker if necessary
    }

    getStatistics() {
        return {
            ...this.statistics,
            activeJobs: this.activeJobs.size,
            queueSize: this.processingQueue.length,
            workers: {
                total: this.workers.length,
                busy: this.workers.filter(w => w.busy).length,
                available: this.workers.filter(w => !w.busy).length
            }
        };
    }
}

// Worker thread code
if (!isMainThread && workerData?.isWorker) {
    // This is a worker thread
    parentPort.on('message', async (message) => {
        if (message.type === 'process') {
            try {
                // Simulate document processing
                const result = await processDocumentInWorker(message.document, message.options);
                
                parentPort.postMessage({
                    type: 'result',
                    documentId: message.documentId,
                    success: true,
                    result
                });
            } catch (error) {
                parentPort.postMessage({
                    type: 'result',
                    documentId: message.documentId,
                    success: false,
                    error: error.message
                });
            }
        }
    });
    
    async function processDocumentInWorker(document, options) {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 1000));
        
        // Return mock result
        return {
            documentId: document.id,
            securities: Math.floor(Math.random() * 30) + 10,
            accuracy: Math.random() * 20 + 80,
            processingTime: Date.now(),
            method: 'worker_processing'
        };
    }
}

module.exports = { BatchProcessingAPI };