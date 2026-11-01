# Change list for the next version

Planning list for `fasm-highlight` after v0.2.1. Ticked items are implemented on `next-version`, with `npm run check` passing, but not yet run inside an editor.

Scope of this list: fasm 1 only. fasm 2, fasmg and other architectures are in [plan.md](plan.md).

Checked on 2026-11-01 with VS Code's tokenizer (`vscode-textmate`, `vscode-oniguruma`) and `fasm.exe` 1.73.35.

## Corrections to the original request

| Item | Problem | Planned approach |
|---|---|---|
| A7/B: statement-start matching | On a scratch grammar it stopped highlighting `mov` in `start: mov eax,1`, `movsb` in `rep movsb`, `add` in `lock add`, `nop` in `times 5 nop`, `db` in `msg db 1`, `equ` in `count equ 5`, `rb` in `buf rb 10`, `if` in `end if` and `import` in `data import` | Apply it only to the ambiguous words: `and or xor not shl shr data end` |
| A4: `ip` | Not in fasm's register table, only `eip` and `rip` are | Add `eip` and `rip`, skip `ip` |
| A3: floats | The manual also allows `1E0` and `1f` | Handle `1.5e3`, `1.0`, `1E0` and `1f` |
| A5: mnemonic source | The named sets add about 135 of the 1,141 missing mnemonics | Use `SOURCE/TABLES.INC`, leaving out its 27 non-instruction words (`if end err org data else heap load align break entry extrn label stack store times while assert format public repeat display section segment virtual useavx256 useavx512`) |
| B: all-caps constant rule | That rule is what colours `PE` and `GUI` today | Add format keywords (`PE`, `GUI`, `readable`, `writeable`...) when removing it |
| C: "9 notes" | There are 10, and the "Local Reference" heading is in `hoverProvider.ts:68` | Fix all of them |
| Duplicate-name test | `and or xor not shl shr` are both instructions and operators | Allow one row to have both roles |
| PDF section test | `FASM.pdf` will be untracked, so the test would fail on a fresh clone | Commit a small list of section numbers from the PDF, and check it against the PDF when the file is present |
| Data table vs smallest change | One table is not a minimal change, and it would overwrite hand-edits to the grammar lists | Build the table first; require summaries only for common entries, not all 1,958 |

## To-do

### 1. Foundation
- [x] Create one data table as the single source for grammar and hover lists
- [x] Add a generator for the grammar lists and run it from `npm run compile`
- [x] Add `vscode-textmate` and `vscode-oniguruma` as dev dependencies
- [x] Keep tests out of the packaged extension, and outside `tsconfig`'s `src` root

### 2. Grammar (`syntaxes/fasm.tmLanguage.json`)
- [x] Fix `@b`, `@f`, `@r` with `(?<![\w@.])@[bfr]\b`
- [x] Add `$FF` hex with `\$[0-9a-fA-F]+\b`
- [x] Add floats: `1.5e3`, `1.0`, `1E0`, `1f`
- [x] Add `rip`, `eip`, `xmm16-31`, `ymm16-31`
- [x] Add the missing mnemonics from `TABLES.INC`
- [x] End strings at end of line
- [x] Stop colouring `data` inside `[data]`, and `loop` in `.loop`
- [x] Remove `size` and `length`; keep `end` and `data` as statement words
- [x] Fix `'.text'`: its section rule never applies because the string rule runs first

### 3. Classification (grammar and theme)
- [x] Put the 24 duplicated mnemonics in one group each: `movs movd movq movdqa movdqu movaps movups movapd movupd movss movsd cmpsd pushf pushfd pushfq popf popfd popfq lahf sahf pause lfence mfence clflush`
- [x] Remove `movsd`'s repeat inside its own group
- [x] Keep `while` in one group
- [x] Make word operators work, so `shl` in `1 shl 4` is an operator
- [x] Move `proc endp stdcall invoke cinvoke ccall fastcall` to macro-helper
- [x] Take `popcnt lzcnt tzcnt` out of SSE
- [x] Move `bswap` to logical (manual 2.1.5)
- [x] Move `setcc` to conditional (manual 2.1.10)
- [x] Move `common` to macro
- [x] Rename `keyword.mnemonic.*` to `keyword.other.mnemonic.*` in grammar and theme
- [x] Remove the dead `constant.character.escape.fasm` theme rule
- [x] Remove the all-caps constant rule and its theme colour

### 4. Hover (`src/data/fasmReferenceData.ts`, `src/language/hoverProvider.ts`)
- [x] Store only section numbers and build the link in one place
- [x] Correct `mov` to 2.1.1, `org` to 2.2.4, `use16 use32 use64` to 2.4
- [x] Remove the section from `proc endp invoke stdcall cinvoke`
- [x] Correct `if` from 2.3 to 2.2.2
- [x] Make citations more exact:
  - `include`: 2.3.1
  - `library import export`: 2.4.2
  - `lea`: 2.1.11
  - `call ret jmp int`: 2.1.6
  - `add sub cmp`: 2.1.3
  - `push pop`: 2.1.1
  - `syscall`: 2.1.19
- [x] Fix the `macro ... endm` hover syntax; FASM 1 uses `{ }`
- [x] Remove the 10 "local example" notes and the "Local Reference" heading
- [x] Reduce the 15 categories to 7 with a union type: Instruction, Register, Directive, Preprocessor, Data, Format, Macro helper
- [x] Add instruction hovers (only 12 of 130 entries are instructions today)

### 5. Cleanup
- [ ] Mach-O: **changed by plan.md.** Keep it for fasmg and fasm 2, and limit it to those in stage 4 (fasm 1.73.35 rejects `format MachO` with "invalid argument")
- [x] Reword the macOS mentions at `package.json:4` and `package.json:99`
- [x] Remove both old `.vsix` files. `FASM.pdf` and `fasm and where it is.txt` stay tracked, by choice
- [x] Merge `fasm.build` and `fasm.buildAndRun` in `src/extension.ts` into one helper
- [x] Update `LICENSE` from "2023 FASM Dev" to 2025 kumar-047
- [x] Add `bugs` and `homepage` to `package.json`
- [ ] Update `CHANGELOG.md` and the README Mach-O claims (blocked: those files have not been read yet)

### 6. Verification
- [x] `npx tsc -p . --noEmit` passes
- [x] Grammar test on a sample `.asm`, covering section 2 and the normal-code cases above
- [x] Test that every cited section exists in the manual's contents
- [x] Report the changes per file, and anything unverified

## Other known bugs, not yet in scope

- **Output names:** `buildTarget.ts` often expects the wrong output name, so Build and Run can't find the file. Real fasm output:

  | Source | fasm writes |
  |---|---|
  | `format PE` / `format MZ` | `.exe` |
  | `format PE DLL` | `.dll` |
  | `format PE native` | `.sys` |
  | `format PE EFI` | `.efi` |
  | `format binary` | `.bin` |
  | `format binary as 'com'` | `.com` |
  | `format COFF` / `format MS COFF` | `.obj` |
  | `format ELF` / `format ELF64` | `.o` |
  | `format ELF executable` / `format ELF64 executable` | no extension |

- **False hovers:** hovers appear inside comments and strings, and `.add` shows help for `add`.
- **Interactive programs:** `run()` gives the program no input and has no cancel option.
- **Errors:** they don't reach the Problems panel, and only one is reported per build.
- **Folding:** `virtual`, `while` and `repeat` don't start folds, but their `end ...` lines still end them.

## Not verified

- `README.md` and `CHANGELOG.md` have not been read, so the README's Mach-O claims are unchecked.
- Section headings came from `FASM.pdf`, and keyword locations from `FASM.TXT` in the official repo. All 2.x headings match; only the 1.1.x numbering differs, and no hover cites those.
- Links were not tested against the manual website.
