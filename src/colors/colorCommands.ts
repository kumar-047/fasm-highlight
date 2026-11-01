import * as vscode from 'vscode';
import { addFasmRules, defaultRoleColor, hasFasmRules, removeFasmRules, roleLabel } from './colorRules';
import { COLOR_ROLES } from './constants/colorPalette';
import type { ColorOverrides, ColorRole, TokenColorCustomizations } from './types';

const SETTING = 'tokenColorCustomizations';

export function registerColorCommands(): vscode.Disposable[] {
    return [
        vscode.commands.registerCommand('fasm.turnOnColors', async () => {
            const target = await chooseTarget();
            if (target !== undefined) {
                await turnOnColors(target);
                void vscode.window.showInformationMessage('FASM Colors are on. Only FASM text changes.');
            }
        }),
        vscode.commands.registerCommand('fasm.turnOffColors', async () => {
            await turnOffColors();
            void vscode.window.showInformationMessage('FASM Colors are off.');
        })
    ];
}

function overrides(): ColorOverrides {
    return vscode.workspace.getConfiguration('fasm').get<ColorOverrides>('colors.overrides', {});
}

export async function turnOnColors(target: vscode.ConfigurationTarget): Promise<void> {
    const config = vscode.workspace.getConfiguration('editor');
    const inspected = config.inspect<TokenColorCustomizations>(SETTING);
    const current = target === vscode.ConfigurationTarget.Workspace ? inspected?.workspaceValue : inspected?.globalValue;
    await config.update(SETTING, addFasmRules(current, isLightTheme(), overrides()), target);
}

export async function turnOffColors(): Promise<void> {
    const config = vscode.workspace.getConfiguration('editor');
    const inspected = config.inspect<TokenColorCustomizations>(SETTING);

    if (inspected?.workspaceValue) {
        await config.update(SETTING, removeFasmRules(inspected.workspaceValue), vscode.ConfigurationTarget.Workspace);
    }
    if (inspected?.globalValue) {
        await config.update(SETTING, removeFasmRules(inspected.globalValue), vscode.ConfigurationTarget.Global);
    }
}

export function areColorsOn(): boolean {
    const inspected = vscode.workspace.getConfiguration('editor').inspect<TokenColorCustomizations>(SETTING);
    return hasFasmRules(inspected?.workspaceValue) || hasFasmRules(inspected?.globalValue);
}

export async function setColorOverride(role: ColorRole, color: string | undefined): Promise<void> {
    const next: ColorOverrides = { ...overrides() };
    if (color) {
        next[role] = color;
    } else {
        delete next[role];
    }
    await vscode.workspace.getConfiguration('fasm').update('colors.overrides', next, vscode.ConfigurationTarget.Global);

    const config = vscode.workspace.getConfiguration('editor');
    const inspected = config.inspect<TokenColorCustomizations>(SETTING);
    if (hasFasmRules(inspected?.workspaceValue)) {
        await config.update(SETTING, addFasmRules(inspected?.workspaceValue, isLightTheme(), next), vscode.ConfigurationTarget.Workspace);
    }
    if (hasFasmRules(inspected?.globalValue)) {
        await config.update(SETTING, addFasmRules(inspected?.globalValue, isLightTheme(), next), vscode.ConfigurationTarget.Global);
    }
}

export function colorRoleDetails() {
    const current = overrides();
    return COLOR_ROLES.map((role) => ({
        role,
        label: roleLabel(role),
        color: current[role] ?? defaultRoleColor(role, isLightTheme()),
        custom: Boolean(current[role])
    }));
}

async function chooseTarget(): Promise<vscode.ConfigurationTarget | undefined> {
    if (!vscode.workspace.workspaceFolders?.length) {
        return vscode.ConfigurationTarget.Global;
    }

    const choice = await vscode.window.showQuickPick(
        [
            { label: 'This workspace', description: 'Saved in .vscode/settings.json', target: vscode.ConfigurationTarget.Workspace },
            { label: 'All windows', description: 'Saved in your user settings', target: vscode.ConfigurationTarget.Global }
        ],
        { placeHolder: 'Where should FASM Colors apply?' }
    );
    return choice?.target;
}

function isLightTheme(): boolean {
    const kind = vscode.window.activeColorTheme.kind;
    return kind === vscode.ColorThemeKind.Light || kind === vscode.ColorThemeKind.HighContrastLight;
}
