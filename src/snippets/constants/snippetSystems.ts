import type { TargetSystem } from '../../system/types';

export const SNIPPET_SYSTEMS: Readonly<Record<string, TargetSystem>> = {
    win32: 'windows',
    win64: 'windows',
    msgbox32: 'windows',
    msgbox64: 'windows',
    coffobj: 'windows',
    linux: 'linux',
    linux32: 'linux',
    elfobj: 'linux',
    macos64: 'macos'
};

export const STARTER_PREFIX: Readonly<Record<TargetSystem, string>> = {
    windows: 'win64',
    linux: 'linux',
    macos: 'macos64'
};
