import type { FasmError } from './fasmError';

export type CompilerKind = 'fasm' | 'fasm2' | 'fasmg';

export interface CompileOptions {
    readonly memoryLimit: number;
    readonly passesLimit: number;
    readonly symbolsPath?: string;
}

export interface CompilerCommand {
    readonly command: string;
    readonly args: readonly string[];
    readonly includePaths: readonly string[];
}

export interface CompileResult {
    readonly success: boolean;
    readonly errors: readonly FasmError[];
}
