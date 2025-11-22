import * as vscode from 'vscode';
import * as path from 'path';
import { FasmCompiler } from "./fasmCompiler";  

// FASM Extension Activation

let outputChannel: vscode.OutputChannel;
let fasmCompiler: FasmCompiler;

export function activate(context: vscode.ExtensionContext) {
    console.log('FASM extension is now active');

    // Create output channel
    outputChannel = vscode.window.createOutputChannel('FASM');
    fasmCompiler = new FasmCompiler(outputChannel);

    // Register build command
    const buildCommand = vscode.commands.registerCommand('fasm.build', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'fasm') {
            vscode.window.showErrorMessage('Current file is not a FASM file');
            return;
        }

        // Save the file first
        await document.save();

        const filePath = document.fileName;
        const outputPath = filePath.replace(/\.(asm|inc)$/i, '.exe');

        outputChannel.show(true);
        outputChannel.appendLine(`Building ${path.basename(filePath)}...`);
        outputChannel.appendLine('');

        const success = await fasmCompiler.compile(filePath, outputPath);

        if (success) {
            vscode.window.showInformationMessage(`Build successful: ${path.basename(outputPath)}`);
        } else {
            vscode.window.showErrorMessage('Build failed. Check output for details.');
        }
    });

    // Register build and run command
    const buildAndRunCommand = vscode.commands.registerCommand('fasm.buildAndRun', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'fasm') {
            vscode.window.showErrorMessage('Current file is not a FASM file');
            return;
        }

        // Save the file first
        await document.save();

        const filePath = document.fileName;
        const outputPath = filePath.replace(/\.(asm|inc)$/i, '.exe');

        outputChannel.show(true);
        outputChannel.appendLine(`Building ${path.basename(filePath)}...`);
        outputChannel.appendLine('');

        const success = await fasmCompiler.compile(filePath, outputPath);

        if (success) {
            vscode.window.showInformationMessage(`Build successful, running ${path.basename(outputPath)}...`);
            outputChannel.appendLine('');
            outputChannel.appendLine('='.repeat(60));
            outputChannel.appendLine('Running program:');
            outputChannel.appendLine('='.repeat(60));
            outputChannel.appendLine('');

            await fasmCompiler.run(outputPath);
        } else {
            vscode.window.showErrorMessage('Build failed. Check output for details.');
        }
    });

    context.subscriptions.push(buildCommand);
    context.subscriptions.push(buildAndRunCommand);
    context.subscriptions.push(outputChannel);
}

export function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}
