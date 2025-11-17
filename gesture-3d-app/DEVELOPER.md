# Developer Documentation

## Gesture 3D Sculptor - Developer Guide

This guide provides technical documentation for developers who want to understand, modify, or extend the Gesture 3D Sculptor application.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [API Reference](#api-reference)
4. [Gesture Recognition](#gesture-recognition)
5. [Custom Shaders](#custom-shaders)
6. [Extending the Application](#extending-the-application)
7. [Performance Optimization](#performance-optimization)
8. [Best Practices](#best-practices)

---

## Architecture Overview

### Technology Stack

```
┌─────────────────────────────────────┐
│        User Interface (HTML/CSS)     │
├─────────────────────────────────────┤
│     Application Logic (JavaScript)   │
├──────────────┬──────────────────────┤
│  MediaPipe   │      Three.js        │
│  Hands API   │   (3D Rendering)     │
├──────────────┴──────────────────────┤
│          Browser WebGL/WebRTC        │
└─────────────────────────────────────┘
```

### Key Libraries

- **Three.js r128**: 3D rendering engine
- **MediaPipe Hands**: Hand landmark detection
- **WebRTC**: Camera access via getUserMedia

### Application Flow

```
1. Initialize Three.js scene → Create 3D objects
2. Initialize MediaPipe Hands → Load ML model
3. Start camera feed → Request webcam access
4. Animation loop starts:
   ├─ Capture video frame
   ├─ Process with MediaPipe
   ├─ Extract hand landmarks
   ├─ Detect gestures
   ├─ Update 3D objects
   └─ Render scene
```

---

## Core Components

### 1. Scene Management

```javascript
// Scene initialization
scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);
scene.fog = new THREE.Fog(0x0a0a1a, 10, 50);

// Camera setup
camera = new THREE.PerspectiveCamera(
    75,                                    // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1,                                   // Near clipping plane
    1000                                   // Far clipping plane
);

// Renderer configuration
renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true  // For screenshots
});
```

### 2. Lighting System

```javascript
// Ambient light - provides base illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);

// Directional light - simulates sunlight
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;

// Point lights - localized light sources
const pointLight1 = new THREE.PointLight(0x667eea, 1, 100);
pointLight1.position.set(-5, 5, 0);
```

### 3. Hand Tracking

```javascript
// MediaPipe Hands configuration
const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 2,              // Detect up to 2 hands
    modelComplexity: 1,          // 0=lite, 1=full
    minDetectionConfidence: 0.5, // Threshold for detection
    minTrackingConfidence: 0.5   // Threshold for tracking
});

// Results callback
hands.onResults((results) => {
    // results.multiHandLandmarks contains detected hands
    // Each hand has 21 landmarks (x, y, z coordinates)
    processGestures(results);
});
```

---

## API Reference

### Core Functions

#### `createModel(type: string): void`

Creates a 3D model of the specified type.

**Parameters:**
- `type` (string): Model type - 'cube', 'sphere', 'torus', 'cone', 'dodecahedron', 'torusknot'

**Example:**
```javascript
createModel('sphere');
```

#### `changeColor(color: string|number): void`

Changes the color of the current model.

**Parameters:**
- `color` (string|number): Hex color string (#RRGGBB) or number (0xRRGGBB)

**Example:**
```javascript
changeColor('#ff0000');  // Red
changeColor(0x00ff00);   // Green
```

#### `changeMaterial(type: string): void`

Changes the material type of the current model.

**Parameters:**
- `type` (string): Material type - 'standard', 'physical', 'toon', 'wireframe'

**Example:**
```javascript
changeMaterial('physical');
```

### Gesture Detection Functions

#### `processGestures(results: HandResults): void`

Main gesture processing function.

**Parameters:**
- `results` (HandResults): MediaPipe results object containing hand landmarks

**Called by:** MediaPipe hands.onResults callback

**Processing flow:**
```javascript
function processGestures(results) {
    if (!results.multiHandLandmarks) return;

    const landmarks = results.multiHandLandmarks[0];

    // 1. Calculate distances between landmarks
    // 2. Detect gesture type
    // 3. Apply transformation to 3D model
}
```

#### `detectPinch(landmarks: Landmark[]): boolean`

Detects pinch gesture (thumb + index finger).

**Returns:** `true` if pinching, `false` otherwise

**Implementation:**
```javascript
function detectPinch(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];

    const distance = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) +
        Math.pow(thumbTip.y - indexTip.y, 2)
    );

    return distance < 0.05; // Threshold
}
```

#### `detectFist(landmarks: Landmark[]): boolean`

Detects closed fist gesture.

**Returns:** `true` if fist detected, `false` otherwise

#### `detectPeaceSign(landmarks: Landmark[]): boolean`

Detects peace sign (✌️) gesture.

**Returns:** `true` if peace sign detected, `false` otherwise

### Utility Functions

#### `resetModel(): void`

Resets model to default position, rotation, and scale.

#### `randomizeModel(): void`

Applies random rotation and color to the model.

#### `saveScreenshot(): void`

Saves the current 3D scene as PNG image.

**Implementation:**
```javascript
function saveScreenshot() {
    const link = document.createElement('a');
    link.download = 'gesture-3d-' + Date.now() + '.png';
    link.href = renderer.domElement.toDataURL();
    link.click();
}
```

#### `exportModel(): void`

Exports model data as JSON file.

**Export format:**
```json
{
    "type": "TorusKnotGeometry",
    "position": [0, 0, 0],
    "rotation": [0.5, 1.2, 0],
    "scale": [1, 1, 1],
    "color": "#667eea"
}
```

---

## Gesture Recognition

### Hand Landmark Structure

MediaPipe Hands provides 21 landmarks per hand:

```
0: WRIST
1-4: THUMB (CMC, MCP, IP, TIP)
5-8: INDEX (MCP, PIP, DIP, TIP)
9-12: MIDDLE (MCP, PIP, DIP, TIP)
13-16: RING (MCP, PIP, DIP, TIP)
17-20: PINKY (MCP, PIP, DIP, TIP)
```

### Gesture Detection Algorithms

#### Pinch Detection

```javascript
// Calculate Euclidean distance between thumb and index
const thumbTip = landmarks[4];
const indexTip = landmarks[8];

const distance = Math.sqrt(
    Math.pow(thumbTip.x - indexTip.x, 2) +
    Math.pow(thumbTip.y - indexTip.y, 2) +
    Math.pow(thumbTip.z - indexTip.z, 2)
);

const isPinching = distance < PINCH_THRESHOLD;
```

#### Open Palm Detection

```javascript
// Measure distance between palm base and middle finger tip
const palmBase = landmarks[0];
const middleTip = landmarks[12];

const openness = Math.sqrt(
    Math.pow(palmBase.x - middleTip.x, 2) +
    Math.pow(palmBase.y - middleTip.y, 2)
);

const isOpen = openness > OPEN_PALM_THRESHOLD;
```

#### Fist Detection

```javascript
// Average distance from all fingertips to palm
const palmBase = landmarks[0];
const fingertips = [4, 8, 12, 16, 20];

let totalDistance = 0;
for (const tip of fingertips) {
    const landmark = landmarks[tip];
    totalDistance += Math.sqrt(
        Math.pow(landmark.x - palmBase.x, 2) +
        Math.pow(landmark.y - palmBase.y, 2)
    );
}

const avgDistance = totalDistance / fingertips.length;
const isFist = avgDistance < FIST_THRESHOLD;
```

### Custom Gesture Example

Adding a "thumbs up" gesture:

```javascript
function detectThumbsUp(landmarks) {
    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3];
    const indexMCP = landmarks[5];

    // Thumb should be pointing up
    const thumbUp = thumbTip.y < thumbIP.y;

    // Other fingers should be down
    const fingersDown =
        landmarks[8].y > landmarks[5].y &&  // Index down
        landmarks[12].y > landmarks[9].y && // Middle down
        landmarks[16].y > landmarks[13].y && // Ring down
        landmarks[20].y > landmarks[17].y;  // Pinky down

    return thumbUp && fingersDown;
}

// Add to processGestures function
if (detectThumbsUp(landmarks)) {
    // Perform action (e.g., change color)
    changeColor('#00ff00');
}
```

---

## Custom Shaders

### Shader Structure

Custom shaders in Three.js require both vertex and fragment shaders:

```javascript
const customShader = {
    vertexShader: `
        // Vertex shader transforms vertex positions
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float time;

        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        // Fragment shader determines pixel colors
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float time;
        uniform vec3 color;

        void main() {
            vec3 finalColor = color * (0.5 + 0.5 * sin(time));
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
};
```

### Applying Custom Shader

```javascript
const material = new THREE.ShaderMaterial({
    vertexShader: customShader.vertexShader,
    fragmentShader: customShader.fragmentShader,
    uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x667eea) }
    }
});

// Update in animation loop
function animate() {
    material.uniforms.time.value += 0.01;
    renderer.render(scene, camera);
}
```

### Shader Examples

#### Holographic Effect

```glsl
// Fragment shader
varying vec3 vNormal;
uniform float time;

void main() {
    float fresnel = pow(1.0 - dot(vNormal, vec3(0, 0, 1)), 3.0);
    vec3 holo = vec3(0.2, 0.4, 0.6) * fresnel;

    float scanline = sin(gl_FragCoord.y * 0.1 + time * 5.0) * 0.5 + 0.5;
    holo *= 0.7 + scanline * 0.3;

    gl_FragColor = vec4(holo, 0.8);
}
```

#### Plasma Effect

```glsl
// Fragment shader
varying vec2 vUv;
uniform float time;

void main() {
    vec2 p = vUv * 10.0;
    float plasma = sin(p.x + time) + sin(p.y + time * 0.7) +
                   sin(p.x + p.y + time * 0.5);

    vec3 color = vec3(
        0.5 + 0.5 * sin(plasma + time),
        0.5 + 0.5 * sin(plasma + time + 2.094),
        0.5 + 0.5 * sin(plasma + time + 4.188)
    );

    gl_FragColor = vec4(color, 1.0);
}
```

---

## Extending the Application

### Adding New Models

1. **Define geometry:**

```javascript
case 'pyramid':
    geometry = new THREE.ConeGeometry(1, 2, 4);
    break;
```

2. **Add button to UI:**

```html
<button onclick="changeModel('pyramid')" id="btn-pyramid">Pyramid</button>
```

3. **Update model switcher:**

```javascript
function changeModel(type) {
    createModel(type);

    // Update active button
    document.querySelectorAll('.model-preview button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById('btn-' + type).classList.add('active');
}
```

### Adding Post-Processing Effects

Using Three.js EffectComposer:

```javascript
// Import required modules
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

// Setup composer
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Add bloom
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,  // strength
    0.4,  // radius
    0.85  // threshold
);
composer.addPass(bloomPass);

// Render with composer
function animate() {
    requestAnimationFrame(animate);
    composer.render();
}
```

### Adding New Gestures

1. **Define detection function:**

```javascript
function detectSpreadFingers(landmarks) {
    const distances = [];
    const fingerTips = [4, 8, 12, 16, 20];

    for (let i = 0; i < fingerTips.length - 1; i++) {
        const tip1 = landmarks[fingerTips[i]];
        const tip2 = landmarks[fingerTips[i + 1]];

        distances.push(Math.sqrt(
            Math.pow(tip1.x - tip2.x, 2) +
            Math.pow(tip1.y - tip2.y, 2)
        ));
    }

    const avgDistance = distances.reduce((a, b) => a + b) / distances.length;
    return avgDistance > 0.15; // Threshold
}
```

2. **Add to gesture processing:**

```javascript
function processGestures(results) {
    // ... existing code ...

    if (detectSpreadFingers(landmarks)) {
        // Your action here
        console.log('Spread fingers detected!');
    }
}
```

---

## Performance Optimization

### Best Practices

1. **Reduce polygon count:**
```javascript
// Lower detail for better performance
const geometry = new THREE.SphereGeometry(
    1.5,
    16, // segments (lower = faster)
    16  // rings (lower = faster)
);
```

2. **Optimize particle count:**
```javascript
// Adjust based on device capability
const particleCount = isMobile ? 500 : 1000;
```

3. **Use object pooling:**
```javascript
// Reuse objects instead of creating new ones
const trailPool = [];
function getTrail() {
    return trailPool.pop() || createNewTrail();
}
```

4. **Throttle gesture updates:**
```javascript
let lastGestureUpdate = 0;
const GESTURE_THROTTLE = 50; // ms

function processGestures(results) {
    const now = Date.now();
    if (now - lastGestureUpdate < GESTURE_THROTTLE) return;

    lastGestureUpdate = now;
    // ... process gestures ...
}
```

### Performance Monitoring

```javascript
const stats = {
    fps: 0,
    frameCount: 0,
    lastTime: performance.now()
};

function updateStats() {
    stats.frameCount++;
    const currentTime = performance.now();

    if (currentTime >= stats.lastTime + 1000) {
        stats.fps = Math.round((stats.frameCount * 1000) / (currentTime - stats.lastTime));
        stats.frameCount = 0;
        stats.lastTime = currentTime;

        console.log('FPS:', stats.fps);

        // Auto-adjust quality
        if (stats.fps < 30) {
            reduceQuality();
        }
    }
}
```

---

## Best Practices

### Code Organization

```javascript
// ==================== SECTION NAME ====================
// Group related functions together

// ==================== SCENE SETUP ====================
function initScene() { }
function createLights() { }

// ==================== GESTURE PROCESSING ====================
function processGestures() { }
function detectPinch() { }
```

### Error Handling

```javascript
async function init() {
    try {
        await camera_hands.start();
    } catch (error) {
        console.error('Camera error:', error);

        // Provide user feedback
        alert('Cannot access camera. Please grant permissions.');

        // Fallback behavior
        startWithoutCamera();
    }
}
```

### Memory Management

```javascript
// Clean up when changing models
function createModel(type) {
    if (currentModel) {
        // Dispose geometry and material
        currentModel.geometry.dispose();
        currentModel.material.dispose();

        // Remove from scene
        scene.remove(currentModel);
    }

    // Create new model
    currentModel = new THREE.Mesh(geometry, material);
    scene.add(currentModel);
}
```

### Configuration Management

```javascript
// Use centralized config
const CONFIG = {
    PINCH_THRESHOLD: 0.05,
    ROTATION_SENSITIVITY: 5.0,
    PARTICLE_COUNT: 1000
};

// Reference in code
if (distance < CONFIG.PINCH_THRESHOLD) {
    // ...
}
```

---

## Debugging Tips

### Enable Debug Mode

```javascript
const DEBUG = true;

function log(...args) {
    if (DEBUG) console.log(...args);
}

function visualizeHands(landmarks) {
    if (!DEBUG) return;

    // Draw landmark indices
    landmarks.forEach((landmark, i) => {
        log(`Landmark ${i}:`, landmark);
    });
}
```

### Performance Profiling

```javascript
console.time('gesture-processing');
processGestures(results);
console.timeEnd('gesture-processing');
```

### Visualize Gestures

```javascript
function debugGestures(results) {
    const info = document.getElementById('debug-info');

    if (results.multiHandLandmarks) {
        const landmarks = results.multiHandLandmarks[0];

        info.innerHTML = `
            <pre>
            Thumb: ${JSON.stringify(landmarks[4], null, 2)}
            Index: ${JSON.stringify(landmarks[8], null, 2)}
            </pre>
        `;
    }
}
```

---

## Additional Resources

### MediaPipe Hands
- [Official Documentation](https://google.github.io/mediapipe/solutions/hands.html)
- [Hand Landmark Model](https://google.github.io/mediapipe/solutions/hands#hand-landmark-model)

### Three.js
- [Official Documentation](https://threejs.org/docs/)
- [Examples](https://threejs.org/examples/)
- [Shader Tutorial](https://threejs.org/docs/#api/en/materials/ShaderMaterial)

### WebGL
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [The Book of Shaders](https://thebookofshaders.com/)

---

## Contributing

When contributing to this project:

1. Follow the existing code style
2. Add comments for complex logic
3. Test with multiple hand positions
4. Optimize for performance
5. Update documentation

---

**Happy Coding! 🚀**

For questions or issues, please open an issue on GitHub.
