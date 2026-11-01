import * as path from 'path';
import * as vscode from 'vscode';
import { Dialect, SourceAnalysis } from '../architecture/analysis';

export interface BuildPlan {
    readonly sourcePath: string;
    readonly canBuild: boolean;
    readonly buildReason?: string;
    readonly outputPath?: string;
    readonly canRun: boolean;
    readonly runReason?: string;
}

export type OutputFormat = 'pe' | 'elf' | 'macho' | 'mz' | 'coff' | 'binary';

export interface OutputInfo {
    readonly format: OutputFormat;
    readonly extension: string;
}

const FORMAT_LINE = /^[ \t]*format[ \t]+([^;\r\n]*)/im;
const CUSTOM_EXTENSION = /\bas\s+(['"])(.*?)\1/i;
const COM_ORIGIN = /^[ \t]*org[ \t]+(?:100h|0x100|\$100|256)\b/im;

// Output names follow what fasm 1.73.35 writes when no output file is given.
export function inferOutput(sourceText: string, dialect: Dialect = 'fasm'): OutputInfo {
    const formatLine = FORMAT_LINE.exec(sourceText)?.[1] ?? '';
    const words = formatLine.toLowerCase().split(/\s+/).filter(Boolean);
    const format = outputFormat(words[0]);
    const customExtension = CUSTOM_EXTENSION.exec(formatLine);

    if (customExtension) {
        return { format, extension: customExtension[2] ? `.${customExtension[2]}` : '' };
    }

    switch (format) {
        case 'pe':
            return { format, extension: peExtension(words) };
        case 'mz':
            return { format, extension: '.exe' };
        case 'coff':
            return { format, extension: '.obj' };
        case 'elf':
            return { format, extension: words.includes('executable') || words.includes('dynamic') ? '' : '.o' };
        case 'macho':
            return { format, extension: words.includes('executable') ? '' : '.o' };
        case 'binary':
            // fasmg adds no extension of its own.
            if (dialect === 'fasmg') {
                return { format, extension: '' };
            }
            return { format, extension: COM_ORIGIN.test(sourceText) ? '.com' : '.bin' };
    }
}

function outputFormat(word: string | undefined): OutputFormat {
    switch (word) {
        case 'pe':
        case 'pe64':
            return 'pe';
        case 'mz':
            return 'mz';
        case 'elf':
        case 'elf64':
            return 'elf';
        case 'macho':
        case 'macho64':
            return 'macho';
        case 'coff':
        case 'ms':
        case 'ms64':
            return 'coff';
        default:
            return 'binary';
    }
}

function peExtension(words: readonly string[]): string {
    if (words.includes('dll')) {
        return '.dll';
    }
    if (words.includes('native')) {
        return '.sys';
    }
    if (words.some((word) => word === 'efi' || word === 'efiboot' || word === 'efiruntime')) {
        return '.efi';
    }
    return '.exe';
}

export function createBuildPlan(
    document: vscode.TextDocument,
    platform: NodeJS.Platform = process.platform,
    analysis?: SourceAnalysis
): BuildPlan {
    const sourcePath = document.fileName;
    const sourceText = analysis?.combinedText ?? document.getText();

    if (document.languageId !== 'fasm') {
        return {
            sourcePath,
            canBuild: false,
            buildReason: 'The active file is not using the FASM language mode.',
            canRun: false,
            runReason: 'Only FASM source files can be run from this extension.'
        };
    }

    if (path.extname(sourcePath).toLowerCase() === '.inc') {
        return {
            sourcePath,
            canBuild: false,
            buildReason: 'Include files (.inc) are not standalone build targets.',
            canRun: false,
            runReason: 'Include files are support files, not runnable programs.'
        };
    }

    const output = inferOutput(sourceText, analysis?.dialect);
    const outputPath = `${sourcePath.replace(/\.[^.\\/]+$/, '')}${output.extension}`;
    const architecture = analysis?.architecture.id ?? 'x86';

    if (architecture !== 'x86') {
        return {
            sourcePath,
            canBuild: true,
            outputPath,
            canRun: false,
            runReason: `Build succeeded. ${analysis?.architecture.label} output needs its own device, simulator or runtime.`
        };
    }

    if (!isRunnable(output, platform)) {
        return {
            sourcePath,
            canBuild: true,
            outputPath,
            canRun: false,
            runReason: `Build succeeded, but ${path.basename(outputPath)} can't be run directly on ${platform}.`
        };
    }

    return { sourcePath, canBuild: true, outputPath, canRun: true };
}

function isRunnable(output: OutputInfo, platform: NodeJS.Platform): boolean {
    switch (platform) {
        case 'win32':
            return output.extension === '.exe';
        case 'linux':
            return output.format === 'elf' && output.extension === '';
        case 'darwin':
            return output.format === 'macho' && output.extension === '';
        default:
            return false;
    }
}
