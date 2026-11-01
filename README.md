# FASM Highlight

Syntax highlighting and formatting for flat assembler: fasm, fasm 2 and fasmg.

This is an unofficial extension, and isn't connected to the flat assembler project.

## Getting started

1. Install **FASM Highlight** from the Extensions view.
2. Open any `.asm` or `.inc` file. Highlighting starts on its own.
3. Right-click in the file and open the **FASM** menu.

You only need a compiler if you want to use the Build command.

## Highlighting

- **fasm and fasm 2:** instructions, registers, directives, numbers, strings, labels and operators.
- **fasmg:** its own keywords, `end` blocks and CALM commands.
- **fasmg packages:** 8051, AVR, AArch64, JVM bytecode and WebAssembly. These are detected from the file's `include` lines.
- **Your own macros:** macros and structures defined in the file are coloured where you use them. In fasmg files, macros from included files are coloured too.

Colors come from your current theme, so there's nothing to set up.

## Right-click menu

Right-click in a FASM file and open **FASM**:

| Option | What it does |
|---|---|
| **Format File** | Tidies the spacing of the whole file |
| **Check Number Value** | Shows the number at your cursor in decimal, hex, binary and octal. Choose a value to copy it |
| **Font Palette** | Changes the font and size for FASM files |
| **Color Palette** | Changes the colors of FASM text |

### Format File

Formatting only changes spaces and blank lines. It never changes text inside strings, so your program assembles the same.

You can also use your editor's Format Document command. These settings are optional:

| Setting | What it does | Default |
|---|---|---|
| `fasm.format.operandColumn` | Lines up operands at a column | `0` (one space) |
| `fasm.format.commentColumn` | Lines up trailing comments at a column | `0` (keeps your spacing) |
| `fasm.format.spaceAfterComma` | Adds a space after commas | `false` |
| `fasm.format.maxBlankLines` | Limits blank lines in a row | `0` (keeps them all) |

Indent size comes from your editor's normal tab settings.

### Check Number Value

Put your cursor on a number or select one. If there's no number there, you can type one. It understands `255`, `0FFh`, `0xFF`, `$FF`, `11111111b`, `377o` and `1_000`.

### Font Palette

Choose from 12 coding fonts, pick a size, or type any font you have. This only changes FASM files.

A font has to be installed on your computer. If it isn't, your editor uses Consolas or Courier New instead.

### Color Palette

| For dark themes | For light themes |
|---|---|
| FASM Dark, Ember, Ocean, Forest, Mono | FASM Light, Paper, Sky |

The first time, choose whether the colors apply to this workspace or all windows. Choosing this workspace saves them in `.vscode/settings.json`.

Once a palette is on, the same list lets you set your own color for each kind of word, or turn the colors off.

Palettes only change FASM text. Your theme, window colors and other languages stay the same.

## Snippets

Start typing a prefix, then choose it from the suggestions. Snippets for your system are listed first.

| Prefix | Inserts |
|---|---|
| `program` | A starter program for your system |
| `win32`, `win64` | Windows console program |
| `linux`, `linux32` | Linux program |
| `macos64` | macOS program (needs fasmg) |
| `elfobj`, `coffobj` | Object file |
| `proc`, `proc64` | Procedure |
| `macro`, `struct` | Macro or structure |
| `if`, `repeat`, `loop` | Conditional block, repeat block or loop |
| `include`, `datasec` | Include line or data section |
| `msgbox32`, `msgbox64` | Windows message box |

The system comes from the file's `format` line if it has one, then the `fasm.targetSystem` setting, then your computer.

## Hover cards

Hover over an instruction, register or directive to see what it does. Many include a link to the matching section of the fasm manual.

## Build

**FASM: Build** (`Ctrl+Shift+B`) assembles the current file. Errors appear in the Problems panel, and the compiler's output appears in the FASM output channel. Include files can't be built on their own.

To use it:

1. Download a compiler from [flatassembler.net](https://flatassembler.net/download.php).
2. Set `fasm.compilerPath` to fasm, fasm 2 or fasmg. The extension works out which one it is from the file name.

If the setting is empty, it uses `C:\fasmw17335\fasm.exe` on Windows and `fasm` from your PATH elsewhere.

fasm 1 stops at its first error, so a build shows one problem at a time.

## Settings

| Setting | What it does | Default |
|---|---|---|
| `fasm.compilerPath` | Path to your compiler | Empty |
| `fasm.memoryLimit` | Memory limit in KB (fasm 1) | `65536` |
| `fasm.passesLimit` | Maximum assembly passes | `100` |
| `fasm.generateSymbols` | Writes a symbol file (fasm 1) | `false` |
| `fasm.targetSystem` | System to suggest snippets for: `auto`, `windows`, `linux` or `macos` | `auto` |
| `fasm.colors.palette` | The color palette | `auto` |

## Updating from 0.2.1

Your settings, snippets, `FASM: Build` and `Ctrl+Shift+B` all carry over. Two things were removed:

- **FASM: Build and Run** and `Ctrl+Shift+R`. Run your program the way you normally would.
- **The FASM Workshop Dark theme.** It changed your whole editor, so your editor now uses a different theme. To get similar colors for FASM files only, use **FASM > Color Palette**.

## Known limits

- It's been tested on Windows. Linux and macOS haven't been tested yet.
- In fasmg files, a `macro` block without braces can't be folded yet, though formatting handles it.
- Files for other architectures still use x86 highlighting underneath, so a word that is also an x86 instruction can get its x86 color first.
- Hover cards for other architectures name the instruction but don't describe it.

## Problems and requests

Please report them on the [issues page](https://github.com/kumar-047/fasm-highlight/issues).

Version history is in the [changelog](CHANGELOG.md).

## Development

```bash
npm install
npm run compile
npm run check
```

To publish, copy `.env.example` to `.env`, add your Open VSX token, and run `npm run publish:openvsx`. Git ignores `.env`.

Press `F5` in your editor to try the extension in a test window. Grammar word lists live in `src/grammar`, and `npm run compile` regenerates `syntaxes/fasm.tmLanguage.json`.

## License

MIT
