export interface GrammarRule {
    readonly name?: string;
    readonly match?: string;
    readonly begin?: string;
    readonly end?: string;
    readonly captures?: Record<string, { readonly name: string }>;
    readonly beginCaptures?: Record<string, { readonly name: string }>;
    readonly patterns?: readonly (GrammarRule | { readonly include: string })[];
}
