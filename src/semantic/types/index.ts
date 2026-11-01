export type SemanticType = 'keyword' | 'variable' | 'operator' | 'function';

export interface SemanticToken {
    readonly line: number;
    readonly character: number;
    readonly length: number;
    readonly type: SemanticType;
}
