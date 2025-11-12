#!/usr/bin/env node

const blessed = require('blessed');
const pty = require('node-pty');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Create screen
const screen = blessed.screen({
  smartCSR: true,
  fullUnicode: true,
  mouse: true,
  title: 'Smart Terminal'
});

// Application state
let mode = 'terminal'; // 'terminal' or 'editor'
let currentFile = null;
let editorContent = '';
let editorCursorX = 0;
let editorCursorY = 0;

// AI auto-complete state
let completionSuggestions = [];
let currentSuggestionIndex = 0;
let commandHistory = [];
let variableCache = new Set();
let sshKeysCache = new Set();

// Create status bar
const statusBar = blessed.box({
  parent: screen,
  bottom: 0,
  left: 0,
  width: '100%',
  height: 1,
  style: {
    bg: 'blue',
    fg: 'white'
  },
  content: ' Smart Terminal | F1: Help | F2: Editor | F3: Terminal | Tab: Autocomplete | Shift+Enter: New Line'
});

// Create terminal box
const terminalBox = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%-1',
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: ' ',
    style: {
      bg: 'blue'
    }
  },
  mouse: true,
  keys: true,
  vi: false,
  tags: true,
  style: {
    bg: 'black',
    fg: 'white'
  }
});

// Create editor box (hidden by default)
const editorBox = blessed.textarea({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%-1',
  keys: true,
  mouse: true,
  vi: false,
  inputOnFocus: true,
  scrollable: true,
  alwaysScroll: true,
  style: {
    bg: 'black',
    fg: 'white',
    focus: {
      bg: 'black',
      fg: 'white'
    }
  },
  hidden: true
});

// Create autocomplete popup
const autocompletePopup = blessed.list({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '50%',
  height: '50%',
  border: 'line',
  style: {
    border: {
      fg: 'cyan'
    },
    selected: {
      bg: 'blue',
      fg: 'white'
    }
  },
  keys: true,
  vi: false,
  mouse: true,
  hidden: true,
  label: ' Autocomplete Suggestions (Tab/Arrow Keys to select, Enter to insert) '
});

// Initialize PTY
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.env.HOME || process.env.USERPROFILE,
  env: process.env
});

let terminalOutput = '';
let currentInput = '';
let cursorPosition = 0;
let multiLineMode = false;
let multiLineBuffer = [];

// Handle PTY output
ptyProcess.onData((data) => {
  terminalOutput += data;

  // Extract variables, SSH keys, and other completable items
  extractCompletableItems(data);

  // Keep only last 10000 characters to prevent memory issues
  if (terminalOutput.length > 10000) {
    terminalOutput = terminalOutput.slice(-10000);
  }

  updateTerminalDisplay();
});

// Extract completable items from terminal output
function extractCompletableItems(text) {
  // Extract variable names (words starting with $ or alphanumeric)
  const variableMatches = text.match(/\$[\w]+|\b[a-zA-Z_][\w]*\b/g);
  if (variableMatches) {
    variableMatches.forEach(v => variableCache.add(v));
  }

  // Extract SSH key names and hosts
  const sshMatches = text.match(/[\w.-]+@[\w.-]+|[\w.-]+\.[\w]{2,}/g);
  if (sshMatches) {
    sshMatches.forEach(s => sshKeysCache.add(s));
  }

  // Limit cache size
  if (variableCache.size > 1000) {
    const arr = Array.from(variableCache);
    variableCache = new Set(arr.slice(-1000));
  }
  if (sshKeysCache.size > 1000) {
    const arr = Array.from(sshKeysCache);
    sshKeysCache = new Set(arr.slice(-1000));
  }
}

// Update terminal display
function updateTerminalDisplay() {
  if (mode !== 'terminal') return;

  let display = terminalOutput;

  if (multiLineMode) {
    display += '\n{yellow-fg}[Multi-line Mode]{/yellow-fg}\n';
    display += multiLineBuffer.join('\n');
    display += '\n> ' + currentInput;
  } else {
    display += '\n> ' + currentInput;
  }

  // Show cursor position
  if (cursorPosition < currentInput.length) {
    const before = currentInput.slice(0, cursorPosition);
    const at = currentInput[cursorPosition] || ' ';
    const after = currentInput.slice(cursorPosition + 1);
    display = display.replace('\n> ' + currentInput, `\n> ${before}{inverse}${at}{/inverse}${after}`);
  }

  terminalBox.setContent(display);
  terminalBox.setScrollPerc(100);
  screen.render();
}

// AI Autocomplete function
function getAutocompleteSuggestions(input) {
  const suggestions = [];
  const lastWord = input.split(/\s+/).pop();

  if (!lastWord) return suggestions;

  // Check command history
  commandHistory.forEach(cmd => {
    if (cmd.startsWith(lastWord) && cmd !== lastWord) {
      suggestions.push({ text: cmd, type: 'history' });
    }
  });

  // Check variables
  variableCache.forEach(variable => {
    if (variable.toLowerCase().startsWith(lastWord.toLowerCase()) && variable !== lastWord) {
      suggestions.push({ text: variable, type: 'variable' });
    }
  });

  // Check SSH keys/hosts
  sshKeysCache.forEach(ssh => {
    if (ssh.toLowerCase().startsWith(lastWord.toLowerCase()) && ssh !== lastWord) {
      suggestions.push({ text: ssh, type: 'ssh' });
    }
  });

  // Common commands
  const commonCommands = [
    'ls', 'cd', 'pwd', 'cat', 'grep', 'echo', 'mkdir', 'rm', 'cp', 'mv',
    'touch', 'nano', 'vim', 'python', 'node', 'npm', 'git', 'ssh', 'scp',
    'chmod', 'chown', 'ps', 'kill', 'top', 'df', 'du', 'find', 'which',
    'export', 'source', 'alias', 'history', 'clear', 'exit'
  ];

  commonCommands.forEach(cmd => {
    if (cmd.startsWith(lastWord) && cmd !== lastWord) {
      suggestions.push({ text: cmd, type: 'command' });
    }
  });

  // Python keywords
  const pythonKeywords = [
    'def', 'class', 'import', 'from', 'if', 'else', 'elif', 'for', 'while',
    'return', 'print', 'len', 'range', 'try', 'except', 'finally', 'with',
    'as', 'in', 'not', 'and', 'or', 'lambda', 'yield', 'async', 'await'
  ];

  pythonKeywords.forEach(kw => {
    if (kw.startsWith(lastWord) && kw !== lastWord) {
      suggestions.push({ text: kw, type: 'keyword' });
    }
  });

  // Remove duplicates and sort by relevance
  const unique = Array.from(new Map(suggestions.map(s => [s.text, s])).values());
  return unique.slice(0, 20); // Limit to 20 suggestions
}

// Show autocomplete popup
function showAutocomplete() {
  const suggestions = getAutocompleteSuggestions(currentInput);

  if (suggestions.length === 0) return;

  completionSuggestions = suggestions;
  currentSuggestionIndex = 0;

  const items = suggestions.map(s => `${s.text} (${s.type})`);
  autocompletePopup.setItems(items);
  autocompletePopup.select(0);
  autocompletePopup.show();
  autocompletePopup.focus();
  screen.render();
}

// Insert autocomplete suggestion
function insertAutocomplete(index) {
  if (index < 0 || index >= completionSuggestions.length) return;

  const suggestion = completionSuggestions[index].text;
  const words = currentInput.split(/\s+/);
  words[words.length - 1] = suggestion;
  currentInput = words.join(' ');
  cursorPosition = currentInput.length;

  autocompletePopup.hide();
  terminalBox.focus();
  updateTerminalDisplay();
}

// Handle terminal input
terminalBox.key(['escape'], () => {
  if (autocompletePopup.hidden === false) {
    autocompletePopup.hide();
    terminalBox.focus();
    screen.render();
  }
});

terminalBox.key(['tab'], () => {
  showAutocomplete();
});

terminalBox.key(['S-enter'], () => {
  // Shift+Enter for multi-line input
  multiLineMode = true;
  multiLineBuffer.push(currentInput);
  currentInput = '';
  cursorPosition = 0;
  updateTerminalDisplay();
});

terminalBox.key(['enter'], () => {
  if (multiLineMode) {
    // Execute multi-line command
    multiLineBuffer.push(currentInput);
    const fullCommand = multiLineBuffer.join('\n') + '\n';
    ptyProcess.write(fullCommand);
    commandHistory.push(multiLineBuffer.join(' '));
    multiLineBuffer = [];
    multiLineMode = false;
    currentInput = '';
    cursorPosition = 0;
  } else {
    // Execute single line command
    ptyProcess.write(currentInput + '\n');
    if (currentInput.trim()) {
      commandHistory.push(currentInput);
    }
    currentInput = '';
    cursorPosition = 0;
  }
  updateTerminalDisplay();
});

terminalBox.key(['backspace'], () => {
  if (cursorPosition > 0) {
    currentInput = currentInput.slice(0, cursorPosition - 1) + currentInput.slice(cursorPosition);
    cursorPosition--;
    updateTerminalDisplay();
  }
});

terminalBox.key(['delete'], () => {
  if (cursorPosition < currentInput.length) {
    currentInput = currentInput.slice(0, cursorPosition) + currentInput.slice(cursorPosition + 1);
    updateTerminalDisplay();
  }
});

terminalBox.key(['left'], () => {
  if (cursorPosition > 0) {
    cursorPosition--;
    updateTerminalDisplay();
  }
});

terminalBox.key(['right'], () => {
  if (cursorPosition < currentInput.length) {
    cursorPosition++;
    updateTerminalDisplay();
  }
});

terminalBox.key(['home'], () => {
  cursorPosition = 0;
  updateTerminalDisplay();
});

terminalBox.key(['end'], () => {
  cursorPosition = currentInput.length;
  updateTerminalDisplay();
});

// Handle regular character input
screen.on('keypress', (ch, key) => {
  if (mode !== 'terminal' || autocompletePopup.hidden === false) return;

  if (key.full === 'C-c') {
    ptyProcess.write('\x03'); // Send Ctrl+C to terminal
    currentInput = '';
    cursorPosition = 0;
    multiLineMode = false;
    multiLineBuffer = [];
    updateTerminalDisplay();
    return;
  }

  if (key.full === 'C-d') {
    ptyProcess.write('\x04'); // Send Ctrl+D to terminal
    return;
  }

  if (ch && !key.ctrl && !key.meta && key.name !== 'enter' && key.name !== 'backspace'
      && key.name !== 'delete' && key.name !== 'tab' && key.name !== 'escape'
      && key.name !== 'up' && key.name !== 'down' && key.name !== 'left' && key.name !== 'right') {
    currentInput = currentInput.slice(0, cursorPosition) + ch + currentInput.slice(cursorPosition);
    cursorPosition++;
    updateTerminalDisplay();
  }
});

// Handle mouse clicks in terminal for cursor positioning
terminalBox.on('click', (data) => {
  if (mode !== 'terminal') return;

  // Calculate approximate cursor position based on click
  // This is simplified - in a real implementation you'd need more precise calculation
  const relativeY = data.y - terminalBox.top;
  const relativeX = data.x - terminalBox.left;

  // If click is on the current input line
  if (relativeX >= 2) { // Account for "> " prompt
    const clickPos = relativeX - 2;
    cursorPosition = Math.min(clickPos, currentInput.length);
    updateTerminalDisplay();
  }
});

// Autocomplete popup key handlers
autocompletePopup.key(['escape'], () => {
  autocompletePopup.hide();
  terminalBox.focus();
  screen.render();
});

autocompletePopup.key(['enter'], () => {
  insertAutocomplete(autocompletePopup.selected);
});

autocompletePopup.key(['tab'], () => {
  insertAutocomplete(autocompletePopup.selected);
});

// Editor mode functions
function switchToEditor(filename = null) {
  mode = 'editor';
  currentFile = filename;

  if (filename && fs.existsSync(filename)) {
    editorContent = fs.readFileSync(filename, 'utf8');
    editorBox.setValue(editorContent);
  } else {
    editorContent = '';
    editorBox.setValue('');
  }

  terminalBox.hide();
  editorBox.show();
  editorBox.focus();

  statusBar.setContent(` Editor Mode: ${currentFile || 'Untitled'} | F3: Back to Terminal | Ctrl+S: Save | Ctrl+O: Open `);
  screen.render();
}

function switchToTerminal() {
  mode = 'terminal';
  editorBox.hide();
  terminalBox.show();
  terminalBox.focus();
  statusBar.setContent(' Smart Terminal | F1: Help | F2: Editor | F3: Terminal | Tab: Autocomplete | Shift+Enter: New Line');
  updateTerminalDisplay();
}

// Editor key handlers
editorBox.key(['C-s'], () => {
  if (!currentFile) {
    // Prompt for filename
    const input = blessed.textbox({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: 3,
      border: 'line',
      label: ' Save As ',
      inputOnFocus: true
    });

    input.on('submit', (value) => {
      if (value) {
        currentFile = value;
        fs.writeFileSync(currentFile, editorBox.getValue());
        statusBar.setContent(` Editor Mode: ${currentFile} - Saved! | F3: Back to Terminal | Ctrl+S: Save | Ctrl+O: Open `);
        input.destroy();
        editorBox.focus();
        screen.render();
      }
    });

    input.on('cancel', () => {
      input.destroy();
      editorBox.focus();
      screen.render();
    });

    screen.render();
    input.focus();
  } else {
    fs.writeFileSync(currentFile, editorBox.getValue());
    statusBar.setContent(` Editor Mode: ${currentFile} - Saved! | F3: Back to Terminal | Ctrl+S: Save | Ctrl+O: Open `);
    setTimeout(() => {
      statusBar.setContent(` Editor Mode: ${currentFile} | F3: Back to Terminal | Ctrl+S: Save | Ctrl+O: Open `);
      screen.render();
    }, 2000);
    screen.render();
  }
});

editorBox.key(['C-o'], () => {
  const input = blessed.textbox({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '50%',
    height: 3,
    border: 'line',
    label: ' Open File ',
    inputOnFocus: true
  });

  input.on('submit', (value) => {
    if (value && fs.existsSync(value)) {
      currentFile = value;
      editorContent = fs.readFileSync(value, 'utf8');
      editorBox.setValue(editorContent);
      statusBar.setContent(` Editor Mode: ${currentFile} | F3: Back to Terminal | Ctrl+S: Save | Ctrl+O: Open `);
      input.destroy();
      editorBox.focus();
      screen.render();
    } else {
      input.destroy();
      editorBox.focus();
      screen.render();
    }
  });

  input.on('cancel', () => {
    input.destroy();
    editorBox.focus();
    screen.render();
  });

  screen.render();
  input.focus();
});

// Global key handlers
screen.key(['f1'], () => {
  const help = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '80%',
    height: '80%',
    border: 'line',
    label: ' Help ',
    content: `
  SMART TERMINAL - Help

  TERMINAL MODE:
  - Type commands normally
  - Tab: Show AI autocomplete suggestions
  - Shift+Enter: Enter multi-line mode (for Python, scripts, etc.)
  - Enter: Execute command
  - Mouse Click: Position cursor in text
  - Ctrl+C: Cancel current command
  - Ctrl+D: Send EOF
  - Arrow Keys: Navigate cursor
  - F2: Switch to Editor mode

  EDITOR MODE:
  - Full text editor with line numbers
  - Ctrl+S: Save file
  - Ctrl+O: Open file
  - F3: Return to Terminal mode
  - Mouse support for cursor positioning
  - Scrollable content

  AI AUTOCOMPLETE:
  - Learns from your command history
  - Suggests variable names from terminal output
  - Suggests SSH hosts and keys
  - Common commands and Python keywords
  - Use Tab to open, Arrow keys to navigate, Enter to insert

  Press Escape to close this help
    `,
    scrollable: true,
    keys: true,
    vi: false,
    mouse: true
  });

  help.key(['escape'], () => {
    help.destroy();
    screen.render();
  });

  help.focus();
  screen.render();
});

screen.key(['f2'], () => {
  switchToEditor();
});

screen.key(['f3'], () => {
  switchToTerminal();
});

screen.key(['C-c'], () => {
  if (mode === 'terminal' && autocompletePopup.hidden) {
    // Already handled above
    return;
  }
  // Don't exit on Ctrl+C, just cancel operations
});

screen.key(['C-q'], () => {
  // Quit application
  ptyProcess.kill();
  process.exit(0);
});

// Initialize
terminalBox.focus();
updateTerminalDisplay();

// Clean up on exit
process.on('exit', () => {
  ptyProcess.kill();
});

console.log('Smart Terminal started. Press F1 for help.');
