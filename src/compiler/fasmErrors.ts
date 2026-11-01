import * as path from 'path';

export interface SourceLocation {
    readonly file: string;
    readonly line: number;
}

export interface FasmError extends SourceLocation {
    readonly message: string;
    // Where the failing macro was used, outermost first.
    readonly usedFrom: readonly SourceLocation[];
}

// fasm prints one of these for each level of the stack, followed by a copy of the source line:
//   c.asm [5]:
//   m
//   c.asm [2] m [1]:
//    bad thing
//   processed: bad thing
//   error: illegal instruction.
const LOCATION = /^(.+?) \[(\d+)\].*:$/;
const ERROR = /^(?:custom )?error: (.+?)\.?$/i;
// fasmg also lists levels that aren't files, such as "macro x [1]:".
const NOT_A_FILE = /^(?:macro|struc|calminstruction|assemble|\?|eval) ?/i;

export function parseFasmErrors(output: string, workingDirectory: string): FasmError[] {
    const errors: FasmError[] = [];
    let stack: SourceLocation[] = [];
    let skipSourceLine = false;

    for (const line of output.split(/\r?\n/)) {
        if (skipSourceLine) {
            skipSourceLine = false;
            continue;
        }

        const location = LOCATION.exec(line);
        if (location) {
            if (!NOT_A_FILE.test(location[1])) {
                stack.push({ file: path.resolve(workingDirectory, location[1]), line: Number(location[2]) });
            }
            skipSourceLine = true;
            continue;
        }

        const error = ERROR.exec(line);
        if (error) {
            const failing = stack[stack.length - 1];
            if (failing) {
                errors.push({ ...failing, message: error[1], usedFrom: stack.slice(0, -1) });
            }
            stack = [];
        }
    }

    return errors;
}
