/**
 * QUEUE MANAGER
 * Advanced job queue management for scalable document processing
 * 
 * Features:
 * - Multi-priority job queues
 * - Distributed processing with Redis/Bull
 * - Job retry mechanisms with exponential backoff
 * - Worker pool management
 * - Real-time job monitoring
 * - Job scheduling and cron jobs
 * - Error handling and dead letter queues
 * - Performance metrics and analytics
 */

const EventEmitter = require('events');
const path = require('path');
const { Worker } = require('worker_threads');

class QueueManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            redisUrl: options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
            maxWorkers: options.maxWorkers || require('os').cpus().length,
            maxConcurrency: options.maxConcurrency || 10,
            defaultRetries: options.defaultRetries || 3,
            retryDelay: options.retryDelay || 5000,
            jobTimeout: options.jobTimeout || 300000, // 5 minutes
            enableScheduling: options.enableScheduling !== false,
            enableMetrics: options.enableMetrics !== false,
            cleanupInterval: options.cleanupInterval || 3600000 // 1 hour
        };
        
        this.queues = new Map();
        this.workers = new Map();
        this.jobs = new Map();
        this.metrics = {
            processed: 0,
            failed: 0,
            active: 0,
            waiting: 0,
            completed: 0,
            retries: 0
        };
        this.scheduledJobs = new Map();
        this.processors = new Map();
        
        // Initialize queue priorities
        this.priorities = {
            CRITICAL: 1,
            HIGH: 2,
            NORMAL: 3,
            LOW: 4,
            BACKGROUND: 5
        };
        
        console.log('📋 Queue Manager initialized');
        console.log(`👥 Max workers: ${this.config.maxWorkers}, Max concurrency: ${this.config.maxConcurrency}`);
    }

    async initialize() {
        console.log('🚀 Initializing queue manager...');
        
        try {
            // Initialize Redis connection if available
            await this.initializeRedis();
            
            // Create default queues
            await this.createDefaultQueues();
            
            // Start workers
            await this.startWorkers();
            
            // Start monitoring
            if (this.config.enableMetrics) {
                this.startMetricsCollection();
            }
            
            // Start cleanup process
            this.startCleanupProcess();
            
            console.log('✅ Queue manager ready');
            
        } catch (error) {
            console.error('❌ Queue manager initialization failed:', error);
            throw error;
        }
    }

    async initializeRedis() {
        try {
            // Try to use Bull/Redis if available
            if (this.config.redisUrl !== 'memory') {
                try {
                    const Bull = require('bull');
                    this.Bull = Bull;
                    this.redisConnected = true;
                    console.log('✅ Redis connection available for distributed queues');
                } catch (error) {
                    console.warn('⚠️ Bull/Redis not available, using in-memory queues');
                    this.redisConnected = false;
                }
            } else {
                this.redisConnected = false;
            }
        } catch (error) {
            console.warn('⚠️ Redis initialization failed, using in-memory fallback');
            this.redisConnected = false;
        }
    }

    async createDefaultQueues() {
        console.log('📋 Creating default queues...');
        
        const defaultQueues = [
            { name: 'pdf-processing', priority: this.priorities.HIGH, concurrency: 5 },
            { name: 'batch-processing', priority: this.priorities.NORMAL, concurrency: 3 },
            { name: 'ocr-processing', priority: this.priorities.HIGH, concurrency: 2 },
            { name: 'ml-training', priority: this.priorities.LOW, concurrency: 1 },
            { name: 'notifications', priority: this.priorities.NORMAL, concurrency: 10 },
            { name: 'exports', priority: this.priorities.LOW, concurrency: 2 },
            { name: 'analytics', priority: this.priorities.BACKGROUND, concurrency: 1 },
            { name: 'cleanup', priority: this.priorities.BACKGROUND, concurrency: 1 }
        ];
        
        for (const queueConfig of defaultQueues) {
            await this.createQueue(queueConfig.name, {
                priority: queueConfig.priority,
                concurrency: queueConfig.concurrency
            });
        }
        
        console.log(`✅ Created ${defaultQueues.length} default queues`);
    }

    async createQueue(name, options = {}) {
        console.log(`📋 Creating queue: ${name}`);
        
        const queueConfig = {
            name,
            priority: options.priority || this.priorities.NORMAL,
            concurrency: options.concurrency || 1,
            retries: options.retries || this.config.defaultRetries,
            timeout: options.timeout || this.config.jobTimeout,
            enabled: options.enabled !== false
        };
        
        let queue;
        
        if (this.redisConnected && this.Bull) {
            // Use Bull for Redis-backed queues
            queue = new this.Bull(name, this.config.redisUrl, {
                defaultJobOptions: {
                    removeOnComplete: 100,
                    removeOnFail: 50,
                    attempts: queueConfig.retries,
                    backoff: {
                        type: 'exponential',
                        delay: this.config.retryDelay
                    }
                }
            });
            
            // Set up Bull event listeners
            queue.on('completed', (job) => this.handleJobCompleted(job));
            queue.on('failed', (job, err) => this.handleJobFailed(job, err));
            queue.on('active', (job) => this.handleJobActive(job));
            queue.on('waiting', (job) => this.handleJobWaiting(job));
            
        } else {
            // Use in-memory queue
            queue = {
                name,
                jobs: [],
                active: new Map(),
                completed: [],
                failed: [],
                waiting: [],
                processing: false,
                add: (jobData, options) => this.addJobToMemoryQueue(name, jobData, options),
                process: (processor) => this.processMemoryQueue(name, processor),
                getWaiting: () => this.getWaitingJobs(name),
                getActive: () => this.getActiveJobs(name),
                getCompleted: () => this.getCompletedJobs(name),
                getFailed: () => this.getFailedJobs(name),
                clean: () => this.cleanMemoryQueue(name)
            };
        }
        
        this.queues.set(name, {
            queue,
            config: queueConfig,
            metrics: {
                processed: 0,
                failed: 0,
                active: 0,
                waiting: 0
            }
        });
        
        console.log(`✅ Queue created: ${name} (${this.redisConnected ? 'Redis' : 'Memory'})`);
        return queue;
    }

    // Job Management
    async addJob(queueName, jobData, options = {}) {
        const queueInfo = this.queues.get(queueName);
        if (!queueInfo) {
            throw new Error(`Queue not found: ${queueName}`);
        }
        
        const jobOptions = {
            priority: options.priority || queueInfo.config.priority,
            delay: options.delay || 0,
            attempts: options.attempts || queueInfo.config.retries,
            timeout: options.timeout || queueInfo.config.timeout,
            jobId: options.jobId || this.generateJobId()
        };
        
        const job = {
            id: jobOptions.jobId,
            queue: queueName,
            data: jobData,
            options: jobOptions,
            createdAt: new Date(),
            status: 'waiting',
            attempts: 0,
            maxAttempts: jobOptions.attempts
        };
        
        this.jobs.set(job.id, job);
        
        if (this.redisConnected && this.Bull) {
            // Add to Bull queue
            const bullJob = await queueInfo.queue.add(jobData, jobOptions);
            job.bullJobId = bullJob.id;
        } else {
            // Add to memory queue
            await queueInfo.queue.add(jobData, jobOptions);
        }
        
        queueInfo.metrics.waiting++;
        this.metrics.waiting++;
        
        console.log(`📋 Job added to queue: ${queueName} (${job.id})`);
        
        this.emit('jobAdded', { queueName, jobId: job.id, jobData });
        
        return job;
    }

    async addJobToMemoryQueue(queueName, jobData, options) {
        const queueInfo = this.queues.get(queueName);
        if (!queueInfo) {
            throw new Error(`Queue not found: ${queueName}`);
        }
        
        const job = {
            id: options.jobId || this.generateJobId(),
            data: jobData,
            options,
            createdAt: new Date(),
            status: 'waiting'
        };
        
        queueInfo.queue.jobs.push(job);
        queueInfo.queue.waiting.push(job);
        
        // Sort by priority (lower number = higher priority)
        queueInfo.queue.jobs.sort((a, b) => a.options.priority - b.options.priority);
        
        return job;
    }

    // Job Processing
    registerProcessor(queueName, processor) {
        console.log(`🔧 Registering processor for queue: ${queueName}`);
        
        const queueInfo = this.queues.get(queueName);
        if (!queueInfo) {
            throw new Error(`Queue not found: ${queueName}`);
        }
        
        this.processors.set(queueName, processor);
        
        if (this.redisConnected && this.Bull) {
            // Register Bull processor
            queueInfo.queue.process(queueInfo.config.concurrency, async (job) => {
                return await this.executeJob(queueName, job.data, job);
            });
        } else {
            // Start memory queue processing
            this.processMemoryQueue(queueName, processor);
        }
        
        console.log(`✅ Processor registered for queue: ${queueName}`);
    }

    async processMemoryQueue(queueName, processor) {
        const queueInfo = this.queues.get(queueName);
        if (!queueInfo || queueInfo.queue.processing) {
            return;
        }
        
        queueInfo.queue.processing = true;
        
        while (queueInfo.queue.jobs.length > 0) {
            // Check concurrency limit
            if (queueInfo.queue.active.size >= queueInfo.config.concurrency) {
                await this.delay(100); // Wait a bit before checking again
                continue;
            }
            
            const job = queueInfo.queue.jobs.shift();
            if (!job) continue;
            
            // Move to active
            queueInfo.queue.active.set(job.id, job);
            job.status = 'active';
            job.startedAt = new Date();
            
            // Process job asynchronously
            this.executeJob(queueName, job.data, job)
                .then((result) => {
                    this.handleMemoryJobCompleted(queueName, job, result);
                })
                .catch((error) => {
                    this.handleMemoryJobFailed(queueName, job, error);
                });
        }
        
        queueInfo.queue.processing = false;
    }

    async executeJob(queueName, jobData, job) {
        const processor = this.processors.get(queueName);
        if (!processor) {
            throw new Error(`No processor registered for queue: ${queueName}`);
        }
        
        const startTime = Date.now();
        
        try {
            console.log(`⚡ Processing job: ${job.id || 'unknown'} in queue: ${queueName}`);
            
            const result = await processor(jobData, job);
            
            const duration = Date.now() - startTime;
            console.log(`✅ Job completed: ${job.id || 'unknown'} (${duration}ms)`);
            
            return result;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ Job failed: ${job.id || 'unknown'} (${duration}ms)`, error);
            throw error;
        }
    }

    // Worker Management
    async startWorkers() {
        console.log('👥 Starting workers...');
        
        for (let i = 0; i < this.config.maxWorkers; i++) {
            const worker = await this.createWorker(`worker-${i}`);
            this.workers.set(`worker-${i}`, worker);
        }
        
        console.log(`✅ Started ${this.workers.size} workers`);
    }

    async createWorker(workerId) {
        const workerPath = path.join(__dirname, 'queue-worker.js');
        
        try {
            const worker = new Worker(workerPath, {
                workerData: {
                    workerId,
                    config: this.config
                }
            });
            
            worker.on('message', (message) => {
                this.handleWorkerMessage(workerId, message);
            });
            
            worker.on('error', (error) => {
                console.error(`❌ Worker error: ${workerId}`, error);
                this.restartWorker(workerId);
            });
            
            worker.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`❌ Worker exited with code: ${code}`);
                    this.restartWorker(workerId);
                }
            });
            
            return {
                id: workerId,
                worker,
                active: false,
                jobs: 0,
                startedAt: new Date()
            };
            
        } catch (error) {
            console.warn(`⚠️ Could not create worker thread: ${workerId}`, error.message);
            return null;
        }
    }

    async restartWorker(workerId) {
        console.log(`🔄 Restarting worker: ${workerId}`);
        
        const oldWorker = this.workers.get(workerId);
        if (oldWorker && oldWorker.worker) {
            await oldWorker.worker.terminate();
        }
        
        const newWorker = await this.createWorker(workerId);
        if (newWorker) {
            this.workers.set(workerId, newWorker);
        }
    }

    handleWorkerMessage(workerId, message) {
        const worker = this.workers.get(workerId);
        if (!worker) return;
        
        switch (message.type) {
            case 'job_completed':
                this.handleJobCompleted(message.job);
                break;
            case 'job_failed':
                this.handleJobFailed(message.job, message.error);
                break;
            case 'status_update':
                worker.active = message.active;
                worker.jobs = message.jobCount;
                break;
        }
    }

    // Event Handlers
    handleJobCompleted(job) {
        const jobId = job.id || job.bullJobId;
        const queueName = job.queue || 'unknown';
        
        this.metrics.completed++;
        this.metrics.active--;
        
        const queueInfo = this.queues.get(queueName);
        if (queueInfo) {
            queueInfo.metrics.processed++;
            queueInfo.metrics.active--;
        }
        
        const trackedJob = this.jobs.get(jobId);
        if (trackedJob) {
            trackedJob.status = 'completed';
            trackedJob.completedAt = new Date();
        }
        
        console.log(`✅ Job completed: ${jobId}`);
        this.emit('jobCompleted', { jobId, queueName, job });
    }

    handleJobFailed(job, error) {
        const jobId = job.id || job.bullJobId;
        const queueName = job.queue || 'unknown';
        
        this.metrics.failed++;
        this.metrics.active--;
        
        const queueInfo = this.queues.get(queueName);
        if (queueInfo) {
            queueInfo.metrics.failed++;
            queueInfo.metrics.active--;
        }
        
        const trackedJob = this.jobs.get(jobId);
        if (trackedJob) {
            trackedJob.status = 'failed';
            trackedJob.failedAt = new Date();
            trackedJob.error = error.message;
        }
        
        console.error(`❌ Job failed: ${jobId}`, error);
        this.emit('jobFailed', { jobId, queueName, job, error });
    }

    handleJobActive(job) {
        const jobId = job.id || job.bullJobId;
        const queueName = job.queue || 'unknown';
        
        this.metrics.active++;
        this.metrics.waiting--;
        
        const queueInfo = this.queues.get(queueName);
        if (queueInfo) {
            queueInfo.metrics.active++;
            queueInfo.metrics.waiting--;
        }
        
        const trackedJob = this.jobs.get(jobId);
        if (trackedJob) {
            trackedJob.status = 'active';
            trackedJob.startedAt = new Date();
        }
        
        this.emit('jobActive', { jobId, queueName, job });
    }

    handleJobWaiting(job) {
        const jobId = job.id || job.bullJobId;
        const queueName = job.queue || 'unknown';
        
        this.emit('jobWaiting', { jobId, queueName, job });
    }

    handleMemoryJobCompleted(queueName, job, result) {
        const queueInfo = this.queues.get(queueName);
        if (!queueInfo) return;
        
        // Move from active to completed
        queueInfo.queue.active.delete(job.id);
        job.status = 'completed';
        job.completedAt = new Date();
        job.result = result;
        queueInfo.queue.completed.push(job);
        
        this.handleJobCompleted(job);
    }

    handleMemoryJobFailed(queueName, job, error) {
        const queueInfo = this.queues.get(queueName);
        if (!queueInfo) return;
        
        job.attempts++;
        job.lastError = error.message;
        
        if (job.attempts < job.maxAttempts) {
            // Retry the job
            job.status = 'waiting';
            queueInfo.queue.jobs.push(job);
            this.metrics.retries++;
            console.log(`🔄 Retrying job: ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);
        } else {
            // Move to failed
            queueInfo.queue.active.delete(job.id);
            job.status = 'failed';
            job.failedAt = new Date();
            queueInfo.queue.failed.push(job);
            
            this.handleJobFailed(job, error);
        }
    }

    // Scheduling
    scheduleJob(queueName, jobData, cronPattern, options = {}) {
        if (!this.config.enableScheduling) {
            throw new Error('Job scheduling is disabled');
        }
        
        const scheduleId = this.generateJobId();
        const schedule = {
            id: scheduleId,
            queueName,
            jobData,
            cronPattern,
            options,
            enabled: true,
            createdAt: new Date(),
            lastRun: null,
            nextRun: this.calculateNextRun(cronPattern)
        };
        
        this.scheduledJobs.set(scheduleId, schedule);
        
        console.log(`⏰ Job scheduled: ${scheduleId} (${cronPattern})`);
        return scheduleId;
    }

    calculateNextRun(cronPattern) {
        // Simple cron parser - in production, use a proper cron library
        const now = new Date();
        
        // Handle simple patterns like '*/5 * * * *' (every 5 minutes)
        if (cronPattern.startsWith('*/')) {
            const minutes = parseInt(cronPattern.substring(2, cronPattern.indexOf(' ')));
            return new Date(now.getTime() + (minutes * 60 * 1000));
        }
        
        // Default to 1 hour from now
        return new Date(now.getTime() + (60 * 60 * 1000));
    }

    startScheduler() {
        if (!this.config.enableScheduling) return;
        
        console.log('⏰ Starting job scheduler...');
        
        this.schedulerInterval = setInterval(() => {
            this.processScheduledJobs();
        }, 60000); // Check every minute
    }

    async processScheduledJobs() {
        const now = new Date();
        
        for (const [scheduleId, schedule] of this.scheduledJobs) {
            if (schedule.enabled && schedule.nextRun <= now) {
                try {
                    await this.addJob(schedule.queueName, schedule.jobData, schedule.options);
                    
                    schedule.lastRun = now;
                    schedule.nextRun = this.calculateNextRun(schedule.cronPattern);
                    
                    console.log(`⏰ Scheduled job executed: ${scheduleId}`);
                } catch (error) {
                    console.error(`❌ Scheduled job failed: ${scheduleId}`, error);
                }
            }
        }
    }

    // Monitoring and Metrics
    startMetricsCollection() {
        console.log('📊 Starting metrics collection...');
        
        this.metricsInterval = setInterval(() => {
            this.collectMetrics();
        }, 30000); // Collect every 30 seconds
    }

    collectMetrics() {
        // Update queue metrics
        for (const [queueName, queueInfo] of this.queues) {
            if (this.redisConnected && this.Bull) {
                queueInfo.queue.getWaiting().then(jobs => {
                    queueInfo.metrics.waiting = jobs.length;
                });
                queueInfo.queue.getActive().then(jobs => {
                    queueInfo.metrics.active = jobs.length;
                });
            }
        }
        
        // Emit metrics event
        this.emit('metrics', {
            timestamp: new Date(),
            global: this.metrics,
            queues: Object.fromEntries(
                Array.from(this.queues.entries()).map(([name, info]) => [name, info.metrics])
            ),
            workers: this.getWorkerStatuses()
        });
    }

    getWorkerStatuses() {
        const statuses = {};
        for (const [workerId, worker] of this.workers) {
            statuses[workerId] = {
                active: worker.active,
                jobs: worker.jobs,
                uptime: Date.now() - worker.startedAt.getTime()
            };
        }
        return statuses;
    }

    // Cleanup
    startCleanupProcess() {
        console.log('🧹 Starting cleanup process...');
        
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, this.config.cleanupInterval);
    }

    async performCleanup() {
        console.log('🧹 Performing queue cleanup...');
        
        const cutoffDate = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours ago
        
        // Clean up completed and failed jobs
        for (const [jobId, job] of this.jobs) {
            if ((job.status === 'completed' || job.status === 'failed') && 
                job.completedAt && job.completedAt < cutoffDate) {
                this.jobs.delete(jobId);
            }
        }
        
        // Clean up memory queues
        if (!this.redisConnected) {
            for (const [queueName, queueInfo] of this.queues) {
                queueInfo.queue.completed = queueInfo.queue.completed
                    .filter(job => job.completedAt > cutoffDate);
                queueInfo.queue.failed = queueInfo.queue.failed
                    .filter(job => job.failedAt > cutoffDate);
            }
        }
        
        console.log('✅ Cleanup completed');
    }

    // Utility Methods
    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // API Methods
    getQueueStats(queueName = null) {
        if (queueName) {
            const queueInfo = this.queues.get(queueName);
            return queueInfo ? {
                name: queueName,
                config: queueInfo.config,
                metrics: queueInfo.metrics
            } : null;
        }
        
        const stats = {};
        for (const [name, queueInfo] of this.queues) {
            stats[name] = {
                config: queueInfo.config,
                metrics: queueInfo.metrics
            };
        }
        return stats;
    }

    getJobStatus(jobId) {
        return this.jobs.get(jobId) || null;
    }

    async pauseQueue(queueName) {
        const queueInfo = this.queues.get(queueName);
        if (!queueInfo) {
            throw new Error(`Queue not found: ${queueName}`);
        }
        
        if (this.redisConnected && this.Bull && queueInfo.queue.pause) {
            await queueInfo.queue.pause();
        }
        
        queueInfo.config.enabled = false;
        console.log(`⏸️ Queue paused: ${queueName}`);
    }

    async resumeQueue(queueName) {
        const queueInfo = this.queues.get(queueName);
        if (!queueInfo) {
            throw new Error(`Queue not found: ${queueName}`);
        }
        
        if (this.redisConnected && this.Bull && queueInfo.queue.resume) {
            await queueInfo.queue.resume();
        }
        
        queueInfo.config.enabled = true;
        console.log(`▶️ Queue resumed: ${queueName}`);
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up queue manager...');
        
        // Clear intervals
        if (this.metricsInterval) clearInterval(this.metricsInterval);
        if (this.cleanupInterval) clearInterval(this.cleanupInterval);
        if (this.schedulerInterval) clearInterval(this.schedulerInterval);
        
        // Close Redis connections
        if (this.redisConnected) {
            for (const [name, queueInfo] of this.queues) {
                if (queueInfo.queue.close) {
                    await queueInfo.queue.close();
                }
            }
        }
        
        // Terminate workers
        for (const [workerId, worker] of this.workers) {
            if (worker.worker) {
                await worker.worker.terminate();
            }
        }
        
        console.log('✅ Queue manager cleanup complete');
    }
}

module.exports = { QueueManager };