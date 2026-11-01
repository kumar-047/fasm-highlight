import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import type * as vscode from 'vscode';

import { analyzeSource } from './analysis';
import type { SourceAnalysis } from './types';

const cache = new Map<string, { version: number; analysis: SourceAnalysis }>();

function readTextFile(filePath: string): string | undefined {
    try {
        return fs.readFileSync(filePath, 'latin1');
    } catch {
        return undefined;
    }
}

function includePaths(): string[] {
    return (process.env.INCLUDE ?? '').split(path.delimiter).filter(Boolean);
}

export function analyzeDocument(document: vscode.TextDocument): SourceAnalysis {
    const key = document.uri.toString();
    const cached = cache.get(key);
    if (cached && cached.version === document.version) {
        return cached.analysis;
    }

    const analysis = analyzeSource(document.getText(), document.fileName, readTextFile, includePaths());
    cache.set(key, { version: document.version, analysis });
    return analysis;
}
