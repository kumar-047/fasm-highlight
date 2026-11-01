import type { Architecture, ArchitectureId } from '../types';
import instructions from './instructions.json';

function numbered(prefix: string, first: number, last: number): string[] {
    const names: string[] = [];
    for (let index = first; index <= last; index += 1) {
        names.push(`${prefix}${index}`);
    }
    return names;
}

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
    '8051': architecture('8051', '8051', instructions.i8051, ['a', 'b', 'c', 'ab', 'acc', 'dptr', ...numbered('r', 0, 7)]),
    avr: architecture('avr', 'AVR', instructions.avr, ['x', 'y', 'z', ...numbered('r', 0, 31)]),
    jvm: architecture('jvm', 'JVM bytecode', instructions.jvm, []),
    wasm: architecture('wasm', 'WebAssembly', instructions.wasm, []),
    aarch64: architecture('aarch64', 'AArch64', instructions.aarch64, [
        'sp', 'lr', 'xzr', 'wzr', 'wsp', ...numbered('x', 0, 30), ...numbered('w', 0, 30), ...numbered('v', 0, 31)
    ]),
    arm: architecture('arm', 'ARM (FASMARM)', ARM_INSTRUCTIONS, [
        ...numbered('r', 0, 15), ...numbered('a', 1, 4), ...numbered('v', 1, 8), 'sb', 'sl', 'fp', 'ip', 'sp', 'lr', 'pc',
        ...numbered('x', 0, 30), ...numbered('w', 0, 30), 'wsp', 'xzr', 'wzr'
    ]),
    other: architecture('other', 'Other fasmg package', [], [])
};
