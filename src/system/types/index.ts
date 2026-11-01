export type TargetSystem = 'windows' | 'linux' | 'macos';

export interface ResolvedTarget {
    readonly system: TargetSystem;
    readonly source: 'file' | 'setting' | 'this computer';
}
