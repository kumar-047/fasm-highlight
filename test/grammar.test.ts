import * as fs from 'node:fs';
import * as path from 'node:path';
import * as oniguruma from 'vscode-oniguruma';
import * as vsctm from 'vscode-textmate';
import { buildGrammar } from '../src/grammar/buildGrammar';

const ROOT = path.join(__dirname, '..');
const GRAMMAR_PATH = path.join(ROOT, 'syntaxes', 'fasm.tmLanguage.json');

interface Token {
    readonly text: string;
    readonly scope: string;
}

const tokensByLine = new Map<string, Token[]>();

function scopeOf(line: string, text: string): string {
    const tokens = tokensByLine.get(line);
    if (!tokens) {
        throw new Error(`Line is not in sample.asm: ${line}`);
    }
    const token = tokens.find((candidate) => candidate.text === text);
    if (!token) {
        throw new Error(`"${text}" is not a token of "${line}": ${tokens.map((t) => t.text).join(' | ')}`);
    }
    return token.scope;
}

beforeAll(async () => {
    const wasm = fs.readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm'));
    await oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength) as ArrayBuffer);

    const registry = new vsctm.Registry({
        onigLib: Promise.resolve({
            createOnigScanner: (patterns: string[]) => new oniguruma.OnigScanner(patterns),
            createOnigString: (text: string) => new oniguruma.OnigString(text)
        }),
        loadGrammar: async () => vsctm.parseRawGrammar(fs.readFileSync(GRAMMAR_PATH, 'utf8'), GRAMMAR_PATH)
    });
    const grammar = await registry.loadGrammar('source.fasm');
    if (!grammar) {
        throw new Error('Grammar did not load');
    }

    const lines = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample.asm'), 'utf8').split(/\r?\n/);
    let stack = vsctm.INITIAL;
    for (const line of lines) {
        const result = grammar.tokenizeLine(line, stack);
        stack = result.ruleStack;
        tokensByLine.set(line.trim(), result.tokens.map((token) => ({
            text: line.slice(token.startIndex, token.endIndex).trim(),
            scope: token.scopes[token.scopes.length - 1]
        })));
    }
});

test('the committed grammar matches the symbol table', () => {
    expect(JSON.parse(fs.readFileSync(GRAMMAR_PATH, 'utf8'))).toEqual(JSON.parse(JSON.stringify(buildGrammar())));
});

describe('label references', () => {
    test.each([['jmp @b', '@b'], ['jne @f', '@f'], ['jmp @r', '@r']])('%s', (line, text) => {
        expect(scopeOf(line, text)).toBe('keyword.control.label-reference.fasm');
    });
});

describe('numbers', () => {
    test.each([
        ['mov al,$FF', '$FF', 'constant.numeric.hex.fasm'],
        ['mov al,0E5h', '0E5h', 'constant.numeric.hex.fasm'],
        ['dw 10d', '10d', 'constant.numeric.decimal.fasm'],
        ['dw 17q', '17q', 'constant.numeric.octal.fasm'],
        ['dw 1_000', '1_000', 'constant.numeric.decimal.fasm'],
        ['dd 1.5e3', '1.5e3', 'constant.numeric.float.fasm'],
        ['dd 1.0', '1.0', 'constant.numeric.float.fasm'],
        ['dd 1E0', '1E0', 'constant.numeric.float.fasm'],
        ['dd 1f', '1f', 'constant.numeric.float.fasm'],
        ['format PE GUI 4.0', '4.0', 'constant.numeric.float.fasm']
    ])('%s', (line, text, scope) => {
        expect(scopeOf(line, text)).toBe(scope);
    });

    test('$ stays the current address', () => {
        expect(scopeOf('mov eax,$-msg', '$')).toBe('keyword.operator.special.fasm');
        expect(scopeOf('mov eax,$$', '$')).toBe('keyword.operator.special.fasm');
    });
});

describe('registers', () => {
    test.each([
        ['lea rax,[rip+msg]', 'rip', 'instruction-pointer'],
        ['mov eax,[eip]', 'eip', 'instruction-pointer'],
        ['vaddps xmm16,xmm17,xmm31', 'xmm31', 'xmm'],
        ['vaddps ymm16,ymm17,ymm31', 'ymm16', 'ymm'],
        ['kmovw k1,eax', 'k1', 'opmask']
    ])('%s', (line, text, group) => {
        expect(scopeOf(line, text)).toBe(`variable.language.register.${group}.fasm`);
    });
});

describe('instructions', () => {
    test.each([
        ['cmovne eax,ebx', 'cmovne', 'conditional'],
        ['sete al', 'sete', 'conditional'],
        ['aesenc xmm0,xmm1', 'aesenc', 'extension'],
        ['pshufb xmm0,xmm1', 'pshufb', 'sse'],
        ['andn eax,ebx,ecx', 'andn', 'extension'],
        ['bextr eax,ebx,ecx', 'bextr', 'extension'],
        ['bzhi eax,ebx,ecx', 'bzhi', 'extension'],
        ['mulx eax,ebx,ecx', 'mulx', 'extension'],
        ['rdrand eax', 'rdrand', 'extension'],
        ['rdseed eax', 'rdseed', 'extension'],
        ['xgetbv', 'xgetbv', 'extension'],
        ['prefetchnta [eax]', 'prefetchnta', 'extension'],
        ['kmovw k1,eax', 'kmovw', 'avx'],
        ['pclmulqdq xmm0,xmm1,0', 'pclmulqdq', 'extension'],
        ['int3', 'int3', 'control-flow'],
        ['ud2', 'ud2', 'misc'],
        ['endbr64', 'endbr64', 'extension'],
        ['bswap eax', 'bswap', 'logical'],
        ['popcnt eax,ebx', 'popcnt', 'extension'],
        ['pushfd', 'pushfd', 'flag'],
        ['movsd', 'movsd', 'string'],
        ['lfence', 'lfence', 'sse']
    ])('%s', (line, text, group) => {
        expect(scopeOf(line, text)).toBe(`keyword.other.mnemonic.${group}.fasm`);
    });
});

describe('normal code keeps its colours', () => {
    test.each([
        ['start: mov eax,1', 'mov', 'keyword.other.mnemonic.data-movement.fasm'],
        ['rep movsb', 'movsb', 'keyword.other.mnemonic.string.fasm'],
        ['lock add [eax],1', 'add', 'keyword.other.mnemonic.arithmetic.fasm'],
        ['times 5 nop', 'nop', 'keyword.other.mnemonic.misc.fasm'],
        ["msg db 'Hello',0 ; comment", 'db', 'storage.type.data.fasm'],
        ['count equ 5', 'equ', 'keyword.control.directive.constant.fasm'],
        ['buf rb 10', 'rb', 'storage.type.data.fasm'],
        ['end if', 'if', 'keyword.control.directive.conditional.fasm'],
        ['end if', 'end', 'keyword.control.directive.statement.fasm'],
        ['end while', 'while', 'keyword.control.directive.repeat.fasm'],
        ['data import', 'data', 'keyword.control.directive.statement.fasm'],
        ['data import', 'import', 'keyword.other.format.fasm'],
        ['end data', 'data', 'keyword.control.directive.statement.fasm'],
        ['common', 'common', 'keyword.control.directive.macro.fasm'],
        ['invoke ExitProcess,0', 'invoke', 'support.function.macro-helper.fasm'],
        ['.loop:', '.loop:', 'entity.name.label.local.fasm']
    ])('%s: %s', (line, text, scope) => {
        expect(scopeOf(line, text)).toBe(scope);
    });
});

describe('words with two meanings', () => {
    test.each([
        ['and eax,ebx', 'and', 'keyword.other.mnemonic.logical.fasm'],
        ['not eax', 'not', 'keyword.other.mnemonic.logical.fasm'],
        ['lock and [eax],1', 'and', 'keyword.other.mnemonic.logical.fasm'],
        ['macro clear reg { xor reg,reg }', 'xor', 'keyword.other.mnemonic.logical.fasm'],
        ['mov eax,1 shl 4', 'shl', 'keyword.operator.word.fasm'],
        ['if count and 1', 'and', 'keyword.operator.word.fasm']
    ])('%s: %s', (line, text, scope) => {
        expect(scopeOf(line, text)).toBe(scope);
    });
});

describe('words that are only names here', () => {
    test.each([
        ['mov eax,[data]', ',[data]'],
        ['mov eax,size', ',size'],
        ['push MB_OK', 'MB_OK'],
        ['mov eax,.loop', ',.loop'],
        ['stack dd 0', 'stack']
    ])('%s', (line, text) => {
        expect(scopeOf(line, text)).toBe('source.fasm');
    });
});

describe('format lines', () => {
    test.each([
        ['format PE GUI 4.0', 'PE'],
        ['format PE GUI 4.0', 'GUI'],
        ["section '.text' code readable executable", 'code'],
        ["section '.text' code readable executable", 'executable']
    ])('%s: %s', (line, text) => {
        expect(scopeOf(line, text)).toBe('keyword.other.format.fasm');
    });

    test('section names are coloured as sections', () => {
        expect(scopeOf("section '.text' code readable executable", "'.text'")).toBe('entity.name.section.fasm');
    });
});

describe('strings', () => {
    test('an unterminated string stops at the end of its line', () => {
        expect(scopeOf("bad db 'unterminated", 'unterminated')).toBe('string.quoted.single.fasm');
        expect(scopeOf('; this comment must stay a comment', '; this comment must stay a comment')).toBe('comment.line.semicolon.fasm');
    });

    test('comments after strings are still comments', () => {
        expect(scopeOf("msg db 'Hello',0 ; comment", '; comment')).toBe('comment.line.semicolon.fasm');
    });
});
