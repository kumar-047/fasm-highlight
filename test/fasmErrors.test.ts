import * as path from 'node:path';
import { parseFasmErrors } from '../src/compiler/fasmErrors';

const DIR = path.resolve('project');
const inDir = (file: string) => path.join(DIR, file);

// These outputs were recorded from fasm 1.73.35.
describe('parseFasmErrors', () => {
    test('an error in the main file', () => {
        const output = 'flat assembler  version 1.73.35  (1048576 kilobytes memory)\r\na.asm [2]:\r\nfoo bar\r\nprocessed: foo bar\r\nerror: illegal instruction.\r\n';
        expect(parseFasmErrors(output, DIR)).toEqual([
            { file: inDir('a.asm'), line: 2, message: 'illegal instruction', usedFrom: [] }
        ]);
    });

    test('an error in an include file points to that file', () => {
        const output = 'z.inc [3]:\nbad thing\nprocessed: bad thing\nerror: illegal instruction.\n';
        expect(parseFasmErrors(output, DIR)[0]).toMatchObject({ file: inDir('z.inc'), line: 3 });
    });

    test('an error inside a macro points to the macro, and remembers where it was used', () => {
        const output = 'c.asm [5]:\nm\nc.asm [2] m [1]:\n bad thing\nprocessed: bad thing\nerror: illegal instruction.\n';
        expect(parseFasmErrors(output, DIR)).toEqual([
            { file: inDir('c.asm'), line: 2, message: 'illegal instruction', usedFrom: [{ file: inDir('c.asm'), line: 5 }] }
        ]);
    });

    test('nested macros keep the whole chain', () => {
        const output = 'd.asm [5]:\nouter\nd.asm [3] outer [1]:\n inner\nd.asm [1] inner [0]:\nmacro inner { bad thing }\nprocessed: bad thing\nerror: illegal instruction.\n';
        const [error] = parseFasmErrors(output, DIR);
        expect(error.line).toBe(1);
        expect(error.usedFrom.map((location) => location.line)).toEqual([5, 3]);
    });

    test('an error with no processed line', () => {
        const output = 'e.asm [2]:\ninclude "missing.inc"\nerror: file not found.\n';
        expect(parseFasmErrors(output, DIR)[0]).toMatchObject({ line: 2, message: 'file not found' });
    });

    test('messages with quotes are kept whole', () => {
        const output = "f.asm [1]:\nx = y\nprocessed: x=y\nerror: undefined symbol 'y'.\n";
        expect(parseFasmErrors(output, DIR)[0].message).toBe("undefined symbol 'y'");
    });

    test('paths with spaces work', () => {
        const output = 'sp ace/g h.asm [1]:\nbad thing\nprocessed: bad thing\nerror: illegal instruction.\n';
        expect(parseFasmErrors(output, DIR)[0].file).toBe(path.join(DIR, 'sp ace', 'g h.asm'));
    });

    test('a source line that looks like a location is not treated as one', () => {
        const output = 'a.asm [1]:\nb [2]:\nerror: illegal instruction.\n';
        expect(parseFasmErrors(output, DIR)[0]).toMatchObject({ file: inDir('a.asm'), line: 1, usedFrom: [] });
    });

    test('display output before the error is ignored', () => {
        const output = 'hi\ni.asm [2]:\nerr\nprocessed: err\nerror: error directive encountered in source file.\n';
        expect(parseFasmErrors(output, DIR)).toHaveLength(1);
    });

    test('several errors are all reported', () => {
        const output = 'a.asm [1]:\nx\nerror: one.\na.asm [2]:\ny\nerror: two.\n';
        expect(parseFasmErrors(output, DIR).map((error) => error.message)).toEqual(['one', 'two']);
    });

    test('a successful build has no errors', () => {
        expect(parseFasmErrors('flat assembler\n1 passes, 8 bytes.\n', DIR)).toEqual([]);
    });
});
