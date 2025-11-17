# Troubleshooting Guide

## Gesture 3D Sculptor - Common Issues and Solutions

This guide helps you resolve common issues when using the Gesture 3D Sculptor application.

---

## Table of Contents

1. [Camera Issues](#camera-issues)
2. [Hand Detection Problems](#hand-detection-problems)
3. [Performance Issues](#performance-issues)
4. [Gesture Recognition Issues](#gesture-recognition-issues)
5. [Browser Compatibility](#browser-compatibility)
6. [Visual/Rendering Issues](#visualrendering-issues)
7. [Advanced Troubleshooting](#advanced-troubleshooting)

---

## Camera Issues

### Camera Not Working / Permission Denied

**Symptoms:**
- Black video feed
- "Permission denied" error
- Camera not starting

**Solutions:**

1. **Check browser permissions:**
   - Chrome: Click the camera icon in the address bar → Allow
   - Firefox: Click the shield icon → Permissions → Camera → Allow
   - Safari: Safari → Preferences → Websites → Camera → Allow

2. **Verify camera is not in use:**
   - Close other applications using the camera (Zoom, Skype, etc.)
   - Restart your browser
   - Restart your computer if needed

3. **Test camera independently:**
   ```javascript
   // Open browser console and run:
   navigator.mediaDevices.getUserMedia({ video: true })
       .then(stream => console.log('Camera works!'))
       .catch(err => console.error('Camera error:', err));
   ```

4. **Check system settings:**
   - **Windows**: Settings → Privacy → Camera → Allow apps to access camera
   - **macOS**: System Preferences → Security & Privacy → Camera
   - **Linux**: Check `/dev/video*` permissions

### Camera Shows But Image is Frozen

**Symptoms:**
- Video feed displays initially but stops updating
- Frame rate drops to 0

**Solutions:**

1. **Refresh the page** (Ctrl+R / Cmd+R)

2. **Check system resources:**
   - Close unnecessary browser tabs
   - Close other applications
   - Check CPU/RAM usage in Task Manager

3. **Lower quality settings:**
   ```javascript
   // In config.js, reduce video resolution:
   videoWidth: 320,  // Down from 640
   videoHeight: 240  // Down from 480
   ```

### Wrong Camera Selected

**Symptoms:**
- External camera selected instead of built-in
- Back camera selected on mobile

**Solutions:**

1. **Specify camera in code:**
   ```javascript
   const constraints = {
       video: {
           facingMode: 'user', // Front camera
           // or
           deviceId: 'specific-device-id'
       }
   };
   ```

2. **List available cameras:**
   ```javascript
   navigator.mediaDevices.enumerateDevices()
       .then(devices => {
           devices.forEach(device => {
               if (device.kind === 'videoinput') {
                   console.log(device.label, device.deviceId);
               }
           });
       });
   ```

---

## Hand Detection Problems

### Hands Not Detected

**Symptoms:**
- No green lines appear on hands
- Status shows "0 hands detected"
- Gestures don't work

**Solutions:**

1. **Ensure proper lighting:**
   - Face a light source
   - Avoid backlighting
   - Use natural or bright artificial light
   - Minimum 300 lux recommended

2. **Optimize hand position:**
   - Keep hands 1-3 feet from camera
   - Ensure entire hand is in frame
   - Face palm toward camera
   - Avoid rapid movements

3. **Check detection settings:**
   ```javascript
   // In code, lower detection threshold:
   hands.setOptions({
       minDetectionConfidence: 0.3,  // Down from 0.5
       minTrackingConfidence: 0.3    // Down from 0.5
   });
   ```

4. **Verify MediaPipe is loading:**
   ```javascript
   // Check browser console for errors
   // Look for MediaPipe CDN errors
   ```

5. **Test with different backgrounds:**
   - Use solid, contrasting backgrounds
   - Avoid cluttered backgrounds
   - Avoid skin-tone colored backgrounds

### Intermittent Detection

**Symptoms:**
- Hands detected sporadically
- Green lines flicker on/off
- Tracking is unstable

**Solutions:**

1. **Improve hand visibility:**
   - Wear contrasting colored sleeves
   - Increase distance from background
   - Ensure fingers are fully visible

2. **Increase tracking confidence:**
   ```javascript
   hands.setOptions({
       minTrackingConfidence: 0.7  // Up from 0.5
   });
   ```

3. **Reduce hand speed:**
   - Move hands more slowly
   - Make deliberate gestures
   - Pause between gestures

4. **Check FPS:**
   - If FPS < 20, reduce quality settings
   - Close other applications

### Wrong Number of Hands Detected

**Symptoms:**
- Detects 2 hands when showing 1
- False positives from background objects

**Solutions:**

1. **Adjust maxNumHands:**
   ```javascript
   hands.setOptions({
       maxNumHands: 1  // Restrict to single hand
   });
   ```

2. **Clean background:**
   - Remove hand-like objects from view
   - Avoid mirrors or reflections
   - Use plain background

3. **Increase detection confidence:**
   ```javascript
   hands.setOptions({
       minDetectionConfidence: 0.7
   });
   ```

---

## Performance Issues

### Low FPS / Lag

**Symptoms:**
- Stuttering animation
- Delayed gesture response
- FPS below 30

**Solutions:**

1. **Reduce model complexity:**
   ```javascript
   // Use simpler geometries
   const geometry = new THREE.SphereGeometry(
       1.5,
       16,  // Reduce from 32
       16   // Reduce from 32
   );
   ```

2. **Reduce particle count:**
   ```javascript
   // In config.js or directly:
   const particleCount = 500;  // Down from 1000+
   ```

3. **Disable effects:**
   - Turn off particles
   - Turn off trails
   - Turn off glow

4. **Lower video resolution:**
   ```javascript
   const camera_hands = new Camera(videoElement, {
       width: 320,   // Down from 640
       height: 240   // Down from 480
   });
   ```

5. **Use lighter MediaPipe model:**
   ```javascript
   hands.setOptions({
       modelComplexity: 0  // Use lite model
   });
   ```

6. **Optimize renderer:**
   ```javascript
   renderer.setPixelRatio(1);  // Don't use window.devicePixelRatio
   ```

### High CPU Usage

**Symptoms:**
- Fan running loudly
- Computer heating up
- Battery draining quickly

**Solutions:**

1. **Limit frame rate:**
   ```javascript
   let lastFrame = 0;
   const targetFPS = 30;
   const frameInterval = 1000 / targetFPS;

   function animate(currentTime) {
       requestAnimationFrame(animate);

       if (currentTime - lastFrame < frameInterval) return;
       lastFrame = currentTime;

       // Render here
   }
   ```

2. **Throttle gesture processing:**
   ```javascript
   let lastGestureCheck = 0;
   const gestureInterval = 100; // ms

   function processGestures(results) {
       const now = Date.now();
       if (now - lastGestureCheck < gestureInterval) return;
       lastGestureCheck = now;

       // Process gestures
   }
   ```

3. **Use requestIdleCallback for non-critical tasks:**
   ```javascript
   requestIdleCallback(() => {
       updateStatistics();
       checkPerformance();
   });
   ```

### Memory Leaks

**Symptoms:**
- Performance degrades over time
- Browser becomes unresponsive after extended use

**Solutions:**

1. **Dispose geometries and materials:**
   ```javascript
   function createModel(type) {
       if (currentModel) {
           currentModel.geometry.dispose();
           currentModel.material.dispose();
           scene.remove(currentModel);
       }
       // Create new model
   }
   ```

2. **Clean up trails:**
   ```javascript
   trails.forEach(trail => {
       trail.mesh.geometry.dispose();
       trail.mesh.material.dispose();
       scene.remove(trail.mesh);
   });
   trails = [];
   ```

3. **Reload page periodically:**
   - Refresh browser after extended sessions
   - Clear browser cache

---

## Gesture Recognition Issues

### Pinch Not Working

**Symptoms:**
- Pinch gesture not scaling model
- No response when fingers touch

**Solutions:**

1. **Adjust pinch threshold:**
   ```javascript
   const PINCH_THRESHOLD = 0.08;  // Increase from 0.05
   ```

2. **Verify landmark detection:**
   ```javascript
   console.log('Thumb:', landmarks[4]);
   console.log('Index:', landmarks[8]);
   console.log('Distance:', calculateDistance(landmarks[4], landmarks[8]));
   ```

3. **Ensure full finger visibility:**
   - Show entire thumb and index finger
   - Avoid finger overlap
   - Position fingers clearly in front of camera

### Rotation Too Sensitive/Insensitive

**Symptoms:**
- Model rotates too fast or too slow
- Hard to control rotation

**Solutions:**

1. **Adjust rotation sensitivity:**
   ```javascript
   const ROTATION_SENSITIVITY = 3.0;  // Adjust as needed (default: 5.0)

   currentModel.rotation.y += deltaX * ROTATION_SENSITIVITY;
   ```

2. **Add smoothing:**
   ```javascript
   // Exponential smoothing
   const SMOOTHING = 0.3;
   targetRotation.y += deltaX;
   currentModel.rotation.y += (targetRotation.y - currentModel.rotation.y) * SMOOTHING;
   ```

3. **Add dead zone:**
   ```javascript
   const DEAD_ZONE = 0.01;
   if (Math.abs(deltaX) > DEAD_ZONE) {
       currentModel.rotation.y += deltaX;
   }
   ```

### Gestures Triggering Accidentally

**Symptoms:**
- Actions occur without intending
- Multiple gestures detected simultaneously

**Solutions:**

1. **Add gesture cooldown:**
   ```javascript
   let lastGestureTime = 0;
   const COOLDOWN = 500; // ms

   if (Date.now() - lastGestureTime > COOLDOWN) {
       // Process gesture
       lastGestureTime = Date.now();
   }
   ```

2. **Require gesture stability:**
   ```javascript
   let gestureFrames = 0;
   const REQUIRED_FRAMES = 3;

   if (isPinching) {
       gestureFrames++;
       if (gestureFrames >= REQUIRED_FRAMES) {
           // Perform action
       }
   } else {
       gestureFrames = 0;
   }
   ```

3. **Increase detection thresholds:**
   ```javascript
   const PINCH_THRESHOLD = 0.08;    // Up from 0.05
   const FIST_THRESHOLD = 0.10;     // Down from 0.15
   ```

---

## Browser Compatibility

### Safari Issues

**Symptoms:**
- App doesn't work in Safari
- Permissions not granted

**Solutions:**

1. **Use HTTPS:**
   - Safari requires HTTPS for camera access
   - Use `localhost` for testing
   - Deploy to HTTPS server for production

2. **Enable experimental features:**
   - Safari → Develop → Experimental Features
   - Enable "MediaRecorder" and "WebGL 2.0"

3. **Check Safari version:**
   - Requires Safari 11+ for getUserMedia
   - Update to latest version

### Mobile Browser Issues

**Symptoms:**
- App slow on mobile
- UI elements too small
- Touch controls not working

**Solutions:**

1. **Optimize for mobile:**
   ```javascript
   const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

   if (isMobile) {
       // Reduce quality
       hands.setOptions({ modelComplexity: 0 });
       particleCount = 200;
       renderer.setPixelRatio(1);
   }
   ```

2. **Add viewport meta tag:**
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
   ```

3. **Use touch-friendly UI:**
   ```css
   button {
       min-width: 44px;
       min-height: 44px;
   }
   ```

### Firefox Specific Issues

**Symptoms:**
- Different behavior in Firefox
- Performance issues

**Solutions:**

1. **Enable WebGL:**
   - about:config → webgl.force-enabled → true

2. **Disable hardware acceleration if issues persist:**
   - Options → General → Performance → Uncheck "Use hardware acceleration"

---

## Visual/Rendering Issues

### Black Screen

**Symptoms:**
- Canvas is completely black
- No 3D objects visible

**Solutions:**

1. **Check WebGL support:**
   ```javascript
   const canvas = document.createElement('canvas');
   const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

   if (!gl) {
       alert('WebGL not supported');
   }
   ```

2. **Verify scene setup:**
   ```javascript
   console.log('Scene:', scene);
   console.log('Camera:', camera);
   console.log('Renderer:', renderer);
   console.log('Model:', currentModel);
   ```

3. **Check camera position:**
   ```javascript
   camera.position.set(0, 0, 5);  // Move back if at origin
   camera.lookAt(0, 0, 0);
   ```

### Models Not Visible

**Symptoms:**
- UI works but 3D model not showing
- Controls have no effect

**Solutions:**

1. **Check model is added to scene:**
   ```javascript
   console.log(scene.children);  // Should include your model
   ```

2. **Verify material properties:**
   ```javascript
   console.log(currentModel.material);
   // Check if material exists and has color
   ```

3. **Check lighting:**
   ```javascript
   // Add bright ambient light for testing
   scene.add(new THREE.AmbientLight(0xffffff, 1.0));
   ```

### Flickering / Z-Fighting

**Symptoms:**
- Objects flicker
- Surfaces fighting for visibility

**Solutions:**

1. **Adjust camera near/far planes:**
   ```javascript
   camera = new THREE.PerspectiveCamera(
       75,
       aspect,
       0.1,   // Near - increase if too close
       1000   // Far - decrease if too far
   );
   ```

2. **Separate overlapping surfaces:**
   ```javascript
   model.position.z += 0.01;
   ```

### Poor Quality / Jagged Edges

**Symptoms:**
- Blocky appearance
- Jagged edges on models

**Solutions:**

1. **Enable antialiasing:**
   ```javascript
   renderer = new THREE.WebGLRenderer({
       antialias: true
   });
   ```

2. **Increase pixel ratio:**
   ```javascript
   renderer.setPixelRatio(window.devicePixelRatio);
   ```

3. **Increase model segments:**
   ```javascript
   const geometry = new THREE.SphereGeometry(1, 32, 32);  // Higher = smoother
   ```

---

## Advanced Troubleshooting

### Debugging with Console

**Enable verbose logging:**

```javascript
const DEBUG = true;

function debugLog(category, ...args) {
    if (DEBUG) {
        console.log(`[${category}]`, ...args);
    }
}

// Usage
debugLog('GESTURE', 'Pinch detected', distance);
debugLog('RENDER', 'FPS:', fps);
```

**Monitor performance:**

```javascript
// Add performance observer
const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        console.log(entry.name, entry.duration);
    }
});

observer.observe({ entryTypes: ['measure'] });

// Measure operations
performance.mark('gesture-start');
processGestures(results);
performance.mark('gesture-end');
performance.measure('gesture-processing', 'gesture-start', 'gesture-end');
```

### Network Issues

**MediaPipe/Three.js CDN not loading:**

1. **Check network connection:**
   ```javascript
   console.log('Online:', navigator.onLine);
   ```

2. **Use alternative CDNs:**
   ```html
   <!-- Instead of jsdelivr, try unpkg -->
   <script src="https://unpkg.com/@mediapipe/hands"></script>
   ```

3. **Download libraries locally:**
   - Download Three.js and MediaPipe
   - Host files locally
   - Update script tags to local paths

### Browser Console Errors

**Common errors and solutions:**

1. **"getUserMedia is not a function"**
   - Use HTTPS or localhost
   - Update browser to latest version

2. **"WebGL: CONTEXT_LOST_WEBGL"**
   - GPU crashed or overheated
   - Restart browser
   - Update graphics drivers

3. **"Failed to load MediaPipe model"**
   - Check internet connection
   - Verify CDN is accessible
   - Clear browser cache

4. **"Cannot read property of undefined"**
   - Check initialization order
   - Ensure objects exist before accessing

### Performance Profiling

**Use browser DevTools:**

1. **Chrome DevTools:**
   - F12 → Performance tab
   - Record session
   - Analyze flame graph
   - Look for long tasks

2. **Firefox DevTools:**
   - F12 → Performance tab
   - Start recording
   - Check for bottlenecks

3. **Add custom markers:**
   ```javascript
   console.time('render-frame');
   renderer.render(scene, camera);
   console.timeEnd('render-frame');
   ```

---

## Still Having Issues?

### Gather Diagnostic Information

```javascript
// Run this in browser console for diagnostic info
console.log({
    userAgent: navigator.userAgent,
    webGL: !!document.createElement('canvas').getContext('webgl'),
    mediaDevices: !!navigator.mediaDevices,
    online: navigator.onLine,
    threeVersion: THREE.REVISION,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    pixelRatio: window.devicePixelRatio
});
```

### Reporting Bugs

When reporting issues, include:

1. Browser and version
2. Operating system
3. Error messages from console
4. Steps to reproduce
5. Screenshots/videos
6. Diagnostic information (above)

### Community Support

- GitHub Issues: [Report bugs]
- Stack Overflow: Tag with `threejs` and `mediapipe`
- Discord/Forums: Join developer communities

---

## Quick Checklist

Before asking for help, verify:

- [ ] Browser is up to date
- [ ] Camera permissions granted
- [ ] Good lighting conditions
- [ ] Hands fully visible in frame
- [ ] Console shows no errors
- [ ] Internet connection stable
- [ ] WebGL supported
- [ ] Tried in different browser
- [ ] Cleared cache and cookies
- [ ] Restarted browser/computer

---

**If all else fails, try the tutorial page first!**

The tutorial.html page provides a guided introduction that can help identify where things might be going wrong.

---

## Feedback

Found a solution not listed here? Please contribute by opening a pull request!

**Last Updated:** 2024
