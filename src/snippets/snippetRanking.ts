import type { TargetSystem } from '../system/types';
import { SNIPPET_SYSTEMS, STARTER_PREFIX } from './constants/snippetSystems';
import type { RankedSnippet, SnippetDefinition } from './types';

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
