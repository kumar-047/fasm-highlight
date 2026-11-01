import { ARCHITECTURES, ReadFile, analyzeSource } from '../src/architecture/analysis';
import { createBuildPlan, inferOutput } from '../src/compiler/buildTarget';
import { findEntryForArchitecture } from '../src/language/hoverProvider';
import { computeSemanticTokens } from '../src/language/semanticTokens';
import * as path from 'path';
import type { TextDocument } from 'vscode';

const noFiles: ReadFile = () => undefined;
const SOURCE = path.resolve('project/a.asm');

function analyze(text: string, files: Record<string, string> = {}) {
    const read: ReadFile = (file) => files[path.relative(path.dirname(SOURCE), file).replace(/\\/g, '/')];
    return analyzeSource(text, SOURCE, read);
}

function tokensOf(text: string, files: Record<string, string> = {}) {
    return computeSemanticTokens(text, analyze(text, files)).map((token) => ({
        word: text.split(/\r?\n/)[token.line].slice(token.character, token.character + token.length),
        type: token.type
    }));
}

describe('detecting the architecture', () => {
    test.each([
        ["include '8051.inc'", '8051'],
        ['include "avr.inc"', 'avr'],
        ['include "m16def.inc"', 'avr'],
        ["include 'jclass.inc'", 'jvm'],
        ["include 'wasm.inc'", 'wasm'],
        ["include 'iset/aarch64.inc'", 'aarch64'],
        ['thumb', 'arm'],
        ['code64', 'arm'],
        ['processor cpu32_v7', 'arm'],
        ['format PE', 'x86'],
        ["include 'win32a.inc'", 'x86'],
        ['mov eax,1', 'x86']
    ])('%s is %s', (source, id) => {
        expect(analyze(source).architecture.id).toBe(id);
    });

    test('Windows path separators in includes work', () => {
        expect(analyze('include "..\\8051\\8051.inc"').architecture.id).toBe('8051');
    });

    test('a commented include is ignored', () => {
        expect(analyze("; include '8051.inc'").architecture.id).toBe('x86');
    });

    test('the setting overrides detection', () => {
        expect(analyzeSource("include '8051.inc'", SOURCE, noFiles, [], 'avr').architecture.id).toBe('avr');
    });
});

describe('detecting fasmg syntax', () => {
    test.each(['macro x\nend macro', 'iterate a, 1,2\nend iterate', 'calminstruction x\nend calminstruction', "include 'fasm2.inc'", "include 'avr.inc'"])('%s is fasmg', (source) => {
        expect(analyze(source).dialect).toBe('fasmg');
    });

    test.each(['macro x { nop }', 'format PE\nmov eax,1', 'thumb\nmov r0,r1'])('%s is fasm 1 style', (source) => {
        expect(analyze(source).dialect).toBe('fasm');
    });
});

describe('reading includes', () => {
    test('an unknown package is read for its macros', () => {
        const analysis = analyze("include 'z80.inc'\nld a,1\n", { 'z80.inc': 'macro ld? dst,src\nend macro\ncalminstruction jp? target\nend calminstruction\n' });
        expect(analysis.architecture.id).toBe('other');
        expect([...analysis.scanned.keys()]).toEqual(['ld', 'jp']);
        expect(analysis.scanned.get('ld')).toMatchObject({ line: 1 });
    });

    test('instructions made with iterate are found', () => {
        const analysis = analyze("include 'p.inc'", { 'p.inc': 'iterate <op,code>, ADC,1, SBC,2\n macro op? a\n end macro\nend iterate\n' });
        expect(analysis.scanned.has('adc')).toBe(true);
        expect(analysis.scanned.has('sbc')).toBe(true);
    });

    test('include loops stop', () => {
        const analysis = analyze("include 'a.inc'", { 'a.inc': "include 'b.inc'", 'b.inc': "include 'a.inc'\nmacro done\nend macro" });
        expect(analysis.scanned.has('done')).toBe(true);
    });

    test('x86 files do not treat include macros as instructions', () => {
        expect(analyze("format PE\ninclude 'a.inc'", { 'a.inc': 'macro thing { nop }' }).scanned.size).toBe(0);
    });

    test('missing includes are fine', () => {
        expect(() => analyze("include 'missing.inc'")).not.toThrow();
    });

    test('the output format can come from an include', () => {
        const analysis = analyze("include 'hex.inc'\ninclude '8051.inc'", { 'hex.inc': "format binary as 'hex'" });
        expect(inferOutput(analysis.combinedText, analysis.dialect).extension).toBe('.hex');
    });
});

describe('semantic tokens', () => {
    test('another architecture gets its own instructions and registers', () => {
        expect(tokensOf("include 'avr.inc'\nldi r16,1\nnotreal r16\n")).toEqual([
            { word: 'ldi', type: 'keyword' },
            { word: 'r16', type: 'variable' },
            { word: 'r16', type: 'variable' }
        ]);
    });

    test('labels, strings and comments are skipped', () => {
        expect(tokensOf("include 'avr.inc'\nnop: db 'nop'\n; nop\n")).toEqual([]);
    });

    test('an instruction after a label counts', () => {
        expect(tokensOf("include 'avr.inc'\nstart: nop\n").map((token) => token.word)).toEqual(['nop']);
    });

    test('dotted WebAssembly names stay whole', () => {
        expect(tokensOf("include 'wasm.inc'\ni32.add\n").map((token) => token.word)).toEqual(['i32.add']);
    });

    test('x86 files add nothing, because the grammar colours them', () => {
        expect(tokensOf('format PE\nmov eax,1\n')).toEqual([]);
    });

    test('fasmg directives are coloured', () => {
        expect(tokensOf('iterate x, 1,2\nend iterate\n')).toContainEqual({ word: 'iterate', type: 'macro' });
    });

    test('CALM commands are only coloured inside CALM blocks', () => {
        const words = tokensOf('iterate x, 1\narrange a,b\ncalminstruction y\narrange a,b\nend calminstruction\narrange a,b\n')
            .filter((token) => token.word === 'arrange');
        expect(words).toHaveLength(1);
    });

    test('scanned macros are coloured', () => {
        expect(tokensOf("include 'z80.inc'\nld a,1\n", { 'z80.inc': 'macro ld? a,b\nend macro\n' })).toEqual([{ word: 'ld', type: 'keyword' }]);
    });
});

describe('hover on other architectures', () => {
    const avr = analyze("include 'avr.inc'");

    test('instructions name the architecture, not x86', () => {
        expect(findEntryForArchitecture('add', avr)).toMatchObject({ summary: 'AVR instruction.', category: 'Instruction' });
    });

    test('registers name the architecture', () => {
        expect(findEntryForArchitecture('r16', avr)).toMatchObject({ summary: 'AVR register.' });
    });

    test('x86 instructions are not shown', () => {
        expect(findEntryForArchitecture('cpuid', avr)).toBeUndefined();
        expect(findEntryForArchitecture('eax', avr)).toBeUndefined();
    });

    test('directives still are', () => {
        expect(findEntryForArchitecture('include', avr)?.category).toBe('Preprocessor');
    });

    test('scanned macros show where they come from', () => {
        const analysis = analyze("include 'z80.inc'", { 'z80.inc': 'nop\nmacro ld? a\nend macro' });
        expect(findEntryForArchitecture('ld', analysis)?.summary).toBe('Defined in z80.inc, line 2.');
    });

    test('x86 files keep full hovers', () => {
        expect(findEntryForArchitecture('mov', analyze('format PE'))?.section).toBe('2.1.1');
    });
});

describe('building for other architectures', () => {
    const document = (text: string) => ({ fileName: 'a.asm', languageId: 'fasm', getText: () => text }) as unknown as TextDocument;

    test('they can be built but not run', () => {
        const text = "include 'avr.inc'";
        const plan = createBuildPlan(document(text), 'win32', analyze(text));
        expect(plan.canBuild).toBe(true);
        expect(plan.canRun).toBe(false);
        expect(plan.runReason).toContain('AVR');
    });

    test('fasmg adds no extension without a format', () => {
        expect(inferOutput('db 1', 'fasmg').extension).toBe('');
    });

    test('fasmg files with a format keep it', () => {
        expect(inferOutput("format binary as 'class'", 'fasmg').extension).toBe('.class');
    });

    test('every architecture has a label', () => {
        for (const architecture of Object.values(ARCHITECTURES)) {
            expect(architecture.label).toBeTruthy();
        }
    });
});
