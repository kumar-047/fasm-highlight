export type ArchitectureId = 'x86' | '8051' | 'avr' | 'jvm' | 'wasm' | 'aarch64' | 'other';
export type Dialect = 'fasm' | 'fasmg';

export interface Architecture {
    readonly id: ArchitectureId;
    readonly label: string;
    readonly instructions: ReadonlySet<string>;
    readonly registers: ReadonlySet<string>;
}

export interface ScannedSymbol {
    readonly name: string;
    readonly file: string;
    readonly line: number;
}

export interface SourceAnalysis {
    readonly dialect: Dialect;
    readonly architecture: Architecture;
    readonly scanned: ReadonlyMap<string, ScannedSymbol>;
    readonly combinedText: string;
}

export type ReadFile = (filePath: string) => string | undefined;
