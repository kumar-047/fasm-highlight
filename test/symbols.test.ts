import * as fs from 'node:fs';
import * as path from 'node:path';
import { INSTRUCTION_OR_OPERATOR_WORDS, MNEMONIC_GROUPS, SYMBOL_GROUPS } from '../src/grammar/constants/symbolGroups';
import { findSymbolGroup } from '../src/grammar/symbols';

const ROOT = path.join(__dirname, '..');

describe('symbol table', () => {
    test('no word belongs to two groups', () => {
        const seen = new Map<string, string>();
        const duplicates: string[] = [];
        for (const group of SYMBOL_GROUPS.filter((candidate) => candidate.context !== 'format-line')) {
            for (const word of group.words) {
                const earlier = seen.get(word);
                if (earlier) {
                    duplicates.push(`${word}: ${earlier} and ${group.id}`);
                }
                seen.set(word, group.id);
            }
        }
        expect(duplicates).toEqual([]);
    });

    test('every word is lowercase and non-empty', () => {
        const bad = SYMBOL_GROUPS.flatMap((group) => group.words).filter((word) => !word || word !== word.toLowerCase());
        expect(bad).toEqual([]);
    });

    test('it holds all 1,931 instructions in fasm 1.73.35', () => {
        expect(Object.values(MNEMONIC_GROUPS).flat()).toHaveLength(1931);
    });

    test('directive words are not listed as instructions', () => {
        for (const word of ['format', 'section', 'stack', 'heap', 'if', 'end', 'data', 'useavx512']) {
            expect(findSymbolGroup(word)?.kind).not.toBe('instruction');
        }
    });

    test('words outside fasm 1 are gone', () => {
        for (const word of ['endif', 'ifdef', 'ifndef', 'elseif', 'irpc', 'endm', 'cwtl', 'cltd', 'cqto', 'offset', 'lengthof', 'length', 'size', 'ip']) {
            expect(findSymbolGroup(word)).toBeUndefined();
        }
    });

    test('classification', () => {
        expect(findSymbolGroup('proc')?.id).toBe('macro-helper');
        expect(findSymbolGroup('common')?.id).toBe('directive.macro');
        expect(findSymbolGroup('bswap')?.id).toBe('mnemonic.logical');
        expect(findSymbolGroup('setne')?.id).toBe('mnemonic.conditional');
        expect(findSymbolGroup('popcnt')?.id).toBe('mnemonic.extension');
        expect(findSymbolGroup('while')?.id).toBe('directive.repeat');
    });

    test('words with two meanings are instructions in the table', () => {
        for (const word of INSTRUCTION_OR_OPERATOR_WORDS) {
            expect(findSymbolGroup(word)?.id).toBe('mnemonic.logical');
        }
    });
});

describe('package manifest', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

    test('command titles do not repeat the category', () => {
        for (const command of manifest.contributes.commands) {
            expect(command.title).not.toMatch(/^FASM:/);
        }
    });

    test('contributed files exist', () => {
        const files = [
            manifest.contributes.grammars[0].path,
            manifest.contributes.languages[0].configuration
        ];
        for (const file of files) {
            expect(fs.existsSync(path.join(ROOT, file))).toBe(true);
        }
    });

    test('it no longer ships a colour theme', () => {
        expect(manifest.contributes.themes).toBeUndefined();
        expect(manifest.categories).not.toContain('Themes');
    });

    test('it has what Open VSX needs', () => {
        expect(manifest.publisher).toBeTruthy();
        expect(manifest.license).toBeTruthy();
        expect(manifest.repository.url).toContain('github.com');
        expect(fs.existsSync(path.join(ROOT, 'LICENSE'))).toBe(true);
    });
});
