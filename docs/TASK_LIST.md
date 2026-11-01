# Task list

`fasm-highlight` is a highlighter for fasm, fasm 2 and fasmg, with a formatter, colours and a small number converter. Nothing more. Nothing is published until the release checks are done.

Details and history are in [plan.md](plan.md) and [CHANGE_LIST.md](CHANGE_LIST.md).

## Done

- [x] Highlighting for fasm, with all 1,931 instructions
- [x] Colours for fasmg keywords and packages: 8051, AVR, JVM, WebAssembly, AArch64 and others read from includes
- [x] Formatter that only changes whitespace
- [x] FASM Colors, replacing the old theme
- [x] Small panel: Format, Colors, number converter, one compiler path
- [x] `FASM: Build` with one compiler path, and errors in the Problems panel
- [x] Hover cards, snippets ranked by system, and the `program` starter
- [x] Same identity as the published 0.2.1, with the upgrade explained

## Removed on purpose

Run and Stop, compiler detection and install, the compiler list, FASMARM, project links and issue buttons, the full control panel, and fonts in the panel.

## Next: highlighting and formatting

- [ ] Proper fasmg and fasm 2 highlighting, using their manuals
- [ ] Improve the formatter from real use
- [ ] Improve FASM Colors from real use

## Before publishing

- [ ] Test in VS Code and Antigravity, including a real update from 0.2.1
- [ ] Test on Linux and macOS
- [ ] Run tests on every push with GitHub Actions
- [ ] Open VSX access token (the namespace and listing already exist)
- [ ] Publish to Open VSX
