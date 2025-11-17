# Contributing to Gesture 3D Sculptor

Thank you for your interest in contributing to Gesture 3D Sculptor! We welcome contributions from everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Guidelines](#development-guidelines)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Our Standards

**Positive behavior includes:**
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Harassment, trolling, or insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

---

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, or Safari)
- Basic knowledge of HTML, CSS, and JavaScript
- Familiarity with Three.js (helpful but not required)
- Familiarity with MediaPipe (helpful but not required)

### Setting Up Development Environment

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/gesture-3d-sculptor.git
   cd gesture-3d-sculptor
   ```

2. **Create a branch for your changes**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/your-bugfix-name
   ```

3. **Test locally**
   - Open `index.html` in your browser
   - For HTTPS testing, use a local server:
     ```bash
     # Python 3
     python -m http.server 8000

     # Node.js
     npx http-server

     # PHP
     php -S localhost:8000
     ```

4. **Make your changes**
   - Write code following our style guidelines
   - Test thoroughly
   - Update documentation as needed

---

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

1. **Bug Fixes**
   - Fix broken features
   - Resolve issues reported by users
   - Improve error handling

2. **New Features**
   - Add new gestures
   - Create new 3D models
   - Implement new visual effects
   - Add new shaders

3. **Documentation**
   - Improve README
   - Add code comments
   - Create tutorials
   - Fix typos

4. **Performance Improvements**
   - Optimize code
   - Reduce memory usage
   - Improve frame rate

5. **Testing**
   - Report bugs
   - Test on different devices
   - Verify cross-browser compatibility

---

## Development Guidelines

### Code Style

#### JavaScript

Follow these conventions:

```javascript
// Use camelCase for variables and functions
let currentModel;
function createModel() { }

// Use PascalCase for classes
class PerformanceMonitor { }

// Use UPPER_CASE for constants
const PINCH_THRESHOLD = 0.05;

// Add descriptive comments
/**
 * Detect pinch gesture between thumb and index finger
 * @param {Array} landmarks - Hand landmarks from MediaPipe
 * @returns {boolean} True if pinching
 */
function detectPinch(landmarks) {
    // Implementation
}

// Use meaningful variable names
const thumbTip = landmarks[4];  // Good
const t = landmarks[4];         // Bad

// Keep functions focused and small
function processGestures(results) {
    if (!validateResults(results)) return;

    detectPinch(results);
    detectDrag(results);
    detectFist(results);
}
```

#### HTML

```html
<!-- Use semantic HTML -->
<section class="control-panel">
    <h2>Controls</h2>
    <div class="control-group">
        <label for="color-picker">Color</label>
        <input type="color" id="color-picker">
    </div>
</section>

<!-- Use descriptive IDs and classes -->
<button id="btn-save-screenshot">Save Screenshot</button>

<!-- Add accessibility attributes -->
<button aria-label="Reset model" onclick="resetModel()">
    🔄 Reset
</button>
```

#### CSS

```css
/* Use BEM-like naming when appropriate */
.control-panel { }
.control-panel__header { }
.control-panel__button--active { }

/* Group related properties */
.button {
    /* Positioning */
    position: relative;

    /* Box model */
    display: inline-block;
    padding: 12px 24px;
    margin: 8px;

    /* Visual */
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 8px;
    color: white;

    /* Typography */
    font-size: 14px;
    font-weight: 600;

    /* Misc */
    cursor: pointer;
    transition: all 0.3s ease;
}

/* Use comments to organize sections */
/* ==================== LAYOUT ==================== */

/* ==================== COMPONENTS ==================== */

/* ==================== UTILITIES ==================== */
```

### File Organization

```
gesture-3d-app/
├── index.html              # Main application
├── advanced.html           # Advanced version with custom shaders
├── tutorial.html           # Interactive tutorial
├── config.js               # Configuration file
├── utils.js                # Utility functions
├── README.md               # Main documentation
├── DEVELOPER.md            # Developer documentation
├── TROUBLESHOOTING.md      # Troubleshooting guide
├── CONTRIBUTING.md         # This file
└── LICENSE                 # License file
```

### Adding New Features

When adding new features:

1. **Plan first**
   - Describe what you want to add
   - Consider how it fits with existing features
   - Think about user experience

2. **Start small**
   - Create a minimal working version first
   - Test thoroughly
   - Then add enhancements

3. **Document**
   - Add code comments
   - Update README if needed
   - Create examples

4. **Test**
   - Test on multiple browsers
   - Test on different devices
   - Verify performance impact

### Adding New Gestures

Example of adding a new gesture:

```javascript
// 1. Create detection function in utils.js or main script
function detectThumbsUp(landmarks) {
    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3];
    const indexMCP = landmarks[5];

    // Thumb pointing up
    const thumbUp = thumbTip.y < thumbIP.y;

    // Other fingers down
    const fingersDown =
        landmarks[8].y > landmarks[5].y &&
        landmarks[12].y > landmarks[9].y &&
        landmarks[16].y > landmarks[13].y &&
        landmarks[20].y > landmarks[17].y;

    return thumbUp && fingersDown;
}

// 2. Add to gesture processing
function processGestures(results) {
    // ... existing code ...

    if (detectThumbsUp(landmarks)) {
        // Perform action
        increaseModelScale();
    }
}

// 3. Document in README and tutorial
```

### Adding New 3D Models

Example of adding a new model:

```javascript
// 1. Add geometry creation in createModel function
function createModel(type) {
    // ... existing code ...

    switch(type) {
        // ... existing cases ...

        case 'pyramid':
            geometry = new THREE.ConeGeometry(1, 2, 4);
            break;

        case 'star':
            geometry = createStarGeometry();
            break;
    }

    // ... rest of function ...
}

// 2. Add button to UI
<button onclick="changeModel('pyramid')" id="btn-pyramid">
    Pyramid
</button>

// 3. Update documentation
```

### Performance Considerations

Always consider performance:

```javascript
// ✅ Good - Reuse objects
const tempVector = new THREE.Vector3();
function updatePosition() {
    tempVector.set(x, y, z);
    model.position.copy(tempVector);
}

// ❌ Bad - Creates new object every frame
function updatePosition() {
    model.position.copy(new THREE.Vector3(x, y, z));
}

// ✅ Good - Cache DOM queries
const button = document.getElementById('my-button');
function handleClick() {
    button.classList.toggle('active');
}

// ❌ Bad - Query DOM repeatedly
function handleClick() {
    document.getElementById('my-button').classList.toggle('active');
}

// ✅ Good - Throttle expensive operations
const processGesturesThrottled = throttle(processGestures, 50);

// ❌ Bad - Run on every frame
function animate() {
    processGestures(results);  // Too frequent
}
```

---

## Submitting Changes

### Pull Request Process

1. **Update your fork**
   ```bash
   git fetch upstream
   git merge upstream/main
   ```

2. **Make your changes**
   ```bash
   # Make changes to files
   git add .
   git commit -m "Add feature: description of feature"
   ```

3. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Go to GitHub repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template

### Pull Request Guidelines

Your PR should:

- Have a clear, descriptive title
- Include a detailed description of changes
- Reference any related issues
- Include screenshots/videos for visual changes
- Pass all tests (if applicable)
- Not break existing functionality

### PR Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
How has this been tested?
- [ ] Tested in Chrome
- [ ] Tested in Firefox
- [ ] Tested in Safari
- [ ] Tested on mobile

## Screenshots
If applicable, add screenshots

## Related Issues
Fixes #123
Related to #456

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have commented my code
- [ ] I have updated documentation
- [ ] My changes generate no new warnings
- [ ] I have tested my changes
```

### Commit Messages

Write clear commit messages:

```bash
# ✅ Good
git commit -m "Add pinch-to-zoom gesture detection"
git commit -m "Fix hand tracking on Safari"
git commit -m "Improve particle system performance"
git commit -m "Update README with new gestures"

# ❌ Bad
git commit -m "Fixed stuff"
git commit -m "Update"
git commit -m "asdf"
```

Follow this format for larger commits:

```
Short summary (50 chars or less)

More detailed explanation if needed. Wrap at 72 characters.
Explain what and why, not how.

- Bullet points are okay
- Use imperative mood ("Add feature" not "Added feature")

Fixes #123
```

---

## Reporting Bugs

### Before Reporting

1. **Check existing issues** - Search for similar bugs
2. **Test in latest version** - Verify bug still exists
3. **Try different browsers** - Determine if browser-specific
4. **Check troubleshooting guide** - See if solution exists

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Perform gesture '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
If applicable, add screenshots

## Environment
- Browser: Chrome 120
- OS: Windows 11
- Version: 1.0.0
- Device: Desktop / Mobile

## Console Errors
```
Paste any console errors here
```

## Additional Context
Any other relevant information
```

---

## Suggesting Enhancements

We love new ideas! When suggesting enhancements:

### Enhancement Template

```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?
What problem does it solve?

## Proposed Solution
How should this feature work?

## Alternative Solutions
What other approaches did you consider?

## Additional Context
Mockups, examples, related features, etc.
```

### Feature Requests

Good feature requests:

- Solve a real problem
- Fit the project's goals
- Are clearly described
- Consider implementation complexity
- Include examples or mockups

---

## Testing

### Manual Testing Checklist

Before submitting:

- [ ] App loads without errors
- [ ] Camera permissions work
- [ ] Hand detection works
- [ ] All gestures function correctly
- [ ] UI is responsive
- [ ] Models render correctly
- [ ] Effects work as expected
- [ ] Screenshots can be saved
- [ ] Export functionality works
- [ ] No console errors
- [ ] Performance is acceptable (30+ FPS)

### Browser Testing

Test in multiple browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

### Performance Testing

Check performance:

- [ ] Monitor FPS
- [ ] Check CPU usage
- [ ] Verify memory usage
- [ ] Test with low-end hardware
- [ ] Test with high particle counts

---

## Questions?

If you have questions:

1. Check existing documentation
2. Search closed issues
3. Open a new issue with the "question" label
4. Be patient and respectful

---

## Recognition

Contributors will be recognized in:

- CONTRIBUTORS.md file
- Release notes
- Project README

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

---

**Thank you for contributing to Gesture 3D Sculptor! 🎨✨**

Your contributions make this project better for everyone.
