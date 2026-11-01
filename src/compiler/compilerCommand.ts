import * as path from 'node:path';

import type { HostPlatform } from '../shared/types';
import type { CompileOptions, CompilerCommand, CompilerKind } from './types';

export function detectCompilerKind(compilerPath: string): CompilerKind {
    const name = compilerPath.split(/[\\/]/).pop()?.toLowerCase() ?? '';
    if (/^fasm2(\.cmd)?$/.test(name)) {
        return 'fasm2';
    }
    return /^fasmg(\.exe|\.x64)?$/.test(name) ? 'fasmg' : 'fasm';
}

export function buildCompilerCommand(
    compilerPath: string,
    sourcePath: string,
    options: CompileOptions,
    platform: HostPlatform
): CompilerCommand {
    const passes = `-p${options.passesLimit}`;

    switch (detectCompilerKind(compilerPath)) {
        case 'fasmg':
            return { command: compilerPath, args: [sourcePath, '-e100', passes], includePaths: [] };
        case 'fasm2': {
            const directory = path.dirname(compilerPath);
            return {
                command: path.join(directory, platform === 'win32' ? 'fasmg.exe' : 'fasmg.x64'),
                args: [sourcePath, '-e100', passes, "-iInclude('fasm2.inc')"],
                includePaths: [path.join(directory, 'include')]
            };
        }
        case 'fasm': {
            const args = [sourcePath, '-m', String(options.memoryLimit), '-p', String(options.passesLimit)];
            if (options.symbolsPath) {
                args.push('-s', options.symbolsPath);
            }
            return { command: compilerPath, args, includePaths: [] };
        }
    }
}
