import * as path from 'path';
import * as vscode from 'vscode';
import { clearAnalysisCache } from './architecture/documentAnalysis';
import { registerColorCommands } from './colors/colorCommands';
import { registerBuildCommands } from './commands/buildCommands';
import { CompilerManager } from './compiler/compilerManager';
import { FasmCompiler } from './compiler/fasmCompiler';
import { FasmHoverProvider } from './language/hoverProvider';
import { FasmFormattingProvider, FasmSnippetProvider, insertStarter, loadSnippets } from './language/languageProviders';
import { FasmSemanticTokensProvider, semanticLegend } from './language/semanticTokens';
import { FasmPanelProvider, openPanel, registerPanelVisibility } from './panel/panelProvider';
import { ProgramRunner } from './run/programRunner';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('FASM');
    const diagnostics = vscode.languages.createDiagnosticCollection('fasm');
    const runner = new ProgramRunner();
    const installRoot = path.join(context.globalStorageUri.fsPath, 'compilers');
    const manager = new CompilerManager(installRoot);
    const compiler = new FasmCompiler(outputChannel, manager);
    const snippets = loadSnippets(context.extensionPath);
    const version = String(context.extension.packageJSON.version);
    const panel = new FasmPanelProvider(context.extensionUri, version, manager, installRoot);

    registerPanelVisibility(context);

    context.subscriptions.push(
        outputChannel,
        diagnostics,
        runner,
        panel,
        vscode.languages.registerHoverProvider('fasm', new FasmHoverProvider()),
        vscode.languages.registerDocumentSemanticTokensProvider('fasm', new FasmSemanticTokensProvider(), semanticLegend),
        vscode.languages.registerCompletionItemProvider('fasm', new FasmSnippetProvider(snippets)),
        vscode.languages.registerDocumentFormattingEditProvider('fasm', new FasmFormattingProvider()),
        vscode.window.registerWebviewViewProvider('fasm.panelLeft', panel),
        vscode.window.registerWebviewViewProvider('fasm.panelRight', panel),
        vscode.commands.registerCommand('fasm.openPanel', openPanel),
        vscode.commands.registerCommand('fasm.insertStarter', () => insertStarter(snippets)),
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('fasm.architecture')) {
                clearAnalysisCache();
            }
        }),
        ...registerBuildCommands({ outputChannel, compiler, diagnostics, runner }),
        ...registerColorCommands()
    );

    void manager.refresh();
}

export function deactivate() {}
