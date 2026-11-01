import type { TextDocument } from 'vscode';
import { createBuildPlan, inferOutput } from '../src/compiler/buildTarget';
import { defaultCompilerPath } from '../src/compiler/fasmCompiler';

function document(fileName: string, text: string, languageId = 'fasm'): TextDocument {
    return { fileName, languageId, getText: () => text } as unknown as TextDocument;
}

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

    test.each([
        ['format PE console', 'win32', true],
        ['format PE DLL', 'win32', false],
        ['format PE native', 'win32', false],
        ['format ELF executable', 'win32', false],
        ['format PE console', 'linux', false],
        ['format ELF executable', 'linux', true],
        ['format ELF', 'linux', false],
        ["format binary as ''", 'linux', false],
        ['format ELF executable', 'darwin', false],
        ['use32', 'win32', false]
    ] as const)('%s on %s: run is %s', (source, platform, canRun) => {
        expect(createBuildPlan(document('a.asm', source), platform).canRun).toBe(canRun);
    });
});

describe('defaultCompilerPath', () => {
    test('Windows uses the standard install folder', () => {
        expect(defaultCompilerPath('win32')).toBe('C:\\fasmw17335\\fasm.exe');
    });

    test.each(['linux', 'darwin', 'freebsd'] as const)('%s uses fasm from PATH', (platform) => {
        expect(defaultCompilerPath(platform)).toBe('fasm');
    });
});
