import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import * as vscode from 'vscode';
import { analyzeDocument } from '../architecture/documentAnalysis';
import { resolveTargetSystem } from '../system/targetSystem';
import { rankSnippets, starterSnippet } from './snippetRanking';
import type { SnippetDefinition } from './types';

export function loadSnippets(extensionPath: string): SnippetDefinition[] {
    const file = path.join(extensionPath, 'snippets', 'fasm.json');
    return Object.values(JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, SnippetDefinition>);
}

export function targetFor(document: vscode.TextDocument) {
    const setting = vscode.workspace.getConfiguration('fasm').get<string>('targetSystem', 'auto');
    return resolveTargetSystem(analyzeDocument(document).combinedText, setting, process.platform);
}

export class FasmSnippetProvider implements vscode.CompletionItemProvider {
    constructor(private readonly snippets: readonly SnippetDefinition[]) {}

    provideCompletionItems(document: vscode.TextDocument): vscode.CompletionItem[] {
        if (analyzeDocument(document).architecture.id !== 'x86') {
            return [];
        }
        return rankSnippets(this.snippets, targetFor(document).system).map((snippet) => {
            const item = new vscode.CompletionItem(snippet.prefix, vscode.CompletionItemKind.Snippet);
            item.insertText = new vscode.SnippetString(snippet.body.join('\n'));
            item.detail = snippet.description;
            item.sortText = snippet.sortText;
            item.documentation = new vscode.MarkdownString().appendCodeblock(snippet.body.join('\n'), 'fasm');
            return item;
        });
    }
}

export async function insertStarter(snippets: readonly SnippetDefinition[]): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'fasm') {
        void vscode.window.showInformationMessage('Open a FASM file first.');
        return;
    }
    const starter = starterSnippet(snippets, targetFor(editor.document).system);
    if (starter) {
        await editor.insertSnippet(new vscode.SnippetString(starter.body.join('\n')));
    }
}
