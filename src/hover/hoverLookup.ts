import { findSymbolGroup } from '../grammar/symbols';
import { HOVER_ENTRIES } from './constants/hoverEntries';
import type { HoverEntry } from './types';

export const hoverEntries = new Map(HOVER_ENTRIES.map((entry) => [entry.symbol.toLowerCase(), entry]));

function conditionalFamilyEntry(symbol: string): HoverEntry | undefined {
    if (/^cmov/.test(symbol)) {
        return { symbol, category: 'Instruction', section: '2.1.10', summary: 'Moves the source to the destination when the condition in its name is true.', syntax: `${symbol} destination, source` };
    }
    if (/^set/.test(symbol)) {
        return { symbol, category: 'Instruction', section: '2.1.10', summary: 'Sets a byte to one when the condition in its name is true, and to zero otherwise.', syntax: `${symbol} destination` };
    }
    if (/^j/.test(symbol)) {
        return { symbol, category: 'Instruction', section: '2.1.6', summary: 'Jumps when the condition in its name is true.', syntax: `${symbol} target` };
    }
    return undefined;
}

export function findHoverEntry(token: string): HoverEntry | undefined {
    const symbol = token.toLowerCase();
    const entry = hoverEntries.get(symbol);
    if (entry) {
        return entry;
    }

    const group = findSymbolGroup(symbol);
    if (group?.kind === 'instruction') {
        const isConditional = group.id === 'mnemonic.conditional' || group.id === 'mnemonic.control-flow';
        return (isConditional ? conditionalFamilyEntry(symbol) : undefined)
            ?? { symbol, category: 'Instruction', summary: `x86 ${group.label} instruction.` };
    }
    if (group?.kind === 'register') {
        return { symbol, category: 'Register', summary: `${group.label} register.` };
    }
    return undefined;
}
