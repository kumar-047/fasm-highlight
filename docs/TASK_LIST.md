# Task list

The working order for the next version of `fasm-highlight`, set by the project owner: stages 1, 2, 5, 6, then 3. Stage 4 was dropped to keep things simple, except what stage 5 needs. Nothing is published until the release checks are done.

Details and reasons are in [plan.md](plan.md). Finished cleanup work is in [CHANGE_LIST.md](CHANGE_LIST.md).

## Stage 1: Cleanup and fixes

- [x] FASM-only colours, so the theme stops taking over the window
- [x] Remove the old theme
- [x] Output names: `.dll`, `.sys`, `.efi`, `.o`, `.obj`, `.bin`, `.com` and `as`
- [x] Remove false hovers in comments and strings, and on labels like `.add`
- [x] Show build errors in the Problems panel. fasm 1 stops at its first error, so it shows one; the parser already handles several for fasmg
- [x] Let running programs take input, and add a Stop option
- [x] Fix folding for `virtual`, `while`, `repeat`, `data` and brace blocks
- [x] Try all of the above in real VS Code (automated, 35 of 35 checks)
- [ ] Try all of the above in Antigravity

## Stage 2: Side panel

- [x] Gear icon on FASM files
- [x] One panel on the left or right, with a working fallback if an editor has no right-side sidebar
- [x] Three-tab layout

**Control Panel tab**
- [x] Compiler management: find fasm, fasm 2, fasmg and FASMARM, show path and version, choose one, browse to one
- [x] Editor tools: Build, Build and Run, Stop, output format and file

**Settings tab**
- [x] Fonts
- [x] Colours, using the FASM-only colours from stage 1
- [x] System and compiler settings
- [x] Formatting section, showing only what works until the formatter exists (stage 6)

**Project and Support tab**
- [x] Official fasm links and repos
- [x] Issues and requests
- [x] Donate to fasm's author
- [ ] Donate to this extension (needs the link from the project owner)
- [x] Version, changelog, license, and a note that this is unofficial

The panel grows as later stages add features. Each later stage includes adding its controls here.

## Stage 5: All architectures

- [x] Official: 8051, AVR, JVM, WebAssembly, AArch64
- [x] Read instructions from includes for community and unknown packages
- [x] Add FASMARM: detection, building and a partial instruction list. Its docs state no license, so it is linked and not bundled
- [x] Set the right Build and Run behaviour for each architecture
- [x] Show and override the architecture in the Control Panel tab

## Stage 6: Extra tools

- [x] Formatter, and its full section in the Settings tab
- Removed: compiler install. The Downloads link in the Project tab replaces it.
- [x] Number converter and other editor tools

## Stage 3: Automatic system detection

- [x] Detect Windows, Linux or macOS, while letting the file's `format` line take priority
- [x] Rank snippets for the current system
- [x] Add a `program` starter snippet
- [x] Add a system override to the Settings tab

## Dropped: Stage 4 (fasm 2 and fasmg)

Stage 5 needs fasmg, so only this part was kept:

- [x] Find, choose and build with fasm 2 and fasmg
- [x] Read fasmg errors, output names and `INCLUDE` paths
- [x] Colour fasmg directives and CALM commands, and detect fasmg syntax

Not done, on purpose: a separate fasmg language mode and grammar, a fasm 2 instruction list, hover cards and snippets for fasm 2 and fasmg, and a full read of all manuals.

## Stage 7: Before publishing

- [ ] Test in VS Code and Antigravity
- [ ] Test on Linux and macOS
- [ ] Run tests on every push with GitHub Actions
- [ ] Rewrite the README, finish the changelog and set the version number
- [ ] Set up the Open VSX account, namespace and access token
- [ ] Publish to Open VSX
