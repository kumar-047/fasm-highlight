import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import * as vscode from 'vscode';

import { analyzeDocument } from '../architecture/documentAnalysis';
import { resolveTargetSystem } from '../system/targetSystem';
import { rankSnippets } from './snippetRanking';
import type { SnippetDefinition } from './types';

export function loadSnippets(extensionPath: string): SnippetDefinition[] {
    const file = path.join(extensionPath, 'snippets', 'fasm.json');
    return Object.values(JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, SnippetDefinition>);
}

export class FasmSnippetProvider implements vscode.CompletionItemProvider {
    constructor(private readonly snippets: readonly SnippetDefinition[]) {}

    provideCompletionItems(document: vscode.TextDocument): vscode.CompletionItem[] {
        const analysis = analyzeDocument(document);
        if (analysis.architecture.id !== 'x86') {
            return [];
        }

        const setting = vscode.workspace.getConfiguration('fasm').get<string>('targetSystem', 'auto');
        const target = resolveTargetSystem(analysis.combinedText, setting, process.platform);
        return rankSnippets(this.snippets, target.system).map((snippet) => {
            const item = new vscode.CompletionItem(snippet.prefix, vscode.CompletionItemKind.Snippet);
            item.insertText = new vscode.SnippetString(snippet.body.join('\n'));
            item.detail = snippet.description;
            item.sortText = snippet.sortText;
            item.documentation = new vscode.MarkdownString().appendCodeblock(snippet.body.join('\n'), 'fasm');
            return item;
        });
    }
}
