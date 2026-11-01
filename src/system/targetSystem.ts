export type TargetSystem = 'windows' | 'linux' | 'macos';

export interface ResolvedTarget {
    readonly system: TargetSystem;
    readonly source: 'file' | 'setting' | 'this computer';
}

const FORMAT_WORD = /^[ \t]*format[ \t]+(?:ms64\b|ms\b)?\s*([a-z0-9]+)/im;

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

export function systemFromPlatform(platform: NodeJS.Platform): TargetSystem {
    if (platform === 'win32') {
        return 'windows';
    }
    return platform === 'darwin' ? 'macos' : 'linux';
}

// The file wins, because someone on Windows may be writing a Linux program on purpose.
export function resolveTargetSystem(text: string, setting: string, platform: NodeJS.Platform): ResolvedTarget {
    const fromFile = systemFromFormat(text);
    if (fromFile) {
        return { system: fromFile, source: 'file' };
    }
    if (setting === 'windows' || setting === 'linux' || setting === 'macos') {
        return { system: setting, source: 'setting' };
    }
    return { system: systemFromPlatform(platform), source: 'this computer' };
}
