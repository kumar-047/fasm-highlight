import * as vscode from 'vscode';
import { registerBuildCommands } from './commands/buildCommands';
import { FasmCompiler } from './compiler/fasmCompiler';
import { FasmHoverProvider } from './language/hoverProvider';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('FASM');
    const compiler = new FasmCompiler(outputChannel);

    context.subscriptions.push(
        outputChannel,
        vscode.languages.registerHoverProvider('fasm', new FasmHoverProvider()),
        ...registerBuildCommands(outputChannel, compiler)
    );
}

export function deactivate() {}
