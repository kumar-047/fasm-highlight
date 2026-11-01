export type MnemonicGroup =
    | 'data-movement'
    | 'arithmetic'
    | 'logical'
    | 'control-flow'
    | 'string'
    | 'flag'
    | 'conditional'
    | 'misc'
    | 'system'
    | 'fpu'
    | 'mmx'
    | 'sse'
    | 'avx'
    | 'extension';

export type SymbolKind =
    | 'instruction'
    | 'register'
    | 'directive'
    | 'preprocessor'
    | 'data'
    | 'format'
    | 'macro-helper'
    | 'operator';

export type SymbolContext =
    | 'anywhere'
    | 'statement'
    | 'format-line'
    | 'calm-block';

export interface SymbolGroup {
    readonly id: string;
    readonly label: string;
    readonly kind: SymbolKind;
    readonly scope: string;
    readonly context: SymbolContext;
    readonly words: readonly string[];
}
