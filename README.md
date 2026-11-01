# FASM Highlight

FASM Highlight is an unofficial flat assembler extension for VS Code compatible editors and Antigravity IDE, including Open VSX.

## Current Features

- FASM language registration for `.asm` and `.inc`
- syntax highlighting for instructions, directives, registers, and preprocessor keywords
- hover cards for instructions, registers, directives, data directives, and size specifiers
- optional FASM Colors, which colour FASM text only and leave your theme alone
- a side panel with a Control Panel, Settings and Project tab, opened from the gear icon on FASM files
- automatic detection of fasm, fasm 2, fasmg and FASMARM
- a formatter that only changes whitespace
- a number converter and starter programs for the current system
- instruction colours and build support for 8051, AVR, JVM bytecode, WebAssembly, AArch64 and ARM
- colours for other fasmg packages, by reading the file's include lines
- build errors in the Problems panel
- snippets for Windows (PE32/PE64), Linux (ELF32/ELF64), macOS (Mach-O64), and object file templates, with the ones for your target system first, and a `program` starter
- language configuration for comments, brackets, and folding
- `FASM: Build`
- `FASM: Build and Run`
- `FASM: Stop Running Program`
- `FASM: Open Control Panel`
- `FASM: Insert Starter Program`
- `FASM: Turn On FASM Colors` and `FASM: Turn Off FASM Colors`

## Current Behavior

- build commands are intended for standalone source files, not include files
- build-and-run only auto-runs when the extension can infer a runnable output for the current platform
- compiler output is written to the `FASM` output channel, and errors also appear in the Problems panel
- programs run in the `FASM Run` terminal, so they can read input
- flat assembler 1 stops at its first error, so a build shows one problem at a time
- compiler path and limits are configurable in settings
- output names follow what the assemblers write, including extensions set with `as` and formats set in include files
- the target system comes from the `format` line, then the `fasm.targetSystem` setting, then your computer
- other architectures can be built but not run, because they need a device, simulator or runtime

## Requirements

To use the build commands (`FASM: Build` and `FASM: Build and Run`), the Flat Assembler (`fasm` or `fasm.exe`) must be installed. Ensure it is accessible via your system `PATH` or configure the exact path using the `fasm.compilerPath` setting.

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
- **macOS**: flat assembler 1 and 2 have no macOS package, so use fasmg. Snippet template provided.

## Current Limits

- fasm 2 and fasmg files use the fasm 1 grammar, plus extra colours for fasmg directives and other architectures
- the hover cards for other architectures name the instruction, without a description
- only a partial ARM instruction list is built in, because the FASMARM documentation has no full list

## Colors

FASM uses standard scope names, so your current theme colours FASM files with no setup.

For stronger assembly colours, run `FASM: Turn On FASM Colors` and choose this workspace or all windows. It only changes FASM text, and picks light or dark colours from your theme at that moment. Run it again after switching between light and dark themes. Background and window colours aren't changed. Choosing this workspace saves the colours in `.vscode/settings.json`.

`FASM: Turn Off FASM Colors` removes them and keeps your own rules.

### Customizing Styles & Fonts

You can add your own rules to `settings.json`:

```json
{
  "[fasm]": {
    "editor.fontFamily": "'Fira Code', Consolas, monospace",
    "editor.fontLigatures": true
  },
  "editor.tokenColorCustomizations": {
    "textMateRules": [
      {
        "scope": "keyword.other.mnemonic",
        "settings": {
          "foreground": "#ffaa00",
          "fontStyle": "bold underline"
        }
      }
    ]
  }
}
```

## Development

```powershell
cd fasm-highlight
npm install
npm run compile
```

Press `F5` in a VS Code compatible editor to launch an Extension Development Host for manual testing.

## Reference Material

This extension targets FASM 1.73 (covers versions 1.73.32 through 1.73.35).

- Official FASM Manual: [flatassembler.net/docs.php?article=manual](http://flatassembler.net/docs.php?article=manual)

## Notes

- `src/` is the editable TypeScript source
- `syntaxes/fasm.tmLanguage.json` is generated from `src/data/symbols.ts` by `npm run compile`
- `npm run check` runs the typecheck, ESLint and Jest
- hover data references the FASM 1.73 Programmer's Manual with specific section citations

## Known Issues

Please report any bugs, missing instructions, or feature requests on the repository's Issues page.

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## License

MIT
