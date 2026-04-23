# AI Instructions For This Repository

This file tells an AI how to work on `D:\Projects\test2\flat-assembler-extetion`.

This is guidance for authoring and maintenance.
It is not an extension feature and must not be presented to users as product functionality.

## Project Scope

This repository is a Flat Assembler language support extension.

Current implemented areas:

- language registration
- syntax highlighting
- snippets
- language configuration
- build command
- build-and-run command

Do not describe real diagnostics or full cross-platform support as implemented unless the code actually provides them. Hover support is currently implemented via `src/language/hoverProvider.ts`.

## Main Source Roots

Read these paths first when relevant:

- `D:\Projects\test2\flat-assembler-extetion`
- `D:\Projects\test2\fasm-official-repos`

Use `flat-assembler-extetion` for implementation truth.
Use `fasm-official-repos` for local FASM syntax, examples, packaging references, and toolchain behavior research.

## Before You Edit

- If changing commands, activation, or extension wiring, read `src/extension.ts` first.
- If changing compiler behavior, read `src/fasmCompiler.ts` first.
- If changing manifest behavior, read `package.json` first.
- If changing examples, read `docs/EXAMPLE_QUALITY.md` first.
- If changing structure, read `docs/ARCHITECTURE.md` first.
- Do not manually edit `out/` files.

## Rules By Area

### Compiler

- Do not treat `.inc` files as normal build targets.
- Do not assume output is always `.exe`.
- Keep compiler invocation visible in output logs.
- Separate compile logic from run logic when possible.
- Prefer explicit output resolution over naive string replacement.

### Documentation

- Do not claim features that are not implemented.
- Mark future ideas as planned.
- Keep README, changelog, and manifest aligned.
- Fix corrupted encoding instead of copying it forward.

### Examples

- Make examples teach clearly.
- Prefer runnable, focused, well-commented samples.
- Keep imports minimal and correct.
- Avoid misleading shortcuts that teach bad FASM habits.
- Examples should show good structure, not just produce output.

### Architecture

- Prefer atomic modules with one clear responsibility.
- Split files when activation, compiler logic, diagnostics, data, and platform branching start mixing together.
- Do not create abstraction that the current project does not need yet.

## Do Not Do

- Do not invent support claims.
- Do not use `out/` as design truth.
- Do not present Windows behavior as universal behavior.
- Do not keep stale package names, artifact names, or branding text.
- Do not quietly degrade example quality.

## Change Checklist

- Read the relevant source files first.
- Check whether the change affects docs, examples, manifest, or compiler flow.
- Use local FASM references when behavior is uncertain.
- Keep the code and docs truthful.
- Verify what you can.
- State what could not be verified.
