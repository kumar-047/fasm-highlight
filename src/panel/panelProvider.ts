import * as crypto from 'node:crypto';
import * as vscode from 'vscode';

import { colorRoleValues, currentPalette, isColorsOn, resetColors, setPalette, setRoleColor } from '../colors/colorCommands';
import { COLOR_ROLES } from '../colors/constants/colorPalette';
import { COLOR_PALETTES } from '../colors/constants/colorPalettes';
import { roleLabel } from '../colors/colorRules';
import { FONT_PALETTE, FONT_SIZES } from '../fonts/constants/fontPalette';
import { currentFontFamily, currentFontSize, resetFont, setFontFamily, setFontSize } from '../fonts/fontCommand';
import { convertNumber, numberAt } from '../tools/numberConverter';
import { renderPanelHtml } from './panelHtml';
import { parsePanelMessage } from './panelMessages';
import type { PanelMessage } from './types';

export class FasmPanelProvider implements vscode.WebviewViewProvider, vscode.Disposable {
    private view: vscode.WebviewView | undefined;
    private lastFasmDocument: vscode.TextDocument | undefined;
    private lastNumber: string | undefined;
    private readonly listeners: vscode.Disposable[];

    constructor(private readonly extensionUri: vscode.Uri) {
        const active = vscode.window.activeTextEditor?.document;
        this.lastFasmDocument = active?.languageId === 'fasm' ? active : undefined;
        this.listeners = [
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor?.document.languageId === 'fasm') {
                    this.lastFasmDocument = editor.document;
                }
                this.postState();
            }),
            vscode.window.onDidChangeTextEditorSelection((event) => this.showNumberAtCursor(event.textEditor)),
            vscode.workspace.onDidChangeConfiguration((event) => {
                if (event.affectsConfiguration('fasm') || event.affectsConfiguration('editor')) {
                    this.postState();
                }
            })
        ];
    }

    resolveWebviewView(view: vscode.WebviewView): void {
        const media = vscode.Uri.joinPath(this.extensionUri, 'media');
        view.webview.options = { enableScripts: true, localResourceRoots: [media] };
        view.webview.html = renderPanelHtml({
            cspSource: view.webview.cspSource,
            nonce: crypto.randomBytes(16).toString('hex'),
            scriptUri: view.webview.asWebviewUri(vscode.Uri.joinPath(media, 'panel.js')).toString(),
            iconsUri: view.webview.asWebviewUri(vscode.Uri.joinPath(media, 'icons.js')).toString(),
            styleUri: view.webview.asWebviewUri(vscode.Uri.joinPath(media, 'panel.css')).toString()
        });

        this.view = view;
        view.onDidDispose(() => {
            this.view = undefined;
        });
        view.onDidChangeVisibility(() => this.postState());
        view.webview.onDidReceiveMessage((raw) => {
            const message = parsePanelMessage(raw);
            if (message) {
                void this.handleMessage(message).catch((error: Error) => {
                    void vscode.window.showErrorMessage(`FASM: ${error.message}`);
                });
            }
        });
    }

    dispose(): void {
        this.listeners.forEach((listener) => listener.dispose());
    }

    private async handleMessage(message: PanelMessage): Promise<void> {
        switch (message.type) {
            case 'ready':
                this.lastNumber = undefined;
                this.postState();
                if (vscode.window.activeTextEditor) {
                    this.showNumberAtCursor(vscode.window.activeTextEditor);
                }
                return;
            case 'formatFile':
                await this.formatFile();
                return;
            case 'setPalette':
                await setPalette(message.id);
                return;
            case 'setRoleColor':
                await setRoleColor(message.role, message.color);
                return;
            case 'resetColors':
                await resetColors();
                return;
            case 'setFont':
                await setFontFamily(message.family);
                return;
            case 'setFontSize':
                await setFontSize(message.size);
                return;
            case 'resetFont':
                await resetFont();
                return;
            case 'openFontSettings':
                await vscode.commands.executeCommand('workbench.action.openSettings', '@lang:fasm editor.font');
                return;
            case 'convertNumber':
                this.postNumber(message.text);
                return;
            case 'copyValue':
                await vscode.env.clipboard.writeText(message.value);
                void vscode.window.setStatusBarMessage(`Copied ${message.value}`, 2000);
                return;
        }
    }

    private async formatFile(): Promise<void> {
        if (!this.lastFasmDocument || this.lastFasmDocument.isClosed) {
            return;
        }
        const shown = vscode.window.visibleTextEditors.find((editor) => editor.document === this.lastFasmDocument);
        await vscode.window.showTextDocument(this.lastFasmDocument, { viewColumn: shown?.viewColumn, preserveFocus: false, preview: false });
        await vscode.commands.executeCommand('editor.action.formatDocument');
    }

    private showNumberAtCursor(editor: vscode.TextEditor): void {
        if (editor.document.languageId !== 'fasm') {
            return;
        }
        const position = editor.selection.active;
        const text = numberAt(editor.document.lineAt(position.line).text, position.character);
        if (text && text !== this.lastNumber) {
            this.postNumber(text);
        }
    }

    private postNumber(text: string): void {
        this.lastNumber = text;
        void this.view?.webview.postMessage({ type: 'number', text, result: convertNumber(text) ?? null });
    }

    private postState(): void {
        if (!this.view) {
            return;
        }
        const roleColors = colorRoleValues();
        void this.view.webview.postMessage({
            type: 'state',
            hasFile: Boolean(this.lastFasmDocument && !this.lastFasmDocument.isClosed),
            colorsOn: isColorsOn(),
            palette: currentPalette(),
            palettes: COLOR_PALETTES.map((palette) => ({
                id: palette.id,
                label: palette.label,
                kind: palette.kind,
                colors: [palette.colors.instruction, palette.colors.register, palette.colors.string]
            })),
            roles: COLOR_ROLES.map((role) => ({ role, label: roleLabel(role), color: roleColors[role] })),
            fonts: FONT_PALETTE,
            fontFamily: currentFontFamily(),
            sizes: FONT_SIZES,
            fontSize: currentFontSize()
        });
    }
}

export function registerPanelVisibility(context: vscode.ExtensionContext): void {
    const update = () => {
        const onRight = vscode.workspace.getConfiguration('fasm').get<string>('panelSide', 'right') === 'right';
        void vscode.commands.executeCommand('setContext', 'fasm.panelOnRight', onRight);
        void vscode.commands.executeCommand('setContext', 'fasm.panelReady', true);
    };
    update();
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('fasm.panelSide')) {
            update();
        }
    }));
}

export async function openPanel(): Promise<void> {
    const onRight = vscode.workspace.getConfiguration('fasm').get<string>('panelSide', 'right') === 'right';
    if (onRight) {
        try {
            await vscode.commands.executeCommand('workbench.view.extension.fasmPanelRight');
            return;
        } catch {
            await vscode.commands.executeCommand('setContext', 'fasm.panelOnRight', false);
        }
    }
    await vscode.commands.executeCommand('workbench.view.extension.fasmPanelLeft');
}
