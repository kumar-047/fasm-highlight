# FASM Highlight

Highlights your fasm code in `.asm` and `.inc` files, on Windows, Linux and macOS. It works with fasm, fasm 2 and fasmg.

## What it does

- Syntax highlighting
- Hover cards
- Simple code snippets
- Light code formatting
- Font and color styling
- Number values in decimal, hex, binary and octal

## How to use it

Install **FASM Highlight** and open any `.asm` or `.inc` file. Highlighting starts on its own.

### FASM Menu

Right-click in a FASM file and choose **FASM Menu**. A small side panel opens and stays open while you try things:

| In the panel | What to do |
|---|---|
| **Format File** | Click to tidy the spacing of the whole file |
| **Number** | Click a number in your code, or type one, to see its values. Click a value to copy it |
| **Colors** | Click a palette's circle to switch. **Customize** sets a color for each kind of word |
| **Fonts** | Pick a font or size to switch. **Customize** opens the font settings |

**Reset** goes back to your normal colors or font.

### Hover cards

Hover over an instruction, register or directive to see what it does. Hover over a number to see its values.

### Snippets

Start typing a prefix, then choose it from the suggestions:

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

### Build

**FASM: Build** (`Ctrl+Shift+B`) assembles the current file and shows errors in the Problems panel.

Get a compiler from [flatassembler.net](https://flatassembler.net/download.php), then set its path in `fasm.compilerPath`.

## Settings

| Setting | What it does | Default |
|---|---|---|
| `fasm.compilerPath` | Path to fasm, fasm 2 or fasmg | Empty |
| `fasm.panelSide` | The side the FASM panel opens on | `right` |
| `fasm.memoryLimit` | Memory limit in KB (fasm 1) | `65536` |
| `fasm.passesLimit` | Maximum assembly passes | `100` |
| `fasm.generateSymbols` | Writes a symbol file (fasm 1) | `false` |
| `fasm.targetSystem` | System to suggest snippets for: `auto`, `windows`, `linux` or `macos` | `auto` |
| `fasm.colors.palette` | The color palette | `auto` |
| `fasm.format.operandColumn` | Lines up operands at a column | `0` (one space) |
| `fasm.format.commentColumn` | Lines up trailing comments at a column | `0` (keeps your spacing) |
| `fasm.format.spaceAfterComma` | Adds a space after commas | `false` |
| `fasm.format.maxBlankLines` | Limits blank lines in a row | `0` (keeps them all) |

## Updating from 0.2.1

Your settings, snippets, `FASM: Build` and `Ctrl+Shift+B` carry over. **FASM: Build and Run** and the **FASM Workshop Dark** theme were removed. Use the colors in the **FASM Menu** instead of the theme.

## Problems and requests

Please report them on the [issues page](https://github.com/kumar-047/fasm-highlight/issues). Version history is in the [changelog](CHANGELOG.md).

## License

MIT
