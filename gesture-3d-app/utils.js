/**
 * Utility Functions for Gesture 3D Sculptor
 * Collection of helper functions for common operations
 */

// ==================== GESTURE DETECTION UTILITIES ====================

/**
 * Calculate Euclidean distance between two 3D points
 * @param {Object} p1 - First point {x, y, z}
 * @param {Object} p2 - Second point {x, y, z}
 * @returns {number} Distance between points
 */
function calculateDistance(p1, p2) {
    return Math.sqrt(
        Math.pow(p1.x - p2.x, 2) +
        Math.pow(p1.y - p2.y, 2) +
        (p1.z && p2.z ? Math.pow(p1.z - p2.z, 2) : 0)
    );
}

/**
 * Calculate angle between three points
 * @param {Object} p1 - First point
 * @param {Object} p2 - Middle point (vertex)
 * @param {Object} p3 - Third point
 * @returns {number} Angle in radians
 */
function calculateAngle(p1, p2, p3) {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    return Math.acos(dot / (mag1 * mag2));
}

/**
 * Check if a finger is extended
 * @param {Array} landmarks - Hand landmarks
 * @param {number} fingerIndex - Finger index (0=thumb, 1=index, etc.)
 * @returns {boolean} True if finger is extended
 */
function isFingerExtended(landmarks, fingerIndex) {
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerMCPs = [2, 5, 9, 13, 17];

    const tip = landmarks[fingerTips[fingerIndex]];
    const mcp = landmarks[fingerMCPs[fingerIndex]];

    // Finger is extended if tip is farther from wrist than MCP
    const wrist = landmarks[0];

    const tipDistance = calculateDistance(tip, wrist);
    const mcpDistance = calculateDistance(mcp, wrist);

    return tipDistance > mcpDistance * 1.1;
}

/**
 * Count number of extended fingers
 * @param {Array} landmarks - Hand landmarks
 * @returns {number} Number of extended fingers (0-5)
 */
function countExtendedFingers(landmarks) {
    let count = 0;
    for (let i = 0; i < 5; i++) {
        if (isFingerExtended(landmarks, i)) {
            count++;
        }
    }
    return count;
}

/**
 * Detect specific hand gesture
 * @param {Array} landmarks - Hand landmarks
 * @param {string} gestureName - Name of gesture to detect
 * @returns {boolean} True if gesture detected
 */
function detectGesture(landmarks, gestureName) {
    switch (gestureName) {
        case 'thumbs_up':
            return isFingerExtended(landmarks, 0) && !isFingerExtended(landmarks, 1);

        case 'thumbs_down':
            const thumb = landmarks[4];
            const wrist = landmarks[0];
            return thumb.y > wrist.y && !isFingerExtended(landmarks, 1);

        case 'pointing':
            return isFingerExtended(landmarks, 1) && !isFingerExtended(landmarks, 2);

        case 'peace':
            return isFingerExtended(landmarks, 1) &&
                   isFingerExtended(landmarks, 2) &&
                   !isFingerExtended(landmarks, 3);

        case 'rock':
            return isFingerExtended(landmarks, 0) &&
                   isFingerExtended(landmarks, 1) &&
                   isFingerExtended(landmarks, 4);

        case 'ok':
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const distance = calculateDistance(thumbTip, indexTip);
            return distance < 0.05 && isFingerExtended(landmarks, 2);

        default:
            return false;
    }
}

// ==================== 3D UTILITIES ====================

/**
 * Create a parametric shape
 * @param {Function} func - Function defining the shape
 * @param {number} slices - Number of slices
 * @param {number} stacks - Number of stacks
 * @returns {THREE.BufferGeometry} Generated geometry
 */
function createParametricShape(func, slices = 32, stacks = 32) {
    return new THREE.ParametricGeometry(func, slices, stacks);
}

/**
 * Create a Möbius strip
 * @param {number} radius - Strip radius
 * @param {number} width - Strip width
 * @returns {THREE.BufferGeometry} Möbius strip geometry
 */
function createMobiusStrip(radius = 1, width = 0.5) {
    const func = (u, v, target) => {
        u = u * 2 * Math.PI;
        v = (v - 0.5) * width;

        const x = (radius + v * Math.cos(u / 2)) * Math.cos(u);
        const y = (radius + v * Math.cos(u / 2)) * Math.sin(u);
        const z = v * Math.sin(u / 2);

        target.set(x, y, z);
    };

    return createParametricShape(func);
}

/**
 * Create a Klein bottle
 * @param {number} radius - Bottle radius
 * @returns {THREE.BufferGeometry} Klein bottle geometry
 */
function createKleinBottle(radius = 1) {
    const func = (u, v, target) => {
        u *= Math.PI * 2;
        v *= Math.PI * 2;

        const r = radius;
        const x = (r + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v)) * Math.cos(u);
        const y = (r + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v)) * Math.sin(u);
        const z = Math.sin(u / 2) * Math.sin(v) + Math.cos(u / 2) * Math.sin(2 * v);

        target.set(x, y, z);
    };

    return createParametricShape(func, 64, 64);
}

/**
 * Interpolate between two colors
 * @param {THREE.Color} color1 - Start color
 * @param {THREE.Color} color2 - End color
 * @param {number} t - Interpolation factor (0-1)
 * @returns {THREE.Color} Interpolated color
 */
function lerpColor(color1, color2, t) {
    const result = new THREE.Color();
    result.r = color1.r + (color2.r - color1.r) * t;
    result.g = color1.g + (color2.g - color1.g) * t;
    result.b = color1.b + (color2.b - color1.b) * t;
    return result;
}

/**
 * Generate rainbow gradient colors
 * @param {number} count - Number of colors to generate
 * @returns {Array<THREE.Color>} Array of colors
 */
function generateRainbowColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = i / count;
        colors.push(new THREE.Color().setHSL(hue, 0.8, 0.5));
    }
    return colors;
}

// ==================== ANIMATION UTILITIES ====================

/**
 * Easing functions for smooth animations
 */
const Easing = {
    linear: t => t,

    easeInQuad: t => t * t,

    easeOutQuad: t => t * (2 - t),

    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

    easeInCubic: t => t * t * t,

    easeOutCubic: t => (--t) * t * t + 1,

    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

    easeInQuart: t => t * t * t * t,

    easeOutQuart: t => 1 - (--t) * t * t * t,

    easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

    easeInElastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    },

    easeOutElastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },

    easeInBounce: t => 1 - Easing.easeOutBounce(1 - t),

    easeOutBounce: t => {
        const n1 = 7.5625;
        const d1 = 2.75;

        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }
};

/**
 * Animate a value over time
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} duration - Duration in ms
 * @param {Function} easing - Easing function
 * @param {Function} onUpdate - Update callback
 * @param {Function} onComplete - Completion callback
 */
function animateValue(start, end, duration, easing = Easing.linear, onUpdate, onComplete) {
    const startTime = performance.now();

    function update() {
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easedProgress = easing(progress);
        const currentValue = start + (end - start) * easedProgress;

        onUpdate(currentValue);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else if (onComplete) {
            onComplete();
        }
    }

    requestAnimationFrame(update);
}

/**
 * Smoothly interpolate a value
 * @param {number} current - Current value
 * @param {number} target - Target value
 * @param {number} smoothing - Smoothing factor (0-1)
 * @returns {number} Interpolated value
 */
function smoothDamp(current, target, smoothing = 0.1) {
    return current + (target - current) * smoothing;
}

// ==================== PERFORMANCE UTILITIES ====================

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * FPS counter
 */
class FPSCounter {
    constructor() {
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
    }

    update() {
        this.frameCount++;
        const currentTime = performance.now();

        if (currentTime >= this.lastTime + 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
        }

        return this.fps;
    }

    get() {
        return this.fps;
    }
}

/**
 * Performance monitor
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
    }

    start(label) {
        this.metrics[label] = performance.now();
    }

    end(label) {
        if (this.metrics[label]) {
            const duration = performance.now() - this.metrics[label];
            delete this.metrics[label];
            return duration;
        }
        return null;
    }

    measure(label, func) {
        this.start(label);
        const result = func();
        const duration = this.end(label);
        console.log(`${label}: ${duration.toFixed(2)}ms`);
        return result;
    }
}

// ==================== STORAGE UTILITIES ====================

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {*} data - Data to save
 */
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

/**
 * Load data from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} Loaded data or default value
 */
function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

/**
 * Clear localStorage
 */
function clearLocalStorage() {
    try {
        localStorage.clear();
        return true;
    } catch (error) {
        console.error('Error clearing localStorage:', error);
        return false;
    }
}

// ==================== FILE UTILITIES ====================

/**
 * Download file
 * @param {string} filename - Name of file
 * @param {string} content - File content
 * @param {string} mimeType - MIME type
 */
function downloadFile(filename, content, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Download JSON
 * @param {string} filename - Name of file
 * @param {Object} data - Data to save
 */
function downloadJSON(filename, data) {
    const content = JSON.stringify(data, null, 2);
    downloadFile(filename, content, 'application/json');
}

/**
 * Download image from canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} filename - Name of file
 * @param {string} format - Image format ('png' or 'jpg')
 * @param {number} quality - Image quality (0-1) for JPG
 */
function downloadCanvasAsImage(canvas, filename, format = 'png', quality = 0.92) {
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const dataURL = canvas.toDataURL(mimeType, quality);

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
}

// ==================== MATH UTILITIES ====================

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Map value from one range to another
 * @param {number} value - Input value
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} Mapped value
 */
function mapRange(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

/**
 * Generate random number in range
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Generate random integer in range
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} Random integer
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ==================== COLOR UTILITIES ====================

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {Object} RGB values {r, g, b} (0-255)
 */
function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

/**
 * Convert RGB to hex string
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color string
 */
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// ==================== VALIDATION UTILITIES ====================

/**
 * Check if value is a valid number
 * @param {*} value - Value to check
 * @returns {boolean} True if valid number
 */
function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Check if WebGL is supported
 * @returns {boolean} True if WebGL is supported
 */
function isWebGLSupported() {
    try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
        return false;
    }
}

/**
 * Check if getUserMedia is supported
 * @returns {boolean} True if getUserMedia is supported
 */
function isGetUserMediaSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// ==================== EXPORT ====================

// Export all utilities for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateDistance,
        calculateAngle,
        isFingerExtended,
        countExtendedFingers,
        detectGesture,
        createParametricShape,
        createMobiusStrip,
        createKleinBottle,
        lerpColor,
        generateRainbowColors,
        Easing,
        animateValue,
        smoothDamp,
        throttle,
        debounce,
        FPSCounter,
        PerformanceMonitor,
        saveToLocalStorage,
        loadFromLocalStorage,
        clearLocalStorage,
        downloadFile,
        downloadJSON,
        downloadCanvasAsImage,
        clamp,
        lerp,
        mapRange,
        randomRange,
        randomInt,
        hslToRgb,
        rgbToHex,
        isValidNumber,
        isWebGLSupported,
        isGetUserMediaSupported
    };
}
