/**
 * Configuration file for Gesture 3D Sculptor
 * Customize these settings to adjust the behavior of the application
 */

const AppConfig = {
    // ==================== HAND TRACKING SETTINGS ====================
    handTracking: {
        // Maximum number of hands to detect (1 or 2)
        maxNumHands: 2,

        // Model complexity: 0 (lite) or 1 (full)
        // Higher = more accurate but slower
        modelComplexity: 1,

        // Minimum confidence for initial hand detection (0.0 - 1.0)
        minDetectionConfidence: 0.5,

        // Minimum confidence for hand tracking between frames (0.0 - 1.0)
        minTrackingConfidence: 0.5,

        // Video dimensions
        videoWidth: 640,
        videoHeight: 480
    },

    // ==================== GESTURE SETTINGS ====================
    gestures: {
        // Pinch detection threshold (distance between thumb and index)
        pinchThreshold: 0.05,

        // Open palm detection threshold
        openPalmThreshold: 0.2,

        // Fist detection threshold
        fistThreshold: 0.15,

        // Gesture sensitivity multipliers
        rotationSensitivity: 5.0,
        scaleSensitivity: 1.0,

        // Minimum/maximum scale limits
        minScale: 0.3,
        maxScale: 5.0,

        // Gesture smoothing (0 = no smoothing, higher = more smoothing)
        smoothingFactor: 0.3
    },

    // ==================== 3D SCENE SETTINGS ====================
    scene: {
        // Background color (hex)
        backgroundColor: 0x0a0a1a,

        // Fog settings
        fogEnabled: true,
        fogColor: 0x0a0a1a,
        fogNear: 10,
        fogFar: 50,

        // Camera settings
        camera: {
            fov: 75,
            near: 0.1,
            far: 1000,
            initialPosition: { x: 0, y: 0, z: 5 }
        },

        // Renderer settings
        renderer: {
            antialias: true,
            alpha: true,
            shadowsEnabled: true,
            shadowMapType: 'PCFSoft', // 'Basic', 'PCF', 'PCFSoft', 'VSM'
            pixelRatio: window.devicePixelRatio || 1
        }
    },

    // ==================== LIGHTING SETTINGS ====================
    lighting: {
        ambient: {
            color: 0xffffff,
            intensity: 0.6
        },

        directional: {
            color: 0xffffff,
            intensity: 0.8,
            position: { x: 5, y: 5, z: 5 },
            castShadow: true
        },

        pointLights: [
            {
                color: 0x667eea,
                intensity: 1.0,
                distance: 100,
                position: { x: -5, y: 5, z: 0 }
            },
            {
                color: 0x764ba2,
                intensity: 1.0,
                distance: 100,
                position: { x: 5, y: -5, z: 0 }
            }
        ]
    },

    // ==================== PARTICLE SYSTEM SETTINGS ====================
    particles: {
        count: 1000,
        size: 0.05,
        opacity: 0.6,
        color: 0xffffff,
        colorVariation: true,

        // Movement
        rotationSpeed: { x: 0.0005, y: 0.001 },

        // Distribution
        spreadRadius: 20,

        // Rendering
        blending: 'additive', // 'normal', 'additive', 'subtractive'
        transparent: true
    },

    // ==================== TRAIL SETTINGS ====================
    trails: {
        enabled: false,
        maxTrails: 50,
        trailLifetime: 1.0, // seconds
        trailSize: 0.1,
        trailOpacity: 0.6,
        fadeSpeed: 0.02,
        shrinkSpeed: 0.95
    },

    // ==================== MODEL SETTINGS ====================
    models: {
        // Default model on startup
        defaultModel: 'cube',

        // Default material
        defaultMaterial: 'standard',

        // Default color
        defaultColor: 0x667eea,

        // Material properties
        materials: {
            standard: {
                metalness: 0.5,
                roughness: 0.2,
                emissiveIntensity: 0.2
            },
            physical: {
                metalness: 0.7,
                roughness: 0.1,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1,
                reflectivity: 1.0
            },
            toon: {
                gradientMap: null // Can be customized
            }
        },

        // Auto-rotation settings
        autoRotate: {
            enabled: false,
            speedX: 0.005,
            speedY: 0.01
        }
    },

    // ==================== EFFECTS SETTINGS ====================
    effects: {
        // Glow effect
        glow: {
            enabled: true,
            intensity: 0.2
        },

        // Bloom effect (post-processing)
        bloom: {
            enabled: false,
            strength: 1.5,
            radius: 0.4,
            threshold: 0.85
        },

        // Chromatic aberration
        chromaticAberration: {
            enabled: false,
            offset: 0.002
        },

        // Vignette
        vignette: {
            enabled: false,
            offset: 1.0,
            darkness: 1.0
        }
    },

    // ==================== UI SETTINGS ====================
    ui: {
        // Show/hide UI elements on startup
        showVideoFeed: true,
        showControlPanel: true,
        showGestureInfo: true,
        showStatusIndicator: true,

        // UI positioning (can be 'top-left', 'top-right', 'bottom-left', 'bottom-right')
        videoPosition: 'top-right',
        controlPanelPosition: 'top-left',

        // UI colors
        accentColor: '#667eea',
        secondaryColor: '#764ba2',

        // Video feed size
        videoWidth: 320,
        videoHeight: 240
    },

    // ==================== PERFORMANCE SETTINGS ====================
    performance: {
        // Target frame rate (0 = unlimited)
        targetFPS: 60,

        // Auto-adjust quality based on FPS
        autoAdjustQuality: true,

        // Quality thresholds
        lowFPSThreshold: 30,
        highFPSThreshold: 55,

        // Quality adjustment settings
        qualityAdjustment: {
            reduceParticles: true,
            reduceModelComplexity: true,
            disableEffects: true
        },

        // Stats display
        showFPS: true,
        updateStatsInterval: 1000 // milliseconds
    },

    // ==================== EXPORT SETTINGS ====================
    export: {
        // Screenshot settings
        screenshot: {
            format: 'png', // 'png' or 'jpg'
            quality: 0.92, // For JPG only (0.0 - 1.0)
            filename: 'gesture-3d-{timestamp}'
        },

        // Model export settings
        modelExport: {
            format: 'json', // 'json', 'obj', 'gltf'
            includeTransforms: true,
            includeColors: true,
            includeMaterials: true,
            filename: 'model-{timestamp}'
        }
    },

    // ==================== ADVANCED SETTINGS ====================
    advanced: {
        // Enable debug mode
        debugMode: false,

        // Show hand landmarks on video
        showLandmarks: true,

        // Show hand connections
        showConnections: true,

        // Landmark drawing style
        landmarkStyle: {
            color: '#FF0000',
            lineWidth: 1,
            radius: 3
        },

        // Connection drawing style
        connectionStyle: {
            color: '#00FF00',
            lineWidth: 2
        },

        // Enable gesture logging
        logGestures: false,

        // Enable performance monitoring
        monitorPerformance: true,

        // Custom gesture configurations
        customGestures: {
            enabled: false,
            gestures: [
                // Add custom gestures here
                // Example:
                // {
                //     name: 'thumbs_up',
                //     action: 'increaseScale',
                //     threshold: 0.8
                // }
            ]
        }
    },

    // ==================== KEYBOARD SHORTCUTS ====================
    keyboard: {
        enabled: true,
        shortcuts: {
            reset: 'r',
            screenshot: 's',
            fullscreen: 'f',
            random: ' ', // spacebar
            toggleUI: 'h',
            toggleParticles: 'p',
            toggleTrails: 't',
            nextModel: 'n',
            previousModel: 'p',
            increaseComplexity: '+',
            decreaseComplexity: '-'
        }
    },

    // ==================== PRESET SCENES ====================
    presets: [
        {
            name: 'Neon Dreams',
            model: 'torusknot',
            color: 0xff006e,
            material: 'physical',
            particles: true,
            particleCount: 2000,
            glow: true
        },
        {
            name: 'Crystal Cave',
            model: 'icosahedron',
            color: 0x3a86ff,
            material: 'physical',
            particles: true,
            particleCount: 1500,
            glow: false
        },
        {
            name: 'Retro Wireframe',
            model: 'sphere',
            color: 0xff00ff,
            material: 'wireframe',
            particles: false,
            glow: true
        },
        {
            name: 'Minimalist',
            model: 'cube',
            color: 0xffffff,
            material: 'standard',
            particles: false,
            glow: false
        },
        {
            name: 'Cosmic',
            model: 'dodecahedron',
            color: 0x8338ec,
            material: 'standard',
            particles: true,
            particleCount: 3000,
            glow: true
        }
    ],

    // ==================== TUTORIAL SETTINGS ====================
    tutorial: {
        // Show tutorial on first load
        showOnFirstLoad: true,

        // Tutorial steps
        steps: [
            {
                title: 'Welcome!',
                description: 'Use your hands to control 3D objects',
                duration: 3000
            },
            {
                title: 'Pinch to Scale',
                description: 'Pinch thumb and index finger together',
                duration: 3000
            },
            {
                title: 'Drag to Rotate',
                description: 'Open your palm and move your hand',
                duration: 3000
            },
            {
                title: 'Explore!',
                description: 'Try different models and effects',
                duration: 3000
            }
        ]
    }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Apply a preset configuration
 * @param {string} presetName - Name of the preset to apply
 */
AppConfig.applyPreset = function(presetName) {
    const preset = this.presets.find(p => p.name === presetName);
    if (preset) {
        return preset;
    }
    console.warn(`Preset "${presetName}" not found`);
    return null;
};

/**
 * Get current configuration as JSON
 */
AppConfig.toJSON = function() {
    return JSON.stringify(this, null, 2);
};

/**
 * Load configuration from JSON
 * @param {string} jsonString - JSON configuration string
 */
AppConfig.fromJSON = function(jsonString) {
    try {
        const config = JSON.parse(jsonString);
        Object.assign(this, config);
        return true;
    } catch (error) {
        console.error('Error loading configuration:', error);
        return false;
    }
};

/**
 * Reset to default configuration
 */
AppConfig.reset = function() {
    // This would reload the original config
    // Implementation depends on how you want to handle this
    console.log('Reset to default configuration');
};

/**
 * Validate configuration
 */
AppConfig.validate = function() {
    const issues = [];

    // Check hand tracking settings
    if (this.handTracking.maxNumHands < 1 || this.handTracking.maxNumHands > 2) {
        issues.push('maxNumHands must be 1 or 2');
    }

    if (this.handTracking.minDetectionConfidence < 0 || this.handTracking.minDetectionConfidence > 1) {
        issues.push('minDetectionConfidence must be between 0 and 1');
    }

    // Check gesture settings
    if (this.gestures.minScale >= this.gestures.maxScale) {
        issues.push('minScale must be less than maxScale');
    }

    // Check particle count
    if (this.particles.count < 0 || this.particles.count > 10000) {
        issues.push('Particle count should be between 0 and 10000 for performance');
    }

    return {
        valid: issues.length === 0,
        issues: issues
    };
};

// Validate on load
const validation = AppConfig.validate();
if (!validation.valid) {
    console.warn('Configuration validation issues:', validation.issues);
}

// Export for use in modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
}
