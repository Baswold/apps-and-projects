# 🎨 Gesture 3D Sculptor

An interactive web application that lets you manipulate 3D models using hand gestures captured through your webcam. Built with Three.js for 3D rendering and MediaPipe Hands for real-time hand tracking.

![Gesture 3D Sculptor](https://img.shields.io/badge/status-active-success)
![Three.js](https://img.shields.io/badge/Three.js-r128-blue)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-orange)

## ✨ Features

### 🎮 Gesture Controls
- **Pinch (Thumb + Index Finger)**: Scale the 3D model up or down
- **Open Palm Drag**: Rotate the model in 3D space
- **Two Hands Pinch**: Automatically cycle through rainbow colors
- **Fist**: Reset model rotation to default
- **Peace Sign (✌️)**: Toggle auto-rotation mode

### 🎨 3D Models
Choose from 6 different geometric shapes:
- Cube
- Sphere
- Torus
- Cone
- Dodecahedron
- Torus Knot

### 🌈 Materials & Effects
- **Material Types**:
  - Standard (realistic metallic look)
  - Physical (advanced reflections and clearcoat)
  - Toon (cartoon-style shading)
  - Wireframe (see the geometry structure)

- **Visual Effects**:
  - Particle System (floating particles around the scene)
  - Motion Trails (leave trails when moving the model)
  - Glow Effect (emissive lighting on the model)

### 🎛️ Control Panel Features
- **Color Picker**: Choose any color for your model
- **Model Switcher**: Instantly switch between different 3D shapes
- **Material Selector**: Change the rendering style
- **Reset Button**: Return model to default position/rotation/scale
- **Randomize**: Apply random rotation and color
- **Screenshot**: Save a PNG image of your creation
- **Export**: Download model data as JSON

### 📊 Real-time Feedback
- Hand detection status indicator
- Number of hands currently tracked
- Visual hand skeleton overlay on video feed
- Gesture instruction panel

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, or Safari)
- Webcam access
- Internet connection (for loading libraries)

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Allow webcam access when prompted
4. Start creating with your hands! ✋

**No build process, no dependencies to install - just open and run!**

## 🎯 How to Use

1. **Position yourself**: Make sure your hands are visible in the webcam feed (top-right corner)
2. **Try the gestures**:
   - Make a pinch gesture and move your hand to scale
   - Open your palm and drag to rotate
   - Make a fist to reset
3. **Experiment with controls**: Use the left panel to change models, colors, and materials
4. **Enable effects**: Toggle particles, trails, and glow from the top panel
5. **Save your work**: Take screenshots or export model data

## 🏗️ Technical Architecture

### Libraries Used
- **Three.js (r128)**: 3D rendering engine
- **MediaPipe Hands**: Real-time hand landmark detection
- **Vanilla JavaScript**: No frameworks needed!

### Key Components

#### 1. Hand Tracking System
```javascript
- Detects up to 2 hands simultaneously
- Tracks 21 landmarks per hand
- Real-time gesture recognition
- 30+ FPS performance
```

#### 2. 3D Scene
```javascript
- Perspective camera with fog
- Multiple light sources (ambient, directional, point lights)
- Shadow mapping enabled
- Responsive to window resize
```

#### 3. Gesture Recognition
```javascript
- Distance-based pinch detection
- Palm openness calculation
- Finger position analysis
- Multi-hand coordination
```

## 🎨 Customization

### Adding New Gestures

You can extend the gesture recognition by modifying the `processGestures()` function:

```javascript
function processGestures(results) {
    // Add your custom gesture detection here
    if (detectCustomGesture(landmarks)) {
        // Perform action
    }
}
```

### Adding New 3D Models

To add a new model, update the `createModel()` function:

```javascript
case 'mymodel':
    geometry = new THREE.YourGeometry(params);
    break;
```

And add a button in the HTML:

```html
<button onclick="changeModel('mymodel')">My Model</button>
```

## 🔧 Configuration

### Hand Detection Settings
Located in the MediaPipe initialization:
```javascript
hands.setOptions({
    maxNumHands: 2,              // Max hands to detect
    modelComplexity: 1,          // 0 (lite) to 1 (full)
    minDetectionConfidence: 0.5, // Detection threshold
    minTrackingConfidence: 0.5   // Tracking threshold
});
```

### Rendering Settings
```javascript
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
```

## 🐛 Troubleshooting

### Camera not working
- Ensure you've granted webcam permissions
- Check if another application is using the camera
- Try a different browser

### Hand detection not working
- Ensure good lighting
- Keep hands within the camera frame
- Avoid cluttered backgrounds

### Performance issues
- Close other browser tabs
- Reduce model complexity
- Disable effects (particles, trails)

## 📱 Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Recommended |
| Firefox | ✅ Full | Works great |
| Edge | ✅ Full | Chromium-based |
| Safari | ⚠️ Partial | May need HTTPS |
| Mobile | ⚠️ Limited | Desktop recommended |

## 🎓 Learning Resources

This project demonstrates:
- **Computer Vision**: Hand tracking and gesture recognition
- **3D Graphics**: Scene composition, lighting, materials
- **WebGL**: Hardware-accelerated graphics
- **Real-time Processing**: Combining video input with 3D rendering

## 🚀 Future Enhancements

Potential improvements:
- [ ] Multi-finger gestures for more complex operations
- [ ] Save/load complete scenes
- [ ] Advanced 3D model import (OBJ, GLTF)
- [ ] Voice commands
- [ ] Collaborative mode (multiple users)
- [ ] AR mode with background replacement
- [ ] Custom model sculpting tools
- [ ] Animation recording and playback

## 📄 License

This project is open source and available for educational and commercial use.

## 🙏 Acknowledgments

- **Three.js** - Amazing 3D library
- **MediaPipe** - Powerful ML solutions for hand tracking
- **Google** - For making MediaPipe freely available

## 💡 Tips & Tricks

1. **Best Lighting**: Position yourself with light source in front of you
2. **Camera Angle**: Place camera at eye level for best hand detection
3. **Background**: Solid, contrasting backgrounds work best
4. **Distance**: Keep hands 1-3 feet from camera
5. **Speed**: Smooth, deliberate gestures work better than quick movements

## 🎮 Advanced Usage

### Combining Gestures
- Use pinch + drag simultaneously for compound transformations
- Switch between gestures quickly for fluid control
- Use two hands for color cycling while manipulating with one hand

### Creative Tips
- Enable trails and rotate rapidly for cool spiral effects
- Use wireframe material with glow for a cyberpunk aesthetic
- Combine toon shading with particles for a stylized look
- Take screenshots from multiple angles for a gallery

## 📊 Performance Metrics

Typical performance on modern hardware:
- **Frame Rate**: 60 FPS (3D rendering)
- **Hand Tracking**: 30+ FPS
- **Latency**: <50ms gesture to response
- **Resolution**: 1920x1080 recommended

## 🌟 Showcase

What you can create:
- Abstract 3D art
- Gesture-controlled presentations
- Interactive installations
- Educational demonstrations
- Touchless interfaces

---

**Made with ❤️ using Three.js and MediaPipe**

For questions, issues, or contributions, please open an issue on GitHub!

Happy sculpting! 🎨✋
