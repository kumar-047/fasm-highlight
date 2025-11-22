# FASM - Flat Assembler Extension for Antigravity IDE

Language support extension for **Flat Assembler (FASM)** providing syntax highlighting, code snippets, and integrated compiler support.

## Features

### 🎨 **Comprehensive Syntax Highlighting**
- **500+ x86/x86-64 instructions** including MMX, SSE, SSE2, SSE3, SSE4, AVX
- **All register types**: 8-bit, 16-bit, 32-bit, 64-bit, segment, control, debug, FPU, MMX, XMM/YMM/ZMM
- **FASM directives**: data definition, structures, macros, conditionals, sections
- **Smart tokenization**: numbers (hex, binary, decimal, octal), strings, comments, labels
- **Special operators**: `$`, `#`, `` ` ``, `%`

### 📝 **Code Snippets**
Pre-built templates for quick development:
- `win32` - Windows 32-bit console application
- `win64` - Windows 64-bit console application  
- `linux` - Linux ELF executable
- `proc` / `proc64` - Procedure with prologue/epilogue
- `macro` - Macro definition
- `struct` - Structure definition
- `msgbox32` / `msgbox64` - Windows MessageBox
- And more!

### ⚙️ **Language Features**
- **Comment toggling** (Ctrl+/)
- **Bracket matching** and auto-closing
- **Code folding** for macros, structures, procedures
- **Smart word selection**

### 🔨 **FASM Compiler Integration**
- **Build command** (Ctrl+Shift+B) - Compile FASM source files
- **Build and Run** (Ctrl+Shift+R) - Compile and execute in one step
- **Error parsing** - Jump to errors in code
- **Configurable compiler path** and options
- **Output panel** with detailed build information

## Installation

### Install in Antigravity IDE

1. **From VSIX file:**
   ```powershell
   # Install dependencies and compile
   npm install
   npm run compile
   
   # Package the extension
   npx vsce package
   
   # Install in Antigravity IDE
   # Extensions → Install from VSIX → select fasm-language-support-0.1.0.vsix
   ```

2. **Development mode:**
   - Open the extension folder in Antigravity IDE
   - Press `F5` to launch Extension Development Host
   - Test the extension in the new window

## FASM Setup

1. **Download FASM** from [flatassembler.net](https://flatassembler.net/)
2. Extract to a location (e.g., `C:\fasmw17332`)
3. **Configure extension** in Antigravity IDE settings:
   - `fasm.compilerPath`: Path to `fasm.exe` (default: `C:\fasmw17332\fasm.exe`)
   - `fasm.memoryLimit`: Memory limit in KB (default: 65536)
   - `fasm.passesLimit`: Maximum passes (default: 100)
   - `fasm.generateSymbols`: Generate debugging symbols (default: false)

## Usage

### Creating a New Program

1. Create a new file with `.asm` extension
2. Type a snippet prefix (e.g., `win32`) and press Tab
3. Fill in the template with your code
4. Save the file

### Building

- **Build only**: Press `Ctrl+Shift+B` or run command "FASM: Build"
- **Build and run**: Press `Ctrl+Shift+R` or run command "FASM: Build and Run"
- View output in the **FASM** output panel

### Example Code

```asm
format PE console
entry start

include 'win32a.inc'

section '.text' code readable executable

start:
    push 0
    push title
    push message
    push 0
    call [MessageBoxA]
    
    push 0
    call [ExitProcess]

section '.data' data readable writeable
    message db 'Hello from FASM!',0
    title db 'My Program',0

section '.idata' import data readable writeable
    library kernel32,'KERNEL32.DLL',\\
            user32,'USER32.DLL'
    
    import kernel32,\\
           ExitProcess,'ExitProcess'
    
    import user32,\\
           MessageBoxA,'MessageBoxA'
```

## Keyboard Shortcuts

| Shortcut | Command |
|----------|---------|
| `Ctrl+Shift+B` | Build current file |
| `Ctrl+Shift+R` | Build and run |
| `Ctrl+/` | Toggle line comment |

## Configuration

Access settings via `File → Preferences → Settings` and search for "FASM":

```json
{
  "fasm.compilerPath": "C:\\fasmw17332\\fasm.exe",
  "fasm.memoryLimit": 65536,
  "fasm.passesLimit": 100,
  "fasm.generateSymbols": false
}
```

## Requirements

- **FASM** version 1.73.32 or later
- **Antigravity IDE** (VS Code fork)
- **Windows** (Primary support)
  > **Note:** Support for **Linux**, **macOS**, and **FASM ARM** is currently experimental/manual but will be fully integrated in upcoming updates. Currently, you can manually configure the compiler path for these platforms.

## Known Limitations

- Advanced debugging requires external debugger (GDB, WinDbg)
- Symbolic information (`-s` flag) provides basic symbol export only

## Examples

The extension includes example programs in the `examples/` folder:
- `hello_win32.asm` - Windows MessageBox demo
- `calculator.asm` - Macros and arithmetic

## Extension Development

### Building from Source

```powershell
# Clone or download the extension
cd flat-assembler-extetion

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package extension
npm run package
```

### Testing

Press `F5` in Antigravity IDE to launch the Extension Development Host and test your changes.

## License

MIT License

## Credits

- **FASM** by Tomasz Grysztar - [flatassembler.net](https://flatassembler.net/)
- Extension developed for **Google Antigravity IDE**

## Support

For issues or feature requests, please use the GitHub repository issue tracker.

---

**Enjoy coding in FASM with Antigravity IDE!** 🚀
