import type { Architecture, ArchitectureId } from '../types';
import instructions from './instructions.json';

function numbered(prefix: string, first: number, last: number): string[] {
    const names: string[] = [];
    for (let index = first; index <= last; index += 1) {
        names.push(`${prefix}${index}`);
    }
    return names;
}

function architecture(id: ArchitectureId, label: string, instructions: readonly string[], registers: readonly string[]): Architecture {
    return { id, label, instructions: new Set(instructions), registers: new Set(registers) };
}

export const ARCHITECTURES: Readonly<Record<ArchitectureId, Architecture>> = {
    x86: architecture('x86', 'x86 and x86-64', [], []),
    '8051': architecture('8051', '8051', instructions.i8051, ['a', 'b', 'c', 'ab', 'acc', 'dptr', ...numbered('r', 0, 7)]),
    avr: architecture('avr', 'AVR', instructions.avr, ['x', 'y', 'z', ...numbered('r', 0, 31)]),
    jvm: architecture('jvm', 'JVM bytecode', instructions.jvm, []),
    wasm: architecture('wasm', 'WebAssembly', instructions.wasm, []),
    aarch64: architecture('aarch64', 'AArch64', instructions.aarch64, [
        'sp', 'lr', 'xzr', 'wzr', 'wsp', ...numbered('x', 0, 30), ...numbered('w', 0, 30), ...numbered('v', 0, 31)
    ]),
    other: architecture('other', 'Other fasmg package', [], [])
};
