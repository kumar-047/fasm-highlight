import * as vscode from 'vscode';

import { registerBuildCommand } from './build/buildCommands';
import { registerColorCommands } from './colors/colorCommands';
import { offerThemeReplacement } from './colors/themeUpgrade';
import { FasmCompiler } from './compiler/fasmCompiler';
import { registerFontCommand } from './fonts/fontCommand';
import { FasmFormattingProvider, registerFormatCommand } from './formatter/formattingProvider';
import { FasmHoverProvider } from './hover/hoverProvider';
import { FasmSemanticTokensProvider, semanticLegend } from './semantic/semanticTokens';
import { FasmSnippetProvider, loadSnippets } from './snippets/snippetProvider';
import { registerNumberCommand } from './tools/numberCommand';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('FASM');
    const diagnostics = vscode.languages.createDiagnosticCollection('fasm');

    context.subscriptions.push(
        outputChannel,
        diagnostics,
        vscode.languages.registerHoverProvider('fasm', new FasmHoverProvider()),
        vscode.languages.registerDocumentSemanticTokensProvider('fasm', new FasmSemanticTokensProvider(), semanticLegend),
        vscode.languages.registerCompletionItemProvider('fasm', new FasmSnippetProvider(loadSnippets(context.extensionPath))),
        vscode.languages.registerDocumentFormattingEditProvider('fasm', new FasmFormattingProvider()),
        registerBuildCommand(outputChannel, new FasmCompiler(outputChannel), diagnostics),
        registerFormatCommand(),
        registerNumberCommand(),
        registerFontCommand(),
        ...registerColorCommands()
    );

    offerThemeReplacement(context);
}

export function deactivate() {}
