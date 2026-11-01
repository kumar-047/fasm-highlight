import { SYMBOL_GROUPS } from './constants/symbolGroups';
import type { SymbolGroup } from './types';

const symbolIndex = new Map<string, SymbolGroup>();
for (const group of SYMBOL_GROUPS) {
    if (group.context === 'format-line') {
        continue;
    }
    for (const word of group.words) {
        symbolIndex.set(word, group);
    }
}

export function findSymbolGroup(word: string): SymbolGroup | undefined {
    return symbolIndex.get(word.toLowerCase());
}

export function symbolGroupById(id: string): SymbolGroup {
    const group = SYMBOL_GROUPS.find((candidate) => candidate.id === id);
    if (!group) {
        throw new Error(`Unknown symbol group: ${id}`);
    }
    return group;
}
