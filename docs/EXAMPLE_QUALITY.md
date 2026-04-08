# Example Quality Guide

This file defines the standard for assembly examples in this repository.

Examples are part of the user learning experience.
They must be understandable, honest, and worth copying from.

## Core Rules

- Prefer one main teaching goal per example
- Keep examples runnable when practical
- Use names that explain intent
- Comment the why, not every line
- Keep imports minimal and correct
- Avoid weak patterns that teach bad habits

## Good Example Traits

- clear entry point
- clear section layout
- understandable data names
- API usage that matches the intended platform and format
- comments that help a learner follow the flow
- no unnecessary complexity for a basic teaching sample

## Avoid

- confusing imports
- mixed calling styles without explanation
- unused dependencies
- misleading macro usage
- incorrect or low-quality output formatting
- examples that only work by accident

## File-Specific Guidance

### `hello_win32.asm`

- keep it small
- show the minimum valid Win32 structure
- use it as the easiest first example

### `calculator.asm`

- teach arithmetic or macro usage clearly
- avoid strange library usage when a simpler demonstration is better
- prefer code that is easy to step through and verify

### `snake.asm`

- keep the richer demo, but improve readability
- use comments to explain game-state flow and drawing flow
- avoid letting the demo become harder to learn from than necessary
