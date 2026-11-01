# Task list

The working order for the next version of `fasm-highlight`. Finish each stage before starting the next. Nothing is published until every stage is done.

Details and reasons are in [plan.md](plan.md). Finished cleanup work is in [CHANGE_LIST.md](CHANGE_LIST.md).

## Stage 1: Cleanup and fixes

- [ ] FASM-only colours, so the theme stops taking over the window
- [ ] Remove the old theme
- [ ] Output names: `.dll`, `.sys`, `.efi`, `.o`, `.obj`, `.bin` (the 6 to-do tests)
- [ ] Remove false hovers in comments and strings, and on labels like `.add`
- [ ] Show build errors in the Problems panel, including more than one error per build
- [ ] Let running programs take input, and add a Stop option
- [ ] Fix folding for `virtual`, `while` and `repeat`

## Stage 2: Side panel

- [ ] Gear icon on FASM files
- [ ] One panel on the left or right, with a working fallback if an editor has no right-side sidebar
- [ ] Three-tab layout

**Control Panel tab**
- [ ] Compiler management: find fasm, fasm 2 and fasmg, show path and version, choose one, browse to one, open the download page
- [ ] Editor tools: Build, Build and Run, Stop, output format and file

**Settings tab**
- [ ] Fonts
- [ ] Colours, using the FASM-only colours from stage 1
- [ ] System and compiler settings
- [ ] Formatting section, showing only what works until the formatter exists (stage 6)

**Project and Support tab**
- [ ] Official fasm links and repos
- [ ] Issues and requests
- [ ] Donate (needs the link from the project owner)
- [ ] Version, changelog, license, and a note that this is unofficial

The panel grows as later stages add features. Each later stage includes adding its controls here.

## Stage 3: Automatic system detection

- [ ] Detect Windows, Linux or macOS, while letting the file's `format` line take priority
- [ ] Rank snippets for the current system
- [ ] Add a `program` starter snippet
- [ ] Add a system override to the Settings tab

## Stage 4: fasm 2 and fasmg

- [ ] Read all three manuals fully, including fasmg sections 16 and 17
- [ ] Add the `fasmg` language mode, with detection and a status bar switch
- [ ] Add the fasmg grammar, CALM commands and folding
- [ ] Add the fasm 2 x86 instruction list
- [ ] Add hover cards and snippets for both
- [ ] Add build arguments, `INCLUDE` paths, output names and error parsing for both
- [ ] Limit Mach-O to fasmg and fasm 2

## Stage 5: All architectures

- [ ] Official: 8051, AVR, JVM, WebAssembly, AArch64
- [ ] Read instructions from includes for community and unknown packages
- [ ] Add FASMARM, after reading its docs and checking its license
- [ ] Set the right Build and Run behaviour for each architecture
- [ ] Show and override the architecture in the Control Panel tab

## Stage 6: Extra tools

- [ ] Formatter, and its full section in the Settings tab
- [ ] Compiler install on request
- [ ] Number converter and other editor tools

## Stage 7: Before publishing

- [ ] Test in VS Code and Antigravity
- [ ] Test on Linux and macOS
- [ ] Run tests on every push with GitHub Actions
- [ ] Rewrite the README, finish the changelog and set the version number
- [ ] Set up the Open VSX account, namespace and access token
- [ ] Publish to Open VSX
