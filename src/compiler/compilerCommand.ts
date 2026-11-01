import * as path from 'node:path';
import type { ArchitectureId, Dialect } from '../architecture/types';
import type { HostPlatform } from '../shared/types';
import type { CompileOptions, CompilerCommand, CompilerKind } from './types';

export function executableNames(kind: CompilerKind, platform: HostPlatform): string[] {
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

export function buildCompilerCommand(
    kind: CompilerKind,
    compilerPath: string,
    sourcePath: string,
    options: CompileOptions,
    platform: HostPlatform
): CompilerCommand {
    const passes = `-p${options.passesLimit}`;

    switch (kind) {
        case 'fasmg':
            return { command: compilerPath, args: [sourcePath, '-e100', passes], includePaths: [] };
        case 'fasm2': {
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
