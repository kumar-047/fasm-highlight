# Change Log

All notable changes to the `fasm-highlight` extension are documented in this file.

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
