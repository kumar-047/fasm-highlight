import type { HostPlatform } from '../../shared/types';
import type { FasmError } from './fasmError';

export type CompilerKind = 'fasm' | 'fasm2' | 'fasmg' | 'fasmarm';

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

export interface FoundCompiler {
    readonly kind: CompilerKind;
    readonly path?: string;
    readonly version?: string;
    readonly source?: 'setting' | 'found';
}

export interface DiscoveryEnvironment {
    readonly platform: HostPlatform;
    readonly pathVariable: string;
    readonly extraDirectories: readonly string[];
    readonly exists: (file: string) => boolean;
}

export interface CompileResult {
    readonly success: boolean;
    readonly errors: readonly FasmError[];
}
