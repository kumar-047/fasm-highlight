import * as crypto from 'node:crypto';
import * as vscode from 'vscode';

import { areColorsOn, colorRoleDetails, setColorOverride, turnOffColors, turnOnColors } from '../colors/colorCommands';
import { convertNumber } from '../tools/numberConverter';
import { PANEL_SETTINGS } from './constants/panelSettings';
import { renderPanelHtml } from './panelHtml';
import { parsePanelMessage } from './panelMessages';
import type { PanelMessage } from './types';

export class FasmPanelProvider implements vscode.WebviewViewProvider, vscode.Disposable {
    private readonly views = new Set<vscode.WebviewView>();
    private readonly listeners: vscode.Disposable[];
    private scope: 'workspace' | 'user' = vscode.workspace.workspaceFolders?.length ? 'workspace' : 'user';
    private lastFasmDocument: vscode.TextDocument | undefined;

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
            vscode.workspace.onDidChangeConfiguration(() => this.postState())
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

        this.views.add(view);
        view.onDidDispose(() => this.views.delete(view));
        view.onDidChangeVisibility(() => this.postState());
        view.webview.onDidReceiveMessage((raw) => {
            const message = parsePanelMessage(raw);
            if (message) {
                void this.handleMessage(message, view).catch((error: Error) => {
                    void vscode.window.showErrorMessage(`FASM: ${error.message}`);
                });
            }
        });
    }

    dispose(): void {
        this.listeners.forEach((listener) => listener.dispose());
    }

    private target(): vscode.ConfigurationTarget {
        return this.scope === 'workspace' && vscode.workspace.workspaceFolders?.length
            ? vscode.ConfigurationTarget.Workspace
            : vscode.ConfigurationTarget.Global;
    }

    private async handleMessage(message: PanelMessage, view: vscode.WebviewView): Promise<void> {
        switch (message.type) {
            case 'ready':
                break;
            case 'formatFile':
                await this.formatFile();
                return;
            case 'browseCompiler':
                await this.browseCompiler();
                break;
            case 'setSetting':
            case 'resetSetting':
                await this.updateSetting(message.id, message.type === 'setSetting' ? message.value : undefined);
                break;
            case 'setScope':
                this.scope = message.scope;
                break;
            case 'setColors':
                await (message.enabled ? turnOnColors(this.target()) : turnOffColors());
                break;
            case 'setColor':
                await setColorOverride(message.role, message.color);
                break;
            case 'convertNumber':
                void view.webview.postMessage({ type: 'converted', text: message.text, result: convertNumber(message.text) ?? null });
                return;
        }
        this.postState();
    }

    private async updateSetting(id: string, value: unknown): Promise<void> {
        const setting = PANEL_SETTINGS.find((candidate) => candidate.id === id);
        if (setting) {
            const config = vscode.workspace.getConfiguration(setting.section, setting.languageScoped ? { languageId: 'fasm' } : undefined);
            await config.update(setting.key, value, this.target(), setting.languageScoped);
        }
    }

    private async formatFile(): Promise<void> {
        if (!this.lastFasmDocument || this.lastFasmDocument.isClosed) {
            void vscode.window.showInformationMessage('Open a FASM file first.');
            return;
        }
        await vscode.window.showTextDocument(this.lastFasmDocument, { preserveFocus: false, preview: false });
        await vscode.commands.executeCommand('editor.action.formatDocument');
    }

    private async browseCompiler(): Promise<void> {
        const [file] = await vscode.window.showOpenDialog({ canSelectMany: false, title: 'Choose your fasm, fasm 2 or fasmg compiler' }) ?? [];
        if (file) {
            await this.updateSetting('compilerPath', file.fsPath);
        }
    }

    private postState(): void {
        const state = {
            type: 'state',
            scope: this.scope,
            hasWorkspace: Boolean(vscode.workspace.workspaceFolders?.length),
            hasFile: Boolean(this.lastFasmDocument && !this.lastFasmDocument.isClosed),
            settings: Object.fromEntries(PANEL_SETTINGS.map((setting) => {
                const config = vscode.workspace.getConfiguration(setting.section, setting.languageScoped ? { languageId: 'fasm' } : undefined);
                return [setting.id, config.get(setting.key)];
            })),
            colors: { on: areColorsOn(), roles: colorRoleDetails() }
        };
        for (const view of this.views) {
            void view.webview.postMessage(state);
        }
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
            void vscode.window.showInformationMessage('This editor has no right-side panel area, so the FASM panel opened on the left.');
        }
    }
    await vscode.commands.executeCommand('workbench.view.extension.fasmPanelLeft');
}
