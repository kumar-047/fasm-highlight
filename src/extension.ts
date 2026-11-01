import * as vscode from 'vscode';
import { clearAnalysisCache } from './architecture/documentAnalysis';
import { registerBuildCommands } from './build/buildCommands';
import { registerColorCommands } from './colors/colorCommands';
import { CompilerManager } from './compiler/compilerManager';
import { FasmCompiler } from './compiler/fasmCompiler';
import { FasmFormattingProvider } from './formatter/formattingProvider';
import { FasmHoverProvider } from './hover/hoverProvider';
import { FasmPanelProvider, openPanel, registerPanelVisibility } from './panel/panelProvider';
import { ProgramRunner } from './run/programRunner';
import { FasmSemanticTokensProvider, semanticLegend } from './semantic/semanticTokens';
import { FasmSnippetProvider, insertStarter, loadSnippets } from './snippets/snippetProvider';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('FASM');
    const diagnostics = vscode.languages.createDiagnosticCollection('fasm');
    const runner = new ProgramRunner();
    const manager = new CompilerManager();
    const compiler = new FasmCompiler(outputChannel, manager);
    const snippets = loadSnippets(context.extensionPath);
    const version = String(context.extension.packageJSON.version);
    const panel = new FasmPanelProvider(context.extensionUri, version, manager);

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
