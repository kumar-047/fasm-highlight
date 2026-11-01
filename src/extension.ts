import * as vscode from 'vscode';

import { registerBuildCommand } from './build/buildCommands';
import { registerColorCommands } from './colors/colorCommands';
import { offerThemeReplacement } from './colors/themeUpgrade';
import { FasmCompiler } from './compiler/fasmCompiler';
import { FasmFormattingProvider } from './formatter/formattingProvider';
import { FasmHoverProvider } from './hover/hoverProvider';
import { FasmPanelLensProvider } from './panel/panelLens';
import { FasmPanelProvider, openPanel, registerPanelVisibility } from './panel/panelProvider';
import { FasmSemanticTokensProvider, semanticLegend } from './semantic/semanticTokens';
import { FasmSnippetProvider, loadSnippets } from './snippets/snippetProvider';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('FASM');
    const diagnostics = vscode.languages.createDiagnosticCollection('fasm');
    const panel = new FasmPanelProvider(context.extensionUri);
    const panelLens = new FasmPanelLensProvider();

    registerPanelVisibility(context);

    context.subscriptions.push(
        outputChannel,
        diagnostics,
        panel,
        panelLens,
        vscode.languages.registerHoverProvider('fasm', new FasmHoverProvider()),
        vscode.languages.registerDocumentSemanticTokensProvider('fasm', new FasmSemanticTokensProvider(), semanticLegend),
        vscode.languages.registerCompletionItemProvider('fasm', new FasmSnippetProvider(loadSnippets(context.extensionPath))),
        vscode.languages.registerDocumentFormattingEditProvider('fasm', new FasmFormattingProvider()),
        vscode.languages.registerCodeLensProvider('fasm', panelLens),
        vscode.window.registerWebviewViewProvider('fasm.panelLeft', panel),
        vscode.window.registerWebviewViewProvider('fasm.panelRight', panel),
        vscode.commands.registerCommand('fasm.openPanel', openPanel),
        registerBuildCommand(outputChannel, new FasmCompiler(outputChannel), diagnostics),
        ...registerColorCommands()
    );

    offerThemeReplacement(context);
}

export function deactivate() {}
