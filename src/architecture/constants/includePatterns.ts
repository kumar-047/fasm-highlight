import type { ArchitectureId } from '../types';

export const INCLUDE_LINE = /^\s*include\s+(['"])([^'"]+)\1/gim;
export const ARCHITECTURE_INCLUDES: readonly (readonly [RegExp, ArchitectureId])[] = [
    [/^8051\.inc$/i, '8051'],
    [/^(avr\.inc|m\d+\w*def\.inc)$/i, 'avr'],
    [/^(jclass|bytecode)\.inc$/i, 'jvm'],
    [/^(wasm|wasmcode)\.inc$/i, 'wasm'],
    [/^aarch64\.inc$/i, 'aarch64']
];
export const X86_G_INCLUDES = /^(fasm2|x86-2|8086|80186|80286|80386|80486|p5|p6|x64)\.inc$/i;
export const FASMG_SOURCE = /^\s*(?:end\s+(?:macro|iterate|namespace|calminstruction|struc|rawmatch)\b|calminstruction\b|iterate\b|rawmatch\b|rmatch\b|namespace\b)/im;
export const ARM_SOURCE = /^\s*(?:thumb|thumbee|code16|code32|code64|processor|coprocessor)\b/im;
export const MAX_INCLUDE_FILES = 64;
export const MAX_FILE_LENGTH = 2 * 1024 * 1024;
