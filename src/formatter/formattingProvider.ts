import * as vscode from 'vscode';
import { analyzeDocument } from '../architecture/documentAnalysis';
import { findSymbolGroup } from '../grammar/symbols';
import { formatFasmSource } from './formatter';

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
