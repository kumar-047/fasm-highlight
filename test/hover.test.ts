import { findHoverEntry, hoverEntries } from '../src/hover/hoverLookup';
import { buildHoverMarkdown, detectPlatformContext, isInCommentOrString, normalizeHoverToken } from '../src/hover/hoverProvider';
import type { HoverEntry } from '../src/hover/types';
import { MANUAL_SECTIONS } from '../src/manual/constants/sections';
import { manualUrl } from '../src/manual/manual';
import type { MarkdownString } from './mocks/vscode';

const entries = [...hoverEntries.values()];

function entry(symbol: string): HoverEntry {
    const found = hoverEntries.get(symbol);
    if (!found) {
        throw new Error(`No hover entry: ${symbol}`);
    }
    return found;
}

function textOf(hover: HoverEntry): string {
    return (buildHoverMarkdown(hover, 'generic') as unknown as MarkdownString).value;
}

describe('hover data', () => {
    test('every cited section exists in the manual', () => {
        const known = new Set<string>(MANUAL_SECTIONS);
        expect(entries.filter((item) => item.section && !known.has(item.section)).map((item) => item.symbol)).toEqual([]);
    });

    test('it uses exactly the seven categories', () => {
        expect(new Set(entries.map((item) => item.category))).toEqual(
            new Set(['Instruction', 'Register', 'Directive', 'Preprocessor', 'Data', 'Format', 'Macro helper'])
        );
    });

    test('symbols are unique', () => {
        const symbols = entries.map((item) => item.symbol.toLowerCase());
        expect(symbols).toHaveLength(new Set(symbols).size);
    });

    test.each([
        ['mov', '2.1.1'], ['org', '2.2.4'], ['use16', '2.4'], ['use32', '2.4'], ['use64', '2.4'], ['if', '2.2.2'],
        ['include', '2.3.1'], ['import', '2.4.2'], ['export', '2.4.2'], ['lea', '2.1.11'], ['call', '2.1.6'],
        ['ret', '2.1.6'], ['jmp', '2.1.6'], ['int', '2.1.6'], ['add', '2.1.3'], ['sub', '2.1.3'], ['cmp', '2.1.3'],
        ['push', '2.1.1'], ['pop', '2.1.1'], ['syscall', '2.1.19']
    ])('%s cites section %s', (symbol, section) => {
        expect(entry(symbol).section).toBe(section);
    });

    test.each(['proc', 'endp', 'invoke', 'stdcall', 'cinvoke', 'library'])('%s comes from include packages, so it cites no section', (symbol) => {
        expect(entry(symbol).section).toBeUndefined();
        expect(entry(symbol).category).toBe('Macro helper');
    });

    test('no text refers to local examples', () => {
        expect(JSON.stringify(entries)).not.toMatch(/local (ELF|Linux|dynamic|reference)|in the local|referenceSource/i);
    });

    test('macros use fasm 1 brace syntax', () => {
        expect(entry('macro').syntax).toContain('{');
        expect(entry('macro').syntax).not.toContain('endm');
        expect(entry('struc').syntax).not.toContain('ends');
    });

    test('it covers common instructions', () => {
        for (const symbol of ['imul', 'xchg', 'cpuid', 'rol', 'adc', 'bsf', 'popcnt']) {
            expect(entry(symbol).category).toBe('Instruction');
        }
    });
});

describe('findHoverEntry', () => {
    test('condition families get real summaries', () => {
        expect(findHoverEntry('cmovne')?.summary).toMatch(/condition/);
        expect(findHoverEntry('cmovne')?.section).toBe('2.1.10');
        expect(findHoverEntry('setg')?.section).toBe('2.1.10');
        expect(findHoverEntry('jnz')?.section).toBe('2.1.6');
    });

    test('other instructions and registers fall back to their group', () => {
        expect(findHoverEntry('vfmadd132ps')).toMatchObject({ category: 'Instruction', summary: 'x86 AVX, AVX2, XOP and AVX-512 instruction.' });
        expect(findHoverEntry('XMM31')).toMatchObject({ category: 'Register', summary: '128-bit SIMD register.' });
    });

    test('unknown words have no hover', () => {
        expect(findHoverEntry('my_label')).toBeUndefined();
    });
});

describe('hover markdown', () => {
    test('it links to the manual section', () => {
        expect(textOf(entry('mov'))).toContain(`[Manual section 2.1.1](${manualUrl('2.1.1')})`);
    });

    test('it no longer has a Local Reference heading', () => {
        expect(textOf(entry('mov'))).not.toContain('Local Reference');
    });

    test('the manual URL has one base', () => {
        expect(manualUrl('2.2.4')).toBe('https://flatassembler.net/docs.php?article=manual#2.2.4');
    });
});

describe('tokens and platform', () => {
    test('anonymous label references have no hover', () => {
        expect(normalizeHoverToken('@@')).toBeUndefined();
        expect(normalizeHoverToken('@b')).toBeUndefined();
    });

    test('local labels have no hover, even when named like an instruction', () => {
        expect(normalizeHoverToken('.add')).toBeUndefined();
        expect(normalizeHoverToken('.loop')).toBeUndefined();
    });

    test.each([
        ['mov eax,1 ; mov this', 26, true],
        ['mov eax,1 ; mov this', 0, false],
        ["db 'add',0", 4, true],
        ["db 'add',0", 9, false],
        ['db "a;b",1', 5, true],
        ['db "a;b",1 ; c', 9, false],
        ["db 'it''s mov'", 10, true],
        ["bad db 'unterminated mov", 21, true]
    ])('%s at %i: inside is %s', (line, character, inside) => {
        expect(isInCommentOrString(line, character)).toBe(inside);
    });

    test('tokens are lowercased', () => {
        expect(normalizeHoverToken('MOV')).toBe('mov');
    });

    test.each([
        ['format PE GUI 4.0', 'pe'],
        ['format PE64 console', 'pe'],
        ['format ELF64 executable', 'elf64'],
        ['format ELF executable', 'elf32'],
        ['format MZ', 'mz'],
        ['use32', 'generic']
    ])('%s is %s', (source, context) => {
        expect(detectPlatformContext(source)).toBe(context);
    });
});
