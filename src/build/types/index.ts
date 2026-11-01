export interface BuildPlan {
    readonly sourcePath: string;
    readonly canBuild: boolean;
    readonly buildReason?: string;
    readonly outputPath?: string;
    readonly canRun: boolean;
    readonly runReason?: string;
}

export type OutputFormat = 'pe' | 'elf' | 'macho' | 'mz' | 'coff' | 'binary';

export interface OutputInfo {
    readonly format: OutputFormat;
    readonly extension: string;
}
