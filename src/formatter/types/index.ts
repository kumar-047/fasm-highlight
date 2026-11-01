export interface FormatOptions {
    readonly indent: string;
    readonly commentColumn: number;
    readonly isInstruction: (word: string) => boolean;
}
