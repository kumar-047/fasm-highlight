# Change Log

All notable changes to the `fasm-highlight` extension are documented in this file.

## [0.2.2] - Unreleased

### Added

- **FASM Menu** on right-click: a card at your cursor with Format File, number values, Colors and Fonts, each with Customize where it applies.
- Hover over any number to see its value in decimal, hex, binary and octal, and click to copy.
- Formatter that only changes spaces and blank lines, with settings for operand column, comment column, commas and blank lines.
- 8 color palettes that only change FASM text: FASM Dark, Ember, Ocean, Forest, Mono, FASM Light, Paper and Sky.
- Font palette with 12 coding fonts and preset sizes, for FASM files only.
- Highlighting for fasm 2 and fasmg, including `end` blocks and CALM commands.
- Highlighting for 8051, AVR, AArch64, JVM bytecode and WebAssembly, detected from `include` lines.
- Colors for macros and structures defined in the file, and for macros from included files in fasmg code.
- All 1,931 fasm 1.73.35 instructions and the missing registers, such as `rip` and `xmm16` to `xmm31`.
- More number forms, operators, section names and `@b`, `@f` and `@r` references.
- More hover cards, for every instruction and register.
- `program` snippet that inserts a starter program for your system, and snippets ranked for your system.
- Build errors in the Problems panel.
- `FASM: Build` support for fasm 2 and fasmg, chosen from `fasm.compilerPath`.

### Changed

- `fasm.compilerPath` is now empty by default, and uses `fasm` from PATH on Linux and macOS.

### Fixed

- A missing closing quote no longer colors the following lines as a string.
- `and`, `or`, `xor`, `not`, `shl` and `shr` are colored as operators inside expressions.
- All-caps words are no longer all colored as constants.
- Words that aren't fasm keywords, such as `endif` and `ifdef`, are no longer colored.
- The success message now names the right output file, such as `.dll`, `.sys`, `.efi`, `.o` and `.obj`.
- Hover cards no longer appear inside comments and strings, or on local labels like `.add`.
- Corrected wrong manual links and hover text.
- Folding now works for `virtual`, `while`, `repeat`, `data` and brace blocks.

### Removed

- `FASM: Build and Run` and `Ctrl+Shift+R`.
- The `FASM Workshop Dark` theme. Use the colors in the FASM Menu instead.

## [0.2.1] - 2026-04-24

### Changed

- updated the README

## [0.2.0] - 2026-04-23

### Fixed

- removed phantom `use80` addressing directive (does not exist in FASM)
- removed incorrect C-style backslash escape highlighting in strings (FASM uses doubled quotes, not backslash escapes)
- corrected `equ` hover description: now accurately says symbolic text substitution, not numeric constant
- corrected `format` hover syntax to include all documented formats (binary, COFF, MS COFF, MS64 COFF)
- fixed compiler error parser to handle FASM's multi-line error output format
- updated default compiler path from fasmw17332 to fasmw17335

### Added

- hover entries for 22+ missing directives: label, times, while, break, load, store, display, align, assert, err, data, define, fix, rept, irp, irps, irpv, match, postpone, purge, restore, restruc
- hover entries for missing data directives: dt, rt, du, dp, df, rp, rf, file
- hover entries for missing registers: 16-bit (ax-sp), 8-bit (al-dh, sil, dil, bpl, spl), segment (cs-ss), FPU (st0), MMX (mm0)
- hover entries for linkage directives: extrn, public
- grammar support for missing preprocessor directives: irps, irpv, postpone, restruc
- grammar support for missing control directives: while, assert, err, data
- new snippets: Linux 32-bit ELF (linux32), macOS 64-bit Mach-O (macos64), ELF object file (elfobj), MS COFF object file (coffobj)
- build target detection for COFF, MS COFF, MS64 COFF, and binary formats
- cross-platform compiler path resolution (Linux/macOS defaults to 'fasm' from PATH)
- object file output inference (.obj on Windows, .o on Linux/macOS)

### Changed

- all hover reference sources now cite specific FASM 1.73 Manual sections with flatassembler.net URLs
- build target system refactored with explicit format detection and OutputFormat type
- `.vscodeignore` now excludes dev docs, old VSIX artifacts, PDF, compiled binaries
- version bumped to 0.2.0
- description updated to mention cross-platform support and hover intelligence

## [0.1.1] - 2026-04-08

### Changed

- aligned project policy and AI-facing repo instructions
- documented architecture and example quality guidance
- improved build behavior so `.inc` files are not treated as standalone targets
- stopped forcing build output assumptions to `.exe` for every source file
- tightened README wording to match the current implementation

### Added

- hover support for FASM instructions, registers, directives, and size specifiers with platform-contextual notes
- missing registers in grammar: opmask (k0-k7), bounds (bnd0-bnd3)
- missing size specifiers: qqword, yword, dqqword, zword
- missing data directives: du, dp, df, rp, rf

### Fixed

- grammar now correctly highlights instructions, registers, and directives in any case (FASM is case-insensitive)
- constants pattern no longer shadows known FASM tokens when written in uppercase

## [0.1.0] - 2025-11-22

### Added

- initial extension release
- syntax highlighting for FASM
- build and build-and-run commands
- snippets for common patterns
- configuration for compiler path and limits
