import * as path from 'path';
import {
    AARCH64_INSTRUCTIONS,
    AVR_INSTRUCTIONS,
    I8051_INSTRUCTIONS,
    JVM_INSTRUCTIONS,
    WASM_INSTRUCTIONS
} from '../data/architectures';

export type ArchitectureId = 'x86' | '8051' | 'avr' | 'jvm' | 'wasm' | 'aarch64' | 'arm' | 'other';
export type Dialect = 'fasm' | 'fasmg';

export interface Architecture {
    readonly id: ArchitectureId;
    readonly label: string;
    readonly instructions: ReadonlySet<string>;
    readonly registers: ReadonlySet<string>;
}

export interface ScannedSymbol {
    readonly name: string;
    readonly file: string;
    readonly line: number;
}

export interface SourceAnalysis {
    readonly dialect: Dialect;
    readonly architecture: Architecture;
    // Instruction-like macros found by reading the file's includes.
    readonly scanned: ReadonlyMap<string, ScannedSymbol>;
    // The source followed by its includes, used to find the output format.
    readonly combinedText: string;
}

export type ReadFile = (filePath: string) => string | undefined;

function numbered(prefix: string, first: number, last: number): string[] {
    const names: string[] = [];
    for (let index = first; index <= last; index += 1) {
        names.push(`${prefix}${index}`);
    }
    return names;
}

// From the FASMARM ReadMe. It mentions these but gives no complete list.
const ARM_INSTRUCTIONS = (
    'add adds addw sub subs mov movs movw movn movz movk mvn cpy cmp cmn and bic lsl lsr ror mul pkhtb b bl blx bkpt '
    + 'ldr ldrb ldrh ldrd ldm ldmia ldmfd str strb strh strd stm stmia stmdb push pop strex adrp ssat ssat16 sxtb sxth '
    + 'uxtb uxth smlald smlsld umaal vmull crc32 cps cpsie cpsid srs srsdb mrc dsb dmb isb vmov vmvn vmrs fmrx vldm vstm '
    + 'vpush vpop fldmd fstmd it ite itt ittt itttt'
).split(' ');

function architecture(id: ArchitectureId, label: string, instructions: readonly string[], registers: readonly string[]): Architecture {
    return { id, label, instructions: new Set(instructions), registers: new Set(registers) };
}

export const ARCHITECTURES: Readonly<Record<ArchitectureId, Architecture>> = {
    x86: architecture('x86', 'x86 and x86-64', [], []),
    '8051': architecture('8051', '8051', I8051_INSTRUCTIONS, ['a', 'b', 'c', 'ab', 'acc', 'dptr', ...numbered('r', 0, 7)]),
    avr: architecture('avr', 'AVR', AVR_INSTRUCTIONS, ['x', 'y', 'z', ...numbered('r', 0, 31)]),
    jvm: architecture('jvm', 'JVM bytecode', JVM_INSTRUCTIONS, []),
    wasm: architecture('wasm', 'WebAssembly', WASM_INSTRUCTIONS, []),
    aarch64: architecture('aarch64', 'AArch64', AARCH64_INSTRUCTIONS, [
        'sp', 'lr', 'xzr', 'wzr', 'wsp', ...numbered('x', 0, 30), ...numbered('w', 0, 30), ...numbered('v', 0, 31)
    ]),
    arm: architecture('arm', 'ARM (FASMARM)', ARM_INSTRUCTIONS, [
        ...numbered('r', 0, 15), ...numbered('a', 1, 4), ...numbered('v', 1, 8), 'sb', 'sl', 'fp', 'ip', 'sp', 'lr', 'pc',
        ...numbered('x', 0, 30), ...numbered('w', 0, 30), 'wsp', 'xzr', 'wzr'
    ]),
    other: architecture('other', 'Other fasmg package', [], [])
};

const INCLUDE_LINE = /^\s*include\s+(['"])([^'"]+)\1/gim;
const ARCHITECTURE_INCLUDES: readonly (readonly [RegExp, ArchitectureId])[] = [
    [/^8051\.inc$/i, '8051'],
    [/^(avr\.inc|m\d+\w*def\.inc)$/i, 'avr'],
    [/^(jclass|bytecode)\.inc$/i, 'jvm'],
    [/^(wasm|wasmcode)\.inc$/i, 'wasm'],
    [/^aarch64\.inc$/i, 'aarch64']
];
const X86_G_INCLUDES = /^(fasm2|x86-2|8086|80186|80286|80386|80486|p5|p6|x64)\.inc$/i;
const FASMG_SOURCE = /^\s*(?:end\s+(?:macro|iterate|namespace|calminstruction|struc|rawmatch)\b|calminstruction\b|iterate\b|rawmatch\b|rmatch\b|namespace\b)/im;
const ARM_SOURCE = /^\s*(?:thumb|thumbee|code16|code32|code64|processor|coprocessor)\b/im;
const MAX_INCLUDE_FILES = 64;
const MAX_FILE_LENGTH = 2 * 1024 * 1024;

function includesOf(text: string): string[] {
    return [...text.matchAll(INCLUDE_LINE)].map((match) => match[2].replace(/\\/g, '/'));
}

function resolveInclude(name: string, fromDirectory: string, includePaths: readonly string[], read: ReadFile): { file: string; text: string } | undefined {
    for (const directory of [fromDirectory, ...includePaths]) {
        const file = path.resolve(directory, name);
        const text = read(file);
        if (text !== undefined && text.length <= MAX_FILE_LENGTH) {
            return { file, text };
        }
    }
    return undefined;
}

function scanSymbols(text: string, file: string, found: Map<string, ScannedSymbol>): void {
    text.split(/\r?\n/).forEach((rawLine, index) => {
        const line = rawLine.replace(/;.*$/, '');
        const definition = /^\s*(?:macro|calminstruction)\s+([A-Za-z_][\w.]*)[?!:]*/i.exec(line);
        if (definition) {
            addSymbol(definition[1], file, index + 1, found);
        }
        const iterated = /^\s*iterate\s+<[^>]+>\s*,\s*(.+)$/i.exec(line) ?? /^\s*iterate\s+[A-Za-z_]\w*\s*,\s*(.+)$/i.exec(line);
        if (iterated && /^\s*macro\s+\w+\??/im.test(text)) {
            for (const item of iterated[1].split(',')) {
                const word = item.replace(/[<>\\]/g, '').trim();
                if (/^[A-Za-z_]{2,}$/.test(word)) {
                    addSymbol(word, file, index + 1, found);
                }
            }
        }
    });
}

function addSymbol(name: string, file: string, line: number, found: Map<string, ScannedSymbol>): void {
    const key = name.toLowerCase();
    if (!found.has(key) && !key.includes('.')) {
        found.set(key, { name, file, line });
    }
}

// Reads the source and its includes as plain text. Nothing is ever assembled or run.
export function analyzeSource(
    text: string,
    filePath: string,
    read: ReadFile,
    includePaths: readonly string[] = [],
    override: ArchitectureId | undefined = undefined
): SourceAnalysis {
    const seen = new Set<string>([path.resolve(filePath)]);
    const pending: { text: string; file: string }[] = [{ text, file: path.resolve(filePath) }];
    const scanned = new Map<string, ScannedSymbol>();
    const texts: string[] = [];
    let detected: ArchitectureId | undefined;
    let isFasmg = false;

    while (pending.length > 0 && seen.size <= MAX_INCLUDE_FILES) {
        const current = pending.shift() as { text: string; file: string };
        texts.push(current.text);
        isFasmg = isFasmg || FASMG_SOURCE.test(current.text);
        if (current.file !== path.resolve(filePath)) {
            scanSymbols(current.text, current.file, scanned);
        }

        for (const name of includesOf(current.text)) {
            const base = path.posix.basename(name);
            const match = ARCHITECTURE_INCLUDES.find(([pattern]) => pattern.test(base));
            if (match && !detected) {
                detected = match[1];
            }
            if (X86_G_INCLUDES.test(base)) {
                isFasmg = true;
                detected = detected ?? 'x86';
            }
            const resolved = resolveInclude(name, path.dirname(current.file), includePaths, read);
            if (resolved && !seen.has(resolved.file)) {
                seen.add(resolved.file);
                pending.push(resolved);
            }
        }
    }

    if (!detected && ARM_SOURCE.test(text)) {
        detected = 'arm';
    }
    if (!detected) {
        detected = isFasmg && scanned.size > 0 ? 'other' : 'x86';
    }

    const id = override ?? detected;
    const usesFasmg = isFasmg || (id !== 'x86' && id !== 'arm');
    return {
        dialect: usesFasmg ? 'fasmg' : 'fasm',
        architecture: ARCHITECTURES[id],
        scanned: id === 'x86' ? new Map() : scanned,
        combinedText: texts.join('\n')
    };
}
