import * as fs from 'node:fs';
import * as path from 'node:path';

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'language-configuration.json'), 'utf8'));
const start = new RegExp(config.folding.markers.start);
const end = new RegExp(config.folding.markers.end);

// Pairs markers the way the editor does: each end closes the most recent open start.
function foldedLines(source: string): string[] {
    const lines = source.split('\n');
    const open: number[] = [];
    const folded: string[] = [];
    lines.forEach((line, index) => {
        if (end.test(line)) {
            const opener = open.pop();
            if (opener !== undefined) {
                folded.push(`${lines[opener].trim()} ... ${line.trim()}`);
            }
        } else if (start.test(line)) {
            open.push(index);
        }
    });
    expect(open).toEqual([]);
    return folded;
}

describe('folding', () => {
    test.each([
        ['if x\nnop\nend if', 'if x ... end if'],
        ['while x\nnop\nend while', 'while x ... end while'],
        ['repeat 3\nnop\nend repeat', 'repeat 3 ... end repeat'],
        ['virtual at 0\nx db 0\nend virtual', 'virtual at 0 ... end virtual'],
        ['data import\nnop\nend data', 'data import ... end data'],
        ['proc foo\nret\nendp', 'proc foo ... endp'],
        ['struct POINT\nx dd ?\nends', 'struct POINT ... ends'],
        ['macro m {\nnop\n}', 'macro m { ... }'],
        ['macro m\n{\nnop\n}', '{ ... }'],
        ['rept 3 {\nnop\n}', 'rept 3 { ... }'],
        ['irp x, 1,2 { ; loop\nnop\n}', 'irp x, 1,2 { ; loop ... }'],
        ['label: if x\nnop\nend if', 'label: if x ... end if']
    ])('%s', (source, expected) => {
        expect(foldedLines(source)).toEqual([expected]);
    });

    test('nested blocks pair correctly', () => {
        expect(foldedLines('if a\nwhile b\nnop\nend while\nend if')).toEqual(['while b ... end while', 'if a ... end if']);
    });

    test.each([
        'macro m { xor eax,eax }',
        'data dd 0',
        'data: nop',
        'data = 1',
        'if_ready: nop',
        'iffy dd 0',
        '; if this is a comment',
        "msg db '{'",
        'endpoint dd 0',
        'else if x'
    ])('%s does not start a fold', (line) => {
        expect(start.test(line)).toBe(false);
    });
});
