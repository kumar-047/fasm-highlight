import * as path from 'node:path';
import { buildCompilerCommand, chooseCompilerKind, executableNames } from '../src/compiler/compilerCommand';
import { findExecutable, parseCompilerVersion } from '../src/compiler/compilerManager';
import { COMPILER_KINDS } from '../src/compiler/constants/compilers';
import { parseFasmErrors } from '../src/compiler/fasmErrors';
import type { DiscoveryEnvironment } from '../src/compiler/types';

const OPTIONS = { memoryLimit: 65536, passesLimit: 100 };

describe('choosing a compiler', () => {
    test.each([
        ['auto', 'fasm', 'x86', 'fasm'],
        ['auto', 'fasmg', 'x86', 'fasmg'],
        ['auto', 'fasmg', 'avr', 'fasmg'],
        ['auto', 'fasm', 'arm', 'fasmarm'],
        ['fasm2', 'fasm', 'x86', 'fasm2'],
        ['fasm', 'fasmg', 'avr', 'fasm']
    ] as const)('setting %s, %s syntax, %s: %s', (setting, dialect, architecture, kind) => {
        expect(chooseCompilerKind(setting, dialect, architecture)).toBe(kind);
    });
});

describe('compiler commands', () => {
    test('fasm 1 uses its own options', () => {
        expect(buildCompilerCommand('fasm', 'fasm', 'a.asm', { ...OPTIONS, symbolsPath: 'a.fas' }, 'linux').args)
            .toEqual(['a.asm', '-m', '65536', '-p', '100', '-s', 'a.fas']);
    });

    test('fasmg gets no -m or -s', () => {
        const { args } = buildCompilerCommand('fasmg', 'fasmg', 'a.asm', { ...OPTIONS, symbolsPath: 'a.fas' }, 'linux');
        expect(args).toEqual(['a.asm', '-e100', '-p100']);
    });

    test('fasm 2 runs fasmg with its include', () => {
        const command = buildCompilerCommand('fasm2', path.join('tools', 'fasm2.cmd'), 'a.asm', OPTIONS, 'win32');
        expect(command.command).toBe(path.join('tools', 'fasmg.exe'));
        expect(command.args).toContain("-iInclude('fasm2.inc')");
        expect(command.includePaths).toEqual([path.join('tools', 'include')]);
    });

    test('fasm 2 on Linux uses the 64-bit fasmg', () => {
        expect(buildCompilerCommand('fasm2', path.join('t', 'fasm2'), 'a.asm', OPTIONS, 'linux').command).toBe(path.join('t', 'fasmg.x64'));
    });

    test('FASMARM uses fasm 1 options', () => {
        expect(buildCompilerCommand('fasmarm', 'fasmarm', 'a.asm', OPTIONS, 'linux').args).toContain('-m');
    });
});

describe('finding compilers', () => {
    const windows: DiscoveryEnvironment = {
        platform: 'win32',
        pathVariable: 'C:\\tools;C:\\other',
        extraDirectories: ['C:\\fasmw17335'],
        exists: (file) => file === 'C:\\other\\fasmg.exe' || file === 'C:\\fasmw17335\\fasm.exe'
    };

    test('it searches PATH', () => {
        expect(findExecutable('fasmg', windows)).toBe('C:\\other\\fasmg.exe');
    });

    test('it searches known folders', () => {
        expect(findExecutable('fasm', windows)).toBe('C:\\fasmw17335\\fasm.exe');
    });

    test('a missing compiler is undefined', () => {
        expect(findExecutable('fasm2', windows)).toBeUndefined();
    });

    test('Linux uses forward slashes and : between folders', () => {
        const linux: DiscoveryEnvironment = { platform: 'linux', pathVariable: '/a:/b', extraDirectories: [], exists: (file) => file === '/b/fasm' };
        expect(findExecutable('fasm', linux)).toBe('/b/fasm');
    });

    test('every compiler has names on every system', () => {
        for (const kind of COMPILER_KINDS) {
            for (const platform of ['win32', 'linux', 'darwin'] as const) {
                expect(executableNames(kind, platform).length).toBeGreaterThan(0);
            }
        }
    });

    test.each([
        ['flat assembler  version 1.73.35\nusage: fasm', '1.73.35'],
        ['flat assembler  version g.l8vn\nUsage: fasmg', 'g.l8vn'],
        ['nothing useful', undefined]
    ])('version from %j', (output, version) => {
        expect(parseCompilerVersion(output)).toBe(version);
    });
});

describe('fasmg errors', () => {
    const DIR = path.resolve('project');

    // Recorded from fasmg g.l8vn.
    test('an error in a macro points to the file line, because macro levels are not files', () => {
        const output = 'flat assembler  version g.l8vn\ne2.asm [4]:\n\tx\nmacro x [1]:\n\tdb 1,\nProcessed: db 1,\nError: missing argument.\n';
        expect(parseFasmErrors(output, DIR)).toEqual([
            { file: path.join(DIR, 'e2.asm'), line: 4, message: 'missing argument', usedFrom: [] }
        ]);
    });

    test('several errors in one run', () => {
        const output = 'a.asm [1]:\n\tx\nError: one.\na.asm [2]:\n\ty\nError: two.\n';
        expect(parseFasmErrors(output, DIR).map((error) => error.line)).toEqual([1, 2]);
    });

    test('custom errors', () => {
        expect(parseFasmErrors("a.asm [1]:\n\terr 'x'\nCustom error: x.\n", DIR)[0].message).toBe('x');
    });
});
