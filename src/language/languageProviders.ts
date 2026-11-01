import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { analyzeDocument } from '../architecture/documentAnalysis';
import { findSymbolGroup } from '../data/symbols';
import { resolveTargetSystem } from '../system/targetSystem';
import { formatFasmSource } from './formatter';
import { SnippetDefinition, rankSnippets, starterSnippet } from './snippetRanking';

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

export class FasmFormattingProvider implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions): vscode.TextEdit[] {
        const config = vscode.workspace.getConfiguration('fasm');
        const analysis = analyzeDocument(document);
        const text = document.getText();
        const formatted = formatFasmSource(text, {
            indent: options.insertSpaces ? ' '.repeat(options.tabSize) : '\t',
            commentColumn: config.get<number>('format.commentColumn', 0),
            isInstruction: (word) => analysis.architecture.id === 'x86'
                ? findSymbolGroup(word)?.kind === 'instruction'
                : analysis.architecture.instructions.has(word) || analysis.scanned.has(word)
        });
        if (formatted === text) {
            return [];
        }
        return [vscode.TextEdit.replace(new vscode.Range(document.positionAt(0), document.positionAt(text.length)), formatted)];
    }
}
