import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { analyzeDocument } from '../architecture/documentAnalysis';
import { BuildPlan, createBuildPlan } from '../compiler/buildTarget';
import { chooseCompilerKind } from '../compiler/compilerKinds';
import { FasmCompiler } from '../compiler/fasmCompiler';
import { FasmError } from '../compiler/fasmErrors';
import { ProgramRunner } from '../run/programRunner';

export interface BuildServices {
    readonly outputChannel: vscode.OutputChannel;
    readonly compiler: FasmCompiler;
    readonly diagnostics: vscode.DiagnosticCollection;
    readonly runner: ProgramRunner;
}

export function registerBuildCommands(services: BuildServices): vscode.Disposable[] {
    return [
        vscode.commands.registerCommand('fasm.build', async () => {
            const buildPlan = await buildActiveFile(services);
            if (buildPlan?.outputPath) {
                vscode.window.showInformationMessage(`Build successful: ${path.basename(buildPlan.outputPath)}`);
            }
        }),
        vscode.commands.registerCommand('fasm.buildAndRun', async () => {
            const buildPlan = await buildActiveFile(services);
            if (buildPlan) {
                runBuildOutput(buildPlan, services);
            }
        }),
        vscode.commands.registerCommand('fasm.stop', async () => {
            const stopped = await services.runner.stop();
            if (!stopped) {
                vscode.window.showInformationMessage('No FASM program is running.');
            }
        })
    ];
}

async function buildActiveFile(services: BuildServices): Promise<BuildPlan | undefined> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return undefined;
    }

    const document = editor.document;
    await document.save();

    const analysis = analyzeDocument(document);
    const buildPlan = createBuildPlan(document, process.platform, analysis);
    if (!buildPlan.canBuild) {
        vscode.window.showErrorMessage(buildPlan.buildReason ?? 'This file cannot be built.');
        return undefined;
    }

    showBuildHeader(services.outputChannel, buildPlan.sourcePath, buildPlan.outputPath);

    services.diagnostics.clear();
    const assembler = vscode.workspace.getConfiguration('fasm').get<string>('assembler', 'auto');
    const kind = chooseCompilerKind(assembler, analysis.dialect, analysis.architecture.id);
    const result = await services.compiler.compile(buildPlan.sourcePath, kind);
    showDiagnostics(services.diagnostics, result.errors);
    if (!result.success) {
        vscode.window.showErrorMessage('Build failed. Check the Problems panel for details.');
        return undefined;
    }

    return buildPlan;
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

function runBuildOutput(buildPlan: BuildPlan, services: BuildServices): void {
    const { outputChannel, runner } = services;

    if (!buildPlan.outputPath || !buildPlan.canRun) {
        const message = buildPlan.runReason ?? 'Build succeeded, but automatic run is not available for this output.';
        vscode.window.showWarningMessage(message);
        outputChannel.appendLine(message);
        return;
    }

    if (!fs.existsSync(buildPlan.outputPath)) {
        const message = `Build succeeded, but the expected output was not found: ${buildPlan.outputPath}`;
        vscode.window.showWarningMessage(message);
        outputChannel.appendLine(message);
        return;
    }

    outputChannel.appendLine(`Running ${path.basename(buildPlan.outputPath)} in the FASM Run terminal.`);
    runner.run(buildPlan.outputPath);
}

function showBuildHeader(outputChannel: vscode.OutputChannel, sourcePath: string, outputPath?: string) {
    outputChannel.show(true);
    outputChannel.appendLine(`Building ${path.basename(sourcePath)}...`);
    if (outputPath) {
        outputChannel.appendLine(`Expected output: ${path.basename(outputPath)}`);
    }
    outputChannel.appendLine('');
}
