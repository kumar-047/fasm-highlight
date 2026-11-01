# Change Log

All notable changes to the `fasm-highlight` extension are documented in this file.

## [Unreleased]

The same extension, upgraded. The identifier is still `kumar-047.fasm-highlight`, and your settings, commands, shortcuts and snippet prefixes all carry over.

### Added

- all 1,931 instructions in fasm 1.73.35, and the registers that were missing, such as `rip`, `eip`, `xmm16-31` and `ymm16-31`
- float, `$FF`, `10d`, `17q` and `1_000` number highlighting, `@b`, `@f` and `@r` references, and section names
- format keywords on `format`, `section`, `segment` and `data` lines
- fasmg and fasm 2 highlighting: `iterate`, `namespace`, `rawmatch`, `end` blocks, `:=` and `=:`, CALM commands inside `calminstruction`, and names in `macro`, `struc`, `namespace` and `label`
- colours for macros and structures defined in the same file, operators such as `>=` and `&`, `?`, `__file__`, AVX-512 decorators such as `{z}`, line continuations, and `1'000` numbers
- colours for 8051, AVR, JVM bytecode, WebAssembly and AArch64 instructions, detected from include lines
- colours and hover cards for other fasmg packages, read from the file's includes
- a formatter that only changes whitespace, with fasmg block support and settings for operand column, comment column, commas and blank lines
- FASM Colors, which colour FASM text only, for this workspace or all windows
- a right-click FASM menu with Format File, Check Number Value, Font Palette and Color Palette
- 8 color palettes: FASM Dark, Ember, Ocean, Forest, Mono, FASM Light, Paper and Sky
- a font palette with 12 coding fonts and preset sizes, for FASM files only
- hover cards for 44 more instructions, and basic hover cards for all other instructions and registers
- snippets ranked for the target system, and a `program` starter
- build errors in the Problems panel, with links to where a failing macro was used
- fasm 2 and fasmg support in `FASM: Build`, chosen from the compiler path
- Jest, ESLint and typecheck scripts

### Changed

- grammar word lists are now generated from one data table
- renamed the `keyword.mnemonic` scopes to `keyword.other.mnemonic`
- hover categories reduced to 7, with manual links built in one place
- reorganised the source into module folders with their own types and constants
- updated the development tools, including TypeScript 6, ESLint 10, Jest 30 and vsce 4

### Fixed

- strings now end at the end of the line, so a missing quote no longer colours the following lines
- removed words that aren't fasm 1 keywords, such as `endif`, `ifdef` and `offset`, and the rule that coloured every all-caps word
- `and`, `or`, `xor`, `not`, `shl` and `shr` are now coloured as operators inside expressions
- corrected wrong manual sections, the `macro` and `struc` hover syntax, and the `fs` and `gs` hover text
- PE platform notes now appear for plain `format PE`
- the compiler path no longer defaults to a Windows path on Linux and macOS
- output names now match fasm: `.dll`, `.sys`, `.efi`, `.o`, `.obj`, `.bin`, `.com` and `as` extensions
- no more hover cards inside comments and strings, or on local labels like `.add`
- folding now works for `virtual`, `while`, `repeat`, `data` and brace blocks, and no longer pairs `macro` with the wrong line

### Removed

- `FASM: Build and Run` and its `Ctrl+Shift+R` shortcut, because this extension is a highlighter, not a toolchain
- the `FASM Workshop Dark` theme, which took over the whole window and left other languages without syntax colours

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
