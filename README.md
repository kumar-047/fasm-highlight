# FASM Highlight

FASM Highlight is an unofficial flat assembler extension for VS Code compatible editors and Antigravity IDE.

## Upgrading from an Earlier Version

**This is the same FASM Highlight, upgraded.** The identifier is still `kumar-047.fasm-highlight`, so it updates like any other version and there's nothing new to install.

- **Stays the same:** your settings, `FASM: Build`, the `Ctrl+Shift+B` shortcut, and every snippet prefix.
- **New:** a small panel with formatting, colours and a number converter, build errors in the Problems panel, many more instructions, and colours for more architectures.
- **Removed:** `FASM: Build and Run` and its `Ctrl+Shift+R` shortcut. Run your program however you prefer.
- **Changed:** the `FASM Workshop Dark` theme is gone, because it took over the whole window. Your editor returns to a default theme, and you can pick any theme you like. `FASM: Turn On FASM Colors` gives FASM files similar colours without changing anything else.

## Features

FASM Highlight is a highlighter first. It doesn't try to be a full toolchain.

- Syntax highlighting for fasm, fasm 2 and fasmg, including fasmg packages such as AVR, 8051, AArch64, JVM bytecode and WebAssembly
- A formatter that only changes whitespace
- Optional FASM Colors, which colour FASM text only and leave your theme alone
- Hover cards for instructions, registers and directives
- Snippets for Windows, Linux and macOS, with the ones for your target system first, and a `program` starter
- A small panel, opened from the FASM button at the top of FASM files, with Format and Colors tabs, a number converter and your compiler path
- `FASM: Build`, using one compiler path, with errors in the Problems panel

## Current Behavior

- build works on standalone source files, not include files
- compiler output is written to the `FASM` output channel
- flat assembler 1 stops at its first error, so a build shows one problem at a time
- the target system for snippets comes from the `format` line, then the `fasm.targetSystem` setting, then your computer

## Requirements

`FASM: Build` needs a flat assembler compiler. Highlighting and formatting do not. Get fasm, fasm 2 or fasmg from [flatassembler.net](https://flatassembler.net/download.php), then set its path in the FASM panel or in the `fasm.compilerPath` setting.

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
