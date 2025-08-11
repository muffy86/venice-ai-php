// Computer Vision and Multi-Modal Processing
class VisionProcessor {
    constructor() {
        this.canvas = null;
        this.context = null;
        this.videoStream = null;
        this.isProcessing = false;
        this.models = {
            objectDetection: null,
            faceRecognition: null,
            textRecognition: null
        };
        this.processingQueue = [];
        this.maxQueueSize = 10;
        
        this.init();
    }

    async init() {
        try {
            await this.loadModels();
            this.setupCanvas();
            console.log('✅ Vision processor initialized');
            this.updateStatus('ready');
        } catch (error) {
            console.error('❌ Vision processor initialization failed:', error);
            this.updateStatus('error', error.message);
        }
    }

    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.canvas.style.display = 'none';
        document.body.appendChild(this.canvas);
    }

    updateStatus(status, message = '') {
        const event = new CustomEvent('visionStatusUpdate', {
            detail: { status, message, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    async loadModels() {
        // Load TensorFlow.js models
        if (typeof tf !== 'undefined') {
            try {
                // For now, we'll use TensorFlow.js without pre-trained models
                // Users can load their own models later
                console.log('📦 TensorFlow.js ready for model loading');
                
                // Example of how to load a model when available:
                // this.models.objectDetection = await tf.loadLayersModel('/path/to/your/model.json');
            } catch (error) {
                console.warn('⚠️ TensorFlow.js model loading issue:', error.message);
            }
        }

        // Initialize Tesseract for OCR
        if (typeof Tesseract !== 'undefined') {
            this.models.textRecognition = Tesseract;
            console.log('📝 OCR engine ready');
        }
    }

    async processImage(imageData, options = {}) {
        const results = {
            timestamp: Date.now(),
            objects: [],
            faces: [],
            text: '',
            analysis: {}
        };

        try {
            // Object detection
            if (options.detectObjects && this.models.objectDetection) {
                results.objects = await this.detectObjects(imageData);
            }

            // Face detection
            if (options.detectFaces) {
                results.faces = await this.detectFaces(imageData);
            }

            // Text extraction
            if (options.extractText && this.models.textRecognition) {
                results.text = await this.extractText(imageData);
            }

            // Scene analysis
            if (options.analyzeScene) {
                results.analysis = await this.analyzeScene(imageData);
            }

            return results;
        } catch (error) {
            console.error('Image processing failed:', error);
            throw error;
        }
    }

    async detectObjects(imageData) {
        if (!this.models.objectDetection) {
            throw new Error('Object detection model not loaded');
        }

        try {
            // Convert image to tensor
            const tensor = tf.browser.fromPixels(imageData);
            const resized = tf.image.resizeBilinear(tensor, [224, 224]);
            const normalized = resized.div(255.0);
            const batched = normalized.expandDims(0);

            // Run inference
            const predictions = await this.models.objectDetection.predict(batched);
            const results = await predictions.data();

            // Process results
            const objects = this.processObjectDetectionResults(results);

            // Clean up tensors
            tensor.dispose();
            resized.dispose();
            normalized.dispose();
            batched.dispose();
            predictions.dispose();

            return objects;
        } catch (error) {
            console.error('Object detection failed:', error);
            return [];
        }
    }

    async detectFaces(imageData) {
        // Simplified face detection using canvas
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            ctx.putImageData(imageData, 0, 0);

            // Use browser's built-in face detection if available
            if ('FaceDetector' in window) {
                const faceDetector = new FaceDetector();
                faceDetector.detect(canvas)
                    .then(faces => {
                        resolve(faces.map(face => ({
                            boundingBox: face.boundingBox,
                            landmarks: face.landmarks || []
                        })));
                    })
                    .catch(() => resolve([]));
            } else {
                // Fallback: return empty array
                resolve([]);
            }
        });
    }

    async extractText(imageData) {
        if (!this.models.textRecognition) {
            throw new Error('OCR engine not available');
        }

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            ctx.putImageData(imageData, 0, 0);

            const result = await Tesseract.recognize(canvas, 'eng', {
                logger: m => console.log(m)
            });

            return result.data.text;
        } catch (error) {
            console.error('Text extraction failed:', error);
            return '';
        }
    }

    async analyzeScene(imageData) {
        // Basic scene analysis
        const analysis = {
            brightness: this.calculateBrightness(imageData),
            dominantColors: this.getDominantColors(imageData),
            complexity: this.calculateComplexity(imageData)
        };

        return analysis;
    }

    calculateBrightness(imageData) {
        let total = 0;
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            total += (r + g + b) / 3;
        }
        
        return total / (data.length / 4);
    }

    getDominantColors(imageData) {
        const colorMap = new Map();
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = Math.floor(data[i] / 32) * 32;
            const g = Math.floor(data[i + 1] / 32) * 32;
            const b = Math.floor(data[i + 2] / 32) * 32;
            const color = `rgb(${r},${g},${b})`;
            
            colorMap.set(color, (colorMap.get(color) || 0) + 1);
        }
        
        return Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([color, count]) => ({ color, count }));
    }

    calculateComplexity(imageData) {
        // Simple complexity measure based on edge detection
        const data = imageData.data;
        const width = imageData.width;
        let edgeCount = 0;
        
        for (let i = 0; i < data.length - width * 4; i += 4) {
            const current = data[i] + data[i + 1] + data[i + 2];
            const below = data[i + width * 4] + data[i + width * 4 + 1] + data[i + width * 4 + 2];
            
            if (Math.abs(current - below) > 100) {
                edgeCount++;
            }
        }
        
        return edgeCount / (data.length / 4);
    }

    processObjectDetectionResults(results) {
        // Process raw model output into structured objects
        // This would depend on the specific model format
        return [];
    }

    async startVideoStream(constraints = { video: true }) {
        try {
            this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            return this.videoStream;
        } catch (error) {
            console.error('Failed to start video stream:', error);
            throw error;
        }
    }

    stopVideoStream() {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
        }
    }

    captureFrame(videoElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0);
        
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    async processImageFile(file, options = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const img = new Image();
                img.onload = async () => {
                    try {
                        this.canvas.width = img.width;
                        this.canvas.height = img.height;
                        this.context.drawImage(img, 0, 0);
                        
                        const imageData = this.context.getImageData(0, 0, img.width, img.height);
                        const results = await this.processImage(imageData, options);
                        resolve(results);
                    } catch (error) {
                        reject(error);
                    }
                };
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async batchProcessImages(files, options = {}) {
        const results = [];
        const batchId = this.generateId();
        
        this.updateStatus('processing', `Processing batch of ${files.length} images`);
        
        for (let i = 0; i < files.length; i++) {
            try {
                const result = await this.processImageFile(files[i], options);
                result.batchId = batchId;
                result.index = i;
                result.filename = files[i].name;
                results.push(result);
                
                // Update progress
                const progress = ((i + 1) / files.length) * 100;
                this.updateStatus('processing', `Progress: ${Math.round(progress)}%`);
            } catch (error) {
                console.error(`Failed to process image ${files[i].name}:`, error);
                results.push({
                    batchId,
                    index: i,
                    filename: files[i].name,
                    error: error.message
                });
            }
        }
        
        this.updateStatus('ready', `Batch processing completed: ${results.length} images`);
        return results;
    }

    async startRealTimeProcessing(videoElement, options = {}) {
        if (this.isProcessing) {
            throw new Error('Real-time processing already active');
        }
        
        this.isProcessing = true;
        const interval = options.interval || 1000; // Process every second
        
        const processFrame = async () => {
            if (!this.isProcessing) return;
            
            try {
                const imageData = this.captureFrame(videoElement);
                const results = await this.processImage(imageData, options);
                
                // Emit real-time results
                const event = new CustomEvent('visionRealTimeResults', {
                    detail: results
                });
                document.dispatchEvent(event);
                
                setTimeout(processFrame, interval);
            } catch (error) {
                console.error('Real-time processing error:', error);
                this.stopRealTimeProcessing();
            }
        };
        
        processFrame();
    }

    stopRealTimeProcessing() {
        this.isProcessing = false;
        this.updateStatus('ready', 'Real-time processing stopped');
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Research Engine for web intelligence and information gathering
class ResearchEngine {
    constructor() {
        this.cache = new Map();
        this.rateLimiter = new Map();
        this.searchHistory = [];
        this.maxHistorySize = 100;
        this.sources = {
            web: {
                enabled: true,
                apis: ['duckduckgo', 'bing', 'google']
            },
            academic: {
                enabled: true,
                apis: ['arxiv', 'pubmed', 'scholar']
            },
            news: {
                enabled: true,
                apis: ['newsapi', 'rss']
            }
        };
        
        this.init();
    }

    async init() {
        this.loadSearchHistory();
        console.log('🔍 Research engine initialized');
        this.updateStatus('ready');
    }

    updateStatus(status, message = '') {
        const event = new CustomEvent('researchStatusUpdate', {
            detail: { status, message, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    async search(query, options = {}) {
        const searchId = this.generateSearchId();
        this.updateStatus('searching', `Searching for: ${query}`);
        
        const results = {
            id: searchId,
            query,
            timestamp: Date.now(),
            sources: [],
            summary: '',
            relevanceScore: 0,
            searchTime: 0
        };

        const startTime = Date.now();

        try {
            // Add to search history
            this.addToHistory(query, options);
            
            // Check cache first
            const cacheKey = this.getCacheKey(query, options);
            if (this.cache.has(cacheKey) && !options.forceRefresh) {
                console.log('📋 Returning cached results');
                const cachedResults = this.cache.get(cacheKey);
                this.updateStatus('ready', 'Results retrieved from cache');
                return cachedResults;
            }

            // Check rate limits
            if (this.isRateLimited(options.source)) {
                throw new Error('Rate limit exceeded for this source');
            }

            // Perform searches across different sources
            const searchPromises = [];

            if (options.includeWeb !== false) {
                searchPromises.push(this.searchWeb(query, options));
            }

            if (options.includeAcademic) {
                searchPromises.push(this.searchAcademic(query, options));
            }

            if (options.includeNews) {
                searchPromises.push(this.searchNews(query, options));
            }

            // Wait for all searches to complete
            const searchResults = await Promise.allSettled(searchPromises);
            
            // Combine and process results
            searchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.sources.push(...result.value);
                }
            });

            // Generate summary and relevance score
            results.summary = await this.generateSummary(results.sources, query);
            results.relevanceScore = this.calculateRelevanceScore(results.sources, query);
            results.searchTime = Date.now() - startTime;

            // Cache results
            this.cache.set(cacheKey, results);
            this.updateRateLimit(options.source);

            this.updateStatus('ready', `Found ${results.sources.length} results in ${results.searchTime}ms`);
            
            // Emit search results event
            const event = new CustomEvent('researchResults', {
                detail: results
            });
            document.dispatchEvent(event);

            return results;

        } catch (error) {
            console.error('Research search failed:', error);
            this.updateStatus('error', error.message);
            throw error;
        }
    }

    addToHistory(query, options) {
        const historyEntry = {
            query,
            options,
            timestamp: Date.now()
        };
        
        this.searchHistory.unshift(historyEntry);
        
        // Limit history size
        if (this.searchHistory.length > this.maxHistorySize) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
        }
        
        this.saveSearchHistory();
    }

    getSearchHistory() {
        return this.searchHistory;
    }

    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
        console.log('🧹 Search history cleared');
    }

    saveSearchHistory() {
        try {
            localStorage.setItem('researchHistory', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.warn('Failed to save search history:', error);
        }
    }

    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('researchHistory');
            if (saved) {
                this.searchHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load search history:', error);
            this.searchHistory = [];
        }
    }

    async searchSimilar(query, options = {}) {
        // Find similar queries in history
        const similarQueries = this.searchHistory
            .filter(entry => this.calculateSimilarity(entry.query, query) > 0.7)
            .slice(0, 5);
        
        if (similarQueries.length > 0) {
            console.log(`Found ${similarQueries.length} similar queries in history`);
        }
        
        return this.search(query, options);
    }

    calculateSimilarity(str1, str2) {
        // Simple similarity calculation
        const words1 = str1.toLowerCase().split(' ');
        const words2 = str2.toLowerCase().split(' ');
        const intersection = words1.filter(word => words2.includes(word));
        return intersection.length / Math.max(words1.length, words2.length);
    }

    exportResults(results, format = 'json') {
        switch (format) {
            case 'json':
                return JSON.stringify(results, null, 2);
            case 'csv':
                return this.convertToCSV(results);
            case 'markdown':
                return this.convertToMarkdown(results);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    convertToCSV(results) {
        const headers = ['Title', 'URL', 'Snippet', 'Source', 'Type', 'Relevance'];
        const rows = results.sources.map(source => [
            source.title,
            source.url,
            source.snippet.replace(/"/g, '""'),
            source.source,
            source.type,
            source.relevance
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    convertToMarkdown(results) {
        let markdown = `# Research Results: ${results.query}\n\n`;
        markdown += `**Search Time:** ${results.searchTime}ms\n`;
        markdown += `**Relevance Score:** ${results.relevanceScore}\n`;
        markdown += `**Total Sources:** ${results.sources.length}\n\n`;
        
        if (results.summary) {
            markdown += `## Summary\n\n${results.summary}\n\n`;
        }
        
        markdown += `## Sources\n\n`;
        
        results.sources.forEach((source, index) => {
            markdown += `### ${index + 1}. ${source.title}\n\n`;
            markdown += `**URL:** [${source.url}](${source.url})\n\n`;
            markdown += `**Source:** ${source.source} (${source.type})\n\n`;
            markdown += `**Relevance:** ${source.relevance}\n\n`;
            markdown += `${source.snippet}\n\n---\n\n`;
        });
        
        return markdown;
    }
}

// Automation Engine for workflow orchestration and task scheduling
class AutomationEngine {
    constructor() {
        this.workflows = new Map();
        this.scheduledTasks = new Map();
        this.triggers = new Map();
        this.executionHistory = [];
        this.isRunning = false;
        this.schedulerInterval = null;
        this.maxHistorySize = 1000;
        
        this.init();
    }

    async init() {
        this.loadWorkflows();
        console.log('⚙️ Automation engine initialized');
        this.updateStatus('ready');
    }

    updateStatus(status, message = '') {
        const event = new CustomEvent('automationStatusUpdate', {
            detail: { status, message, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    createWorkflow(name, steps, options = {}) {
        const workflow = {
            id: this.generateId(),
            name,
            steps,
            options: {
                timeout: 300000, // 5 minutes default
                retryCount: 3,
                retryDelay: 1000,
                ...options
            },
            created: Date.now(),
            lastRun: null,
            runCount: 0,
            successCount: 0,
            failureCount: 0,
            isActive: true,
            tags: options.tags || []
        };

        this.workflows.set(workflow.id, workflow);
        this.saveWorkflows();
        
        console.log(`📋 Workflow created: ${name} (${workflow.id})`);
        return workflow.id;
    }

    async executeWorkflow(workflowId, context = {}) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }

        if (!workflow.isActive) {
            throw new Error(`Workflow ${workflowId} is not active`);
        }

        this.updateStatus('executing', `Running workflow: ${workflow.name}`);
        console.log(`🔄 Executing workflow: ${workflow.name}`);
        
        const execution = {
            id: this.generateId(),
            workflowId,
            workflowName: workflow.name,
            startTime: Date.now(),
            context: { ...context },
            results: [],
            status: 'running',
            currentStep: 0,
            totalSteps: workflow.steps.length
        };

        try {
            // Set timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Workflow timeout')), workflow.options.timeout);
            });

            const executionPromise = this.executeWorkflowSteps(workflow, execution);
            
            await Promise.race([executionPromise, timeoutPromise]);

            execution.status = 'completed';
            execution.endTime = Date.now();
            execution.duration = execution.endTime - execution.startTime;
            
            // Update workflow stats
            workflow.lastRun = execution.endTime;
            workflow.runCount++;
            workflow.successCount++;

            this.addToHistory(execution);
            this.saveWorkflows();
            
            this.updateStatus('ready', `Workflow completed: ${workflow.name} (${execution.duration}ms)`);
            console.log(`✅ Workflow completed: ${workflow.name}`);
            
            // Emit completion event
            const event = new CustomEvent('workflowCompleted', {
                detail: execution
            });
            document.dispatchEvent(event);
            
            return execution;

        } catch (error) {
            execution.status = 'failed';
            execution.error = error.message;
            execution.endTime = Date.now();
            execution.duration = execution.endTime - execution.startTime;
            
            workflow.failureCount++;
            this.addToHistory(execution);
            this.saveWorkflows();
            
            this.updateStatus('error', `Workflow failed: ${workflow.name} - ${error.message}`);
            console.error(`❌ Workflow failed: ${workflow.name}`, error);
            
            // Emit failure event
            const event = new CustomEvent('workflowFailed', {
                detail: execution
            });
            document.dispatchEvent(event);
            
            throw error;
        }
    }

    async executeWorkflowSteps(workflow, execution) {
        for (let i = 0; i < workflow.steps.length; i++) {
            const step = workflow.steps[i];
            execution.currentStep = i + 1;
            
            // Emit step start event
            const stepStartEvent = new CustomEvent('workflowStepStart', {
                detail: { execution, step, stepIndex: i }
            });
            document.dispatchEvent(stepStartEvent);
            
            let stepResult;
            let retryCount = 0;
            
            while (retryCount <= workflow.options.retryCount) {
                try {
                    stepResult = await this.executeStep(step, execution.context);
                    break; // Success, exit retry loop
                } catch (error) {
                    retryCount++;
                    if (retryCount > workflow.options.retryCount) {
                        throw error; // Max retries exceeded
                    }
                    
                    console.warn(`Step failed, retrying (${retryCount}/${workflow.options.retryCount}):`, error.message);
                    await new Promise(resolve => setTimeout(resolve, workflow.options.retryDelay));
                }
            }
            
            execution.results.push({
                stepIndex: i,
                stepType: step.type,
                result: stepResult,
                timestamp: Date.now()
            });
            
            // Update context with step results
            Object.assign(execution.context, stepResult);
            
            // Emit step completion event
            const stepCompleteEvent = new CustomEvent('workflowStepComplete', {
                detail: { execution, step, stepIndex: i, result: stepResult }
            });
            document.dispatchEvent(stepCompleteEvent);
        }
    }

    getWorkflows() {
        return Array.from(this.workflows.values());
    }

    getWorkflowById(id) {
        return this.workflows.get(id);
    }

    deleteWorkflow(id) {
        const workflow = this.workflows.get(id);
        if (workflow) {
            this.workflows.delete(id);
            this.saveWorkflows();
            console.log(`🗑️ Workflow deleted: ${workflow.name}`);
            return true;
        }
        return false;
    }

    cloneWorkflow(id, newName) {
        const original = this.workflows.get(id);
        if (!original) {
            throw new Error(`Workflow ${id} not found`);
        }
        
        const cloned = {
            ...original,
            id: this.generateId(),
            name: newName || `${original.name} (Copy)`,
            created: Date.now(),
            lastRun: null,
            runCount: 0,
            successCount: 0,
            failureCount: 0
        };
        
        this.workflows.set(cloned.id, cloned);
        this.saveWorkflows();
        
        return cloned.id;
    }

    getExecutionHistory() {
        return this.executionHistory;
    }

    addToHistory(execution) {
        this.executionHistory.unshift(execution);
        
        // Limit history size
        if (this.executionHistory.length > this.maxHistorySize) {
            this.executionHistory = this.executionHistory.slice(0, this.maxHistorySize);
        }
    }

    clearHistory() {
        this.executionHistory = [];
        console.log('🧹 Execution history cleared');
    }

    saveWorkflows() {
        try {
            const workflowData = Array.from(this.workflows.entries());
            localStorage.setItem('automationWorkflows', JSON.stringify(workflowData));
        } catch (error) {
            console.warn('Failed to save workflows:', error);
        }
    }

    loadWorkflows() {
        try {
            const saved = localStorage.getItem('automationWorkflows');
            if (saved) {
                const workflowData = JSON.parse(saved);
                this.workflows = new Map(workflowData);
                console.log(`📂 Loaded ${this.workflows.size} workflows from storage`);
            }
        } catch (error) {
            console.warn('Failed to load workflows:', error);
            this.workflows = new Map();
        }
    }

    exportWorkflow(id, format = 'json') {
        const workflow = this.workflows.get(id);
        if (!workflow) {
            throw new Error(`Workflow ${id} not found`);
        }
        
        switch (format) {
            case 'json':
                return JSON.stringify(workflow, null, 2);
            case 'yaml':
                return this.convertToYAML(workflow);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    importWorkflow(data, format = 'json') {
        let workflow;
        
        switch (format) {
            case 'json':
                workflow = JSON.parse(data);
                break;
            default:
                throw new Error(`Unsupported import format: ${format}`);
        }
        
        // Generate new ID and reset stats
        workflow.id = this.generateId();
        workflow.created = Date.now();
        workflow.lastRun = null;
        workflow.runCount = 0;
        workflow.successCount = 0;
        workflow.failureCount = 0;
        
        this.workflows.set(workflow.id, workflow);
        this.saveWorkflows();
        
        return workflow.id;
    }

    getWorkflowStats() {
        const workflows = Array.from(this.workflows.values());
        
        return {
            total: workflows.length,
            active: workflows.filter(w => w.isActive).length,
            inactive: workflows.filter(w => !w.isActive).length,
            totalRuns: workflows.reduce((sum, w) => sum + w.runCount, 0),
            totalSuccesses: workflows.reduce((sum, w) => sum + w.successCount, 0),
            totalFailures: workflows.reduce((sum, w) => sum + w.failureCount, 0),
            averageSuccessRate: workflows.length > 0 
                ? workflows.reduce((sum, w) => sum + (w.runCount > 0 ? w.successCount / w.runCount : 0), 0) / workflows.length 
                : 0
        };
    }

    // Scheduler methods for task automation
    startScheduler() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.schedulerInterval = setInterval(() => {
            this.checkScheduledTasks();
            this.checkTriggers();
        }, 60000); // Check every minute
        
        console.log('⏰ Scheduler started');
    }

    stopScheduler() {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
            this.isRunning = false;
            console.log('⏰ Scheduler stopped');
        }
    }

    checkScheduledTasks() {
        const now = Date.now();
        
        this.scheduledTasks.forEach(async (task, taskId) => {
            if (task.isActive && task.nextRun <= now) {
                try {
                    await this.executeWorkflow(task.workflowId);
                    task.nextRun = this.calculateNextRun(task.schedule);
                    console.log(`✅ Scheduled workflow executed: ${task.workflowId}`);
                } catch (error) {
                    console.error(`❌ Scheduled workflow failed: ${error.message}`);
                }
            }
        });
    }

    checkTriggers() {
        this.triggers.forEach(async (trigger, triggerId) => {
            if (trigger.isActive && this.evaluateTriggerCondition(trigger.condition)) {
                try {
                    await this.executeWorkflow(trigger.workflowId);
                    console.log(`🎯 Triggered workflow executed: ${trigger.workflowId}`);
                } catch (error) {
                    console.error(`❌ Triggered workflow failed: ${error.message}`);
                }
            }
        });
    }

    calculateNextRun(schedule) {
        const now = new Date();
        
        switch (schedule.type) {
            case 'interval':
                return now.getTime() + schedule.interval;
            case 'daily':
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(schedule.hour || 0, schedule.minute || 0, 0, 0);
                return tomorrow.getTime();
            case 'weekly':
                const nextWeek = new Date(now);
                nextWeek.setDate(nextWeek.getDate() + 7);
                return nextWeek.getTime();
            default:
                return now.getTime() + 3600000; // Default to 1 hour
        }
    }

    evaluateTriggerCondition(condition) {
        // Simple trigger condition evaluation
        // In a real implementation, this would be more sophisticated
        return false; // Placeholder
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Enhanced initialization with better error handling and UI integration
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing specialized engines...');
    
    try {
        if (!window.visionProcessor) {
            window.visionProcessor = new VisionProcessor();
        }
        if (!window.researchEngine) {
            window.researchEngine = new ResearchEngine();
        }
        if (!window.automationEngine) {
            window.automationEngine = new AutomationEngine();
        }
        
        // Set up global event listeners for UI integration
        setupSpecializedEngineEvents();
        
        console.log('✅ All specialized engines initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize specialized engines:', error);
    }
});

function setupSpecializedEngineEvents() {
    // Vision processor events
    document.addEventListener('visionStatusUpdate', (event) => {
        updateEngineStatus('vision', event.detail);
    });
    
    document.addEventListener('visionRealTimeResults', (event) => {
        displayVisionResults(event.detail);
    });
    
    // Research engine events
    document.addEventListener('researchStatusUpdate', (event) => {
        updateEngineStatus('research', event.detail);
    });
    
    document.addEventListener('researchResults', (event) => {
        displayResearchResults(event.detail);
    });
    
    // Automation engine events
    document.addEventListener('automationStatusUpdate', (event) => {
        updateEngineStatus('automation', event.detail);
    });
    
    document.addEventListener('workflowCompleted', (event) => {
        displayWorkflowResult(event.detail, 'success');
    });
    
    document.addEventListener('workflowFailed', (event) => {
        displayWorkflowResult(event.detail, 'error');
    });
}

function updateEngineStatus(engine, detail) {
    const statusElement = document.querySelector(`#${engine}-status`);
    if (statusElement) {
        statusElement.textContent = detail.status;
        statusElement.className = `status ${detail.status}`;
        
        if (detail.message) {
            statusElement.title = detail.message;
        }
    }
}

function displayVisionResults(results) {
    console.log('👁️ Vision results:', results);
    // Implement UI display logic
}

function displayResearchResults(results) {
    console.log('🔍 Research results:', results);
    // Implement UI display logic
}

function displayWorkflowResult(execution, type) {
    console.log(`⚙️ Workflow ${type}:`, execution);
    // Implement UI display logic
}