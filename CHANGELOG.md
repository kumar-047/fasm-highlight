# Change Log

All notable changes to the `fasm-highlight` extension are documented in this file.

## [Unreleased]

### Added

- all 1,931 instructions in fasm 1.73.35, and the registers that were missing, such as `rip`, `eip`, `xmm16-31` and `ymm16-31`
- float, `$FF`, `10d`, `17q` and `1_000` number highlighting, `@b`, `@f` and `@r` references, and section names
- format keywords on `format`, `section`, `segment` and `data` lines
- hover cards for 44 more instructions, and basic hover cards for all other instructions and registers
- Jest, ESLint and typecheck scripts
- `FASM: Turn On FASM Colors` and `FASM: Turn Off FASM Colors`, which colour FASM text only, for this workspace or all windows
- build errors in the Problems panel, with links to where a failing macro was used
- `FASM: Stop Running Program`
- a side panel with a Control Panel, Settings and Project tab, opened from a gear icon on FASM files
- detection of fasm, fasm 2, fasmg and FASMARM, with build support for each
- install on request for fasm, fasm 2 and fasmg, from the official site only, always asking first
- 8051, AVR, JVM bytecode, WebAssembly, AArch64 and ARM instruction colours, detected from include lines and source
- colours and hover cards for unknown fasmg packages, read from the file's includes
- a formatter that only changes whitespace
- a number converter
- snippets ranked for the target system, a `program` starter and `FASM: Insert Starter Program`

### Changed

- grammar word lists are now generated from one data table
- renamed the `keyword.mnemonic` scopes to `keyword.other.mnemonic`
- programs now run in a terminal, so they can read input and use the Windows console API
- hover categories reduced to 7, with manual links built in one place
- split the build commands into their own module

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
