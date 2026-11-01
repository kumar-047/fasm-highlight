import * as path from 'node:path';
import { ERROR, LOCATION, NOT_A_FILE } from './constants/errorPatterns';
import type { FasmError, SourceLocation } from './types/fasmError';

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
