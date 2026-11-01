import type { MnemonicGroup, SymbolContext, SymbolGroup, SymbolKind } from '../types';
import mnemonics from './mnemonics.json';

export const MNEMONIC_GROUPS: Readonly<Record<MnemonicGroup, readonly string[]>> = mnemonics;

function list(text: string): readonly string[] {
    return text.split(' ');
}

function numbered(prefix: string, first: number, last: number, suffix = ''): string[] {
    const names: string[] = [];
    for (let index = first; index <= last; index += 1) {
        names.push(`${prefix}${index}${suffix}`);
    }
    return names;
}

const MNEMONIC_LABELS: Readonly<Record<MnemonicGroup, string>> = {
    'data-movement': 'data movement',
    arithmetic: 'arithmetic',
    logical: 'logical',
    'control-flow': 'control flow',
    string: 'string',
    flag: 'flag control',
    conditional: 'conditional',
    misc: 'miscellaneous',
    system: 'system',
    fpu: 'FPU',
    mmx: 'MMX and 3DNow!',
    sse: 'SSE',
    avx: 'AVX, AVX2, XOP and AVX-512',
    extension: 'instruction set extension'
};

const mnemonicGroups: SymbolGroup[] = (Object.keys(MNEMONIC_GROUPS) as MnemonicGroup[]).map((group) => ({
    id: `mnemonic.${group}`,
    label: MNEMONIC_LABELS[group],
    kind: 'instruction',
    scope: `keyword.other.mnemonic.${group}.fasm`,
    context: 'anywhere',
    words: MNEMONIC_GROUPS[group]
}));

function registerGroup(id: string, label: string, words: readonly string[]): SymbolGroup {
    return {
        id: `register.${id}`,
        label,
        kind: 'register',
        scope: `variable.language.register.${id}.fasm`,
        context: 'anywhere',
        words
    };
}

const registerGroups: SymbolGroup[] = [
    registerGroup('general.64bit', '64-bit general-purpose', [...list('rax rbx rcx rdx rsi rdi rbp rsp'), ...numbered('r', 8, 15)]),
    registerGroup('general.32bit', '32-bit general-purpose', [...list('eax ebx ecx edx esi edi ebp esp'), ...numbered('r', 8, 15, 'd')]),
    registerGroup('general.16bit', '16-bit general-purpose', [...list('ax bx cx dx si di bp sp'), ...numbered('r', 8, 15, 'w')]),
    registerGroup('general.8bit', '8-bit general-purpose', [
        ...list('al bl cl dl ah bh ch dh sil dil bpl spl'),
        ...numbered('r', 8, 15, 'b'),
        ...numbered('r', 8, 15, 'l')
    ]),
    registerGroup('instruction-pointer', 'instruction pointer', list('rip eip')),
    registerGroup('segment', 'segment', list('cs ds es fs gs ss')),
    registerGroup('control', 'control', numbered('cr', 0, 15)),
    registerGroup('debug', 'debug', numbered('dr', 0, 15)),
    registerGroup('test', 'test', numbered('tr', 0, 7)),
    registerGroup('fpu', 'FPU', ['st', ...numbered('st', 0, 7)]),
    registerGroup('mmx', 'MMX', numbered('mm', 0, 7)),
    registerGroup('xmm', '128-bit SIMD', numbered('xmm', 0, 31)),
    registerGroup('ymm', '256-bit SIMD', numbered('ymm', 0, 31)),
    registerGroup('zmm', '512-bit SIMD', numbered('zmm', 0, 31)),
    registerGroup('opmask', 'AVX-512 opmask', numbered('k', 0, 7)),
    registerGroup('bounds', 'MPX bounds', numbered('bnd', 0, 3)),
    registerGroup('amx', 'AMX tile', numbered('tmm', 0, 7))
];

function directiveGroup(id: string, label: string, kind: SymbolKind, words: string, context: SymbolContext = 'anywhere'): SymbolGroup {
    return {
        id: `directive.${id}`,
        label,
        kind,
        scope: `keyword.control.directive.${id}.fasm`,
        context,
        words: list(words)
    };
}

const otherGroups: SymbolGroup[] = [
    directiveGroup('structure', 'structure', 'preprocessor', 'struc restruc'),
    directiveGroup('macro', 'macro', 'preprocessor', 'macro local purge rept irp irps irpv match forward reverse common postpone'),
    directiveGroup('include', 'include', 'preprocessor', 'include'),
    directiveGroup('constant', 'symbolic constant', 'preprocessor', 'equ fix define restore'),
    directiveGroup('entry', 'entry point', 'format', 'entry'),
    directiveGroup('addressing', 'addressing mode', 'directive', 'use16 use32 use64 useavx256 useavx512'),
    directiveGroup('conditional', 'conditional assembly', 'directive', 'if else'),
    directiveGroup('repeat', 'repeating block', 'directive', 'repeat times while break'),
    directiveGroup('linkage', 'linkage', 'format', 'export import public extrn'),
    directiveGroup('other', 'control', 'directive', 'align virtual display org load store label assert err'),
    directiveGroup('statement', 'control', 'format', 'end stack heap', 'statement'),
    {
        id: 'macro-helper',
        label: 'include package macro',
        kind: 'macro-helper',
        scope: 'support.function.macro-helper.fasm',
        context: 'anywhere',
        words: list('invoke stdcall cinvoke ccall fastcall proc endp library struct ends union sizeof')
    },
    {
        id: 'data.define',
        label: 'data definition',
        kind: 'data',
        scope: 'storage.type.data.fasm',
        context: 'anywhere',
        words: list('db dw dd dq dt df dp du file')
    },
    {
        id: 'data.reserve',
        label: 'data reservation',
        kind: 'data',
        scope: 'storage.type.data.fasm',
        context: 'anywhere',
        words: list('rb rw rd rq rt rf rp')
    },
    {
        id: 'data.size',
        label: 'size operator',
        kind: 'data',
        scope: 'storage.type.size.fasm',
        context: 'anywhere',
        words: list('byte word dword fword pword qword tbyte tword dqword xword qqword yword dqqword zword')
    },
    {
        id: 'operator.word',
        label: 'operator',
        kind: 'operator',
        scope: 'keyword.operator.word.fasm',
        context: 'anywhere',
        words: list('mod dup ptr rva plt short near far as at from on eq eqtype relativeto defined definite used')
    },
    {
        id: 'format.keyword',
        label: 'output format keyword',
        kind: 'format',
        scope: 'keyword.other.format.fasm',
        context: 'format-line',
        words: list(
            'binary mz pe pe64 coff ms ms64 elf elf64 gui console dll native efi efiboot efiruntime wdm nx large '
            + 'code data readable writable writeable executable shareable discardable notpageable linkinfo linkremove '
            + 'static dynamic interpreter note gnuehframe gnurelro gnustack export import resource fixups'
        )
    }
];

export const SYMBOL_GROUPS: readonly SymbolGroup[] = [...mnemonicGroups, ...registerGroups, ...otherGroups];

export const INSTRUCTION_OR_OPERATOR_WORDS: readonly string[] = list('and or xor not shl shr');
