import type { ManualSection } from '../../manual/constants/sections';

export type HoverCategory =
    | 'Instruction'
    | 'Register'
    | 'Directive'
    | 'Preprocessor'
    | 'Data'
    | 'Format'
    | 'Macro helper';

export interface HoverEntry {
    readonly symbol: string;
    readonly category: HoverCategory;
    readonly summary: string;
    readonly syntax?: string;
    readonly notes?: readonly string[];
    readonly example?: string;
    readonly section?: ManualSection;
    readonly platformNotes?: Partial<Record<PlatformContext, readonly string[]>>;
}

export type PlatformContext = 'generic' | 'pe' | 'elf32' | 'elf64' | 'mz';
