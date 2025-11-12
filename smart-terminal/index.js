#!/usr/bin/env node

const blessed = require('blessed');
const pty = require('node-pty');
const os = require('os');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM - Every pixel matters
// ═══════════════════════════════════════════════════════════════════════════

const THEME = {
  // Primary palette - Inspired by the best design systems
  primary: '#6C63FF',
  secondary: '#FF6584',
  accent: '#4ECDC4',
  success: '#95E1D3',
  warning: '#FFD93D',
  error: '#FF6B6B',

  // Neutral palette - Perfect contrast ratios
  bg: {
    primary: '#1A1B26',
    secondary: '#24283B',
    elevated: '#2F3549',
    overlay: 'rgba(0,0,0,0.4)'
  },

  fg: {
    primary: '#F8F8F2',
    secondary: '#A9B1D6',
    muted: '#565F89',
    inverse: '#1A1B26'
  },

  // Syntax highlighting
  syntax: {
    keyword: '#BB9AF7',
    string: '#9ECE6A',
    number: '#FF9E64',
    comment: '#565F89',
    function: '#7AA2F7',
    variable: '#C0CAF5'
  },

  // UI elements
  border: {
    default: '#3B4261',
    focus: '#6C63FF',
    muted: '#2A2E3E'
  }
};

// Unicode symbols for beautiful UI
const ICONS = {
  terminal: '❯',
  editor: '✎',
  success: '✓',
  error: '✗',
  info: 'ℹ',
  warning: '⚠',
  history: '◷',
  variable: '𝑥',
  ssh: '⇄',
  command: '⚡',
  keyword: '◈',
  file: '📄',
  folder: '📁',
  saved: '💾',
  loading: '⟳',
  arrow: '→',
  prompt: '▸',
  multiline: '⋮',
  AI: '◆',
  settings: '⚙',
  sound: '🔊',
  soundOff: '🔇',
  experimental: '🧪',
  toggle: '⬜',
  toggleOn: '✅'
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPERIMENTAL FEATURES & SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

const SETTINGS = {
  soundEffects: false,
  experimentalFeatures: {
    rainbowMode: false,
    matrixRain: false,
    typewriterEffect: false,
    powerlinePrompt: false,
    gitIntegration: false,
    autoSuggestions: true,
    fuzzySearch: false,
    commandPreview: false,
    syntaxHighlight: false,
    minimap: false,
    splitPane: false,
    tabs: false,
    breadcrumbs: false,
    fileTree: false,
    terminalTabs: false,
    smartParentheses: false,
    autoIndent: false,
    codeCompletion: false,
    liveSearch: false,
    commandStats: false
  }
};

// Sound effects (using terminal bell sequences)
const SOUNDS = {
  keypress: () => settings.soundEffects && process.stdout.write('\x07'),
  command: () => settings.soundEffects && process.stdout.write('\x07'),
  complete: () => settings.soundEffects && process.stdout.write('\x07\x07'),
  error: () => settings.soundEffects && process.stdout.write('\x07\x07\x07'),
  success: () => settings.soundEffects && process.stdout.write('\x07')
};

let settings = { ...SETTINGS };

// Beautiful loading spinners
const SPINNERS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const SPINNER_COLORS = ['#6C63FF', '#7AA2F7', '#4ECDC4', '#95E1D3', '#4ECDC4', '#7AA2F7'];

// Beautiful box drawing characters
const BOX = {
  top: '─',
  bottom: '─',
  left: '│',
  right: '│',
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  divider: '─'
};

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

const screen = blessed.screen({
  smartCSR: true,
  fullUnicode: true,
  mouse: true,
  title: '✨ Smart Terminal',
  cursor: {
    artificial: true,
    shape: 'line',
    blink: true,
    color: 'white'
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// APPLICATION STATE
// ═══════════════════════════════════════════════════════════════════════════

let mode = 'welcome'; // 'welcome', 'terminal', 'editor', 'palette'
let currentFile = null;
let commandHistory = [];
let variableCache = new Set();
let sshKeysCache = new Set();
let terminalOutput = '';
let currentInput = '';
let cursorPosition = 0;
let multiLineMode = false;
let multiLineBuffer = [];
let completionSuggestions = [];
let showingWelcome = true;
let cursorBlink = true;
let currentTheme = 'default';

// Command execution state
let commandRunning = false;
let currentCommand = '';
let commandStartTime = null;
let commandElapsedTime = 0;
let spinnerFrame = 0;
let spinnerColorIndex = 0;

// Performance monitoring
let cpuUsage = 0;
let memoryUsage = 0;

// ═══════════════════════════════════════════════════════════════════════════
// BEAUTIFUL STATUS BAR with Live Stats
// ═══════════════════════════════════════════════════════════════════════════

const statusBar = blessed.box({
  parent: screen,
  bottom: 0,
  left: 0,
  width: '100%',
  height: 1,
  style: {
    bg: '#24283B',
    fg: '#A9B1D6'
  },
  tags: true
});

function updateStatusBar() {
  const modeIcons = {
    welcome: '✨',
    terminal: ICONS.terminal,
    editor: ICONS.editor,
    palette: '⌘'
  };

  const modeColors = {
    welcome: '{#6C63FF-fg}',
    terminal: '{#4ECDC4-fg}',
    editor: '{#FF6584-fg}',
    palette: '{#FFD93D-fg}'
  };

  const icon = modeIcons[mode] || ICONS.terminal;
  const color = modeColors[mode] || '{white-fg}';

  // Left side: Mode and context
  let left = ` ${color}${icon} ${mode.toUpperCase()}{/}`;

  if (mode === 'editor' && currentFile) {
    const fileName = path.basename(currentFile);
    left += ` {#565F89-fg}│{/} {#7AA2F7-fg}${ICONS.file} ${fileName}{/}`;
  }

  if (multiLineMode) {
    left += ` {#FFD93D-fg}${ICONS.multiline} MULTI-LINE{/}`;
  }

  // Command running indicator
  if (commandRunning && mode === 'terminal') {
    const spinner = SPINNERS[spinnerFrame % SPINNERS.length];
    const spinnerColor = SPINNER_COLORS[spinnerColorIndex % SPINNER_COLORS.length];
    const elapsed = formatElapsedTime(commandElapsedTime);
    left += ` {#565F89-fg}│{/} {${spinnerColor}-fg}${spinner}{/} {#A9B1D6-fg}${currentCommand.slice(0, 20)}${currentCommand.length > 20 ? '...' : ''}{/} {#565F89-fg}${elapsed}{/}`;
  }

  // Center: Hints (or command status)
  let centerText;
  if (commandRunning && mode === 'terminal') {
    centerText = '{#FFD93D-fg}⚡ Command executing...{/}';
  } else {
    const hints = {
      terminal: '{#565F89-fg}Tab:Autocomplete  ⇧↵:MultiLine  ⌘P:Palette{/}',
      editor: '{#565F89-fg}^S:Save  ^O:Open  F3:Terminal{/}',
      welcome: '{#565F89-fg}Press any key to start...{/}',
      palette: '{#565F89-fg}Type to search, ↵ to execute{/}'
    };
    centerText = hints[mode] || '';
  }

  // Right side: Stats and time
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const historyCount = commandHistory.length;
  const right = ` {#565F89-fg}${ICONS.history}${historyCount}  ${time}{/} `;

  // Calculate spacing
  const strippedLeft = stripAnsi(left);
  const strippedCenter = stripAnsi(centerText);
  const strippedRight = stripAnsi(right);
  const totalWidth = screen.width;
  const centerStart = Math.floor((totalWidth - strippedCenter.length) / 2);
  const centerPadding = Math.max(0, centerStart - strippedLeft.length);
  const rightPadding = Math.max(0, totalWidth - strippedLeft.length - centerPadding - strippedCenter.length - strippedRight.length);

  statusBar.setContent(left + ' '.repeat(centerPadding) + centerText + ' '.repeat(rightPadding) + right);
  screen.render();
}

// Helper to strip ANSI codes for length calculation
function stripAnsi(str) {
  return str.replace(/\{[^}]*\}/g, '');
}

// Helper to format elapsed time beautifully
function formatElapsedTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Update status bar and spinner animation
setInterval(() => {
  if (commandRunning) {
    spinnerFrame++;
    if (spinnerFrame % 3 === 0) {
      spinnerColorIndex++;
    }
    commandElapsedTime = Date.now() - commandStartTime;

    // Pulsing border effect - cycles through purple shades
    const pulseColors = ['#6C63FF', '#7AA2F7', '#6C63FF', '#5A52E0'];
    const pulseIndex = Math.floor(spinnerFrame / 2) % pulseColors.length;
    terminalBox.style.border.fg = pulseColors[pulseIndex];
    screen.render();
  }
  updateStatusBar();
}, 150); // 150ms for smooth spinner animation

// ═══════════════════════════════════════════════════════════════════════════
// BEAUTIFUL WELCOME SCREEN
// ═══════════════════════════════════════════════════════════════════════════

const welcomeScreen = blessed.box({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '80%',
  height: '70%',
  style: {
    bg: '#1A1B26',
    fg: '#F8F8F2'
  },
  tags: true,
  border: {
    type: 'line',
    fg: '#6C63FF'
  }
});

const welcomeContent = `
{center}{#6C63FF-fg}╔═══════════════════════════════════════════════════════════╗{/}
{#6C63FF-fg}║{/}                                                           {#6C63FF-fg}║{/}
{#6C63FF-fg}║{/}            {bold}{#FF6584-fg}✨  SMART TERMINAL  ✨{/}{/}                    {#6C63FF-fg}║{/}
{#6C63FF-fg}║{/}                                                           {#6C63FF-fg}║{/}
{#6C63FF-fg}║{/}        {#A9B1D6-fg}Beautiful. Intelligent. Powerful.{/}               {#6C63FF-fg}║{/}
{#6C63FF-fg}║{/}                                                           {#6C63FF-fg}║{/}
{#6C63FF-fg}╚═══════════════════════════════════════════════════════════╝{/}{/center}

{center}{#4ECDC4-fg}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{/}{/center}

{center}{bold}{#F8F8F2-fg}KEY FEATURES{/}{/}{/center}

  {#7AA2F7-fg}${ICONS.AI} AI Autocomplete{/}      {#565F89-fg}→{/}  Context-aware suggestions as you type
  {#95E1D3-fg}${ICONS.prompt} Mouse Support{/}        {#565F89-fg}→{/}  Click anywhere to position cursor
  {#BB9AF7-fg}${ICONS.multiline} Multi-line Mode{/}      {#565F89-fg}→{/}  Write scripts with Shift+Enter
  {#FF6584-fg}${ICONS.editor} Integrated Editor{/}   {#565F89-fg}→{/}  Full-featured text editor built-in
  {#FFD93D-fg}⚡ Command Palette{/}     {#565F89-fg}→{/}  Quick actions with Cmd+P

{center}{#4ECDC4-fg}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{/}{/center}

{center}{bold}{#F8F8F2-fg}QUICK START{/}{/}{/center}

  {#6C63FF-fg}F1{/}  Help          {#6C63FF-fg}F2{/}  Editor         {#6C63FF-fg}F3{/}  Terminal
  {#6C63FF-fg}⌘P{/}  Command Palette                 {#6C63FF-fg}^Q{/}  Quit

{center}{#4ECDC4-fg}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{/}{/center}

{center}{#565F89-fg}Press any key to begin your journey...{/}{/center}
`;

welcomeScreen.setContent(welcomeContent);

// ═══════════════════════════════════════════════════════════════════════════
// BEAUTIFUL TERMINAL BOX
// ═══════════════════════════════════════════════════════════════════════════

const terminalBox = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%-1',
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: '█',
    style: {
      bg: '#24283B',
      fg: '#6C63FF'
    },
    track: {
      bg: '#1A1B26'
    }
  },
  mouse: true,
  keys: true,
  vi: false,
  tags: true,
  style: {
    bg: '#1A1B26',
    fg: '#F8F8F2'
  },
  border: {
    type: 'line',
    fg: '#3B4261'
  },
  label: {
    text: ` ${ICONS.terminal} TERMINAL `,
    side: 'left'
  },
  hidden: true
});

// ═══════════════════════════════════════════════════════════════════════════
// BEAUTIFUL AUTOCOMPLETE POPUP
// ═══════════════════════════════════════════════════════════════════════════

const autocompletePopup = blessed.list({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '60%',
  height: '60%',
  style: {
    bg: '#24283B',
    fg: '#F8F8F2',
    border: {
      fg: '#6C63FF'
    },
    selected: {
      bg: '#6C63FF',
      fg: '#F8F8F2',
      bold: true
    },
    item: {
      hover: {
        bg: '#2F3549'
      }
    }
  },
  border: {
    type: 'line',
    fg: '#6C63FF'
  },
  label: {
    text: ` ${ICONS.AI} AI SUGGESTIONS `,
    side: 'left'
  },
  keys: true,
  vi: false,
  mouse: true,
  hidden: true,
  tags: true,
  scrollbar: {
    ch: '█',
    style: {
      bg: '#24283B',
      fg: '#6C63FF'
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// BEAUTIFUL COMMAND PALETTE
// ═══════════════════════════════════════════════════════════════════════════

const commandPalette = blessed.list({
  parent: screen,
  top: 2,
  left: 'center',
  width: '60%',
  height: '50%',
  style: {
    bg: '#24283B',
    fg: '#F8F8F2',
    border: {
      fg: '#FFD93D'
    },
    selected: {
      bg: '#FFD93D',
      fg: '#1A1B26',
      bold: true
    }
  },
  border: {
    type: 'line',
    fg: '#FFD93D'
  },
  label: {
    text: ' ⚡ COMMAND PALETTE ',
    side: 'left'
  },
  keys: true,
  vi: false,
  mouse: true,
  hidden: true,
  tags: true,
  items: [
    `{#4ECDC4-fg}${ICONS.terminal}{/}  Switch to Terminal Mode`,
    `{#FF6584-fg}${ICONS.editor}{/}  Switch to Editor Mode`,
    `{#7AA2F7-fg}${ICONS.file}{/}  Open File...`,
    `{#95E1D3-fg}${ICONS.saved}{/}  Save Current File`,
    `{#BB9AF7-fg}${ICONS.history}{/}  View Command History`,
    `{#9ECE6A-fg}${ICONS.settings}{/}  Settings & Experimental Features`,
    `{#FFD93D-fg}${ICONS.info}{/}  Show Help`,
    `{#FF6B6B-fg}${ICONS.error}{/}  Clear Terminal`,
    `{#565F89-fg}⌘{/}  Close Palette`
  ]
});

// ═══════════════════════════════════════════════════════════════════════════
// BEAUTIFUL SETTINGS MENU
// ═══════════════════════════════════════════════════════════════════════════

function createSettingsMenu() {
  const settingsMenu = blessed.list({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '80%',
    height: '80%',
    style: {
      bg: '#1A1B26',
      fg: '#F8F8F2',
      border: {
        fg: '#9ECE6A'
      },
      selected: {
        bg: '#9ECE6A',
        fg: '#1A1B26',
        bold: true
      }
    },
    border: {
      type: 'line',
      fg: '#9ECE6A'
    },
    label: {
      text: ` ${ICONS.settings} SETTINGS & EXPERIMENTAL FEATURES `,
      side: 'left'
    },
    keys: true,
    vi: false,
    mouse: true,
    tags: true,
    scrollbar: {
      ch: '█',
      style: {
        bg: '#24283B',
        fg: '#9ECE6A'
      }
    }
  });

  function updateSettingsItems() {
    const items = [
      `{center}{bold}{#9ECE6A-fg}━━━━━━━━━━━━━━━━━━ GENERAL SETTINGS ━━━━━━━━━━━━━━━━━━{/}{/}{/center}`,
      '',
      `${settings.soundEffects ? ICONS.toggleOn : ICONS.toggle}  {#4ECDC4-fg}Sound Effects{/}  {#565F89-fg}Terminal bell sounds for feedback{/}`,
      '',
      `{center}{bold}{#FF6584-fg}━━━━━━━━━━━━━━ EXPERIMENTAL FEATURES ━━━━━━━━━━━━━━{/}{/}{/center}`,
      `{center}{#565F89-fg}⚠ Warning: These features are experimental and may be unstable{/}{/center}`,
      '',
      `${settings.experimentalFeatures.rainbowMode ? ICONS.toggleOn : ICONS.toggle}  {#BB9AF7-fg}${ICONS.experimental} Rainbow Mode{/}  {#565F89-fg}Colorful gradient text{/}`,
      `${settings.experimentalFeatures.matrixRain ? ICONS.toggleOn : ICONS.toggle}  {#95E1D3-fg}${ICONS.experimental} Matrix Rain{/}  {#565F89-fg}Falling characters animation{/}`,
      `${settings.experimentalFeatures.typewriterEffect ? ICONS.toggleOn : ICONS.toggle}  {#7AA2F7-fg}${ICONS.experimental} Typewriter Effect{/}  {#565F89-fg}Character-by-character typing{/}`,
      `${settings.experimentalFeatures.powerlinePrompt ? ICONS.toggleOn : ICONS.toggle}  {#FFD93D-fg}${ICONS.experimental} Powerline Prompt{/}  {#565F89-fg}Fancy prompt with arrows{/}`,
      `${settings.experimentalFeatures.gitIntegration ? ICONS.toggleOn : ICONS.toggle}  {#FF9E64-fg}${ICONS.experimental} Git Integration{/}  {#565F89-fg}Show branch in prompt{/}`,
      `${settings.experimentalFeatures.autoSuggestions ? ICONS.toggleOn : ICONS.toggle}  {#C0CAF5-fg}${ICONS.experimental} Auto Suggestions{/}  {#565F89-fg}Fish-style suggestions{/}`,
      `${settings.experimentalFeatures.fuzzySearch ? ICONS.toggleOn : ICONS.toggle}  {#4ECDC4-fg}${ICONS.experimental} Fuzzy Search{/}  {#565F89-fg}Approximate matching{/}`,
      `${settings.experimentalFeatures.commandPreview ? ICONS.toggleOn : ICONS.toggle}  {#BB9AF7-fg}${ICONS.experimental} Command Preview{/}  {#565F89-fg}Show command output preview{/}`,
      `${settings.experimentalFeatures.syntaxHighlight ? ICONS.toggleOn : ICONS.toggle}  {#9ECE6A-fg}${ICONS.experimental} Syntax Highlighting{/}  {#565F89-fg}Color code syntax{/}`,
      `${settings.experimentalFeatures.minimap ? ICONS.toggleOn : ICONS.toggle}  {#FF6584-fg}${ICONS.experimental} Editor Minimap{/}  {#565F89-fg}Code overview sidebar{/}`,
      `${settings.experimentalFeatures.splitPane ? ICONS.toggleOn : ICONS.toggle}  {#7AA2F7-fg}${ICONS.experimental} Split Pane{/}  {#565F89-fg}Multiple terminals side-by-side{/}`,
      `${settings.experimentalFeatures.tabs ? ICONS.toggleOn : ICONS.toggle}  {#FFD93D-fg}${ICONS.experimental} Editor Tabs{/}  {#565F89-fg}Multiple file tabs{/}`,
      `${settings.experimentalFeatures.breadcrumbs ? ICONS.toggleOn : ICONS.toggle}  {#95E1D3-fg}${ICONS.experimental} Breadcrumbs{/}  {#565F89-fg}Current path navigation{/}`,
      `${settings.experimentalFeatures.fileTree ? ICONS.toggleOn : ICONS.toggle}  {#C0CAF5-fg}${ICONS.experimental} File Tree{/}  {#565F89-fg}Sidebar file explorer{/}`,
      `${settings.experimentalFeatures.terminalTabs ? ICONS.toggleOn : ICONS.toggle}  {#4ECDC4-fg}${ICONS.experimental} Terminal Tabs{/}  {#565F89-fg}Multiple terminal sessions{/}`,
      `${settings.experimentalFeatures.smartParentheses ? ICONS.toggleOn : ICONS.toggle}  {#BB9AF7-fg}${ICONS.experimental} Smart Parentheses{/}  {#565F89-fg}Auto-close brackets{/}`,
      `${settings.experimentalFeatures.autoIndent ? ICONS.toggleOn : ICONS.toggle}  {#9ECE6A-fg}${ICONS.experimental} Auto Indent{/}  {#565F89-fg}Smart indentation{/}`,
      `${settings.experimentalFeatures.codeCompletion ? ICONS.toggleOn : ICONS.toggle}  {#FF6584-fg}${ICONS.experimental} Code Completion{/}  {#565F89-fg}IntelliSense-like completion{/}`,
      `${settings.experimentalFeatures.liveSearch ? ICONS.toggleOn : ICONS.toggle}  {#7AA2F7-fg}${ICONS.experimental} Live Search{/}  {#565F89-fg}Search as you type{/}`,
      `${settings.experimentalFeatures.commandStats ? ICONS.toggleOn : ICONS.toggle}  {#FFD93D-fg}${ICONS.experimental} Command Stats{/}  {#565F89-fg}Track command usage{/}`,
      '',
      `{center}{#565F89-fg}Press Enter to toggle • Escape to close • F4 for quick access{/}{/center}`
    ];

    settingsMenu.setItems(items);
  }

  updateSettingsItems();

  settingsMenu.key(['escape'], () => {
    settingsMenu.destroy();
    if (mode === 'editor') {
      editorBox.focus();
    } else {
      terminalBox.focus();
    }
    screen.render();
  });

  settingsMenu.key(['enter'], () => {
    const selected = settingsMenu.selected;

    // Sound effects toggle
    if (selected === 2) {
      settings.soundEffects = !settings.soundEffects;
      if (settings.soundEffects) {
        SOUNDS.success();
      }
      updateSettingsItems();
      screen.render();
      return;
    }

    // Experimental features (starting at index 7)
    const featureKeys = Object.keys(settings.experimentalFeatures);
    const featureIndex = selected - 7;

    if (featureIndex >= 0 && featureIndex < featureKeys.length) {
      const featureKey = featureKeys[featureIndex];
      settings.experimentalFeatures[featureKey] = !settings.experimentalFeatures[featureKey];

      if (settings.experimentalFeatures[featureKey]) {
        SOUNDS.success();
      }

      updateSettingsItems();
      screen.render();
    }
  });

  settingsMenu.focus();
  screen.render();

  return settingsMenu;
}

// ═══════════════════════════════════════════════════════════════════════════
// BEAUTIFUL EDITOR
// ═══════════════════════════════════════════════════════════════════════════

const editorLineNumbers = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: 6,
  height: '100%-1',
  style: {
    bg: '#24283B',
    fg: '#565F89'
  },
  tags: true,
  border: {
    type: 'line',
    fg: '#3B4261',
    right: true
  },
  hidden: true
});

const editorBox = blessed.textarea({
  parent: screen,
  top: 0,
  left: 6,
  width: '100%-6',
  height: '100%-1',
  keys: true,
  mouse: true,
  vi: false,
  inputOnFocus: true,
  scrollable: true,
  alwaysScroll: true,
  style: {
    bg: '#1A1B26',
    fg: '#F8F8F2',
    focus: {
      bg: '#1A1B26',
      fg: '#F8F8F2'
    }
  },
  border: {
    type: 'line',
    fg: '#3B4261'
  },
  label: {
    text: ` ${ICONS.editor} EDITOR `,
    side: 'left'
  },
  scrollbar: {
    ch: '█',
    style: {
      bg: '#24283B',
      fg: '#FF6584'
    }
  },
  hidden: true,
  tags: true
});

// Update line numbers when editor content changes
function updateEditorLineNumbers() {
  const content = editorBox.getValue();
  const lines = content.split('\n');
  let lineNumbers = '';

  for (let i = 1; i <= lines.length; i++) {
    const num = i.toString().padStart(4, ' ');
    if (i === lines.length) {
      lineNumbers += `{#6C63FF-fg}${num}{/}`;
    } else {
      lineNumbers += `{#565F89-fg}${num}{/}\n`;
    }
  }

  editorLineNumbers.setContent(lineNumbers);
  screen.render();
}

// ═══════════════════════════════════════════════════════════════════════════
// PTY INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-256color',
  cols: 80,
  rows: 30,
  cwd: process.env.HOME || process.env.USERPROFILE,
  env: process.env
});

// Command completion detection
let lastOutputTime = Date.now();
let commandCompleteTimer = null;

ptyProcess.onData((data) => {
  terminalOutput += data;
  extractCompletableItems(data);

  if (terminalOutput.length > 50000) {
    terminalOutput = terminalOutput.slice(-50000);
  }

  // Detect command completion
  // Commands typically finish when output stops for a brief moment
  if (commandRunning) {
    lastOutputTime = Date.now();

    // Clear previous timer
    if (commandCompleteTimer) {
      clearTimeout(commandCompleteTimer);
    }

    // If no output for 300ms, assume command completed
    commandCompleteTimer = setTimeout(() => {
      if (commandRunning) {
        commandRunning = false;
        terminalBox.style.border.fg = '#3B4261'; // Reset border color
        SOUNDS.success();
        updateTerminalDisplay();
      }
    }, 300);
  }

  updateTerminalDisplay();
});

// ═══════════════════════════════════════════════════════════════════════════
// AI AUTOCOMPLETE ENGINE
// ═══════════════════════════════════════════════════════════════════════════

function extractCompletableItems(text) {
  const variableMatches = text.match(/\$[\w]+|\b[a-zA-Z_][\w]*\b/g);
  if (variableMatches) {
    variableMatches.forEach(v => variableCache.add(v));
  }

  const sshMatches = text.match(/[\w.-]+@[\w.-]+|[\w.-]+\.[\w]{2,}/g);
  if (sshMatches) {
    sshMatches.forEach(s => sshKeysCache.add(s));
  }

  if (variableCache.size > 2000) {
    const arr = Array.from(variableCache);
    variableCache = new Set(arr.slice(-2000));
  }
  if (sshKeysCache.size > 1000) {
    const arr = Array.from(sshKeysCache);
    sshKeysCache = new Set(arr.slice(-1000));
  }
}

function getAutocompleteSuggestions(input) {
  const suggestions = [];
  const lastWord = input.split(/\s+/).pop();

  if (!lastWord || lastWord.length < 1) return suggestions;

  // History (highest priority)
  const recentHistory = commandHistory.slice(-50).reverse();
  recentHistory.forEach(cmd => {
    if (cmd.toLowerCase().startsWith(lastWord.toLowerCase()) && cmd !== lastWord) {
      suggestions.push({
        text: cmd,
        type: 'history',
        icon: ICONS.history,
        color: '#BB9AF7',
        description: 'From your history'
      });
    }
  });

  // Variables
  Array.from(variableCache).forEach(variable => {
    if (variable.toLowerCase().startsWith(lastWord.toLowerCase()) && variable !== lastWord) {
      suggestions.push({
        text: variable,
        type: 'variable',
        icon: ICONS.variable,
        color: '#C0CAF5',
        description: 'Variable'
      });
    }
  });

  // SSH
  Array.from(sshKeysCache).forEach(ssh => {
    if (ssh.toLowerCase().includes(lastWord.toLowerCase()) && ssh !== lastWord) {
      suggestions.push({
        text: ssh,
        type: 'ssh',
        icon: ICONS.ssh,
        color: '#4ECDC4',
        description: 'SSH host'
      });
    }
  });

  // Commands
  const commonCommands = [
    { cmd: 'ls', desc: 'List files' },
    { cmd: 'cd', desc: 'Change directory' },
    { cmd: 'pwd', desc: 'Print working directory' },
    { cmd: 'cat', desc: 'Show file contents' },
    { cmd: 'grep', desc: 'Search text' },
    { cmd: 'echo', desc: 'Print text' },
    { cmd: 'mkdir', desc: 'Create directory' },
    { cmd: 'rm', desc: 'Remove file' },
    { cmd: 'cp', desc: 'Copy file' },
    { cmd: 'mv', desc: 'Move file' },
    { cmd: 'touch', desc: 'Create file' },
    { cmd: 'nano', desc: 'Text editor' },
    { cmd: 'vim', desc: 'Text editor' },
    { cmd: 'python', desc: 'Run Python' },
    { cmd: 'python3', desc: 'Run Python 3' },
    { cmd: 'node', desc: 'Run Node.js' },
    { cmd: 'npm', desc: 'Node package manager' },
    { cmd: 'git', desc: 'Version control' },
    { cmd: 'ssh', desc: 'Secure shell' },
    { cmd: 'chmod', desc: 'Change permissions' },
    { cmd: 'chown', desc: 'Change owner' },
    { cmd: 'ps', desc: 'List processes' },
    { cmd: 'kill', desc: 'Kill process' },
    { cmd: 'top', desc: 'Process monitor' },
    { cmd: 'df', desc: 'Disk usage' },
    { cmd: 'du', desc: 'Directory size' },
    { cmd: 'find', desc: 'Find files' },
    { cmd: 'which', desc: 'Locate command' },
    { cmd: 'export', desc: 'Set environment variable' },
    { cmd: 'history', desc: 'Command history' },
    { cmd: 'clear', desc: 'Clear screen' }
  ];

  commonCommands.forEach(({ cmd, desc }) => {
    if (cmd.startsWith(lastWord) && cmd !== lastWord) {
      suggestions.push({
        text: cmd,
        type: 'command',
        icon: ICONS.command,
        color: '#7AA2F7',
        description: desc
      });
    }
  });

  // Python keywords
  const pythonKeywords = [
    'def', 'class', 'import', 'from', 'if', 'else', 'elif', 'for', 'while',
    'return', 'print', 'len', 'range', 'try', 'except', 'finally', 'with',
    'as', 'in', 'not', 'and', 'or', 'lambda', 'yield', 'async', 'await',
    'True', 'False', 'None', 'self', '__init__', '__str__', '__repr__'
  ];

  pythonKeywords.forEach(kw => {
    if (kw.startsWith(lastWord) && kw !== lastWord) {
      suggestions.push({
        text: kw,
        type: 'keyword',
        icon: ICONS.keyword,
        color: '#BB9AF7',
        description: 'Python keyword'
      });
    }
  });

  // Remove duplicates and limit
  const unique = Array.from(new Map(suggestions.map(s => [s.text, s])).values());
  return unique.slice(0, 25);
}

// ═══════════════════════════════════════════════════════════════════════════
// BEAUTIFUL TERMINAL DISPLAY
// ═══════════════════════════════════════════════════════════════════════════

function updateTerminalDisplay() {
  if (mode !== 'terminal') return;

  let display = terminalOutput;

  // Beautiful multi-line mode indicator
  if (multiLineMode) {
    display += `\n{#FFD93D-bg}{#1A1B26-fg} ${ICONS.multiline} MULTI-LINE MODE {/}\n`;
    multiLineBuffer.forEach((line, i) => {
      display += `{#565F89-fg}${(i + 1).toString().padStart(2, ' ')} │{/} ${line}\n`;
    });
    display += `{#565F89-fg}${(multiLineBuffer.length + 1).toString().padStart(2, ' ')} │{/} `;
  } else {
    display += `\n{#6C63FF-fg}${ICONS.prompt}{/} `;
  }

  // Add current input with beautiful cursor
  if (cursorPosition < currentInput.length) {
    const before = currentInput.slice(0, cursorPosition);
    const at = currentInput[cursorPosition] || ' ';
    const after = currentInput.slice(cursorPosition + 1);

    if (cursorBlink) {
      display += `${before}{#6C63FF-bg}{#F8F8F2-fg}${at}{/}${after}`;
    } else {
      display += `${before}{underline}${at}{/underline}${after}`;
    }
  } else {
    display += currentInput;
    if (cursorBlink) {
      display += '{#6C63FF-bg} {/}';
    } else {
      display += '{underline} {/underline}';
    }
  }

  terminalBox.setContent(display);
  terminalBox.setScrollPerc(100);
  screen.render();
}

// Cursor blink animation
setInterval(() => {
  cursorBlink = !cursorBlink;
  updateTerminalDisplay();
}, 530); // Perfect blink rate

// ═══════════════════════════════════════════════════════════════════════════
// BEAUTIFUL AUTOCOMPLETE DISPLAY
// ═══════════════════════════════════════════════════════════════════════════

function showAutocomplete() {
  const suggestions = getAutocompleteSuggestions(currentInput);

  if (suggestions.length === 0) {
    // Show helpful message
    const noResults = blessed.box({
      parent: screen,
      top: 'center',
      left: 'center',
      width: 50,
      height: 5,
      border: 'line',
      style: {
        bg: '#24283B',
        fg: '#A9B1D6',
        border: {
          fg: '#565F89'
        }
      },
      content: `{center}{#565F89-fg}${ICONS.info} No suggestions found{/}\n\nKeep typing to learn...{/center}`,
      tags: true
    });

    setTimeout(() => {
      noResults.destroy();
      screen.render();
    }, 1500);

    return;
  }

  completionSuggestions = suggestions;

  // Format suggestions beautifully
  const items = suggestions.map(s => {
    const icon = s.icon || ICONS.command;
    const color = s.color || '#F8F8F2';
    const desc = s.description ? `{#565F89-fg}${s.description}{/}` : '';
    return `{${color}-fg}${icon}{/}  {bold}${s.text}{/}  ${desc}`;
  });

  autocompletePopup.setItems(items);
  autocompletePopup.select(0);
  autocompletePopup.show();
  autocompletePopup.focus();
  screen.render();
}

function insertAutocomplete(index) {
  if (index < 0 || index >= completionSuggestions.length) return;

  const suggestion = completionSuggestions[index].text;
  const words = currentInput.split(/\s+/);
  words[words.length - 1] = suggestion;
  currentInput = words.join(' ');
  cursorPosition = currentInput.length;

  SOUNDS.complete();
  autocompletePopup.hide();
  terminalBox.focus();
  updateTerminalDisplay();
}

// ═══════════════════════════════════════════════════════════════════════════
// MODE SWITCHING with Beautiful Transitions
// ═══════════════════════════════════════════════════════════════════════════

function switchMode(newMode) {
  // Hide all
  welcomeScreen.hide();
  terminalBox.hide();
  editorBox.hide();
  editorLineNumbers.hide();
  commandPalette.hide();

  mode = newMode;

  switch (newMode) {
    case 'terminal':
      terminalBox.show();
      terminalBox.focus();
      terminalBox.style.border.fg = '#6C63FF';
      updateTerminalDisplay();
      break;

    case 'editor':
      editorLineNumbers.show();
      editorBox.show();
      editorBox.focus();
      editorBox.style.border.fg = '#FF6584';
      updateEditorLineNumbers();
      break;

    case 'palette':
      if (mode === 'editor') {
        editorLineNumbers.show();
        editorBox.show();
      } else {
        terminalBox.show();
      }
      commandPalette.show();
      commandPalette.focus();
      break;
  }

  updateStatusBar();
  screen.render();
}

// ═══════════════════════════════════════════════════════════════════════════
// KEYBOARD HANDLERS - Terminal Mode
// ═══════════════════════════════════════════════════════════════════════════

terminalBox.key(['escape'], () => {
  if (!autocompletePopup.hidden) {
    autocompletePopup.hide();
    terminalBox.focus();
    screen.render();
  }
});

terminalBox.key(['tab'], () => {
  showAutocomplete();
});

terminalBox.key(['S-enter'], () => {
  multiLineMode = true;
  multiLineBuffer.push(currentInput);
  currentInput = '';
  cursorPosition = 0;
  updateTerminalDisplay();
});

terminalBox.key(['enter'], () => {
  SOUNDS.command();

  let cmdToExecute = '';

  if (multiLineMode) {
    multiLineBuffer.push(currentInput);
    const fullCommand = multiLineBuffer.join('\n') + '\n';
    cmdToExecute = multiLineBuffer.join(' ; ');
    ptyProcess.write(fullCommand);
    commandHistory.push(cmdToExecute);
    multiLineBuffer = [];
    multiLineMode = false;
    currentInput = '';
    cursorPosition = 0;
  } else {
    cmdToExecute = currentInput;
    ptyProcess.write(currentInput + '\n');
    if (currentInput.trim()) {
      commandHistory.push(currentInput);
    }
    currentInput = '';
    cursorPosition = 0;
  }

  // Start command execution tracking
  if (cmdToExecute.trim()) {
    commandRunning = true;
    currentCommand = cmdToExecute;
    commandStartTime = Date.now();
    commandElapsedTime = 0;
    spinnerFrame = 0;
    spinnerColorIndex = 0;

    // Add pulsing border effect
    terminalBox.style.border.fg = '#6C63FF';
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

// History navigation
let historyIndex = -1;
terminalBox.key(['up'], () => {
  if (commandHistory.length === 0) return;

  if (historyIndex === -1) {
    historyIndex = commandHistory.length - 1;
  } else if (historyIndex > 0) {
    historyIndex--;
  }

  currentInput = commandHistory[historyIndex] || '';
  cursorPosition = currentInput.length;
  updateTerminalDisplay();
});

terminalBox.key(['down'], () => {
  if (historyIndex === -1) return;

  historyIndex++;

  if (historyIndex >= commandHistory.length) {
    historyIndex = -1;
    currentInput = '';
  } else {
    currentInput = commandHistory[historyIndex] || '';
  }

  cursorPosition = currentInput.length;
  updateTerminalDisplay();
});

// Mouse click for cursor positioning
terminalBox.on('click', (data) => {
  if (mode !== 'terminal') return;

  const relativeX = data.x - terminalBox.left - 2;

  if (relativeX >= 0) {
    cursorPosition = Math.min(Math.max(0, relativeX), currentInput.length);
    updateTerminalDisplay();
  }
});

// Character input
screen.on('keypress', (ch, key) => {
  if (mode !== 'terminal' || !autocompletePopup.hidden) return;

  if (key.full === 'C-c') {
    ptyProcess.write('\x03');
    currentInput = '';
    cursorPosition = 0;
    multiLineMode = false;
    multiLineBuffer = [];
    historyIndex = -1;
    updateTerminalDisplay();
    return;
  }

  if (key.full === 'C-d') {
    ptyProcess.write('\x04');
    return;
  }

  if (key.full === 'C-l') {
    terminalOutput = '';
    updateTerminalDisplay();
    return;
  }

  if (ch && !key.ctrl && !key.meta &&
      !['enter', 'backspace', 'delete', 'tab', 'escape', 'up', 'down', 'left', 'right'].includes(key.name)) {
    currentInput = currentInput.slice(0, cursorPosition) + ch + currentInput.slice(cursorPosition);
    cursorPosition++;
    historyIndex = -1;
    updateTerminalDisplay();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// AUTOCOMPLETE POPUP HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

autocompletePopup.key(['escape'], () => {
  autocompletePopup.hide();
  terminalBox.focus();
  screen.render();
});

autocompletePopup.key(['enter', 'tab'], () => {
  insertAutocomplete(autocompletePopup.selected);
});

// ═══════════════════════════════════════════════════════════════════════════
// EDITOR HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

editorBox.on('keypress', () => {
  updateEditorLineNumbers();
});

editorBox.key(['C-s'], () => {
  if (!currentFile) {
    const input = blessed.textbox({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: 3,
      border: {
        type: 'line',
        fg: '#6C63FF'
      },
      label: ` ${ICONS.saved} Save As `,
      inputOnFocus: true,
      style: {
        bg: '#24283B',
        fg: '#F8F8F2',
        border: {
          fg: '#6C63FF'
        }
      },
      tags: true
    });

    input.on('submit', (value) => {
      if (value) {
        currentFile = value;
        fs.writeFileSync(currentFile, editorBox.getValue());

        const successMsg = blessed.box({
          parent: screen,
          top: 'center',
          left: 'center',
          width: 40,
          height: 5,
          border: 'line',
          style: {
            bg: '#24283B',
            fg: '#95E1D3',
            border: {
              fg: '#95E1D3'
            }
          },
          content: `{center}{#95E1D3-fg}${ICONS.success} File saved!{/}\n\n{#A9B1D6-fg}${path.basename(currentFile)}{/}{/center}`,
          tags: true
        });

        setTimeout(() => {
          successMsg.destroy();
          screen.render();
        }, 1500);

        input.destroy();
        editorBox.focus();
        updateStatusBar();
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

    const successMsg = blessed.box({
      parent: screen,
      top: 'center',
      left: 'center',
      width: 40,
      height: 5,
      border: 'line',
      style: {
        bg: '#24283B',
        fg: '#95E1D3',
        border: {
          fg: '#95E1D3'
        }
      },
      content: `{center}{#95E1D3-fg}${ICONS.success} File saved!{/}\n\n{#A9B1D6-fg}${path.basename(currentFile)}{/}{/center}`,
      tags: true
    });

    setTimeout(() => {
      successMsg.destroy();
      screen.render();
    }, 1500);

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
    border: {
      type: 'line',
      fg: '#7AA2F7'
    },
    label: ` ${ICONS.file} Open File `,
    inputOnFocus: true,
    style: {
      bg: '#24283B',
      fg: '#F8F8F2'
    },
    tags: true
  });

  input.on('submit', (value) => {
    if (value && fs.existsSync(value)) {
      currentFile = value;
      editorBox.setValue(fs.readFileSync(value, 'utf8'));
      updateEditorLineNumbers();
      updateStatusBar();
      input.destroy();
      editorBox.focus();
      screen.render();
    } else if (value) {
      const errorMsg = blessed.box({
        parent: screen,
        top: 'center',
        left: 'center',
        width: 40,
        height: 5,
        border: 'line',
        style: {
          bg: '#24283B',
          fg: '#FF6B6B',
          border: {
            fg: '#FF6B6B'
          }
        },
        content: `{center}{#FF6B6B-fg}${ICONS.error} File not found!{/}{/center}`,
        tags: true
      });

      setTimeout(() => {
        errorMsg.destroy();
        screen.render();
      }, 1500);

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

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND PALETTE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

commandPalette.key(['escape'], () => {
  commandPalette.hide();
  if (mode === 'editor') {
    mode = 'editor';
    editorBox.focus();
  } else {
    mode = 'terminal';
    terminalBox.focus();
  }
  updateStatusBar();
  screen.render();
});

commandPalette.key(['enter'], () => {
  const selected = commandPalette.selected;
  commandPalette.hide();

  switch (selected) {
    case 0: // Terminal
      SOUNDS.command();
      switchMode('terminal');
      break;
    case 1: // Editor
      SOUNDS.command();
      switchMode('editor');
      break;
    case 2: // Open File
      SOUNDS.command();
      switchMode('editor');
      editorBox.key(['C-o']);
      break;
    case 3: // Save
      if (mode === 'editor') {
        SOUNDS.command();
        editorBox.emit('keypress', null, { full: 'C-s' });
      }
      break;
    case 4: // History
      SOUNDS.command();
      showHistoryPanel();
      break;
    case 5: // Settings
      SOUNDS.command();
      createSettingsMenu();
      break;
    case 6: // Help
      SOUNDS.command();
      showHelpPanel();
      break;
    case 7: // Clear
      SOUNDS.command();
      terminalOutput = '';
      switchMode('terminal');
      break;
    default:
      if (mode === 'editor') {
        editorBox.focus();
      } else {
        terminalBox.focus();
      }
  }

  screen.render();
});

// ═══════════════════════════════════════════════════════════════════════════
// HELP PANEL
// ═══════════════════════════════════════════════════════════════════════════

function showHelpPanel() {
  const help = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '85%',
    height: '85%',
    border: {
      type: 'line',
      fg: '#6C63FF'
    },
    label: ` ${ICONS.info} SMART TERMINAL - HELP `,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: false,
    mouse: true,
    style: {
      bg: '#1A1B26',
      fg: '#F8F8F2',
      border: {
        fg: '#6C63FF'
      }
    },
    scrollbar: {
      ch: '█',
      style: {
        bg: '#24283B',
        fg: '#6C63FF'
      }
    },
    tags: true,
    content: `
{center}{bold}{#6C63FF-fg}✨ SMART TERMINAL{/}{/}{/center}
{center}{#A9B1D6-fg}Beautiful. Intelligent. Powerful.{/}{/center}

{center}{#4ECDC4-fg}${'━'.repeat(70)}{/}{/center}

{bold}{#FF6584-fg}TERMINAL MODE{/}{/}

  {#7AA2F7-fg}Tab{/}              Show AI autocomplete suggestions
  {#7AA2F7-fg}Shift+Enter{/}      Enter multi-line mode (perfect for Python!)
  {#7AA2F7-fg}Enter{/}             Execute command
  {#7AA2F7-fg}Ctrl+C{/}            Cancel current input
  {#7AA2F7-fg}Ctrl+D{/}            Send EOF to shell
  {#7AA2F7-fg}Ctrl+L{/}            Clear terminal
  {#7AA2F7-fg}↑/↓{/}               Navigate command history
  {#7AA2F7-fg}←/→{/}               Move cursor
  {#7AA2F7-fg}Home/End{/}          Jump to start/end
  {#7AA2F7-fg}Mouse Click{/}       Position cursor anywhere

{center}{#4ECDC4-fg}${'━'.repeat(70)}{/}{/center}

{bold}{#FF6584-fg}EDITOR MODE{/}{/}

  {#7AA2F7-fg}Ctrl+S{/}            Save file (prompts if new)
  {#7AA2F7-fg}Ctrl+O{/}            Open file
  {#7AA2F7-fg}Ctrl+Q{/}            Quit application
  {#7AA2F7-fg}Mouse Click{/}       Position cursor
  {#7AA2F7-fg}Scroll{/}            Navigate large files

{center}{#4ECDC4-fg}${'━'.repeat(70)}{/}{/center}

{bold}{#FF6584-fg}GLOBAL SHORTCUTS{/}{/}

  {#7AA2F7-fg}F1{/}                Show this help
  {#7AA2F7-fg}F2{/}                Switch to Editor mode
  {#7AA2F7-fg}F3{/}                Switch to Terminal mode
  {#7AA2F7-fg}Ctrl+P{/} or {#7AA2F7-fg}⌘P{/}    Open Command Palette
  {#7AA2F7-fg}Ctrl+Q{/}            Quit application

{center}{#4ECDC4-fg}${'━'.repeat(70)}{/}{/center}

{bold}{#FF6584-fg}AI AUTOCOMPLETE{/}{/}

The terminal learns as you work:

  {#BB9AF7-fg}${ICONS.history}{/}  Command History    Recently used commands
  {#C0CAF5-fg}${ICONS.variable}{/}  Variables          $VAR, function names, etc.
  {#4ECDC4-fg}${ICONS.ssh}{/}  SSH Hosts          user@host, domains
  {#7AA2F7-fg}${ICONS.command}{/}  Common Commands    ls, cd, git, npm, etc.
  {#BB9AF7-fg}${ICONS.keyword}{/}  Python Keywords    def, class, import, etc.

Press {#6C63FF-fg}Tab{/} to see suggestions, {#6C63FF-fg}↑/↓{/} to navigate, {#6C63FF-fg}Enter{/} to insert.

{center}{#4ECDC4-fg}${'━'.repeat(70)}{/}{/center}

{bold}{#FF6584-fg}MULTI-LINE MODE{/}{/}

Perfect for writing Python scripts or complex commands:

  1. Press {#FFD93D-fg}Shift+Enter{/} to start
  2. Type each line, pressing {#FFD93D-fg}Shift+Enter{/} after each
  3. Press {#95E1D3-fg}Enter{/} when done to execute all lines

{center}{#4ECDC4-fg}${'━'.repeat(70)}{/}{/center}

{center}{#565F89-fg}Press Escape to close this help{/}{/center}
    `
  });

  help.key(['escape'], () => {
    help.destroy();
    if (mode === 'editor') {
      editorBox.focus();
    } else {
      terminalBox.focus();
    }
    screen.render();
  });

  help.focus();
  screen.render();
}

// ═══════════════════════════════════════════════════════════════════════════
// HISTORY PANEL
// ═══════════════════════════════════════════════════════════════════════════

function showHistoryPanel() {
  const historyItems = commandHistory.slice(-50).reverse().map((cmd, i) => {
    return `{#565F89-fg}${(i + 1).toString().padStart(3, ' ')}{/}  {#7AA2F7-fg}${ICONS.history}{/}  ${cmd}`;
  });

  const historyList = blessed.list({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '70%',
    height: '70%',
    border: {
      type: 'line',
      fg: '#BB9AF7'
    },
    label: ` ${ICONS.history} COMMAND HISTORY `,
    items: historyItems.length > 0 ? historyItems : ['{center}{#565F89-fg}No history yet...{/}{/center}'],
    keys: true,
    vi: false,
    mouse: true,
    style: {
      bg: '#1A1B26',
      fg: '#F8F8F2',
      selected: {
        bg: '#BB9AF7',
        fg: '#1A1B26'
      }
    },
    scrollbar: {
      ch: '█',
      style: {
        bg: '#24283B',
        fg: '#BB9AF7'
      }
    },
    tags: true
  });

  historyList.key(['escape'], () => {
    historyList.destroy();
    if (mode === 'editor') {
      editorBox.focus();
    } else {
      terminalBox.focus();
    }
    screen.render();
  });

  historyList.key(['enter'], () => {
    if (commandHistory.length > 0) {
      const selected = commandHistory.slice(-50).reverse()[historyList.selected];
      currentInput = selected;
      cursorPosition = currentInput.length;
      historyList.destroy();
      switchMode('terminal');
      updateTerminalDisplay();
    }
  });

  historyList.focus();
  screen.render();
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL KEY HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

screen.key(['f1'], () => {
  showHelpPanel();
});

screen.key(['f2'], () => {
  switchMode('editor');
});

screen.key(['f3'], () => {
  switchMode('terminal');
});

screen.key(['f4'], () => {
  createSettingsMenu();
});

screen.key(['C-p'], () => {
  commandPalette.show();
  commandPalette.focus();
  commandPalette.select(0);
  mode = 'palette';
  updateStatusBar();
  screen.render();
});

screen.key(['C-q'], () => {
  ptyProcess.kill();
  process.exit(0);
});

// ═══════════════════════════════════════════════════════════════════════════
// WELCOME SCREEN HANDLER
// ═══════════════════════════════════════════════════════════════════════════

screen.once('keypress', () => {
  if (showingWelcome) {
    showingWelcome = false;
    welcomeScreen.hide();
    switchMode('terminal');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

updateStatusBar();
screen.render();

// Cleanup
process.on('exit', () => {
  ptyProcess.kill();
});

process.on('SIGINT', () => {
  ptyProcess.kill();
  process.exit(0);
});
