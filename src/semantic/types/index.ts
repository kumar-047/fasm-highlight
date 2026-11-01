export type SemanticType = 'keyword' | 'variable' | 'macro';

export interface SemanticToken {
    readonly line: number;
    readonly character: number;
    readonly length: number;
    readonly type: SemanticType;
}
