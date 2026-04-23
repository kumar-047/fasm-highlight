import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { createBuildPlan } from './compiler/buildTarget';
import { FasmCompiler } from './fasmCompiler';
import { FasmHoverProvider } from './language/hoverProvider';

let outputChannel: vscode.OutputChannel;
let fasmCompiler: FasmCompiler;

export function activate(context: vscode.ExtensionContext) {
    console.log('FASM extension is now active');

    outputChannel = vscode.window.createOutputChannel('FASM');
    fasmCompiler = new FasmCompiler(outputChannel);
    const hoverProvider = vscode.languages.registerHoverProvider('fasm', new FasmHoverProvider());

    const buildCommand = vscode.commands.registerCommand('fasm.build', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const document = editor.document;
        await document.save();

        const buildPlan = createBuildPlan(document);
        if (!buildPlan.canBuild) {
            vscode.window.showErrorMessage(buildPlan.buildReason ?? 'This file cannot be built.');
            return;
        }

        showBuildHeader(buildPlan.sourcePath, buildPlan.outputPath);

        const success = await fasmCompiler.compile(buildPlan.sourcePath);
        if (!success) {
            vscode.window.showErrorMessage('Build failed. Check output for details.');
            return;
        }

        const message = buildPlan.outputPath
            ? `Build successful: ${path.basename(buildPlan.outputPath)}`
            : 'Build successful. Output path is compiler-defined for this source format.';
        vscode.window.showInformationMessage(message);
    });

    const buildAndRunCommand = vscode.commands.registerCommand('fasm.buildAndRun', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const document = editor.document;
        await document.save();

        const buildPlan = createBuildPlan(document);
        if (!buildPlan.canBuild) {
            vscode.window.showErrorMessage(buildPlan.buildReason ?? 'This file cannot be built.');
            return;
        }

        showBuildHeader(buildPlan.sourcePath, buildPlan.outputPath);

        const success = await fasmCompiler.compile(buildPlan.sourcePath);
        if (!success) {
            vscode.window.showErrorMessage('Build failed. Check output for details.');
            return;
        }

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

        await fasmCompiler.run(buildPlan.outputPath);
    });

    context.subscriptions.push(buildCommand, buildAndRunCommand, hoverProvider, outputChannel);
}

export function deactivate() {
    outputChannel?.dispose();
}

function showBuildHeader(sourcePath: string, outputPath?: string) {
    outputChannel.show(true);
    outputChannel.appendLine(`Building ${path.basename(sourcePath)}...`);
    if (outputPath) {
        outputChannel.appendLine(`Expected output: ${path.basename(outputPath)}`);
    } else {
        outputChannel.appendLine('Expected output: compiler-defined (not inferred by the extension)');
    }
    outputChannel.appendLine('');
}
