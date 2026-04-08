# FASM Highlight

FASM Highlight is an unofficial Flat Assembler language support extension for VS Code compatible editors and Antigravity IDE.

## Current Features

- FASM language registration for `.asm` and `.inc`
- syntax highlighting
- bundled optional theme: `FASM Workshop Dark`
- snippets for common program structures
- language configuration for comments, brackets, and folding
- `FASM: Build`
- `FASM: Build and Run`

## Current Behavior

- build commands are intended for standalone source files, not include files
- build-and-run only auto-runs when the extension can infer a runnable output for the current platform
- compiler output is written to the `FASM` output channel
- compiler path and limits are configurable in settings

## Configuration

```json
{
  "fasm.compilerPath": "C:\\fasmw17332\\fasm.exe",
  "fasm.memoryLimit": 65536,
  "fasm.passesLimit": 100,
  "fasm.generateSymbols": false
}
```

## Platform Support

Current implementation is Windows-first.

- the default compiler path is Windows-specific
- PE-style build and run flows are the most directly supported
- Linux and macOS should not be treated as fully implemented support yet

## Examples

The repository includes example programs in `examples/`:

- `hello_win32.asm`
- `calculator.asm`
- `snake.asm`

## Theme

The extension now includes an optional dark theme tuned for assembly-heavy editing:

- restrained dark background
- higher contrast for mnemonics, directives, registers, labels, and numbers
- colors chosen to make data flow and control flow easier to scan in FASM source

You can enable it from the editor theme picker as `FASM Workshop Dark`.

## Development

```powershell
cd flat-assembler-extetion
npm install
npm run compile
```

Press `F5` in a VS Code compatible editor to launch an Extension Development Host for manual testing.

## Notes

- `src/` is the editable TypeScript source
- `out/` contains generated JavaScript
- local FASM reference material is available in `D:\Projects\test2\fasm-full`

## License

MIT
