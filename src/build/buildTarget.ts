import * as path from 'node:path';
import type * as vscode from 'vscode';

import type { Dialect, SourceAnalysis } from '../architecture/types';
import { COM_ORIGIN, CUSTOM_EXTENSION, FORMAT_LINE } from './constants/formatPatterns';
import type { BuildPlan, OutputFormat, OutputInfo } from './types';

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

export function createBuildPlan(document: vscode.TextDocument, analysis?: SourceAnalysis): BuildPlan {
    const sourcePath = document.fileName;

    if (document.languageId !== 'fasm') {
        return { sourcePath, canBuild: false, buildReason: 'The active file is not using the FASM language mode.' };
    }

    if (path.extname(sourcePath).toLowerCase() === '.inc') {
        return { sourcePath, canBuild: false, buildReason: 'Include files (.inc) are not standalone build targets.' };
    }

    const output = inferOutput(analysis?.combinedText ?? document.getText(), analysis?.dialect);
    return { sourcePath, canBuild: true, outputPath: `${sourcePath.replace(/\.[^.\\/]+$/, '')}${output.extension}` };
}
