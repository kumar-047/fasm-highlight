export interface SnippetDefinition {
    readonly prefix: string;
    readonly body: readonly string[];
    readonly description: string;
}

export interface RankedSnippet extends SnippetDefinition {
    readonly sortText: string;
}
