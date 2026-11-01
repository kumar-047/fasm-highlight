import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { BuildPlan, createBuildPlan } from '../compiler/buildTarget';
import { FasmCompiler } from '../compiler/fasmCompiler';

export function registerBuildCommands(outputChannel: vscode.OutputChannel, compiler: FasmCompiler): vscode.Disposable[] {
    return [
        vscode.commands.registerCommand('fasm.build', async () => {
            const buildPlan = await buildActiveFile(outputChannel, compiler);
            if (!buildPlan) {
                return;
            }

            const message = buildPlan.outputPath
                ? `Build successful: ${path.basename(buildPlan.outputPath)}`
                : 'Build successful. Output path is compiler-defined for this source format.';
            vscode.window.showInformationMessage(message);
        }),
        vscode.commands.registerCommand('fasm.buildAndRun', async () => {
            const buildPlan = await buildActiveFile(outputChannel, compiler);
            if (!buildPlan) {
                return;
            }

            await runBuildOutput(buildPlan, outputChannel, compiler);
        })
    ];
}

async function buildActiveFile(outputChannel: vscode.OutputChannel, compiler: FasmCompiler): Promise<BuildPlan | undefined> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return undefined;
    }

    const document = editor.document;
    await document.save();

    const buildPlan = createBuildPlan(document);
    if (!buildPlan.canBuild) {
        vscode.window.showErrorMessage(buildPlan.buildReason ?? 'This file cannot be built.');
        return undefined;
    }

    showBuildHeader(outputChannel, buildPlan.sourcePath, buildPlan.outputPath);

    const success = await compiler.compile(buildPlan.sourcePath);
    if (!success) {
        vscode.window.showErrorMessage('Build failed. Check output for details.');
        return undefined;
    }

    return buildPlan;
}

async function runBuildOutput(buildPlan: BuildPlan, outputChannel: vscode.OutputChannel, compiler: FasmCompiler): Promise<void> {
    if (!buildPlan.outputPath || !buildPlan.canRun) {
        const message = buildPlan.runReason ?? 'Build succeeded, but automatic run is not available for this output.';
        vscode.window.showWarningMessage(message);
        outputChannel.appendLine(message);
        return;
    }

    if (!fs.existsSync(buildPlan.outputPath)) {
        const message = `Build succeeded, but the inferred output was not found: ${buildPlan.outputPath}`;
        vscode.window.showWarningMessage(message);
        outputChannel.appendLine(message);
        return;
    }

    vscode.window.showInformationMessage(`Build successful, running ${path.basename(buildPlan.outputPath)}...`);
    outputChannel.appendLine('');
    outputChannel.appendLine('='.repeat(60));
    outputChannel.appendLine('Running program:');
    outputChannel.appendLine('='.repeat(60));
    outputChannel.appendLine('');

    await compiler.run(buildPlan.outputPath);
}

function showBuildHeader(outputChannel: vscode.OutputChannel, sourcePath: string, outputPath?: string) {
    outputChannel.show(true);
    outputChannel.appendLine(`Building ${path.basename(sourcePath)}...`);
    if (outputPath) {
        outputChannel.appendLine(`Expected output: ${path.basename(outputPath)}`);
    } else {
        outputChannel.appendLine('Expected output: compiler-defined (not inferred by the extension)');
    }
    outputChannel.appendLine('');
}
