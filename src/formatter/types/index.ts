export interface FormatOptions {
    readonly indent: string;
    readonly commentColumn: number;
    readonly operandColumn: number;
    readonly spaceAfterComma: boolean;
    readonly maxBlankLines: number;
    readonly isInstruction: (word: string) => boolean;
}
