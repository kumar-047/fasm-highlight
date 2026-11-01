# Next version plan

Product plan for `fasm-highlight` after v0.2.1. **Nothing here is implemented yet.** Fixes for existing bugs are in [CHANGE_LIST.md](CHANGE_LIST.md); this file covers the new direction.

Checked on 2026-11-01 against the extension code, the official repos, flatassembler.net and an installed VS Code build.

## Goals

1. Use clear, honest names.
2. Colour FASM files without taking over the rest of the editor.
3. Detect the operating system and suggest the right snippets and compiler automatically.
4. Support fasm 1, fasm 2 and fasmg.
5. Support every architecture FASM can assemble for (section 5).
6. Add one side panel with three tabs, opened by a gear icon on the current FASM file.

## Publishing and editors

The extension is published on **Open VSX**, for Antigravity and other VS Code-compatible editors, not only VS Code.

- [x] Add a `publish:openvsx` script and the `homepage`, `bugs`, license and repository fields it relies on.
- [ ] Use only the standard extension API, and test any newer feature in Antigravity as well as VS Code, because these editors may be on older VS Code versions.
- [ ] Have a fallback for anything newer. `secondarySidebar` is the first case: the panel must still work from the activity bar.
- [ ] Don't rely on anything exclusive to the Microsoft Marketplace, including its sponsor field, until it's confirmed on Open VSX.

## Findings from the fasmg manual

Checked against the [fasmg manual](https://flatassembler.net/docs.php?article=fasmg_manual) and real fasmg `g.l8vn` output. fasm 2 runs on fasmg and has no manual of its own, so it follows these rules too.

- **Blocks:** `end macro`, `end if`, `end match`, `end rawmatch`, `end struc`, `end namespace`, `end repeat`, `end while`, `end iterate`, `end irpv`, `end postpone`, `end virtual` and `end calminstruction`. Folding needs these pairs.
- **Case:** names are case-sensitive unless marked, as in `name?`.
- **CALM:** commands such as `arrange`, `jyes` and `jno` should only be coloured inside `calminstruction` blocks.
- **Position:** instructions are recognised as the first word, or the second word after a label, which could replace colouring by word list for fasmg.
- **Line continuation:** a line ending in `\` continues, so the next line's first word isn't always a new statement.
- **Include scan:** must handle `macro name?`, `name!`, `name:`, and the catch-all `?` and `??` macros.
- **Output:** with no format extension, `ok.asm` builds to `ok`.
- **Hover links:** fasmg sections are numbered 0 to 17 and need their own list. Whether links can jump to a section is unchecked.
- **Errors:** one `file [line]:` block per level of the macro stack, then `Processed:` and `Error:` lines. `-e5` reports several errors in one run. The current parser would read `macro x [1]` as a file location, so fasmg needs its own.
- **Still to read:** sections 16 and 17 of the manual, before CALM support.

## What this changes in CHANGE_LIST.md

- **Scope:** "FASM 1 only" no longer applies.
- **Mach-O:** don't remove it. It stays invalid for fasm 1, but it's supported through `format/macho.inc` in fasm 2, so it must depend on the assembler.
- **macOS snippet:** keep it, available only for fasmg and fasm 2.
- **Data table:** add a column for which assemblers each row applies to.
- **Theme items:** the scope rename still applies; the theme file itself is replaced (section 2).

## 1. Naming

| Now | Problem | Planned |
|---|---|---|
| "hover intelligence" (`package.json:4`) | It's a simple hover card | "hover cards" |
| Description | Lists macOS without saying which assembler works there | "Syntax highlighting, hover cards, snippets and build commands for fasm, fasm 2 and fasmg. Unofficial." |
| `FASM: Build` with category `FASM` | The manifest gives it the prefix twice | Title `Build`, category `FASM` |
| "FASM Workshop Dark" | Means nothing, and isn't really a theme | "FASM Colors" |
| `src/fasmCompiler.ts` | Sits outside the `compiler/` folder | `src/compiler/` |
| "FASMG", "FASM2" | Official name is intentionally lowercase | Always "fasmg" and "fasm 2" |

Keep the extension ID `kumar-047.fasm-highlight`, because changing it would create a new Marketplace listing and lose existing installs. The display name can change (decision 1). Existing setting keys stay so users don't lose their settings.

## 2. Colours that don't take over

**Why it happens today:**
- `themes/fasm-workshop-dark-color-theme.json` is a full VS Code colour theme, and only one colour theme can be active at a time.
- It sets 23 interface and editor colours, including the activity bar, side bar, status bar and title bar.
- All 13 of its token rules only match `.fasm` scopes, so other languages get almost no syntax colours while it's on.

**Plan:**
- [ ] Stop shipping it as a colour theme and remove the `Themes` category.
- [ ] Use standard TextMate scope names, so the user's own theme colours FASM correctly with no setup.
- [ ] Add an optional "FASM Colors" switch that writes `editor.tokenColorCustomizations.textMateRules`, using only `.fasm` scopes.
- [ ] Default that switch to **this workspace** (`.vscode/settings.json`), with "all windows" as a choice.
- [ ] Keep the user's other rules, and remove only ours when the switch is turned off.

**Limits in VS Code:**
- Colour customizations can't be limited by language, but `.fasm` scopes have the same effect for text colours.
- Editor background and interface colours can't be limited to FASM files. Background stays out of this feature, or becomes a separate opt-in setting for the whole workspace.
- With no folder open there's no workspace to write to, so "all windows" is the only choice. `.fasm` rules stay harmless to other languages.

## 3. Automatic system detection

Detection order: a `format` line in the file, then the user's setting, then the current system.

The file comes first because someone on Windows may be writing a Linux program on purpose.

- [ ] Read the system from `process.platform` and `process.arch`, which also gives the right answer over Remote SSH and WSL.
- [ ] Replace static-only snippets with a completion provider that ranks templates for the current system and assembler first, without hiding the rest.
- [ ] Add one `program` prefix that inserts the right starter template.
- [ ] Choose the default compiler path by system, fixing the current Windows-path bug on Linux and macOS.

Official packages:

| Package | Latest | Runs on | Notes |
|---|---|---|---|
| fasm 1 for Windows | 1.73.35 | Windows | Console and editor versions, Windows includes |
| fasm 1 for Linux | 1.73.35 | Linux x86, x64 | |
| fasm 1 for DOS | 1.73.35 | DOS-compatible systems | |
| fasm 1 for Unix/libc | 1.73.35 | ELF systems with a C library, such as OpenBSD | Object file you link yourself |
| fasm 2 | 31 Oct 2026, no version number | Windows, 64-bit Linux | Runs on fasmg with its own includes |
| fasmg | `l8vn`, 31 Oct 2026 | Windows, Linux, macOS | One package with examples |

The fasm site says every fasm 1 package produces the same output, so any of them can build programs for any system. **Build must therefore follow the file, not the PC. Run is only offered when the output can run on this PC.**

On macOS the panel should say plainly that fasm 1 and fasm 2 have no package, and point to fasmg. Binaries on Apple Silicon are x86 and need testing.

## 4. Support for fasm 1, fasm 2 and fasmg

| | fasm 1 | fasm 2 | fasmg |
|---|---|---|---|
| Macros | `macro x { }` | `macro x ... end macro` | `macro x ... end macro` |
| x86 instructions | Built in | From `fasm2.inc` | Only from included packages |
| Other targets | No | No | AArch64, WebAssembly and others through packages |
| Command | `fasm src [out] -m -p -d -s` | `fasm2`, a script around fasmg | `fasmg src [out] -e -p -r -v -i -n` |
| Docs | Manual on the site | Repo only, nothing on the docs page | Overview and manual on the site |

**Plan:**
- [ ] Use two language IDs: `fasm` for fasm 1, and `fasmg` for fasm 2 and fasmg. A single grammar can't tell them apart per file, and they conflict on `macro`.
- [ ] Add detection per file: `end macro`, `calminstruction`, `iterate` or fasmg includes mean `fasmg`; `macro x {` means `fasm`.
- [ ] Show the detected assembler in the status bar, with a click to change it and remember the choice per workspace.
- [ ] Write separate fasmg and fasm 2 grammars, hover data and snippets, using the fasmg manual and `include/iset` from fasm 2.
- [ ] Highlight fasmg x86 mnemonics only when x86 includes are present, since a fasmg file may target something else entirely.
- [ ] Give each assembler its own build arguments. `-m` and `-s` are fasm 1 only.
- [ ] Set `INCLUDE` correctly for each assembler.
- [ ] Add error parsing for each assembler, after checking real fasmg error output.

Telling fasm 2 from fasmg by content won't always work, so a file with no clear signs follows the workspace setting.

## 5. All architectures

**What "all" can mean:** fasm 1 and fasm 2 only assemble x86, but fasmg has no fixed instruction set, so anyone can write a package for a new architecture. The list can never be complete, so the extension has to handle packages it has never seen.

| Support level | Architectures | Where it comes from |
|---|---|---|
| **A. Full support** | x86 16-bit and 32-bit, x86-64 | fasm 1, fasm 2, fasmg |
| **B. Official fasmg examples** | 8051, AVR, JVM bytecode, WebAssembly, AArch64 | `core/examples` and `packages` in the fasmg repo |
| **C. FASMARM** | 32-bit and 64-bit ARM up to v8 | Third-party, based on fasm 1 (v1.44, July 2023) |
| **D. Community fasmg packages** | i8080/85, MCS-48, MOS 6502, PIC 14-bit, eZ80, EBC (UEFI), MCS-8 (I8008), STM8, ARM6-M + PIO, Motorola 68000, Renesas RX v3 | Listed on the [flatassembler board](https://board.flatassembler.net/topic.php?t=19389); users install them themselves |
| **E. Anything else** | Any package that isn't listed | Learned from the file's includes |

**What each level gets:**

| Feature | A | B | C | D and E |
|---|---|---|---|---|
| Comments, strings, numbers, directives | Yes | Yes | Yes | Yes |
| Instruction colours | Built-in list | Built-in list | Built-in list | From the includes |
| Hover cards | Written summaries | Instruction lists, summaries for common ones | Names only at first | Where the macro is defined, no invented text |
| Starter snippets | Yes | Yes, based on official examples | Later | No |
| Build | Yes | Yes | Yes | Yes |
| Run | Native output only | Depends (below) | No | No |

**How it works:**
- [ ] Add a shared grammar for what all architectures have in common. A TextMate grammar can't see which architecture a file uses, so x86 words must not be coloured in fasmg files by this grammar.
- [ ] Colour fasmg instructions with **semantic tokens**, mapped to the same `keyword.other.mnemonic` scopes, and turn semantic highlighting on for the `fasmg` language.
- [ ] Detect the architecture from `include` lines: `8051.inc`, `avr.inc`, `jclass.inc`, `wasm.inc`, `iset/aarch64.inc`, `x86-2.inc`, `fasm2.inc` and the x86 `cpu/*.inc` files.
- [ ] For unknown packages, follow the file's includes and collect names from `macro`, `calminstruction`, `struc` and `iterate`.
- [ ] Limit that scan to the workspace and `INCLUDE` paths, never run any of it, and cache it per file.
- [ ] Show the architecture in the status bar and the Control Panel, with a manual override.
- [ ] Add `fasmarm` as a third language ID and compiler type, so x86 colours don't apply to ARM code. The grammar needs FASMARM's own documentation first.

**Build and Run by architecture:**

| Architecture | Typical output | Run button |
|---|---|---|
| x86, x86-64, AArch64 | `.exe`, ELF and others | Only if it matches this PC |
| 8051, AVR | Intel HEX (`.hex`), and the official scripts pass the output name | No, it needs a device or simulator |
| JVM bytecode | `.class` | Later, through `java` if installed |
| WebAssembly | WebAssembly module | No, it needs a host |
| Other packages | Unknown | No |

**Prototype result:** a small script tested the include scan on 7 official examples, covering 8051, AVR, JVM, WebAssembly, AArch64 and x86. It recognised the instruction words at the start of lines in the examples, and the words it missed were data labels, except:
- `.org` in the AVR example, which needs a rule for directives starting with a dot.
- `i32.add` and `i32.mul` in the WebAssembly example, because the script dropped dotted prefixes.

It found about 500 names for x86, far short of the 1,958 fasm 1 instructions, so x86 keeps a built-in list. These are small samples, so this shows the idea works and doesn't prove it works everywhere.

## 6. Side panel

**Opening it:** a gear button at the top right of the editor, shown only for FASM files (`editor/title`, group `navigation`).

**Position:**
- [ ] Register a webview view in the activity bar on the left and the secondary sidebar on the right, with a setting to choose.
- [ ] Find the lowest VS Code version that supports `secondarySidebar`, then raise `engines.vscode` from `^1.75.0`. The installed build supports it, but the public docs don't list it yet.
- [ ] Users can always drag the view elsewhere.

**Build rules:** VS Code theme colours in the panel, a strict content security policy, no remote scripts, and no telemetry.

### Tab 1: Control Panel

**FASM management**
- [ ] List detected fasm 1, fasm 2 and fasmg installs, with path and version
- [ ] Choose the active assembler and architecture for this workspace
- [ ] Browse to a compiler manually
- [ ] Open the official download page
- [ ] Later: download and install on request (see risks)

**FASM editor tools**
- [ ] Build, Build and Run, Stop
- [ ] Show the detected output format and output file
- [ ] Errors in the Problems panel
- [ ] Insert a starter template
- [ ] Format the current file
- [ ] Hex, decimal and binary converter
- [ ] Open the output folder

### Tab 2: Settings

- [ ] **Formatting:** indent size, instruction and operand alignment, comment column. This needs a new formatter, because none exists today.
- [ ] **Fonts:** family, size, ligatures, using `[fasm]` and `[fasmg]` language settings so other languages aren't touched.
- [ ] **Colours:** the FASM Colors switch and a colour for each token group.
- [ ] **System:** system override, default assembler, compiler paths, memory and pass limits.
- [ ] Every setting shows whether it applies to this workspace or all windows, with a reset button.

The panel only edits normal VS Code settings, so everything also works from `settings.json`.

### Tab 3: Project and Support

- [ ] **Official FASM:** flatassembler.net, docs, downloads, and the [fasm](https://github.com/tgrysztar/fasm), [fasm2](https://github.com/tgrysztar/fasm2) and [fasmg](https://github.com/tgrysztar/fasmg) repos
- [ ] **Issues and requests:** opens a GitHub issue pre-filled with extension version, OS and assembler, which the user reviews before sending
- [ ] **Donate:** a link and the Marketplace sponsor field (decision 3), kept clearly separate from donating to fasm's author, Tomasz Grysztar, who has a donation link on the official download page
- [ ] **About:** version, changelog, license, and a clear note that this is an unofficial project

## Work order

Decided: one complete release, with nothing published until all the work is done. The order is cleanup first, then the side panel, then everything else. [TASK_LIST.md](TASK_LIST.md) has the stages and is the list to follow.

## Risks

- **Compiler downloads:** the official download page publishes no checksums, and fasm 2 and fasmg have no normal version numbers. Install must always ask first, show the source, and never update automatically. The extension won't bundle compilers.
- **`.asm` conflicts:** other assembly extensions also claim `.asm`, and auto-switching must not override a language the user picked.
- **Writing `.vscode/settings.json`:** this appears in the user's git changes, so it only happens when they turn the switch on.
- **Testing:** this PC can test Windows only. Linux needs WSL or CI, and macOS needs a real Mac or CI, including Apple Silicon.
- **Workload:** fasmg support is the largest item, because it's close to a second language.
- **Include scan:** macro names can also be helpers rather than instructions, and packages can generate names in ways a simple scan misses. Colours for levels D and E will be good, not perfect.
- **Third-party packages:** I found no license text for FASMARM, and the community packages have different authors. The extension links to them and doesn't bundle them unless their licenses allow it.
- **Hardware:** 8051, AVR and the rarer architectures can only be checked by assembling, not by running on a device.

## Decisions needed

1. **Display name:** recommended **FASM Tools**, since the extension now does far more than highlight.
2. **Colour theme:** recommended removing it completely rather than keeping it as an extra.
3. **Donate link:** which service and URL? This can only come from you.
4. **Panel default side:** recommended **right**, so it sits beside the code.
5. **Compiler install:** recommended detect-and-link first, with download in stage 6.
6. **Release:** decided: one complete release, in the order in TASK_LIST.md.
7. **Architecture support:** recommended the levels in section 5, rather than hand-written support for every community package.
8. **FASMARM:** recommended including it, after level B, since it's a separate third-party tool last updated in 2023.

## Checked and not checked

**Checked**
- Theme contents, manifest and code in this repo
- fasm, fasm 2 and fasmg repos, including their usage text, scripts and binary types
- flatassembler.net docs and download pages
- VS Code contribution docs
- `secondarySidebar` in the code of an installed VS Code 1.127 build
- Architecture folders in the fasmg repo, and the include scan on 7 official examples
- The FASMARM page and the board's list of community packages (from those pages, not the packages themselves)

**Not tested yet**
- The panel, secondary sidebar registration and workspace-level token colours in a running extension
- The double `FASM:` prefix on screen (seen in the manifest only)
- The Marketplace sponsor field, which I didn't check in the docs
- Anything on Linux or macOS, and anything in Antigravity
- Semantic tokens for instructions in a running extension
- Assembling the 8051, AVR, JVM, WebAssembly and AArch64 examples
- FASMARM's syntax, command name and license, and the community packages themselves
- `README.md` and `CHANGELOG.md`, which still haven't been read
