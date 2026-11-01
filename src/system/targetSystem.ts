import type { HostPlatform } from '../shared/types';
import { FORMAT_WORD } from './constants/formatPatterns';
import type { ResolvedTarget, TargetSystem } from './types';

function systemFromFormat(text: string): TargetSystem | undefined {
    const word = FORMAT_WORD.exec(text)?.[1]?.toLowerCase();
    if (word === 'pe' || word === 'pe64' || word === 'mz' || word === 'coff') {
        return 'windows';
    }
    if (word === 'elf' || word === 'elf64') {
        return 'linux';
    }
    if (word === 'macho' || word === 'macho64') {
        return 'macos';
    }
    return undefined;
}

export function systemFromPlatform(platform: HostPlatform): TargetSystem {
    if (platform === 'win32') {
        return 'windows';
    }
    return platform === 'darwin' ? 'macos' : 'linux';
}

export function resolveTargetSystem(text: string, setting: string, platform: HostPlatform): ResolvedTarget {
    const fromFile = systemFromFormat(text);
    if (fromFile) {
        return { system: fromFile, source: 'file' };
    }
    if (setting === 'windows' || setting === 'linux' || setting === 'macos') {
        return { system: setting, source: 'setting' };
    }
    return { system: systemFromPlatform(platform), source: 'this computer' };
}
