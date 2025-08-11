/**
 * Computer Vision Manager
 * Handles image analysis, object detection, OCR, and visual AI features
 */

class ComputerVisionManager {
    constructor() {
        this.isInitialized = false;
        this.models = new Map();
        this.processors = new Map();
        this.cache = new Map();
        this.canvas = null;
        this.context = null;
        this.videoElement = null;
        this.mediaStream = null;
        this.isCapturing = false;
        this.analysisHistory = [];
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.metrics = {
            imagesProcessed: 0,
            averageProcessingTime: 0,
            featuresDetected: new Map(),
            accuracy: 0.85
        };
    }

    async initialize() {
        try {
            // Initialize canvas for image processing
            this.initializeCanvas();

            // Initialize computer vision processors
            await this.initializeProcessors();

            // Load pre-trained models
            await this.loadModels();

            this.isInitialized = true;
            console.log('👁️ Computer Vision Manager initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Computer Vision Manager:', error);
            return false;
        }
    }

    initializeCanvas() {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');

        // Set up off-screen canvas for processing
        this.canvas.style.display = 'none';
        document.body.appendChild(this.canvas);
    }

    async initializeProcessors() {
        // Initialize different CV processors
        this.processors.set('objectDetection', new ObjectDetectionProcessor());
        this.processors.set('faceRecognition', new FaceRecognitionProcessor());
        this.processors.set('textRecognition', new TextRecognitionProcessor());
        this.processors.set('sceneAnalysis', new SceneAnalysisProcessor());
        this.processors.set('colorAnalysis', new ColorAnalysisProcessor());
        this.processors.set('imageClassification', new ImageClassificationProcessor());

        // Initialize each processor
        for (const [name, processor] of this.processors) {
            try {
                await processor.initialize();
                console.log(`✅ ${name} processor initialized`);
            } catch (error) {
                console.warn(`⚠️ Failed to initialize ${name} processor:`, error);
            }
        }
    }

    async loadModels() {
        // Load computer vision models
        const modelConfigs = [
            {
                name: 'coco-ssd',
                type: 'objectDetection',
                url: 'https://storage.googleapis.com/tfjs-models/savedmodel/coco_ssd_mobilenet_v2/model.json',
                description: 'Object detection using COCO dataset'
            },
            {
                name: 'mobilenet',
                type: 'imageClassification',
                url: 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json',
                description: 'Image classification using MobileNet'
            },
            {
                name: 'face-api',
                type: 'faceRecognition',
                url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model/',
                description: 'Face detection and recognition'
            }
        ];

        for (const config of modelConfigs) {
            try {
                const model = await this.loadModel(config);
                this.models.set(config.name, model);
                console.log(`📦 Loaded model: ${config.name}`);
            } catch (error) {
                console.warn(`⚠️ Failed to load model ${config.name}:`, error);
            }
        }
    }

    async loadModel(config) {
        // Model loading implementation based on type
        switch (config.type) {
            case 'objectDetection':
                return await this.loadTensorFlowModel(config.url);
            case 'imageClassification':
                return await this.loadTensorFlowModel(config.url);
            case 'faceRecognition':
                return await this.loadFaceAPIModel(config.url);
            default:
                throw new Error(`Unknown model type: ${config.type}`);
        }
    }

    async loadTensorFlowModel(url) {
        // Placeholder for TensorFlow.js model loading
        return {
            type: 'tensorflow',
            url: url,
            loaded: true,
            predict: async (input) => {
                // Mock prediction for now
                return { predictions: [], confidence: 0.5 };
            }
        };
    }

    async loadFaceAPIModel(url) {
        // Placeholder for Face-API model loading
        return {
            type: 'face-api',
            url: url,
            loaded: true,
            detectFaces: async (input) => {
                // Mock face detection for now
                return { faces: [], landmarks: [] };
            }
        };
    }

    async analyzeImage(imageInput, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Computer Vision Manager not initialized');
        }

        const startTime = Date.now();

        try {
            // Convert input to image data
            const imageData = await this.preprocessImage(imageInput);

            // Check cache
            const cacheKey = this.createCacheKey(imageData, options);
            if (this.cache.has(cacheKey) && !options.skipCache) {
                return this.cache.get(cacheKey);
            }

            // Perform analysis based on requested features
            const analysis = await this.performAnalysis(imageData, options);

            // Cache result
            if (!options.skipCache) {
                this.cache.set(cacheKey, analysis);
                if (this.cache.size > 100) {
                    this.cleanCache();
                }
            }

            // Update metrics
            this.updateMetrics(startTime, analysis);

            // Store in history
            this.analysisHistory.push({
                timestamp: new Date().toISOString(),
                analysis,
                options
            });

            return analysis;

        } catch (error) {
            console.error('❌ Image analysis error:', error);
            throw error;
        }
    }

    async preprocessImage(imageInput) {
        let imageElement;

        if (typeof imageInput === 'string') {
            // URL or base64 data
            imageElement = await this.loadImageFromUrl(imageInput);
        } else if (imageInput instanceof File) {
            // File object
            imageElement = await this.loadImageFromFile(imageInput);
        } else if (imageInput instanceof HTMLImageElement) {
            // Already an image element
            imageElement = imageInput;
        } else if (imageInput instanceof ImageData) {
            // ImageData object
            return imageInput;
        } else {
            throw new Error('Unsupported image input type');
        }

        // Draw image to canvas and get image data
        this.canvas.width = imageElement.naturalWidth || imageElement.width;
        this.canvas.height = imageElement.naturalHeight || imageElement.height;
        this.context.drawImage(imageElement, 0, 0);

        return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    async loadImageFromUrl(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    async loadImageFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async performAnalysis(imageData, options) {
        const analysis = {
            timestamp: new Date().toISOString(),
            dimensions: { width: imageData.width, height: imageData.height },
            features: {},
            confidence: 0,
            processingTime: 0
        };

        const features = options.features || ['objects', 'scene', 'colors', 'text'];

        // Perform different types of analysis
        for (const feature of features) {
            try {
                switch (feature) {
                    case 'objects':
                        analysis.features.objects = await this.detectObjects(imageData);
                        break;
                    case 'faces':
                        analysis.features.faces = await this.detectFaces(imageData);
                        break;
                    case 'text':
                        analysis.features.text = await this.recognizeText(imageData);
                        break;
                    case 'scene':
                        analysis.features.scene = await this.analyzeScene(imageData);
                        break;
                    case 'colors':
                        analysis.features.colors = await this.analyzeColors(imageData);
                        break;
                    case 'classification':
                        analysis.features.classification = await this.classifyImage(imageData);
                        break;
                    case 'landmarks':
                        analysis.features.landmarks = await this.detectLandmarks(imageData);
                        break;
                }
            } catch (error) {
                console.warn(`Failed to analyze ${feature}:`, error);
                analysis.features[feature] = { error: error.message };
            }
        }

        // Calculate overall confidence
        analysis.confidence = this.calculateOverallConfidence(analysis.features);

        return analysis;
    }

    async detectObjects(imageData) {
        const processor = this.processors.get('objectDetection');
        if (!processor) {
            return { objects: [], error: 'Object detection processor not available' };
        }

        return await processor.detect(imageData);
    }

    async detectFaces(imageData) {
        const processor = this.processors.get('faceRecognition');
        if (!processor) {
            return { faces: [], error: 'Face recognition processor not available' };
        }

        return await processor.detect(imageData);
    }

    async recognizeText(imageData) {
        const processor = this.processors.get('textRecognition');
        if (!processor) {
            return { text: [], error: 'Text recognition processor not available' };
        }

        return await processor.recognize(imageData);
    }

    async analyzeScene(imageData) {
        const processor = this.processors.get('sceneAnalysis');
        if (!processor) {
            return { scene: 'unknown', error: 'Scene analysis processor not available' };
        }

        return await processor.analyze(imageData);
    }

    async analyzeColors(imageData) {
        const processor = this.processors.get('colorAnalysis');
        if (!processor) {
            return { colors: [], error: 'Color analysis processor not available' };
        }

        return await processor.analyze(imageData);
    }

    async classifyImage(imageData) {
        const processor = this.processors.get('imageClassification');
        if (!processor) {
            return { categories: [], error: 'Image classification processor not available' };
        }

        return await processor.classify(imageData);
    }

    async detectLandmarks(imageData) {
        // Placeholder for landmark detection
        return {
            landmarks: [],
            confidence: 0.5,
            note: 'Landmark detection not yet implemented'
        };
    }

    calculateOverallConfidence(features) {
        let totalConfidence = 0;
        let count = 0;

        for (const [key, feature] of Object.entries(features)) {
            if (feature.confidence !== undefined) {
                totalConfidence += feature.confidence;
                count++;
            }
        }

        return count > 0 ? totalConfidence / count : 0.5;
    }

    async startCameraCapture(options = {}) {
        try {
            const constraints = {
                video: {
                    width: { ideal: options.width || 1280 },
                    height: { ideal: options.height || 720 },
                    facingMode: options.facingMode || 'user'
                }
            };

            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

            if (!this.videoElement) {
                this.videoElement = document.createElement('video');
                this.videoElement.style.display = 'none';
                document.body.appendChild(this.videoElement);
            }

            this.videoElement.srcObject = this.mediaStream;
            await this.videoElement.play();

            this.isCapturing = true;
            console.log('📹 Camera capture started');

            return true;
        } catch (error) {
            console.error('❌ Failed to start camera capture:', error);
            throw error;
        }
    }

    async stopCameraCapture() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }

        this.isCapturing = false;
        console.log('📹 Camera capture stopped');
    }

    async captureFrame() {
        if (!this.isCapturing || !this.videoElement) {
            throw new Error('Camera not capturing');
        }

        this.canvas.width = this.videoElement.videoWidth;
        this.canvas.height = this.videoElement.videoHeight;
        this.context.drawImage(this.videoElement, 0, 0);

        return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    async analyzeVideoFrame(options = {}) {
        const frameData = await this.captureFrame();
        return await this.analyzeImage(frameData, options);
    }

    createCacheKey(imageData, options) {
        // Create a simple hash based on image dimensions and options
        const key = JSON.stringify({
            width: imageData.width,
            height: imageData.height,
            features: options.features || [],
            checksum: this.calculateImageChecksum(imageData)
        });

        return btoa(key).substring(0, 64);
    }

    calculateImageChecksum(imageData) {
        // Simple checksum calculation
        let checksum = 0;
        const data = imageData.data;

        // Sample every 100th pixel to avoid performance issues
        for (let i = 0; i < data.length; i += 400) {
            checksum += data[i] + data[i + 1] + data[i + 2];
        }

        return checksum.toString(36);
    }

    cleanCache() {
        const entries = Array.from(this.cache.entries());
        const toRemove = entries.slice(0, Math.floor(entries.length / 2));
        toRemove.forEach(([key]) => this.cache.delete(key));
    }

    updateMetrics(startTime, analysis) {
        this.metrics.imagesProcessed++;

        const processingTime = Date.now() - startTime;
        this.metrics.averageProcessingTime =
            (this.metrics.averageProcessingTime + processingTime) / 2;

        // Update feature detection counts
        for (const [feature, data] of Object.entries(analysis.features)) {
            if (!data.error) {
                const count = this.metrics.featuresDetected.get(feature) || 0;
                this.metrics.featuresDetected.set(feature, count + 1);
            }
        }

        // Update accuracy based on confidence
        if (analysis.confidence > 0) {
            this.metrics.accuracy = (this.metrics.accuracy + analysis.confidence) / 2;
        }
    }

    // Public API methods
    getMetrics() {
        return { ...this.metrics };
    }

    getAnalysisHistory(limit = 10) {
        return this.analysisHistory.slice(-limit);
    }

    getSupportedFormats() {
        return [...this.supportedFormats];
    }

    clearCache() {
        this.cache.clear();
    }

    clearHistory() {
        this.analysisHistory = [];
    }
}

// Processor classes for different CV tasks
class ObjectDetectionProcessor {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
        return true;
    }

    async detect(imageData) {
        // Mock object detection
        return {
            objects: [
                { label: 'person', confidence: 0.85, box: [100, 100, 200, 300] },
                { label: 'car', confidence: 0.72, box: [300, 200, 150, 100] }
            ],
            confidence: 0.78
        };
    }
}

class FaceRecognitionProcessor {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
        return true;
    }

    async detect(imageData) {
        // Mock face detection
        return {
            faces: [
                {
                    confidence: 0.92,
                    box: [150, 150, 100, 120],
                    landmarks: { eyes: [], nose: [], mouth: [] },
                    age: 25,
                    gender: 'unknown',
                    emotion: 'neutral'
                }
            ],
            confidence: 0.92
        };
    }
}

class TextRecognitionProcessor {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
        return true;
    }

    async recognize(imageData) {
        // Mock text recognition (OCR)
        return {
            text: [
                { content: 'Sample Text', confidence: 0.88, box: [50, 50, 200, 30] },
                { content: 'Another Line', confidence: 0.75, box: [50, 90, 180, 25] }
            ],
            fullText: 'Sample Text\nAnother Line',
            confidence: 0.81
        };
    }
}

class SceneAnalysisProcessor {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
        return true;
    }

    async analyze(imageData) {
        // Mock scene analysis
        return {
            scene: 'indoor',
            environment: 'office',
            lighting: 'bright',
            mood: 'professional',
            confidence: 0.76
        };
    }
}

class ColorAnalysisProcessor {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
        return true;
    }

    async analyze(imageData) {
        // Actual color analysis implementation
        const colors = this.extractDominantColors(imageData);

        return {
            dominantColors: colors,
            colorPalette: this.generateColorPalette(colors),
            contrast: this.calculateContrast(imageData),
            brightness: this.calculateBrightness(imageData),
            confidence: 0.95
        };
    }

    extractDominantColors(imageData) {
        const data = imageData.data;
        const colorCounts = new Map();

        // Sample pixels and count colors
        for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Quantize colors to reduce noise
            const quantR = Math.floor(r / 32) * 32;
            const quantG = Math.floor(g / 32) * 32;
            const quantB = Math.floor(b / 32) * 32;

            const colorKey = `${quantR},${quantG},${quantB}`;
            colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
        }

        // Get top 5 colors
        const sortedColors = Array.from(colorCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([color, count]) => {
                const [r, g, b] = color.split(',').map(Number);
                return {
                    rgb: [r, g, b],
                    hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
                    percentage: (count / (data.length / 4)) * 100
                };
            });

        return sortedColors;
    }

    generateColorPalette(dominantColors) {
        return dominantColors.map(color => color.hex);
    }

    calculateContrast(imageData) {
        // Simple contrast calculation
        const data = imageData.data;
        let min = 255, max = 0;

        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            min = Math.min(min, gray);
            max = Math.max(max, gray);
        }

        return (max - min) / 255;
    }

    calculateBrightness(imageData) {
        const data = imageData.data;
        let total = 0;

        for (let i = 0; i < data.length; i += 4) {
            total += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }

        return total / (data.length / 4) / 255;
    }
}

class ImageClassificationProcessor {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
        return true;
    }

    async classify(imageData) {
        // Mock image classification
        return {
            categories: [
                { label: 'technology', confidence: 0.82 },
                { label: 'workspace', confidence: 0.67 },
                { label: 'indoor', confidence: 0.91 }
            ],
            topCategory: 'indoor',
            confidence: 0.80
        };
    }
}

// Export for use in other modules
window.ComputerVisionManager = ComputerVisionManager;
