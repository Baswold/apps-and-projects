# Smart Terminal

An AI-powered terminal emulator with mouse support, intelligent auto-completion, and an integrated text editor.

## Features

### Terminal Mode
- **Real Terminal Emulation**: Uses `node-pty` for actual terminal/shell execution
- **Mouse Support**: Click anywhere in your input to position the cursor
- **AI Auto-completion**: Press `Tab` to get intelligent suggestions for:
  - Command history
  - Variable names (learned from terminal output)
  - SSH hosts and keys
  - Common shell commands
  - Python keywords and syntax
- **Multi-line Input**: Press `Shift+Enter` to enter multi-line mode - perfect for writing Python scripts, complex commands, or multi-line configurations
- **Full Keyboard Support**: Arrow keys, Home, End, Ctrl+C, Ctrl+D all work as expected

### Editor Mode
- **VS Code-like Text Editor**: Integrated text editor similar to VS Code but lighter weight
- **File Operations**:
  - `Ctrl+S`: Save current file (prompts for filename if new)
  - `Ctrl+O`: Open existing file
- **Mouse Support**: Click to position cursor anywhere in your text
- **Scrollable Content**: Handle files of any size
- **Seamless Switching**: Press `F3` to return to terminal, `F2` to open editor

### AI Auto-completion
The terminal learns as you work:
- Tracks all variable names that appear in your terminal output
- Remembers SSH hosts and domain names
- Builds a history of your commands
- Suggests Python keywords when you're writing code
- Provides context-aware completions based on what you're typing

## Installation

```bash
cd smart-terminal
npm install
```

## Usage

Start the terminal:

```bash
npm start
```

Or make it executable:

```bash
chmod +x index.js
./index.js
```

## Keyboard Shortcuts

### Global
- `F1`: Show help
- `F2`: Switch to Editor mode
- `F3`: Switch to Terminal mode
- `Ctrl+Q`: Quit application

### Terminal Mode
- `Tab`: Show autocomplete suggestions
- `Shift+Enter`: Enter multi-line mode
- `Enter`: Execute command (or add line in multi-line mode)
- `Ctrl+C`: Cancel current command/input
- `Ctrl+D`: Send EOF signal
- `Arrow Keys`: Navigate cursor
- `Home/End`: Jump to start/end of line
- `Backspace/Delete`: Delete characters
- **Mouse Click**: Position cursor in input

### Editor Mode
- `Ctrl+S`: Save file
- `Ctrl+O`: Open file
- `Ctrl+Q`: Quit (returns to terminal)
- `F3`: Return to Terminal mode
- **Mouse Click**: Position cursor in editor

### Autocomplete Popup
- `Arrow Keys`: Navigate suggestions
- `Enter` or `Tab`: Insert selected suggestion
- `Escape`: Close popup

## Use Cases

### Writing Python Scripts
1. Press `Shift+Enter` to enter multi-line mode
2. Type your Python code, pressing `Shift+Enter` after each line
3. Press `Enter` when done to execute
4. Use `Tab` for auto-completion of Python keywords

Example:
```python
def hello():
    print("Hello World")
    return True

hello()
```

### Editing Configuration Files
1. Press `F2` to enter Editor mode
2. Press `Ctrl+O` to open a file (e.g., `~/.bashrc`)
3. Edit the file with full mouse and keyboard support
4. Press `Ctrl+S` to save
5. Press `F3` to return to terminal

### Working with SSH
The terminal learns SSH hosts as you use them:
```bash
ssh user@example.com
```
Next time, just type `ssh us` and press `Tab` - it will suggest `user@example.com`!

### Variable Name Completion
When working with variables:
```bash
export MY_VARIABLE="test"
echo $MY_  # Press Tab here
```
The terminal learns `MY_VARIABLE` and suggests it!

## Architecture

- **blessed**: Terminal UI framework with mouse support
- **node-pty**: Real pseudo-terminal for actual shell execution
- **Custom AI Engine**: Learns from your usage patterns to provide intelligent completions

## How It Works

### Terminal Emulation
The app spawns a real shell process (bash/powershell) using `node-pty`, which creates a pseudo-terminal. All your commands are executed in this real shell, so everything works exactly like a normal terminal.

### AI Auto-completion
The completion engine:
1. Monitors all terminal output
2. Extracts patterns: variables (`$VAR`, `VARIABLE_NAME`), SSH hosts (`user@host`), domains
3. Builds a cache of seen items
4. Provides context-aware suggestions based on what you're typing
5. Ranks suggestions by type (history > variables > commands)

### Multi-line Mode
When you press `Shift+Enter`:
1. Current line is saved to a buffer
2. You can keep adding lines
3. When you press `Enter`, all lines are sent to the shell together
4. Perfect for Python, here-documents, or complex commands

## Requirements

- Node.js 14 or higher
- Linux, macOS, or Windows (with appropriate shell)
- Terminal with mouse support enabled

## License

MIT
