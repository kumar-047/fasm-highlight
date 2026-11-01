import * as vscode from 'vscode';

import { registerBuildCommand } from './build/buildCommands';
import { offerThemeReplacement } from './colors/themeUpgrade';
import { FasmCompiler } from './compiler/fasmCompiler';
import { FasmFormattingProvider, registerFormatCommand } from './formatter/formattingProvider';
import { FasmHoverProvider } from './hover/hoverProvider';
import { FasmMenu } from './menu/fasmMenu';
import { FasmSemanticTokensProvider, semanticLegend } from './semantic/semanticTokens';
import { FasmSnippetProvider, loadSnippets } from './snippets/snippetProvider';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('FASM');
    const diagnostics = vscode.languages.createDiagnosticCollection('fasm');
    const menu = new FasmMenu();

    context.subscriptions.push(
        outputChannel,
        diagnostics,
        vscode.languages.registerHoverProvider('fasm', new FasmHoverProvider(menu)),
        vscode.languages.registerDocumentSemanticTokensProvider('fasm', new FasmSemanticTokensProvider(), semanticLegend),
        vscode.languages.registerCompletionItemProvider('fasm', new FasmSnippetProvider(loadSnippets(context.extensionPath))),
        vscode.languages.registerDocumentFormattingEditProvider('fasm', new FasmFormattingProvider()),
        registerBuildCommand(outputChannel, new FasmCompiler(outputChannel), diagnostics),
        registerFormatCommand(),
        ...menu.register()
    );

    offerThemeReplacement(context);
}

export function deactivate() {}
