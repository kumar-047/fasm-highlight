import * as vscode from 'vscode';

import { analyzeDocument } from '../architecture/documentAnalysis';
import { findSymbolGroup } from '../grammar/symbols';
import { formatFasmSource } from './formatter';

export class FasmFormattingProvider implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions): vscode.TextEdit[] {
        const config = vscode.workspace.getConfiguration('fasm.format');
        const analysis = analyzeDocument(document);
        const text = document.getText();
        const formatted = formatFasmSource(text, {
            indent: options.insertSpaces ? ' '.repeat(options.tabSize) : '\t',
            commentColumn: config.get<number>('commentColumn', 0),
            operandColumn: config.get<number>('operandColumn', 0),
            spaceAfterComma: config.get<boolean>('spaceAfterComma', false),
            maxBlankLines: config.get<number>('maxBlankLines', 0),
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

export function registerFormatCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('fasm.formatFile', () => vscode.commands.executeCommand('editor.action.formatDocument'));
}
