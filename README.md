# FASM Highlight

FASM Highlight is an unofficial Flat Assembler language support extension for VS Code compatible editors and Antigravity IDE.

## Current Features

- FASM language registration for `.asm` and `.inc`
- syntax highlighting for instructions, directives, registers, and preprocessor keywords
- hover intelligence for instructions, registers, directives, data directives, and size specifiers
- bundled optional theme: `FASM Workshop Dark`
- snippets for Windows (PE32/PE64), Linux (ELF32/ELF64), macOS (Mach-O64), and object file templates
- language configuration for comments, brackets, and folding
- `FASM: Build`
- `FASM: Build and Run`

## Current Behavior

- build commands are intended for standalone source files, not include files
- build-and-run only auto-runs when the extension can infer a runnable output for the current platform
- compiler output is written to the `FASM` output channel
- compiler path and limits are configurable in settings
- output format detection covers PE, PE64, ELF, ELF64, MZ, Mach-O, COFF, MS COFF, MS64 COFF, and binary

## Configuration

```json
{
  "fasm.compilerPath": "C:\\fasmw17335\\fasm.exe",
  "fasm.memoryLimit": 65536,
  "fasm.passesLimit": 100,
  "fasm.generateSymbols": false
}
```

On Linux and macOS, the compiler path defaults to `fasm` (looked up from PATH).

## Platform Support

- **Windows**: Full support. Default compiler path, PE build/run, Win32/Win64 snippets.
- **Linux**: Build and run support for ELF executables. Snippets for ELF32, ELF64, and ELF object files.
- **macOS**: Build target detection for Mach-O format. Snippet template provided (requires fasmg or fasm2 include packages for Mach-O output).

## Examples

The repository includes example programs in `examples/`:

- `hello_win32.asm`
- `calculator.asm`
- `snake.asm`

## Theme

The extension includes an optional dark theme tuned for assembly-heavy editing:

- restrained dark background
- higher contrast for mnemonics, directives, registers, labels, and numbers
- colors chosen to make data flow and control flow easier to scan in FASM source
- rich typography (bold instructions/constants, italic directives/data types)

You can enable it from the editor theme picker as `FASM Workshop Dark`.

### Customizing Styles & Fonts

If you want to add your own personal style, override fonts, or adjust the richness, you can add custom rules to your VS Code `settings.json`:

```json
{
  "editor.fontFamily": "'Fira Code', Consolas, monospace",
  "editor.fontLigatures": true,
  "editor.tokenColorCustomizations": {
    "[FASM Workshop Dark]": {
      "textMateRules": [
        {
          "scope": "keyword.mnemonic",
          "settings": {
            "foreground": "#ffaa00",
            "fontStyle": "bold underline"
          }
        }
      ]
    }
  }
}
```

## Development

```powershell
cd flat-assembler-extetion
npm install
npm run compile
```

Press `F5` in a VS Code compatible editor to launch an Extension Development Host for manual testing.

## Reference Material

This extension targets FASM 1.73 (covers versions 1.73.32 through 1.73.35).

- Official FASM Manual: [flatassembler.net/docs.php?article=manual](http://flatassembler.net/docs.php?article=manual)

## Notes

- `src/` is the editable TypeScript source
- `out/` contains generated JavaScript
- hover data references the FASM 1.73 Programmer's Manual with specific section citations

## License

MIT
