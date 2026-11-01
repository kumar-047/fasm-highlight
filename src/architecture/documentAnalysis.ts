import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ArchitectureId, SourceAnalysis, analyzeSource } from './analysis';

const cache = new Map<string, { version: number; analysis: SourceAnalysis }>();

function readTextFile(filePath: string): string | undefined {
    try {
        return fs.readFileSync(filePath, 'latin1');
    } catch {
        return undefined;
    }
}

export function includePaths(): string[] {
    return (process.env.INCLUDE ?? '').split(path.delimiter).filter(Boolean);
}

export function analyzeDocument(document: vscode.TextDocument): SourceAnalysis {
    const key = document.uri.toString();
    const cached = cache.get(key);
    if (cached && cached.version === document.version) {
        return cached.analysis;
    }

    const setting = vscode.workspace.getConfiguration('fasm').get<string>('architecture', 'auto');
    const override = setting === 'auto' ? undefined : (setting as ArchitectureId);
    const analysis = analyzeSource(document.getText(), document.fileName, readTextFile, includePaths(), override);
    cache.set(key, { version: document.version, analysis });
    return analysis;
}

export function clearAnalysisCache(): void {
    cache.clear();
}
