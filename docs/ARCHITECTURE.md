# Architecture Notes

This file describes the current architecture first and the intended direction second.

## Current Structure

The current project is still small.

Main files:

- `package.json`
- `src/extension.ts`
- `src/fasmCompiler.ts`
- `src/compiler/buildTarget.ts`
- `src/language/hoverProvider.ts`
- `src/data/fasmReferenceData.ts`
- `syntaxes/fasm.tmLanguage.json`
- `language-configuration.json`
- `snippets/fasm.json`

Current responsibilities:

- `package.json` declares languages, grammar, snippets, commands, keybindings, and settings
- `src/extension.ts` activates the extension and registers commands
- `src/fasmCompiler.ts` handles compiler execution and run behavior
- grammar, snippets, and language configuration are static assets
- `out/` contains generated JavaScript output

## Current Risks

- `src/extension.ts` currently owns editor command flow and some build assumptions
- `src/fasmCompiler.ts` currently mixes compiler configuration, process spawning, output handling, and error parsing
- build logic is still Windows-biased
- run behavior assumes more than the code has really verified

## Target Direction

As the extension grows, prefer this responsibility split:

- `src/extension/`
  - activation
  - command registration
  - provider registration
- `src/compiler/`
  - compiler resolution
  - argument construction
  - compile orchestration
  - run orchestration
  - output resolution
- `src/diagnostics/`
  - compiler output parsing
  - diagnostics collection
- `src/language/`
  - hover provider
  - future language intelligence helpers
- `src/config/`
  - settings access
  - defaults
  - validation
- `src/shared/`
  - types
  - constants
  - small utilities

## Structural Guidance

- Split files when unrelated responsibilities accumulate
- Keep data and behavior separate when that improves maintainability
- Keep source-of-truth data in dedicated files rather than scattering strings across modules
- Avoid premature abstraction, but do not let mixed files keep growing without boundaries
