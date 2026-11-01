import * as vscode from 'vscode';

import { registerBuildCommand } from './build/buildCommands';
import { registerPaletteCommand } from './colors/colorCommands';
import { offerThemeReplacement } from './colors/themeUpgrade';
import { FasmCompiler } from './compiler/fasmCompiler';
import { FasmFormattingProvider, registerFormatCommand } from './formatter/formattingProvider';
import { FasmHoverProvider } from './hover/hoverProvider';
import { registerCopyCommand } from './hover/numberHover';
import { FasmPanelProvider, openPanel, registerPanelVisibility } from './panel/panelProvider';
import { FasmSemanticTokensProvider, semanticLegend } from './semantic/semanticTokens';
import { FasmSnippetProvider, loadSnippets } from './snippets/snippetProvider';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('FASM');
    const diagnostics = vscode.languages.createDiagnosticCollection('fasm');
    const panel = new FasmPanelProvider(context.extensionUri);

    registerPanelVisibility(context);

    context.subscriptions.push(
        outputChannel,
        diagnostics,
        panel,
        vscode.languages.registerHoverProvider('fasm', new FasmHoverProvider()),
        vscode.languages.registerDocumentSemanticTokensProvider('fasm', new FasmSemanticTokensProvider(), semanticLegend),
        vscode.languages.registerCompletionItemProvider('fasm', new FasmSnippetProvider(loadSnippets(context.extensionPath))),
        vscode.languages.registerDocumentFormattingEditProvider('fasm', new FasmFormattingProvider()),
        vscode.window.registerWebviewViewProvider('fasm.panelLeft', panel, { webviewOptions: { retainContextWhenHidden: true } }),
        vscode.window.registerWebviewViewProvider('fasm.panelRight', panel, { webviewOptions: { retainContextWhenHidden: true } }),
        vscode.commands.registerCommand('fasm.openMenu', openPanel),
        registerBuildCommand(outputChannel, new FasmCompiler(outputChannel), diagnostics),
        registerFormatCommand(),
        registerPaletteCommand(),
        registerCopyCommand()
    );

    offerThemeReplacement(context);
}

export function deactivate() {}
