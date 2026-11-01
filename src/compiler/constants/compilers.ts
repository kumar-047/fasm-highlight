import type { CompilerKind } from '../types';

export const COMPILER_KINDS: readonly CompilerKind[] = ['fasm', 'fasm2', 'fasmg', 'fasmarm'];

export const COMPILER_LABELS: Readonly<Record<CompilerKind, string>> = {
    fasm: 'flat assembler 1 (fasm)',
    fasm2: 'flat assembler 2 (fasm 2)',
    fasmg: 'flat assembler g (fasmg)',
    fasmarm: 'FASMARM (third-party)'
};

export const COMPILER_SETTINGS: Readonly<Record<CompilerKind, string>> = {
    fasm: 'compilerPath',
    fasm2: 'fasm2Path',
    fasmg: 'fasmgPath',
    fasmarm: 'fasmarmPath'
};
