import { TargetSystem } from '../system/targetSystem';

export interface SnippetDefinition {
    readonly prefix: string;
    readonly body: readonly string[];
    readonly description: string;
}

export interface RankedSnippet extends SnippetDefinition {
    readonly sortText: string;
}

const SNIPPET_SYSTEMS: Readonly<Record<string, TargetSystem>> = {
    win32: 'windows',
    win64: 'windows',
    msgbox32: 'windows',
    msgbox64: 'windows',
    coffobj: 'windows',
    linux: 'linux',
    linux32: 'linux',
    elfobj: 'linux',
    macos64: 'macos'
};

const STARTER_PREFIX: Readonly<Record<TargetSystem, string>> = {
    windows: 'win64',
    linux: 'linux',
    macos: 'macos64'
};

// Snippets for the target system come first, then general ones. Nothing is hidden.
export function rankSnippets(snippets: readonly SnippetDefinition[], target: TargetSystem): RankedSnippet[] {
    const ranked = snippets.map((snippet): RankedSnippet => {
        const system = SNIPPET_SYSTEMS[snippet.prefix];
        const rank = system === target ? 0 : system === undefined ? 1 : 2;
        return { ...snippet, sortText: `${rank}-${snippet.prefix}` };
    });

    const starter = starterSnippet(snippets, target);
    return starter ? [{ ...starter, prefix: 'program', sortText: '0-program' }, ...ranked] : ranked;
}

export function starterSnippet(snippets: readonly SnippetDefinition[], target: TargetSystem): SnippetDefinition | undefined {
    return snippets.find((snippet) => snippet.prefix === STARTER_PREFIX[target]);
}
