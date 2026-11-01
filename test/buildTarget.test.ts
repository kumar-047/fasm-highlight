import type { TextDocument } from 'vscode';

import { createBuildPlan, inferOutput } from '../src/build/buildTarget';
import { buildCompilerCommand, detectCompilerKind } from '../src/compiler/compilerCommand';
import { defaultCompilerPath } from '../src/compiler/fasmCompiler';
import * as path from 'node:path';

function document(fileName: string, text: string, languageId = 'fasm'): TextDocument {
    return { fileName, languageId, getText: () => text } as unknown as TextDocument;
}

const OPTIONS = { memoryLimit: 65536, passesLimit: 100 };

describe('inferOutput', () => {
    // Each pair was recorded from fasm 1.73.35.
    test.each([
        ['format PE', '.exe'],
        ['format PE console', '.exe'],
        ['format PE64 GUI', '.exe'],
        ['format PE WDM', '.exe'],
        ['FORMAT pe', '.exe'],
        ['format PE DLL', '.dll'],
        ['format PE64 DLL', '.dll'],
        ['format PE GUI 4.0 DLL', '.dll'],
        ['format PE native', '.sys'],
        ['format PE EFI', '.efi'],
        ['format PE64 EFI', '.efi'],
        ['format PE efiboot', '.efi'],
        ['format PE efiruntime', '.efi'],
        ['format MZ', '.exe'],
        ['format COFF', '.obj'],
        ['format MS COFF', '.obj'],
        ['format MS64 COFF', '.obj'],
        ['format ELF', '.o'],
        ['format ELF64', '.o'],
        ['format ELF executable', ''],
        ['format ELF executable 3', ''],
        ['format ELF64 executable', ''],
        ['format ELF64 executable 3 at 400000h', ''],
        ['format ELF dynamic', ''],
        ['format binary', '.bin'],
        ['use32', '.bin'],
        ['org 100h', '.com'],
        ["format binary as 'com'", '.com'],
        ["format binary as ''", ''],
        ["format PE as 'scr'", '.scr'],
        ["format PE DLL as 'cpl'", '.cpl'],
        ["format MZ as 'x'", '.x'],
        ["format ELF as 'obj'", '.obj']
    ])('%s writes "%s"', (source, extension) => {
        expect(inferOutput(`${source}\nnop\n`).extension).toBe(extension);
    });

    test('comments are ignored', () => {
        expect(inferOutput('; format ELF\nformat PE ; not DLL\n').extension).toBe('.exe');
    });
});

describe('createBuildPlan', () => {
    test('files in another language cannot be built', () => {
        expect(createBuildPlan(document('a.asm', 'format PE', 'nasm')).canBuild).toBe(false);
    });

    test('include files cannot be built', () => {
        expect(createBuildPlan(document('a.inc', 'format PE')).canBuild).toBe(false);
    });

    test('the output path sits beside the source', () => {
        expect(createBuildPlan(document('a.asm', 'format PE DLL')).outputPath).toBe('a.dll');
        expect(createBuildPlan(document('a.asm', 'format ELF64 executable')).outputPath).toBe('a');
    });

    test('dots in folder names are kept', () => {
        expect(createBuildPlan(document('my.dir/prog', 'format PE')).outputPath).toBe('my.dir/prog.exe');
    });
});

describe('the one compiler path', () => {
    test.each([
        ['C:\\fasmw17335\\fasm.exe', 'fasm'],
        ['/usr/bin/fasm', 'fasm'],
        ['D:\\tools\\FASMG.EXE', 'fasmg'],
        ['/opt/fasmg.x64', 'fasmg'],
        ['D:\\fasm2\\fasm2.cmd', 'fasm2'],
        ['/opt/fasm2/fasm2', 'fasm2']
    ])('%s is %s', (compilerPath, kind) => {
        expect(detectCompilerKind(compilerPath)).toBe(kind);
    });

    test('fasm 1 uses its own options', () => {
        expect(buildCompilerCommand('fasm', 'a.asm', { ...OPTIONS, symbolsPath: 'a.fas' }, 'linux').args)
            .toEqual(['a.asm', '-m', '65536', '-p', '100', '-s', 'a.fas']);
    });

    test('fasmg gets no -m or -s', () => {
        expect(buildCompilerCommand('fasmg', 'a.asm', { ...OPTIONS, symbolsPath: 'a.fas' }, 'linux').args).toEqual(['a.asm', '-e100', '-p100']);
    });

    test('fasm 2 runs fasmg with its include', () => {
        const command = buildCompilerCommand(path.join('tools', 'fasm2.cmd'), 'a.asm', OPTIONS, 'win32');
        expect(command.command).toBe(path.join('tools', 'fasmg.exe'));
        expect(command.args).toContain("-iInclude('fasm2.inc')");
        expect(command.includePaths).toEqual([path.join('tools', 'include')]);
    });

    test('fasm 2 on Linux uses the 64-bit fasmg', () => {
        expect(buildCompilerCommand(path.join('t', 'fasm2'), 'a.asm', OPTIONS, 'linux').command).toBe(path.join('t', 'fasmg.x64'));
    });

    test('Windows defaults to the standard install folder', () => {
        expect(defaultCompilerPath('win32')).toBe('C:\\fasmw17335\\fasm.exe');
    });

    test.each(['linux', 'darwin', 'freebsd'] as const)('%s defaults to fasm from PATH', (platform) => {
        expect(defaultCompilerPath(platform)).toBe('fasm');
    });
});
