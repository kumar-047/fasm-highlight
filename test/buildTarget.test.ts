import type { TextDocument } from 'vscode';
import { createBuildPlan } from '../src/compiler/buildTarget';
import { defaultCompilerPath } from '../src/compiler/fasmCompiler';

function document(fileName: string, text: string, languageId = 'fasm'): TextDocument {
    return { fileName, languageId, getText: () => text } as unknown as TextDocument;
}

describe('createBuildPlan', () => {
    test('files in another language cannot be built', () => {
        expect(createBuildPlan(document('a.asm', 'format PE', 'nasm')).canBuild).toBe(false);
    });

    test('include files cannot be built', () => {
        expect(createBuildPlan(document('a.inc', 'format PE')).canBuild).toBe(false);
    });

    test('PE output is an exe', () => {
        expect(createBuildPlan(document('a.asm', 'format PE console')).outputPath).toBe('a.exe');
        expect(createBuildPlan(document('a.asm', 'format PE64 GUI')).outputPath).toBe('a.exe');
    });

    test('MZ output is an exe', () => {
        expect(createBuildPlan(document('a.asm', 'format MZ')).outputPath).toBe('a.exe');
    });

    test('ELF executables have no extension', () => {
        expect(createBuildPlan(document('a.asm', 'format ELF64 executable')).outputPath).toBe('a');
    });

    test('a file with no format can be built but not run', () => {
        const plan = createBuildPlan(document('a.asm', 'use32'));
        expect(plan.canBuild).toBe(true);
        expect(plan.canRun).toBe(false);
    });

    // fasm 1.73.35 writes these names. The extension still expects something else; see docs/CHANGE_LIST.md.
    test.todo('format PE DLL should expect a.dll');
    test.todo('format PE native should expect a.sys');
    test.todo('format PE EFI should expect a.efi');
    test.todo('format ELF and ELF64 objects should expect a.o');
    test.todo('format COFF should expect a.obj on every system');
    test.todo('format binary should expect a.bin, or the extension given with as');
});

describe('defaultCompilerPath', () => {
    test('Windows uses the standard install folder', () => {
        expect(defaultCompilerPath('win32')).toBe('C:\\fasmw17335\\fasm.exe');
    });

    test.each(['linux', 'darwin', 'freebsd'] as const)('%s uses fasm from PATH', (platform) => {
        expect(defaultCompilerPath(platform)).toBe('fasm');
    });
});
