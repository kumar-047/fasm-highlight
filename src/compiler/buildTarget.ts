import * as path from 'path';
import * as vscode from 'vscode';

export interface BuildPlan {
    readonly sourcePath: string;
    readonly canBuild: boolean;
    readonly buildReason?: string;
    readonly outputPath?: string;
    readonly canRun: boolean;
    readonly runReason?: string;
}

export function createBuildPlan(document: vscode.TextDocument): BuildPlan {
    const sourcePath = document.fileName;
    const extension = path.extname(sourcePath).toLowerCase();
    const outputPath = inferOutputPath(sourcePath, document.getText());

    if (document.languageId !== 'fasm') {
        return {
            sourcePath,
            canBuild: false,
            buildReason: 'The active file is not using the FASM language mode.',
            canRun: false,
            runReason: 'Only FASM source files can be run from this extension.'
        };
    }

    if (extension === '.inc') {
        return {
            sourcePath,
            canBuild: false,
            buildReason: 'Include files (.inc) are not standalone build targets.',
            outputPath,
            canRun: false,
            runReason: 'Include files are support files, not runnable programs.'
        };
    }

    if (!outputPath) {
        return {
            sourcePath,
            canBuild: true,
            canRun: false,
            runReason: 'Build succeeded, but the extension could not infer a runnable output path from the source format.'
        };
    }

    if (!isRunnableOnCurrentPlatform(outputPath)) {
        return {
            sourcePath,
            canBuild: true,
            outputPath,
            canRun: false,
            runReason: `Build succeeded, but ${path.basename(outputPath)} is not a runnable format on ${process.platform}.`
        };
    }

    return {
        sourcePath,
        canBuild: true,
        outputPath,
        canRun: true
    };
}

type OutputFormat = 'pe' | 'elf' | 'macho' | 'mz' | 'coff' | 'binary' | 'unknown';

function inferOutputPath(sourcePath: string, sourceText: string): string | undefined {
    const basePath = sourcePath.replace(/\.[^.]+$/, '');
    const format = detectFormat(sourceText);

    switch (format) {
        case 'pe':
        case 'mz':
            return `${basePath}.exe`;
        case 'elf':
        case 'macho':
            return basePath;
        case 'coff':
            return process.platform === 'win32' ? `${basePath}.obj` : `${basePath}.o`;
        case 'binary':
        case 'unknown':
            return undefined;
    }
}

function detectFormat(sourceText: string): OutputFormat {
    if (hasFormatDirective(sourceText, 'PE') || hasFormatDirective(sourceText, 'PE64')) {
        return 'pe';
    }
    if (hasFormatDirective(sourceText, 'MZ')) {
        return 'mz';
    }
    if (hasFormatDirective(sourceText, 'ELF') || hasFormatDirective(sourceText, 'ELF32') || hasFormatDirective(sourceText, 'ELF64')) {
        return 'elf';
    }
    if (hasFormatDirective(sourceText, 'MACHO') || hasFormatDirective(sourceText, 'MACHO64')) {
        return 'macho';
    }
    if (hasFormatDirective(sourceText, 'COFF') || hasFormatDirective(sourceText, 'MS COFF') || hasFormatDirective(sourceText, 'MS64 COFF')) {
        return 'coff';
    }
    if (hasFormatDirective(sourceText, 'binary')) {
        return 'binary';
    }
    return 'unknown';
}

function hasFormatDirective(sourceText: string, formatName: string): boolean {
    const escaped = formatName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^\\s*format\\s+${escaped}\\b`, 'im').test(sourceText);
}

function isRunnableOnCurrentPlatform(outputPath: string): boolean {
    const extension = path.extname(outputPath).toLowerCase();

    // Object files are never directly runnable
    if (extension === '.obj' || extension === '.o') {
        return false;
    }

    if (process.platform === 'win32') {
        return extension === '.exe';
    }

    if (process.platform === 'linux' || process.platform === 'darwin') {
        return extension === '';
    }

    return false;
}
