export interface SourceLocation {
    readonly file: string;
    readonly line: number;
}

export interface FasmError extends SourceLocation {
    readonly message: string;
    readonly usedFrom: readonly SourceLocation[];
}
