import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { MANUAL_SECTIONS } from '../src/manual/constants/sections';

const PDF_PATH = path.join(__dirname, '..', 'FASM.pdf');

function readManualHeadings(): string[] | undefined {
    if (!fs.existsSync(PDF_PATH)) {
        return undefined;
    }
    const result = spawnSync('pdftotext', ['-layout', PDF_PATH, '-'], { encoding: 'latin1', maxBuffer: 32 * 1024 * 1024 });
    if (result.error || result.status !== 0) {
        return undefined;
    }
    // Chapter 3 of the PDF is the separate "Windows programming" article, so hover links can't point to it.
    return [...result.stdout.matchAll(/^\s*([12]\.\d(?:\.\d+)?)\s+[A-Z]/gm)].map((match) => match[1]);
}

const headings = readManualHeadings();

// FASM.pdf is kept locally and pdftotext is optional, so this check only runs where both are present.
(headings ? test : test.skip)('the section list matches the headings in FASM.pdf', () => {
    expect([...new Set(headings)].sort()).toEqual([...MANUAL_SECTIONS].sort());
});

test('section numbers are unique', () => {
    expect(MANUAL_SECTIONS).toHaveLength(new Set(MANUAL_SECTIONS).size);
});
