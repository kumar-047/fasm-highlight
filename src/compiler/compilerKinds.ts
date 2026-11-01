import * as path from 'path';
import { ArchitectureId, Dialect } from '../architecture/analysis';

export type CompilerKind = 'fasm' | 'fasm2' | 'fasmg' | 'fasmarm';

export const COMPILER_KINDS: readonly CompilerKind[] = ['fasm', 'fasm2', 'fasmg', 'fasmarm'];

export const COMPILER_LABELS: Readonly<Record<CompilerKind, string>> = {
    fasm: 'flat assembler 1 (fasm)',
    fasm2: 'flat assembler 2 (fasm 2)',
    fasmg: 'flat assembler g (fasmg)',
    fasmarm: 'FASMARM (third-party)'
};

// The setting that stores each compiler's path.
export const COMPILER_SETTINGS: Readonly<Record<CompilerKind, string>> = {
    fasm: 'compilerPath',
    fasm2: 'fasm2Path',
    fasmg: 'fasmgPath',
    fasmarm: 'fasmarmPath'
};

export function executableNames(kind: CompilerKind, platform: NodeJS.Platform): string[] {
    const windows = platform === 'win32';
    switch (kind) {
        case 'fasm':
            return windows ? ['fasm.exe'] : ['fasm', 'fasm.x64'];
        case 'fasm2':
            return windows ? ['fasm2.cmd'] : ['fasm2'];
        case 'fasmg':
            return windows ? ['fasmg.exe'] : platform === 'darwin' ? ['fasmg', 'source/macos/x64/fasmg'] : ['fasmg', 'fasmg.x64'];
        case 'fasmarm':
            return windows ? ['fasmarm.exe'] : ['fasmarm', 'fasmarm.x64'];
    }
}

export function chooseCompilerKind(setting: string, dialect: Dialect, architecture: ArchitectureId): CompilerKind {
    if (setting === 'fasm' || setting === 'fasm2' || setting === 'fasmg' || setting === 'fasmarm') {
        return setting;
    }
    if (architecture === 'arm') {
        return 'fasmarm';
    }
    return dialect === 'fasmg' ? 'fasmg' : 'fasm';
}

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

export function buildCompilerCommand(
    kind: CompilerKind,
    compilerPath: string,
    sourcePath: string,
    options: CompileOptions,
    platform: NodeJS.Platform
): CompilerCommand {
    const passes = `-p${options.passesLimit}`;

    switch (kind) {
        case 'fasmg':
            return { command: compilerPath, args: [sourcePath, '-e100', passes], includePaths: [] };
        case 'fasm2': {
            // fasm 2 is a script around fasmg. Running fasmg directly avoids a shell.
            const directory = path.dirname(compilerPath);
            const fasmg = path.join(directory, platform === 'win32' ? 'fasmg.exe' : 'fasmg.x64');
            return {
                command: fasmg,
                args: [sourcePath, '-e100', passes, "-iInclude('fasm2.inc')"],
                includePaths: [path.join(directory, 'include')]
            };
        }
        case 'fasm':
        case 'fasmarm': {
            const args = [sourcePath, '-m', String(options.memoryLimit), '-p', String(options.passesLimit)];
            if (options.symbolsPath) {
                args.push('-s', options.symbolsPath);
            }
            return { command: compilerPath, args, includePaths: [] };
        }
    }
}
