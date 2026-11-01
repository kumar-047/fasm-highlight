import * as path from 'node:path';
import * as vscode from 'vscode';

import { analyzeDocument } from '../architecture/documentAnalysis';
import type { FasmCompiler } from '../compiler/fasmCompiler';
import type { FasmError } from '../compiler/types/fasmError';
import { createBuildPlan } from './buildTarget';

export function registerBuildCommand(
    outputChannel: vscode.OutputChannel,
    compiler: FasmCompiler,
    diagnostics: vscode.DiagnosticCollection
): vscode.Disposable {
    return vscode.commands.registerCommand('fasm.build', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            void vscode.window.showErrorMessage('No active editor');
            return;
        }

        await editor.document.save();

        const buildPlan = createBuildPlan(editor.document, analyzeDocument(editor.document));
        if (!buildPlan.canBuild) {
            void vscode.window.showErrorMessage(buildPlan.buildReason ?? 'This file cannot be built.');
            return;
        }

        outputChannel.show(true);
        outputChannel.appendLine(`Building ${path.basename(buildPlan.sourcePath)}...`);
        outputChannel.appendLine('');

        diagnostics.clear();
        const result = await compiler.compile(buildPlan.sourcePath);
        showDiagnostics(diagnostics, result.errors);

        if (!result.success) {
            void vscode.window.showErrorMessage('Build failed. Check the Problems panel for details.');
        } else if (buildPlan.outputPath) {
            void vscode.window.showInformationMessage(`Build successful: ${path.basename(buildPlan.outputPath)}`);
        }
    });
}

function showDiagnostics(collection: vscode.DiagnosticCollection, errors: readonly FasmError[]): void {
    const byFile = new Map<string, vscode.Diagnostic[]>();
    for (const error of errors) {
        const diagnostic = new vscode.Diagnostic(lineRange(error.line), error.message, vscode.DiagnosticSeverity.Error);
        diagnostic.source = 'fasm';
        diagnostic.relatedInformation = error.usedFrom.map((location) => new vscode.DiagnosticRelatedInformation(
            new vscode.Location(vscode.Uri.file(location.file), lineRange(location.line)),
            'Used here'
        ));
        byFile.set(error.file, [...(byFile.get(error.file) ?? []), diagnostic]);
    }

    for (const [file, diagnostics] of byFile) {
        collection.set(vscode.Uri.file(file), diagnostics);
    }
}

function lineRange(line: number): vscode.Range {
    const index = Math.max(line - 1, 0);
    return new vscode.Range(index, 0, index, Number.MAX_SAFE_INTEGER);
}
