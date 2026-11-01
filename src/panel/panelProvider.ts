import * as crypto from 'node:crypto';
import * as path from 'node:path';
import process from 'node:process';
import * as vscode from 'vscode';
import { analyzeDocument } from '../architecture/documentAnalysis';
import { createBuildPlan } from '../build/buildTarget';
import { areColorsOn, colorRoleDetails, setColorOverride, turnOffColors, turnOnColors } from '../colors/colorCommands';
import { chooseCompilerKind } from '../compiler/compilerCommand';
import type { CompilerManager } from '../compiler/compilerManager';
import { COMPILER_LABELS, COMPILER_SETTINGS } from '../compiler/constants/compilers';
import type { CompilerKind } from '../compiler/types';
import { targetFor } from '../snippets/snippetProvider';
import { convertNumber } from '../tools/numberConverter';
import { PANEL_SETTINGS } from './constants/panelSettings';
import { PROJECT_LINKS } from './constants/projectLinks';
import { issueUrl } from './issueLink';
import { renderPanelHtml } from './panelHtml';
import { parsePanelMessage } from './panelMessages';
import type { PanelMessage } from './types';

export class FasmPanelProvider implements vscode.WebviewViewProvider, vscode.Disposable {
    private readonly views = new Set<vscode.WebviewView>();
    private readonly listeners: vscode.Disposable[];
    private scope: 'workspace' | 'user' = vscode.workspace.workspaceFolders?.length ? 'workspace' : 'user';
    private lastFasmDocument: vscode.TextDocument | undefined;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly version: string,
        private readonly manager: CompilerManager
    ) {
        this.lastFasmDocument = vscode.window.activeTextEditor?.document.languageId === 'fasm' ? vscode.window.activeTextEditor.document : undefined;
        this.listeners = [
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor?.document.languageId === 'fasm') {
                    this.lastFasmDocument = editor.document;
                }
                this.postState();
            }),
            vscode.workspace.onDidSaveTextDocument(() => this.postState()),
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
                await this.manager.refresh();
                break;
            case 'command':
                await this.runCommand(message.command);
                break;
            case 'setSetting':
            case 'resetSetting': {
                const setting = PANEL_SETTINGS.find((candidate) => candidate.id === message.id);
                if (setting) {
                    const value = message.type === 'setSetting' ? message.value : undefined;
                    const config = vscode.workspace.getConfiguration(setting.section, setting.languageScoped ? { languageId: 'fasm' } : undefined);
                    await config.update(setting.key, value, this.target(), setting.languageScoped);
                }
                break;
            }
            case 'setScope':
                this.scope = message.scope;
                break;
            case 'browseCompiler':
                await this.browseCompiler(message.kind);
                break;
            case 'openLink':
                await vscode.env.openExternal(vscode.Uri.parse(PROJECT_LINKS[message.link].url));
                return;
            case 'reportIssue':
                await vscode.env.openExternal(vscode.Uri.parse(issueUrl(message.issue, this.issueContext()), true));
                return;
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

    private async runCommand(command: string): Promise<void> {
        switch (command) {
            case 'build':
            case 'buildAndRun':
            case 'stop':
                await this.focusFasmDocument();
                await vscode.commands.executeCommand(`fasm.${command}`);
                break;
            case 'format':
                await this.focusFasmDocument();
                await vscode.commands.executeCommand('editor.action.formatDocument');
                break;
            case 'insertStarter':
                await this.focusFasmDocument();
                await vscode.commands.executeCommand('fasm.insertStarter');
                break;
            case 'openOutputFolder':
                if (this.lastFasmDocument) {
                    const plan = createBuildPlan(this.lastFasmDocument, process.platform, analyzeDocument(this.lastFasmDocument));
                    await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(plan.sourcePath));
                }
                break;
            case 'refreshCompilers':
                await this.manager.refresh();
                break;
        }
    }

    private async focusFasmDocument(): Promise<void> {
        if (this.lastFasmDocument && !this.lastFasmDocument.isClosed) {
            await vscode.window.showTextDocument(this.lastFasmDocument, { preserveFocus: false, preview: false });
        }
    }

    private async browseCompiler(kind: CompilerKind): Promise<void> {
        const [file] = await vscode.window.showOpenDialog({ canSelectMany: false, title: `Choose ${COMPILER_LABELS[kind]}` }) ?? [];
        if (file) {
            await vscode.workspace.getConfiguration('fasm').update(COMPILER_SETTINGS[kind], file.fsPath, this.target());
            await this.manager.refresh();
        }
    }

    private issueContext() {
        const kind = this.currentKind();
        const compiler = this.manager.compilers.find((candidate) => candidate.kind === kind);
        return {
            version: this.version,
            system: `${process.platform} ${process.arch}`,
            editor: `${vscode.env.appName} ${vscode.version}`,
            compiler: `${COMPILER_LABELS[kind]} ${compiler?.version ?? 'not found'}`
        };
    }

    private currentKind(): CompilerKind {
        const setting = vscode.workspace.getConfiguration('fasm').get<string>('assembler', 'auto');
        const analysis = this.lastFasmDocument ? analyzeDocument(this.lastFasmDocument) : undefined;
        return chooseCompilerKind(setting, analysis?.dialect ?? 'fasm', analysis?.architecture.id ?? 'x86');
    }

    private fileState() {
        const document = this.lastFasmDocument;
        if (!document || document.isClosed) {
            return null;
        }
        const analysis = analyzeDocument(document);
        const plan = createBuildPlan(document, process.platform, analysis);
        const target = targetFor(document);
        return {
            name: path.basename(document.fileName),
            architecture: analysis.architecture.label,
            dialect: analysis.dialect === 'fasmg' ? 'fasmg syntax' : 'fasm 1 syntax',
            output: plan.outputPath ? path.basename(plan.outputPath) : null,
            canBuild: plan.canBuild,
            canRun: plan.canRun,
            target: target.system,
            targetSource: target.source,
            macrosFound: analysis.scanned.size
        };
    }

    private postState(): void {
        if (this.views.size === 0) {
            return;
        }

        const activeKind = this.currentKind();
        const state = {
            type: 'state',
            version: this.version,
            scope: this.scope,
            hasWorkspace: Boolean(vscode.workspace.workspaceFolders?.length),
            file: this.fileState(),
            compilers: this.manager.compilers.map((compiler) => ({
                ...compiler,
                label: COMPILER_LABELS[compiler.kind],
                active: compiler.kind === activeKind
            })),
            settings: Object.fromEntries(PANEL_SETTINGS.map((setting) => {
                const config = vscode.workspace.getConfiguration(setting.section, setting.languageScoped ? { languageId: 'fasm' } : undefined);
                return [setting.id, config.get(setting.key)];
            })),
            settingOptions: Object.fromEntries(PANEL_SETTINGS.filter((setting) => setting.options).map((setting) => [setting.id, setting.options])),
            colors: { on: areColorsOn(), roles: colorRoleDetails() },
            links: Object.fromEntries(Object.entries(PROJECT_LINKS).map(([id, link]) => [id, link.label]))
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
