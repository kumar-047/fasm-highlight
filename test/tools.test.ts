import * as fs from 'node:fs';
import * as path from 'node:path';
import { BLOCK_END, BLOCK_START } from '../src/formatter/constants/blockPatterns';
import { formatFasmSource } from '../src/formatter/formatter';
import type { FormatOptions } from '../src/formatter/types';
import { FONT_PALETTE } from '../src/fonts/constants/fontPalette';
import { findSymbolGroup } from '../src/grammar/symbols';
import { rankSnippets, starterSnippet } from '../src/snippets/snippetRanking';
import type { SnippetDefinition } from '../src/snippets/types';
import { resolveTargetSystem } from '../src/system/targetSystem';
import { convertNumber, numberAt, parseFasmNumber } from '../src/tools/numberConverter';

const ROOT = path.join(__dirname, '..');

function format(text: string, commentColumn = 0, extra: Partial<FormatOptions> = {}): string {
    return formatFasmSource(text, {
        indent: '    ',
        commentColumn,
        operandColumn: 0,
        spaceAfterComma: false,
        maxBlankLines: 0,
        ...extra,
        isInstruction: (word) => findSymbolGroup(word)?.kind === 'instruction'
    });
}

describe('formatter', () => {
    test('instructions are indented, and labels and directives are not', () => {
        expect(format('format PE\nstart:\n  mov    eax,1\nret\n')).toBe('format PE\nstart:\n    mov eax,1\n    ret\n');
    });

    test('blocks indent their contents', () => {
        expect(format('if x\nnop\nend if\n')).toBe('if x\n    nop\nend if\n');
    });

    test('else lines up with its if', () => {
        expect(format('if x\ny=1\nelse\ny=2\nend if')).toBe('if x\n    y=1\nelse\n    y=2\nend if');
    });

    test('macro braces indent', () => {
        expect(format('macro m {\nnop\n}')).toBe('macro m {\n    nop\n}');
    });

    test('fasm 1 macros with the brace on the next line indent once', () => {
        expect(format('macro m\n{\nnop\n}\nnop')).toBe('macro m\n{\n    nop\n}\n    nop');
    });

    test('fasmg macros without braces indent their body', () => {
        expect(format('macro m\nnop\nend macro\nnop')).toBe('macro m\n    nop\nend macro\n    nop');
    });

    test('nested fasmg blocks indent by level', () => {
        expect(format('macro m\nif x\nnop\nend if\nend macro')).toBe('macro m\n    if x\n        nop\n    end if\nend macro');
    });

    test('one-line macros do not open a block', () => {
        expect(format('macro m { nop }\nnop')).toBe('macro m { nop }\n    nop');
    });

    test('CALM commands inside calminstruction open no blocks', () => {
        const source = 'calminstruction x\nmatch a, b\nrawmatch c, d\nend calminstruction\nnop';
        expect(format(source)).toBe('calminstruction x\n    match a, b\n    rawmatch c, d\nend calminstruction\n    nop');
    });

    test('labels sit left of the code in a block', () => {
        expect(format('proc f\n.loop:\nmov eax,1\nret\nendp')).toBe('proc f\n.loop:\n    mov eax,1\n    ret\nendp');
    });

    test('labels inside an if stay one level in', () => {
        expect(format('proc f\nif x\n.a:\nnop\nend if\nendp')).toBe('proc f\n    if x\n    .a:\n        nop\n    end if\nendp');
    });

    test('operands can align to a column', () => {
        expect(format('mov eax,1\nnop', 0, { operandColumn: 12 })).toBe('    mov     eax,1\n    nop');
    });

    test('a long instruction still has a gap before its operands', () => {
        expect(format('vfmadd132ps xmm0,xmm1,xmm2', 0, { operandColumn: 8 })).toBe('    vfmadd132ps xmm0,xmm1,xmm2');
    });

    test('a space can be added after commas, but never in strings', () => {
        expect(format("mov eax,ebx\nmsg db 'a,b',0", 0, { spaceAfterComma: true })).toBe("    mov eax, ebx\nmsg db 'a,b', 0");
    });

    test('blank lines in a row can be limited', () => {
        expect(format('nop\n\n\n\nnop', 0, { maxBlankLines: 1 })).toBe('    nop\n\n    nop');
    });

    test('every option together is stable on a second format', () => {
        const options = { operandColumn: 12, spaceAfterComma: true, maxBlankLines: 1 };
        const once = format('macro m\nif x\nstart:   mov  eax,1 ; c\nend if\nend macro\n\n\nmov eax,ebx', 30, options);
        expect(format(once, 30, options)).toBe(once);
    });

    test('nothing inside strings changes', () => {
        expect(format("  msg   db   'a    b ; not a comment  '")).toBe("msg   db   'a    b ; not a comment  '");
    });

    test('only the gap after the instruction changes', () => {
        expect(format('mov   eax,   1')).toBe('    mov eax,   1');
    });

    test('line continuations are left alone', () => {
        expect(format('db 1,\\\n      2\n')).toBe('db 1,\\\n      2\n');
    });

    test('comments keep their spacing by default', () => {
        expect(format('nop      ; wait')).toBe('    nop      ; wait');
    });

    test('comments can align to a column', () => {
        expect(format('nop ; wait', 20)).toBe('    nop             ; wait');
    });

    test('long code still has a gap before its comment', () => {
        expect(format('mov eax,ebx ; x', 4)).toBe('    mov eax,ebx ; x');
    });

    test('comment-only lines follow the block', () => {
        expect(format('if x\n; note\nend if')).toBe('if x\n    ; note\nend if');
    });

    test('trailing spaces are removed and blank lines kept', () => {
        expect(format('nop   \n   \nnop')).toBe('    nop\n\n    nop');
    });

    test('Windows line endings are kept', () => {
        expect(format('nop\r\nnop\r\n')).toBe('    nop\r\n    nop\r\n');
    });

    test('formatting twice changes nothing more', () => {
        const once = format('format PE\nif x\nstart:   mov  eax,1 ; c\nelse\nnop\nend if\nmacro m {\n xor eax,eax\n}\n');
        expect(format(once)).toBe(once);
    });

    test('only whitespace ever changes', () => {
        const source = "format PE\n  if x\n mov   eax,'a  b' ; c  d\nend if\n";
        expect(format(source).replace(/\s/g, '')).toBe(source.replace(/\s/g, ''));
    });

    test('block rules match language-configuration.json', () => {
        const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'language-configuration.json'), 'utf8'));
        expect(BLOCK_START.source).toBe(new RegExp(config.folding.markers.start).source);
        expect(BLOCK_END.source).toBe(new RegExp(config.folding.markers.end).source);
    });
});

describe('number at the cursor', () => {
    test.each([
        ['mov eax,0FFh', 9, '0FFh'],
        ['mov eax,0FFh', 12, '0FFh'],
        ['mov al,$1F', 8, '$1F'],
        ["dw 1'000", 4, "1'000"],
        ['mov eax,ebx', 9, undefined],
        ['r8 dd 5', 1, undefined]
    ])('%s at %i is %s', (line, character, value) => {
        expect(numberAt(line, character)).toBe(value);
    });
});

describe('font palette', () => {
    test('there are several fonts, with safe fallbacks', () => {
        expect(FONT_PALETTE.length).toBeGreaterThanOrEqual(8);
        for (const font of FONT_PALETTE) {
            expect(font.family).toContain('monospace');
        }
    });

    test('labels are unique', () => {
        expect(new Set(FONT_PALETTE.map((font) => font.label)).size).toBe(FONT_PALETTE.length);
    });

});

describe('number converter', () => {
    test.each([
        ['255', 255n], ['255d', 255n], ['0FFh', 255n], ['0xFF', 255n], ['$FF', 255n], ['11111111b', 255n],
        ['377o', 255n], ['377q', 255n], ['1_000', 1000n], ["1'000", 1000n], ['  10  ', 10n], ['18446744073709551616', 18446744073709551616n]
    ])('reads %s', (text, value) => {
        expect(parseFasmNumber(text)).toBe(value);
    });

    test.each(['', 'FFh', 'hello', '12z', '2b', '9o', '-1'])('rejects %j', (text) => {
        expect(parseFasmNumber(text)).toBeUndefined();
    });

    test('it shows every base', () => {
        expect(convertNumber('255')).toEqual({ decimal: '255', hex: '0FFh', binary: '11111111b', octal: '377o' });
    });

    test('hex starting with a digit needs no leading zero', () => {
        expect(convertNumber('16')?.hex).toBe('10h');
    });
});

describe('target system', () => {
    test.each([
        ['format PE console', 'windows'],
        ['format PE64', 'windows'],
        ['format MZ', 'windows'],
        ['format MS COFF', 'windows'],
        ['format ELF64 executable', 'linux'],
        ['format MachO64', 'macos']
    ])('%s wins over the computer and the setting', (source, system) => {
        const other = system === 'linux' ? 'windows' : 'linux';
        expect(resolveTargetSystem(source, other, 'darwin')).toEqual({ system, source: 'file' });
    });

    test('the setting comes next', () => {
        expect(resolveTargetSystem('nop', 'linux', 'win32')).toEqual({ system: 'linux', source: 'setting' });
    });

    test.each([['win32', 'windows'], ['linux', 'linux'], ['darwin', 'macos'], ['freebsd', 'linux']] as const)('automatic on %s is %s', (platform, system) => {
        expect(resolveTargetSystem('nop', 'auto', platform)).toEqual({ system, source: 'this computer' });
    });
});

describe('snippets', () => {
    const snippets = Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, 'snippets', 'fasm.json'), 'utf8'))) as SnippetDefinition[];
    const rank = (target: 'windows' | 'linux' | 'macos', prefix: string) =>
        rankSnippets(snippets, target).find((snippet) => snippet.prefix === prefix)?.sortText[0];

    test('the target system comes first, then general ones, then others', () => {
        expect(rank('windows', 'win32')).toBe('0');
        expect(rank('windows', 'proc')).toBe('1');
        expect(rank('windows', 'linux')).toBe('2');
        expect(rank('linux', 'linux')).toBe('0');
        expect(rank('linux', 'win64')).toBe('2');
    });

    test('nothing is hidden', () => {
        expect(rankSnippets(snippets, 'linux').length).toBe(snippets.length + 1);
    });

    test.each([['windows', 'format PE64'], ['linux', 'format ELF64'], ['macos', 'format MachO64']] as const)('the program snippet suits %s', (target, text) => {
        const program = rankSnippets(snippets, target).find((snippet) => snippet.prefix === 'program');
        expect(program?.body.join('\n')).toContain(text);
        expect(starterSnippet(snippets, target)).toBeDefined();
    });
});
